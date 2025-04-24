const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware.js');
const { getPayslips, generatePayslip, deletePayslip } = require('../controllers/employee/paySlip.controller.js');

router.get('/:employeeId', verifyToken, getPayslips);
router.post('/generate', verifyToken, generatePayslip);
router.delete('/:employeeId/:salaryMonth/:paydayType', verifyToken, deletePayslip);

module.exports = router;