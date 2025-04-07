<script setup>
import Modal from '@/components/Modal.vue';
defineProps(['show', 'employee']);
defineEmits(['close', 'delete']);
</script>

<template>
    <Modal :show="show" @close="$emit('close')" max-width="md" maxHeight="80vh">
        <div class="p-4 border-b border-gray-300">
            <h2 class="text-lg font-semibold">Confirm Move to Trash</h2>
        </div>

        <div class="p-4">
            <p>Move {{ employee.firstName }} {{ employee.lastName }} to trash?</p>
        </div>

        <div class="p-2 border-t border-gray-300 flex justify-end gap-2">
            <button @click="$emit('delete', employee.id)"
                class="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">
                Move to Trash</button>
            <button @click="$emit('close')"
                class="px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
        </div>
    </Modal>
</template>