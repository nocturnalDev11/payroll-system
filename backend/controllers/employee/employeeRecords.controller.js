const EmployeeRecord = require('../../models/employeeRecord.model.js');
const Employee = require('../../models/employee.model.js');

const getEmployeeRecords = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = parseInt(id);
        if (isNaN(employeeId)) {
            return res.status(400).json({ error: 'Invalid employee ID: must be a number' });
        }

        const employee = await Employee.findOne({ id: employeeId });
        if (!employee) {
            return res.status(404).json({ error: `Employee with id ${employeeId} not found` });
        }

        const records = await EmployeeRecord.find({ employeeId }).lean();
        res.status(200).json(records);
    } catch (error) {
        console.error('Error fetching employee records:', error);
        res.status(500).json({ error: 'Failed to fetch employee records' });
    }
};

const generateEmployeeRecord = async (req, res) => {
    try {
        const { employeeId, salaryMonth, recordData } = req.body;

        if (!employeeId || !salaryMonth || !recordData) {
            return res.status(400).json({ error: 'employeeId, salaryMonth, and recordData are required' });
        }

        const employeeIdNum = parseInt(employeeId);
        if (isNaN(employeeIdNum)) {
            return res.status(400).json({ error: 'Invalid employeeId: must be a number' });
        }

        if (!/^\d{4}-\d{2}$/.test(salaryMonth)) {
            return res.status(400).json({ error: 'Invalid salaryMonth format: must be YYYY-MM (e.g., 2025-03)' });
        }

        const employee = await Employee.findOne({ id: employeeIdNum });
        if (!employee) {
            return res.status(404).json({ error: `Employee with id ${employeeIdNum} not found` });
        }

        const record = await EmployeeRecord.findOneAndUpdate(
            { employeeId: employeeIdNum, salaryMonth },
            { $set: { recordData } },
            { upsert: true, new: true }
        );

        res.status(201).json({ message: 'Record generated successfully', record });
    } catch (error) {
        console.error('Error generating employee record:', error);
        if (error.code === 11000) {
            res.status(400).json({ error: 'Record already exists for this employee and period' });
        } else {
            res.status(500).json({ error: 'Failed to generate record' });
        }
    }
};

module.exports = { getEmployeeRecords, generateEmployeeRecord };