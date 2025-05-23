const express = require('express');
const {
  timeIn,
  timeOut,
  checkAbsent,
  updateAttendance,
  createAttendance,
  getAllAttendance,
  getAttendanceByEmployeeId,
  getTodayAttendance,
  deleteAttendance,
} = require('../controllers/employee/attendance.controller.js');
const { restrictToAdmin, restrictToEmployee, verifyToken } = require('../middlewares/authMiddleware.js');

const router = express.Router();

router.post('/time-in', restrictToEmployee, timeIn);
router.post('/time-out', restrictToEmployee, timeOut);
router.get('/check-absent', restrictToAdmin, checkAbsent);
router.put('/:id', restrictToAdmin, updateAttendance);
router.post('/', restrictToAdmin, createAttendance);
router.get('/', restrictToAdmin, getAllAttendance);
router.get('/today', restrictToAdmin, getTodayAttendance);
router.get('/:employeeId', verifyToken, getAttendanceByEmployeeId);
router.delete('/:id', restrictToAdmin, deleteAttendance);

module.exports = router;
