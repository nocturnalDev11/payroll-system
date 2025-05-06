const asyncHandler = require('express-async-handler');
const AttendanceSettings = require('../../models/attendanceSettings.model.js');
const Attendance = require('../../models/attendance.model.js');
const Employee = require('../../models/employee.model.js');

/**
 * @desc Create a new attendance record
 * @route POST /api/attendance/time-in
 */
exports.timeIn = asyncHandler(async (req, res) => {
    const { employeeId } = req.body;
    const currentDate = new Date();
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    // Fetch attendance settings
    const settings = await AttendanceSettings.findOne() || new AttendanceSettings({});

    // Validate time-in based on morning or afternoon
    if (currentTime < settings.earlyTimeInThreshold) {
        return res.status(400).json({ message: `Time In is not allowed before ${settings.earlyTimeInThreshold}` });
    }
    if (currentTime >= settings.breakStart && currentTime <= settings.breakEnd) {
        return res.status(400).json({ message: `Time In is not allowed during lunch break (${settings.breakStart} - ${settings.breakEnd})` });
    }

    const todayStart = new Date(currentDate.setHours(0, 0, 0, 0));
    const todayEnd = new Date(currentDate.setHours(23, 59, 59, 999));
    const existingRecord = await Attendance.findOne({
        employeeId,
        date: { $gte: todayStart, $lte: todayEnd },
    });

    // Check if already timed in for the session
    if (existingRecord) {
        if (currentTime <= settings.breakEnd && existingRecord.morningTimeIn && !existingRecord.morningTimeOut) {
            return res.status(400).json({ message: 'You are already Timed In for the morning session. Please Time Out first.' });
        }
        if (currentTime > settings.breakEnd && existingRecord.afternoonTimeIn && !existingRecord.afternoonTimeOut) {
            return res.status(400).json({ message: 'You are already Timed In for the afternoon session. Please Time Out first.' });
        }
    }

    let status = "Present";
    let lateHours = 0;
    let lateDeduction = 0;

    // Calculate late threshold based on grace period
    const lateThreshold = new Date(`1970-01-01T${settings.officeStart}Z`);
    lateThreshold.setMinutes(lateThreshold.getMinutes() + settings.gracePeriod);
    const lateThresholdTime = lateThreshold.toISOString().slice(11, 19).substring(0, 5);

    // Calculate status and deductions
    if (currentTime <= settings.breakStart) {
        // Morning time-in
        if (currentTime > lateThresholdTime) {
            status = "Late";
            const [hours, minutes] = currentTime.split(':').map(Number);
            const [startHours, startMinutes] = settings.officeStart.split(':').map(Number);
            const lateMinutes = (hours * 60 + minutes) - (startHours * 60 + startMinutes);
            lateHours = Math.ceil(lateMinutes / 60);
            lateDeduction = lateHours * settings.deductionRate;
        }
    } else if (currentTime > settings.breakEnd) {
        // Afternoon time-in
        if (currentTime >= settings.halfDayThreshold) {
            status = "Half Day";
            lateHours = 4;
            lateDeduction = lateHours * settings.deductionRate;
        } else if (existingRecord?.morningTimeIn) {
            status = "Present";
        }
    }

    let attendance;
    if (existingRecord) {
        // Update existing record for afternoon time-in
        existingRecord.afternoonTimeIn = currentTime > settings.breakEnd ? currentTime : existingRecord.afternoonTimeIn;
        existingRecord.status = status;
        existingRecord.lateHours = lateHours;
        existingRecord.lateDeduction = lateDeduction;
        attendance = await existingRecord.save();
    } else {
        // Create new record
        attendance = new Attendance({
            employeeId,
            date: currentDate,
            morningTimeIn: currentTime <= settings.breakStart ? currentTime : null,
            afternoonTimeIn: currentTime > settings.breakEnd ? currentTime : null,
            status,
            lateHours,
            lateDeduction,
        });
        await attendance.save();
    }

    res.status(200).json(attendance);
});

/**
 * @desc Update attendance record with time out
 * @route POST /api/attendance/time-out
 */
