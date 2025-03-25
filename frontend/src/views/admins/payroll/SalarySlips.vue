<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import moment from 'moment';
import { BASE_API_URL } from '@/utils/constants';

const employees = ref([]);
const searchQuery = ref('');
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const currentPage = ref(1);
const itemsPerPage = ref(5);
const payslipGenerationStatus = ref({});
const isLoading = ref(false);
const statusMessage = ref('');
const isSuccess = ref(false);
const minimumWage = ref(610);
const deMinimisLimit = ref(10000);
const showPayslipModal = ref(false);
const selectedEmployee = ref(null);
const payslipDataUrl = ref('');
const iframeError = ref(false);
const payslips = ref({});
const regularHolidays = ref([
    '01/01/2025', '04/09/2025', '04/17/2025', '04/18/2025', '05/01/2025',
    '06/12/2025', '08/25/2025', '11/30/2025', '12/25/2025', '12/30/2025'
]);
const specialNonWorkingDays = ref(['02/08/2025', '04/19/2025', '08/26/2025']);
const tableHeaders = ref([
    { key: 'name', label: 'Employee Name', icon: 'person' },
    { key: 'rate', label: 'Hourly Rate', icon: 'payments' },
    { key: 'earnings', label: 'Total Earnings', icon: 'trending_up' },
    { key: 'deductions', label: 'Total Deductions', icon: 'trending_down' },
    { key: 'salary', label: 'Net Salary', icon: 'account_balance_wallet' },
    { key: 'month', label: 'Salary Month', icon: 'event' },
    { key: 'actions', label: 'Actions', icon: 'more_horiz' },
]);

