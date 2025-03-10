<script setup>
import { onMounted, ref, watch } from 'vue';

const props = defineProps({
    type: { type: String, default: 'text' },
    modelValue: { type: String, required: true },
    id: String,
    required: Boolean,
    autocomplete: String,
    class: String
});

const emit = defineEmits(['update:modelValue']);
const input = ref(null);

watch(() => props.type, (newType) => {
    console.log('TextInput type changed to:', newType);
});

onMounted(() => {
    if (input.value && input.value.hasAttribute('autofocus')) {
        input.value.focus();
    }
});

const updateValue = (event) => {
    emit('update:modelValue', event.target.value);
};
</script>

<template>
    <input :id="id" :type="type" :class="[
        props.class || '',
        'w-full',
        'text-gray-800',
        'text-sm',
        'border',
        'border-gray-300',
        'px-4',
        'py-3',
        'rounded-md',
        'focus:border-gray-200',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2',
        'focus:ring-gray-300',
        'transition-colors',
        'duration-300'
    ]" :value="modelValue" :required="required" :autocomplete="autocomplete" @input="updateValue" ref="input" />
</template>