<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { BASE_API_URL } from '@/utils/constants.ts';
import { useAuthStore } from '@/stores/auth.store';
import axios from 'axios';
import Modal from '@/components/Modal.vue';
import Toast from '@/components/Toast.vue';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import moment from 'moment';

// State
const employee = ref(null);
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const isGenerating = ref(false);
const statusMessage = ref(null);
const statusType = ref('info');
const iframeError = ref(false);
const payslips = ref({});
const router = useRouter();
const authStore = useAuthStore();

const showPayslipModal = ref(false);
const showDetailsModal = ref(false);
const payslipDataUrl = ref('');

// Methods
const fetchEmployeeData = async () => {
    try {
        const employeeId = authStore.employee?.employeeIdNumber;
        if (!employeeId) {
            showErrorMessage('User not logged in. Redirecting to login...');
            setTimeout(() => router.push('/employee/login'), 2000);
            return;
        }

        const response = await axios.get(`${BASE_API_URL}/api/employees/${employeeId}/salary`, {
            params: { month: selectedMonth.value },
            headers: { 'Authorization': `Bearer ${authStore.accessToken}` }
        });

        console.log('API Response:', response.data); // Debug the response

        if (!response.data) throw new Error('No salary data returned from server');

        // Process single employee object
        const employeeData = response.data;
        employee.value = {
            id: employeeData.id,
            employeeIdNumber: employeeData.employeeIdNumber || 'N/A',
            name: `${employeeData.firstName || ''} ${employeeData.lastName || ''}`.trim() || 'N/A',
            lastName: employeeData.lastName || 'N/A',
            middleName: employeeData.middleName || 'N/A',
            firstName: employeeData.firstName || 'N/A',
            birthDate: employeeData.birthDate || 'N/A',
            hireDate: employeeData.hireDate || 'N/A',
            civilStatus: employeeData.civilStatus || 'SINGLE',
            dependents: employeeData.dependents || 0,
            sss: employeeData.sss || 'N/A',
            tin: employeeData.tin || 'N/A',
            philHeath: employeeData.philHeath || 'N/A',
            pagIbig: employeeData.pagIbig || 'N/A',
            hourlyRate: employeeData.hourlyRate || (employeeData.salary / (8 * 22)) || 0,
            totalEarnings: employeeData.totalEarnings || calculateTotalEarnings(employeeData) || 0,
            totalDeductions: employeeData.totalDeductions || calculateTotalDeductions(employeeData) || 0,
            totalSalary: employeeData.netSalary || calculateNetSalary(employeeData) || 0,
            salaryMonth: formatSalaryMonth(selectedMonth.value),
            email: employeeData.email || 'N/A',
            position: employeeData.position || 'N/A',
            payHeads: Array.isArray(employeeData.payHeads) ? employeeData.payHeads : [],
            rawData: employeeData,
            salary: employeeData.salary || 0,
            commission: employeeData.commission || 0,
            profitSharing: employeeData.profitSharing || 0,
            fees: employeeData.fees || 0,
            thirteenthMonthPay: employeeData.thirteenthMonthPay || 0,
            hazardPay: employeeData.hazardPay || 0,
            overtimeHours: employeeData.overtimeHours || { regular: 0, holiday: 0 },
            nightShiftDiff: employeeData.nightShiftDiff || 0,
            deMinimis: employeeData.deMinimis || 0,
            otherTaxable: employeeData.otherTaxable || 0,
            paidLeaves: employeeData.paidLeaves || { days: 0, amount: 0 },
            absences: employeeData.absences || { days: 0, amount: 0 }
        };

        statusMessage.value = null;
    } catch (error) {
        console.error('Error fetching employee data:', error);
        employee.value = null;
        showErrorMessage('Failed to load salary slip. Please check your connection or try again later.');
    }
};

