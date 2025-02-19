import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import employeeRoutes from './employeeRoutes';
import adminRoutes from './adminRoutes';
import { useAuthStore } from '../stores/auth.store.ts';

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'landing-page',
        component: () => import('../views/LandingPage.vue'),
        meta: { requiresGuest: true }
    },
    ...employeeRoutes,
    ...adminRoutes
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior (to, from, savedPosition) {
        return savedPosition || { top: 0 };
    }
});

// ✅ Unified Navigation Guards
router.beforeEach((to, from) => {
    const auth = useAuthStore();

    // 🔐 Redirect unauthenticated users trying to access protected routes
    if (to.meta.requiresAuth) {
        if (to.path.startsWith('/employee') && !auth.employee) {
            return { name: 'employee-login', query: { redirect: to.fullPath } };
        }
        if (to.path.startsWith('/admin') && !auth.admin) {
            return { name: 'admin-login', query: { redirect: to.fullPath } };
        }
    }

    // 🚫 Redirect authenticated users trying to access guest routes
    if (to.meta.requiresGuest) {
        if (to.path.startsWith('/employee') && auth.employee) {
            return { name: 'employee-dashboard' };
        }
        if (to.path.startsWith('/admin') && auth.admin) {
            return { name: 'admin-dashboard' };
        }
    }
});

export default router;
