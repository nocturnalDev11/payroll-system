<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { BASE_API_URL } from '../../utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.ts';

const authStore = useAuthStore();
const token = localStorage.getItem('token');
const employee = ref(null);
const attendanceRecords = ref([]);
const isTimedIn = ref(false);
const isLoading = ref(false);
const currentPayPeriod = ref('Feb 16 - Feb 28, 2025');

const OFFICE_START = '08:00:00';
const OFFICE_END = '17:00:00';
const EARLY_TIME_IN_THRESHOLD = '06:00:00';
const EARLY_TIME_OUT_THRESHOLD = '11:30:00';
const LUNCH_END = '13:00:00';

onMounted(async () => {
    if (!token) {
        console.error('No token found, redirecting to login...');
        router.push('/employee/login');
        return;
    }

    await getEmployeeProfile();
    if (authStore.employee && authStore.employee._id) {
        await fetchAttendanceRecords();
        await checkTimedInStatus();
        await fetchSalaryDetails();
    } else {
        console.error('Employee data not available after profile fetch');
    }
});

async function getEmployeeProfile() {
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const employeeData = await response.json();
            employee.value = employeeData;
            authStore.employee = { ...employeeData, _id: employeeData.id };
            console.log('Fetched employee profile:', employeeData); // Debug log
        } else {
            throw new Error(await response.text());
        }
    } catch (error) {
        console.error('Error fetching employee profile:', error.message);
    }
}

