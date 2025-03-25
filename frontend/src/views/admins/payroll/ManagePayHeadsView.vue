<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, onBeforeUnmount } from 'vue';
import axios from 'axios';
import PayHeadModal from './Partials/PayHeadModal.vue';
import PayHeadTable from './Partials/PayHeadTable.vue';
import EmployeePayrollTable from './Partials/EmployeePayrollTable.vue';
import AddPayheadModal from './Partials/AddPayHeadModal.vue';

// Define interfaces
interface PayHead {
    id: string;
    name: string;
    amount: number | string;
    type: 'Earnings' | 'Deductions';
    description?: string;
    uniqueId?: string;
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

// Reactive state
const currentTime = ref('2025-03-03 05:41:55');
const employeeName = ref('sdr20');
const employeeInitials = computed(() => employeeName.value.charAt(0).toUpperCase());
const showEmployeeMenu = ref(false);
const employeeMenuContainer = ref<HTMLElement | null>(null);
const payHeads = ref<PayHead[]>([]);
const employees = ref<Employee[]>([]);
const newPayHead = ref<PayHead>({
    id: '',
    name: '',
    amount: '',
    type: 'Earnings',
    description: ''
});
const selectedPayHead = ref<PayHead>({
    id: '',
    name: '',
    amount: '',
    type: 'Earnings',
    description: ''
});
const showAddModal = ref(false);
const showUpdateModal = ref(false);
const showAddPayheadModal = ref(false);
const selectedEmployee = ref<Employee | null>(null);
const selectedEmployeePayheads = ref<PayHead[]>([]);
const availablePayheads = ref<PayHead[]>([]);
const statusMessage = ref('');
const searchQuery = ref('');
const filterType = ref('');
const activeTab = ref<'payheads' | 'employees'>('payheads');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const isLoading = ref(false);

// Setup logic
let timeInterval: number;

const handleClickOutside = (event: MouseEvent) => {
    if (employeeMenuContainer.value && !employeeMenuContainer.value.contains(event.target as Node)) {
        showEmployeeMenu.value = false;
    }
};

onMounted(() => {
    timeInterval = setInterval(() => {
        const now = new Date();
        currentTime.value = now.toISOString().slice(0, 19).replace('T', ' ');
    }, 1000);
    document.addEventListener('click', handleClickOutside);
    fetchPayHeads();
    fetchEmployees();
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    if (timeInterval) clearInterval(timeInterval);
});

// Computed properties
const filteredPayHeads = computed(() => {
    let filtered = [...payHeads.value];
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
    }
    if (filterType.value) {
        filtered = filtered.filter(p => p.type === filterType.value);
    }
    console.log('Filtered payHeads:', filtered);
    return filtered;
});

const filteredEmployees = computed(() => {
    let filtered = [...employees.value];
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(e =>
            e.name.toLowerCase().includes(query) ||
            (e.position && e.position.toLowerCase().includes(query))
        );
    }
    if (filterType.value) {
        filtered = filtered.filter(e => {
            const earnings = calculateEarnings(e.payheads || []);
            const deductions = calculateDeductions(e.payheads || []);
            return filterType.value === 'Earnings' ? earnings > 0 : deductions > 0;
        });
    }
    return filtered;
});

const paginatedEmployees = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredEmployees.value.slice(start, end);
});

const totalPages = computed(() => {
    return Math.ceil(filteredEmployees.value.length / itemsPerPage.value) || 1;
});

const displayedPages = computed(() => {
    const total = totalPages.value;
    const current = currentPage.value;
    const pages: (number | string)[] = [];
    if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
    } else {
        if (current <= 3) {
            for (let i = 1; i <= 5; i++) pages.push(i);
            pages.push('...', total);
        } else if (current >= total - 2) {
            pages.push(1, '...');
            for (let i = total - 4; i <= total; i++) pages.push(i);
        } else {
            pages.push(1, '...');
            for (let i = current - 1; i <= current + 1; i++) pages.push(i);
            pages.push('...', total);
        }
    }
    return pages;
});

const totalPayableSalary = computed(() => {
    if (!selectedEmployee.value) return 0;
    const earnings = calculateEarnings(selectedEmployeePayheads.value || []);
    const deductions = calculateDeductions(selectedEmployeePayheads.value || []);
    return (selectedEmployee.value.salary || 0) + earnings - deductions;
});

