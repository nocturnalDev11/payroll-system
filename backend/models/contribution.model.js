const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
    employeeId: {
        type: Number,
        required: true,
         // Reference the Employee model
        ref: 'Employee',
    },
    salaryMonth: {
         // Format: YYYY-MM (e.g., "2025-03")
        type: String,
        required: true,
    },
    taxes: [
        {
            // e.g., "Pag-IBIG", "SSS", "PhilHealth"
            name: {
                type: String,
                required: true,
                 // Restrict to allowed contribution types
                enum: ['Pag-IBIG', 'SSS', 'PhilHealth'],
            },
            amount: {
                type: Number,
                required: true,
                min: 0,
            },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

contributionSchema.index({ employeeId: 1, salaryMonth: 1 }, { unique: true }); // Prevent duplicate contributions for the same employee and period

module.exports = mongoose.model('Contribution', contributionSchema);