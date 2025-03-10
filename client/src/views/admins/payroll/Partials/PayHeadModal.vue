<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white p-6 rounded-xl shadow-md max-w-md w-full">
            <h2 class="text-xl font-bold mb-4">{{ isUpdate ? 'Update' : 'Add' }} Pay Head</h2>
            <form @submit.prevent="savePayHead">
                <div class="mb-4">
                    <label for="payHeadName" class="block text-gray-700 mb-1 font-medium text-sm">Pay Head Name</label>
                    <input v-model="localPayHead.name" type="text" id="payHeadName"
                        class="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        required />
                </div>
                <div class="mb-4">
                    <label for="payHeadType" class="block text-gray-700 mb-1 font-medium text-sm">Type</label>
                    <select v-model="localPayHead.type" id="payHeadType"
                        class="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        required>
                        <option value="Earnings">Earnings</option>
                        <option value="Deductions">Deductions</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label for="payHeadAmount" class="block text-gray-700 mb-1 font-medium text-sm">Amount</label>
                    <input v-model.number="localPayHead.amount" type="number" id="payHeadAmount"
                        class="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        required />
                </div>
                <div class="flex justify-end gap-3">
                    <button type="button" @click="$emit('close')"
                        class="py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200">Cancel</button>
                    <button type="submit"
                        class="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200">{{
                            isUpdate ? 'Update' : 'Add' }} Pay Head</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';

// Define props
const props = defineProps({
    payHead: { type: Object, required: true },
    isUpdate: { type: Boolean, default: false }
});

// Define emits
const emit = defineEmits(['close', 'save']);

// Local reactive copy of payHead
const localPayHead = ref({ ...props.payHead });

// Watch for changes in the payHead prop and update localPayHead
watch(() => props.payHead, (newVal) => {
    localPayHead.value = { ...newVal };
}, { deep: true });

// Emit the save event with the updated localPayHead
function savePayHead() {
    emit('save', localPayHead.value);
}
</script>

<style scoped></style>