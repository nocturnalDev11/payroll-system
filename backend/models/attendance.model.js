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
        enum: ['On Time', 'Late', 'Absent', 'Early Departure', 'Present', 'Half Day'], 
        default: 'Absent' 
    },
    // Store hours late
    lateHours: { type: Number, default: 0 },
    // Store deduction amount (300 pesos per hour)
    lateDeduction: { type: Number, default: 0 }
}, {
    indexes: [{ key: { employeeId: 1, date: 1 }, unique: true }]
});

module.exports = mongoose.model('Attendance', attendanceSchema);