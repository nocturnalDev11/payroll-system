const express = require('express');
const router = express.Router();
const Attendance = require('../models/attendance.model.js');
const { 
    restrictToAdmin
 } = require('../middlewares/authMiddleware.js');

const {
    timeIn,
    timeOut,
    createAttendance,
    getAllAttendance,
    getAttendanceByEmployeeId,
    deleteAttendance,
    checkAbsent
} = require('../controllers/employee/attendance.controller.js');

// router.get('/late', restrictToAdmin, async (req, res) => {
//     try {
//         const { date } = req.query;
//         if (!date) {
//             return res.status(400).json({ error: 'Date parameter is required' });
//         }
//         const lateRecords = await Attendance.countDocuments({ date, status: 'Late' });
//         res.status(200).json({ total: lateRecords });
//     } catch (error) {
//         console.error('Error in GET /api/attendance/late:', error);
//         res.status(500).json({ error: 'Failed to fetch late count', message: error.message });
//     }
// });

// router.get('/', restrictToAdmin, async (req, res) => {
//     try {
//         const { date } = req.query;
//         console.log('GET /api/attendance - Query date:', date);
//         if (!date) {
//             return res.status(400).json({ error: 'Date parameter is required' });
//         }
//         const attendanceRecords = await Attendance.find({ date }).sort({ employeeId: 1 });
//         console.log('Fetched attendance records:', JSON.stringify(attendanceRecords, null, 2));
//         res.status(200).json(attendanceRecords);
//     } catch (error) {
//         console.error('Error in GET /api/attendance:', error);
//         res.status(500).json({ error: 'Failed to fetch attendance', message: error.message });
//     }
// });

// router.put('/:id', restrictToAdmin, async (req, res) => {
//   try {
//     const { date, employeeId, morningTimeIn, morningTimeOut, afternoonTimeIn, afternoonTimeOut, status } = req.body;
//     const employeeIdParam = parseInt(req.params.id);

//     console.log('PUT /api/attendance/:id - Params:', { id: employeeIdParam });
//     console.log('PUT /api/attendance/:id - Body:', JSON.stringify(req.body, null, 2));

//     if (!date) {
//         return res.status(400).json({ error: 'Date is required' });
//     }
//     if (!employeeId) {
//         return res.status(400).json({ error: 'Employee ID is required in body' });
//     }

//     const parsedEmployeeId = parseInt(employeeId);
//     if (isNaN(parsedEmployeeId) || employeeIdParam !== parsedEmployeeId) {
//         return res.status(400).json({ 
//             error: 'Employee ID in URL must match body', 
//             paramId: employeeIdParam, 
//             bodyId: employeeId 
//         });
//     }

//     const updateData = {
//         employeeId: parsedEmployeeId,
//         date,
//         morningTimeIn: morningTimeIn !== undefined ? morningTimeIn : null,
//         morningTimeOut: morningTimeOut !== undefined ? morningTimeOut : null,
//         afternoonTimeIn: afternoonTimeIn !== undefined ? afternoonTimeIn : null,
//         afternoonTimeOut: afternoonTimeOut !== undefined ? afternoonTimeOut : null,
//         status: status || 'Absent',
//     };

//     const attendance = await Attendance.findOneAndUpdate(
//         { employeeId: parsedEmployeeId, date },
//         { $set: updateData },
//         { new: true, upsert: true, runValidators: true }
//     ).catch(err => {
//         console.error('MongoDB save error:', err);
//         throw new Error(`MongoDB save failed: ${err.message}`);
//     });

//     console.log('Updated/Created attendance:', JSON.stringify(attendance, null, 2));
//     const dbCheck = await Attendance.findOne({ employeeId: parsedEmployeeId, date }).catch(err => {
//         console.error('MongoDB check error:', err);
//         throw new Error(`MongoDB check failed: ${err.message}`);
//     });
//     console.log('DB Check after update:', JSON.stringify(dbCheck, null, 2));
    
//     res.status(200).json(attendance);
//     } catch (error) {
//         console.error('Error in PUT /api/attendance/:id:', error);
//         if (error.code === 11000) {
//             try {
//                 const { date, employeeId, morningTimeIn, morningTimeOut, afternoonTimeIn, afternoonTimeOut, status } = req.body;
//                 const updateData = {
//                     morningTimeIn: morningTimeIn !== undefined ? morningTimeIn : null,
//                     morningTimeOut: morningTimeOut !== undefined ? morningTimeOut : null,
//                     afternoonTimeIn: afternoonTimeIn !== undefined ? afternoonTimeIn : null,
//                     afternoonTimeOut: afternoonTimeOut !== undefined ? afternoonTimeOut : null,
//                     status: status || 'Absent',
//                 };

//                 const attendance = await Attendance.findOneAndUpdate(
//                     { employeeId: parseInt(employeeId), date },
//                     { $set: updateData },
//                     { new: true, runValidators: true }
//                 ).catch(err => {
//                     console.error('MongoDB update error:', err);
//                     throw new Error(`MongoDB update failed: ${err.message}`);
//                 });
//                 console.log('Updated existing attendance:', JSON.stringify(attendance, null, 2));
//                 res.status(200).json(attendance);
//             } catch (updateError) {
//                 console.error('Error updating existing record:', updateError);
//                 res.status(500).json({ error: 'Failed to update attendance', message: updateError.message });
//             }
//         } else {
//             res.status(500).json({ error: 'Failed to update attendance', message: error.message });
//         }
//     }
// });

router.post('/time-in', timeIn);
router.post('/time-out', timeOut);
router.post('/', createAttendance);
router.get('/', getAllAttendance);
router.get('/:employeeId', getAttendanceByEmployeeId);
router.delete('/:id', deleteAttendance);
router.get('/check-absent', checkAbsent);

module.exports = router;