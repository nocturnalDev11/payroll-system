import mongoose from 'mongoose';

const COMPASS_URI = process.env.COMPASS_URI || "mongodb://localhost:27017/payroll-system";

export default async () => {
    try {
        const connect = await mongoose.connect(COMPASS_URI);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
};
