<script setup>
import { ref, computed } from 'vue';
import { BASE_API_URL } from '@/utils/constants';
import InputError from '@/components/InputError.vue';
import InputLabel from '@/components/InputLabel.vue';
import TextInput from '@/components/TextInput.vue';

// Define reactive references
const newRequest = ref({ password: '' });
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const passwordError = ref('');
const isSubmitting = ref(false);
const updateMessage = ref('');
const signupMessage = ref('');

// Reset form
const resetForm = () => {
    newRequest.value = { password: '' };
    confirmPassword.value = '';
    showPassword.value = false;
    showConfirmPassword.value = false;
    passwordError.value = '';
    updateMessage.value = '';
    signupMessage.value = '';
};

// Validate password
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

// Toggle password visibility
const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
};

const toggleConfirmPasswordVisibility = () => {
    showConfirmPassword.value = !showConfirmPassword.value;
};

// Password strength computation
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

// Password match check
const passwordsMatch = computed(() => {
    return newRequest.value.password === confirmPassword.value;
});

// Submit button disable condition
const isSubmitDisabled = computed(() => {
    return isSubmitting.value || !passwordsMatch.value || !!passwordError.value;
});

// Submit request
const submitRequest = async () => {
    if (!passwordsMatch.value) {
        updateMessage.value = 'Passwords do not match.';
        return;
    }

    if (passwordError.value) {
        updateMessage.value = 'Please fix all validation errors before submitting.';
        return;
    }

    isSubmitting.value = true;
    updateMessage.value = '';

    try {
        const payload = { password: newRequest.value.password };

        const response = await fetch(`${BASE_API_URL}/api/employees/update/:id`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Registration failed');
        }

        const data = await response.json();
        signupMessage.value = 'Your account request has been submitted and is awaiting admin approval.';
        resetForm(); // Reset form on success
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
        <header>
            <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                Update Password
            </h2>

            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Ensure your account is using a long, random password to stay secure.
            </p>
        </header>

        <form @submit.prevent="submitRequest" class="mt-6 space-y-6">
            <!-- Password Input -->
            <div>
                <InputLabel for="password" value="New Password" />
                <div class="relative">
                    <TextInput id="password" type="password" class="mt-1 block w-full" v-model="newRequest.password"
                        :type="showPassword ? 'text' : 'password'" required autocomplete="new-password"
                        @input="validatePassword" />
                    <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
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

            <!-- Confirm Password Input -->
            <div>
                <InputLabel for="confirm_password" value="Confirm Password" />
                <div class="relative">
                    <TextInput id="confirm_password" type="password" class="mt-1 block w-full" v-model="confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'" required autocomplete="new-password" />
                    <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                        @click="toggleConfirmPasswordVisibility">
                        <span class="material-icons">
                            {{ showConfirmPassword ? 'visibility_off' : 'visibility' }}
                        </span>
                    </button>
                </div>
                <InputError :message="passwordsMatch ? '' : 'Passwords do not match.'" class="mt-2" />
            </div>

            <!-- Messages -->
            <div v-if="updateMessage" class="text-red-600 text-sm">{{ updateMessage }}</div>
            <div v-if="signupMessage" class="text-green-600 text-sm">{{ signupMessage }}</div>

            <!-- Submit Button -->
            <div class="flex items-center gap-4">
                <button type="submit" :disabled="isSubmitDisabled"
                    class="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-white uppercase tracking-wide hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    Update Password
                </button>
                <button type="button" @click="resetForm"
                    class="inline-flex items-center px-4 py-2 bg-gray-200 border border-gray-300 rounded-md font-semibold text-gray-700 uppercase tracking-wide hover:bg-gray-300 focus:outline-none">
                    Reset
                </button>
            </div>
        </form>
    </div>
</template>

<style scoped>
/* Add any additional scoped styles if needed */
</style>