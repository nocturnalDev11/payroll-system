const asyncHandler = require('express-async-handler');
const Attendance = require('../../models/attendance.model.js');
const Employee = require('../../models/employee.model.js');

/**
 * @desc Create a new attendance record
 * @route POST /api/attendance/time-in
 */
exports.timeIn = asyncHandler(async (req, res) => {
    const { employeeId } = req.body;
    const currentDate = new Date();
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });

    const EARLY_THRESHOLD = "06:00:00";
    const OFFICE_START = "08:00:00";
    const LUNCH_END = "13:00:00";
    const CUTOFF_TIME = "13:00:00";

    if (currentTime < EARLY_THRESHOLD) {
        return res.status(400).json({ message: 'Time In is not allowed before 6:00 AM' });
    }

    const todayStart = new Date(currentDate.setHours(0, 0, 0, 0));
    const todayEnd = new Date(currentDate.setHours(23, 59, 59, 999));
    const openSession = await Attendance.findOne({
        employeeId,
        date: { $gte: todayStart, $lte: todayEnd },
        $or: [
            { morningTimeOut: null },
            { afternoonTimeOut: null },
        ],
    });

    if (openSession) {
        return res.status(400).json({ message: 'You are already Timed In. Please Time Out first.' });
    }

    const existingAbsent = await Attendance.findOne({
        employeeId,
        date: { $gte: todayStart, $lte: todayEnd },
        status: "Absent",
    });

    let status;
    if (currentTime <= OFFICE_START) {
        status = "On Time";
    } else if (currentTime >= LUNCH_END) {
        status = "Late";
    } else {
        status = "Late";
    }

    let attendance;
    if (currentTime > CUTOFF_TIME && existingAbsent) {
        if (currentTime >= LUNCH_END) {
            existingAbsent.afternoonTimeIn = currentTime;
        } else {
            existingAbsent.morningTimeIn = currentTime;
        }
        existingAbsent.status = "Late";
        await existingAbsent.save();
        return res.status(200).json(existingAbsent);
    }

    attendance = new Attendance({
        employeeId,
        date: currentDate,
        morningTimeIn: currentTime < LUNCH_END ? currentTime : null,
        afternoonTimeIn: currentTime >= LUNCH_END ? currentTime : null,
        status,
    });

    await attendance.save();
    res.status(200).json(attendance);
});

/**
 * @desc Update attendance record with time out
 * @route POST /api/attendance/time-out
 */
exports.timeOut = asyncHandler(async (req, res) => {
    const { employeeId } = req.body;
    const currentDate = new Date();
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });

    const OFFICE_END = "17:00:00";
    const EARLY_THRESHOLD = "11:30:00";
    const LUNCH_END = "13:00:00";

    const todayStart = new Date(currentDate.setHours(0, 0, 0, 0));
    const todayEnd = new Date(currentDate.setHours(23, 59, 59, 999));
    let attendance = await Attendance.findOne({
        employeeId,
        date: { $gte: todayStart, $lte: todayEnd },
        $or: [
            { morningTimeIn: { $ne: null }, morningTimeOut: null },
            { afternoonTimeIn: { $ne: null }, afternoonTimeOut: null },
        ],
    });

    if (!attendance) {
        return res.status(400).json({ message: 'No open Time In session found. Please Time In first.' });
    }

    if (currentTime < EARLY_THRESHOLD) {
        return res.status(400).json({ message: 'Time Out is not allowed before 11:30 AM' });
    }

    if (attendance.morningTimeIn && !attendance.morningTimeOut && currentTime < LUNCH_END) {
        attendance.morningTimeOut = currentTime;
    } else if (attendance.afternoonTimeIn && !attendance.afternoonTimeOut) {
        attendance.afternoonTimeOut = currentTime;
    }

    if (currentTime < OFFICE_END) {
        attendance.status = "Early Departure";
    } else if (attendance.morningTimeIn && attendance.afternoonTimeIn) {
        attendance.status = "Present";
    }

    await attendance.save();
    res.status(200).json(attendance);
});

/**
 * @desc Check and mark absent employees (optional cron job or admin endpoint)
 * @route GET /api/attendance/check-absent (example)
 */
