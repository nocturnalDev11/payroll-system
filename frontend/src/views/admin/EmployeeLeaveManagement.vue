<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-1">
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
                            <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                search
                            </span>
                            <input id="search" v-model="searchQuery" type="text" placeholder="Search by name or ID..."
                                class="w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 
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
                            <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                filter_list
                            </span>
                            <select id="statusFilter" v-model="filterStatus" class="w-full pl-10 pr-9 py-2.5 border rounded-lg appearance-none focus:ring-2 
                       focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-sm">
                                <option value="">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Disapproved">Disapproved</option>
                            </select>
                            <span
                                class="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                arrow_drop_down
                            </span>
                        </div>
                    </div>

                    <div class="relative">
                        <label for="dateRange" class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                        <input id="dateRange" v-model="dateRange" type="month" class="w-full px-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 
                     focus:border-blue-500 outline-none transition-all duration-200 text-sm"
                            @change="applyDateFilter" />
                    </div>
                </div>
            </div>

            <!-- Leave Requests Table -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div class="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                    <h2 class="text-lg font-medium text-gray-900">Leave Requests</h2>
                    <span class="text-sm text-gray-500">Showing {{ filteredLeaveRequests.length }} {{
                        filteredLeaveRequests.length === 1 ? 'request' : 'requests' }}</span>
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

                <transition-group name="table-fade" tag="div" class="overflow-x-auto">
                    <table v-if="!isLoading && filteredLeaveRequests.length > 0"
                        class="min-w-full divide-y divide-gray-200">
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
                            <tr v-for="leave in filteredLeaveRequests" :key="leave.id"
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
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                    <button @click="showDetailsModal(leave)"
                                        class="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 py-1.5 px-2.5 rounded-md text-sm font-medium 
                                 hover:bg-blue-100 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                                        <span class="material-icons text-xs">visibility</span>
                                        View
                                    </button>
                                    <button @click="approveLeave(leave.id)" :disabled="leave.status === 'Approved'"
                                        class="inline-flex items-center gap-1.5 bg-green-50 text-green-600 py-1.5 px-2.5 rounded-md text-sm font-medium 
                                 hover:bg-green-100 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:opacity-50">
                                        <span class="material-icons text-xs">check</span>
                                        Approve
                                    </button>
                                    <button @click="disapproveLeave(leave.id)"
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
                </transition-group>

                <!-- Pagination -->
                <div v-if="!isLoading && filteredLeaveRequests.length > itemsPerPage"
                    class="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                    <div class="text-sm text-gray-700">
                        Showing <span class="font-medium">{{ ((currentPage - 1) * itemsPerPage) + 1 }}</span> to
                        <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredLeaveRequests.length)
                            }}</span> of
                        <span class="font-medium">{{ filteredLeaveRequests.length }}</span> requests
                    </div>
                    <div class="flex items-center gap-2">
                        <button @click="prevPage" :disabled="currentPage === 1"
                            class="p-2 rounded-md hover:bg-blue-100 transition-all duration-200 disabled:opacity-50 disabled:hover:bg-transparent text-gray-700">
                            <span class="material-icons">chevron_left</span>
                        </button>
                        <span class="text-sm text-gray-700">{{ currentPage }} of {{ totalPages }}</span>
                        <button @click="nextPage" :disabled="currentPage === totalPages"
                            class="p-2 rounded-md hover:bg-blue-100 transition-all duration-200 disabled:opacity-50 disabled:hover:bg-transparent text-gray-700">
                            <span class="material-icons">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Email-Style Details Modal -->
            <transition name="modal-slide">
                <div v-if="showDetailsModalVisible"
                    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div
                        class="bg-white p-6 rounded-xl shadow-lg max-w-2xl w-full transform transition-all duration-300 scale-100">
                        <div class="border-b border-gray-200 pb-4 mb-4">
                            <div class="flex justify-between items-center">
                                <h2 class="text-lg font-semibold text-gray-800">Leave Request Notification</h2>
                                <button @click="closeDetailsModal"
                                    class="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition-all duration-200">
                                    <span class="material-icons text-lg">close</span>
                                </button>
                            </div>
                            <div class="text-sm text-gray-500 mt-2">From: HR System <span class="text-gray-400">|</span>
                                To: Admin</div>
                        </div>

                        <div class="mb-4">
                            <h3 class="text-base font-medium text-gray-900">Subject: Leave Request for {{
                                selectedLeave.employeeName }}</h3>
                            <p class="text-sm text-gray-600 mt-1">Date: {{ formatDate(selectedLeave.startDate) }} – {{
                                formatDate(selectedLeave.endDate) }}</p>
                        </div>

                        <div class="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                            <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ selectedLeave.reason }}</p>
                        </div>

                        <div class="space-y-3 text-sm">
                            <p class="text-gray-700"><span class="font-medium text-gray-800">Employee:</span> {{
                                selectedLeave.employeeName }}</p>
                            <p class="text-gray-700"><span class="font-medium text-gray-800">Employee ID:</span> {{
                                selectedLeave.employeeId }}</p>
                            <p class="text-gray-700"><span class="font-medium text-gray-800">Status:</span>
                                <span :class="getStatusClass(selectedLeave.status)">{{ selectedLeave.status }}</span>
                            </p>
                        </div>

                        <div class="mt-6 flex justify-end gap-3">
                            <button @click="approveLeave(selectedLeave.id)"
                                :disabled="selectedLeave.status === 'Approved'"
                                class="px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50">
                                Approve
                            </button>
                            <button @click="disapproveLeave(selectedLeave.id)"
                                :disabled="selectedLeave.status === 'Disapproved'"
                                class="px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50">
                                Disapprove
                            </button>
                            <button @click="closeDetailsModal"
                                class="px-4 py-2 bg-gray-500 text-white rounded-md text-sm font-medium hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </transition>

            <!-- Toast Notifications -->
            <div class="fixed bottom-4 right-4 z-50 space-y-4">
                <transition enter-active-class="transform ease-out duration-300 transition"
                    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
                    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
                    leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100"
                    leave-to-class="opacity-0">
                    <div v-if="toastMessage"
                        class="max-w-sm w-full bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
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

