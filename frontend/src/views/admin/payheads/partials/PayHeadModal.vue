<template>
    <div class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div class="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold text-gray-800">{{ title }}</h2>
                <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700" title="Close Modal">
                    <span class="material-icons-outlined">close</span>
                </button>
            </div>

            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Name</label>
                    <input v-model="localPayHead.name" type="text" placeholder="Enter payhead name"
                        class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Amount</label>
                    <input v-model.number="localPayHead.amount" type="number" placeholder="Enter amount" min="0"
                        class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Type</label>
                    <select v-model="localPayHead.type"
                        class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="Earnings">Earnings</option>
                        <option value="Deductions">Deductions</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Description</label>
                    <textarea v-model="localPayHead.description" placeholder="Enter description"
                        class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                </div>
                <div class="flex items-center space-x-8">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Recurring</label>
                        <input v-model="localPayHead.isRecurring" type="checkbox"
                            class="h-4 w-4 text-blue-600 border focus:ring-blue-500 border-gray-300 rounded" />
                    </div>
                    <div v-if="localPayHead.type === 'Deductions'">
                        <label class="block text-sm font-medium text-gray-700">Affected by Attendance</label>
                        <input v-model="localPayHead.isAttendanceAffected" type="checkbox"
                            class="h-4 w-4 text-blue-600 border focus:ring-blue-500 border-gray-300 rounded" />
                    </div>
                </div>
            </div>

            <div class="mt-6 flex justify-end gap-4">
                <button @click="$emit('save', localPayHead)"
                    class="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 flex items-center gap-1"
                    :disabled="!localPayHead.name || localPayHead.amount == null">
                    <span class="material-icons text-base">save</span>{{ isUpdate ? 'Update' : 'Save' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PayHeadModal',
    props: {
        payHead: {
            type: Object,
            required: true,
        },
        title: {
            type: String,
            default: 'Add New Pay Head',
        },
        isUpdate: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            localPayHead: {
                id: this.payHead.id || '',
                name: this.payHead.name || '',
                amount: this.payHead.amount || 0,
                type: this.payHead.type || 'Earnings',
                description: this.payHead.description || '',
                isRecurring: this.payHead.isRecurring || false,
                isAttendanceAffected: this.payHead.isAttendanceAffected || false,
            },
        };
    },
    watch: {
        payHead: {
            handler(newVal) {
                this.localPayHead = {
                    id: newVal.id || '',
                    name: newVal.name || '',
                    amount: newVal.amount || 0,
                    type: newVal.type || 'Earnings',
                    description: newVal.description || '',
                    isRecurring: newVal.isRecurring || false,
                    isAttendanceAffected: newVal.isAttendanceAffected || false,
                };
            },
            deep: true,
        },
    },
};
</script>

<style scoped></style>