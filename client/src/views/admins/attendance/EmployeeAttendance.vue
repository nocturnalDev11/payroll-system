<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import Modal from '@/components/Modal.vue';
import { BASE_API_URL } from '@/utils/constants.ts';
import { useAttendanceStore } from '@/stores/attendance.store.ts';
import moment from 'moment';

// State
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const searchQuery = ref('');
const sortKey = ref('name');
const sortDirection = ref('asc');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showModal = ref(false);
const selectedEmployee = ref(null);
const statusMessage = ref('');

// Pinia Store
const attendanceStore = useAttendanceStore();
const attendanceRecords = computed(() => attendanceStore.attendanceRecords);
const isLoading = computed(() => attendanceStore.loading);

// Headers for table
const headers = [
    { key: 'id', label: 'ID', icon: 'badge', align: 'left' },
    { key: 'name', label: 'Name', icon: 'person', align: 'left' },
    { key: 'position', label: 'Position', icon: 'work', align: 'left' },
    { key: 'morningTimeIn', label: 'Morning In', icon: 'wb_sunny', align: 'left' },
    { key: 'morningTimeOut', label: 'Morning Out', icon: 'wb_sunny', align: 'left' },
    { key: 'afternoonTimeIn', label: 'Afternoon In', icon: 'nights_stay', align: 'left' },
    { key: 'afternoonTimeOut', label: 'Afternoon Out', icon: 'nights_stay', align: 'left' },
    { key: 'status', label: 'Status', icon: 'assignment_turned_in', align: 'left' },
];

// Computed Properties
const filteredAttendance = computed(() => {
    let records = attendanceRecords.value.map(record => ({
        ...record,
        id: record._id,
        recordDate: new Date(record.date).toISOString().split('T')[0],
        name: record.employeeId ? `${record.employeeId.firstName} ${record.employeeId.lastName}` : record.name || 'Unknown Employee',
        position: record.employeeId?.position || record.position || 'N/A',
        employeeIdNumber: record.employeeId?.employeeIdNumber || record.employeeIdNumber || 'N/A',
        email: record.employeeId?.email || record.email || 'N/A',
    }));

    if (selectedDate.value) {
        records = records.filter(record => record.recordDate === selectedDate.value);
    }

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        records = records.filter(record =>
            record.name.toLowerCase().includes(query) ||
            record.employeeIdNumber.toLowerCase().includes(query)
        );
    }

    return records.sort((a, b) => {
        const aValue = a[sortKey.value] || '';
        const bValue = b[sortKey.value] || '';
        const direction = sortDirection.value === 'asc' ? 1 : -1;
        return aValue.toString().localeCompare(bValue.toString()) * direction;
    });
});

const paginatedAttendance = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredAttendance.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(filteredAttendance.value.length / itemsPerPage.value));

const paginationInfo = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value + 1;
    const end = Math.min(currentPage.value * itemsPerPage.value, filteredAttendance.value.length);
    return { start, end };
});

// Utility Functions
const formatTime = (timeString) => {
    if (!timeString) return '--';
    return moment(timeString, 'HH:mm:ss').format('h:mm A');
};

const formatTimeForBackend = (time) => {
    if (!time) return null;
    return time.includes(':') && time.split(':').length === 3 ? time : `${time}:00`;
};

const getStatusClass = (status) => {
    return {
        'On Time': 'text-green-600 bg-green-100',
        'Present': 'text-green-600 bg-green-100',
        'Half Day': 'text-blue-600 bg-blue-100',
        'Absent': 'text-red-600 bg-red-100',
        'Late': 'text-yellow-600 bg-yellow-100',
        'Early Departure': 'text-orange-600 bg-orange-100',
    }[status] || 'text-gray-600';
};

// Methods
const fetchAttendance = async (event) => {
    event?.preventDefault();
    await attendanceStore.fetchAttendance();
    showMessage('Attendance records loaded successfully');
};

const sortTable = (key) => {
    if (sortKey.value === key) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortKey.value = key;
        sortDirection.value = 'asc';
    }
};

const prevPage = () => {
    if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) currentPage.value++;
};

const showDetails = (employee) => {
    selectedEmployee.value = { ...employee };
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    selectedEmployee.value = null;
};

