<template>
    <div class="min-h-screen p-1">
        <div class="max-w-8xl mx-auto">
            <!-- Header Section -->
            <HeaderSection v-model:searchQuery="searchQuery" :is-loading="isLoading"
                :is-generating-all="isGeneratingAll" @refresh-data="refreshData"
                @generate-all-payslips="generateAllPayslips" @show-print-modal="showPrintModal"
                @show-update-position-modal="showUpdatePositionModal" @open-deduction-modal="openDeductionModal" />

            <!-- Employee List -->
            <EmployeeTable :employees="employees" :positions="positions" :search-query="searchQuery"
                :is-loading="isLoading" @update:employees="employees = $event" @update:isLoading="isLoading = $event"
                @show-payslip-history="showPayslipHistory" @show-success-message="showSuccessMessage"
                @show-error-message="showErrorMessage" />

            <!-- Payslip History Modal -->
            <PayslipHistoryModal :show-history-modal="showHistoryModal" :selected-employee="selectedEmployee"
                :positions="positions" :all-payslip-histories="allPayslipHistories" :current-date="currentDate"
                :config="config" @close-history-modal="showHistoryModal = false"
                @update:allPayslipHistories="allPayslipHistories = $event" @show-success-message="showSuccessMessage"
                @show-error-message="showErrorMessage" />

            <!-- Update Position Modal -->
            <UpdatePositionModal :show-update-modal="showUpdateModal" :employees="employees" :positions="positions"
                :current-date="currentDate" @close-update-modal="showUpdateModal = false"
                @update-employee="updateEmployee" @show-success-message="showSuccessMessage"
                @show-error-message="showErrorMessage" />

            <!-- Print All Modal -->
            <PrintAllModal :show="showPrintAllModal" :employeesWithPayslips="employeesWithPayslips"
                :selectedEmployeesForPrint.sync="selectedEmployeesForPrint" :isPrinting="isPrinting"
                :selectAll.sync="selectAll" @close="showPrintAllModal = false" @toggle-select-all="toggleSelectAll"
                @print-selected-payslips="printSelectedPayslips" @update:selectAll="selectAll = $event"
                @update:selectedEmployeesForPrint="selectedEmployeesForPrint = $event" />

            <!-- Add Attendance-Affected Deductions Modal -->
            <AddAttendanceDeductionsModal v-if="showDeductionModal" :show="showDeductionModal" :employees="employees"
                :deductions="attendanceAffectedDeductions" @close="showDeductionModal = false"
                @save="saveAttendanceDeductions" />

            <!-- Toast Messages -->
            <div v-if="statusMessage" :class="[
                statusMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
                'fixed bottom-4 right-4 p-3 rounded shadow-lg z-50 flex items-center gap-1 animate-fade-in text-sm',
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
import { createPayslipData, generatePdf } from '@/utils/pdfGenerator.js';
import HeaderSection from './partials/HeaderSection.vue';
import EmployeeTable from './partials/EmployeeTable.vue';
import PayslipHistoryModal from './partials/PayslipHistoryModal.vue';
import UpdatePositionModal from './partials/UpdatePositionModal.vue';
import PrintAllModal from './partials/PrintAllModal.vue';
import AddAttendanceDeductionsModal from './partials/AddAttendanceDeductionsModal.vue';

applyPlugin(jsPDF);