const createPayslipData = (employeeData) => {
    // Use the pre-formatted salaryMonth from employee.value
    const salaryDate = moment(employeeData.salaryMonth, 'MMMM D, YYYY').format('MM/DD/YYYY');
    const basicSalary = employeeData.salary || 0;
    const sss = calculateSSSContribution(employeeData.salary) || 0;
    const philHeath = calculatePhilHealthContribution(employeeData.salary) || 0;
    const pagIbig = calculatePagIBIGContribution(employeeData.salary) || 0;
    const withholdingTax = calculateWithholdingTax(employeeData) || 0;
    const totalDeductions = sss + philHeath + pagIbig + withholdingTax;
    const netSalary = employeeData.totalSalary || calculateNetSalary(employeeData) || 0;
    const paidLeavesDays = employeeData.paidLeaves?.days || 0;
    const absencesDays = employeeData.absences?.days || 0;
    const paidLeavesAmount = employeeData.paidLeaves?.amount || 0;
    const absencesAmount = -(employeeData.absences?.amount || 0);

    const [year, month] = selectedMonth.value.split('-');
    const midMonthPayday = moment(`${year}-${month}-15`).format('MM/DD/YYYY');
    const endMonthPayday = moment(`${year}-${month}-01`).endOf('month').format('MM/DD/YYYY');
    let lastWorkingDay = moment(endMonthPayday);
    while (lastWorkingDay.day() === 0 || lastWorkingDay.day() === 6) {
        lastWorkingDay.subtract(1, 'day');
    }
    const formattedEndMonthPayday = lastWorkingDay.format('MM/DD/YYYY');

    return {
        salaryDate,
        employeeIdNumber: employeeData.employeeIdNumber || 'N/A',
        lastName: employeeData.lastName || 'N/A',
        middleName: employeeData.middleName || 'N/A',
        firstName: employeeData.firstName || 'N/A',
        birthDate: employeeData.birthDate === 'N/A' || !moment(employeeData.birthDate).isValid() ? 'N/A' : moment(employeeData.birthDate).format('MM/DD/YYYY'),
        hireDate: employeeData.hireDate === 'N/A' || !moment(employeeData.hireDate).isValid() ? 'N/A' : moment(employeeData.hireDate).format('MM/DD/YYYY'),
        civilStatus: employeeData.civilStatus || 'SINGLE',
        dependents: employeeData.dependents || 0,
        sss: employeeData.sss || 'N/A',
        tin: employeeData.tin || 'N/A',
        philHeath: employeeData.philHeath || 'N/A',
        pagIbig: employeeData.pagIbig || 'N/A',
        position: employeeData.position || 'N/A',
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
        withholdingTax: formatNumber(withholdingTax),
        payHeads: employeeData.payHeads || [],
        expectedPaydays: {
            midMonthPayday,
            endMonthPayday: formattedEndMonthPayday
        }
    };
};

