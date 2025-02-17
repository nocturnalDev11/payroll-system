<script setup>
import { ref } from 'vue'
import { BASE_API_URL } from '../../../constants.js'

const isLoading = ref(false);

const username = ref('');
const email = ref('');
const password = ref('');

async function signup() {
    try {
        isLoading.value = true;
        await fetch(`${BASE_API_URL}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username.value,
                email: email.value.toLowerCase(),
                password: password.value,
            }),
        });
    } catch (error) {

    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <section class="w-104">
        <form @submit.prevent="signup" class="flex flex-col gap-4 bg-white p-8 rounded">
            <h2 class="text-2xl text-slate-800">signup</h2>
            <input v-model="username" type="text" name="username" placeholder="Username" :disabled="isLoading"
                class="bg-slate-200 p-2 rounded" />
            <input v-model="email" type="email" name="email" placeholder="Email" :disabled="isLoading"
                class="bg-slate-200 p-2 rounded" />
            <input v-model="password" type="password" name="password" placeholder="Password" :disabled="isLoading"
                class="bg-slate-200 p-2 rounded" />
            <button class="bg-blue-400 text-white drop-shadow rounded p-2">Signup</button>
        </form>
    </section>
</template>
