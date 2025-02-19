import asyncHandler from 'express-async-handler'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Employee } from '../../models/employee.model.js'

function generateToken(employeeId) {
    return jwt.sign({ employeeId }, process.env.JWT_SECRET, { expiresIn: '1800s' });
}

export const loginEmployee = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // ✅ Fix incorrect model name (Employee, not User)
    const employee = await Employee.findOne({ email });
    if (!employee) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const isValid = await bcrypt.compare(password, employee.password);
    if (!isValid) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const token = generateToken(employee._id);

    const employeeObj = employee.toObject();
    res.status(200).json({
        id: employeeObj._id,
        username: employeeObj.username,
        email: employeeObj.email,
        token
    });
});

export const registerEmployee = asyncHandler(async (req, res) => {
    const {
        name, username, email, password,
        birthday, hireDate, contactInfo, civilStatus,
        sss, philHealth, hdmf, role
    } = req.body;  // ✅ Make sure to destructure all fields

    // ✅ Only check required fields (optional ones are ignored)
    if (!name || !username || !email || !password) {
        res.status(400).json({ error: 'Required fields are missing' });
        return;
    }

    // ✅ Use correct model name (Employee, not User)
    const existingEmployee = await Employee.exists({ username: { $regex: username, $options: 'i' }});
    if (existingEmployee) {
        res.status(409).json({ error: 'Username already taken' });
        return;
    }

    const existingEmail = await Employee.exists({ email });
    if (existingEmail) {
        res.status(409).json({ error: 'Email already in use' });
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ Create employee with nullable fields (Mongoose will store `null` if missing)
    const employee = await Employee.create({
        name, username, email,
        password: hashedPassword,
        birthday: birthday || null,
        hireDate: hireDate || null,
        contactInfo: contactInfo || null,
        civilStatus: civilStatus || null,
        sss: sss || null,
        philHealth: philHealth || null,
        hdmf: hdmf || null,
        role: role || 'employee',
    });

    res.status(201).json({ message: 'Successfully registered' });
});
