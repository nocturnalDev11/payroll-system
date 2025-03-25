<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
    href: {
        type: String,
        required: true,
    },
});

const router = useRouter();
const isExternal = computed(() => /^https?:\/\//.test(props.href));
</script>

<template>
    <component :is="isExternal ? 'a' : 'router-link'" :href="isExternal ? href : undefined"
        :to="!isExternal ? href : undefined"
        class="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-900 dark:focus:bg-gray-800">
        <slot />
    </component>
</template>