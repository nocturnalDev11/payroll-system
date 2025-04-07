<template>
    <TransitionRoot appear show as="template">
        <Dialog as="div" @close="$emit('close')" class="relative z-50">
            <!-- Background overlay with blur -->
            <TransitionChild enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100"
                leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
                <div class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm" />
            </TransitionChild>

            <!-- Modal panel -->
            <div class="fixed inset-0 overflow-y-auto">
                <div class="flex min-h-full items-center justify-center p-4 text-center">
                    <TransitionChild enter="ease-out duration-300" enter-from="opacity-0 scale-95"
                        enter-to="opacity-100 scale-100" leave="ease-in duration-200" leave-from="opacity-100 scale-100"
                        leave-to="opacity-0 scale-95">
                        <DialogPanel
                            class="w-full max-w-4xl transform rounded-2xl bg-white p-6 shadow-2xl transition-all">
                            <!-- Header -->
                            <div class="flex items-center justify-between border-b border-gray-200 pb-4">
                                <DialogTitle class="text-2xl font-semibold text-gray-800">
                                    Assign Recurring Deductions
                                </DialogTitle>
                                <button @click="$emit('close')"
                                    class="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                    <XMarkIcon class="h-6 w-6" />
                                </button>
                            </div>

                            <!-- Main content -->
                            <div class="mt-6 grid grid-cols-2 gap-8">
                                <!-- Available Deductions -->
                                <div class="space-y-4">
                                    <div class="flex items-center justify-between">
                                        <h3 class="text-lg font-medium text-gray-900">Available Deductions</h3>
                                        <span class="text-sm text-gray-500">
                                            {{ selectedDeductions.length }} selected
                                        </span>
                                    </div>
                                    <div class="relative">
                                        <div
                                            class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input v-model="deductionSearch" type="text" placeholder="Search deductions..."
                                            class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                    </div>
                                    <div
                                        class="max-h-[300px] space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-2 scroll-container">
                                        <TransitionGroup enter="transition-all ease-out duration-200"
                                            enter-from="opacity-0 -translate-y-2" enter-to="opacity-100 translate-y-0"
                                            leave="transition-all ease-in duration-150" leave-from="opacity-100"
                                            leave-to="opacity-0">
                                            <div v-for="deduction in filteredDeductions" :key="deduction.id"
                                                class="group relative flex items-center rounded-lg border border-transparent bg-gray-50 p-3 hover:border-blue-100 hover:bg-blue-50">
                                                <div class="flex flex-1 items-center space-x-3">
                                                    <input type="checkbox" :id="'deduction-' + deduction.id"
                                                        v-model="selectedDeductions" :value="deduction"
                                                        class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                    <label :for="'deduction-' + deduction.id"
                                                        class="flex-1 cursor-pointer">
                                                        <span class="block text-sm font-medium text-gray-900">
                                                            {{ deduction.name }}
                                                        </span>
                                                        <span class="text-sm text-gray-500">
                                                            ₱{{ deduction.amount.toLocaleString() }}
                                                        </span>
                                                    </label>
                                                </div>
                                                <span
                                                    class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <CheckIcon v-if="selectedDeductions.includes(deduction)"
                                                        class="h-5 w-5 text-blue-600" />
                                                </span>
                                            </div>
                                        </TransitionGroup>
                                    </div>
                                </div>

                                <!-- Employees -->
                                <div class="space-y-4">
                                    <div class="flex items-center justify-between">
                                        <h3 class="text-lg font-medium text-gray-900">Employees</h3>
                                        <span class="text-sm text-gray-500">
                                            {{ selectedEmployees.length }} selected
                                        </span>
                                    </div>
                                    <div class="relative">
                                        <div
                                            class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input v-model="employeeSearch" type="text" placeholder="Search employees..."
                                            class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                    </div>
                                    <div
                                        class="max-h-[300px] space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-2">
                                        <TransitionGroup enter="transition-all ease-out duration-200"
                                            enter-from="opacity-0 -translate-y-2" enter-to="opacity-100 translate-y-0"
                                            leave="transition-all ease-in duration-150" leave-from="opacity-100"
                                            leave-to="opacity-0">
                                            <div v-for="employee in filteredEmployees" :key="employee.id"
                                                class="group relative flex items-center rounded-lg border border-transparent bg-gray-50 p-3 hover:border-blue-100 hover:bg-blue-50">
                                                <div class="flex flex-1 items-center space-x-3">
                                                    <input type="checkbox" :id="'employee-' + employee.id"
                                                        v-model="selectedEmployees" :value="employee"
                                                        class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                    <label :for="'employee-' + employee.id"
                                                        class="flex-1 cursor-pointer">
                                                        <span class="block text-sm font-medium text-gray-900">
                                                            {{ employee.name }}
                                                        </span>
                                                        <span class="text-sm text-gray-500">
                                                            {{ employee.position }}
                                                        </span>
                                                    </label>
                                                </div>
                                                <span
                                                    class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <CheckIcon v-if="selectedEmployees.includes(employee)"
                                                        class="h-5 w-5 text-blue-600" />
                                                </span>
                                            </div>
                                        </TransitionGroup>
                                    </div>
                                </div>
                            </div>

                            <!-- Calendar Section -->
                            <div class="mt-8 space-y-4 rounded-lg bg-gray-50 p-6">
                                <h3 class="text-lg font-medium text-gray-900">Schedule Details</h3>
                                <p class="text-sm text-gray-600">Select bi-weekly payroll periods</p>

                                <div class="grid grid-cols-2 gap-6">
                                    <!-- Calendar -->
                                    <div class="rounded-lg bg-white p-4 shadow-sm">
                                        <div class="flex items-center justify-between">
                                            <button @click="prevMonth" class="rounded-full p-1 hover:bg-gray-100">
                                                <ChevronLeftIcon class="h-5 w-5 text-gray-600" />
                                            </button>
                                            <span class="text-sm font-medium text-gray-900">
                                                {{ currentMonthYear }}
                                            </span>
                                            <button @click="nextMonth" class="rounded-full p-1 hover:bg-gray-100">
                                                <ChevronLeftIcon class="h-5 w-5 text-gray-600 rotate-180" />
                                            </button>
                                        </div>

                                        <div class="mt-4 grid grid-cols-7 gap-1">
                                            <div v-for="day in ['S', 'M', 'T', 'W', 'T', 'F', 'S']" :key="day"
                                                class="text-center text-xs font-medium text-gray-500">
                                                {{ day }}
                                            </div>
                                            <button v-for="day in calendarDays" :key="day.date"
                                                @click="toggleDate(day.date)" :disabled="!isPayrollDay(day.date)"
                                                :class="[
                                                    'aspect-square rounded-full text-sm',
                                                    isPayrollDay(day.date)
                                                        ? 'cursor-pointer hover:bg-blue-50'
                                                        : 'cursor-not-allowed',
                                                    isSelectedPeriod(day.date)
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                        : 'text-gray-700',
                                                    !day.isCurrentMonth && 'text-gray-400',
                                                ]">
                                                {{ day.date.getDate() }}
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Selected Periods -->
                                    <div class="space-y-3">
                                        <h4 class="text-sm font-medium text-gray-700">Selected Periods</h4>
                                        <div class="max-h-[200px] space-y-2 overflow-y-auto">
                                            <TransitionGroup enter="transition-all ease-out duration-200"
                                                enter-from="opacity-0 -translate-y-2"
                                                enter-to="opacity-100 translate-y-0"
                                                leave="transition-all ease-in duration-150" leave-from="opacity-100"
                                                leave-to="opacity-0">
                                                <div v-for="period in selectedPeriods" :key="period.start.toISOString()"
                                                    class="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                                                    <span class="text-sm text-gray-900">
                                                        {{ formatDate(period.start) }} - {{ formatDate(period.end) }}
                                                    </span>
                                                    <button @click="toggleDate(period.start)"
                                                        class="text-gray-400 hover:text-gray-600">
                                                        <XMarkIcon class="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </TransitionGroup>
                                            <div v-if="selectedPeriods.length === 0"
                                                class="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center">
                                                <p class="text-sm text-gray-500">
                                                    No periods selected. Click on a payroll date to select a period.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Footer Actions -->
                            <div class="mt-8 flex items-center justify-end space-x-4">
                                <button @click="$emit('close')"
                                    class="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400/50">
                                    Cancel
                                </button>
                                <button @click="saveChanges" :disabled="!isValid" :class="[
                                    'rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all',
                                    isValid
                                        ? 'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                                        : 'cursor-not-allowed opacity-50',
                                ]">
                                    Save Changes
                                </button>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </div>
        </Dialog>
    </TransitionRoot>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
    Dialog,
    DialogPanel,
    DialogTitle,
    TransitionChild,
    TransitionRoot,
} from '@headlessui/vue'
import {
    XMarkIcon,
    ChevronLeftIcon,
    CheckIcon,
    MagnifyingGlassIcon,
} from '@heroicons/vue/24/outline/index.js'

