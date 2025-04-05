<script setup>
import Modal from '@/components/Modal.vue';
defineProps(['show', 'positions', 'newPosition']);
defineEmits(['close', 'create', 'edit', 'delete']);
</script>

<template>
    <Modal :show="show" @close="$emit('close')" max-width="3xl" max-height="80vh">
        <div class="p-4 border-b">
            <h2 class="text-lg font-semibold">Manage Positions</h2>
        </div>
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-4">
                <h3 class="text-base font-semibold">Create Position</h3>
                <input v-model="newPosition.name" placeholder="Position Name" required
                    class="p-1.5 border rounded-md" />
                <input v-model.number="newPosition.salary" type="number" placeholder="Monthly Salary" required min="0"
                    class="p-1.5 border rounded-md" />
                <button @click="$emit('create')"
                    class="w-full px-3 py-1.5 bg-blue-600 text-white rounded-md">Create</button>
            </div>
            <div class="space-y-4">
                <h3 class="text-base font-semibold">Available Positions</h3>
                <div v-if="!positions.length" class="text-gray-500">No positions</div>
                <div v-else class="space-y-2 max-h-[50vh] overflow-y-auto">
                    <div v-for="pos in positions" :key="pos.id" class="p-3 bg-gray-50 rounded-md flex justify-between">
                        <div>
                            <p class="font-medium">{{ pos.name }}</p>
                            <p class="text-xs">₱{{ pos.salary.toLocaleString() }}</p>
                        </div>
                        <div class="flex gap-1">
                            <button @click="$emit('edit', pos)" class="text-yellow-600 p-1"><span
                                    class="material-icons">edit</span></button>
                            <button @click="$emit('delete', pos)" class="text-red-600 p-1"><span
                                    class="material-icons">delete</span></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="p-4 border-t bg-gray-50 flex justify-end">
            <button @click="$emit('close')" class="px-3 py-1.5 border rounded-md">Close</button>
        </div>
    </Modal>
</template>