exports.checkAbsent = asyncHandler(async (req, res) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const CUTOFF_TIME = "13:00:00";

    const attendanceRecords = await Attendance.find({ date: { $gte: startOfDay, $lte: endOfDay } });
    const presentEmployeeIds = attendanceRecords
        .filter(record => record.morningTimeIn || record.afternoonTimeIn)
        .map(record => record.employeeId.toString());

    const employees = await Employee.find();
    const absentEmployeeIds = employees
        .filter(emp => !presentEmployeeIds.includes(emp._id.toString()))
        .map(emp => emp._id);

    if (new Date().toLocaleTimeString('en-US', { hour12: false }) > CUTOFF_TIME) {
        const existingRecords = await Attendance.find({
            employeeId: { $in: absentEmployeeIds },
            date: { $gte: startOfDay, $lte: endOfDay },
        });
        const employeesToMarkAbsent = absentEmployeeIds.filter(id =>
            !existingRecords.some(record => record.employeeId.toString() === id)
        );

        if (employeesToMarkAbsent.length > 0) {
            await Attendance.insertMany(
                employeesToMarkAbsent.map(employeeId => ({
                    employeeId,
                    date: startOfDay,
                    status: "Absent",
                    morningTimeIn: null,
                    morningTimeOut: null,
                    afternoonTimeIn: null,
                    afternoonTimeOut: null,
                }))
            );
        }
    }

    res.status(200).json({
        message: 'Absent employees checked',
        absentCount: absentEmployeeIds.length,
        absentEmployeeIds,
    });
});

/**
 * @desc Update an attendance record
 * @route PUT /api/attendance/:id
 */
exports.updateAttendance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { employeeId, date, morningTimeIn, morningTimeOut, afternoonTimeIn, afternoonTimeOut, status } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
        return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (employeeId && attendance.employeeId.toString() !== employeeId) {
        return res.status(400).json({
            message: 'Employee ID mismatch',
            expected: attendance.employeeId.toString(),
            received: employeeId,
        });
    }

    // Update fields only if provided in the request
    attendance.date = date || attendance.date;
    attendance.morningTimeIn = morningTimeIn !== undefined ? morningTimeIn : attendance.morningTimeIn || null;
    attendance.morningTimeOut = morningTimeOut !== undefined ? morningTimeOut : attendance.morningTimeOut || null;
    attendance.afternoonTimeIn = afternoonTimeIn !== undefined ? afternoonTimeIn : attendance.afternoonTimeIn || null;
    attendance.afternoonTimeOut = afternoonTimeOut !== undefined ? afternoonTimeOut : attendance.afternoonTimeOut || null;

    // Define time thresholds
    const MORNING_START = "08:00";
    const AFTERNOON_START = "13:00";
    const MORNING_EARLY_CUTOFF = "11:30";
    const AFTERNOON_END = "17:00";

    // Calculate status if not explicitly provided
    if (!status) {
        const { morningTimeIn, morningTimeOut, afternoonTimeIn, afternoonTimeOut } = attendance;

        if (!morningTimeIn && !afternoonTimeIn) {
            attendance.status = "Absent";
        } else if (morningTimeIn && afternoonTimeIn && morningTimeOut && afternoonTimeOut) {
            attendance.status = "Present";
        } else if ((morningTimeIn && !afternoonTimeIn) || (!morningTimeIn && afternoonTimeIn)) {
            attendance.status = "Half Day";
        } else if (morningTimeIn && morningTimeIn > MORNING_START) {
            attendance.status = "Late";
        } else if (afternoonTimeIn && afternoonTimeIn > AFTERNOON_START) {
            attendance.status = "Late";
        } else if ((morningTimeOut && morningTimeOut < MORNING_EARLY_CUTOFF) || 
                  (afternoonTimeOut && afternoonTimeOut < AFTERNOON_END)) {
            attendance.status = "Early Departure";
        } else if (morningTimeIn && morningTimeIn <= MORNING_START) {
            attendance.status = "On Time";
        } else if (afternoonTimeIn && afternoonTimeIn <= AFTERNOON_START) {
            attendance.status = "On Time";
        }
    } else {
        attendance.status = status;
    }

    await attendance.save();
    res.status(200).json(attendance);
});

/**
 * @desc Create a new attendance record manually
 * @route POST /api/attendance
 */
