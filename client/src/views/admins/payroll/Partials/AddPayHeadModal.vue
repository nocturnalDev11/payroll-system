<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

defineProps<{
    availablePayheads: PayHead[];
    selectedEmployeePayheads: PayHead[];
    totalPayableSalary: number;
    selectedEmployee: Employee;
}>();

defineEmits<{
    (e: 'close'): void;
    (e: 'save'): void;
    (e: 'add-payhead', payhead: PayHead): void;
    (e: 'remove-payhead', payhead: PayHead & { uniqueId: string }): void;
    (e: 'update-payhead', payhead: PayHead & { uniqueId: string }): void;
}>();

interface PayHead {
    id: string;
    name: string;
    amount: number | string;
    type: 'Earnings' | 'Deductions';
    description?: string;
}

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    position: string;
    salary: number;
    payheads: PayHead[];
    totalEarnings: number;
    totalDeduction: number;
    totalSalary: number;
    employeeIdNumber?: string;
}
</script>

<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white p-6 rounded-xl shadow-md max-w-md w-full">
            <h2 class="text-xl font-bold mb-4">Manage Payheads for {{ selectedEmployee ? selectedEmployee.name : 'Employee' }}</h2>

            <!-- Selected Payheads -->
            <div class="mb-4">
                <label class="block text-gray-700 mb-1 font-medium text-sm">Assigned Payheads</label>
                <div class="space-y-2">
                    <div v-if="selectedEmployeePayheads.length === 0" class="text-gray-500">No payheads assigned.</div>
                    <div v-for="payhead in selectedEmployeePayheads" :key="payhead.uniqueId"
                        class="flex items-center gap-2 p-2 border border-gray-200 rounded-lg">
                        <input v-model="payhead.name" class="w-1/3 p-1 border rounded-lg text-sm" placeholder="Name" />
                        <input v-model.number="payhead.amount" type="number" class="w-1/4 p-1 border rounded-lg text-sm"
                            placeholder="Amount" min="0" @change="$emit('update-payhead', payhead)" />
                        <select v-model="payhead.type" class="w-1/4 p-1 border rounded-lg text-sm"
                            @change="$emit('update-payhead', payhead)">
                            <option value="Earnings">Earnings</option>
                            <option value="Deductions">Deductions</option>
                        </select>
                        <button @click="$emit('remove-payhead', payhead)"
                            class="bg-red-50 text-red-600 font-semibold py-1 px-2 rounded-lg hover:bg-red-100 transition-all duration-200 text-xs">X</button>
                    </div>
                </div>
            </div>

            <!-- Available Payheads -->
            <div class="mb-4">
                <label class="block text-gray-700 mb-1 font-medium text-sm">Available Payheads</label>
                <div class="space-y-2">
                    <div v-if="availablePayheads.length === 0" class="text-gray-500">No available payheads.</div>
                    <div v-for="payhead in availablePayheads" :key="payhead.id"
                        class="flex justify-between items-center p-2 border border-gray-200 rounded-lg">
                        <span>{{ payhead.name }} ({{ payhead.type }}) - ₱{{ Number(payhead.amount).toLocaleString() }}</span>
                        <button @click="$emit('add-payhead', payhead)"
                            class="bg-green-50 text-green-600 font-semibold py-1 px-2 rounded-lg hover:bg-green-100 transition-all duration-200 text-xs">Add</button>
                    </div>
                </div>
            </div>

            <!-- Total Payable Salary -->
            <div class="mb-4">
                <label class="block text-gray-700 mb-1 font-medium text-sm">Total Payable Salary</label>
                <div class="p-2 border border-gray-200 rounded-lg">
                    <span>₱{{ totalPayableSalary.toLocaleString() }}</span>
                </div>
            </div>

            <!-- Buttons -->
            <div class="flex justify-end gap-3">
                <button type="button" @click="$emit('close')"
                    class="py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200">Cancel</button>
                <button type="button" @click="$emit('save')"
                    class="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200">Save</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.transition-all {
    transition: all 0.2s ease-in-out;
}
</style>