const calculateStatus = (employee) => {
    if (employee.morningTimeIn && employee.afternoonTimeIn) return 'Present';
    if (employee.morningTimeIn && !employee.afternoonTimeIn) return 'Half Day';
    return 'Absent';
};

const updateAttendance = async (employee, changedField) => {
    try {
        const newStatus = changedField === 'status' ? employee.status : calculateStatus(employee);
        const payload = {
            morningTimeIn: formatTimeForBackend(employee.morningTimeIn),
            morningTimeOut: formatTimeForBackend(employee.morningTimeOut),
            afternoonTimeIn: formatTimeForBackend(employee.afternoonTimeIn),
            afternoonTimeOut: formatTimeForBackend(employee.afternoonTimeOut),
            status: newStatus,
        };

        console.log('Sending payload:', payload);

        const response = await axios.put(`${BASE_API_URL}/api/attendance/${employee.id}`, payload, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });

        console.log('Update response:', response.data);
        const updatedRecord = response.data;
        attendanceStore.attendanceRecords = attendanceStore.attendanceRecords.map(record =>
            record._id === updatedRecord._id ? { ...record, ...updatedRecord } : record
        );
        if (selectedEmployee.value && selectedEmployee.value.id === employee.id) {
            selectedEmployee.value = { ...selectedEmployee.value, ...updatedRecord };
        }
        showMessage('Attendance updated successfully');
    } catch (error) {
        console.error('Error updating attendance:', error);
        console.log('Error response:', error.response?.data);
        showMessage(`Update failed: ${error.response?.data?.message || error.message}`);
    }
};

const markTime = async (period) => {
    try {
        const timeField = {
            'morningIn': 'morningTimeIn',
            'morningOut': 'morningTimeOut',
            'afternoonIn': 'afternoonTimeIn',
            'afternoonOut': 'afternoonTimeOut',
        }[period];
        const timeValue = moment().format('HH:mm:ss');
        if (selectedEmployee.value) {
            selectedEmployee.value[timeField] = timeValue;
            selectedEmployee.value.status = calculateStatus(selectedEmployee.value);
            await updateAttendance(selectedEmployee.value, timeField);
        }
    } catch (error) {
        console.error('Error marking time:', error);
        showMessage('Failed to mark time');
    }
};

