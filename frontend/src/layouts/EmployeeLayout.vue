<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store.js';
import { BASE_API_URL } from '@/utils/constants.js';
import Dropdown from '@/components/Dropdown.vue';
import DropdownLink from '@/components/DropdownLink.vue';

const router = useRouter();
const authStore = useAuthStore();
const employee = computed(() => authStore.employee);

onMounted(() => {
    if (!authStore.isAuthenticated) {
        router.push('/employee-login');
    }
});

const logout = () => {
    authStore.logout();
    router.push('/employee-login');
};

const settingsRoute = computed(() => {
    return employee.value?.id ? `/employee/settings/${employee.value.id}` : '/employee/login';
});

const navigationLinks = [
    { path: '/employee/dashboard', name: 'Dashboard' },
    { path: '/employee/salary-slips', name: 'Salary Slips' },
    { path: '/employee/employee-leave-request', name: 'Leave Management' },
    { path: '/employee/holidays', name: 'Holidays' },
];

const getLinkIcon = (name) => {
    return {
        'Dashboard': 'dashboard',
        'Salary Slips': 'receipt',
        'Leave Management': 'event_available',
        'Holidays': 'schedule',
    }[name] || 'widgets';
};

const handleImageError = () => {
    console.error('Failed to load profile picture:', employee.value?.profilePicture);
};
</script>

<template>
    <div v-if="authStore.isAuthenticated" class="min-h-screen flex flex-col bg-slate-50">
        <header
            class="sticky top-0 z-[1000] backdrop-blur-sm bg-gradient-to-r from-teal-600/95 to-lime-600/95 text-white shadow-lg">
            <div class="mx-auto px-2 sm:px-14 py-2 sm:py-3 flex justify-between items-center">
                <div class="flex items-center">
                    <div class="bg-white rounded-lg p-1 sm:p-2">
                        <img src="@/assets/pic1.png" alt="right-jobs-logo" class="h-10 sm:h-12 w-auto object-contain" />
                    </div>
                </div>

                <div class="flex items-center space-x-2 sm:space-x-4">
                    <Dropdown align="right" width="56">
                        <template #trigger>
                            <div
                                class="flex items-center bg-white/5 rounded-lg p-1 sm:p-2 hover:bg-white/10 transition-all cursor-pointer">
                                <div class="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center overflow-hidden">
                                    <img v-if="employee && employee.profilePicture"
                                        :src="`${BASE_API_URL}${employee.profilePicture}`" :alt="employee.firstName"
                                        class="h-full w-full object-cover rounded-full" @error="handleImageError">
                                    <div v-else
                                        class="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-teal-600 flex items-center justify-center">
                                        <span class="text-white font-semibold text-lg">
                                            {{ employee?.username?.[0]?.toUpperCase() || '?' }}
                                        </span>
                                    </div>
                                </div>
                                <div class="ml-2 sm:ml-3 hidden sm:block">
                                    <p class="text-xs sm:text-sm font-medium">{{ employee?.username }}</p>
                                    <p class="text-xs text-blue-100">{{ employee?.firstName }} {{ employee?.lastName }}
                                    </p>
                                </div>
                            </div>
                        </template>

                        <template #content>
                            <DropdownLink :href="settingsRoute">
                                Settings
                            </DropdownLink>
                            <DropdownLink :href="'/employee/login'" @click.prevent="logout" as="button">
                                Logout
                            </DropdownLink>
                        </template>
                    </Dropdown>

                    <button @click="logout"
                        class="flex items-center px-2 py-1 sm:px-4 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 active:scale-95 whitespace-nowrap">
                        <span class="material-icons text-sm">logout</span>
                        <span class="ml-1 sm:ml-2 text-xs sm:text-sm font-medium hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>
        </header>

        <div class="flex flex-1 overflow-hidden">
            <aside
                class="fixed top-[4rem] left-0 sm:w-72 w-[60px] h-[calc(100vh-4rem)] bg-white shadow-sm border-r border-gray-100 overflow-y-auto">
                <nav class="py-8 px-2 md:px-4">
                    <div class="space-y-1">
                        <router-link v-for="link in navigationLinks" :key="link.path" :to="link.path"
                            class="flex items-center px-3 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all group"
                            active-class="bg-blue-50 text-blue-700">
                            <span class="material-icons text-xl md:text-lg text-gray-400 group-hover:text-blue-600">
                                {{ getLinkIcon(link.name) }}
                            </span>
                            <span class="ml-3 text-sm font-medium sm:hidden xl:block lg:block md:block hidden">
                                {{ link.name }}
                            </span>
                        </router-link>
                    </div>
                </nav>
            </aside>

            <main class="flex-1 sm:ml-72 ml-12 overflow-auto bg-slate-50 px-6 py-4">
                <router-view v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </main>
        </div>
    </div>
    <div v-else class="min-h-screen flex items-center justify-center">
        <p class="text-gray-600">Redirecting to login...</p>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>