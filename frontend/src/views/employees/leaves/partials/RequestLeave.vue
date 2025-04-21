<script setup>
import { ref } from 'vue';
import Modal from '@/components/Modal.vue';
import { BASE_API_URL } from '@/utils/constants.js';

const props = defineProps({
    show: Boolean,
});

const emit = defineEmits(['close', 'submit']);

const newLeave = ref({
    startDate: '',
    endDate: '',
    reason: '',
});

const isSubmitting = ref(false);
const statusMessage = ref('');

const getAuthData = () => {
    const token = localStorage.getItem('token');
    if (!token) return { employeeId: null, token: null };
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) return { employeeId: null, token: null };
        return { employeeId: payload.employeeId, token };
    } catch (error) {
        return { employeeId: null, token: null };
    }
};

const submitLeaveRequest = async () => {
    isSubmitting.value = true;
    const { token } = getAuthData();

    if (!token) {
        statusMessage.value = 'Authentication required.';
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
            body: JSON.stringify(newLeave.value),
        });

        if (!response.ok) throw new Error(`Server error: ${await response.text()}`);

        const newRequest = await response.json();
        statusMessage.value = 'Request submitted successfully!';
        resetForm();
        emit('submit', newRequest);
        emit('close');
    } catch (error) {
        statusMessage.value = error.message || 'Failed to submit request.';
    } finally {
        isSubmitting.value = false;
        setTimeout(() => (statusMessage.value = ''), 3000);
    }
};

const resetForm = () => {
    newLeave.value = { startDate: '', endDate: '', reason: '' };
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

        <Modal :show="show" max-width="4xl" max-height="80vh" @close="closeModal">
            <div class="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h2 class="text-lg font-semibold text-gray-800">Request Leave</h2>
                <button class="text-gray-600 text-xl font-bold leading-none hover:text-gray-800 cursor-pointer"
                    @click="closeModal">
                    <span class="material-icons text-sm">close</span>
                </button>
            </div>
            <div class="p-4">
                <form @submit.prevent="submitLeaveRequest" class="space-y-4">
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
                        <label for="leave-type" class="block text-sm font-medium text-gray-700 mb-1">Leave
                            Type</label>
                        <select v-model="newLeave.type" id="leave-type" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="Vacation">Vacation</option>
                            <option value="Sick">Sick</option>
                            <option value="Personal">Personal</option>
                            <option value="Family">Family</option>
                            <option value="Bereavement">Bereavement</option>
                        </select>
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