exports.createAttendance = asyncHandler(async (req, res) => {
    const { employeeId, date, morningTimeIn, morningTimeOut, afternoonTimeIn, afternoonTimeOut, status } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
    }

    const newAttendance = new Attendance({
        employeeId,
        date,
        morningTimeIn: morningTimeIn || null,
        morningTimeOut: morningTimeOut || null,
        afternoonTimeIn: afternoonTimeIn || null,
        afternoonTimeOut: afternoonTimeOut || null,
        status: status || "Absent",
    });

    // Define time thresholds
    const MORNING_START = "08:00";
    const AFTERNOON_START = "13:00";
    const MORNING_EARLY_CUTOFF = "11:30";
    const AFTERNOON_END = "17:00";

    if (!status) {
        if (!morningTimeIn && !afternoonTimeIn) {
            newAttendance.status = "Absent";
        } else if (morningTimeIn && afternoonTimeIn && morningTimeOut && afternoonTimeOut) {
            newAttendance.status = "Present";
        } else if ((morningTimeIn && !afternoonTimeIn) || (!morningTimeIn && afternoonTimeIn)) {
            newAttendance.status = "Half Day";
        } else if (morningTimeIn && morningTimeIn > MORNING_START) {
            newAttendance.status = "Late";
        } else if (afternoonTimeIn && afternoonTimeIn > AFTERNOON_START) {
            newAttendance.status = "Late";
        } else if ((morningTimeOut && morningTimeOut < MORNING_EARLY_CUTOFF) || 
                  (afternoonTimeOut && afternoonTimeOut < AFTERNOON_END)) {
            newAttendance.status = "Early Departure";
        } else if (morningTimeIn && morningTimeIn <= MORNING_START) {
            newAttendance.status = "On Time";
        } else if (afternoonTimeIn && afternoonTimeIn <= AFTERNOON_START) {
            newAttendance.status = "On Time";
        }
    }

    await newAttendance.save();
    const populatedAttendance = await Attendance.findById(newAttendance._id)
        .populate('employeeId', 'name position email empNo');

    res.status(201).json(populatedAttendance);
});

/**
 * @desc Get all attendance records
 * @route GET /api/attendance
 */
exports.getAllAttendance = asyncHandler(async (req, res) => {
    const { date } = req.query;
    let query = {};
    if (date) {
        const startOfDay = new Date(date).setHours(0, 0, 0, 0);
        const endOfDay = new Date(date).setHours(23, 59, 59, 999);
        query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const attendanceRecords = await Attendance.find(query)
        .populate({
            path: 'employeeId',
            select: 'firstName lastName position email empNo',
            match: { status: { $ne: 'pending' } }
        });

    const filteredRecords = attendanceRecords.filter(record => record.employeeId !== null);
    res.status(200).json(filteredRecords);
});

/**
 * @desc Get attendance by employee ID
 * @route GET /api/attendance/:employeeId
 */
exports.getAttendanceByEmployeeId = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;

    try {
        const attendanceRecords = await Attendance.find({ employeeId });
        if (!attendanceRecords || attendanceRecords.length === 0) {
            return res.status(404).json({ message: 'No attendance records found' });
        }
        res.status(200).json(attendanceRecords);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

/**
 * @desc Get today's attendance records
 * @route GET /api/attendance/today
 */
exports.getTodayAttendance = asyncHandler(async (req, res) => {
    try {
        const todayStart = new Date().setHours(0, 0, 0, 0);
        const todayEnd = new Date().setHours(23, 59, 59, 999);

        const attendanceRecords = await Attendance.find({
            date: { $gte: todayStart, $lte: todayEnd },
            $or: [{ morningTimeIn: { $ne: null } }, { afternoonTimeIn: { $ne: null } }],
        }).populate({
            path: 'employeeId',
            select: 'firstName lastName position email empNo',
            match: { status: { $ne: 'pending' } },
        });

        const filteredRecords = attendanceRecords.filter(record => record.employeeId !== null);
        res.status(200).json(filteredRecords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @desc Delete an attendance record
 * @route DELETE /api/attendance/:id
 */
exports.deleteAttendance = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const attendance = await Attendance.findByIdAndDelete(id);

        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        res.status(200).json({ message: 'Attendance record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = exports;