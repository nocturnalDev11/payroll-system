<<<<<<< HEAD
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
=======
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const payslipSchema = new Schema({
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    payslipData: { 
        type: String, 
        required: true 
    },
    salaryMonth: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}$/ 
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'paid'],
        default: 'pending',
        required: true
    }
});

export const Payslip = model('Payslip', payslipSchema);
>>>>>>> 1f11dc9ba438c5cafca5d796ee1ee2768319b69a
