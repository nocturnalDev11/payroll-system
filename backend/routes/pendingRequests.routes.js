const express = require('express');
const router = express.Router();
const PendingRequest = require('../models/pendingRequest.model.js');
const Employee = require('../models/attendance.model.js');

const isAdmin = (req, res, next) => {
    console.log('All request headers:', req.headers);
    const userRole = req.headers['user-role'];
    console.log('Parsed user-role:', userRole);
    if (!userRole || userRole.toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Admin access required', headersSent: req.headers });
    }
    next();
};

// Get max ID (accessible to all for registration)
router.get('/max-id', async (req, res) => {
    try {
        const maxIdDoc = await PendingRequest.findOne().sort({ id: -1 }).select('id');
        const maxId = maxIdDoc ? maxIdDoc.id : 0;
        console.log('Fetched max ID for pending requests:', maxId);
        res.status(200).json({ maxId });
    } catch (error) {
        console.error('Error fetching max ID:', error);
        res.status(500).json({ error: 'Failed to fetch max ID', message: error.message });
    }
});

// Get all pending requests (admin only)
router.get('/', isAdmin, async (req, res) => {
    try {
        const requests = await PendingRequest.find({ status: 'pending' });
        console.log('Fetched pending requests:', requests.length);
        res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ error: 'Failed to fetch pending requests', message: error.message });
    }
});

// Create a new pending request (accessible to all for registration)
router.post('/', async (req, res) => {
    try {
        console.log('Received request data:', req.body);
        const requiredFields = [
            'id', 'empNo', 'firstName', 'lastName', 'position', 'email',
            'contactNumber', 'salary', 'username', 'password', 'hireDate'
        ];
        const missingFields = requiredFields.filter(field => !req.body[field] && req.body[field] !== 0);
        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
        }

        const { empNo, username, email } = req.body;
        const existingRequest = await PendingRequest.findOne({ $or: [{ empNo }, { username }, { email }] });
        if (existingRequest) {
            const duplicateField = existingRequest.empNo === empNo ? 'Employee Number' :
                                    existingRequest.username === username ? 'Username' : 'Email';
            return res.status(400).json({ error: `${duplicateField} already exists in pending requests` });
        }

        const existingEmployee = await Employee.findOne({ $or: [{ empNo }, { username }, { email }] });
        if (existingEmployee) {
        const duplicateField = existingEmployee.empNo === empNo ? 'Employee Number' :
                                existingEmployee.username === username ? 'Username' : 'Email';
        return res.status(400).json({ error: `${duplicateField} already exists in employees` });
        }

        const hireDate = new Date(req.body.hireDate);
        if (isNaN(hireDate.getTime())) {
        return res.status(400).json({ error: 'Invalid hireDate format' });
        }

        const request = new PendingRequest({
            ...req.body,
            status: 'pending',
            role: 'employee',
            hourlyRate: req.body.salary / (8 * 22),
            earnings: req.body.earnings || { travelExpenses: 0, otherEarnings: 0 }
        });

        await request.save();
        console.log('Saved pending request:', { id: request.id, empNo: request.empNo });
        res.status(201).json(request);
    } catch (error) {
        console.error('Error creating pending request:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            res.status(400).json({ error: `Duplicate ${field} detected`, message: error.message });
        } else {
            res.status(500).json({ error: 'Failed to create pending request', message: error.message });
        }
    }
});

// Update a pending request (admin only)
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const request = await PendingRequest.findOneAndUpdate(
            { id: parseInt(req.params.id) },
            { ...req.body, hourlyRate: req.body.salary ? req.body.salary / (8 * 22) : req.body.hourlyRate },
            { new: true }
        );
        if (!request) {
            console.error(`Request not found for ID: ${req.params.id}`);
            return res.status(404).json({ error: 'Request not found' });
        }
        console.log('Updated request:', { id: request.id, empNo: request.empNo });
        res.status(200).json(request);
    } catch (error) { // Fixed typo from 'error-collision' to 'error'
        console.error('Error updating request:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            res.status(400).json({ error: `Duplicate ${field} detected`, message: error.message });
        } else {
            res.status(500).json({ error: 'Failed to update request', message: error.message });
        }
    }
});

// Approve a pending request and create an employee (admin only)
router.put('/:id/approve', isAdmin, async (req, res) => {
    try {
        const request = await PendingRequest.findOne({ id: parseInt(req.params.id) });
        if (!request) {
            console.error(`Request not found for ID: ${req.params.id}`);
            return res.status(404).json({ error: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Request already processed' });
        }

        const existingEmployee = await Employee.findOne({
            $or: [{ empNo: request.empNo }, { username: request.username }, { email: request.email }]
        });
        if (existingEmployee) {
            const duplicateField = existingEmployee.empNo === request.empNo ? 'Employee Number' :
                                    existingEmployee.username === request.username ? 'Username' : 'Email';
            return res.status(400).json({ error: `${duplicateField} already exists in employees` });
        }

        const employee = new Employee({
            id: request.id,
            empNo: request.empNo,
            firstName: request.firstName,
            middleName: request.middleName || '',
            lastName: request.lastName,
            position: request.position,
            salary: request.salary,
            hourlyRate: request.hourlyRate || (request.salary / (8 * 22)),
            email: request.email,
            contactInfo: request.contactNumber,
            sss: request.sss || '',
            philhealth: request.philhealth || '',
            pagibig: request.hdmf || '',
            tin: request.tin || '',
            civilStatus: request.civilStatus || 'Single',
            username: request.username,
            password: request.password,
            role: request.role || 'employee',
            hireDate: request.hireDate,
            earnings: request.earnings || { travelExpenses: 0, otherEarnings: 0 },
            positionHistory: [{
                position: request.position,
                salary: request.salary,
                startDate: request.hireDate,
                endDate: null
            }]
        });

        await employee.save();
        await PendingRequest.updateOne({ id: request.id }, { status: 'approved', approvedAt: new Date() });

        console.log('Approved request and created employee:', { id: employee.id, empNo: employee.empNo });
        res.status(200).json(employee);
    } catch (error) {
        console.error('Error approving request:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            res.status(400).json({ error: `Duplicate ${field} in employees collection`, message: error.message });
        } else {
            res.status(500).json({ error: 'Failed to approve request', message: error.message });
        }
    }
});

    // Reject a pending request (admin only)
router.put('/:id/reject', isAdmin, async (req, res) => {
    try {
        const request = await PendingRequest.findOneAndUpdate(
            { id: parseInt(req.params.id) },
            { status: 'rejected', rejectedAt: new Date() },
            { new: true }
        );
        if (!request) {
            console.error(`Request not found for ID: ${req.params.id}`);
            return res.status(404).json({ error: 'Request not found' });
        }
        console.log('Rejected request:', { id: request.id, empNo: request.empNo });
        res.status(200).json(request);
    } catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).json({ error: 'Failed to reject request', message: error.message });
    }
});

// Delete a pending request (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const result = await PendingRequest.deleteOne({ id: parseInt(req.params.id) });
        if (result.deletedCount === 0) {
            console.error(`Request not found for ID: ${req.params.id}`);
            return res.status(404).json({ error: 'Request not found' });
        }
        console.log(`Deleted request with ID: ${req.params.id}`);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({ error: 'Failed to delete request', message: error.message });
    }
});

module.exports = router;