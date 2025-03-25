const mongoose = require('mongoose');

const payHeadSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['Earnings', 'Deductions'], required: true }
});

module.exports = mongoose.model('PayHead', payHeadSchema); 