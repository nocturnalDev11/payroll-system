<script setup>
import Modal from '@/components/Modal.vue';
defineProps(['show', 'position']);
defineEmits(['close', 'update']);
</script>

<template>
    <Modal :show="show" @close="$emit('close')" max-width="sm">
        <div class="p-4 border-b">
            <h2 class="text-lg font-semibold">Edit Position</h2>
        </div>
        <div class="p-4 space-y-3">
            <input v-model="position.name" placeholder="Position Name" required class="p-1.5 border rounded-md" />
            <input v-model.number="position.salary" type="number" placeholder="Monthly Salary" required min="0"
                class="p-1.5 border rounded-md" />
        </div>
        <div class="p-4 border-t bg-gray-50 flex justify-end gap-2">
            <button @click="$emit('update')" class="px-3 py-1.5 bg-yellow-600 text-white rounded-md">Update</button>
            <button @click="$emit('close')" class="px-3 py-1.5 border rounded-md">Cancel</button>
        </div>
    </Modal>
</template>