<script setup>
import { ref, onMounted } from 'vue';
import { BASE_API_URL } from '@/utils/constants.js';
import ViewEmployeeDetails from './Partials/ViewEmployeeDetails.vue';
import EditEmployee from './Partials/EditEmployee.vue';
import DeleteEmployee from './Partials/DeleteEmployee.vue';
import RequestInfo from './Partials/RequestInfo.vue';

// State
const employees = ref([]);
const totalEmployees = ref(0);
const isLoading = ref(false);
const errorMessage = ref(null);
const successMessage = ref(null);
const pendingRequests = ref([]);
const selectedRequest = ref(null);
const showRequestModal = ref(false);
const isEditingRequest = ref(false);

// Predefined positions (example)
const adminPositions = ref(['Developer', 'Manager', 'HR', 'Accountant']);

// Fetch all employees (only approved ones)
const fetchAllEmployees = async () => {
    isLoading.value = true;
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to fetch employees');
        const allEmployees = await response.json();
        // Filter to only include approved employees and ensure payHeads are included
        employees.value = allEmployees
            .filter(emp => emp.status === 'approved')
            .map(emp => ({
                ...emp,
                payHeads: Array.isArray(emp.payHeads) ? emp.payHeads : [],
            }));
    } catch (error) {
        console.error('Failed to fetch employees:', error);
        showErrorMessage('Failed to load employees. Please try again.');
    } finally {
        isLoading.value = false;
    }
};

// Fetch total employees
const fetchTotalEmployees = async () => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/total`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to fetch total employees');
        totalEmployees.value = (await response.json()).total;
    } catch (error) {
        console.error('Failed to fetch total employees:', error);
        showErrorMessage('Failed to load total employees count.');
    }
};

// Refresh employees
const refreshEmployees = () => {
    fetchAllEmployees();
    fetchTotalEmployees();
};

// Calculate total earnings
const calculateTotalEarnings = (baseSalary, payHeads = []) => {
    const earnings = payHeads.filter(p => p && p.type === 'Earnings');
    const totalEarningsFromPayHeads = earnings.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return baseSalary + totalEarningsFromPayHeads;
};

// Calculate PhilHealth contribution
const calculatePhilHealthContribution = (salary) => {
    const monthlySalary = Math.max(salary || 0, 0);
    const minSalary = 10000;
    const maxSalary = 100000;
    const cappedSalary = Math.min(Math.max(monthlySalary, minSalary), maxSalary);
    return Math.round(cappedSalary * 0.025);
};

// Calculate Pag-IBIG contribution
const calculatePagIBIGContribution = (salary) => {
    const monthlySalary = Math.max(salary || 0, 0);
    const maxSalary = 5000;
    const cappedSalary = Math.min(monthlySalary, maxSalary);
    let rate = 0.02;
    if (cappedSalary <= 1500) {
        rate = 0.01;
    }
    return Math.round(cappedSalary * rate);
};

// Calculate total deductions
const calculateTotalDeductions = (baseSalary, payHeads = [], taxableIncome) => {
    const sssContribution = calculateSSSContribution(baseSalary);
    const philHealthContribution = calculatePhilHealthContribution(baseSalary);
    const pagIbigContribution = calculatePagIBIGContribution(baseSalary);
    const withholdingTax = calculateWithholdingTax(taxableIncome);
    const deductions = payHeads.filter(p => p && p.type === 'Deductions');
    const totalCustomDeductions = deductions.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return sssContribution + philHealthContribution + pagIbigContribution + withholdingTax + totalCustomDeductions;
};

// Calculate withholding tax
const calculateWithholdingTax = (taxableIncome) => {
    const income = taxableIncome || 0;
    if (income <= 20833) return 0;
    if (income <= 33333) return Math.round((income - 20833) * 0.15);
    if (income <= 66667) return Math.round(1875 + (income - 33333) * 0.20);
    if (income <= 166667) return Math.round(13541.80 + (income - 66667) * 0.25);
    if (income <= 666667) return Math.round(90841.80 + (income - 166667) * 0.30);
    return Math.round(408841.80 + (income - 666667) * 0.35);
};

// Calculate SSS contribution
const calculateSSSContribution = (salary) => {
    const monthlySalary = Math.max(salary || 0, 0);
    if (monthlySalary < 5000) return 250;

    const salaryCredit = Math.min(Math.max(monthlySalary, 5000), 35000);
    const regularSSContribution = Math.round(salaryCredit * 0.05);
    let mpfContribution = 0;

    if (salaryCredit > 20000) {
        const mpfBase = Math.min(salaryCredit, 35000) - 20000;
        mpfContribution = Math.round(mpfBase * 0.025);
    }

    let totalEmployeeContribution = regularSSContribution + mpfContribution;
    if (salaryCredit > 34750) {
        totalEmployeeContribution = 1750;
    }
    return totalEmployeeContribution;
};

// Calculate net salary
const calculateNetSalary = (employee) => {
    const baseSalary = employee.salary || 0;
    const payHeads = Array.isArray(employee.payHeads) ? employee.payHeads : [];

    const totalEarnings = calculateTotalEarnings(baseSalary, payHeads);
    const totalDeductions = calculateTotalDeductions(baseSalary, payHeads, totalEarnings);
    return totalEarnings - totalDeductions;
};

// Handle employee updates
const handleEmployeeUpdated = (updatedEmployee) => {
    const index = employees.value.findIndex(emp => emp._id === updatedEmployee._id);
    if (index !== -1) employees.value[index] = updatedEmployee;
};

// Handle employee deletion
const handleEmployeeDeleted = (id) => {
    employees.value = employees.value.filter(emp => emp._id !== id);
    totalEmployees.value--;
};

// Refresh pending requests
const refreshPendingRequests = async () => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/pending`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to fetch pending requests');
        pendingRequests.value = (await response.json()).map(employee => ({
            id: employee._id,
            name: `${employee.firstName} ${employee.lastName}`,
            positionApplied: employee.position,
            salary: employee.salary,
            email: employee.email,
            contactNumber: employee.contactInfo,
            deductions: employee.deductions,
            earnings: employee.earnings,
        }));
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        showErrorMessage('Failed to load pending requests');
    }
};

