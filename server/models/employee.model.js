import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const USERNAME_INVALID_CHARACTERS = ' ?;:,.`\'"(){}[]|\\/';

function usernameValidator(value) {
    for (let i = 0; i < USERNAME_INVALID_CHARACTERS.length; i++) {
        if (value.includes(USERNAME_INVALID_CHARACTERS[i])) {
            return false;
        }
    }
    return true;
}

const employeeSchema = new Schema({
    firstName: { type: String, required: true },
    middleName: { type: String, default: '' },
    lastName: { type: String, required: true },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: [4, 'Username must be at least 4 characters long'],
        validate: [usernameValidator, 'Invalid username'],
    },
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
employeeSchema.pre('save', function(next) {
    if (this.salary && !this.hourlyRate) {
        this.hourlyRate = this.salary / (8 * 22); 
    }
    next();
});

export const Employee = model('Employee', employeeSchema);