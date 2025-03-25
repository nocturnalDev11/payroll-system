<<<<<<< HEAD
const mongoose = require('mongoose');
=======
import mongoose from 'mongoose';
const { Schema, model } = mongoose;
>>>>>>> 1f11dc9ba438c5cafca5d796ee1ee2768319b69a

const USERNAME_INVALID_CHARACTERS = ' ?;:,.`\'"(){}[]|\\/';

function usernameValidator(value) {
    for (let i = 0; i < USERNAME_INVALID_CHARACTERS.length; i++) {
        if (value.includes(USERNAME_INVALID_CHARACTERS[i])) {
            return false;
        }
    }
    return true;
}

<<<<<<< HEAD
const employeeSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    empNo: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    middleName: { type: String, default: '' },
    lastName: { type: String, required: true },
    position: { type: String, required: true },
    positionHistory: [{
        position: { type: String, required: true },
        salary: { type: Number, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, default: null }
    }],
    salary: { type: Number, required: true, min: 0 },
    hourlyRate: { type: Number, default: 0 },
    email: { type: String, required: true, unique: true },
    contactInfo: { type: String, required: true },
    sss: { type: String, default: '' },
    philhealth: { type: String, default: '' },
    pagibig: { type: String, default: '' },
    tin: { type: String, default: '' },
    civilStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'], default: 'Single' },
    username: { 
        type: String, 
        required: true, 
=======
const employeeSchema = new Schema({
    firstName: { type: String, required: true },
    middleName: { type: String, default: '' },
    lastName: { type: String, required: true },
    username: {
        type: String,
        required: true,
>>>>>>> 1f11dc9ba438c5cafca5d796ee1ee2768319b69a
        unique: true,
        trim: true,
        minLength: [4, 'Username must be at least 4 characters long'],
        validate: [usernameValidator, 'Invalid username'],
    },
<<<<<<< HEAD
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    hireDate: { type: Date, required: true },
    earnings: {
        travelExpenses: { type: Number, default: 0 },
        otherEarnings: { type: Number, default: 0 },
    },
    payheads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payhead' }],
    commission: { type: Number, default: 0 },
    profitSharing: { type: Number, default: 0 },
    fees: { type: Number, default: 0 },
    thirteenthMonthPay: { type: Number, default: 0 },
    hazardPay: { type: Number, default: 0 },
    overtimeHours: {
        regular: { type: Number, default: 0 },
        holiday: { type: Number, default: 0 },
    },
    nightShiftDiff: { type: Number, default: 0 },
    deMinimis: { type: Number, default: 0 },
    otherTaxable: { type: Number, default: 0 },
    paidLeaves: {
        days: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
    },
    absences: {
        days: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
    },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected', 'trashed'], 
        default: 'pending' 
    },
    trashedAt: {
        type: Date,
        default: null
    },
    resetToken: { type: String },
    verificationCode: { type: String },
    resetTokenExpires: { type: Date }
}, { timestamps: true });

=======
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    },
    password: {
        type: String,
        required: true,
        minLength: [8, 'Password must be at least 8 characters long'],
    },
    employeeIdNumber: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true
    },
    birthday: { 
        type: Date, 
        required: false, 
        default: null 
    },
    profilePicture: { type: String },
    profilePictureAlt: { type: String },
    hireDate: { type: Date, required: false, default: null },
    contactInfo: { type: String, required: false, default: null },
    civilStatus: { type: String, required: false, default: null },
    position: { type: String, required: false, default: null },
    salary: { type: Number, required: true, min: 0 },
    hourlyRate: { type: Number, default: 0 },
    sss: { type: String, default: '' },
    philHealth: { type: String, default: '' },
    pagIbig: { type: String, default: '' },
    tin: { type: String, default: '' },
    earnings: {
        travelExpenses: { type: Number, default: 0 },
        otherEarnings: { type: Number, default: 0 }
    },
    payHeads: [
        { 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PayHead'
        }
    ],
    role: { type: String, default: 'employee' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

// Pre-save hook to calculate hourlyRate
>>>>>>> 1f11dc9ba438c5cafca5d796ee1ee2768319b69a
employeeSchema.pre('save', function(next) {
    if (this.salary && !this.hourlyRate) {
        this.hourlyRate = this.salary / (8 * 22); 
    }
    next();
});

<<<<<<< HEAD
module.exports = mongoose.model('Employee', employeeSchema);
=======
export const Employee = model('Employee', employeeSchema);
>>>>>>> 1f11dc9ba438c5cafca5d796ee1ee2768319b69a
