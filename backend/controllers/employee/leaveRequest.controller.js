const asyncHandler = require('express-async-handler');
const LeaveRequest = require('../../models/leaveRequest.model.js');
const Employee = require('../../models/employee.model.js');
const Notification = require('../../models/notification.model.js');
const Admin = require('../../models/admin.model.js');
const moment = require('moment');

exports.getAllLeaveRequests = asyncHandler(async (req, res) => {
    if (!LeaveRequest) throw new Error('LeaveRequest model is not initialized');
    const requests = await LeaveRequest.find().populate('employeeId', 'firstName lastName empNo');

    const formattedRequests = requests.map(req => ({
        ...req._doc,
        employeeName: req.employeeId ? `${req.employeeId.firstName} ${req.employeeId.lastName}` : 'Unknown',
    }));
    
    res.status(200).json(formattedRequests);
});

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

exports.createLeaveRequest = asyncHandler(async (req, res) => {
    const { startDate, endDate, type, reason } = req.body;
    const employeeId = req.employeeId;

    const start = moment(startDate);
    const end = moment(endDate);

    if (!start.isValid() || !end.isValid()) return res.status(400).json({ message: 'Invalid date format' });
    if (end.isBefore(start)) return res.status(400).json({ message: 'End date cannot be before start date' });

    const validTypes = ['Vacation', 'Sick', 'Personal', 'Family', 'Bereavement', 'Maternal', 'Paternity'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ message: 'Invalid leave type' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const leaveRequest = new LeaveRequest({
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        type,
        reason,
        status: 'Pending'
    });

    const savedRequest = await leaveRequest.save();

    // Notify all admins
    const admins = await Admin.find();
    const notifications = admins.map(admin => ({
        recipientId: admin._id,
        recipientModel: 'Admin',
        senderId: employeeId,
        senderModel: 'Employee',
        type: 'LeaveRequest',
        message: `${employee.firstName} ${employee.lastName} submitted a ${type} leave request from ${start.format('MMM DD, YYYY')} to ${end.format('MMM DD, YYYY')}.`,
        relatedId: savedRequest._id,
        relatedModel: 'LeaveRequest',
    }));
    await Notification.insertMany(notifications);

    res.status(201).json({ _id: savedRequest._id.toString(), ...savedRequest._doc });
});

exports.updateLeaveRequest = asyncHandler(async (req, res) => {
    if (!LeaveRequest) throw new Error('LeaveRequest model is not initialized');
    
    const { startDate, endDate, type, reason } = req.body;
    const employeeId = req.employeeId;
    const requestId = req.params.id;

    if (!employeeId) {
        return res.status(401).json({ message: 'Employee ID not provided by middleware' });
    }

    const start = moment(startDate);
    const end = moment(endDate);

    if (!start.isValid() || !end.isValid()) return res.status(400).json({ message: 'Invalid date format' });
    if (end.isBefore(start)) return res.status(400).json({ message: 'End date cannot be before start date' });

    const validTypes = ['Vacation', 'Sick', 'Personal', 'Family', 'Bereavement', 'Maternal', 'Paternity'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ message: 'Invalid leave type' });
    }

    const request = await LeaveRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Leave request not found' });

    if (request.employeeId.toString() !== employeeId) {
        return res.status(403).json({ message: 'Unauthorized to update this request' });
    }

    request.startDate = start.toISOString();
    request.endDate = end.toISOString();
    request.reason = reason;
    request.type = type;
    request.status = 'Pending';

    const updatedRequest = await request.save();

    // Notify all admins about updated leave request
    const employee = await Employee.findById(employeeId);
    const admins = await Admin.find();
    const notifications = admins.map(admin => ({
        recipientId: admin._id,
        recipientModel: 'Admin',
        senderId: employeeId,
        senderModel: 'Employee',
        type: 'LeaveRequest',
        message: `${employee.firstName} ${employee.lastName} updated their ${type} leave request from ${start.format('MMM DD, YYYY')} to ${end.format('MMM DD, YYYY')}.`,
        relatedId: updatedRequest._id,
        relatedModel: 'LeaveRequest',
    }));
    await Notification.insertMany(notifications);

    res.status(200).json({ success: true, updatedRequest });
});

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

    // Notify the employee
    const adminId = req.adminId;
    if (!adminId) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }
    const admin = await Admin.findById(adminId);
    if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
    }
    const notification = new Notification({
        recipientId: request.employeeId,
        recipientModel: 'Employee',
        senderId: adminId,
        senderModel: 'Admin',
        type: 'LeaveApproval',
        message: `Your ${request.type} leave request from ${moment(request.startDate).format('MMM DD, YYYY')} to ${moment(request.endDate).format('MMM DD, YYYY')} has been approved by ${admin.username}.`,
        relatedId: request._id,
        relatedModel: 'LeaveRequest',
    });
    await notification.save();

    res.status(200).json({ success: true, updatedRequest: request });
});

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

    // Notify the employee
    const adminId = req.adminId;
    if (!adminId) {
        return res.status(401).json({ message: 'Admin authentication required' });
    }
    const admin = await Admin.findById(adminId);
    if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
    }
    const notification = new Notification({
        recipientId: request.employeeId,
        recipientModel: 'Employee',
        senderId: adminId,
        senderModel: 'Admin',
        type: 'LeaveDisapproval',
        message: `Your ${request.type} leave request from ${moment(request.startDate).format('MMM DD, YYYY')} to ${moment(request.endDate).format('MMM DD, YYYY')} has been disapproved by ${admin.username}.`,
        relatedId: request._id,
        relatedModel: 'LeaveRequest',
    });
    await notification.save();

    res.status(200).json({ success: true, updatedRequest: request });
});

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

    try {
        // Notify the employee
        const adminId = req.adminId;
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const notification = new Notification({
            recipientId: request.employeeId,
            recipientModel: 'Employee',
            senderId: adminId,
            senderModel: 'Admin',
            type: 'LeaveDisapproval',
            message: `Your ${request.type} leave request from ${moment(request.startDate).format('MMM DD, YYYY')} to ${moment(request.endDate).format('MMM DD, YYYY')} has been disapproved by ${admin.username}.`,
            relatedId: request._id,
            relatedModel: 'LeaveRequest',
        });

        await notification.save();
        res.status(200).json({ success: true, updatedRequest: request });
    } catch (error) {
        console.error('Error creating disapproval notification:', error);
        return res.status(500).json({ message: 'Failed to create disapproval notification', error: error.message });
    }
});

exports.deleteLeaveRequest = asyncHandler(async (req, res) => {
    if (!LeaveRequest) throw new Error('LeaveRequest model is not initialized');
    
    const requestId = req.params.id;
    const employeeId = req.employeeId;
    const role = req.role;

    const request = await LeaveRequest.findById(requestId);
    if (!request) {
        return res.status(404).json({ message: 'Leave request not found' });
    }

    const employeeIdStr = employeeId.toString ? employeeId.toString() : employeeId;
    if (role !== 'admin' && request.employeeId.toString() !== employeeIdStr) {
        return res.status(403).json({ message: 'Unauthorized to delete this request' });
    }

    await LeaveRequest.findByIdAndDelete(requestId);
    res.status(204).send();
});

module.exports = exports;