<template>
    <div class="relative group inline-block">
        <slot></slot>
        <div
            class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-2 rounded bg-gray-800 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
            {{ text }}
        </div>
    </div>
</template>

<script setup>
defineProps({
    text: {
        type: String,
        required: true
    }
})
</script>

<!-- Example usage in a parent component -->

<!--
<template>
    <div class="flex justify-center items-center h-screen">
        <Tooltip text="This is a tooltip!">
            <button class="px-4 py-2 bg-blue-600 text-white rounded">
                Hover me
            </button>
        </Tooltip>
    </div>
</template>

<script setup>
import Tooltip from './components/Tooltip.vue'
</script>
-->

