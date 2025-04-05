<script setup>
import Modal from '@/components/Modal.vue';
defineProps(['show', 'employee', 'positions']);
defineEmits(['close', 'update']);
</script>

<template>
    <Modal :show="show" @close="$emit('close')" max-width="4xl" max-height="85vh">
        <div class="p-4 border-b">
            <h2 class="text-lg font-semibold">Edit Employee - {{ employee.firstName }} {{ employee.lastName }}</h2>
        </div>
        <div class="p-4 space-y-4">
            <div>
                <h3 class="text-base font-semibold mb-2">Personal Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input v-model="employee.empNo" placeholder="Employee Number" required
                        class="p-1.5 border rounded-md" />
                    <input v-model="employee.firstName" placeholder="First Name" required
                        class="p-1.5 border rounded-md" />
                    <input v-model="employee.middleName" placeholder="Middle Name" class="p-1.5 border rounded-md" />
                    <input v-model="employee.lastName" placeholder="Last Name" required
                        class="p-1.5 border rounded-md" />
                    <input v-model="employee.email" type="email" placeholder="Email" required
                        class="p-1.5 border rounded-md" />
                    <input v-model="employee.contactInfo" placeholder="Contact Number" required pattern="\d{11}"
                        class="p-1.5 border rounded-md" />
                    <select v-model="employee.civilStatus" required class="p-1.5 border rounded-md">
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
                    <select v-model="employee.position" required class="p-1.5 border rounded-md">
                        <option v-for="pos in positions" :key="pos.name" :value="pos.name">{{ pos.name }}</option>
                    </select>
                    <input v-model="employee.hireDate" type="date" required class="p-1.5 border rounded-md" />
                    <input v-model="employee.sss" placeholder="SSS ID" pattern="\d{10}"
                        class="p-1.5 border rounded-md" />
                    <input v-model="employee.philhealth" placeholder="PhilHealth ID" pattern="\d{12}"
                        class="p-1.5 border rounded-md" />
                    <input v-model="employee.pagibig" placeholder="Pag-IBIG ID" pattern="\d{12}"
                        class="p-1.5 border rounded-md" />
                    <input v-model="employee.tin" placeholder="TIN" pattern="\d{9,12}"
                        class="p-1.5 border rounded-md" />
                </div>
            </div>
            <!-- Financial Information omitted for brevity -->
        </div>
        <div class="p-4 border-t bg-gray-50 flex justify-end gap-2">
            <button @click="$emit('update')" class="px-3 py-1.5 bg-yellow-600 text-white rounded-md">Update</button>
            <button @click="$emit('close')" class="px-3 py-1.5 border rounded-md">Cancel</button>
        </div>
    </Modal>
</template>