import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth.store.js'

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'home',
        component: () => import('../views/Home.vue'),
    },
    {
        path: '/admin/login',
        name: 'admin-login',
        component: () => import('../views/admins/auth/Login.vue'),
            meta: {
            requiresGuest: true
        }
    },
    {
        path: '/employee/login',
        name: 'employee-login',
        component: () => import('../views/employees/auth/Login.vue'),
            meta: {
            requiresGuest: true
        }
    },
    {
        path: '/employee/signup',
        name: 'employee-signup',
        component: () => import('../views/employees/auth/Signup.vue'),
            meta: {
            requiresGuest: true
        }
    },
    {
        path: '/employee/dashboard',
        name: 'employee-dashboard',
        component: () => import('../views/employees/EmployeeDashboard.vue'),
            meta: {
            requiresAuth: true
        }
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('../views/NotFound.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior (to, from, savedPosition) {
        return savedPosition || { top: 0 };
    }
});

router.beforeEach((to, from) => {
    const auth = useAuthStore();

    // Redirect to login if authentication is required and user is not logged in
    if (to.meta.requiresAuth && !auth.user) {
        if (to.name.startsWith('employee')) {
            return {
                name: 'employee-login',
                query: { redirect: to.fullPath }
            };
        } else {
            return {
                name: 'admin-login',
                query: { redirect: to.fullPath }
            };
        }
    }

    if (to.meta.requiresGuest && auth.user) {
        return { name: 'home' };
    }
});

export default router;