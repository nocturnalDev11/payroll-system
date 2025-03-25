<template>
    <div class="min-h-screen p-1">
        <div class="max-w-8xl mx-auto">
            <div class="bg-white p-6 rounded-xl shadow-md">
                <div class="mb-6">
                    <h2 class="text-2xl font-semibold text-gray-900">My Employee Records</h2>
                </div>

                <table v-if="employees && employees.length" class="min-w-full border border-gray-300">
                    <thead class="bg-gray-200">
                        <tr>
                        <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                        <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Salary</th>
                        <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hire Date</th>
                        <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                        v-for="emp in employees"
                        :key="emp.id"
                        class="hover:bg-gray-50 cursor-pointer"
                        @click="openTaxModal(emp)"
                        >
                        <td class="border px-4 py-2 text-sm text-gray-900">{{ emp.id }}</td>
                        <td class="border px-4 py-2 text-sm text-gray-900">{{ emp.name }}</td>
                        <td class="border px-4 py-2 text-sm text-gray-900">{{ emp.position }}</td>
                        <td class="border px-4 py-2 text-sm text-gray-900">₱{{ emp.salary.toLocaleString() }}</td>
                        <td class="border px-4 py-2 text-sm text-gray-900">{{ formatDate(emp.hireDate) }}</td>
                        <td class="border px-4 py-2 text-sm text-gray-900">{{ emp.salaryMonth }}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Loading/Error State -->
                <div v-else class="text-center py-8 text-gray-500">
                    {{ errorMessage || 'Loading employee data...' }}
                </div>

                <!-- Tax Contributions Modal -->
                <transition name="modal-fade">
                    <div v-if="showTaxModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div class="bg-white p-5 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-lg font-bold text-gray-800">
                            Tax Contributions - {{ currentEmployee?.name }}
                            </h2>
                            <button
                            @click="showTaxModal = false"
                            class="text-gray-500 hover:text-gray-700"
                            title="Close Modal"
                            >
                            <span class="material-icons-outlined">close</span>
                            </button>
                        </div>

                        <!-- Date Filter Inside Modal -->
                        <div class="mb-4">
                            <label class="text-sm font-medium text-gray-700">Filter by Month (optional):</label>
                            <input
                            v-model="selectedMonth"
                            type="month"
                            class="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all w-full mt-1"
                            @change="filterTaxContributions"
                            />
                        </div>

                        <div v-if="filteredTaxContributions.length > 0" class="space-y-4">
                            <table class="min-w-full border border-gray-300">
                            <thead class="bg-gray-100">
                                <tr>
                                <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pay Date</th>
                                <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                                <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Salary</th>
                                <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SSS</th>
                                <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PhilHealth</th>
                                <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">HDMF</th>
                                <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Withholding Tax</th>
                                <th class="border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="entry in filteredTaxContributions" :key="entry.payDate" class="hover:bg-gray-50">
                                <td class="border px-4 py-2 text-sm text-gray-900">{{ formatDate(entry.payDate) }}</td>
                                <td class="border px-4 py-2 text-sm text-gray-900">{{ entry.position }}</td>
                                <td class="border px-4 py-2 text-sm text-gray-900">₱{{ entry.salary.toLocaleString() }}</td>
                                <td class="border px-4 py-2 text-sm text-gray-900">₱{{ entry.sss.toLocaleString() }}</td>
                                <td class="border px-4 py-2 text-sm text-gray-900">₱{{ entry.philhealth.toLocaleString() }}</td>
                                <td class="border px-4 py-2 text-sm text-gray-900">₱{{ entry.hdmf.toLocaleString() }}</td>
                                <td class="border px-4 py-2 text-sm text-gray-900">₱{{ entry.withholdingTax.toLocaleString() }}</td>
                                <td class="border px-4 py-2 text-sm text-gray-900 font-semibold">
                                    ₱{{ (entry.sss + entry.philhealth + entry.hdmf + entry.withholdingTax).toLocaleString() }}
                                </td>
                                </tr>
                            </tbody>
                            </table>
                        </div>
                        <div v-else class="text-center text-gray-500 py-4">
                            No tax contributions available{{ selectedMonth ? ` for ${selectedMonth}` : '' }}.
                        </div>

                        <!-- Modal Actions -->
                        <div class="mt-4 flex justify-end gap-3">
                            <button
                            @click="generateCSV"
                            class="py-1 px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 flex items-center gap-1"
                            >
                            <span class="material-icons-outlined text-sm">download</span>
                            Generate CSV
                            </button>
                            <button
                            @click="showTaxModal = false"
                            class="py-1 px-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
                            >
                            Close
                            </button>
                        </div>
                        </div>
                    </div>
                </transition>

                <!-- Status Message -->
                <div
                    v-if="statusMessage"
                    :class="statusMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
                    class="mt-4 p-3 rounded-lg text-center"
                >
                    {{ statusMessage }}
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import moment from 'moment';
import { useAuthStore } from '@/stores/auth.store';

