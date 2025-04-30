<template>
    <div v-if="showUpdateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 class="text-base font-medium text-gray-800 mb-4 flex items-center gap-1">
                <span class="material-icons text-sm">edit</span>
                Update Employee Position
            </h2>
            <div class="mb-4">
                <label class="block text-sm text-gray-700 mb-1">Select Employee</label>
                <select v-model="selectedEmployeeForUpdate" class="w-full p-2 border border-gray-300 rounded text-sm">
                    <option value="" disabled>Select an employee</option>
                    <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                        {{ emp.name }} ({{ getPositionName(emp.position) }})
                    </option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm text-gray-700 mb-1">New Position</label>
                <select v-model="newPosition" class="w-full p-2 border border-gray-300 rounded text-sm">
                    <option value="" disabled>Select a position</option>
                    <option v-for="pos in positions" :key="pos.name" :value="pos.name">
                        {{ pos.name }} (₱{{ pos.salary.toLocaleString() }})
                    </option>
                </select>
            </div>
            <div class="flex justify-end gap-2">
                <button @click="$emit('close-update-modal')"
                    class="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
                    Cancel
                </button>
                <button @click="updateEmployeePosition"
                    class="flex items-center gap-1 px-4 py-2 text-sm text-white bg-orange-500 rounded hover:bg-orange-600"
                    :disabled="!selectedEmployeeForUpdate || !newPosition || isLoading">
                    <span class="material-icons text-sm">save</span>
                    Update
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import moment from 'moment';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';

export default {
    name: 'UpdatePositionModal',
    props: {
        showUpdateModal: Boolean,
        employees: Array,
        positions: Array,
        currentDate: String,
    },
    data() {
        return {
            selectedEmployeeForUpdate: '',
            newPosition: '',
            isLoading: false,
        };
    },
    setup() {
        const authStore = useAuthStore();
        return { authStore };
    },
    methods: {
        getPositionName(positionName) {
            const position = this.positions.find(p => p.name.trim().toLowerCase() === positionName?.trim().toLowerCase());
            return position ? position.name : positionName || 'Unknown Position';
        },
        async updateEmployeePosition() {
            if (!this.selectedEmployeeForUpdate || !this.newPosition) return;
            this.isLoading = true;
            try {
                const employee = this.employees.find(emp => emp.id === this.selectedEmployeeForUpdate);
                const newPositionData = this.positions.find(pos => pos.name === this.newPosition);
                const today = moment(this.currentDate).format('YYYY-MM-DD');

                const updatedPositionHistory = employee.positionHistory.map(history => {
                    if (!history.endDate) {
                        return { ...history, endDate: today };
                    }
                    return history;
                });
                updatedPositionHistory.push({
                    position: newPositionData.name,
                    salary: newPositionData.salary,
                    startDate: today,
                    endDate: null,
                });

                const token = this.authStore.accessToken || localStorage.getItem('token');
                if (!token) throw new Error('No authentication token available');

                const response = await axios.put(`${BASE_API_URL}/api/employees/update/${employee.id}`, {
                    position: newPositionData.name,
                    salary: newPositionData.salary,
                    positionHistory: updatedPositionHistory,
                }, {
                    headers: {
                        'user-role': this.authStore.userRole || 'admin',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.status === 200) {
                    const updatedEmployee = {
                        ...employee,
                        position: newPositionData.name,
                        salary: newPositionData.salary,
                        positionHistory: updatedPositionHistory,
                    };
                    this.$emit('update-employee', updatedEmployee);
                    this.$emit('show-success-message', `Position updated for ${employee.name} to ${newPositionData.name}!`);
                    this.$emit('close-update-modal');
                }
            } catch (error) {
                console.error('Error updating position:', error);
                this.$emit('show-error-message', `Failed to update position: ${error.message}`);
            } finally {
                this.isLoading = false;
            }
        },
    },
    emits: ['close-update-modal', 'update-employee', 'show-success-message', 'show-error-message'],
};
</script>