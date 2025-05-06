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
            attendanceSettings: {
                officeStart: '08:00',
                lateCutoff: '08:15',
                breakStart: '11:30',
                breakEnd: '12:59',
                officeEnd: '17:00',
                gracePeriod: 15,
                deductionRate: 37.5,
            },
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
            newAttendance: {
                employeeId: '',
                morningTimeIn: '',
                morningTimeOut: '',
                afternoonTimeIn: '',
                afternoonTimeOut: '',
                status: 'Present'
            },
            headers: [
                { key: 'empNo', label: 'Employee No', icon: 'badge' },
                { key: 'firstName', label: 'Name', icon: 'person' },
                { key: 'morningTimeIn', label: 'Morning In', icon: 'wb_sunny' },
                { key: 'morningTimeOut', label: 'Morning Out', icon: 'wb_sunny' },
                { key: 'afternoonTimeIn', label: 'Afternoon In', icon: 'nights_stay' },
                { key: 'afternoonTimeOut', label: 'Afternoon Out', icon: 'nights_stay' },
                { key: 'status', label: 'Status', icon: 'check_circle' },
                { key: 'actions', label: 'Actions', icon: 'settings' },
            ],
            statusOptions: [
                'Present', 'Absent', 'Late', 'Half Day', 'On Time', 'Early Departure', 'Leave'
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
                const response = await axios.put(
                    `${BASE_API_URL}/api/attendance-settings`,
                    this.attendanceSettings,
                    {
                        headers: { Authorization: `Bearer ${token}`, 'user-role': 'admin' },
                    }
                );
                this.attendanceSettings = response.data;
                this.showSuccessMessage('Attendance settings updated successfully');
                this.showSettingsModal = false;
            } catch (error) {
                console.error('Error updating attendance settings:', error);
                this.showErrorMessage('Failed to update attendance settings');
            }
        },
        async fetchEmployeesAndAttendance() {
            this.isLoading = true;
            this.showInfoMessage('Loading data...');
            try {
                const token = this.authStore.accessToken;
                if (!token) throw new Error('No access token available. Please log in.');

                const empResponse = await axios.get(`${BASE_API_URL}/api/employees`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'admin',
                    },
                });

                const baseEmployees = (empResponse.data || [])
                    .filter(emp => emp.status !== 'pending' && emp.status !== 'archived')
                    .map(emp => ({
                        id: parseInt(emp.id),
                        employeeId: emp._id,
                        empNo: emp.empNo,
                        firstName: emp.firstName || 'Unknown',
                        lastName: emp.lastName || '',
                        morningTimeIn: null,
                        morningTimeOut: null,
                        afternoonTimeIn: null,
                        afternoonTimeOut: null,
                        status: 'Absent',
                        lateHours: 0,
                        lateDeduction: 0,
                    }));

                const attResponse = await axios.get(`${BASE_API_URL}/api/attendance`, {
                    params: { date: this.date },
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'admin',
                    },
                });

                const attendanceMap = (attResponse.data || []).reduce((map, record) => {
                    map[record.employeeId._id] = {
                        _id: record._id,
                        morningTimeIn: record.morningTimeIn || null,
                        morningTimeOut: record.morningTimeOut || null,
                        afternoonTimeIn: record.afternoonTimeIn || null,
                        afternoonTimeOut: record.afternoonTimeOut || null,
                        status: record.status || 'Absent',
                        lateHours: record.lateHours || 0,
                        lateDeduction: record.lateDeduction || 0,
                    };
                    return map;
                }, {});

                this.employees = baseEmployees.map(employee => {
                    const attendance = attendanceMap[employee.employeeId] || {};
                    return {
                        _id: attendance._id,
                        id: employee.id,
                        empNo: employee.empNo,
                        employeeId: employee.employeeId,
                        firstName: employee.firstName,
                        lastName: employee.lastName,
                        morningTimeIn: attendance.morningTimeIn || null,
                        morningTimeOut: attendance.morningTimeOut || null,
                        afternoonTimeIn: attendance.morningTimeIn || null,
                        afternoonTimeOut: attendance.afternoonTimeOut || null,
                        status: attendance.status || employee.status,
                        lateHours: attendance.lateHours || 0,
                        lateDeduction: attendance.lateDeduction || 0,
                        date: this.date,
                    };
                });

                this.showSuccessMessage('Data loaded');
            } catch (error) {
                console.error('Error fetching data:', error);
                this.showErrorMessage(`Failed to load data: ${error.message}`);
                this.employees = [];
                if (error.message.includes('No access token')) {
                    this.authStore.logout();
                    this.$router.push('/login');
                }
            } finally {
                this.isLoading = false;
            }
        },
        sortTable(key) {
            if (this.sortKey === key) {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortKey = key;
                this.sortDirection = 'asc';
            }
        },
        getStatusClass(status) {
            return {
                'On Time': 'text-green-600 bg-green-100',
                'Late': 'text-yellow-600 bg-yellow-100',
                'Absent': 'text-red-600 bg-red-100',
                'Early Departure': 'text-orange-600 bg-orange-100',
                'Present': 'text-green-600 bg-green-100',
                'Half Day': 'text-blue-600 bg-blue-100',
                'Leave': 'text-purple-600 bg-purple-100',
            }[status] || 'text-gray-600';
        },
        prevPage() {
            if (this.currentPage > 1) this.currentPage--;
        },
        nextPage() {
            if (this.currentPage < this.totalPages) this.currentPage++;
        },
        showDetails(employee) {
            this.selectedEmployee = { ...employee };
            if (typeof this.selectedEmployee.employeeId !== 'string') {
                this.selectedEmployee.employeeId = this.selectedEmployee.employeeId._id;
            }
            this.showDetailsModal = true;
        },
        showAddAttendanceModal() {
            this.newAttendance = {
                employeeId: '',
                morningTimeIn: '',
                morningTimeOut: '',
                afternoonTimeIn: '',
                afternoonTimeOut: '',
                status: 'Present'
            };
            this.showAddModal = true;
        },
        async addAttendance() {
            try {
                const token = this.authStore.accessToken;
                if (!token) throw new Error('No access token available. Please log in.');
                if (!this.newAttendance.employeeId) throw new Error('Please select an employee');

                const { status, lateHours, lateDeduction } = this.calculateStatusAndDeductions({
                    morningTimeIn: this.newAttendance.morningTimeIn,
                    morningTimeOut: this.newAttendance.morningTimeOut,
                    afternoonTimeIn: this.newAttendance.afternoonTimeIn,
                    afternoonTimeOut: this.newAttendance.afternoonTimeOut,
                });

                const payload = {
                    employeeId: this.newAttendance.employeeId,
                    date: this.date,
                    morningTimeIn: this.newAttendance.morningTimeIn || null,
                    morningTimeOut: this.newAttendance.morningTimeOut || null,
                    afternoonTimeIn: this.newAttendance.afternoonTimeIn || null,
                    afternoonTimeOut: this.newAttendance.afternoonTimeOut || null,
                    status: this.newAttendance.status,
                    lateHours,
                    lateDeduction,
                };

                const response = await axios.post(
                    `${BASE_API_URL}/api/attendance`,
                    payload,
                    { headers: { 'Authorization': `Bearer ${token}`, 'user-role': 'admin' } }
                );

                if (response.status === 201) {
                    this.showAddModal = false;
                    this.showSuccessMessage('Attendance record added successfully');
                    await this.fetchEmployeesAndAttendance();
                }
            } catch (error) {
                console.error('Error adding attendance:', error);
                this.showErrorMessage(`Failed to add attendance: ${error.message}`);
            }
        },
        calculateStatusAndDeductions({ morningTimeIn, morningTimeOut, afternoonTimeIn, afternoonTimeOut }) {
            const { officeStart, breakStart, breakEnd, officeEnd, gracePeriod, deductionRate } = this.attendanceSettings;
            const lateThreshold = moment(officeStart, 'HH:mm')
                .add(gracePeriod, 'minutes')
                .format('HH:mm');

            let status = 'Absent';
            let lateHours = 0;
            let lateDeduction = 0;

            if (!morningTimeIn && !afternoonTimeIn) {
                status = 'Absent';
                lateHours = 8;
                lateDeduction = lateHours * deductionRate;
            } else if (morningTimeIn && afternoonTimeOut && afternoonTimeOut >= officeEnd) {
                status = 'Present';
                if (morningTimeIn > lateThreshold) {
                    status = 'Late';
                    const [hours, minutes] = morningTimeIn.split(':').map(Number);
                    const [startHours, startMinutes] = officeStart.split(':').map(Number);
                    const lateMinutes = (hours * 60 + minutes) - (startHours * 60 + startMinutes);
                    lateHours = Math.ceil(lateMinutes / 60);
                    lateDeduction = lateHours * deductionRate;
                }
            } else if ((morningTimeIn && !afternoonTimeIn) || (!morningTimeIn && afternoonTimeIn)) {
                status = 'Half Day';
                lateHours = 4;
                lateDeduction = lateHours * deductionRate;
                if (morningTimeIn && morningTimeIn > lateThreshold) {
                    status = 'Late';
                    const [hours, minutes] = morningTimeIn.split(':').map(Number);
                    const [startHours, startMinutes] = officeStart.split(':').map(Number);
                    const lateMinutes = (hours * 60 + minutes) - (startHours * 60 + startMinutes);
                    lateHours = Math.max(4, Math.ceil(lateMinutes / 60));
                    lateDeduction = lateHours * deductionRate;
                } else if (afternoonTimeIn && afternoonTimeIn > breakEnd) {
                    status = 'Late';
                    lateHours = 4;
                    lateDeduction = lateHours * deductionRate;
                }
            } else if (morningTimeIn && morningTimeIn > lateThreshold) {
                status = 'Late';
                const [hours, minutes] = morningTimeIn.split(':').map(Number);
                const [startHours, startMinutes] = officeStart.split(':').map(Number);
                const lateMinutes = (hours * 60 + minutes) - (startHours * 60 + startMinutes);
                lateHours = Math.ceil(lateMinutes / 60);
                lateDeduction = lateHours * deductionRate;
            } else if (afternoonTimeIn && afternoonTimeIn > breakEnd) {
                status = 'Late';
                lateHours = 4;
                lateDeduction = lateHours * deductionRate;
            } else if (
                (morningTimeOut && morningTimeOut < breakStart) ||
                (afternoonTimeOut && afternoonTimeOut < officeEnd)
            ) {
                status = 'Early Departure';
            } else if (morningTimeIn && morningTimeIn <= lateThreshold) {
                status = 'On Time';
            }

            return { status, lateHours, lateDeduction };
        },
        async markTime(period) {
            try {
                const timeField = {
                    'morningIn': 'morningTimeIn',
                    'morningOut': 'morningTimeOut',
                    'afternoonIn': 'afternoonTimeIn',
                    'afternoonOut': 'afternoonTimeOut'
                }[period];
                const timeValue = moment().format('HH:mm');
                if (this.selectedEmployee && timeValue) {
                    this.selectedEmployee[timeField] = timeValue;
                    const { status, lateHours, lateDeduction } = this.calculateStatusAndDeductions({
                        morningTimeIn: this.selectedEmployee.morningTimeIn,
                        morningTimeOut: this.selectedEmployee.morningTimeOut,
                        afternoonTimeIn: this.selectedEmployee.afternoonTimeIn,
                        afternoonTimeOut: this.selectedEmployee.afternoonTimeOut,
                    });
                    this.selectedEmployee.status = status;
                    this.selectedEmployee.lateHours = lateHours;
                    this.selectedEmployee.lateDeduction = lateDeduction;
                    if (typeof this.selectedEmployee.employeeId !== 'string') {
                        this.selectedEmployee.employeeId = this.selectedEmployee.employeeId._id;
                    }
                    await this.updateAttendance(this.selectedEmployee, timeField);
                }
            } catch (error) {
                console.error('Error marking time:', error);
                this.showErrorMessage('Failed to mark time');
            }
        },
        async updateAttendance(employee, changedField) {
            try {
                const token = this.authStore.accessToken;
                if (!token) throw new Error('No access token available. Please log in.');

                if (!employee || !employee.employeeId) throw new Error('Invalid employee ID');
                if (!this.date || !/^\d{4}-\d{2}-\d{2}$/.test(this.date)) throw new Error('Invalid date format');

                const { status, lateHours, lateDeduction } = changedField === 'status'
                    ? { status: employee.status, lateHours: employee.lateHours, lateDeduction: employee.lateDeduction }
                    : this.calculateStatusAndDeductions({
                        morningTimeIn: employee.morningTimeIn,
                        morningTimeOut: employee.morningTimeOut,
                        afternoonTimeIn: employee.afternoonTimeIn,
                        afternoonTimeOut: employee.afternoonTimeOut,
                    });

                const payload = {
                    employeeId: typeof employee.employeeId === 'string' ? employee.employeeId : employee.employeeId._id,
                    date: this.date,
                    morningTimeIn: employee.morningTimeIn || null,
                    morningTimeOut: employee.morningTimeOut || null,
                    afternoonTimeIn: employee.afternoonTimeIn || null,
                    afternoonTimeOut: employee.afternoonTimeOut || null,
                    status,
                    lateHours,
                    lateDeduction,
                };

                let response;
                if (employee._id) {
                    response = await axios.put(
                        `${BASE_API_URL}/api/attendance/${employee._id}`,
                        payload,
                        { headers: { 'Authorization': `Bearer ${token}`, 'user-role': 'admin' } }
                    );
                } else {
                    response = await axios.post(
                        `${BASE_API_URL}/api/attendance`,
                        payload,
                        { headers: { 'Authorization': `Bearer ${token}`, 'user-role': 'admin' } }
                    );
                }

                if (response.status === 200 || response.status === 201) {
                    const updatedEmployee = {
                        ...employee,
                        _id: response.data._id,
                        ...response.data,
                    };
                    this.employees = this.employees.map(emp =>
                        emp.id === employee.id ? updatedEmployee : emp
                    );
                    if (employee === this.selectedEmployee) {
                        this.selectedEmployee = updatedEmployee;
                    }
                    this.showSuccessMessage('Updated successfully');
                }
            } catch (error) {
                console.error('Error updating attendance:', error);
                this.showErrorMessage(`Update failed: ${error.response?.data?.message || error.message}`);
                if (error.message.includes('No access token')) {
                    this.authStore.logout();
                    this.$router.push('/login');
                }
            }
        },
        formatTime(time) {
            return time ? moment(time, 'HH:mm').format('h:mm A') : '--';
        },
        async generateReport() {
            try {
                const formattedDate = this.date;
                const csvHeader = [
                    'Date',
                    'Employee No',
                    'First Name',
                    'Last Name',
                    'Morning Time In',
                    'Morning Time Out',
                    'Afternoon Time In',
                    'Afternoon Time Out',
                    'Status',
                    'Late Hours',
                    'Late Deduction'
                ].join(',');

                const csvRows = this.filteredEmployees.map(employee => [
                    formattedDate,
                    employee.empNo,
                    employee.firstName,
                    employee.lastName,
                    employee.morningTimeIn ? `"${this.formatTime(employee.morningTimeIn)}"` : '""',
                    employee.morningTimeOut ? `"${this.formatTime(employee.morningTimeOut)}"` : '""',
                    employee.afternoonTimeIn ? `"${this.formatTime(employee.afternoonTimeIn)}"` : '""',
                    employee.afternoonTimeOut ? `"${this.formatTime(employee.afternoonTimeOut)}"` : '""',
                    employee.status,
                    employee.lateHours,
                    employee.lateDeduction
                ].join(',')).join('\n');

                const csvContent = `${csvHeader}\n${csvRows}`;
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `Attendance_${this.date}.csv`;
                link.click();
                URL.revokeObjectURL(link.href);

                this.showSuccessMessage('Report exported successfully');
            } catch (error) {
                console.error('Error generating CSV report:', error);
                this.showErrorMessage('Export failed');
            }
        },
        showSuccessMessage(message) {
            this.toast = {
                message,
                type: 'success',
                isVisible: true,
            };
        },
        showErrorMessage(message) {
            this.toast = {
                message,
                type: 'error',
                isVisible: true,
            };
        },
        showInfoMessage(message) {
            this.toast = {
                message,
                type: 'info',
                isVisible: true,
            };
        },
        handleToastClose() {
            this.toast.isVisible = false;
        },
        handleSearch() {
            this.currentPage = 1;
            this.fetchEmployeesAndAttendance();
        },
        resetFilters() {
            this.statusFilter = [];
            this.dateRange = {
                start: new Date().toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0],
            };
            this.searchQuery = '';
            this.$router.replace({ query: {} });
            this.fetchEmployeesAndAttendance();
        },
    },
    watch: {
        searchQuery(newVal) {
            this.debouncedSearch(newVal);
        },
        '$route.query.status': {
            handler(newStatus) {
                this.applyStatusFilterFromQuery();
                this.fetchEmployeesAndAttendance();
            },
            immediate: true,
        },
    },
};
</script>

