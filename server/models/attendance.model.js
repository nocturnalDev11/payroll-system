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
