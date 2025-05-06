<script setup>
import { useRouter, useRoute } from 'vue-router';
import Dropdown from '@/components/Dropdown.vue';
import DropdownLink from '@/components/DropdownLink.vue';
import { useAuthStore } from '@/stores/auth.store.js';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { BASE_API_URL } from '@/utils/constants.js';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const navigationLinks = ref([
    { path: '/admin/dashboard', name: 'Dashboard' },
    { path: '/admin/employee-attendance', name: 'Employee Attendance' },
    { path: '/admin/manage-employees', name: 'Manage Employees' },
    { path: '/admin/salary-slips', name: 'Salary Slips' },
    { path: '/admin/manage-pay-heads', name: 'Manage Pay Heads' },
    { path: '/admin/employee-leave-management', name: 'Leave Management' },
    { path: '/admin/employee-records', name: 'Records' },
    { path: '/admin/archive', name: 'Archive' },
]);

const username = computed(() => authStore.admin?.username || 'Admin');
const adminInitial = computed(() => username.value.charAt(0).toUpperCase());

const logout = () => {
    authStore.logout();
    router.push('/admin-login');
};

const getLinkIcon = (name) => {
    return {
        'Dashboard': 'dashboard',
        'Employee Attendance': 'schedule',
        'Manage Employees': 'people',
        'Salary Slips': 'receipt',
        'Manage Pay Heads': 'attach_money',
        'Leave Management': 'event_available',
        'Records': 'folder',
        'Archive': 'archive'
    }[name] || 'widgets';
};

const isSidebarMinimized = ref(() => {
    const savedState = localStorage.getItem('sidebarMinimized');
    if (savedState !== null) {
        return savedState === 'true';
    }
    return window.innerWidth < 640;
});

const toggleSidebar = () => {
    isSidebarMinimized.value = !isSidebarMinimized.value;
    localStorage.setItem('sidebarMinimized', isSidebarMinimized.value);
};

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
                'user-id': authStore.admin?._id || '',
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
                'user-id': authStore.admin?._id || '',
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
                'user-id': authStore.admin?._id || '',
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
                'user-id': authStore.admin?._id || '',
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
    <div class="min-h-screen flex flex-col bg-slate-50 relative z-0">
        <header
            class="sticky top-0 z-30 backdrop-blur-sm bg-gradient-to-r from-blue-700/95 to-indigo-700/95 text-white shadow-lg">
            <div class="mx-auto px-2 sm:px-10 py-2 sm:py-3 flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <div class="bg-white rounded-lg p-1">
                        <img src="@/assets/pic1.png" alt="right-jobs-logo" class="h-10 sm:h-12 w-auto object-contain" />
                    </div>
                </div>
                <div class="flex items-center space-x-2 sm:space-x-4">
                    <router-link to="/admin/dashboard"
                        class="flex items-center rounded-lg p-1 sm:p-2 transition-all cursor-pointer">
                        <div
                            class="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center shadow-inner">
                            <span class="text-base sm:text-lg font-semibold">{{ adminInitial }}</span>
                        </div>
                        <div class="ml-2 sm:ml-3 hidden sm:block">
                            <p class="text-xs sm:text-sm font-medium">{{ username }}</p>
                            <p class="text-xs text-blue-100">Administrator</p>
                        </div>
                    </router-link>

                    <div class="relative">
                        <button @click="toggleNotifications" title="Notifications"
                            class="flex items-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 active:scale-95 cursor-pointer">
                            <span class="material-icons text-sm">notifications</span>
                            <span v-if="unreadCount"
                                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{{
                                unreadCount }}</span>
                        </button>
                        <div v-if="isNotificationsOpen"
                            class="absolute sm:right-0 right-3 mt-2 w-[25.5rem] bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
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
                                    class="p-4 border-b border-gray-100 hover:bg-gray-50 flex justify-between items-start cursor-default">
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
                                            class="text-blue-600 hover:text-blue-800">
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
                    <router-link to="/admin/settings" title="Settings"
                        class="flex items-center p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 active:scale-95 whitespace-nowrap">
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
            <aside :class="[
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
                    <div class="mt-6 pt-6 border-t border-gray-100">
                        <router-link :to="{ name: 'ListHolidays' }"
                            class="flex items-center px-3 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all group"
                            active-class="bg-blue-50">
                            <span class="material-icons text-xl text-gray-400 group-hover:text-blue-600">event</span>
                            <span class="ml-3 text-sm font-medium" :class="{ 'hidden': isSidebarMinimized }">
                                Holiday Selection
                            </span>
                        </router-link>
                    </div>
                </nav>
            </aside>

            <main class="flex-1 overflow-auto bg-slate-50 px-6 py-4" :class="[
                isSidebarMinimized ? 'ml-16' : 'ml-72'
            ]">
                <router-view v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </main>
        </div>
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