<script>
import axios from 'axios';
import moment from 'moment';

export default {
    name: 'AdminLeaveManagement',
    data() {
        return {
            leaveRequests: [],
            showDetailsModalVisible: false,
            selectedLeave: {},
            searchQuery: '',
            filterStatus: '',
            dateRange: '',
            sortKey: 'startDate',
            sortDirection: 'desc',
            currentPage: 1,
            itemsPerPage: 10,
            isLoading: false,
            toastMessage: '',
            toastType: 'success'
        };
    },
    mounted() {
        this.fetchLeaveRequests();
    },
    computed: {
        filteredLeaveRequests() {
            let filtered = [...this.leaveRequests];

            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(leave =>
                    leave.employeeName.toLowerCase().includes(query) ||
                    leave.employeeId.toLowerCase().includes(query)
                );
            }

            if (this.filterStatus) {
                filtered = filtered.filter(leave => leave.status === this.filterStatus);
            }

            if (this.dateRange) {
                const [year, month] = this.dateRange.split('-');
                const startOfMonth = moment(`${year}-${month}-01`).startOf('month').toDate();
                const endOfMonth = moment(startOfMonth).endOf('month').toDate();
                filtered = filtered.filter(leave => {
                    const start = moment(leave.startDate).toDate();
                    return start >= startOfMonth && start <= endOfMonth;
                });
            }

            filtered.sort((a, b) => {
                const valueA = a[this.sortKey];
                const valueB = b[this.sortKey];
                if (this.sortKey === 'startDate' || this.sortKey === 'endDate') {
                    return this.sortDirection === 'asc'
                        ? moment(valueA).diff(moment(valueB))
                        : moment(valueB).diff(moment(valueA));
                }
                return this.sortDirection === 'asc'
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            });

            return filtered;
        },
        totalPages() {
            return Math.ceil(this.filteredLeaveRequests.length / this.itemsPerPage);
        }
    },
    methods: {
        async fetchLeaveRequests() {
            try {
                this.isLoading = true;
                const response = await axios.get('http://localhost:7777/api/leaves/all');
                this.leaveRequests = response.data.map(leave => ({
                    ...leave,
                    startDate: moment(leave.startDate).format('YYYY-MM-DD'),
                    endDate: moment(leave.endDate).format('YYYY-MM-DD')
                })) || [];
            } catch (error) {
                console.error('Failed to fetch leave requests:', error);
                this.showToast('Failed to load leave requests. Please try again.', 'error');
            } finally {
                this.isLoading = false;
            }
        },
        async refreshLeaveRequests() {
            await this.fetchLeaveRequests();
            this.showToast('Leave requests refreshed successfully!', 'success');
        },
        showDetailsModal(leave) {
            this.selectedLeave = { ...leave };
            this.showDetailsModalVisible = true;
        },
        closeDetailsModal() {
            this.showDetailsModalVisible = false;
            this.selectedLeave = {};
        },
        async approveLeave(id) {
            try {
                const response = await axios.put(`http://localhost:7777/api/leaves/${id}/approve`);
                if (response.status === 200) {
                    this.leaveRequests = this.leaveRequests.map(leave =>
                        leave.id === id ? { ...leave, status: 'Approved' } : leave
                    );
                    if (this.showDetailsModalVisible) {
                        this.selectedLeave.status = 'Approved';
                    }
                    this.showToast('Leave approved successfully!', 'success');
                }
            } catch (error) {
                console.error('Failed to approve leave:', error);
                this.showToast('Failed to approve leave. Please try again.', 'error');
            }
        },
        async disapproveLeave(id) {
            try {
                const response = await axios.put(`http://localhost:7777/api/leaves/${id}/disapprove`);
                if (response.status === 200) {
                    this.leaveRequests = this.leaveRequests.map(leave =>
                        leave.id === id ? { ...leave, status: 'Disapproved' } : leave
                    );
                    if (this.showDetailsModalVisible) {
                        this.selectedLeave.status = 'Disapproved';
                    }
                    this.showToast('Leave disapproved successfully!', 'success');
                }
            } catch (error) {
                console.error('Failed to disapprove leave:', error);
                this.showToast('Failed to disapprove leave. Please try again.', 'error');
            }
        },
        getStatusClass(status) {
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
        },
        formatDate(date) {
            return moment(date).format('MMMM D, YYYY');
        },
        sortTable(key) {
            if (this.sortKey === key) {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortKey = key;
                this.sortDirection = 'asc';
            }
        },
        applyDateFilter() {
            this.currentPage = 1; // Reset to first page when filtering
        },
        prevPage() {
            if (this.currentPage > 1) this.currentPage--;
        },
        nextPage() {
            if (this.currentPage < this.totalPages) this.currentPage++;
        },
        showToast(message, type = 'success') {
            this.toastMessage = message;
            this.toastType = type;
            setTimeout(() => this.clearToast(), 3000);
        },
        clearToast() {
            this.toastMessage = '';
            this.toastType = 'success';
        }
    }
};
</script>

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

/* Modal slide animation */
.modal-slide-enter-active,
.modal-slide-leave-active {
    transition: all 0.3s ease;
}

.modal-slide-enter-from,
.modal-slide-leave-to {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
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