<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import UpdateDetailsForm from './Partials/UpdateDetailsForm.vue';
import UpdatePasswordForm from './Partials/UpdatePasswordForm.vue';
import UploadProfilePicture from './Partials/UploadProfilePicture.vue';

const route = useRoute();
const authStore = useAuthStore();
const isLoading = ref(true);
const error = ref(null);

// Make employee reactive
const employee = computed(() => authStore.employee);

onMounted(async () => {
    const id = route.params.id || authStore.employee?.value?.id;
    if (id) {
        try {
            isLoading.value = true;
            await authStore.fetchEmployeeDetails(id);
            if (!employee.value || !employee.value._id) {
                throw new Error('Employee data not found or invalid');
            }
        } catch (err) {
            console.error('Failed to fetch employee:', err);
            error.value = err.message || 'Failed to load employee data';
        } finally {
            isLoading.value = false;
        }
    } else {
        error.value = 'No employee ID provided';
        isLoading.value = false;
    }
});

const handleEmployeeUpdated = (updatedEmployee) => {
    authStore.setEmployee(updatedEmployee);
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
                <UploadProfilePicture :employee="employee" @employee-updated="handleEmployeeUpdated" class="max-w-3xl" />
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