<script setup>
import { ref, onMounted } from 'vue';
import { BASE_API_URL } from '@/utils/constants.js';

const trashedEmployees = ref([]);
const isLoading = ref(false);
const errorMessage = ref(null);
const successMessage = ref(null);

const getAuthToken = () => {
    return localStorage.getItem('token'); // Adjust based on your auth implementation
};

const fetchTrashedEmployees = async () => {
    isLoading.value = true;
    errorMessage.value = null;

    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No authentication token found. Please login again.');
        }

        const response = await fetch(`${BASE_API_URL}/api/employees/trashed`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        trashedEmployees.value = await response.json();
    } catch (error) {
        console.error('Failed to fetch trashed employees:', error);
        let message = 'Failed to load trashed employees';
        if (error.message.includes('401')) {
            message = 'Unauthorized: Please login as admin';
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            message = 'Network error: Unable to connect to server';
        }
        showErrorMessage(message);
    } finally {
        isLoading.value = false;
    }
};

const restoreEmployee = async (id) => {
    try {
        const token = getAuthToken();
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${BASE_API_URL}/api/employees/restore/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to restore employee');
        }

        trashedEmployees.value = trashedEmployees.value.filter(emp => emp._id !== id);
        showSuccessMessage('Employee restored successfully');
    } catch (error) {
        console.error('Restore error:', error);
        showErrorMessage(`Failed to restore employee: ${error.message}`);
    }
};

const permanentlyDeleteEmployee = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this employee?')) return;

    try {
        const token = getAuthToken();
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${BASE_API_URL}/api/employees/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete employee');
        }

        trashedEmployees.value = trashedEmployees.value.filter(emp => emp._id !== id);
        showSuccessMessage('Employee permanently deleted');
    } catch (error) {
        console.error('Delete error:', error);
        showErrorMessage(`Failed to permanently delete employee: ${error.message}`);
    }
};

const showSuccessMessage = (msg) => {
    successMessage.value = msg;
    setTimeout(() => (successMessage.value = null), 3000);
};

const showErrorMessage = (msg) => {
    errorMessage.value = msg;
    setTimeout(() => (errorMessage.value = null), 3000);
};

onMounted(() => {
    fetchTrashedEmployees();
});
</script>

<template>
    <div class="min-h-screen bg-gray-50 px-10 p-1">
        <div class="max-w-8xl">
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                <div class="p-6 flex justify-between items-center">
                    <h2 class="text-xl font-bold text-gray-800">Trashed Employees</h2>
                    <button @click="fetchTrashedEmployees"
                        class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        :disabled="isLoading">
                        {{ isLoading ? 'Refreshing...' : 'Refresh' }}
                    </button>
                </div>

                <div v-if="successMessage" class="p-4 bg-green-100 text-green-700">
                    {{ successMessage }}
                </div>
                <div v-if="errorMessage" class="p-4 bg-red-100 text-red-700">
                    {{ errorMessage }}
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Employee ID</th>
                                <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Name</th>
                                <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Position</th>
                                <th class="px-6 py-4 text-left text-sm font-medium text-gray-500">Trashed Date</th>
                                <th class="px-6 py-4 text-right text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr v-for="employee in trashedEmployees" :key="employee._id"
                                class="hover:bg-gray-50 transition duration-200">
                                <td class="px-6 py-4 text-sm text-gray-900">{{ employee.employeeIdNumber || 'N/A' }}
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-900">{{ employee.firstName }} {{
                                    employee.lastName }}</td>
                                <td class="px-6 py-4 text-sm text-gray-900">{{ employee.position || 'N/A' }}</td>
                                <td class="px-6 py-4 text-sm text-gray-900">
                                    {{ employee.trashedAt ? new Date(employee.trashedAt).toLocaleDateString() : 'N/A' }}
                                </td>
                                <td class="px-6 py-4 text-right flex justify-end gap-3">
                                    <button @click="restoreEmployee(employee._id)"
                                        class="text-green-600 hover:bg-green-50 px-3 py-1 rounded-md">
                                        Restore
                                    </button>
                                    <button @click="permanentlyDeleteEmployee(employee._id)"
                                        class="text-red-600 hover:bg-red-50 px-3 py-1 rounded-md">
                                        Delete Permanently
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="trashedEmployees.length === 0 && !isLoading">
                                <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                                    No trashed employees found.
                                </td>
                            </tr>
                            <tr v-if="isLoading">
                                <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.transition-colors {
    transition: all 0.2s ease-in-out;
}
</style>