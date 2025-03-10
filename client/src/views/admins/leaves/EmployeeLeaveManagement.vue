<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import moment from 'moment';
import LeaveRequestDetails from './Partials/LeaveRequestDetails.vue';
import { BASE_API_URL } from '@/utils/constants.js';

// State
const leaveRequests = ref([]);
const searchQuery = ref('');
const filterStatus = ref('');
const dateRange = ref('');
const sortKey = ref('startDate');
const sortDirection = ref('desc');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const isLoading = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

// Computed Properties
const filteredLeaveRequests = computed(() => {
    try {
        let filtered = Array.isArray(leaveRequests.value) ? [...leaveRequests.value] : [];

        if (searchQuery.value) {
            const query = searchQuery.value.toLowerCase();
            filtered = filtered.filter(leave => {
                const nameMatch = (leave.employeeName?.toLowerCase() || '').includes(query);
                const idMatch = typeof leave.employeeId === 'string'
                    ? leave.employeeId.toLowerCase().includes(query)
                    : (leave.employeeId?._id?.toLowerCase() || '').includes(query);
                return nameMatch || idMatch;
            });
        }

        if (filterStatus.value) {
            filtered = filtered.filter(leave => leave.status === filterStatus.value);
        }

        if (dateRange.value) {
            const [year, month] = dateRange.value.split('-');
            const startOfMonth = moment(`${year}-${month}-01`).startOf('month');
            const endOfMonth = moment(startOfMonth).endOf('month');
            filtered = filtered.filter(leave => {
                const start = moment(leave.startDate);
                const end = moment(leave.endDate);
                return start.isSameOrBefore(endOfMonth) && end.isSameOrAfter(startOfMonth);
            });
        }

        filtered.sort((a, b) => {
            const valueA = a[sortKey.value];
            const valueB = b[sortKey.value];
            if (sortKey.value === 'startDate' || sortKey.value === 'endDate') {
                return sortDirection.value === 'asc'
                    ? moment(valueA).diff(moment(valueB))
                    : moment(valueB).diff(moment(valueA));
            }
            return sortDirection.value === 'asc'
                ? (valueA || '').localeCompare(valueB || '')
                : (valueB || '').localeCompare(valueA || '');
        });

        const start = (currentPage.value - 1) * itemsPerPage.value;
        const end = start + itemsPerPage.value;
        return filtered.slice(start, end) || [];
    } catch (error) {
        console.error('Error in filteredLeaveRequests:', error);
        return [];
    }
});

const totalPages = computed(() => {
    const length = Array.isArray(leaveRequests.value) ? leaveRequests.value.length : 0;
    return Math.ceil(length / itemsPerPage.value) || 1;
});

// Methods
const fetchLeaveRequests = async () => {
    try {
        isLoading.value = true;
        const response = await axios.get(`${BASE_API_URL}/api/leaves/all`);
        console.log('API Response:', response.data);
        const data = Array.isArray(response.data) ? response.data : [];
        leaveRequests.value = data.map(leave => {
            const start = moment(leave.startDate);
            const end = moment(leave.endDate);
            if (!start.isValid() || !end.isValid()) {
                console.warn(`Invalid dates for leave ${leave._id}:`, leave);
                return null; // Skip invalid dates
            }
            if (end.isBefore(start)) {
                console.warn(`End date before start date for leave ${leave._id}:`, leave);
                return null; // Skip invalid ranges
            }
            return {
                ...leave,
                startDate: start.format('YYYY-MM-DD'),
                endDate: end.format('YYYY-MM-DD')
            };
        }).filter(leave => leave !== null); // Remove skipped entries
    } catch (error) {
        console.error('Failed to fetch leave requests:', error);
        showToast('Failed to load leave requests. Please try again.', 'error');
        leaveRequests.value = [];
    } finally {
        isLoading.value = false;
    }
};

const refreshLeaveRequests = async () => {
    await fetchLeaveRequests();
    showToast('Leave requests refreshed successfully!', 'success');
};

const approveLeave = async (id) => {
    try {
        const response = await axios.put(`${BASE_API_URL}/api/leaves/${id}/approve`);
        if (response.status === 200) {
            leaveRequests.value = leaveRequests.value.map(leave =>
                leave._id === id ? { ...leave, status: 'Approved' } : leave
            );
            showToast('Leave approved successfully!', 'success');
        }
    } catch (error) {
        console.error('Failed to approve leave:', error);
        showToast('Failed to approve leave. Please try again.', 'error');
    }
};

