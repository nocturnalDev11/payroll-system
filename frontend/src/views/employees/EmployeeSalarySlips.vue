<template>
    <div class="min-h-screen p-4">
        <div class="w-full mx-auto space-y-6">
            <header
                class="bg-white rounded-xl shadow-lg p-4 sm:p-6 flex flex-col xl:flex-row lg:flex-row gap-4 sm:gap-0 justify-between items-start sm:items-center sticky top-6 z-50 backdrop-blur-md bg-opacity-90">
                <h1 class="text-xl sm:text-2xl font-bold text-gray-900 animate-fade-in">
                    My Payslip History
                </h1>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <div class="relative w-full sm:w-48">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input v-model="selectedMonth" type="month"
                            class="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 text-gray-700 shadow-sm transition-all duration-300"
                            @change="fetchPayslips" />
                    </div>
                    <button @click="generatePayslipNow"
                        class="w-full sm:w-auto bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg hover:from-amber-700 hover:to-amber-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                        :disabled="isLoading || payslipGenerationStatus.generating">
                        <span class="material-icons text-sm">play_arrow</span>
                        {{ payslipGenerationStatus.generating ? 'Generating...' : 'Generate Now' }}
                    </button>
                </div>
            </header>

            <!-- Payslip List -->
            <div class="w-full mx-auto">
                <div class="flex flex-col">
                    <div class="-m-1.5">
                        <div class="p-1.5 w-full inline-block align-middle">
                            <div class="bg-white rounded-xl shadow-lg overflow-hidden">

                                <!-- Table -->
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-white">
                                        <tr>
                                            <th scope="col" class="px-6 py-4 text-start">
                                                <div class="flex items-center gap-x-2">
                                                    <span class="text-xs font-semibold uppercase text-gray-800">
                                                        Pay date
                                                    </span>
                                                </div>
                                            </th>

                                            <th scope="col" class="px-6 py-4 text-start">
                                                <div class="flex items-center gap-x-2">
                                                    <span class="text-xs font-semibold uppercase text-gray-800">
                                                        Position
                                                    </span>
                                                </div>
                                            </th>

                                            <th scope="col" class="px-6 py-4 text-start">
                                                <div class="flex items-center gap-x-2">
                                                    <span class="text-xs font-semibold uppercase text-gray-800">
                                                        Salary
                                                    </span>
                                                </div>
                                            </th>

                                            <th scope="col" class="px-6 py-4 text-start">
                                                <div class="flex items-center gap-x-2">
                                                    <span class="text-xs font-semibold uppercase text-gray-800">
                                                        Status
                                                    </span>
                                                </div>
                                            </th>

                                            <th scope="col" class="px-6 py-4 text-end">
                                                <div class="flex items-center gap-x-2">
                                                    <span class="text-xs font-semibold uppercase text-gray-800">
                                                        Action
                                                    </span>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody class="divide-y divide-gray-200">
                                        <tr v-for="payslip in paginatedPayslipHistory"
                                            :key="`${payslip.salaryMonth}-${payslip.paydayType}`"
                                            :class="{ 'bg-blue-100': selectedPayslip?.salaryMonth === payslip.salaryMonth && selectedPayslip?.paydayType === payslip.paydayType }"
                                            class="bg-white hover:bg-gray-50 cursor-pointer"
                                            @click="selectPayslip(payslip)">

                                            <td class="size-px whitespace-nowrap">
                                                <button type="button" class="block">
                                                    <span class="block px-6 py-2">
                                                        <span class="text-sm text-gray-600">
                                                            {{ payslip.paydayType === 'mid-month' ?
                                                                payslip.expectedPaydays.midMonthPayday :
                                                                payslip.expectedPaydays.endMonthPayday }}
                                                        </span>
                                                    </span>
                                                </button>
                                            </td>
                                            <td class="size-px whitespace-nowrap">
                                                <button type="button" class="block">
                                                    <span class="block px-6 py-2">
                                                        <span class="text-sm text-gray-600">
                                                            {{ payslip.position || 'N/A' }}
                                                        </span>
                                                    </span>
                                                </button>
                                            </td>
                                            <td class="size-px whitespace-nowrap">
                                                <button type="button" class="block">
                                                    <span class="block px-6 py-2">
                                                        <span class="text-sm text-gray-600">
                                                            ₱{{ payslip.salary.toLocaleString() }}
                                                        </span>
                                                    </span>
                                                </button>
                                            </td>
                                            <td class="size-px whitespace-nowrap">
                                                <button type="button" class="block">
                                                    <span class="block px-6 py-2">
                                                        <span
                                                            class="py-1 px-1.5 inline-flex items-center gap-x-1 text-xs font-medium bg-teal-100 text-teal-800 rounded-full">
                                                            <svg class="size-2.5" xmlns="http://www.w3.org/2000/svg"
                                                                width="16" height="16" fill="currentColor"
                                                                viewBox="0 0 16 16">
                                                                <path
                                                                    d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                                                            </svg>
                                                            {{ payslip.payslipDataUrl ? 'Generated' :
                                                                'Pending' }}
                                                        </span>
                                                    </span>
                                                </button>
                                            </td>
                                            <td class="size-px whitespace-nowrap">
                                                <button type="button" class="block" v-if="!payslip.payslipDataUrl"
                                                    @click.stop="generatePayslip(payslip)"
                                                    :disabled="!canGeneratePayslip(payslip) || payslipGenerationStatus[`${payslip.salaryMonth}-${payslip.paydayType}`]?.generating">
                                                    <span class="px-6 py-1.5">
                                                        <span
                                                            class="py-1 px-2 inline-flex justify-center items-center gap-2 rounded-lg border border-gray-200 font-medium bg-white text-gray-700 shadow-2xs align-middle hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm">
                                                            <span class="material-icons text-sm">description</span>
                                                            {{
                                                                payslipGenerationStatus[`${payslip.salaryMonth}-${payslip.paydayType}`]?.generating
                                                                    ? 'Generating...' : 'Generate' }}
                                                        </span>
                                                    </span>
                                                </button>

                                                <button type="button" class="block cursor-pointer" v-else
                                                    @click.stop="selectPayslip(payslip)">
                                                    <span class="px-6 py-1.5">
                                                        <span
                                                            class="py-1 px-2 inline-flex justify-center items-center gap-2 rounded-lg border border-gray-200 font-medium bg-white text-gray-700 shadow-2xs align-middle hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm">
                                                            <span class="material-icons text-sm">visibility</span>
                                                            View
                                                        </span>
                                                    </span>
                                                </button>
                                            </td>
                                        </tr>

                                        <tr v-if="payslipHistory.length === 0 && !isLoading">
                                            <td colspan="5" class="px-4 py-8 text-center">
                                                <div class="flex flex-col items-center gap-2">
                                                    <span
                                                        class="material-icons text-gray-400 text-3xl">search_off</span>
                                                    <p class="text-sm text-gray-500">No payslips found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div
                                    class="px-6 py-2 grid gap-3 md:flex md:justify-between md:items-center border-t border-gray-200">
                                    <div>
                                        <p class="text-sm text-gray-600">
                                            <span class="font-semibold text-gray-800">{{
                                                payslipHistory.length }}</span>
                                            results
                                        </p>
                                    </div>

                                    <div>
                                        <div class="inline-flex gap-x-2">
                                            <button type="button" @click="changePage(currentPage - 1)"
                                                :disabled="currentPage === 1"
                                                class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:pointer-events-none disabled:opacity-50">
                                                <svg class="size-3" width="16" height="16" viewBox="0 0 16 15"
                                                    fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M10.506 1.64001L4.85953 7.28646C4.66427 7.48172 4.66427 7.79831 4.85953 7.99357L10.506 13.64"
                                                        stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                                                </svg>
                                                Prev
                                            </button>

                                            <button type="button" @click="changePage(currentPage + 1)"
                                                :disabled="currentPage === totalPages"
                                                class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none">
                                                Next
                                                <svg class="size-3" width="16" height="16" viewBox="0 0 16 16"
                                                    fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M4.50598 2L10.1524 7.64645C10.3477 7.84171 10.3477 8.15829 10.1524 8.35355L4.50598 14"
                                                        stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal :show="!!selectedPayslip" @close="selectedPayslip = null" max-width="lg" max-height="80vh">
                <div class="p-2">
                    <div v-if="selectedPayslip && selectedPayslip.payslipDataUrl">
                        <h3 class="text-sm font-medium text-gray-700 mb-2">Payslip Preview</h3>
                        <div class="mb-4">
                            <p class="text-sm text-gray-600">
                                Position: {{ selectedPayslip.position }} | Salary: ₱{{
                                    selectedPayslip.salary.toLocaleString() }}
                            </p>
                        </div>
                        <iframe :src="selectedPayslip.payslipDataUrl" class="w-full h-[50vh] rounded border mb-4"
                            @load="onIframeLoad" @error="onIframeError"></iframe>
                        <button @click="downloadPayslip"
                            class="flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded-md">
                            <span class="material-icons text-sm">download</span>
                            Download PDF
                        </button>
                        <div v-if="iframeError"
                            class="mt-3 p-3 bg-red-50 text-red-700 rounded text-sm flex items-center gap-1">
                            <span class="material-icons text-sm">error</span>
                            Error loading payslip. Please try again.
                        </div>
                    </div>
                    <div v-else-if="selectedPayslip" class="text-sm text-gray-500 text-center">
                        Payslip not yet generated.
                    </div>
                </div>
            </Modal>

            <!-- Toast Messages -->
            <div v-if="statusMessage" :class="[
                statusMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
                'fixed bottom-4 right-4 p-3 rounded shadow-lg z-50 flex items-center gap-1 animate-fade-in text-sm'
            ]">
                <span class="material-icons text-sm">
                    {{ statusMessage.includes('successfully') ? 'check_circle' : 'error' }}
                </span>
                {{ statusMessage }}
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import moment from 'moment';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';
import Modal from '@/components/Modal.vue';
import {
    calculateTotalEarnings,
    calculatePayheadEarnings,
    calculatePayheadDeductions,
    calculateSupplementaryIncome,
    calculateNonTaxableIncome,
    calculateLateDeductions,
    calculateTotalDeductions,
    calculateNetSalary,
    calculateHolidayPay,
    calculateOvertimePay,
    calculateSSSContribution,
    calculatePhilHealthContribution,
    calculatePagIBIGContribution,
    calculateWithholdingTax,
} from '@/utils/calculations.js';

