// UpdatePasswordForm.vue
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';
import TextInput from '@/components/TextInput.vue';
import InputError from '@/components/InputError.vue';
import InputLabel from '@/components/InputLabel.vue';

const route = useRoute();
const authStore = useAuthStore();
// Corrected: Remove .value and use _id consistently
const adminId = computed(() => authStore.admin?._id || route.params.id);

const newRequest = ref({ password: '' });
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const passwordError = ref('');
const isSubmitting = ref(false);
const updateMessage = ref('');
const signupMessage = ref('');
const isLoading = ref(false);

onMounted(async () => {
    console.log('Initial authStore.admin:', authStore.admin); // Debug log
    console.log('route.params.id:', route.params.id); // Debug log
    console.log('Computed adminId:', adminId.value); // Debug log

    if (!adminId.value && route.params.id) {
        isLoading.value = true;
        try {
            await authStore.fetchAdminDetails(route.params.id);
            // Corrected: Use _id instead of id
            if (!authStore.admin?._id) {
                updateMessage.value = 'Admin ID could not be retrieved after fetch.';
            }
        } catch (error) {
            updateMessage.value = `Failed to load admin details: ${error.message}`;
        } finally {
            isLoading.value = false;
        }
    } else if (!adminId.value) {
        updateMessage.value = 'No admin ID provided in route or auth store.';
    }
});

const resetForm = () => {
    newRequest.value = { password: '' };
    confirmPassword.value = '';
    showPassword.value = false;
    showConfirmPassword.value = false;
    passwordError.value = '';
    updateMessage.value = '';
    signupMessage.value = '';
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
        updateMessage.value = 'Passwords do not match.';
        return;
    }

    if (passwordError.value) {
        updateMessage.value = 'Please fix all validation errors before submitting.';
        return;
    }

    if (!adminId.value) {
        updateMessage.value = 'Admin ID is missing.';
        return;
    }

    isSubmitting.value = true;
    updateMessage.value = '';

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
        signupMessage.value = 'Your password has been updated successfully.';
        resetForm();
    } catch (error) {
        console.error('Error during password update:', error);
        updateMessage.value = `Update password failed: ${error.message}`;
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
                        ` <div class="relative">
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
                <div v-if="updateMessage" class="mt-4 text-red-600">{{ updateMessage }}</div>
                <div v-if="signupMessage" class="mt-4 text-green-600">{{ signupMessage }}</div>
            </form>
        </div>
    </div>
</template>