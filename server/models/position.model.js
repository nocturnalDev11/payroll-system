import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const positionSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    salary: {
        type: Number,
        required: true,
        min: 0,
        // unique: true, // Uncomment if salary should be unique per position
    },
    description: { type: String, default: '' },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const Position = model('Position', positionSchema);