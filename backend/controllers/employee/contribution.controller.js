const Employee = require('../../models/employee.model.js');
const Contribution = require('../../models/contribution.model.js');

const getContributionRates = async (req, res) => {
    try {
        const { employeeId } = req.query;
        if (!employeeId) return res.status(400).json({ error: 'employeeId required' });

        const employeeIdNum = Number(employeeId);
        if (isNaN(employeeIdNum)) return res.status(400).json({ error: 'Invalid employeeId: must be a number' });

        const employee = await Employee.findOne({ id: employeeIdNum });
        if (!employee) return res.status(404).json({ error: `Employee with id ${employeeIdNum} not found` });

        const salary = employee.salary || 0;
        const rates = [
            { id: 'pagibig', name: 'Pag-IBIG', amount: calculatePagIBIGContribution(salary) },
            { id: 'sss', name: 'SSS', amount: calculateSSSContribution(salary) },
            { id: 'philhealth', name: 'PhilHealth', amount: calculatePhilHealthContribution(salary) }
        ];

        res.status(200).json(rates);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch contribution rates' });
    }
};

const saveContributions = async (req, res) => {
    try {
        const { employeeId, contributions } = req.body;
        if (!employeeId || !contributions || !Array.isArray(contributions)) {
            return res.status(400).json({ error: 'employeeId and contributions array required' });
        }

        const employee = await Employee.findOne({ id: employeeId });
        if (!employee) return res.status(404).json({ error: `Employee with id ${employeeId} not found` });

        for (const contribution of contributions) {
            if (!contribution.salaryMonth || !contribution.taxes || !Array.isArray(contribution.taxes)) {
                return res.status(400).json({ error: 'Each contribution needs salaryMonth and taxes array' });
            }
            for (const tax of contribution.taxes) {
                if (!tax.name || !['Pag-IBIG', 'SSS', 'PhilHealth'].includes(tax.name)) {
                    return res.status(400).json({ error: `Invalid tax name: ${tax.name}` });
                }
                if (typeof tax.amount !== 'number' || tax.amount < 0) {
                    return res.status(400).json({ error: `Invalid tax amount for ${tax.name}` });
                }
            }
        }

        const contributionDocs = contributions.map(c => ({
            employeeId,
            salaryMonth: c.salaryMonth,
            taxes: c.taxes
        }));

        for (const doc of contributionDocs) {
            await Contribution.findOneAndUpdate(
                { employeeId: doc.employeeId, salaryMonth: doc.salaryMonth },
                { $set: doc },
                { upsert: true, new: true }
            );
        }

        res.status(201).json({ message: 'Contributions saved' });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ error: 'Contribution already exists' });
        } else {
            res.status(500).json({ error: 'Failed to save contributions' });
        }
    }
};

const getEmployeeContributions = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const employeeIdNum = Number(employeeId);
        if (isNaN(employeeIdNum)) return res.status(400).json({ error: 'Invalid employeeId: must be a number' });

        const employee = await Employee.findOne({ id: employeeIdNum });
        if (!employee) return res.status(404).json({ error: `Employee with id ${employeeIdNum} not found` });

        const contributions = await Contribution.find({ employeeId: employeeIdNum }).sort({ salaryMonth: 1 }).lean();
        res.status(200).json(contributions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch contributions' });
    }
};

const getAllContributions = async (req, res) => {
    try {
        const contributions = await Contribution.find().lean();
        res.status(200).json(contributions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch contributions' });
    }
};

const calculatePagIBIGContribution = (salary) => {
    const maxSalary = 5000;
    const rate = 0.02;
    return Math.round(Math.min(salary, maxSalary) * rate);
};

const calculateSSSContribution = (salary) => {
    if (salary < 3250) return 135;
    if (salary >= 29750) return 1350;
    const employeeShare = 0.045;
    return Math.round((salary - 3250) * employeeShare + 135);
};

const calculatePhilHealthContribution = (salary) => {
    const rate = 0.025;
    const maxSalary = 100000;
    return Math.round(Math.min(salary, maxSalary) * rate);
};

module.exports = {
    getContributionRates,
    saveContributions,
    getEmployeeContributions,
    getAllContributions
};