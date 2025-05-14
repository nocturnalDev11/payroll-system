<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';
import Toast from '@/components/Toast.vue';
import {
    calculateTotalEarnings,
    calculatePayheadEarnings,
    calculatePayheadDeductions,
    calculateSupplementaryIncome,
    calculateOvertimePay,
    calculateSSSContribution,
    calculatePhilHealthContribution,
    calculatePagIBIGContribution,
    calculateWithholdingTax,
    calculateLateDeductions,
} from '@/utils/calculations.js';

const authStore = useAuthStore();
const router = useRouter();
const token = localStorage.getItem('token');
const employee = ref(null);
const attendanceRecords = ref([]);
const todayAttendance = ref([]);
const isTimedIn = ref(false);
const isLoading = ref(false);
const toast = ref({ message: '', type: 'info', isVisible: false });

// Attendance settings fetched from backend
const attendanceSettings = ref({
    officeStart: '08:00',
    breakStart: '11:30',
    breakEnd: '12:59',
    officeEnd: '17:00',
    gracePeriod: 10,
    deductionRate: 37.5,
    earlyTimeInThreshold: '06:00',
    earlyTimeOutThreshold: '11:30',
    halfDayThreshold: '13:00',
});

const currentPayPeriod = computed(() => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const day = today.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return day <= 15
        ? `${monthNames[month]} 01 - ${monthNames[month]} 15, ${year}`
        : `${monthNames[month]} 16 - ${monthNames[month]} ${new Date(year, month + 1, 0).getDate()}, ${year}`;
});

const config = {
    minimumWage: 610,
    deMinimisLimit: 10000,
};

onMounted(async () => {
    if (!token || !authStore.isAuthenticated) {
        router.push('/employee/login');
        return;
    }
    await Promise.all([
        getEmployeeProfile(),
        fetchAttendanceSettings(),
    ]);
    if (authStore.employee?._id) {
        await Promise.all([
            fetchAttendanceRecords(),
            checkTimedInStatus(),
            authStore.userRole === 'admin' ? fetchTodayAttendance() : Promise.resolve(),
        ]);
    }
});

async function getEmployeeProfile() {
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'user-role': authStore.userRole,
                'user-id': authStore.employee?._id || '',
            },
        });
        if (!response.ok) throw new Error(await response.text());
        const employeeData = await response.json();
        employee.value = {
            ...employeeData,
            position: employeeData.position || 'N/A',
            salary: employeeData.salary || 0,
        };
        authStore.setEmployee(employeeData);
    } catch (error) {
        console.error('Error fetching profile:', error);
        showToast('error', 'Failed to load employee profile. Please try again later.');
    }
}

async function fetchAttendanceSettings() {
    try {
        const response = await fetch(`${BASE_API_URL}/api/attendance-settings`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'user-role': authStore.userRole,
                'user-id': authStore.employee?._id || '',
            },
        });
        if (!response.ok) throw new Error(await response.text());
        attendanceSettings.value = await response.json();
    } catch (error) {
        console.error('Error fetching attendance settings:', error);
        showToast('error', 'Failed to load attendance settings. Using default values.');
    }
}

