<template>
    <div class="flex min-h-screen bg-gray-50">
        <!-- Left side - Image -->
        <div class="hidden lg:flex lg:w-1/2">
            <img src="@/assets/pic.png" alt="Payroll System" class="object-cover w-3/4 h-3/4 mx-auto my-auto">
        </div>

        <!-- Right side - Login Options -->
        <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div class="max-w-md w-full">
                <div class="text-center mb-12">
                    <h1 class="text-4xl font-bold mb-2 text-gray-900">Payroll System</h1>
                    <p class="text-gray-600">Please select user type</p>
                </div>

                <div class="space-y-4">
                    <router-link 
                        to="/admin/login" 
                        class="block w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-4 rounded-lg font-medium hover:opacity-90 transition duration-300"
                    >
                        Admin Login
                    </router-link>

                    <router-link 
                        to="/employee/login" 
                        class="block w-full bg-gradient-to-r from-blue-400 to-blue-600 text-white text-center py-4 rounded-lg font-medium hover:opacity-90 transition duration-300"
                    >
                        Employee Login
                    </router-link>
                </div>

                <div class="mt-8 text-center text-sm text-gray-500">
                    <p>© 2025 Payroll System. All rights reserved.</p>
                </div>
            </div>
        </div>
    </div>
</template>