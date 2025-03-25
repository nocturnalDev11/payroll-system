<script setup>
import { ref } from 'vue';
import Modal from '@/components/Modal.vue';
import { BASE_API_URL } from '@/utils/constants.js';

// Define props
const props = defineProps({
    show: Boolean,
    onSubmit: Function,
});

const emit = defineEmits(['open', 'close']);

// State
const newLeave = ref({
    startDate: '',
    endDate: '',
    reason: '',
});

const isSubmitting = ref(false);
const statusMessage = ref('');

// Helper to get token and employeeId from localStorage
const getAuthData = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found in localStorage');
        return { employeeId: null, token: null };
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
            console.error('Token has expired');
            return { employeeId: null, token: null };
        }
        console.log('Frontend decoded employeeId:', payload.employeeId); // Debug log
        return { employeeId: payload.employeeId, token };
    } catch (error) {
        console.error('Failed to parse token:', error);
        return { employeeId: null, token: null };
    }
};

const submitLeaveRequest = async () => {
    isSubmitting.value = true;
    const { employeeId, token } = getAuthData();

    console.log('Token:', token);
    console.log('Employee ID from frontend:', employeeId);

    if (!token || !employeeId) {
        statusMessage.value = 'Authentication required. Please log in again.';
        isSubmitting.value = false;
        setTimeout(() => (statusMessage.value = ''), 3000);
        return;
    }

    try {
        const response = await fetch(`${BASE_API_URL}/api/leaves`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                employeeId, // Include employeeId in payload
                ...newLeave.value,
                status: 'Pending',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${errorText}`);
        }

        const newRequest = await response.json();
        statusMessage.value = 'Request submitted successfully!';
        resetForm();
        if (props.onSubmit) props.onSubmit(newRequest);
        emit('close');
    } catch (error) {
        console.error('Failed to submit leave request:', error);
        statusMessage.value = error.message || 'Failed to submit leave request. Please try again.';
    } finally {
        isSubmitting.value = false;
        setTimeout(() => (statusMessage.value = ''), 3000);
    }
};

const resetForm = () => {
    newLeave.value = {
        startDate: '',
        endDate: '',
        reason: '',
    };
};

const closeModal = () => {
    emit('close');
    resetForm();
};
</script>

<template>
    <div>
        <button @click="$emit('open')"
            class="inline-flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            Request Leave
        </button>

        <Modal :show="show" @close="closeModal">
            <div class="p-6">
                <div class="flex items-center justify-between">
                    <h2 class="text-2xl font-bold text-gray-900">Request Leave</h2>
                    <button @click="closeModal" class="p-2">
                        <span class="material-icons text-sm">close</span>
                    </button>
                </div>

                <form @submit.prevent="submitLeaveRequest">
                    <div class="mb-4">
                        <label class="block text-gray-700 font-medium mb-2">Start Date:</label>
                        <input type="date" v-model="newLeave.startDate"
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-300 outline-none"
                            required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 font-medium mb-2">End Date:</label>
                        <input type="date" v-model="newLeave.endDate"
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-300 outline-none"
                            required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 font-medium mb-2">Reason for Leave:</label>
                        <textarea v-model="newLeave.reason"
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-300 outline-none min-h-[100px]"
                            required></textarea>
                    </div>
                    <button type="submit"
                        class="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium"
                        :disabled="isSubmitting">
                        {{ isSubmitting ? 'Submitting...' : 'Send Request' }}
                    </button>
                </form>

                <div v-if="statusMessage"
                    :class="statusMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
                    class="mt-4 p-3 rounded-lg text-center">
                    {{ statusMessage }}
                </div>
            </div>
        </Modal>
    </div>
</template>