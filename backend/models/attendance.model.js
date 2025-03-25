<<<<<<< HEAD
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
=======
import mongoose from 'mongoose'
const { Schema, model } = mongoose;

const attendanceSchema = new Schema({
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    date: { 
        type: Date, 
        required: true,
        default: Date.now 
    },
    timeIn: {
        type: String,
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, 
        required: true 
    },
    timeOut: {
        type: String,
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/ 
    },
    status: { 
        type: String, 
        enum: ['On Time', 'Late', 'Absent', 'Early Departure'],
        required: true,
        default: 'Absent'
    }
});

export const Attendance = model('Attendance', attendanceSchema);
>>>>>>> 1f11dc9ba438c5cafca5d796ee1ee2768319b69a