export default {
    name: 'SalarySlips',
    components: {
        HeaderSection,
        EmployeeTable,
        PayslipHistoryModal,
        UpdatePositionModal,
        PrintAllModal,
        AddAttendanceDeductionsModal,
    },
    data() {
        return {
            employees: [],
            positions: [],
            attendanceAffectedDeductions: [],
            searchQuery: '',
            payslipGenerationStatus: {},
            isLoading: false,
            isGeneratingAll: false,
            statusMessage: '',
            showHistoryModal: false,
            showDeductionModal: false,
            selectedEmployee: null,
            allPayslipHistories: {},
            showPrintAllModal: false,
            employeesWithPayslips: [],
            selectedEmployeesForPrint: [],
            isPrinting: false,
            selectAll: false,
            showUpdateModal: false,
            currentDate: new Date().toISOString().split('T')[0],
            config: {
                minimumWage: 610,
                deMinimisLimit: 10000,
                regularHolidays: [],
                specialNonWorkingDays: [],
            },
        };
    },
    setup() {
        const authStore = useAuthStore();
        return { authStore };
    },
    async created() {
        if (!this.authStore.isAuthenticated) {
            console.error('User is not authenticated. Redirecting to login...');
            this.showErrorMessage('Please log in to access this page.');
            this.$router.push(this.authStore.userRole === 'employee' ? '/employee-login' : '/admin-login');
            return;
        }

        this.isLoading = true;
        try {
            await this.fetchPositionsWithRetry();
            await this.fetchEmployees();
            await this.fetchAttendanceAffectedDeductions();
        } catch (error) {
            console.error('Error in created hook:', error);
            this.showErrorMessage('Failed to initialize component. Please try again.');
        } finally {
            this.isLoading = false;
        }
    },
    methods: {
        async fetchEmployees() {
            this.isLoading = true;
            const userId = this.authStore.admin?._id || localStorage.getItem('userId') || '';
            const token = this.authStore.accessToken || localStorage.getItem('token') || '';
            try {
                if (!token) throw new Error('No authentication token found');
                const response = await axios.get(`${BASE_API_URL}/api/employees`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'admin',
                        'user-id': userId,
                    },
                });
                this.employees = response.data
                    .filter(employee => employee.status !== 'pending' && employee.status !== 'archived')
                    .map((employee) => {
                        const latestPosition = this.getLatestPosition(employee);
                        const name = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Unnamed Employee';
                        return {
                            ...employee,
                            id: employee._id,
                            name,
                            position: latestPosition.position,
                            salary: latestPosition.salary,
                            positionHistory: Array.isArray(employee.positionHistory) && employee.positionHistory.length > 0 ? employee.positionHistory : [{
                                position: employee.position || 'N/A',
                                salary: employee.salary || 0,
                                startDate: employee.hireDate || new Date().toISOString().split('T')[0],
                                endDate: null,
                            }],
                            payheads: Array.isArray(employee.payheads) ? employee.payheads : [],
                            createdAt: employee.createdAt || employee.hireDate,
                            updatedAt: employee.updatedAt,
                        };
                    });
                this.showSuccessMessage('Employees loaded successfully!');
            } catch (error) {
                console.error('Error fetching employees:', error);
                this.showErrorMessage(`Failed to load employees: ${error.message}`);
            } finally {
                this.isLoading = false;
            }
        },
        getLatestPosition(employee) {
            if (!Array.isArray(employee.positionHistory) || employee.positionHistory.length === 0) {
                return {
                    position: employee.position || 'N/A',
                    salary: employee.salary || 0,
                    startDate: employee.hireDate || new Date().toISOString().split('T')[0],
                };
            }
            const sortedHistory = [...employee.positionHistory].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
            return sortedHistory.find(h => !h.endDate) || sortedHistory[0];
        },
        async fetchPositionsWithRetry(retries = 3, delay = 1000) {
            for (let i = 0; i < retries; i++) {
                try {
                    const userId = this.authStore.admin?._id || localStorage.getItem('userId') || '';
                    const token = this.authStore.accessToken || localStorage.getItem('token') || '';
                    if (!token) throw new Error('No authentication token found');

                    const headers = {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'admin',
                        'user-id': userId,
                    };

                    const response = await axios.get(`${BASE_API_URL}/api/positions`, { headers });
                    this.positions = response.data
                        .filter(position => position.status !== 'archived')
                        .map(position => ({
                            ...position,
                            name: position.name || 'Unnamed Position',
                            salary: Number(position.salary) || 0,
                        }));
                    return;
                } catch (error) {
                    console.error(`Attempt ${i + 1} failed to fetch positions:`, error);
                    if (i === retries - 1) {
                        this.showErrorMessage('Failed to load positions after multiple attempts.');
                        throw error;
                    }
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        },
        async fetchAttendanceAffectedDeductions(retries = 3, delay = 1000) {
            for (let i = 0; i < retries; i++) {
                this.isLoading = true;
                const token = this.authStore.accessToken || localStorage.getItem('token') || '';
                try {
                    if (!token) throw new Error('No authentication token found');
                    const response = await axios.get(`${BASE_API_URL}/api/payheads`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'user-role': 'admin',
                            'user-id': this.authStore.admin?._id || localStorage.getItem('userId') || '',
                        },
                        params: { isAttendanceAffected: true },
                    });

                    const filteredDeductions = response.data
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

                    this.attendanceAffectedDeductions = filteredDeductions;

                    if (this.attendanceAffectedDeductions.length === 0) {
                        this.showErrorMessage('No attendance-affected deductions available.');
                    } else {
                        this.showSuccessMessage('Attendance-affected deductions loaded successfully!');
                    }
                    return;
                } catch (error) {
                    console.error(`Error fetching deductions, attempt ${i + 1}:`, error.response?.data || error.message);
                    if (i === retries - 1) {
                        this.showErrorMessage(`Failed to load deductions after ${retries} attempts: ${error.message}`);
                        this.attendanceAffectedDeductions = [];
                    }
                    await new Promise(resolve => setTimeout(resolve, delay));
                } finally {
                    this.isLoading = false;
                }
            }
        },
        async refreshData() {
            this.isLoading = true;
            try {
                await this.fetchPositionsWithRetry();
                await this.fetchEmployees();
                await this.fetchAttendanceAffectedDeductions();
                this.showSuccessMessage('Data refreshed successfully!');
            } catch (error) {
                console.error('Error refreshing data:', error);
                this.showErrorMessage('Failed to refresh data.');
            } finally {
                this.isLoading = false;
            }
        },
        async generateAllPayslips() {
            this.isGeneratingAll = true;
            try {
                const today = moment(this.currentDate);
                for (const employee of this.employees) {
                    const employeeHistory = this.allPayslipHistories[employee.id] || [];
                    const payslipsToGenerate = employeeHistory.filter(payslip =>
                        !payslip.payslipDataUrl &&
                        today.isSameOrAfter(moment(payslip.payDate, 'YYYY-MM-DD'), 'day')
                    );

                    for (const payslip of payslipsToGenerate) {
                        await this.$refs.payslipHistoryModal?.generatePayslip(payslip);
                    }
                }
                this.showSuccessMessage('All payslips generated successfully!');
            } catch (error) {
                console.error('Error generating all payslips:', error);
                this.showErrorMessage('Failed to generate all payslips.');
            } finally {
                this.isGeneratingAll = false;
            }
        },
        showPayslipHistory(employee) {
            this.selectedEmployee = employee;
            this.showHistoryModal = true;
        },
        updateEmployee(updatedEmployee) {
            this.employees = this.employees.map(emp =>
                emp.id === updatedEmployee.id ? updatedEmployee : emp
            );
        },
        showUpdatePositionModal() {
            this.showUpdateModal = true;
        },
        openDeductionModal() {
            this.showDeductionModal = true;
        },
        async saveAttendanceDeductions({ employees, deductions }) {
            this.isLoading = true;
            const token = this.authStore.accessToken || localStorage.getItem('token') || '';
            const currentDate = moment().format('YYYY-MM-DD');

            try {
                if (!token) throw new Error('No authentication token found');
                if (!employees?.length || !deductions?.length) {
                    throw new Error('No employees or deductions selected');
                }

                for (const employee of employees) {
                    if (!employee?._id) {
                        console.warn('Skipping employee with missing _id:', employee);
                        continue;
                    }

                    const existingPayheads = Array.isArray(this.employees.find(e => e._id === employee._id)?.payheads)
                        ? this.employees.find(e => e._id === employee._id).payheads.filter(ph =>
                            ph?._id && ph?.name && typeof ph.amount === 'number' && ph?.type
                        )
                        : [];

                    const updatedPayheads = [...existingPayheads];

                    for (const deduction of deductions) {
                        if (!deduction?.id || !deduction?.name || isNaN(deduction.amount)) {
                            console.warn('Skipping invalid deduction:', deduction);
                            continue;
                        }

                        if (!updatedPayheads.some(ph => ph._id === deduction.id)) {
                            updatedPayheads.push({
                                _id: deduction.id,
                                name: deduction.name,
                                amount: Number(deduction.amount || 0),
                                type: 'Deductions',
                                description: deduction.description || '',
                                isRecurring: deduction.isRecurring || false,
                                isAttendanceAffected: deduction.isAttendanceAffected || true,
                                startDate: currentDate, // Add start date for deduction
                                appliedThisCycle: false,
                            });
                        }
                    }

                    const payload = {
                        payheads: updatedPayheads, // Send full payhead objects
                    };

                    const response = await axios.put(
                        `${BASE_API_URL}/api/employees/update/${employee._id}`,
                        payload,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'user-role': 'admin',
                                'user-id': this.authStore.admin?._id || localStorage.getItem('userId') || '',
                            },
                        }
                    );

                    if (response.status === 200) {
                        const employeeIndex = this.employees.findIndex(e => e._id === employee._id);
                        if (employeeIndex !== -1) {
                            this.employees[employeeIndex] = {
                                ...this.employees[employeeIndex],
                                payheads: updatedPayheads,
                            };
                        }
                    }
                }

                this.showSuccessMessage('Deductions assigned successfully!');
                this.showDeductionModal = false;
            } catch (error) {
                console.error('Error saving deductions:', error.response?.data || error.message);
                this.showErrorMessage(`Failed to assign deductions: ${error.response?.data?.message || error.message}`);
            } finally {
                this.isLoading = false;
            }
        },
        showPrintModal() {
            this.employeesWithPayslips = this.employees
                .map(emp => {
                    const employeeHistory = this.allPayslipHistories[emp.id] || [];
                    const generatedPayslips = employeeHistory.filter(p => p.payslipDataUrl);
                    if (generatedPayslips.length === 0) return null;

                    const latestPayslip = generatedPayslips.reduce((latest, payslip) =>
                        moment(payslip.payDate).isAfter(moment(latest.payDate)) ? payslip : latest
                    );

                    return {
                        id: emp.id,
                        name: emp.name,
                        latestPayslipDate: latestPayslip.paydayType === 'mid-month'
                            ? latestPayslip.expectedPaydays.midMonthPayday
                            : latestPayslip.expectedPaydays.endMonthPayday,
                    };
                })
                .filter(emp => emp !== null);

            this.selectedEmployeesForPrint = [];
            this.selectAll = false;
            this.showPrintAllModal = true;
        },
        toggleSelectAll() {
            if (this.selectAll) {
                this.selectedEmployeesForPrint = this.employeesWithPayslips.map(emp => emp.id);
            } else {
                this.selectedEmployeesForPrint = [];
            }
        },
        async printSelectedPayslips() {
            this.isPrinting = true;
            const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [216, 279] });

            try {
                let isFirstPage = true;
                for (const employeeId of this.selectedEmployeesForPrint) {
                    const employee = this.employees.find(emp => emp.id === employeeId);
                    const employeeHistory = this.allPayslipHistories[employeeId] || [];
                    const generatedPayslips = employeeHistory.filter(p => p.payslipDataUrl);

                    if (generatedPayslips.length === 0) continue;

                    const latestPayslip = generatedPayslips.reduce((latest, payslip) =>
                        moment(payslip.payDate).isAfter(moment(latest.payDate)) ? payslip : latest
                    );

                    if (!isFirstPage) pdfDoc.addPage();
                    isFirstPage = false;

                    const attendanceRecords = await this.fetchAttendanceRecords(employee.id);
                    const payslipData = createPayslipData(
                        employee,
                        attendanceRecords,
                        latestPayslip.salaryMonth,
                        latestPayslip.paydayType,
                        this.config
                    );

                    if (!payslipData || Object.keys(payslipData).length === 0) {
                        console.error('Payslip data is empty for employee:', employee.id);
                        this.showErrorMessage(`Failed to generate payslip data for ${employee.name}.`);
                        continue;
                    }

                    generatePdf(payslipData, pdfDoc);
                }

                if (!isFirstPage) {
                    pdfDoc.save('Selected_Payslips.pdf');
                    this.showSuccessMessage('Selected payslips printed successfully!');
                } else {
                    this.showErrorMessage('No payslips available to print.');
                }
            } catch (error) {
                console.error('Error printing payslips:', error);
                this.showErrorMessage('Failed to print payslips: ' + error.message);
            } finally {
                this.isPrinting = false;
                this.showPrintAllModal = false;
            }
        },
        async fetchAttendanceRecords(employeeId) {
            try {
                const token = this.authStore.accessToken || localStorage.getItem('token');
                if (!token) throw new Error('No authentication token available');

                const response = await axios.get(`${BASE_API_URL}/api/attendance/${employeeId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'admin',
                    },
                });

                return response.data || [];
            } catch (error) {
                console.error('Error fetching attendance records:', error);
                if (error.response?.status === 404) {
                    console.warn(`No attendance records found for employee ID: ${employeeId}`);
                } else {
                    this.showErrorMessage('Failed to load attendance data.');
                }
                return [];
            }
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
    watch: {
        selectedEmployeesForPrint() {
            this.selectAll = this.selectedEmployeesForPrint.length === this.employeesWithPayslips.length;
        },
    },
};
</script>

<style scoped>
.large-checkbox {
    width: 16px;
    height: 16px;
}

.animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>