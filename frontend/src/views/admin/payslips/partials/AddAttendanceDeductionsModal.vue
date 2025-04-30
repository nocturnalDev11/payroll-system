<template>
    <div v-if="show" class="fixed inset-0 bg-gray-600/50 bg-opacity-50 flex items-center justify-center z-[1000]">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div class="flex items-center justify-between p-4 border-b border-gray-300">
                <h2 class="text-base font-medium text-gray-800 flex items-center gap-1">
                    <span class="material-icons text-sm">money_off</span>
                    Add Attendance-Affected Deductions
                </h2>
                <button @click="cancel" class="flex items-center p-1 hover:bg-gray-100 rounded-full cursor-pointer">
                    <span class="material-icons text-sm">close</span>
                </button>
            </div>
            <div class="p-4 overflow-y-auto">
                <!-- Updated: Show fallback message if no employees -->
                <div v-if="employees.length === 0" class="text-sm text-gray-500 text-center py-4">
                    No employees available. Please add employees to assign deductions.
                </div>
                <div v-else>
                    <h3 class="text-sm font-medium text-gray-700 mb-2">Select Employees</h3>
                    <div class="mb-4">
                        <label class="flex items-center">
                            <input type="checkbox" v-model="selectAllEmployees" @change="toggleSelectAllEmployees"
                                class="large-checkbox mr-2 border" />
                            <span class="text-sm text-gray-900 font-medium">Select All Employees</span>
                        </label>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        <div v-for="emp in employees" :key="emp.id" class="flex items-center">
                            <input type="checkbox" v-model="selectedEmployees" :value="emp.id"
                                class="large-checkbox mr-2" />
                            <span class="text-sm text-gray-900">{{ emp.name }}</span>
                        </div>
                    </div>
                </div>

                <!-- Updated: Show fallback message if no deductions -->
                <div v-if="deductions.length === 0" class="text-sm text-gray-500 text-center py-4">
                    No attendance-affected deductions available. Please add deductions to proceed.
                </div>
                <div v-else>
                    <h3 class="text-sm font-medium text-gray-700 mb-2">Select Deductions</h3>
                    <div class="mb-4">
                        <label class="flex items-center">
                            <input type="checkbox" v-model="selectAllDeductions" @change="toggleSelectAllDeductions"
                                class="large-checkbox mr-2" />
                            <span class="text-sm text-gray-900 font-medium">Select All Deductions</span>
                        </label>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div v-for="ded in deductions" :key="ded.id" class="flex items-center">
                            <input type="checkbox" v-model="selectedDeductions" :value="ded.id"
                                class="large-checkbox mr-2" />
                            <span class="text-sm text-gray-900">{{ ded.name }} (₱{{ ded.amount.toLocaleString()
                                }})</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-4 border-t border-gray-300 flex justify-end gap-2">
                <button @click="cancel" class="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
                    Cancel
                </button>
                <button @click="save"
                    class="flex items-center gap-1 px-4 py-2 text-sm text-white bg-teal-500 rounded hover:bg-teal-600"
                    :disabled="selectedEmployees.length === 0 || selectedDeductions.length === 0 || isLoading">
                    <span class="material-icons text-sm">save</span>
                    Save
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'AddAttendanceDeductionsModal',
    props: {
        show: {
            type: Boolean,
            required: true
        },
        employees: {
            type: Array,
            default: () => []
        },
        deductions: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            selectedEmployees: [],
            selectedDeductions: [],
            selectAllEmployees: false,
            selectAllDeductions: false,
            isLoading: false
        };
    },
    watch: {
        employees(newEmployees) {
            this.selectedEmployees = [];
            this.selectAllEmployees = false;
        },
        deductions(newDeductions) {
            this.selectedDeductions = [];
            this.selectAllDeductions = false;
        }
    },
    created() {
        // Updated: Debug modal creation
        console.log('AddAttendanceDeductionsModal created, props:', {
            show: this.show,
            employeesCount: this.employees.length,
            deductionsCount: this.deductions.length
        });
    },
    methods: {
        toggleSelectAllEmployees() {
            if (this.selectAllEmployees) {
                this.selectedEmployees = this.employees.map(emp => emp.id);
            } else {
                this.selectedEmployees = [];
            }
        },
        toggleSelectAllDeductions() {
            if (this.selectAllDeductions) {
                this.selectedDeductions = this.deductions.map(ded => ded.id);
            } else {
                this.selectedDeductions = [];
            }
        },
        save() {
            console.log('Emitting save event:', {
                employees: this.selectedEmployees,
                deductions: this.selectedDeductions
            });
            const selectedEmployees = this.employees.filter(emp => this.selectedEmployees.includes(emp.id));
            const selectedDeductions = this.deductions.filter(ded => this.selectedDeductions.includes(ded.id));
            this.$emit('save', { employees: selectedEmployees, deductions: selectedDeductions });
            this.reset();
        },
        cancel() {
            console.log('Emitting close event');
            this.$emit('close');
            this.reset();
        },
        reset() {
            this.selectedEmployees = [];
            this.selectedDeductions = [];
            this.selectAllEmployees = false;
            this.selectAllDeductions = false;
            this.isLoading = false;
        }
    }
};
</script>

<style scoped>
.large-checkbox {
    width: 1.25rem;
    height: 1.25rem;
}
</style>