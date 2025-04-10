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
    if (!token) return { employeeId: null, token: null };
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
            useAuthStore().logout();
            return { employeeId: null, token: null };
        }
        return { employeeId: payload.employeeId, token };
    } catch (error) {
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
        if (!response.ok) throw new Error(`Failed to fetch: ${await response.text()}`);
        leaveRequests.value = await response.json() || [];
    } catch (error) {
        statusMessage.value = 'Failed to load leave requests.';
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
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

watch(searchQuery, () => {
    currentPage.value = 1;
});

onMounted(() => {
    fetchLeaveRequests();
});
</script>

<template>
    <div class="min-h-screen p-4">
        <div class="mx-auto">
            <!-- Header -->
            <header
                class="bg-white rounded-xl shadow-lg p-6 flex justify-between items-center sticky top-6 z-50 backdrop-blur-md bg-opacity-90">
                <h1 class="text-2xl font-bold text-gray-900 animate-fade-in">Leave Request</h1>
                <div class="flex items-center gap-4">
                    <div class="relative w-full">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input v-model="searchQuery" type="text" placeholder="Search requests..."
                            class="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 text-gray-700 shadow-sm transition-all duration-300" />
                    </div>
                    <button @click="showRequestLeave = true"
                        class="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
                        <span class="material-icons">add_circle</span>
                        New Request
                    </button>
                </div>
            </header>

            <!-- Main Content -->
            <div
                class="mt-6 bg-white bg-opacity-95 backdrop-blur-md p-6 rounded-2xl shadow-xl transition-all duration-300">
                <div class="space-y-6">
                    <!-- Status Message -->
                    <div v-if="statusMessage"
                        class="p-4 bg-green-50 text-green-800 rounded-lg flex items-center gap-2 shadow-md animate-bounce-in">
                        <span class="material-icons">check_circle</span>
                        {{ statusMessage }}
                    </div>

                    <!-- No Requests Found -->
                    <div v-if="paginatedRequests.length === 0" class="text-center py-12 text-gray-500">
                        <span class="material-icons text-5xl text-indigo-300 mb-4 animate-pulse">event_busy</span>
                        <p class="text-lg font-medium">No leave requests found{{ searchQuery ? ' - adjust your search' :
                            '' }}</p>
                    </div>

                    <!-- Leave Requests List -->
                    <transition-group name="list" tag="div" class="grid gap-5">
                        <div v-for="request in paginatedRequests" :key="request._id"
                            class="bg-gradient-to-r from-white to-gray-50 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group border border-indigo-100">
                            <div class="flex justify-between items-center gap-4">
                                <div class="flex-1">
                                    <div class="flex justify-between">
                                        <h3
                                            class="text-xl font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                                            {{ request.employeeName }}
                                        </h3>

                                        <span :class="{
                                            'bg-yellow-100 text-yellow-800': request.status === 'Pending',
                                            'bg-green-100 text-green-800': request.status === 'Approved',
                                            'bg-red-100 text-red-800': request.status === 'Disapproved'
                                        }"
                                            class="px-4 py-1 rounded-full text-sm font-medium shadow-sm group-hover:scale-110 transition-transform flex items-center gap-1">
                                            <span class="material-icons text-sm"
                                                v-if="request.status === 'Pending'">hourglass_empty</span>
                                            <span class="material-icons text-sm"
                                                v-if="request.status === 'Approved'">check</span>
                                            <span class="material-icons text-sm"
                                                v-if="request.status === 'Disapproved'">close</span>
                                            {{ request.status }}
                                        </span>
                                    </div>
                                    <p class="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                        <span class="material-icons text-[0.65rem]">calendar_today</span>
                                        {{ formatDate(request.startDate) }} - {{ formatDate(request.endDate) }}
                                    </p>

                                    <div class="bg-gray-50 p-4 rounded-lg mt-4 border border-gray-200 space-y-2">
                                        <p class="text-lg font-bold text-gray-700">
                                            Reason
                                        </p>
                                        <p class="text-sm text-gray-700 whitespace-pre-wrap">
                                            {{ request.reason }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </transition-group>

                    <!-- Pagination -->
                    <div v-if="filteredRequests.length > 0"
                        class="mt-8 flex justify-between items-center flex-wrap gap-4 bg-indigo-50 p-4 rounded-lg shadow-inner">
                        <div class="flex items-center gap-3 text-gray-600">
                            <span class="flex items-center gap-1">
                                <span class="material-icons">list</span>
                                {{ paginatedRequests.length }} of {{ filteredRequests.length }}
                            </span>
                            <select v-model.number="requestsPerPage"
                                class="border border-indigo-200 rounded-lg p-2 bg-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                <option v-for="n in [5, 10, 20]" :key="n" :value="n">{{ n }} per page</option>
                            </select>
                        </div>
                        <div class="flex items-center gap-3">
                            <button @click="previousPage" :disabled="currentPage === 1"
                                class="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-md">
                                <span class="material-icons">chevron_left</span>
                            </button>
                            <span class="text-indigo-700 font-semibold bg-indigo-100 px-4 py-1 rounded-full shadow-sm">
                                {{ currentPage }} / {{ totalPages }}
                            </span>
                            <button @click="nextPage" :disabled="currentPage === totalPages"
                                class="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-md">
                                <span class="material-icons">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Request Leave Modal -->
            <RequestLeave v-if="showRequestLeave" :show="showRequestLeave" @close="showRequestLeave = false"
                @submit="handleLeaveRequestSubmitted"
                class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" />
        </div>
    </div>
</template>

<style scoped>
/* Animations */
.animate-fade-in {
    animation: fadeIn 0.5s ease-in;
}

.animate-bounce-in {
    animation: bounceIn 0.5s ease-out;
}

.animate-pulse {
    animation: pulse 2s infinite;
}

.list-enter-active,
.list-leave-active {
    transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

/* Keyframes */
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
        transform: scale(0.95);
        opacity: 0;
    }

    50% {
        transform: scale(1.02);
        opacity: 0.9;
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

/* Responsive Design */
@media (max-width: 640px) {
    header {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }

    .flex.items-center.gap-4 {
        flex-direction: column;
        width: 100%;
    }

    .text-2xl {
        font-size: 1.5rem;
    }

    .grid.gap-5 {
        gap: 1rem;
    }
}
</style>