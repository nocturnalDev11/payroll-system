import { jsPDF } from 'jspdf';
import nodemailer from 'nodemailer';
import { Employee } from '../../models/employee.model.js'; 
import { Payslip } from '../../models/payslip.model.js';
import {
    calculateSSSContribution,
    calculatePhilHealthContribution,
    calculatePagIBIGContribution,
    calculateWithholdingTax,
    calculateTotalEarnings,
    calculateTotalDeductions,
    calculateNetSalary
} from '../../utils/payrollCalculations.js';

export const generatePayslip = async (req, res) => {
    const { employeeId, salaryMonth } = req.body;

    try {
        const employee = await Employee.findById(employeeId).populate('payHeads');
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const baseSalary = employee.salary || 0;
        const payHeads = Array.isArray(employee.payHeads) ? employee.payHeads : [];

        // Calculate total earnings
        const totalEarnings = calculateTotalEarnings(baseSalary, payHeads);

        // Calculate total deductions (using total earnings as taxable income for simplicity)
        const totalDeductions = calculateTotalDeductions(baseSalary, payHeads, totalEarnings);

        // Calculate net salary
        const netSalary = calculateNetSalary(totalEarnings, totalDeductions);

        // Detailed deductions for reporting
        const sssContribution = calculateSSSContribution(baseSalary);
        const philHealthContribution = calculatePhilHealthContribution(baseSalary);
        const pagIbigContribution = calculatePagIBIGContribution(baseSalary);
        const withholdingTax = calculateWithholdingTax(totalEarnings); // Using totalEarnings as taxable income
        const deductions = payHeads.filter(p => p.type === 'Deductions');
        const totalCustomDeductions = deductions.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        // Detailed earnings for reporting
        const earnings = payHeads.filter(p => p.type === 'Earnings');
        const travelExpenses = earnings.find(p => p.name.toLowerCase().includes('travel'))?.amount || 0;
        const otherEarnings = earnings
            .filter(p => !p.name.toLowerCase().includes('travel'))
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        // Prepare payslip data
        const payslipData = {
            employeeIdNumber: employee.employeeIdNumber || 'N/A',
            firstName: employee.firstName || 'N/A',
            lastName: employee.lastName || 'N/A',
            middleName: employee.middleName || '',
            birthDate: employee.birthDate || 'N/A',
            hireDate: employee.hireDate || 'N/A',
            civilStatus: employee.civilStatus || 'SINGLE',
            dependents: employee.dependents || 0,
            sss: employee.sssNumber || 'N/A',
            tin: employee.tin || 'N/A',
            philHeath: employee.philHealthNumber || 'N/A',
            pagIbig: employee.pagIbigNumber || 'N/A',
            position: employee.position || 'N/A',
            salary: baseSalary,
            salaryMonth,
            totalSalary: netSalary,
            payHeads,
            deductions: {
                sss: sssContribution,
                philHealth: philHealthContribution,
                pagIbig: pagIbigContribution,
                tax: withholdingTax,
                customDeductions: deductions.map(d => ({ name: d.name, amount: d.amount }))
            },
            earnings: {
                travelExpenses,
                otherEarnings
            }
        };

        // Save payslip to database
        const payslip = new Payslip({
            employeeId: employee._id,
            payslipData: {
                baseSalary,
                earnings: payslipData.earnings,
                deductions: payslipData.deductions,
                netSalary
            },
            salaryMonth
        });
        await payslip.save();

        res.status(200).json(payslipData);
    } catch (error) {
        console.error('Error generating payslip:', error);
        res.status(500).json({ message: 'Failed to generate payslip', error: error.message });
    }
};

export const sendPayslipEmail = async (req, res) => {
    const { employeeId, employeeEmail, payslipData, salaryMonth } = req.body;

    try {
        const employee = await Employee.findById(employeeId);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: employeeEmail,
            subject: `Payslip for ${salaryMonth}`,
            text: `Dear ${employee.firstName},\n\nAttached is your payslip for ${salaryMonth}.\n\nBest regards,\nHR Team`,
            attachments: [{
                filename: `payslip-${employee.firstName}-${salaryMonth}.pdf`,
                content: payslipData.split(',')[1],
                encoding: 'base64'
            }]
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Payslip email sent successfully' });
    } catch (error) {
        console.error('Error sending payslip email:', error);
        res.status(500).json({ message: 'Failed to send payslip email', error: error.message });
    }
};