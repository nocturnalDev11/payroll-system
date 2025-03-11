<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    maxWidth: {
        type: String,
        default: '2xl',
        validator: (value) => {
            return ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl'].includes(value);
        },
    },
    maxHeight: {
        type: String,
        default: '80vh',
        validator: (value) => {
            return ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '80vh', '90vh', 'screen'].includes(value);
        },
    },
    closeable: {
        type: Boolean,
        default: true,
    },
});

const emit = defineEmits(['close']);

watch(
    () => props.show,
    () => {
        if (props.show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = null;
        }
    },
);

const close = () => {
    if (props.closeable) {
        emit('close');
    }
};

const closeOnEscape = (e) => {
    if (e.key === 'Escape' && props.show) {
        close();
    }
};

onMounted(() => document.addEventListener('keydown', closeOnEscape));

onUnmounted(() => {
    document.removeEventListener('keydown', closeOnEscape);
    document.body.style.overflow = null;
});

const maxWidthClass = computed(() => {
    const tailwindSizes = {
        sm: 'sm:max-w-sm',  // 384px
        md: 'sm:max-w-md',  // 448px
        lg: 'sm:max-w-lg',  // 512px
        xl: 'sm:max-w-xl',  // 576px
        '2xl': 'sm:max-w-2xl', // 672px
        '3xl': 'sm:max-w-3xl', // 768px
        '4xl': 'sm:max-w-4xl', // 896px
        '5xl': 'sm:max-w-5xl', // 1024px
        '6xl': 'sm:max-w-6xl', // 1152px
        '7xl': 'sm:max-w-7xl', // 1280px
    };

    return tailwindSizes[props.maxWidth] || 'sm:max-w-2xl';
});

const maxHeightClass = computed(() => {
    const tailwindHeightSizes = {
        sm: 'max-h-96',  // 24rem (384px)
        md: 'max-h-112', // 28rem (448px)
        lg: 'max-h-128', // 32rem (512px)
        xl: 'max-h-144', // 36rem (576px)
        '2xl': 'max-h-168', // 42rem (672px)
        '3xl': 'max-h-192', // 48rem (768px)
        '4xl': 'max-h-224', // 56rem (896px)
        '5xl': 'max-h-256', // 64rem (1024px)
        '6xl': 'max-h-288', // 72rem (1152px)
        '7xl': 'max-h-320', // 80rem (1280px)
        '80vh': 'max-h-[80vh]', // 80% of viewport height
        '90vh': 'max-h-[90vh]', // 90% of viewport height
        screen: 'max-h-screen', // 100vh
    };

    return tailwindHeightSizes[props.maxHeight] || 'max-h-[80vh]';
});
</script>

<template>
    <Teleport to="body">
        <Transition leave-active-class="duration-200">
            <div v-show="show"
                class="fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto px-4 py-6 sm:px-0"
                scroll-region>
                <Transition enter-active-class="ease-out duration-300" enter-from-class="opacity-0"
                    enter-to-class="opacity-100" leave-active-class="ease-in duration-200"
                    leave-from-class="opacity-100" leave-to-class="opacity-0">
                    <div v-show="show" class="fixed inset-0 transform transition-all" @click="close">
                        <div class="absolute inset-0 bg-gray-500 opacity-75" />
                    </div>
                </Transition>

                <Transition enter-active-class="ease-out duration-300"
                    enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    enter-to-class="opacity-100 translate-y-0 sm:scale-100" leave-active-class="ease-in duration-200"
                    leave-from-class="opacity-100 translate-y-0 sm:scale-100"
                    leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                    <div v-show="show"
                        class="transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:mx-auto sm:w-full"
                        :class="[maxWidthClass, maxHeightClass]">
                        <slot v-if="show" />
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>