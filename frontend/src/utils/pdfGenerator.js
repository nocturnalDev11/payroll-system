import jsPDF from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';
import {
    calculatePayheadDeductions,
    calculateSSSContribution,
    calculatePhilHealthContribution,
    calculatePagIBIGContribution,
    calculateWithholdingTax,
    calculateLateDeductions,
} from '@/utils/calculations.js';

export function createPayslipData(employee, attendanceRecords, salaryMonth, paydayType, config) {
    const salaryDate = moment(salaryMonth, 'YYYY-MM').format('MM/DD/YYYY');
    const basicSalary = employee.salary || 0;

    const sanitizedPayheads = Array.isArray(employee.payheads)
        ? employee.payheads.filter((ph) => ph && typeof ph === 'object' && 'type' in ph && 'name' in ph && 'amount' in ph)
        : [];

    // Filter attendance records based on pay period
    const [year, month] = salaryMonth.split('-');
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = paydayType === 'mid-month' ? `${year}-${month}-01` : `${year}-${month}-16`;
    const endDate = paydayType === 'mid-month' ? `${year}-${month}-15` : `${year}-${month}-${lastDay}`;

    const filteredAttendanceRecords = attendanceRecords.filter(record => {
        const recordDate = moment(record.date).format('YYYY-MM-DD');
        return moment(recordDate).isSameOrAfter(startDate, 'day') && moment(recordDate).isSameOrBefore(endDate, 'day');
    });

    // Calculate late deductions for the specific pay period
    const lateDeduction = calculateLateDeductions(filteredAttendanceRecords, salaryMonth, paydayType);

    // Determine applicable deductions
    const payPeriodStart = moment(startDate);
    const payPeriodEnd = moment(endDate);

    // Include attendance-affected deductions if they were added before or during the pay period
    const applicablePayheads = sanitizedPayheads.filter(ph => {
        if (ph.type !== 'Deductions') return true; // Include earnings
        if (!ph.isAttendanceAffected) return true; // Include non-attendance-affected deductions

        // Include attendance-affected deductions if:
        // 1. There are attendance issues (late or absent), or
        // 2. The deduction's startDate is within or before the pay period
        const hasAttendanceIssues = filteredAttendanceRecords.some(record => record.status === 'Late' || record.status === 'Absent');
        const deductionStartDate = ph.startDate ? moment(ph.startDate) : moment(employee.hireDate || '1970-01-01');

        return hasAttendanceIssues || deductionStartDate.isSameOrBefore(payPeriodEnd, 'day');
    });

    const payheadDeductions = calculatePayheadDeductions(
        applicablePayheads.filter(ph => ph.type === 'Deductions')
    );

    const sss = calculateSSSContribution(basicSalary);
    const philhealth = calculatePhilHealthContribution(basicSalary);
    const pagibig = calculatePagIBIGContribution(basicSalary);
    const withholdingTax = calculateWithholdingTax(employee, config);
    const totalDeductions = sss + philhealth + pagibig + withholdingTax + payheadDeductions + lateDeduction;
    const netSalary = basicSalary - totalDeductions;

    const earnings = applicablePayheads
        .filter((ph) => ph.type === 'Earnings')
        .map((ph) => ({
            name: ph.name,
            amount: formatNumber(ph.amount),
        }));

    const deductions = applicablePayheads
        .filter((ph) => ph.type === 'Deductions')
        .map((ph) => ({
            name: ph.name,
            amount: formatNumber(ph.amount),
        }));

    if (lateDeduction > 0) {
        deductions.push({
            name: 'Late Deductions',
            amount: formatNumber(lateDeduction),
        });
    }

    return {
        salaryDate,
        empNo: employee.empNo || 'N/A',
        lastName: employee.lastName || 'N/A',
        middleName: employee.middleName || 'N/A',
        firstName: employee.firstName || 'N/A',
        birthDate: moment(employee.birthDate).isValid() ? moment(employee.birthDate).format('MM/DD/YYYY') : 'N/A',
        hireDate: moment(employee.hireDate).isValid() ? moment(employee.hireDate).format('MM/DD/YYYY') : 'N/A',
        civilStatus: employee.civilStatus || 'SINGLE',
        sss: employee.sss || 'N/A',
        tin: employee.tin || 'N/A',
        philhealth: employee.philhealth || 'N/A',
        pagibig: employee.pagibig || 'N/A',
        position: employee.position || 'N/A',
        salary: basicSalary,
        basicSalary: formatNumber(basicSalary),
        totalDeductions: formatNumber(totalDeductions),
        netSalary: formatNumber(netSalary),
        netPay: formatNumber(netSalary),
        sssDeduction: formatNumber(sss),
        philhealthDeduction: formatNumber(philhealth),
        pagibigDeduction: formatNumber(pagibig),
        withholdingTax: formatNumber(withholdingTax),
        payheads: sanitizedPayheads,
        earnings,
        deductions,
    };
}

