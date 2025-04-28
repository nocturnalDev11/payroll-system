const express = require('express');
const router = express.Router();
const { getEmployeeRecords, generateEmployeeRecord } = require('../controllers/employee/employeeRecords.controller.js');

const isSelfOrAdmin = (req, res, next) => {
    const userRole = req.headers['user-role'];
    const userId = req.headers['user-id'];
    const requestedId = parseInt(req.params.id);

    if (!userId) {
        return res.status(401).json({ error: 'User ID not provided in headers' });
    }

    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
        return res.status(400).json({ error: 'Invalid user ID in headers' });
    }

    if (userRole && userRole.toLowerCase() === 'admin') {
        return next();
    }

    if (parsedUserId === requestedId) {
        return next();
    }

    return res.status(403).json({ error: 'Access denied: You can only view your own records or need admin access' });
};

router.get('/:id', isSelfOrAdmin, getEmployeeRecords);
router.post('/generate', isSelfOrAdmin, generateEmployeeRecord);

module.exports = router;