exports.timeOut = asyncHandler(async (req, res) => {
    const { employeeId } = req.body;
    const currentDate = new Date();
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    // Fetch attendance settings
    const settings = await AttendanceSettings.findOne() || new AttendanceSettings({});

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

    if (currentTime < settings.earlyTimeOutThreshold) {
        return res.status(400).json({ message: `Time Out is not allowed before ${settings.earlyTimeOutThreshold}` });
    }

    if (attendance.morningTimeIn && !attendance.morningTimeOut && currentTime <= settings.breakEnd) {
        attendance.morningTimeOut = currentTime;
    } else if (attendance.afternoonTimeIn && !attendance.afternoonTimeOut) {
        attendance.afternoonTimeOut = currentTime;
    } else if (attendance.morningTimeIn && !attendance.afternoonTimeIn && currentTime > settings.breakEnd) {
        attendance.afternoonTimeIn = currentTime;
        attendance.afternoonTimeOut = currentTime;
    }

    // Calculate late threshold based on grace period
    const lateThreshold = new Date(`1970-01-01T${settings.officeStart}Z`);
    lateThreshold.setMinutes(lateThreshold.getMinutes() + settings.gracePeriod);
    const lateThresholdTime = lateThreshold.toISOString().slice(11, 19).substring(0, 5);

    if (currentTime < settings.officeEnd && attendance.afternoonTimeOut) {
        attendance.status = "Early Departure";
    } else if (attendance.morningTimeIn && attendance.afternoonTimeOut && currentTime >= settings.officeEnd) {
        attendance.status = "Present";
        if (attendance.morningTimeIn > lateThresholdTime) {
            attendance.status = "Late";
            const [hours, minutes] = attendance.morningTimeIn.split(':').map(Number);
            const [startHours, startMinutes] = settings.officeStart.split(':').map(Number);
            const lateMinutes = (hours * 60 + minutes) - (startHours * 60 + startMinutes);
            attendance.lateHours = Math.ceil(lateMinutes / 60);
            attendance.lateDeduction = attendance.lateHours * settings.deductionRate;
        }
    } else if (!attendance.morningTimeIn && attendance.afternoonTimeIn && attendance.afternoonTimeOut) {
        attendance.status = "Half Day";
        if (attendance.afternoonTimeIn >= settings.halfDayThreshold) {
            attendance.lateHours = 4;
            attendance.lateDeduction = 4 * settings.deductionRate;
        }
    }

    await attendance.save();
    res.status(200).json(attendance);
});

/**
 * @desc Check and mark absent employees
 * @route GET /api/attendance/check-absent
 */
