<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-1">
        <div class="max-w-6xl mx-auto">


            <!-- Form to Add New Position -->
            <div class="bg-white p-4 rounded-xl shadow-md mb-8">
                <form @submit.prevent="addPosition" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div class="col-span-1">
                        <label for="positionName" class="block text-gray-700 mb-1 font-medium text-sm">Position
                            Name</label>
                        <input v-model="newPosition.name" type="text" id="positionName"
                            class="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                            required>
                    </div>
                    <div class="col-span-1">
                        <label for="positionSalary" class="block text-gray-700 mb-1 font-medium text-sm">Salary</label>
                        <input v-model="newPosition.salary" type="number" id="positionSalary"
                            class="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                            required>
                    </div>
                    <div class="col-span-1 flex items-end">
                        <button type="submit"
                            class="w-auto bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm">
                            Submit
                        </button>
                    </div>
                </form>
            </div>

            <!-- Table to Display Positions -->
            <div class="bg-white p-5 rounded-xl shadow-md">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Position Name</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Salary</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="position in positions" :key="position.id">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ position.name }}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">P {{
                                position.salary.toLocaleString() }} / month</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button @click="removePosition(position.id)"
                                    class="bg-red-50 text-red-600 font-semibold py-1.5 px-3 rounded-lg hover:bg-red-100 transition-all duration-200 flex items-center gap-2 text-xs">
                                    <span class="material-icons">delete</span>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            positions: [],
            newPosition: {
                name: '',
                salary: ''
            }
        };
    },
    methods: {
        addPosition() {
            if (this.newPosition.name && this.newPosition.salary) {
                this.positions.push({
                    id: Date.now(),
                    name: this.newPosition.name,
                    salary: this.newPosition.salary
                });
                this.newPosition.name = '';
                this.newPosition.salary = '';
            }
        },
        removePosition(id) {
            this.positions = this.positions.filter(position => position.id !== id);
        }
    }
};
</script>

<style scoped>
</style>
