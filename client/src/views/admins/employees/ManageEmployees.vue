<template>
    <div class="min-h-screen bg-gray-50 px-10 p-1">
        <div class="max-w-8xl flex gap-6">
            <!-- Left side - Employee List -->
            <div class="flex-1">
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="p-6 flex justify-between items-center">
                        <h2 class="text-xl font-bold text-gray-800">Employee List</h2>
                        <div class="space-x-2">
                            <input v-model="searchQuery" type="text" placeholder="Search employees..."
                                class="p-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            <button @click="refreshAll"
                                class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
                                :disabled="isLoading">
                                {{ isLoading ? 'Loading...' : 'Refresh' }}
                            </button>
                            <button @click="showAddModal = true"
                                class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200">
                                Add Employee
                            </button>
                            <button @click="showPositionModal = true"
                                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200">
                                Manage Positions
                            </button>
                            <router-link :to="{ name: 'employee-trash' }"
                                class="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition duration-200">
                                Trash
                            </router-link>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Employee ID</th>
                                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Name</th>
                                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Position</th>
                                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Hourly Rate</th>
                                    <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Net Salary</th>
                                    <th class="px-6 py-4 text-right text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                <tr v-for="employee in paginatedEmployees" :key="employee._id"
                                    class="hover:bg-gray-50 transition duration-200">
                                    <td class="px-6 py-4 text-sm text-gray-900">{{ employee.employeeIdNumber || 'N/A' }}
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-900">{{ employee.firstName }} {{
                                        employee.lastName }}</td>
                                    <td class="px-6 py-4 text-sm text-gray-900">{{ employee.position || 'N/A' }}</td>
                                    <td class="px-6 py-4 text-sm text-gray-900">₱{{ (employee.hourlyRate ||
                                        0).toLocaleString() }}</td>
                                    <td class="px-6 py-4 text-sm text-gray-900">₱{{
                                        calculateNetSalary(employee).toLocaleString() }}</td>
                                    <td class="px-6 py-4 text-right flex justify-end gap-3">
                                        <button @click="viewEmployeeDetails(employee)"
                                            class="text-indigo-600 hover:text-indigo-800">
                                            View
                                        </button>
                                        <button @click="editEmployee(employee)"
                                            class="text-yellow-600 hover:text-yellow-800">
                                            Edit
                                        </button>
                                        <button @click="confirmDelete(employee)"
                                            class="text-red-600 hover:text-red-800">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="paginatedEmployees.length === 0 && !isLoading">
                                    <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">No employees
                                        found.</td>
                                </tr>
                                <tr v-if="isLoading">
                                    <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-if="!isLoading" class="p-3 flex justify-between items-center border-t text-sm">
                        <button @click="currentPage--" :disabled="currentPage === 1"
                            class="px-2 py-1 bg-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-300">Prev</button>
                        <span>Page {{ currentPage }} of {{ totalPages }}</span>
                        <button @click="currentPage++" :disabled="currentPage === totalPages"
                            class="px-2 py-1 bg-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-300">Next</button>
                    </div>
                </div>
            </div>

            <!-- Right side - Pending Approvals -->
            <div class="w-96">
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 class="text-xl font-bold text-gray-800">Pending Approvals</h2>
                        <button @click="refreshPendingRequests"
                            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200">
                            Refresh
                        </button>
                    </div>
                    <div class="divide-y divide-gray-100">
                        <div v-for="request in pendingRequests" :key="request.id" class="p-4">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h3 class="text-sm font-medium text-gray-900">{{ request.name }}</h3>
                                    <p class="text-sm text-gray-500">{{ request.positionApplied }}</p>
                                </div>
                                <span
                                    class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
                            </div>
                            <div class="flex gap-2">
                                <button @click="viewRequestInfo(request)"
                                    class="text-sm px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition duration-200">
                                    View
                                </button>
                                <button @click="approveRequest(request)"
                                    class="text-sm px-3 py-1 text-green-600 hover:bg-green-50 rounded-md transition duration-200">
                                    Approve
                                </button>
                                <button @click="rejectRequest(request.id)"
                                    class="text-sm px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition duration-200">
                                    Reject
                                </button>
                            </div>
                        </div>
                        <div v-if="pendingRequests.length === 0" class="p-4 text-center text-sm text-gray-500">No
                            pending approvals.</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals (Reused from old code) -->
        <div v-if="showDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <!-- Employee Details Modal content from old code -->
            <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto">
                <div class="p-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-800">Employee Details</h2>
                </div>
                <div class="p-4 space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 class="text-base font-semibold text-gray-800 mb-2">Personal Information</h3>
                            <div class="space-y-2">
                                <p><span class="font-medium text-gray-700">Employee No:</span> {{
                                    selectedEmployee.employeeIdNumber || 'N/A' }}</p>
                                <p><span class="font-medium text-gray-700">Name:</span> {{ selectedEmployee.firstName }}
                                    {{ selectedEmployee.lastName }}</p>
                                <p><span class="font-medium text-gray-700">Position:</span> {{ selectedEmployee.position
                                    }}</p>
                                <p><span class="font-medium text-gray-700">Email:</span> {{ selectedEmployee.email }}
                                </p>
                                <p><span class="font-medium text-gray-700">Contact:</span> {{
                                    selectedEmployee.contactInfo }}</p>
                                <p><span class="font-medium text-gray-700">Hire Date:</span> {{ new
                                    Date(selectedEmployee.hireDate).toLocaleDateString() }}</p>
                            </div>
                        </div>
                        <div>
                            <h3 class="text-base font-semibold text-gray-800 mb-2">Financial Information</h3>
                            <div class="space-y-2">
                                <p><span class="font-medium text-gray-700">Monthly Salary:</span> ₱{{
                                    selectedEmployee.salary?.toLocaleString() }}</p>
                                <p><span class="font-medium text-gray-700">Hourly Rate:</span> ₱{{
                                    selectedEmployee.hourlyRate?.toLocaleString() }}</p>
                                <p><span class="font-medium text-gray-700">Net Salary:</span> ₱{{
                                    calculateNetSalary(selectedEmployee).toLocaleString() }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="mt-4 p-3 bg-gray-50 rounded-md">
                        <h3 class="text-base font-semibold text-gray-800 mb-2">Deductions</h3>
                        <div class="space-y-2">
                            <p><span class="font-medium text-gray-700">SSS:</span> ₱{{
                                calculateSSSContribution(selectedEmployee.salary).toLocaleString() }}</p>
                            <p><span class="font-medium text-gray-700">PhilHealth:</span> ₱{{
                                calculatePhilHealthContribution(selectedEmployee.salary).toLocaleString() }}</p>
                            <p><span class="font-medium text-gray-700">Pag-IBIG:</span> ₱{{
                                calculatePagIBIGContribution(selectedEmployee.salary).toLocaleString() }}</p>
                            <p><span class="font-medium text-gray-700">Withholding Tax:</span> ₱{{
                                calculateWithholdingTax(selectedEmployee.salary).toLocaleString() }}</p>
                        </div>
                    </div>
                </div>
                <div class="p-4 border-t bg-gray-50 flex justify-end">
                    <button @click="showDetailsModal = false"
                        class="px-3 py-1.5 border text-sm rounded-md text-gray-700 hover:bg-gray-100">Close</button>
                </div>
            </div>
        </div>

        <!-- Add Employee Modal -->
        <div v-if="showAddModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <!-- Add Employee Modal content from old code -->
            <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto">
                <div class="p-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-800">Add New Employee</h2>
                </div>
                <div class="p-4">
                    <div class="space-y-4">
                        <div>
                            <h3 class="text-base font-semibold text-gray-800 mb-2">Personal Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Employee Number *</label>
                                    <input v-model="newEmployee.empNo"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">First Name *</label>
                                    <input v-model="newEmployee.firstName"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Last Name *</label>
                                    <input v-model="newEmployee.lastName"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Email *</label>
                                    <input v-model="newEmployee.email" type="email"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Contact Number *</label>
                                    <input v-model="newEmployee.contactInfo"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required pattern="\d{11}" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 class="text-base font-semibold text-gray-800 mb-2">Employment Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Position *</label>
                                    <select v-model="newEmployee.position" @change="updateSalaryFromPosition"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required>
                                        <option v-for="position in adminPositions" :key="position.name"
                                            :value="position.name">{{ position.name }}</option>
                                    </select>
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Hire Date *</label>
                                    <input v-model="newEmployee.hireDate" type="date"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 class="text-base font-semibold text-gray-800 mb-2">Financial Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Monthly Salary *</label>
                                    <input v-model.number="newEmployee.salary" type="number"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required min="0" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Hourly Rate</label>
                                    <input :value="newEmployee.hourlyRate.toLocaleString()" type="text"
                                        class="w-full p-1.5 text-sm border rounded-md bg-gray-100" disabled />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button @click="addEmployee"
                        class="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                        :disabled="isAdding">
                        {{ isAdding ? 'Adding...' : 'Add' }}
                    </button>
                    <button @click="showAddModal = false"
                        class="px-3 py-1.5 border text-sm rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Edit Employee Modal -->
        <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <!-- Edit Employee Modal content from old code -->
            <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto">
                <div class="p-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-800">Edit Employee - {{ selectedEmployee.firstName }} {{
                        selectedEmployee.lastName }}</h2>
                </div>
                <div class="p-4">
                    <div class="space-y-4">
                        <div>
                            <h3 class="text-base font-semibold text-gray-800 mb-2">Personal Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Employee Number *</label>
                                    <input v-model="selectedEmployee.employeeIdNumber"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">First Name *</label>
                                    <input v-model="selectedEmployee.firstName"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Last Name *</label>
                                    <input v-model="selectedEmployee.lastName"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Email *</label>
                                    <input v-model="selectedEmployee.email" type="email"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Contact Number *</label>
                                    <input v-model="selectedEmployee.contactInfo"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required pattern="\d{11}" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 class="text-base font-semibold text-gray-800 mb-2">Employment Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Position *</label>
                                    <select v-model="selectedEmployee.position" @change="updateSalaryFromPositionEdit"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required>
                                        <option v-for="position in adminPositions" :key="position.name"
                                            :value="position.name">{{ position.name }}</option>
                                    </select>
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Hire Date *</label>
                                    <input v-model="selectedEmployee.hireDate" type="date"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 class="text-base font-semibold text-gray-800 mb-2">Financial Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Monthly Salary *</label>
                                    <input v-model.number="selectedEmployee.salary" type="number"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required min="0" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Hourly Rate</label>
                                    <input :value="selectedEmployee.hourlyRate.toLocaleString()" type="text"
                                        class="w-full p-1.5 text-sm border rounded-md bg-gray-100" disabled />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button @click="updateEmployee"
                        class="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700"
                        :disabled="isUpdating">
                        {{ isUpdating ? 'Updating...' : 'Update' }}
                    </button>
                    <button @click="showEditModal = false"
                        class="px-3 py-1.5 border text-sm rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-sm">
                <div class="p-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-800">Confirm Delete</h2>
                </div>
                <div class="p-4">
                    <p class="text-sm text-gray-700">Move {{ selectedEmployee.firstName }} {{ selectedEmployee.lastName
                        }} to trash?</p>
                </div>
                <div class="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button @click="trashEmployee(selectedEmployee._id)"
                        class="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        :disabled="isDeleting">{{ isDeleting ? 'Deleting...' : 'Delete' }}</button>
                    <button @click="showDeleteModal = false"
                        class="px-3 py-1.5 border text-sm rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Manage Positions Modal -->
        <div v-if="showPositionModal"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <!-- Manage Positions Modal content from old code -->
            <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
                <div class="p-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-800">Manage Positions</h2>
                </div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-4">
                        <h3 class="text-base font-semibold text-gray-800">Create Position</h3>
                        <div class="space-y-2">
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">Position Name *</label>
                                <input v-model="newPosition.name"
                                    class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                    required />
                            </div>
                            <div class="space-y-1">
                                <label class="text-xs font-medium text-gray-600">Monthly Salary *</label>
                                <input v-model.number="newPosition.salary" type="number"
                                    class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                    required min="0" />
                            </div>
                            <button @click="createPosition"
                                class="w-full px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                                :disabled="isAddingPosition">
                                {{ isAddingPosition ? 'Creating...' : 'Create' }}
                            </button>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <h3 class="text-base font-semibold text-gray-800">Available Positions</h3>
                        <div v-if="adminPositions.length === 0" class="text-gray-500 text-sm text-center">No positions
                        </div>
                        <div v-else class="space-y-2 max-h-[50vh] overflow-y-auto">
                            <div v-for="position in adminPositions" :key="position.id"
                                class="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                                <div>
                                    <p class="text-sm font-medium text-gray-900">{{ position.name }}</p>
                                    <p class="text-xs text-gray-600">₱{{ position.salary.toLocaleString() }}</p>
                                </div>
                                <div class="flex gap-1">
                                    <button @click="editPosition(position)"
                                        class="text-yellow-600 hover:text-yellow-800 p-1 rounded-full hover:bg-yellow-100">Edit</button>
                                    <button @click="confirmDeletePosition(position)"
                                        class="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100">Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="p-4 border-t bg-gray-50 flex justify-end">
                    <button @click="showPositionModal = false"
                        class="px-3 py-1.5 border text-sm rounded-md text-gray-700 hover:bg-gray-100">Close</button>
                </div>
            </div>
        </div>

        <!-- Notification Toasts -->
        <div v-if="successMessage"
            class="fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded-md shadow-lg animate-fade-in">
            {{ successMessage }}
        </div>
        <div v-if="errorMessage"
            class="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-md shadow-lg animate-fade-in">
            {{ errorMessage }}
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { BASE_API_URL } from '@/utils/constants.ts';

const employees = ref([]);
const totalEmployees = ref(0);
const pendingRequests = ref([]);
const adminPositions = ref([]);
const selectedEmployee = ref({});
const selectedRequest = ref(null);
const newEmployee = ref({
    empNo: '',
    firstName: '',
    lastName: '',
    position: '',
    salary: 0,
    hourlyRate: 0,
    email: '',
    contactInfo: '',
    hireDate: new Date().toISOString().slice(0, 10),
});
const newPosition = ref({ name: '', salary: 0 });

const isLoading = ref(false);
const isAdding = ref(false);
const isUpdating = ref(false);
const isDeleting = ref(false);
const isAddingPosition = ref(false);
const showDetailsModal = ref(false);
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showPositionModal = ref(false);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const successMessage = ref(null);
const errorMessage = ref(null);

// Computed properties
const filteredEmployees = computed(() => {
    return employees.value.filter(emp =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

const paginatedEmployees = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    return filteredEmployees.value.slice(start, start + itemsPerPage.value);
});

const totalPages = computed(() => {
    return Math.ceil(filteredEmployees.value.length / itemsPerPage.value);
});

// Watchers
watch(() => newEmployee.value.salary, (newSalary) => {
    newEmployee.value.hourlyRate = newSalary ? newSalary / (8 * 22) : 0;
});

watch(() => selectedEmployee.value.salary, (newSalary) => {
    selectedEmployee.value.hourlyRate = newSalary ? newSalary / (8 * 22) : 0;
});

// API Calls
const fetchAllEmployees = async () => {
    isLoading.value = true;
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/`, {
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to fetch employees');
        employees.value = (await response.json()).map(emp => ({
            ...emp,
            hourlyRate: emp.hourlyRate || (emp.salary / (8 * 22)),
            employeeIdNumber: emp.employeeIdNumber || `EMP-${String(emp._id).padStart(4, '0')}`,
        }));
    } catch (error) {
        console.error('Failed to fetch employees:', error);
        showErrorMessage('Failed to load employees.');
    } finally {
        isLoading.value = false;
    }
};

const fetchTotalEmployees = async () => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/total`, {
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to fetch total employees');
        totalEmployees.value = (await response.json()).total;
    } catch (error) {
        console.error('Failed to fetch total employees:', error);
        showErrorMessage('Failed to load total employees count.');
    }
};

const fetchPendingRequests = async () => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/pending`, {
            headers: { 'Content-Type': 'application/json'},
        });
        if (!response.ok) throw new Error('Failed to fetch pending requests');
        pendingRequests.value = (await response.json()).map(req => ({
            id: req._id,
            name: `${req.firstName} ${req.lastName}`,
            positionApplied: req.position,
            salary: req.salary,
            email: req.email,
            contactNumber: req.contactInfo,
        }));
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        showErrorMessage('Failed to load pending requests');
    }
};

const fetchPositions = async () => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/positions`, {
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to fetch positions');
        adminPositions.value = await response.json();
    } catch (error) {
        console.error('Error fetching positions:', error);
        showErrorMessage('Failed to load positions');
    }
};

const refreshAll = async () => {
    await Promise.all([fetchAllEmployees(), fetchTotalEmployees(), fetchPendingRequests(), fetchPositions()]);
    showSuccessMessage('Data refreshed successfully');
};

const refreshPendingRequests = async () => {
    await fetchPendingRequests();
    showSuccessMessage('Pending requests refreshed successfully');
};

// Salary Calculations
const calculateTotalEarnings = (employee) => {
    const baseSalary = employee.salary || 0;
    const earnings = employee.payHeads?.filter(p => p.type === 'Earnings') || [];
    const totalEarningsFromPayHeads = earnings.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return baseSalary + totalEarningsFromPayHeads;
};

const calculateSSSContribution = (salary) => {
    const monthlySalary = Math.max(salary || 0, 0);
    if (monthlySalary < 5000) return 250;
    const salaryCredit = Math.min(Math.max(monthlySalary, 5000), 35000);
    const regularSSContribution = Math.round(salaryCredit * 0.05);
    let mpfContribution = salaryCredit > 20000 ? Math.round((Math.min(salaryCredit, 35000) - 20000) * 0.025) : 0;
    return salaryCredit > 34750 ? 1750 : regularSSContribution + mpfContribution;
};

const calculatePhilHealthContribution = (salary) => {
    const monthlySalary = Math.max(salary || 0, 0);
    return Math.round(Math.min(Math.max(monthlySalary, 10000), 100000) * 0.025);
};

const calculatePagIBIGContribution = (salary) => {
    const monthlySalary = Math.max(salary || 0, 0);
    const cappedSalary = Math.min(monthlySalary, 5000);
    return Math.round(cappedSalary * (cappedSalary <= 1500 ? 0.01 : 0.02));
};

const calculateWithholdingTax = (salary) => {
    const taxableIncome = salary || 0;
    if (taxableIncome <= 20833) return 0;
    if (taxableIncome <= 33333) return Math.round((taxableIncome - 20833) * 0.15);
    if (taxableIncome <= 66667) return Math.round(1875 + (taxableIncome - 33333) * 0.20);
    if (taxableIncome <= 166667) return Math.round(13541.80 + (taxableIncome - 66667) * 0.25);
    if (taxableIncome <= 666667) return Math.round(90841.80 + (taxableIncome - 166667) * 0.30);
    return Math.round(408841.80 + (taxableIncome - 666667) * 0.35);
};

const calculateTotalDeductions = (employee) => {
    const deductions = employee.payHeads?.filter(p => p.type === 'Deductions') || [];
    const totalCustomDeductions = deductions.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return calculateSSSContribution(employee.salary) +
        calculatePhilHealthContribution(employee.salary) +
        calculatePagIBIGContribution(employee.salary) +
        calculateWithholdingTax(employee.salary) +
        totalCustomDeductions;
};

const calculateNetSalary = (employee) => {
    return employee && employee.salary ? calculateTotalEarnings(employee) - calculateTotalDeductions(employee) : 0;
};

// Employee Management
const viewEmployeeDetails = (employee) => {
    selectedEmployee.value = { ...employee };
    showDetailsModal.value = true;
};

const editEmployee = (employee) => {
    selectedEmployee.value = { ...employee };
    showEditModal.value = true;
};

const updateEmployee = async () => {
    isUpdating.value = true;
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/update/${selectedEmployee.value._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selectedEmployee.value),
        });
        if (!response.ok) throw new Error('Failed to update employee');
        const updatedEmployee = await response.json();
        const index = employees.value.findIndex(emp => emp._id === updatedEmployee.updatedEmployee._id);
        if (index !== -1) employees.value[index] = updatedEmployee.updatedEmployee;
        showEditModal.value = false;
        showSuccessMessage('Employee updated successfully');
    } catch (error) {
        console.error('Error updating employee:', error);
        showErrorMessage('Failed to update employee');
    } finally {
        isUpdating.value = false;
    }
};