<template>
    <div class="min-h-screen bg-gray-50 p-4">
        <div class="mx-auto">
            <!-- Header -->
            <header class="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-5 flex flex-col gap-3 sm:gap-4 md:gap-3">
                <div class="flex flex-col lg:flex-row xl:flex-row items-center justify-between gap-3 sm:gap-4 md:gap-3">

                    <h1 class="text-xl sm:text-2xl md:text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span class="material-icons text-indigo-600 text-xl sm:text-2xl md:text-xl">schedule</span>
                        Attendance Dashboard
                    </h1>

                    <div class="flex items-center gap-2 sm:gap-3 md:gap-2 w-full xl:w-auto lg:w-auto">
                        <div
                            class="flex flex-col lg:flex-row xl:flex-row justify-center gap-2 sm:gap-3 md:gap-3 w-full">
                            <button @click="showAddAttendanceModal"
                                class="flex-1 sm:flex-none px-3 sm:px-4 md:px-3 py-1.5 sm:py-2 md:py-1.5 bg-green-600 text-white text-xs sm:text-sm md:text-xs font-medium rounded-lg hover:bg-green-700 transition-all flex items-center gap-1.5 sm:gap-2 md:gap-1 cursor-pointer">
                                <span class="material-icons text-sm sm:text-base md:text-sm">add</span>
                                Add
                            </button>
                            <button @click="generateReport"
                                class="flex-1 sm:flex-none px-3 sm:px-4 md:px-3 py-1.5 sm:py-2 md:py-1.5 bg-indigo-600 text-white text-xs sm:text-sm md:text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-1.5 sm:gap-2 md:gap-1 cursor-pointer">
                                <span class="material-icons text-sm sm:text-base md:text-sm">download</span>
                                Export
                            </button>
                            <button @click="showSettingsModal = true"
                                class="flex-1 sm:flex-none px-3 sm:px-4 md:px-3 py-1.5 sm:py-2 md:py-1.5 bg-blue-600 text-white text-xs sm:text-sm md:text-xs font-medium rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 sm:gap-2 md:gap-1 cursor-pointer">
                                <span class="material-icons text-sm sm:text-base md:text-sm">settings</span>
                                Settings
                            </button>
                            <button @click="showFilterPanel = !showFilterPanel"
                                class="p-1.5 sm:p-2 md:p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-1.5 sm:gap-2 md:gap-1 cursor-pointer w-full sm:w-auto">
                                <span class="material-icons text-sm sm:text-base md:text-sm">filter_list</span>
                                <span class="text-xs sm:text-sm md:text-xs font-medium">Filters</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Search and Filter Controls -->
                <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-3">
                    <div class="relative flex-1 flex">
                        <span
                            class="material-icons absolute left-2 sm:left-3 md:left-2 top-1/2 -translate-y-1/2 text-gray-500 text-base sm:text-lg md:text-base">search</span>
                        <input v-model="searchQuery" type="text" placeholder="Search by name or employee number..."
                            class="w-full pl-8 sm:pl-10 md:pl-8 pr-8 sm:pr-10 md:pr-8 py-1.5 sm:py-2 md:py-1.5 text-xs sm:text-sm md:text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            aria-label="Search employees" @keyup.enter="handleSearch" />
                        <button v-if="searchQuery" @click="searchQuery = ''"
                            class="absolute right-2 sm:right-3 md:right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-all cursor-pointer"
                            aria-label="Clear search">
                            <span class="material-icons text-sm sm:text-base md:text-sm">close</span>
                        </button>
                    </div>
                </div>

                <!-- Filter Panel -->
                <transition name="filter-slide">
                    <div v-if="showFilterPanel" class="bg-gray-50 p-3 sm:p-4 md:p-3 rounded-lg shadow-inner mt-2">
                        <div class="flex flex-col gap-3 sm:gap-4 md:gap-3">
                            <div class="flex-1">
                                <label
                                    class="block text-xs sm:text-sm md:text-xs font-medium text-gray-700 mb-1">Status</label>
                                <div class="relative">
                                    <select v-model="statusFilter" multiple
                                        class="w-full p-1.5 sm:p-2 md:p-1.5 text-xs sm:text-sm md:text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none min-h-[80px] sm:min-h-[100px] md:min-h-[80px]"
                                        aria-label="Filter by attendance status">
                                        <option v-for="status in statusOptions" :key="status" :value="status">
                                            {{ status }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <div class="flex-1">
                                <label class="block text-xs sm:text-sm md:text-xs font-medium text-gray-700 mb-1">Date
                                    Range</label>
                                <div class="flex flex-col sm:flex-row gap-2 md:gap-2">
                                    <input type="date" v-model="dateRange.start" @change="fetchEmployeesAndAttendance"
                                        class="flex-1 p-1.5 sm:p-2 md:p-1.5 text-xs sm:text-sm md:text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        aria-label="Start date" />
                                    <span
                                        class="self-center text-gray-500 text-xs sm:text-sm md:text-xs hidden sm:block">to</span>
                                    <input type="date" v-model="dateRange.end" @change="fetchEmployeesAndAttendance"
                                        class="flex-1 p-1.5 sm:p-2 md:p-1.5 text-xs sm:text-sm md:text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        aria-label="End date" />
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-col sm:flex-row justify-end gap-2 mt-3 sm:mt-4 md:mt-3">
                            <button @click="resetFilters"
                                class="px-3 sm:px-4 md:px-3 py-1.5 sm:py-2 md:py-1.5 bg-gray-200 text-gray-700 text-xs sm:text-sm md:text-xs font-medium rounded-lg hover:bg-gray-300 transition-all cursor-pointer">
                                Reset Filters
                            </button>
                            <button @click="showFilterPanel = false"
                                class="px-3 sm:px-4 md:px-3 py-1.5 sm:py-2 md:py-1.5 bg-indigo-600 text-white text-xs sm:text-sm md:text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all cursor-pointer">
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </transition>
            </header>

            <!-- Table -->
            <div class="bg-white rounded-xl shadow-lg mt-6 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full divide-y divide-gray-100">
                        <thead class="bg-gray-50">
                            <tr>
                                <th v-for="header in headers" :key="header.key"
                                    class="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hover:bg-gray-100 transition-colors cursor-pointer"
                                    @click="sortTable(header.key)">
                                    <div class="flex items-center gap-1">
                                        <span class="material-icons text-indigo-400 text-xs">{{ header.icon }}</span>
                                        <span>{{ header.label }}</span>
                                        <span v-if="sortKey === header.key" class="material-icons text-xs">
                                            {{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                                        </span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 bg-white">
                            <tr v-if="isLoading" class="animate-pulse">
                                <td colspan="8" class="px-3 py-2">
                                    <div class="h-4 bg-gray-200 rounded w-full"></div>
                                </td>
                            </tr>
                            <tr v-for="employee in paginatedEmployees" :key="employee.id"
                                class="hover:bg-gray-50 transition-colors text-xs">
                                <td class="px-3 py-2 text-gray-700">{{ employee.empNo }}</td>
                                <td class="px-3 py-2">
                                    <div class="flex items-center gap-2">
                                        <img :src="`https://ui-avatars.com/api/?name=${employee.firstName}+${employee.lastName}&background=4f46e5&color=fff&size=24`"
                                            class="h-6 w-6 rounded-full" />
                                        <span class="font-medium text-gray-800">{{ employee.firstName }} {{
                                            employee.lastName }}</span>
                                    </div>
                                </td>
                                <td class="px-3 py-2 text-gray-700">
                                    <input type="time" v-model="employee.morningTimeIn"
                                        @change="updateAttendance(employee, 'morningTimeIn')"
                                        class="w-20 py-1 px-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white outline-none" />
                                </td>
                                <td class="px-3 py-2 text-gray-700">
                                    <input type="time" v-model="employee.morningTimeOut"
                                        @change="updateAttendance(employee, 'morningTimeOut')"
                                        class="w-20 py-1 px-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white outline-none" />
                                </td>
                                <td class="px-3 py-2 text-gray-700">
                                    <input type="time" v-model="employee.afternoonTimeIn"
                                        @change="updateAttendance(employee, 'afternoonTimeIn')"
                                        class="w-20 py-1 px-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white outline-none" />
                                </td>
                                <td class="px-3 py-2 text-gray-700">
                                    <input type="time" v-model="employee.afternoonTimeOut"
                                        @change="updateAttendance(employee, 'afternoonTimeOut')"
                                        class="w-20 py-1 px-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white outline-none" />
                                </td>
                                <td class="px-3 py-2">
                                    <span :class="getStatusClass(employee.status)"
                                        class="text-xs px-2 py-1 rounded-full">
                                        {{ employee.status }}
                                    </span>
                                </td>
                                <td class="px-3 py-2 flex items-center gap-1">
                                    <select v-model="employee.status" @change="updateAttendance(employee, 'status')"
                                        class="w-20 py-1 px-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white">
                                        <option value="On Time">On Time</option>
                                        <option value="Late">Late</option>
                                        <option value="Absent">Absent</option>
                                        <option value="Early Departure">Early Departure</option>
                                        <option value="Present">Present</option>
                                        <option value="Half Day">Half Day</option>
                                        <option value="Leave">Leave</option>
                                    </select>
                                    <button @click="showDetails(employee)"
                                        class="p-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                                        title="Edit Details">
                                        <span class="material-icons text-xs">edit</span>
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="!isLoading && paginatedEmployees.length === 0">
                                <td colspan="8" class="px-3 py-4 text-center text-gray-500 text-xs">
                                    No employees found
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <!-- Pagination -->
                <div v-if="filteredEmployees.length > itemsPerPage"
                    class="p-2 flex justify-between items-center bg-gray-50 border-t border-gray-100">
                    <span class="text-xs text-gray-500">
                        {{ paginationInfo.start }}-{{ paginationInfo.end }} of {{ filteredEmployees.length }}
                    </span>
                    <div class="flex gap-2">
                        <button @click="prevPage" :disabled="currentPage === 1"
                            class="px-2 py-1 bg-indigo-500 text-white text-xs rounded disabled:bg-gray-300 hover:bg-indigo-600">
                            Prev
                        </button>
                        <button @click="nextPage" :disabled="currentPage === totalPages"
                            class="px-2 py-1 bg-indigo-500 text-white text-xs rounded disabled:bg-gray-300 hover:bg-indigo-600">
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <!-- Edit Modal -->
            <Modal :show="showDetailsModal" maxWidth="sm" maxHeight="80vh" closeable @close="showDetailsModal = false">
                <div class="p-4">
                    <div class="flex justify-between items-center mb-3">
                        <h2 class="text-lg font-medium text-gray-800">Edit Attendance</h2>
                        <button @click="showDetailsModal = false" class="text-gray-500 hover:text-gray-700">
                            <span class="material-icons text-lg">close</span>
                        </button>
                    </div>
                    <div class="space-y-3">
                        <div class="flex items-center gap-2">
                            <img :src="`https://ui-avatars.com/api/?name=${selectedEmployee?.firstName}+${selectedEmployee?.lastName}&background=4f46e5&color=fff`"
                                class="h-8 w-8 rounded-full" />
                            <div>
                                <p class="font-medium text-gray-800">{{ selectedEmployee?.firstName }} {{
                                    selectedEmployee?.lastName }}</p>
                                <p class="text-xs text-gray-500">ID: {{ selectedEmployee?.empNo }}</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label for="morningTimeIn" class="block text-xs font-medium text-gray-700">Morning
                                    In</label>
                                <input id="morningTimeIn" v-model="selectedEmployee.morningTimeIn" type="time"
                                    class="mt-1 p-1 w-full text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                                    @change="updateAttendance(selectedEmployee, 'morningTimeIn')" />
                            </div>
                            <div>
                                <label for="morningTimeOut" class="block text-xs font-medium text-gray-700">Morning
                                    Out</label>
                                <input id="morningTimeOut" v-model="selectedEmployee.morningTimeOut" type="time"
                                    class="mt-1 p-1 w-full text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                                    @change="updateAttendance(selectedEmployee, 'morningTimeOut')" />
                            </div>
                            <div>
                                <label for="afternoonTimeIn" class="block text-xs font-medium text-gray-700">Afternoon
                                    In</label>
                                <input id="afternoonTimeIn" v-model="selectedEmployee.afternoonTimeIn" type="time"
                                    class="mt-1 p-1 w-full text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                                    @change="updateAttendance(selectedEmployee, 'afternoonTimeIn')" />
                            </div>
                            <div>
                                <label for="afternoonTimeOut" class="block text-xs font-medium text-gray-700">Afternoon
                                    Out</label>
                                <input id="afternoonTimeOut" v-model="selectedEmployee.afternoonTimeOut" type="time"
                                    class="mt-1 p-1 w-full text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                                    @change="updateAttendance(selectedEmployee, 'afternoonTimeOut')" />
                            </div>
                            <div class="col-span-2">
                                <label for="status" class="block text-xs font-medium text-gray-700">Status</label>
                                <select id="status" v-model="selectedEmployee.status"
                                    class="mt-1 p-1 w-full text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                                    @change="updateAttendance(selectedEmployee, 'status')">
                                    <option value="Present">Present</option>
                                    <option value="Half Day">Half Day</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Late">Late</option>
                                    <option value="On Time">On Time</option>
                                    <option value="Early Departure">Early Departure</option>
                                    <option value="Leave">Leave</option>
                                </select>
                            </div>
                        </div>
                        <div class="flex gap-2 mt-4">
                            <button @click="markTime('morningIn')"
                                class="flex-1 py-1 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600">
                                Morning In Now
                            </button>
                            <button @click="markTime('morningOut')"
                                class="flex-1 py-1 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600">
                                Morning Out Now
                            </button>
                            <button @click="markTime('afternoonIn')"
                                class="flex-1 py-1 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600">
                                Afternoon In Now
                            </button>
                            <button @click="markTime('afternoonOut')"
                                class="flex-1 py-1 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600">
                                Afternoon Out Now
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            <!-- Add Attendance Modal -->
            <Modal :show="showAddModal" maxWidth="sm" maxHeight="80vh" closeable @close="showAddModal = false">
                <div class="p-4">
                    <div class="flex justify-between items-center mb-3">
                        <h2 class="text-lg font-medium text-gray-800">Add Attendance Record</h2>
                        <button @click="showAddModal = false" class="text-gray-500 hover:text-gray-700">
                            <span class="material-icons text-lg">close</span>
                        </button>
                    </div>
                    <div class="space-y-3">
                        <div>
                            <label for="employeeSelect" class="block text-xs font-medium text-gray-700">Employee</label>
                            <select id="employeeSelect" v-model="newAttendance.employeeId"
                                class="mt-1 p-1 w-full text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white">
                                <option value="" disabled>Select an employee</option>
                                <option v-for="employee in employees" :key="employee.id" :value="employee.employeeId">
                                    {{ employee.firstName }} {{ employee.lastName }} ({{ employee.empNo }})
                                </option>
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label for="newMorningTimeIn" class="block text-xs font-medium text-gray-700">Morning
                                    In</label>
                                <input id="newMorningTimeIn" v-model="newAttendance.morningTimeIn" type="time"
                                    class="mt-1 p-1 w-full text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white" />
                            </div>
                            <div>
                                <label for="newMorningTimeOut" class="block text-xs font-medium text-gray-700">Morning
                                    Out</label>
                                <input id="newMorningTimeOut" v-model="newAttendance.morningTimeOut" type="time"
                                    class="mt-1 p-1 w-full text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white" />
                            </div>
                            <div>
                                <label for="newAfternoonTimeIn"
                                    class="block text-xs font-medium text-gray-700">Afternoon In</label>
                                <input id="newAfternoonTimeIn" v-model="newAttendance.afternoonTimeIn" type="time"
                                    class="mt-1 p-1 w-full text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white" />
                            </div>
                            <div>
                                <label for="newAfternoonTimeOut"
                                    class="block text-xs font-medium text-gray-700">Afternoon Out</label>
                                <input id="newAfternoonTimeOut" v-model="newAttendance.afternoonTimeOut" type="time"
                                    class="mt-1 p-1 w-full text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white" />
                            </div>
                            <div class="col-span-2">
                                <label for="newStatus" class="block text-xs font-medium text-gray-700">Status</label>
                                <select id="newStatus" v-model="newAttendance.status"
                                    class="mt-1 p-1 w-full text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white">
                                    <option value="Present">Present</option>
                                    <option value="Half Day">Half Day</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Late">Late</option>
                                    <option value="On Time">On Time</option>
                                    <option value="Early Departure">Early Departure</option>
                                    <option value="Leave">Leave</option>
                                </select>
                            </div>
                        </div>
                        <div class="flex gap-2 mt-4">
                            <button @click="addAttendance"
                                class="flex-1 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600">
                                Add Record
                            </button>
                            <button @click="showAddModal = false"
                                class="flex-1 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            <!-- Settings Modal -->
            <Modal :show="showSettingsModal" maxWidth="md" maxHeight="80vh" closeable
                @close="showSettingsModal = false">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-lg font-medium text-gray-800">Attendance Settings</h2>
                        <button @click="showSettingsModal = false" class="text-gray-500 hover:text-gray-700">
                            <span class="material-icons text-lg">close</span>
                        </button>
                    </div>
                    <div class="space-y-4">
                        <div>
                            <label for="officeStart" class="block text-sm font-medium text-gray-700">Official Time
                                In</label>
                            <input id="officeStart" v-model="attendanceSettings.officeStart" type="time"
                                class="mt-1 p-2 w-full text-sm border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white" />
                        </div>
                        <div>
                            <label for="lateCutoff" class="block text-sm font-medium text-gray-700">Late
                                Cutoff</label>
                            <input id="lateCutoff" v-model="attendanceSettings.lateCutoff" type="time"
                                class="mt-1 p-2 w-full text-sm border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white" />
                        </div>
                        <div>
                            <label for="breakStart" class="block text-sm font-medium text-gray-700">Break
                                Start</label>
                            <input id="breakStart" v-model="attendanceSettings.breakStart" type="time"
                                class="mt-1 p-2 w-full text-sm border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white" />
                        </div>
                        <div>
                            <label for="breakEnd" class="block text-sm font-medium text-gray-700">Break End</label>
                            <input id="breakEnd" v-model="attendanceSettings.breakEnd" type="time"
                                class="mt-1 p-2 w-full text-sm border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white" />
                        </div>
                        <div>
                            <label for="officeEnd" class="block text-sm font-medium text-gray-700">Official Time
                                Out</label>
                            <input id="officeEnd" v-model="attendanceSettings.officeEnd" type="time"
                                class="mt-1 p-2 w-full text-sm border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white" />
                        </div>
                        <div>
                            <label for="gracePeriod" class="block text-sm font-medium text-gray-700">Grace Period
                                (minutes)</label>
                            <input id="gracePeriod" v-model.number="attendanceSettings.gracePeriod" type="number"
                                min="0"
                                class="mt-1 p-2 w-full text-sm border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white" />
                        </div>
                        <div>
                            <label for="deductionRate" class="block text-sm font-medium text-gray-700">Deduction
                                Rate (per hour)</label>
                            <input id="deductionRate" v-model.number="attendanceSettings.deductionRate" type="number"
                                step="0.01" min="0"
                                class="mt-1 p-2 w-full text-sm border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white" />
                        </div>
                    </div>
                    <div class="flex gap-2 mt-6">
                        <button @click="updateAttendanceSettings"
                            class="flex-1 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600">
                            Save Settings
                        </button>
                        <button @click="showSettingsModal = false"
                            class="flex-1 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600">
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>

            <!-- Status Message -->
            <Toast v-if="toast.isVisible" :message="toast.message" :type="toast.type" :duration="2000"
                @close="handleToastClose" />
        </div>
    </div>
</template>

<style scoped>
/* Transitions */
.filter-slide-enter-active,
.filter-slide-leave-active {
    transition: all 0.3s ease;
}

.filter-slide-enter-from,
.filter-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

button:hover:not(:disabled) {
    transform: translateY(-1px);
    transition: all 0.2s ease;
}

/* Animations */
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

/* Tailwind-Driven Styles */
select[multiple] {
    height: auto;
    min-height: 80px;
}

input,
select {
    transition: all 0.2s ease;
}

input:focus,
select:focus {
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}
</style>