<script setup>
import { defineProps, defineEmits } from 'vue';
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

const formatTime = (time) => {
    if (!time || time === '00:00:00') return '--';
    const [hours, minutes] = time.split(':');
    const period = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const displayHours = parseInt(hours) % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
};

const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'on time':
        case 'present':
            return 'text-green-600';
        case 'late':
            return 'text-yellow-600';
        case 'absent':
            return 'text-red-600';
        case 'early departure':
            return 'text-orange-600';
        case 'half day':
            return 'text-blue-600';
        case 'incomplete':
            return 'text-purple-600';
        case 'leave':
            return 'text-gray-600';
        default:
            return 'text-gray-600';
    }
};
</script>

<template>
    <button @click="emit('open')" class="text-blue-600 hover:text-blue-800 transition cursor-pointer"
        title="View Details">
        <span class="material-icons">visibility</span>
    </button>

    <Modal :show="show" @close="emit('close')">
        <div class="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-900 flex items-center">
                <span class="material-icons mr-2">person</span> Employee Attendance Details
            </h2>
            <button @click="emit('close')" class="text-gray-400 hover:text-gray-800 cursor-pointer">
                <span class="material-icons">close</span>
            </button>
        </div>
        <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
                <img :src="`https://ui-avatars.com/api/?name=${employee.employeeId?.firstName?.charAt(0)}${employee.employeeId?.lastName?.charAt(0)}&background=random&color=fff`"
                    alt="Employee avatar" class="h-12 w-12 rounded-full object-cover border border-gray-200"
                    loading="lazy" />
                <div>
                    <p class="text-base font-medium text-gray-800">
                        {{ employee.employeeId?.firstName || '' }} {{ employee.employeeId?.lastName || '' }}
                    </p>
                    <p class="text-sm text-gray-600">{{ employee.employeeId?.position || 'N/A' }}</p>
                </div>
            </div>
            <p><strong>ID:</strong> {{ employee.employeeId?.empNo || 'N/A' }}</p>
            <p>
                <strong>Name:</strong> {{ employee.employeeId?.firstName || '' }} {{ employee.employeeId?.lastName || ''
                }}
            </p>
            <p><strong>Position:</strong> {{ employee.employeeId?.position || 'N/A' }}</p>
            <p><strong>Email:</strong> {{ employee.employeeId?.email || 'N/A' }}</p>
            <p><strong>Morning Sign In:</strong> {{ formatTime(employee.morningTimeIn) }}</p>
            <p><strong>Morning Sign Out:</strong> {{ formatTime(employee.morningTimeOut) }}</p>
            <p><strong>Afternoon Sign In:</strong> {{ formatTime(employee.afternoonTimeIn) }}</p>
            <p><strong>Afternoon Sign Out:</strong> {{ formatTime(employee.afternoonTimeOut) }}</p>
            <p><strong>Worked Hours:</strong> {{ (employee.workedHours || 0).toFixed(2) }} hrs</p>
            <p>
                <strong>Status:</strong>
                <span :class="getStatusClass(employee.status)">{{ employee.status || 'Absent' }}</span>
            </p>
        </div>
    </Modal>
</template>
