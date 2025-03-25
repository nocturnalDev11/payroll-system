<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';

const authStore = useAuthStore();
const router = useRouter();
const token = localStorage.getItem('token');
const employee = ref(null);
const attendanceRecords = ref([]);
const isTimedIn = ref(false);
const isLoading = ref(false);
const currentPayPeriod = ref('Mar 16 - Mar 31, 2025');

// Time constants
const OFFICE_START = '08:00:00';
const OFFICE_END = '17:00:00';
const EARLY_TIME_IN_THRESHOLD = '06:00:00';
const EARLY_TIME_OUT_THRESHOLD = '11:30:00';

// Configuration defaults (could be fetched from backend if needed)
const config = {
    minimumWage: 610,
    deMinimisLimit: 10000,
    regularHolidays: ['03/31/2025'], // Example for March 2025, adjust as needed
    specialNonWorkingDays: [],
};

onMounted(async () => {
    if (!token || !authStore.isAuthenticated) {
        router.push('/employee/login');
        return;
    }

    await getEmployeeProfile();
    if (authStore.employee?._id) {
        await Promise.all([
            fetchAttendanceRecords(),
            checkTimedInStatus(),
            fetchSalaryDetails(),
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
        employee.value = employeeData;
        authStore.setEmployee(employeeData);
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

async function fetchSalaryDetails() {
    try {
        const employeeId = authStore.employee?._id;
        if (!employeeId) return;

        const response = await fetch(
            `${BASE_API_URL}/api/employees/${employeeId}/salary?month=2025-03`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'user-role': authStore.userRole,
                    'user-id': employeeId,
                },
            }
        );
        if (!response.ok) throw new Error(await response.text());
        const salaryData = await response.json();
        employee.value = { ...employee.value, ...salaryData };
    } catch (error) {
        console.error('Error fetching salary:', error);
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
    }
}

async function checkTimedInStatus() {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceRecords.value.filter(
        (record) => new Date(record.date).toISOString().split('T')[0] === today
    );
    const latestRecord = todayRecords[todayRecords.length - 1];
    isTimedIn.value = latestRecord && latestRecord.timeIn && !latestRecord.timeOut;
}

async function timeIn() {
    if (!canTimeIn()) {
        alert('Time In is only allowed after 6:00 AM.');
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
            body: JSON.stringify({ employeeId }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        attendanceRecords.value.push(data);
        await checkTimedInStatus();
    } catch (error) {
        alert(error.message || 'Failed to time in');
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
            body: JSON.stringify({ employeeId }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        const index = attendanceRecords.value.findIndex((r) => r._id === data._id);
        if (index !== -1) attendanceRecords.value[index] = data;
        await checkTimedInStatus();
    } catch (error) {
        alert(error.message || 'Failed to time out');
    } finally {
        isLoading.value = false;
    }
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

const formatNumber = (value) => {
    return Number(value || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

// Comprehensive Salary Calculations
const calculateTotalEarnings = () => {
    if (!employee.value) return 0;
    const baseEarnings =
        (employee.value.earnings?.travelExpenses || 0) +
        (employee.value.earnings?.otherEarnings || 0);
    const monthlySalary = employee.value.salary || 0;
    const holidayPay = calculateHolidayPay();
    const overtimePay = calculateOvertimePay();
    const payheadEarnings = calculatePayheadEarnings(employee.value.payheads || []);
    const taxableSupplementary = calculateSupplementaryIncome()?.taxable || 0;
    return (
        monthlySalary +
        baseEarnings +
        holidayPay +
        overtimePay +
        payheadEarnings +
        taxableSupplementary
    );
};

const calculatePayheadEarnings = (payheads) => {
    if (!Array.isArray(payheads)) return 0;
    return payheads
        .filter((p) => p.type === 'Earnings')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
};

const calculatePayheadDeductions = (payheads) => {
    if (!Array.isArray(payheads)) return 0;
    return payheads
        .filter((p) => p.type === 'Deductions')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
};

const calculateSupplementaryIncome = () => {
    if (!employee.value) return { taxable: 0, nonTaxable: 0, totalSupplementary: 0 };
    const commission = employee.value.commission || 0;
    const profitSharing = employee.value.profitSharing || 0;
    const fees = employee.value.fees || 0;
    const thirteenthMonthPay = employee.value.thirteenthMonthPay || 0;
    const hazardPay = employee.value.hazardPay || 0;
    const overtimePay = calculateOvertimePay() || 0;
    const otherTaxable = employee.value.otherTaxable || 0;

    const totalSupplementary =
        commission +
        profitSharing +
        fees +
        thirteenthMonthPay +
        hazardPay +
        overtimePay +
        otherTaxable;
    const exemptThirteenthMonth = Math.min(thirteenthMonthPay, 90000);
    const taxableThirteenthMonth = Math.max(0, thirteenthMonthPay - 90000);

    const taxableSupplementaryIncome =
        commission +
        profitSharing +
        fees +
        taxableThirteenthMonth +
        hazardPay +
        overtimePay +
        otherTaxable;

    return {
        taxable: taxableSupplementaryIncome,
        nonTaxable: exemptThirteenthMonth,
        totalSupplementary,
    };
};

const calculateNonTaxableIncome = () => {
    if (!employee.value) return { totalNonTaxable: 0 };
    const isMWE = (employee.value.salary / 30) <= config.minimumWage;
    const basicSalaryMWE = isMWE ? employee.value.salary : 0;
    const holidayPayMWE = isMWE ? calculateHolidayPay() : 0;
    const overtimePayMWE = isMWE ? calculateOvertimePay() : 0;
    const nightShiftDiffMWE = isMWE ? (employee.value.nightShiftDiff || 0) : 0;
    const hazardPayMWE = isMWE ? (employee.value.hazardPay || 0) : 0;
    const thirteenthMonthExempt = Math.min(employee.value.thirteenthMonthPay || 0, 90000);
    const deMinimis = Math.min(employee.value.deMinimis || 0, config.deMinimisLimit);
    const sssContribution = calculateSSSContribution(employee.value.salary);
    const philhealthContribution = calculatePhilHealthContribution(employee.value.salary);
    const pagibigContribution = calculatePagIBIGContribution(employee.value.salary);

    return {
        totalNonTaxable:
            basicSalaryMWE +
            holidayPayMWE +
            overtimePayMWE +
            nightShiftDiffMWE +
            hazardPayMWE +
            thirteenthMonthExempt +
            deMinimis +
            sssContribution +
            philhealthContribution +
            pagibigContribution,
    };
};

const calculateTotalDeductions = () => {
    if (!employee.value) return 0;
    const sssContribution = calculateSSSContribution(employee.value.salary);
    const philhealthContribution = calculatePhilHealthContribution(employee.value.salary);
    const pagibigContribution = calculatePagIBIGContribution(employee.value.salary);
    const withholdingTax = calculateWithholdingTax();
    const payheadDeductions = calculatePayheadDeductions(employee.value.payheads || []);

    return (
        sssContribution +
        philhealthContribution +
        pagibigContribution +
        withholdingTax +
        payheadDeductions
    );
};

const calculateNetSalary = () => {
    if (!employee.value) return 0;
    const totalEarnings = calculateTotalEarnings();
    const totalDeductions = calculateTotalDeductions();
    return totalEarnings - totalDeductions;
};

const calculateHolidayPay = () => {
    if (!employee.value) return 0;
    const dailyRate = employee.value.salary / 30;
    const salaryMonth = '2025-03'; // Hardcoded for current pay period
    const isRegularHoliday = config.regularHolidays.some(
        (holiday) => holiday.split('/')[0].padStart(2, '0') + '/' + holiday.split('/')[1].padStart(2, '0') + '/' + holiday.split('/')[2] === salaryMonth.split('-')[1] + '/??/2025'
    );
    const isSpecialHoliday = config.specialNonWorkingDays.some(
        (holiday) => holiday.split('/')[0].padStart(2, '0') + '/' + holiday.split('/')[1].padStart(2, '0') + '/' + holiday.split('/')[2] === salaryMonth.split('-')[1] + '/??/2025'
    );
    if (isRegularHoliday) return dailyRate * 2;
    if (isSpecialHoliday) return dailyRate * 1.3;
    return 0;
};

const calculateOvertimePay = () => {
    if (!employee.value) return 0;
    const hourlyRate = employee.value.salary / (8 * 22);
    const regularOTHours = employee.value.overtimeHours?.regular || 0;
    const holidayOTHours = employee.value.overtimeHours?.holiday || 0;
    const regularOTPay = regularOTHours * hourlyRate * 1.25;
    const holidayOTPay = holidayOTHours * hourlyRate * 1.3;
    return regularOTPay + holidayOTPay;
};

const calculateSSSContribution = (salary) => {
    const monthlySalaryCredit = Math.min(Math.max(salary || 0, 5000), 35000);
    const employeeShareRate = 0.045;
    return Math.round(monthlySalaryCredit * employeeShareRate);
};

const calculatePhilHealthContribution = (salary) => {
    const rate = 0.05;
    const monthlySalary = Math.min(salary || 0, 100000);
    return Math.round((monthlySalary * rate) / 2);
};

const calculatePagIBIGContribution = (salary) => {
    const rate = 0.02;
    const cappedSalary = Math.min(salary || 0, 10000);
    return Math.round(cappedSalary * rate);
};

const calculateWithholdingTax = () => {
    if (!employee.value) return 0;
    const nonTaxable = calculateNonTaxableIncome().totalNonTaxable;
    const taxableIncome = calculateTotalEarnings() - nonTaxable;
    if (taxableIncome <= 20833) return 0;
    if (taxableIncome <= 33333) return Math.round((taxableIncome - 20833) * 0.15);
    if (taxableIncome <= 66667) return Math.round(1875 + (taxableIncome - 33333) * 0.20);
    if (taxableIncome <= 166667) return Math.round(13541.80 + (taxableIncome - 66667) * 0.25);
    if (taxableIncome <= 666667) return Math.round(90841.80 + (taxableIncome - 166667) * 0.30);
    return Math.round(408841.80 + (taxableIncome - 666667) * 0.35);
};

// Computed Properties for Display
const earningsBreakdown = computed(() => {
    if (!employee.value) return [];
    return [
        { name: 'Basic Salary', amount: formatNumber(employee.value.salary) },
        { name: 'Travel Expenses', amount: formatNumber(employee.value.earnings?.travelExpenses) },
        { name: 'Other Earnings', amount: formatNumber(employee.value.earnings?.otherEarnings) },
        { name: 'Holiday Pay', amount: formatNumber(calculateHolidayPay()) },
        { name: 'Overtime Pay', amount: formatNumber(calculateOvertimePay()) },
        { name: 'Supplementary Income', amount: formatNumber(calculateSupplementaryIncome()?.taxable) },
        ...(employee.value.payheads || [])
            .filter((p) => p.type === 'Earnings')
            .map((p) => ({ name: p.name, amount: formatNumber(p.amount) })),
    ].filter((e) => e.amount !== '0.00');
});

const deductionsBreakdown = computed(() => {
    if (!employee.value) return [];
    return [
        { name: 'SSS', amount: formatNumber(calculateSSSContribution(employee.value.salary)) },
        { name: 'PhilHealth', amount: formatNumber(calculatePhilHealthContribution(employee.value.salary)) },
        { name: 'Pag-IBIG', amount: formatNumber(calculatePagIBIGContribution(employee.value.salary)) },
        { name: 'Withholding Tax', amount: formatNumber(calculateWithholdingTax()) },
        ...(employee.value.payheads || [])
            .filter((p) => p.type === 'Deductions')
            .map((p) => ({ name: p.name, amount: formatNumber(p.amount) })),
    ].filter((d) => d.amount !== '0.00');
});

const totalEarnings = computed(() => formatNumber(calculateTotalEarnings()));
const totalDeductions = computed(() => formatNumber(calculateTotalDeductions()));
const netSalary = computed(() => formatNumber(calculateNetSalary()));

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
        'On Time': 'text-green-600',
        'Late': 'text-yellow-600',
        'Absent': 'text-red-600',
        'Early Departure': 'text-orange-600',
    }[status] || 'text-gray-600';
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div class="p-4">
            <div v-if="employee" class="mb-6 bg-white rounded-xl border-l-4 border-l-green-600 shadow-sm p-6">
                <div class="flex items-center space-x-4">
                    <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-blue-600 font-semibold text-lg">{{ employeeInitials }}</span>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-gray-800">{{ `${employee.firstName} ${employee.lastName}` }}
                        </h1>
                        <p class="text-sm text-gray-500">ID: {{ employee.empNo }} | {{ employee.position }}</p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div class="lg:col-span-3 space-y-6">
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <div class="flex justify-between items-center">
                            <div class="text-sm text-gray-500">Current Pay Period: {{ currentPayPeriod }}</div>
                            <div class="flex space-x-3">
                                <button @click="timeIn" :disabled="isTimedIn || isLoading || !canTimeIn()"
                                    class="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                    {{ isLoading && !isTimedIn ? 'Processing...' : 'Time In' }}
                                </button>
                                <button @click="timeOut" :disabled="!isTimedIn || isLoading || !canTimeOut()"
                                    class="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                    {{ isLoading && isTimedIn ? 'Processing...' : 'Time Out' }}
                                </button>
                            </div>
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
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time
                                            In</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time
                                            Out</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Status</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr v-for="record in attendanceRecords" :key="record._id" class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{
                                            formatDate(record.date) }}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{
                                            formatTime(record.timeIn) }}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{
                                            formatTime(record.timeOut) }}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            <span :class="getStatusClass(record.status)">{{ record.status }}</span>
                                        </td>
                                    </tr>
                                    <tr v-if="!attendanceRecords.length">
                                        <td colspan="4" class="px-6 py-4 text-center text-gray-500">No records found
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-1">
                    <div v-if="employee" class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div class="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                            <h2 class="text-xl font-semibold text-gray-800">Payroll</h2>
                            <p class="text-sm text-gray-500">{{ currentPayPeriod }}</p>
                            <p class="text-sm text-gray-500">ID: {{ employee.empNo }}</p>
                        </div>
                        <div class="space-y-4">
                            <div>
                                <h3 class="text-sm font-medium text-gray-700 mb-2">Earnings</h3>
                                <div v-for="earning in earningsBreakdown" :key="earning.name"
                                    class="flex justify-between text-sm py-1">
                                    <span class="text-gray-600">{{ earning.name }}</span>
                                    <span class="text-gray-800">₱{{ earning.amount }}</span>
                                </div>
                                <div class="border-t border-gray-200 pt-2 flex justify-between font-semibold text-sm">
                                    <span>Total Earnings</span>
                                    <span>₱{{ totalEarnings }}</span>
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
                                    <span>₱{{ totalDeductions }}</span>
                                </div>
                            </div>
                            <div class="border-t-2 border-dashed border-gray-300 pt-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-base font-semibold text-gray-800">Net Pay</span>
                                    <span class="text-lg font-bold text-blue-600">₱{{ netSalary }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-else class="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
                        Loading payroll data...
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>