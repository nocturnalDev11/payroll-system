<<<<<<< HEAD
const mongoose = require('mongoose');

const payHeadSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['Earnings', 'Deductions'], required: true }
});

module.exports = mongoose.model('PayHead', payHeadSchema); 
=======
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const payHeadSchema = new Schema({
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: false
    },
    name: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    type: {
        type: String,
        enum: [
            'Earnings',
            'Deductions'
        ],
        required: true
    }
});

export const PayHead = model('PayHead', payHeadSchema);
>>>>>>> 1f11dc9ba438c5cafca5d796ee1ee2768319b69a