// Methods
const fetchPayHeads = async () => {
    isLoading.value = true;
    statusMessage.value = '';
    try {
        const response = await axios.get('http://localhost:5000/api/payheads');
        console.log('PayHeads response:', response.data);
        payHeads.value = response.data.map((payHead: any) => ({
            id: payHead._id.toString(),
            name: payHead.name,
            amount: payHead.amount,
            type: payHead.type,
            description: payHead.description
        })) || [];
        console.log('Transformed payHeads:', payHeads.value);
        showSuccessMessage('Pay heads loaded successfully!');
    } catch (error) {
        console.error('Error fetching pay heads:', error);
        showErrorMessage('Failed to load pay heads.');
    } finally {
        isLoading.value = false;
    }
};

const fetchEmployees = async () => {
    isLoading.value = true;
    statusMessage.value = '';
    try {
        const response = await axios.get('http://localhost:5000/api/employees');
        console.log('Employees response:', response.data);
        employees.value = response.data.map((emp: any) => ({
            id: emp._id.toString(),
            firstName: emp.firstName,
            lastName: emp.lastName,
            name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
            position: emp.position || 'N/A',
            salary: emp.salary || 0,
            payheads: (emp.payheads || []).map((ph: any) => ({
                id: ph.id || ph._id.toString(),
                name: ph.name,
                amount: ph.amount,
                type: ph.type,
                description: ph.description
            })),
            totalEarnings: calculateEarnings(emp.payheads || []),
            totalDeduction: calculateDeductions(emp.payheads || []),
            totalSalary: (emp.salary || 0) + calculateEarnings(emp.payheads || []) - calculateDeductions(emp.payheads || []),
            employeeIdNumber: emp.employeeIdNumber
        }));
        showSuccessMessage('Employees loaded successfully!');
    } catch (error) {
        console.error('Error fetching employees:', error);
        showErrorMessage('Failed to load employees.');
    } finally {
        isLoading.value = false;
    }
};

const addPayHead = async (payHead: PayHead) => {
    try {
        isLoading.value = true;
        const response = await axios.post('http://localhost:5000/api/payheads', payHead);
        payHeads.value.push(response.data);
        showAddModal.value = false;
        showSuccessMessage('Pay head added successfully!');
        await fetchEmployees();
    } catch (error) {
        console.error('Error adding pay head:', error);
        showErrorMessage('Failed to add pay head.');
    } finally {
        isLoading.value = false;
    }
};

const showUpdatePayHeadModal = (payHead: PayHead) => {
    selectedPayHead.value = { ...payHead };
    showUpdateModal.value = true;
};

const updatePayHead = async (updatedPayHead: PayHead) => {
    try {
        isLoading.value = true;
        const response = await axios.put(`http://localhost:5000/api/payheads/${updatedPayHead.id}`, updatedPayHead);
        const index = payHeads.value.findIndex(ph => ph.id === updatedPayHead.id);
        if (index !== -1) {
            payHeads.value.splice(index, 1, response.data);
            showUpdateModal.value = false;
            showSuccessMessage('Pay head updated successfully!');
            await fetchEmployees();
        }
    } catch (error) {
        console.error('Error updating pay head:', error);
        showErrorMessage('Failed to update pay head.');
    } finally {
        isLoading.value = false;
    }
};

const confirmDeletePayHead = async (id: string | undefined) => {
    if (!id) {
        showErrorMessage('Cannot delete pay head: ID is missing');
        return;
    }
    if (confirm('Are you sure you want to delete this pay head?')) {
        await deletePayHead(id);
    }
};

const deletePayHead = async (id: string) => {
    try {
        isLoading.value = true;
        await axios.delete(`http://localhost:5000/api/payheads/${id}`);
        payHeads.value = payHeads.value.filter(payHead => payHead.id !== id);
        showSuccessMessage('Pay head deleted successfully!');
        await fetchEmployees();
    } catch (error) {
        console.error('Error deleting pay head:', error);
        showErrorMessage('Failed to delete pay head.');
    } finally {
        isLoading.value = false;
    }
};

const openAddPayheadModal = async (employee: Employee) => {
    if (payHeads.value.length === 0) {
        await fetchPayHeads();
    }
    console.log('Opening modal for employee:', employee);
    selectedEmployee.value = { ...employee, salary: employee.salary || 0 };
    selectedEmployeePayheads.value = [...(employee.payheads || [])];
    availablePayheads.value = [...payHeads.value];
    console.log('Selected employee ID:', selectedEmployee.value?.id);
    console.log('Available payheads:', availablePayheads.value);
    showAddPayheadModal.value = true;
};

