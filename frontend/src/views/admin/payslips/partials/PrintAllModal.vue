<template>
    <Modal :show="show" :max-width="'2xl'" :max-height="'80vh'" :closeable="true" @close="$emit('close')">
        <div class="flex flex-col h-full">
            <div class="flex items-center justify-between p-4 border-b border-gray-300">
                <h2 class="text-base font-medium text-gray-800 flex items-center gap-1">
                    <span class="material-icons text-sm">print</span>
                    Print Payslips
                </h2>
                <button @click="$emit('close')"
                    class="flex items-center p-1 hover:bg-gray-100 rounded-full cursor-pointer">
                    <span class="material-icons text-sm">close</span>
                </button>
            </div>
            <div class="p-4 overflow-y-auto flex-1">
                <h3 class="text-sm font-medium text-gray-700 mb-2">Select Employees to Print</h3>
                <div v-if="employeesWithPayslips.length > 0" class="mb-4">
                    <label class="flex items-center">
                        <input type="checkbox" :value="selectAll"
                            @change="$emit('update:selectAll', $event.target.checked); $emit('toggle-select-all')"
                            class="large-checkbox mr-2" />
                        <span class="text-sm text-gray-900 font-medium">Select All</span>
                    </label>
                </div>
                <div v-if="employeesWithPayslips.length > 0">
                    <div v-for="emp in employeesWithPayslips" :key="emp.id"
                        class="flex items-center py-2 border-b border-gray-300">
                        <input type="checkbox" :checked="selectedEmployeesForPrint.includes(emp.id)"
                            @change="updateSelectedEmployees(emp.id, $event.target.checked)"
                            class="large-checkbox mr-2" />
                        <span class="text-sm text-gray-900">{{ emp.name }} - Most Recent: {{ emp.latestPayslipDate
                            }}</span>
                    </div>
                </div>
                <div v-else class="text-sm text-gray-500 text-center py-4">
                    No employees with generated payslips found in history.
                </div>
            </div>
            <div class="p-4 border-t border-gray-300 flex justify-end gap-2 shrink-0">
                <button @click="$emit('close')"
                    class="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300 cursor-pointer">
                    Cancel
                </button>
                <button @click="$emit('print-selected-payslips')"
                    class="flex items-center gap-1 px-4 py-2 text-sm text-white bg-purple-500 rounded hover:bg-purple-600 cursor-pointer"
                    :disabled="selectedEmployeesForPrint.length === 0 || isPrinting">
                    <span class="material-icons text-sm">print</span>
                    {{ isPrinting ? 'Printing...' : 'Print Selected' }}
                </button>
            </div>
        </div>
    </Modal>
</template>

<script>
import Modal from '@/components/Modal.vue';

export default {
    name: 'PrintAllModal',
    components: {
        Modal,
    },
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
    emits: [
        'close',
        'toggle-select-all',
        'print-selected-payslips',
        'update:selectAll',
        'update:selectedEmployeesForPrint',
    ],
    methods: {
        updateSelectedEmployees(employeeId, isChecked) {
            let updatedSelection = [...this.selectedEmployeesForPrint];
            if (isChecked) {
                if (!updatedSelection.includes(employeeId)) {
                    updatedSelection.push(employeeId);
                }
            } else {
                updatedSelection = updatedSelection.filter((id) => id !== employeeId);
            }
            this.$emit('update:selectedEmployeesForPrint', updatedSelection);
        },
    },
};
</script>

<style scoped>
.large-checkbox {
    width: 1.25rem;
    height: 1.25rem;
}
</style>