<template>
    <div
        class="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50 transition-opacity duration-300">
        <div
            class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100 hover:scale-[1.01]">
            <div class="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
                <h2 class="text-2xl font-semibold text-gray-800 tracking-tight">Assign Recurring Deductions</h2>
                <button @click="$emit('close')"
                    class="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100">
                    <span class="material-icons-outlined text-xl">close</span>
                </button>
            </div>

            <div class="grid grid-cols-2 gap-6 relative">
                <!-- Vertical Line Separator -->
                <div class="absolute inset-y-0 left-1/2 -ml-3 h-full border-l border-gray-200"></div>

                <!-- Available Deductions -->
                <div class="space-y-4 relative z-10">
                    <h3 class="text-lg font-medium text-gray-700">Available Deductions</h3>
                    <div
                        class="space-y-3 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <div v-for="deduction in availableDeductions" :key="deduction.id"
                            class="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 cursor-pointer">
                            <input type="checkbox" :id="'deduction-' + deduction.id" v-model="selectedDeductions"
                                :value="deduction"
                                class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors duration-200" />
                            <label :for="'deduction-' + deduction.id" class="ml-3 text-sm font-medium text-gray-900">
                                {{ deduction.name }} <span class="text-gray-500">(₱{{ deduction.amount.toLocaleString()
                                    }})</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Available Employees -->
                <div class="space-y-4 relative z-10">
                    <h3 class="text-lg font-medium text-gray-700">Employees</h3>
                    <div
                        class="space-y-3 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <div v-for="employee in employees" :key="employee.id"
                            class="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 cursor-pointer">
                            <input type="checkbox" :id="'employee-' + employee.id" v-model="selectedEmployees"
                                :value="employee"
                                class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors duration-200" />
                            <label :for="'employee-' + employee.id" class="ml-3 text-sm font-medium text-gray-900">
                                {{ employee.name }} <span class="text-gray-500">({{ employee.position }})</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="mt-6 flex justify-end gap-4">
                <button @click="$emit('close')"
                    class="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200 shadow-sm">
                    Cancel
                </button>
                <button @click="$emit('save', selectedDeductions, selectedEmployees)"
                    class="py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-md disabled:opacity-50"
                    :disabled="selectedDeductions.length === 0 || selectedEmployees.length === 0">
                    Save Changes
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'RecurringDeductionModal',
    props: {
        availableDeductions: {
            type: Array,
            required: true,
        },
        employees: {
            type: Array,
            required: true,
        },
    },
    data() {
        return {
            selectedDeductions: [],
            selectedEmployees: [],
        };
    },
};
</script>

<style scoped>
/* Custom scrollbar styling */
.scrollbar-thin::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

/* Cross-browser scrollbar support */
.scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db #f1f1f1;
}

/* Animation for modal entrance */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Ensure smooth scaling */
.transform {
    transition: transform 0.3s ease-out;
}
</style>