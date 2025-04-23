<template>
    <div class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div class="bg-white p-6 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold text-gray-800">Add Payheads to Employees</h2>
                <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700" title="Close Modal">
                    <span class="material-icons">close</span>
                </button>
            </div>

            <!-- Modal Content -->
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Container 1: Available Payheads -->
                    <div class="space-y-2">
                        <h3 class="text-lg font-semibold text-gray-800">Available Payheads</h3>
                        <div class="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-2">
                            <div v-if="payheads.length === 0" class="text-gray-500 text-sm text-center">
                                No payheads available
                            </div>
                            <div v-else v-for="payhead in payheads" :key="payhead.id"
                                class="flex items-center p-2 hover:bg-gray-50 rounded">
                                <input type="checkbox" :value="payhead" v-model="selectedPayheads"
                                    class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border border-gray-300 rounded" />
                                <label class="text-sm text-gray-700">
                                    {{ payhead.name }} ({{ payhead.type }},
                                    ₱{{ (payhead.amount || 0).toLocaleString() }}
                                    {{ payhead.isRecurring ? ', Recurring' : '' }})
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Container 2: Employees -->
                    <div class="space-y-2">
                        <h3 class="text-lg font-semibold text-gray-800">Employees</h3>
                        <div class="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-2">
                            <div v-if="employees.length === 0" class="text-gray-500 text-sm text-center">
                                No employees available
                            </div>
                            <div v-else v-for="employee in employees" :key="employee.id"
                                class="flex items-center p-2 hover:bg-gray-50 rounded">
                                <input type="checkbox" :value="employee" v-model="selectedEmployees"
                                    class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border border-gray-300 rounded" />
                                <label class="text-sm text-gray-700">
                                    {{ employee.name }} ({{ employee.position || 'N/A' }})
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="mt-6 flex justify-end gap-4">
                    <button @click="$emit('close')"
                        class="p-1.5 text-white bg-gray-500 rounded-lg hover:bg-gray-600 transition duration-200 transform hover:scale-105 flex items-center gap-1"
                        title="Cancel">
                        <span class="material-icons text-base">close</span>Cancel
                    </button>
                    <button @click="assignPayheads"
                        class="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 flex items-center gap-1"
                        :disabled="selectedPayheads.length === 0 || selectedEmployees.length === 0">
                        <span class="material-icons text-base">save</span>Assign Payheads
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'AddPayheadsToEmployeesModal',
    props: {
        payheads: {
            type: Array,
            required: true,
            default: () => [],
        },
        employees: {
            type: Array,
            required: true,
            default: () => [],
        },
    },
    data() {
        return {
            selectedPayheads: [],
            selectedEmployees: [],
        };
    },
    methods: {
        assignPayheads() {
            if (this.selectedPayheads.length === 0 || this.selectedEmployees.length === 0) {
                this.$emit('error', 'Please select at least one payhead and one employee.');
                return;
            }
            this.$emit('save', {
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