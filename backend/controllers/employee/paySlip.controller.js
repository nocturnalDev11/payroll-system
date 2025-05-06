const mongoose = require('mongoose');
const Employee = require('../../models/employee.model.js');
const Payslip = require('../../models/paySlip.model.js');
const Attendance = require('../../models/attendance.model.js');
const Notification = require('../../models/notification.model.js');

const getPayslips = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const userId = req.employeeId || req.adminId;
        const userRole = req.role;

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ error: 'Invalid employeeId format' });
        }

        if (userRole === 'employee' && employeeId !== userId.toString()) {
            return res.status(403).json({ error: 'Employees can only access their own payslips' });
        }

        const payslips = await Payslip.find({ employeeId }).sort({ salaryMonth: 1, paydayType: 1 });

        res.status(200).json(payslips.length ? payslips.map(p => ({
            employeeId: p.employeeId,
            empNo: p.empNo,
            payslipData: p.payslipData,
            salaryMonth: p.salaryMonth,
            paydayType: p.paydayType,
            position: p.position,
            salary: p.salary
        })) : []);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payslips', message: error.message });
    }
};

const generatePayslip = async (req, res) => {
    try {
        const { employeeId, empNo, payslipData, salaryMonth, paydayType, position, salary, payDate } = req.body;
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
            return res.status(400).json({ error: `Payslip date cannot be before hire date` });
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
                details: { expected: { position: activePosition.position, salary: activePosition.salary }, received: { position, salary } }
            });
        }

        const startOfMonth = new Date(`${salaryMonth}-01T00:00:00.000Z`);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
        const attendanceRecords = await Attendance.find({
            employeeId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const totalLateDeduction = attendanceRecords.reduce((sum, record) => sum + (record.lateDeduction || 0), 0);

        payslipData.lateDeductions = totalLateDeduction;

        const existingPayslip = await Payslip.findOne({ employeeId, salaryMonth, paydayType });

        let payslip;
        if (existingPayslip) {
            existingPayslip.payslipData = payslipData;
            existingPayslip.position = position;
            existingPayslip.salary = salary;
            existingPayslip.payDate = payslipDate;
            payslip = await existingPayslip.save();
            
            // Notify employee about payslip update
            const adminId = req.adminId || userId;
            const notification = new Notification({
                recipientId: employeeId,
                recipientModel: 'Employee',
                senderId: adminId,
                senderModel: userRole === 'admin' ? 'Admin' : 'Employee',
                type: 'PayslipGenerated',
                message: `Your payslip for ${salaryMonth} (${paydayType}) has been updated.`,
                relatedId: payslip._id,
                relatedModel: 'Payslip',
            });
            await notification.save();

            return res.status(200).json({
                success: true,
                message: `Payslip updated for ${salaryMonth}, ${paydayType}`,
                payslip: { employeeId, empNo, payslipData, salaryMonth, paydayType, position, salary, payDate }
            });
        }

        payslip = new Payslip({ employeeId, empNo, payslipData, salaryMonth, paydayType, position, salary, payDate });
        await payslip.save();

        // Update employee with total late deductions
        employee.lateDeductions = (employee.lateDeductions || 0) + totalLateDeduction;
        await employee.save();

        // Notify employee about new payslip
        const adminId = req.adminId || userId;
        const notification = new Notification({
            recipientId: employeeId,
            recipientModel: 'Employee',
            senderId: adminId,
            senderModel: userRole === 'admin' ? 'Admin' : 'Employee',
            type: 'PayslipGenerated',
            message: `Your payslip for ${salaryMonth} (${paydayType}) has been generated.`,
            relatedId: payslip._id,
            relatedModel: 'Payslip',
        });
        await notification.save();

        res.status(201).json({
            success: true,
            message: `Payslip generated for ${salaryMonth}, ${paydayType}`,
            payslip: { employeeId, empNo, payslipData, salaryMonth, paydayType, position, salary, payDate }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate payslip', message: error.message });
    }
};

const deletePayslip = async (req, res) => {
    try {
        const { employeeId, salaryMonth, paydayType } = req.params;
        const userRole = req.role;

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ error: 'Invalid employeeId format' });
        }

        if (userRole !== 'admin') {
            return res.status(403).json({ error: 'Admin access required to delete payslips' });
        }

        const payslip = await Payslip.findOneAndDelete({ employeeId, salaryMonth, paydayType });

        if (!payslip) {
            return res.status(404).json({ error: 'Payslip not found' });
        }

        // Notify employee about payslip deletion
        const adminId = req.adminId;
        const notification = new Notification({
            recipientId: employeeId,
            recipientModel: 'Employee',
            senderId: adminId,
            senderModel: 'Admin',
            type: 'General',
            message: `Your payslip for ${salaryMonth} (${paydayType}) has been deleted.`,
            relatedId: null,
            relatedModel: null,
        });
        await notification.save();

        res.status(200).json({ success: true, message: `Payslip for ${salaryMonth}, ${paydayType} deleted` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete payslip', message: error.message });
    }
};

module.exports = { getPayslips, generatePayslip, deletePayslip };