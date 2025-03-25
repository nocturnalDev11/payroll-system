import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import employeeRoutes from './employeeRoutes.ts';
import adminRoutes from './adminRoutes.ts';
import { useAuthStore } from '@/stores/auth.store.ts';

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'landing-page',
        component: () => import('../views/LandingPage.vue'),
        meta: {
            requiresGuest: true,
            title: 'Landing page'
        }
    },
    ...employeeRoutes,
    ...adminRoutes,
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('../views/NotFound.vue'),
        meta: {
            title: '404 | Not Found'
        }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior (to, from, savedPosition) {
        return savedPosition || { top: 0 };
    }
});

router.beforeEach((to, from) => {
    const auth = useAuthStore();
    document.title = to.meta.title ? `${to.meta.title} - Payroll` : 'Payroll';

    if (to.meta.requiresAuth) {
        if (to.path.startsWith('/employee') && !auth.employee) {
            return { name: 'employee-login', query: { redirect: to.fullPath } };
        }
        if (to.path.startsWith('/admin') && !auth.admin) {
            return { name: 'admin-login', query: { redirect: to.fullPath } };
        }
    }

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
