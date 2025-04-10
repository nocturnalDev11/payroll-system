<template>
    <TransitionRoot appear :show="true" as="template">
        <Dialog as="div" @close="$emit('close')" class="relative z-50">
            <TransitionChild enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100"
                leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
                <div class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm" />
            </TransitionChild>

            <div class="fixed inset-0 overflow-y-auto">
                <div class="flex min-h-full items-center justify-center p-4">
                    <TransitionChild enter="ease-out duration-300" enter-from="opacity-0 scale-95"
                        enter-to="opacity-100 scale-100" leave="ease-in duration-200" leave-from="opacity-100 scale-100"
                        leave-to="opacity-0 scale-95">
                        <DialogPanel class="w-full max-w-5xl rounded-2xl bg-white shadow-2xl flex flex-col md:flex-row">
                            <!-- Left Panel -->
                            <div class="w-full md:w-1/2 p-4 md:p-6 md:border-r border-gray-200">
                                <div class="flex items-center justify-between border-b border-gray-200 pb-4">
                                    <DialogTitle class="text-xl md:text-2xl font-semibold text-gray-800">
                                        Assign Recurring Deductions
                                    </DialogTitle>
                                    <button @click="$emit('close')"
                                        class="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                        <XMarkIcon class="h-6 w-6" />
                                    </button>
                                </div>

                                <div class="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <!-- Deductions -->
                                    <div class="space-y-4">
                                        <div class="flex items-center justify-between">
                                            <h3 class="text-base md:text-lg font-medium text-gray-900">Deductions</h3>
                                            <span class="text-sm text-gray-500">
                                                {{ selectedDeductions.length }} selected
                                            </span>
                                        </div>
                                        <div class="relative">
                                            <MagnifyingGlassIcon
                                                class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input v-model="deductionSearch" type="text"
                                                placeholder="Search deductions..."
                                                class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                        </div>
                                        <div
                                            class="max-h-[200px] md:max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 p-2 space-y-2">
                                            <TransitionGroup enter="transition-all ease-out duration-200"
                                                enter-from="opacity-0 -translate-y-2"
                                                enter-to="opacity-100 translate-y-0"
                                                leave="transition-all ease-in duration-150" leave-from="opacity-100"
                                                leave-to="opacity-0">
                                                <div v-for="deduction in filteredDeductions" :key="deduction.id"
                                                    class="flex items-center p-2 md:p-3 rounded-lg bg-gray-50 hover:bg-blue-50 group">
                                                    <input type="checkbox" :id="'deduction-' + deduction.id"
                                                        v-model="selectedDeductions" :value="deduction"
                                                        class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3" />
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
                                            </TransitionGroup>
                                        </div>
                                    </div>

                                    <!-- Employees -->
                                    <div class="space-y-4">
                                        <div class="flex items-center justify-between">
                                            <h3 class="text-base md:text-lg font-medium text-gray-900">Employees</h3>
                                            <span class="text-sm text-gray-500">
                                                {{ selectedEmployees.length }} selected
                                            </span>
                                        </div>
                                        <div class="relative">
                                            <MagnifyingGlassIcon
                                                class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input v-model="employeeSearch" type="text"
                                                placeholder="Search employees..."
                                                class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                        </div>
                                        <div
                                            class="max-h-[200px] md:max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 p-2 space-y-2">
                                            <TransitionGroup enter="transition-all ease-out duration-200"
                                                enter-from="opacity-0 -translate-y-2"
                                                enter-to="opacity-100 translate-y-0"
                                                leave="transition-all ease-in duration-150" leave-from="opacity-100"
                                                leave-to="opacity-0">
                                                <div v-for="employee in filteredEmployees" :key="employee.id"
                                                    class="flex items-center p-2 md:p-3 rounded-lg bg-gray-50 hover:bg-blue-50 group">
                                                    <input type="checkbox" :id="'employee-' + employee.id"
                                                        v-model="selectedEmployees" :value="employee"
                                                        class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3" />
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
                                            </TransitionGroup>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Right Panel -->
                            <div class="w-full md:w-1/2 p-4 md:p-6 flex flex-col">
                                <div class="space-y-4 flex-grow">
                                    <div>
                                        <h3 class="text-base md:text-lg font-medium text-gray-900">Schedule Details</h3>
                                        <p class="text-sm text-gray-600">Select bi-weekly payroll periods (15th or last
                                            day)</p>
                                    </div>

                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                        <div class="rounded-lg bg-white p-3 md:p-4 shadow-sm">
                                            <div class="flex items-center justify-between mb-3 md:mb-4">
                                                <button @click="prevMonth"
                                                    class="rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                                    <ChevronLeftIcon class="h-5 w-5 text-gray-600" />
                                                </button>
                                                <span class="text-sm font-semibold text-gray-900">
                                                    {{ currentMonthYear }}
                                                </span>
                                                <button @click="nextMonth"
                                                    class="rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                                    <ChevronLeftIcon class="h-5 w-5 text-gray-600 rotate-180" />
                                                </button>
                                            </div>

                                            <div class="grid grid-cols-7 gap-0.5 md:gap-1 text-center">
                                                <div v-for="day in ['S', 'M', 'T', 'W', 'T', 'F', 'S']" :key="day"
                                                    class="text-xs font-medium text-gray-600 pb-1 md:pb-2">
                                                    {{ day }}
                                                </div>
                                                <button v-for="day in calendarDays" :key="day.date.toISOString()"
                                                    @click="toggleDate(day.date)" :disabled="!isPayrollDay(day.date)"
                                                    class="relative aspect-square rounded-full text-sm flex items-center justify-center m-0.5 md:text-xs"
                                                    :class="[
                                                        isSelectedPeriod(day.date)
                                                            ? 'bg-blue-600 text-white hover:bg-blue-700 font-medium'
                                                            : [
                                                                isPayrollDay(day.date)
                                                                    ? 'bg-green-100 text-gray-800 hover:bg-green-200 cursor-pointer'
                                                                    : 'bg-red-100 text-gray-600 hover:bg-red-200 cursor-not-allowed',
                                                                !day.isCurrentMonth && 'opacity-60'
                                                            ]
                                                    ]">
                                                    <span>{{ day.date.getDate() }}</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div class="space-y-3">
                                            <h4 class="text-sm font-medium text-gray-700">Selected Periods</h4>
                                            <div class="max-h-[150px] md:max-h-[200px] overflow-y-auto space-y-2">
                                                <TransitionGroup enter="transition-all ease-out duration-200"
                                                    enter-from="opacity-0 -translate-y-2"
                                                    enter-to="opacity-100 translate-y-0"
                                                    leave="transition-all ease-in duration-150" leave-from="opacity-100"
                                                    leave-to="opacity-0">
                                                    <div v-for="period in selectedPeriods"
                                                        :key="period.start.toISOString()"
                                                        class="flex items-center justify-between rounded-lg bg-white p-2 md:p-3 shadow-sm hover:bg-gray-50 text-sm">
                                                        <span class="text-gray-900">
                                                            {{ formatDate(period.start) }} - {{ formatDate(period.end)
                                                            }}
                                                        </span>
                                                        <button @click="toggleDate(period.start)"
                                                            class="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                                            <XMarkIcon class="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </TransitionGroup>
                                                <div v-if="selectedPeriods.length === 0"
                                                    class="rounded-lg border-2 border-dashed border-gray-200 p-3 md:p-4 text-center">
                                                    <p class="text-sm text-gray-500">
                                                        No periods selected. Tap green dates to select.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    class="mt-4 md:mt-6 flex flex-col md:flex-row items-center justify-end space-y-3 md:space-y-0 md:space-x-3">
                                    <button @click="$emit('close')"
                                        class="w-full md:w-auto rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400/50">
                                        Cancel
                                    </button>
                                    <button @click="saveChanges" :disabled="!isValid"
                                        class="w-full md:w-auto rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-all focus:outline-none"
                                        :class="[
                                            isValid
                                                ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/50'
                                                : 'bg-blue-400 cursor-not-allowed'
                                        ]">
                                        Save Changes
                                    </button>
                                </div>
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
    MagnifyingGlassIcon,
} from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
    availableDeductions: {
        type: Array,
        required: true,
        default: () => []
    },
    employees: {
        type: Array,
        required: true,
        default: () => []
    },
})

