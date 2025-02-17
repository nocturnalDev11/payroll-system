<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth.store.js'
import { BASE_API_URL } from '../../../constants.js'

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
        const response = await fetch(`${BASE_API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email.value.toLowerCase(),
                password: password.value,
            }),
        });
        if (response && response.ok) {
            const data = await response.json();
            auth.setUser({
                id: data.id,
                username: data.username,
                email: data.email
            });
            auth.setAccessToken(data.token);
            errorMessage.value = '';
            const redirectPath = route.query.redirect || '/';
            router.push(redirectPath);
        } else {
            errorMessage.value = response.statusText;
        }
    } catch (error) {
        console.error(error);
        errorMessage.value = error.message;
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <section class="w-104">
        <form @submit.prevent="login" class="flex flex-col gap-4 bg-white p-8 rounded">
            <h2 class="text-2xl text-slate-800">Login</h2>
            <div v-if="errorMessage" class="bg-red-400 text-white py-2 px-3 rounded">
                {{ errorMessage }}
            </div>
            <input v-model="email" type="email" name="email" placeholder="Email" :disabled="isLoading"
                class="bg-slate-200 p-2 rounded" />
            <input v-model="password" type="password" name="password" placeholder="Password" :disabled="isLoading"
                class="bg-slate-200 p-2 rounded" />
            <button class="bg-blue-400 text-white drop-shadow rounded p-2">Login</button>
        </form>
    </section>
</template>
