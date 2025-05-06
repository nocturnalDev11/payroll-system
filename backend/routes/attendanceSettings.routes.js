const express = require('express');
const { getAttendanceSettings, updateAttendanceSettings } = require('../controllers/employee/attendanceSettings.controller.js');
const { restrictToAdmin, verifyToken } = require('../middlewares/authMiddleware.js');

const router = express.Router();

router.get('/', verifyToken, getAttendanceSettings);
router.put('/', restrictToAdmin, updateAttendanceSettings);

module.exports = router;