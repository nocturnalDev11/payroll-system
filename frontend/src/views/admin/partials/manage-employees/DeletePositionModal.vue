<script setup>
import Modal from '@/components/Modal.vue';
defineProps(['show', 'position']);
defineEmits(['close', 'delete']);
</script>

<template>
    <Modal :show="show" @close="$emit('close')" max-width="sm">
        <div class="p-4 border-b">
            <h2 class="text-lg font-semibold">Confirm Delete</h2>
        </div>
        <div class="p-4">
            <p>Delete <strong>{{ position.name }}</strong>?</p>
        </div>
        <div class="p-4 border-t bg-gray-50 flex justify-end gap-2">
            <button @click="$emit('delete')" class="px-3 py-1.5 bg-red-600 text-white rounded-md">Delete</button>
            <button @click="$emit('close')" class="px-3 py-1.5 border rounded-md">Cancel</button>
        </div>
    </Modal>
</template>