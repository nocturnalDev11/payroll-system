<script setup>
import Modal from '@/components/Modal.vue';
import axios from 'axios';
import { ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth.store.js';
import { BASE_API_URL } from '@/utils/constants.js';
import {
    calculateSSSContribution,
    calculatePhilHealthContribution,
    calculatePagIBIGContribution,
    calculateWithholdingTax,
    calculateNetSalary, // Replace calculateNewEmployeeNetSalary with this
} from '@/utils/calculations.js';

const props = defineProps(['show', 'request', 'positions']);
const emit = defineEmits(['close', 'save', 'approve', 'reject']);

const authStore = useAuthStore();
const isUpdating = ref(false);
const statusMessage = ref('');

// Define config for calculations
const config = {
    minimumWage: 610, // Adjust as needed
    deMinimisLimit: 10000,
    regularHolidays: [], // Populate if needed
    specialNonWorkingDays: [], // Populate if needed
};

// Reactive copy of the request to allow editing without mutating the prop directly
const localRequest = ref({});

// Sync localRequest with props.request when it changes
watch(() => props.request, (newRequest) => {
    localRequest.value = {
        ...newRequest,
        earnings: {
            travelExpenses: newRequest.earnings?.travelExpenses || 0,
            otherEarnings: newRequest.earnings?.otherEarnings || 0,
        },
        payheads: Array.isArray(newRequest.payheads) ? newRequest.payheads : [],
    };
}, { immediate: true });

// Update salary and hourly rate when position changes
const updateSalaryFromPosition = () => {
    const selectedPosition = props.positions.find(pos => pos.name === localRequest.value.position);
    if (selectedPosition) {
        localRequest.value.salary = selectedPosition.salary || 0;
        localRequest.value.hourlyRate = localRequest.value.salary / (8 * 22);
    }
};

// Update hourly rate when salary changes
watch(() => localRequest.value.salary, (newSalary) => {
    localRequest.value.hourlyRate = newSalary ? newSalary / (8 * 22) : 0;
});

const saveRequestChanges = async () => {
    const requiredFields = ['firstName', 'lastName', 'position', 'salary', 'email', 'contactInfo'];
    const missingFields = requiredFields.filter(field => {
        const value = localRequest.value[field];
        return value === undefined || value === null || (typeof value === 'string' && value.trim() === '') || (field === 'salary' && (typeof value !== 'number' || value < 0));
    });

    if (missingFields.length > 0) {
        statusMessage.value = `Missing or invalid required fields: ${missingFields.join(', ')}`;
        setTimeout(() => (statusMessage.value = ''), 3000);
        return;
    }

    isUpdating.value = true;
    try {
        const updatedRequest = { ...localRequest.value, hireDate: localRequest.value.hireDate };
        const response = await axios.put(
            `${BASE_API_URL}/api/employees/pending-requests/${localRequest.value._id}`,
            updatedRequest,
            {
                headers: {
                    Authorization: `Bearer ${authStore.accessToken}`,
                    'user-role': authStore.userRole,
                },
            }
        );

        if (response.status === 200) {
            emit('save', localRequest.value); // Emit the updated request
            statusMessage.value = 'Request updated successfully';
            setTimeout(() => (statusMessage.value = ''), 3000);
        }
    } catch (error) {
        console.error('Error saving request changes:', error);
        statusMessage.value = error.response?.data?.error || 'Failed to save request changes';
        setTimeout(() => (statusMessage.value = ''), 3000);
    } finally {
        isUpdating.value = false;
    }
};

const approveRequest = async () => {
    isUpdating.value = true;
    try {
        const updatedEmployee = {
            ...localRequest.value,
            status: 'approved',
            hireDate: new Date().toISOString().slice(0, 10),
            username: localRequest.value.username || `${localRequest.value.firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}`,
            empNo: localRequest.value.empNo || `EMP-${Date.now()}`,
            positionHistory: [{
                position: localRequest.value.position,
                salary: localRequest.value.salary,
                startDate: new Date().toISOString().slice(0, 10),
                endDate: null,
            }],
        };
        const response = await axios.put(
            `${BASE_API_URL}/api/employees/update/${localRequest.value._id}`,
            updatedEmployee,
            {
                headers: {
                    Authorization: `Bearer ${authStore.accessToken}`,
                    'user-role': authStore.userRole,
                },
            }
        );
        if (response.status === 200) {
            emit('approve', response.data.updatedEmployee); // Emit the approved employee
            statusMessage.value = 'Employee approved successfully';
            setTimeout(() => {
                statusMessage.value = '';
                emit('close');
            }, 3000);
        }
    } catch (error) {
        console.error('Error approving request:', error);
        statusMessage.value = 'Error approving employee';
        setTimeout(() => (statusMessage.value = ''), 3000);
    } finally {
        isUpdating.value = false;
    }
};

const rejectRequest = async () => {
    isUpdating.value = true;
    try {
        const response = await axios.put(
            `${BASE_API_URL}/api/employees/pending-requests/${localRequest.value._id}/reject`,
            { status: 'rejected' },
            {
                headers: {
                    Authorization: `Bearer ${authStore.accessToken}`,
                    'user-role': authStore.userRole,
                },
            }
        );
        if (response.status === 200) {
            emit('reject', localRequest.value._id); // Emit the rejected request ID
            statusMessage.value = 'Application rejected successfully';
            setTimeout(() => {
                statusMessage.value = '';
                emit('close');
            }, 3000);
        }
    } catch (error) {
        console.error('Error rejecting request:', error);
        statusMessage.value = 'Failed to reject application';
        setTimeout(() => (statusMessage.value = ''), 3000);
    } finally {
        isUpdating.value = false;
    }
};

// Helper functions for calculations with config
function getNetSalary(request) {
    return calculateNetSalary(request, config);
}

function getWithholdingTax(request) {
    return calculateWithholdingTax(request, config);
}
</script>

<template>
    <Modal :show="show" :max-width="'4xl'" :max-height="'80vh'" @close="$emit('close')">
        <!-- Modal Header -->
        <div class="p-4 border-b border-gray-300 flex justify-between items-center sticky top-0">
            <h2 class="text-lg font-semibold text-gray-800">
                Pending Request Details - {{ localRequest.firstName }} {{ localRequest.lastName }}
            </h2>
        </div>

        <!-- Modal Body -->
        <div class="flex-1 overflow-y-auto max-h-[65vh] p-4 space-y-6">
            <div class="space-y-4">
                <div>
                    <h3 class="text-base font-semibold text-gray-800 mb-2">Personal Information</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Employee Number *</label>
                            <input v-model="localRequest.empNo"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md bg-gray-100" readonly
                                required />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">First Name *</label>
                            <input v-model="localRequest.firstName"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                required />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Middle Name</label>
                            <input v-model="localRequest.middleName"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Last Name *</label>
                            <input v-model="localRequest.lastName"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                required />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Email *</label>
                            <input v-model="localRequest.email" type="email"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                required />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Contact Number *</label>
                            <input v-model="localRequest.contactInfo"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                required pattern="\d{11}" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Civil Status *</label>
                            <select v-model="localRequest.civilStatus"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                required>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Widowed">Widowed</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Username *</label>
                            <input v-model="localRequest.username"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                required />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Password *</label>
                            <input v-model="localRequest.password" type="password"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                required />
                        </div>
                    </div>
                </div>
                <div>
                    <h3 class="text-base font-semibold text-gray-800 mb-2">Employment Information</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Position *</label>
                            <select v-model="localRequest.position" @change="updateSalaryFromPosition"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                required>
                                <option v-for="position in positions" :key="position.name" :value="position.name">{{
                                    position.name }}</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Hire Date *</label>
                            <input v-model="localRequest.hireDate" type="date"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                required />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">SSS ID</label>
                            <input v-model="localRequest.sss"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                pattern="\d{10}" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">PhilHealth ID</label>
                            <input v-model="localRequest.philhealth"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                pattern="\d{12}" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Pag-IBIG ID</label>
                            <input v-model="localRequest.pagibig"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                pattern="\d{12}" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">TIN</label>
                            <input v-model="localRequest.tin"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                pattern="\d{9,12}" />
                        </div>
                    </div>
                </div>
                <div>
                    <h3 class="text-base font-semibold text-gray-800 mb-2">Financial Information</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Monthly Salary *</label>
                            <input v-model.number="localRequest.salary" type="number"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                required min="0" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Hourly Rate</label>
                            <input
                                :value="localRequest.hourlyRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })"
                                type="text" class="w-full p-1.5 text-sm border border-gray-300 rounded-md bg-gray-100"
                                disabled />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Travel Expenses</label>
                            <input v-model.number="localRequest.earnings.travelExpenses" type="number"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                min="0" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Other Earnings</label>
                            <input v-model.number="localRequest.earnings.otherEarnings" type="number"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                min="0" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">SSS Contribution</label>
                            <input
                                :value="calculateSSSContribution(localRequest.salary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md bg-gray-100" disabled />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">PhilHealth Contribution</label>
                            <input
                                :value="calculatePhilHealthContribution(localRequest.salary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md bg-gray-100" disabled />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Pag-IBIG Contribution</label>
                            <input
                                :value="calculatePagIBIGContribution(localRequest.salary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md bg-gray-100" disabled />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Withholding Tax</label>
                            <input
                                :value="getWithholdingTax(localRequest).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md bg-gray-100" disabled />
                        </div>
                    </div>
                </div>
                <div v-if="localRequest" class="mt-4 p-3 bg-gray-50 rounded-md">
                    <div class="flex justify-between items-center text-sm">
                        <span class="font-medium text-gray-700">Net Salary Preview:</span>
                        <span class="font-semibold text-gray-900">₱{{
                            getNetSalary(localRequest).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                            maximumFractionDigits: 2 }) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-4 border-t border-gray-300 bg-gray-50 flex justify-end gap-2">
            <button @click="saveRequestChanges"
                class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                :disabled="isUpdating">
                <span class="material-icons">save</span>
                <span class="hidden sm:block">{{ isUpdating ? 'Saving...' : 'Save Changes' }}</span>
            </button>

            <button @click="approveRequest"
                class="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                :disabled="isUpdating">
                <span class="material-icons">check_circle</span>
                <span class="hidden sm:block">{{ isUpdating ? 'Approving...' : 'Approve' }}</span>
            </button>

            <button @click="rejectRequest"
                class="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-800 transition-colors flex items-center gap-1"
                :disabled="isUpdating">
                <span class="material-icons">cancel</span>
                <span class="hidden sm:block">{{ isUpdating ? 'Rejecting...' : 'Reject' }}</span>
            </button>

            <button @click="$emit('close')" :disabled="isUpdating"
                class="px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-100">Close</button>
        </div>

        <!-- Status Toast -->
        <div v-if="statusMessage" :class="statusMessage.includes('successfully') ? 'bg-green-500' : 'bg-red-500'"
            class="fixed bottom-4 right-4 p-3 text-white text-sm rounded-md shadow-lg animate-fade-in">
            {{ statusMessage }}
        </div>
    </Modal>
</template>