<template>
    <div>
        <!-- Main Content -->
        <main class="flex-1 max-w-9xl mx-auto px-2 sm:px-4 lg:px-6 py-1">
            <!-- Controls Section -->
            <div class="bg-white rounded-lg shadow-sm p-3 mb-4 border border-gray-100">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <!-- Search Input -->
                    <div class="md:col-span-5 relative">
                        <label for="search" class="block text-xs font-medium text-gray-700 mb-0.5">Search</label>
                        <div class="relative">
                            <span
                                class="material-icons absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                                search
                            </span>
                            <input id="search" v-model="searchQuery" type="text"
                                placeholder="Search by name or description..." class="w-full pl-8 pr-3 py-1.5 border rounded-md focus:ring-1 focus:ring-blue-500 
                      focus:border-blue-500 outline-none transition-all text-sm" />
                            <button v-if="searchQuery" @click="searchQuery = ''"
                                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                title="Clear Search">
                                <span class="material-icons text-base">clear</span>
                            </button>
                        </div>
                    </div>

                    <!-- Filter Dropdown -->
                    <div class="md:col-span-3">
                        <label for="filter" class="block text-xs font-medium text-gray-700 mb-0.5">Filter Type</label>
                        <div class="relative">
                            <span
                                class="material-icons absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-base">
                                filter_list
                            </span>
                            <select id="filter" v-model="filterType" class="w-full pl-8 pr-7 py-1.5 border rounded-md appearance-none focus:ring-1 
                      focus:ring-blue-500 focus:border-blue-500 outline-none text-sm">
                                <option value="">All Types</option>
                                <option value="Earnings">Earnings</option>
                                <option value="Deductions">Deductions</option>
                                <option value="Recurring Deductions">Recurring Deductions</option>
                            </select>
                            <span
                                class="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base">
                                arrow_drop_down
                            </span>
                        </div>
                    </div>

                    <!-- View Toggle -->
                    <div class="md:col-span-4">
                        <label class="block text-xs font-medium text-gray-700 mb-0.5">View</label>
                        <div class="flex rounded-md bg-gray-100 p-0.5 shadow-inner">
                            <button v-for="tab in ['payheads', 'employees']" :key="tab" @click="activeTab = tab"
                                class="flex-1 px-3 py-1.5 rounded-sm text-xs font-medium transition-all"
                                :class="activeTab === tab ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'">
                                <div class="flex items-center justify-center gap-1">
                                    <span class="material-icons text-xs">
                                        {{ tab === 'payheads' ? 'payments' : 'people' }}
                                    </span>
                                    {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons Section (Always Visible) -->
            <div v-if="!isLoading" class="mb-4 flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
                <h2 class="text-base font-medium text-gray-900">
                    {{ activeTab === 'payheads' ? 'Pay Heads' : 'Employees' }}
                </h2>
                <div class="flex items-center space-x-2">
                    <button v-if="activeTab === 'payheads'" @click="showAddModal = true" class="inline-flex items-center px-2 py-0.5 bg-blue-600 text-white rounded-sm 
                        text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-1 
                        focus:ring-offset-1 focus:ring-blue-500 transition-all shadow-sm transform hover:scale-105">
                        <span class="material-icons text-xs mr-1">add</span>
                        New Pay Head
                    </button>
                    <button v-if="activeTab === 'payheads'" @click="showRecurringDeductionModal = true" class="inline-flex items-center px-2 py-0.5 bg-green-600 text-white rounded-sm 
                        text-xs font-medium hover:bg-green-700 focus:outline-none focus:ring-1 
                        focus:ring-offset-1 focus:ring-green-500 transition-all shadow-sm transform hover:scale-105">
                        <span class="material-icons text-xs mr-1">repeat</span>
                        Add Recurring Deduction
                    </button>
                    <!-- Temporary Test Button -->
                    <button v-if="activeTab === 'employees'" @click="testOpenAddPayheadModal"
                        class="inline-flex items-center px-2 py-0.5 bg-purple-600 text-white rounded-sm 
                        text-xs font-medium hover:bg-purple-700 focus:outline-none focus:ring-1 
                        focus:ring-offset-1 focus:ring-purple-500 transition-all shadow-sm transform hover:scale-105">
                        <span class="material-icons text-xs mr-1">bug_report</span>
                        Test Add Payhead Modal
                    </button>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="isLoading" class="bg-white rounded-lg shadow-sm flex justify-center items-center p-10">
                <div class="flex flex-col items-center">
                    <div class="loader ease-linear rounded-full border-2 border-t-2 border-gray-200 h-8 w-8 mb-2"></div>
                    <h2 class="text-center text-gray-600 text-base font-semibold">Loading...</h2>
                    <p class="w-full text-center text-gray-500 text-xs">Please wait while we fetch the data</p>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="(activeTab === 'payheads' && filteredPayHeads.length === 0) ||
                (activeTab === 'employees' && filteredEmployees.length === 0)"
                class="bg-white rounded-lg shadow-sm border border-gray-100">
                <div class="flex flex-col items-center justify-center py-8 px-3 sm:px-4 lg:px-6">
                    <div class="rounded-full bg-blue-100 p-2 mb-2">
                        <span class="material-icons text-blue-600 text-lg">search_off</span>
                    </div>
                    <h3 class="text-base font-medium text-gray-900">No results found</h3>
                    <p class="mt-1 text-gray-500 text-center max-w-sm text-xs">
                        We couldn't find any {{ activeTab }} that match your search criteria. Try adjusting your filters
                        or search terms.
                    </p>
                    <button @click="resetFilters"
                        class="mt-2 p-1.5 rounded-sm text-gray-700 hover:text-gray-900 bg-white border border-gray-300 shadow-sm 
                   focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 transition-all transform hover:scale-105"
                        title="Reset Filters">
                        <span class="material-icons text-base">refresh</span>
                    </button>
                </div>
            </div>

            <!-- Data Table Section -->
            <div v-else class="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                <!-- Table Header (Only show item count here) -->
                <div v-if="activeTab === 'payheads'" class="px-4 py-2 border-b bg-gray-50">
                    <div class="text-xs text-gray-500">
                        Showing {{ filteredPayHeads.length }} {{ filteredPayHeads.length === 1 ? 'item' : 'items' }}
                    </div>
                </div>

                <!-- Table Content -->
                <div class="overflow-x-auto">
                    <component :is="activeTab === 'payheads' ? 'PayHeadTable' : 'EmployeePayrollTable'"
                        :payHeads="filteredPayHeads" :employees="paginatedEmployees" @update="showUpdatePayHeadModal"
                        @delete="confirmDeletePayHead" @addPayhead="openAddPayheadModal" />
                </div>

                <!-- Pagination -->
                <div v-if="activeTab === 'employees' && totalPages > 1"
                    class="flex items-center justify-between px-4 py-2 bg-gray-50 border-t">
                    <div class="text-xs text-gray-700">
                        Showing <span class="font-medium">{{ ((currentPage - 1) * itemsPerPage) + 1 }}</span> to
                        <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredEmployees.length)
                        }}</span> of
                        <span class="font-medium">{{ filteredEmployees.length }}</span> entries
                    </div>

                    <div class="flex items-center space-x-1">
                        <button @click="prevPage" :disabled="currentPage === 1"
                            class="p-1 rounded-md hover:bg-blue-100 transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                            :class="currentPage === 1 ? 'text-gray-400' : 'text-gray-700'" title="Previous Page">
                            <span class="material-icons text-base">chevron_left</span>
                        </button>

                        <div class="flex items-center gap-0.5">
                            <template v-for="page in displayedPages" :key="page">
                                <button v-if="typeof page === 'number'" @click="currentPage = page"
                                    class="min-w-[24px] h-6 rounded-md text-xs font-medium transition-all"
                                    :class="currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-blue-100 text-gray-700'">
                                    {{ page }}
                                </button>
                                <span v-else-if="page === '...'" class="px-1 text-gray-500 text-xs">...</span>
                            </template>
                        </div>

                        <button @click="nextPage" :disabled="currentPage === totalPages"
                            class="p-1 rounded-md hover:bg-blue-100 transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                            :class="currentPage === totalPages ? 'text-gray-400' : 'text-gray-700'" title="Next Page">
                            <span class="material-icons text-base">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <!-- Modals -->
        <transition name="modal-fade">
            <PayHeadModal v-if="showAddModal" :payHead="newPayHead" title="Add New Pay Head"
                @close="showAddModal = false" @save="addPayHead" />
        </transition>

        <transition name="modal-fade">
            <PayHeadModal v-if="showUpdateModal" :payHead="selectedPayHead" :isUpdate="true" title="Update Pay Head"
                @close="showUpdateModal = false" @save="updatePayHead" />
        </transition>

        <transition name="modal-fade">
            <AddPayheadModal v-if="showAddPayheadModal" :availablePayheads="availablePayheads"
                :selectedEmployeePayheads="selectedEmployeePayheads" :selectedEmployee="selectedEmployee"
                :totalPayableSalary="totalPayableSalary" @close="showAddPayheadModal = false" @save="savePayheads"
                @addPayhead="addPayheadToEmployee" @removePayhead="removePayheadFromEmployee"
                @updatePayhead="updatePayheadInEmployee" />
        </transition>

        <transition name="modal-fade">
            <RecurringDeductionModal v-if="showRecurringDeductionModal"
                :availableDeductions="filteredPayHeads.filter(p => p.type === 'Deductions')" :employees="employees"
                @close="showRecurringDeductionModal = false" @save="saveRecurringDeductions" />
        </transition>

        <!-- Toast Notifications -->
        <div class="fixed bottom-2 right-2 z-50 space-y-2">
            <TransitionGroup enter-active-class="transform ease-out duration-300 transition"
                enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
                enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
                leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100"
                leave-to-class="opacity-0" move-class="transition duration-500">
                <div v-if="statusMessage" :key="statusMessage" class="max-w-xs w-full bg-white rounded-md shadow-lg pointer-events-auto
                ring-1 ring-black ring-opacity-5 overflow-hidden">
                    <div class="p-2">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <span class="material-icons text-base"
                                    :class="statusMessage.includes('success') ? 'text-green-500' : 'text-red-500'">
                                    {{ statusMessage.includes('success') ? 'check_circle' : 'error' }}
                                </span>
                            </div>
                            <div class="ml-2 flex-1">
                                <p class="text-xs font-medium text-gray-900">
                                    {{ statusMessage }}
                                </p>
                            </div>
                            <button @click="statusMessage = ''" class="ml-2 flex-shrink-0 rounded-sm text-gray-400 hover:text-gray-500 
                      focus:outline-none focus:ring-1 focus:ring-blue-500" title="Close Notification">
                                <span class="material-icons text-base">close</span>
                            </button>
                        </div>
                    </div>
                </div>
            </TransitionGroup>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import PayHeadModal from './partials/payheads/PayHeadModal.vue'; // Corrected import