// Save request changes
const saveRequestChanges = async () => {
    if (!selectedRequest.value?.name || !selectedRequest.value?.email || !selectedRequest.value?.contactNumber) {
        showErrorMessage('Required fields are missing');
        return;
    }
    if (selectedRequest.value.salary < 0) {
        showErrorMessage('Salary cannot be negative');
        return;
    }

    try {
        const [firstName, ...lastNameParts] = selectedRequest.value.name.split(' ');
        const lastName = lastNameParts.join(' ');
        const updatedEmployee = {
            firstName,
            lastName,
            position: selectedRequest.value.positionApplied,
            salary: selectedRequest.value.salary,
            email: selectedRequest.value.email,
            contactInfo: selectedRequest.value.contactNumber,
            deductions: selectedRequest.value.deductions,
            earnings: selectedRequest.value.earnings,
            payHeads: selectedRequest.value.payHeads || [], // Include payHeads
        };
        const response = await fetch(`${BASE_API_URL}/api/employees/update/${selectedRequest.value.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedEmployee),
        });
        if (!response.ok) throw new Error('Failed to save changes');
        const data = await response.json();
        const index = pendingRequests.value.findIndex(req => req.id === selectedRequest.value.id);
        if (index !== -1) pendingRequests.value[index] = { ...selectedRequest.value, ...data.updatedEmployee };
        showSuccessMessage('Request updated successfully');
        isEditingRequest.value = false;
    } catch (error) {
        console.error('Error saving request changes:', error);
        showErrorMessage('Failed to save changes');
    }
};

// Approve request
const approveRequest = async (request) => {
    try {
        const updatedEmployee = {
            status: 'approved',
            hireDate: new Date(),
            username: request.username || `${request.name.split(' ')[0].toLowerCase()}${Math.floor(Math.random() * 1000)}`,
            employeeIdNumber: request.employeeIdNumber || `EMP-${Date.now()}`,
            payHeads: request.payHeads || [], // Include payHeads
        };
        const response = await fetch(`${BASE_API_URL}/api/employees/update/${request.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedEmployee),
        });
        if (!response.ok) throw new Error('Failed to approve employee');
        const data = await response.json();
        pendingRequests.value = pendingRequests.value.filter(req => req.id !== request.id);
        employees.value.push(data.updatedEmployee);
        showRequestModal.value = false;
        showSuccessMessage('Employee approved successfully');
    } catch (error) {
        console.error('Error approving request:', error);
        showErrorMessage('Error approving employee');
    }
};

// Reject request
const rejectRequest = async (id) => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/update/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected' }),
        });
        if (!response.ok) throw new Error('Failed to reject application');
        pendingRequests.value = pendingRequests.value.filter(req => req.id !== id);
        showRequestModal.value = false;
        showSuccessMessage('Application rejected successfully');
    } catch (error) {
        console.error('Error rejecting request:', error);
        showErrorMessage('Error rejecting application');
    }
};