const confirmDelete = (employee) => {
    selectedEmployee.value = employee;
    showDeleteModal.value = true;
};

const trashEmployee = async (id) => {
    isDeleting.value = true;
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/trash/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to move employee to trash');
        employees.value = employees.value.filter(emp => emp._id !== id);
        showDeleteModal.value = false;
        showSuccessMessage('Employee moved to trash successfully');
    } catch (error) {
        console.error('Error trashing employee:', error);
        showErrorMessage('Failed to move employee to trash');
    } finally {
        isDeleting.value = false;
    }
};

const addEmployee = async () => {
    isAdding.value = true;
    try {
        const employeeData = { ...newEmployee.value, role: 'employee', status: 'approved' };
        const response = await fetch(`${BASE_API_URL}/api/employees/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData),
        });
        if (!response.ok) throw new Error('Failed to add employee');
        const addedEmployee = await response.json();
        employees.value.push(addedEmployee);
        showAddModal.value = false;
        newEmployee.value = { empNo: '', firstName: '', lastName: '', position: '', salary: 0, hourlyRate: 0, email: '', contactInfo: '', hireDate: new Date().toISOString().slice(0, 10) };
        showSuccessMessage('Employee added successfully');
    } catch (error) {
        console.error('Error adding employee:', error);
        showErrorMessage('Failed to add employee');
    } finally {
        isAdding.value = false;
    }
};

// Pending Requests
const viewRequestInfo = (request) => {
    selectedRequest.value = { ...request };
};

const approveRequest = async (request) => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/update/${request.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved', hireDate: new Date() }),
        });
        if (!response.ok) throw new Error('Failed to approve request');
        const updatedEmployee = await response.json();
        pendingRequests.value = pendingRequests.value.filter(req => req.id !== request.id);
        employees.value.push(updatedEmployee.updatedEmployee);
        showSuccessMessage('Employee approved successfully');
    } catch (error) {
        console.error('Error approving request:', error);
        showErrorMessage('Failed to approve request');
    }
};

const rejectRequest = async (id) => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/update/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected' }),
        });
        if (!response.ok) throw new Error('Failed to reject request');
        pendingRequests.value = pendingRequests.value.filter(req => req.id !== id);
        showSuccessMessage('Application rejected successfully');
    } catch (error) {
        console.error('Error rejecting request:', error);
        showErrorMessage('Failed to reject request');
    }
};

// Position Management
const createPosition = async () => {
    isAddingPosition.value = true;
    try {
        const response = await fetch(`${BASE_API_URL}/api/positions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPosition.value),
        });
        if (!response.ok) throw new Error('Failed to create position');
        const addedPosition = await response.json();
        adminPositions.value.push(addedPosition);
        newPosition.value = { name: '', salary: 0 };
        showSuccessMessage('Position created successfully');
    } catch (error) {
        console.error('Error creating position:', error);
        showErrorMessage('Failed to create position');
    } finally {
        isAddingPosition.value = false;
    }
};

