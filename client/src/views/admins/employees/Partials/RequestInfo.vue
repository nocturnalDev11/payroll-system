<script setup>
import Modal from '@/components/Modal.vue';

// Define props and emits
const props = defineProps({
    request: Object,
    isEditing: Boolean,
    show: Boolean,
    positions: Array,
});
const emit = defineEmits(['close', 'save']);

// Net salary calculation
const calculateRequestNetSalary = (request) => {
    const salary = request.salary || 0;
    const deductions = (request.deductions?.sss || 0) +
        (request.deductions?.philHealth || 0) +
        (request.deductions?.pagIbig || 0);
    const earnings = (request.earnings?.travelExpenses || 0) +
        (request.earnings?.otherEarnings || 0);
    return salary - deductions + earnings;
};
</script>

<template>
    <!-- Use the Modal component as the wrapper -->
    <Modal :show="show" @close="emit('close')">
        <!-- Header -->
        <div class="p-6 border-b">
            <h2 class="text-2xl font-bold text-gray-800">Application Details</h2>
        </div>
        <!-- Body -->
        <div class="p-6">
            <!-- Basic Information -->
            <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                <div class="grid grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <p class="text-sm font-medium text-gray-700">Full Name</p>
                        <input v-if="isEditing" v-model="request.name"
                            class="w-full p-2 border border-gray-200 rounded-lg" required />
                        <p v-else class="text-lg text-gray-900">{{ request.name }}</p>
                    </div>
                    <div class="space-y-2">
                        <p class="text-sm font-medium text-gray-700">Position Applied</p>
                        <select v-if="isEditing" v-model="request.positionApplied"
                            class="w-full p-2 border border-gray-200 rounded-lg" required>
                            <option v-for="position in positions" :key="position" :value="position">
                                {{ position }}
                            </option>
                        </select>
                        <p v-else class="text-lg text-gray-900">{{ request.positionApplied }}</p>
                    </div>
                    <div class="space-y-2">
                        <p class="text-sm font-medium text-gray-700">Email</p>
                        <input v-if="isEditing" v-model="request.email" type="email"
                            class="w-full p-2 border border-gray-200 rounded-lg" required />
                        <p v-else class="text-lg text-gray-900">{{ request.email }}</p>
                    </div>
                    <div class="space-y-2">
                        <p class="text-sm font-medium text-gray-700">Contact Number</p>
                        <input v-if="isEditing" v-model="request.contactNumber"
                            class="w-full p-2 border border-gray-200 rounded-lg" required />
                        <p v-else class="text-lg text-gray-900">{{ request.contactNumber }}</p>
                    </div>
                </div>
            </div>

            <!-- Financial Information -->
            <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Financial Information</h3>
                <div class="grid grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <p class="text-sm font-medium text-gray-700">Proposed Salary</p>
                        <input v-if="isEditing" v-model.number="request.salary" type="number"
                            class="w-full p-2 border border-gray-200 rounded-lg" required min="0" />
                        <p v-else class="text-lg text-gray-900">₱{{ request.salary.toLocaleString() }}</p>
                    </div>
                    <!-- Deductions -->
                    <div class="space-y-4">
                        <p class="text-sm font-medium text-gray-700">Monthly Deductions</p>
                        <div class="space-y-2">
                            <label class="text-sm text-gray-600">SSS</label>
                            <input v-if="isEditing" v-model.number="request.deductions.sss" type="number"
                                class="w-full p-2 border border-gray-200 rounded-lg" min="0" />
                            <p v-else class="text-sm text-gray-900">₱{{ request.deductions?.sss || 0 }}</p>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm text-gray-600">PhilHealth</label>
                            <input v-if="isEditing" v-model.number="request.deductions.philHealth" type="number"
                                class="w-full p-2 border border-gray-200 rounded-lg" min="0" />
                            <p v-else class="text-sm text-gray-900">₱{{ request.deductions?.philHealth || 0 }}</p>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm text-gray-600">Pag-IBIG</label>
                            <input v-if="isEditing" v-model.number="request.deductions.pagIbig" type="number"
                                class="w-full p-2 border border-gray-200 rounded-lg" min="0" />
                            <p v-else class="text-sm text-gray-900">₱{{ request.deductions?.pagIbig || 0 }}</p>
                        </div>
                    </div>
                    <!-- Earnings -->
                    <div class="space-y-4">
                        <p class="text-sm font-medium text-gray-700">Additional Earnings</p>
                        <div class="space-y-2">
                            <label class="text-sm text-gray-600">Travel Expenses</label>
                            <input v-if="isEditing" v-model.number="request.earnings.travelExpenses" type="number"
                                class="w-full p-2 border border-gray-200 rounded-lg" min="0" />
                            <p v-else class="text-sm text-gray-900">₱{{ request.earnings?.travelExpenses || 0 }}</p>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm text-gray-600">Other Earnings</label>
                            <input v-if="isEditing" v-model.number="request.earnings.otherEarnings" type="number"
                                class="w-full p-2 border border-gray-200 rounded-lg" min="0" />
                            <p v-else class="text-sm text-gray-900">₱{{ request.earnings?.otherEarnings || 0 }}</p>
                        </div>
                    </div>
                </div>
                <!-- Net Salary Preview -->
                <div v-if="isEditing" class="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-700">Net Salary Preview:</span>
                        <span class="text-lg font-semibold text-gray-900">₱{{
                            calculateRequestNetSalary(request).toLocaleString() }}</span>
                    </div>
                </div>
            </div>

            <!-- Buttons -->
            <div class="mt-6 flex justify-end gap-3">
                <button v-if="isEditing" @click="emit('save')"
                    class="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200">
                    Save
                </button>
                <button v-else @click="isEditing = true"
                    class="px-6 py-2.5 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition duration-200">
                    Edit
                </button>
                <button @click="emit('close')"
                    class="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition duration-200">
                    Close
                </button>
            </div>
        </div>
    </Modal>
</template>