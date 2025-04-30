<template>
    <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div class="flex items-center justify-between p-4 border-b border-gray-300">
                <h2 class="text-base font-medium text-gray-800 flex items-center gap-1">
                    <span class="material-icons text-sm">print</span>
                    Print Payslips
                </h2>
                <button @click="$emit('close')" class="p-1 hover:bg-gray-100 rounded-full">
                    <span class="material-icons text-sm">close</span>
                </button>
            </div>
            <div class="p-4 overflow-y-auto">
                <h3 class="text-sm font-medium text-gray-700 mb-2">Select Employees to Print</h3>
                <div v-if="employeesWithPayslips.length > 0" class="mb-4">
                    <label class="flex items-center">
                        <input type="checkbox" v-model="selectAll" @change="$emit('toggle-select-all')"
                            class="large-checkbox mr-2" />
                        <span class="text-sm text-gray-900 font-medium">Select All</span>
                    </label>
                </div>
                <div v-if="employeesWithPayslips.length > 0">
                    <div v-for="emp in employeesWithPayslips" :key="emp.id"
                        class="flex items-center py-2 border-b border-gray-300">
                        <input type="checkbox" v-model="selectedEmployeesForPrint" :value="emp.id"
                            class="large-checkbox mr-2" />
                        <span class="text-sm text-gray-900">{{ emp.name }} - Most Recent: {{ emp.latestPayslipDate
                            }}</span>
                    </div>
                </div>
                <div v-else class="text-sm text-gray-500 text-center py-4">
                    No employees with generated payslips found in history.
                </div>
            </div>
            <div class="p-4 border-t border-gray-300 flex justify-end gap-2">
                <button @click="$emit('close')"
                    class="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
                    Cancel
                </button>
                <button @click="$emit('print-selected-payslips')"
                    class="flex items-center gap-1 px-4 py-2 text-sm text-white bg-purple-500 rounded hover:bg-purple-600"
                    :disabled="selectedEmployeesForPrint.length === 0 || isPrinting">
                    <span class="material-icons text-sm">print</span>
                    {{ isPrinting ? 'Printing...' : 'Print Selected' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PrintAllModal',
    props: {
        show: {
            type: Boolean,
            required: true,
        },
        employeesWithPayslips: {
            type: Array,
            required: true,
        },
        selectedEmployeesForPrint: {
            type: Array,
            required: true,
        },
        isPrinting: {
            type: Boolean,
            required: true,
        },
        selectAll: {
            type: Boolean,
            required: true,
        },
    },
    emits: ['close', 'toggle-select-all', 'print-selected-payslips'],
};
</script>

<style scoped>
.large-checkbox {
    width: 1.25rem;
    height: 1.25rem;
}
</style>