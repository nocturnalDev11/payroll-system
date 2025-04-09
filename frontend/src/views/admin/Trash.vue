<template>
    <div class="min-h-screen p-6 space-y-3">
        <header
            class="bg-white shadow-lg p-3 flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-20 rounded-lg gap-3 md:gap-0">
            <h1 class="text-lg font-bold text-gray-800">Trash Bin</h1>
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
                <input v-model="searchQuery" type="text" placeholder="Search employees..."
                    class="p-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-48" />
                <button @click="refreshAll"
                    class="bg-indigo-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-indigo-700 transition flex items-center gap-1 w-full sm:w-auto justify-center">
                    <span class="material-icons text-lg">refresh</span>
                    Refresh
                </button>
            </div>
        </header>

        <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        </div>

        <div v-else-if="filteredEmployees.length > 0" class="bg-white shadow-lg rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Employee ID</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
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
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{
                                formatDate(employee.trashedAt)
                                }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <PrimaryButton @click="restoreEmployee(employee._id)">
                                    <span class="material-icons text-xs">refresh</span>
                                    Restore
                                </PrimaryButton>
                                <DangerButton @click="confirmDelete(employee._id)">
                                    <span class="material-icons text-xs">delete</span>
                                    Delete Permanently
                                </DangerButton>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center h-64 bg-white shadow-lg rounded-lg">
            <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                </path>
            </svg>
            <p class="text-gray-600 text-lg">No employees in trash</p>
        </div>

        <div v-if="showModal" class="fixed inset-0 bg-gray-600/50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Confirm Permanent Deletion</h3>
                <p class="text-gray-600 mb-6">Are you sure you want to permanently delete this employee? This action
                    cannot be undone.</p>
                <div class="flex justify-end space-x-2">
                    <SecondaryButton @click="showModal = false">
                        Cancel
                    </SecondaryButton>
                    <DangerButton @click="permanentDelete">
                        Delete
                    </DangerButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';
import DangerButton from '@/components/DangerButton.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import SecondaryButton from '@/components/SecondaryButton.vue';

export default {
    components: {
        DangerButton,
        PrimaryButton,
        SecondaryButton
    },
    data() {
        return {
            trashedEmployees: [],
            loading: true,
            showModal: false,
            employeeToDelete: null,
            searchQuery: '',
        };
    },
    setup() {
        const authStore = useAuthStore();
        return { authStore };
    },
    computed: {
        filteredEmployees() {
            return this.trashedEmployees.filter(employee => {
                const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
                return fullName.includes(this.searchQuery.toLowerCase());
            });
        },
    },
    mounted() {
        console.log('Mounted - Token:', this.authStore.accessToken, 'Role:', this.authStore.userRole, 'IsAdmin:', this.authStore.isAdmin);
        if (!this.authStore.accessToken || !this.authStore.isAdmin) {
            this.$router.push('/unauthorized');
        } else {
            this.fetchTrashedEmployees();
        }
    },
    methods: {
        resetFilters() {
            this.fetchTrashedEmployees();
        },
        async fetchTrashedEmployees() {
            try {
                this.loading = true;
                const headers = {
                    Authorization: `Bearer ${this.authStore.accessToken}`,
                    'user-role': this.authStore.userRole || 'admin',
                };
                console.log('Fetching trashed employees with headers:', headers);
                const response = await axios.get(`${BASE_API_URL}/api/employees/trash`, { headers });
                this.trashedEmployees = response.data || [];
                console.log('Trashed employees response:', response.data);
            } catch (error) {
                console.error('Error fetching trashed employees:', error);
                if (error.response) {
                    console.log('Response data:', error.response.data);
                    if (error.response.status === 401) {
                        this.authStore.logout();
                        this.$router.push('/login');
                    } else if (error.response.status === 403) {
                        this.$router.push('/unauthorized');
                    } else {
                        alert(`Error: ${error.response.data.message || 'Failed to fetch trashed employees'}`);
                    }
                } else {
                    alert('Network error: Unable to reach the server');
                }
                this.trashedEmployees = [];
            } finally {
                this.loading = false;
            }
        },
        async refreshAll() {
            await this.fetchTrashedEmployees();
            this.searchQuery = '';
        },
        async restoreEmployee(id) {
            try {
                await axios.put(`${BASE_API_URL}/api/employees/trash/${id}/restore`, {}, {
                    headers: {
                        Authorization: `Bearer ${this.authStore.accessToken}`,
                        'user-role': this.authStore.userRole || 'admin',
                    },
                });
                this.trashedEmployees = this.trashedEmployees.filter(emp => emp._id !== id);
            } catch (error) {
                console.error('Error restoring employee:', error);
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
                        'user-role': this.authStore.userRole || 'admin',
                    },
                });
                this.trashedEmployees = this.trashedEmployees.filter(emp => emp._id !== this.employeeToDelete);
                this.showModal = false;
                this.employeeToDelete = null;
            } catch (error) {
                console.error('Error permanently deleting employee:', error);
                alert(`Failed to delete employee: ${error.response?.data?.message || 'Unknown error'}`);
            }
        },
        formatDate(date) {
            if (!date || isNaN(new Date(date))) return 'N/A';
            return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        },
    },
};
</script>

<style scoped>
/* No changes needed here */
</style>