const disapproveLeave = async (id) => {
    try {
        const response = await axios.put(`${BASE_API_URL}/api/leaves/${id}/disapprove`);
        if (response.status === 200) {
            leaveRequests.value = leaveRequests.value.map(leave =>
                leave._id === id ? { ...leave, status: 'Disapproved' } : leave
            );
            showToast('Leave disapproved successfully!', 'success');
        }
    } catch (error) {
        console.error('Failed to disapprove leave:', error);
        showToast('Failed to disapprove leave. Please try again.', 'error');
    }
};

const formatDate = (date) => {
    return moment(date).format('MMMM D, YYYY');
};

const getStatusClass = (status) => {
    switch (status) {
        case 'Pending':
            return 'text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md';
        case 'Approved':
            return 'text-green-600 bg-green-50 px-2 py-1 rounded-md';
        case 'Disapproved':
            return 'text-red-600 bg-red-50 px-2 py-1 rounded-md';
        default:
            return 'text-gray-600 bg-gray-50 px-2 py-1 rounded-md';
    }
};

const sortTable = (key) => {
    if (sortKey.value === key) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortKey.value = key;
        sortDirection.value = 'asc';
    }
};

const applyDateFilter = () => {
    currentPage.value = 1;
};

const resetDateFilter = () => {
    dateRange.value = '';
    currentPage.value = 1;
};

const prevPage = () => {
    if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) currentPage.value++;
};

const showToast = (message, type = 'success') => {
    toastMessage.value = message;
    toastType.value = type;
    setTimeout(() => clearToast(), 3000);
};

const clearToast = () => {
    toastMessage.value = '';
    toastType.value = 'success';
};