const addPayheadToEmployee = (payhead: PayHead) => {
    const newPayhead: PayHead = {
        ...payhead,
        uniqueId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    selectedEmployeePayheads.value.push(newPayhead);
};

const removePayheadFromEmployee = (payhead: PayHead) => {
    selectedEmployeePayheads.value = selectedEmployeePayheads.value.filter(
        p => p.uniqueId !== payhead.uniqueId
    );
};

const updatePayheadInEmployee = (updatedPayhead: PayHead) => {
    const index = selectedEmployeePayheads.value.findIndex(
        p => p.uniqueId === updatedPayhead.uniqueId
    );
    if (index !== -1) {
        selectedEmployeePayheads.value.splice(index, 1, { ...updatedPayhead });
    }
};

const savePayheads = async () => {
    try {
        isLoading.value = true;
        if (!selectedEmployee.value || !selectedEmployee.value.id) {
            showErrorMessage('Cannot save payheads: No employee selected or missing ID');
            return;
        }

        const payheadsToSave = selectedEmployeePayheads.value.map(ph => ({
            id: ph.id,
            name: ph.name,
            amount: ph.amount,
            type: ph.type
        }));

        const updatedEmployee = {
            ...selectedEmployee.value,
            payheads: payheadsToSave,
            totalEarnings: calculateEarnings(payheadsToSave),
            totalDeduction: calculateDeductions(payheadsToSave),
            totalSalary: (selectedEmployee.value.salary || 0) +
                calculateEarnings(payheadsToSave) -
                calculateDeductions(payheadsToSave)
        };

        console.log('Saving employee with ID:', selectedEmployee.value.id);
        await axios.put(`http://localhost:5000/api/employees/update/${selectedEmployee.value.id}`, updatedEmployee);
        const employeeIndex = employees.value.findIndex(e => e.id === selectedEmployee.value!.id);
        if (employeeIndex !== -1) {
            employees.value.splice(employeeIndex, 1, updatedEmployee);
        }

        showAddPayheadModal.value = false;
        showSuccessMessage('Payheads saved successfully!');
    } catch (error) {
        console.error('Error saving payheads:', error);
        showErrorMessage('Failed to save payheads.');
    } finally {
        isLoading.value = false;
    }
};

const calculateEarnings = (payheads: PayHead[] = []) => {
    return payheads
        .filter(p => p.type === 'Earnings')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
};

const calculateDeductions = (payheads: PayHead[] = []) => {
    return payheads
        .filter(p => p.type === 'Deductions')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
};

const calculatePayHeadsByType = (type: 'Earnings' | 'Deductions') => {
    return payHeads.value.filter(p => p.type === type).length;
};

const calculateAverageAmount = (type: 'Earnings' | 'Deductions') => {
    const filtered = payHeads.value.filter(p => p.type === type && Number(p.amount) > 0);
    if (filtered.length === 0) return 0;
    const total = filtered.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return total / filtered.length;
};

const prevPage = () => {
    if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) currentPage.value++;
};

const setPage = (page: number | string) => {
    if (typeof page === 'number') {
        currentPage.value = page;
    }
};

const resetFilters = () => {
    searchQuery.value = '';
    filterType.value = '';
};

const showSuccessMessage = (message: string) => {
    statusMessage.value = message;
    setTimeout(() => { statusMessage.value = ''; }, 3000);
};

const showErrorMessage = (message: string) => {
    statusMessage.value = message;
    setTimeout(() => { statusMessage.value = ''; }, 3000);
};
</script>