const filteredEmployees = computed(() => {
    return employees.value.filter(employee =>
        employee.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

const totalPages = computed(() => {
    return Math.ceil(filteredEmployees.value.length / itemsPerPage.value) || 1;
});

const paginatedEmployees = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredEmployees.value.slice(start, end);
});

const fetchEmployees = async () => {
    isLoading.value = true;
    statusMessage.value = '';
    try {
        const response = await axios.get(`${BASE_API_URL}/api/employees`, {
            params: { month: selectedMonth.value }
        });
        console.log('API Response:', response.data);
        employees.value = response.data.map(employee => {
            const payHeads = Array.isArray(employee.payHeads) ? employee.payHeads : [];
            return {
                id: employee.id,
                employeeIdNumber: employee.employeeIdNumber || 'N/A',
                name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
                lastName: employee.lastName || 'N/A',
                middleName: employee.middleName || 'N/A',
                firstName: employee.firstName || 'N/A',
                birthDate: employee.birthDate || 'N/A',
                hireDate: employee.hireDate || 'N/A',
                civilStatus: employee.civilStatus || 'SINGLE',
                dependents: employee.dependents || 0,
                sss: employee.sss || 'N/A',
                tin: employee.tin || 'N/A',
                philHeath: employee.philHeath || 'N/A',
                pagIbig: employee.pagIbig || 'N/A',
                hourlyRate: employee.hourlyRate || (employee.salary / (8 * 22)) || 0,
                totalEarnings: employee.totalEarnings || calculateTotalEarnings(employee) || 0,
                totalDeductions: employee.totalDeductions || calculateTotalDeductions(employee) || 0,
                totalSalary: employee.netSalary || calculateNetSalary(employee) || 0,
                salaryMonth: formatSalaryMonth(selectedMonth.value),
                email: employee.email || 'N/A',
                position: employee.position || 'N/A',
                payHeads,
                rawData: employee,
                salary: employee.salary || 0,
                commission: employee.commission || 0,
                profitSharing: employee.profitSharing || 0,
                fees: employee.fees || 0,
                thirteenthMonthPay: employee.thirteenthMonthPay || 0,
                hazardPay: employee.hazardPay || 0,
                overtimeHours: employee.overtimeHours || { regular: 0, holiday: 0 },
                nightShiftDiff: employee.nightShiftDiff || 0,
                deMinimis: employee.deMinimis || 0,
                otherTaxable: employee.otherTaxable || 0,
                paidLeaves: employee.paidLeaves || { days: 0, amount: 0 },
                absences: employee.absences || { days: 0, amount: 0 }
            };
        });
        showSuccessMessage('Employees loaded successfully!');
    } catch (error) {
        console.error('Error fetching employees:', error);
        showErrorMessage('Failed to load employees. Please try again.');
    } finally {
        isLoading.value = false;
    }
};

const refreshData = async () => await fetchEmployees();

const calculateTotalEarnings = (employee) => {
    const baseSalary = employee.salary || 0;
    const payHeads = Array.isArray(employee.payHeads) ? employee.payHeads : [];
    const earnings = payHeads.filter(p => p && p.type === 'Earnings');
    const totalEarningsFromPayHeads = earnings.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return baseSalary + totalEarningsFromPayHeads;
};

const calculatePayHeadEarnings = (payHeads) => {
    if (!Array.isArray(payHeads)) return 0;
    return payHeads
        .filter(p => p && p.type === 'Earnings')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
};

const calculatePayHeadDeductions = (payHeads) => {
    if (!Array.isArray(payHeads)) return 0;
    return payHeads
        .filter(p => p && p.type === 'Deductions')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
};

const calculateSupplementaryIncome = (employee) => {
    const commission = employee.commission || 0;
    const profitSharing = employee.profitSharing || 0;
    const fees = employee.fees || 0;
    const thirteenthMonthPay = employee.thirteenthMonthPay || 0;
    const hazardPay = employee.hazardPay || 0;
    const overtimePay = calculateOvertimePay(employee) || 0;
    const otherTaxable = employee.otherTaxable || 0;

    const totalSupplementary = commission + profitSharing + fees + thirteenthMonthPay + hazardPay + overtimePay + otherTaxable;
    const exemptThirteenthMonth = Math.min(thirteenthMonthPay, 90000) || 0;
    const taxableThirteenthMonth = Math.max(0, thirteenthMonthPay - 90000) || 0;
    const taxableSupplementaryIncome = commission + profitSharing + fees + taxableThirteenthMonth + hazardPay + overtimePay + otherTaxable;

    return {
        taxable: taxableSupplementaryIncome || 0,
        nonTaxable: exemptThirteenthMonth || 0,
        commission,
        profitSharing,
        fees,
        thirteenthMonthPay: taxableThirteenthMonth,
        hazardPay,
        overtimePay,
        otherTaxable,
        totalSupplementary
    };
};

const calculateNonTaxableIncome = (employee) => {
    const isMWE = (employee.salary / 30) <= minimumWage.value;
    const basicSalaryMWE = isMWE ? (employee.salary || 0) : 0;
    const holidayPayMWE = isMWE ? (calculateHolidayPay(employee) || 0) : 0;
    const overtimePayMWE = isMWE ? (calculateOvertimePay(employee) || 0) : 0;
    const nightShiftDiffMWE = isMWE ? (employee.nightShiftDiff || 0) : 0;
    const hazardPayMWE = isMWE ? (employee.hazardPay || 0) : 0;
    const thirteenthMonthExempt = Math.min(employee.thirteenthMonthPay || 0, 90000) || 0;
    const deMinimis = Math.min(employee.deMinimis || 0, deMinimisLimit.value) || 0;
    const sssContribution = calculateSSSContribution(employee.salary) || 0;
    const philHeathContribution = calculatePhilHealthContribution(employee.salary) || 0;
    const pagibigContribution = calculatePagIBIGContribution(employee.salary) || 0;

    const totalNonTaxable = basicSalaryMWE + holidayPayMWE + overtimePayMWE + nightShiftDiffMWE + hazardPayMWE + thirteenthMonthExempt + deMinimis + sssContribution + philHeathContribution + pagibigContribution;

    return {
        basicSalaryMWE,
        holidayPayMWE,
        overtimePayMWE,
        nightShiftDiffMWE,
        hazardPayMWE,
        thirteenthMonthExempt,
        deMinimis,
        sssContribution,
        philHeathContribution,
        pagibigContribution,
        totalNonTaxable
    };
};

const calculateTotalDeductions = (employee) => {
    const baseSalary = employee.salary || 0;
    const payHeads = Array.isArray(employee.payHeads) ? employee.payHeads : [];
    const sssContribution = calculateSSSContribution(baseSalary);
    const philHealthContribution = calculatePhilHealthContribution(baseSalary);
    const pagIbigContribution = calculatePagIBIGContribution(baseSalary);
    const withholdingTax = calculateWithholdingTax(calculateTotalEarnings(employee));
    const deductions = payHeads.filter(p => p && p.type === 'Deductions');
    const totalCustomDeductions = deductions.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return sssContribution + philHealthContribution + pagIbigContribution + withholdingTax + totalCustomDeductions;
};

const calculateNetSalary = (employee) => {
    const totalEarnings = calculateTotalEarnings(employee);
    const totalDeductions = calculateTotalDeductions(employee);
    return totalEarnings - totalDeductions;
};

const calculateHolidayPay = (employee) => {
    const dailyRate = (employee.salary || 0) / 30 || 0;
    const salaryMonth = formatSalaryMonth(selectedMonth.value).split(' ')[0];
    const isRegularHoliday = regularHolidays.value.some(holiday =>
        moment(holiday, 'MM/DD/YYYY').format('MMMM') === salaryMonth
    );
    const isSpecialHoliday = specialNonWorkingDays.value.some(holiday =>
        moment(holiday, 'MM/DD/YYYY').format('MMMM') === salaryMonth
    );
    if (isRegularHoliday) return dailyRate * 2 || 0;
    if (isSpecialHoliday) return dailyRate * 1.3 || 0;
    return 0;
};

const calculateOvertimePay = (employee) => {
    const hourlyRate = employee.hourlyRate || (employee.salary / (8 * 22)) || 0;
    const regularOTHours = employee.overtimeHours?.regular || 0;
    const holidayOTHours = employee.overtimeHours?.holiday || 0;
    const regularOTPay = regularOTHours * hourlyRate * 1.25 || 0;
    const holidayOTPay = holidayOTHours * hourlyRate * 1.3 || 0;
    return regularOTPay + holidayOTPay || 0;
};

const calculateSSSContribution = (salary) => {
    const monthlySalary = Math.max(salary || 0, 0);
    if (monthlySalary < 5000) return 250;

    const salaryCredit = Math.min(Math.max(monthlySalary, 5000), 35000);
    const regularSSContribution = Math.round(salaryCredit * 0.05);
    let mpfContribution = 0;

    if (salaryCredit > 20000) {
        const mpfBase = Math.min(salaryCredit, 35000) - 20000;
        mpfContribution = Math.round(mpfBase * 0.025);
    }

    let totalEmployeeContribution = regularSSContribution + mpfContribution;
    if (salaryCredit > 34750) {
        totalEmployeeContribution = 1750;
    }
    return totalEmployeeContribution;
};

const calculatePhilHealthContribution = (salary) => {
    const monthlySalary = Math.max(salary || 0, 0);
    const minSalary = 10000;
    const maxSalary = 100000;
    const cappedSalary = Math.min(Math.max(monthlySalary, minSalary), maxSalary);
    return Math.round(cappedSalary * 0.025);
};

const calculatePagIBIGContribution = (salary) => {
    const monthlySalary = Math.max(salary || 0, 0);
    const maxSalary = 5000;
    const cappedSalary = Math.min(monthlySalary, maxSalary);
    let rate = 0.02;
    if (cappedSalary <= 1500) {
        rate = 0.01;
    }
    return Math.round(cappedSalary * rate);
};

const calculateWithholdingTax = (taxableIncome) => {
    const income = taxableIncome || 0;
    if (income <= 20833) return 0;
    if (income <= 33333) return Math.round((income - 20833) * 0.15);
    if (income <= 66667) return Math.round(1875 + (income - 33333) * 0.20);
    if (income <= 166667) return Math.round(13541.80 + (income - 66667) * 0.25);
    if (income <= 666667) return Math.round(90841.80 + (income - 166667) * 0.30);
    return Math.round(408841.80 + (income - 666667) * 0.35);
};

const formatSalaryMonth = (month) => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const prevPage = () => {
    if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) currentPage.value++;
};