import PayHeadTable from './partials/payheads/PayHeadTable.vue';
import EmployeePayrollTable from './partials/payheads/EmployeePayrollTable.vue';
import AddPayheadModal from './partials/payheads/AddPayheadModal.vue';
import RecurringDeductionModal from './partials/payheads/RecurringDeductionModal.vue';

export default {
    name: 'ManagePayHeads',
    components: {
        PayHeadModal,
        PayHeadTable,
        EmployeePayrollTable,
        AddPayheadModal,
        RecurringDeductionModal,
    },

    data() {
        return {
            payHeads: [],
            employees: [],
            newPayHead: {
                name: '',
                amount: 0,
                type: 'Earnings',
                description: '',
                isRecurring: false,
                appliedThisCycle: false,
            },
            selectedPayHead: {
                id: '',
                name: '',
                amount: 0,
                type: 'Earnings',
                description: '',
                isRecurring: false,
                appliedThisCycle: false,
            },
            showAddModal: false,
            showUpdateModal: false,
            showAddPayheadModal: false,
            showRecurringDeductionModal: false,
            selectedEmployee: null,
            selectedEmployeePayheads: [],
            availablePayheads: [],
            statusMessage: '',
            searchQuery: '',
            filterType: '',
            activeTab: 'payheads',
            currentPage: 1,
            itemsPerPage: 10,
            isLoading: true, // Start with loading true to show loading state initially
        };
    },

    computed: {
        filteredPayHeads() {
            let filtered = [...this.payHeads || []]; // Fallback to empty array
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(p =>
                    (p.name || '').toLowerCase().includes(query) ||
                    (p.description || '').toLowerCase().includes(query)
                );
            }
            if (this.filterType) {
                filtered = filtered.filter(p =>
                    p.type === this.filterType ||
                    (this.filterType === 'Recurring Deductions' && p.isRecurring)
                );
            }
            return filtered;
        },

        filteredEmployees() {
            let filtered = [...this.employees || []]; // Fallback to empty array
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(e =>
                    (e.name || '').toLowerCase().includes(query) ||
                    (e.position || '').toLowerCase().includes(query)
                );
            }
            if (this.filterType) {
                filtered = filtered.filter(e => {
                    const earnings = this.calculateEarnings(e.payheads || []);
                    const deductions = this.calculateDeductions(e.payheads || []);
                    const recurringDeductions = this.calculateRecurringDeductions(e.payheads || []);
                    if (this.filterType === 'Earnings') return earnings > 0;
                    if (this.filterType === 'Deductions') return deductions > 0;
                    if (this.filterType === 'Recurring Deductions') return recurringDeductions > 0;
                    return true;
                });
            }
            return filtered;
        },

        paginatedEmployees() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return this.filteredEmployees.slice(start, end);
        },

        totalPages() {
            return Math.ceil(this.filteredEmployees.length / this.itemsPerPage) || 1;
        },

        displayedPages() {
            const total = this.totalPages;
            const current = this.currentPage;
            const pages = [];

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
        },

        totalPayableSalary() {
            if (!this.selectedEmployee) return 0;
            const earnings = this.calculateEarnings(this.selectedEmployeePayheads || []);
            const deductions = this.calculateDeductions(this.selectedEmployeePayheads || []);
            const recurringDeductions = this.calculateRecurringDeductions(this.selectedEmployeePayheads || []);
            return (this.selectedEmployee.salary || 0) + earnings - deductions - recurringDeductions;
        },
    },

    methods: {
        async fetchPayHeads() {
            this.isLoading = true;
            this.statusMessage = '';
            try {
                const response = await axios.get('http://localhost:7777/api/payheads', {
                    headers: { 'user-role': 'admin' },
                });
                this.payHeads = (response.data || []).map(item => ({
                    ...item,
                    amount: Number(item.amount || 0),
                    isRecurring: item.isRecurring || false,
                    appliedThisCycle: item.appliedThisCycle || false,
                }));
                this.showSuccessMessage('Pay heads loaded successfully!');
            } catch (error) {
                console.error('Error fetching pay heads:', error);
                this.showErrorMessage('Failed to load pay heads. Please try again.');
                this.payHeads = []; // Reset to empty array on error
            } finally {
                this.isLoading = false;
            }
        },

        async fetchEmployees() {
            this.isLoading = true;
            this.statusMessage = '';
            try {
                const response = await axios.get('http://localhost:7777/api/employees', {
                    headers: { 'user-role': 'admin' },
                });

                this.employees = (response.data || []).map(emp => ({
                    ...emp,
                    name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown Employee',
                    position: emp.position || 'N/A',
                    salary: Number(emp.salary || 0),
                    payheads: (emp.payheads || []).map(ph => ({
                        ...ph,
                        amount: Number(ph.amount || 0),
                        isRecurring: ph.isRecurring || false,
                        appliedThisCycle: ph.appliedThisCycle || false,
                        uniqueId: ph.uniqueId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    })),
                    totalEarnings: this.calculateEarnings(emp.payheads || []),
                    totalDeduction: this.calculateDeductions(emp.payheads || []),
                    totalRecurringDeduction: this.calculateRecurringDeductions(emp.payheads || []),
                    totalSalary: (Number(emp.salary || 0)) +
                        this.calculateEarnings(emp.payheads || []) -
                        this.calculateDeductions(emp.payheads || []) -
                        this.calculateRecurringDeductions(emp.payheads || []),
                }));
                this.showSuccessMessage('Employees loaded successfully!');
            } catch (error) {
                console.error('Error fetching employees:', error);
                this.showErrorMessage('Failed to load employees. Please try again.');
                this.employees = []; // Reset to empty array on error
            } finally {
                this.isLoading = false;
            }
        },

        async initializeData() {
            this.isLoading = true;
            try {
                await Promise.all([this.fetchPayHeads(), this.fetchEmployees()]);
            } catch (error) {
                console.error('Error initializing data:', error);
            } finally {
                this.isLoading = false;
            }
        },

        async addPayHead(payHead) {
            try {
                this.isLoading = true;
                const payload = {
                    ...payHead,
                    amount: Number(payHead.amount || 0),
                    isRecurring: payHead.isRecurring || false,
                    appliedThisCycle: false,
                };
                const response = await axios.post('http://localhost:7777/api/payheads', payload, {
                    headers: { 'user-role': 'admin' },
                });
                this.payHeads.push({ ...response.data, amount: Number(response.data.amount || 0) });
                this.showAddModal = false;
                this.showSuccessMessage('Pay head added successfully!');
                await this.fetchEmployees(); // Refresh employees to reflect changes
            } catch (error) {
                console.error('Error adding pay head:', error);
                this.showErrorMessage('Failed to add pay head.');
            } finally {
                this.isLoading = false;
            }
        },

        showUpdatePayHeadModal(payHead) {
            this.selectedPayHead = { ...payHead, amount: Number(payHead.amount || 0) };
            this.showUpdateModal = true;
        },

        async updatePayHead(updatedPayHead) {
            try {
                this.isLoading = true;
                const payload = {
                    ...updatedPayHead,
                    amount: Number(updatedPayHead.amount || 0),
                    isRecurring: updatedPayHead.isRecurring || false,
                    appliedThisCycle: updatedPayHead.appliedThisCycle || false,
                };
                const response = await axios.put(
                    `http://localhost:7777/api/payheads/${updatedPayHead.id}`,
                    payload,
                    { headers: { 'user-role': 'admin' } }
                );
                const index = this.payHeads.findIndex(ph => ph.id === updatedPayHead.id);
                if (index !== -1) {
                    this.payHeads.splice(index, 1, { ...response.data, amount: Number(response.data.amount || 0) });
                    this.showUpdateModal = false;
                    this.showSuccessMessage('Pay head updated successfully!');
                    await this.fetchEmployees(); // Refresh employees to reflect changes
                }
            } catch (error) {
                console.error('Error updating pay head:', error);
                this.showErrorMessage('Failed to update pay head.');
            } finally {
                this.isLoading = false;
            }
        },

        async confirmDeletePayHead(id) {
            if (confirm('Are you sure you want to delete this pay head?')) {
                await this.deletePayHead(id);
            }
        },

        async deletePayHead(id) {
            try {
                this.isLoading = true;
                await axios.delete(`http://localhost:7777/api/payheads/${id}`, {
                    headers: { 'user-role': 'admin' },
                });
                this.payHeads = this.payHeads.filter(payHead => payHead.id !== id);
                this.showSuccessMessage('Pay head deleted successfully!');
                await this.fetchEmployees(); // Refresh employees to reflect changes
            } catch (error) {
                console.error('Error deleting pay head:', error);
                this.showErrorMessage('Failed to delete pay head.');
            } finally {
                this.isLoading = false;
            }
        },

        openAddPayheadModal(employee) {
            console.log('Opening AddPayheadModal for employee:', employee);
            this.selectedEmployee = { ...employee, salary: Number(employee.salary || 0) };
            this.selectedEmployeePayheads = [...(employee.payheads || [])];
            this.availablePayheads = [...this.payHeads];
            this.showAddPayheadModal = true;
            console.log('showAddPayheadModal:', this.showAddPayheadModal);
        },

        testOpenAddPayheadModal() {
            const employee = this.employees[0] || {
                id: 'test-id',
                name: 'Test Employee',
                position: 'Developer',
                salary: 50000,
                payheads: [],
            };
            this.openAddPayheadModal(employee);
        },

        addPayheadToEmployee(payhead) {
            const newPayhead = {
                ...payhead,
                amount: Number(payhead.amount || 0),
                uniqueId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                appliedThisCycle: payhead.isRecurring ? false : undefined,
            };
            this.selectedEmployeePayheads.push(newPayhead);
        },

        removePayheadFromEmployee(payhead) {
            this.selectedEmployeePayheads = this.selectedEmployeePayheads.filter(
                p => p.uniqueId !== payhead.uniqueId
            );
        },

        updatePayheadInEmployee(updatedPayhead) {
            const index = this.selectedEmployeePayheads.findIndex(
                p => p.uniqueId === updatedPayhead.uniqueId
            );
            if (index !== -1) {
                this.selectedEmployeePayheads.splice(index, 1, {
                    ...updatedPayhead,
                    amount: Number(updatedPayhead.amount || 0),
                    appliedThisCycle: updatedPayhead.isRecurring ? updatedPayhead.appliedThisCycle : undefined,
                });
            }
        },

        async savePayheads() {
            try {
                this.isLoading = true;
                const payheadsToSave = this.selectedEmployeePayheads.map(ph => ({
                    _id: ph._id,
                    id: ph.id,
                    name: ph.name,
                    amount: Number(ph.amount || 0),
                    type: ph.type,
                    isRecurring: ph.isRecurring || false,
                    appliedThisCycle: ph.isRecurring ? ph.appliedThisCycle || false : undefined,
                }));

                const payheadsForBackend = payheadsToSave.map(ph => ph._id).filter(id => id); // Only send valid _ids

                const updatedEmployee = {
                    ...this.selectedEmployee,
                    payheads: payheadsForBackend,
                    totalEarnings: this.calculateEarnings(payheadsToSave),
                    totalDeduction: this.calculateDeductions(payheadsToSave),
                    totalRecurringDeduction: this.calculateRecurringDeductions(payheadsToSave),
                    totalSalary: (Number(this.selectedEmployee.salary || 0)) +
                        this.calculateEarnings(payheadsToSave) -
                        this.calculateDeductions(payheadsToSave) -
                        this.calculateRecurringDeductions(payheadsToSave),
                };

                await axios.put(
                    `http://localhost:7777/api/employees/${this.selectedEmployee.id}`,
                    updatedEmployee,
                    { headers: { 'user-role': 'admin' } }
                );

                const employeeIndex = this.employees.findIndex(
                    e => e.id === this.selectedEmployee.id
                );
                if (employeeIndex !== -1) {
                    this.employees.splice(employeeIndex, 1, {
                        ...updatedEmployee,
                        payheads: payheadsToSave,
                    });
                }

                this.showAddPayheadModal = false;
                this.showSuccessMessage('Payheads saved successfully!');
            } catch (error) {
                console.error('Error saving payheads:', error);
                this.showErrorMessage('Failed to save payheads.');
            } finally {
                this.isLoading = false;
            }
        },

        async saveRecurringDeductions(selectedDeductions, selectedEmployees) {
            try {
                this.isLoading = true;
                for (const employee of selectedEmployees) {
                    const existingPayheads = this.employees.find(e => e.id === employee.id)?.payheads || [];
                    const updatedPayheads = [...existingPayheads];

                    for (const deduction of selectedDeductions) {
                        if (!updatedPayheads.some(ph => ph.id === deduction.id && ph.isRecurring)) {
                            const payheadResponse = await axios.get(`http://localhost:7777/api/payheads`, {
                                headers: { 'user-role': 'admin' },
                                params: { id: deduction.id }
                            });

                            const payhead = payheadResponse.data.find(ph => ph.id === deduction.id);
                            if (!payhead) {
                                throw new Error(`Payhead with id ${deduction.id} not found`);
                            }

                            updatedPayheads.push({
                                _id: payhead._id,
                                id: deduction.id,
                                name: deduction.name,
                                amount: Number(deduction.amount || 0),
                                type: deduction.type,
                                isRecurring: true,
                                appliedThisCycle: false,
                                uniqueId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            });
                        }
                    }

                    const payheadsForBackend = updatedPayheads.map(ph => ph._id).filter(id => id);

                    const updatedEmployee = {
                        ...employee,
                        payheads: payheadsForBackend,
                        totalEarnings: this.calculateEarnings(updatedPayheads),
                        totalDeduction: this.calculateDeductions(updatedPayheads),
                        totalRecurringDeduction: this.calculateRecurringDeductions(updatedPayheads),
                        totalSalary: (Number(employee.salary || 0)) +
                            this.calculateEarnings(updatedPayheads) -
                            this.calculateDeductions(updatedPayheads) -
                            this.calculateRecurringDeductions(updatedPayheads),
                    };

                    await axios.put(
                        `http://localhost:7777/api/employees/${employee.id}`,
                        updatedEmployee,
                        { headers: { 'user-role': 'admin' } }
                    );

                    const employeeIndex = this.employees.findIndex(e => e.id === employee.id);
                    if (employeeIndex !== -1) {
                        this.employees.splice(employeeIndex, 1, {
                            ...updatedEmployee,
                            payheads: updatedPayheads,
                        });
                    }
                }
                this.showRecurringDeductionModal = false;
                this.showSuccessMessage('Recurring deductions saved successfully!');
            } catch (error) {
                console.error('Error saving recurring deductions:', error);
                this.showErrorMessage('Failed to save recurring deductions.');
            } finally {
                this.isLoading = false;
            }
        },

        calculateEarnings(payheads = []) {
            return payheads
                .filter(p => p.type === 'Earnings')
                .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
        },

        calculateDeductions(payheads = []) {
            return payheads
                .filter(p => p.type === 'Deductions' && !p.isRecurring)
                .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
        },

        calculateRecurringDeductions(payheads = []) {
            return payheads
                .filter(p => p.isRecurring && !p.appliedThisCycle)
                .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
        },

        prevPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
            }
        },

        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
            }
        },

        resetFilters() {
            this.searchQuery = '';
            this.filterType = '';
        },

        showSuccessMessage(message) {
            this.statusMessage = message;
            setTimeout(() => { this.statusMessage = ''; }, 3000);
        },

        showErrorMessage(message) {
            this.statusMessage = message;
            setTimeout(() => { this.statusMessage = ''; }, 3000);
        },

        resetPayheadsCycle() {
            this.payHeads = this.payHeads.map(ph => ({
                ...ph,
                appliedThisCycle: ph.isRecurring ? false : ph.appliedThisCycle,
            }));
            this.employees = this.employees.map(emp => ({
                ...emp,
                payheads: (emp.payheads || []).map(ph => ({
                    ...ph,
                    appliedThisCycle: ph.isRecurring ? false : ph.appliedThisCycle,
                })),
            }));
        },
    },

    created() {
        this.initializeData(); // Use a single method to handle both fetches
        setInterval(() => this.resetPayheadsCycle(), 24 * 60 * 60 * 1000);
    },
};
</script>

<style scoped>
/* Modal animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

/* Loader animation */
.loader {
    border-top-color: #3b82f6;
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Scrollbar styling */
::-webkit-scrollbar {
    width: 4px;
    height: 4px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 2px;
}

::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
    background: #555;
}

/* Cross-browser scrollbar support */
.scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #888 #f1f1f1;
}

.scrollbar::-webkit-scrollbar {
    width: 4px;
    height: 4px;
}

.scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 2px;
}

.scrollbar::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 2px;
}

.scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
}
</style>