applyPlugin(jsPDF);

export default {
    name: 'EmployeeSalarySlips',
    components: { Modal },
    data() {
        return {
            employee: null,
            payslipHistory: [],
            selectedPayslip: null,
            selectedMonth: new Date().toISOString().slice(0, 7),
            payslipGenerationStatus: { generating: false },
            isLoading: false,
            statusMessage: '',
            iframeError: false,
            currentDate: new Date().toISOString().split('T')[0],
            attendanceAffectedDeductions: [],
            config: {
                minimumWage: 610,
                deMinimisLimit: 10000,
                regularHolidays: [],
                specialNonWorkingDays: [],
            },
            currentPage: 1,
            itemsPerPage: 10,
            sortOrder: 'desc',
        };
    },
    setup() {
        const authStore = useAuthStore();
        return { authStore };
    },
    computed: {
        sortedPayslips() {
            return [...this.payslipHistory].sort((a, b) => {
                const dateA = moment(a.payDate, 'YYYY-MM-DD');
                const dateB = moment(b.payDate, 'YYYY-MM-DD');
                return this.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            });
        },
        paginatedPayslipHistory() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return this.sortedPayslips.slice(start, end);
        },
        totalPages() {
            return Math.ceil(this.payslipHistory.length / this.itemsPerPage);
        },
    },
    async created() {
        if (!this.authStore.isAuthenticated || this.authStore.userRole !== 'employee') {
            this.showErrorMessage('Please log in as an employee to access this page.');
            this.$router.push('/employee-login');
            return;
        }
        this.isLoading = true;
        try {
            await this.fetchEmployeeData();
            await this.fetchAttendanceAffectedDeductions();
            await this.fetchPayslips();
        } catch (error) {
            console.error('Error in created hook:', error);
            this.showErrorMessage('Failed to load payslips.');
        } finally {
            this.isLoading = false;
        }
    },
    methods: {
        changePage(page) {
            this.currentPage = Math.max(1, Math.min(page, this.totalPages));
        },
        updateSortOrder(order) {
            this.sortOrder = order;
            this.currentPage = 1;
        },
        async fetchEmployeeData() {
            const token = this.authStore.accessToken;
            const userId = this.authStore.employee?._id;
            if (!token || !userId) throw new Error('Authentication required');
            const response = await axios.get(`${BASE_API_URL}/api/employees/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'user-role': 'employee',
                    'user-id': userId,
                },
            });
            this.employee = {
                ...response.data,
                id: response.data._id,
                name: `${response.data.firstName} ${response.data.lastName}`.trim(),
                positionHistory: Array.isArray(response.data.positionHistory) && response.data.positionHistory.length > 0
                    ? response.data.positionHistory.map(history => ({
                        position: history.position || response.data.position || 'N/A',
                        salary: history.salary || response.data.salary || 0,
                        startDate: history.startDate || response.data.hireDate || this.currentDate,
                        endDate: history.endDate || null,
                    }))
                    : [{
                        position: response.data.position || 'N/A',
                        salary: response.data.salary || 0,
                        startDate: response.data.hireDate || this.currentDate,
                        endDate: null,
                    }],
            };
        },
        async fetchAttendanceAffectedDeductions(retries = 3, delay = 1000) {
            for (let i = 0; i < retries; i++) {
                this.isLoading = true;
                const token = this.authStore.accessToken;
                try {
                    if (!token) throw new Error('No authentication token available');
                    const response = await axios.get(`${BASE_API_URL}/api/payheads`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'user-role': 'employee',
                            'user-id': this.authStore.employee?._id,
                        },
                        params: { isAttendanceAffected: true },
                    });

                    this.attendanceAffectedDeductions = response.data
                        .filter(payhead => payhead.type === 'Deductions' && payhead.isAttendanceAffected === true)
                        .map(payhead => ({
                            id: payhead._id || payhead.id,
                            name: payhead.name,
                            amount: Number(payhead.amount || 0),
                            type: payhead.type,
                            description: payhead.description || '',
                            isRecurring: payhead.isRecurring || false,
                            isAttendanceAffected: payhead.isAttendanceAffected || false,
                        }));

                    if (this.attendanceAffectedDeductions.length === 0) {
                        console.warn('No attendance-affected deductions found.');
                    }
                    return;
                } catch (error) {
                    console.error(`Error fetching attendance-affected deductions, attempt ${i + 1}:`, error);
                    if (i === retries - 1) {
                        this.showErrorMessage('Failed to load attendance-affected deductions.');
                        this.attendanceAffectedDeductions = [];
                    }
                    await new Promise(resolve => setTimeout(resolve, delay));
                } finally {
                    this.isLoading = false;
                }
            }
        },
        async fetchAttendanceRecords(employeeId, salaryMonth, paydayType) {
            try {
                const token = this.authStore.accessToken;
                if (!token) throw new Error('No authentication token available');
                const response = await axios.get(`${BASE_API_URL}/api/attendance/${employeeId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'employee',
                    },
                    params: {
                        salaryMonth,
                        paydayType,
                    },
                });
                return response.data || [];
            } catch (error) {
                console.error('Error fetching attendance records:', error);
                this.showErrorMessage('Failed to load attendance data.');
                return [];
            }
        },
        async fetchPayslips() {
            const token = this.authStore.accessToken;
            const userId = this.authStore.employee?._id;
            if (!token || !userId) throw new Error('Authentication required');

            const today = moment(this.currentDate);
            const hireDate = moment(this.employee.hireDate || this.currentDate);
            let backendPayslips = [];
            try {
                const response = await axios.get(`${BASE_API_URL}/api/payslips/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'employee',
                        'user-id': userId,
                    },
                });
                backendPayslips = response.data || [];
            } catch (error) {
                console.error('Error fetching payslips:', error);
            }

            const payslipHistory = [];
            const targetMonth = this.selectedMonth ? moment(this.selectedMonth, 'YYYY-MM') : today.clone().startOf('month');
            const monthStart = targetMonth.clone().startOf('month');
            const monthEnd = targetMonth.clone().endOf('month');

            if (monthStart.isSameOrAfter(hireDate, 'month') && monthStart.isSameOrBefore(today, 'month')) {
                const salaryMonth = targetMonth.format('YYYY-MM');
                const expectedPaydays = this.getExpectedPayday(hireDate.toDate(), salaryMonth);

                // Mid-month payslip
                const midMonthDate = moment(`${salaryMonth}-15`, 'YYYY-MM-DD');
                if (midMonthDate.isSameOrAfter(hireDate, 'day') && midMonthDate.isBetween(monthStart, monthEnd, 'day', '[]')) {
                    const midPosition = this.getActivePositionForDate(this.employee.positionHistory, midMonthDate);
                    const midPayslip = backendPayslips.find(p => p.salaryMonth === salaryMonth && p.paydayType === 'mid-month') || {};
                    const attendanceRecords = await this.fetchAttendanceRecords(this.employee.id, salaryMonth, 'mid-month');
                    payslipHistory.push({
                        salaryMonth,
                        paydayType: 'mid-month',
                        payDate: midMonthDate.format('YYYY-MM-DD'),
                        position: midPosition.position,
                        salary: midPosition.salary,
                        totalSalary: midPayslip.salary ? calculateNetSalary({
                            ...this.employee,
                            position: midPosition.position,
                            salary: midPosition.salary,
                            salaryMonth
                        }, this.config, attendanceRecords, salaryMonth, 'mid-month') : null,
                        payslipDataUrl: midPayslip.payslipData ? `data:application/pdf;base64,${midPayslip.payslipData}` : null,
                        employee: { ...this.employee, position: midPosition.position, salary: midPosition.salary, salaryMonth },
                        expectedPaydays,
                    });
                }

                // End-of-month payslip
                const endMonthDate = moment(salaryMonth).endOf('month');
                if (endMonthDate.isSameOrAfter(hireDate, 'day') && endMonthDate.isBetween(monthStart, monthEnd, 'day', '[]')) {
                    const endPosition = this.getActivePositionForDate(this.employee.positionHistory, endMonthDate);
                    const endPayslip = backendPayslips.find(p => p.salaryMonth === salaryMonth && p.paydayType === 'end-of-month') || {};
                    const attendanceRecords = await this.fetchAttendanceRecords(this.employee.id, salaryMonth, 'end-of-month');
                    payslipHistory.push({
                        salaryMonth,
                        paydayType: 'end-of-month',
                        payDate: endMonthDate.format('YYYY-MM-DD'),
                        position: endPosition.position,
                        salary: endPosition.salary,
                        totalSalary: endPayslip.salary ? calculateNetSalary({
                            ...this.employee,
                            position: endPosition.position,
                            salary: endPosition.salary,
                            salaryMonth
                        }, this.config, attendanceRecords, salaryMonth, 'end-of-month') : null,
                        payslipDataUrl: endPayslip.payslipData ? `data:application/pdf;base64,${endPayslip.payslipData}` : null,
                        employee: { ...this.employee, position: endPosition.position, salary: endPosition.salary, salaryMonth },
                        expectedPaydays,
                    });
                }
            }

            this.payslipHistory = payslipHistory;

            for (const payslip of payslipHistory) {
                if (!payslip.payslipDataUrl && today.isSameOrAfter(moment(payslip.payDate), 'day')) {
                    await this.generatePayslip(payslip);
                }
            }
        },
        async generatePayslipNow() {
            this.payslipGenerationStatus.generating = true;
            try {
                const today = moment(this.currentDate);
                const salaryMonth = today.format('YYYY-MM');
                const lastDayOfMonth = today.clone().endOf('month').date();
                const payDate = today.isBefore(moment(`${salaryMonth}-15`, 'YYYY-MM-DD').endOf('day'))
                    ? moment(`${salaryMonth}-15`, 'YYYY-MM-DD')
                    : moment(`${salaryMonth}-${lastDayOfMonth}`, 'YYYY-MM-DD');
                const activePosition = this.getActivePositionForDate(this.employee.positionHistory, payDate);
                if (!activePosition || !activePosition.position || activePosition.salary === undefined) {
                    this.showErrorMessage('No valid position for current date.');
                    return;
                }
                const updatedEmployee = { ...this.employee, position: activePosition.position, salary: activePosition.salary };
                const expectedPaydays = this.getExpectedPayday(this.employee.hireDate, salaryMonth);

                const paydayType = payDate.date() === 15 ? 'mid-month' : 'end-of-month';
                const employeeSalaryMonth = `${salaryMonth}-${paydayType === 'mid-month' ? '15' : lastDayOfMonth}`;

                let payslipData = {
                    salaryMonth,
                    paydayType,
                    payDate: payDate.format('YYYY-MM-DD'),
                    position: activePosition.position,
                    salary: activePosition.salary,
                    employee: { ...updatedEmployee, salaryMonth: employeeSalaryMonth },
                    expectedPaydays,
                };

                const attendanceRecords = await this.fetchAttendanceRecords(this.employee.id, salaryMonth, paydayType);
                const pdfPayslipData = this.createPayslipData(payslipData.employee, attendanceRecords, salaryMonth, paydayType);
                const pdfBlob = await this.generatePdf(pdfPayslipData);
                const url = URL.createObjectURL(pdfBlob);
                const base64Data = await this.blobToBase64(pdfBlob);

                const payload = {
                    employeeId: this.employee.id,
                    empNo: String(this.employee.empNo),
                    payslipData: base64Data.split(',')[1],
                    salaryMonth: payslipData.salaryMonth,
                    paydayType: payslipData.paydayType,
                    position: activePosition.position,
                    salary: Number(activePosition.salary),
                    payDate: payDate.format('YYYY-MM-DD'),
                };

                const token = this.authStore.accessToken;
                if (!token) throw new Error('No authentication token available');

                const response = await axios.post(`${BASE_API_URL}/api/payslips/generate`, payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'employee',
                        'user-id': this.employee.id,
                    },
                });

                if (response.status === 201 || response.status === 200) {
                    payslipData.payslipDataUrl = url;
                    payslipData.totalSalary = calculateNetSalary(payslipData.employee, this.config, attendanceRecords, salaryMonth, paydayType);
                    const existingPayslipIndex = this.payslipHistory.findIndex(p =>
                        p.salaryMonth === payslipData.salaryMonth && p.paydayType === payslipData.paydayType
                    );
                    if (existingPayslipIndex !== -1) {
                        this.payslipHistory[existingPayslipIndex] = payslipData;
                    } else {
                        this.payslipHistory.push(payslipData);
                    }
                    this.selectedPayslip = payslipData;
                    this.showSuccessMessage(`Payslip generated for ${payslipData.paydayType === 'mid-month' ? expectedPaydays.midMonthPayday : expectedPaydays.endMonthPayday}!`);
                }
            } catch (error) {
                console.error('Error generating payslip now:', error);
                this.showErrorMessage(`Failed to generate payslip: ${error.message}`);
            } finally {
                this.payslipGenerationStatus.generating = false;
            }
        },
        canGeneratePayslip(payslip) {
            const today = moment(this.currentDate);
            const payDate = moment(payslip.paydayType === 'mid-month' ? payslip.expectedPaydays.midMonthPayday : payslip.expectedPaydays.endMonthPayday, 'D MMMM YYYY');
            return today.isSameOrAfter(payDate, 'day') && !payslip.payslipDataUrl;
        },
        async generatePayslip(payslip) {
            const employee = payslip.employee;
            const payDate = moment(payslip.payDate, 'YYYY-MM-DD');
            const activePosition = this.getActivePositionForDate(employee.positionHistory, payDate);
            const updatedEmployee = { ...employee, position: activePosition.position, salary: activePosition.salary };

            const key = `${payslip.salaryMonth}-${payslip.paydayType}`;
            this.payslipGenerationStatus[key] = { generating: true };

            try {
                const attendanceRecords = await this.fetchAttendanceRecords(employee.id, payslip.salaryMonth, payslip.paydayType);
                const payslipData = this.createPayslipData(updatedEmployee, attendanceRecords, payslip.salaryMonth, payslip.paydayType);
                const pdfBlob = await this.generatePdf(payslipData);
                const base64Data = await this.blobToBase64(pdfBlob);
                const url = URL.createObjectURL(pdfBlob);

                const payload = {
                    employeeId: employee.id,
                    empNo: String(employee.empNo),
                    payslipData: base64Data.split(',')[1],
                    salaryMonth: payslip.salaryMonth,
                    paydayType: payslip.paydayType,
                    position: activePosition.position || 'N/A',
                    salary: Number(activePosition.salary) || 0,
                    payDate: payDate.format('YYYY-MM-DD'),
                };

                const token = this.authStore.accessToken;
                if (!token) throw new Error('No authentication token available');

                const response = await axios.post(`${BASE_API_URL}/api/payslips/generate`, payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'employee',
                        'user-id': employee.id,
                    },
                });

                if (response.status === 201 || response.status === 200) {
                    payslip.payslipDataUrl = url;
                    payslip.position = activePosition.position;
                    payslip.salary = activePosition.salary;
                    payslip.totalSalary = calculateNetSalary(updatedEmployee, this.config, attendanceRecords, payslip.salaryMonth, payslip.paydayType);
                    this.payslipHistory = this.payslipHistory.map(p =>
                        p.salaryMonth === payslip.salaryMonth && p.paydayType === payslip.paydayType ? payslip : p
                    );
                    this.selectedPayslip = payslip;
                    this.showSuccessMessage(`Payslip generated for ${payslip.paydayType === 'mid-month' ? payslip.expectedPaydays.midMonthPayday : payslip.expectedPaydays.endMonthPayday}!`);
                }
            } catch (error) {
                console.error('Error generating payslip:', error.response?.data || error.message);
                this.showErrorMessage(`Failed to generate payslip: ${error.response?.data?.message || error.message}`);
            } finally {
                this.payslipGenerationStatus[key] = { generating: false };
            }
        },
        getActivePositionForDate(positionHistory, date) {
            if (!Array.isArray(positionHistory) || positionHistory.length === 0) {
                return {
                    position: this.employee.position || 'N/A',
                    salary: this.employee.salary || 0,
                    startDate: this.employee.hireDate || this.currentDate,
                };
            }

            const targetDate = moment(date);
            const sortedHistory = [...positionHistory].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

            const activePosition = sortedHistory.find(history => {
                const startDate = moment(history.startDate);
                const endDate = history.endDate ? moment(history.endDate) : moment('9999-12-31');
                return targetDate.isSameOrAfter(startDate, 'day') && targetDate.isSameOrBefore(endDate, 'day');
            });

            return activePosition || sortedHistory[sortedHistory.length - 1] || {
                position: this.employee.position || 'N/A',
                salary: this.employee.salary || 0,
                startDate: this.employee.hireDate || this.currentDate,
            };
        },
        getExpectedPayday(hireDate, salaryMonth) {
            const [year, month] = salaryMonth.split('-').map(part => parseInt(part, 10));
            const lastDay = new Date(year, month, 0).getDate();
            let midMonth = new Date(year, month - 1, 15);
            let endMonth = new Date(year, month - 1, lastDay);

            const hireMoment = moment(hireDate);
            const monthStart = moment(`${year}-${month}-01`, 'YYYY-MM-DD');

            if (hireMoment.isAfter(monthStart)) {
                if (hireMoment.isAfter(moment(midMonth))) midMonth = hireMoment.toDate();
                if (hireMoment.isAfter(moment(endMonth))) endMonth = hireMoment.toDate();
            }

            const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;
            while (isWeekend(midMonth)) midMonth.setDate(midMonth.getDate() - 1);
            while (isWeekend(endMonth)) endMonth.setDate(endMonth.getDate() - 1);

            return {
                midMonthPayday: midMonth.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
                endMonthPayday: endMonth.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
            };
        },
        createPayslipData(employee, attendanceRecords, salaryMonth, paydayType) {
            const salaryDate = moment(salaryMonth, 'YYYY-MM').format('MM/DD/YYYY');
            const basicSalary = employee.salary || 0;

            const sanitizedPayheads = Array.isArray(employee.payheads)
                ? employee.payheads.filter((ph) => ph && typeof ph === 'object' && 'type' in ph && 'name' in ph && 'amount' in ph)
                : [];

            const payheadDeductions = calculatePayheadDeductions(sanitizedPayheads);
            const lateDeductions = calculateLateDeductions(attendanceRecords, salaryMonth, paydayType);
            const sss = calculateSSSContribution(basicSalary);
            const philhealth = calculatePhilHealthContribution(basicSalary);
            const pagibig = calculatePagIBIGContribution(basicSalary);
            const withholdingTax = calculateWithholdingTax(employee, this.config);
            const totalDeductions = sss + philhealth + pagibig + withholdingTax + payheadDeductions + lateDeductions;
            const netSalary = calculateNetSalary(employee, this.config, attendanceRecords, salaryMonth, paydayType);

            const earnings = sanitizedPayheads
                .filter((ph) => ph.type === 'Earnings')
                .map((ph) => ({ name: ph.name, amount: this.formatNumber(ph.amount) }));

            const deductions = sanitizedPayheads
                .filter((ph) => ph.type === 'Deductions')
                .map((ph) => ({
                    name: ph.name,
                    amount: this.formatNumber(ph.amount),
                    isAttendanceAffected: ph.isAttendanceAffected || false
                }));

            if (lateDeductions > 0) {
                deductions.push({ name: 'Late Deductions', amount: this.formatNumber(lateDeductions), isAttendanceAffected: true });
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
                payheads: sanitizedPayheads,
                earnings,
                deductions,
                paidLeavesDays: employee.paidLeaves?.days || 0,
                absencesDays: employee.absences?.days || 0,
                paidLeavesAmount: this.formatNumber(employee.paidLeaves?.amount || 0),
                absencesAmount: this.formatNumber(employee.absences?.amount ? -employee.absences.amount : 0),
            };
        },
        async generatePdf(payslipData) {
            const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [216, 279] });
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

            let y = margin + 15;
            addText(pdfDoc, 'Salary Date:', margin + contentWidth - 40, y, { fontSize: 9 });
            addText(pdfDoc, payslipData.salaryDate, margin + contentWidth - 20, y, { fontSize: 9 });

            y += 10;
            addText(pdfDoc, 'Personal Information', margin, y, { fontSize: 11, fontStyle: 'bold' });
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
                addLabelValue(pdfDoc, label, value, margin, y + index * lineHeight);
            });

            let yRight = y;
            addText(pdfDoc, 'Additional Info', margin + columnWidth + 10, yRight, { fontSize: 11, fontStyle: 'bold' });
            yRight += lineHeight;
            const rightPersonalInfo = [
                ['Civil Status', payslipData.civilStatus],
                ['SSS', payslipData.sss],
                ['TIN', payslipData.tin],
                ['Philhealth', payslipData.philhealth],
                ['PAG-IBIG', payslipData.pagibig],
            ];
            rightPersonalInfo.forEach(([label, value], index) => {
                addLabelValue(pdfDoc, label, value, margin + columnWidth + 10, yRight + index * lineHeight);
            });

            y = Math.max(y + leftPersonalInfo.length * lineHeight, yRight + rightPersonalInfo.length * lineHeight) + 10;

            addText(pdfDoc, 'Deductions', margin, y, { fontSize: 11, fontStyle: 'bold' });
            y += lineHeight;
            const leftDeductions = [
                ['SSS', `P${payslipData.sssDeduction}`],
                ['Philhealth', `P${payslipData.philhealthDeduction}`],
                ['PAG-IBIG', `P${payslipData.pagibigDeduction}`],
            ];
            const rightDeductions = [['Withholding Tax', `P${payslipData.withholdingTax}`]];
            leftDeductions.forEach(([label, value], index) => {
                addLabelValue(pdfDoc, label, value, margin, y + index * lineHeight);
            });
            rightDeductions.forEach(([label, value], index) => {
                addLabelValue(pdfDoc, label, value, margin + columnWidth + 10, y + index * lineHeight);
            });
            y += Math.max(leftDeductions.length, rightDeductions.length) * lineHeight + 5;

            addText(pdfDoc, 'Summary', margin, y, { fontSize: 11, fontStyle: 'bold' });
            y += lineHeight;
            addText(pdfDoc, 'Total Deductions:', margin, y, { fontSize: 9, fontStyle: 'bold' });
            addText(pdfDoc, `(P${payslipData.totalDeductions})`, margin + 35, y, { fontSize: 9 });
            addText(pdfDoc, 'Net Salary:', margin + columnWidth + 10, y, { fontSize: 9, fontStyle: 'bold' });
            addText(pdfDoc, `P${payslipData.netSalary}`, margin + columnWidth + 45, y, { fontSize: 9 });
            y += lineHeight + 10;

            addText(pdfDoc, 'Earnings', margin, y, { fontSize: 11, fontStyle: 'bold' });
            y += lineHeight;
            if (payslipData.earnings.length > 0) {
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

            addText(pdfDoc, 'Other Deductions', margin, y, { fontSize: 11, fontStyle: 'bold' });
            y += lineHeight;
            if (payslipData.deductions.length > 0) {
                const deductionsTableData = payslipData.deductions.map((deduction) => [
                    deduction.name + (deduction.isAttendanceAffected ? ' (Attendance)' : ''),
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

            const footerY = pageHeight - margin - 5;
            if (y > footerY - 10) {
                pdfDoc.addPage();
                y = margin;
            }
            addText(pdfDoc, 'This is a computer-generated payslip; no signature required.', margin + contentWidth / 2, footerY, {
                fontSize: 8,
                align: 'center',
            });

            return pdfDoc.output('blob');
        },
        blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        },
        selectPayslip(payslip) {
            this.selectedPayslip = payslip;
            this.iframeError = false;
        },
        async downloadPayslip() {
            if (!this.selectedPayslip || !this.selectedPayslip.payslipDataUrl) return;
            try {
                const response = await fetch(this.selectedPayslip.payslipDataUrl);
                if (!response.ok) throw new Error('Failed to fetch payslip PDF');
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
        formatNumber(value) {
            return Number(value || 0).toFixed(2);
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
            setTimeout(() => { this.statusMessage = ''; }, 3000);
        },
        showErrorMessage(message) {
            this.statusMessage = message;
            setTimeout(() => { this.statusMessage = ''; }, 5000);
        },
    },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined');

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

.animate-fade-in {
    animation: fade-in 0.3s ease-out;
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