const generatePayslip = async (employee) => {
    payslipGenerationStatus.value[employee.id] = { generating: true };
    statusMessage.value = '';
    try {
        const payslipData = createPayslipData(employee);
        const pdfBlob = await generatePdf(payslipData);
        const url = URL.createObjectURL(pdfBlob);
        payslips.value[employee.id] = url;
        showSuccessMessage(`Payslip generated for ${employee.name}!`);
    } catch (error) {
        console.error('Error generating payslip:', error);
        showErrorMessage(`Failed to generate payslip for ${employee.name}.`);
    } finally {
        payslipGenerationStatus.value[employee.id] = { generating: false };
    }
};

const createPayslipData = (employee) => {
    const salaryDate = moment(employee.salaryMonth, 'MMMM D, YYYY').format('MM/DD/YYYY');
    const basicSalary = employee.salary || 0;
    const sss = calculateSSSContribution(employee.salary) || 0;
    const philHeath = calculatePhilHealthContribution(employee.salary) || 0;
    const pagIbig = calculatePagIBIGContribution(employee.salary) || 0;
    const totalDeductions = sss + philHeath + pagIbig + (calculateWithholdingTax(employee) || 0);
    const netSalary = employee.totalSalary || calculateNetSalary(employee) || 0;
    const paidLeavesDays = employee.paidLeaves?.days || 0;
    const absencesDays = employee.absences?.days || 0;
    const paidLeavesAmount = employee.paidLeaves?.amount || 0;
    const absencesAmount = -(employee.absences?.amount || 0);

    // Calculate expected paydays (example: mid-month 15th, end-of-month last working day)
    const [month, year] = employee.salaryMonth.split('-');
    const midMonthPayday = moment(`${year}-${month}-15`).format('MM/DD/YYYY');
    const endMonthPayday = moment(`${year}-${month}-01`).endOf('month').format('MM/DD/YYYY');
    let lastWorkingDay = moment(endMonthPayday);
    while (lastWorkingDay.day() === 0 || lastWorkingDay.day() === 6) { // Skip weekends (0 = Sunday, 6 = Saturday)
        lastWorkingDay.subtract(1, 'day');
    }
    const formattedEndMonthPayday = lastWorkingDay.format('MM/DD/YYYY');

    return {
        salaryDate,
        employeeIdNumber: employee.employeeIdNumber || 'N/A',
        lastName: employee.lastName || 'N/A',
        middleName: employee.middleName || 'N/A',
        firstName: employee.firstName || 'N/A',
        birthDate: employee.birthDate === 'N/A' || !moment(employee.birthDate).isValid() ? 'N/A' : moment(employee.birthDate).format('MM/DD/YYYY'),
        hireDate: employee.hireDate === 'N/A' || !moment(employee.hireDate).isValid() ? 'N/A' : moment(employee.hireDate).format('MM/DD/YYYY'),
        civilStatus: employee.civilStatus || 'SINGLE',
        dependents: employee.dependents || 0,
        sss: employee.sss || 'N/A',
        tin: employee.tin || 'N/A',
        philHeath: employee.philHeath || 'N/A',
        pagIbig: employee.pagIbig || 'N/A',
        position: employee.position || 'N/A',
        basicSalary: formatNumber(basicSalary),
        totalDeductions: formatNumber(totalDeductions),
        netSalary: formatNumber(netSalary),
        sssDeduction: formatNumber(sss),
        philHeathDeduction: formatNumber(philHeath),
        pagIbigDeduction: formatNumber(pagIbig),
        paidLeavesDays,
        absencesDays,
        paidLeavesAmount: formatNumber(paidLeavesAmount),
        absencesAmount: formatNumber(absencesAmount),
        withholdingTax: formatNumber(calculateWithholdingTax(employee) || 0),
        payHeads: employee.payHeads || [],
        expectedPaydays: {
            midMonthPayday,
            endMonthPayday: formattedEndMonthPayday
        }
    };
};

