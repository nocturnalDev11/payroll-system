<template>
    <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 class="text-base font-medium text-gray-800 mb-4 flex items-center gap-1">
                <span class="material-icons text-sm">edit</span>
                Update Employee Position
            </h2>
            <div class="mb-4">
                <label class="block text-sm text-gray-700 mb-1">Select Employee</label>
                <select v-model="selectedEmployeeForUpdate" class="w-full p-2 border rounded text-sm">
                    <option value="" disabled>Select an employee</option>
                    <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                        {{ emp.name }} ({{ getPositionName(emp.position) }})
                    </option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm text-gray-700 mb-1">New Position</label>
                <select v-model="newPosition" class="w-full p-2 border rounded text-sm">
                    <option value="" disabled>Select a position</option>
                    <option v-for="pos in positions" :key="pos.name" :value="pos.name">
                        {{ pos.name }} (₱{{ pos.salary.toLocaleString() }})
                    </option>
                </select>
            </div>
            <div class="flex justify-end gap-2">
                <button @click="$emit('close')"
                    class="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                <button @click="$emit('update-position')"
                    class="flex items-center gap-1 px-4 py-2 text-sm text-white bg-orange-500 rounded hover:bg-orange-600"
                    :disabled="!selectedEmployeeForUpdate || !newPosition || isLoading">
                    <span class="material-icons text-sm">save</span>
                    Update
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        show: Boolean,
        employees: Array,
        positions: Array,
        selectedEmployeeForUpdate: String,
        newPosition: String,
        isLoading: Boolean
    },
};
</script>