import type { RouteRecordRaw } from 'vue-router';

const adminRoutes: Array<RouteRecordRaw> = [
    {
        path: '/admin/login',
        name: 'admin-login',
        component: () => import('../views/admins/auth/AdminLogin.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/admin',
        component: () => import('../layouts/AdminLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: 'dashboard',
                name: 'admin-dashboard',
                component: () => import('../views/admins/AdminDashboard.vue'),
                meta: { 
                    title: 'Admin Dashboard'
                }
            },
            {
                path: 'employee/attendance',
                name: 'admin-employee-attendance',
                component: () => import('../views/admins/attendance/EmployeeAttendance.vue'),
                meta: {
                    title: 'Employee Attendance'
                }
            },
            {
                path: 'employee/manage',
                name: 'admin-employee-manage',
                component: () => import('../views/admins/employees/ManageEmployees.vue'),
                meta: {
                    title: 'Manage Employee'
                }
            },
            {
                path: 'employee/salary-slips',
                name: 'admin-employee-salary-slips',
                component: () => import('../views/admins/payroll/SalarySlips.vue'),
                meta: {
                    title: 'Salary Slips'
                }
            },
            {
                path: 'employee/manage-pay-heads',
                name: 'admin-employee-manage-pay-heads',
                component: () => import('../views/admins/payroll/ManagePayHeadsView.vue'),
                meta: {
                    title: 'Manage Pay Heads'
                }
            },
            {
                path: 'employee/leave-management',
                name: 'admin-employee-leave-management',
                component: () => import('../views/admins/leaves/EmployeeLeaveManagement.vue'),
                meta: {
                    title: 'Leave Management'
                }
            },
            {
                path: 'employee/records',
                name: 'admin-employee-records',
                component: () => import('../views/admins/employees/EmployeeRecords.vue'),
                meta: {
                    title: 'Employee Records'
                }
            },
            {
                path: 'holiday-selection',
                name: 'admin-holiday-selection',
                component: () => import('../views/ListOfHolidays.vue'),
                meta: {
                    title: 'Holiday Selection'
                }
            },
            {
                path: 'settings',
                name: 'admin-settings',
                component: () => import('../views/admins/settings/AdminSettings.vue'),
                meta: {
                    title: 'Admin Settings'
                }
            },
            {
                path: 'trash',
                name: 'employee-trash',
                component: () => import('../views/admins/employees/Trash.vue'),
                meta: {
                    title: 'Trash'
                }
            }
        ],
    }
];

export default adminRoutes;
