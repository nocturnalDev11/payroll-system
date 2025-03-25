<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth.store.ts'
import { BASE_API_URL } from '../../../utils/constants.js'

const route = useRoute();
const router = useRouter();

const isLoading = ref(false);
const errorMessage = ref('');
const email = ref('');
const password = ref('');
const auth = useAuthStore();

async function login() {
    try {
        isLoading.value = true;
        errorMessage.value = ''; 

        const response = await fetch(`${BASE_API_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email.value.toLowerCase(),
                password: password.value,
            }),
        });

        if (response.ok) {
            const data = await response.json(); 
            auth.setAdmin({
                id: data.id,
                username: data.username || 'Admin',
                email: data.email
            });
            auth.setAccessToken(data.token);

            // Redirect user after login
            const redirectPath = route.query.redirect || '/admin/dashboard';
            router.push(redirectPath);
        } else {
            const errorData = await response.json(); 
            errorMessage.value = errorData.message || 'Login failed';
        }
    } catch (error) {
        console.error(error);
        errorMessage.value = 'Something went wrong. Please try again.';
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div class="w-full max-w-md">
            <div class="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-6">
                <!-- Admin Brand Area -->
                <div class="text-center space-y-2">
                    <div class="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <!-- You can use an icon library like @heroicons/vue -->
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" />
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900">Admin Portal</h1>
                    <p class="text-gray-500 text-sm">Secure administrative access</p>
                </div>

                <!-- Login Form -->
                <form @submit.prevent="login" class="space-y-4">
                    <div class="space-y-1">
                        <label for="email" class="text-sm font-medium text-gray-700">Admin Email</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input v-model="email" type="text" id="email"
                                class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition"
                                placeholder="Enter admin email" required>
                        </div>
                    </div>

                    <div class="space-y-1">
                        <label for="password" class="text-sm font-medium text-gray-700">Password</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input v-model="password" type="password" id="password"
                                class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition"
                                placeholder="Enter your password" required>
                        </div>
                    </div>

                    <div class="flex items-center justify-end">
                        <router-link :to="{ name: 'landing-page' }" class="text-sm text-indigo-600 hover:text-indigo-700">
                            Back to landing page
                        </router-link>
                    </div>

                    <button type="submit"
                        class="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
                        Sign in as Admin
                    </button>
                </form>

                <div class="text-center text-sm text-gray-500">
                    Protected administrative area
                </div>
            </div>
        </div>
    </div>
</template>