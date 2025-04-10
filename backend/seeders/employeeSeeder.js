const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const connectDB = require('../config/database');
const Employee = require('../models/employee.model.js');
const Position = require('../models/position.model.js');

dotenv.config();

function generateEmpNo() {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000);
    return `EMP-${randomNum}`;
}

const employeeData = {
    id: 1,
    empNo: null,
    firstName: 'John',
    middleName: '',
    lastName: 'Doe',
    username: 'john123',
    email: 'john@example.com',
    password: 'admin123',
    salary: 30000,
    role: 'employee',
    contactInfo: '123-456-7890',
    hireDate: new Date('2020-01-15'),
    status: 'approved'
};

const seedEmployee = async () => {
    try {
        await connectDB();

        // Find or create position
        let position = await Position.findOne({ name: 'Software Engineer' });
        if (!position) {
            position = await new Position({
                name: 'Software Engineer',
                salary: 30000,
            }).save();
            console.log('Position created:', position);
        }

        // Ensure unique employee number
        let empNo;
        let isUnique = false;
        do {
            empNo = generateEmpNo();
            const existingEmployee = await Employee.findOne({ empNo });
            isUnique = !existingEmployee;
        } while (!isUnique);

        // Check if employee already exists
        const existingEmployeeByEmail = await Employee.findOne({ email: employeeData.email });
        if (existingEmployeeByEmail) {
            console.log('Employee already exists. Skipping seeding.');
            return;
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(employeeData.password, saltRounds);

        // Create position history with past positions
        const positionHistory = [
            {
                position: (await Position.findOne({ name: 'Junior Developer' }))._id,
                salary: 20000,
                startDate: new Date('2020-01-15'),
                endDate: new Date('2022-06-30'),
            },
            {
                position: (await Position.findOne({ name: 'Mid-Level Developer' }))._id,
                salary: 25000,
                startDate: new Date('2022-07-01'),
                endDate: new Date('2023-12-31'),
            },
            {
                position: position._id,
                salary: position.salary,
                startDate: new Date('2024-01-01'),
                endDate: null,
            },
        ];

        // Create new employee
        const employee = new Employee({
            id: employeeData.id,
            empNo: empNo,
            firstName: employeeData.firstName,
            middleName: employeeData.middleName,
            lastName: employeeData.lastName,
            username: employeeData.username,
            email: employeeData.email,
            password: hashedPassword,
            position: position.name,
            positionHistory: positionHistory,
            salary: employeeData.salary,
            role: employeeData.role,
            contactInfo: employeeData.contactInfo,
            hireDate: employeeData.hireDate,
        });

        await employee.save();
        console.log('Employee seeded successfully:', employee);
    } catch (error) {
        console.error('Error seeding employee:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
        process.exit(0);
    }
};

seedEmployee();
