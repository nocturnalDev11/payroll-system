const express = require('express');
const router = express.Router();
const Contribution = require('../models/contribution.model.js');
const Employee = require('../models/employee.model.js');

// GET /api/contribution-rates
// Retrieve the latest contribution rates based on employee's salary
router.get('/rates', async (req, res) => {
    try {
        const { employeeId } = req.query;
        if (!employeeId) {
            return res.status(400).json({ error: 'employeeId query parameter is required' });
        }

        const employeeIdNum = Number(employeeId);
        if (isNaN(employeeIdNum)) {
            return res.status(400).json({ error: 'Invalid employeeId: must be a number' });
        }

        const employee = await Employee.findOne({ id: employeeIdNum });
        if (!employee) {
            return res.status(404).json({ error: `Employee with id ${employeeIdNum} not found` });
        }

        const salary = employee.salary || 0;
        const contributionRates = [
            { id: 'pagibig', name: 'Pag-IBIG', amount: calculatePagIBIGContribution(salary) },
            { id: 'sss', name: 'SSS', amount: calculateSSSContribution(salary) },
            { id: 'philhealth', name: 'PhilHealth', amount: calculatePhilHealthContribution(salary) }
        ];

        res.status(200).json(contributionRates);
    } catch (error) {
        console.error('Error fetching contribution rates:', error);
        res.status(500).json({ error: 'Failed to fetch contribution rates' });
    }
});

// POST /api/employee-contributions
// Save contributions for an employee
router.post('/', async (req, res) => {
    try {
        const { employeeId, contributions } = req.body;

        // Validate request body
        if (!employeeId || !contributions || !Array.isArray(contributions)) {
            return res.status(400).json({ error: 'Invalid request body: employeeId and contributions array are required' });
        }

        // Check if the employee exists
        const employee = await Employee.findOne({ id: employeeId });
        if (!employee) {
            return res.status(404).json({ error: `Employee with id ${employeeId} not found` });
        }

        // Validate contributions array
        for (const contribution of contributions) {
            if (!contribution.salaryMonth || !contribution.taxes || !Array.isArray(contribution.taxes)) {
                return res.status(400).json({ error: 'Each contribution must have a salaryMonth and a taxes array' });
            }

        for (const tax of contribution.taxes) {
            if (!tax.name || !['Pag-IBIG', 'SSS', 'PhilHealth'].includes(tax.name)) {
                return res.status(400).json({ error: `Invalid tax name: ${tax.name}. Must be one of Pag-IBIG, SSS, PhilHealth` });
            }
            if (typeof tax.amount !== 'number' || tax.amount < 0) {
                return res.status(400).json({ error: `Invalid tax amount for ${tax.name}: ${tax.amount}. Must be a non-negative number` });
            }
        }
    }

        // Prepare contribution documents
        const contributionDocs = contributions.map(contribution => ({
            employeeId,
            salaryMonth: contribution.salaryMonth,
            taxes: contribution.taxes,
        }));

        // Save contributions (upsert to update existing records)
        for (const doc of contributionDocs) {
            await Contribution.findOneAndUpdate(
                { employeeId: doc.employeeId, salaryMonth: doc.salaryMonth },
                { $set: doc },
                { upsert: true, new: true }
            );
        }

        res.status(201).json({ message: 'Contributions saved successfully' });
    } catch (error) {
        console.error('Error saving contributions:', error);
        if (error.code === 11000) {
            res.status(400).json({ error: 'Contribution already exists for this employee and pay period' });
        } else {
            res.status(500).json({ error: 'Failed to save contributions' });
        }
    }
});

// GET /api/employee-contributions/:employeeId
// Retrieve contributions for a specific employee
router.get('/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;

        // Validate employeeId
        const employeeIdNum = Number(employeeId);
        if (isNaN(employeeIdNum)) {
            return res.status(400).json({ error: 'Invalid employeeId: must be a number' });
        }

        // Check if the employee exists
        const employee = await Employee.findOne({ id: employeeIdNum });
        if (!employee) {
            return res.status(404).json({ error: `Employee with id ${employeeIdNum} not found` });
        }

        // Fetch contributions
        const contributions = await Contribution.find({ employeeId: employeeIdNum })
            .sort({ salaryMonth: 1 })
            .lean();

        res.status(200).json(contributions);
    } catch (error) {
        console.error('Error fetching contributions:', error);
        res.status(500).json({ error: 'Failed to fetch contributions' });
    }
});

// Helper functions to calculate contributions
function calculatePagIBIGContribution(salary) {
    // Pag-IBIG: 2% of monthly salary (employee contribution), capped at ₱5,000 salary
    const maxSalary = 5000; // Maximum salary for Pag-IBIG contribution
    const rate = 0.02; // 2% employee contribution
    const applicableSalary = Math.min(salary, maxSalary);
    return Math.round(applicableSalary * rate); // Round to nearest whole number
}

function calculateSSSContribution(salary) {
    // SSS Contribution Table (simplified for 2023 rates, 14% total, employee share is 4.5%)
    // This is a simplified version; in reality, you'd use the full SSS table
    if (salary < 3250) return 135; // Minimum contribution
    if (salary >= 29750) return 1350; // Maximum contribution

    // Simplified linear calculation between min and max
    const employeeShare = 0.045; // Employee's share of the 14% total contribution
    const contribution = (salary - 3250) * employeeShare + 135;
    return Math.round(contribution);
}

function calculatePhilHealthContribution(salary) {
    // PhilHealth: 5% of monthly salary (as of 2024), split equally (2.5% employee, 2.5% employer)
    const rate = 0.025; // Employee's share (2.5%)
    const maxSalary = 100000; // Maximum salary for PhilHealth contribution
    const applicableSalary = Math.min(salary, maxSalary);
    return Math.round(applicableSalary * rate); // Round to nearest whole number
}

module.exports = router;