const mongoose = require('mongoose');

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        console.log('MongoDB already connected');
        return;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        throw error;
    }
};

module.exports = connectDB;