<script setup>
import { ref, watch } from 'vue';
import Modal from '@/components/Modal.vue';
import axios from 'axios';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';

const props = defineProps(['show', 'position']);
const emit = defineEmits(['close', 'update-success']);

const authStore = useAuthStore();
const positionData = ref({ id: null, name: '', salary: 0 });

// Sync positionData with props.position when it changes
watch(() => props.position, (newPosition) => {
    if (newPosition && newPosition.id) {
        positionData.value = { id: newPosition.id, name: newPosition.name, salary: newPosition.salary };
    }
}, { immediate: true });

const updatePosition = async () => {
    if (!positionData.value.id) {
        alert('Position ID is missing');
        return;
    }
    if (!positionData.value.name || positionData.value.salary < 0) {
        alert('Position Name and a non-negative Salary are required');
        return;
    }
    try {
        const response = await axios.put(
            `${BASE_API_URL}/api/positions/${positionData.value.id}`,
            { name: positionData.value.name, salary: positionData.value.salary },
            {
                headers: {
                    Authorization: `Bearer ${authStore.accessToken}`,
                    'user-role': authStore.userRole,
                },
            }
        );
        if (response.status === 200) {
            emit('update-success', { ...positionData.value });
            emit('close');
        }
    } catch (error) {
        console.error('Error updating position:', error);
        alert('Failed to update position: ' + (error.response?.data?.error || error.message));
    }
};
</script>

<template>
    <Modal :show="show" :max-width="'sm'" :max-height="'80vh'" @close="emit('close')">
        <div class="p-4 border-b border-gray-300 flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
            <h2 class="text-lg font-semibold text-gray-800">Edit Position</h2>
        </div>
        <div class="flex-1 overflow-y-auto max-h-[65vh] p-4 space-y-6">
            <div class="p-4 space-y-3">
                <div class="space-y-1">
                    <label class="text-xs font-medium text-gray-600">Position Name *</label>
                    <input v-model="positionData.name"
                        class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                        required />
                </div>
                <div class="space-y-1">
                    <label class="text-xs font-medium text-gray-600">Monthly Salary *</label>
                    <input v-model.number="positionData.salary" type="number"
                        class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                        required min="0" />
                </div>
            </div>
        </div>
        <div class="p-4 border-t border-gray-300 bg-gray-50 flex justify-end gap-2">
            <button @click="updatePosition"
                class="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700">Update</button>
            <button @click="emit('close')"
                class="px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
        </div>
    </Modal>
</template>