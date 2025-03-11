import { defineStore } from 'pinia';
import { ref } from 'vue';
import { BASE_API_URL } from '../utils/constants.ts';

export interface Employee {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    username: string;
    email: string;
    employeeIdNumber: string;
    birthday?: Date | null;
    hireDate: string | null;
    contactInfo: string | null;
    civilStatus: string | null;
    position: string | null;
    sss: string | null;
    philHealth: string | null;
    pagIbig: string | null;
    role: string;
    salary?: number;
    profilePicture?: string;
}

export interface Admin {
    id: string;
    username: string;
    email: string;
}

export const useAuthStore = defineStore('auth', () => {
    // Initialize with null as default if no user exists in localStorage
    const admin = ref<Admin | null>(JSON.parse(localStorage.getItem('admin') || 'null'));
    const employee = ref<Employee | null>(JSON.parse(localStorage.getItem('employee') || 'null'));
    const accessToken = ref<string | null>(localStorage.getItem('token') || null);

    async function fetchEmployeeDetails(id: string): Promise<void> {
        try {
            const response = await fetch(`${BASE_API_URL}/api/employees/${id}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken.value}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch employee details');
            const employeeData = await response.json();
            console.log('Fetched employee data:', employeeData);
            employee.value = { ...employee.value, ...employeeData };
            console.log('Updated employee value:', employee.value);
            saveEmployee();
        } catch (error) {
            console.error('Error fetching employee details:', error);
            throw error;
        }
    }

    function saveAdmin() {
        console.log('Saving admin:', admin.value);
        localStorage.setItem('admin', JSON.stringify(admin.value));
    }

    function saveEmployee() {
        if (employee.value) {
            localStorage.setItem('employee', JSON.stringify(employee.value));
        }
    }

    function saveAccessToken() {
        if (accessToken.value) {
            localStorage.setItem('token', accessToken.value);
        }
    }

    function setAdmin(newAdmin: Admin | null): void {
        admin.value = newAdmin;
        saveAdmin();
    }

    function setEmployee(newEmployee: Employee | null): void {
        employee.value = newEmployee;
        saveEmployee();
    }

    function setAccessToken(newToken: string | null): void {
        console.log(`access token ${newToken}`);
        accessToken.value = newToken;
        saveAccessToken();
    }

    function logout(): void {
        admin.value = null;
        employee.value = null;
        accessToken.value = null;
        localStorage.removeItem('admin');
        localStorage.removeItem('employee');
        localStorage.removeItem('token');
    }

    return { 
        admin,
        employee, 
        accessToken, 
        setEmployee, 
        setAccessToken, 
        logout, 
        fetchEmployeeDetails,
        setAdmin,
        saveAdmin,
        saveEmployee,
        saveAccessToken
    }
});