const formatNumber = (value) => {
    const num = Number(value) || 0;
    return num.toFixed(2);
};

const generatePdf = async (payslipData) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [216, 279] // Letter size: 8.5" x 11"
    });

    // Use Helvetica as the default font (supports basic Unicode, fallback for ₱)
    doc.setFont('Helvetica');

    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - 2 * margin;
    const columnWidth = (contentWidth - 20) / 2; // Two columns with 10mm gap between them
    const lineHeight = 5;
    const pageHeight = doc.internal.pageSize.getHeight();

    // Helper function to add text with options
    function addText(doc, text, x, y, options = {}) {
        text = text || 'N/A';
        // Replace ₱ with P for fallback (if ₱ doesn't render properly)
        text = text.replace('₱', 'P');
        doc.setFontSize(options.fontSize || 10);
        doc.setFont(options.font || 'Helvetica', options.fontStyle || 'normal');
        doc.setTextColor(...(options.textColor || [0, 0, 0]));
        doc.text(text, x, y, { align: options.align || 'left', maxWidth: options.maxWidth });
    }

    // Helper function to add label-value pair with proper alignment
    function addLabelValue(doc, label, value, x, y) {
        addText(doc, label, x, y, { fontSize: 9, fontStyle: 'bold' });
        addText(doc, value, x + 35, y, { fontSize: 9, maxWidth: columnWidth - 35 });
    }

    // Header
    doc.setFillColor(0, 128, 0); // Green background
    doc.rect(margin, margin, contentWidth, 10, 'F');
    addText(doc, 'RIGHTJOB Solutions', margin + 5, margin + 7, { fontSize: 12, fontStyle: 'bold', textColor: [255, 255, 255] });
    addText(doc, 'PAYSLIP', margin + contentWidth / 2, margin + 7, { fontSize: 12, fontStyle: 'bold', textColor: [255, 255, 255], align: 'center' });

    // Salary Date (Top Right)
    let y = margin + 15;
    addText(doc, 'Salary Date:', margin + contentWidth - 40, y, { fontSize: 9 });
    addText(doc, payslipData.salaryDate, margin + contentWidth - 20, y, { fontSize: 9 });

    // Two-Column Layout
    y += 10;

    // Personal Information (Left Column)
    addText(doc, 'Personal Information', margin, y, { fontSize: 11, fontStyle: 'bold' });
    y += lineHeight;
    const leftPersonalInfo = [
        ['Emp No.', payslipData.employeeIdNumber],
        ['Last Name', payslipData.lastName],
        ['Middle Name', payslipData.middleName],
        ['First Name', payslipData.firstName],
        ['Birth Date', payslipData.birthDate],
        ['Hire Date', payslipData.hireDate],
        ['Position', payslipData.position],
        ['Basic Salary', `P${payslipData.basicSalary}`]
    ];
    leftPersonalInfo.forEach(([label, value], index) => {
        addLabelValue(doc, label, value, margin, y + index * lineHeight);
    });

    // Additional Info (Right Column)
    let yRight = y;
    addText(doc, 'Additional Info', margin + columnWidth + 10, yRight, { fontSize: 11, fontStyle: 'bold' });
    yRight += lineHeight;
    const rightPersonalInfo = [
        ['Civil Status', payslipData.civilStatus],
        ['Dependents', payslipData.dependents.toString()],
        ['SSS', payslipData.sss],
        ['TIN', payslipData.tin],
        ['Philhealth', payslipData.philHeath],
        ['HDMF', payslipData.pagIbig]
    ];
    rightPersonalInfo.forEach(([label, value], index) => {
        addLabelValue(doc, label, value, margin + columnWidth + 10, yRight + index * lineHeight);
    });

    // Adjust y to the tallest column
    y = Math.max(y + leftPersonalInfo.length * lineHeight, yRight + rightPersonalInfo.length * lineHeight) + 10;

    // Expected Paydays (Two Columns)
    addText(doc, 'Expected Paydays', margin, y, { fontSize: 11, fontStyle: 'bold' });
    addText(doc, 'Mid-Month:', margin, y + lineHeight);
    addText(doc, payslipData.expectedPaydays.midMonthPayday, margin + 35, y + lineHeight, { maxWidth: columnWidth - 35 });
    addText(doc, 'End-of-Month:', margin + columnWidth + 10, y + lineHeight);
    addText(doc, payslipData.expectedPaydays.endMonthPayday, margin + columnWidth + 45, y + lineHeight, { maxWidth: columnWidth - 35 });
    y += 2 * lineHeight + 10;

    // Deductions (Two Columns)
    addText(doc, 'Deductions', margin, y, { fontSize: 11, fontStyle: 'bold' });
    y += lineHeight;
    const leftDeductions = [
        ['SSS', `P${payslipData.sssDeduction}`],
        ['Philhealth', `P${payslipData.philHeathDeduction}`],
        ['HDMF', `P${payslipData.pagIbigDeduction}`]
    ];
    leftDeductions.forEach(([label, value], index) => {
        addLabelValue(doc, label, value, margin, y + index * lineHeight);
    });

    const rightDeductions = [
        ['Withholding Tax', `P${payslipData.withholdingTax}`]
    ];
    rightDeductions.forEach(([label, value], index) => {
        addLabelValue(doc, label, value, margin + columnWidth + 10, y + index * lineHeight);
    });
    y += Math.max(leftDeductions.length, rightDeductions.length) * lineHeight + 10;

    // Summary (Two Columns)
    addText(doc, 'Summary', margin, y, { fontSize: 11, fontStyle: 'bold' });
    y += lineHeight;
    addText(doc, 'Total Deductions:', margin, y, { fontSize: 9, fontStyle: 'bold' });
    addText(doc, `(P${payslipData.totalDeductions})`, margin + 35, y, { fontSize: 9 });
    addText(doc, 'Net Salary:', margin + columnWidth + 10, y, { fontSize: 9, fontStyle: 'bold' });
    addText(doc, `P${payslipData.netSalary}`, margin + columnWidth + 45, y, { fontSize: 9 });
    y += lineHeight + 10;

    // Footer
    const footerY = pageHeight - margin - 5;
    addText(doc, 'This is a computer-generated payslip; no signature required.', margin + contentWidth / 2, footerY, { fontSize: 8, align: 'center' });

    return doc.output('blob');
};

