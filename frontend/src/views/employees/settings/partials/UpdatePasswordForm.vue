<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';
import TextInput from '@/components/TextInput.vue';
import InputError from '@/components/InputError.vue';
import InputLabel from '@/components/InputLabel.vue';
import Toast from '@/components/Toast.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const employeeId = computed(() => authStore.employee?._id || route.params._id);

const newRequest = ref({ password: '', currentPassword: '' });
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const showCurrentPassword = ref(false);
const passwordError = ref('');
const isSubmitting = ref(false);
const isLoading = ref(false);
const toasts = ref([]);

onMounted(async () => {
    if (!employeeId.value && route.params._id) {
        isLoading.value = true;
        try {
            await authStore.fetchEmployeeDetails(route.params._id);
            if (!authStore.employee?._id) {
                addToast('Employee ID could not be retrieved.', 'error');
            }
        } catch (error) {
            addToast(`Failed to load employee details: ${error.message}`, 'error');
        } finally {
            isLoading.value = false;
        }
    } else if (!employeeId.value) {
        addToast('No employee ID provided.', 'error');
    }
});

const addToast = (message, type = 'info', description = '') => {
    toasts.value.push({ id: Date.now(), message, type, description });
};

const removeToast = (id) => {
    toasts.value = toasts.value.filter(toast => toast.id !== id);
};

const resetForm = () => {
    newRequest.value = { password: '', currentPassword: '' };
    confirmPassword.value = '';
    showPassword.value = false;
    showConfirmPassword.value = false;
    showCurrentPassword.value = false;
    passwordError.value = '';
};

const validatePassword = () => {
    const password = newRequest.value.password;
    if (!password) passwordError.value = 'Password is required.';
    else if (password.length < 8) passwordError.value = 'Password must be at least 8 characters.';
    else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) passwordError.value = 'Password must contain letters and numbers.';
    else passwordError.value = '';
};

const togglePasswordVisibility = () => { showPassword.value = !showPassword.value; };
const toggleConfirmPasswordVisibility = () => { showConfirmPassword.value = !showConfirmPassword.value; };
const toggleCurrentPasswordVisibility = () => { showCurrentPassword.value = !showCurrentPassword.value; };

const passwordStrength = computed(() => {
    const password = newRequest.value.password;
    if (!password) return 'Weak';
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const strengthScore = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (password.length >= 12 && strengthScore >= 3) return 'Strong';
    if (password.length >= 8 && strengthScore >= 2) return 'Medium';
    return 'Weak';
});

const passwordStrengthClass = computed(() => ({
    'text-red-500': passwordStrength.value === 'Weak',
    'text-yellow-500': passwordStrength.value === 'Medium',
    'text-green-500': passwordStrength.value === 'Strong'
}));

const passwordsMatch = computed(() => newRequest.value.password === confirmPassword.value);
const isSubmitDisabled = computed(() =>
    isSubmitting.value ||
    !passwordsMatch.value ||
    !!passwordError.value ||
    isLoading.value ||
    !newRequest.value.currentPassword
);

const submitRequest = async () => {
    if (!passwordsMatch.value) {
        addToast('Passwords do not match.', 'error');
        return;
    }

    if (passwordError.value) {
        addToast('Please fix validation errors.', 'error');
        return;
    }

    if (!employeeId.value) {
        addToast('Employee ID is missing.', 'error');
        return;
    }

    isSubmitting.value = true;

    try {
        const payload = {
            password: newRequest.value.password,
            currentPassword: newRequest.value.currentPassword
        };
        console.log('Sending payload:', payload);
        console.log('Employee ID:', employeeId.value);
        console.log('API URL:', `${BASE_API_URL}/api/employees/update-password/${employeeId.value}`);
        const response = await fetch(`${BASE_API_URL}/api/employees/update-password/${employeeId.value}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authStore.accessToken}`
            },
            body: JSON.stringify(payload),
        });

        console.log('Response status:', response.status);
        const responseData = await response.json();
        console.log('Response data:', responseData);

        if (!response.ok) {
            throw new Error(responseData.message || 'Update failed');
        }

        addToast('Password updated successfully. Please log in again.', 'success');
        await authStore.logout();
        router.push('/employee-login');
    } catch (error) {
        addToast(`Update failed: ${error.message}`, 'error');
        console.error('Update error:', error);
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div>
        <header>
            <h2 class="text-lg font-medium text-gray-900">Update Password</h2>
            <p class="mt-1 text-sm text-gray-600">Ensure your account is secure.</p>
        </header>

        <form @submit.prevent="submitRequest" class="mt-6 space-y-6">
            <div v-if="isLoading" class="text-center text-gray-600">Loading employee details...</div>
            <div>
                <InputLabel for="current_password" value="Current Password" />
                <div class="relative">
                    <TextInput id="current_password" class="mt-1 block w-full" v-model="newRequest.currentPassword"
                        :type="showCurrentPassword ? 'text' : 'password'" required autocomplete="current-password" />
                    <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                        @click="toggleCurrentPasswordVisibility">
                        <span class="material-icons">{{ showCurrentPassword ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                </div>
            </div>
            <div>
                <InputLabel for="password" value="New Password" />
                <div class="relative">
                    <TextInput id="password" class="mt-1 block w-full" v-model="newRequest.password"
                        :type="showPassword ? 'text' : 'password'" required autocomplete="new-password"
                        @input="validatePassword" />
                    <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                        @click="togglePasswordVisibility">
                        <span class="material-icons">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                </div>
                <InputError :message="passwordError" class="mt-2" />
                <p class="mt-1 text-xs" :class="passwordStrengthClass">Password Strength: {{ passwordStrength }}</p>
            </div>
            <div>
                <InputLabel for="confirm_password" value="Confirm Password" />
                <div class="relative">
                    <TextInput id="confirm_password" class="mt-1 block w-full" v-model="confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'" required autocomplete="new-password" />
                    <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                        @click="toggleConfirmPasswordVisibility">
                        <span class="material-icons">{{ showConfirmPassword ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                </div>
                <InputError :message="passwordsMatch ? '' : 'Passwords do not match.'" class="mt-2" />
            </div>
            <div class="flex items-center gap-4">
                <button type="submit" :disabled="isSubmitDisabled"
                    class="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-white tracking-wide hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    Update Password
                </button>
                <button type="button" @click="resetForm"
                    class="inline-flex items-center px-4 py-2 bg-gray-200 border border-gray-300 rounded-md font-semibold text-gray-700 tracking-wide hover:bg-gray-300 focus:outline-none">
                    Reset
                </button>
            </div>
        </form>
        <div class="fixed bottom-6 right-6 space-y-2">
            <Toast v-for="toast in toasts" :key="toast.id" :message="toast.message" :type="toast.type"
                :description="toast.description" :duration="3000" @close="removeToast(toast.id)" />
        </div>
    </div>
</template>