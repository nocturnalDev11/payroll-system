<script setup>
import { useAuthStore } from '@/stores/auth.store.js';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { BASE_API_URL } from '@/utils/constants.js';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const notifications = ref([]);
const unreadCount = computed(() => notifications.value.filter(n => n.status === 'Unread').length);
const isLoadingAction = ref(false);
const isLoading = ref(false);

const fetchNotifications = async () => {
    try {
        isLoading.value = true;
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
    } finally {
        isLoading.value = false;
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

let pollingInterval = null;
onMounted(() => {
    if (!authStore.isAdmin) {
        router.push('/admin/login');
        return;
    }
    fetchNotifications();
    pollingInterval = setInterval(fetchNotifications, 30000);
});

onUnmounted(() => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});
</script>

<template>
    <div class="min-h-screen bg-slate-50 p-6">
        <div class="w-full mx-auto">
            <header class="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span class="material-icons text-blue-600">notifications</span>
                        Notifications
                    </h1>
                    <button @click="markAllAsRead"
                        class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                        :disabled="unreadCount === 0 || isLoadingAction" aria-label="Mark all notifications as read">
                        <span v-if="isLoadingAction"
                            class="inline-block h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></span>
                        Mark all as read
                    </button>
                </div>
                <p class="text-sm text-gray-500 mt-2">You have {{ unreadCount }} unread {{ unreadCount === 1 ?
                    'notification' : 'notifications' }}</p>
            </header>

            <div class="bg-white rounded-xl shadow-lg border border-gray-100">
                <div v-if="isLoading" class="p-10 flex justify-center items-center">
                    <div class="flex flex-col items-center">
                        <div
                            class="loader ease-linear rounded-full border-4 border-t-4 border-blue-200 h-12 w-12 mb-4 animate-spin">
                        </div>
                        <h3 class="text-lg font-medium text-gray-600">Loading...</h3>
                    </div>
                </div>

                <div v-else-if="notifications.length === 0" class="p-12 text-center">
                    <div class="rounded-full bg-blue-100 p-4 mb-4 inline-flex">
                        <span class="material-icons text-blue-600 text-3xl">notifications_off</span>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900">No Notifications</h3>
                    <p class="mt-2 text-gray-500 max-w-md mx-auto text-sm">You're all caught up!</p>
                </div>

                <div v-else class="divide-y divide-gray-100">
                    <div v-for="notification in notifications" :key="notification._id"
                        class="p-6 hover:bg-gray-50 transition-all duration-200 flex items-start gap-4 group"
                        role="listitem" tabindex="0" @keydown.enter="markAsRead(notification._id)"
                        aria-label="Notification">
                        <div class="flex-shrink-0">
                            <span :class="['material-icons text-2xl', getNotificationColor(notification.type)]">{{
                                getNotificationIcon(notification.type) }}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p :class="['text-sm leading-tight', notification.status === 'Unread' ? 'font-semibold text-gray-900' : 'text-gray-600']"
                                :title="notification.message">{{ notification.message }}</p>
                            <p class="text-xs text-gray-400 mt-1">{{ formatDate(notification.createdAt) }}</p>
                        </div>
                        <div class="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button v-if="notification.status === 'Unread'" @click="markAsRead(notification._id)"
                                title="Mark as read"
                                class="flex items-center text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
                                :disabled="isLoadingAction" aria-label="Mark notification as read">
                                <span v-if="isLoadingAction"
                                    class="inline-block h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                                <span v-else class="material-icons text-sm">done</span>
                            </button>
                            <button @click="deleteNotification(notification._id)" title="Delete notification"
                                class="flex items-center text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors cursor-pointer"
                                :disabled="isLoadingAction" aria-label="Delete notification">
                                <span v-if="isLoadingAction"
                                    class="inline-block h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                                <span v-else class="material-icons text-sm">delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Loader animation */
.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Custom scrollbar */
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

/* Focus states for accessibility */
button:focus-visible,
div[tabindex="0"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}
</style>