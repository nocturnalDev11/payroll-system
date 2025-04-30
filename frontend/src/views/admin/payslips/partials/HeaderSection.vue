<template>
    <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-lg p-6 mb-6">
        <div class="flex flex-col xl:flex-row sm:items-center sm:justify-between gap-3">
            <!-- Search Input -->
            <div class="relative w-full">
                <span
                    class="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">search</span>
                <input :value="searchQuery" @input="$emit('update:searchQuery', $event.target.value)" type="text"
                    placeholder="Search employees..."
                    class="w-full pl-10 pr-4 py-3 text-sm rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm placeholder-gray-400 outline-none" />
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-5 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-5 gap-2 w-full">
                <button @click="$emit('refresh-data')"
                    class="flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-700 text-blue-700 hover:text-white text-sm font-medium py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    :disabled="isLoading">
                    <span class="material-icons text-lg animate-spin" v-if="isLoading">sync</span>
                    <span class="material-icons text-lg" v-else>refresh</span>
                    <span class="hidden sm:inline">{{ isLoading ? 'Refreshing...' : 'Refresh' }}</span>
                </button>

                <button @click="$emit('generate-all-payslips')"
                    class="flex items-center justify-center gap-2 bg-green-200 hover:bg-green-700 text-green-700 hover:text-white text-sm font-medium py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    :disabled="isLoading || isGeneratingAll">
                    <span class="material-icons text-lg animate-spin" v-if="isGeneratingAll">sync</span>
                    <span class="material-icons text-lg" v-else>description</span>
                    <span class="hidden sm:inline">{{ isGeneratingAll ? 'Generating...' : 'Generate All' }}</span>
                </button>

                <button @click="$emit('show-print-modal')"
                    class="flex items-center justify-center gap-2 bg-purple-200 hover:bg-purple-700 text-purple-700 hover:text-white text-sm font-medium py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    :disabled="isLoading">
                    <span class="material-icons text-lg">print</span>
                    <span class="hidden sm:inline">Print All</span>
                </button>

                <button @click="$emit('show-update-position-modal')"
                    class="flex items-center justify-center gap-2 bg-orange-200 hover:bg-orange-600 text-orange-600 hover:text-white text-sm font-medium py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    :disabled="isLoading">
                    <span class="material-icons text-lg">edit</span>
                    <span class="hidden sm:inline">Update Position</span>
                </button>

                <button @click="$emit('open-deduction-modal')"
                    class="flex items-center justify-center gap-2 bg-teal-100 hover:bg-teal-700 text-teal-700 hover:text-white text-sm font-medium py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    :disabled="isLoading">
                    <span class="material-icons text-lg">money_off</span>
                    <span class="hidden sm:inline">Deduction</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'HeaderSection',
    props: {
        searchQuery: String,
        isLoading: Boolean,
        isGeneratingAll: Boolean,
    },
    emits: [
        'update:searchQuery',
        'refresh-data',
        'generate-all-payslips',
        'show-print-modal',
        'show-update-position-modal',
        'open-deduction-modal',
    ],
};
</script>

<style scoped>
button {
    white-space: nowrap;
}

/* Adjustments for smaller screens */
@media (max-width: 640px) {
    button span:not(.material-icons) {
        display: none;
    }

    button .material-icons {
        font-size: 1.5rem;
    }

    button {
        padding: 0.5rem;
    }
}

/* Adjustments for md viewport (768px to 1024px) */
@media (min-width: 640px) and (max-width: 1024px) {
    button {
        font-size: 0.875rem;
        padding: 0.75rem 1rem;
    }

    button .material-icons {
        font-size: 1.25rem;
    }
}
</style>