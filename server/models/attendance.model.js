import mongoose from 'mongoose'
const { Schema, model } = mongoose;

const attendanceSchema = new Schema({
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    // Format: YYYY-MM-DD
    date: { 
        type: String, 
        required: true 
    },
    // Format: HH:mm (e.g., "08:00")
    morningTimeIn: { 
        type: String 
    },
    // Format: HH:mm (e.g., "12:00")
    morningTimeOut: { 
        type: String 
    },
    // Format: HH:mm (e.g., "13:00")
    afternoonTimeIn: { 
        type: String 
    },
    // Format: HH:mm (e.g., "17:00")
    afternoonTimeOut: { 
        type: String 
    },
    status: { 
        type: String, 
        enum: ['On Time', 'Late', 'Absent', 'Early Departure'],
        required: true,
        default: 'Absent'
    }
});

export const Attendance = model('Attendance', attendanceSchema);
