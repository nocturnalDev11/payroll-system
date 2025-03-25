<script setup>
import { ref } from 'vue';
import Modal from '@/components/Modal.vue';
import { BASE_API_URL } from '@/utils/constants.js';

// Define props and emits
const props = defineProps(['employee']);
const emit = defineEmits(['employee-deleted']);

// Reactive state
const showDeleteModal = ref(false);

const closeDeleteModal = () => {
    showDeleteModal.value = false;
};

const deleteEmployee = async () => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/employees/${props.employee._id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to delete employee');
        emit('employee-deleted', props.employee._id);
        closeDeleteModal();
    } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete employee.');
    }
};
</script>

<template>
    <button @click="showDeleteModal = true" class="text-red-600 hover:text-red-800 transition duration-200" title="Delete employee">
        <span class="material-icons">delete</span>
    </button>

    <Modal :show="showDeleteModal" @close="closeDeleteModal">
        <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900">Delete Employee</h3>
            <p class="mt-2">Are you sure you want to delete {{ props.employee.firstName }} {{ props.employee.lastName
                }}?</p>
            <div class="mt-4 flex justify-end gap-3">
                <button @click="closeDeleteModal" class="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">
                    Cancel
                </button>
                <button @click="deleteEmployee" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Confirm
                </button>
            </div>
        </div>
    </Modal>
</template>