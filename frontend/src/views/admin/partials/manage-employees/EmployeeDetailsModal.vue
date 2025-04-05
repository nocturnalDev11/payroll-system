<script setup>
import Modal from '@/components/Modal.vue';
import { computed } from 'vue';

const props = defineProps({
    show: Boolean,
    employee: Object,
});

const emit = defineEmits(['close', 'edit']);

const sortedPositionHistory = computed(() => {
    if (!props.employee?.positionHistory || props.employee.positionHistory.length === 0) {
        return [{
            position: props.employee.position || 'N/A',
            salary: props.employee.salary || 0,
            startDate: props.employee.hireDate || new Date().toISOString().slice(0, 10),
            endDate: null,
        }];
    }
    return [...props.employee.positionHistory].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
});
</script>

<template>
    <Modal :show="show" @close="$emit('close')" max-width="4xl" max-height="85vh">
        <div class="flex flex-col h-full">
            <!-- Header -->
            <div
                class="p-4 border-b border-gray-300 flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
                <div>
                    <h2 class="text-xl font-bold text-gray-800">Employee Profile</h2>
                    <p class="text-xs text-gray-500 mt-0.5">Employee ID: {{ employee.empNo }}</p>
                </div>
                <button @click="$emit('close')" class="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <span class="material-icons">close</span>
                </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto max-h-[65vh] p-4 space-y-6">
                <!-- Profile Header -->
                <div class="flex items-center space-x-4 pb-4 border-b border-gray-300">
                    <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span class="material-icons text-3xl text-indigo-600">account_circle</span>
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900">
                            {{ employee.firstName }} {{ employee.middleName }} {{ employee.lastName }}
                        </h3>
                        <p class="text-base text-indigo-600 font-medium">{{ employee.position }}</p>
                        <p class="text-sm text-gray-500 mt-0.5">Joined {{ new
                            Date(employee.hireDate).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day:
                            'numeric' }) }}</p>
                    </div>
                </div>

                <!-- Grid Layout -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Personal Information Card -->
                    <div
                        class="bg-white rounded-lg shadow-sm border border-gray-300 p-4 hover:shadow-md transition-shadow">
                        <div class="flex items-center mb-3">
                            <span class="material-icons text-indigo-600 mr-1">person</span>
                            <h4 class="text-base font-semibold text-gray-800">Personal Information</h4>
                        </div>
                        <dl class="grid grid-cols-1 gap-2">
                            <div class="flex justify-between py-1 border-b border-gray-100">
                                <dt class="text-sm text-gray-500">Email</dt>
                                <dd class="text-sm text-gray-900 font-medium">{{ employee.email }}</dd>
                            </div>
                            <div class="flex justify-between py-1 border-b border-gray-100">
                                <dt class="text-sm text-gray-500">Contact</dt>
                                <dd class="text-sm text-gray-900 font-medium">{{ employee.contactInfo }}</dd>
                            </div>
                            <div class="flex justify-between py-1 border-b border-gray-100">
                                <dt class="text-sm text-gray-500">Civil Status</dt>
                                <dd class="text-sm text-gray-900 font-medium">{{ employee.civilStatus }}</dd>
                            </div>
                        </dl>
                    </div>

                    <!-- Financial Information Card -->
                    <div
                        class="bg-white rounded-lg shadow-sm border border-gray-300 p-4 hover:shadow-md transition-shadow">
                        <div class="flex items-center mb-3">
                            <span class="material-icons text-green-600 mr-1">payments</span>
                            <h4 class="text-base font-semibold text-gray-800">Financial Information</h4>
                        </div>
                        <dl class="space-y-3">
                            <div class="p-3 bg-green-50 rounded-md">
                                <dt class="text-xs text-green-600 mb-0.5">Net Salary</dt>
                                <dd class="text-xl font-bold text-green-700">₱{{
                                    $parent.calculateNetSalary(employee).toLocaleString() }}</dd>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="p-2 bg-gray-50 rounded-md">
                                    <dt class="text-xs text-gray-500 mb-0.5">Monthly Salary</dt>
                                    <dd class="text-base font-semibold text-gray-900">₱{{
                                        employee.salary?.toLocaleString() }}</dd>
                                </div>
                                <div class="p-2 bg-gray-50 rounded-md">
                                    <dt class="text-xs text-gray-500 mb-0.5">Hourly Rate</dt>
                                    <dd class="text-base font-semibold text-gray-900">₱{{
                                        employee.hourlyRate?.toLocaleString() }}</dd>
                                </div>
                            </div>
                        </dl>
                    </div>

                    <!-- Government IDs Card -->
                    <div
                        class="bg-white rounded-lg shadow-sm border border-gray-300 p-4 hover:shadow-md transition-shadow">
                        <div class="flex items-center mb-3">
                            <span class="material-icons text-blue-600 mr-1">badge</span>
                            <h4 class="text-base font-semibold text-gray-800">Government IDs</h4>
                        </div>
                        <dl class="grid grid-cols-1 gap-2">
                            <div class="flex justify-between py-1 border-b border-gray-100">
                                <dt class="text-sm text-gray-500">SSS</dt>
                                <dd class="text-sm text-gray-900 font-medium">{{ employee.sss }}</dd>
                            </div>
                            <div class="flex justify-between py-1 border-b border-gray-100">
                                <dt class="text-sm text-gray-500">PhilHealth</dt>
                                <dd class="text-sm text-gray-900 font-medium">{{ employee.philhealth }}</dd>
                            </div>
                            <div class="flex justify-between py-1 border-b border-gray-100">
                                <dt class="text-sm text-gray-500">Pag-IBIG</dt>
                                <dd class="text-sm text-gray-900 font-medium">{{ employee.pagibig }}</dd>
                            </div>
                            <div class="flex justify-between py-1 border-b border-gray-100">
                                <dt class="text-sm text-gray-500">TIN</dt>
                                <dd class="text-sm text-gray-900 font-medium">{{ employee.tin }}</dd>
                            </div>
                        </dl>
                    </div>

                    <!-- Position History Card -->
                    <div class="bg-white rounded-lg shadow-sm border-gray-300 p-4 hover:shadow-md transition-shadow">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center">
                                <span class="material-icons text-purple-600 mr-1">history</span>
                                <h4 class="text-base font-semibold text-gray-800">Position History</h4>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <div v-for="(history, index) in sortedPositionHistory" :key="index" class="p-3 rounded-md"
                                :class="!history.endDate ? 'bg-purple-50 border border-purple-100' : 'bg-gray-50'">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <p class="font-medium text-sm text-gray-900">{{ history.position }}</p>
                                        <p class="text-xs text-gray-500">₱{{ history.salary.toLocaleString() }}/month
                                        </p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-xs text-gray-500">{{ new
                                            Date(history.startDate).toLocaleDateString() }}</p>
                                        <p class="text-xs"
                                            :class="history.endDate ? 'text-gray-500' : 'text-purple-600 font-medium'">
                                            {{ history.endDate ? new Date(history.endDate).toLocaleDateString() :
                                            'Current' }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-gray-300 bg-gray-50 flex justify-end gap-2 sticky bottom-0">
                <button @click="$emit('edit', employee)"
                    class="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1">
                    <span class="material-icons">edit</span>
                    Edit Profile
                </button>
                <button @click="$emit('close')"
                    class="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
                    Close
                </button>
            </div>
        </div>
    </Modal>
</template>

<style scoped>
.material-icons {
    font-size: 18px;
}

.transition {
    transition: all 0.2s ease-in-out;
}
</style>