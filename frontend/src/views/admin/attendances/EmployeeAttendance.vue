<script>
import axios from 'axios';
import moment from 'moment';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';
import { debounce } from 'lodash';
import Toast from '@/components/Toast.vue';
import Modal from '@/components/Modal.vue';

export default {
    name: 'EmployeeAttendance',
    components: {
        Toast,
        Modal,
    },
    setup() {
        const authStore = useAuthStore();
        return { authStore };
    },
    data() {
        return {
            employees: [],
            selectedEmployee: null,
            showDetailsModal: false,
            showSettingsModal: false,
            showAddModal: false,
            showFilterPanel: false,
            isLoading: false,
            searchQuery: '',
            statusFilter: [],
            dateRange: {
                start: new Date().toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0],
            },
            currentPage: 1,
            itemsPerPage: 10,
            date: new Date().toISOString().split('T')[0],
            sortKey: 'empNo',
            sortDirection: 'asc',
            attendanceSettings: {
                officeStart: '08:00',
                breakStart: '11:30',
                breakEnd: '12:59',
                officeEnd: '17:00',
                gracePeriod: 15,
                deductionRate: 37.5,
                earlyTimeInThreshold: '06:00',
                earlyTimeOutThreshold: '11:30',
                halfDayThreshold: '13:00',
            },
            newAttendance: {
                employeeId: '',
                date: new Date().toISOString().split('T')[0],
                morningTimeIn: '',
                morningTimeOut: '',
                afternoonTimeIn: '',
                afternoonTimeOut: '',
                status: 'Present',
                lateHours: 0,
                lateDeduction: 0,
                workedHours: 0,
            },
            headers: [
                { key: 'empNo', label: 'Employee No', icon: 'badge' },
                { key: 'firstName', label: 'Name', icon: 'person' },
                { key: 'date', label: 'Date', icon: 'calendar_today' },
                { key: 'morningTimeIn', label: 'Morning In', icon: 'wb_sunny' },
                { key: 'morningTimeOut', label: 'Morning Out', icon: 'wb_sunny' },
                { key: 'afternoonTimeIn', label: 'Afternoon In', icon: 'nights_stay' },
                { key: 'afternoonTimeOut', label: 'Afternoon Out', icon: 'nights_stay' },
                { key: 'workedHours', label: 'Worked Hours', icon: 'timer' },
                { key: 'status', label: 'Status', icon: 'check_circle' },
                { key: 'actions', label: 'Actions', icon: 'settings' },
            ],
            statusOptions: [
                'Present', 'Absent', 'Late', 'Half Day', 'On Time', 'Early Departure', 'Leave', 'Incomplete'
            ],
            lastResetDate: null,
            toast: {
                message: '',
                description: '',
                type: 'info',
                isVisible: false,
            },
        };
    },
    computed: {
        filteredEmployees() {
            if (!this.employees || !Array.isArray(this.employees)) return [];
            let filtered = this.employees;

            if (this.statusFilter.length) {
                filtered = filtered.filter(employee => this.statusFilter.includes(employee.status));
            }

            filtered = filtered.filter(employee =>
                !this.searchQuery ||
                `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                employee.empNo.toString().toLowerCase().includes(this.searchQuery.toLowerCase())
            );

            if (this.dateRange.start && this.dateRange.end) {
                filtered = filtered.filter(employee => {
                    const attDate = moment(employee.date).format('YYYY-MM-DD');
                    return attDate >= this.dateRange.start && attDate <= this.dateRange.end;
                });
            }

            return filtered.sort((a, b) => {
                const valueA = a[this.sortKey] || '';
                const valueB = b[this.sortKey] || '';
                return this.sortDirection === 'asc'
                    ? valueA < valueB ? -1 : 1
                    : valueA > valueB ? -1 : 1;
            });
        },
        paginatedEmployees() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            return this.filteredEmployees.slice(start, start + this.itemsPerPage);
        },
        totalPages() {
            return Math.ceil(this.filteredEmployees.length / this.itemsPerPage) || 1;
        },
        paginationInfo() {
            const start = (this.currentPage - 1) * this.itemsPerPage + 1;
            const end = Math.min(start + this.itemsPerPage - 1, this.filteredEmployees.length);
            return { start, end };
        },
    },
    mounted() {
        this.checkAndResetDaily();
        this.applyStatusFilterFromQuery();
        this.fetchEmployeesAndAttendance();
        this.fetchAttendanceSettings();
        this.debouncedSearch = debounce(this.handleSearch, 300);
    },
    methods: {
        applyStatusFilterFromQuery() {
            const status = this.$route.query.status;
            if (status) {
                const statusMap = {
                    'present': ['Present', 'On Time', 'Late', 'Early Departure', 'Half Day'],
                    'late': ['Late'],
                    'absent': ['Absent'],
                    'halfday': ['Half Day'],
                    'ontime': ['On Time'],
                    'incomplete': ['Incomplete'],
                };
                this.statusFilter = statusMap[status.toLowerCase()] || [];
                if (this.statusFilter.length) {
                    this.showFilterPanel = true;
                }
            }
        },
        checkAndResetDaily() {
            const today = new Date().toISOString().split('T')[0];
            const storedDate = localStorage.getItem('lastResetDate') || today;

            if (storedDate !== today) {
                this.resetAttendanceData();
                localStorage.setItem('lastResetDate', today);
            }
            this.lastResetDate = today;

            setInterval(() => {
                const currentDate = new Date().toISOString().split('T')[0];
                if (currentDate !== this.lastResetDate) {
                    this.resetAttendanceData();
                    localStorage.setItem('lastResetDate', currentDate);
                    this.lastResetDate = currentDate;
                    this.fetchEmployeesAndAttendance();
                }
            }, 60000);
        },
        resetAttendanceData() {
            this.date = new Date().toISOString().split('T')[0];
            this.employees = this.employees.map(employee => ({
                ...employee,
                morningTimeIn: null,
                morningTimeOut: null,
                afternoonTimeIn: null,
                afternoonTimeOut: null,
                status: 'Absent',
                lateHours: 0,
                lateDeduction: 0,
                workedHours: 0,
                _id: undefined,
            }));
            this.showSuccessMessage('Attendance reset for new day');
        },
        async fetchAttendanceSettings() {
            try {
                const token = this.authStore.accessToken;
                const response = await axios.get(`${BASE_API_URL}/api/attendance-settings`, {
                    headers: { Authorization: `Bearer ${token}`, 'user-role': 'admin' },
                });
                this.attendanceSettings = response.data;
            } catch (error) {
                console.error('Error fetching attendance settings:', error);
                this.showErrorMessage('Failed to load attendance settings');
            }
        },
        async updateAttendanceSettings() {
            try {
                const token = this.authStore.accessToken;
                await axios.put(
                    `${BASE_API_URL}/api/attendance-settings`,
                    this.attendanceSettings,
                    {
                        headers: { Authorization: `Bearer ${token}`, 'user-role': 'admin' },
                    }
                );
                this.showSettingsModal = false;
                this.showSuccessMessage('Attendance settings updated successfully');
            } catch (error) {
                console.error('Error updating attendance settings:', error);
                this.showErrorMessage('Failed to update attendance settings');
            }
        },
        async fetchEmployeesAndAttendance() {
            this.isLoading = true;
            try {
                const token = this.authStore.accessToken;
                const [employeeResponse, attendanceResponse] = await Promise.all([
                    axios.get(`${BASE_API_URL}/api/employees`, {
                        headers: { Authorization: `Bearer ${token}`, 'user-role': 'admin' },
                    }),
                    axios.get(`${BASE_API_URL}/api/attendance`, {
                        headers: { Authorization: `Bearer ${token}`, 'user-role': 'admin' },
                        params: { date: this.date },
                    }),
                ]);

                const employees = employeeResponse.data;
                const attendanceRecords = attendanceResponse.data;

                this.employees = attendanceRecords.map(record => ({
                    ...record.employeeId,
                    date: record.date,
                    morningTimeIn: record.morningTimeIn,
                    morningTimeOut: record.morningTimeOut,
                    afternoonTimeIn: record.afternoonTimeIn,
                    afternoonTimeOut: record.afternoonTimeOut,
                    status: record.status,
                    lateHours: record.lateHours,
                    lateDeduction: record.lateDeduction,
                    workedHours: record.workedHours,
                    _id: record._id,
                }));
            } catch (error) {
                console.error('Error fetching data:', error);
                this.showErrorMessage('Failed to load employee and attendance data');
            } finally {
                this.isLoading = false;
            }
        },
        timeToMinutes(time) {
            if (!time || time === '00:00:00') return 0;
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        },
        calculateWorkedHours(record) {
            let totalMinutes = 0;
            if (record.morningTimeIn && record.morningTimeOut) {
                totalMinutes += this.timeToMinutes(record.morningTimeOut) - this.timeToMinutes(record.morningTimeIn);
            } else if (record.morningTimeIn && !record.morningTimeOut) {
                totalMinutes += this.timeToMinutes(this.attendanceSettings.breakStart) - this.timeToMinutes(record.morningTimeIn);
            }
            if (record.afternoonTimeIn && record.afternoonTimeOut) {
                totalMinutes += this.timeToMinutes(record.afternoonTimeOut) - this.timeToMinutes(record.afternoonTimeIn);
            } else if (record.afternoonTimeIn && !record.afternoonTimeOut) {
                totalMinutes += this.timeToMinutes(this.attendanceSettings.officeEnd) - this.timeToMinutes(record.afternoonTimeIn);
            }
            if (record.morningTimeIn && record.afternoonTimeOut && !record.morningTimeOut && !record.afternoonTimeIn) {
                totalMinutes -= this.timeToMinutes(this.attendanceSettings.breakEnd) - this.timeToMinutes(this.attendanceSettings.breakStart);
            }
            return Math.max(0, totalMinutes / 60).toFixed(2);
        },
        calculateStatusAndDeductions(record) {
            const { officeStart, officeEnd, gracePeriod, breakStart, breakEnd, halfDayThreshold, deductionRate } = this.attendanceSettings;
            let status = 'Present';
            let lateHours = 0;
            let lateDeduction = 0;

            if (!record.morningTimeIn && !record.afternoonTimeIn) {
                status = 'Absent';
                lateHours = 8;
                lateDeduction = lateHours * deductionRate;
                return { status, lateHours, lateDeduction };
            }

            const lateThreshold = new Date(`1970-01-01T${officeStart}Z`);
            lateThreshold.setMinutes(lateThreshold.getMinutes() + gracePeriod);
            const lateThresholdTime = lateThreshold.toISOString().slice(11, 19).substring(0, 5);

            if (!record.morningTimeIn && record.afternoonTimeIn && record.afternoonTimeIn >= halfDayThreshold) {
                status = 'Half Day';
                lateHours = 4;
                lateDeduction = lateHours * deductionRate;
            } else if (record.morningTimeIn && !record.afternoonTimeIn && record.morningTimeOut) {
                status = 'Half Day';
                lateHours = 4;
                lateDeduction = lateHours * deductionRate;
            } else if (record.morningTimeIn && record.morningTimeIn > lateThresholdTime) {
                status = 'Late';
                const lateMinutes = this.timeToMinutes(record.morningTimeIn) - this.timeToMinutes(officeStart);
                lateHours = Math.ceil(lateMinutes / 60);
                lateDeduction = lateHours * deductionRate;
            } else if (record.afternoonTimeOut && record.afternoonTimeOut < officeEnd) {
                status = 'Early Departure';
            } else if ((record.morningTimeIn && !record.morningTimeOut) || (record.afternoonTimeIn && !record.afternoonTimeOut)) {
                status = 'Incomplete';
            }

            return { status, lateHours, lateDeduction };
        },
        async addAttendance() {
            try {
                const token = this.authStore.accessToken;
                const record = {
                    ...this.newAttendance,
                    workedHours: this.calculateWorkedHours(this.newAttendance),
                };
                const { status, lateHours, lateDeduction } = this.calculateStatusAndDeductions(record);
                record.status = status;
                record.lateHours = lateHours;
                record.lateDeduction = lateDeduction;

                const response = await axios.post(
                    `${BASE_API_URL}/api/attendance`,
                    record,
                    {
                        headers: { Authorization: `Bearer ${token}`, 'user-role': 'admin' },
                    }
                );
                this.employees.push({
                    ...response.data.employeeId,
                    date: response.data.date,
                    morningTimeIn: response.data.morningTimeIn,
                    morningTimeOut: response.data.morningTimeOut,
                    afternoonTimeIn: response.data.afternoonTimeIn,
                    afternoonTimeOut: response.data.afternoonTimeOut,
                    status: response.data.status,
                    lateHours: response.data.lateHours,
                    lateDeduction: response.data.lateDeduction,
                    workedHours: response.data.workedHours,
                    _id: response.data._id,
                });
                this.showAddModal = false;
                this.newAttendance = {
                    employeeId: '',
                    date: new Date().toISOString().split('T')[0],
                    morningTimeIn: '',
                    morningTimeOut: '',
                    afternoonTimeIn: '',
                    afternoonTimeOut: '',
                    status: 'Present',
                    lateHours: 0,
                    lateDeduction: 0,
                    workedHours: 0,
                };
                this.showSuccessMessage('Attendance record added successfully');
            } catch (error) {
                console.error('Error adding attendance:', error);
                this.showErrorMessage('Failed to add attendance record');
            }
        },
        async updateAttendance() {
            try {
                const token = this.authStore.accessToken;
                const record = {
                    ...this.selectedEmployee,
                    workedHours: this.calculateWorkedHours(this.selectedEmployee),
                };
                const { status, lateHours, lateDeduction } = this.calculateStatusAndDeductions(record);
                record.status = status;
                record.lateHours = lateHours;
                record.lateDeduction = lateDeduction;

                await axios.put(
                    `${BASE_API_URL}/api/attendance/${this.selectedEmployee._id}`,
                    record,
                    {
                        headers: { Authorization: `Bearer ${token}`, 'user-role': 'admin' },
                    }
                );
                const index = this.employees.findIndex(emp => emp._id === this.selectedEmployee._id);
                if (index !== -1) {
                    this.employees[index] = { ...this.employees[index], ...record };
                }
                this.showDetailsModal = false;
                this.showSuccessMessage('Attendance record updated successfully');
            } catch (error) {
                console.error('Error updating attendance:', error);
                this.showErrorMessage('Failed to update attendance record');
            }
        },
        async deleteAttendance(id) {
            try {
                const token = this.authStore.accessToken;
                await axios.delete(`${BASE_API_URL}/api/attendance/${id}`, {
                    headers: { Authorization: `Bearer ${token}`, 'user-role': 'admin' },
                });
                this.employees = this.employees.filter(emp => emp._id !== id);
                this.showSuccessMessage('Attendance record deleted successfully');
            } catch (error) {
                console.error('Error deleting attendance:', error);
                this.showErrorMessage('Failed to delete attendance record');
            }
        },
        showEmployeeDetails(employee) {
            this.selectedEmployee = { ...employee };
            this.showDetailsModal = true;
        },
        handleSearch() {
            this.currentPage = 1;
        },
        sortBy(key) {
            if (this.sortKey === key) {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortKey = key;
                this.sortDirection = 'asc';
            }
        },
        formatDate(date) {
            return moment(date).format('MM/DD/YYYY');
        },
        formatTime(time) {
            if (!time || time === '00:00:00') return '--';
            const [hours, minutes] = time.split(':');
            const period = parseInt(hours) >= 12 ? 'PM' : 'AM';
            const displayHours = parseInt(hours) % 12 || 12;
            return `${displayHours}:${minutes} ${period}`;
        },
        getStatusClass(status) {
            return {
                'On Time': 'text-green-600 bg-green-100 px-2 py-1 rounded-full',
                'Present': 'text-green-600 bg-green-100 px-2 py-1 rounded-full',
                'Late': 'text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full',
                'Absent': 'text-red-600 bg-red-100 px-2 py-1 rounded-full',
                'Early Departure': 'text-orange-600 bg-orange-100 px-2 py-1 rounded-full',
                'Half Day': 'text-blue-600 bg-blue-100 px-2 py-1 rounded-full',
                'Leave': 'text-gray-600 bg-gray-100 px-2 py-1 rounded-full',
                'Incomplete': 'text-purple-600 bg-purple-100 px-2 py-1 rounded-full',
            }[status] || 'text-gray-600';
        },
        showSuccessMessage(message, description = '') {
            this.toast = { message, description, type: 'success', isVisible: true };
            setTimeout(() => { this.toast.isVisible = false; }, 3000);
        },
        showErrorMessage(message, description = '') {
            this.toast = { message, description, type: 'error', isVisible: true };
            setTimeout(() => { this.toast.isVisible = false; }, 3000);
        },
    },
};
</script>

<template>
    <div class="min-h-screen bg-gray-100 p-6">
        <Toast v-if="toast.isVisible" :message="toast.message" :description="toast.description" :type="toast.type" />

        <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div class="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h1 class="text-xl font-semibold text-gray-800">Employee Attendance</h1>
                <div class="flex space-x-3 mt-3 sm:mt-0">
                    <button @click="showAddModal = true"
                        class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
                        <span class="material-icons">add</span> Add Attendance
                    </button>
                    <button @click="showSettingsModal = true"
                        class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2">
                        <span class="material-icons">settings</span> Settings
                    </button>
                </div>
            </div>

            <div class="flex flex-col sm:flex-row justify-between items-center mb-4">
                <input v-model="searchQuery" @input="debouncedSearch" placeholder="Search by name or employee number..."
                    class="w-full sm:w-1/3 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button @click="showFilterPanel = !showFilterPanel"
                    class="mt-3 sm:mt-0 bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2">
                    <span class="material-icons">filter_list</span> Filter
                </button>
            </div>

            <div v-if="showFilterPanel" class="bg-gray-50 p-4 rounded-lg mb-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="text-sm text-gray-600">Date Range</label>
                        <div class="flex space-x-2">
                            <input v-model="dateRange.start" type="date"
                                class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                            <input v-model="dateRange.end" type="date"
                                class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                        </div>
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Status</label>
                        <div class="flex flex-wrap gap-2">
                            <label v-for="status in statusOptions" :key="status" class="flex items-center gap-2">
                                <input v-model="statusFilter" type="checkbox" :value="status" />
                                {{ status }}
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th v-for="header in headers" :key="header.key"
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                                @click="sortBy(header.key)">
                                <div class="flex items-center gap-2">
                                    <span class="material-icons text-gray-400">{{ header.icon }}</span>
                                    {{ header.label }}
                                    <span v-if="sortKey === header.key" class="material-icons text-sm">{{ sortDirection
                                        === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-if="isLoading">
                            <td colspan="9" class="px-6 py-4 text-center">
                                <span class="animate-spin material-icons">autorenew</span> Loading...
                            </td>
                        </tr>
                        <tr v-else-if="!paginatedEmployees.length">
                            <td colspan="9" class="px-6 py-4 text-center text-gray-500">No attendance records found</td>
                        </tr>
                        <tr v-for="employee in paginatedEmployees" :key="employee._id" class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ employee.empNo }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {{ employee.firstName }} {{ employee.lastName }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(employee.date)
                                }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{
                                formatTime(employee.morningTimeIn) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{
                                formatTime(employee.morningTimeOut) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{
                                formatTime(employee.afternoonTimeIn) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{
                                formatTime(employee.afternoonTimeOut) }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ employee.workedHours ?
                                employee.workedHours.toFixed(2) : '0.00' }} hrs</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span :class="getStatusClass(employee.status)">{{ employee.status }}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <button @click="showEmployeeDetails(employee)"
                                    class="text-blue-500 hover:text-blue-700 mr-2">
                                    <span class="material-icons">edit</span>
                                </button>
                                <button @click="deleteAttendance(employee._id)" class="text-red-500 hover:text-red-700">
                                    <span class="material-icons">delete</span>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="flex flex-col sm:flex-row justify-between items-center mt-4">
                <div class="text-sm text-gray-600">
                    Showing {{ paginationInfo.start }} to {{ paginationInfo.end }} of {{ filteredEmployees.length }}
                    records
                </div>
                <div class="flex space-x-2 mt-3 sm:mt-0">
                    <button @click="currentPage -= 1" :disabled="currentPage === 1"
                        class="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50">
                        Previous
                    </button>
                    <button @click="currentPage += 1" :disabled="currentPage === totalPages"
                        class="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50">
                        Next
                    </button>
                </div>
            </div>
        </div>

        <!-- Add Attendance Modal -->
        <Modal :show="showAddModal" @close="showAddModal = false">
            <!-- Header -->
            <div
                class="p-4 border-b border-gray-300 flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
                <h2 class="text-xl font-bold text-gray-800">Add Attendance</h2>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto max-h-[65vh] p-4 space-y-6 pb-6">
                <div class="space-y-4">
                    <div>
                        <label class="text-sm text-gray-600">Employee</label>
                        <select v-model="newAttendance.employeeId"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2">
                            <option value="">Select Employee</option>
                            <option v-for="employee in employees" :key="employee._id" :value="employee._id">
                                {{ employee.firstName }} {{ employee.lastName }} ({{ employee.empNo }})
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Date</label>
                        <input v-model="newAttendance.date" type="date"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Morning Time In</label>
                        <input v-model="newAttendance.morningTimeIn" type="time"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Morning Time Out</label>
                        <input v-model="newAttendance.morningTimeOut" type="time"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Afternoon Time In</label>
                        <input v-model="newAttendance.afternoonTimeIn" type="time"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Afternoon Time Out</label>
                        <input v-model="newAttendance.afternoonTimeOut" type="time"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Status</label>
                        <select v-model="newAttendance.status"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2">
                            <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}
                            </option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-gray-300 bg-gray-50 flex justify-end gap-2">
                <button @click="showAddModal = false" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                    Cancel
                </button>
                <button @click="addAttendance" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Add
                </button>
            </div>
        </Modal>

        <!-- Edit Attendance Modal -->
        <Modal :show="showDetailsModal" @close="showDetailsModal = false">
            <!-- Header -->
            <div
                class="p-4 border-b border-gray-300 flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
                <h2 class="text-xl font-bold text-gray-800">Edit Attendance</h2>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto max-h-[65vh] p-4 space-y-6 pb-6">
                <div v-if="selectedEmployee" class="space-y-4">
                    <div>
                        <label class="text-sm text-gray-600">Employee</label>
                        <input
                            :value="`${selectedEmployee.firstName} ${selectedEmployee.lastName} (${selectedEmployee.empNo})`"
                            disabled class="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Date</label>
                        <input v-model="selectedEmployee.date" type="date"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Morning Time In</label>
                        <input v-model="selectedEmployee.morningTimeIn" type="time"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Morning Time Out</label>
                        <input v-model="selectedEmployee.morningTimeOut" type="time"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Afternoon Time In</label>
                        <input v-model="selectedEmployee.afternoonTimeIn" type="time"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Afternoon Time Out</label>
                        <input v-model="selectedEmployee.afternoonTimeOut" type="time"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Status</label>
                        <select v-model="selectedEmployee.status"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2">
                            <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Worked Hours</label>
                        <input :value="selectedEmployee.workedHours ? selectedEmployee.workedHours.toFixed(2) : '0.00'"
                            disabled class="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100" />
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-gray-300 bg-gray-50 flex justify-end gap-2">
                <button @click="showDetailsModal = false" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                    Cancel
                </button>
                <button @click="updateAttendance" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Save
                </button>
            </div>
        </Modal>

        <!-- Attendance Settings Modal -->
        <Modal :show="showSettingsModal" @close="showSettingsModal = false">
            <!-- Header -->
            <div
                class="p-4 border-b border-gray-300 flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
                <h2 class="text-xl font-bold text-gray-800">Attendance Settings</h2>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto max-h-[65vh] p-4 space-y-6 pb-6">
                <div class="space-y-4">
                    <div>
                        <label class="text-sm text-gray-600">Office Start</label>
                        <input v-model="attendanceSettings.officeStart" type="time"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Break Start</label>
                        <input v-model="attendanceSettings.breakStart" type="time"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Break End</label>
                        <input v-model="attendanceSettings.breakEnd" type="time"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Office End</label>
                        <input v-model="attendanceSettings.officeEnd" type="time"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Grace Period (minutes)</label>
                        <input v-model.number="attendanceSettings.gracePeriod" type="number"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Deduction Rate (per hour)</label>
                        <input v-model.number="attendanceSettings.deductionRate" type="number" step="0.01"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Early Time In Threshold</label>
                        <input v-model="attendanceSettings.earlyTimeInThreshold" type="time"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Early Time Out Threshold</label>
                        <input v-model="attendanceSettings.earlyTimeOutThreshold" type="time"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label class="text-sm text-gray-600">Half Day Threshold</label>
                        <input v-model="attendanceSettings.halfDayThreshold" type="time"
                            class="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-gray-300 bg-gray-50 flex justify-end gap-2">
                <button @click="showSettingsModal = false" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                    Cancel
                </button>
                <button @click="updateAttendanceSettings"
                    class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Save
                </button>
            </div>
        </Modal>
    </div>
</template>

<style scoped>
.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