// Emits
const emit = defineEmits(['close', 'save'])

// State
const selectedDeductions = ref([])
const selectedEmployees = ref([])
const currentDate = ref(new Date())
const selectedDates = ref([])

// Search filters
const deductionSearch = ref('')
const employeeSearch = ref('')

// Computed Properties
const isValid = computed(() => {
    return (
        selectedDeductions.value.length > 0 &&
        selectedEmployees.value.length > 0 &&
        selectedDates.value.length > 0
    )
})

const filteredDeductions = computed(() => {
    const search = deductionSearch.value.toLowerCase().trim()
    return props.availableDeductions.filter(deduction =>
        deduction.name.toLowerCase().includes(search)
    )
})

const filteredEmployees = computed(() => {
    const search = employeeSearch.value.toLowerCase().trim()
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
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const startDay = firstDayOfMonth.getDay()

    for (let i = startDay - 1; i >= 0; i--) {
        const date = new Date(firstDayOfMonth)
        date.setDate(firstDayOfMonth.getDate() - (i + 1))
        days.push({ date, isCurrentMonth: false })
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        days.push({
            date: new Date(year, month, i),
            isCurrentMonth: true
        })
    }

    const totalDays = days.length
    const remainingDays = 42 - totalDays
    for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i)
        days.push({ date, isCurrentMonth: false })
    }

    return days
})