// Props
const props = defineProps({
    availableDeductions: {
        type: Array,
        required: true,
    },
    employees: {
        type: Array,
        required: true,
    },
})

// Emits
const emit = defineEmits(['close', 'save'])

// State
const selectedDeductions = ref([])
const selectedEmployees = ref([])
const currentDate = ref(new Date('2025-04-07'))
const selectedDates = ref([])

// Search filters
const deductionSearch = ref('')
const employeeSearch = ref('')

// Computed
const isValid = computed(() => {
    return (
        selectedDeductions.value.length > 0 &&
        selectedEmployees.value.length > 0 &&
        selectedDates.value.length > 0
    )
})

const filteredDeductions = computed(() => {
    if (!deductionSearch.value) return props.availableDeductions
    const search = deductionSearch.value.toLowerCase()
    return props.availableDeductions.filter(deduction =>
        deduction.name.toLowerCase().includes(search)
    )
})

const filteredEmployees = computed(() => {
    if (!employeeSearch.value) return props.employees
    const search = employeeSearch.value.toLowerCase()
    return props.employees.filter(employee =>
        employee.name.toLowerCase().includes(search) ||
        employee.position.toLowerCase().includes(search)
    )
})

const currentMonthYear = computed(() => {
    return currentDate.value.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
    })
})

