<script setup>
import Modal from '@/components/Modal.vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store.js';
import { BASE_API_URL } from '@/utils/constants.js';
import { ref } from 'vue';

// Define props and emits
const props = defineProps(['show', 'positions', 'newPosition']);
const emit = defineEmits(['close', 'create', 'edit', 'delete']);

// Initialize authStore and reactive state
const authStore = useAuthStore();
const isAddingPosition = ref(false);

// Moved and adapted createPosition method
async function createPosition() {
    if (!props.newPosition.name || props.newPosition.salary < 0) {
        alert('Position Name and a non-negative Salary are required');
        return;
    }
    isAddingPosition.value = true;
    try {
        const response = await axios.post(`${BASE_API_URL}/api/positions`, props.newPosition, {
            headers: {
                Authorization: `Bearer ${authStore.accessToken}`,
                'user-role': authStore.userRole,
            },
        });
        if (response.status === 201) {
            emit('create', response.data);
            props.newPosition.name = '';
            props.newPosition.salary = 0;
            alert('Position created successfully');
        }
    } catch (error) {
        console.error('Error creating position:', error);
        alert('Failed to create position');
    } finally {
        isAddingPosition.value = false;
    }
}
</script>

<template>
    <Modal :show="show" @close="$emit('close')" max-width="3xl" max-height="80vh">
        <!-- Header -->
        <div class="p-4 border-b border-gray-300">
            <h2 class="text-lg font-semibold text-gray-800">Manage Positions</h2>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto max-h-[65vh] p-4 space-y-6">
            <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-4">
                    <h3 class="text-base font-semibold text-gray-800">Create Position</h3>
                    <div class="space-y-2">
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Position Name *</label>
                            <input v-model="newPosition.name"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                required />
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-medium text-gray-600">Monthly Salary *</label>
                            <input v-model.number="newPosition.salary" type="number"
                                class="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500"
                                required min="0" />
                        </div>
                        <button @click="createPosition" :disabled="isAddingPosition"
                            class="w-full px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                            {{ isAddingPosition ? 'Creating...' : 'Create' }}
                        </button>
                    </div>
                </div>
                <div class="space-y-4">
                    <h3 class="text-base font-semibold text-gray-800">Available Positions</h3>
                    <div v-if="!positions.length" class="text-gray-500 text-sm text-center">
                        No positions
                    </div>
                    <div v-else class="space-y-2 max-h-[50vh] overflow-y-auto">
                        <div v-for="pos in positions" :key="pos.id"
                            class="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                            <div>
                                <p class="text-sm font-medium text-gray-900">{{ pos.name }}</p>
                                <p class="text-xs text-gray-600">₱{{ pos.salary.toLocaleString() }}</p>
                            </div>
                            <div class="flex gap-1">
                                <button @click="$emit('edit', pos)"
                                    class="text-yellow-600 hover:text-yellow-800 p-1 rounded-full hover:bg-yellow-100">
                                    <span class="material-icons text-lg">edit</span>
                                </button>
                                <button @click="$emit('delete', pos)"
                                    class="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100">
                                    <span class="material-icons text-lg">delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-300 bg-gray-50 flex justify-end">
            <button @click="$emit('close')"
                class="px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-100 cursor-pointer">Close</button>
        </div>
    </Modal>
</template>