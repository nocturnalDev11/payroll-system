const express = require('express');
const {
    loginAdmin,
    forgotPassword,
    resetPassword
} = require('../controllers/admin/auth/adminAuth.controller');

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
