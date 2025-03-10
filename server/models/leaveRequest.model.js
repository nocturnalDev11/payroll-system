import mongoose from 'mongoose'
const { Schema, model } = mongoose;

const leaveRequestSchema = new Schema({
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
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
        enum: [
            'Pending', 
            'Approved', 
            'Disapproved'
        ], 
        default: 'Pending' 
    }
});

export const LeaveRequest = model('LeaveRequest', leaveRequestSchema);
