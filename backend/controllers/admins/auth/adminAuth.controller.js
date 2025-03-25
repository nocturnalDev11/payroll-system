import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Admin } from '../../../models/admin.model.js';

function generateAdminToken(adminId) {
    return jwt.sign({ adminId }, process.env.JWT_SECRET, { expiresIn: '1800s' });
}

export const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const token = generateAdminToken(admin._id);

    res.status(200).json({
        id: admin._id,
        username: admin.username,
        email: admin.email,
        token,
    });
});
