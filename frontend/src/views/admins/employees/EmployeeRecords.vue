<script>
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import autoTable directly

export default {
    name: 'EmployeeRecords',
    data() {
        return {
            employees: [],
            searchQuery: '',
            currentPage: 1,
            itemsPerPage: 10,
            isLoading: false,
            showRecordsModal: false,
            showPDFPreviewModal: false,
            selectedEmployee: null,
            contributionRecords: [],
            pdfDataUrl: '',
            iframeError: false,
            statusMessage: '',
            minimumWage: 610, // NCR minimum wage for 2025, as in EmployeeLogin
        };
    },
    computed: {
        filteredEmployees() {
            return this.employees.filter(emp =>
                `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        },
        paginatedEmployees() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            return this.filteredEmployees.slice(start, start + this.itemsPerPage);
        },
        totalPages() {
            return Math.ceil(this.filteredEmployees.length / this.itemsPerPage) || 1;
        },
    },
    mounted() {
        this.fetchEmployees();
        console.log('Component mounted, showRecordsModal:', this.showRecordsModal); // Debug initial state
    },
    methods: {
        async fetchEmployees() {
            this.isLoading = true;
            try {
                const response = await axios.get('http://localhost:5000/api/employees'); // Removed 'user-role' header
                this.employees = response.data.map(emp => ({
                    ...emp,
                    hourlyRate: emp.hourlyRate || (emp.salary / (8 * 22)),
                    earnings: emp.earnings || { travelExpenses: 0, otherEarnings: 0 },
                })) || [];
                this.showSuccessMessage('Employees loaded successfully');
            } catch (error) {
                console.error('Error fetching employees:', error);
                this.showErrorMessage('Failed to load employees');
            } finally {
                this.isLoading = false;
            }
        },

        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        },

        calculateSSSContribution(salary) {
            const monthlySalary = Math.max(salary || 0, 0);
            if (monthlySalary < 5000) {
                return 250; // Fixed contribution for salaries below 5,000
            }

            // Calculate salary credit (capped between 5,000 and 35,000)
            const salaryCredit = Math.min(Math.max(monthlySalary, 5000), 35000);

            // Calculate regular SSS contribution (5% of salary credit, matching the table)
            const regularSSContribution = Math.round(salaryCredit * 0.05);

            // Calculate MPF contribution (2.5% of amount above 20,000, up to 35,000)
            let mpfContribution = 0;
            if (salaryCredit > 20000) {
                const mpfBase = Math.min(salaryCredit, 35000) - 20000;
                mpfContribution = Math.round(mpfBase * 0.025);
            }

            // Calculate total employee contribution
            let totalEmployeeContribution = regularSSContribution + mpfContribution;

            // Cap total contribution at 1,750 for salary credits above 34,750
            if (salaryCredit > 34750) {
                totalEmployeeContribution = 1750;
            }

            return totalEmployeeContribution;
        },

        calculatePhilHealthContribution(salary) {
            const monthlySalary = Math.max(salary || 0, 0);
            const minSalary = 10000; // PhilHealth minimum salary base for employed individuals
            const maxSalary = 100000; // PhilHealth maximum salary base for employed individuals
            const cappedSalary = Math.min(Math.max(monthlySalary, minSalary), maxSalary);
            return Math.round(cappedSalary * 0.025); // Employee’s 2.5% share
        },

        calculatePagIBIGContribution(salary) {
            const monthlySalary = Math.max(salary || 0, 0);
            const maxSalary = 5000; // Pag-IBIG maximum monthly compensation
            const cappedSalary = Math.min(monthlySalary, maxSalary);

            let rate = 0.02; // Default to 2% for salaries over ₱1,500
            if (cappedSalary <= 1500) {
                rate = 0.01; // 1% for salaries of ₱1,500 and below
            }

            return Math.round(cappedSalary * rate); // Employee’s contribution
        },

        calculateWithholdingTax(employee) {
            const taxableIncome = this.calculateTotalEarnings(employee) || 0;
            if (taxableIncome <= 20833) return 0;
            if (taxableIncome <= 33333) return Math.round((taxableIncome - 20833) * 0.15);
            if (taxableIncome <= 66667) return Math.round(1875 + (taxableIncome - 33333) * 0.20);
            if (taxableIncome <= 166667) return Math.round(13541.80 + (taxableIncome - 66667) * 0.25);
            if (taxableIncome <= 666667) return Math.round(90841.80 + (taxableIncome - 166667) * 0.30);
            return Math.round(408841.80 + (taxableIncome - 666667) * 0.35);
        },

        calculateTotalEarnings(employee) {
            const baseEarnings = (employee.earnings?.travelExpenses || 0) + (employee.earnings?.otherEarnings || 0);
            return (employee.salary || 0) + baseEarnings;
        },

        getExpectedSalaryDate(hireDate, monthYear) {
            const [year, month] = monthYear.split('-');
            const lastDay = new Date(year, month, 0).getDate();
            let payday = new Date(year, month - 1, lastDay); // End of month

            const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6; // Check if Saturday (0) or Sunday (6)
            while (isWeekend(payday)) payday.setDate(payday.getDate() - 1); // Adjust to previous weekday if weekend

            return payday.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        },

        generateContributionRecords(employee) {
            const records = [];
            const hireDate = new Date(employee.hireDate);
            const currentDate = new Date('2025-03-05'); // Updated to current date as per system instructions
            let startDate = new Date(hireDate);

            while (startDate <= currentDate) {
                const monthYear = startDate.toISOString().slice(0, 7); // YYYY-MM
                const monthName = startDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                records.push({
                    month: monthName,
                    sss: this.calculateSSSContribution(employee.salary),
                    philhealth: this.calculatePhilHealthContribution(employee.salary),
                    pagibig: this.calculatePagIBIGContribution(employee.salary),
                    withholdingTax: this.calculateWithholdingTax(employee),
                    expectedSalaryDate: this.getExpectedSalaryDate(employee.hireDate, monthYear),
                });
                startDate.setMonth(startDate.getMonth() + 1);
            }
            return records;
        },

        viewRecords(employee) {
            console.log('View Records clicked for:', employee); // Debug log
            this.selectedEmployee = { ...employee }; // Ensure reactivity with a new object
            this.contributionRecords = this.generateContributionRecords(employee);
            this.showRecordsModal = true; // Set modal to visible
            console.log('showRecordsModal set to:', this.showRecordsModal); // Debug state
        },

        closeRecordsModal() {
            this.showRecordsModal = false;
            console.log('Modal closed, showRecordsModal:', this.showRecordsModal); // Debug state
        },

        closePDFPreviewModal() {
            this.showPDFPreviewModal = false;
            this.pdfDataUrl = '';
            this.iframeError = false;
            console.log('PDF Preview Modal closed, showPDFPreviewModal:', this.showPDFPreviewModal); // Debug state
        },

        async previewPDF() {
            try {
                // Initialize jsPDF with a specific version or default options
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
                // Register the autoTable plugin with the jsPDF instance
                doc.autoTable = autoTable; // Attach autoTable to the jsPDF instance

                const employeeName = `${this.selectedEmployee.firstName} ${this.selectedEmployee.lastName}`;
                doc.setFontSize(16); // Ensure this method exists
                doc.text(`Employee Records - ${employeeName}`, 14, 20);

                const tableData = this.contributionRecords.map(record => [
                    record.month,
                    `₱${record.sss.toLocaleString()}`,
                    `₱${record.philhealth.toLocaleString()}`,
                    `₱${record.pagibig.toLocaleString()}`,
                    `₱${record.withholdingTax.toLocaleString()}`,
                    record.expectedSalaryDate,
                ]);

                doc.autoTable({
                    startY: 30,
                    head: [['Month', 'SSS Contribution', 'PhilHealth Contribution', 'Pag-IBIG Contribution', 'Withholding Tax', 'Expected Salary Date']],
                    body: tableData,
                    theme: 'striped',
                    styles: { fontSize: 10, cellPadding: 2 },
                    headStyles: { fillColor: [0, 128, 255], textColor: [255, 255, 255] },
                });

                const pdfBlob = doc.output('blob');
                this.pdfDataUrl = URL.createObjectURL(pdfBlob);
                this.showPDFPreviewModal = true;
                this.iframeError = false;
                this.showSuccessMessage('PDF preview loaded successfully');
            } catch (error) {
                console.error('Error generating PDF preview:', error);
                this.showErrorMessage('Failed to generate PDF preview');
            }
        },

        exportPDF() {
            // Initialize jsPDF with a specific version or default options
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            // Register the autoTable plugin with the jsPDF instance
            doc.autoTable = autoTable; // Attach autoTable to the jsPDF instance

            const employeeName = `${this.selectedEmployee.firstName} ${this.selectedEmployee.lastName}`;
            doc.setFontSize(16); // Ensure this method exists
            doc.text(`Employee Records - ${employeeName}`, 14, 20);

            const tableData = this.contributionRecords.map(record => [
                record.month,
                `₱${record.sss.toLocaleString()}`,
                `₱${record.philhealth.toLocaleString()}`,
                `₱${record.pagibig.toLocaleString()}`,
                `₱${record.withholdingTax.toLocaleString()}`,
                record.expectedSalaryDate,
            ]);

            doc.autoTable({
                startY: 30,
                head: [['Month', 'SSS Contribution', 'PhilHealth Contribution', 'Pag-IBIG Contribution', 'Withholding Tax', 'Expected Salary Date']],
                body: tableData,
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 2 },
                headStyles: { fillColor: [0, 128, 255], textColor: [255, 255, 255] },
            });

            doc.save(`Employee_Records_${this.selectedEmployee.empNo}.pdf`);
            this.closePDFPreviewModal();
            this.showSuccessMessage('PDF exported successfully');
        },

        onIframeLoad() {
            console.log('PDF preview loaded successfully');
            this.iframeError = false;
        },

        onIframeError() {
            console.error('PDF preview failed to load');
            this.iframeError = true;
        },

        showSuccessMessage(message) {
            this.statusMessage = message;
            setTimeout(() => (this.statusMessage = ''), 3000);
        },

        showErrorMessage(message) {
            this.statusMessage = message;
            setTimeout(() => (this.statusMessage = ''), 3000);
        },
    },
};
</script>

<template>
    <div class="min-h-screen bg-gray-50 px-10 py-1">
        <div class="max-w-10xl mx-auto space-y-6">
            <!-- Header with Glass Effect -->
            <header class="bg-white bg-opacity-90 backdrop-blur-lg p-6 rounded-xl shadow-lg mb-6 sticky top-4 z-40">
                <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-blue-500 rounded-lg">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h1 class="text-2xl font-bold text-gray-800">Employee Records</h1>
                    </div>

                    <div class="flex items-center gap-4">
                        <div class="relative">
                            <input v-model="searchQuery" type="text" placeholder="Search employees..."
                                class="pl-10 pr-4 py-2 w-72 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
                            <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <button @click="fetchEmployees"
                            class="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>
            </header>

            <!-- Main Content -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-100">
                                <th class="px-6 py-4 text-sm font-semibold text-gray-600 tracking-wider">Employee ID
                                </th>
                                <th class="px-6 py-4 text-sm font-semibold text-gray-600 tracking-wider">Name</th>
                                <th class="px-6 py-4 text-sm font-semibold text-gray-600 tracking-wider">Position</th>
                                <th class="px-6 py-4 text-sm font-semibold text-gray-600 tracking-wider">Email</th>
                                <th class="px-6 py-4 text-sm font-semibold text-gray-600 tracking-wider">Hire Date</th>
                                <th class="px-6 py-4 text-sm font-semibold text-gray-600 tracking-wider text-right">
                                    Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="employee in paginatedEmployees" :key="employee.id"
                                class="hover:bg-blue-50 transition-colors duration-150">
                                <td class="px-6 py-4 text-sm text-gray-900 font-medium">{{ employee.employeeIdNumber }}</td>
                                <td class="px-6 py-4 text-sm text-gray-900">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                            {{ employee.firstName[0] }}{{ employee.lastName[0] }}
                                        </div>
                                        {{ employee.firstName }} {{ employee.lastName }}
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="px-3 py-1 rounded-full text-xs font-medium"
                                        :class="employee.position === 'Manager' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
                                        {{ employee.position }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-600">{{ employee.email }}</td>
                                <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(employee.hireDate) }}</td>
                                <td class="px-6 py-4 text-right">
                                    <button @click="viewRecords(employee)"
                                        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View Records
                                    </button>
                                </td>
                            </tr>
                            <!-- Empty State -->
                            <tr v-if="filteredEmployees.length === 0 && !isLoading">
                                <td colspan="6" class="px-6 py-8 text-center">
                                    <div class="flex flex-col items-center gap-2">
                                        <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <p class="text-gray-500 text-lg">No employees found</p>
                                    </div>
                                </td>
                            </tr>
                            <!-- Loading State -->
                            <tr v-if="isLoading">
                                <td colspan="6" class="px-6 py-8 text-center">
                                    <div class="flex flex-col items-center gap-3">
                                        <svg class="w-8 h-8 animate-spin text-blue-600" fill="none"
                                            stroke="currentColor" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                            </path>
                                        </svg>
                                        <p class="text-gray-500">Loading employee records...</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Enhanced Pagination -->
                <div v-if="!isLoading" class="px-6 py-4 flex justify-between items-center border-t border-gray-300 bg-gray-50">
                    <div class="flex items-center gap-2">
                        <button @click="currentPage--" :disabled="currentPage === 1"
                            class="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span class="text-sm text-gray-600">
                            Page {{ currentPage }} of {{ totalPages }}
                        </span>
                        <button @click="currentPage++" :disabled="currentPage === totalPages"
                            class="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    <div class="text-sm text-gray-500">
                        Showing {{ ((currentPage - 1) * itemsPerPage) + 1 }} to
                        {{ Math.min(currentPage * itemsPerPage, filteredEmployees.length) }} of
                        {{ filteredEmployees.length }} entries
                    </div>
                </div>
            </div>

            <!-- Records Modal (Tax Contributions, Deductions, and Expected Salary Dates) -->
            <div v-if="showRecordsModal"
                class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div class="p-6 border-b flex justify-between items-center">
                        <h2 class="text-2xl font-semibold text-gray-800">Financial Records for {{
                            selectedEmployee.firstName }} {{ selectedEmployee.lastName }}</h2>
                        <button @click="closeRecordsModal"
                            class="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-all duration-200">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 gap-6">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-800 mb-4">Monthly Financial Contributions and
                                    Salary Dates</h3>
                                <table class="w-full text-left border">
                                    <thead class="bg-gray-100">
                                        <tr>
                                            <th class="px-4 py-2 text-sm font-medium text-gray-700">Month</th>
                                            <th class="px-4 py-2 text-sm font-medium text-gray-700">SSS Contribution
                                            </th>
                                            <th class="px-4 py-2 text-sm font-medium text-gray-700">PhilHealth
                                                Contribution</th>
                                            <th class="px-4 py-2 text-sm font-medium text-gray-700">Pag-IBIG
                                                Contribution</th>
                                            <th class="px-4 py-2 text-sm font-medium text-gray-700">Withholding Tax</th>
                                            <th class="px-4 py-2 text-sm font-medium text-gray-700">Expected Salary Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200">
                                        <tr v-for="record in contributionRecords" :key="record.month">
                                            <td class="px-4 py-2 text-sm text-gray-900">{{ record.month }}</td>
                                            <td class="px-4 py-2 text-sm text-gray-900">₱{{ record.sss.toLocaleString()
                                            }}</td>
                                            <td class="px-4 py-2 text-sm text-gray-900">₱{{
                                                record.philhealth.toLocaleString() }}</td>
                                            <td class="px-4 py-2 text-sm text-gray-900">₱{{
                                                record.pagibig.toLocaleString() }}</td>
                                            <td class="px-4 py-2 text-sm text-gray-900">₱{{
                                                record.withholdingTax.toLocaleString() }}</td>
                                            <td class="px-4 py-2 text-sm text-gray-900">{{ record.expectedSalaryDate }}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="p-6 border-t bg-gray-50 flex justify-end gap-3">
                        <button @click="previewPDF"
                            class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V17a2 2 0 01-2 2z" />
                            </svg>
                            Preview PDF
                        </button>
                        <button @click="closeRecordsModal"
                            class="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200">
                            Close
                        </button>
                    </div>
                </div>
            </div>

            <!-- PDF Preview Modal -->
            <div v-if="showPDFPreviewModal"
                class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div class="p-6 border-b border-gray-300 flex justify-between items-center">
                        <h2 class="text-2xl font-semibold text-gray-800">PDF Preview for {{ selectedEmployee.firstName
                        }} {{ selectedEmployee.lastName }}</h2>
                        <button @click="closePDFPreviewModal"
                            class="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-all duration-200">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div class="p-6">
                        <iframe :src="pdfDataUrl" class="w-full h-[60vh] rounded border" @load="onIframeLoad"
                            @error="onIframeError"></iframe>
                        <div v-if="iframeError"
                            class="mt-3 p-3 bg-red-50 text-red-700 rounded text-sm flex items-center gap-1">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Error loading PDF preview. Please try again.
                        </div>
                    </div>
                    <div class="p-6 border-t bg-gray-50 flex justify-end gap-3">
                        <button @click="exportPDF"
                            class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg">
                            Export PDF
                        </button>
                        <button @click="closePDFPreviewModal"
                            class="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200">
                            Close Preview
                        </button>
                    </div>
                </div>
            </div>

            <!-- Status Toast -->
            <div v-if="statusMessage" :class="statusMessage.includes('successfully') ? 'bg-green-500' : 'bg-red-500'"
                class="fixed bottom-6 right-6 p-4 text-white rounded-lg shadow-lg animate-fade-in">
                {{ statusMessage }}
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Your styles remain unchanged */
.animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
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

button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Ensure modal is visible and properly positioned */
.fixed.inset-0 {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.bg-black.bg-opacity-50 {
    background-color: rgba(0, 0, 0, 0.5);
}

.flex.items-center.justify-center {
    display: flex;
    align-items: center;
    justify-content: center;
}

.z-50 {
    z-index: 50;
}
</style>