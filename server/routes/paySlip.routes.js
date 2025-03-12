import express from 'express';
import { generatePayslip, sendPayslipEmail, getPayslipsByEmployeeId } from '../controllers/employees/paySlip.controller.js';

const router = express.Router();

router.post('/generate', generatePayslip);
router.post('/send-email', sendPayslipEmail);
router.get('/:employeeId', getPayslipsByEmployeeId);

export default router;