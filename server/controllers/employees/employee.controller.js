import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import { Employee } from '../../models/employee.model.js';
import {
    calculateSSSContribution,
    calculatePhilHealthContribution,
    calculateWithholdingTax,
    calculatePagIBIGContribution
} from '../../utils/payrollCalculations.js';

// Get all employees
export const getAllEmployees = asyncHandler(async (req, res) => {
    try {
        const employees = await Employee.find({ status: { $ne: 'trashed' } }).select('-password');
        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching employees', error: error.message });
    }
});

// Get pending employees
export const getPendingEmployees = asyncHandler(async (req, res) => {
    try {
        const pending = await Employee.find({ status: 'pending' }).select('-password');
        res.status(200).json(pending);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending employees', error: error.message });
    }
});

// Get total number of employees
export const getTotalEmployees = asyncHandler(async (req, res) => {
    try {
        const total = await Employee.countDocuments();
        res.status(200).json({ total });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching total employees', error: error.message });
    }
});

// Get user details
export const getProfile = asyncHandler(async (req, res) => {
    console.log('req.employeeId:', req.employeeId);
    const employee = await Employee.findById(req.employeeId).select('-password');
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    const employeeObj = employee.toObject();
    res.status(200).json({
        id: employeeObj._id,
        firstName: employeeObj.firstName,
        lastName: employeeObj.lastName,
        username: employeeObj.username,
        email: employeeObj.email,
        employeeIdNumber: employeeObj.employeeIdNumber,
        birthday: employeeObj.birthday,
        profilePicture: employeeObj.profilePicture,
        hireDate: employeeObj.hireDate,
        contactInfo: employeeObj.contactInfo,
        civilStatus: employeeObj.civilStatus,
        salary: employeeObj.salary,
        sss: employeeObj.sss,
        philHealth: employeeObj.philHealth,
        pagIbig: employeeObj.pagIbig,
        position: employeeObj.position,
        role: employeeObj.role,
    });
});

export const getEmployeeById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const employee = await Employee.findById(id).select('-password');
    if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json(employee);
});

export const uploadProfilePicture = asyncHandler(async (req, res) => {
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

export const updateEmployeeDetails = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { position, password, hireDate, ...otherDetails } = req.body;

        const updateData = {
            ...otherDetails,
            position,
            ...(req.body.deductions && { deductions: req.body.deductions }),
            ...(req.body.earnings && { earnings: req.body.earnings }),
            ...(req.body.payheads && { payheads: req.body.payheads }),
            ...(hireDate && { hireDate: new Date(hireDate) }),
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

export const getEmployeeSalarySlip = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { month } = req.query;

    try {
        const employee = await Employee.findOne({ employeeIdNumber: id }).populate('payHeads');
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const baseSalary = employee.salary || 0;
        const sssContribution = calculateSSSContribution(baseSalary);
        const philHealthContribution = calculatePhilHealthContribution(baseSalary);
        const pagIbigContribution = calculatePagIBIGContribution(baseSalary);
        
        const earnings = employee.payHeads.filter(p => p.type === 'Earnings');
        const totalEarningsFromPayHeads = earnings.reduce((sum, p) => sum + p.amount, 0);
        const totalEarnings = baseSalary + totalEarningsFromPayHeads;

        const deductions = employee.payHeads.filter(p => p.type === 'Deductions');
        const totalCustomDeductions = deductions.reduce((sum, p) => sum + p.amount, 0);
        const withholdingTax = calculateWithholdingTax(totalEarnings);
        const totalDeductions = totalCustomDeductions + sssContribution + philHealthContribution + pagIbigContribution + withholdingTax;

        const netSalary = totalEarnings - totalDeductions;
        const hourlyRate = baseSalary / (8 * 22);

        const salarySlip = {
            id: employee._id,
            employeeIdNumber: employee.employeeIdNumber,
            name: `${employee.firstName} ${employee.middleName} ${employee.lastName}`.trim(),
            hourlyRate,
            baseSalary,
            birthDate: employee.birthday ? employee.birthday.toISOString().split('T')[0] : 'N/A',
            hireDate: employee.hireDate ? employee.hireDate.toISOString().split('T')[0] : 'N/A',
            civilStatus: employee.civilStatus || 'SINGLE',
            dependents: employee.dependents || 0,
            sss: employee.sss || 'N/A',
            tin: employee.tin || 'N/A',
            philHeath: employee.philHealth || 'N/A',
            pagIbig: employee.pagIbig || 'N/A',
            position: employee.position || 'N/A',
            earnings: earnings.map(p => ({ name: p.name, amount: p.amount })),
            deductions: {
                customDeductions: deductions.map(p => ({ name: p.name, amount: p.amount })),
                sss: sssContribution,
                philHealth: philHealthContribution,
                pagIbig: pagIbigContribution,
                tax: withholdingTax
            },
            totalEarnings,
            totalDeductions,
            totalSalary: netSalary,
            salaryMonth: month
        };

        res.status(200).json(salarySlip);
    } catch (error) {
        console.error('Error fetching salary slip:', error);
        res.status(500).json({ message: 'Failed to fetch salary slip', error: error.message });
    }
});

export const deleteEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
    }
    
    if (employee.status !== 'trashed') {
        return res.status(400).json({ message: 'Employee must be in trash before permanent deletion' });
    }

    const session = await Employee.startSession();
    session.startTransaction();

    try {
        await Employee.findByIdAndDelete(id).session(session);
        await LeaveRequest.deleteMany({ employeeId: id }).session(session);
        await PayHead.deleteMany({ employeeId: id }).session(session);
        await Payslip.deleteMany({ employeeId: id }).session(session);
        await Attendance.deleteMany({ employeeId: id }).session(session);

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: 'Employee permanently deleted from trash' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: 'Error permanently deleting employee', error: error.message });
    }
});

