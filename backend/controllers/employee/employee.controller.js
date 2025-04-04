const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const Employee = require('../../models/employee.model.js');
const PayHead = require('../../models/payHead.model.js');
const path = require('path');
const mongoose = require('mongoose');
const { put } = require('@vercel/blob');

// Get pending employees
exports.getPendingEmployees = asyncHandler(async (req, res) => {
    const pending = await Employee.find({ status: 'pending' }).select('-password');
    res.status(200).json(pending);
});

// Get total number of employees
exports.getTotalEmployees = asyncHandler(async (req, res) => {
    const total = await Employee.countDocuments({ status: { $ne: 'pending' } });
    res.status(200).json({ total });
});

// Get user details
exports.getProfile = asyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.employeeId)
        .populate('payheads')
        .select('-password');
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.status(200).json(employee.toObject());
});

// Upload profile picture
exports.uploadProfilePicture = asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const employee = await Employee.findById(req.employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const fileName = `${req.employeeId}-${Date.now()}${path.extname(req.file.originalname)}`;
    const blob = await put(`profile-pictures/${fileName}`, req.file.buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN
    });

    employee.profilePicture = blob.url;
    await employee.save();
    res.status(200).json({ message: 'Profile picture uploaded successfully', profilePicture: blob.url });
});

// Update employee details (combined PUT from routes)
exports.updateEmployeeDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { position, password, payheads, ...otherDetails } = req.body;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid employee ID format' });
    }

    const updateData = { ...otherDetails, position };
    if (req.body.deductions) updateData.deductions = req.body.deductions;
    if (req.body.earnings) updateData.earnings = req.body.earnings;
    if (req.body.salary) updateData.salary = Number(req.body.salary);
    if (payheads) {
        if (!Array.isArray(payheads) || payheads.some(id => !mongoose.Types.ObjectId.isValid(id))) {
            return res.status(400).json({ error: 'Invalid payhead IDs' });
        }
        const payheadsExist = await PayHead.find({ _id: { $in: payheads } });
        if (payheadsExist.length !== payheads.length) {
            return res.status(400).json({ error: 'One or more payhead IDs do not exist' });
        }
        updateData.payheads = payheads;
    }
    if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
    }

    const employee = await Employee.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
    );
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const employeeObj = employee.toObject();
    delete employeeObj.password;
    res.status(200).json({ message: 'Employee details updated successfully', updatedEmployee: employeeObj });
});

// Delete employee (move to trash)
exports.deleteEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
    }
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    employee.status = 'trashed';
    employee.trashedAt = new Date();
    await employee.save({ validateBeforeSave: true });

    res.status(200).json({ message: 'Employee moved to trash successfully', employeeId: id });
});

// Get trashed employees
exports.getTrashedEmployees = asyncHandler(async (req, res) => {
    const trashed = await Employee.find({ status: 'trashed' }).select('-password');
    res.status(200).json(trashed);
});

// Restore employee
exports.restoreEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
    }
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    if (employee.status !== 'trashed') return res.status(400).json({ message: 'Employee is not in trash' });

    employee.status = 'approved';
    employee.trashedAt = null;
    await employee.save();
    res.status(200).json({ message: 'Employee restored successfully' });
});

// Permanent delete
exports.permanentDeleteEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
    }
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.status(200).json({ message: 'Employee permanently deleted' });
});

