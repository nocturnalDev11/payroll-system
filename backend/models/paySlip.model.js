const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema({
    employeeId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true 
    },
    empNo: { type: String, required: true },
    payslipData: { type: String, required: true },
    salaryMonth: { type: String, required: true },
    paydayType: { type: String, enum: ['mid-month', 'end-of-month'], required: true },
    position: { type: String, required: true },
    salary: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Payslip', payslipSchema);