exports.checkAbsent = asyncHandler(async (req, res) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    // Fetch attendance settings
    const settings = await AttendanceSettings.findOne() || new AttendanceSettings({});

    const attendanceRecords = await Attendance.find({ date: { $gte: startOfDay, $lte: endOfDay } });
    const presentEmployeeIds = attendanceRecords
        .filter(record => record.morningTimeIn || record.afternoonTimeIn)
        .map(record => record.employeeId.toString());

    const employees = await Employee.find();
    const absentEmployeeIds = employees
        .filter(emp => !presentEmployeeIds.includes(emp._id.toString()))
        .map(emp => emp._id);

    if (new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) > settings.officeEnd) {
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
                    lateHours: 8,
                    lateDeduction: 8 * settings.deductionRate,
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
    const { employeeId, date, morningTimeIn, morningTimeOut, afternoonTimeIn, afternoonTimeOut, status, lateHours, lateDeduction } = req.body;

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

    // Fetch attendance settings
    const settings = await AttendanceSettings.findOne() || new AttendanceSettings({});

    attendance.date = date || attendance.date;
    attendance.morningTimeIn = morningTimeIn !== undefined ? morningTimeIn : attendance.morningTimeIn || null;
    attendance.morningTimeOut = morningTimeOut !== undefined ? morningTimeOut : attendance.morningTimeOut || null;
    attendance.afternoonTimeIn = afternoonTimeIn !== undefined ? afternoonTimeIn : attendance.afternoonTimeIn || null;
    attendance.afternoonTimeOut = afternoonTimeOut !== undefined ? afternoonTimeOut : attendance.afternoonTimeOut || null;

    // Calculate late threshold based on grace period
    const lateThreshold = new Date(`1970-01-01T${settings.officeStart}Z`);
    lateThreshold.setMinutes(lateThreshold.getMinutes() + settings.gracePeriod);
    const lateThresholdTime = lateThreshold.toISOString().slice(11, 19).substring(0, 5);

    if (status) {
        attendance.status = status;
        attendance.lateHours = lateHours !== undefined ? lateHours : attendance.lateHours || 0;
        attendance.lateDeduction = lateDeduction !== undefined ? lateDeduction : attendance.lateDeduction || 0;
    } else {
        let calculatedLateHours = 0;
        let calculatedLateDeduction = 0;

        if (!attendance.morningTimeIn && !attendance.afternoonTimeIn) {
            attendance.status = "Absent";
            calculatedLateHours = 8;
            calculatedLateDeduction = 8 * settings.deductionRate;
        } else if (attendance.morningTimeIn && attendance.afternoonTimeOut && attendance.afternoonTimeOut >= settings.officeEnd) {
            attendance.status = "Present";
            if (attendance.morningTimeIn > lateThresholdTime) {
                attendance.status = "Late";
                const [hours, minutes] = attendance.morningTimeIn.split(':').map(Number);
                const [startHours, startMinutes] = settings.officeStart.split(':').map(Number);
                const lateMinutes = (hours * 60 + minutes) - (startHours * 60 + startMinutes);
                calculatedLateHours = Math.ceil(lateMinutes / 60);
                calculatedLateDeduction = calculatedLateHours * settings.deductionRate;
            }
        } else if ((attendance.morningTimeIn && !attendance.afternoonTimeIn) || (!attendance.morningTimeIn && attendance.afternoonTimeIn)) {
            attendance.status = "Half Day";
            calculatedLateHours = 4;
            calculatedLateDeduction = 4 * settings.deductionRate;
            if (attendance.morningTimeIn && attendance.morningTimeIn > lateThresholdTime) {
                attendance.status = "Late";
                const [hours, minutes] = attendance.morningTimeIn.split(':').map(Number);
                const [startHours, startMinutes] = settings.officeStart.split(':').map(Number);
                const lateMinutes = (hours * 60 + minutes) - (startHours * 60 + startMinutes);
                calculatedLateHours = Math.max(4, Math.ceil(lateMinutes / 60));
                calculatedLateDeduction = calculatedLateHours * settings.deductionRate;
            } else if (attendance.afternoonTimeIn && attendance.afternoonTimeIn >= settings.halfDayThreshold) {
                attendance.status = "Half Day";
                calculatedLateHours = 4;
                calculatedLateDeduction = 4 * settings.deductionRate;
            }
        } else if (attendance.morningTimeIn && attendance.morningTimeIn > lateThresholdTime) {
            attendance.status = "Late";
            const [hours, minutes] = attendance.morningTimeIn.split(':').map(Number);
            const [startHours, startMinutes] = settings.officeStart.split(':').map(Number);
            const lateMinutes = (hours * 60 + minutes) - (startHours * 60 + startMinutes);
            calculatedLateHours = Math.ceil(lateMinutes / 60);
            calculatedLateDeduction = calculatedLateHours * settings.deductionRate;
        } else if (attendance.afternoonTimeIn && attendance.afternoonTimeIn > settings.breakEnd) {
            attendance.status = "Half Day";
            calculatedLateHours = 4;
            calculatedLateDeduction = 4 * settings.deductionRate;
        } else if ((attendance.morningTimeOut && attendance.morningTimeOut < settings.breakStart) ||
                   (attendance.afternoonTimeOut && attendance.afternoonTimeOut < settings.officeEnd)) {
            attendance.status = "Early Departure";
        } else {
            attendance.status = "Present";
        }

        attendance.lateHours = calculatedLateHours;
        attendance.lateDeduction = calculatedLateDeduction;
    }

    await attendance.save();
    res.status(200).json(attendance);
});

/**
 * @desc Create a new attendance record manually
 * @route POST /api/attendance
 */
