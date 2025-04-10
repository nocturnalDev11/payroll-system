const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/database');
const Position = require('../models/position.model.js');

dotenv.config();

const positionData = [
    {
        name: 'Software Engineer',
        salary: 30000,
    },
    {
        name: 'Junior Developer',
        salary: 20000,
    },
    {
        name: 'Mid-Level Developer',
        salary: 25000,
    },
    {
        name: 'Project Manager',
        salary: 80000,
    },
    {
        name: 'HR Specialist',
        salary: 30000,
    },
    {
        name: 'System Administrator',
        salary: 25000,
    },
];

const seedPositions = async () => {
    try {
        await connectDB();

        const existingPositions = await Position.countDocuments();
        if (existingPositions > 0) {
            await Position.deleteMany({});
            console.log('Existing positions cleared.');
        }

        const positions = await Position.insertMany(positionData);
        console.log('Positions seeded successfully:', positions);
    } catch (error) {
        console.error('Error seeding positions:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
        process.exit(0);
    }
};

seedPositions();
