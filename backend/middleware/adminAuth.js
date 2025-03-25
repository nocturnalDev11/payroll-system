import jwt from 'jsonwebtoken';
import { Admin } from '../models/admin.model.js';

export const verifyAdminToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token not provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const admin = await Admin.findById(decoded.adminId);
        if (!admin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.adminId = admin._id;
        next();
    });
};