async function fetchSalaryDetails() {
    try {
        const employeeId = authStore.employee?.employeeIdNumber;
        if (!employeeId) return;

        const response = await fetch(`${BASE_API_URL}/api/employees/${employeeId}/salary?month=${new Date().toISOString().slice(0, 7)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const salaryData = await response.json();
            employee.value = { ...employee.value, ...salaryData };
        } else {
            throw new Error(await response.text());
        }
    } catch (error) {
        console.error('Error fetching salary details:', error);
    }
}

async function fetchAttendanceRecords() {
    try {
        const employeeId = authStore.employee?._id;
        if (!employeeId) {
            console.error('No employee ID available for fetching attendance');
            return;
        }

        const response = await fetch(`${BASE_API_URL}/api/attendance/${employeeId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            attendanceRecords.value = await response.json();
        } else if (response.status === 404) {
            attendanceRecords.value = [];
        } else {
            const errorText = await response.text();
            console.error('Failed to fetch attendance records:', response.status, errorText);
        }
    } catch (error) {
        console.error('Error fetching attendance records:', error);
    }
}

async function checkTimedInStatus() {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceRecords.value.filter(record => record.date.split('T')[0] === today);
    const latestRecord = todayRecords[todayRecords.length - 1];
    isTimedIn.value = latestRecord && latestRecord.timeIn && !latestRecord.timeOut;
    console.log('Checked Timed In Status:', { today, todayRecords, latestRecord, isTimedIn: isTimedIn.value });
}

function canTimeIn() {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
    return currentTime >= EARLY_TIME_IN_THRESHOLD;
}

function canTimeOut() {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
    return currentTime >= EARLY_TIME_OUT_THRESHOLD;
}

async function timeIn() {
    if (!canTimeIn()) {
        alert('Time In is only allowed after 6:00 AM.');
        return;
    }
    isLoading.value = true;
    try {
        if (!authStore.employee || !authStore.employee._id) {
            console.error('No employee ID available for time in');
            alert('Please log in again to refresh your profile');
            return;
        }
        const payload = { employeeId: authStore.employee._id };
        const response = await fetch(`${BASE_API_URL}/api/attendance/time-in`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();
        console.log('Time In Response:', response.status, responseData);

        if (response.ok) {
            attendanceRecords.value.push(responseData);
            await checkTimedInStatus();
        } else {
            alert(responseData.message || 'Failed to time in');
        }
    } catch (error) {
        console.error('Error during time in:', error);
        alert('An error occurred while timing in');
    } finally {
        isLoading.value = false;
    }
}

async function timeOut() {
    if (!canTimeOut()) {
        alert('Time Out is only allowed after 11:30 AM.');
        return;
    }
    isLoading.value = true;
    try {
        if (!authStore.employee || !authStore.employee._id) {
            console.error('No employee ID available for time out');
            alert('Please log in again to refresh your profile');
            return;
        }
        const payload = { employeeId: authStore.employee._id };
        const response = await fetch(`${BASE_API_URL}/api/attendance/time-out`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();
        console.log('Time Out Response:', response.status, responseData);

        if (response.ok) {
            const updatedRecord = responseData;
            const index = attendanceRecords.value.findIndex(record => record._id === updatedRecord._id);
            if (index !== -1) {
                attendanceRecords.value[index] = updatedRecord;
            }
            await checkTimedInStatus();
        } else {
            alert(responseData.message || 'Failed to time out');
        }
    } catch (error) {
        console.error('Error during time out:', error);
        alert('An error occurred while timing out');
    } finally {
        isLoading.value = false;
    }
}

const formatNumber = (value) => {
    return Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const earningsBreakdown = computed(() => {
    return employee.value?.earnings?.map(e => ({
        name: e.name,
        amount: formatNumber(e.amount)
    })) || [];
});

const deductionsBreakdown = computed(() => {
    if (!employee.value?.deductions) return [];
    const customDeds = employee.value.deductions.customDeductions?.map(d => ({
        name: d.name,
        amount: formatNumber(d.amount)
    })) || [];
    return [
        ...customDeds,
        { name: 'SSS Contribution', amount: formatNumber(employee.value.deductions.sss) },
        { name: 'PhilHealth Contribution', amount: formatNumber(employee.value.deductions.philHealth) },
        { name: 'Pag-IBIG Contribution', amount: formatNumber(employee.value.deductions.pagIbig) },
        { name: 'Withholding Tax', amount: formatNumber(employee.value.deductions.tax) }
    ];
});

const employeeInitials = computed(() => {
    return employee.value?.firstName && employee.value?.lastName
        ? `${employee.value.firstName[0]}${employee.value.lastName[0]}`.toUpperCase()
        : '';
});

const netSalary = computed(() => {
    const earnings = employee.value?.totalEarnings || 0;
    const deductions = employee.value?.totalDeductions || 0;
    return formatNumber(earnings - deductions);
});

function formatDate(date) {
    if (!date) return '--';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
}

function formatTime(time) {
    if (!time) return '--';
    const [hours, minutes] = time.split(':');
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
}

function getStatusClass(status) {
    return {
        'On Time': 'text-green-600',
        'Late': 'text-yellow-600',
        'Absent': 'text-red-600',
        'Early Departure': 'text-orange-600',
        'Lunch Break': 'text-purple-600',
    }[status] || 'text-gray-600';
}

const handleImageError = () => {
    console.error('Failed to load profile picture:', employee.value?.profilePicture);
};
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div class="p-4">
            <div class="mb-6 bg-white rounded-xl border-l-4 border-l-green-600 shadow-sm p-6" v-if="employee">
                <div class="flex items-center space-x-4">
                    <div class="h-12 w-12 flex items-center justify-center overflow-hidden">
                        <img v-if="employee.profilePicture" :src="`${BASE_API_URL}${employee.profilePicture}`"
                            :alt="employee.firstName" class="h-full w-full object-cover rounded-full"
                            @error="handleImageError">
                        <div v-else class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <span class="text-blue-600 font-semibold text-lg">{{ employeeInitials }}</span>
                        </div>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-gray-800">{{ `${employee.firstName} ${employee.lastName}` }}
                        </h1>
                        <p class="text-sm text-gray-500">ID: {{ employee.employeeIdNumber }} | {{ employee.position }}
                        </p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div class="lg:col-span-3 space-y-6">
                    <!-- Attendance controls -->
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <div class="flex justify-between items-center">
                            <div class="text-sm text-gray-500">Current Pay Period: {{ currentPayPeriod }}</div>
                            <div class="flex space-x-3">
                                <button @click="timeIn" :disabled="isTimedIn || isLoading || !canTimeIn()"
                                    class="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors duration-200 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
                                    {{ isLoading && !isTimedIn ? 'Processing...' : 'Time In' }}
                                </button>
                                <button @click="timeOut" :disabled="!isTimedIn || isLoading || !canTimeOut()"
                                    class="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors duration-200 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
                                    {{ isLoading && isTimedIn ? 'Processing...' : 'Time Out' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Attendance records -->
                    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div class="p-6 border-b border-gray-100">
                            <h2 class="text-lg font-semibold text-gray-800">My Attendance Records</h2>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date</th>
                                        <th
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time In</th>
                                        <th
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time Out</th>
                                        <th
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr v-for="record in attendanceRecords" :key="record._id" class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatDate(record.date) }}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatTime(record.timeIn) }}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatTime(record.timeOut) }}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm"><span
                                                :class="getStatusClass(record.status)">{{ record.status }}</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Receipt-like Salary Details -->
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div class="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                            <h2 class="text-xl font-semibold text-gray-800">Payroll</h2>
                            <p class="text-sm text-gray-500">{{ currentPayPeriod }}</p>
                            <p class="text-sm text-gray-500">ID: {{ employee?.employeeIdNumber }}</p>
                        </div>

                        <div v-if="employee" class="space-y-4">
                            <div>
                                <h3 class="text-sm font-medium text-gray-700 mb-2">Earnings</h3>
                                <div v-for="earning in earningsBreakdown" :key="earning.name"
                                    class="flex justify-between text-sm py-1">
                                    <span class="text-gray-600">{{ earning.name }}</span>
                                    <span class="text-gray-800">₱{{ earning.amount }}</span>
                                </div>
                                <div class="border-t border-gray-200 pt-2 flex justify-between font-semibold text-sm">
                                    <span>Total Earnings</span>
                                    <span>₱{{ formatNumber(employee.totalEarnings) }}</span>
                                </div>
                            </div>

                            <div>
                                <h3 class="text-sm font-medium text-gray-700 mb-2">Deductions</h3>
                                <div v-for="deduction in deductionsBreakdown" :key="deduction.name"
                                    class="flex justify-between text-sm py-1">
                                    <span class="text-gray-600">{{ deduction.name }}</span>
                                    <span class="text-gray-800">₱{{ deduction.amount }}</span>
                                </div>
                                <div class="border-t border-gray-200 pt-2 flex justify-between font-semibold text-sm">
                                    <span>Total Deductions</span>
                                    <span>₱{{ formatNumber(employee.totalDeductions) }}</span>
                                </div>
                            </div>

                            <div class="border-t-2 border-dashed border-gray-300 pt-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-base font-semibold text-gray-800">Net Pay</span>
                                    <span class="text-lg font-bold text-blue-600">₱{{ netSalary }}</span>
                                </div>
                            </div>
                        </div>

                        <div v-else class="text-center">
                            <p class="text-gray-500">Loading payroll data...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>