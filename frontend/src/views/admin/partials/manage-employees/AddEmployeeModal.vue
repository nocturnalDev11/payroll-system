<script setup>
import Modal from '@/components/Modal.vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store.js';
import { BASE_API_URL } from '@/utils/constants.js';
import {
    calculateSSSContribution,
    calculatePhilHealthContribution,
    calculatePagIBIGContribution,
    calculateWithholdingTax,
    calculateNewEmployeeNetSalary
} from '@/utils/calculations.js';
import { ref, watch } from 'vue';

const { show, employee, positions } = defineProps({
    show: Boolean,
    employee: Object,
    positions: Array,
});
const emit = defineEmits(['close', 'add-success']);

const authStore = useAuthStore();
const isAdding = ref(false);

async function addEmployee() {
    const requiredFields = [
        'empNo', 'firstName', 'lastName', 'position', 'salary',
        'email', 'contactInfo', 'username', 'password'
    ];

    const missingFields = requiredFields.filter(field => {
        const value = employee[field];
        if (value === undefined || value === null) return true;
        if (['empNo', 'firstName', 'lastName', 'position', 'email', 'contactInfo', 'username', 'password'].includes(field)) {
            return typeof value !== 'string' || value.trim() === '';
        }
        if (field === 'salary') {
            return typeof value !== 'number' || value < 0;
        }
        return false;
    });

    if (missingFields.length > 0) {
        alert(`Missing or invalid required fields: ${missingFields.join(', ')}`);
        return;
    }

    isAdding.value = true;
    try {
        const employeeData = {
            ...employee,
            hourlyRate: employee.hourlyRate || (employee.salary / (8 * 22)),
            role: 'employee',
            civilStatus: employee.civilStatus || 'Single',
            hireDate: employee.hireDate || new Date().toISOString().slice(0, 10),
            positionHistory: [{
                position: employee.position,
                salary: employee.salary,
                startDate: employee.hireDate || new Date().toISOString().slice(0, 10),
                endDate: null,
            }],
            status: 'approved',
        };

        delete employeeData.id;

        const response = await axios.post(`${BASE_API_URL}/api/employees`, employeeData, {
            headers: {
                Authorization: `Bearer ${authStore.accessToken}`,
                'user-role': authStore.userRole,
            },
        });

        if (response.status === 201) {
            emit('add-success', {
                ...response.data,
                hourlyRate: response.data.hourlyRate || (response.data.salary / (8 * 22)),
            });
        }
    } catch (error) {
        console.error('Error adding employee:', error);
        alert(error.response?.data?.error || 'Failed to add employee');
    } finally {
        isAdding.value = false;
    }
}

function updateSalaryFromPosition() {
    const selectedPosition = positions.find(pos => pos.name === employee.position);
    if (selectedPosition) {
        employee.salary = selectedPosition.salary || 0;
        employee.hourlyRate = employee.salary / (8 * 22);
    }
}

watch(() => employee.salary, (newSalary) => {
    employee.hourlyRate = newSalary ? newSalary / (8 * 22) : 0;
});
</script>

<template>
    <Modal :show="show" @close="$emit('close')" max-width="4xl" max-height="85vh">
        <div class="flex flex-col h-full">
            <!-- Header -->
            <div
                class="p-4 border-b border-gray-300 flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
                <h2 class="text-xl font-bold text-gray-800">Add Employee</h2>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto max-h-[65vh] p-4 space-y-6">
                <div class="space-y-4">
                    <div>
                        <h3 class="text-base font-semibold text-gray-800 mb-2">Personal Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">Employee Number *</label>
                                <input v-model="employee.empNo"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                    required />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">First Name *</label>
                                <input v-model="employee.firstName"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                    required />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">Middle Name</label>
                                <input v-model="employee.middleName"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">Last Name *</label>
                                <input v-model="employee.lastName"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                    required />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">Email *</label>
                                <input v-model="employee.email" type="email"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                    required />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">Contact Number *</label>
                                <input v-model="employee.contactInfo"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                    required pattern="\d{11}" />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">Civil Status *</label>
                                <select v-model="employee.civilStatus"
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
                                <input v-model="employee.username"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                    required />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">Password *</label>
                                <input v-model="employee.password" type="password"
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
                                <select v-model="employee.position" @change="updateSalaryFromPosition"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                    required>
                                    <option v-for="position in positions" :key="position.name" :value="position.name">{{
                                        position.name }}</option>
                                </select>
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">Hire Date *</label>
                                <input v-model="employee.hireDate" type="date"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                    required />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">SSS ID</label>
                                <input v-model="employee.sss"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                    pattern="\d{10}" />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">PhilHealth ID</label>
                                <input v-model="employee.philhealth"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                    pattern="\d{12}" />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">Pag-IBIG ID</label>
                                <input v-model="employee.pagibig"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                    pattern="\d{12}" />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">TIN</label>
                                <input v-model="employee.tin"
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
                                <input v-model.number="employee.salary" type="number"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                    required min="0" />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">Hourly Rate</label>
                                <input :value="employee.hourlyRate.toLocaleString()" type="text"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md bg-gray-100"
                                    disabled />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">Travel Expenses</label>
                                <input v-model.number="employee.earnings.travelExpenses" type="number"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                    min="0" />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">Other Earnings</label>
                                <input v-model.number="employee.earnings.otherEarnings" type="number"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                    min="0" />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">SSS Contribution</label>
                                <input :value="calculateSSSContribution(employee.salary).toLocaleString()"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md bg-gray-100"
                                    disabled />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">PhilHealth Contribution</label>
                                <input :value="calculatePhilHealthContribution(employee.salary).toLocaleString()"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md bg-gray-100"
                                    disabled />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">Pag-IBIG Contribution</label>
                                <input :value="calculatePagIBIGContribution(employee.salary).toLocaleString()"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md bg-gray-100"
                                    disabled />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">Withholding Tax</label>
                                <input :value="calculateWithholdingTax(employee.salary).toLocaleString()"
                                    class="w-full p-1.5 text-sm border border-gray-300 rounded-md bg-gray-100"
                                    disabled />
                            </div>
                        </div>
                    </div>
                    <div v-if="employee" class="mt-4 p-3 bg-gray-50 rounded-md">
                        <div class="flex justify-between items-center text-sm">
                            <span class="font-medium text-gray-700">Net Salary Preview:</span>
                            <span class="font-semibold text-gray-900">₱{{
                                calculateNewEmployeeNetSalary(employee).toLocaleString() }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-gray-300 bg-gray-50 flex justify-end gap-2">
                <button @click="addEmployee" :disabled="isAdding"
                    class="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
                    {{ isAdding ? 'Adding...' : 'Add' }}
                </button>
                <button @click="$emit('close')"
                    class="px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
            </div>
        </div>
    </Modal>
</template>