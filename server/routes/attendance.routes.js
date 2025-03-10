import express from 'express'
import {
    timeIn,
    timeOut,
    createAttendance,
    getAllAttendance,
    getAttendanceByEmployeeId,
    deleteAttendance,
    checkAbsent
} from '../controllers/employees/attendance.controller.js';

const router = express.Router();

router.post('/time-in', timeIn);
router.post('/time-out', timeOut);
router.post('/', createAttendance);
router.get('/', getAllAttendance);
router.get('/:employeeId', getAttendanceByEmployeeId);
router.delete('/:id', deleteAttendance);
router.get('/check-absent', checkAbsent);

export default router;