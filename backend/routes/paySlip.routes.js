import express from 'express';
import { generatePayslip, sendPayslipEmail } from '../controllers/employees/paySlip.controller.js';

const router = express.Router();

// Unprotected routes - no middleware
router.post('/generate', generatePayslip);
router.post('/send-email', sendPayslipEmail);

// Optionally keep admin-specific routes if needed later
// router.post('/admin/generate', verifyAdminToken, generatePayslip);
// router.post('/admin/send-email', verifyAdminToken, sendPayslipEmail);

export default router;