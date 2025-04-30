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

const emit = defineEmits(['close', 'open']);

// Format time function
const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
};

// Get earliest sign-in and latest sign-out
const getSignInTime = (record) => {
    return record.morningTimeIn || record.afternoonTimeIn || 'N/A';
};

const getSignOutTime = (record) => {
    return record.afternoonTimeOut || record.morningTimeOut || 'N/A';
};

// Status class function
const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'on time':
        case 'present':
            return 'text-green-600 font-medium';
        case 'late':
            return 'text-yellow-600 font-medium';
        case 'absent':
            return 'text-red-600 font-medium';
        case 'early departure':
            return 'text-orange-600 font-medium';
        case 'half day':
            return 'text-blue-600 font-medium';
        default:
            return 'text-gray-600';
    }
};

const openModal = () => {
    emit('open');
};
</script>

<template>
    <button @click="openModal" class="text-blue-600 hover:text-blue-800 transition cursor-pointer" title="View Details">
        <span class="material-icons">visibility</span>
    </button>

    <Modal :show="show" @close="emit('close')">
        <div class="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-900 flex items-center">
                <span class="material-icons mr-2">person</span> Employee Details
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
            <p>
                <strong>ID:</strong> {{ employee.employeeId?.empNo || 'N/A' }}
            </p>
            <p>
                <strong>Name:</strong> {{ employee.employeeId?.firstName || '' }} {{ employee.employeeId?.lastName || ''
                }}
            </p>
            <p><strong>Position:</strong> {{ employee.employeeId?.position || 'N/A' }}</p>
            <p><strong>Email:</strong> {{ employee.employeeId?.email || 'N/A' }}</p>
            <p><strong>Sign In Time:</strong> {{ formatTime(getSignInTime(employee)) }}</p>
            <p><strong>Sign Out Time:</strong> {{ formatTime(getSignOutTime(employee)) }}</p>
            <p>
                <strong>Status: </strong>
                <span :class="getStatusClass(employee.status)">{{ employee.status || 'Absent' }}</span>
            </p>
        </div>
    </Modal>
</template>