<template>
    <div>
        <!-- Main Content - Improved layout and spacing -->
        <main class="flex-1 max-w-9xl mx-auto py-6">
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <!-- Total Pay Heads -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 rounded-lg bg-blue-100 p-3">
                                <span class="material-icons text-blue-600">payments</span>
                            </div>
                            <div class="ml-5">
                                <p class="text-sm font-medium text-gray-500">Total Pay Heads</p>
                                <h3 class="mt-1 text-xl font-semibold text-gray-900">
                                    {{ payHeads.length }}
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-2">
                        <div class="text-sm text-blue-700">
                            <span class="font-medium">{{ calculatePayHeadsByType('Earnings') }}</span> earnings,
                            <span class="font-medium">{{ calculatePayHeadsByType('Deductions') }}</span> deductions
                        </div>
                    </div>
                </div>

                <!-- Average Earnings -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 rounded-lg bg-green-100 p-3">
                                <span class="material-icons text-green-600">trending_up</span>
                            </div>
                            <div class="ml-5">
                                <p class="text-sm font-medium text-gray-500">Average Earnings</p>
                                <h3 class="mt-1 text-xl font-semibold text-gray-900">
                                    ₱{{ calculateAverageAmount('Earnings').toFixed(2) }}
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-2">
                        <div class="text-sm text-green-700">
                            <span class="flex items-center">
                                <span class="material-icons text-sm mr-1">info</span>
                                Per employee average
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Total Employees -->
                <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 rounded-lg bg-purple-100 p-3">
                                <span class="material-icons text-purple-600">people</span>
                            </div>
                            <div class="ml-5">
                                <p class="text-sm font-medium text-gray-500">Total Employees</p>
                                <h3 class="mt-1 text-xl font-semibold text-gray-900">{{ employees.length }}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gradient-to-r from-purple-50 to-fuchsia-50 px-5 py-2">
                        <div class="text-sm text-purple-700">
                            <span class="flex items-center">
                                <span class="material-icons text-sm mr-1">verified</span>
                                All records up to date
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Controls Section -->
            <div class="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-5">
                    <div class="md:col-span-5 relative">
                        <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <div class="relative">
                            <span
                                class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                            <input id="search" v-model="searchQuery" type="text"
                                placeholder="Search by name or description..."
                                class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                            <button v-if="searchQuery" @click="searchQuery = ''"
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                                <span class="material-icons">clear</span>
                            </button>
                        </div>
                    </div>
                    <div class="md:col-span-3">
                        <label for="filter" class="block text-sm font-medium text-gray-700 mb-1">Filter Type</label>
                        <div class="relative">
                            <span
                                class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">filter_list</span>
                            <select id="filter" v-model="filterType"
                                class="w-full pl-10 pr-9 py-2.5 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                <option value="">All Types</option>
                                <option value="Earnings">Earnings</option>
                                <option value="Deductions">Deductions</option>
                            </select>
                            <span
                                class="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">arrow_drop_down</span>
                        </div>
                    </div>
                    <div class="md:col-span-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">View</label>
                        <div class="flex rounded-lg bg-gray-100 p-1 shadow-inner">
                            <button v-for="tab in ['payheads', 'employees']" :key="tab" @click="activeTab = tab"
                                class="flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all"
                                :class="activeTab === tab ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'">
                                <div class="flex items-center justify-center gap-2">
                                    <span class="material-icons text-sm">
                                        {{ tab === 'payheads' ? 'payments' : 'people' }}
                                    </span>
                                    {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="isLoading" class="bg-white rounded-xl shadow-sm flex justify-center items-center p-20">
                <div class="flex flex-col items-center">
                    <div class="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4">
                    </div>
                    <h2 class="text-center text-gray-600 text-xl font-semibold">Loading...</h2>
                    <p class="w-full text-center text-gray-500">Please wait while we fetch the data</p>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="(activeTab === 'payheads' && filteredPayHeads.length === 0) || (activeTab === 'employees' && paginatedEmployees.length === 0)"
                class="bg-white rounded-xl shadow-sm border border-gray-100">
                <div class="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                    <div class="rounded-full bg-blue-100 p-3 mb-4">
                        <span class="material-icons text-blue-600 text-2xl">search_off</span>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900">No results found</h3>
                    <p class="mt-1 text-gray-500 text-center max-w-sm">
                        We couldn't find any {{ activeTab }} that match your search criteria. Try adjusting your filters
                        or search terms.
                    </p>
                    <button @click="resetFilters"
                        class="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <span class="material-icons text-sm mr-2">refresh</span>
                        Reset Filters
                    </button>
                </div>
            </div>

            <!-- Data Table Section -->
            <div v-else class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div class="px-6 py-4 border-b border-gray-300 bg-gray-50 flex items-center justify-between">
                    <h2 class="text-lg font-medium text-gray-900">
                        {{ activeTab === 'payheads' ? 'Pay Heads' : 'Employees' }}
                    </h2>
                    <div class="flex items-center space-x-4">
                        <div v-if="filteredPayHeads.length > 0 && activeTab === 'payheads'"
                            class="text-sm text-gray-500">
                            Showing {{ filteredPayHeads.length }} {{ filteredPayHeads.length === 1 ? 'item' : 'items' }}
                        </div>
                        <button v-if="activeTab === 'payheads'" @click="showAddModal = true"
                            class="inline-flex items-center px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm transform hover:scale-105">
                            <span class="material-icons text-sm mr-1">add</span>
                            New Pay Head
                        </button>
                    </div>
                </div>

                <!-- Table Content -->
                <div class="overflow-x-auto">
                    <component :is="activeTab === 'payheads' ? PayHeadTable : EmployeePayrollTable"
                        :pay-heads="filteredPayHeads" :employees="paginatedEmployees" @update="showUpdatePayHeadModal"
                        @delete="confirmDeletePayHead" @add-payhead="openAddPayheadModal" />
                </div>

                <!-- Pagination -->
                <div v-if="activeTab === 'employees' && totalPages > 1"
                    class="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
                    <div class="text-sm text-gray-700">
                        Showing <span class="font-medium">{{ ((currentPage - 1) * itemsPerPage) + 1 }}</span> to
                        <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredEmployees.length)
                            }}</span> of
                        <span class="font-medium">{{ filteredEmployees.length }}</span> entries
                    </div>
                    <div class="flex items-center space-x-2">
                        <button @click="prevPage" :disabled="currentPage === 1"
                            class="p-2 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                            :class="currentPage === 1 ? 'text-gray-400' : 'text-gray-700'">
                            <span class="material-icons">chevron_left</span>
                        </button>
                        <div class="flex items-center gap-1">
                            <template v-for="page in displayedPages" :key="page">
                                <button v-if="page !== '...'" @click="setPage(page)"
                                    class="min-w-[32px] h-8 rounded-lg text-sm font-medium transition-all"
                                    :class="currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-blue-100 text-gray-700'">
                                    {{ page }}
                                </button>
                                <span v-else class="px-2 text-gray-500">...</span>
                            </template>
                        </div>
                        <button @click="nextPage" :disabled="currentPage === totalPages"
                            class="p-2 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                            :class="currentPage === totalPages ? 'text-gray-400' : 'text-gray-700'">
                            <span class="material-icons">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <!-- Modals -->
        <transition name="modal-fade">
            <PayHeadModal v-if="showAddModal" :pay-head="newPayHead" title="Add New Pay Head"
                @close="showAddModal = false" @save="addPayHead" />
        </transition>
        <transition name="modal-fade">
            <PayHeadModal v-if="showUpdateModal" :pay-head="selectedPayHead" :is-update="true" title="Update Pay Head"
                @close="showUpdateModal = false" @save="updatePayHead" />
        </transition>
        <transition name="modal-fade">
            <AddPayheadModal v-if="showAddPayheadModal" :available-payheads="availablePayheads"
                :selected-employee-payheads="selectedEmployeePayheads" :selected-employee="selectedEmployee"
                :total-payable-salary="totalPayableSalary" @close="showAddPayheadModal = false" @save="savePayheads"
                @add-payhead="addPayheadToEmployee" @remove-payhead="removePayheadFromEmployee"
                @update-payhead="updatePayheadInEmployee" />
        </transition>

        <!-- Toast Notifications -->
        <div class="fixed bottom-4 right-4 z-50 space-y-4">
            <TransitionGroup enter-active-class="transform ease-out duration-300 transition"
                enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
                enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
                leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100"
                leave-to-class="opacity-0" move-class="transition duration-500">
                <div v-if="statusMessage" :key="statusMessage"
                    class="max-w-sm w-full bg-white rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
                    <div class="p-4">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <span class="material-icons"
                                    :class="statusMessage.includes('success') ? 'text-green-500' : 'text-red-500'">
                                    {{ statusMessage.includes('success') ? 'check_circle' : 'error' }}
                                </span>
                            </div>
                            <div class="ml-3 flex-1">
                                <p class="text-sm font-medium text-gray-900">{{ statusMessage }}</p>
                            </div>
                            <button @click="statusMessage = ''"
                                class="ml-4 flex-shrink-0 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <span class="material-icons">close</span>
                            </button>
                        </div>
                    </div>
                </div>
            </TransitionGroup>
        </div>
    </div>
</template>

<style scoped>
.loader {
    border-top-color: #3498db;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>