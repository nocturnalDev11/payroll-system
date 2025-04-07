<script setup>
import Modal from '@/components/Modal.vue';
import axios from 'axios';
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth.store.js';
import { BASE_API_URL } from '@/utils/constants.js';

const props = defineProps(['show', 'employee']);
const emit = defineEmits(['close', 'delete']);

const authStore = useAuthStore();
const isDeleting = ref(false);
const statusMessage = ref('');

const moveToTrash = async () => {
    if (!props.employee || !props.employee._id) {
        statusMessage.value = 'Invalid employee _id';
        setTimeout(() => (statusMessage.value = ''), 3000);
        return;
    }

    isDeleting.value = true;
    try {
        const response = await axios.put(
            `${BASE_API_URL}/api/employees/${props.employee._id}/trash`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${authStore.accessToken}`,
                    'user-role': authStore.userRole,
                },
            }
        );
        if (response.status === 200) {
            emit('delete', props.employee._id); // Emit the employee _id to the parent
            statusMessage.value = 'Employee moved to trash successfully';
            setTimeout(() => {
                statusMessage.value = '';
                emit('close');
            }, 3000);
        }
    } catch (error) {
        console.error('Error moving employee to trash:', error);
        statusMessage.value = 'Failed to move employee to trash';
        setTimeout(() => (statusMessage.value = ''), 3000);
    } finally {
        isDeleting.value = false;
    }
};
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
            <button @click="moveToTrash" :disabled="isDeleting"
                class="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">
                {{ isDeleting ? 'Deleting...' : 'Move to Trash' }}
            </button>
            <button @click="$emit('close')" :disabled="isDeleting"
                class="px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-100">
                Cancel
            </button>
        </div>

        <!-- Status Toast -->
        <div v-if="statusMessage" :class="statusMessage.includes('successfully') ? 'bg-green-500' : 'bg-red-500'"
            class="fixed bottom-4 right-4 p-3 text-white text-sm rounded-md shadow-lg animate-fade-in">
            {{ statusMessage }}
        </div>
    </Modal>
</template>