const editPosition = (position) => {
    // Add edit position logic here if needed
};

const confirmDeletePosition = (position) => {
    // Add delete position confirmation logic here if needed
};

const updateSalaryFromPosition = () => {
    const selectedPosition = adminPositions.value.find(pos => pos.name === newEmployee.value.position);
    if (selectedPosition) {
        newEmployee.value.salary = selectedPosition.salary;
        newEmployee.value.hourlyRate = selectedPosition.salary / (8 * 22);
    }
};

const updateSalaryFromPositionEdit = () => {
    const selectedPosition = adminPositions.value.find(pos => pos.name === selectedEmployee.value.position);
    if (selectedPosition) {
        selectedEmployee.value.salary = selectedPosition.salary;
        selectedEmployee.value.hourlyRate = selectedPosition.salary / (8 * 22);
    }
};

// Notification Helpers
const showSuccessMessage = (msg) => {
    successMessage.value = msg;
    setTimeout(() => (successMessage.value = null), 3000);
};

const showErrorMessage = (msg) => {
    errorMessage.value = msg;
    setTimeout(() => (errorMessage.value = null), 3000);
};

// Lifecycle
onMounted(() => {
    refreshAll();
});
</script>

<style scoped>
.transition-colors {
    transition: all 0.2s ease-in-out;
}

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

button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>