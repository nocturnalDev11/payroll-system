const jwt = require('jsonwebtoken');
const Admin = require('../models/admin.model.js');
const Employee = require('../models/employee.model.js');

// Base token verification middleware
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);

        if (decoded.adminId) {
            const admin = await Admin.findById(decoded.adminId).select('_id');
            if (!admin) {
                return res.status(403).json({ error: 'Admin not found or unauthorized' });
            }
            req.adminId = admin._id;
            req.role = 'admin';
        } else if (decoded.employeeId) {
            const employee = await Employee.findById(decoded.employeeId).select('_id');
            if (!employee) {
                return res.status(403).json({ error: 'Employee not found or unauthorized' });
            }
            req.employeeId = employee._id;
            req.role = 'employee';
        } else {
            return res.status(403).json({ error: 'Invalid token: No adminId or employeeId found' });
        }

        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Restrict to admin only
const restrictToAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded admin token:', decoded);

        if (!decoded.adminId) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const admin = await Admin.findById(decoded.adminId).select('_id');
        if (!admin) {
            return res.status(403).json({ error: 'Admin not found or unauthorized' });
        }

        req.adminId = admin._id;
        req.role = 'admin';
        next();
    } catch (error) {
        console.error('Admin token verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid or expired admin token' });
    }
};

// Restrict to employee only
const restrictToEmployee = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded employee token:', decoded);

        if (!decoded.employeeId) {
            return res.status(403).json({ error: 'Employee access required' });
        }

        const employee = await Employee.findById(decoded.employeeId).select('_id');
        if (!employee) {
            return res.status(403).json({ error: 'Employee not found or unauthorized' });
        }

        req.employeeId = employee._id;
        req.role = 'employee';
        next();
    } catch (error) {
        console.error('Employee token verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid or expired employee token' });
    }
};

module.exports = {
    verifyToken,
    restrictToAdmin,
    restrictToEmployee,
};
