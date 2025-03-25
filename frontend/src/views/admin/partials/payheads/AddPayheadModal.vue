<template>
    <div class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div class="bg-white p-6 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold text-gray-800">
                    {{ mode === 'bulkAssign' ? `Bulk Assign Payheads to Employees` : (isUpdate ? `Edit Payheads` : `Add
                    Payheads
                    for Employee`) }}
                </h2>
                <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700" title="Close Modal">
                    <span class="material-icons">close</span>
                </button>
            </div>

            <!-- Bulk Assign Mode -->
            <div v-if="mode === 'bulkAssign'" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Container 1: Available Payheads -->
                    <div class="space-y-2">
                        <h3 class="text-lg font-semibold text-gray-800">Available Payheads</h3>
                        <div class="max-h-64 overflow-y-auto border rounded-lg p-2">
                            <div v-if="availablePayheads.length === 0" class="text-gray-500 text-sm text-center">
                                No payheads available
                            </div>
                            <div v-else v-for="payhead in availablePayheads" :key="payhead.id"
                                class="flex items-center p-2 hover:bg-gray-50 rounded">
                                <input type="checkbox" :value="payhead" v-model="selectedPayheads"
                                    class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <label class="text-sm text-gray-700">
                                    {{ payhead.name }} ({{ payhead.type }}, ₱{{ (payhead.amount || 0).toLocaleString()
                                    }}{{
                                        payhead.isRecurring ? ', Recurring' : '' }})
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Container 2: Employees -->
                    <div class="space-y-2">
                        <h3 class="text-lg font-semibold text-gray-800">Employees</h3>
                        <div class="max-h-64 overflow-y-auto border rounded-lg p-2">
                            <div v-if="employees.length === 0" class="text-gray-500 text-sm text-center">
                                No employees available
                            </div>
                            <div v-else v-for="employee in employees" :key="employee.id"
                                class="flex items-center p-2 hover:bg-gray-50 rounded">
                                <input type="checkbox" :value="employee" v-model="selectedEmployees"
                                    class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <label class="text-sm text-gray-700">
                                    {{ employee.firstName }} {{ employee.lastName }} ({{ employee.position || 'N/A' }})
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions for Bulk Assign -->
                <div class="mt-6 flex justify-end gap-4">
                    <button @click="$emit('close')"
                        class="p-1.5 text-gray-700 hover:text-gray-900 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200 transform hover:scale-105 flex items-center gap-1"
                        title="Cancel">
                        <span class="material-icons text-base">close</span>Cancel
                    </button>
                    <button @click="bulkAssignPayheads"
                        class="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 flex items-center gap-1"
                        :disabled="selectedPayheads.length === 0 || selectedEmployees.length === 0">
                        <span class="material-icons text-base">save</span>Assign Payheads
                    </button>
                </div>
            </div>

            <!-- Default Mode (Add/Edit Payheads for a Single Employee) -->
            <div v-else class="space-y-4">
                <!-- Selected Employee Info -->
                <div class="bg-gray-100 p-4 rounded-lg">
                    <p class="text-sm text-gray-700">
                        Employee: {{ selectedEmployee.name || selectedEmployee.firstName + ' ' +
                            selectedEmployee.lastName || 'N/A'
                        }}
                    </p>
                    <p class="text-sm text-gray-700">
                        Base Salary: ₱{{ (selectedEmployee.salary || 0).toLocaleString() }}
                    </p>
                    <p class="text-sm text-gray-700">
                        Total Payable Salary: ₱{{ (totalPayableSalary || 0).toLocaleString() }}
                    </p>
                </div>

                <!-- Available Payheads -->
                <div class="space-y-2" v-if="!isUpdate">
                    <h3 class="text-lg font-semibold text-gray-800">Available Payheads</h3>
                    <select v-model="selectedPayhead"
                        class="block w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        :disabled="isUpdate">
                        <option value="" disabled>Select a Payhead</option>
                        <option v-for="payhead in availablePayheads" :key="payhead.id" :value="payhead">
                            {{ payhead.name }} ({{ payhead.type }}, ₱{{ (payhead.amount || 0).toLocaleString() }}{{
                                payhead.isRecurring ? ', Recurring' : '' }})
                        </option>
                    </select>
                    <button @click="addPayhead"
                        class="mt-2 p-1.5 text-gray-700 hover:text-blue-600 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 transform hover:scale-105 flex items-center gap-1"
                        :disabled="!selectedPayhead || isUpdate" title="Add Payhead">
                        <span class="material-icons text-base">add</span>Add
                    </button>
                </div>

                <!-- Selected Payheads -->
                <div class="space-y-2">
                    <h3 class="text-lg font-semibold text-gray-800">Selected Payheads</h3>
                    <div v-for="(payhead) in selectedEmployeePayheads" :key="payhead.uniqueId"
                        class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span>{{ payhead.name }} ({{ payhead.type }}, ₱{{ (payhead.amount || 0).toLocaleString() }}{{
                            payhead.isRecurring ? ', Recurring' : '' }})</span>
                        <div>
                            <input v-model.number="payhead.amount" type="number"
                                class="w-24 p-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                @change="updatePayhead(payhead)" min="0" :disabled="isUpdate" />
                            <button @click="removePayhead(payhead)" class="ml-2 p-1 text-red-500 hover:text-red-700"
                                :disabled="isUpdate" title="Remove Payhead">
                                <span class="material-icons">delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="!mode || mode !== 'bulkAssign'" class="mt-6 flex justify-end gap-4">
                <button @click="$emit('close')"
                    class="p-1.5 text-gray-700 hover:text-gray-900 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200 transform hover:scale-105 flex items-center gap-1"
                    title="Cancel">
                    <span class="material-icons text-base">close</span>Close
                </button>
                <button @click="$emit('save')"
                    class="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 flex items-center gap-1"
                    :disabled="isUpdate">
                    <span class="material-icons text-base">{{ isUpdate ? 'edit' : 'save' }}</span>
                    {{ isUpdate ? 'Update Payheads' : 'Save Payheads' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'AddPayheadModal',
    props: {
        availablePayheads: {
            type: Array,
            required: true,
        },
        selectedEmployeePayheads: {
            type: Array,
            default: () => [],
        },
        totalPayableSalary: {
            type: Number,
            default: 0,
        },
        selectedEmployee: {
            type: Object,
            default: () => ({}),
        },
        isUpdate: {
            type: Boolean,
            default: false,
        },
        mode: {
            type: String,
            default: '', // Can be 'bulkAssign' or empty for default mode
        },
        employees: {
            type: Array,
            default: () => [], // List of employees for bulk assignment
        },
    },
    data() {
        return {
            selectedPayhead: null,
            selectedPayheads: [], // For bulk assignment
            selectedEmployees: [], // For bulk assignment
        };
    },
    methods: {
        addPayhead() {
            if (this.selectedPayhead) {
                this.$emit('addPayhead', { ...this.selectedPayhead, uniqueId: Date.now() + Math.random() });
                this.selectedPayhead = null;
            }
        },
        removePayhead(payhead) {
            this.$emit('removePayhead', payhead);
        },
        updatePayhead(payhead) {
            this.$emit('updatePayhead', payhead);
        },
        bulkAssignPayheads() {
            if (this.selectedPayheads.length === 0 || this.selectedEmployees.length === 0) {
                this.$emit('error', 'Please select at least one payhead and one employee.');
                return;
            }
            this.$emit('bulkAssign', {
                payheads: this.selectedPayheads,
                employees: this.selectedEmployees,
            });
            this.selectedPayheads = [];
            this.selectedEmployees = [];
        },
    },
};
</script>

<style scoped>
.transition-all {
    transition: all 0.2s ease-in-out;
}

.hover\:bg-gray-50:hover {
    background-color: #f9fafb;
}
</style>