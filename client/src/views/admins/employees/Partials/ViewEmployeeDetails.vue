<script setup>
import { ref } from 'vue';
import Modal from '@/components/Modal.vue';

defineProps(['employee']);
const showViewModal = ref(false);

const closeViewModal = () => {
    showViewModal.value = false;
};

const calculateNetSalary = (employee) => {
    const salary = employee.salary || 0;
    const deductions = (employee.deductions?.sss || 0) +
        (employee.deductions?.philHealth || 0) +
        (employee.deductions?.pagIbig || 0);
    const earnings = (employee.earnings?.travelExpenses || 0) +
        (employee.earnings?.otherEarnings || 0);
    return salary - deductions + earnings;
};
</script>

<template>
    <button @click="showViewModal = true" class="text-blue-600 hover:text-blue-800 transition duration-200">
        <span class="material-icons-outlined">info</span>
    </button>

    <Modal :show="showViewModal" @close="closeViewModal">
        <div class="p-6 border-b-gray-500 border-b flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-800">Employee Details</h2>
            <button @click="showViewModal = false" class="text-gray-500 hover:text-gray-700">
                <span class="material-icons-outlined">close</span>
            </button>
        </div>

        <div class="p-6">
            <div class="grid grid-cols-2 gap-6">
                <!-- Basic Information -->
                <div class="col-span-2">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <p class="text-sm font-medium text-gray-500">Full Name</p>
                            <p class="text-base text-gray-900">
                                {{ employee.firstName }} {{ employee.lastName }}
                            </p>
                        </div>
                        <div class="space-y-2">
                            <p class="text-sm font-medium text-gray-500">Position</p>
                            <p class="text-base text-gray-900">{{ employee.position }}</p>
                        </div>
                        <div class="space-y-2">
                            <p class="text-sm font-medium text-gray-500">Email</p>
                            <p class="text-base text-gray-900">{{ employee.email }}</p>
                        </div>
                        <div class="space-y-2">
                            <p class="text-sm font-medium text-gray-500">Contact Info</p>
                            <p class="text-base text-gray-900">{{ employee.contactInfo }}</p>
                        </div>
                    </div>
                </div>

                <!-- Financial Information -->
                <div class="col-span-2">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Financial Information</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <p class="text-sm font-medium text-gray-500">Base Salary</p>
                            <p class="text-base text-gray-900">₱{{ employee.salary.toLocaleString() }}</p>
                        </div>
                        <div class="space-y-2">
                            <p class="text-sm font-medium text-gray-500">Monthly Deductions</p>
                            <div class="space-y-1">
                                <p class="text-sm text-gray-900">SSS: ₱{{ employee.deductions?.sss || 0 }}</p>
                                <p class="text-sm text-gray-900">PhilHealth: ₱{{ employee.deductions?.philHealth ||
                                    0 }}</p>
                                <p class="text-sm text-gray-900">Pag-IBIG: ₱{{ employee.deductions?.pagIbig || 0 }}
                                </p>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <p class="text-sm font-medium text-gray-500">Additional Earnings</p>
                            <div class="space-y-1">
                                <p class="text-sm text-gray-900">Travel: ₱{{ employee.earnings?.travelExpenses || 0
                                    }}</p>
                                <p class="text-sm text-gray-900">Other: ₱{{ employee.earnings?.otherEarnings || 0 }}
                                </p>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <p class="text-sm font-medium text-gray-500">Net Salary</p>
                            <p class="text-base font-semibold text-gray-900">₱{{
                                calculateNetSalary(employee).toLocaleString() }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="p-6 border-t bg-gray-50">
            <div class="flex justify-end gap-3">
                <button
                    class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition duration-200">
                    Edit Details
                </button>
                <button @click="showViewModal = false"
                    class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200">
                    Close
                </button>
            </div>
        </div>
    </Modal>
</template>