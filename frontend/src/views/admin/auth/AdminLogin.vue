<script>
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store.js';

export default {
    name: 'AdminLogin',
    data() {
        return {
            username: '',
            password: '',
            loginError: false,
            errorMessage: '',
            isLoading: false,
        };
    },
    setup() {
        const authStore = useAuthStore();
        return { authStore };
    },
    mounted() {
        this.authStore.restoreSession();
        if (this.authStore.isAuthenticated && this.authStore.userRole === 'admin') {
            this.$router.push('admin/dashboard');
        }
    },
    methods: {
        async login() {
            this.isLoading = true;
            this.loginError = false;
            this.errorMessage = '';

            try {
                const response = await axios.post(
                    'http://localhost:7777/api/admin/login',
                    { username: this.username.trim(), password: this.password.trim() },
                    { headers: { 'Content-Type': 'application/json' } }
                );

                // Check if response contains a token (indicating success)
                if (!response.data.token) {
                    throw new Error(response.data.message || 'Login failed');
                }

                // Extract token and admin data
                const { token, id, username, email } = response.data;
                const admin = { id, username, email, role: 'admin' };
                this.authStore.setAdmin(admin);
                this.authStore.setAccessToken(token);
                this.$router.push('/admin/dashboard');
            } catch (error) {
                this.loginError = true;
                this.errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
                console.error('Login error:', error.response?.data || error);
                this.password = '';
            } finally {
                this.isLoading = false;
            }
        },
        forgotPassword() {
            // Placeholder for forgot password logic
            console.log('Forgot password clicked');
        }
    },
};
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div class="w-full max-w-md">
            <!-- Admin Login Card with Fade-In Animation -->
            <div
                class="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-6 transform transition-all duration-500 ease-out animate-fadeIn">
                <!-- Admin Brand Area -->
                <div class="text-center space-y-2">
                    <div
                        class="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" />
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900">Admin Portal</h1>
                    <p class="text-gray-500 text-sm">Secure administrative access</p>
                </div>

                <!-- Error Alert with Pulse Animation -->
                <div v-if="loginError"
                    class="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 animate-pulse-fast">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd" />
                    </svg>
                    <span class="text-sm">{{ errorMessage }}</span>
                </div>

                <!-- Login Form -->
                <form @submit.prevent="login" class="space-y-4">
                    <div class="space-y-1">
                        <label for="username" class="text-sm font-medium text-gray-700">Admin Username</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                    stroke="#1e2939">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input v-model="username" type="text" id="username" name="username" :class="[
                                'block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-300 outline-none backdrop-blur-sm transition-all duration-300 ease-in-out hover:border-indigo-300',
                                loginError ? 'border-red-300' : 'border-gray-300'
                            ]" placeholder="Enter admin username" required />
                        </div>
                    </div>

                    <div class="space-y-1">
                        <label for="password" class="text-sm font-medium text-gray-700">Password</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                    stroke="#1e2939">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input v-model="password" type="password" id="password" name="password" :class="['block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-300 outline-none backdrop-blur-sm transition-all duration-300 ease-in-out hover:border-indigo-300',
                                loginError ? 'border-red-300' : 'border-gray-300']" placeholder="Enter your password"
                                required />
                        </div>
                    </div>

                    <div class="flex items-center justify-end">
                        <button type="button" @click="forgotPassword"
                            class="text-sm text-indigo-600 hover:text-indigo-700 transition-colors duration-300 hover:underline">
                            Forgot password?
                        </button>
                    </div>

                    <button type="submit" :disabled="isLoading"
                        class="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                        <span v-if="!isLoading">Sign in as Admin</span>
                        <span v-else class="flex items-center justify-center">Signing in... <span
                                class="ml-2 inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span></span>
                    </button>
                </form>

                <div class="text-center text-sm text-gray-500">
                    Protected administrative area
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulseSlow {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.1);
    }
}

@keyframes pulseFast {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
}

.animate-pulse-slow {
    animation: pulseSlow 2s infinite ease-in-out;
}

.animate-pulse-fast {
    animation: pulseFast 1s infinite ease-in-out;
}

.animate-spin {
    animation: spin 0.8s linear infinite;
}
</style>