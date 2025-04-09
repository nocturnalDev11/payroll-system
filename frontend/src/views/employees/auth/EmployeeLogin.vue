<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store.js';
import { BASE_API_URL } from '@/utils/constants.js';
import Toast from '@/components/Toast.vue';
import TextInput from '@/components/TextInput.vue';
import InputLabel from '@/components/InputLabel.vue';
import EmployeeSignup from './EmployeeSignup.vue';

const route = useRoute();
const router = useRouter();

const isLoading = ref(false);
const username = ref('');
const password = ref('');
const auth = useAuthStore();
const toasts = ref([]);
const showPassword = ref(false);

// Function to add a new toast
function addToast(message, type = 'info') {
    const id = Date.now();
    toasts.value.push({ id, message, type });
}

// Function to remove a toast
function removeToast(id) {
    toasts.value = toasts.value.filter(toast => toast.id !== id);
}

// Toggle password visibility
function togglePassword() {
    showPassword.value = !showPassword.value;
}

async function login() {
    try {
        isLoading.value = true;

        const response = await fetch(`${BASE_API_URL}/api/employees/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username.value.toLowerCase(),
                password: password.value,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            auth.setEmployee({
                id: data.employee.id,
                firstName: data.employee.firstName,
                lastName: data.employee.lastName,
                username: data.employee.username,
                email: data.employee.email,
                employeeIdNumber: data.employee.employeeIdNumber,
                birthday: data.employee.birthday,
                hireDate: data.employee.hireDate,
                contactInfo: data.employee.contactInfo,
                civilStatus: data.employee.civilStatus,
                position: data.employee.position,
                salary: data.employee.salary,
                sss: data.employee.sss,
                philHealth: data.employee.philHealth,
                pagIbig: data.employee.pagIbig,
                role: data.employee.role,
            });
            auth.setAccessToken(data.token);

            addToast('Login successful! Redirecting...', 'success');

            const redirectPath = route.query.redirect || '/employee/dashboard';
            router.push(redirectPath);
        } else {
            const message = data.message || 'Login failed';
            if (message.includes('Email not found')) {
                addToast('Email not found. Please check your email.', 'error');
            } else if (message.includes('Incorrect password')) {
                addToast('Incorrect password. Please try again.', 'error');
            } else if (message.includes('awaiting approval')) {
                addToast('Account awaiting approval. Please wait for admin approval.', 'warning');
            } else if (message.includes('rejected')) {
                addToast('Account request was rejected. Contact the administrator.', 'error');
            } else {
                addToast(message, 'error');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        addToast('Something went wrong. Please try again.', 'error');
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center p-4">
        <div class="w-full max-w-md relative">
            <!-- Toast Container -->
            <div class="absolute top-0 left-0 right-0 flex flex-col items-center space-y-2">
                <Toast v-for="toast in toasts" :key="toast.id" :message="toast.message" :type="toast.type"
                    :duration="3000" @close="removeToast(toast.id)" />
            </div>

            <div class="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-6">
                <div class="text-center space-y-2">
                    <router-link :to="{ name: 'LoginSelection' }">
                        <div class="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    </router-link>
                    <h1 class="text-2xl font-bold text-gray-900">Employee Portal</h1>
                    <p class="text-gray-500 text-sm">Welcome to your workspace</p>
                </div>

                <form @submit.prevent="login" class="space-y-4">
                    <div class="space-y-1">
                        <InputLabel for="username" value="Username" />
                        <TextInput id="username" v-model="username" type="text" class="mt-1 block w-full"
                            placeholder="Enter your username" required />
                    </div>

                    <div class="space-y-1">
                        <InputLabel for="password" value="Password" />
                        <div class="relative">
                            <TextInput id="password" class="mt-1 block w-full" v-model="password"
                                :type="showPassword ? 'text' : 'password'" placeholder="Enter your password" required />
                            <span @click="togglePassword"
                                class="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-500">
                                <i class="material-icons">
                                    {{ showPassword ? 'visibility_off' : 'visibility' }}
                                </i>
                            </span>
                        </div>
                    </div>

                    <div class="flex items-center justify-end">
                        <router-link :to="{ name: 'ForgotPassword' }"
                            class="text-sm text-indigo-600 hover:text-indigo-700">
                            Forgot Password?
                        </router-link>
                    </div>

                    <button type="submit" :disabled="isLoading"
                        class="w-full bg-blue-500 text-white py-2.5 rounded-lg cursor-pointer disabled:bg-blue-300">
                        {{ isLoading ? 'Signing in...' : 'Sign in' }}
                    </button>
                </form>

                <div class="text-center">
                    <EmployeeSignup />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* No additional styles needed if using Tailwind */
</style>