export default {
    name: 'EmployeeRecords',
    data() {
        return {
            employees: [],
            currentEmployee: null,
            selectedMonth: '',
            errorMessage: '',
            statusMessage: '',
            showTaxModal: false,
            taxContributions: [],
            filteredTaxContributions: [],
            allTaxContributions: {},
            currentDate: new Date('2025-03-19'),
            showUpdateModal: false,
            selectedEmployeeForUpdate: '',
            newPosition: '',
            newSalary: ''
        };
    },
    mounted() {
        this.fetchEmployeeData();
    },
    methods: {
        async fetchEmployeeData() {
            const authStore = useAuthStore();
            try {
                const response = await axios.get('/api/employees', {
                    headers: {
                        'user-role': authStore.userRole || 'admin', 
                        'user-id': authStore.admin?.id || authStore.employee?.id || '1',
                        Authorization: `Bearer ${authStore.accessToken}`
                    },
                });

                // Ensure response.data is an array; if not, handle it as an error
                const employeeData = Array.isArray(response.data) ? response.data : [];
                
                if (employeeData.length === 0) {
                    this.errorMessage = 'No employee records found.';
                    this.employees = [];
                    return;
                }

                this.employees = employeeData.map(emp => ({
                    ...emp,
                    positionHistory: Array.isArray(emp.positionHistory) && emp.positionHistory.length > 0 ? emp.positionHistory : [{
                        position: emp.position || 'N/A',
                        salary: emp.salary || 0,
                        startDate: emp.hireDate || this.currentDate.toISOString().split('T')[0],
                        endDate: null
                    }],
                    name: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
                    position: this.getLatestPosition(emp).position,
                    salary: this.getLatestPosition(emp).salary,
                    salaryMonth: emp.salaryMonth || moment(emp.hireDate).format('YYYY-MM')
                }));
                await this.fetchAllTaxContributions();
                this.errorMessage = '';
            } catch (error) {
                // Handle any error response from the server
                this.errorMessage = error.response?.data?.error || 'Failed to load employee records. Please check your connection or try again later.';
                this.employees = [];
                console.error('Error fetching employee data:', error);
            }
        },
        async fetchAllTaxContributions() {
            const authStore = useAuthStore();
            try {
                const response = await axios.get('/api/tax-contributions', {
                    headers: {
                        'user-role': authStore.userRole || 'admin',
                        Authorization: `Bearer ${authStore.accessToken}`
                    },
                });

                const taxData = Array.isArray(response.data) ? response.data : [];
                this.allTaxContributions = taxData.reduce((acc, contribution) => {
                    if (!acc[contribution.employeeId]) {
                        acc[contribution.employeeId] = [];
                    }
                    acc[contribution.employeeId].push(contribution);
                    return acc;
                }, {});
            } catch (error) {
                console.error('Error fetching tax contributions:', error);
                this.showErrorMessage('Failed to load tax contributions. Generating locally.');
                this.allTaxContributions = {};
            }
        },
        openTaxModal(emp) {
            this.currentEmployee = emp;
            this.selectedMonth = ''; // Reset filter
            this.calculateTaxContributions();
            this.showTaxModal = true;
        },
        getLatestPosition(employee) {
            if (!Array.isArray(employee.positionHistory) || employee.positionHistory.length === 0) {
                return {
                    position: employee.position || 'N/A',
                    salary: employee.salary || 0,
                    startDate: employee.hireDate || this.currentDate.toISOString().split('T')[0]
                };
            }
            const sortedHistory = [...employee.positionHistory].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
            return sortedHistory.find(h => !h.endDate) || sortedHistory[0];
        },
        getActivePositionForDate(positionHistory, date) {
            if (!Array.isArray(positionHistory) || positionHistory.length === 0) {
                return { 
                    position: 'N/A', 
                    salary: 0, 
                    startDate: this.currentEmployee?.hireDate || this.currentDate.toISOString().split('T')[0] 
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
        calculateTaxContributions() {
            if (!this.currentEmployee) return;

            const hireDate = moment(this.currentEmployee.hireDate);
            const today = moment(this.currentDate);
            const payDates = [];
            let backendContributions = this.allTaxContributions[this.currentEmployee.id] || [];

            let currentDate = hireDate.clone().startOf('month');
            while (currentDate.isSameOrBefore(today, 'day')) {
                const month = currentDate.month();
                const year = currentDate.year();

                const midMonth = moment({ year, month, date: 15 });
                if (midMonth.isSameOrAfter(hireDate, 'day') && midMonth.isSameOrBefore(today, 'day')) {
                    payDates.push(midMonth.toDate());
                }

                const lastDay = currentDate.clone().endOf('month');
                if (lastDay.isSameOrAfter(hireDate, 'day') && lastDay.isSameOrBefore(today, 'day')) {
                    payDates.push(lastDay.toDate());
                }

                currentDate.add(1, 'month').startOf('month');
            }

            this.taxContributions = payDates.map(payDate => {
                const positionAtDate = this.getActivePositionForDate(this.currentEmployee.positionHistory, payDate);
                const salary = positionAtDate.salary;
                const salaryMonth = moment(payDate).format('YYYY-MM');
                const existing = backendContributions.find(c => moment(c.payDate).isSame(payDate, 'day')) || {};

                return {
                    payDate,
                    position: positionAtDate.position,
                    salary: salary,
                    sss: existing.sss || this.calculateSSSContribution(salary),
                    philhealth: existing.philhealth || this.calculatePhilHealthContribution(salary),
                    hdmf: existing.hdmf || this.calculatePagIBIGContribution(salary),
                    withholdingTax: existing.withholdingTax || this.calculateWithholdingTax({ ...this.currentEmployee, salary }),
                    salaryMonth,
                    employeeId: this.currentEmployee.id
                };
            });

            this.filterTaxContributions();
        },
        filterTaxContributions() {
            if (!this.selectedMonth) {
                this.filteredTaxContributions = [...this.taxContributions];
            } else {
                const filterMonth = moment(this.selectedMonth, 'YYYY-MM');
                this.filteredTaxContributions = this.taxContributions.filter(entry =>
                    moment(entry.payDate).isSame(filterMonth, 'month')
                );
            }
        },
        async saveTaxContributions() {
            if (!this.taxContributions.length) {
                this.showErrorMessage('No tax contributions to save.');
                return;
            }

            try {
                const payload = this.taxContributions.map(contribution => ({
                    employeeId: Number(contribution.employeeId),
                    payDate: moment(contribution.payDate).format('YYYY-MM-DD'),
                    sss: Number(contribution.sss),
                    philhealth: Number(contribution.philhealth),
                    hdmf: Number(contribution.hdmf),
                    withholdingTax: Number(contribution.withholdingTax),
                    position: contribution.position,
                    salary: Number(contribution.salary),
                    salaryMonth: contribution.salaryMonth
                }));

                const response = await axios.post('/api/tax-contributions', payload, {
                    headers: { 'user-role': 'admin' },
                });

                if (response.status === 201 || response.status === 200) {
                    this.allTaxContributions[this.currentEmployee.id] = this.taxContributions;
                    this.showSuccessMessage('Tax contributions saved successfully!');
                }
            } catch (error) {
                console.error('Error saving tax contributions:', error);
                this.showErrorMessage(`Failed to save tax contributions: ${error.message}`);
            }
        },
        generateCSV() {
            if (!this.filteredTaxContributions.length) {
                this.showErrorMessage('No tax contributions available to export.');
                return;
            }

            const headers = ['Pay Date', 'Position', 'Salary', 'SSS', 'PhilHealth', 'HDMF', 'Withholding Tax', 'Total'];
            const rows = this.filteredTaxContributions.map(entry => [
                moment(entry.payDate).format('YYYY-MM-DD'),
                entry.position,
                entry.salary,
                entry.sss,
                entry.philhealth,
                entry.hdmf,
                entry.withholdingTax,
                entry.sss + entry.philhealth + entry.hdmf + entry.withholdingTax
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            const filename = this.selectedMonth
                ? `Tax_Contributions_${this.currentEmployee.name}_${this.selectedMonth}.csv`
                : `Tax_Contributions_${this.currentEmployee.name}_All_Periods.csv`;
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            this.showSuccessMessage('CSV file generated successfully!');
        },
        async updateEmployeePosition() {
            if (!this.selectedEmployeeForUpdate || !this.newPosition || !this.newSalary) {
                this.showErrorMessage('Please fill all fields.');
                return;
            }

            try {
                const employee = this.employees.find(emp => emp.id === this.selectedEmployeeForUpdate);
                const today = moment(this.currentDate).format('YYYY-MM-DD');

                const updatedPositionHistory = employee.positionHistory.map(history => {
                    if (!history.endDate) {
                        return { ...history, endDate: today };
                    }
                    return history;
                });
                updatedPositionHistory.push({
                    position: this.newPosition,
                    salary: Number(this.newSalary),
                    startDate: today,
                    endDate: null
                });

                const response = await axios.put(`/api/employees/${employee.id}`, {
                    ...employee,
                    position: this.newPosition,
                    salary: Number(this.newSalary),
                    positionHistory: updatedPositionHistory
                }, {
                    headers: { 'user-role': 'admin' }
                });

                if (response.status === 200) {
                    employee.position = this.newPosition;
                    employee.salary = Number(this.newSalary);
                    employee.positionHistory = updatedPositionHistory;
                    this.showSuccessMessage(`Position updated for ${employee.name} to ${this.newPosition}!`);
                    this.showUpdateModal = false;

                    this.currentEmployee = employee;
                    this.calculateTaxContributions();
                    await this.saveTaxContributions();
                }
            } catch (error) {
                console.error('Error updating position:', error);
                this.showErrorMessage(`Failed to update position: ${error.message}`);
            }
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
            const taxableIncome = employee.salary || 0;
            if (taxableIncome <= 20833) return 0;
            if (taxableIncome <= 33333) return Math.round((taxableIncome - 20833) * 0.15) || 0;
            if (taxableIncome <= 66667) return Math.round(1875 + (taxableIncome - 33333) * 0.20) || 0;
            if (taxableIncome <= 166667) return Math.round(13541.80 + (taxableIncome - 66667) * 0.25) || 0;
            if (taxableIncome <= 666667) return Math.round(90841.80 + (taxableIncome - 166667) * 0.30) || 0;
            return Math.round(408841.80 + (taxableIncome - 666667) * 0.35) || 0;
        },
        formatDate(date) {
            return moment(date).format('MMM DD, YYYY');
        },
        showSuccessMessage(message) {
            this.statusMessage = message;
            setTimeout(() => (this.statusMessage = ''), 3000);
        },
        showErrorMessage(message) {
            this.statusMessage = message;
            setTimeout(() => (this.statusMessage = ''), 3000);
        }
    }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined');

table {
    border-collapse: collapse;
    width: 100%;
}

.transition-all {
    transition: all 0.2s ease-in-out;
}

.hover\:bg-gray-50:hover {
    background-color: #f9fafb;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>