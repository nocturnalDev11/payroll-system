import mongoose from 'mongoose'

export default async () => {
    try {
        const connect = await mongoose.connect(process.env.COMPASS_URI);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
};
