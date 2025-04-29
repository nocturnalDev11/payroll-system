<script>
export default {
    props: {
        paginatedEmployees: Array,
        isLoading: Boolean,
        currentPage: Number,
        totalPages: Number,
        positions: Array
    },
    emits: ['show-payslip-history', 'prev-page', 'next-page'],
    methods: {
        getPositionName(positionName) {
            const position = this.positions.find(p => p.name.trim().toLowerCase() === positionName?.trim().toLowerCase());
            return position ? position.name : positionName || 'Unknown Position';
        },
        getPositionSalary(positionName) {
            const position = this.positions.find(p => p.name.trim().toLowerCase() === positionName?.trim().toLowerCase());
            return position ? position.salary : 0;
        },
        getHourlyRate(positionName) {
            const salary = this.getPositionSalary(positionName);
            return Number((salary / (8 * 22)).toFixed(2));
        }
    }
};
</script>

<template>
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 mb-4">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                            <div class="flex items-center gap-1">
                                <span class="material-icons text-gray-400 text-sm">person</span>
                                Name
                            </div>
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                            <div class="flex items-center gap-1">
                                <span class="material-icons text-gray-400 text-sm">badge</span>
                                Employee ID
                            </div>
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                            <div class="flex items-center gap-1">
                                <span class="material-icons text-gray-400 text-sm">work</span>
                                Position
                            </div>
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                            <div class="flex items-center gap-1">
                                <span class="material-icons text-gray-400 text-sm">payments</span>
                                Hourly Rate
                            </div>
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                            <div class="flex items-center gap-1">
                                <span class="material-icons text-gray-400 text-sm">account_balance_wallet</span>
                                Basic Salary
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="employee in paginatedEmployees" :key="employee.id"
                        class="hover:bg-blue-50 transition-colors cursor-pointer"
                        @click="$emit('show-payslip-history', employee)">
                        <td class="px-4 py-3 text-sm text-gray-900">{{ employee.name }}</td>
                        <td class="px-4 py-3 text-sm text-gray-500">{{ employee.empNo }}</td>
                        <td class="px-4 py-3 text-sm text-gray-500">{{ getPositionName(employee.position) }}</td>
                        <td class="px-4 py-3 text-sm text-gray-900">₱{{
                            getHourlyRate(employee.position).toLocaleString() }}</td>
                        <td class="px-4 py-3 text-sm text-blue-600">₱{{
                            getPositionSalary(employee.position).toLocaleString() }}</td>
                    </tr>
                    <tr v-if="paginatedEmployees.length === 0 && !isLoading">
                        <td colspan="5" class="px-4 py-8 text-center">
                            <div class="flex flex-col items-center gap-2">
                                <span class="material-icons text-gray-400 text-3xl">search_off</span>
                                <p class="text-sm text-gray-500">No employees found.</p>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="isLoading">
                        <td colspan="5" class="px-4 py-8 text-center">
                            <div class="flex flex-col items-center gap-2">
                                <span class="material-icons text-blue-500 animate-spin text-3xl">sync</span>
                                <p class="text-sm text-gray-500">Loading employees...</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="flex items-center justify-between px-4 py-3 bg-gray-50">
            <div class="text-xs text-gray-700">Showing page {{ currentPage }} of {{ totalPages }}</div>
            <div class="flex gap-2">
                <button @click="$emit('prev-page')" :disabled="currentPage === 1 || isLoading"
                    class="inline-flex items-center px-3 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                    <span class="material-icons text-sm mr-1">chevron_left</span>
                    Previous
                </button>
                <button @click="$emit('next-page')" :disabled="currentPage === totalPages || isLoading"
                    class="inline-flex items-center px-3 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                    Next
                    <span class="material-icons text-sm ml-1">chevron_right</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.transition-colors {
    transition: background-color 0.2s ease-in-out;
}

.hover\:bg-blue-50:hover {
    background-color: #eff6ff;
}

.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>