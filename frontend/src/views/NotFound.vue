<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth.store.js';

// Access the auth store
const authStore = useAuthStore();

// Compute the homepage route based on authentication status
const homepageRoute = computed(() => {
    if (authStore.admin) {
        return { name: 'AdminDashboard' };
    } else if (authStore.employee) {
        return { name: 'EmployeeDashboard' };
    } else {
        return { name: 'LoginSelection' };
    }
});
</script>

<template>
    <section class="bg-white min-h-screen flex items-center justify-center">
        <div class="py-8 px-4 max-w-screen-xl lg:py-16 lg:px-6 text-center">
            <div class="max-w-screen-sm">
                <h1
                    class="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary-600 dark:text-primary-500">
                    404
                </h1>
                <p class="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl">
                    Something's missing.
                </p>
                <p class="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
                    Sorry, we can't find that page.
                </p>
                <router-link :to="homepageRoute"
                    class="inline-flex text-white bg-blue-600 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-primary-900 my-4">
                    Back to Homepage
                </router-link>
            </div>
        </div>
    </section>
</template>