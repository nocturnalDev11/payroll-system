const express = require('express');
const {
    getAllLeaveRequests,
    getLeaveRequestsByEmployee,
    createLeaveRequest,
    approveLeaveRequest,
    disapproveLeaveRequest,
    deleteLeaveRequest,
    updateLeaveRequest
} = require('../controllers/employee/leaveRequest.controller.js');

const { 
    restrictToAdmin, 
    restrictToEmployee,
    verifyToken
} = require('../middlewares/authMiddleware.js');

const router = express.Router();

router.get('/all', getAllLeaveRequests);
router.delete('/:id', verifyToken, deleteLeaveRequest);
router.post('/', restrictToEmployee, createLeaveRequest);
router.put('/:id', restrictToEmployee, updateLeaveRequest);
router.get('/employee/:id', restrictToEmployee, getLeaveRequestsByEmployee);
router.put('/:id/approve', verifyToken, restrictToAdmin, approveLeaveRequest);
router.put('/:id/disapprove', verifyToken, restrictToAdmin, disapproveLeaveRequest);

module.exports = router;