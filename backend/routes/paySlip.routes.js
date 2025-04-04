const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Employee = require('../models/employee.model.js');
const Payslip = require('../models/paySlip.model.js');
const { verifyToken } = require('../middlewares/authMiddleware.js');

// Middleware to check for admin role
const isAdmin = (req, res, next) => {
    const userRole = req.headers['user-role'];
    if (!userRole || userRole.toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// GET payslips for an employee
router.get('/:employeeId', verifyToken, async (req, res) => {
    try {
        const employeeId = req.params.employeeId;
        const userId = req.employeeId || req.adminId;
        const userRole = req.role;

        // Validate employeeId format
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ error: 'Invalid employeeId format' });
        }

        // Restrict employees to their own payslips
        if (userRole === 'employee' && employeeId !== userId.toString()) {
            return res.status(403).json({ error: 'Employees can only access their own payslips' });
        }

        const payslips = await Payslip.find({ employeeId }).sort({ salaryMonth: 1, paydayType: 1 });

        if (!payslips || payslips.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(payslips.map(payslip => ({
            employeeId: payslip.employeeId,
            empNo: payslip.empNo,
            payslipData: payslip.payslipData,
            salaryMonth: payslip.salaryMonth,
            paydayType: payslip.paydayType,
            position: payslip.position,
            salary: payslip.salary
        })));
    } catch (error) {
        console.error('Error fetching payslips:', error);
        res.status(500).json({ error: 'Failed to fetch payslips', message: error.message });
    }
});

// POST generate a payslip
router.post('/generate', verifyToken, async (req, res) => {
    try {
        const {
            employeeId,
            empNo,
            payslipData,
            salaryMonth,
            paydayType,
            position,
            salary,
            payDate
        } = req.body;

        const userRole = req.role;
        const userId = req.employeeId || req.adminId;

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ error: 'Invalid employeeId format' });
        }

        if (userRole === 'employee' && employeeId !== userId.toString()) {
            return res.status(403).json({ error: 'Employees can only generate their own payslips' });
        }

        if (!employeeId || !empNo || !payslipData || !salaryMonth || !paydayType || !position || salary === undefined || !payDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        const [year, month] = salaryMonth.split('-').map(Number);
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            return res.status(400).json({ error: 'Invalid salaryMonth format. Use YYYY-MM' });
        }

        const payslipDate = new Date(payDate);
        if (isNaN(payslipDate.getTime())) {
            return res.status(400).json({ error: 'Invalid payDate format' });
        }

        if (payslipDate < new Date(employee.hireDate)) {
            return res.status(400).json({ error: `Payslip date (${payslipDate.toISOString()}) cannot be before hire date (${employee.hireDate.toISOString()})` });
        }

        const positionHistory = Array.isArray(employee.positionHistory) && employee.positionHistory.length > 0
            ? employee.positionHistory.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
            : [{ position: employee.position, salary: employee.salary, startDate: employee.hireDate, endDate: null }];

        const activePosition = positionHistory.find(history => {
            const startDate = new Date(history.startDate);
            const endDate = history.endDate ? new Date(history.endDate) : new Date('9999-12-31');
            return payslipDate >= startDate && payslipDate <= endDate;
        }) || positionHistory[positionHistory.length - 1];

        if (!activePosition) {
            return res.status(400).json({ error: 'No active position found for the payslip date' });
        }

        if (activePosition.position !== position || Number(activePosition.salary) !== Number(salary)) {
            return res.status(400).json({
                error: 'Position or salary mismatch with historical data',
                details: {
                    expected: { position: activePosition.position, salary: activePosition.salary },
                    received: { position, salary },
                    payslipDate: payslipDate.toISOString()
                }
            });
        }

        const existingPayslip = await Payslip.findOne({ employeeId, salaryMonth, paydayType });

        if (existingPayslip) {
            existingPayslip.payslipData = payslipData;
            existingPayslip.position = position;
            existingPayslip.salary = salary;
            existingPayslip.payDate = payslipDate;
            await existingPayslip.save();
            return res.status(200).json({
                success: true,
                message: `Payslip updated for employee ID ${employeeId}, ${salaryMonth}, ${paydayType}`,
                payslip: {
                    employeeId,
                    empNo,
                    payslipData,
                    salaryMonth,
                    paydayType,
                    position,
                    salary,
                    payDate
                }
            });
        }

        const payslip = new Payslip({
            employeeId,
            empNo,
            payslipData,
            salaryMonth,
            paydayType,
            position,
            salary,
            payDate
        });

        await payslip.save();

        res.status(201).json({
            success: true,
            message: `Payslip generated for employee ID ${employeeId}, ${salaryMonth}, ${paydayType}`,
            payslip: {
                employeeId,
                empNo,
                payslipData,
                salaryMonth,
                paydayType,
                position,
                salary,
                payDate
            }
        });
    } catch (error) {
        console.error('Error generating payslip:', error);
        res.status(500).json({ error: 'Failed to generate payslip', message: error.message });
    }
});

// DELETE a payslip
router.delete('/:employeeId/:salaryMonth/:paydayType', verifyToken, async (req, res) => {
    try {
        const { employeeId, salaryMonth, paydayType } = req.params;
        const userRole = req.role;

        // Validate employeeId format
        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ error: 'Invalid employeeId format' });
        }

        // Restrict deletion to admins only
        if (userRole !== 'admin') {
            return res.status(403).json({ error: 'Admin access required to delete payslips' });
        }

        const payslip = await Payslip.findOneAndDelete({
            employeeId,
            salaryMonth,
            paydayType
        });

        if (!payslip) {
            return res.status(404).json({ error: 'Payslip not found' });
        }

        res.status(200).json({
            success: true,
            message: `Payslip for employee ID ${employeeId}, ${salaryMonth}, ${paydayType} deleted successfully`
        });
    } catch (error) {
        console.error('Error deleting payslip:', error);
        res.status(500).json({ error: 'Failed to delete payslip', message: error.message });
    }
});

module.exports = router;