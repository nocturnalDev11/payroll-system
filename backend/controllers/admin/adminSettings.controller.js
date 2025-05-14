const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../../models/admin.model.js');

exports.getAdminSettings = asyncHandler(async (req, res) => {
    const adminId = req.adminId;
    try {
        const admin = await Admin.findById(adminId).select('-password');
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        res.status(200).json(admin);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

exports.updateAdminSettings = asyncHandler(async (req, res) => {
    const adminId = req.adminId;
    const { name, email, password } = req.body;

    try {
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (name) admin.name = name;

        if (email) {
            const existingAdmin = await Admin.findOne({ email });
            if (existingAdmin && existingAdmin._id.toString() !== adminId) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            admin.email = email;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(password, salt);
        }

        await admin.save();
        res.status(200).json({ message: 'Admin settings updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
