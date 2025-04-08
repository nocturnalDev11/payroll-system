const express = require('express');
const {
    loginAdmin,
    forgotPassword,
    resetPassword
} = require('../controllers/admin/auth/adminAuth.controller');

const {
    getAdminSettings,
    updateAdminSettings
} = require('../controllers/admin/adminSettings.controller');

const { restrictToAdmin } = require('../middlewares/authMiddleware.js');

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/:id', restrictToAdmin, getAdminSettings);
router.put('/update/:id', restrictToAdmin, updateAdminSettings);

module.exports = router;
