const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Employee = require('../../../models/employee.model.js');

function generateToken(employeeId) {
    return jwt.sign({ employeeId }, process.env.JWT_SECRET, { expiresIn: '1800s' });
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Email transporter verification failed in auth.js:', error);
    } else {
        console.log('Email transporter is ready in employeeAuth.controller.js');
    }
});

const registerEmployee = asyncHandler(async (req, res) => {
    const {
        employeeIdNumber, username, password, firstName, middleName, lastName, email,
        contactInfo, civilStatus, position, salary, sss, philhealth, pagibig, tin,
        hireDate, role, status,
    } = req.body;

    if (!employeeIdNumber || !firstName || !lastName || !username || !email || !password || !position || !salary || !contactInfo || !hireDate) {
        res.status(400).json({ error: 'Required fields are missing' });
        return;
    }

    const existingEmployee = await Employee.exists({
        $or: [
            { username: { $regex: username, $options: 'i' } },
            { email },
            { employeeIdNumber },
        ],
    });

    if (existingEmployee) {
        res.status(409).json({ error: 'Username, email, or employee ID already in use' });
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const lastEmployee = await Employee.findOne().sort({ id: -1 });
    const newId = lastEmployee ? lastEmployee.id + 1 : 1;

    const employee = await Employee.create({
        id: newId,
        empNo: employeeIdNumber,
        firstName,
        middleName: middleName || '',
        lastName,
        username,
        email,
        password: hashedPassword,
        position,
        salary,
        contactInfo,
        civilStatus: civilStatus || 'Single',
        sss: sss || '',
        philhealth: philhealth || '',
        pagibig: pagibig || '',
        tin: tin || '',
        hireDate,
        role: role || 'employee',
        status: status || 'pending',
    });

    const token = generateToken(employee._id);

    res.status(201).json({
        message: 'Registration submitted for approval',
        employee: {
            id: employee._id,
            employeeIdNumber: employee.empNo,
            firstName: employee.firstName,
            middleName: employee.middleName,
            lastName: employee.lastName,
            username: employee.username,
            email: employee.email,
            position: employee.position,
            salary: employee.salary,
            contactInfo: employee.contactInfo,
            civilStatus: employee.civilStatus,
            sss: employee.sss,
            philhealth: employee.philhealth,
            pagibig: employee.pagibig,
            tin: employee.tin,
            hireDate: employee.hireDate,
            role: employee.role,
            status: employee.status,
        },
        token,
    });
});

const loginEmployee = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const employee = await Employee.findOne({ username });
    if (!employee) {
        res.status(401).json({ message: 'Unauthorized: Username not found' });
        return;
    }

    const isValid = await bcrypt.compare(password, employee.password);
    if (!isValid) {
        res.status(401).json({ message: 'Unauthorized: Incorrect password' });
        return;
    }
    
    if (employee.status === 'pending') {
        res.status(403).json({ message: 'Account awaiting approval. Please wait for admin approval.' });
        return;
    }
    if (employee.status === 'rejected') {
        res.status(403).json({ message: 'Account request was rejected. Contact the administrator.' });
        return;
    }

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
            empNo: employee.empNo,
            birthday: employee.birthday,
            hireDate: employee.hireDate,
            contactInfo: employee.contactInfo,
            civilStatus: employee.civilStatus,
            position: employee.position,
            salary: employee.salary,
            sss: employee.sss,
            philhealth: employee.philHealth,
            pagibig: employee.pagIbig,
            role: employee.role
        },
        token
    });
});

const pendingRequest = asyncHandler(async (req, res) => {
    const { name, positionApplied, salary, email, contactInfo, password } = req.body;

    if (!name || !positionApplied || !salary || !email || !contactInfo || !password) {
        res.status(400).json({ error: 'Required fields are missing' });
        return;
    }

    const [firstName, ...lastNameParts] = name.trim().split(' ');
    const lastName = lastNameParts.join(' ') || 'Unknown';

    const username = email.split('@')[0];

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

    const lastEmployee = await Employee.findOne().sort({ id: -1 });
    const newId = lastEmployee ? lastEmployee.id + 1 : 1;

    const employee = await Employee.create({
        id: newId,
        firstName,
        middleName: '',
        lastName,
        username,
        email,
        password: hashedPassword,
        empNo: `TEMP-${Date.now()}`,
        position: positionApplied,
        salary,
        contactInfo: contactInfo,
        sss: '',
        philhealth: '',
        pagibig: '',
        tin: '',
        earnings: {
            travelExpenses: 0,
            otherEarnings: 0
        },
        payheads: [],
        role: 'employee',
        status: 'pending'
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
            empNo: employee.empNo,
            position: employee.position,
            salary: employee.salary,
            contactInfo: employee.contactInfo,
            status: employee.status
        },
        token
    });
});

