<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import Modal from '@/components/Modal.vue';
import { BASE_API_URL } from '@/utils/constants.ts';

// State
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const attendanceRecords = ref([]);
const statusMessage = ref('');
const isLoading = ref(false);
const searchQuery = ref('');
const sortKey = ref('name');
const sortDirection = ref('asc');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showModal = ref(false);
const selectedEmployee = ref(null);

// Headers for table
const headers = [
    { key: 'id', label: 'ID', icon: 'badge', align: 'left' },
    { key: 'name', label: 'Name', icon: 'person', align: 'left' },
    { key: 'position', label: 'Position', icon: 'work', align: 'left' },
    { key: 'status', label: 'Status', icon: 'assignment_turned_in', align: 'left' },
];

// Computed Properties
const filteredAttendance = computed(() => {
    let records = attendanceRecords.value.map(record => ({
        ...record,
        recordDate: new Date(record.date).toISOString().split('T')[0]
    }));

    if (selectedDate.value) {
        records = records.filter(record => record.recordDate === selectedDate.value);
    }

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        records = records.filter(record =>
            record.name.toLowerCase().includes(query) ||
            record.id.toLowerCase().includes(query)
        );
    }

    return records.sort((a, b) => {
        const aValue = a[sortKey.value] || '';
        const bValue = b[sortKey.value] || '';
        const direction = sortDirection.value === 'asc' ? 1 : -1;
        return aValue.localeCompare(bValue) * direction;
    });
});

const paginatedAttendance = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredAttendance.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(filteredAttendance.value.length / itemsPerPage.value));

const paginationInfo = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value + 1;
    const end = Math.min(currentPage.value * itemsPerPage.value, filteredAttendance.value.length);
    return { start, end };
});

// Utility Functions
const formatTime = (timeString) => {
    if (!timeString) return '--';
    const [hours, minutes] = timeString.split(':');
    const hourNum = parseInt(hours);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
};

