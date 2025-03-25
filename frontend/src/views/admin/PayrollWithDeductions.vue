<template>
    <div>
        <button class="back-button mb-4 py-2 px-4 bg-gray-800 text-white rounded" @click="goBack">Back</button>
        <h1 class="text-2xl font-bold mb-4">Payroll with Deductions</h1>
        <p class="text-gray-700">Process payroll with applicable deductions here.</p>
        <!-- Add your payroll with deductions content here -->
    </div>
</template>

<script>
export default {
    name: 'PayrollWithDeductions',
    methods: {
        goBack() {
            this.$router.go(-1);
        },
    },
};
</script>

<style scoped></style>