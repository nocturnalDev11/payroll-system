import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { BASE_API_URL } from '@/utils/constants.js';

export const useAuthStore = defineStore('auth', () => {
    function safeParse(value) {
        if (value === 'undefined' || value === undefined || value === null) {
            return null;
        }
        try {
            return JSON.parse(value);
        } catch (e) {
            console.error('Failed to parse localStorage value:', e);
            return null;
        }
    }

    async function fetchEmployeeDetails(_id) {
        try {
            const headers = {
                'Authorization': `Bearer ${accessToken.value}`,
                'Content-Type': 'application/json',
                'user-role': userRole.value || 'employee',
            };
            if (admin.value?._id) headers['user-id'] = admin.value._id.toString();
            else if (employee.value?._id) headers['user-id'] = employee.value._id.toString();

            const response = await fetch(`${BASE_API_URL}/api/employees/${_id}`, { headers });
            if (!response.ok) throw new Error(`Failed to fetch employee details: ${response.status} - ${await response.text()}`);
            const employeeData = await response.json();
            employee.value = { ...employee.value, ...employeeData };
            saveEmployee(employee.value);
        } catch (error) {
            console.error('Error fetching employee details:', error);
            throw error;
        }
    }

    async function fetchAdminDetails(id) {
        try {
            const headers = {
                'Authorization': `Bearer ${accessToken.value}`,
                'Content-Type': 'application/json',
                'user-role': userRole.value || 'admin',
            };

            // Use _id consistently
            if (admin.value && admin.value._id) {
                headers['user-id'] = admin.value._id.toString();
            } else if (employee.value && employee.value._id) {
                headers['user-id'] = employee.value._id.toString();
            }

            const response = await fetch(`${BASE_API_URL}/api/admin/${id}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch admin details');
            const adminData = await response.json();
            console.log('Fetched admin data:', adminData);
            admin.value = { ...admin.value, ...adminData };
            console.log('Updated admin value:', admin.value);
            saveAdmin(admin.value);
        } catch (error) {
            console.error('Error fetching admin details:', error);
            throw error;
        }
    }

    // State
    const admin = ref(safeParse(localStorage.getItem('admin')));
    const employee = ref(safeParse(localStorage.getItem('employee')));
    const accessToken = ref(localStorage.getItem('token') || null);

    // Restore session immediately on store initialization
    restoreSession();

    // Restore session from localStorage
    function restoreSession() {
        const storedAdmin = safeParse(localStorage.getItem('admin'));
        const storedEmployee = safeParse(localStorage.getItem('employee'));
        const storedToken = localStorage.getItem('token') || null;

        admin.value = storedAdmin;
        employee.value = storedEmployee;
        accessToken.value = storedToken;

        console.log('Session restored:', { 
            admin: admin.value, 
            employee: employee.value, 
            token: accessToken.value 
        });

        if (!storedToken || (!storedAdmin && !storedEmployee)) {
            console.warn('No valid session found in localStorage');
        }
    }

    // Save state to localStorage
    function saveAdmin(newAdmin) {
        admin.value = newAdmin;
        localStorage.setItem('admin', JSON.stringify(admin.value));
        console.log('Admin saved:', admin.value);
    }

    function saveEmployee(newEmployee) {
        employee.value = newEmployee;
        localStorage.setItem('employee', JSON.stringify(employee.value));
        console.log('Employee saved:', employee.value);
    }

    function saveAccessToken(newToken) {
        accessToken.value = newToken;
        localStorage.setItem('token', newToken);
        console.log('Access token saved:', accessToken.value);
    }

    // Setters
    function setAdmin(newAdmin) {
        console.log('Setting admin:', newAdmin);
        saveAdmin(newAdmin);
        employee.value = null;
        localStorage.removeItem('employee');
    }

    function setEmployee(newEmployee) {
        saveEmployee(newEmployee);
        admin.value = null;
        localStorage.removeItem('admin');
    }

    function setAccessToken(newToken) {
        saveAccessToken(newToken);
    }

    // Logout
    function logout() {
        admin.value = null;
        employee.value = null;
        accessToken.value = null;
        localStorage.removeItem('admin');
        localStorage.removeItem('employee');
        localStorage.removeItem('token');
        console.log('Logged out');
    }

    // Computed properties
    const isAuthenticated = computed(() => !!accessToken.value && (!!admin.value || !!employee.value));
    const userRole = computed(() => {
        if (admin.value) return 'admin';
        if (employee.value) return 'employee';
        return null;
    });

    const isAdmin = computed(() => userRole.value === 'admin');

    return {
        admin,
        employee,
        accessToken,
        setAdmin,
        setEmployee,
        setAccessToken,
        logout,
        restoreSession,
        isAuthenticated,
        userRole,
        isAdmin,
        saveAdmin,
        saveEmployee,
        saveAccessToken,
        fetchAdminDetails,
        fetchEmployeeDetails,
    };
});