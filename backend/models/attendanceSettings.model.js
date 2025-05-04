const mongoose = require('mongoose');

const attendanceSettingsSchema = new mongoose.Schema({
  officeStart: { type: String, default: '08:00' },
  lateCutoff: { type: String, default: '08:15' },
  breakStart: { type: String, default: '11:30' },
  breakEnd: { type: String, default: '12:59' },
  officeEnd: { type: String, default: '17:00' },
  gracePeriod: { type: Number, default: 15 },
  deductionRate: { type: Number, default: 37.5 },
}, { timestamps: true });

module.exports = mongoose.model('AttendanceSettings', attendanceSettingsSchema);