<script setup>
import { ref } from 'vue';
import Modal from '@/components/Modal.vue';
import Toast from '@/components/Toast.vue';
import { BASE_API_URL } from '@/utils/constants.js';

const props = defineProps({
    request: { type: Object, required: true }
});

const emit = defineEmits(['update']);
const showModal = ref(false);
const form = ref({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
});
const statusMessage = ref('');

// Initialize form with existing request data
const initializeForm = () => {
    if (!props.request) return;
    form.value.startDate = new Date(props.request.startDate).toISOString().split('T')[0];
    form.value.endDate = new Date(props.request.endDate).toISOString().split('T')[0];
    form.value.reason = props.request.reason;
};

// Open modal and initialize form
const openModal = () => {
    console.log('Opening modal');
    initializeForm();
    showModal.value = true;
};

// Handle form submission
const submitUpdate = async () => {
    console.log('Updating leave request with _id:', props.request._id);
    const token = localStorage.getItem('token');
    if (!token) {
        statusMessage.value = 'Authentication required.';
        setTimeout(() => statusMessage.value = '', 3000);
        return;
    }
    // Debug: Log employeeId from token
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Employee ID from token:', payload.employeeId);
    } catch (error) {
        console.log('Error parsing token:', error);
    }

    try {
        const response = await fetch(`${BASE_API_URL}/api/leaves/${props.request._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(form.value)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to update: ${response.statusText}`);
        }
        const updatedRequest = await response.json();
        emit('update', updatedRequest.updatedRequest);
        showModal.value = false;
    } catch (error) {
        statusMessage.value = error.message || 'Failed to update leave request.';
        setTimeout(() => statusMessage.value = '', 3000);
    }
};
</script>

<template>
    <div>
        <button @click="openModal" class="text-yellow-400 hover:text-yellow-600 p-1 cursor-pointer">
            <span class="material-icons text-lg">edit</span>
        </button>

        <Modal :show="showModal" max-width="4xl" max-height="80vh" @close="showModal = false">
            <div class="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h2 class="text-lg font-semibold text-gray-800">Update Leave Request</h2>
                <button class="text-gray-600 text-xl font-bold leading-none hover:text-gray-800 cursor-pointer"
                    @click="showModal = false">
                    <span class="material-icons text-sm">close</span>
                </button>
            </div>

            <div class="p-6">
                <form @submit.prevent="submitUpdate" class="space-y-4">
                    <div>
                        <label for="startDate" class="block text-sm font-medium text-gray-700">Start Date</label>
                        <input v-model="form.startDate" type="date" id="startDate" required
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-300 outline-none" />
                    </div>
                    <div>
                        <label for="endDate" class="block text-sm font-medium text-gray-700">End Date</label>
                        <input v-model="form.endDate" type="date" id="endDate" required
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-300 outline-none" />
                    </div>
                    <div>
                        <label for="leave-type" class="block text-sm font-medium text-gray-700 mb-1">Leave
                            Type</label>
                        <select v-model="form.type" id="leave-type" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="Vacation">Vacation</option>
                            <option value="Sick">Sick</option>
                            <option value="Personal">Personal</option>
                            <option value="Family">Family</option>
                            <option value="Bereavement">Bereavement</option>
                        </select>
                    </div>
                    <div>
                        <label for="reason" class="block text-sm font-medium text-gray-700">Reason</label>
                        <textarea v-model="form.reason" id="reason" required
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-300 outline-none min-h-[100px]"></textarea>
                    </div>
                    <button type="submit"
                        class="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 transition">
                        Update Request
                    </button>
                </form>
            </div>
        </Modal>

        <Toast v-if="statusMessage" :message="statusMessage" />
    </div>
</template>