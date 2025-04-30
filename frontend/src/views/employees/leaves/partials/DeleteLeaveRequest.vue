<script setup>
import { ref } from 'vue';
import Modal from '@/components/Modal.vue';
import Toast from '@/components/Toast.vue';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';

const props = defineProps({
    request: { type: Object, required: true }
});

const emit = defineEmits(['delete']);
const showModal = ref(false);
const statusMessage = ref('');
const authStore = useAuthStore();

// Open confirmation modal
const openModal = () => {
    showModal.value = true;
};

// Handle deletion
const submitDelete = async () => {
    const token = authStore.accessToken;
    if (!token) {
        statusMessage.value = 'Authentication required. Please log in again.';
        setTimeout(() => statusMessage.value = '', 3000);
        return;
    }

    // Debug: Log token payload
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('DeleteLeaveRequest - Token payload:', payload);
    } catch (error) {
        console.log('DeleteLeaveRequest - Error decoding token:', error);
    }

    try {
        const response = await fetch(`${BASE_API_URL}/api/leaves/${props.request._id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.log('DeleteLeaveRequest - Error response:', errorData);
            throw new Error(errorData.message || `Failed to delete: ${response.statusText}`);
        }

        emit('delete', props.request._id);
        showModal.value = false;
        statusMessage.value = 'Leave request deleted successfully!';
        setTimeout(() => statusMessage.value = '', 3000);
    } catch (error) {
        console.log('DeleteLeaveRequest - Error:', error.message);
        statusMessage.value = error.message || 'Failed to delete leave request.';
        setTimeout(() => statusMessage.value = '', 3000);
    }
};
</script>

<template>
    <div>
        <button @click="openModal" class="text-red-400 hover:text-red-600 p-1 cursor-pointer">
            <span class="material-icons text-lg">delete</span>
        </button>

        <Modal :show="showModal" max-width="sm" @close="showModal = false">
            <div class="p-2">
                <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold text-gray-900">Delete Leave Request</h2>
                    <button @click="showModal = false" class="p-2 cursor-pointer">
                        <span class="material-icons text-sm">close</span>
                    </button>
                </div>
                <p class="mt-4 text-gray-600">Are you sure you want to delete this leave request? This action cannot be
                    undone.</p>
                <div class="mt-6 flex justify-end gap-4">
                    <button @click="showModal = false"
                        class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button @click="submitDelete" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                        Delete
                    </button>
                </div>
            </div>
        </Modal>

        <Toast v-if="statusMessage" :message="statusMessage" />
    </div>
</template>