const viewPayslip = (employee) => {
    selectedEmployee.value = employee;
    const payslipUrl = payslips.value[employee.id];
    if (payslipUrl) {
        payslipDataUrl.value = payslipUrl;
        showPayslipModal.value = true;
        iframeError.value = false;
        showSuccessMessage(`Viewing payslip for ${employee.name} for ${employee.salaryMonth}`);
    } else {
        showErrorMessage(`No payslip found for ${employee.name} for ${employee.salaryMonth}. Please generate it first.`);
    }
};

const hasPayslip = (employee) => !!payslips.value[employee.id];

const sendPayslipEmail = async (employee) => {
    payslipGenerationStatus.value[employee.id] = { sending: true };
    statusMessage.value = '';
    try {
        if (!payslips.value[employee.id]) {
            await generatePayslip(employee);
        }
        const payslipData = payslips.value[employee.id].split(',')[1];
        if (!payslipData) throw new Error('Invalid payslip data');

        const response = await axios.post(`${BASE_API_URL}/api/payslips/send-email`, {
            employeeId: employee.id,
            employeeEmail: employee.email,
            payslipData: `data:application/pdf;base64,${payslipData}`,
            salaryMonth: employee.salaryMonth
        });

        if (response.status === 200) {
            showSuccessMessage(`Payslip email sent to ${employee.name} at ${employee.email}`);
        }
    } catch (error) {
        console.error('Error sending payslip email:', error);
        showErrorMessage(`Failed to send payslip email to ${employee.name}: ${error.message}`);
    } finally {
        payslipGenerationStatus.value[employee.id] = { sending: false };
    }
};

