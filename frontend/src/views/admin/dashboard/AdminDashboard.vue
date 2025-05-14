<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAttendanceStore } from '@/stores/attendance.store.js';
import { useAuthStore } from '@/stores/auth.store.js';
import { BASE_API_URL } from '@/utils/constants.js';
import EmployeeAttendanceDetails from './partials/EmployeeAttendanceDetails.vue';

const router = useRouter();
const attendanceStore = useAttendanceStore();
const authStore = useAuthStore();
const totalEmployees = ref(0);
const isLoading = ref(false);
const showModals = ref({});

// Attendance settings (mirroring EmployeeAttendance.vue)
const attendanceSettings = {
    officeStart: '08:00',
    breakStart: '11:30',
    breakEnd: '12:59',
    officeEnd: '17:00',
    gracePeriod: 15,
    deductionRate: 37.5,
    earlyTimeInThreshold: '06:00',
    earlyTimeOutThreshold: '11:30',
    halfDayThreshold: '13:00',
};

// Fetch total employees
const fetchTotalEmployees = async () => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/total`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authStore.accessToken}`,
                'user-role': authStore.userRole,
                'user-id': authStore.admin?._id?.toString(),
            },
        });
        if (!response.ok) throw new Error('Failed to fetch total employees');
        const data = await response.json();
        totalEmployees.value = data.total;
    } catch (error) {
        console.error('Failed to fetch total employees:', error);
    }
};

// Format time (from EmployeeAttendance.vue)
const formatTime = (time) => {
    if (!time || time === '00:00:00') return '--';
    const [hours, minutes] = time.split(':');
    const period = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const displayHours = parseInt(hours) % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
};

// Calculate worked hours (from EmployeeAttendance.vue)
const timeToMinutes = (time) => {
    if (!time || time === '00:00:00') return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const calculateWorkedHours = (record) => {
    let totalMinutes = 0;
    if (record.morningTimeIn && record.morningTimeOut) {
        totalMinutes += timeToMinutes(record.morningTimeOut) - timeToMinutes(record.morningTimeIn);
    } else if (record.morningTimeIn && !record.morningTimeOut) {
        totalMinutes += timeToMinutes(attendanceSettings.breakStart) - timeToMinutes(record.morningTimeIn);
    }
    if (record.afternoonTimeIn && record.afternoonTimeOut) {
        totalMinutes += timeToMinutes(record.afternoonTimeOut) - timeToMinutes(record.afternoonTimeIn);
    } else if (record.afternoonTimeIn && !record.afternoonTimeOut) {
        totalMinutes += timeToMinutes(attendanceSettings.officeEnd) - timeToMinutes(record.afternoonTimeIn);
    }
    if (record.morningTimeIn && record.afternoonTimeOut && !record.morningTimeOut && !record.afternoonTimeIn) {
        totalMinutes -= timeToMinutes(attendanceSettings.breakEnd) - timeToMinutes(attendanceSettings.breakStart);
    }
    return Math.max(0, totalMinutes / 60); // Return number, not string
};

// Refresh attendance
const refreshAttendance = async () => {
    isLoading.value = true;
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`${BASE_API_URL}/api/attendance/today?date=${today}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authStore.accessToken}`,
                'user-role': authStore.userRole,
                'user-id': authStore.admin?._id?.toString(),
            },
        });
        if (!response.ok) throw new Error(`Failed to fetch today’s attendance: ${response.status} - ${await response.text()}`);
        const data = await response.json();
        attendanceStore.attendanceRecords = data.map(record => ({
            ...record,
            workedHours: calculateWorkedHours(record) || 0,
        }));
    } catch (error) {
        console.error('Failed to refresh attendance:', error);
    } finally {
        isLoading.value = false;
    }
};

