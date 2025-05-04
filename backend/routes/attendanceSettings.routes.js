const express = require('express');
const { getAttendanceSettings, updateAttendanceSettings } = require('../controllers/employee/attendanceSettings.controller.js');
const { restrictToAdmin } = require('../middlewares/authMiddleware.js');

const router = express.Router();

router.get('/', restrictToAdmin, getAttendanceSettings);
router.put('/', restrictToAdmin, updateAttendanceSettings);

module.exports = router;