const showSuccessMessage = (message) => {
    statusMessage.value = message;
    isSuccess.value = true;
    setTimeout(() => {
        statusMessage.value = '';
        isSuccess.value = false;
    }, 3000);
};

const showErrorMessage = (message) => {
    statusMessage.value = message;
    isSuccess.value = false;
    setTimeout(() => {
        statusMessage.value = '';
        isSuccess.value = false;
    }, 5000);
};

const onIframeLoad = () => {
    console.log('iFrame loaded successfully');
    iframeError.value = false;
};

const onIframeError = () => {
    console.error('iFrame failed to load');
    iframeError.value = true;
};

onMounted(() => {
    fetchEmployees();
});
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div class="max-w-7xl mx-auto">
            <!-- Header Section -->
            <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="relative">
                        <span class="material-icons absolute left-2 top-2 text-gray-400 text-sm">search</span>
                        <input v-model="searchQuery" type="text" placeholder="Search employee by name..."
                            class="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                    </div>
                    <div class="relative">
                        <span class="material-icons absolute left-2 top-2 text-gray-400 text-sm">calendar_today</span>
                        <input v-model="selectedMonth" type="month"
                            class="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-400"
                            @change="fetchEmployees" />
                    </div>
                    <button @click="refreshData"
                        class="flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded-md"
                        :disabled="isLoading">
                        <span class="material-icons text-sm">{{ isLoading ? 'sync' : 'refresh' }}</span>
                        {{ isLoading ? 'Refreshing...' : 'Refresh Data' }}
                    </button>
                </div>
            </div>

            <!-- Main Content -->
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th v-for="header in tableHeaders" :key="header.key"
                                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                                    <div class="flex items-center gap-1">
                                        <span class="material-icons text-gray-400 text-sm">{{ header.icon }}</span>
                                        {{ header.label }}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="employee in paginatedEmployees" :key="employee.id"
                                class="hover:bg-blue-50 transition-colors">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <span class="material-icons text-gray-400 text-sm">person</span>
                                        <div>
                                            <div class="text-sm font-medium text-gray-900">{{ employee.name }}</div>
                                            <div class="text-xs text-gray-500">ID: {{ employee.employeeIdNumber }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-900">₱{{ employee.hourlyRate.toLocaleString() }}
                                </td>
                                <td class="px-4 py-3 text-sm text-green-600">₱{{ employee.totalEarnings.toLocaleString()
                                }}</td>
                                <td class="px-4 py-3 text-sm text-red-600">₱{{ employee.totalDeductions.toLocaleString()
                                }}</td>
                                <td class="px-4 py-3 text-sm text-blue-600 font-medium">₱{{
                                    employee.totalSalary.toLocaleString() }}</td>
                                <td class="px-4 py-3 text-sm">{{ employee.salaryMonth }}</td>
                                <td class="px-4 py-3">
                                    <div class="flex gap-2">
                                        <button @click="generatePayslip(employee)"
                                            class="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                            :disabled="payslipGenerationStatus[employee.id]?.generating">
                                            <span class="material-icons text-sm">description</span>
                                            {{ payslipGenerationStatus[employee.id]?.generating ? 'Generating...' :
                                                'Generate' }}
                                        </button>
                                        <button @click="viewPayslip(employee)"
                                            class="inline-flex items-center gap-1 px-3 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
                                            :disabled="!hasPayslip(employee)">
                                            <span class="material-icons text-sm">visibility</span>
                                            View
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="paginatedEmployees.length === 0 && !isLoading">
                                <td colspan="7" class="px-4 py-8 text-center">
                                    <div class="flex flex-col items-center gap-2">
                                        <span class="material-icons text-gray-400 text-3xl">search_off</span>
                                        <p class="text-sm text-gray-500">No employees found for this month.</p>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="isLoading">
                                <td colspan="7" class="px-4 py-8 text-center">
                                    <div class="flex flex-col items-center gap-2">
                                        <span class="material-icons text-blue-500 animate-spin text-3xl">sync</span>
                                        <p class="text-sm text-gray-500">Loading employees...</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="flex items-center justify-between px-4 py-3 bg-gray-50">
                    <div class="text-xs text-gray-700">
                        Showing page {{ currentPage }} of {{ totalPages }}
                    </div>
                    <div class="flex gap-2">
                        <button @click="prevPage" :disabled="currentPage === 1 || isLoading"
                            class="inline-flex items-center px-3 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                            <span class="material-icons text-sm mr-1">chevron_left</span>
                            Previous
                        </button>
                        <button @click="nextPage" :disabled="currentPage === totalPages || isLoading"
                            class="inline-flex items-center px-3 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                            Next
                            <span class="material-icons text-sm ml-1">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Payslip Modal -->
            <div v-if="showPayslipModal"
                class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl">
                    <div class="flex items-center justify-between p-4 border-b">
                        <h2 class="text-base font-medium text-gray-800 flex items-center gap-1">
                            <span class="material-icons text-sm">description</span>
                            Payslip - {{ selectedEmployee?.name }}
                        </h2>
                        <button @click="showPayslipModal = false" class="p-1 hover:bg-gray-100 rounded-full">
                            <span class="material-icons text-sm">close</span>
                        </button>
                    </div>
                    <div class="p-4">
                        <iframe :src="payslipDataUrl" class="w-full h-[60vh] rounded border" @load="onIframeLoad"
                            @error="onIframeError"></iframe>
                        <div v-if="iframeError"
                            class="mt-3 p-3 bg-red-50 text-red-700 rounded text-sm flex items-center gap-1">
                            <span class="material-icons text-sm">error</span>
                            Error loading payslip. Please try again.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Toast Messages -->
            <div v-if="statusMessage" :class="[
                isSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
                'fixed bottom-4 right-4 p-3 rounded shadow-lg z-50 flex items-center gap-1 animate-fade-in text-sm'
            ]">
                <span class="material-icons text-sm">
                    {{ isSuccess ? 'check_circle' : 'error' }}
                </span>
                {{ statusMessage }}
            </div>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.transition-colors {
    transition: background-color 0.2s ease-in-out;
}

.hover\:bg-blue-50:hover {
    background-color: #eff6ff;
}

.animate-fade-in {
    animation: fade-in 0.3s ease-out;
}

.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(1rem);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>