// Export attendance
const exportAttendance = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    const csvContent = [
        ['Date', 'Employee ID', 'Name', 'Position', 'Morning In', 'Morning Out', 'Afternoon In', 'Afternoon Out', 'Worked Hours', 'Status'],
        ...attendanceStore.attendanceRecords.map(record => [
            currentDate,
            record.employeeId?.empNo || 'N/A',
            `${record.employeeId?.firstName} ${record.employeeId?.lastName}`,
            record.employeeId?.position || 'N/A',
            formatTime(record.morningTimeIn),
            formatTime(record.morningTimeOut),
            formatTime(record.afternoonTimeIn),
            formatTime(record.afternoonTimeOut),
            (record.workedHours || 0).toFixed(2),
            record.status || 'N/A',
        ]),
    ]
        .map(row => row.join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_${currentDate}.csv`;
    link.click();
};

// Delete attendance
const deleteAttendance = async (id) => {
    if (confirm('Are you sure you want to delete this attendance record?')) {
        try {
            const response = await fetch(`${BASE_API_URL}/api/attendance/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authStore.accessToken}`,
                    'user-role': authStore.userRole,
                    'user-id': authStore.admin?._id?.toString(),
                },
            });
            if (!response.ok) throw new Error('Failed to delete attendance');
            await refreshAttendance();
        } catch (error) {
            console.error('Failed to delete attendance:', error);
        }
    }
};

// Modal controls
const openModal = (recordId) => {
    showModals.value[recordId] = true;
};

const closeModal = (recordId) => {
    showModals.value[recordId] = false;
};

// Computed properties for stats
const presentCount = computed(() => {
    return attendanceStore.attendanceRecords.filter(r =>
        r.status === 'On Time' ||
        r.status === 'Late' ||
        r.status === 'Early Departure' ||
        r.status === 'Present' ||
        r.status === 'Half Day'
    ).length;
});

const lateCount = computed(() => {
    return attendanceStore.attendanceRecords.filter(r => r.status === 'Late').length;
});

const absentCount = computed(() => {
    const presentIds = new Set(attendanceStore.attendanceRecords.map(r => r.employeeId._id.toString()));
    return totalEmployees.value - presentIds.size;
});

const halfdayCount = computed(() => {
    return attendanceStore.attendanceRecords.filter(r => r.status === 'Half Day').length;
});

const onTimeCount = computed(() => {
    return attendanceStore.attendanceRecords.filter(r => r.status === 'On Time').length;
});

const incompleteCount = computed(() => {
    return attendanceStore.attendanceRecords.filter(r => r.status === 'Incomplete').length;
});

onMounted(() => {
    fetchTotalEmployees();
    refreshAttendance();
});
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Stats Overview -->
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <!-- Total Employees -->
                <router-link to="/admin/manage-employees"
                    class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    <div class="p-6">
                        <div class="flex items-center">
                            <div class="rounded-full bg-indigo-100 p-3 flex items-center justify-center">
                                <span class="material-icons text-indigo-600">groups</span>
                            </div>
                            <div class="ml-5">
                                <p class="text-sm font-medium text-gray-600">Total Employees</p>
                                <h3 class="text-2xl font-bold text-gray-900">{{ totalEmployees }}</h3>
                            </div>
                        </div>
                    </div>
                </router-link>
                <!-- Present Today -->
                <router-link :to="{ path: '/admin/employee-attendance', query: { status: 'present' } }"
                    class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    <div class="flex items-center p-6 gap-4">
                        <div class="rounded-full bg-green-100 p-3 flex items-center justify-center">
                            <span class="material-icons text-green-600">how_to_reg</span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-600">Present Today</p>
                            <h3 class="text-2xl font-bold text-gray-900">{{ presentCount }}</h3>
                        </div>
                    </div>
                </router-link>
                <!-- Late Today -->
                <router-link :to="{ path: '/admin/employee-attendance', query: { status: 'late' } }"
                    class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    <div class="p-6">
                        <div class="flex items-center">
                            <div class="rounded-full bg-yellow-100 p-3 flex items-center justify-center">
                                <span class="material-icons text-yellow-600">schedule</span>
                            </div>
                            <div class="ml-5">
                                <p class="text-sm font-medium text-gray-600">Late Today</p>
                                <h3 class="text-2xl font-bold text-gray-900">{{ lateCount }}</h3>
                            </div>
                        </div>
                    </div>
                </router-link>
                <!-- Absent Today -->
                <router-link :to="{ path: '/admin/employee-attendance', query: { status: 'absent' } }"
                    class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    <div class="p-6">
                        <div class="flex items-center">
                            <div class="rounded-full bg-red-100 p-3 flex items-center justify-center">
                                <span class="material-icons text-red-600">cancel</span>
                            </div>
                            <div class="ml-5">
                                <p class="text-sm font-medium text-gray-600">Absent Today</p>
                                <h3 class="text-2xl font-bold text-gray-900">{{ absentCount }}</h3>
                            </div>
                        </div>
                    </div>
                </router-link>
                <!-- Halfday Today -->
                <router-link :to="{ path: '/admin/employee-attendance', query: { status: 'halfday' } }"
                    class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    <div class="p-6">
                        <div class="flex items-center">
                            <div class="rounded-full bg-blue-100 p-3 flex items-center justify-center">
                                <span class="material-icons text-blue-600">priority_high</span>
                            </div>
                            <div class="ml-5">
                                <p class="text-sm font-medium text-gray-600">Half Day Today</p>
                                <h3 class="text-2xl font-bold text-gray-900">{{ halfdayCount }}</h3>
                            </div>
                        </div>
                    </div>
                </router-link>
                <!-- On Time -->
                <router-link :to="{ path: '/admin/employee-attendance', query: { status: 'ontime' } }"
                    class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    <div class="p-6">
                        <div class="flex items-center">
                            <div class="rounded-full bg-orange-100 p-3 flex items-center justify-center">
                                <span class="material-symbols text-orange-600">early_on</span>
                            </div>
                            <div class="ml-5">
                                <p class="text-sm font-medium text-gray-600">On Time</p>
                                <h3 class="text-2xl font-bold text-gray-900">{{ onTimeCount }}</h3>
                            </div>
                        </div>
                    </div>
                </router-link>
                <!-- Incomplete Today -->
                <router-link :to="{ path: '/admin/employee-attendance', query: { status: 'incomplete' } }"
                    class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    <div class="p-6">
                        <div class="flex items-center">
                            <div class="rounded-full bg-purple-100 p-3 flex items-center justify-center">
                                <span class="material-icons text-purple-600">warning</span>
                            </div>
                            <div class="ml-5">
                                <p class="text-sm font-medium text-gray-600">Incomplete Today</p>
                                <h3 class="text-2xl font-bold text-gray-900">{{ incompleteCount }}</h3>
                            </div>
                        </div>
                    </div>
                </router-link>
            </div>
            <div class="mt-8 flex space-x-4">
                <button @click="refreshAttendance"
                    class="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                    :disabled="isLoading">
                    <span v-if="isLoading" class="animate-spin material-icons">refresh</span>
                    <span v-else class="material-icons">refresh</span>
                    <span>Refresh Data</span>
                </button>
                <button @click="exportAttendance"
                    class="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                    :disabled="isLoading">
                    <span class="material-icons">download</span>
                    <span>Export CSV</span>
                </button>
            </div>
            <!-- Attendance Table -->
            <div class="mt-8 bg-white rounded-xl shadow-sm overflow-hidden">
                <div class="p-6 border-b border-gray-300">
                    <h2 class="text-xl font-bold text-gray-900 flex items-center">
                        <span class="material-icons mr-2">event_note</span>
                        Today's Attendance
                    </h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th
                                    class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div class="flex items-center space-x-2 justify-center">
                                        <span class="material-icons text-gray-400">badge</span>
                                        <span>Employee</span>
                                    </div>
                                </th>
                                <th
                                    class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div class="flex items-center space-x-2 justify-center">
                                        <span class="material-icons text-gray-400">work</span>
                                        <span>Position</span>
                                    </div>
                                </th>
                                <th
                                    class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div class="flex items-center space-x-2 justify-center">
                                        <span class="material-icons text-gray-400">wb_sunny</span>
                                        <span>Morning In</span>
                                    </div>
                                </th>
                                <th
                                    class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div class="flex items-center space-x-2 justify-center">
                                        <span class="material-icons text-gray-400">wb_sunny</span>
                                        <span>Morning Out</span>
                                    </div>
                                </th>
                                <th
                                    class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div class="flex items-center space-x-2 justify-center">
                                        <span class="material-icons text-gray-400">nights_stay</span>
                                        <span>Afternoon In</span>
                                    </div>
                                </th>
                                <th
                                    class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div class="flex items-center space-x-2 justify-center">
                                        <span class="material-icons text-gray-400">nights_stay</span>
                                        <span>Afternoon Out</span>
                                    </div>
                                </th>
                                <th
                                    class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div class="flex items-center space-x-2 justify-center">
                                        <span class="material-icons text-gray-400">timer</span>
                                        <span>Worked Hours</span>
                                    </div>
                                </th>
                                <th
                                    class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div class="flex items-center space-x-2 justify-center">
                                        <span class="material-icons text-gray-400">info</span>
                                        <span>Status</span>
                                    </div>
                                </th>
                                <th
                                    class="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div class="flex items-center space-x-2 justify-center">
                                        <span class="material-icons text-gray-400">settings</span>
                                        <span>Actions</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            <template v-if="isLoading">
                                <tr v-for="n in 5" :key="n" class="animate-pulse">
                                    <td v-for="m in 9" :key="m" class="px-6 py-4">
                                        <div class="h-4 bg-gray-200 rounded"></div>
                                    </td>
                                </tr>
                            </template>
                            <template v-else>
                                <tr v-for="record in attendanceStore.attendanceRecords" :key="record._id"
                                    class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ record.employeeId?.firstName }} {{ record.employeeId?.lastName }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ record.employeeId?.position || 'N/A' }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ formatTime(record.morningTimeIn) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ formatTime(record.morningTimeOut) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ formatTime(record.afternoonTimeIn) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ formatTime(record.afternoonTimeOut) }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ (record.workedHours || 0).toFixed(2) }} hrs
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" :class="{
                                        'text-red-600': record.status === 'Absent',
                                        'text-green-600': record.status === 'On Time' || record.status === 'Present',
                                        'text-yellow-600': record.status === 'Late',
                                        'text-orange-600': record.status === 'Early Departure',
                                        'text-blue-600': record.status === 'Half Day',
                                        'text-purple-600': record.status === 'Incomplete',
                                        'text-gray-600': record.status === 'Leave',
                                    }">
                                        {{ record.status || 'N/A' }}
                                    </td>
                                    <td class="px-6 py-4 text-sm">
                                        <div class="flex space-x-2 justify-center">
                                            <EmployeeAttendanceDetails :show="showModals[record._id] || false"
                                                :employee="record" @open="openModal(record._id)"
                                                @close="closeModal(record._id)" />
                                            <button @click.stop="deleteAttendance(record._id)"
                                                class="flex items-center text-red-600 hover:text-red-800 transition cursor-pointer"
                                                title="Delete Record">
                                                <span class="material-icons">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
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

.hover\:bg-gray-50:hover {
    background-color: #f9fafb;
}

.transition {
    transition: all 0.2s ease-in-out;
}
</style>
