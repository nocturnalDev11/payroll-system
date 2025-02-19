import type { RouteRecordRaw } from 'vue-router';

const adminRoutes: Array<RouteRecordRaw> = [
    {
        path: '/admin/login',
        name: 'admin-login',
        component: () => import('../views/admins/auth/AdminLogin.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/admin/dashboard',
        name: 'admin-dashboard',
        component: () => import('../views/admins/AdminDashboard.vue'),
        meta: { requiresAuth: true }
    },
];

export default adminRoutes;
