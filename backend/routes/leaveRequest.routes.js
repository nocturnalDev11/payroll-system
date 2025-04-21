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
    restrictToEmployee 
} = require('../middlewares/authMiddleware.js');

const router = express.Router();

router.get('/all', getAllLeaveRequests);
router.get('/employee/:id', restrictToEmployee, getLeaveRequestsByEmployee);
router.post('/', restrictToEmployee, createLeaveRequest);
router.put('/:id/approve', approveLeaveRequest);
router.put('/:id/disapprove', disapproveLeaveRequest);
router.delete('/:id', deleteLeaveRequest);
router.put('/:id', restrictToEmployee, updateLeaveRequest);

module.exports = router;