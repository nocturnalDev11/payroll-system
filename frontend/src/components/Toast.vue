<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const props = defineProps({
    message: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, default: 'info' },
    duration: { type: Number, default: 3000 },
});

const emit = defineEmits(['close']);

const isVisible = ref(false);

const getIcon = computed(() => {
    switch (props.type) {
        case 'success':
            return 'check_circle';
        case 'error':
            return 'error';
        case 'warning':
            return 'warning';
        case 'info':
            return 'info';
        default:
            return 'info';
    }
});

const getIconColor = computed(() => {
    switch (props.type) {
        case 'success':
            return '#2b9875';
        case 'error':
            return '#dc2626';
        case 'warning':
            return '#f59e0b';
        case 'info':
            return '#3b82f6';
        default:
            return '#3b82f6';
    }
});

const toastClasses = computed(() => ({
    'translate-y-0 opacity-100 scale-100': isVisible.value,
    'translate-y-10 opacity-0 scale-95': !isVisible.value,
}));

onMounted(() => {
    isVisible.value = true;
    const timer = setTimeout(() => {
        isVisible.value = false;
        setTimeout(() => emit('close'), 300);
    }, props.duration);
    return () => clearTimeout(timer);
});

onUnmounted(() => {
    isVisible.value = false;
});

const handleClose = () => {
    isVisible.value = false;
    setTimeout(() => emit('close'), 300);
};
</script>

<template>
    <div v-if="message" :class="['toast', toastClasses]"
        class="fixed bottom-6 right-6 z-1000 max-w-xs w-full rounded-xl shadow-lg transition-all duration-300 ease-in-out transform bg-white border border-gray-200"
        role="alert" aria-live="polite" aria-atomic="true">
        <div class="flex items-center justify-between p-3">
            <div class="flex items-center space-x-3">
                <div class="p-2 rounded-lg bg-gray-50">
                    <span class="material-icons" :style="{ color: getIconColor }">
                        {{ getIcon }}
                    </span>
                </div>
                <div>
                    <p class="text-sm font-semibold text-gray-900">{{ message }}</p>
                    <p v-if="description" class="text-xs text-gray-600">{{ description }}</p>
                </div>
            </div>
            <button @click="handleClose"
                class="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full p-1 transition-colors duration-200"
                aria-label="Close notification">
                <span class="material-icons text-lg">
                    close
                </span>
            </button>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined');

.toast {
    z-index: 1000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
    animation: slideIn 0.3s ease-out, slideOut 0.3s ease-in forwards;
}

@keyframes slideIn {
    from {
        transform: translateY(10px) scale(0.95) opacity-0;
    }

    to {
        transform: translateY(0) scale(1) opacity-100;
    }
}

@keyframes slideOut {
    to {
        transform: translateY(10px) scale(0.95) opacity-0;
    }
}

/* Override default transition for manual control */
.toast:not(.translate-y-0) {
    animation: none;
    transform: translateY(10px) scale(0.95) opacity-0;
}
</style>