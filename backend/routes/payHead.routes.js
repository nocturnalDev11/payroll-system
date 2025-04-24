const express = require('express');
const router = express.Router();
const { getPayHeads, createPayHead, updatePayHead, deletePayHead } = require('../controllers/employee/payHead.controller.js');

const isAdmin = (req, res, next) => {
    const userRole = req.headers['user-role'] || 'employee';
    if (userRole.toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

router.get('/', isAdmin, getPayHeads);
router.post('/', isAdmin, createPayHead);
router.put('/:id', isAdmin, updatePayHead);
router.delete('/:id', isAdmin, deletePayHead);

module.exports = router;