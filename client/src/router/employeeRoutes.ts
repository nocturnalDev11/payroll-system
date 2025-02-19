import type { RouteRecordRaw } from 'vue-router';

const employeeRoutes: Array<RouteRecordRaw> = [
    {
        path: '/employee/login',
        name: 'employee-login',
        component: () => import('../views/employees/auth/EmployeeLogin.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/employee/signup',
        name: 'employee-signup',
        component: () => import('../views/employees/auth/EmployeeSignup.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/employee/dashboard',
        name: 'employee-dashboard',
        component: () => import('../views/employees/EmployeeDashboard.vue'),
        meta: { requiresAuth: true }
    },
];

export default employeeRoutes;
