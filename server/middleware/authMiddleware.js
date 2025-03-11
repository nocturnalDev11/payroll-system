import jwt from 'jsonwebtoken';
import { Employee } from '../models/employee.model.js';
import { Admin } from '../models/admin.model.js';

export const verifyAuthToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.employeeId) {
            const employee = await Employee.findById(decoded.employeeId).select('_id');
            if (!employee) {
                return res.status(403).json({ error: 'Employee not found or unauthorized' });
            }
            req.employeeId = employee._id;
            req.role = 'employee';
        } else if (decoded.adminId) {
            const admin = await Admin.findById(decoded.adminId).select('_id');
            if (!admin) {
                return res.status(403).json({ error: 'Admin not found or unauthorized' });
            }
            req.adminId = admin._id;
            req.role = 'admin';
        } else {
            return res.status(403).json({ error: 'Invalid token: No employeeId or adminId found' });
        }

        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const verifyAdminOnly = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.adminId) {
            const admin = await Admin.findById(decoded.adminId).select('_id');
            if (!admin) {
                return res.status(403).json({ error: 'Admin access required' });
            }
            req.adminId = admin._id;
            req.role = 'admin';
            next();
        } else {
            return res.status(403).json({ error: 'Admin access required' });
        }
    } catch (error) {
        console.error('Admin token verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid or expired admin token' });
    }
};

export const verifyEmployeeOnly = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.employeeId) {
            const employee = await Employee.findById(decoded.employeeId).select('_id');
            if (!employee) {
                return res.status(403).json({ error: 'Employee not found or unauthorized' });
            }
            req.employeeId = employee._id;
            req.role = 'employee';
            next();
        } else {
            return res.status(403).json({ error: 'Employee access required' });
        }
    } catch (error) {
        console.error('Employee token verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid or expired employee token' });
    }
};