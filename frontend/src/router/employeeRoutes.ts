import type { RouteRecordRaw } from 'vue-router';

const employeeRoutes: Array<RouteRecordRaw> = [
    {
        path: '/employee/login',
        name: 'employee-login',
        component: () => import('../views/employees/auth/EmployeeLogin.vue'),
        meta: {
            requiresGuest: true,
            title: 'Employee Login'
        }
    },
    {
        path: '/employee/signup',
        name: 'employee-signup',
        component: () => import('../views/employees/auth/EmployeeSignup.vue'),
        meta: {
            requiresGuest: true,
            title: 'Employee Signup'
        }
    },
    {
        path: '/employee',
        component: () => import('../layouts/EmployeeLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: 'dashboard',
                name: 'employee-dashboard',
                component: () => import('../views/employees/EmployeeDashboard.vue'),
                meta: {
                    title: 'Employee Dashboard'
                }
            },
            {
                path: 'attendance',
                name: 'employee-attendance',
                component: () => import('../views/employees/attendance/EmployeeAttendance.vue'),
                meta: {
                    title: 'Attendance'
                }
            },
            {
                path: 'leave/request',
                name: 'employee-leave-request',
                component: () => import('../views/employees/leaves/EmployeeLeaveRequest.vue'),
                meta: {
                    title: 'Leave Request'
                }
            },
            {
                path: 'salary-slips',
                name: 'salary-slips',
                component: () => import('../views/employees/EmployeeSalarySlip.vue'),
                meta: {
                    title: 'Salary slips'
                }
            },
            {
                path: 'holidays',
                name: 'list-of-holidays',
                component: () => import('../views/ListOfHolidays.vue'),
                meta: {
                    title: 'Holiday Selection'
                }
            },
            {
                path: 'settings/:id',
                name: 'employee-settings',
                component: () => import('../views/employees/settings/EmployeeSettings.vue'),
                props: true,
                meta: {
                    title: 'Employee Settings'
                }
            },
        ],
    }
];

export default employeeRoutes;
