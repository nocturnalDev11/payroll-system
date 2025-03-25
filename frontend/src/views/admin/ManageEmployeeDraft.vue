<script>
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store.js';
import { BASE_API_URL } from '@/utils/constants.js';

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
            isEditingRequest: false,
            isLoading: false,
            isUpdating: false,
            isDeleting: false,
            isAdding: false,
            isAddingPosition: false,
            isUpdatingPosition: false,
            isDeletingPosition: false,
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
                sss: '',
                philhealth: '',
                pagibig: '',
                tin: '',
                hireDate: new Date().toISOString().slice(0, 10),
                earnings: { travelExpenses: 0, otherEarnings: 0 },
                username: '',
                password: '',
                positionHistory: [],
            },
            newPosition: { name: '', salary: 0 },
            editPositionData: { id: null, name: '', salary: 0 },
        };
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
        'selectedEmployee.salary'(newSalary) { this.selectedEmployee.hourlyRate = newSalary / (8 * 22); },
        'selectedRequest.salary'(newSalary) { this.selectedRequest.hourlyRate = newSalary / (8 * 22); },
        'newEmployee.salary'(newSalary) { this.newEmployee.hourlyRate = newSalary ? newSalary / (8 * 22) : 0; },
    },
    mounted() {
        this.fetchEmployees();
        this.fetchPendingRequests();
        this.fetchPositions();
    },
    methods: {
        calculateTotalEarnings(employee) {
            const baseEarnings = (employee.earnings?.travelExpenses || 0) + (employee.earnings?.otherEarnings || 0);
            return employee.salary + baseEarnings;
        },
        calculateTotalDeductions(employee) {
            return this.calculateSSSContribution(employee.salary) +
                this.calculatePhilHealthContribution(employee.salary) +
                this.calculatePagIBIGContribution(employee.salary) +
                this.calculateWithholdingTax(employee.salary);
        },
        calculateNetSalary(employee) {
            return employee && employee.salary ? this.calculateTotalEarnings(employee) - this.calculateTotalDeductions(employee) : 0;
        },
        calculateRequestNetSalary(request) {
            if (!request || !request.salary) return 0;
            const totalEarnings = (request.earnings?.travelExpenses || 0) + (request.earnings?.otherEarnings || 0) + (request.salary || 0);
            return totalEarnings - (this.calculateSSSContribution(request.salary) + this.calculatePhilHealthContribution(request.salary) +
                this.calculatePagIBIGContribution(request.salary) + this.calculateWithholdingTax(request.salary));
        },
        calculateNewEmployeeNetSalary() {
            if (!this.newEmployee.salary) return 0;
            const totalEarnings = this.newEmployee.salary + (this.newEmployee.earnings.travelExpenses || 0) + (this.newEmployee.earnings.otherEarnings || 0);
            return totalEarnings - (this.calculateSSSContribution(this.newEmployee.salary) + this.calculatePhilHealthContribution(this.newEmployee.salary) +
                this.calculatePagIBIGContribution(this.newEmployee.salary) + this.calculateWithholdingTax(this.newEmployee.salary));
        },
        calculateSSSContribution(salary) {
            const monthlySalary = Math.max(salary || 0, 0);
            if (monthlySalary < 5000) return 250;
            const salaryCredit = Math.min(Math.max(monthlySalary, 5000), 35000);
            const regularSSContribution = Math.round(salaryCredit * 0.05);
            let mpfContribution = salaryCredit > 20000 ? Math.round((Math.min(salaryCredit, 35000) - 20000) * 0.025) : 0;
            return salaryCredit > 34750 ? 1750 : regularSSContribution + mpfContribution;
        },
        calculatePhilHealthContribution(salary) {
            const monthlySalary = Math.max(salary || 0, 0);
            return Math.round(Math.min(Math.max(monthlySalary, 10000), 100000) * 0.025);
        },
        calculatePagIBIGContribution(salary) {
            const monthlySalary = Math.max(salary || 0, 0);
            const cappedSalary = Math.min(monthlySalary, 5000);
            return Math.round(cappedSalary * (cappedSalary <= 1500 ? 0.01 : 0.02));
        },
        calculateWithholdingTax(salary) {
            const taxableIncome = salary || 0;
            if (taxableIncome <= 20833) return 0;
            if (taxableIncome <= 33333) return Math.round((taxableIncome - 20833) * 0.15);
            if (taxableIncome <= 66667) return Math.round(1875 + (taxableIncome - 33333) * 0.20);
            if (taxableIncome <= 166667) return Math.round(13541.80 + (taxableIncome - 66667) * 0.25);
            if (taxableIncome <= 666667) return Math.round(90841.80 + (taxableIncome - 166667) * 0.30);
            return Math.round(408841.80 + (taxableIncome - 666667) * 0.35);
        },

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
                    .filter(emp => emp.status === 'approved') // Only include approved employees
                    .map(emp => ({
                        ...emp,
                        id: emp.id, // Use custom id field (Number)
                        hourlyRate: emp.hourlyRate || (emp.salary / (8 * 22)),
                        empNo: emp.empNo || `EMP-${String(emp.id).padStart(4, '0')}`,
                        positionHistory: Array.isArray(emp.positionHistory) ? emp.positionHistory : [{
                            position: emp.position || 'N/A',
                            salary: emp.salary || 0,
                            startDate: emp.hireDate || new Date().toISOString().slice(0, 10),
                            endDate: null,
                        }],
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
                this.pendingRequests = (response.data || []).map(req => ({
                    ...req,
                    id: req.id,
                    _id: req._id,
                }));
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
                this.adminPositions = response.data || [];
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
            this.selectedEmployee = { ...employee };
            this.showDetailsModal = true;
        },

        editEmployee(employee) {
            this.selectedEmployee = {
                ...employee,
                earnings: {
                    travelExpenses: employee.earnings?.travelExpenses || 0,
                    otherEarnings: employee.earnings?.otherEarnings || 0
                },
                positionHistory: Array.isArray(employee.positionHistory) ? employee.positionHistory : [{
                    position: employee.position || 'N/A',
                    salary: employee.salary || 0,
                    startDate: employee.hireDate || new Date().toISOString().slice(0, 10),
                    endDate: null,
                }],
            };
            this.showDetailsModal = false;
            this.showEditModal = true;
        },

        async updateEmployee() {
            if (!this.selectedEmployee.firstName || !this.selectedEmployee.lastName || !this.selectedEmployee.email ||
                !this.selectedEmployee.contactInfo || this.selectedEmployee.salary < 0) {
                this.showErrorMessage('Required fields missing or invalid salary');
                return;
            }
            this.isUpdating = true;
            try {
                const originalEmployee = this.employees.find(emp => emp.id === this.selectedEmployee.id);
                const positionChanged = originalEmployee.position !== this.selectedEmployee.position;

                if (positionChanged) {
                    const updatedPositionHistory = this.selectedEmployee.positionHistory.map(history => {
                        if (!history.endDate) {
                            return { ...history, endDate: new Date().toISOString().slice(0, 10) };
                        }
                        return history;
                    });

                    updatedPositionHistory.push({
                        position: this.selectedEmployee.position,
                        salary: this.selectedEmployee.salary,
                        startDate: new Date().toISOString().slice(0, 10),
                        endDate: null,
                    });

                    this.selectedEmployee.positionHistory = updatedPositionHistory;
                }

                const response = await axios.put(
                    `${BASE_API_URL}/api/employees/${this.selectedEmployee.id}`,
                    this.selectedEmployee,
                    {
                        headers: {
                            Authorization: `Bearer ${this.authStore.accessToken}`,
                            'user-role': this.authStore.userRole,
                        },
                    }
                );
                if (response.status === 200) {
                    const index = this.employees.findIndex(emp => emp.id === this.selectedEmployee.id);
                    if (index !== -1) this.employees[index] = { ...this.selectedEmployee };
                    this.showEditModal = false;
                    this.showSuccessMessage('Employee updated successfully');
                }
            } catch (error) {
                console.error('Error updating employee:', error);
                this.showErrorMessage('Failed to update employee');
            } finally {
                this.isUpdating = false;
            }
        },

        confirmMoveToTrash(employee) {
            this.selectedEmployee = employee;
            this.showDeleteModal = true;
        },

        async moveToTrash(id) {
            this.isDeleting = true;
            try {
                const response = await axios.delete(`${BASE_API_URL}/api/employees/${id}`, {
                    headers: {
                        Authorization: `Bearer ${this.authStore.accessToken}`,
                        'user-role': this.authStore.userRole,
                    },
                });
                if (response.status === 200 || response.status === 204) {
                    this.employees = this.employees.filter(emp => emp.id !== id); // Filter by custom id
                    this.showDeleteModal = false;
                    this.showSuccessMessage('Employee moved to trash successfully');
                }
            } catch (error) {
                console.error('Error moving employee to trash:', error);
                this.showErrorMessage('Failed to move employee to trash');
            } finally {
                this.isDeleting = false;
            }
        },

        viewRequestInfo(request) {
            this.selectedRequest = { ...request, earnings: { travelExpenses: request.earnings?.travelExpenses || 0, otherEarnings: request.earnings?.otherEarnings || 0 } };
            this.showRequestModal = true;
            this.isEditingRequest = false;
        },

        async saveRequestChanges() {
            if (!`${this.selectedRequest.firstName} ${this.selectedRequest.middleName} ${this.selectedRequest.lastName}`.trim() || !this.selectedRequest.email || !this.selectedRequest.contactNumber || this.selectedRequest.salary < 0) {
                this.showErrorMessage('Required fields missing or invalid salary');
                return;
            }
            this.isUpdating = true;
            try {
                const response = await axios.put(`${BASE_API_URL}/api/pending-requests/${this.selectedRequest.id}`, this.selectedRequest, {
                    headers: {
                        Authorization: `Bearer ${this.authStore.accessToken}`,
                        'user-role': this.authStore.userRole,
                    },
                });
                if (response.status === 200) {
                    const index = this.pendingRequests.findIndex(req => req.id === this.selectedRequest.id);
                    if (index !== -1) this.pendingRequests[index] = { ...this.selectedRequest };
                    this.showSuccessMessage('Request updated successfully');
                    this.isEditingRequest = false;
                }
            } catch (error) {
                console.error('Error saving request changes:', error);
                this.showErrorMessage('Failed to save request changes');
            } finally {
                this.isUpdating = false;
            }
        },

        async approveRequest(request) {
            // Validate required fields
            const requiredFields = ['empNo', 'firstName', 'lastName', 'position', 'salary', 'email', 'contactInfo', 'username', 'password'];

            const missingFields = requiredFields.filter(field => {
                const value = request[field];
                if (value === undefined || value === null) return true;
                if (['empNo', 'firstName', 'lastName', 'position', 'email', 'contactInfo', 'username', 'password'].includes(field)) {
                    return typeof value !== 'string' || value.trim() === '';
                }
                if (field === 'salary') {
                    return typeof value !== 'number' || value <= 0;
                }
                return !value;
            });

            if (missingFields.length > 0) {
                this.showErrorMessage(`Missing or invalid required fields: ${missingFields.join(', ')}`);
                return;
            }

            try {
                const updatedEmployee = {
                    empNo: request.empNo,
                    firstName: request.firstName,
                    lastName: request.lastName,
                    middleName: request.middleName || '',
                    position: request.position,
                    salary: Number(request.salary),
                    hourlyRate: Number(request.hourlyRate || (request.salary / (8 * 22))),
                    email: request.email,
                    contactInfo: request.contactInfo,
                    sss: request.sss || '',
                    philhealth: request.philhealth || '',
                    pagibig: request.pagibig || '',
                    tin: request.tin || '',
                    civilStatus: request.civilStatus || 'Single',
                    earnings: {
                        travelExpenses: Number(request.earnings?.travelExpenses || 0),
                        otherEarnings: Number(request.earnings?.otherEarnings || 0),
                    },
                    payheads: request.payheads || [],
                    username: request.username,
                    password: request.password,
                    role: 'employee',
                    status: 'approved', // Update status to 'approved'
                    hireDate: new Date().toISOString().slice(0, 10),
                    positionHistory: [{
                        position: request.position,
                        salary: Number(request.salary),
                        startDate: new Date().toISOString().slice(0, 10),
                        endDate: null,
                    }],
                };

                console.log('Updating employee data:', updatedEmployee);

                // Update the employee (approve the request)
                const response = await axios.put(`${BASE_API_URL}/api/employees/${request._id}`, updatedEmployee, {
                    headers: {
                        Authorization: `Bearer ${this.authStore.accessToken}`,
                        'user-role': this.authStore.userRole,
                    },
                });

                if (response.status === 200) {
                    this.employees.push({
                        ...response.data,
                        hourlyRate: response.data.hourlyRate || (response.data.salary / (8 * 22)),
                    });
                    // Remove the request from pendingRequests (no DELETE request needed)
                    this.pendingRequests = this.pendingRequests.filter(req => req._id !== request._id);
                    this.showRequestModal = false;
                    this.showSuccessMessage('Employee approved and updated successfully');
                }
            } catch (error) {
                console.error('Error approving request:', error.response?.data || error.message);
                this.showErrorMessage(error.response?.data?.error || 'Failed to approve employee');
            }
        },

        async rejectRequest(id) {
            try {
                const response = await axios.delete(`${BASE_API_URL}/api/pending-requests/${id}`, {
                    headers: {
                        Authorization: `Bearer ${this.authStore.accessToken}`,
                        'user-role': this.authStore.userRole,
                    },
                });
                if (response.status === 200 || response.status === 204) {
                    this.pendingRequests = this.pendingRequests.filter(req => req.id !== id);
                    this.showRequestModal = false;
                    this.showSuccessMessage('Application rejected successfully');
                }
            } catch (error) {
                console.error('Error rejecting request:', error);
                this.showErrorMessage('Failed to reject application');
            }
        },

        async addEmployee() {
            if (!this.newEmployee.firstName || !this.newEmployee.lastName || !this.newEmployee.empNo || !this.newEmployee.email || !this.newEmployee.contactInfo || !this.newEmployee.username || !this.newEmployee.password || this.newEmployee.salary < 0) {
                this.showErrorMessage('Required fields missing or invalid salary');
                return;
            }
            this.isAdding = true;
            try {
                const employeeData = {
                    ...this.newEmployee,
                    hourlyRate: this.newEmployee.hourlyRate,
                    role: 'employee',
                    positionHistory: [{
                        position: this.newEmployee.position,
                        salary: this.newEmployee.salary,
                        startDate: this.newEmployee.hireDate,
                        endDate: null,
                    }],
                };
                const response = await axios.post(`${BASE_API_URL}/api/employees`, employeeData, {
                    headers: {
                        Authorization: `Bearer ${this.authStore.accessToken}`,
                        'user-role': this.authStore.userRole,
                    },
                });
                if (response.status === 201) {
                    this.employees.push({ ...response.data, hourlyRate: response.data.hourlyRate || (response.data.salary / (8 * 22)) });
                    this.showAddModal = false;
                    this.resetNewEmployee();
                    this.showSuccessMessage('Employee added successfully');
                }
            } catch (error) {
                console.error('Error adding employee:', error);
                this.showErrorMessage('Failed to add employee');
            } finally {
                this.isAdding = false;
            }
        },

        async createPosition() {
            if (!this.newPosition.name || this.newPosition.salary < 0) {
                this.showErrorMessage('Position Name and a non-negative Salary are required');
                return;
            }
            this.isAddingPosition = true;
            try {
                const response = await axios.post(`${BASE_API_URL}/api/positions`, this.newPosition, {
                    headers: {
                        Authorization: `Bearer ${this.authStore.accessToken}`,
                        'user-role': this.authStore.userRole,
                    },
                });
                if (response.status === 201) {
                    this.adminPositions.push(response.data);
                    this.resetNewPosition();
                    this.showSuccessMessage('Position created successfully');
                }
            } catch (error) {
                console.error('Error creating position:', error);
                this.showErrorMessage('Failed to create position');
            } finally {
                this.isAddingPosition = false;
            }
        },

        editPosition(position) {
            this.editPositionData = { ...position };
            this.showEditPositionModal = true;
        },

        async updatePosition() {
            if (!this.editPositionData.name || this.editPositionData.salary < 0) {
                this.showErrorMessage('Position Name and a non-negative Salary are required');
                return;
            }
            this.isUpdatingPosition = true;
            try {
                const response = await axios.put(`${BASE_API_URL}/api/positions/${this.editPositionData.id}`, this.editPositionData, {
                    headers: {
                        Authorization: `Bearer ${this.authStore.accessToken}`,
                        'user-role': this.authStore.userRole,
                    },
                });
                if (response.status === 200) {
                    const index = this.adminPositions.findIndex(pos => pos.id === this.editPositionData.id);
                    if (index !== -1) this.adminPositions[index] = { ...this.editPositionData };
                    this.showEditPositionModal = false;
                    this.showSuccessMessage('Position updated successfully');
                }
            } catch (error) {
                console.error('Error updating position:', error);
                this.showErrorMessage('Failed to update position');
            } finally {
                this.isUpdatingPosition = false;
            }
        },

        confirmDeletePosition(position) {
            this.selectedPosition = position;
            this.showDeletePositionModal = true;
        },

        async deletePosition() {
            this.isDeletingPosition = true;
            try {
                const response = await axios.delete(`${BASE_API_URL}/api/positions/${this.selectedPosition.id}`, {
                    headers: {
                        Authorization: `Bearer ${this.authStore.accessToken}`,
                        'user-role': this.authStore.userRole,
                    },
                });
                if (response.status === 200 || response.status === 204) {
                    this.adminPositions = this.adminPositions.filter(pos => pos.id !== this.selectedPosition.id);
                    this.showDeletePositionModal = false;
                    this.showSuccessMessage('Position deleted successfully');
                }
            } catch (error) {
                console.error('Error deleting position:', error);
                this.showErrorMessage('Failed to delete position');
            } finally {
                this.isDeletingPosition = false;
            }
        },

        updateSalaryFromPosition() {
            const selectedPosition = this.adminPositions.find(pos => pos.name === this.newEmployee.position);
            if (selectedPosition) {
                this.newEmployee.salary = selectedPosition.salary;
                this.newEmployee.hourlyRate = selectedPosition.salary / (8 * 22);
            }
        },

        updateSalaryFromPositionEdit() {
            const selectedPosition = this.adminPositions.find(pos => pos.name === this.selectedEmployee.position);
            if (selectedPosition) {
                this.selectedEmployee.salary = selectedPosition.salary;
                this.selectedEmployee.hourlyRate = selectedPosition.salary / (8 * 22);
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
        <header class="bg-white shadow-sm p-3 flex justify-between items-center sticky top-0 z-40 rounded-lg">
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
        <main class="flex-1 p-2">
            <div class="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                                    <td class="px-4 py-2">{{ employee.firstName }} {{ employee.lastName }}</td>
                                    <td class="px-4 py-2">{{ employee.position || 'N/A' }}</td>
                                    <td class="px-4 py-2">₱{{ employee.hourlyRate.toLocaleString() }}</td>
                                    <td class="px-4 py-2">₱{{ calculateNetSalary(employee).toLocaleString() }}</td>
                                    <td class="px-4 py-2 text-right flex justify-end gap-1">
                                        <button @click="viewEmployeeDetails(employee)"
                                            class="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-100">
                                            <span class="material-icons text-lg">visibility</span>
                                        </button>
                                        <button @click="editEmployee(employee)"
                                            class="text-yellow-600 hover:text-yellow-800 p-1 rounded-full hover:bg-yellow-100">
                                            <span class="material-icons text-lg">edit</span>
                                        </button>
                                        <button @click="confirmDelete(employee)"
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
                                    <h3 class="text-sm font-medium text-gray-900">{{ request.firstName }} {{
                                        request.lastName }}</h3>
                                    <p class="text-xs text-gray-500">{{ request.position }}</p>
                                </div>
                                <span
                                    class="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
                            </div>
                            <div class="flex justify-end gap-1">
                                <button @click="viewRequestDetails(request)"
                                    class="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-100"
                                    title="View">
                                    <span class="material-icons text-lg">visibility</span>
                                </button>
                                <button @click="approveRequest(request)"
                                    class="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100"
                                    title="Approve">
                                    <span class="material-icons text-lg">check_circle</span>
                                </button>
                                <button @click="rejectRequest(request.id)"
                                    class="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
                                    title="Reject">
                                    <span class="material-icons text-lg">cancel</span>
                                </button>
                            </div>
                        </div>
                        <div v-if="pendingRequests.length === 0" class="p-3 text-center text-sm text-gray-500">No
                            pending approvals</div>
                    </div>
                </aside>
            </div>
        </main>

        <!-- Employee Details Modal -->
        <div v-if="showDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
                <!-- Header -->
                <div
                    class="p-4 border-b border-gray-300 flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
                    <div>
                        <h2 class="text-xl font-bold text-gray-800">Employee Profile</h2>
                        <p class="text-xs text-gray-500 mt-0.5">Employee ID: {{ selectedEmployee.empNo }}</p>
                    </div>
                    <button @click="showDetailsModal = false"
                        class="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <span class="material-icons">close</span>
                    </button>
                </div>

                <!-- Content -->
                <div class="flex-1 overflow-y-auto p-4 space-y-6">
                    <!-- Profile Header -->
                    <div class="flex items-center space-x-4 pb-4 border-b border-gray-300">
                        <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span class="material-icons text-3xl text-indigo-600">account_circle</span>
                        </div>
                        <div>
                            <h3 class="text-xl font-semibold text-gray-900">
                                {{ selectedEmployee.firstName }} {{ selectedEmployee.middleName }} {{
                                selectedEmployee.lastName }}
                            </h3>
                            <p class="text-base text-indigo-600 font-medium">{{ selectedEmployee.position }}</p>
                            <p class="text-sm text-gray-500 mt-0.5">Joined {{ new
                                Date(selectedEmployee.hireDate).toLocaleDateString('en-US', {
                                year: 'numeric', month:
                                'long', day: 'numeric'
                                }) }}</p>
                        </div>
                    </div>

                    <!-- Grid Layout -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Personal Information Card -->
                        <div
                            class="bg-white rounded-lg shadow-sm border border-gray-300 p-4 hover:shadow-md transition-shadow">
                            <div class="flex items-center mb-3">
                                <span class="material-icons text-indigo-600 mr-1">person</span>
                                <h4 class="text-base font-semibold text-gray-800">Personal Information</h4>
                            </div>
                            <dl class="grid grid-cols-1 gap-2">
                                <div class="flex justify-between py-1 border-b border-gray-100">
                                    <dt class="text-sm text-gray-500">Email</dt>
                                    <dd class="text-sm text-gray-900 font-medium">{{ selectedEmployee.email }}</dd>
                                </div>
                                <div class="flex justify-between py-1 border-b border-gray-100">
                                    <dt class="text-sm text-gray-500">Contact</dt>
                                    <dd class="text-sm text-gray-900 font-medium">{{ selectedEmployee.contactInfo }}
                                    </dd>
                                </div>
                                <div class="flex justify-between py-1 border-b border-gray-100">
                                    <dt class="text-sm text-gray-500">Civil Status</dt>
                                    <dd class="text-sm text-gray-900 font-medium">{{ selectedEmployee.civilStatus }}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <!-- Financial Information Card -->
                        <div
                            class="bg-white rounded-lg shadow-sm border border-gray-300 p-4 hover:shadow-md transition-shadow">
                            <div class="flex items-center mb-3">
                                <span class="material-icons text-green-600 mr-1">payments</span>
                                <h4 class="text-base font-semibold text-gray-800">Financial Information</h4>
                            </div>
                            <dl class="space-y-3">
                                <div class="p-3 bg-green-50 rounded-md">
                                    <dt class="text-xs text-green-600 mb-0.5">Net Salary</dt>
                                    <dd class="text-xl font-bold text-green-700">₱{{
                                        calculateNetSalary(selectedEmployee).toLocaleString() }}</dd>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div class="p-2 bg-gray-50 rounded-md">
                                        <dt class="text-xs text-gray-500 mb-0.5">Monthly Salary</dt>
                                        <dd class="text-base font-semibold text-gray-900">₱{{
                                            selectedEmployee.salary?.toLocaleString() }}</dd>
                                    </div>
                                    <div class="p-2 bg-gray-50 rounded-md">
                                        <dt class="text-xs text-gray-500 mb-0.5">Hourly Rate</dt>
                                        <dd class="text-base font-semibold text-gray-900">₱{{
                                            selectedEmployee.hourlyRate?.toLocaleString() }}</dd>
                                    </div>
                                </div>
                            </dl>
                        </div>

                        <!-- Government IDs Card -->
                        <div
                            class="bg-white rounded-lg shadow-sm border border-gray-300 p-4 hover:shadow-md transition-shadow">
                            <div class="flex items-center mb-3">
                                <span class="material-icons text-blue-600 mr-1">badge</span>
                                <h4 class="text-base font-semibold text-gray-800">Government IDs</h4>
                            </div>
                            <dl class="grid grid-cols-1 gap-2">
                                <div class="flex justify-between py-1 border-b border-gray-100">
                                    <dt class="text-sm text-gray-500">SSS</dt>
                                    <dd class="text-sm text-gray-900 font-medium">{{ selectedEmployee.sss }}</dd>
                                </div>
                                <div class="flex justify-between py-1 border-b border-gray-100">
                                    <dt class="text-sm text-gray-500">PhilHealth</dt>
                                    <dd class="text-sm text-gray-900 font-medium">{{ selectedEmployee.philhealth }}</dd>
                                </div>
                                <div class="flex justify-between py-1 border-b border-gray-100">
                                    <dt class="text-sm text-gray-500">Pag-IBIG</dt>
                                    <dd class="text-sm text-gray-900 font-medium">{{ selectedEmployee.pagibig }}</dd>
                                </div>
                                <div class="flex justify-between py-1 border-b border-gray-100">
                                    <dt class="text-sm text-gray-500">TIN</dt>
                                    <dd class="text-sm text-gray-900 font-medium">{{ selectedEmployee.tin }}</dd>
                                </div>
                            </dl>
                        </div>

                        <!-- Position History Card -->
                        <div
                            class="bg-white rounded-lg shadow-sm border-gray-300 p-4 hover:shadow-md transition-shadow">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center">
                                    <span class="material-icons text-purple-600 mr-1">history</span>
                                    <h4 class="text-base font-semibold text-gray-800">Position History</h4>
                                </div>
                            </div>
                            <div class="space-y-3">
                                <div v-for="(history, index) in sortedPositionHistory" :key="index"
                                    class="p-3 rounded-md"
                                    :class="!history.endDate ? 'bg-purple-50 border border-purple-100' : 'bg-gray-50'">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <p class="font-medium text-sm text-gray-900">{{ history.position }}</p>
                                            <p class="text-xs text-gray-500">₱{{ history.salary.toLocaleString()
                                                }}/month</p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-xs text-gray-500">{{ new
                                                Date(history.startDate).toLocaleDateString() }}</p>
                                            <p class="text-xs"
                                                :class="history.endDate ? 'text-gray-500' : 'text-purple-600 font-medium'">
                                                {{ history.endDate ? new Date(history.endDate).toLocaleDateString() :
                                                'Current' }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="p-4 border-t border-gray-300 bg-gray-50 flex justify-end gap-2 sticky bottom-0">
                    <button @click="editEmployee(selectedEmployee)"
                        class="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1">
                        <span class="material-icons">edit</span>
                        Edit Profile
                    </button>
                    <button @click="showDetailsModal = false"
                        class="px-3 py-1 border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>

        <!-- Pending Request Details Modal -->
        <div v-if="showRequestModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto">
                <div class="p-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-800">Pending Request Details - {{
                        selectedRequest.firstName }} {{ selectedRequest.lastName }}</h2>
                </div>
                <div class="p-4">
                    <div class="space-y-4">
                        <div>
                            <h3 class="text-base font-semibold text-gray-800 mb-2">Personal Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">ID *</label>
                                    <input v-model.number="selectedRequest.id" type="number"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required min="1" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Employee Number *</label>
                                    <input v-model="selectedRequest.empNo"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">First Name *</label>
                                    <input v-model="selectedRequest.firstName"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Middle Name</label>
                                    <input v-model="selectedRequest.middleName"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Last Name *</label>
                                    <input v-model="selectedRequest.lastName"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Email *</label>
                                    <input v-model="selectedRequest.email" type="email"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Contact Number *</label>
                                    <input v-model="selectedRequest.contactNumber"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required pattern="\d{11}" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Civil Status *</label>
                                    <select v-model="selectedRequest.civilStatus"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Divorced">Divorced</option>
                                        <option value="Widowed">Widowed</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 class="text-base font-semibold text-gray-800 mb-2">Employment Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Position *</label>
                                    <select v-model="selectedRequest.position"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required>
                                        <option v-for="position in adminPositions" :key="position.name"
                                            :value="position.name">{{ position.name }}</option>
                                    </select>
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Hire Date *</label>
                                    <input v-model="selectedRequest.hireDate" type="date"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">SSS ID</label>
                                    <input v-model="selectedRequest.sss"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        pattern="\d{10}" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">PhilHealth ID</label>
                                    <input v-model="selectedRequest.philhealth"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        pattern="\d{12}" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Pag-IBIG ID</label>
                                    <input v-model="selectedRequest.hdmf"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        pattern="\d{12}" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">TIN</label>
                                    <input v-model="selectedRequest.tin"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        pattern="\d{9,12}" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 class="text-base font-semibold text-gray-800 mb-2">Financial Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Monthly Salary *</label>
                                    <input v-model.number="selectedRequest.salary" type="number"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required min="0" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Hourly Rate</label>
                                    <input :value="selectedRequest.hourlyRate.toLocaleString()" type="text"
                                        class="w-full p-1.5 text-sm border rounded-md bg-gray-100" disabled />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Travel Expenses</label>
                                    <input v-model.number="selectedRequest.earnings.travelExpenses" type="number"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        min="0" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Other Earnings</label>
                                    <input v-model.number="selectedRequest.earnings.otherEarnings" type="number"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        min="0" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">SSS Contribution</label>
                                    <input :value="calculateSSSContribution(selectedRequest.salary).toLocaleString()"
                                        class="w-full p-1.5 text-sm border rounded-md bg-gray-100" disabled />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">PhilHealth Contribution</label>
                                    <input
                                        :value="calculatePhilHealthContribution(selectedRequest.salary).toLocaleString()"
                                        class="w-full p-1.5 text-sm border rounded-md bg-gray-100" disabled />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Pag-IBIG Contribution</label>
                                    <input
                                        :value="calculatePagIBIGContribution(selectedRequest.salary).toLocaleString()"
                                        class="w-full p-1.5 text-sm border rounded-md bg-gray-100" disabled />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Withholding Tax</label>
                                    <input :value="calculateWithholdingTax(selectedRequest.salary).toLocaleString()"
                                        class="w-full p-1.5 text-sm border rounded-md bg-gray-100" disabled />
                                </div>
                            </div>
                        </div>
                        <div class="mt-4 p-3 bg-gray-50 rounded-md">
                            <div class="flex justify-between items-center text-sm">
                                <span class="font-medium text-gray-700">Net Salary Preview:</span>
                                <span class="font-semibold text-gray-900">₱{{
                                    calculateRequestNetSalary(selectedRequest).toLocaleString() }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button @click="saveRequestChanges"
                        class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                        :disabled="isEditingRequest">
                        <span class="material-icons">save</span>
                        {{ isEditingRequest ? 'Saving...' : 'Save Changes' }}
                    </button>
                    <button @click="approveRequest(selectedRequest)"
                        class="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                        :disabled="isEditingRequest">
                        <span class="material-icons">check_circle</span>
                        Approve
                    </button>
                    <button @click="rejectRequest(selectedRequest.id)"
                        class="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-800 transition-colors flex items-center gap-1"
                        :disabled="isEditingRequest">
                        <span class="material-icons">cancel</span>
                        Reject
                    </button>
                    <button @click="showRequestModal = false"
                        class="px-3 py-1.5 border text-sm rounded-md text-gray-700 hover:bg-gray-100">Close</button>
                </div>
            </div>
        </div>

        <!-- Add Employee Modal -->
        <div v-if="showAddModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                                    <label class="text-xs font-medium text-gray-600">ID *</label>
                                    <input v-model.number="newEmployee.id" type="number"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required min="1" />
                                </div>
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
                                    <label class="text-xs font-medium text-gray-600">Middle Name</label>
                                    <input v-model="newEmployee.middleName"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500" />
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
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Civil Status *</label>
                                    <select v-model="newEmployee.civilStatus"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Divorced">Divorced</option>
                                        <option value="Widowed">Widowed</option>
                                    </select>
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
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">SSS ID</label>
                                    <input v-model="newEmployee.sss"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        pattern="\d{10}" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">PhilHealth ID</label>
                                    <input v-model="newEmployee.philhealth"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        pattern="\d{12}" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Pag-IBIG ID</label>
                                    <input v-model="newEmployee.pagibig"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        pattern="\d{12}" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">TIN</label>
                                    <input v-model="newEmployee.tin"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        pattern="\d{9,12}" />
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
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Travel Expenses</label>
                                    <input v-model.number="newEmployee.earnings.travelExpenses" type="number"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        min="0" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Other Earnings</label>
                                    <input v-model.number="newEmployee.earnings.otherEarnings" type="number"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        min="0" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">SSS Contribution</label>
                                    <input :value="calculateSSSContribution(newEmployee.salary).toLocaleString()"
                                        class="w-full p-1.5 text-sm border rounded-md bg-gray-100" disabled />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">PhilHealth Contribution</label>
                                    <input :value="calculatePhilHealthContribution(newEmployee.salary).toLocaleString()"
                                        class="w-full p-1.5 text-sm border rounded-md bg-gray-100" disabled />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Pag-IBIG Contribution</label>
                                    <input :value="calculatePagIBIGContribution(newEmployee.salary).toLocaleString()"
                                        class="w-full p-1.5 text-sm border rounded-md bg-gray-100" disabled />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Withholding Tax</label>
                                    <input :value="calculateWithholdingTax(newEmployee.salary).toLocaleString()"
                                        class="w-full p-1.5 text-sm border rounded-md bg-gray-100" disabled />
                                </div>
                            </div>
                        </div>
                        <div class="mt-4 p-3 bg-gray-50 rounded-md">
                            <div class="flex justify-between items-center text-sm">
                                <span class="font-medium text-gray-700">Net Salary Preview:</span>
                                <span class="font-semibold text-gray-900">₱{{
                                    calculateNewEmployeeNetSalary().toLocaleString() }}</span>
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

        <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                                    <label class="text-xs font-medium text-gray-600">ID *</label>
                                    <input v-model.number="selectedEmployee.id" type="number"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required min="1" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Employee Number *</label>
                                    <input v-model="selectedEmployee.empNo"
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
                                    <label class="text-xs font-medium text-gray-600">Middle Name</label>
                                    <input v-model="selectedEmployee.middleName"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500" />
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
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Civil Status *</label>
                                    <select v-model="selectedEmployee.civilStatus"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        required>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Divorced">Divorced</option>
                                        <option value="Widowed">Widowed</option>
                                    </select>
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
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">SSS ID</label>
                                    <input v-model="selectedEmployee.sss"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        pattern="\d{10}" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">PhilHealth ID</label>
                                    <input v-model="selectedEmployee.philhealth"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        pattern="\d{12}" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Pag-IBIG ID</label>
                                    <input v-model="selectedEmployee.pagibig"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        pattern="\d{12}" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">TIN</label>
                                    <input v-model="selectedEmployee.tin"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        pattern="\d{9,12}" />
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
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Travel Expenses</label>
                                    <input v-model.number="selectedEmployee.earnings.travelExpenses" type="number"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        min="0" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Other Earnings</label>
                                    <input v-model.number="selectedEmployee.earnings.otherEarnings" type="number"
                                        class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                                        min="0" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">SSS Contribution</label>
                                    <input :value="calculateSSSContribution(selectedEmployee.salary).toLocaleString()"
                                        class="w-full p-1.5 text-sm border rounded-md bg-gray-100" disabled />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">PhilHealth Contribution</label>
                                    <input
                                        :value="calculatePhilHealthContribution(selectedEmployee.salary).toLocaleString()"
                                        class="w-full p-1.5 text-sm border rounded-md bg-gray-100" disabled />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Pag-IBIG Contribution</label>
                                    <input
                                        :value="calculatePagIBIGContribution(selectedEmployee.salary).toLocaleString()"
                                        class="w-full p-1.5 text-sm border rounded-md bg-gray-100" disabled />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-600">Withholding Tax</label>
                                    <input :value="calculateWithholdingTax(selectedEmployee.salary).toLocaleString()"
                                        class="w-full p-1.5 text-sm border rounded-md bg-gray-100" disabled />
                                </div>
                            </div>
                        </div>
                        <div class="mt-4 p-3 bg-gray-50 rounded-md">
                            <div class="flex justify-between items-center text-sm">
                                <span class="font-medium text-gray-700">Net Salary Preview:</span>
                                <span class="font-semibold text-gray-900">₱{{
                                    calculateNetSalary(selectedEmployee).toLocaleString() }}</span>
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

        <div v-if="showPositionModal"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                                        class="text-yellow-600 hover:text-yellow-800 p-1 rounded-full hover:bg-yellow-100">
                                        <span class="material-icons text-lg">edit</span>
                                    </button>
                                    <button @click="confirmDeletePosition(position)"
                                        class="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100">
                                        <span class="material-icons text-lg">delete</span>
                                    </button>
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

        <div v-if="showEditPositionModal"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-sm">
                <div class="p-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-800">Edit Position</h2>
                </div>
                <div class="p-4 space-y-3">
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-gray-600">Position Name *</label>
                        <input v-model="editPositionData.name"
                            class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500"
                            required />
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-medium text-gray-600">Monthly Salary *</label>
                        <input v-model.number="editPositionData.salary" type="number"
                            class="w-full p-1.5 text-sm border rounded-md focus:ring-1 focus:ring-indigo-500" required
                            min="0" />
                    </div>
                </div>
                <div class="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button @click="updatePosition"
                        class="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700"
                        :disabled="isUpdatingPosition">
                        {{ isUpdatingPosition ? 'Updating...' : 'Update' }}
                    </button>
                    <button @click="showEditPositionModal = false"
                        class="px-3 py-1.5 border text-sm rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Delete Position Confirmation Modal -->
        <div v-if="showDeletePositionModal"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-sm">
                <div class="p-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-800">Confirm Delete</h2>
                </div>
                <div class="p-4">
                    <p class="text-sm text-gray-700">Delete <strong>{{ selectedPosition.name }}</strong>?</p>
                </div>
                <div class="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button @click="deletePosition"
                        class="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        :disabled="isDeletingPosition">
                        {{ isDeletingPosition ? 'Deleting...' : 'Delete' }}
                    </button>
                    <button @click="showDeletePositionModal = false"
                        class="px-3 py-1.5 border text-sm rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Delete Employee Confirmation Modal -->
        <div v-if="showDeleteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-sm">
                <div class="p-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-800">Confirm Move to Trash</h2>
                </div>
                <div class="p-4">
                    <p class="text-sm text-gray-700">Move {{ selectedEmployee.firstName }} {{ selectedEmployee.lastName
                    }} to trash? This can be restored later.</p>
                </div>
                <div class="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <button @click="moveToTrash(selectedEmployee.id)"
                        class="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        :disabled="isDeleting">
                        {{ isDeleting ? 'Moving...' : 'Move to Trash' }}
                    </button>
                    <button @click="showDeleteModal = false"
                        class="px-3 py-1.5 border text-sm rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
                </div>
            </div>
        </div>

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