const formatDate = (date) => {
    if (!date) return '--';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Methods
const fetchAttendance = async (event) => {
    event?.preventDefault();
    isLoading.value = true;
    try {
        const response = await axios.get(`${BASE_API_URL}/api/attendance`);
        attendanceRecords.value = response.data.map(record => {
            const employee = record.employeeId || {};
            return {
                id: record._id,
                employeeIdNumber: employee.employeeIdNumber || 'N/A',
                name: employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee',
                position: employee.position || 'N/A',
                email: employee.email || 'N/A',
                status: record.status,
                timeIn: record.timeIn,
                timeOut: record.timeOut,
                date: record.date
            };
        });
        showMessage('Attendance records loaded successfully');
    } catch (error) {
        console.error('Error fetching attendance:', error);
        showMessage(error.response?.data?.message || 'Failed to load attendance records');
    } finally {
        isLoading.value = false;
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

const prevPage = () => {
    if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) currentPage.value++;
};

const showDetails = (employee) => {
    selectedEmployee.value = employee;
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    selectedEmployee.value = null;
};

const showMessage = (text) => {
    statusMessage.value = text;
    setTimeout(() => {
        statusMessage.value = '';
    }, 3000);
};

// Lifecycle
onMounted(() => {
    fetchAttendance();
});
</script>

<template>
    <div class="max-w-8xl mx-auto space-y-6 px-10 py-8">
        <header
            class="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row gap-4 items-center justify-between border-l-4 border-blue-500">
            <div class="text-center md:text-left w-full md:w-auto">
                <h1 class="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <span class="material-icons text-blue-600">schedule</span>
                    Employee Attendance
                </h1>
            </div>
            <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div class="relative w-full sm:w-56">
                    <span
                        class="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">calendar_today</span>
                    <input type="date" v-model="selectedDate" id="attendanceDate" @change="fetchAttendance"
                        class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all duration-300 text-sm bg-white shadow-sm hover:shadow-md" />
                </div>
                <div class="relative w-full sm:w-72">
                    <span
                        class="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
                    <input v-model="searchQuery" type="text" placeholder="Search by name or ID..."
                        class="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all duration-300 text-sm bg-white shadow-sm hover:shadow-md" />
                    <button v-if="searchQuery" @click="searchQuery = ''"
                        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <span class="material-icons">close</span>
                    </button>
                </div>
            </div>
        </header>

        <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-100 sticky top-0 z-20">
                        <tr>
                            <th v-for="header in headers" :key="header.key"
                                class="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                                :class="header.align === 'center' ? 'text-center' : 'text-left'"
                                @click="sortTable(header.key)">
                                <div class="flex items-center gap-2"
                                    :class="header.align === 'center' ? 'justify-center' : 'justify-start'">
                                    <span class="material-icons text-gray-500">{{ header.icon }}</span>
                                    {{ header.label }}
                                    <span v-if="sortKey === header.key" class="material-icons text-gray-500">
                                        {{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                                    </span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        <template v-if="isLoading">
                            <tr v-for="n in 5" :key="n" class="animate-pulse">
                                <td v-for="m in 4" :key="m" class="px-6 py-4">
                                    <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                                </td>
                            </tr>
                        </template>
                        <tr v-for="employee in paginatedAttendance" :key="employee.id"
                            class="hover:bg-blue-50 transition-all duration-300 cursor-pointer"
                            @click="showDetails(employee)">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {{ employee.employeeIdNumber }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center gap-3">
                                    <img :src="`https://ui-avatars.com/api/?name=${employee.name}&background=random&color=fff`"
                                        alt="Employee avatar"
                                        class="h-8 w-8 rounded-full object-cover border border-gray-100"
                                        loading="lazy" />
                                    <span class="text-sm text-gray-700">{{ employee.name }}</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {{ employee.position }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <span :class="{
                                    'text-green-600': employee.status === 'On Time',
                                    'text-yellow-600': employee.status === 'Late',
                                    'text-red-600': employee.status === 'Absent'
                                }">
                                    {{ employee.status }}
                                </span>
                            </td>
                        </tr>
                        <tr v-if="paginatedAttendance.length === 0 && !isLoading">
                            <td colspan="4" class="px-6 py-12 text-center text-sm text-gray-500">
                                <div class="flex flex-col items-center gap-3">
                                    <span class="material-icons text-4xl text-gray-400">event_busy</span>
                                    <p class="text-sm font-medium text-gray-700">No attendance records for this date.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="!isLoading && filteredAttendance.length > itemsPerPage"
                class="p-4 flex justify-between items-center bg-gray-50 border-t">
                <div class="text-sm text-gray-600">
                    Showing <span class="font-medium text-gray-800">{{ paginationInfo.start }}</span> to
                    <span class="font-medium text-gray-800">{{ paginationInfo.end }}</span> of
                    <span class="font-medium text-gray-800">{{ filteredAttendance.length }}</span> records
                </div>
                <div class="flex items-center gap-2">
                    <button @click="prevPage" :disabled="currentPage === 1"
                        class="p-2 rounded-md bg-white border border-gray-200 hover:bg-blue-100 text-gray-700 transition-all disabled:opacity-50">
                        <span class="material-icons">chevron_left</span>
                    </button>
                    <span class="text-sm text-gray-700">{{ currentPage }} / {{ totalPages }}</span>
                    <button @click="nextPage" :disabled="currentPage === totalPages"
                        class="p-2 rounded-md bg-white border border-gray-200 hover:bg-blue-100 text-gray-700 transition-all disabled:opacity-50">
                        <span class="material-icons">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal Component -->
        <Modal :show="showModal" @close="closeModal" max-width="lg">
            <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <span class="material-icons text-blue-600">person</span> Employee Attendance Details
                </h2>
                <button @click="closeModal"
                    class="text-gray-500 hover:text-gray-800 p-1">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="p-6 space-y-5">
                <div class="flex items-center gap-3">
                    <img :src="`https://ui-avatars.com/api/?name=${selectedEmployee?.name}&background=random&color=fff`"
                        alt="Employee avatar" class="h-12 w-12 rounded-full object-cover border border-gray-200"
                        loading="lazy" />
                    <div>
                        <p class="text-base font-medium text-gray-800">{{ selectedEmployee?.name }}</p>
                        <p class="text-sm text-gray-600">{{ selectedEmployee?.position }}</p>
                    </div>
                </div>
                <p class="text-gray-700 text-sm"><strong>ID:</strong> {{ selectedEmployee?.employeeIdNumber }}</p>
                <p class="text-gray-700 text-sm"><strong>Email:</strong> {{ selectedEmployee?.email }}</p>
                <p class="text-gray-700 text-sm"><strong>Status:</strong> <span :class="{
                    'text-green-600': selectedEmployee?.status === 'On Time',
                    'text-yellow-600': selectedEmployee?.status === 'Late',
                    'text-red-600': selectedEmployee?.status === 'Absent'
                }">{{ selectedEmployee?.status }}</span></p>
                <p class="text-gray-700 text-sm"><strong>Date:</strong> {{ formatDate(selectedEmployee?.date) }}</p>
                <p class="text-gray-700 text-sm"><strong>Sign In:</strong> {{ formatTime(selectedEmployee?.timeIn) }}
                </p>
                <p class="text-gray-700 text-sm"><strong>Sign Out:</strong> {{ formatTime(selectedEmployee?.timeOut) }}
                </p>
            </div>
        </Modal>

        <!-- Status Message -->
        <transition name="slide-fade">
            <div v-if="statusMessage"
                class="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-3 max-w-sm w-full"
                :class="statusMessage.includes('successfully') ? 'bg-green-50 text-green-700 border-l-4 border-green-600' : 'bg-red-50 text-red-700 border-l-4 border-red-600'">
                <span class="material-icons">
                    {{ statusMessage.includes('successfully') ? 'check_circle' : 'error' }}
                </span>
                <p class="text-sm font-medium">{{ statusMessage }}</p>
                <button @click="statusMessage = ''"
                    class="ml-auto p-1 rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100">
                    <span class="material-icons">close</span>
                </button>
            </div>
        </transition>
    </div>
</template>

<style scoped>
.table-slide-enter-active,
.table-slide-leave-active {
    transition: all 0.3s ease;
}

.table-slide-enter-from,
.table-slide-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    opacity: 0;
    transform: translateX(20px);
}
</style>