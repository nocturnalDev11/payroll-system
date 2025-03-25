<template>
    <div>
        <button class="back-button mb-4 py-2 px-4 bg-gray-800 text-white rounded" @click="goBack">Back</button>
        <h1 class="text-2xl font-bold mb-4">Month Selection for Salary</h1>
        <p class="text-gray-700">Select the month for which you want to process salaries.</p>

    </div>
</template>

<script>
export default {
    name: 'MonthSelection',
    methods: {
        goBack() {
            this.$router.go(-1);
        },
    },
};
</script>

<style scoped></style>