const calendarDays = computed(() => {
    const days = []
    const firstDayOfMonth = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 0)
    const startDay = firstDayOfMonth.getDay()

    // Add previous month days
    for (let i = startDay - 1; i >= 0; i--) {
        const date = new Date(firstDayOfMonth)
        date.setDate(date.getDate() - (i + 1))
        days.push({ date, isCurrentMonth: false })
    }

    // Add current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        days.push({
            date: new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), i),
            isCurrentMonth: true
        })
    }

    return days
})

const selectedPeriods = computed(() => {
    const periods = []
    selectedDates.value.sort((a, b) => a - b)
    selectedDates.value.forEach(date => {
        if (isPayrollDay(date)) {
            const endDate = new Date(date)
            endDate.setDate(endDate.getDate() + 14)
            periods.push({ start: date, end: endDate })
        }
    })
    return periods
})

// Methods
const prevMonth = () => {
    currentDate.value = new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth() - 1,
        1
    )
}

const nextMonth = () => {
    currentDate.value = new Date(
        currentDate.value.getFullYear(),
        currentDate.value.getMonth() + 1,
        1
    )
}

const isPayrollDay = (date) => {
    const day = date.getDate()
    return (
        day === 15 ||
        day === new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    )
}

const isSelectedPeriod = (date) => {
    return selectedDates.value.some(
        (d) => d.toDateString() === date.toDateString()
    )
}

const toggleDate = (date) => {
    if (!isPayrollDay(date)) return
    const dateString = date.toDateString()
    const index = selectedDates.value.findIndex(
        (d) => d.toDateString() === dateString
    )
    if (index === -1) {
        selectedDates.value.push(new Date(date))
    } else {
        selectedDates.value.splice(index, 1)
    }
}

const formatDate = (date) => {
    return date.toLocaleDateString('default', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })
}

const saveChanges = () => {
    emit('save', {
        deductions: selectedDeductions.value,
        employees: selectedEmployees.value,
        periods: selectedPeriods.value,
    })
    emit('close')
}
</script>

<style>
/* These styles are now global, but limited to components using scrollbars */
.scroll-container::-webkit-scrollbar {
    width: 8px;
    /* w-2 equivalent */
    height: 8px;
}

.scroll-container::-webkit-scrollbar-track {
    background-color: #f3f4f6;
    /* bg-gray-100 */
    border-radius: 9999px;
    /* rounded-full */
}

.scroll-container::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    /* bg-gray-300 */
    border-radius: 9999px;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
    background-color: #9ca3af;
    /* hover:bg-gray-400 */
}
</style>