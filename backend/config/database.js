const mongoose = require('mongoose');

const MONGO_URI = process.env.USE_ATLAS === 'true' 
    ? process.env.MONGO_URI_ATLAS 
    : process.env.MONGO_URI_COMPASS;

console.log('USE_ATLAS:', process.env.USE_ATLAS);
console.log('MONGO_URI:', MONGO_URI);

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`MongoDB connected successfully to ${MONGO_URI.includes('mongodb+srv') ? 'Atlas' : 'Compass'}`);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;