const selectedPeriods = computed(() => {
    return selectedDates.value
        .sort((a, b) => a - b)
        .map(date => {
            const endDate = new Date(date)
            endDate.setDate(endDate.getDate() + 13)
            return { start: new Date(date), end: endDate }
        })
})

// Methods
const prevMonth = () => {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

const isPayrollDay = (date) => {
    const day = date.getDate()
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    return day === 15 || day === lastDay
}

const isSelectedPeriod = (date) => {
    return selectedDates.value.some(d => d.toDateString() === date.toDateString())
}

const toggleDate = (date) => {
    if (!isPayrollDay(date)) return
    const dateString = date.toDateString()
    const index = selectedDates.value.findIndex(d => d.toDateString() === dateString)
    if (index === -1) {
        selectedDates.value.push(new Date(date))
    } else {
        selectedDates.value.splice(index, 1)
    }
}

const formatDate = (date) => {
    return date.toLocaleDateString('default', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

const saveChanges = () => {
    if (!isValid.value) return
    emit('save', {
        deductions: selectedDeductions.value,
        employees: selectedEmployees.value,
        periods: selectedPeriods.value,
    })
    emit('close')
}
</script>

<style scoped>
/* Mobile adjustments using max-width media query */
@media (max-width: 639px) {
    .max-w-5xl {
        max-width: 100%;
        margin: 0.5rem;
    }

    .text-xl {
        font-size: 1.125rem;
        line-height: 1.75rem;
    }

    .grid-cols-1 {
        grid-template-columns: 1fr;
    }

    .aspect-square {
        padding: 0.5rem;
    }

    .w-full {
        width: 100%;
    }
}

/* Scrollbar styles */
::-webkit-scrollbar {
    width: 0.5rem;
}

::-webkit-scrollbar-track {
    background: #f3f4f6;
    /* gray-100 */
    border-radius: 9999px;
}

::-webkit-scrollbar-thumb {
    background: #9ca3af;
    /* gray-400 */
    border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
    /* gray-500 */
}

/* Touch optimizations */
button {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
}
</style>