const getPendingEmployees = asyncHandler(async (req, res) => {
    try {
        const isAdmin = req.role === 'admin';
        const selectFields = isAdmin ? '' : '-password';
        const pending = await Employee.find({ status: 'pending' }).select(selectFields);
        res.status(200).json(pending);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending employees', error: error.message });
    }
});

const forgotPassword = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;

        console.log('Forgot password request received:', { email });

        const trimmedEmail = email?.trim();
        if (!trimmedEmail) {
            console.log('Missing email');
            return res.status(400).json({ error: 'Email is required' });
        }

        console.log('Searching for employee with email:', trimmedEmail);
        const employee = await Employee.findOne({ email: trimmedEmail });
        if (!employee) {
            console.log('Employee not found:', trimmedEmail);
            return res.status(404).json({ error: 'Email not found' });
        }

        console.log('Employee found:', { id: employee.id, email: employee.email });

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetToken = crypto.randomBytes(20).toString('hex');

        console.log('Generated reset details:', { verificationCode, resetToken });

        employee.resetToken = resetToken;
        employee.verificationCode = verificationCode;
        employee.resetTokenExpires = Date.now() + 3600000;
        await employee.save();

        console.log('Employee updated with reset details:', { id: employee.id, email: employee.email });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: trimmedEmail,
            subject: 'Password Reset Verification Code',
            text: `Your verification code is: ${verificationCode}\nThis code expires in 1 hour.`
        };

        console.log('Attempting to send email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject
        });

        await transporter.sendMail(mailOptions);
        console.log('Verification email sent successfully to:', trimmedEmail);

        res.status(200).json({ resetToken });
    } catch (error) {
        console.error('Forgot password error:', {
            message: error.message,
            stack: error.stack,
            requestBody: { email: req.body.email },
        });
        res.status(500).json({ error: 'Failed to send verification code', message: error.message });
    }
});

const resetPassword = asyncHandler(async (req, res) => {
    try {
        const { email, resetToken, verificationCode, newPassword } = req.body;

        console.log('Reset password request received:', { email, resetToken, verificationCode, newPassword: '[hidden]' });

        const trimmedEmail = email?.trim();
        const trimmedResetToken = resetToken?.trim();
        const trimmedVerificationCode = verificationCode?.trim();
        const trimmedNewPassword = newPassword?.trim();

        if (!trimmedEmail || !trimmedResetToken || !trimmedVerificationCode || !trimmedNewPassword) {
            console.log('Missing required fields');
            return res.status(400).json({ error: 'All fields are required' });
        }

        console.log('Searching for employee with reset details:', { email: trimmedEmail, resetToken: trimmedResetToken });
        const employee = await Employee.findOne({
            email: trimmedEmail,
            resetToken: trimmedResetToken,
            verificationCode: trimmedVerificationCode,
            resetTokenExpires: { $gt: Date.now() }
        });

        if (!employee) {
            console.log('Invalid or expired reset details:', { email: trimmedEmail });
            return res.status(400).json({ error: 'Invalid or expired verification code' });
        }

        console.log('Employee found for reset:', { id: employee.id, email: employee.email });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(trimmedNewPassword, salt);

        employee.password = hashedPassword;
        employee.resetToken = undefined;
        employee.verificationCode = undefined;
        employee.resetTokenExpires = undefined;
        await employee.save();

        console.log('Password reset successful for:', { id: employee.id, email: employee.email });

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', {
            message: error.message,
            stack: error.stack,
            requestBody: { email: req.body.email, resetToken: req.body.resetToken, verificationCode: req.body.verificationCode, newPassword: '[hidden]' },
        });
        res.status(500).json({ error: 'Password reset failed', message: error.message });
    }
});

module.exports = { registerEmployee, loginEmployee, forgotPassword, resetPassword, pendingRequest, getPendingEmployees };