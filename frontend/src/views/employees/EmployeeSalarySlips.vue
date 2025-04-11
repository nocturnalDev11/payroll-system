<script>
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import moment from 'moment';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';
import Modal from '@/components/Modal.vue';

jsPDF.prototype.autoTable = autoTable.default;

export default {
    name: 'EmployeeSalarySlips',
    data() {
        return {
            employee: null,
            payslipHistory: [],
            selectedMonth: new Date().toISOString().slice(0, 7),
            selectedPayslip: null,
            payslipGenerationStatus: {},
            isLoading: false,
            isGenerating: false,
            statusMessage: '',
            errorMessage: '',
            showPayslipModal: false,
            iframeError: false,
            config: {
                minimumWage: 610,
                deMinimisLimit: 10000,
                regularHolidays: ['03/31/2025'],
                specialNonWorkingDays: [],
            },
            currentDate: new Date().toISOString().split('T')[0],
            currentPage: 1,
            itemsPerPage: 10,
            sortOrder: 'desc',
        };
    },
    computed: {
        sortedPayslipHistory() {
            return [...this.payslipHistory].sort((a, b) => {
                const dateA = new Date(a.payDate);
                const dateB = new Date(b.payDate);
                return this.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            });
        },
        paginatedPayslipHistory() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return this.sortedPayslipHistory.slice(start, end);
        },
        totalPages() {
            return Math.ceil(this.payslipHistory.length / this.itemsPerPage);
        },
    },
    setup() {
        const authStore = useAuthStore();
        return { authStore };
    },
    async mounted() {
        await this.fetchPayslipHistory();
    },
    methods: {
        changePage(page) {
            this.currentPage = Math.max(1, Math.min(page, this.totalPages));
        },
        updateSortOrder(order) {
            this.sortOrder = order;
            this.currentPage = 1;
        },
        async fetchPayslipHistory() {
            this.isLoading = true;
            this.statusMessage = '';
            try {
                const userId = this.authStore.employee?._id || localStorage.getItem('userId');
                const token = localStorage.getItem('token');
                if (!userId || !token) {
                    this.errorMessage = 'User not logged in. Redirecting to login...';
                    setTimeout(() => this.$router.push('/employee/login'), 2000);
                    return;
                }

                // Fetch employee data
                const employeeResponse = await axios.get(`${BASE_API_URL}/api/employees/${userId}/salary`, {
                    params: { month: this.selectedMonth },
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'employee',
                        'user-id': userId,
                    },
                });
                this.employee = employeeResponse.data;

                // Fetch payslip history for this employee only
                const payslipResponse = await axios.get(`${BASE_API_URL}/api/payslips/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'employee',
                        'user-id': userId,
                    },
                });
                const backendPayslips = payslipResponse.data || [];

                // Generate payslip history based on hire date and current date
                const today = moment(this.currentDate);
                const hireDate = moment(this.employee.hireDate || this.currentDate);
                const payslipHistory = [];
                let currentDate = hireDate.clone().startOf('month');

                while (currentDate.isSameOrBefore(today, 'day')) {
                    const salaryMonth = currentDate.format('YYYY-MM');
                    const expectedPaydays = this.getExpectedPayday(hireDate.toDate(), salaryMonth);

                    // Mid-month payslip
                    const midMonthDate = moment(`${salaryMonth}-15`, 'YYYY-MM-DD');
                    if (midMonthDate.isSameOrAfter(hireDate, 'day')) {
                        const midPayslip = backendPayslips.find(p =>
                            p.salaryMonth === salaryMonth && p.paydayType === 'mid-month'
                        ) || {};
                        const activePosition = this.getActivePositionForDate(this.employee.positionHistory, midMonthDate);
                        payslipHistory.push({
                            salaryMonth,
                            paydayType: 'mid-month',
                            payDate: midMonthDate.format('YYYY-MM-DD'),
                            position: activePosition.position,
                            salary: activePosition.salary,
                            totalSalary: midPayslip.salary ? this.calculateNetSalary({
                                ...this.employee,
                                position: activePosition.position,
                                salary: activePosition.salary
                            }) : null,
                            payslipDataUrl: midPayslip.payslipData ? `data:application/pdf;base64,${midPayslip.payslipData}` : null,
                            employee: {
                                ...this.employee,
                                position: activePosition.position,
                                salary: activePosition.salary,
                                salaryMonth
                            },
                            expectedPaydays
                        });
                    }

                    // End-month payslip
                    const endMonthDate = moment(salaryMonth).endOf('month');
                    if (endMonthDate.isSameOrAfter(hireDate, 'day')) {
                        const endPayslip = backendPayslips.find(p =>
                            p.salaryMonth === salaryMonth && p.paydayType === 'end-of-month'
                        ) || {};
                        const activePosition = this.getActivePositionForDate(this.employee.positionHistory, endMonthDate);
                        payslipHistory.push({
                            salaryMonth,
                            paydayType: 'end-of-month',
                            payDate: endMonthDate.format('YYYY-MM-DD'),
                            position: activePosition.position,
                            salary: activePosition.salary,
                            totalSalary: endPayslip.salary ? this.calculateNetSalary({
                                ...this.employee,
                                position: activePosition.position,
                                salary: activePosition.salary
                            }) : null,
                            payslipDataUrl: endPayslip.payslipData ? `data:application/pdf;base64,${endPayslip.payslipData}` : null,
                            employee: {
                                ...this.employee,
                                position: activePosition.position,
                                salary: activePosition.salary,
                                salaryMonth
                            },
                            expectedPaydays
                        });
                    }

                    currentDate.add(1, 'month');
                }

                this.payslipHistory = payslipHistory.filter(p =>
                    p.salaryMonth === this.selectedMonth || p.payslipDataUrl
                );
                this.selectedPayslip = this.payslipHistory.find(p => p.payslipDataUrl) || null;
            } catch (error) {
                console.error('Error fetching payslip history:', error);
                this.errorMessage = 'Failed to load payslip history.';
                this.showErrorMessage(`Failed to load payslip history: ${error.message}`);
            } finally {
                this.isLoading = false;
            }
        },
        getActivePositionForDate(positionHistory, date) {
            if (!Array.isArray(positionHistory) || positionHistory.length === 0) {
                return {
                    position: this.employee?.position || 'N/A',
                    salary: this.employee?.salary || 0,
                    startDate: this.employee?.hireDate || this.currentDate.toISOString().split('T')[0],
                };
            }
            const targetDate = moment(date);
            const activePosition = positionHistory.find(history => {
                const startDate = moment(history.startDate);
                const endDate = history.endDate ? moment(history.endDate) : moment(this.currentDate);
                return targetDate.isSameOrAfter(startDate, 'day') && targetDate.isSameOrBefore(endDate, 'day');
            });
            return activePosition || positionHistory[positionHistory.length - 1];
        },
        canGeneratePayslip(payslip) {
            const today = moment(this.currentDate);
            const payDate = moment(payslip.paydayType === 'mid-month' ? payslip.expectedPaydays.midMonthPayday : payslip.expectedPaydays.endMonthPayday, 'D MMMM YYYY');
            return today.isSameOrAfter(payDate, 'day') && !payslip.payslipDataUrl;
        },
        async generatePayslip(payslip) {
            const employee = payslip.employee;
            const key = `${payslip.salaryMonth}-${payslip.paydayType}`;
            this.payslipGenerationStatus[key] = { generating: true };
            this.isGenerating = true;

            try {
                const payslipData = this.createPayslipData(employee);
                const pdfBlob = await this.generatePdf(payslipData);
                const base64Data = await this.blobToBase64(pdfBlob);
                const url = URL.createObjectURL(pdfBlob);

                // Get active position for the payDate
                const activePosition = this.getActivePositionForDate(this.employee.positionHistory, payslip.payDate);

                const payload = {
                    employeeId: employee._id,
                    empNo: String(employee.empNo),
                    payslipData: base64Data.split(',')[1],
                    salaryMonth: payslip.salaryMonth,
                    paydayType: payslip.paydayType,
                    position: activePosition.position, // Use active position
                    salary: Number(activePosition.salary), // Use active salary
                    payDate: payslip.payDate,
                };

                const response = await axios.post(`${BASE_API_URL}/api/payslips/generate`, payload, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'user-role': 'employee',
                        'user-id': this.authStore.employee?._id || localStorage.getItem('userId'),
                    },
                });

                if (response.status === 201 || response.status === 200) {
                    payslip.payslipDataUrl = url;
                    payslip.totalSalary = this.calculateNetSalary(employee);
                    this.payslipHistory = this.payslipHistory.map(p =>
                        p.salaryMonth === payslip.salaryMonth && p.paydayType === payslip.paydayType ? payslip : p
                    );
                    this.selectedPayslip = payslip;
                    this.showSuccessMessage(`Payslip generated successfully for ${payslip.paydayType === 'mid-month' ? payslip.expectedPaydays.midMonthPayday : payslip.expectedPaydays.endMonthPayday}!`);
                }
            } catch (error) {
                console.error('Error generating payslip:', error.response?.data || error.message);
                this.showErrorMessage(`Failed to generate payslip: ${error.response?.data?.error || error.message}`);
            } finally {
                this.payslipGenerationStatus[key] = { generating: false };
                this.isGenerating = false;
            }
        },
        viewPayslip(payslip) {
            this.selectedPayslip = payslip;
            this.showPayslipModal = true;
            this.iframeError = false;
        },
        selectPayslip(payslip) {
            this.selectedPayslip = payslip.payslipDataUrl ? payslip : null;
            this.iframeError = false;
        },
        async downloadPayslip() {
            if (!this.selectedPayslip || !this.selectedPayslip.payslipDataUrl) return;
            try {
                const response = await fetch(this.selectedPayslip.payslipDataUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Payslip_${this.employee.name}_${this.selectedPayslip.paydayType === 'mid-month' ? this.selectedPayslip.expectedPaydays.midMonthPayday : this.selectedPayslip.expectedPaydays.endMonthPayday}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error downloading payslip:', error);
                this.showErrorMessage('Failed to download payslip.');
            }
        },
        // Salary Calculation Methods (Imported from SalarySlips.vue)
        calculateTotalEarnings(employee) {
            const baseEarnings = (employee.earnings?.travelExpenses || 0) + (employee.earnings?.otherEarnings || 0);
            const monthlySalary = employee.salary || 0;
            const holidayPay = this.calculateHolidayPay(employee) || 0;
            const overtimePay = this.calculateOvertimePay(employee) || 0;
            const payheadEarnings = this.calculatePayheadEarnings(employee.payheads || []) || 0;
            const taxableSupplementary = this.calculateSupplementaryIncome(employee)?.taxable || 0;
            return monthlySalary + baseEarnings + holidayPay + overtimePay + payheadEarnings + taxableSupplementary;
        },
        calculatePayheadEarnings(payheads) {
            return payheads
                .filter(p => p.type === 'Earnings')
                .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
        },
        calculatePayheadDeductions(payheads) {
            return payheads
                .filter(p => p.type === 'Deductions')
                .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
        },
        calculateSupplementaryIncome(employee) {
            const commission = employee.commission || 0;
            const profitSharing = employee.profitSharing || 0;
            const fees = employee.fees || 0;
            const thirteenthMonthPay = employee.thirteenthMonthPay || 0;
            const hazardPay = employee.hazardPay || 0;
            const overtimePay = this.calculateOvertimePay(employee) || 0;
            const otherTaxable = employee.otherTaxable || 0;

            const totalSupplementary = commission + profitSharing + fees + thirteenthMonthPay + hazardPay + overtimePay + otherTaxable;
            const exemptThirteenthMonth = Math.min(thirteenthMonthPay, 90000) || 0;
            const taxableThirteenthMonth = Math.max(0, thirteenthMonthPay - 90000) || 0;

            const taxableSupplementaryIncome = commission + profitSharing + fees + taxableThirteenthMonth + hazardPay + overtimePay + otherTaxable;

            return {
                taxable: taxableSupplementaryIncome || 0,
                nonTaxable: exemptThirteenthMonth || 0,
                totalSupplementary: totalSupplementary || 0,
            };
        },
        calculateNonTaxableIncome(employee) {
            const isMWE = (employee.salary / 30) <= this.config.minimumWage;
            const basicSalaryMWE = isMWE ? employee.salary : 0;
            const holidayPayMWE = isMWE ? this.calculateHolidayPay(employee) : 0;
            const overtimePayMWE = isMWE ? this.calculateOvertimePay(employee) : 0;
            const nightShiftDiffMWE = isMWE ? (employee.nightShiftDiff || 0) : 0;
            const hazardPayMWE = isMWE ? (employee.hazardPay || 0) : 0;
            const thirteenthMonthExempt = Math.min(employee.thirteenthMonthPay || 0, 90000) || 0;
            const deMinimis = Math.min(employee.deMinimis || 0, this.config.deMinimisLimit) || 0;
            const sssContribution = this.calculateSSSContribution(employee.salary) || 0;
            const philhealthContribution = this.calculatePhilHealthContribution(employee.salary) || 0;
            const pagibigContribution = this.calculatePagIBIGContribution(employee.salary) || 0;

            return {
                totalNonTaxable: basicSalaryMWE + holidayPayMWE + overtimePayMWE + nightShiftDiffMWE + hazardPayMWE + thirteenthMonthExempt + deMinimis + sssContribution + philhealthContribution + pagibigContribution || 0,
            };
        },
        calculateTotalDeductions(employee) {
            const sssContribution = this.calculateSSSContribution(employee.salary) || 0;
            const philhealthContribution = this.calculatePhilHealthContribution(employee.salary) || 0;
            const pagibigContribution = this.calculatePagIBIGContribution(employee.salary) || 0;
            const withholdingTax = this.calculateWithholdingTax(employee) || 0;
            const payheadDeductions = this.calculatePayheadDeductions(employee.payheads || []) || 0;

            return sssContribution + philhealthContribution + pagibigContribution + withholdingTax + payheadDeductions || 0;
        },
        calculateNetSalary(employee) {
            const totalEarnings = this.calculateTotalEarnings(employee) || 0;
            const totalDeductions = this.calculateTotalDeductions(employee) || 0;
            return totalEarnings - totalDeductions || 0;
        },
        calculateHolidayPay(employee) {
            const dailyRate = (employee.salary / 30) || 0;
            const salaryMonth = employee.salaryMonth
                ? employee.salaryMonth.split('-')[0] + '-' + employee.salaryMonth.split('-')[1]
                : this.selectedMonth;
            const isRegularHoliday = this.config.regularHolidays.some(holiday => moment(holiday, 'MM/DD/YYYY').format('YYYY-MM') === salaryMonth);
            const isSpecialHoliday = this.config.specialNonWorkingDays.some(holiday => moment(holiday, 'MM/DD/YYYY').format('YYYY-MM') === salaryMonth);
            if (isRegularHoliday) return dailyRate * 2 || 0;
            if (isSpecialHoliday) return dailyRate * 1.3 || 0;
            return 0;
        },
        calculateOvertimePay(employee) {
            const hourlyRate = (employee.salary / (8 * 22)) || 0;
            const regularOTHours = employee.overtimeHours?.regular || 0;
            const holidayOTHours = employee.overtimeHours?.holiday || 0;
            const regularOTPay = regularOTHours * hourlyRate * 1.25 || 0;
            const holidayOTPay = holidayOTHours * hourlyRate * 1.3 || 0;
            return regularOTPay + holidayOTPay || 0;
        },
        calculateSSSContribution(salary) {
            const monthlySalaryCredit = Math.min(Math.max(salary || 0, 5000), 35000) || 0;
            const employeeShareRate = 0.045;
            return Math.round(monthlySalaryCredit * employeeShareRate) || 0;
        },
        calculatePhilHealthContribution(salary) {
            const rate = 0.05;
            const monthlySalary = Math.min(salary || 0, 100000) || 0;
            return Math.round((monthlySalary * rate) / 2) || 0;
        },
        calculatePagIBIGContribution(salary) {
            const rate = 0.02;
            const cappedSalary = Math.min(salary || 0, 10000) || 0;
            return Math.round(cappedSalary * rate) || 0;
        },
        calculateWithholdingTax(employee) {
            const nonTaxable = this.calculateNonTaxableIncome(employee).totalNonTaxable || 0;
            const taxableIncome = (this.calculateTotalEarnings(employee) || 0) - nonTaxable || 0;
            if (taxableIncome <= 20833) return 0;
            if (taxableIncome <= 33333) return Math.round((taxableIncome - 20833) * 0.15) || 0;
            if (taxableIncome <= 66667) return Math.round(1875 + (taxableIncome - 33333) * 0.20) || 0;
            if (taxableIncome <= 166667) return Math.round(13541.80 + (taxableIncome - 66667) * 0.25) || 0;
            if (taxableIncome <= 666667) return Math.round(90841.80 + (taxableIncome - 166667) * 0.30) || 0;
            return Math.round(408841.80 + (taxableIncome - 666667) * 0.35) || 0;
        },
        createPayslipData(employee) {
            const salaryDate = moment(employee.salaryMonth, 'YYYY-MM').format('MM/DD/YYYY');
            const basicSalary = employee.salary || 0;
            const sss = this.calculateSSSContribution(basicSalary) || 0;
            const philhealth = this.calculatePhilHealthContribution(basicSalary) || 0;
            const pagibig = this.calculatePagIBIGContribution(basicSalary) || 0;
            const withholdingTax = this.calculateWithholdingTax(employee) || 0;
            const totalDeductions = sss + philhealth + pagibig + withholdingTax || 0;
            const netSalary = this.calculateNetSalary(employee) || 0;

            // Split payheads into earnings and deductions
            const earnings = (employee.payheads || []).filter(p => p.type === 'Earnings').map(p => ({
                name: p.name,
                amount: Number(p.amount) || 0,
            }));
            const deductions = (employee.payheads || []).filter(p => p.type === 'Deductions').map(p => ({
                name: p.name,
                amount: Number(p.amount) || 0,
            }));

            // Add computed earnings like holiday pay or overtime if applicable
            const holidayPay = this.calculateHolidayPay(employee);
            if (holidayPay > 0) {
                earnings.push({ name: 'Holiday Pay', amount: holidayPay });
            }
            const overtimePay = this.calculateOvertimePay(employee);
            if (overtimePay > 0) {
                earnings.push({ name: 'Overtime Pay', amount: overtimePay });
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
                basicSalary: this.formatNumber(basicSalary),
                totalDeductions: this.formatNumber(totalDeductions),
                netSalary: this.formatNumber(netSalary),
                sssDeduction: this.formatNumber(sss),
                philhealthDeduction: this.formatNumber(philhealth),
                pagibigDeduction: this.formatNumber(pagibig),
                withholdingTax: this.formatNumber(withholdingTax),
                earnings,
                deductions,
            };
        },
        async generatePdf(payslipData) {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [216, 279] });
            doc.setFont('Helvetica');

            const margin = 10;
            const pageWidth = doc.internal.pageSize.getWidth();
            const contentWidth = pageWidth - 2 * margin;
            const columnWidth = (contentWidth - 20) / 2;
            const lineHeight = 5;
            const pageHeight = doc.internal.pageSize.getHeight();

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
            doc.setFillColor(0, 128, 0);
            doc.rect(margin, margin, contentWidth, 10, 'F');
            addText(doc, 'RIGHTJOB Solutions', margin + 5, margin + 7, {
                fontSize: 12,
                fontStyle: 'bold',
                textColor: [255, 255, 255],
            });
            addText(doc, 'PAYSLIP', margin + contentWidth / 2, margin + 7, {
                fontSize: 12,
                fontStyle: 'bold',
                textColor: [255, 255, 255],
                align: 'center',
            });

            let y = margin + 15;
            addText(doc, 'Salary Date:', margin + contentWidth - 40, y, { fontSize: 9 });
            addText(doc, payslipData.salaryDate, margin + contentWidth - 20, y, { fontSize: 9 });

            y += 10;
            addText(doc, 'Personal Information', margin, y, { fontSize: 11, fontStyle: 'bold' });
            y += lineHeight;
            const leftPersonalInfo = [
                ['Emp No.', payslipData.empNo],
                ['Last Name', payslipData.lastName],
                ['Middle Name', payslipData.middleName],
                ['First Name', payslipData.firstName],
                ['Birth Date', payslipData.birthDate],
                ['Hire Date', payslipData.hireDate],
                ['Position', payslipData.position],
                ['Basic Salary', `P${payslipData.basicSalary}`],
            ];
            leftPersonalInfo.forEach(([label, value], index) => {
                addLabelValue(doc, label, value, margin, y + index * lineHeight);
            });

            let yRight = y;
            addText(doc, 'Additional Info', margin + columnWidth + 10, yRight, { fontSize: 11, fontStyle: 'bold' });
            yRight += lineHeight;
            const rightPersonalInfo = [
                ['Civil Status', payslipData.civilStatus],
                ['SSS', payslipData.sss],
                ['TIN', payslipData.tin],
                ['Philhealth', payslipData.philhealth],
                ['PAG-IBIG', payslipData.pagibig],
            ];
            rightPersonalInfo.forEach(([label, value], index) => {
                addLabelValue(doc, label, value, margin + columnWidth + 10, yRight + index * lineHeight);
            });

            y = Math.max(y + leftPersonalInfo.length * lineHeight, yRight + rightPersonalInfo.length * lineHeight) + 10;

            // Deductions Section (Mandatory Taxes Only)
            addText(doc, 'Deductions', margin, y, { fontSize: 11, fontStyle: 'bold' });
            y += lineHeight;
            const leftDeductions = [
                ['SSS', `P${payslipData.sssDeduction}`],
                ['Philhealth', `P${payslipData.philhealthDeduction}`],
                ['PAG-IBIG', `P${payslipData.pagibigDeduction}`],
            ];
            const rightDeductions = [['Withholding Tax', `P${payslipData.withholdingTax}`]];
            leftDeductions.forEach(([label, value], index) => {
                addLabelValue(doc, label, value, margin, y + index * lineHeight);
            });
            rightDeductions.forEach(([label, value], index) => {
                addLabelValue(doc, label, value, margin + columnWidth + 10, y + index * lineHeight);
            });
            y += Math.max(leftDeductions.length, rightDeductions.length) * lineHeight + 5;

            // Summary
            addText(doc, 'Summary', margin, y, { fontSize: 11, fontStyle: 'bold' });
            y += lineHeight;
            addText(doc, 'Total Deductions:', margin, y, { fontSize: 9, fontStyle: 'bold' });
            addText(doc, `(P${payslipData.totalDeductions})`, margin + 35, y, { fontSize: 9 });
            addText(doc, 'Net Salary:', margin + columnWidth + 10, y, { fontSize: 9, fontStyle: 'bold' });
            addText(doc, `P${payslipData.netSalary}`, margin + columnWidth + 45, y, { fontSize: 9 });
            y += lineHeight + 10;

            // Earnings Table
            addText(doc, 'Earnings', margin, y, { fontSize: 11, fontStyle: 'bold' });
            y += lineHeight;
            if (payslipData.earnings.length > 0) {
                const earningsTableData = payslipData.earnings.map((earning) => [
                    earning.name,
                    `P${this.formatNumber(earning.amount)}`,
                ]);
                doc.autoTable({
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
                y = doc.lastAutoTable.finalY + 5;
            } else {
                addText(doc, 'None', margin, y, { fontSize: 9 });
                y += lineHeight + 5;
            }

            // Other Deductions Table (Non-Recurring, Excluding Taxes)
            addText(doc, 'Other Deductions', margin, y, { fontSize: 11, fontStyle: 'bold' });
            y += lineHeight;
            if (payslipData.deductions.length > 0) {
                const deductionsTableData = payslipData.deductions.map((deduction) => [
                    deduction.name,
                    `P${this.formatNumber(deduction.amount)}`,
                ]);
                doc.autoTable({
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
                y = doc.lastAutoTable.finalY + 5;
            } else {
                addText(doc, 'None', margin, y, { fontSize: 9 });
                y += lineHeight + 5;
            }

            // Footer
            const footerY = pageHeight - margin - 5;
            if (y > footerY - 10) {
                doc.addPage();
                y = margin;
            }
            addText(doc, 'This is a computer-generated payslip; no signature required.', margin + contentWidth / 2, footerY, {
                fontSize: 8,
                align: 'center',
            });

            return doc.output('blob');
        },
        formatNumber(value) {
            const num = Number(value) || 0;
            return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },
        getExpectedPayday(hireDate, salaryMonth) {
            const [year, month] = salaryMonth.split('-').map(part => parseInt(part, 10));
            const lastDay = new Date(year, month, 0).getDate();
            let payday1 = new Date(year, month - 1, 15);
            let payday2 = new Date(year, month - 1, lastDay);

            const hireMoment = moment(hireDate);
            if (hireMoment.isAfter(moment(`${year}-${month}-15`, 'YYYY-MM-DD'))) {
                payday1 = hireMoment.toDate();
            }
            if (hireMoment.isAfter(moment(`${year}-${month}-${lastDay}`, 'YYYY-MM-DD'))) {
                payday2 = hireMoment.toDate();
            }

            const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;
            while (isWeekend(payday1)) {
                const nextDay = new Date(payday1);
                nextDay.setDate(payday1.getDate() + 1);
                if (nextDay.getMonth() !== payday1.getMonth()) break;
                payday1 = nextDay;
            }
            while (isWeekend(payday2)) {
                const prevDay = new Date(payday2);
                prevDay.setDate(payday2.getDate() - 1);
                if (prevDay.getMonth() !== payday2.getMonth()) break;
                payday2 = prevDay;
            }

            return {
                midMonthPayday: payday1.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
                endMonthPayday: payday2.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
            };
        },
        blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        },
        onIframeLoad() {
            this.iframeError = false;
        },
        onIframeError() {
            this.iframeError = true;
            this.showErrorMessage('Error loading payslip preview.');
        },
        showSuccessMessage(message) {
            this.statusMessage = message;
            setTimeout(() => this.statusMessage = '', 3000);
        },
        showErrorMessage(message) {
            this.statusMessage = message;
            setTimeout(() => this.statusMessage = '', 5000);
        },
    },
};
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div class="mx-auto space-y-3">
            <header
                class="bg-white rounded-xl shadow-lg p-6 flex justify-between items-center sticky top-6 z-50 backdrop-blur-md bg-opacity-90">
                <h1 class="text-2xl font-bold text-gray-900 animate-fade-in">My Salary Slips</h1>
                <div class="flex items-center gap-4">
                    <div class="relative w-full">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input v-model="selectedMonth" type="month"
                            class="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 text-gray-700 shadow-sm transition-all duration-300"
                            @change="fetchPayslipHistory" />
                    </div>
                    <button @click="fetchPayslipHistory"
                        class="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
                        <span class="material-icons text-sm">{{ isLoading ? 'sync' : 'refresh' }}</span>
                        {{ isLoading ? 'Refreshing...' : 'Refresh' }}
                    </button>
                </div>
            </header>

            <div class="mt-6 bg-white bg-opacity-95 backdrop-blur-md rounded-2xl shadow-xl transition-all duration-300">
                <div class="p-4 flex justify-end space-x-3">
                    <div class="flex justify-between items-center gap-2">
                        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1"
                            class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">
                            Previous
                        </button>
                        <span>{{ currentPage }} of {{ totalPages }}</span>
                        <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages"
                            class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">
                            Next
                        </button>
                    </div>
                    <select v-model="sortOrder" @change="updateSortOrder(sortOrder)"
                        class="p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 shadow-sm">
                        <option value="desc">Sort by Date (Newest First)</option>
                        <option value="asc">Sort by Date (Oldest First)</option>
                    </select>
                </div>
                <!-- Payslip History Table -->
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Pay Date
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Position
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Salary
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody class="divide-y divide-gray-200 overflow-x-auto">
                            <tr v-for="payslip in paginatedPayslipHistory"
                                :key="`${payslip.salaryMonth}-${payslip.paydayType}`"
                                class="hover:bg-blue-50 transition-colors cursor-pointer"
                                :class="{ 'bg-blue-100': selectedPayslip?.salaryMonth === payslip.salaryMonth && selectedPayslip?.paydayType === payslip.paydayType }"
                                @click="selectPayslip(payslip)">
                                <td class="px-6 py-4 text-sm text-gray-900">
                                    {{ payslip.paydayType === 'mid-month' ? payslip.expectedPaydays.midMonthPayday :
                                    payslip.expectedPaydays.endMonthPayday }}
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-500">{{ payslip.position }}</td>
                                <td class="px-6 py-4 text-sm text-gray-500">₱{{ formatNumber(payslip.totalSalary ||
                                    payslip.salary) }}</td>
                                <td class="px-6 py-4 text-sm text-gray-500">{{ payslip.payslipDataUrl ? 'Generated' :
                                    'Pending' }}</td>
                                <td class="px-6 py-4 text-sm">
                                    <button v-if="!payslip.payslipDataUrl" @click.stop="generatePayslip(payslip)"
                                        class="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-all"
                                        :disabled="!canGeneratePayslip(payslip) || payslipGenerationStatus[`${payslip.salaryMonth}-${payslip.paydayType}`]?.generating">
                                        <span class="material-icons text-sm">description</span>
                                        {{
                                        payslipGenerationStatus[`${payslip.salaryMonth}-${payslip.paydayType}`]?.generating
                                        ? 'Generating...' : 'Generate' }}
                                    </button>
                                    <button v-else @click.stop="viewPayslip(payslip)"
                                        class="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all">
                                        <span class="material-icons text-sm">visibility</span>
                                        View
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="paginatedPayslipHistory.length === 0 && !isLoading">
                                <td colspan="5" class="px-6 py-8 text-center text-gray-500">No payslips found for this
                                    period.</td>
                            </tr>
                            <tr v-if="isLoading">
                                <td colspan="5" class="px-6 py-8 text-center">
                                    <div class="flex flex-col items-center gap-2">
                                        <span class="material-icons text-blue-500 animate-spin text-3xl">sync</span>
                                        <p class="text-sm text-gray-500">Loading payslips...</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Payslip Viewer Modal -->
                <div v-if="showPayslipModal"
                    class="fixed inset-0 flex items-center justify-center bg-black/50 z-[1000]">
                    <div class="bg-white rounded-xl shadow-xl w-full max-w-4xl m-4 max-h-[90vh] flex flex-col">
                        <div class="p-6 border-b border-gray-300 flex justify-between items-center">
                            <h2 class="text-xl font-bold text-gray-800">
                                Payslip for {{ employee?.name }} - {{ selectedPayslip?.paydayType === 'mid-month' ?
                                selectedPayslip?.expectedPaydays.midMonthPayday :
                                selectedPayslip?.expectedPaydays.endMonthPayday }}
                            </h2>
                            <button @click="showPayslipModal = false"
                                class="text-gray-500 hover:text-gray-700 cursor-pointer">
                                <span class="material-icons">close</span>
                            </button>
                        </div>
                        <div class="p-6 flex-1 overflow-y-auto">
                            <iframe :src="selectedPayslip?.payslipDataUrl" class="w-full h-[70vh]" frameborder="0"
                                @load="onIframeLoad" @error="onIframeError"></iframe>
                            <p v-if="iframeError" class="text-red-500 text-sm mt-2">
                                Error loading payslip. Please try generating it again.
                            </p>
                            <div class="mt-4 flex justify-end">
                                <button @click="downloadPayslip"
                                    class="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded-md">
                                    <span class="material-icons text-sm">download</span>
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Status Message -->
                <div v-if="statusMessage"
                    :class="statusMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
                    class="fixed bottom-4 right-4 p-3 rounded-lg shadow-lg flex items-center gap-1 animate-fade-in text-sm">
                    <span class="material-icons text-sm">
                        {{ statusMessage.includes('successfully') ? 'check_circle' : 'error' }}
                    </span>
                    {{ statusMessage }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.transition-all {
    transition: all 0.2s ease-in-out;
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

.animate-spin {
    animation: spin 1s linear infinite;
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