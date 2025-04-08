<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store.js';
import UpdateDetailsForm from './partials/UpdateDetailsForm.vue';
import UpdatePasswordForm from './partials/UpdatePasswordForm.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const adminData = ref(authStore.admin);
const isLoading = ref(true);
const error = ref(null);

const admin = computed(() => authStore.admin);

onMounted(async () => {
    console.log('Initial authStore.admin:', authStore.admin);
    authStore.restoreSession();
    console.log('After restoreSession, authStore.admin:', authStore.admin);

    let id = route.params.id || authStore.admin?._id;
    console.log('Determined id:', id);

    if (!id) {
        error.value = 'No admin ID provided. Please ensure you are logged in.';
        isLoading.value = false;
        return;
    }

    if (!authStore.isAuthenticated) {
        error.value = 'You must be logged in to view this page.';
        isLoading.value = false;
        router.push('/admin-login');
        return;
    }

    if (authStore.userRole === 'admin' && id !== authStore.admin?._id) {
        router.push(`/admin/settings/${authStore.admin._id}`);
        return;
    }

    try {
        isLoading.value = true;
        await authStore.fetchAdminDetails(id);
        // Corrected check: Remove .value
        if (!authStore.admin?._id) {
            throw new Error('Admin data not found or invalid');
        }
        adminData.value = authStore.admin;
    } catch (err) {
        console.error('Failed to fetch admin:', err);
        error.value = err.message || 'Failed to load admin data';
        if (err.message.includes('Authentication failed') || err.message.includes('Invalid or expired token')) {
            authStore.logout();
            router.push('/admin-login');
        }
    } finally {
        isLoading.value = false;
    }
});

const handleAdminUpdated = (updatedAdmin) => {
    adminData.value = updatedAdmin;
    console.log('Admin updated:', updatedAdmin);
};
</script>

<template>
    <div class="space-y-2">
        <h2 class="pb-5 text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
            Settings
        </h2>

        <div v-if="isLoading" class="text-center text-gray-600">
            Loading admin details...
        </div>
        <div v-else-if="error" class="text-red-600 text-center">
            {{ error }}
        </div>

        <div v-else-if="admin" class="space-y-4">
            <div class="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <UpdateDetailsForm :admin="admin" @admin-updated="handleAdminUpdated" class="max-w-3xl" />
            </div>

            <div class="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <UpdatePasswordForm class="max-w-3xl" />
            </div>
        </div>

        <div v-else class="text-gray-600 text-center">
            No admin data available.
        </div>
    </div>
</template>