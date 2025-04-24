const express = require('express');
const router = express.Router();
const positionController = require('../controllers/employee/position.controller.js');

// Middleware to check admin role
const checkAdmin = (req, res, next) => {
    if (req.headers['user-role'] !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

router.get('/', positionController.getPositions);
router.post('/', checkAdmin, positionController.createPosition);
router.put('/:id', checkAdmin, positionController.updatePosition);
router.delete('/:id', checkAdmin, positionController.deletePosition);

module.exports = router;