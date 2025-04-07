<script setup>
import Modal from '@/components/Modal.vue';
import axios from 'axios';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';

const props = defineProps(['show', 'position']);
const emit = defineEmits(['close', 'delete-success']);

const authStore = useAuthStore();

const deletePosition = async () => {
    try {
        // Handle both id and _id
        const positionId = props.position.id || props.position._id;
        if (!positionId) {
            alert('Position ID is missing');
            return;
        }

        const response = await axios.delete(`${BASE_API_URL}/api/positions/${positionId}`, {
            headers: {
                Authorization: `Bearer ${authStore.accessToken}`,
                'user-role': authStore.userRole,
            },
        });

        // Emit success with position data
        if (response.status === 204 || response.status === 200) {
            emit('delete-success', props.position);
            emit('close');
        }
    } catch (error) {
        console.error('Error deleting position:', error);
        alert('Failed to delete position: ' + (error.response?.data?.error || error.message));
    }
};
</script>

<template>
    <Modal :show="show" @close="emit('close')" max-width="md" max-height="80vh">
        <div class="p-4 border-b border-gray-300">
            <h2 class="text-lg font-semibold text-gray-800">Confirm Delete</h2>
        </div>
        <div class="p-4">
            <p>Delete <strong>{{ position.name }}</strong>?</p>
        </div>
        <div class="p-4 border-t border-gray-300 bg-gray-50 flex justify-end gap-2">
            <button @click="deletePosition"
                class="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">Delete</button>
            <button @click="emit('close')"
                class="px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
        </div>
    </Modal>
</template>