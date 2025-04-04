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
    checkAbsent,
    updateAttendance,
    getTodayAttendance
} = require('../controllers/employee/attendance.controller.js');

router.post('/time-in', timeIn);
router.post('/time-out', timeOut);
router.post('/', createAttendance);
router.get('/', getAllAttendance);
router.get('/today', getTodayAttendance);
router.put('/:id', restrictToAdmin, updateAttendance);
router.get('/:employeeId', getAttendanceByEmployeeId);
router.delete('/:id', deleteAttendance);
router.get('/check-absent', checkAbsent);

module.exports = router;