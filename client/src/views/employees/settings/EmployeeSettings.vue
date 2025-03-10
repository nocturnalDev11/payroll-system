<script setup>
import { defineProps, defineEmits } from 'vue';
import UpdatePasswordForm from './Partials/UpdatePasswordForm.vue';
</script>

<template>
    <div class="py-5">
        <h2 class="pb-5 text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
            Settings
        </h2>

        <div class="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
            <UpdatePasswordForm class="max-w-xl" />
        </div>
    </div>
</template>

<style scoped>
</style>