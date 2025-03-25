const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const pendingRequestSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    empNo: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    middleName: { type: String, default: '' },
    lastName: { type: String, required: true },
    position: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactNumber: { type: String, required: true },
    salary: { type: Number, required: true, min: 0 },
    hourlyRate: { type: Number, default: 0 },
    sss: { type: String, default: '' },
    philhealth: { type: String, default: '' },
    hdmf: { type: String, default: '' },
    tin: { type: String, default: '' },
    civilStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'], default: 'Single' },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    hireDate: { type: Date, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
    role: { type: String, enum: ['employee'], default: 'employee' },
    earnings: {
        travelExpenses: { type: Number, default: 0 },
        otherEarnings: { type: Number, default: 0 }
    },
    approvedAt: { type: Date },
    rejectedAt: { type: Date }
}, { timestamps: true });

// Hash password before saving
pendingRequestSchema.pre('save', async function(next) {
    try {
        if (this.isModified('password')) {
            this.password = await bcrypt.hash(this.password, 10);
            console.log(`Password hashed for pending request ID ${this.id}`);
        }
        if (this.salary && !this.hourlyRate) {
            // DOLE: 8-hour workday, 22 days/month
            this.hourlyRate = this.salary / (8 * 22);
            console.log(`Hourly rate calculated for ID ${this.id}: ${this.hourlyRate}`);
        }
        next();
    } catch (error) {
        console.error(`Error in pre-save hook for ID ${this.id}:`, error);
        next(error);
    }
});

// Indexes for efficient querying
// pendingRequestSchema.index({ id: 1 });
// pendingRequestSchema.index({ empNo: 1 });
// pendingRequestSchema.index({ username: 1 });
// pendingRequestSchema.index({ email: 1 }); // Added for uniqueness check
// pendingRequestSchema.index({ status: 1 }); // Added for filtering pending requests

module.exports = mongoose.model('PendingRequest', pendingRequestSchema);