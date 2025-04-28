const express = require('express');
const router = express.Router();
const { recordPosition, getPositionHistory, updatePositionHistory } = require('../controllers/employee/positionHistory.controller');

const isAdmin = (req, res, next) => {
    const userRole = req.headers['user-role'];
    if (!userRole || userRole.toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

router.post('/record', isAdmin, recordPosition);
router.get('/:employeeId', isAdmin, getPositionHistory);
router.put('/update/:employeeId', isAdmin, updatePositionHistory);

module.exports = router;