export const trashEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    try {
        console.log(`Trashing employee: ${id}`);
        
        const employee = await Employee.findById(id);
        if (!employee) {
            console.log(`Employee not found: ${id}`);
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (employee.status === 'trashed') {
            return res.status(400).json({ message: 'Employee is already in trash' });
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            id,
            { 
                status: 'trashed',
                trashedAt: new Date()
            },
            { new: true }
        );

        console.log('Employee trashed successfully:', updatedEmployee._id);
        res.status(200).json({ 
            message: 'Employee moved to trash successfully',
            employee: updatedEmployee 
        });
    } catch (error) {
        console.error('Trash employee error:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ 
            message: 'Failed to move employee to trash',
            error: error.message 
        });
    }
});

export const restoreEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    try {
        const employee = await Employee.findByIdAndUpdate(
            id,
            { 
                status: 'approved',
                trashedAt: null
            },
            { new: true }
        );
        
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        res.status(200).json({ 
            message: 'Employee restored successfully',
            employee 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error restoring employee', 
            error: error.message 
        });
    }
});

export const getTrashedEmployees = asyncHandler(async (req, res) => {
    try {
        const trashedEmployees = await Employee.find({ status: 'trashed' }).select('-password');
        res.status(200).json(trashedEmployees);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching trashed employees', 
            error: error.message 
        });
    }
});



// Alternative Without Transactions (For Standalone MongoDB)

// export const deleteEmployee = asyncHandler(async (req, res) => {
//     const { id } = req.params;

//     try {
//         Find and delete the employee
//         const employee = await Employee.findByIdAndDelete(id);
//         if (!employee) {
//             return res.status(404).json({ message: 'Employee not found' });
//         }
//         Delete related data from other collections
//         await LeaveRequest.deleteMany({ employeeId: id });
//         await PayHead.deleteMany({ employeeId: id });
//         await Payslip.deleteMany({ employeeId: id });
//         await Attendance.deleteMany({ employeeId: id });

//         res.status(200).json({ message: 'Employee and all related data deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ 
//             message: 'Error deleting employee and related data', 
//             error: error.message 
//         });
//     }
// });