<script setup>
import Modal from '@/components/Modal.vue';
defineProps(['show', 'request', 'positions']);
defineEmits(['close', 'save', 'approve', 'reject']);
</script>

<template>
    <Modal :show="show" @close="$emit('close')" max-width="4xl" max-height="85vh">
        <div class="p-4 border-b">
            <h2 class="text-lg font-semibold">Pending Request Details - {{ request.firstName }} {{ request.lastName }}
            </h2>
        </div>
        <div class="p-4 space-y-4">
            <div>
                <h3 class="text-base font-semibold mb-2">Personal Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input v-model="request.empNo" placeholder="Employee Number" required
                        class="p-1.5 border rounded-md" />
                    <input v-model="request.firstName" placeholder="First Name" required
                        class="p-1.5 border rounded-md" />
                    <input v-model="request.middleName" placeholder="Middle Name" class="p-1.5 border rounded-md" />
                    <input v-model="request.lastName" placeholder="Last Name" required
                        class="p-1.5 border rounded-md" />
                    <input v-model="request.email" type="email" placeholder="Email" required
                        class="p-1.5 border rounded-md" />
                    <input v-model="request.contactInfo" placeholder="Contact Number" required pattern="\d{11}"
                        class="p-1.5 border rounded-md" />
                    <select v-model="request.civilStatus" required class="p-1.5 border rounded-md">
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                    </select>
                </div>
            </div>
            <div>
                <h3 class="text-base font-semibold mb-2">Employment Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select v-model="request.position" required class="p-1.5 border rounded-md">
                        <option v-for="pos in positions" :key="pos.name" :value="pos.name">{{ pos.name }}</option>
                    </select>
                    <input v-model="request.hireDate" type="date" required class="p-1.5 border rounded-md" />
                    <input v-model="request.sss" placeholder="SSS ID" pattern="\d{10}"
                        class="p-1.5 border rounded-md" />
                    <input v-model="request.philhealth" placeholder="PhilHealth ID" pattern="\d{12}"
                        class="p-1.5 border rounded-md" />
                    <input v-model="request.pagibig" placeholder="Pag-IBIG ID" pattern="\d{12}"
                        class="p-1.5 border rounded-md" />
                    <input v-model="request.tin" placeholder="TIN" pattern="\d{9,12}" class="p-1.5 border rounded-md" />
                </div>
            </div>
            <!-- Financial Information and Net Salary Preview would need parent methods passed as props -->
        </div>
        <div class="p-4 border-t bg-gray-50 flex justify-end gap-2">
            <button @click="$emit('save')" class="px-3 py-1.5 bg-blue-600 text-white rounded-md">Save Changes</button>
            <button @click="$emit('approve', request)"
                class="px-3 py-1.5 bg-green-600 text-white rounded-md">Approve</button>
            <button @click="$emit('reject', request._id)"
                class="px-3 py-1.5 bg-red-600 text-white rounded-md">Reject</button>
            <button @click="$emit('close')" class="px-3 py-1.5 border rounded-md">Close</button>
        </div>
    </Modal>
</template>