function formatNumber(value) {
    return Number(value || 0).toFixed(2);
}

export function generatePdf(payslipData, doc) {
    const pdfDoc = doc || new jsPDF({ orientation: 'portrait', unit: 'mm', format: [216, 279] });
    pdfDoc.setFont('Helvetica');

    const margin = 10;
    const pageWidth = pdfDoc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - 2 * margin;
    const columnWidth = (contentWidth - 20) / 2;
    const lineHeight = 5;
    const pageHeight = pdfDoc.internal.pageSize.getHeight();

    function addText(doc, text, x, y, options = {}) {
        text = text?.toString() || 'N/A';
        text = text.replace('₱', 'P');
        doc.setFontSize(options.fontSize || 10);
        doc.setFont(options.font || 'Helvetica', options.fontStyle || 'normal');
        doc.setTextColor(...(options.textColor || [0, 0, 0]));
        doc.text(text, x, y, { align: options.align || 'left', maxWidth: options.maxWidth });
    }

    function addLabelValue(doc, label, value, x, y) {
        addText(doc, label, x, y, { fontSize: 9, fontStyle: 'bold' });
        addText(doc, value, x + 35, y, { fontSize: 9, maxWidth: columnWidth - 35 });
    }

    // Header
    pdfDoc.setFillColor(0, 128, 0);
    pdfDoc.rect(margin, margin, contentWidth, 10, 'F');
    addText(pdfDoc, 'RIGHTJOB Solutions', margin + 5, margin + 7, {
        fontSize: 12,
        fontStyle: 'bold',
        textColor: [255, 255, 255],
    });
    addText(pdfDoc, 'PAYSLIP', margin + contentWidth / 2, margin + 7, {
        fontSize: 12,
        fontStyle: 'bold',
        textColor: [255, 255, 255],
        align: 'center',
    });

    // Salary Date (top-right)
    let y = margin + 15;
    addText(pdfDoc, 'Salary Date:', margin + contentWidth - 40, y, { fontSize: 9 });
    const salaryDate = payslipData.salaryDate || `${payslipData.salaryMonth}/15`;
    addText(pdfDoc, salaryDate, margin + contentWidth - 20, y, { fontSize: 9 });

    // Personal Information (left column)
    y += 10;
    addText(pdfDoc, 'Personal Information', margin, y, { fontSize: 11, fontStyle: 'bold' });
    y += lineHeight;
    const leftPersonalInfo = [
        ['Emp No.', payslipData.empNo || 'N/A'],
        ['Last Name', payslipData.lastName || 'N/A'],
        ['Middle Name', payslipData.middleName || 'N/A'],
        ['First Name', payslipData.firstName || 'N/A'],
        ['Birth Date', payslipData.birthDate || 'N/A'],
        ['Hire Date', payslipData.hireDate || 'N/A'],
        ['Position', payslipData.position || 'N/A'],
        ['Basic Salary', `P${payslipData.basicSalary || '0.00'}`],
    ];
    leftPersonalInfo.forEach(([label, value], index) => {
        addLabelValue(pdfDoc, label, value, margin, y + index * lineHeight);
    });

    // Additional Info (right column)
    let yRight = y;
    addText(pdfDoc, 'Additional Info', margin + columnWidth + 10, yRight, { fontSize: 11, fontStyle: 'bold' });
    yRight += lineHeight;
    const rightPersonalInfo = [
        ['Civil Status', payslipData.civilStatus || 'N/A'],
        ['SSS', payslipData.sss || 'N/A'],
        ['TIN', payslipData.tin || 'N/A'],
        ['Philhealth', payslipData.philhealth || 'N/A'],
        ['PAG-IBIG', payslipData.pagibig || 'N/A'],
    ];
    rightPersonalInfo.forEach(([label, value], index) => {
        addLabelValue(pdfDoc, label, value, margin + columnWidth + 10, yRight + index * lineHeight);
    });

    // Move Y position down based on the tallest column
    y = Math.max(y + leftPersonalInfo.length * lineHeight, yRight + rightPersonalInfo.length * lineHeight) + 10;

    // Deductions Section
    addText(pdfDoc, 'Deductions', margin, y, { fontSize: 11, fontStyle: 'bold' });
    y += lineHeight;
    const leftDeductions = [
        ['SSS', `P${payslipData.sssDeduction || '0.00'}`],
        ['Philhealth', `P${payslipData.philhealthDeduction || '0.00'}`],
        ['PAG-IBIG', `P${payslipData.pagibigDeduction || '0.00'}`],
    ];
    const rightDeductions = [['Withholding Tax', `P${payslipData.withholdingTax || '0.00'}`]];
    leftDeductions.forEach(([label, value], index) => {
        addLabelValue(pdfDoc, label, value, margin, y + index * lineHeight);
    });
    rightDeductions.forEach(([label, value], index) => {
        addLabelValue(pdfDoc, label, value, margin + columnWidth + 10, y + index * lineHeight);
    });
    y += Math.max(leftDeductions.length, rightDeductions.length) * lineHeight + 5;

    // Summary Section
    addText(pdfDoc, 'Summary', margin, y, { fontSize: 11, fontStyle: 'bold' });
    y += lineHeight;
    addText(pdfDoc, 'Total Deductions:', margin, y, { fontSize: 9, fontStyle: 'bold' });
    addText(pdfDoc, `(P${payslipData.totalDeductions || '0.00'})`, margin + 35, y, { fontSize: 9 });
    addText(pdfDoc, 'Net Salary:', margin + columnWidth + 10, y, { fontSize: 9, fontStyle: 'bold' });
    addText(pdfDoc, `P${payslipData.netPay || '0.00'}`, margin + columnWidth + 45, y, { fontSize: 9 });
    y += lineHeight + 10;

    // Earnings Section
    addText(pdfDoc, 'Earnings', margin, y, { fontSize: 11, fontStyle: 'bold' });
    y += lineHeight;
    if (payslipData.earnings && payslipData.earnings.length > 0) {
        const earningsTableData = payslipData.earnings.map((earning) => [
            earning.name,
            `P${earning.amount}`,
        ]);
        pdfDoc.autoTable({
            startY: y,
            head: [['Description', 'Amount']],
            body: earningsTableData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9, cellPadding: 1.5 },
            headStyles: { fillColor: [0, 128, 0], textColor: [255, 255, 255] },
            columnStyles: {
                0: { cellWidth: contentWidth * 0.7 },
                1: { cellWidth: contentWidth * 0.3, halign: 'right' },
            },
        });
        y = pdfDoc.lastAutoTable.finalY + 5;
    } else {
        addText(pdfDoc, 'None', margin, y, { fontSize: 9 });
        y += lineHeight + 5;
    }

    // Other Deductions Section
    addText(pdfDoc, 'Other Deductions', margin, y, { fontSize: 11, fontStyle: 'bold' });
    y += lineHeight;
    if (payslipData.deductions && payslipData.deductions.length > 0) {
        const deductionsTableData = payslipData.deductions.map((deduction) => [
            deduction.name,
            `P${deduction.amount}`,
        ]);
        pdfDoc.autoTable({
            startY: y,
            head: [['Description', 'Amount']],
            body: deductionsTableData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9, cellPadding: 1.5 },
            headStyles: { fillColor: [0, 128, 0], textColor: [255, 255, 255] },
            columnStyles: {
                0: { cellWidth: contentWidth * 0.7 },
                1: { cellWidth: contentWidth * 0.3, halign: 'right' },
            },
        });
        y = pdfDoc.lastAutoTable.finalY + 5;
    } else {
        addText(pdfDoc, 'None', margin, y, { fontSize: 9 });
        y += lineHeight + 5;
    }

    // Footer
    const footerY = pageHeight - margin - 5;
    if (y > footerY - 10) {
        pdfDoc.addPage();
        y = margin;
    }
    addText(pdfDoc, 'This is a computer-generated payslip; no signature required.', margin + contentWidth / 2, footerY, {
        fontSize: 8,
        align: 'center',
    });

    return doc ? undefined : pdfDoc.output('blob');
}