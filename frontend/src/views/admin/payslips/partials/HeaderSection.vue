<script>
export default {
    props: {
        searchQuery: String,
        isLoading: Boolean,
        isGeneratingAll: Boolean
    },
    emits: ['update:searchQuery', 'refresh-data', 'generate-all-payslips', 'show-print-modal', 'show-update-position-modal']
};
</script>

<template>
    <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div class="relative">
                <span class="material-icons absolute left-2 top-2 text-gray-400 text-sm">search</span>
                <input v-model="searchQuery" type="text" placeholder="Search employee by name..."
                    class="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
            </div>
            <button @click="$emit('refresh-data')"
                class="flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded-md"
                :disabled="isLoading">
                <span class="material-icons text-sm">{{ isLoading ? 'sync' : 'refresh' }}</span>
                {{ isLoading ? 'Refreshing...' : 'Refresh Data' }}
            </button>
            <button @click="$emit('generate-all-payslips')"
                class="flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-4 rounded-md"
                :disabled="isLoading || isGeneratingAll">
                <span class="material-icons text-sm">{{ isGeneratingAll ? 'sync' : 'description' }}</span>
                {{ isGeneratingAll ? 'Generating...' : 'Generate All' }}
            </button>
            <button @click="$emit('show-print-modal')"
                class="flex items-center justify-center gap-1 bg-purple-500 hover:bg-purple-600 text-white text-sm py-2 px-4 rounded-md"
                :disabled="isLoading">
                <span class="material-icons text-sm">print</span>
                Print All
            </button>
            <button @click="$emit('show-update-position-modal')"
                class="flex items-center justify-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 px-4 rounded-md"
                :disabled="isLoading">
                <span class="material-icons text-sm">edit</span>
                Update Position
            </button>
        </div>
    </div>
</template>