async function fetchAttendanceRecords() {
    try {
        const employeeId = authStore.employee?._id;
        if (!employeeId) return;
        const response = await fetch(`${BASE_API_URL}/api/attendance/${employeeId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'user-role': authStore.userRole,
                'user-id': employeeId,
            },
        });
        if (response.ok) {
            attendanceRecords.value = await response.json();
        } else if (response.status === 404) {
            attendanceRecords.value = [];
        } else {
            throw new Error(await response.text());
        }
    } catch (error) {
        console.error('Error fetching attendance:', error);
        showToast('error', 'Failed to load attendance records.');
    }
}

async function fetchTodayAttendance() {
    try {
        const response = await fetch(`${BASE_API_URL}/api/attendance/today`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'user-role': authStore.userRole,
                'user-id': authStore.employee?._id,
            },
        });
        if (response.ok) {
            todayAttendance.value = await response.json();
        } else if (response.status === 404) {
            todayAttendance.value = [];
        } else {
            throw new Error(await response.text());
        }
    } catch (error) {
        console.error('Error fetching today\'s attendance:', error);
        showToast('error', 'Failed to load today\'s attendance.');
    }
}

async function checkTimedInStatus() {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceRecords.value.filter(
        (record) => new Date(record.date).toISOString().split('T')[0] === today
    );
    const latestRecord = todayRecords[todayRecords.length - 1];
    isTimedIn.value =
        latestRecord &&
        (
            (latestRecord.morningTimeIn && !latestRecord.morningTimeOut) ||
            (latestRecord.afternoonTimeIn && !latestRecord.afternoonTimeOut)
        );
}

async function timeIn() {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
    const today = now.toISOString().split('T')[0]; // Ensure consistent date format
    const { earlyTimeInThreshold, breakStart, breakEnd, halfDayThreshold } = attendanceSettings.value;

    if (!canTimeIn()) {
        let message = '';
        if (currentTime < earlyTimeInThreshold) {
            message = `Time In is not allowed before ${formatTime(earlyTimeInThreshold)}.`;
        } else if (currentTime >= breakStart && currentTime <= breakEnd) {
            message = `Time In is not allowed during lunch break (${formatTime(breakStart)} - ${formatTime(breakEnd)}).`;
        } else {
            message = 'You are already Timed In or have completed today\'s sessions.';
        }
        showToast('error', message);
        return;
    }

    isLoading.value = true;
    try {
        const employeeId = authStore.employee?._id;
        if (!employeeId) throw new Error('No employee ID');
        const response = await fetch(`${BASE_API_URL}/api/attendance/time-in`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'user-role': authStore.userRole,
                'user-id': employeeId,
            },
            body: JSON.stringify({ employeeId, date: today, time: currentTime }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        const existingRecordIndex = attendanceRecords.value.findIndex(
            (record) => new Date(record.date).toISOString().split('T')[0] === today
        );
        if (existingRecordIndex !== -1) {
            attendanceRecords.value[existingRecordIndex] = data;
        } else {
            attendanceRecords.value.push(data);
        }
        await checkTimedInStatus();
        if (authStore.userRole === 'admin') await fetchTodayAttendance();
        showToast('success', 'Successfully Timed In.');
    } catch (error) {
        showToast('error', error.message || 'Failed to time in.');
    } finally {
        isLoading.value = false;
    }
}

async function timeOut() {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
    const { earlyTimeOutThreshold } = attendanceSettings.value;

    if (!canTimeOut()) {
        showToast('error', `Time Out is only allowed after ${formatTime(earlyTimeOutThreshold)}.`);
        return;
    }

    isLoading.value = true;
    try {
        const employeeId = authStore.employee?._id;
        if (!employeeId) throw new Error('No employee ID');
        const response = await fetch(`${BASE_API_URL}/api/attendance/time-out`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'user-role': authStore.userRole,
                'user-id': employeeId,
            },
            body: JSON.stringify({ employeeId, time: currentTime }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        const index = attendanceRecords.value.findIndex((r) => r._id === data._id);
        if (index !== -1) attendanceRecords.value[index] = data;
        await checkTimedInStatus();
        if (authStore.userRole === 'admin') await fetchTodayAttendance();
        showToast('success', 'Successfully Timed Out.');
    } catch (error) {
        showToast('error', error.message || 'Failed to time out.');
    } finally {
        isLoading.value = false;
    }
}

function canTimeIn() {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
    const { earlyTimeInThreshold, breakStart, breakEnd, halfDayThreshold } = attendanceSettings.value;
    const today = now.toISOString().split('T')[0];
    const todayRecords = attendanceRecords.value.filter(
        (record) => new Date(record.date).toISOString().split('T')[0] === today
    );
    const latestRecord = todayRecords[todayRecords.length - 1];

    if (currentTime >= breakStart && currentTime <= breakEnd) {
        return false;
    }

    if (!latestRecord || (!latestRecord.morningTimeIn && !latestRecord.morningTimeOut)) {
        return currentTime >= earlyTimeInThreshold && currentTime <= breakStart;
    }

    if (
        (latestRecord?.morningTimeIn && latestRecord?.morningTimeOut) ||
        (!latestRecord?.morningTimeIn && currentTime >= breakEnd)
    ) {
        return currentTime >= breakEnd && !latestRecord?.afternoonTimeIn;
    }

    if (currentTime >= halfDayThreshold && !latestRecord?.afternoonTimeIn) {
        return true;
    }

    return false;
}

function canTimeOut() {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
    const { earlyTimeOutThreshold } = attendanceSettings.value;
    return currentTime >= earlyTimeOutThreshold && isTimedIn.value;
}

function calculateWorkedHours(record) {
    const { breakStart, breakEnd } = attendanceSettings.value;
    let totalMinutes = 0;

    const timeToMinutes = (time) => {
        if (!time || time === '00:00:00') return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    if (record.morningTimeIn && record.morningTimeOut) {
        totalMinutes += timeToMinutes(record.morningTimeOut) - timeToMinutes(record.morningTimeIn);
    } else if (record.morningTimeIn && !record.morningTimeOut) {
        record.status = 'Incomplete';
        totalMinutes += timeToMinutes(breakStart) - timeToMinutes(record.morningTimeIn);
    }

    if (record.afternoonTimeIn && record.afternoonTimeOut) {
        totalMinutes += timeToMinutes(record.afternoonTimeOut) - timeToMinutes(record.afternoonTimeIn);
    } else if (record.afternoonTimeIn && !record.afternoonTimeOut) {
        record.status = 'Incomplete';
        totalMinutes += timeToMinutes(record.afternoonTimeOut || '17:00:00') - timeToMinutes(record.afternoonTimeIn);
    }

    if (record.morningTimeIn && record.afternoonTimeOut && !record.morningTimeOut && !record.afternoonTimeIn) {
        totalMinutes -= timeToMinutes(breakEnd) - timeToMinutes(breakStart);
    }

    return Math.max(0, totalMinutes / 60).toFixed(2);
}

function getAttendanceStatus(record) {
    const { officeStart, officeEnd, gracePeriod, halfDayThreshold, breakStart, breakEnd } = attendanceSettings.value;
    if (!record.morningTimeIn && !record.afternoonTimeIn) return 'Absent';

    const morningIn = record.morningTimeIn || '00:00:00';
    const afternoonIn = record.afternoonTimeIn || '00:00:00';
    const afternoonOut = record.afternoonTimeOut || record.morningTimeOut || '00:00:00';

    const lateThreshold = new Date(`1970-01-01T${officeStart}Z`);
    lateThreshold.setMinutes(lateThreshold.getMinutes() + gracePeriod);
    const lateThresholdTime = lateThreshold.toISOString().slice(11, 19);

    if (!record.morningTimeIn && afternoonIn >= halfDayThreshold) {
        return 'Half Day';
    }
    if (record.morningTimeIn && !record.afternoonTimeIn && record.morningTimeOut) {
        return 'Half Day';
    }
    if (morningIn > lateThresholdTime) {
        return 'Late';
    }
    if (afternoonOut < officeEnd && afternoonOut !== '00:00:00') {
        return 'Early Departure';
    }
    if ((record.morningTimeIn && !record.morningTimeOut) || (record.afternoonTimeIn && !record.afternoonTimeOut)) {
        return 'Incomplete';
    }
    return 'Present';
}

function showToast(type, message) {
    toast.value = {
        message,
        type,
        isVisible: true,
    };
    setTimeout(() => {
        toast.value.isVisible = false;
    }, 3000);
}

const formatNumber = (value) => {
    return Number(value || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const payrollData = computed(() => {
    if (!employee.value) return null;
    const basicSalary = Number(employee.value.salary || 0);
    const sanitizedPayheads = Array.isArray(employee.value.payheads)
        ? employee.value.payheads.filter((ph) => ph && typeof ph === 'object' && 'type' in ph && 'name' in ph && 'amount' in ph)
        : [];
    const payheadEarnings = sanitizedPayheads
        .filter((ph) => ph.type === 'Earnings')
        .map((ph) => ({ name: ph.name, amount: formatNumber(ph.amount) }));
    const payheadDeductions = sanitizedPayheads
        .filter((ph) => ph.type === 'Deductions')
        .map((ph) => ({ name: ph.name, amount: formatNumber(ph.amount) }));
    const travelExpenses = Number(employee.value.earnings?.travelExpenses || 0);
    const otherEarnings = Number(employee.value.earnings?.otherEarnings || 0);
    const overtimePay = calculateOvertimePay(employee.value);
    const supplementary = calculateSupplementaryIncome(employee.value);

    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const payPeriodType = today.getDate() <= 15 ? 'mid-month' : 'end-month';
    const lateDeduction = calculateLateDeductions(
        attendanceRecords.value,
        currentYearMonth,
        payPeriodType
    );

    const sss = calculateSSSContribution(basicSalary);
    const philhealth = calculatePhilHealthContribution(basicSalary);
    const pagibig = calculatePagIBIGContribution(basicSalary);
    const withholdingTax = calculateWithholdingTax(employee.value, config);

    const earnings = [
        { name: 'Basic Salary', amount: formatNumber(basicSalary) },
        ...(travelExpenses > 0 ? [{ name: 'Travel Expenses', amount: formatNumber(travelExpenses) }] : []),
        ...(otherEarnings > 0 ? [{ name: 'Other Earnings', amount: formatNumber(otherEarnings) }] : []),
        ...(overtimePay > 0 ? [{ name: 'Overtime Pay', amount: formatNumber(overtimePay) }] : []),
        ...(payheadEarnings.length > 0 ? payheadEarnings : []),
        ...(supplementary.taxable > 0 ? [{ name: 'Supplementary Income', amount: formatNumber(supplementary.taxable) }] : []),
    ];

    const deductions = [
        ...(sss > 0 ? [{ name: 'SSS Contribution', amount: formatNumber(sss) }] : []),
        ...(philhealth > 0 ? [{ name: 'PhilHealth Contribution', amount: formatNumber(philhealth) }] : []),
        ...(pagibig > 0 ? [{ name: 'Pag-IBIG Contribution', amount: formatNumber(pagibig) }] : []),
        ...(withholdingTax > 0 ? [{ name: 'Withholding Tax', amount: formatNumber(withholdingTax) }] : []),
    ];

    const otherDeductions = [
        ...(payheadDeductions.length > 0 ? payheadDeductions : []),
        ...(lateDeduction > 0 ? [{ name: 'Late Deductions', amount: formatNumber(lateDeduction) }] : []),
    ];

    const totalEarnings = earnings.reduce((sum, earning) => sum + Number(earning.amount.replace(/,/g, '')), 0);
    const totalDeductions = sss + philhealth + pagibig + withholdingTax +
        payheadDeductions.reduce((sum, deduction) => sum + Number(deduction.amount.replace(/,/g, '')), 0) +
        lateDeduction;
    const netSalary = totalEarnings - totalDeductions;

    return {
        earnings,
        deductions,
        otherDeductions,
        totalEarnings: formatNumber(totalEarnings),
        totalDeductions: formatNumber(totalDeductions),
        netSalary: formatNumber(netSalary),
    };
});

const employeeInitials = computed(() =>
    employee.value?.firstName && employee.value?.lastName
        ? `${employee.value.firstName[0]}${employee.value.lastName[0]}`.toUpperCase()
        : ''
);

function formatDate(date) {
    if (!date) return '--';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function formatTime(time) {
    if (!time) return '--';
    const [hours, minutes] = time.split(':');
    const period = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const displayHours = parseInt(hours) % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
}

function getStatusClass(status) {
    return {
        'On Time': 'text-green-600 bg-green-100 px-2 py-1 rounded-full',
        'Present': 'text-green-600 bg-green-100 px-2 py-1 rounded-full',
        'Late': 'text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full',
        'Absent': 'text-red-600 bg-red-100 px-2 py-1 rounded-full',
        'Early Departure': 'text-orange-600 bg-orange-100 px-2 py-1 rounded-full',
        'Half Day': 'text-blue-600 bg-blue-100 px-2 py-1 rounded-full',
        'Incomplete': 'text-purple-600 bg-purple-100 px-2 py-1 rounded-full',
    }[status] || 'text-gray-600';
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div class="p-4">
            <Toast v-if="toast.isVisible" :message="toast.message" :type="toast.type" />

            <div v-if="employee" class="mb-6 bg-white rounded-xl border-l-4 border-l-green-600 shadow-sm p-6">
                <div class="flex items-center space-x-4">
                    <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-blue-600 font-semibold text-lg">{{ employeeInitials }}</span>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-gray-800">{{ `${employee.firstName} ${employee.lastName}` }}
                        </h1>
                        <p class="text-sm text-gray-500">ID: {{ employee.empNo }} | {{ employee.position || 'N/A' }}</p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div class="lg:col-span-3 space-y-6">
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <div
                            class="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
                            <div class="text-sm text-gray-500">Current Pay Period: {{ currentPayPeriod }}</div>
                            <div class="flex flex-row space-x-3 w-full sm:w-auto">
                                <button @click="timeIn" :disabled="isTimedIn || isLoading || !canTimeIn()"
                                    class="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-1 sm:flex-none">
                                    <span v-if="isLoading && !isTimedIn"
                                        class="animate-spin material-icons">autorenew</span>
                                    {{ isLoading && !isTimedIn ? 'Processing...' : 'Time In' }}
                                </button>
                                <button @click="timeOut" :disabled="!isTimedIn || isLoading || !canTimeOut()"
                                    class="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-1 sm:flex-none">
                                    <span v-if="isLoading && isTimedIn"
                                        class="animate-spin material-icons">autorenew</span>
                                    {{ isLoading && isTimedIn ? 'Processing...' : 'Time Out' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-if="authStore.userRole === 'admin'" class="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div class="p-6 border-b border-gray-100">
                            <h2 class="text-lg font-semibold text-gray-800">Today's Attendance</h2>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Employee</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Morning In</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Morning Out</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Afternoon In</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Afternoon Out</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Worked Hours</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Status</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr v-for="record in todayAttendance" :key="record._id" class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ record.employeeId.firstName }} {{ record.employeeId.lastName }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatTime(record.morningTimeIn) }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatTime(record.morningTimeOut) }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatTime(record.afternoonTimeIn) }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatTime(record.afternoonTimeOut) }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ record.workedHours ? record.workedHours.toFixed(2) : '0.00' }} hrs
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            <span :class="getStatusClass(getAttendanceStatus(record))">{{
                                                getAttendanceStatus(record) }}</span>
                                        </td>
                                    </tr>
                                    <tr v-if="!todayAttendance.length">
                                        <td colspan="7" class="px-6 py-4 text-center text-gray-500">No employees timed
                                            in today</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div class="p-6 border-b border-gray-100">
                            <h2 class="text-lg font-semibold text-gray-800">My Attendance Records</h2>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Morning In</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Morning Out</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Afternoon In</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Afternoon Out</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Worked Hours</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Status</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr v-for="record in attendanceRecords" :key="record._id" class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatDate(record.date) }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatTime(record.morningTimeIn) }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatTime(record.morningTimeOut) }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatTime(record.afternoonTimeIn) }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ formatTime(record.afternoonTimeOut) }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ record.workedHours ? record.workedHours.toFixed(2) : '0.00' }} hrs
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            <span :class="getStatusClass(getAttendanceStatus(record))">{{
                                                getAttendanceStatus(record) }}</span>
                                        </td>
                                    </tr>
                                    <tr v-if="!attendanceRecords.length">
                                        <td colspan="7" class="px-6 py-4 text-center text-gray-500">No records found
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-1">
                    <div v-if="employee && payrollData && employee.salary"
                        class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div class="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                            <h2 class="text-xl font-semibold text-gray-800">Payroll</h2>
                            <p class="text-sm text-gray-500">{{ currentPayPeriod }}</p>
                            <p class="text-sm text-gray-500">ID: {{ employee.empNo }}</p>
                        </div>
                        <div class="space-y-4">
                            <div>
                                <h3 class="text-sm font-medium text-gray-700 mb-2">Earnings</h3>
                                <div v-for="earning in payrollData.earnings" :key="earning.name"
                                    class="flex justify-between text-sm py-1">
                                    <span class="text-gray-600">{{ earning.name }}</span>
                                    <span class="text-gray-800">₱{{ earning.amount }}</span>
                                </div>
                                <div class="border-t border-gray-200 pt-2 flex justify-between font-semibold text-sm">
                                    <span>Total Earnings</span>
                                    <span>₱{{ payrollData.totalEarnings }}</span>
                                </div>
                            </div>
                            <div>
                                <h3 class="text-sm font-medium text-gray-700 mb-2">Deductions</h3>
                                <div v-for="deduction in payrollData.deductions" :key="deduction.name"
                                    class="flex justify-between text-sm py-1">
                                    <span class="text-gray-600">{{ deduction.name }}</span>
                                    <span class="text-gray-800">₱{{ deduction.amount }}</span>
                                </div>
                            </div>
                            <div>
                                <h3 class="text-sm font-medium text-gray-700 mb-2">Other Deductions</h3>
                                <div v-if="payrollData.otherDeductions.length > 0">
                                    <div v-for="deduction in payrollData.otherDeductions" :key="deduction.name"
                                        class="flex justify-between text-sm py-1">
                                        <span class="text-gray-600">{{ deduction.name }}</span>
                                        <span class="text-gray-800">₱{{ deduction.amount }}</span>
                                    </div>
                                </div>
                                <div v-else class="text-sm text-gray-600 py-1">
                                    None
                                </div>
                            </div>
                            <div class="border-t border-gray-200 pt-2 flex justify-between font-semibold text-sm">
                                <span>Total Deductions</span>
                                <span>₱{{ payrollData.totalDeductions }}</span>
                            </div>
                            <div class="border-t-2 border-dashed border-gray-300 pt-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-base font-semibold text-gray-800">Net Pay</span>
                                    <span class="text-lg font-bold text-blue-600">₱{{ payrollData.netSalary }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
                        {{ toast.message || 'Payroll data unavailable. Please contact HR.' }}
                    </div>
                </div>
            </div>
        </div>
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
