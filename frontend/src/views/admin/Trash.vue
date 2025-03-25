<template>
    <div class="min-h-screen p-6">
        <!-- Header -->
        <header class="mb-8">
            <h1 class="text-3xl font-bold text-gray-800">Trash Bin</h1>
            <p class="text-gray-600">Manage employees moved to trash</p>
        </header>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        </div>

        <!-- Trash Table -->
        <div v-else-if="trashedEmployees.length > 0" class="bg-white shadow-lg rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Position</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trashed Date</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="employee in trashedEmployees" :key="employee._id"
                        class="hover:bg-gray-50 transition-colors">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ employee.empNo }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ `${employee.firstName}
                            ${employee.lastName}` }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ employee.position }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ formatDate(employee.trashedAt)
                            }}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button @click="restoreEmployee(employee._id)"
                                class="text-blue-600 hover:text-blue-800 mr-4 transition-colors">
                                Restore
                            </button>
                            <button @click="confirmDelete(employee._id)"
                                class="text-red-600 hover:text-red-800 transition-colors">
                                Delete Permanently
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center justify-center h-64 bg-white shadow-lg rounded-lg">
            <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                xmlns="http://www.w3.org/10.0/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                </path>
            </svg>
            <p class="text-gray-600 text-lg">No employees in trash</p>
        </div>

        <!-- Confirmation Modal -->
        <div v-if="showModal" class="fixed inset-0 bg-gray-600/50 bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Confirm Permanent Deletion</h3>
                <p class="text-gray-600 mb-6">Are you sure you want to permanently delete this employee? This action
                    cannot be undone.</p>
                <div class="flex justify-end space-x-4">
                    <button @click="showModal = false"
                        class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors">
                        Cancel
                    </button>
                    <button @click="permanentDelete"
                        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';

export default {
    data() {
        return {
            trashedEmployees: [],
            loading: true,
            showModal: false,
            employeeToDelete: null,
        };
    },
    setup() {
        const authStore = useAuthStore();
        return { authStore };
    },
    mounted() {
        if (!this.authStore.isAdmin) {
            this.$router.push('/unauthorized');
        } else {
            this.fetchTrashedEmployees();
        }
    },
    methods: {
        async fetchTrashedEmployees() {
            try {
                this.loading = true;
                const response = await axios.get(`${BASE_API_URL}/api/employees/trash`, {
                    headers: {
                        Authorization: `Bearer ${this.authStore.accessToken}`,
                        'user-role': this.authStore.userRole,
                    },
                });
                this.trashedEmployees = response.data;
            } catch (error) {
                console.error('Error fetching trashed employees:', error);
                if (error.response?.status === 401 || error.response?.status === 403) {
                    this.authStore.logout();
                    this.$router.push('/login');
                }
            } finally {
                this.loading = false;
            }
        },
        async restoreEmployee(id) {
            try {
                await axios.put(`${BASE_API_URL}/api/employees/trash/${id}/restore`, {}, {
                    headers: {
                        Authorization: `Bearer ${this.authStore.accessToken}`,
                        'user-role': this.authStore.userRole,
                    },
                });
                this.trashedEmployees = this.trashedEmployees.filter(emp => emp._id !== id);
            } catch (error) {
                console.error('Error restoring employee:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                alert(`Failed to restore employee: ${error.response?.data?.message || 'Unknown error'}`);
            }
        },
        confirmDelete(id) {
            this.employeeToDelete = id;
            this.showModal = true;
        },
        async permanentDelete() {
            try {
                await axios.delete(`${BASE_API_URL}/api/employees/trash/${this.employeeToDelete}`, {
                    headers: {
                        Authorization: `Bearer ${this.authStore.accessToken}`,
                        'user-role': this.authStore.userRole,
                    },
                });
                this.trashedEmployees = this.trashedEmployees.filter(emp => emp._id !== this.employeeToDelete);
                this.showModal = false;
                this.employeeToDelete = null;
            } catch (error) {
                console.error('Error permanently deleting employee:', error);
            }
        },
        formatDate(date) {
            if (!date || isNaN(new Date(date))) {
                return 'N/A';
            }
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        },
    },
};
</script>

<style scoped>
/* Add custom styles if needed */
</style>