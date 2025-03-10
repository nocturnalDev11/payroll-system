import jwt from 'jsonwebtoken';
import { Employee } from '../models/employee.model.js';

export const verifyEmployeeToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token not provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        console.log('Decoded token:', decoded);
        const employee = await Employee.findById(decoded.employeeId);
        if (!employee) {
            return res.status(403).json({ error: 'Employee access required' });
        }

        req.employeeId = employee._id;
        next();
    });
};