// Get all employees
exports.getAllEmployees = asyncHandler(async (req, res) => {
    try {
        const { month } = req.query;
        if (month && !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ error: 'Invalid month format: must be YYYY-MM' });
        }

        let query = { status: { $ne: 'trashed' } };
        if (month) {
            const endOfMonth = new Date(`${month}-31T23:59:59.999Z`);
            const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
            query.$and = [
                { status: { $ne: 'trashed' } },
                {
                    $or: [
                        {
                            hireDate: { $lte: endOfMonth },
                            'positionHistory': {
                                $elemMatch: {
                                    startDate: { $lte: endOfMonth },
                                    $or: [{ endDate: { $gte: startOfMonth } }, { endDate: null }]
                                }
                            }
                        },
                        { hireDate: { $lte: endOfMonth }, 'positionHistory.0.endDate': null }
                    ]
                }
            ];
        }

        const employees = await Employee.find(query)
            .populate({ path: 'payheads', select: 'id name amount type' })
            .sort({ empNo: 1 })
            .select('-password');

        if (!employees.length) return res.status(200).json([]);
        const employeesWithMonth = employees.map(emp => ({
            ...emp._doc,
            salaryMonth: month || new Date(emp.hireDate).toISOString().slice(0, 7)
        }));
        res.status(200).json(employeesWithMonth);
    } catch (error) {
        console.error('Error in getAllEmployees:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single employee by ID (with /trash workaround)
exports.getEmployeeById = asyncHandler(async (req, res) => {
    const employeeId = req.params.id;

    if (employeeId === 'trash') {
        const trashed = await Employee.find({ status: 'trashed' }).select('-password');
        return res.status(200).json(trashed);
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({ error: 'Invalid employee ID' });
    }

    const userId = req.headers['user-id'];
    const userRole = req.headers['user-role'];

    if (userRole === 'employee' && employeeId !== userId) {
        return res.status(403).json({ error: 'Access denied: Employees can only access their own data' });
    }

    const employee = await Employee.findById(employeeId)
        .populate({ path: 'payheads', select: 'name amount type' })
        .select('-password');
    if (!employee) return res.status(404).json({ error: `Employee with id ${employeeId} not found` });
    res.status(200).json(employee);
});

// Get salary data
exports.getSalaryData = asyncHandler(async (req, res) => {
    const employeeId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({ error: 'Invalid employee ID' });
    }
    const userId = req.headers['user-id'];
    const userRole = req.headers['user-role'];
    const { month } = req.query;

    if (userRole === 'employee' && employeeId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
    }

    const employee = await Employee.findById(employeeId)
        .populate({ path: 'payheads', select: 'name amount type' });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const salaryData = {
        _id: employee._id,
        empNo: employee.empNo,
        name: `${employee.firstName} ${employee.lastName}`.trim(),
        position: employee.position,
        salary: employee.salary,
        earnings: employee.earnings,
        payheads: employee.payheads,
        sss: employee.sss,
        philhealth: employee.philhealth,
        pagibig: employee.pagibig,
        hireDate: employee.hireDate,
        salaryMonth: month || null,
    };
    res.status(200).json(salaryData);
});

// Create new employee
exports.createEmployee = asyncHandler(async (req, res) => {
    const employeeData = req.body;
    const requiredFields = ['firstName', 'lastName', 'empNo', 'email', 'contactInfo', 'username', 'password', 'position'];
    const missingFields = requiredFields.filter(field => !employeeData[field] || (typeof employeeData[field] === 'string' && !employeeData[field].trim()));
    if (missingFields.length) return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });

    if (typeof employeeData.salary !== 'number' || employeeData.salary < 0) {
        return res.status(400).json({ error: 'Salary must be a non-negative number' });
    }

    const existingEmployee = await Employee.findOne({ $or: [{ empNo: employeeData.empNo }, { username: employeeData.username }] });
    if (existingEmployee) return res.status(400).json({ error: 'Employee with this empNo or username already exists' });

    const lastEmployee = await Employee.findOne().sort({ id: -1 });
    const newId = lastEmployee ? lastEmployee.id + 1 : 1;

    const newEmployee = new Employee({
        ...employeeData,
        id: newId,
        positionHistory: [{
            position: employeeData.position,
            salary: employeeData.salary,
            startDate: new Date(employeeData.hireDate || Date.now()),
            endDate: null,
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'approved',
    });

    const savedEmployee = await newEmployee.save();
    res.status(201).json(savedEmployee);
});

// Update pending request
exports.updatePendingRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const employee = await Employee.findOne({ _id: id, status: 'pending' });
    if (!employee) return res.status(404).json({ error: `Pending request with _id ${id} not found` });

    delete updateData._id;
    Object.assign(employee, updateData, { updatedAt: new Date() });
    const updatedEmployee = await employee.save();
    res.status(200).json(updatedEmployee);
});

exports.updatePendingRequestStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid pending request ID' });
    }
    const employee = await Employee.findOneAndUpdate(
        { _id: id, status: 'pending' },
        { status: 'rejected' },
        { new: true }
    );
    if (!employee) {
        return res.status(404).json({ message: 'Pending request not found' });
    }
    res.status(200).json(employee);
});

// delete pending request by ID
exports.deletePendingRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid pending request ID' });
    }
    const employee = await Employee.findOneAndDelete({ _id: id, status: 'pending' });
    if (!employee) {
        return res.status(404).json({ message: 'Pending request not found' });
    }
    res.status(204).json();
});

// Permanent delete by ID
exports.deleteEmployeeById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
    }
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) return res.status(404).json({ error: `Employee not found` });
    res.status(200).json({ message: 'Employee deleted successfully' });
});