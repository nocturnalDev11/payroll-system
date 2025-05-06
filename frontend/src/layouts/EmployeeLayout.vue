<script setup>
import { computed, onMounted, ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store.js';
import { BASE_API_URL } from '@/utils/constants.js';

const router = useRouter();
const authStore = useAuthStore();
const employee = computed(() => authStore.employee);
const imageLoadFailed = ref(false);

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
    return employee.value?._id ? `/employee/settings/${employee.value._id}` : '/employee/login';
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

const handleImageError = async () => {
    console.error('Failed to load profile picture:', employee.value?.profilePicture);
    imageLoadFailed.value = true;
    try {
        await authStore.fetchEmployeeDetails(employee.value._id);
        imageLoadFailed.value = !employee.value?.profilePicture;
    } catch (err) {
        console.error('Failed to refetch employee data:', err);
    }
};

const toggleSidebar = () => {
    isSidebarMinimized.value = !isSidebarMinimized.value;
    localStorage.setItem('sidebarMinimized', isSidebarMinimized.value);
};

const isSidebarMinimized = ref(() => {
    const savedState = localStorage.getItem('sidebarMinimized');
    if (savedState !== null) {
        return savedState === 'true';
    }
    return window.innerWidth < 640;
});

const notifications = ref([]);
const unreadCount = computed(() => notifications.value.filter(n => n.status === 'Unread').length);
const isNotificationsOpen = ref(false);

const fetchNotifications = async () => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/notifications`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
                'user-role': authStore.userRole,
                'user-id': authStore.employee?._id || '',
            },
        });
        if (!response.ok) throw new Error(await response.text());
        notifications.value = await response.json();
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
};

const markAsRead = async (notificationId) => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
                'user-role': authStore.userRole,
                'user-id': authStore.employee?._id || '',
            },
        });
        if (!response.ok) throw new Error(await response.text());
        const updatedNotification = await response.json();
        const index = notifications.value.findIndex(n => n._id === notificationId);
        if (index !== -1) {
            notifications.value[index] = updatedNotification;
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

const markAllAsRead = async () => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/notifications/read-all`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
                'user-role': authStore.userRole,
                'user-id': authStore.employee?._id || '',
            },
        });
        if (!response.ok) throw new Error(await response.text());
        notifications.value = notifications.value.map(n => ({ ...n, status: 'Read' }));
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
};