// Lifecycle
onMounted(() => {
    fetchLeaveRequests();
});
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-2">
        <div class="max-w-8xl mx-auto">
            <header class="bg-white p-6 rounded-xl shadow-lg mb-6">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span class="material-icons text-blue-600">event_note</span>
                        Employee Leave Management
                    </h1>
                    <button @click="refreshLeaveRequests"
                        class="inline-flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm font-medium 
                               hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                        <span class="material-icons text-sm">refresh</span>
                        Refresh
                    </button>
                </div>
            </header>

            <!-- Filters and Search -->
            <div class="bg-white rounded-xl shadow-lg p-5 mb-6 border border-gray-100">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div class="relative">
                        <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search
                            Employees</label>
                        <div class="relative">
                            <span
                                class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                            <input id="search" v-model="searchQuery" type="text" placeholder="Search by name or ID..."
                                class="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 
                                       focus:border-blue-500 outline-none transition-all duration-200 text-sm" />
                            <button v-if="searchQuery" @click="searchQuery = ''"
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-all duration-200">
                                <span class="material-icons text-sm">clear</span>
                            </button>
                        </div>
                    </div>
                    <div class="relative">
                        <label for="statusFilter" class="block text-sm font-medium text-gray-700 mb-1">Filter by
                            Status</label>
                        <div class="relative">
                            <span
                                class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">filter_list</span>
                            <select id="statusFilter" v-model="filterStatus"
                                class="w-full pl-10 pr-9 py-2.5 border border-gray-300 rounded-lg appearance-none focus:ring-2 
                                       focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-sm">
                                <option value="">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Disapproved">Disapproved</option>
                            </select>
                            <span
                                class="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">arrow_drop_down</span>
                        </div>
                    </div>
                    <div class="relative">
                        <label for="dateRange" class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                        <div class="relative">
                            <input id="dateRange" v-model="dateRange" type="month" class="w-full px-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 
                                       focus:border-blue-500 outline-none transition-all duration-200 text-sm"
                                @change="applyDateFilter" />
                            <button v-if="dateRange" @click="resetDateFilter"
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-all duration-200">
                                <span class="material-icons text-sm">clear</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Leave Requests Table -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div class="px-6 py-4 border-b border-gray-300 bg-gray-50 flex items-center justify-between">
                    <h2 class="text-lg font-medium text-gray-900">Leave Requests</h2>
                    <span class="text-sm text-gray-500">Showing {{ filteredLeaveRequests?.length || 0 }} {{
                        (filteredLeaveRequests?.length || 0) === 1 ? 'request' : 'requests' }}</span>
                </div>

                <div v-if="isLoading" class="p-10 flex justify-center items-center">
                    <div class="flex flex-col items-center">
                        <div
                            class="loader ease-linear rounded-full border-4 border-t-4 border-blue-200 h-12 w-12 mb-4 animate-spin">
                        </div>
                        <h3 class="text-lg font-medium text-gray-600">Loading...</h3>
                    </div>
                </div>

                <div v-else-if="filteredLeaveRequests.length === 0" class="p-12 text-center">
                    <div class="rounded-full bg-blue-100 p-4 mb-4 inline-flex">
                        <span class="material-icons text-blue-600 text-3xl">event_busy</span>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900">No Leave Requests Found</h3>
                    <p class="mt-2 text-gray-500 max-w-md mx-auto text-sm">
                        There are no leave requests matching your criteria. Try adjusting your filters.
                    </p>
                </div>

                <div v-else class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    @click="sortTable('employeeName')">
                                    Employee Name
                                    <span class="material-icons text-xs ml-1">{{ sortDirection === 'asc' && sortKey ===
                                        'employeeName' ? 'arrow_drop_up' : 'arrow_drop_down' }}</span>
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    @click="sortTable('startDate')">
                                    Start Date
                                    <span class="material-icons text-xs ml-1">{{ sortDirection === 'asc' && sortKey ===
                                        'startDate' ? 'arrow_drop_up' : 'arrow_drop_down' }}</span>
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    @click="sortTable('endDate')">
                                    End Date
                                    <span class="material-icons text-xs ml-1">{{ sortDirection === 'asc' && sortKey ===
                                        'endDate' ? 'arrow_drop_up' : 'arrow_drop_down' }}</span>
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    @click="sortTable('status')">
                                    Status
                                    <span class="material-icons text-xs ml-1">{{ sortDirection === 'asc' && sortKey ===
                                        'status' ? 'arrow_drop_up' : 'arrow_drop_down' }}</span>
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="leave in filteredLeaveRequests" :key="leave._id"
                                class="transition-all duration-200 hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ leave.employeeName }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{
                                    formatDate(leave.startDate) }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{
                                    formatDate(leave.endDate) }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold"
                                    :class="getStatusClass(leave.status)">
                                    {{ leave.status }}
                                </td>

                                <!-- Inside the table's <td> in EmployeeLeaveManagement.vue -->
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                    <LeaveRequestDetails :leave="leave" @approve="approveLeave"
                                        @disapprove="disapproveLeave" @close="() => { }" />
                                    <button @click="approveLeave(leave._id)" :disabled="leave.status === 'Approved'"
                                        class="inline-flex items-center gap-1.5 bg-green-50 text-green-600 py-1.5 px-2.5 rounded-md text-sm font-medium 
                                            hover:bg-green-100 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:opacity-50">
                                        <span class="material-icons text-xs">check</span>
                                        Approve
                                    </button>
                                    <button @click="disapproveLeave(leave._id)"
                                        :disabled="leave.status === 'Disapproved'"
                                        class="inline-flex items-center gap-1.5 bg-red-50 text-red-600 py-1.5 px-2.5 rounded-md text-sm font-medium 
                                            hover:bg-red-100 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:opacity-50">
                                        <span class="material-icons text-xs">close</span>
                                        Disapprove
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div v-if="!isLoading && (leaveRequests?.value?.length || 0) > itemsPerPage.value"
                    class="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                    <div class="text-sm text-gray-700">
                        Showing <span class="font-medium">{{ ((currentPage.value - 1) * itemsPerPage.value) + 1
                            }}</span> to
                        <span class="font-medium">{{ Math.min(currentPage.value * itemsPerPage.value,
                            leaveRequests.value.length) }}</span> of
                        <span class="font-medium">{{ leaveRequests.value.length }}</span> requests
                    </div>
                    <div class="flex items-center gap-2">
                        <button @click="prevPage" :disabled="currentPage.value === 1"
                            class="p-2 rounded-md hover:bg-blue-100 transition-all duration-200 disabled:opacity-50 disabled:hover:bg-transparent text-gray-700">
                            <span class="material-icons">chevron_left</span>
                        </button>
                        <span class="text-sm text-gray-700">{{ currentPage }} of {{ totalPages }}</span>
                        <button @click="nextPage" :disabled="currentPage.value === totalPages.value"
                            class="p-2 rounded-md hover:bg-blue-100 transition-all duration-200 disabled:opacity-50 disabled:hover:bg-transparent text-gray-700">
                            <span class="material-icons">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

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
    </div>
</template>

<style scoped>
/* Table row animation */
.table-fade-enter-active,
.table-fade-leave-active {
    transition: all 0.3s ease;
}

.table-fade-enter-from,
.table-fade-leave-to {
    opacity: 0;
    transform: translateY(30px);
}

/* Loader animation */
.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Button hover effects */
button:hover:not(:disabled) {
    transform: translateY(-2px);
}

/* Disabled button styles */
button:disabled {
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .grid-cols-3 {
        grid-template-columns: 1fr;
    }

    .px-6 {
        padding-left: 1rem;
        padding-right: 1rem;
    }

    .text-xl {
        font-size: 1.25rem;
    }
}

/* Custom scrollbar for better UX */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
    background: #555;
}

/* Focus states for accessibility */
input:focus,
select:focus,
button:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

/* Improve hover states for better interactivity */
.hover\:bg-gray-50:hover {
    background-color: #f9fafb;
}
</style>