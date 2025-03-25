const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../../../models/admin.model.js');

function generateAdminToken(adminId) {
    return jwt.sign({ adminId }, process.env.JWT_SECRET, { expiresIn: '1800s' });
}

const loginAdmin = asyncHandler(async (req, res) => {
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

    res.status(200).json({
        id: admin._id,
        username: admin.username,
        email: admin.email,
        token,
    });
});

module.exports = { loginAdmin };

