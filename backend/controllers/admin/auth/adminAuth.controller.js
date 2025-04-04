const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Admin = require('../../../models/admin.model.js');

function generateAdminToken(adminId) {
    return jwt.sign({ adminId }, process.env.JWT_SECRET, { expiresIn: '1800s' });
}

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Email transporter verification failed in adminAuth.controller.js:', error);
    } else {
        console.log('Email transporter is ready in adminAuth.controller.js');
    }
});

exports.loginAdmin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) {
        res.status(401).json({ message: 'Unauthorized: Invalid username' });
        return;
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
        res.status(401).json({ message: 'Unauthorized: Invalid password' });
        return;
    }

    const token = generateAdminToken(admin._id);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
        id: admin._id,
        username: admin.username,
        email: admin.email,
        token,
    });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;

        console.log('Forgot password request received:', { email });

        const trimmedEmail = email?.trim();
        if (!trimmedEmail) {
            console.log('Missing email');
            return res.status(400).json({ error: 'Email is required' });
        }

        console.log('Searching for admin with email:', trimmedEmail);
        const admin = await Admin.findOne({ email: trimmedEmail });
        if (!admin) {
            console.log('Admin not found:', trimmedEmail);
            return res.status(404).json({ error: 'Email not found' });
        }

        console.log('Admin found:', { id: admin.id, email: admin.email });

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetToken = crypto.randomBytes(20).toString('hex');

        console.log('Generated reset details:', { verificationCode, resetToken });

        admin.resetToken = resetToken;
        admin.verificationCode = verificationCode;
        admin.resetTokenExpires = Date.now() + 3600000;
        await admin.save();

        console.log('Admin updated with reset details:', { id: admin.id, email: admin.email });

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

exports.resetPassword = asyncHandler(async (req, res) => {
    const { email, resetToken, verificationCode, newPassword } = req.body;

    const trimmedEmail = email?.trim();
    const trimmedResetToken = resetToken?.trim();
    const trimmedVerificationCode = verificationCode?.trim();
    const trimmedNewPassword = newPassword?.trim();

    if (!trimmedEmail || !trimmedResetToken || !trimmedVerificationCode || !trimmedNewPassword) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const employee = await Employee.findOne({
        email: trimmedEmail,
        resetToken: trimmedResetToken
    });

    if (!employee) {
        return res.status(400).json({ error: 'Invalid reset token' });
    }

    if (employee.verificationCode !== trimmedVerificationCode) {
        return res.status(400).json({ error: 'Invalid verification code' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(trimmedNewPassword, salt);

    employee.password = hashedPassword;
    employee.resetToken = undefined;
    employee.verificationCode = undefined;
    employee.resetTokenExpires = undefined;
    await employee.save();

    res.status(200).json({ message: 'Password reset successful' });
});