const deleteNotification = async (notificationId) => {
    try {
        const response = await fetch(`${BASE_API_URL}/api/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
                'user-role': authStore.userRole,
                'user-id': authStore.employee?._id || '',
            },
        });
        if (!response.ok) throw new Error(await response.text());
        notifications.value = notifications.value.filter(n => n._id !== notificationId);
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
};

const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const toggleNotifications = () => {
    isNotificationsOpen.value = !isNotificationsOpen.value;
    if (isNotificationsOpen.value) {
        fetchNotifications();
    }
};

let pollingInterval = null;
onMounted(() => {
    fetchNotifications();
    pollingInterval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    const savedState = localStorage.getItem('sidebarMinimized');
    if (savedState !== null) {
        isSidebarMinimized.value = savedState === 'true';
    } else {
        isSidebarMinimized.value = window.innerWidth < 640;
        localStorage.setItem('sidebarMinimized', isSidebarMinimized.value);
    }
});

onUnmounted(() => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});
</script>

<template>
    <div v-if="authStore.isAuthenticated" class="min-h-screen flex flex-col bg-slate-50">
        <header
            class="sticky top-0 z-[1000] backdrop-blur-sm bg-gradient-to-r from-teal-600/95 to-lime-600/95 text-white shadow-lg">
            <div class="mx-auto px-2 sm:px-14 py-2 sm:py-3 flex justify-between items-center">
                <router-link to="/employee/dashboard" class="flex items-center">
                    <div class="bg-white rounded-lg p-1 sm:p-2">
                        <img src="@/assets/pic1.png" alt="right-jobs-logo" class="h-10 sm:h-12 w-auto object-contain" />
                    </div>
                </router-link>

                <div class="flex items-center space-x-2 sm:space-x-4">
                    <router-link to="/employee/dashboard"
                        class="flex items-center rounded-lg p-1 sm:p-2 hover:bg-white/10 transition-all cursor-pointer">
                        <div class="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center overflow-hidden">
                            <img v-if="employee && employee.profilePicture && !imageLoadFailed"
                                :src="employee.profilePicture" :alt="employee.firstName"
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
                    </router-link>

                    <div class="relative">
                        <button @click="toggleNotifications" title="Notifications"
                            class="flex items-center p-2 rounded-lg hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 active:scale-95 cursor-pointer">
                            <span class="material-icons text-sm">notifications</span>
                            <span v-if="unreadCount"
                                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{{
                                    unreadCount }}</span>
                        </button>
                        <div v-if="isNotificationsOpen"
                            class="absolute right-0 mt-2 w-[25.5rem] bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                            <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 class="text-sm font-semibold text-gray-800">Notifications</h3>
                                <button @click="markAllAsRead" class="text-xs text-blue-600 hover:underline"
                                    :disabled="unreadCount === 0">Mark all as read</button>
                            </div>
                            <div v-if="notifications.length === 0" class="p-4 text-center text-gray-500 text-sm">
                                No notifications
                            </div>
                            <div v-else>
                                <div v-for="notification in notifications" :key="notification._id"
                                    class="p-4 border-b border-gray-100 hover:bg-gray-50 flex justify-between items-start">
                                    <div>
                                        <p
                                            :class="['text-sm', notification.status === 'Unread' ? 'font-semibold text-gray-800' : 'text-gray-600']">
                                            {{ notification.message }}
                                        </p>
                                        <p class="text-xs text-gray-500">{{ formatDate(notification.createdAt) }}</p>
                                    </div>
                                    <div class="flex space-x-2">
                                        <button v-if="notification.status === 'Unread'"
                                            @click="markAsRead(notification._id)" title="Mark as read"
                                            class="text-blue-600 hover:text-blue-800 cursor-pointer">
                                            <span class="material-icons text-sm">done</span>
                                        </button>
                                        <button @click="deleteNotification(notification._id)" title="Delete"
                                            class="text-red-600 hover:text-red-800 cursor-pointer">
                                            <span class="material-icons text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <router-link :to="settingsRoute" title="Settings"
                        class="hidden sm:flex sm:items-center p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 active:scale-95 whitespace-nowrap hover:bg-white/10">
                        <span class="material-icons text-sm">settings</span>
                    </router-link>
                    <button @click="logout" title="Logout"
                        class="flex items-center px-2 py-1 sm:px-4 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 active:scale-95 whitespace-nowrap cursor-pointer">
                        <span class="material-icons text-sm">logout</span>
                        <span class="ml-1 sm:ml-2 text-xs sm:text-sm font-medium hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>
        </header>

        <div class="flex flex-1 overflow-hidden">
            <aside class="hidden sm:block" :class="[
                'fixed top-0 left-0 h-full bg-white shadow-sm border-r border-gray-100 overflow-y-auto transition-all duration-300 z-20',
                isSidebarMinimized ? 'w-16' : 'w-72'
            ]">
                <nav class="pt-24 pb-4 px-2">
                    <button @click="toggleSidebar" class="w-full flex justify-end px-2 mb-4 cursor-pointer"
                        title="Toggle Sidebar">
                        <span class="material-icons text-gray-600 hover:text-blue-700">
                            {{ isSidebarMinimized ? 'chevron_right' : 'chevron_left' }}
                        </span>
                    </button>
                    <div class="border-b border-gray-200 mb-4" :class="{ 'hidden': isSidebarMinimized }"></div>
                    <div class="space-y-1">
                        <router-link v-for="link in navigationLinks" :key="link.path" :to="link.path"
                            class="flex items-center px-3 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all group"
                            active-class="bg-blue-50 text-blue-700">
                            <span class="material-icons text-xl text-gray-400 group-hover:text-blue-600">
                                {{ getLinkIcon(link.name) }}
                            </span>
                            <span class="ml-3 text-sm font-medium" :class="{ 'hidden': isSidebarMinimized }">
                                {{ link.name }}
                            </span>
                        </router-link>
                    </div>
                </nav>
            </aside>

            <main class="flex-1 overflow-auto bg-slate-50 px-6 py-4" :class="[
                isSidebarMinimized ? 'sm:ml-16 ml-0' : 'sm:ml-72 ml-0'
            ]">
                <router-view v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </main>

            <div
                class="fixed sm:hidden block z-50 w-full h-16 max-w-md -translate-x-1/2 backdrop-blur-lg bg-gray-100/50 border border-gray-200 rounded-full bottom-4 left-1/2">
                <div class="grid h-full max-w-lg grid-cols-5 mx-auto">
                    <router-link to="/employee/salary-slips"
                        class="inline-flex flex-col items-center justify-center px-5 rounded-s-full hover:bg-gray-50 group cursor-pointer">
                        <span class="material-icons mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600">
                            receipt
                        </span>
                        <span class="sr-only">salary-slips</span>
                    </router-link>
                    <router-link to="/employee/employee-leave-request"
                        class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 group cursor-pointer">
                        <span class="material-icons mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600">
                            event_available
                        </span>
                        <span class="sr-only">employee-leave-request</span>
                    </router-link>
                    <router-link to="/employee/dashboard"
                        class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 group cursor-pointer">
                        <span
                            class="material-icons mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 cursor-pointer">dashboard</span>
                        <span class="sr-only">employee-dashboard</span>
                    </router-link>
                    <router-link :to="settingsRoute"
                        class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 group cursor-pointer">
                        <span
                            class="material-icons mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 cursor-pointer">settings</span>
                        <span class="sr-only">Settings</span>
                    </router-link>
                    <router-link to="/employee/holidays"
                        class="inline-flex flex-col items-center justify-center px-5 rounded-e-full hover:bg-gray-50 group cursor-pointer">
                        <span class="material-icons mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600">
                            schedule
                        </span>
                        <span class="sr-only">Holiday</span>
                    </router-link>
                </div>
            </div>
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