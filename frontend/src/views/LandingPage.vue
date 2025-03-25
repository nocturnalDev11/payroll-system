<template>
    <div
        class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div
            class="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row transform transition-all duration-500 ease-out animate-fadeIn">
            <!-- Left side - Content -->
            <div class="w-full lg:w-1/2 p-6 sm:p-8 lg:p-12 space-y-6 sm:space-y-8 relative z-10">
                <div class="text-center sm:text-left">
                    <h1 class="text-3xl sm:text-4xl font-light text-gray-800 mb-2 animate-slideInLeft">Welcome</h1>
                    <p class="text-sm sm:text-base text-gray-500">Please select your login type</p>
                </div>

                <div class="space-y-3 sm:space-y-4">
                    <router-link :to="{ name: 'admin-login' }" class="group block">
                        <div
                            class="p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-blue-500 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105 bg-white/90 backdrop-blur-sm">
                            <h2
                                class="text-base sm:text-lg font-medium text-gray-700 group-hover:text-blue-500 transition-colors duration-300">
                                Admin Portal</h2>
                            <p
                                class="text-xs sm:text-sm text-gray-500 mt-1 transition-opacity duration-300 group-hover:opacity-80">
                                Access administrative controls and management</p>
                        </div>
                    </router-link>

                    <router-link :to="{ name: 'employee-login' }" class="group block">
                        <div
                            class="p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-blue-500 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105 bg-white/90 backdrop-blur-sm">
                            <h2
                                class="text-base sm:text-lg font-medium text-gray-700 group-hover:text-blue-500 transition-colors duration-300">
                                Employee Portal</h2>
                            <p
                                class="text-xs sm:text-sm text-gray-500 mt-1 transition-opacity duration-300 group-hover:opacity-80">
                                View your payroll and personal information</p>
                        </div>
                    </router-link>
                </div>

                <div class="pt-6 sm:pt-8 text-center">
                    <p class="text-xs sm:text-sm text-gray-400 transition-opacity duration-300 hover:opacity-70">© 2025
                        Payroll System</p>
                </div>
            </div>

            <!-- Right side - Logo (Stationary, No Animations) -->
            <div class="hidden lg:block lg:w-1/2 bg-gray-50 p-6 sm:p-8 lg:p-12 relative z-10">
                <div class="flex items-center justify-center w-full h-full">
                    <img src="@/assets/pic1.png" alt="Right Job Solutions Logo" class="w-3/4 h-auto object-contain">
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>

</script>

<style scoped>
/* Animation Keyframes */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slideInLeft {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* Animation Classes */
.animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
}

.animate-slideInLeft {
    animation: slideInLeft 0.5s ease-out;
}

/* Custom Styles for Better UX */
.bg-white-90 {
    background-color: rgba(255, 255, 255, 0.9);
}

.border-gray-200:hover {
    border-color: #3b82f6;
}

.hover:shadow-lg {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.transition-all {
    transition-property: all;
    transition-duration: 300ms;
    transition-timing-function: ease-in-out;
}

.backdrop-blur-sm {
    backdrop-filter: blur(4px);
}

/* Ensure Logo is Stationary */
.hidden.lg:block img {
    position: relative;
    z-index: 10;
}

/* Responsive Adjustments */
@media (max-width: 1024px) {
    .lg:flex-row {
        flex-direction: column;
    }

    .lg:w-1-2 {
        width: 100%;
    }

    .hidden.lg:block {
        display: none;
    }

    .p-6.sm:p-8.lg:p-12 {
        padding: 1rem;
    }
}

@media (max-width: 640px) {
    .w-full.max-w-4xl {
        max-width: 90%;
    }

    .text-3xl.sm:text-4xl {
        font-size: 2rem;
    }

    .text-base.sm:text-lg {
        font-size: 1rem;
    }
}
</style>