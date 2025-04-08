<script>
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store.js';
import { BASE_API_URL } from '@/utils/constants.js';
import {
    calculateTotalEarnings,
    calculateTotalDeductions,
    calculateNetSalary,
    calculateRequestNetSalary,
    calculateNewEmployeeNetSalary,
    calculateSSSContribution,
    calculatePhilHealthContribution,
    calculatePagIBIGContribution,
    calculateWithholdingTax,
} from '@/utils/calculations.js';
import EmployeeDetailsModal from './partials/EmployeeDetailsModal.vue';
import PendingRequestModal from './partials/PendingRequestModal.vue';
import AddEmployeeModal from './partials/AddEmployeeModal.vue';
import EditEmployeeModal from './partials/EditEmployeeModal.vue';
import PositionModal from './partials/PositionModal.vue';
import EditPositionModal from './partials/EditPositionModal.vue';
import DeletePositionModal from './partials/DeletePositionModal.vue';
import DeleteEmployeeModal from './partials/DeleteEmployeeModal.vue';
import Modal from '@/components/Modal.vue';

export default {
    data() {
        return {
            employees: [],
            pendingRequests: [],
            adminPositions: [],
            selectedEmployee: {},
            selectedRequest: {},
            selectedPosition: {},
            showRequestModal: false,
            showEditModal: false,
            showDetailsModal: false,
            showDeleteModal: false,
            showAddModal: false,
            showPositionModal: false,
            showEditPositionModal: false,
            showDeletePositionModal: false,
            isLoading: false,
            isAddingPosition: false,
            searchQuery: '',
            positionFilter: '',
            currentPage: 1,
            itemsPerPage: 10,
            statusMessage: '',
            newEmployee: {
                empNo: '',
                firstName: '',
                middleName: '',
                lastName: '',
                position: '',
                salary: 0,
                hourlyRate: 0,
                email: '',
                contactInfo: '',
                civilStatus: 'Single',
                hireDate: new Date().toISOString().slice(0, 10),
                role: 'employee',
                sss: '',
                philhealth: '',
                pagibig: '',
                tin: '',
                earnings: { travelExpenses: 0, otherEarnings: 0 },
                username: '',
                password: '',
                positionHistory: [],
            },
            newPosition: { name: '', salary: 0 },
            editPositionData: { id: null, name: '', salary: 0 },
        };
    },
    components: {
        EmployeeDetailsModal,
        PendingRequestModal,
        AddEmployeeModal,
        EditEmployeeModal,
        PositionModal,
        EditPositionModal,
        DeletePositionModal,
        DeleteEmployeeModal,
        Modal,
    },
    setup() {
        const authStore = useAuthStore();
        return { authStore };
    },
    computed: {
        filteredEmployees() {
            return this.employees.filter(emp =>
                `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(this.searchQuery.toLowerCase()) &&
                (this.positionFilter ? emp.position === this.positionFilter : true)
            );
        },
        paginatedEmployees() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            return this.filteredEmployees.slice(start, start + this.itemsPerPage);
        },
        totalPages() {
            return Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
        },
        sortedPositionHistory() {
            if (!this.selectedEmployee?.positionHistory || this.selectedEmployee.positionHistory.length === 0) {
                return [{
                    position: this.selectedEmployee.position || 'N/A',
                    salary: this.selectedEmployee.salary || 0,
                    startDate: this.selectedEmployee.hireDate || new Date().toISOString().slice(0, 10),
                    endDate: null,
                }];
            }
            return [...this.selectedEmployee.positionHistory].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        },
    },
    watch: {
        'newEmployee.salary'(newSalary) {
            this.newEmployee.hourlyRate = newSalary ? Number((newSalary / (8 * 22)).toFixed(2)) : 0;
        },
    },
    mounted() {
        this.fetchEmployees();
        this.fetchPendingRequests();
        this.fetchPositions();
    },
    methods: {
        // Expose imported functions to the template
        calculateNetSalary,
        calculateRequestNetSalary,
        calculateNewEmployeeNetSalary,
        calculateTotalEarnings,
        calculateTotalDeductions,
        calculateSSSContribution,
        calculatePhilHealthContribution,
        calculatePagIBIGContribution,
        calculateWithholdingTax,

        async fetchEmployees() {
            this.isLoading = true;
            try {
                const response = await axios.get(`${BASE_API_URL}/api/employees`, {
                    headers: {
                        Authorization: `Bearer ${this.authStore.accessToken}`,
                        'user-role': this.authStore.userRole,
                    },
                });
                this.employees = (response.data || [])
                    .filter(emp => emp.status === 'approved')
                    .map(emp => ({
                        ...emp,
                        id: emp.id,
                        _id: emp._id,
                        hourlyRate: emp.hourlyRate || Number((emp.salary / (8 * 22)).toFixed(2)), // Fix here
                        empNo: emp.empNo || `EMP-${String(emp.id).padStart(4, '0')}`,
                        hireDate: new Date(emp.hireDate).toISOString().slice(0, 10),
                        payheads: Array.isArray(emp.payheads) ? emp.payheads : [],
                        positionHistory: Array.isArray(emp.positionHistory) ? emp.positionHistory : [{
                            position: emp.position || 'N/A',
                            salary: emp.salary || 0,
                            startDate: new Date(emp.hireDate).toISOString().slice(0, 10),
                            endDate: null,
                        }],
                        originalPosition: emp.position,
                    }));
            } catch (error) {
                console.error('Error fetching employees:', error);
                this.showErrorMessage('Failed to load employees');
            } finally {
                this.isLoading = false;
            }
        },

        async fetchPendingRequests() {
            this.isLoading = true;
            try {
                const response = await axios.get(`${BASE_API_URL}/api/employees/pending-requests`, {
                    headers: {
                        Authorization: `Bearer ${this.authStore.accessToken}`,
                        'user-role': this.authStore.userRole,
                    },
                });
                this.pendingRequests = (response.data || []).map(req => ({ ...req, _id: req._id }));
            } catch (error) {
                console.error('Error fetching pending requests:', error);
                this.showErrorMessage('Failed to load pending requests');
            } finally {
                this.isLoading = false;
            }
        },

        async fetchPositions() {
            try {
                const response = await axios.get(`${BASE_API_URL}/api/positions`, {
                    headers: {
                        Authorization: `Bearer ${this.authStore.accessToken}`,
                        'user-role': this.authStore.userRole,
                    },
                });
                this.adminPositions = response.data.map(pos => ({
                    id: pos.id || pos._id,
                    name: pos.name,
                    salary: pos.salary
                })) || [];
            } catch (error) {
                console.error('Error fetching positions:', error);
                this.showErrorMessage('Failed to load positions');
            }
        },

        async refreshAll() {
            await Promise.all([this.fetchEmployees(), this.fetchPendingRequests(), this.fetchPositions()]);
            this.showSuccessMessage('Data refreshed successfully');
        },

        async refreshPendingRequests() {
            await this.fetchPendingRequests();
            this.showSuccessMessage('Pending requests refreshed successfully');
        },

        viewEmployeeDetails(employee) {
            this.selectedEmployee = {
                ...employee,
                hireDate: new Date(employee.hireDate).toISOString().slice(0, 10),
            };
            this.showDetailsModal = true;
        },

        openEditModal(employee) {
            this.selectedEmployee = {
                ...employee,
                hireDate: new Date(employee.hireDate).toISOString().slice(0, 10),
                earnings: {
                    travelExpenses: employee.earnings?.travelExpenses || 0,
                    otherEarnings: employee.earnings?.otherEarnings || 0,
                },
                positionHistory: Array.isArray(employee.positionHistory) ? employee.positionHistory : [{
                    position: employee.position || 'N/A',
                    salary: employee.salary || 0,
                    startDate: new Date(employee.hireDate).toISOString().slice(0, 10),
                    endDate: null,
                }],
            };
            this.showEditModal = true;
        },

        handleUpdateEmployee(updatedEmployee) {
            const index = this.employees.findIndex(emp => emp._id === updatedEmployee._id);
            if (index !== -1) {
                this.employees[index] = { ...updatedEmployee };
            }
            this.showEditModal = false;
            this.showSuccessMessage('Employee updated successfully');
        },

        confirmMoveToTrash(employee) {
            this.selectedEmployee = employee;
            this.showDeleteModal = true;
        },

        handleEmployeeDeleted(employeeId) {
            this.employees = this.employees.filter(emp => emp._id !== employeeId);
            this.showDeleteModal = false;
            this.showSuccessMessage('Employee moved to trash successfully');
        },

        viewRequestInfo(request) {
            this.selectedRequest = {
                ...request,
                _id: request._id,
                earnings: {
                    travelExpenses: request.earnings?.travelExpenses || 0,
                    otherEarnings: request.earnings?.otherEarnings || 0
                },
                hireDate: request.hireDate ? new Date(request.hireDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
            };
            this.showRequestModal = true;
        },

        handleRequestSaved(updatedRequest) {
            const index = this.pendingRequests.findIndex(req => req._id === updatedRequest._id);
            if (index !== -1) {
                this.pendingRequests[index] = { ...updatedRequest };
            }
            this.showSuccessMessage('Request updated successfully');
        },

        handleRequestApproved(approvedEmployee) {
            this.pendingRequests = this.pendingRequests.filter(req => req._id !== approvedEmployee._id);
            this.employees.push(approvedEmployee);
            this.showRequestModal = false;
            this.showSuccessMessage('Employee approved successfully');
        },

        handleRequestRejected(requestId) {
            this.pendingRequests = this.pendingRequests.filter(req => req._id !== requestId);
            this.showRequestModal = false;
            this.showSuccessMessage('Application rejected successfully');
        },

        editPosition(position) {
            this.editPositionData = { id: position.id || position._id, name: position.name, salary: position.salary };
            this.showEditPositionModal = true;
        },

        handlePositionUpdated(updatedPosition) {
            const index = this.adminPositions.findIndex(pos => pos.id === updatedPosition.id || pos._id === updatedPosition.id);
            if (index !== -1) this.adminPositions[index] = { ...updatedPosition };
            this.showEditPositionModal = false;
            this.showSuccessMessage('Position updated successfully');
        },

        confirmDeletePosition(position) {
            this.selectedPosition = position;
            this.showDeletePositionModal = true;
        },

        async handlePositionDeleted(deletedPosition) {
            this.adminPositions = this.adminPositions.filter(pos => pos.id !== deletedPosition.id && pos._id !== deletedPosition._id);
            this.showDeletePositionModal = false;
            this.showSuccessMessage('Position deleted successfully');
            await this.fetchPositions();
        },

        handleAddSuccess(newEmployee) {
            this.employees.push({
                ...newEmployee,
                hourlyRate: newEmployee.hourlyRate || Number((newEmployee.salary / (8 * 22)).toFixed(2)),
            });
            this.showAddModal = false;
            this.resetNewEmployee();
            this.showSuccessMessage('Employee added successfully');
        },

        handlePositionCreated(newPosition) {
            this.adminPositions.push(newPosition);
            this.resetNewPosition();
            this.showSuccessMessage('Position created successfully');
        },

        updateSalaryFromPosition() {
            const selectedPosition = this.adminPositions.find(pos => pos.name === this.newEmployee.position);
            if (selectedPosition) {
                this.newEmployee.salary = selectedPosition.salary;
                this.newEmployee.hourlyRate = Number((selectedPosition.salary / (8 * 22)).toFixed(2));
            }
        },

        resetNewEmployee() {
            this.newEmployee = {
                empNo: '',
                firstName: '',
                middleName: '',
                lastName: '',
                position: '',
                salary: 0,
                hourlyRate: 0,
                email: '',
                contactInfo: '',
                sss: '',
                philhealth: '',
                pagibig: '',
                tin: '',
                hireDate: new Date().toISOString().slice(0, 10),
                earnings: { travelExpenses: 0, otherEarnings: 0 },
                username: '',
                password: '',
                positionHistory: [],
            };
        },

        resetNewPosition() {
            this.newPosition = { name: '', salary: 0 };
        },

        showSuccessMessage(message) {
            this.statusMessage = message;
            setTimeout(() => (this.statusMessage = ''), 3000);
        },

        showErrorMessage(message) {
            this.statusMessage = message;
            setTimeout(() => (this.statusMessage = ''), 3000);
        },
    },
};
</script>

<template>
    <div class="min-h-screen bg-gray-50 flex flex-col">
        <!-- Header -->
        <header class="bg-white shadow-sm p-3 flex justify-between items-center sticky top-0 z-20 rounded-lg">
            <h1 class="text-lg font-bold text-gray-800">Employee Management</h1>
            <div class="flex items-center gap-3">
                <input v-model="searchQuery" type="text" placeholder="Search employees..."
                    class="p-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48" />
                <button @click="refreshAll"
                    class="bg-indigo-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-indigo-700 transition flex items-center gap-1">
                    <span class="material-icons text-lg">refresh</span>
                    Refresh
                </button>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 py-2">
            <div class="mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
                <!-- Employee List -->
                <section class="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
                    <div class="p-4 flex justify-between items-center border-b border-gray-300">
                        <h2 class="text-lg font-semibold text-gray-800">Employee List</h2>
                        <div class="flex gap-2">
                            <button @click="showAddModal = true"
                                class="bg-green-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-green-700 transition flex items-center gap-1">
                                <span class="material-icons text-lg">add</span>
                                Add
                            </button>
                            <button @click="showPositionModal = true"
                                class="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-blue-700 transition flex items-center gap-1">
                                <span class="material-icons text-lg">work</span>
                                Positions
                            </button>
                            <select v-model="positionFilter"
                                class="p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500">
                                <option value="">All</option>
                                <option v-for="pos in adminPositions" :key="pos.name" :value="pos.name">{{ pos.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div v-if="isLoading" class="p-4 text-center text-gray-500 flex justify-center items-center">
                        <span class="material-icons animate-spin mr-1 text-lg">autorenew</span>
                        Loading...
                    </div>
                    <div v-else class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-2 font-semibold text-gray-600">Emp No</th>
                                    <th class="px-4 py-2 font-semibold text-gray-600">Name</th>
                                    <th class="px-4 py-2 font-semibold text-gray-600">Position</th>
                                    <th class="px-4 py-2 font-semibold text-gray-600">Hourly Rate</th>
                                    <th class="px-4 py-2 font-semibold text-gray-600">Net Salary</th>
                                    <th class="px-4 py-2 font-semibold text-gray-600 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                <tr v-for="employee in paginatedEmployees" :key="employee.id"
                                    class="hover:bg-gray-50 transition">
                                    <td class="px-4 py-2">{{ employee.empNo || 'N/A' }}</td>
                                    <td class="px-4 py-2">{{ (employee.firstName || '') + ' ' + (employee.lastName ||
                                        '') || 'N/A' }}</td>
                                    <td class="px-4 py-2">{{ employee.position || 'N/A' }}</td>
                                    <td class="px-4 py-2">
                                       ₱{{ (employee.hourlyRate && !isNaN(employee.hourlyRate) ? employee.hourlyRate : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                                    </td>
                                    <td class="px-4 py-2">
                                        ₱{{ (calculateNetSalary(employee) || 0).toLocaleString() }}
                                    </td>
                                    <td class="px-4 py-2 text-right flex justify-end gap-1">
                                        <button @click="viewEmployeeDetails(employee)"
                                            class="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-100">
                                            <span class="material-icons text-lg">visibility</span>
                                        </button>
                                        <button @click="openEditModal(employee)"
                                            class="text-yellow-600 hover:text-yellow-800 p-1 rounded-full hover:bg-yellow-100">
                                            <span class="material-icons text-lg">edit</span>
                                        </button>
                                        <button @click="confirmMoveToTrash(employee)"
                                            class="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100">
                                            <span class="material-icons text-lg">delete</span>
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="paginatedEmployees.length === 0">
                                    <td colspan="6" class="px-4 py-2 text-center text-gray-500">No employees found</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-if="!isLoading"
                        class="p-3 flex justify-between items-center border-t border-gray-300 text-sm">
                        <button @click="currentPage--" :disabled="currentPage === 1"
                            class="px-2 py-1 bg-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-300">Prev</button>
                        <span>Page {{ currentPage }} of {{ totalPages }}</span>
                        <button @click="currentPage++" :disabled="currentPage === totalPages"
                            class="px-2 py-1 bg-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-300">Next</button>
                    </div>
                </section>

                <!-- Pending Approvals -->
                <aside class="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div class="p-4 border-b border-gray-300 flex justify-between items-center">
                        <h2 class="text-lg font-semibold text-gray-800">Pending Approvals</h2>
                        <button @click="refreshPendingRequests"
                            class="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-100">
                            <span class="material-icons text-lg">refresh</span>
                        </button>
                    </div>
                    <div v-if="isLoading" class="p-4 text-center text-gray-500 flex justify-center items-center">
                        <span class="material-icons animate-spin mr-1 text-lg">autorenew</span>
                        Loading...
                    </div>
                    <div v-else class="divide-y divide-gray-100">
                        <div v-for="request in pendingRequests" :key="request.id"
                            class="p-3 hover:bg-gray-50 transition">
                            <div class="flex justify-between items-start mb-1">
                                <div>
                                    <h3 class="text-sm font-medium text-gray-900">
                                        {{ request.firstName }} {{ request.middleName }} {{ request.lastName }}
                                    </h3>
                                    <p class="text-xs text-gray-500">{{ request.position }}</p>
                                </div>
                                <span
                                    class="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
                            </div>
                            <div class="flex justify-end gap-1">
                                <button @click="viewRequestInfo(request)"
                                    class="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-100"
                                    title="View">
                                    <span class="material-icons text-lg">visibility</span>
                                </button>
                            </div>
                        </div>
                        <div v-if="pendingRequests.length === 0" class="p-3 text-center text-sm text-gray-500">No
                            pending approvals</div>
                    </div>
                </aside>
            </div>
        </main>

        <EmployeeDetailsModal :show="showDetailsModal" :employee="selectedEmployee" @close="showDetailsModal = false"
            @edit="openEditModal" />
        <PendingRequestModal :show="showRequestModal" :request="selectedRequest" :positions="adminPositions"
            @close="showRequestModal = false" @save="handleRequestSaved" @approve="handleRequestApproved"
            @reject="handleRequestRejected" />
        <AddEmployeeModal :show="showAddModal" :employee="newEmployee" :positions="adminPositions"
            @close="showAddModal = false" @add-success="handleAddSuccess" />
        <EditEmployeeModal :show="showEditModal" :employee="selectedEmployee" :positions="adminPositions"
            @close="showEditModal = false" @update="handleUpdateEmployee" />
        <PositionModal :show="showPositionModal" :positions="adminPositions" :newPosition="newPosition"
            @close="showPositionModal = false" @create="handlePositionCreated" @edit="editPosition"
            @delete="confirmDeletePosition" />
        <EditPositionModal :show="showEditPositionModal" :position="editPositionData"
            @close="showEditPositionModal = false" @update-success="handlePositionUpdated" />
        <DeletePositionModal :show="showDeletePositionModal" :position="selectedPosition"
            @close="showDeletePositionModal = false" @delete-success="handlePositionDeleted" />
        <DeleteEmployeeModal :show="showDeleteModal" :employee="selectedEmployee" @close="showDeleteModal = false"
            @delete="handleEmployeeDeleted" />

        <!-- Status Toast -->
        <div v-if="statusMessage" :class="statusMessage.includes('successfully') ? 'bg-green-500' : 'bg-red-500'"
            class="fixed bottom-4 right-4 p-3 text-white text-sm rounded-md shadow-lg animate-fade-in">
            {{ statusMessage }}
        </div>
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.material-icons {
    font-size: 18px;
}

input:focus:invalid,
select:focus:invalid {
    border-color: #ef4444;
    outline: 1px solid #ef4444;
}

.hover\:bg-gray-50:hover {
    background-color: #f9fafb;
}

.transition {
    transition: all 0.2s ease-in-out;
}
</style>
