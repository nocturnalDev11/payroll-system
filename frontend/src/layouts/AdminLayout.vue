<script setup>
import { useRouter, useRoute } from 'vue-router';
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
const isLoadingAction = ref(false);

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
    isLoadingAction.value = true;
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
    } finally {
        isLoadingAction.value = false;
    }
};

const markAllAsRead = async () => {
    isLoadingAction.value = true;
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
    } finally {
        isLoadingAction.value = false;
    }
};

const deleteNotification = async (notificationId) => {
    isLoadingAction.value = true;
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
    } finally {
        isLoadingAction.value = false;
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

const getNotificationIcon = (type) => {
    return {
        'LeaveRequest': 'event_note',
        'LeaveApproval': 'check_circle',
        'LeaveDisapproval': 'cancel',
    }[type] || 'notifications';
};

const getNotificationColor = (type) => {
    return {
        'LeaveRequest': 'text-blue-500',
        'LeaveApproval': 'text-green-500',
        'LeaveDisapproval': 'text-red-500',
    }[type] || 'text-gray-500';
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
    pollingInterval = setInterval(fetchNotifications, 30000);
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
                        <transition name="dropdown">
                            <div v-if="isNotificationsOpen"
                                class="absolute right-0 sm:right-0 mt-3 w-96 sm:w-[28rem] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 max-h-[32rem] overflow-hidden flex flex-col">
                                <div
                                    class="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200 flex justify-between items-center z-10">
                                    <h3 class="text-sm font-semibold text-gray-800 tracking-tight">Notifications</h3>
                                    <button @click="markAllAsRead"
                                        class="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                                        :disabled="unreadCount === 0 || isLoadingAction"
                                        aria-label="Mark all notifications as read">
                                        <span v-if="isLoadingAction"
                                            class="inline-block h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                                        <span v-else>Mark all as read</span>
                                    </button>
                                </div>

                                <div class="flex-1 overflow-y-auto custom-scrollbar">
                                    <div v-if="notifications.length === 0" class="p-6 text-center">
                                        <div
                                            class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                            <span class="material-icons text-3xl text-gray-400">notifications_off</span>
                                        </div>
                                        <p class="text-sm font-medium text-gray-600">No notifications</p>
                                        <p class="text-xs text-gray-400 mt-1">You're all caught up!</p>
                                    </div>
                                    <div v-else class="divide-y divide-gray-100">
                                        <div v-for="notification in notifications" :key="notification._id"
                                            class="p-4 hover:bg-gray-50 transition-all duration-200 flex items-start gap-3 group"
                                            role="listitem" tabindex="0" @keydown.enter="markAsRead(notification._id)"
                                            aria-label="Notification">
                                            <div class="flex-shrink-0">
                                                <span
                                                    :class="['material-icons text-xl', getNotificationColor(notification.type)]">{{
                                                    getNotificationIcon(notification.type) }}</span>
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <p :class="['text-sm leading-tight', notification.status === 'Unread' ? 'font-semibold text-gray-900' : 'text-gray-600']"
                                                    :title="notification.message">
                                                    {{ notification.message }}
                                                </p>
                                                <p class="text-xs text-gray-400 mt-1">{{
                                                    formatDate(notification.createdAt) }}</p>
                                            </div>
                                            <div
                                                class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button v-if="notification.status === 'Unread'"
                                                    @click="markAsRead(notification._id)" title="Mark as read"
                                                    class="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors"
                                                    :disabled="isLoadingAction" aria-label="Mark notification as read">
                                                    <span
                                                        v-if="isLoadingAction && notification._id === notification._id"
                                                        class="inline-block h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                                                    <span v-else class="material-icons text-sm">done</span>
                                                </button>
                                                <button @click="deleteNotification(notification._id)"
                                                    title="Delete notification"
                                                    class="flex items-center text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors cursor-pointer"
                                                    :disabled="isLoadingAction" aria-label="Delete notification">
                                                    <span
                                                        v-if="isLoadingAction && notification._id === notification._id"
                                                        class="inline-block h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                                                    <span v-else class="material-icons text-sm">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    class="sticky bottom-0 p-4 flex justify-center items-center z-10 border-t border-gray-200">
                                    <router-link to="/admin/notifications"
                                        class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                        @click="isNotificationsOpen = false">View all notifications
                                    </router-link>
                                </div>
                            </div>
                        </transition>
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
            <aside
                :class="['fixed top-0 left-0 h-full bg-white shadow-sm border-r border-gray-100 overflow-y-auto transition-all duration-300 z-20', isSidebarMinimized ? 'w-16' : 'w-72']">
                <nav class="pt-24 pb-4 px-2">
                    <button @click="toggleSidebar" class="w-full flex justify-end px-2 mb-4 cursor-pointer"
                        title="Toggle Sidebar">
                        <span class="material-icons text-gray-600 hover:text-blue-700">{{ isSidebarMinimized ?
                            'chevron_right' : 'chevron_left' }}</span>
                    </button>
                    <div class="border-b border-gray-200 mb-4" :class="{ 'hidden': isSidebarMinimized }"></div>
                    <div class="space-y-1">
                        <router-link v-for="link in navigationLinks" :key="link.path" :to="link.path"
                            class="flex items-center px-3 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all group"
                            active-class="bg-blue-50 text-blue-700">
                            <span class="material-icons text-xl text-gray-400 group-hover:text-blue-600">{{
                                getLinkIcon(link.name) }}</span>
                            <span class="ml-3 text-sm font-medium" :class="{ 'hidden': isSidebarMinimized }">{{
                                link.name }}</span>
                        </router-link>
                    </div>
                    <div class="mt-6 pt-6 border-t border-gray-100">
                        <router-link :to="{ name: 'ListHolidays' }"
                            class="flex items-center px-3 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all group"
                            active-class="bg-blue-50">
                            <span class="material-icons text-xl text-gray-400 group-hover:text-blue-600">event</span>
                            <span class="ml-3 text-sm font-medium" :class="{ 'hidden': isSidebarMinimized }">Holiday
                                Selection</span>
                        </router-link>
                    </div>
                </nav>
            </aside>

            <main class="flex-1 overflow-auto bg-slate-50 px-6 py-4" :class="[isSidebarMinimized ? 'ml-16' : 'ml-72']">
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

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

/* Focus states for accessibility */
button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
</style>