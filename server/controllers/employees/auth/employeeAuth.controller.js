import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Employee } from '../../../models/employee.model.js'; // Assuming correct path

function generateToken(employeeId) {
    return jwt.sign({ employeeId }, process.env.JWT_SECRET, { expiresIn: '1800s' });
}

export const registerEmployee = asyncHandler(async (req, res) => {
    const {
        firstName, middleName, lastName, username, email, password, employeeIdNumber,
        birthday, hireDate, contactInfo, civilStatus, position,
        salary, sss, philHealth, pagIbig, role
    } = req.body;

    // Check required fields per the model
    if (!firstName || !lastName || !username || !email || !password || !employeeIdNumber || !salary) {
        res.status(400).json({ error: 'Required fields are missing' });
        return;
    }

    // Check for existing employee
    const existingEmployee = await Employee.exists({ 
        $or: [
            { username: { $regex: username, $options: 'i' } },
            { email },
            { employeeIdNumber }
        ]
    });
    
    if (existingEmployee) {
        res.status(409).json({ error: 'Username, email, or employee ID already in use' });
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Hashed password:', hashedPassword);

    const employee = await Employee.create({
        firstName,
        middleName,
        lastName,
        username,
        email,
        password: hashedPassword,
        employeeIdNumber,
        birthday: birthday || null,
        hireDate: hireDate || null,
        contactInfo: contactInfo || null,
        civilStatus: civilStatus || null,
        position: position || null,
        salary,
        sss: sss || '',
        philHealth: philHealth || '',
        pagIbig: pagIbig || '',
        tin: '',
        earnings: {
            travelExpenses: 0,
            otherEarnings: 0
        },
        payHeads: [],
        role: role || 'employee',
        status: 'pending'
    });

    const token = generateToken(employee._id);
  
    res.status(201).json({
        message: 'Registration submitted for approval',
        employee: {
            id: employee._id,
            firstName: employee.firstName,
            middleName: employee.middleName,
            lastName: employee.lastName,
            username: employee.username,
            email: employee.email,
            employeeIdNumber: employee.employeeIdNumber,
            position: employee.position,
            salary: employee.salary,
            status: employee.status
        },
        token
    });
});

export const loginEmployee = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find the employee by email
    const employee = await Employee.findOne({ email });
    if (!employee) {
        res.status(401).json({ message: 'Unauthorized: Email not found' });
        return;
    }

    // Check if the password is valid
    const isValid = await bcrypt.compare(password, employee.password);
    if (!isValid) {
        res.status(401).json({ message: 'Unauthorized: Incorrect password' });
        return;
    }
    
    // Check the employee's status
    if (employee.status === 'pending') {
        res.status(403).json({ message: 'Account awaiting approval. Please wait for admin approval.' });
        return;
    }
    if (employee.status === 'rejected') {
        res.status(403).json({ message: 'Account request was rejected. Contact the administrator.' });
        return;
    }

    // If status is 'approved', proceed with login
    const token = generateToken(employee._id);

    res.status(200).json({
        message: 'Login successful',
        employee: {
            id: employee._id,
            firstName: employee.firstName,
            middleName: employee.middleName,
            lastName: employee.lastName,
            username: employee.username,
            email: employee.email,
            employeeIdNumber: employee.employeeIdNumber,
            birthday: employee.birthday,
            hireDate: employee.hireDate,
            contactInfo: employee.contactInfo,
            civilStatus: employee.civilStatus,
            position: employee.position,
            salary: employee.salary,
            sss: employee.sss,
            philHealth: employee.philHealth,
            pagIbig: employee.pagIbig,
            role: employee.role
        },
        token
    });
});

export const pendingRequest = asyncHandler(async (req, res) => {
    const { name, positionApplied, salary, email, contactNumber, password } = req.body;

    // Check required fields (adjusted for pending request context)
    if (!name || !positionApplied || !salary || !email || !contactNumber || !password) {
        res.status(400).json({ error: 'Required fields are missing' });
        return;
    }

    // Split name into firstName and lastName (assuming "name" is full name)
    const [firstName, ...lastNameParts] = name.trim().split(' ');
    const lastName = lastNameParts.join(' ') || 'Unknown'; // Fallback if no lastName

    // Generate a temporary username (could be refined based on your needs)
    const username = email.split('@')[0]; // Simple username from email

    // Check for existing employee
    const existingEmployee = await Employee.exists({ 
        $or: [
            { username: { $regex: username, $options: 'i' } },
            { email }
        ]
    });
    
    if (existingEmployee) {
        res.status(409).json({ error: 'Username or email already in use' });
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const employee = await Employee.create({
        firstName,
        middleName,
        lastName,
        username,
        email,
        password: hashedPassword,
        employeeIdNumber: `TEMP-${Date.now()}`, // Temporary ID until approved
        position: positionApplied,             // Map positionApplied to position
        salary,
        contactInfo: contactNumber,            // Map contactNumber to contactInfo
        sss: '',
        philHealth: '',
        pagIbig: '',
        tin: '',
        earnings: {
            travelExpenses: 0,
            otherEarnings: 0
        },
        payHeads: [],
        role: 'employee',
        status: 'pending'                      // Set as pending per the model
    });

    const token = generateToken(employee._id);

    res.status(201).json({
        message: 'Pending request submitted successfully',
        employee: {
            id: employee._id,
            firstName: employee.firstName,
            middleName: employee.middleName,
            lastName: employee.lastName,
            username: employee.username,
            email: employee.email,
            employeeIdNumber: employee.employeeIdNumber,
            position: employee.position,
            salary: employee.salary,
            contactInfo: employee.contactInfo,
            status: employee.status
        },
        token
    });
});