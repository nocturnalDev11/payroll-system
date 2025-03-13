<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { BASE_API_URL } from '@/utils/constants.js';

// Define props using defineProps
const props = defineProps({
    show: Boolean,
    record: Object,
});

// Define emits
const emit = defineEmits(['close', 'update']);

const morningTimeIn = ref('');
const afternoonTimeOut = ref('');

const loadRecord = () => {
    morningTimeIn.value = props.record?.morningTimeIn || '';
    afternoonTimeOut.value = props.record?.afternoonTimeOut || '';
};

const saveChanges = async () => {
    try {
        const response = await axios.put(`${BASE_API_URL}/api/attendance/${props.record._id}`, {
            morningTimeIn: morningTimeIn.value,
            afternoonTimeOut: afternoonTimeOut.value,
        });
        emit('update', response.data);
        emit('close');
    } catch (error) {
        console.error('Failed to update attendance:', error);
        alert('Failed to save changes. Please try again.');
    }
};

const closeModal = () => {
    emit('close');
};

// Load initial data when the modal opens or record changes
if (props.show && props.record) {
    loadRecord();
}
</script>

<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">Edit Attendance</h3>
                <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Morning Time In</label>
                    <input v-model="morningTimeIn" type="time" step="1"
                        class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="HH:mm:ss" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Afternoon Time Out</label>
                    <input v-model="afternoonTimeOut" type="time" step="1"
                        class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="HH:mm:ss" />
                </div>
            </div>
            <div class="mt-6 flex justify-end space-x-2">
                <button @click="closeModal" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                    Cancel
                </button>
                <button @click="saveChanges" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Save
                </button>
            </div>
        </div>
    </div>
</template>