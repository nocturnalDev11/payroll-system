<script setup>
import Modal from '@/components/Modal.vue';
defineProps(['show', 'position']);
defineEmits(['close', 'delete']);
</script>

<template>
    <Modal :show="show" @close="$emit('close')" max-width="md" maxHeight="80vh">
        <div class="p-4 border-b border-gray-300">
            <h2 class="text-lg font-semibold text-gray-800">Confirm Delete</h2>
        </div>
        <div class="p-4">
            <p>Delete <strong>{{ position.name }}</strong>?</p>
        </div>
        <div class="p-4 border-t border-gray-300 bg-gray-50 flex justify-end gap-2">
            <button @click="$emit('delete')"
                class="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">Delete</button>
            <button @click="$emit('close')"
                class="px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
        </div>
    </Modal>
</template>