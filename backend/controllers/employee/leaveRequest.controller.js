const asyncHandler = require('express-async-handler');
const LeaveRequest = require('../../models/leaveRequest.model.js');
const Employee = require('../../models/employee.model.js');
const moment = require('moment');

// Get all leave requests
exports.getAllLeaveRequests = asyncHandler(async (req, res) => {
    if (!LeaveRequest) throw new Error('LeaveRequest model is not initialized');
    const requests = await LeaveRequest.find().populate('employeeId', 'firstName lastName empNo');

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
        .populate('employeeId', 'firstName lastName email empNo');

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

// Update a leave request
exports.updateLeaveRequest = asyncHandler(async (req, res) => {
    if (!LeaveRequest) throw new Error('LeaveRequest model is not initialized');
    
    const { startDate, endDate, reason } = req.body;
    const employeeId = req.employeeId;
    const requestId = req.params.id;

    console.log('Token employeeId:', employeeId);

    if (!employeeId) {
        return res.status(401).json({ message: 'Employee ID not provided by middleware' });
    }

    // Validate dates
    const start = moment(startDate);
    const end = moment(endDate);
    if (!start.isValid() || !end.isValid()) return res.status(400).json({ message: 'Invalid date format' });
    if (end.isBefore(start)) return res.status(400).json({ message: 'End date cannot be before start date' });

    // Find the leave request
    const request = await LeaveRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Leave request not found' });

    console.log('Request employeeId:', request.employeeId.toString()); // Debug log

    // Check if the employee owns the request
    if (request.employeeId.toString() !== employeeId) {
        return res.status(403).json({ message: 'Unauthorized to update this request' });
    }

    // Update fields
    request.startDate = start.toISOString();
    request.endDate = end.toISOString();
    request.reason = reason;
    request.status = 'Pending';

    const updatedRequest = await request.save();
    res.status(200).json({ success: true, updatedRequest });
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
// Delete a leave request
exports.deleteLeaveRequest = asyncHandler(async (req, res) => {
    if (!LeaveRequest) throw new Error('LeaveRequest model is not initialized');
    
    const requestId = req.params.id;
    const employeeId = req.employeeId;
    const role = req.role;

    console.log('Delete request - employeeId:', employeeId, 'role:', role);

    // Find the leave request
    const request = await LeaveRequest.findById(requestId);
    if (!request) {
        return res.status(404).json({ message: 'Leave request not found' });
    }

    console.log('Request employeeId:', request.employeeId.toString());
    console.log('Request ID:', requestId);
    console.log('Comparing employeeId:', employeeId, 'with request.employeeId:', request.employeeId.toString());

    // Allow deletion if user is admin or the employee who owns the request
    const employeeIdStr = employeeId.toString ? employeeId.toString() : employeeId;
    if (role !== 'admin' && request.employeeId.toString() !== employeeIdStr) {
        console.log('Authorization failed:', {
            isAdmin: role === 'admin',
            employeeIdMatch: request.employeeId.toString() === employeeIdStr
        });
        return res.status(403).json({ message: 'Unauthorized to delete this request' });
    }

    await LeaveRequest.findByIdAndDelete(requestId);
    res.status(204).send();
});