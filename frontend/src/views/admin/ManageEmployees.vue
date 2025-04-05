<script>
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store.js';
import { BASE_API_URL } from '@/utils/constants.js';
import EmployeeDetailsModal from './partials/manage-employees/EmployeeDetailsModal.vue';
import PendingRequestModal from './partials/manage-employees/PendingRequestModal.vue';
import AddEmployeeModal from './partials/manage-employees/AddEmployeeModal.vue';
import EditEmployeeModal from './partials/manage-employees/EditEmployeeModal.vue';
import PositionModal from './partials/manage-employees/PositionModal.vue';
import EditPositionModal from './partials/manage-employees/EditPositionModal.vue';
import DeletePositionModal from './partials/manage-employees/DeletePositionModal.vue';
import DeleteEmployeeModal from './partials/manage-employees/DeleteEmployeeModal.vue';
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
                civilStatus: 'Single',
                hireDate: new Date().toISOString().slice(0, 10),
                role: 'employee',
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
                    .filter(emp => emp.status === 'approved')
                    .map(emp => ({
                        ...emp,
                        id: emp.id,
                        _id: emp._id,
                        hourlyRate: emp.hourlyRate || (emp.salary / (8 * 22)),
                        empNo: emp.empNo || `EMP-${String(emp.id).padStart(4, '0')}`,
                        hireDate: new Date(emp.hireDate).toISOString().slice(0, 10),
                        payheads: Array.isArray(emp.payheads) ? emp.payheads : [], // Ensure payheads is an array
                        positionHistory: Array.isArray(emp.positionHistory) ? emp.positionHistory : [{
                            position: emp.position || 'N/A',
                            salary: emp.salary || 0,
                            startDate: new Date(emp.hireDate).toISOString().slice(0, 10),
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
                this.pendingRequests = (response.data || []).map(req => ({ ...req, _id: req._id }));
                console.log('Pending Requests:', this.pendingRequests);
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
            this.selectedEmployee = {
                ...employee,
                hireDate: new Date(employee.hireDate).toISOString().slice(0, 10),
            };
            this.showDetailsModal = true;
        },

        editEmployee(employee) {
            console.log('Editing employee:', employee);
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
            this.showDetailsModal = false;
            this.showEditModal = true;
        },

        async updateEmployee() {
            if (!this.selectedEmployee._id || typeof this.selectedEmployee._id !== 'string') {
                this.showErrorMessage('Invalid employee _id');
                return;
            }

            const requiredFields = [
                'empNo', 'firstName', 'lastName', 'position', 'salary',
                'email', 'contactInfo', 'username'
            ];

            const missingFields = requiredFields.filter(field => {
                const value = this.selectedEmployee[field];
                if (value === undefined || value === null) return true;
                if (['firstName', 'lastName', 'position', 'email', 'contactInfo'].includes(field)) {
                    return typeof value !== 'string' || value.trim() === '';
                }
                if (field === 'salary') {
                    return typeof value !== 'number' || value < 0;
                }
                return false;
            });

            if (missingFields.length > 0) {
                this.showErrorMessage(`Missing or invalid required fields: ${missingFields.join(', ')}`);
                return;
            }

            this.isUpdating = true;
            try {
                const originalEmployee = this.employees.find(emp => emp._id === this.selectedEmployee._id);
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

                // Clean and validate payheads
                const cleanedEmployee = { ...this.selectedEmployee };
                if (!Array.isArray(cleanedEmployee.payheads)) {
                    cleanedEmployee.payheads = [];
                } else {
                    cleanedEmployee.payheads = cleanedEmployee.payheads.filter(id => {
                        const isValidObjectId = typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
                        if (!isValidObjectId) {
                            console.warn(`Invalid payhead ID filtered out: ${id}`);
                        }
                        return isValidObjectId;
                    });
                }

                console.log('Cleaned employee data for update:', cleanedEmployee);
                console.log('Payheads after cleaning:', cleanedEmployee.payheads);

                const response = await axios.put(
                    `${BASE_API_URL}/api/employees/update/${this.selectedEmployee._id}`,
                    cleanedEmployee,
                    {
                        headers: {
                            Authorization: `Bearer ${this.authStore.accessToken}`,
                            'user-role': this.authStore.userRole,
                        },
                    }
                );

                if (response.status === 200) {
                    const index = this.employees.findIndex(emp => emp._id === this.selectedEmployee._id);
                    if (index !== -1) this.employees[index] = { ...cleanedEmployee };
                    this.showEditModal = false;
                    this.showSuccessMessage('Employee updated successfully');
                }
            } catch (error) {
                console.error('Error updating employee:', error);
                this.showErrorMessage(error.response?.data?.error || 'Failed to update employee');
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
                const employee = this.employees.find(emp => emp.id === id);
                if (!employee || !employee._id) {
                    this.showErrorMessage('Invalid employee _id');
                    return;
                }
                const response = await axios.put(
                    `${BASE_API_URL}/api/employees/${employee._id}/trash`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${this.authStore.accessToken}`,
                            'user-role': this.authStore.userRole,
                        },
                    }
                );
                if (response.status === 200) {
                    this.employees = this.employees.filter(emp => emp._id !== employee._id);
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
            this.isEditingRequest = false;
        },

        async saveRequestChanges() {
            const requiredFields = ['firstName', 'lastName', 'position', 'salary', 'email', 'contactInfo'];
            const missingFields = requiredFields.filter(field => {
                const value = this.selectedRequest[field];
                return value === undefined || value === null || (typeof value === 'string' && value.trim() === '') || (field === 'salary' && (typeof value !== 'number' || value < 0));
            });

            if (missingFields.length > 0) {
                this.showErrorMessage(`Missing or invalid required fields: ${missingFields.join(', ')}`);
                return;
            }

            this.isUpdating = true;
            try {
                const updatedRequest = { ...this.selectedRequest, hireDate: this.selectedRequest.hireDate };
                const response = await axios.put(
                    `${BASE_API_URL}/api/employees/pending-requests/${this.selectedRequest._id}`,
                    updatedRequest,
                    {
                        headers: {
                            Authorization: `Bearer ${this.authStore.accessToken}`,
                            'user-role': this.authStore.userRole,
                        },
                    }
                );

                if (response.status === 200) {
                    const index = this.pendingRequests.findIndex(req => req._id === this.selectedRequest._id);
                    if (index !== -1) this.pendingRequests[index] = { ...this.selectedRequest };
                    this.showSuccessMessage('Request updated successfully');
                    this.isEditingRequest = false;
                }
            } catch (error) {
                console.error('Error saving request changes:', error);
                this.showErrorMessage(error.response?.data?.error || 'Failed to save request changes');
            } finally {
                this.isUpdating = false;
            }
        },

        async approveRequest(request) {
            try {
                const updatedEmployee = {
                    status: 'approved',
                    hireDate: new Date(),
                    username: request.username || `${request.firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}`,
                    empNo: request.empNo || `EMP-${Date.now()}`,
                };
                const response = await axios.put(
                    `${BASE_API_URL}/api/employees/update/${request._id}`,
                    updatedEmployee,
                    {
                        headers: {
                            Authorization: `Bearer ${this.authStore.accessToken}`,
                            'user-role': this.authStore.userRole,
                        },
                    }
                );
                if (response.status === 200) {
                    this.pendingRequests = this.pendingRequests.filter(req => req._id !== request._id); // Match _id
                    this.employees.push(response.data.updatedEmployee);
                    this.showRequestModal = false;
                    this.showSuccessMessage('Employee approved successfully');
                }
            } catch (error) {
                console.error('Error approving request:', error);
                this.showErrorMessage('Error approving employee');
            }
        },

        async rejectRequest(_id) {
            try {
                const response = await axios.put(
                    `${BASE_API_URL}/api/employees/pending-requests/${_id}/reject`,
                    { status: 'rejected' },
                    {
                        headers: {
                            Authorization: `Bearer ${this.authStore.accessToken}`,
                            'user-role': this.authStore.userRole,
                        },
                    }
                );
                if (response.status === 200) {
                    this.pendingRequests = this.pendingRequests.filter(req => req._id !== _id);
                    this.showRequestModal = false;
                    this.showSuccessMessage('Application rejected successfully');
                }
            } catch (error) {
                console.error('Error rejecting request:', error);
                this.showErrorMessage('Failed to reject application');
            }
        },

        async addEmployee() {
            // Define required fields
            const requiredFields = [
                'empNo', 'firstName', 'lastName', 'position', 'salary',
                'email', 'contactInfo', 'username', 'password'
            ];

            // Check for missing or empty required fields
            const missingFields = requiredFields.filter(field => {
                const value = this.newEmployee[field];
                if (value === undefined || value === null) return true;
                if (['empNo', 'firstName', 'lastName', 'position', 'email', 'contactInfo', 'username', 'password'].includes(field)) {
                    return typeof value !== 'string' || value.trim() === '';
                }
                if (field === 'salary') {
                    return typeof value !== 'number' || value < 0;
                }
                return false;
            });

            if (missingFields.length > 0) {
                this.showErrorMessage(`Missing or invalid required fields: ${missingFields.join(', ')}`);
                return;
            }

            this.isAdding = true;
            try {
                const employeeData = {
                    ...this.newEmployee,
                    hourlyRate: this.newEmployee.hourlyRate,
                    role: 'employee',
                    civilStatus: this.newEmployee.civilStatus || 'Single',
                    hireDate: this.newEmployee.hireDate || new Date().toISOString().slice(0, 10),
                    positionHistory: [{
                        position: this.newEmployee.position,
                        salary: this.newEmployee.salary,
                        startDate: this.newEmployee.hireDate || new Date().toISOString().slice(0, 10),
                        endDate: null,
                    }],
                    status: 'approved', // Ensure status is set to 'approved' for new employees
                };

                // Remove id if present (let backend generate it)
                delete employeeData.id;

                const response = await axios.post(`${BASE_API_URL}/api/employees`, employeeData, {
                    headers: {
                        Authorization: `Bearer ${this.authStore.accessToken}`,
                        'user-role': this.authStore.userRole,
                    },
                });

                if (response.status === 201) {
                    this.employees.push({
                        ...response.data,
                        hourlyRate: response.data.hourlyRate || (response.data.salary / (8 * 22))
                    });
                    this.showAddModal = false;
                    this.resetNewEmployee();
                    this.showSuccessMessage('Employee added successfully');
                }
            } catch (error) {
                console.error('Error adding employee:', error);
                this.showErrorMessage(error.response?.data?.error || 'Failed to add employee');
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
                                    <td class="px-4 py-2">{{ (employee.firstName || '') + ' ' + (employee.lastName ||
                                        '') || 'N/A' }}</td>
                                    <td class="px-4 py-2">{{ employee.position || 'N/A' }}</td>
                                    <td class="px-4 py-2">₱{{ (employee.hourlyRate && !isNaN(employee.hourlyRate) ?
                                        employee.hourlyRate : 0).toLocaleString() }}</td>
                                    <td class="px-4 py-2">₱{{ (calculateNetSalary(employee) || 0).toLocaleString() }}
                                    </td>
                                    <td class="px-4 py-2 text-right flex justify-end gap-1">
                                        <button @click="viewEmployeeDetails(employee)"
                                            class="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-100">
                                            <span class="material-icons text-lg">visibility</span>
                                        </button>
                                        <button @click="editEmployee(employee)"
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
                                <button @click="approveRequest(request)"
                                    class="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100"
                                    title="Approve">
                                    <span class="material-icons text-lg">check_circle</span>
                                </button>
                                <button @click="rejectRequest(request._id)"
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

        <EmployeeDetailsModal :show="showDetailsModal" :employee="selectedEmployee" @close="showDetailsModal = false"
            @edit="editEmployee" />
        <PendingRequestModal :show="showRequestModal" :request="selectedRequest" :positions="adminPositions"
            @close="showRequestModal = false" @save="saveRequestChanges" @approve="approveRequest"
            @reject="rejectRequest" />
        <AddEmployeeModal :show="showAddModal" :employee="newEmployee" :positions="adminPositions"
            @close="showAddModal = false" @add-success="handleAddSuccess" />
        <EditEmployeeModal :show="showEditModal" :employee="selectedEmployee" :positions="adminPositions"
            @close="showEditModal = false" @update="updateEmployee" />
        <PositionModal :show="showPositionModal" :positions="adminPositions" :newPosition="newPosition"
            @close="showPositionModal = false" @create="createPosition" @edit="editPosition"
            @delete="confirmDeletePosition" />
        <EditPositionModal :show="showEditPositionModal" :position="editPositionData"
            @close="showEditPositionModal = false" @update="updatePosition" />
        <DeletePositionModal :show="showDeletePositionModal" :position="selectedPosition"
            @close="showDeletePositionModal = false" @delete="deletePosition" />
        <DeleteEmployeeModal :show="showDeleteModal" :employee="selectedEmployee" @close="showDeleteModal = false"
            @delete="moveToTrash" />

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
