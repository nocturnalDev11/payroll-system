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

const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

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
        validate: [usernameValidator, 'Username contains invalid characters'],
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [emailRegex, 'Please enter a valid email address'],
    },
    password: {
        type: String,
        required: true,
        minLength: [8, 'Password must be at least 8 characters long'],
    },
    employeeIdNumber: {
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
        trim: true,
    },
    birthday: { type: Date, required: false, default: null },
    profilePicture: { type: String, default: null },
    hireDate: { type: Date, required: true },
    contactInfo: { type: String, required: true },
    civilStatus: { 
        type: String, 
        enum: ['Single', 'Married', 'Divorced', 'Widowed'], 
        required: true,
        default: 'Single',
    },
    position: { 
        type: String,
        required: true,
    },
    salary: { type: Number, required: true, min: 0 },
    hourlyRate: { type: Number, default: 0 },
    sss: { type: Number, default: 0 },
    philHealth: { type: Number, default: 0 },
    pagIbig: { type: Number, default: 0 },
    tin: { type: String, default: '' },
    earnings: {
        travelExpenses: { type: Number, default: 0 },
        otherEarnings: { type: Number, default: 0 },
    },
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
    commission: { type: Number, default: 0 },
    profitSharing: { type: Number, default: 0 },
    fees: { type: Number, default: 0 },
    thirteenthMonthPay: { type: Number, default: 0 },
    hazardPay: { type: Number, default: 0 },
    payHeads: [{ type: Schema.Types.ObjectId, ref: 'PayHead' }],
    absences: {
        days: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
    },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    trashedAt: {
        type: Date
    }
}, { timestamps: true });

employeeSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    if (this.salary && !this.hourlyRate) {
        this.hourlyRate = this.salary / (8 * 22);
    }
    next();
});

employeeSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

employeeSchema.index({ username: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ employeeIdNumber: 1 });

export const Employee = model('Employee', employeeSchema);