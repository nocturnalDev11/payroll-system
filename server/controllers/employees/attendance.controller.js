import asyncHandler from 'express-async-handler';
import { Attendance } from '../../models/attendance.model.js';
import { Employee } from '../../models/employee.model.js';

/**
 * @desc Create a new attendance record
 * @route POST /api/attendance/time-in
 */
export const timeIn = async (req, res) => {
    try {
        const { employeeId } = req.body;
        const currentDate = new Date();
        const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });

        // Define office hours
        const EARLY_THRESHOLD = "06:00:00"; // Optional early threshold
        const OFFICE_START = "08:00:00";
        const LUNCH_END = "13:00:00"; // 1:00 PM, afternoon session start

        // Validate minimum time-in
        if (currentTime < EARLY_THRESHOLD) {
            return res.status(400).json({ message: 'Time In is not allowed before 6:00 AM' });
        }

        // Check if there's an open session (no timeOut) for today
        const todayStart = new Date(currentDate.setHours(0, 0, 0, 0));
        const todayEnd = new Date(currentDate.setHours(23, 59, 59, 999));
        const openSession = await Attendance.findOne({
            employeeId,
            date: { $gte: todayStart, $lte: todayEnd },
            timeOut: null
        });

        if (openSession) {
            return res.status(400).json({ message: 'You are already Timed In. Please Time Out first.' });
        }

        // Determine status based on time of day
        let status;
        if (currentTime <= OFFICE_START) {
            status = "On Time";
        } else if (currentTime >= LUNCH_END) {
            status = "Late"; // After lunch, always late if not earlier
        } else {
            status = "Late"; // Between 8:00 AM and 1:00 PM
        }

        const attendance = new Attendance({
            employeeId,
            date: currentDate,
            timeIn: currentTime,
            status
        });

        await attendance.save();
        res.status(200).json(attendance);
    } catch (error) {
        console.error('Error in timeIn:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

/**
 * @desc Update attendance record with time out
 * @route POST /api/attendance/time-out
 */
export const timeOut = async (req, res) => {
    try {
        const { employeeId } = req.body;
        const currentDate = new Date();
        const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });

        // Define office end time
        const OFFICE_END = "17:00:00";
        const EARLY_THRESHOLD = "11:30:00"; // Allow early departure after lunch break

        // Find the latest open attendance record for today
        const todayStart = new Date(currentDate.setHours(0, 0, 0, 0));
        const todayEnd = new Date(currentDate.setHours(23, 59, 59, 999));
        let attendance = await Attendance.findOne({
            employeeId,
            date: { $gte: todayStart, $lte: todayEnd },
            timeOut: null
        });

        if (!attendance) {
            return res.status(400).json({ message: 'No open Time In session found. Please Time In first.' });
        }

        // Update time out and adjust status if early
        attendance.timeOut = currentTime;
        if (currentTime < OFFICE_END) {
            if (currentTime >= EARLY_THRESHOLD) {
                attendance.status = "Early Departure";
            } else {
                return res.status(400).json({ message: 'Time Out is not allowed before 11:30 AM' });
            }
        }

        await attendance.save();
        res.status(200).json(attendance);
    } catch (error) {
        console.error('Error in timeOut:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc Check and mark absent employees (optional cron job or admin endpoint)
 * @route GET /api/attendance/check-absent (example)
 */
export const checkAbsent = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const attendanceRecords = await Attendance.find({ date: { $gte: startOfDay, $lte: endOfDay } });
        const presentEmployeeIds = attendanceRecords.map(record => record.employeeId.toString());

        const { Employee } = await import('../../models/employee.model.js');
        const allEmployees = await Employee.find();
        const absentEmployees = allEmployees.filter(emp => !presentEmployeeIds.includes(emp._id.toString()));

        const absentRecords = absentEmployees.map(emp => ({
            employeeId: emp._id,
            date: startOfDay,
            status: "Absent"
        }));

        if (absentRecords.length > 0) {
            await Attendance.insertMany(absentRecords);
        }

        res.status(200).json({ message: 'Absent employees marked', absentCount: absentRecords.length });
    } catch (error) {
        console.error('Error in checkAbsent:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

export const createAttendance = async (req, res) => {
    try {
        const { employeeId, date, status } = req.body;

        // Check if the employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Create a new attendance record
        const newAttendance = new Attendance({
            employeeId,
            date,
            status
        });

        await newAttendance.save();

        // Populate the employee details
        const populatedAttendance = await Attendance.findById(newAttendance._id)
            .populate('employeeId', 'name position email employeeIdNumber');

        res.status(201).json(populatedAttendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc Get all attendance records
 * @route GET /api/attendance
 */
export const getAllAttendance = async (req, res) => {
    try {
        const attendanceRecords = await Attendance.find().populate('employeeId', 'firstName lastName position email employeeIdNumber');
        res.status(200).json(attendanceRecords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/**
 * @desc Get attendance by employee ID
 * @route GET /api/attendance/:employeeId
//  */
// export const getAttendanceByEmployee = async (req, res) => {
//     try {
//         const { employeeId } = req.params;

//         // Validate employeeId
//         if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
//             return res.status(400).json({ message: 'Invalid or missing employee ID' });
//         }

//         const attendanceRecords = await Attendance.find({ employeeId })
//             .populate('employeeId', 'name position employeeIdNumber');

//         if (!attendanceRecords.length) {
//             return res.status(404).json({ message: 'No attendance records found for this employee' });
//         }

//         res.status(200).json(attendanceRecords);
//     } catch (error) {
//         console.error('Error in getAttendanceByEmployee:', error);
//         res.status(500).json({ message: 'Internal Server Error', error: error.message });
//     }
// };

export const getAttendanceByEmployeeId = asyncHandler(async (req, res) => {
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
 * @desc Delete an attendance record
 * @route DELETE /api/attendance/:id
 */
export const deleteAttendance = async (req, res) => {
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
};