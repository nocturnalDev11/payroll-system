<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store.js';
import UpdateDetailsForm from './partials/UpdateDetailsForm.vue';
import UpdatePasswordForm from './partials/UpdatePasswordForm.vue';
import UploadProfilePicture from './partials/UploadProfilePicture.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const employeeData = ref(authStore.employee);
const isLoading = ref(true);
const error = ref(null);

// Make employee reactive
const employee = computed(() => authStore.employee);

onMounted(async () => {
    // Use route.params.id or fall back to authStore.employee?.id
    let id = route.params.id || authStore.employee?.id;

    if (!id) {
        error.value = 'No employee ID provided. Please ensure you are logged in.';
        isLoading.value = false;
        return;
    }

    if (!authStore.isAuthenticated) {
        error.value = 'You must be logged in to view this page.';
        isLoading.value = false;
        router.push('/login');
        return;
    }

    // If the user is an employee, they can only access their own settings
    if (authStore.userRole === 'employee' && id != authStore.employee?.id) {
        // Redirect to the employee's own settings page
        router.push(`/employees/${authStore.employee.id}/settings`);
        return;
    }

    try {
        isLoading.value = true;
        await authStore.fetchEmployeeDetails(id);
        if (!employee.value || !employee.value._id) {
            throw new Error('Employee data not found or invalid');
        }
    } catch (err) {
        console.error('Failed to fetch employee:', err);
        error.value = err.message || 'Failed to load employee data';
        // If the error indicates an authentication issue, redirect to login
        if (err.message.includes('Access denied') || err.message.includes('not authenticated')) {
            authStore.logout();
            router.push('/employee-login');
        }
    } finally {
        isLoading.value = false;
    }
});

onMounted(async () => {
    if (authStore.employee?.id) {
        try {
            await authStore.fetchEmployeeDetails(authStore.employee.id);
            employeeData.value = authStore.employee;
        } catch (error) {
            console.error('Failed to fetch employee:', error);
        }
    }
});

const handleEmployeeUpdated = (updatedEmployee) => {
    employeeData.value = updatedEmployee;
    console.log('Employee updated:', updatedEmployee);
};
</script>

<template>
    <div class="space-y-2">
        <h2 class="pb-5 text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
            Settings
        </h2>

        <div v-if="isLoading" class="text-center text-gray-600">
            Loading employee details...
        </div>
        <div v-else-if="error" class="text-red-600 text-center">
            {{ error }}
        </div>
        <div v-else-if="employee" class="space-y-3">
            <div class="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                <UploadProfilePicture :employee="employeeData" @employee-updated="handleEmployeeUpdated"
                    class="max-w-3xl" />
            </div>
            <div class="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                <UpdateDetailsForm :employee="employee" @employee-updated="handleEmployeeUpdated" class="max-w-3xl" />
            </div>
            <div class="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                <UpdatePasswordForm class="max-w-3xl" />
            </div>
        </div>
        <div v-else class="text-gray-600 text-center">
            No employee data available.
        </div>
    </div>
</template>