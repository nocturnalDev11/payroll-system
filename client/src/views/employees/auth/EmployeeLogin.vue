<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth.store.ts'
import { BASE_API_URL } from '../../../constants.js'

const route = useRoute();
const router = useRouter();

const isLoading = ref(false);
const errorMessage = ref('');
const email = ref('');
const password = ref('');
const auth = useAuthStore();
const showRegisterModal = ref(false);

async function login() {
    try {
        isLoading.value = true;
        errorMessage.value = ''; 

        const response = await fetch(`${BASE_API_URL}/api/employee/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email.value.toLowerCase(),
                password: password.value,
            }),
        });

        if (response.ok) {
            const data = await response.json(); 
            auth.setEmployee({
                id: data.id,
                username: data.username,
                email: data.email
            });
            auth.setAccessToken(data.token);

            // ✅ Redirect user after login
            const redirectPath = route.query.redirect || '/employee/dashboard';
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
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center p-4">
        <div class="w-full max-w-md">
            <div class="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 space-y-6">
                <div class="text-center space-y-2">
                    <div class="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900">Employee Portal</h1>
                    <p class="text-gray-500 text-sm">Welcome to your workspace</p>
                </div>

                <form @submit.prevent="login" class="space-y-4">
                    <div class="space-y-1">
                        <label for="email" class="text-sm font-medium text-gray-700">Email</label>
                        <input v-model="email" type="email" id="email" class="block w-full p-2 border rounded-lg" placeholder="Enter your email" required>
                    </div>
        
                    <div class="space-y-1">
                        <label for="password" class="text-sm font-medium text-gray-700">Password</label>
                        <input v-model="password" type="password" id="password" class="block w-full p-2 border rounded-lg" placeholder="Enter your password" required>
                    </div>
        
                    <button type="submit" class="w-full bg-blue-500 text-white py-2.5 rounded-lg cursor-pointer">Sign in</button>
                </form>

                <div class="text-center">
                    <p class="text-sm text-gray-700">Don't have an account? 
                        <button type="button" @click="showRegisterModal = true" class="text-blue-500 hover:underline cursor-pointer">Create an account</button>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.error {
  color: red;
  font-size: 14px;
}
</style>
