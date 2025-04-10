<script>
export default {
    props: {
        employees: {
            type: Array,
            required: true,
            default: () => [],
        },
    },
};
</script>

<template>
    <div class="bg-white p-5 rounded-xl shadow-md">
        <h2 class="text-xl font-bold mb-4">Employee Payroll Information</h2>
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name of
                        Employee</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total
                        Deduction</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total
                        Earnings</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total
                        Salary</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions
                    </th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="employee in employees" :key="employee.id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ employee.id }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ employee.name }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ employee.position }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">P {{
                        employee.totalDeduction.toLocaleString() }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">P {{
                        employee.totalEarnings.toLocaleString() }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">P {{
                        employee.totalSalary.toLocaleString() }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                        <button @click="$emit('addPayhead', employee)"
                            class="bg-blue-50 text-blue-600 font-semibold py-1.5 px-3 rounded-lg hover:bg-blue-100 transition-all duration-200 flex items-center gap-2 text-xs">Add
                            Payhead</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>