<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';
import Toast from '@/components/Toast.vue';
import RequestLeave from './partials/RequestLeave.vue';
import UpdateLeaveRequest from './partials/UpdateLeaveRequest.vue';
import DeleteLeaveRequest from './partials/DeleteLeaveRequest.vue';

// State
const showRequestLeave = ref(false);
const leaveRequests = ref([]);
const currentPage = ref(1);
const requestsPerPage = ref(5);
const statusMessage = ref('');
const searchQuery = ref('');
const authStore = useAuthStore();

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

// Helper to get employeeId and token from auth store
const getAuthData = () => {
    const token = authStore.accessToken;
    if (!token) return { employeeId: null, token: null };
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
            authStore.logout();
            return { employeeId: null, token: null };
        }
        // Debug: Log token payload
        console.log('EmployeeLeaveRequest - Token payload:', payload);
        return { employeeId: payload.employeeId, token };
    } catch (error) {
        console.log('EmployeeLeaveRequest - Error decoding token:', error);
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

// Handle leave request update
const handleLeaveRequestUpdated = (updatedRequest) => {
    const index = leaveRequests.value.findIndex(req => req._id === updatedRequest._id);
    if (index !== -1) {
        leaveRequests.value[index] = updatedRequest;
    }
    statusMessage.value = 'Leave request updated successfully!';
    setTimeout(() => statusMessage.value = '', 3000);
};

// Handle leave request deletion
const handleLeaveRequestDeleted = (requestId) => {
    leaveRequests.value = leaveRequests.value.filter(req => req._id !== requestId);
    statusMessage.value = 'Leave request deleted successfully!';
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
    <div>
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
                        class="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 text-gray-700 shadow-sm transition-all duration-300 outline-none" />
                </div>
                <button @click="showRequestLeave = true"
                    class="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
                    <span class="material-icons">add_circle</span>
                    New Request
                </button>
            </div>
        </header>

        <!-- Table Section -->
        <div class="w-full py-10 mx-auto">
            <div class="flex flex-col">
                <div class="-m-1.5 overflow-x-auto">
                    <div class="p-1.5 min-w-full inline-block align-middle">
                        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-100">
                                    <tr>
                                        <th scope="col" class="px-6 py-3 text-start">
                                            <div class="flex items-center gap-x-2">
                                                <span class="text-xs font-semibold uppercase text-gray-800">
                                                    Employee
                                                </span>
                                            </div>
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-start">
                                            <div class="flex items-center gap-x-2">
                                                <span class="text-xs font-semibold uppercase text-gray-800">
                                                    Reason
                                                </span>
                                            </div>
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-start">
                                            <div class="flex items-center gap-x-2">
                                                <span class="text-xs font-semibold uppercase text-gray-800">
                                                    Type
                                                </span>
                                            </div>
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-start">
                                            <div class="flex items-center gap-x-2">
                                                <span class="text-xs font-semibold uppercase text-gray-800">
                                                    Start Date
                                                </span>
                                            </div>
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-start">
                                            <div class="flex items-center gap-x-2">
                                                <span class="text-xs font-semibold uppercase text-gray-800">
                                                    End Date
                                                </span>
                                            </div>
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-start">
                                            <div class="flex items-center gap-x-2">
                                                <span class="text-xs font-semibold uppercase text-gray-800">
                                                    Status
                                                </span>
                                            </div>
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-start">
                                            <div class="flex items-center gap-x-2">
                                                <span class="text-xs font-semibold uppercase text-gray-800">
                                                    Actions
                                                </span>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 dark:divide-neutral-700">
                                    <tr v-for="request in paginatedRequests" :key="request._id"
                                        class="bg-white hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800">
                                        <td class="size-px whitespace-nowrap align-top">
                                            <a class="block p-6" href="#">
                                                <span class="text-sm text-gray-600 dark:text-neutral-400">
                                                    {{ request.employeeName }}
                                                </span>
                                            </a>
                                        </td>
                                        <td class="h-px w-72 min-w-72 align-top">
                                            <a class="block p-6" href="#">
                                                <span class="block text-sm text-gray-500 dark:text-neutral-500">
                                                    {{ request.reason }}
                                                </span>
                                            </a>
                                        </td>
                                        <td class="size-px whitespace-nowrap align-top">
                                            <a class="block p-6" href="#">
                                                <span class="text-sm text-gray-600 dark:text-neutral-400">
                                                    {{ request.type }}
                                                </span>
                                            </a>
                                        </td>
                                        <td class="size-px whitespace-nowrap align-top">
                                            <a class="block p-6" href="#">
                                                <span class="text-sm text-gray-600 dark:text-neutral-400">{{
                                                    formatDate(request.startDate) }}</span>
                                            </a>
                                        </td>
                                        <td class="size-px whitespace-nowrap align-top">
                                            <a class="block p-6" href="#">
                                                <span class="text-sm text-gray-600 dark:text-neutral-400">
                                                    {{ formatDate(request.endDate) }}
                                                </span>
                                            </a>
                                        </td>
                                        <td class="size-px whitespace-nowrap align-top">
                                            <a class="block p-6" href="#">
                                                <span :class="{
                                                    'bg-yellow-100 text-yellow-800': request.status === 'Pending',
                                                    'bg-green-100 text-green-800': request.status === 'Approved',
                                                    'bg-red-100 text-red-800': request.status === 'Disapproved'
                                                }"
                                                    class="py-1 px-1.5 inline-flex items-center gap-x-1 text-xs font-medium rounded-full">
                                                    <svg v-if="request.status === 'Pending'"
                                                        xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                        viewBox="0 0 24 24" fill="currentColor"
                                                        class="icon icon-tabler icons-tabler-filled icon-tabler-clock-hour-3 size-2.5">
                                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                        <path
                                                            d="M17 3.34a10 10 0 1 1 -15 8.66l.005 -.324a10 10 0 0 1 14.995 -8.336m-5 2.66a1 1 0 0 0 -1 1v5a1 1 0 0 0 1 1h3.5a1 1 0 0 0 0 -2h-2.5v-4a1 1 0 0 0 -.883 -.993z" />
                                                    </svg>
                                                    <svg v-if="request.status === 'Approved'" class="size-2.5"
                                                        xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                        fill="currentColor" viewBox="0 0 16 16">
                                                        <path
                                                            d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                                                    </svg>
                                                    <svg v-if="request.status === 'Disapproved'"
                                                        xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                        viewBox="0 0 24 24" fill="currentColor"
                                                        class="icon icon-tabler icons-tabler-filled icon-tabler-xbox-x size-2.5">
                                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                        <path
                                                            d="M12 2c5.523 0 10 4.477 10 10s-4.477 10 -10 10s-10 -4.477 -10 -10s4.477 -10 10 -10m3.6 5.2a1 1 0 0 0 -1.4 .2l-2.2 2.933l-2.2 -2.933a1 1 0 1 0 -1.6 1.2l2.55 3.4l-2.55 3.4a1 1 0 1 0 1.6 1.2l2.2 -2.933l2.2 2.933a1 1 0 0 0 1.6 -1.2l-2.55 -3.4l2.55 -3.4a1 1 0 0 0 -.2 -1.4" />
                                                    </svg>
                                                    {{ request.status }}
                                                </span>
                                            </a>
                                        </td>
                                        <td class="size-px whitespace-nowrap align-top">
                                            <div class="flex p-6">
                                                <UpdateLeaveRequest :request="request"
                                                    @update="handleLeaveRequestUpdated" />
                                                <DeleteLeaveRequest :request="request"
                                                    @delete="handleLeaveRequestDeleted" />
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div v-if="filteredRequests.length > 0"
                                class="px-6 py-4 grid gap-3 md:flex md:justify-between md:items-center border-t border-gray-200 dark:border-neutral-700">
                                <div class="max-w-sm">
                                    <select v-model.number="requestsPerPage"
                                        class="py-2 px-3 pe-9 block border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500">
                                        <option v-for="n in [5, 10, 20]" :key="n" :value="n">{{ n }} per page</option>
                                    </select>
                                </div>
                                <div>
                                    <div class="inline-flex gap-x-2">
                                        <button type="button" @click="previousPage" :disabled="currentPage === 1"
                                            class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24"
                                                height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                confuse-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="m15 18-6-6 6-6" />
                                            </svg>
                                            Prev
                                        </button>
                                        <button type="button" @click="nextPage" :disabled="currentPage === totalPages"
                                            class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                            Next
                                            <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24"
                                                height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="m9 18 6-6-6-6" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Toast v-if="statusMessage" :message="statusMessage" />
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