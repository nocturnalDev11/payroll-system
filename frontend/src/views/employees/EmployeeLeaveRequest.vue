<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';
import RequestLeave from './partials/leaves/RequestLeave.vue';

// State
const showRequestLeave = ref(false);
const leaveRequests = ref([]);
const currentPage = ref(1);
const requestsPerPage = ref(5);
const statusMessage = ref('');
const searchQuery = ref('');

// Computed properties
const totalPages = computed(() => Math.ceil(filteredRequests.value.length / requestsPerPage.value));

const filteredRequests = computed(() => {
    return leaveRequests.value.filter(request =>
        request.employeeName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        request.reason.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        request.status.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

const paginatedRequests = computed(() => {
    const start = (currentPage.value - 1) * requestsPerPage.value;
    const end = start + requestsPerPage.value;
    return filteredRequests.value.slice(start, end);
});

// Helper to get employeeId and token from localStorage
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
            useAuthStore().logout();
            return { employeeId: null, token: null };
        }
        return { employeeId: payload.employeeId, token };
    } catch (error) {
        console.error('Failed to parse token:', error);
        return { employeeId: null, token: null };
    }
};

// Fetch leave requests
const fetchLeaveRequests = async () => {
    const { employeeId, token } = getAuthData();

    if (!employeeId || !token) {
        statusMessage.value = 'Authentication required. Please log in again.';
        setTimeout(() => statusMessage.value = '', 3000);
        return;
    }

    try {
        const response = await fetch(`${BASE_API_URL}/api/leaves/employee/${employeeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to fetch leave requests: ${text}`);
        }
        leaveRequests.value = await response.json() || [];
    } catch (error) {
        console.error('Failed to fetch leave requests:', error);
        statusMessage.value = 'Failed to load leave requests. Please try again.';
        setTimeout(() => statusMessage.value = '', 3000);
    }
};

// Handle new leave request submission
const handleLeaveRequestSubmitted = (newRequest) => {
    leaveRequests.value.unshift(newRequest);
    currentPage.value = 1;
    statusMessage.value = 'Leave request submitted successfully!';
    setTimeout(() => statusMessage.value = '', 3000);
};

// Pagination methods
const nextPage = () => {
    if (currentPage.value < totalPages.value) currentPage.value++;
};

const previousPage = () => {
    if (currentPage.value > 1) currentPage.value--;
};

// Format date
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Watch for search query changes to reset page
watch(searchQuery, () => {
    currentPage.value = 1;
});

// Lifecycle hook
onMounted(() => {
    fetchLeaveRequests();
});
</script>

<template>
    <div class="min-h-screen p-1">
        <div class="max-w-8xl mx-auto">
            <!-- Header and Action Buttons -->
            <div class="flex justify-between items-center mb-8">
                <h1 class="text-4xl font-bold text-gray-900 animate-fade-in">My Leave Management</h1>
                <button @click="showRequestLeave = true"
                    class="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 animate-pulse-once">
                    <span class="material-icons-outlined">add</span>
                    Request Leave
                </button>
            </div>

            <!-- Search Bar -->
            <div class="mb-6">
                <input v-model="searchQuery" type="text"
                    class="w-full md:w-1/2 lg:w-1/3 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 placeholder-gray-400 shadow-sm"
                    placeholder="Search by name, reason, or status..." />
            </div>

            <!-- Leave Requests Card -->
            <div class="bg-white p-6 rounded-2xl shadow-lg transform transition-all hover:shadow-xl">
                <div class="space-y-6">
                    <div v-if="statusMessage"
                        class="p-4 bg-green-100 text-green-700 rounded-lg text-center animate-bounce-in">
                        {{ statusMessage }}
                    </div>

                    <div v-if="paginatedRequests.length === 0" class="text-center py-12 text-gray-500">
                        <span class="material-icons-outlined text-4xl text-gray-400 mb-2">event_busy</span>
                        <p>No leave requests found.{{ searchQuery ? ' Try adjusting your search.' : '' }}</p>
                    </div>

                    <transition-group name="list" tag="div" class="grid gap-4">
                        <div v-for="request in paginatedRequests" :key="request._id"
                            class="border border-gray-200 rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md cursor-pointer group"
                            @click="$emit('view-details', request)">
                            <div class="flex justify-between items-start gap-4">
                                <div class="flex-1">
                                    <h3
                                        class="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                        {{ request.employeeName }}
                                    </h3>
                                    <p class="text-sm text-gray-600">
                                        {{ formatDate(request.startDate) }} - {{ formatDate(request.endDate) }}
                                    </p>
                                    <p class="mt-2 text-gray-700 line-clamp-2">{{ request.reason }}</p>
                                </div>
                                <div class="flex-shrink-0">
                                    <span :class="{
                                        'bg-yellow-100 text-yellow-700': request.status === 'Pending',
                                        'bg-green-100 text-green-700': request.status === 'Approved',
                                        'bg-red-100 text-red-700': request.status === 'Disapproved'
                                    }"
                                        class="px-3 py-1 rounded-full text-sm font-medium relative group-hover:scale-105 transition-transform">
                                        {{ request.status }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </transition-group>

                    <!-- Pagination -->
                    <div v-if="filteredRequests.length > 0"
                        class="mt-8 flex justify-between items-center flex-wrap gap-4">
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <span>Showing {{ paginatedRequests.length }} of {{ filteredRequests.length }}
                                requests</span>
                            <select v-model.number="requestsPerPage" class="border border-gray-300 rounded-lg p-1">
                                <option v-for="n in [5, 10, 20]" :key="n" :value="n">{{ n }} per page</option>
                            </select>
                        </div>
                        <div class="flex items-center gap-2">
                            <button @click="previousPage" :disabled="currentPage === 1"
                                class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                                <span class="material-icons-outlined">chevron_left</span>
                            </button>
                            <span class="text-gray-700">{{ currentPage }} of {{ totalPages }}</span>
                            <button @click="nextPage" :disabled="currentPage === totalPages"
                                class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                                <span class="material-icons-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Request Leave Modal -->
            <RequestLeave v-if="showRequestLeave" :show="showRequestLeave" @close="showRequestLeave = false"
                @submit="handleLeaveRequestSubmitted"
                class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" />
        </div>
    </div>
</template>

<style scoped>
/* Custom animations */
.animate-fade-in {
    animation: fadeIn 0.5s ease-in;
}

.animate-bounce-in {
    animation: bounceIn 0.5s ease-out;
}

.animate-pulse-once {
    animation: pulse 1s ease-out forwards;
}

.list-enter-active,
.list-leave-active {
    transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes bounceIn {
    0% {
        transform: scale(0.9);
        opacity: 0;
    }

    50% {
        transform: scale(1.05);
        opacity: 0.8;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }

    100% {
        transform: scale(1);
    }
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .flex.justify-between {
        flex-direction: column;
        gap: 1rem;
    }

    h1 {
        font-size: 2rem;
    }

    button {
        width: 100%;
    }
}
</style>