const generateReport = async () => {
    try {
        const csvHeader = [
            'Date',
            'Employee ID',
            'Name',
            'Position',
            'Morning Time In',
            'Morning Time Out',
            'Afternoon Time In',
            'Afternoon Time Out',
            'Status',
        ].join(',');

        const csvRows = filteredAttendance.value.map(employee => [
            selectedDate.value,
            employee.employeeIdNumber,
            `"${employee.name}"`,
            employee.position,
            employee.morningTimeIn ? `"${formatTime(employee.morningTimeIn)}"` : '""',
            employee.morningTimeOut ? `"${formatTime(employee.morningTimeOut)}"` : '""',
            employee.afternoonTimeIn ? `"${formatTime(employee.afternoonTimeIn)}"` : '""',
            employee.afternoonTimeOut ? `"${formatTime(employee.afternoonTimeOut)}"` : '""',
            employee.status,
        ].join(',')).join('\n');

        const csvContent = `${csvHeader}\n${csvRows}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Attendance_${selectedDate.value}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        showMessage('Report exported successfully');
    } catch (error) {
        console.error('Error generating CSV report:', error);
        showMessage('Export failed');
    }
};

const showMessage = (text) => {
    statusMessage.value = text;
    setTimeout(() => {
        statusMessage.value = '';
    }, 3000);
};

// Lifecycle
onMounted(() => {
    fetchAttendance();
});
</script>

<template>
    <div class="max-w-8xl mx-auto space-y-6 px-10 py-8">
        <header
            class="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row gap-4 items-center justify-between border-l-4 border-blue-500">
            <div class="text-center md:text-left w-full md:w-auto">
                <h1 class="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <span class="material-icons text-blue-600">schedule</span>
                    Employee Attendance
                </h1>
            </div>
            <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div class="relative w-full sm:w-56">
                    <span
                        class="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">calendar_today</span>
                    <input type="date" v-model="selectedDate" @change="fetchAttendance"
                        class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all duration-300 text-sm bg-white shadow-sm hover:shadow-md" />
                </div>
                <div class="relative w-full sm:w-72">
                    <span
                        class="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
                    <input v-model="searchQuery" type="text" placeholder="Search by name or ID..."
                        class="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all duration-300 text-sm bg-white shadow-sm hover:shadow-md" />
                    <button v-if="searchQuery" @click="searchQuery = ''"
                        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <button @click="generateReport"
                    class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex items-center gap-2 shadow-sm hover:shadow-md transition-all">
                    <span class="material-icons">download</span>
                    Export CSV
                </button>
            </div>
        </header>

        <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-100 sticky top-0 z-20">
                        <tr>
                            <th v-for="header in headers" :key="header.key"
                                class="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                                :class="header.align === 'center' ? 'text-center' : 'text-left'"
                                @click="sortTable(header.key)">
                                <div class="flex items-center gap-2"
                                    :class="header.align === 'center' ? 'justify-center' : 'justify-start'">
                                    <span class="material-icons text-gray-500">{{ header.icon }}</span>
                                    {{ header.label }}
                                    <span v-if="sortKey === header.key" class="material-icons text-gray-500">
                                        {{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                                    </span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        <template v-if="isLoading">
                            <tr v-for="n in 5" :key="n" class="animate-pulse">
                                <td v-for="m in 8" :key="m" class="px-6 py-4">
                                    <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                                </td>
                            </tr>
                        </template>
                        <tr v-for="employee in paginatedAttendance" :key="employee.id"
                            class="hover:bg-blue-50 transition-all duration-300">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {{ employee.employeeIdNumber }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center gap-3">
                                    <img :src="`https://ui-avatars.com/api/?name=${employee.name}&background=random&color=fff`"
                                        alt="Employee avatar"
                                        class="h-8 w-8 rounded-full object-cover border border-gray-100"
                                        loading="lazy" />
                                    <span class="text-sm text-gray-700">{{ employee.name }}</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {{ employee.position }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <input type="time" v-model="employee.morningTimeIn"
                                    @change="updateAttendance(employee, 'morningTimeIn')"
                                    class="w-24 py-1 px-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-sm" />
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <input type="time" v-model="employee.morningTimeOut"
                                    @change="updateAttendance(employee, 'morningTimeOut')"
                                    class="w-24 py-1 px-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-sm" />
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <input type="time" v-model="employee.afternoonTimeIn"
                                    @change="updateAttendance(employee, 'afternoonTimeIn')"
                                    class="w-24 py-1 px-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-sm" />
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <input type="time" v-model="employee.afternoonTimeOut"
                                    @change="updateAttendance(employee, 'afternoonTimeOut')"
                                    class="w-24 py-1 px-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-sm" />
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <span :class="getStatusClass(employee.status)" class="px-2 py-1 rounded-full">
                                    {{ employee.status }}
                                </span>
                                <button @click.stop="showDetails(employee)"
                                    class="ml-2 p-1 bg-indigo-500 text-white rounded hover:bg-indigo-600">
                                    <span class="material-icons text-sm">edit</span>
                                </button>
                            </td>
                        </tr>
                        <tr v-if="paginatedAttendance.length === 0 && !isLoading">
                            <td colspan="8" class="px-6 py-12 text-center text-sm text-gray-500">
                                <div class="flex flex-col items-center gap-3">
                                    <span class="material-icons text-4xl text-gray-400">event_busy</span>
                                    <p class="text-sm font-medium text-gray-700">No attendance records for this date.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="!isLoading && filteredAttendance.length > itemsPerPage"
                class="p-4 flex justify-between items-center bg-gray-50 border-t">
                <div class="text-sm text-gray-600">
                    Showing <span class="font-medium text-gray-800">{{ paginationInfo.start }}</span> to
                    <span class="font-medium text-gray-800">{{ paginationInfo.end }}</span> of
                    <span class="font-medium text-gray-800">{{ filteredAttendance.length }}</span> records
                </div>
                <div class="flex items-center gap-2">
                    <button @click="prevPage" :disabled="currentPage === 1"
                        class="p-2 rounded-md bg-white border border-gray-200 hover:bg-blue-100 text-gray-700 transition-all disabled:opacity-50">
                        <span class="material-icons">chevron_left</span>
                    </button>
                    <span class="text-sm text-gray-700">{{ currentPage }} / {{ totalPages }}</span>
                    <button @click="nextPage" :disabled="currentPage === totalPages"
                        class="p-2 rounded-md bg-white border border-gray-200 hover:bg-blue-100 text-gray-700 transition-all disabled:opacity-50">
                        <span class="material-icons">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal Component -->
        <Modal :show="showModal" @close="closeModal" max-width="lg">
            <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <span class="material-icons text-blue-600">person</span> Employee Attendance Details
                </h2>
                <button @click="closeModal" class="text-gray-500 hover:text-gray-800 p-1">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="p-6 space-y-5">
                <div class="flex items-center gap-3">
                    <img :src="`https://ui-avatars.com/api/?name=${selectedEmployee?.name}&background=random&color=fff`"
                        alt="Employee avatar" class="h-12 w-12 rounded-full object-cover border border-gray-200"
                        loading="lazy" />
                    <div>
                        <p class="text-base font-medium text-gray-800">{{ selectedEmployee?.name }}</p>
                        <p class="text-sm text-gray-600">{{ selectedEmployee?.position }}</p>
                    </div>
                </div>
                <p class="text-gray-700 text-sm"><strong>ID:</strong> {{ selectedEmployee?.employeeIdNumber }}</p>
                <p class="text-gray-700 text-sm"><strong>Email:</strong> {{ selectedEmployee?.email }}</p>
                <p class="text-gray-700 text-sm"><strong>Date:</strong> {{ formatDate(selectedEmployee?.date) }}</p>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Morning In</label>
                        <input type="time" v-model="selectedEmployee.morningTimeIn"
                            @change="updateAttendance(selectedEmployee, 'morningTimeIn')"
                            class="mt-1 w-full py-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Morning Out</label>
                        <input type="time" v-model="selectedEmployee.morningTimeOut"
                            @change="updateAttendance(selectedEmployee, 'morningTimeOut')"
                            class="mt-1 w-full py-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Afternoon In</label>
                        <input type="time" v-model="selectedEmployee.afternoonTimeIn"
                            @change="updateAttendance(selectedEmployee, 'afternoonTimeIn')"
                            class="mt-1 w-full py-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-sm" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Afternoon Out</label>
                        <input type="time" v-model="selectedEmployee.afternoonTimeOut"
                            @change="updateAttendance(selectedEmployee, 'afternoonTimeOut')"
                            class="mt-1 w-full py-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-sm" />
                    </div>
                </div>
                <p class="text-gray-700 text-sm"><strong>Status:</strong>
                    <select v-model="selectedEmployee.status" @change="updateAttendance(selectedEmployee, 'status')"
                        class="mt-1 py-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-sm">
                        <option value="Present">Present</option>
                        <option value="Half Day">Half Day</option>
                        <option value="Absent">Absent</option>
                        <option value="Late">Late</option>
                        <option value="Early Departure">Early Departure</option>
                    </select>
                </p>
                <div class="flex gap-2 mt-4">
                    <button @click="markTime('morningIn')"
                        class="flex-1 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
                        Morning In Now
                    </button>
                    <button @click="markTime('morningOut')"
                        class="flex-1 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
                        Morning Out Now
                    </button>
                    <button @click="markTime('afternoonIn')"
                        class="flex-1 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
                        Afternoon In Now
                    </button>
                    <button @click="markTime('afternoonOut')"
                        class="flex-1 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
                        Afternoon Out Now
                    </button>
                </div>
            </div>
        </Modal>

        <!-- Status Message -->
        <transition name="slide-fade">
            <div v-if="statusMessage"
                class="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-3 max-w-sm w-full"
                :class="statusMessage.includes('successfully') ? 'bg-green-50 text-green-700 border-l-4 border-green-600' : 'bg-red-50 text-red-700 border-l-4 border-red-600'">
                <span class="material-icons">
                    {{ statusMessage.includes('successfully') ? 'check_circle' : 'error' }}
                </span>
                <p class="text-sm font-medium">{{ statusMessage }}</p>
                <button @click="statusMessage = ''"
                    class="ml-auto p-1 rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100">
                    <span class="material-icons">close</span>
                </button>
            </div>
        </transition>
    </div>
</template>

<style scoped>
.table-slide-enter-active,
.table-slide-leave-active {
    transition: all 0.3s ease;
}

.table-slide-enter-from,
.table-slide-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    opacity: 0;
    transform: translateX(20px);
}

button:hover:not(:disabled) {
    transform: translateY(-1px);
    transition: all 0.15s ease;
}
</style>