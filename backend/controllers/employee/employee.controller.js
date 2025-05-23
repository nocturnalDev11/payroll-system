require('dotenv').config();
const asyncHandler = require('express-async-handler');
const path = require('path');
const bcrypt = require('bcrypt');
const Employee = require('../../models/employee.model.js');
const PayHead = require('../../models/payHead.model.js');
const Attendance = require('../../models/attendance.model.js');
const LeaveRequest = require('../../models/leaveRequest.model.js');
const Payslip = require('../../models/paySlip.model.js');
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

// Update employee details
exports.updateEmployeeDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { position, password, payheads, salary, ...otherDetails } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid employee ID format' });
    }

    const updateData = { ...otherDetails };
    if (position) updateData.position = position;
    if (req.body.deductions) updateData.deductions = req.body.deductions;
    if (req.body.earnings) updateData.earnings = req.body.earnings;
    if (salary) updateData.salary = Number(salary);

    // Handle positionHistory update if position is provided
    if (position) {
        const employee = await Employee.findById(id);
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const updatedSalary = salary ? Number(salary) : employee.salary;
        if (!updatedSalary) {
            return res.status(400).json({ error: 'Salary is required when updating position' });
        }

        const currentPosition = employee.positionHistory.find(p => !p.endDate);
        if (currentPosition) {
            currentPosition.endDate = new Date();
        }

        employee.positionHistory.push({
            position: position,
            salary: updatedSalary,
            startDate: new Date(),
            endDate: null
        });

        updateData.positionHistory = employee.positionHistory;
        updateData.hourlyRate = updatedSalary / (8 * 22);
    }

    if (payheads) {
        if (!Array.isArray(payheads)) {
            return res.status(400).json({ error: 'Payheads must be an array' });
        }
        const invalidIds = payheads.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({ error: `Invalid payhead IDs: ${invalidIds.join(', ')}` });
        }
        const payheadsExist = await PayHead.find({ _id: { $in: payheads } });
        if (payheadsExist.length !== payheads.length) {
            const existingIds = payheadsExist.map(ph => ph._id.toString());
            const missingIds = payheads.filter(id => !existingIds.includes(id));
            return res.status(400).json({ error: `Payhead IDs do not exist: ${missingIds.join(', ')}` });
        }
        updateData.payheads = payheads;
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

exports.updateEmployeePassword = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { password, currentPassword } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid employee ID format' });
    }
    if (!password) {
        return res.status(400).json({ error: 'New password is required' });
    }
    if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
    }

    const employee = await Employee.findById(id).select('+password');
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const isMatch = await bcrypt.compare(currentPassword, employee.password);
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    employee.password = await bcrypt.hash(password, salt);
    employee.updatedAt = new Date();

    await employee.save();
    console.log('Updated password for employee:', id, employee.password); // Debugging

    res.status(200).json({ message: 'Password updated successfully' });
});

// Delete employee (move to archive)
exports.deleteEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
    }
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    employee.status = 'archived';
    employee.archivedAt = new Date();
    await employee.save({ validateBeforeSave: true });

    res.status(200).json({ message: 'Employee moved to archive successfully', employeeId: id });
});

// Get archived employees
exports.getArchivedEmployees = asyncHandler(async (req, res) => {
    const archived = await Employee.find({ status: 'archived' }).select('-password');
    res.status(200).json(archived);
});

// Restore employee
exports.restoreEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
    }
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    if (employee.status !== 'archived') return res.status(400).json({ message: 'Employee is not in archive' });

    employee.status = 'approved';
    employee.archivedAt = null;
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
    if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
    }

    await Promise.all([
        Attendance.deleteMany({ employeeId: id }),
        LeaveRequest.deleteMany({ employeeId: id }),
        Payslip.deleteMany({ employeeId: id })
    ]);

    res.status(200).json({ message: 'Employee and associated activities permanently deleted' });
});

// Get all employees
exports.getAllEmployees = asyncHandler(async (req, res) => {
    try {
        const { month } = req.query;
        if (month && !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ error: 'Invalid month format: must be YYYY-MM' });
        }

        let query = { status: { $ne: 'archived' } };
        if (month) {
            const endOfMonth = new Date(`${month}-31T23:59:59.999Z`);
            const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
            query.$and = [
                { status: { $ne: 'archived' } },
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

// Get single employee by ID
exports.getEmployeeById = asyncHandler(async (req, res) => {
    const employeeId = req.params.id;

    if (employeeId === 'archive') {
        const archived = await Employee.find({ status: 'archived' }).select('-password');
        return res.status(200).json(archived);
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
        .populate({ path: 'positionHistory.position', select: 'name' })
        .select('-password');
    if (!employee) return res.status(404).json({ error: `Employee with id ${employeeId} not found` });

    const transformedEmployee = {
        ...employee.toObject(),
        positionHistory: employee.positionHistory.map(history => ({
            position: history.position ? history.position.name : 'Unknown',
            salary: history.salary,
            startDate: history.startDate,
            endDate: history.endDate
        }))
    };

    res.status(200).json(transformedEmployee);
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(employeeData.password, salt);

    const newEmployee = new Employee({
        ...employeeData,
        password: hashedPassword,
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
    const employeeObj = savedEmployee.toObject();
    delete employeeObj.password;
    res.status(201).json(employeeObj);
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

// Delete pending request by ID
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