<script setup>
import { ref } from 'vue';
import Modal from '@/components/Modal.vue';
import { BASE_API_URL } from '@/utils/constants.ts';

const props = defineProps({
    employee: {
        type: Object,
        required: true
    }
});
const emit = defineEmits(['employee-deleted']);

const showDeleteModal = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

const getAuthToken = () => {
    return localStorage.getItem('token');
};

const closeDeleteModal = () => {
    showDeleteModal.value = false;
    errorMessage.value = '';
};

const trashEmployee = async () => {
    if (!props.employee?._id) {
        errorMessage.value = 'Employee ID is missing';
        return;
    }

    isLoading.value = true;
    errorMessage.value = '';

    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication token not found. Please login again.');
        }

        const url = `${BASE_API_URL}/api/employees/trash/${props.employee._id}`;
        console.log('Trash request:', {
            url,
            method: 'PUT',
            token: token.substring(0, 20) + '...'
        });

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            credentials: 'include',
            mode: 'cors'
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || `Server error: ${response.status}`);
        }

        console.log('Trash successful:', responseData);
        emit('employee-deleted', props.employee._id);
        showDeleteModal.value = false;
    } catch (error) {
        console.error('Trash employee error:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });

        // Specific error handling
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            errorMessage.value = 'Network error: Unable to connect to server. Please check your connection.';
        } else if (error.message.includes('401')) {
            errorMessage.value = 'Unauthorized: Please login again.';
        } else {
            errorMessage.value = `Error: ${error.message}`;
        }
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <div>

        <button @click="showDeleteModal = true" title="Move to trash"
            class="text-red-600 hover:text-red-800 transition duration-200">
            <span class="material-icons">delete</span>
        </button>

        <Modal :show="showDeleteModal" @close="closeDeleteModal">
            <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-900">Move to Trash</h3>
                <p class="mt-2 text-gray-600">
                    Are you sure you want to move
                    <span class="font-medium">{{ props.employee.firstName }} {{ props.employee.lastName }}</span>
                    to trash?
                </p>

                <div v-if="errorMessage" class="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {{ errorMessage }}
                </div>

                <div class="mt-6 flex justify-end gap-3">
                    <button @click="closeDeleteModal"
                        class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200 disabled:opacity-50"
                        :disabled="isLoading">
                        Cancel
                    </button>
                    <button @click="trashEmployee"
                        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 disabled:opacity-50 flex items-center gap-2"
                        :disabled="isLoading">
                        <span v-if="isLoading" class="animate-spin">⌀</span>
                        <span>{{ isLoading ? 'Processing...' : 'Move to Trash' }}</span>
                    </button>
                </div>
            </div>
        </Modal>
    </div>
</template>

<style scoped>
.material-icons {
    font-size: 24px;
}

.animate-spin {
    display: inline-block;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>