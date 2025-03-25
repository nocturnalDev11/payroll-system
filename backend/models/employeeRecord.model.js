const mongoose = require('mongoose');

const employeeRecordSchema = new mongoose.Schema({
    employeeId: {
        type: Number,
        required: true,
        ref: 'Employee',
    },
    salaryMonth: {
        // Format: YYYY-MM (e.g., "2025-03")
        type: String,
        required: true,
    },
    recordData: {
        // Base64-encoded PDF or other data
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

employeeRecordSchema.index({ employeeId: 1, salaryMonth: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeRecord', employeeRecordSchema);