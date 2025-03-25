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
    status: { 
        type: String, 
        enum: ['On Time', 'Late', 'Absent', 'Early Departure'], 
        default: 'Absent' 
    }
}, {
    indexes: [{ key: { employeeId: 1, date: 1 }, unique: true }]
});

module.exports = mongoose.model('Attendance', attendanceSchema);