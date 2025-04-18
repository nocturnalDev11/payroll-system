const asyncHandler = require('express-async-handler');
const LeaveRequest = require('../../models/leaveRequest.model.js');
const Employee = require('../../models/employee.model.js');
const moment = require('moment');

// Get all leave requests
exports.getAllLeaveRequests = asyncHandler(async (req, res) => {
    if (!LeaveRequest) throw new Error('LeaveRequest model is not initialized');
    const requests = await LeaveRequest.find().populate('employeeId', 'firstName lastName');

    const formattedRequests = requests.map(req => ({
        ...req._doc,
        employeeName: req.employeeId ? `${req.employeeId.firstName} ${req.employeeId.lastName}` : 'Unknown',
    }));
    
    res.status(200).json(formattedRequests);
});

// Get leave requests by employee ID
exports.getLeaveRequestsByEmployee = asyncHandler(async (req, res) => {
    if (!LeaveRequest) throw new Error('LeaveRequest model is not initialized');
    const requests = await LeaveRequest.find({ employeeId: req.params.id })
        .populate('employeeId', 'firstName lastName email employeeIdNumber');

    const formattedRequests = requests.map(req => ({
        ...req._doc,
        employeeName: req.employeeId ? `${req.employeeId.firstName} ${req.employeeId.lastName}` : 'Unknown',
    }));

    res.status(200).json(formattedRequests);
});

// Create a new leave request
exports.createLeaveRequest = asyncHandler(async (req, res) => {
    const { startDate, endDate, reason } = req.body;
    const employeeId = req.employeeId;

    const start = moment(startDate);
    const end = moment(endDate);
    if (!start.isValid() || !end.isValid()) return res.status(400).json({ message: 'Invalid date format' });
    if (end.isBefore(start)) return res.status(400).json({ message: 'End date cannot be before start date' });

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const leaveRequest = new LeaveRequest({
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        reason,
        status: 'Pending'
    });

    const savedRequest = await leaveRequest.save();
    res.status(201).json({ _id: savedRequest._id.toString(), ...savedRequest._doc });
});

// Approve a leave request
exports.approveLeaveRequest = asyncHandler(async (req, res) => {
    if (!LeaveRequest) throw new Error('LeaveRequest model is not initialized');
    const request = await LeaveRequest.findByIdAndUpdate(
        req.params.id,
        { status: 'Approved' },
        { new: true }
    );
    if (!request) {
        return res.status(404).json({ message: 'Leave request not found' });
    }
    res.status(200).json({ success: true, updatedRequest: request });
});

// Disapprove a leave request
exports.disapproveLeaveRequest = asyncHandler(async (req, res) => {
    if (!LeaveRequest) throw new Error('LeaveRequest model is not initialized');
    const request = await LeaveRequest.findByIdAndUpdate(
        req.params.id,
        { status: 'Disapproved' },
        { new: true }
    );
    if (!request) {
        return res.status(404).json({ message: 'Leave request not found' });
    }
    res.status(200).json({ success: true, updatedRequest: request });
});

// Delete a leave request
exports.deleteLeaveRequest = asyncHandler(async (req, res) => {
    if (!LeaveRequest) throw new Error('LeaveRequest model is not initialized');
    const result = await LeaveRequest.findByIdAndDelete(req.params.id);
    if (!result) {
        return res.status(404).json({ message: 'Leave request not found' });
    }
    res.status(204).send();
});