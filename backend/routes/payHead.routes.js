const express = require('express');
const router = express.Router();
const { getPayHeads, createPayHead, updatePayHead, deletePayHead } = require('../controllers/employee/payHead.controller.js');
const { verifyToken, restrictToAdmin } = require('../middlewares/authMiddleware.js');

const isAdmin = restrictToAdmin;

router.get('/', verifyToken, getPayHeads);
router.post('/', verifyToken, isAdmin, createPayHead);
router.put('/:id', verifyToken, isAdmin, updatePayHead);
router.delete('/:id', verifyToken, isAdmin, deletePayHead);

module.exports = router;