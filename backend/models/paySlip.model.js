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