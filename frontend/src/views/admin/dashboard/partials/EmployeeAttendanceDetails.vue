<script setup>
import { defineProps, defineEmits, ref } from 'vue';
import Modal from '@/components/Modal.vue';

const props = defineProps({
    show: {
        type: Boolean,
        required: true,
    },
    employee: {
        type: Object,
        default: () => ({}),
    },
});

const emit = defineEmits(['close']);
const isCopied = ref(false);

// Format time (aligned with AdminDashboard.vue)
const formatTime = (time) => {
    if (!time || time === '00:00:00') return '--';
    const [hours, minutes] = time.split(':');
    const period = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const displayHours = parseInt(hours) % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
};

// Format date (using createdAt or current date)
const formatDate = (date) => {
    if (!date) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Status badge classes
const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'on time':
        case 'present':
            return 'bg-green-100 text-green-700';
        case 'late':
            return 'bg-yellow-100 text-yellow-700';
        case 'absent':
            return 'bg-red-100 text-red-700';
        case 'early departure':
            return 'bg-orange-100 text-orange-700';
        case 'half day':
            return 'bg-blue-100 text-blue-700';
        case 'incomplete':
            return 'bg-purple-100 text-purple-700';
        case 'leave':
            return 'bg-gray-100 text-gray-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

// Copy email to clipboard
const copyEmail = async () => {
    try {
        await navigator.clipboard.writeText(props.employee.employeeId?.email || '');
        isCopied.value = true;
        setTimeout(() => (isCopied.value = false), 2000);
    } catch (error) {
        console.error('Failed to copy email:', error);
    }
};
</script>

<template>
    <!-- View Details Button with Tooltip -->
    <div class="relative group">
        <button @click="emit('open')"
            class="flex items-center text-blue-600 hover:text-blue-800 transition cursor-pointer p-2 rounded-full hover:bg-blue-100"
            title="View Details" aria-label="View employee attendance details">
            <span class="material-icons text-xl">visibility</span>
        </button>
    </div>

    <!-- Modal -->
    <Modal :show="show" @close="emit('close')">
        <!-- Header -->
        <div class="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 id="modal-title" class="text-2xl font-semibold text-gray-900 flex items-center">
                <span class="material-icons text-blue-600 mr-2">person</span>
                Attendance Details
            </h2>
            <button @click="emit('close')"
                class="flex items-center justify-center text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition cursor-pointer"
                aria-label="Close modal">
                <span class="material-icons">close</span>
            </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-6">
            <!-- Employee Header -->
            <div class="flex items-center gap-4 border-b border-gray-100 pb-4">
                <img :src="`https://ui-avatars.com/api/?name=${employee.employeeId?.firstName?.charAt(0)}${employee.employeeId?.lastName?.charAt(0)}&background=3b82f6&color=fff&size=64`"
                    alt="Employee avatar" class="h-16 w-16 rounded-full object-cover border-2 border-blue-200"
                    loading="lazy" />
                <div>
                    <h3 class="text-lg font-semibold text-gray-800">
                        {{ employee.employeeId?.firstName || 'N/A' }}
                        {{ employee.employeeId?.lastName || '' }}
                    </h3>
                    <p class="text-sm text-gray-600">{{ employee.employeeId?.position || 'N/A' }}</p>
                </div>
            </div>

            <!-- Personal Info -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex items-center gap-2">
                    <span class="material-icons text-gray-500 text-lg">badge</span>
                    <div>
                        <p class="text-sm font-medium text-gray-700">Employee ID</p>
                        <p class="text-sm text-gray-600">{{ employee.employeeId?.empNo || 'N/A' }}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="material-icons text-gray-500 text-lg">email</span>
                    <div class="flex items-center justify-center gap-2">
                        <p class="text-sm font-medium text-gray-700">Email</p>
                        <p class="text-sm text-gray-600">{{ employee.employeeId?.email || 'N/A' }}</p>
                    </div>
                    <button @click="copyEmail"
                        class="flex items-center justify-center text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition cursor-pointer"
                        :disabled="!employee.employeeId?.email" :aria-label="isCopied ? 'Email copied' : 'Copy email'">
                        <span class="material-icons text-sm">{{
                            isCopied ? 'check_circle' : 'content_copy'
                        }}</span>
                    </button>
                </div>
            </div>

            <!-- Attendance Info -->
            <div class="space-y-4">
                <h4 class="text-base font-semibold text-gray-800 flex items-center">
                    <span class="material-icons text-blue-600 mr-2">event</span>
                    Attendance Details
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="flex items-center gap-2">
                        <span class="material-icons text-gray-500 text-lg">login</span>
                        <div>
                            <p class="text-sm font-medium text-gray-700">Morning Sign In</p>
                            <p class="text-sm text-gray-600">{{ formatTime(employee.morningTimeIn) }}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="material-icons text-gray-500 text-lg">logout</span>
                        <div>
                            <p class="text-sm font-medium text-gray-700">Morning Sign Out</p>
                            <p class="text-sm text-gray-600">{{ formatTime(employee.morningTimeOut) }}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="material-icons text-gray-500 text-lg">login</span>
                        <div>
                            <p class="text-sm font-medium text-gray-700">Afternoon Sign In</p>
                            <p class="text-sm text-gray-600">{{ formatTime(employee.afternoonTimeIn) }}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="material-icons text-gray-500 text-lg">logout</span>
                        <div>
                            <p class="text-sm font-medium text-gray-700">Afternoon Sign Out</p>
                            <p class="text-sm text-gray-600">{{ formatTime(employee.afternoonTimeOut) }}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="material-icons text-gray-500 text-lg">timer</span>
                        <div>
                            <p class="text-sm font-medium text-gray-700">Worked Hours</p>
                            <p class="text-sm text-gray-600">{{ (employee.workedHours || 0).toFixed(2) }} hrs</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="material-icons text-gray-500 text-lg">info</span>
                        <div>
                            <p class="text-sm font-medium text-gray-700">Status</p>
                            <span class="inline-block px-2 py-1 text-xs font-medium rounded-full"
                                :class="getStatusClass(employee.status)">
                                {{ employee.status || 'Absent' }}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="material-icons text-gray-500 text-lg">calendar_today</span>
                        <div>
                            <p class="text-sm font-medium text-gray-700">Date</p>
                            <p class="text-sm text-gray-600">{{ formatDate(employee.createdAt) }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Modal>
</template>

<style scoped>
/* Custom animations for modal */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes fadeOut {
    from {
        opacity: 1;
        transform: scale(1);
    }

    to {
        opacity: 0;
        transform: scale(0.95);
    }
}

.scale-95 {
    animation: fadeOut 0.3s ease-in-out;
}

.scale-100 {
    animation: fadeIn 0.3s ease-in-out;
}
</style>
