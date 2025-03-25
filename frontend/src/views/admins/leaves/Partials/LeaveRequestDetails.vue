<script setup>
import { ref } from 'vue';
import Modal from '@/components/Modal.vue';
import axios from 'axios';
import { BASE_API_URL } from '@/utils/constants.js';

const props = defineProps({
    leave: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['approve', 'disapprove', 'close']);
const showLeaveRequestDetails = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

// Format date for display
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Get status class for styling
const getStatusClass = (status) => {
    switch (status) {
        case 'Pending':
            return 'text-yellow-600';
        case 'Approved':
            return 'text-green-600';
        case 'Disapproved':
            return 'text-red-600';
        default:
            return 'text-gray-600';
    }
};

// Approve leave request
const approveLeave = async () => {
    try {
        const response = await axios.put(`${BASE_API_URL}/api/leaves/${props.leave._id}/approve`);
        if (response.status === 200) {
            emit('approve', props.leave._id); // Notify parent to update status
            showToast('Leave approved successfully!', 'success');
            closeLeaveRequestDetails();
        }
    } catch (error) {
        console.error('Failed to approve leave:', error);
        showToast('Failed to approve leave. Please try again.', 'error');
    }
};

// Disapprove leave request
const disapproveLeave = async () => {
    try {
        const response = await axios.put(`${BASE_API_URL}/api/leaves/${props.leave._id}/disapprove`);
        if (response.status === 200) {
            emit('disapprove', props.leave._id); // Notify parent to update status
            showToast('Leave disapproved successfully!', 'success');
            closeLeaveRequestDetails();
        }
    } catch (error) {
        console.error('Failed to disapprove leave:', error);
        showToast('Failed to disapprove leave. Please try again.', 'error');
    }
};

// Close modal
const closeLeaveRequestDetails = () => {
    showLeaveRequestDetails.value = false;
    emit('close');
};

// Show toast notification
const showToast = (message, type = 'success') => {
    toastMessage.value = message;
    toastType.value = type;
    setTimeout(() => clearToast(), 3000);
};

// Clear toast notification
const clearToast = () => {
    toastMessage.value = '';
    toastType.value = 'success';
};
</script>

<template>
    <div>
        <button @click="showLeaveRequestDetails = true"
            class="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 py-1.5 px-2.5 rounded-md text-sm font-medium 
                   hover:bg-blue-100 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
            <span class="material-icons text-xs">visibility</span>
            View
        </button>

        <Modal :show="showLeaveRequestDetails" @close="closeLeaveRequestDetails">
            <div class="p-6">
                <div class="border-b border-gray-200 pb-4 mb-4">
                    <div class="flex justify-between items-center">
                        <h2 class="text-lg font-semibold text-gray-800">Leave Request Notification</h2>
                        <button @click="closeLeaveRequestDetails"
                            class="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition-all duration-200">
                            <span class="material-icons text-lg">close</span>
                        </button>
                    </div>
                    <div class="text-sm text-gray-500 mt-2">From: HR System <span class="text-gray-400">|</span> To:
                        Admin</div>
                </div>

                <div class="mb-4">
                    <h3 class="text-base font-medium text-gray-900">
                        Subject: Leave Request for {{ leave.employeeName }}
                    </h3>
                    <p class="text-sm text-gray-600 mt-1">
                        Date: {{ formatDate(leave.startDate) }} – {{ formatDate(leave.endDate) }}
                    </p>
                </div>

                <div class="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                    <p class="text-sm text-gray-700 whitespace-pre-wrap">
                        {{ leave.reason }}
                    </p>
                </div>

                <div class="space-y-3 text-sm">
                    <p class="text-gray-700">
                        <span class="font-medium text-gray-800">Employee:</span>
                        {{ leave.employeeName }}
                    </p>
                    <p class="text-gray-700">
                        <span class="font-medium text-gray-800">Employee ID:</span>
                        {{ typeof leave.employeeId === 'object' ? leave.employeeId._id : leave.employeeId }}
                    </p>
                    <p class="text-gray-700">
                        <span class="font-medium text-gray-800">Status:</span>
                        <span :class="getStatusClass(leave.status)">{{ leave.status }}</span>
                    </p>
                </div>

                <div class="mt-6 flex justify-end gap-3">
                    <button @click="approveLeave" :disabled="leave.status === 'Approved'"
                        class="px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 
                               transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50">
                        Approve
                    </button>
                    <button @click="disapproveLeave" :disabled="leave.status === 'Disapproved'"
                        class="px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 
                               transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50">
                        Disapprove
                    </button>
                    <button @click="closeLeaveRequestDetails" class="px-4 py-2 bg-gray-500 text-white rounded-md text-sm font-medium hover:bg-gray-600 
                               transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                        Close
                    </button>
                </div>
            </div>
        </Modal>

        <!-- Toast Notifications -->
        <div class="fixed bottom-4 right-4 z-50 space-y-4">
            <transition enter-active-class="transform ease-out duration-300 transition"
                enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
                enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
                leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100"
                leave-to-class="opacity-0">
                <div v-if="toastMessage" class="max-w-sm w-full bg-white rounded-lg shadow-lg overflow-hidden">
                    <div class="p-4 flex items-center gap-3">
                        <span class="material-icons"
                            :class="toastType === 'success' ? 'text-green-500' : 'text-red-500'">
                            {{ toastType === 'success' ? 'check_circle' : 'error' }}
                        </span>
                        <p class="text-sm font-medium text-gray-900">{{ toastMessage }}</p>
                        <button @click="clearToast" class="ml-auto flex-shrink-0 rounded-md text-gray-400 hover:text-gray-500 
                               focus:outline-none focus:ring-2 focus:ring-blue-500 p-1">
                            <span class="material-icons text-sm">close</span>
                        </button>
                    </div>
                </div>
            </transition>
        </div>
    </div>
</template>

<style scoped>
/* Toast transition */
.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

button:hover:not(:disabled) {
    transform: translateY(-2px);
}

button:disabled {
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
}
</style>