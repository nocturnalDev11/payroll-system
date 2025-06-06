const mongoose = require('mongoose');

const attendanceSettingsSchema = new mongoose.Schema({
    officeStart: { type: String, default: '08:00' },
    breakStart: { type: String, default: '11:30' },
    breakEnd: { type: String, default: '12:59' },
    officeEnd: { type: String, default: '17:00' },
    gracePeriod: { type: Number, default: 15 },
    deductionRate: { type: Number, default: 37.5 },
    earlyTimeInThreshold: { type: String, default: '06:00' },
    earlyTimeOutThreshold: { type: String, default: '11:30' },
    halfDayThreshold: { type: String, default: '13:00' },
});

module.exports = mongoose.model('AttendanceSettings', attendanceSettingsSchema);
