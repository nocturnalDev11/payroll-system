<<<<<<< HEAD
const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    employeeId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee', 
        required: true 
=======
import mongoose from 'mongoose'
const { Schema, model } = mongoose;

const leaveRequestSchema = new Schema({
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
>>>>>>> 1f11dc9ba438c5cafca5d796ee1ee2768319b69a
    },
    employeeName: { 
        type: String, 
        required: true 
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    endDate: { 
        type: Date, 
        required: true 
    },
    reason: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
<<<<<<< HEAD
        enum: ['Pending', 'Approved', 'Disapproved'], 
        default: 'Pending' 
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
=======
        enum: [
            'Pending', 
            'Approved', 
            'Disapproved'
        ], 
        default: 'Pending' 
    }
});

export const LeaveRequest = model('LeaveRequest', leaveRequestSchema);
>>>>>>> 1f11dc9ba438c5cafca5d796ee1ee2768319b69a
