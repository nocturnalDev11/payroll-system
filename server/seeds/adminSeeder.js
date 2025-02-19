import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { Admin } from '../models/admin.model.js';
import connectDB from '../config/db.js';

(async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Check if an admin already exists
        const existingAdmin = await Admin.findOne({ email: 'admin@example.com' });
        if (existingAdmin) {
            console.log('Admin user already exists.');
            mongoose.connection.close();
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('Admin123!', 10);

        // Create admin
        const admin = new Admin({
            name: 'Admin User',
            username: 'admin',
            email: 'admin@example.com',
            password: hashedPassword,
        });

        await admin.save();
        console.log('Admin user seeded successfully.');
    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        mongoose.connection.close();
    }
})();