const generatePdf = async (payslipData) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [216, 279] // Letter size: 8.5" x 11"
    });

    doc.setFont('Helvetica');

    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - 2 * margin;
    const columnWidth = (contentWidth - 20) / 2;
    const lineHeight = 5;
    const pageHeight = doc.internal.pageSize.getHeight();

    function addText(doc, text, x, y, options = {}) {
        text = text || 'N/A';
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
    doc.setFillColor(0, 128, 0);
    doc.rect(margin, margin, contentWidth, 10, 'F');
    addText(doc, 'RIGHTJOB Solutions', margin + 5, margin + 7, { fontSize: 12, fontStyle: 'bold', textColor: [255, 255, 255] });
    addText(doc, 'PAYSLIP', margin + contentWidth / 2, margin + 7, { fontSize: 12, fontStyle: 'bold', textColor: [255, 255, 255], align: 'center' });

    // Salary Date
    let y = margin + 15;
    addText(doc, 'Salary Date:', margin + contentWidth - 40, y, { fontSize: 9 });
    addText(doc, payslipData.salaryDate, margin + contentWidth - 20, y, { fontSize: 9 });

    // Personal Information
    y += 10;
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

    // Additional Info
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

    y = Math.max(y + leftPersonalInfo.length * lineHeight, yRight + rightPersonalInfo.length * lineHeight) + 10;

    // Expected Paydays
    addText(doc, 'Expected Paydays', margin, y, { fontSize: 11, fontStyle: 'bold' });
    addText(doc, 'Mid-Month:', margin, y + lineHeight);
    addText(doc, payslipData.expectedPaydays.midMonthPayday, margin + 35, y + lineHeight, { maxWidth: columnWidth - 35 });
    addText(doc, 'End-of-Month:', margin + columnWidth + 10, y + lineHeight);
    addText(doc, payslipData.expectedPaydays.endMonthPayday, margin + columnWidth + 45, y + lineHeight, { maxWidth: columnWidth - 35 });
    y += 2 * lineHeight + 10;

    // Deductions
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

    const rightDeductions = [['Withholding Tax', `P${payslipData.withholdingTax}`]];
    rightDeductions.forEach(([label, value], index) => {
        addLabelValue(doc, label, value, margin + columnWidth + 10, y + index * lineHeight);
    });
    y += Math.max(leftDeductions.length, rightDeductions.length) * lineHeight + 10;

    // Summary
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

const generatePayslip = async () => {
    if (!employee.value) {
        showErrorMessage('No employee data available to generate payslip.');
        return;
    }

    console.log('Employee Data:', employee.value);

    isGenerating.value = true;
    try {
        const payslipData = createPayslipData(employee.value); // Pass single object
        const pdfBlob = await generatePdf(payslipData);
        const url = URL.createObjectURL(pdfBlob);
        payslips.value[`${employee.value.id}_${employee.value.salaryMonth}`] = url;
        payslipDataUrl.value = url;
        showSuccessMessage('Payslip generated successfully!');
    } catch (error) {
        console.error('Error generating payslip:', error);
        showErrorMessage('Failed to generate payslip. Please try again.');
    } finally {
        isGenerating.value = false;
    }
};

const viewPayslip = () => {
    if (!payslipDataUrl.value) {
        showErrorMessage('Please generate the payslip first.');
        return;
    }
    showPayslipModal.value = true;
};

const showDetails = () => {
    showDetailsModal.value = true;
};

const closeModal = (modalType) => {
    if (modalType === 'payslip') showPayslipModal.value = false;
    if (modalType === 'details') showDetailsModal.value = false;
};

const formatNumber = (value) => {
    return Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const onIframeLoad = () => {
    console.log('iFrame loaded successfully');
    iframeError.value = false;
};

const onIframeError = () => {
    console.error('iFrame failed to load');
    iframeError.value = true;
};

const showSuccessMessage = (message) => {
    statusMessage.value = message;
    statusType.value = 'success';
};

const showErrorMessage = (message) => {
    statusMessage.value = message;
    statusType.value = 'error';
};

const closeToast = () => {
    statusMessage.value = null;
    statusType.value = 'info';
};

// Computed properties for detailed breakdown
const earningsBreakdown = computed(() => {
    if (!employee.value?.earnings) return [];
    return employee.value.earnings.map(e => ({
        name: e.name,
        amount: formatNumber(e.amount)
    }));
});

const deductionsBreakdown = computed(() => {
    if (!employee.value?.deductions) return [];
    const customDeds = employee.value.deductions.customDeductions?.map(d => ({
        name: d.name,
        amount: formatNumber(d.amount)
    })) || [];
    return [
        ...customDeds,
        { name: 'SSS Contribution', amount: formatNumber(employee.value.deductions.sss) },
        { name: 'PhilHealth Contribution', amount: formatNumber(employee.value.deductions.philHealth) },
        { name: 'Pag-IBIG Contribution', amount: formatNumber(employee.value.deductions.pagIbig) },
        { name: 'Withholding Tax', amount: formatNumber(employee.value.deductions.tax) }
    ];
});

// Payroll Calculations (simplified from SalarySlips.vue)
const calculateSSSContribution = (salary) => {
    const monthlySalaryCredit = Math.min(Math.max(salary || 0, 5000), 35000) || 0;
    const employeeShareRate = 0.045;
    return Math.round(monthlySalaryCredit * employeeShareRate) || 0;
};

const calculatePhilHealthContribution = (salary) => {
    const rate = 0.05;
    const monthlySalary = Math.min(salary || 0, 100000) || 0;
    return Math.round((monthlySalary * rate) / 2) || 0;
};

const calculatePagIBIGContribution = (salary) => {
    const rate = 0.02;
    const cappedSalary = Math.min(salary || 0, 10000) || 0;
    return Math.round(cappedSalary * rate) || 0;
};

const calculateWithholdingTax = (employeeData) => {
    const nonTaxable = calculateNonTaxableIncome(employeeData);
    const taxableIncome = (calculateTotalEarnings(employeeData) || 0) - (nonTaxable.totalNonTaxable || 0) || 0;
    if (taxableIncome <= 20833) return 0;
    if (taxableIncome <= 33333) return Math.round((taxableIncome - 20833) * 0.15) || 0;
    if (taxableIncome <= 66667) return Math.round(1875 + (taxableIncome - 33333) * 0.20) || 0;
    if (taxableIncome <= 166667) return Math.round(13541.80 + (taxableIncome - 66667) * 0.25) || 0;
    if (taxableIncome <= 666667) return Math.round(90841.80 + (taxableIncome - 166667) * 0.30) || 0;
    return Math.round(408841.80 + (taxableIncome - 666667) * 0.35) || 0;
};

const calculateNonTaxableIncome = (employeeData) => {
    const minimumWage = 610;
    const deMinimisLimit = 10000;
    const isMWE = (employeeData.salary / 30) <= minimumWage;
    const basicSalaryMWE = isMWE ? (employeeData.salary || 0) : 0;
    const holidayPayMWE = isMWE ? (calculateHolidayPay(employeeData) || 0) : 0;
    const overtimePayMWE = isMWE ? (calculateOvertimePay(employeeData) || 0) : 0;
    const nightShiftDiffMWE = isMWE ? (employeeData.nightShiftDiff || 0) : 0;
    const hazardPayMWE = isMWE ? (employeeData.hazardPay || 0) : 0;
    const thirteenthMonthExempt = Math.min(employeeData.thirteenthMonthPay || 0, 90000) || 0;
    const deMinimis = Math.min(employeeData.deMinimis || 0, deMinimisLimit) || 0;
    const sssContribution = calculateSSSContribution(employeeData.salary) || 0;
    const philHeathContribution = calculatePhilHealthContribution(employeeData.salary) || 0;
    const pagibigContribution = calculatePagIBIGContribution(employeeData.salary) || 0;

    const totalNonTaxable = basicSalaryMWE + holidayPayMWE + overtimePayMWE + nightShiftDiffMWE + hazardPayMWE + thirteenthMonthExempt + deMinimis + sssContribution + philHeathContribution + pagibigContribution;

    return { totalNonTaxable };
};

const calculateTotalEarnings = (employeeData) => {
    const baseEarnings = (employeeData.earnings?.travelExpenses || 0) + (employeeData.earnings?.otherEarnings || 0);
    const monthlySalary = employeeData.salary || 0;
    const holidayPay = calculateHolidayPay(employeeData) || 0;
    const overtimePay = calculateOvertimePay(employeeData) || 0;
    const payHeadEarnings = calculatePayHeadEarnings(employeeData.payHeads) || 0;
    return monthlySalary + baseEarnings + holidayPay + overtimePay + payHeadEarnings || 0;
};

const calculatePayHeadEarnings = (payHeads) => {
    if (!Array.isArray(payHeads)) return 0;
    return payHeads
        .filter(p => p && p.type === 'Earnings')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
};

const calculateHolidayPay = (employeeData) => {
    const dailyRate = (employeeData.salary || 0) / 30 || 0;
    const salaryMonth = formatSalaryMonth(selectedMonth.value).split(' ')[0];
    // Simplified: Assume holidays are predefined (use regularHolidays from SalarySlips.vue if needed)
    const isRegularHoliday = false; // Replace with actual holiday check if data is available
    const isSpecialHoliday = false; // Replace with actual holiday check if data is available
    if (isRegularHoliday) return dailyRate * 2 || 0;
    if (isSpecialHoliday) return dailyRate * 1.3 || 0;
    return 0;
};

const calculateOvertimePay = (employeeData) => {
    const hourlyRate = employeeData.hourlyRate || (employeeData.salary / (8 * 22)) || 0;
    const regularOTHours = employeeData.overtimeHours?.regular || 0;
    const holidayOTHours = employeeData.overtimeHours?.holiday || 0;
    const regularOTPay = regularOTHours * hourlyRate * 1.25 || 0;
    const holidayOTPay = holidayOTHours * hourlyRate * 1.3 || 0;
    return regularOTPay + holidayOTPay || 0;
};

const calculateNetSalary = (employeeData) => {
    const totalEarnings = calculateTotalEarnings(employeeData) || 0;
    const totalDeductions = calculateTotalDeductions(employeeData) || 0;
    return totalEarnings - totalDeductions || 0;
};

const calculateTotalDeductions = (employeeData) => {
    const sssContribution = calculateSSSContribution(employeeData.salary) || 0;
    const philHeathContribution = calculatePhilHealthContribution(employeeData.salary) || 0;
    const pagibigContribution = calculatePagIBIGContribution(employeeData.salary) || 0;
    const withholdingTax = calculateWithholdingTax(employeeData) || 0;
    const payHeadDeductions = calculatePayHeadDeductions(employeeData.payHeads) || 0;
    return sssContribution + philHeathContribution + pagibigContribution + withholdingTax + payHeadDeductions || 0;
};

const calculatePayHeadDeductions = (payHeads) => {
    if (!Array.isArray(payHeads)) return 0;
    return payHeads
        .filter(p => p && p.type === 'Deductions')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
};

const formatSalaryMonth = (month) => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// Lifecycle
onMounted(() => {
    fetchEmployeeData();
});
</script>

<template>
    <div class="min-h-screen p-6 bg-gradient-to-br from-gray-100 to-gray-200">
        <div class="max-w-7xl mx-auto">
            <div class="bg-white rounded-2xl shadow-lg p-8">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-3xl font-bold text-gray-800">My Salary Slip</h2>
                    <input v-model="selectedMonth" type="month"
                        class="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 hover:border-indigo-400"
                        @change="fetchEmployeeData" />
                </div>

                <div v-if="employee" class="space-y-6">
                    <div class="overflow-x-auto rounded-lg border border-gray-200">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-indigo-50">
                                <tr>
                                    <th
                                        class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        ID</th>
                                    <th
                                        class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Name</th>
                                    <th
                                        class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Hourly Rate</th>
                                    <th
                                        class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Total Earnings</th>
                                    <th
                                        class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Total Deductions</th>
                                    <th
                                        class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Net Salary</th>
                                    <th
                                        class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Period</th>
                                    <th
                                        class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Details</th>
                                    <th
                                        class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr class="hover:bg-gray-50 transition-all duration-200">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ employee.id }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ employee.name }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{{
                                        formatNumber(employee.hourlyRate) }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{{
                                        formatNumber(employee.totalEarnings) }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{{
                                        formatNumber(employee.totalDeductions) }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">₱{{
                                        formatNumber(employee.totalSalary) }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{
                                        employee.salaryMonth }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                                        <button @click="showDetails"
                                            class="text-indigo-600 hover:text-indigo-800 font-medium flex items-center transition-colors duration-200">
                                            <span class="material-icons-outlined mr-1 text-lg">info</span>
                                            View Details
                                        </button>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm flex space-x-2">
                                        <button @click="generatePayslip"
                                            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center"
                                            :disabled="isGenerating">
                                            <span class="material-icons-outlined mr-1">download</span>
                                            {{ isGenerating ? 'Generating...' : 'Generate Payslip' }}
                                        </button>
                                        <button @click="viewPayslip"
                                            class="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-all duration-200 flex items-center"
                                            :disabled="!payslipDataUrl || isGenerating">
                                            <span class="material-icons-outlined mr-1">visibility</span>
                                            View Payslip
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div v-else class="text-center py-8 text-gray-500">
                    {{ statusMessage || 'Loading employee data...' }}
                </div>

                <!-- Details Modal using Modal Component -->
                <Modal :show="showDetailsModal" :max-width="'2xl'" @close="closeModal('details')">
                    <template #default>
                        <div class="p-6 space-y-6">
                            <div class="flex justify-between items-center">
                                <h2 class="text-2xl font-bold text-gray-800">Salary Details</h2>
                                <button @click="closeModal('details')"
                                    class="text-gray-500 hover:text-gray-700 transition-colors duration-200">
                                    <span class="material-icons-outlined">close</span>
                                </button>
                            </div>
                            <!-- Earnings -->
                            <div>
                                <h3 class="text-lg font-semibold text-gray-700 mb-3">Earnings</h3>
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <div v-for="earning in earningsBreakdown" :key="earning.name"
                                        class="flex justify-between py-2 text-sm">
                                        <span class="text-gray-600">{{ earning.name }}</span>
                                        <span class="text-gray-800 font-medium">₱{{ earning.amount }}</span>
                                    </div>
                                    <div
                                        class="border-t border-gray-200 pt-3 mt-3 flex justify-between font-semibold text-gray-800">
                                        <span>Total Earnings</span>
                                        <span>₱{{ formatNumber(employee.totalEarnings) }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Deductions -->
                            <div>
                                <h3 class="text-lg font-semibold text-gray-700 mb-3">Deductions</h3>
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <div v-for="deduction in deductionsBreakdown" :key="deduction.name"
                                        class="flex justify-between py-2 text-sm">
                                        <span class="text-gray-600">{{ deduction.name }}</span>
                                        <span class="text-gray-800 font-medium">₱{{ deduction.amount }}</span>
                                    </div>
                                    <div
                                        class="border-t border-gray-200 pt-3 mt-3 flex justify-between font-semibold text-gray-800">
                                        <span>Total Deductions</span>
                                        <span>₱{{ formatNumber(employee.totalDeductions) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </Modal>

                <!-- Payslip Modal using Modal Component -->
                <Modal :show="showPayslipModal" :max-width="'4xl'" @close="closeModal('payslip')">
                    <template #default>
                        <div class="p-6">
                            <div class="flex justify-between items-center border-b border-gray-200 mb-6">
                                <h2 class="text-2xl font-bold text-gray-800">
                                    Payslip for {{ employee?.name }} - {{ employee?.salaryMonth }}
                                </h2>
                            </div>
                            <div>
                                <iframe :src="payslipDataUrl" class="w-full h-[70vh]" frameborder="0"
                                    @load="onIframeLoad" @error="onIframeError"></iframe>
                                <p v-if="iframeError" class="text-red-500 text-sm mt-2">
                                    Error loading payslip. Please ensure the payslip is generated correctly or try
                                    again.
                                </p>
                            </div>
                        </div>
                    </template>
                </Modal>

                <!-- Toast Notification -->
                <Toast v-if="statusMessage" :message="statusMessage" :type="statusType" :duration="3000"
                    @close="closeToast" />
            </div>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined');

.min-h-screen {
    min-height: 100vh;
}

table {
    border-collapse: collapse;
    width: 100%;
}

button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}

.transition-all {
    transition: all 0.3s ease-in-out;
}

.bg-gray-50 {
    background-color: #f9fafb;
}

.rounded-2xl {
    border-radius: 1rem;
}

.shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.bg-indigo-50 {
    background-color: #eef2ff;
}

.text-indigo-600 {
    color: #4f46e5;
}

.hover\:text-indigo-800:hover {
    color: #4338ca;
}

.bg-indigo-600 {
    background-color: #4f46e5;
}

.hover\:bg-indigo-700:hover {
    background-color: #4338ca;
}

.bg-amber-500 {
    background-color: #f59e0b;
}

.hover\:bg-amber-600:hover {
    background-color: #d97706;
}
</style>