// View request info
const viewRequestInfo = (request) => {
    selectedRequest.value = {
        id: request.id,
        name: request.name,
        positionApplied: request.positionApplied,
        salary: request.salary,
        email: request.email,
        contactNumber: request.contactNumber,
        deductions: { ...request.deductions },
        earnings: { ...request.earnings },
    };
    showRequestModal.value = true;
    isEditingRequest.value = false;
};

// Close modal
const closeRequestModal = () => {
    showRequestModal.value = false;
    isEditingRequest.value = false;
};

// Notification helpers
const showSuccessMessage = (msg) => {
    successMessage.value = msg;
    setTimeout(() => (successMessage.value = null), 3000);
};
const showErrorMessage = (msg) => {
    errorMessage.value = msg;
    setTimeout(() => (errorMessage.value = null), 3000);
};

// Lifecycle
onMounted(() => {
    fetchAllEmployees();
    fetchTotalEmployees();
    refreshPendingRequests();
});
</script>

<template>
    <div class="min-h-screen bg-gray-50 px-10 p-1">
        <div class="max-w-8xl flex gap-6">
            <!-- Left side - Employee List -->
            <div class="flex-1">
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="p-6 flex justify-between items-center">
                        <h2 class="text-xl font-bold text-gray-800">Employee List</h2>
                        <button @click="refreshEmployees"
                            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
                            :disabled="isLoading">
                            {{ isLoading ? 'Loading...' : 'Refresh' }}
                        </button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Employee ID</th>
                                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Name</th>
                                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Position</th>
                                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Hourly Rate</th>
                                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Total Salary</th>
                                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">TIN</th>
                                    <th class="px-6 py-4 text-right text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                <tr v-for="employee in employees" :key="employee._id"
                                    class="hover:bg-gray-50 transition duration-200">
                                    <td class="px-6 py-4 text-sm text-gray-900">{{ employee.employeeIdNumber || 'N/A' }}
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-900">
                                        {{ (employee.firstName || '') + ' ' + (employee.lastName || '') }}</td>
                                    <td class="px-6 py-4 text-sm text-gray-900">{{ employee.position || 'N/A' }}</td>
                                    <td class="px-6 py-4 text-sm text-gray-900">₱{{ (employee.hourlyRate ||
                                        0).toLocaleString() }}</td>
                                    <td class="px-6 py-4 text-sm text-gray-900">₱{{
                                        calculateNetSalary(employee).toLocaleString() }}</td>
                                    <td class="px-6 py-4 text-sm text-gray-900">{{ employee.tin || 'Not provided' }}
                                    </td>
                                    <td class="px-6 py-4 text-right flex justify-end gap-3">
                                        <ViewEmployeeDetails :employee="employee" />
                                        <EditEmployee :employee="employee" @employee-updated="handleEmployeeUpdated" />
                                        <DeleteEmployee :employee="employee"
                                            @employee-deleted="handleEmployeeDeleted" />
                                    </td>
                                </tr>
                                <tr v-if="employees.length === 0 && !isLoading">
                                    <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
                                        No employees found.
                                    </td>
                                </tr>
                                <tr v-if="isLoading">
                                    <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Right side - Pending Approvals -->
            <div class="w-96">
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 class="text-xl font-bold text-gray-800">Pending Approvals</h2>
                        <button @click="refreshPendingRequests"
                            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200">
                            Refresh
                        </button>
                    </div>
                    <div class="divide-y divide-gray-100">
                        <div v-for="request in pendingRequests" :key="request.id" class="p-4">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h3 class="text-sm font-medium text-gray-900">{{ request.name }} {{
                                        request.lastName }}</h3>
                                    <p class="text-sm text-gray-500">{{ request.positionApplied }}</p>
                                </div>
                                <span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                    Pending
                                </span>
                            </div>
                            <div class="flex gap-2">
                                <button @click="viewRequestInfo(request)"
                                    class="text-sm px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition duration-200">
                                    View Info
                                </button>
                                <button @click="approveRequest(request)"
                                    class="text-sm px-3 py-1 text-green-600 hover:bg-green-50 rounded-md transition duration-200">
                                    Approve
                                </button>
                                <button @click="rejectRequest(request.id)"
                                    class="text-sm px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition duration-200">
                                    Reject
                                </button>
                            </div>
                        </div>
                        <div v-if="pendingRequests.length === 0" class="p-4 text-center text-sm text-gray-500">
                            No pending approvals.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.transition-colors {
    transition: all 0.2s ease-in-out;
}
</style>