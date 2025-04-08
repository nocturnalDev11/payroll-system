// UpdatePasswordForm.vue
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';
import TextInput from '@/components/TextInput.vue';
import InputError from '@/components/InputError.vue';
import InputLabel from '@/components/InputLabel.vue';
import Toast from '@/components/Toast.vue'; // Import the Toast component

const route = useRoute();
const authStore = useAuthStore();
const adminId = computed(() => authStore.admin?._id || route.params.id);

const newRequest = ref({ password: '' });
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const passwordError = ref('');
const isSubmitting = ref(false);
const isLoading = ref(false);

// Array to manage multiple toasts
const toasts = ref([]);

// Function to add a toast
const addToast = (message, type = 'info', description = '', duration = 3000) => {
    const id = Date.now(); // Unique ID for each toast
    toasts.value.push({ id, message, type, description, duration });
};

// Function to remove a toast
const removeToast = (id) => {
    toasts.value = toasts.value.filter(toast => toast.id !== id);
};

onMounted(async () => {
    console.log('Initial authStore.admin:', authStore.admin);
    console.log('route.params.id:', route.params.id);
    console.log('Computed adminId:', adminId.value);

    if (!adminId.value && route.params.id) {
        isLoading.value = true;
        try {
            await authStore.fetchAdminDetails(route.params.id);
            if (!authStore.admin?._id) {
                addToast('Admin ID could not be retrieved after fetch.', 'error');
            }
        } catch (error) {
            addToast(`Failed to load admin details: ${error.message}`, 'error');
        } finally {
            isLoading.value = false;
        }
    } else if (!adminId.value) {
        addToast('No admin ID provided in route or auth store.', 'error');
    }
});

const resetForm = () => {
    newRequest.value = { password: '' };
    confirmPassword.value = '';
    showPassword.value = false;
    showConfirmPassword.value = false;
    passwordError.value = '';
};

const validatePassword = () => {
    const password = newRequest.value.password;
    if (!password) {
        passwordError.value = 'Password is required.';
    } else if (password.length < 8) {
        passwordError.value = 'Password must be at least 8 characters long.';
    } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        passwordError.value = 'Password must contain letters and numbers.';
    } else {
        passwordError.value = '';
    }
};

const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
};

const toggleConfirmPasswordVisibility = () => {
    showConfirmPassword.value = !showConfirmPassword.value;
};

const passwordStrength = computed(() => {
    const password = newRequest.value.password;
    if (!password) return 'Weak';
    if (password.length < 8) return 'Weak';
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const strengthScore = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (password.length >= 12 && strengthScore >= 3) return 'Strong';
    if (password.length >= 8 && strengthScore >= 2) return 'Medium';
    return 'Weak';
});

const passwordStrengthClass = computed(() => {
    return {
        'text-red-500': passwordStrength.value === 'Weak',
        'text-yellow-500': passwordStrength.value === 'Medium',
        'text-green-500': passwordStrength.value === 'Strong'
    };
});

const passwordsMatch = computed(() => {
    return newRequest.value.password === confirmPassword.value;
});

const isSubmitDisabled = computed(() => {
    return isSubmitting.value || !passwordsMatch.value || !!passwordError.value || isLoading.value;
});

const submitRequest = async () => {
    if (!passwordsMatch.value) {
        addToast('Passwords do not match.', 'error');
        return;
    }

    if (passwordError.value) {
        addToast('Please fix all validation errors before submitting.', 'error');
        return;
    }

    if (!adminId.value) {
        addToast('Admin ID is missing.', 'error');
        return;
    }

    isSubmitting.value = true;

    try {
        const payload = { password: newRequest.value.password };
        const response = await fetch(`${BASE_API_URL}/api/admin/update/${adminId.value}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authStore.accessToken}`
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Update failed');
            } else {
                const text = await response.text();
                throw new Error(`Update failed with status ${response.status}: ${text}`);
            }
        }

        const data = await response.json();
        addToast(data.message || 'Your password has been updated successfully.', 'success');
        resetForm();
    } catch (error) {
        console.error('Error during password update:', error);
        addToast(`Update password failed: ${error.message}`, 'error');
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div>
        <h2 class="text-lg font-medium text-gray-900">Update Password</h2>
        <p class="mt-1 text-sm text-gray-600">Ensure your password is at least 8 characters long and contains letters
            and numbers.</p>

        <div class="mt-6">
            <form @submit.prevent="submitRequest" novalidate>
                <div class="grid grid-cols-1 gap-y-6">
                    <div>
                        <InputLabel for="password" value="New Password" />
                        <div class="relative">
                            <TextInput id="password" v-model="newRequest.password"
                                :type="showPassword ? 'text' : 'password'" required autocomplete="new-password"
                                @input="validatePassword" :errorMessage="passwordError" :isLoading="isLoading" />
                            <button type="button"
                                class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                                @click="togglePasswordVisibility">
                                <span class="material-icons">
                                    {{ showPassword ? 'visibility_off' : 'visibility' }}
                                </span>
                            </button>
                        </div>
                        <InputError :message="passwordError" class="mt-2" />
                        <p class="mt-1 text-xs" :class="passwordStrengthClass">
                            Password Strength: {{ passwordStrength }}
                        </p>
                    </div>

                    <div>
                        <InputLabel for="confirm_password" value="Confirm Password" />
                        <div class="relative">
                            <TextInput id="confirm_password" class="mt-1 block w-full" v-model="confirmPassword"
                                :type="showConfirmPassword ? 'text' : 'password'" required
                                autocomplete="new-password" />
                            <button type="button"
                                class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                                @click="toggleConfirmPasswordVisibility">
                                <span class="material-icons">
                                    {{ showConfirmPassword ? 'visibility_off' : 'visibility' }}
                                </span>
                            </button>
                        </div>
                        <InputError :message="passwordsMatch ? '' : 'Passwords do not match.'" class="mt-2" />
                    </div>
                </div>
                <div class="mt-6 flex items-center justify-end">
                    <button type="submit" :disabled="isSubmitDisabled"
                        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                        Update Password
                    </button>
                </div>
            </form>
        </div>

        <!-- Render toasts -->
        <div class="fixed bottom-6 right-6 z-1000 flex flex-col gap-2">
            <Toast v-for="toast in toasts" :key="toast.id" :message="toast.message" :type="toast.type"
                :description="toast.description" :duration="toast.duration" @close="removeToast(toast.id)" />
        </div>
    </div>
</template>