exports.createAttendance = asyncHandler(async (req, res) => {
    const { employeeId, date, morningTimeIn, morningTimeOut, afternoonTimeIn, afternoonTimeOut, status, lateHours, lateDeduction } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
    }

    // Fetch attendance settings
    const settings = await AttendanceSettings.findOne() || new AttendanceSettings({});

    const newAttendance = new Attendance({
        employeeId,
        date,
        morningTimeIn: morningTimeIn || null,
        morningTimeOut: morningTimeOut || null,
        afternoonTimeIn: afternoonTimeIn || null,
        afternoonTimeOut: afternoonTimeOut || null,
        status: status || 'Absent',
        lateHours: lateHours || 0,
        lateDeduction: lateDeduction || 0,
    });

    // Calculate late threshold based on grace period
    const lateThreshold = new Date(`1970-01-01T${settings.officeStart}Z`);
    lateThreshold.setMinutes(lateThreshold.getMinutes() + settings.gracePeriod);
    const lateThresholdTime = lateThreshold.toISOString().slice(11, 19).substring(0, 5);

    if (!status) {
        let calculatedLateHours = 0;
        let calculatedLateDeduction = 0;

        if (!morningTimeIn && !afternoonTimeIn) {
            newAttendance.status = 'Absent';
            calculatedLateHours = 8;
            calculatedLateDeduction = calculatedLateHours * settings.deductionRate;
        } else if (morningTimeIn && afternoonTimeOut && afternoonTimeOut >= settings.officeEnd) {
            newAttendance.status = 'Present';
            if (morningTimeIn > lateThresholdTime) {
                newAttendance.status = 'Late';
                const [hours, minutes] = morningTimeIn.split(':').map(Number);
                const [startHours, startMinutes] = settings.officeStart.split(':').map(Number);
                const lateMinutes = (hours * 60 + minutes) - (startHours * 60 + startMinutes);
                calculatedLateHours = Math.ceil(lateMinutes / 60);
                calculatedLateDeduction = calculatedLateHours * settings.deductionRate;
            }
        } else if ((morningTimeIn && !afternoonTimeIn) || (!morningTimeIn && afternoonTimeIn)) {
            newAttendance.status = 'Half Day';
            calculatedLateHours = 4;
            calculatedLateDeduction = calculatedLateHours * settings.deductionRate;
            if (morningTimeIn && morningTimeIn > lateThresholdTime) {
                newAttendance.status = 'Late';
                const [hours, minutes] = morningTimeIn.split(':').map(Number);
                const [startHours, startMinutes] = settings.officeStart.split(':').map(Number);
                const lateMinutes = (hours * 60 + minutes) - (startHours * 60 + startMinutes);
                calculatedLateHours = Math.max(4, Math.ceil(lateMinutes / 60));
                calculatedLateDeduction = calculatedLateHours * settings.deductionRate;
            } else if (afternoonTimeIn && afternoonTimeIn >= settings.halfDayThreshold) {
                newAttendance.status = 'Half Day';
                calculatedLateHours = 4;
                calculatedLateDeduction = calculatedLateHours * settings.deductionRate;
            }
        } else if (morningTimeIn && morningTimeIn > lateThresholdTime) {
            newAttendance.status = 'Late';
            const [hours, minutes] = morningTimeIn.split(':').map(Number);
            const [startHours, startMinutes] = settings.officeStart.split(':').map(Number);
            const lateMinutes = (hours * 60 + minutes) - (startHours * 60 + startMinutes);
            calculatedLateHours = Math.ceil(lateMinutes / 60);
            calculatedLateDeduction = calculatedLateHours * settings.deductionRate;
        } else if (afternoonTimeIn && afternoonTimeIn > settings.breakEnd) {
            newAttendance.status = 'Half Day';
            calculatedLateHours = 4;
            calculatedLateDeduction = calculatedLateHours * settings.deductionRate;
        } else if (
            (morningTimeOut && morningTimeOut < settings.breakStart) ||
            (afternoonTimeOut && afternoonTimeOut < settings.officeEnd)
        ) {
            newAttendance.status = 'Early Departure';
        } else {
            newAttendance.status = 'Present';
        }

        newAttendance.lateHours = calculatedLateHours;
        newAttendance.lateDeduction = calculatedLateDeduction;
    }

    await newAttendance.save();
    const populatedAttendance = await Attendance.findById(newAttendance._id).populate(
        'employeeId',
        'name position email empNo'
    );

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
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const attendanceRecords = await Attendance.find({ employeeId });
        if (!attendanceRecords || attendanceRecords.length === 0) {
            return res.status(200).json([]);
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