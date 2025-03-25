import express from 'express';
import {
    getAllLeaveRequests,
    getLeaveRequestsByEmployee,
    createLeaveRequest,
    approveLeaveRequest,
    disapproveLeaveRequest,
    deleteLeaveRequest
} from '../controllers/employees/leaveRequest.controller.js';
import { verifyEmployeeToken } from '../middleware/employeeAuth.js';

const router = express.Router();

router.get('/all', getAllLeaveRequests);
router.get('/employee/:id', verifyEmployeeToken, getLeaveRequestsByEmployee);
router.post('/', verifyEmployeeToken, createLeaveRequest);
router.put('/:id/approve', approveLeaveRequest);
router.put('/:id/disapprove', disapproveLeaveRequest);
router.delete('/:id', deleteLeaveRequest);

export default router;