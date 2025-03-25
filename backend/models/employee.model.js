const mongoose = require('mongoose');

const USERNAME_INVALID_CHARACTERS = ' ?;:,.`\'"(){}[]|\\/';

function usernameValidator(value) {
    for (let i = 0; i < USERNAME_INVALID_CHARACTERS.length; i++) {
        if (value.includes(USERNAME_INVALID_CHARACTERS[i])) {
            return false;
        }
    }
    return true;
}

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
        unique: true,
        trim: true,
        minLength: [4, 'Username must be at least 4 characters long'],
        validate: [usernameValidator, 'Invalid username'],
    },
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

employeeSchema.pre('save', function(next) {
    if (this.salary && !this.hourlyRate) {
        this.hourlyRate = this.salary / (8 * 22); 
    }
    next();
});

module.exports = mongoose.model('Employee', employeeSchema);