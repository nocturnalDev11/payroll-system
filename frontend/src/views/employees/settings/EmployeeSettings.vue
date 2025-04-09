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
const employee = computed(() => authStore.employee);

onMounted(async () => {
    let _id = route.params._id || authStore.employee?._id;
    if (!_id) { error.value = 'No employee _id provided.'; isLoading.value = false; return; }
    if (!authStore.isAuthenticated) { error.value = 'Please log in.'; isLoading.value = false; router.push('/employee-login'); return; }
    if (authStore.userRole === 'employee' && _id !== authStore.employee?._id) { router.push(`/employee/settings/${authStore.employee._id}`); return; }

    try {
        isLoading.value = true;
        await authStore.fetchEmployeeDetails(_id);
        if (!employee.value?._id) throw new Error('Employee data invalid');
    } catch (err) {
        console.error('Failed to fetch employee:', err);
        error.value = err.message || 'Failed to load employee data';
        if (err.message.includes('Authentication')) { authStore.logout(); router.push('/employee-login'); }
    } finally { isLoading.value = false; }
});

const handleEmployeeUpdated = (updatedEmployee) => { employeeData.value = updatedEmployee; };
</script>

<template>
    <div class="space-y-2">
        <h2 class="pb-5 text-xl font-semibold leading-tight text-gray-800">Settings</h2>
        <div v-if="isLoading" class="text-center text-gray-600">Loading...</div>
        <div v-else-if="error" class="text-red-600 text-center">{{ error }}</div>
        <div v-else-if="employee" class="space-y-3">
            <div class="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <UploadProfilePicture :employee="employeeData" @employee-updated="handleEmployeeUpdated"
                    class="max-w-3xl" />
            </div>
            <div class="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <UpdateDetailsForm :employee="employee" @employee-updated="handleEmployeeUpdated" class="max-w-3xl" />
            </div>
            <div class="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <UpdatePasswordForm class="max-w-3xl" />
            </div>
        </div>
        <div v-else class="text-gray-600 text-center">No employee data available.</div>
    </div>
</template>