const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    date: { type: Date, required: true },
    timeIn: { type: String, default: null },
    timeOut: { type: String, default: null },
    morningTimeIn: { type: String, default: null },
    morningTimeOut: { type: String, default: null },
    afternoonTimeIn: { type: String, default: null },
    afternoonTimeOut: { type: String, default: null },
    status: {
        type: String,
        enum: ['On Time', 'Late', 'Absent', 'Early Departure', 'Present', 'Half Day', 'Leave', 'Incomplete'],
        default: 'Absent'
    },
    lateHours: { type: Number, default: 0 },
    lateDeduction: { type: Number, default: 0 },
    workedHours: { type: Number, default: 0 }
}, {
    indexes: [{ key: { employeeId: 1, date: 1 }, unique: true }]
});

module.exports = mongoose.model('Attendance', attendanceSchema);
