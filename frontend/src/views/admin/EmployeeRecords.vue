<template>
    <div class="min-h-screen p-1">
        <div class="max-w-8xl mx-auto">
            <div class="bg-white p-6 rounded-xl shadow-md overflow-y-auto">
                <div class="mb-6">
                    <h2 class="text-2xl font-semibold text-gray-900">My Employee Records</h2>
                </div>

                <!-- Filters and Search -->
                <div class="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Search Bar -->
                        <div class="relative">
                            <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search
                                Employees</label>
                            <div class="relative">
                                <span
                                    class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                <input id="search" v-model="searchQuery" type="text"
                                    placeholder="Search by name or ID..."
                                    class="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-sm" />
                                <button v-if="searchQuery" @click="searchQuery = ''"
                                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-all duration-200">
                                    <span class="material-icons text-sm">clear</span>
                                </button>
                            </div>
                        </div>

                        <!-- Position Filter -->
                        <div class="relative">
                            <label for="positionFilter" class="block text-sm font-medium text-gray-700 mb-1">Filter by
                                Position</label>
                            <div class="relative">
                                <span
                                    class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">filter_list</span>
                                <select id="positionFilter" v-model="filterPosition"
                                    class="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-sm">
                                    <option value="">All Positions</option>
                                    <option v-for="position in uniquePositions" :key="position" :value="position">{{
                                        position }}</option>
                                </select>
                                <span
                                    class="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">arrow_drop_down</span>
                            </div>
                        </div>
                    </div>
                </div>

                <table v-if="employees && employees.length" class="min-w-full border border-gray-300 overflow-y-auto">
                    <thead class="bg-gray-200">
                        <tr>
                            <th
                                class="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                ID</th>
                            <th
                                class="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Name</th>
                            <th
                                class="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Position
                            </th>
                            <th
                                class="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Salary
                            </th>
                            <th
                                class="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Hire Date
                            </th>
                            <th
                                class=" border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Period
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="emp in filteredEmployees" :key="emp.id" class="hover:bg-gray-50 cursor-pointer"
                            @click="openTaxModal(emp)">
                            <td class="border border-gray-300 px-4 py-2 text-sm text-gray-900">{{ emp.id }}</td>
                            <td class="border border-gray-300 px-4 py-2 text-sm text-gray-900">{{ emp.name }}</td>
                            <td class="border border-gray-300 px-4 py-2 text-sm text-gray-900">{{ emp.position }}</td>
                            <td class="border border-gray-300 px-4 py-2 text-sm text-gray-900">₱{{
                                emp.salary.toLocaleString() }}</td>
                            <td class="border border-gray-300 px-4 py-2 text-sm text-gray-900">{{
                                formatDate(emp.hireDate) }}</td>
                            <td class="border  border-gray-300 px-4 py-2 text-sm text-gray-900">{{ emp.salaryMonth }}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div v-else class="text-center py-8 text-gray-500">
                    {{ errorMessage || 'Loading employee data...' }}
                </div>

                <transition name="modal-fade">
                    <div v-if="showTaxModal" class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                        <div class="bg-white p-5 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                            <div class="flex justify-between items-center mb-4">
                                <h2 class="text-lg font-bold text-gray-800">
                                    Tax Contributions - {{ currentEmployee?.name }}
                                </h2>
                                <button @click="showTaxModal = false" class="text-gray-500 hover:text-gray-700"
                                    title="Close Modal">
                                    <span class="material-icons-outlined">close</span>
                                </button>
                            </div>

                            <div class="mb-4">
                                <label class="text-sm font-medium text-gray-700">Filter by Month (optional):</label>
                                <input v-model="selectedMonth" type="month"
                                    class="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all w-full mt-1"
                                    @change="filterTaxContributions" />
                            </div>

                            <div v-if="filteredTaxContributions.length > 0" class="space-y-4">
                                <table class="min-w-full border border-gray-300">
                                    <thead class="bg-gray-100">
                                        <tr>
                                            <th
                                                class="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Pay Date</th>
                                            <th
                                                class="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Position</th>
                                            <th
                                                class="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Salary</th>
                                            <th
                                                class="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                SSS</th>
                                            <th
                                                class="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                PhilHealth</th>
                                            <th
                                                class="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                HDMF</th>
                                            <th
                                                class="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Withholding Tax</th>
                                            <th
                                                class="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="entry in filteredTaxContributions" :key="entry.payDate"
                                            class="hover:bg-gray-50">
                                            <td class="border border-gray-300 px-4 py-2 text-sm text-gray-900">{{
                                                formatDate(entry.payDate) }}</td>
                                            <td class="border border-gray-300 px-4 py-2 text-sm text-gray-900">{{
                                                entry.position }}</td>
                                            <td class="border border-gray-300 px-4 py-2 text-sm text-gray-900">₱{{
                                                entry.salary.toLocaleString() }}</td>
                                            <td class="border border-gray-300 px-4 py-2 text-sm text-gray-900">₱{{
                                                entry.sss.toLocaleString() }}</td>
                                            <td class="border border-gray-300 px-4 py-2 text-sm text-gray-900">₱{{
                                                entry.philhealth.toLocaleString() }}</td>
                                            <td class="border border-gray-300 px-4 py-2 text-sm text-gray-900">₱{{
                                                entry.hdmf.toLocaleString() }}</td>
                                            <td class="border border-gray-300 px-4 py-2 text-sm text-gray-900">₱{{
                                                entry.withholdingTax.toLocaleString() }}</td>
                                            <td
                                                class="border border-gray-300 px-4 py-2 text-sm text-gray-900 font-semibold">
                                                ₱{{ (entry.sss + entry.philhealth + entry.hdmf +
                                                    entry.withholdingTax).toLocaleString() }}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div v-else class="text-center text-gray-500 py-4">
                                No tax contributions available{{ selectedMonth ? ` for ${selectedMonth}` : '' }}.
                            </div>

                            <div class="mt-4 flex justify-end gap-3">
                                <button @click="generateCSV"
                                    class="py-1 px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 flex items-center gap-1">
                                    <span class="material-icons-outlined text-sm">download</span>
                                    Generate CSV
                                </button>
                                <button @click="showTaxModal = false"
                                    class="py-1 px-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </transition>

                <div v-if="statusMessage"
                    :class="statusMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
                    class="mt-4 p-3 rounded-lg text-center">
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
import { BASE_API_URL } from '@/utils/constants';

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
            currentDate: new Date('2025-04-15'),
            showUpdateModal: false,
            selectedEmployeeForUpdate: '',
            newPosition: '',
            newSalary: '',
            searchQuery: '',
            filterPosition: ''
        };
    },
    mounted() {
        this.fetchEmployeeData();
    },
    computed: {
        uniquePositions() {
            const positions = new Set(this.employees.map(emp => emp.position));
            return ['All Positions', ...Array.from(positions).sort()];
        },
        filteredEmployees() {
            let filtered = [...this.employees];

            // Apply search filter
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(emp =>
                    (emp.name && emp.name.toLowerCase().includes(query)) ||
                    (emp.id && String(emp.id).toLowerCase().includes(query))
                );
            }

            // Apply position filter
            if (this.filterPosition && this.filterPosition !== 'All Positions') {
                filtered = filtered.filter(emp => emp.position === this.filterPosition);
            }

            return filtered;
        }
    },
    methods: {
        async fetchEmployeeData() {
            const authStore = useAuthStore();
            try {
                const response = await axios.get(`${BASE_API_URL}/api/employees`, {
                    headers: {
                        'Authorization': `Bearer ${authStore.accessToken}`,
                        'user-role': authStore.userRole || 'admin',
                        'user-id': authStore.admin?.id || authStore.employee?.id || '1',
                    },
                });

                if (!response.data || typeof response.data !== 'object') {
                    throw new Error('Invalid response from server: Data is not an object');
                }

                if (response.data.error) {
                    throw new Error(response.data.error || 'API returned an error');
                }

                const employeeData = Array.isArray(response.data) ? response.data : response.data.employees || [];
                if (employeeData.length === 0) {
                    this.errorMessage = 'No employee records found.';
                    this.employees = [];
                    return;
                }

                // Filter out 'pending' and 'archived' employees
                this.employees = employeeData
                    .filter(emp => emp.status !== 'pending' && emp.status !== 'archived')
                    .map(emp => {
                        const positionHistory = Array.isArray(emp.positionHistory) && emp.positionHistory.length > 0
                            ? emp.positionHistory.map(history => ({
                                position: history.position || 'N/A',
                                salary: Number(history.salary) || 0,
                                startDate: history.startDate ? new Date(history.startDate).toISOString().split('T')[0] : emp.hireDate || this.currentDate.toISOString().split('T')[0],
                                endDate: history.endDate ? new Date(history.endDate).toISOString().split('T')[0] : null
                            }))
                            : [{
                                position: emp.position || 'N/A',
                                salary: Number(emp.salary) || 0,
                                startDate: emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : this.currentDate.toISOString().split('T')[0],
                                endDate: null
                            }];

                        const latestPosition = this.getLatestPosition({ positionHistory });

                        return {
                            ...emp,
                            positionHistory,
                            name: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unnamed Employee',
                            position: latestPosition.position,
                            salary: latestPosition.salary,
                            salaryMonth: emp.salaryMonth || moment(emp.hireDate).format('YYYY-MM')
                        };
                    });

                await this.fetchAllTaxContributions();
                this.errorMessage = '';
            } catch (error) {
                console.error('Error fetching employee data:', error);
                this.errorMessage = `Failed to load employee records: ${error.message || 'Unknown error'}. Please check your connection or try again later.`;
                this.employees = [];
            }
        },

        async fetchAllTaxContributions() {
            const authStore = useAuthStore();
            try {
                const response = await axios.get(`${BASE_API_URL}/api/employee-contributions`, {
                    headers: {
                        'Authorization': `Bearer ${authStore.accessToken}`,
                        'user-role': authStore.userRole || 'admin'
                    },
                });
                this.allTaxContributions = response.data.reduce((acc, contribution) => {
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
            this.selectedMonth = '';
            this.calculateTaxContributions();
            this.showTaxModal = true;
        },

        getLatestPosition(employee) {
            if (!Array.isArray(employee.positionHistory) || employee.positionHistory.length === 0) {
                return {
                    position: employee.position || 'N/A',
                    salary: Number(employee.salary) || 0,
                    startDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : this.currentDate.toISOString().split('T')[0]
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
                    startDate: this.currentEmployee?.hireDate ? new Date(this.currentEmployee.hireDate).toISOString().split('T')[0] : this.currentDate.toISOString().split('T')[0]
                };
            }

            const targetDate = new Date(date);
            const activePosition = positionHistory.find(history => {
                const startDate = new Date(history.startDate);
                const endDate = history.endDate ? new Date(history.endDate) : new Date('9999-12-31');
                return targetDate >= startDate && targetDate <= endDate;
            });

            return activePosition || positionHistory[positionHistory.length - 1];
        },

        calculateTaxContributions() {
            if (!this.currentEmployee) return;

            const hireDate = moment(this.currentEmployee.hireDate);
            const today = moment(this.currentDate);
            const payDates = [];
            let backendContributions = this.allTaxContributions[this.currentEmployee.id] || [];

            // Step 1: Generate all mid-month and end-of-month pay dates
            let currentDate = hireDate.clone().startOf('month');
            while (currentDate.isSameOrBefore(today, 'day')) {
                const month = currentDate.month();
                const year = currentDate.year();

                // Mid-month (15th)
                const midMonth = moment({ year, month, date: 15 });
                if (midMonth.isSameOrAfter(hireDate, 'day') && midMonth.isSameOrBefore(today, 'day')) {
                    payDates.push(midMonth.toDate());
                }

                // End-of-month (last day)
                const lastDay = currentDate.clone().endOf('month');
                if (lastDay.isSameOrAfter(hireDate, 'day') && lastDay.isSameOrBefore(today, 'day')) {
                    payDates.push(lastDay.toDate());
                }

                currentDate.add(1, 'month').startOf('month');
            }

            // Step 2: Map each pay date to its active position and calculate contributions
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

            const authStore = useAuthStore();
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

                const response = await axios.post(`${BASE_API_URL}/api/tax-contributions`, payload, {
                    headers: {
                        'Authorization': `Bearer ${authStore.accessToken}`,
                        'user-role': authStore.userRole || 'admin'
                    },
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

            const authStore = useAuthStore();
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

                const response = await axios.put(`${BASE_API_URL}/api/employees/${employee.id}`, {
                    ...employee,
                    position: this.newPosition,
                    salary: Number(this.newSalary),
                    positionHistory: updatedPositionHistory
                }, {
                    headers: {
                        'Authorization': `Bearer ${authStore.accessToken}`,
                        'user-role': authStore.userRole || 'admin'
                    }
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