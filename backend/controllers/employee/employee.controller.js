const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const Employee = require('../../models/employee.model.js');

// Get pending employees
exports.getPendingEmployees = asyncHandler(async (req, res) => {
    try {
        const pending = await Employee.find({ status: 'pending' }).select('-password');
        res.status(200).json(pending);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending employees', error: error.message });
    }
});

// Get total number of employees
exports.getTotalEmployees = asyncHandler(async (req, res) => {
    try {
        const total = await Employee.countDocuments();
        res.status(200).json({ total });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching total employees', error: error.message });
    }
});

// Get user details
exports.getProfile = asyncHandler(async (req, res) => {
    console.log('req.employeeId:', req.employeeId);
    const employee = await Employee.findById(req.employeeId).select('-password');
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    const employeeObj = employee.toObject();
    res.status(200).json(employeeObj);
});

exports.uploadProfilePicture = asyncHandler(async (req, res) => {
    console.log('Request employeeId:', req.employeeId);
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const employee = await Employee.findById(req.employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;
        
        employee.profilePicture = profilePicturePath;
        await employee.save();

        res.status(200).json({
            message: 'Profile picture uploaded successfully',
            profilePicture: profilePicturePath
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error uploading profile picture', 
            error: error.message 
        });
    }
});

exports.updateEmployeeDetails = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { position, password, hireDate, ...otherDetails } = req.body;

        const updateData = {
            ...otherDetails,
            position,
            ...(req.body.deductions && { deductions: req.body.deductions }),
            ...(req.body.earnings && { earnings: req.body.earnings }),
            ...(req.body.payheads && { payheads: req.body.payheads }),
            ...(hireDate && { hireDate: new Date(hireDate) }), // Convert to Date if needed
        };

        if (req.file) {
            updateData.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
        }

        if (req.body.salary) {
            updateData.salary = Number(req.body.salary);
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const employeeObj = updatedEmployee.toObject();
        delete employeeObj.password;

        res.status(200).json({ 
            message: 'Employee details updated successfully', 
            updatedEmployee: employeeObj 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

exports.deleteEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employeeId = parseInt(id);
    const employee = await Employee.findOne({ id: employeeId });
    if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
    }
    
    employee.status = 'trashed';
    employee.trashedAt = new Date();
    await employee.save();
    
    res.status(200).json({ message: 'Employee moved to trash successfully' });
});

// New function to get trashed employees
exports.getTrashedEmployees = asyncHandler(async (req, res) => {
    try {
        const trashed = await Employee.find({ status: 'trashed' }).select('-password');
        res.status(200).json(trashed);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching trashed employees', error: error.message });
    }
});

// Optional: Restore employee from trash
exports.restoreEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log('Restoring employee with ID:', id);
    
    try {
        const employee = await Employee.findById(id);
        if (!employee) {
            console.log('Employee not found for ID:', id);
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        if (employee.status !== 'trashed') {
            console.log('Employee not in trash, current status:', employee.status);
            return res.status(400).json({ message: 'Employee is not in trash' });
        }
        
        employee.status = 'approved';
        employee.trashedAt = null;
        await employee.save();
        
        console.log('Employee restored:', employee._id);
        res.status(200).json({ message: 'Employee restored successfully' });
    } catch (error) {
        console.error('Error in restoreEmployee:', {
            message: error.message,
            stack: error.stack,
            id
        });
        throw error; // Let asyncHandler handle the 500 response
    }
});

// Optional: Permanently delete from trash
exports.permanentDeleteEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json({ message: 'Employee permanently deleted' });
});