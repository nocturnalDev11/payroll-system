import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const routes = [
    { 
        path: '/', 
        component: () => import('../views/LoginSelection.vue'),
        name: 'LoginSelection',
        meta: {
            title: 'Login Selection',
            requiresGuest: true,
        }
    },
    { 
        path: '/admin-login', 
        component: () => import('../views/admin/auth/AdminLogin.vue'),
        meta: {
            title: 'Admin Login',
            requiresGuest: true,
        }
    },
    { 
        path: '/employee-login', 
        component: () => import('../views/employees/auth/EmployeeLogin.vue'),
        meta: {
            title: 'Employee Login',
            requiresGuest: true,
        }
    },
    { 
        path: '/employee-register', 
        component: () => import('../views/employees/auth/EmployeeSignup.vue'),
        meta: {
            title: 'Employee Register',
            requiresGuest: true,
        }
    },
    {
        path: '/forgot-password',
        component: () => import('../views/employees/auth/ForgotPassword.vue'),
        name: 'ForgotPassword',
        meta: {
            title: 'Forgot Password',
        }
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('../views/NotFound.vue'),
        meta: {
            title: '404 | Not Found'
        }
    },

    // Admin Routes
    {
        path: '/admin',
        component: () => import('../layouts/AdminLayout.vue'),
        meta: { requiresAuth: true, role: 'admin' },
        children: [
            { 
                path: 'dashboard',
                name: 'AdminDashboard', 
                component: () => import('../views/admin/AdminDashboard.vue'),
                meta: {
                    title: 'Admin Dashboard',
                }
            },
            { 
                path: 'manage-positions', 
                name: 'ManagePositions',
                component: () => import('../views/admin/ManagePositions.vue'),
                meta: {
                    title: 'Manage Positions',
                }
            },
            { 
                path: 'employee-attendance', 
                name: 'EmployeeAttendance',
                component: () => import('../views/admin/EmployeeAttendance.vue'),
                meta: {
                    title: 'Employee Attendance',
                }
            },
            { 
                path: 'manage-employees', 
                name: 'ManageEmployees',
                component: () => import('../views/admin/ManageEmployees.vue'),
                meta: {
                    title: 'Manage Employees',
                }
            },
            { 
                path: 'salary-slips', 
                name: 'SalarySlips',
                component: () => import('../views/admin/SalarySlips.vue'),
                meta: {
                    title: 'Salary Slips',
                }
            },
            { 
                path: 'manage-pay-heads', 
                name: 'ManagePayHeads',
                component: () => import('../views/admin/ManagePayHeads.vue'),
                meta: {
                    title: 'Manage Pay Heads',
                }
            },
            { 
                path: 'month-selection', 
                name: 'MonthSelection',
                component: () => import('../views/admin/MonthSelection.vue'),
                meta: {
                    title: 'Month Selection',
                }
            },
            { 
                path: 'payroll-with-deductions', 
                name: 'PayrollWithDeductions',
                component: () => import('../views/admin/PayrollWithDeductions.vue'),
                meta: {
                    title: 'Payroll With Deductions',
                }
            },
            { 
                path: 'employee-leave-management', 
                name: 'AdminLeaveManagement',
                component: () => import('../views/admin/EmployeeLeaveManagement.vue'),
                meta: {
                    title: 'Employee Leave Management',
                }
            },
            { 
                path: 'list-holidays', 
                name: 'ListHolidays',
                component: () => import('../views/admin/ListHolidays.vue'),
                meta: {
                    title: 'List Holidays',
                }
            },
            { 
                path: 'employee-records', 
                name: 'EmployeeRecords',
                component: () => import('../views/admin/EmployeeRecords.vue'),
                meta: {
                    title: 'Employee Records',
                }
            },
            { 
                path: 'settings',
                name: 'AdminSettings', 
                component: () => import('../views/admin/auth/AdminSettings.vue'),
                meta: {
                    title: 'Admin Settings',
                }
            },
            {
                path: 'trash',
                name: 'Trash',
                component: () => import('../views/admin/Trash.vue'),
                meta: {
                    title: 'Trash',
                }
            }
        ],
    },

    // Employee Routes
    {
        path: '/employee',
        component: () => import('../layouts/EmployeeLayout.vue'),
        meta: { requiresAuth: true, role: 'employee' },
        children: [
            { 
                path: 'dashboard', 
                component: () => import('../views/employees/EmployeeDashboard.vue'),
                name: 'EmployeeDashboard',
                meta: {
                    title: 'Employee Dashboard',
                }
            },
            { 
                path: 'salary-slips', 
                component: () => import('../views/employees/EmployeeSalarySlips.vue'),
                name: 'EmployeeSalarySlips',
                meta: {
                    title: 'Employee Salary Slips',
                }
            },
            { 
                path: 'leave-management', 
                component: () => import('../views/employees/EmployeeLeaveRequest.vue'),
                name: 'EmployeeLeaveManagement',
                meta: {
                    title: 'Employee Leave Management',
                }
            },
            { 
                path: 'holidays', 
                name: 'EmployeeHolidays',
                component: () => import('../views/employees/EmployeeHolidays.vue'),
                meta: {
                    title: 'Employee Holidays',
                }
            },
            { 
                path: 'employee-leave-request', 
                name: 'EmployeeLeaveRequest', 
                component: () => import('../views/employees/EmployeeLeaveRequest.vue'),
                meta: {
                    title: 'Employee Leave Request',
                } 
            },
            { 
                path: 'settings/:id', 
                name: 'EmployeeSettings', 
                component: () => import('../views/employees/settings/EmployeeSettings.vue'),
                meta: {
                    title: 'Settings',
                } 
            },
        ],
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
        scrollBehavior (to, from, savedPosition) {
        return savedPosition || { top: 0 };
    }
});

// Navigation Guard
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const userRole = authStore.userRole;
    const isAuthenticated = authStore.isAuthenticated;

    document.title = to.meta.title ? `${to.meta.title} - Payroll` : 'Payroll';

    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!isAuthenticated) {
            next('/');
        } else if (to.meta.role && to.meta.role !== userRole) {
            next('/');
        } else {
            next();
        }
    } else if (from.matched.some(record => record.meta.requiresAuth) && to.path === '/') {
        next(userRole === 'admin' ? '/admin' : '/employee');
    } else {
        next();
    }
});

export default router;
