import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Employee {
    id: string,
    username: string,
    email: string,
}

export interface Admin {
    id: string,
    username: string,
    email: string,
}

export const useAuthStore = defineStore('auth', () => {
    const employee = ref<Employee | null>(JSON.parse(localStorage.getItem('employee') || 'null'));
    const admin = ref<Admin | null>(JSON.parse(localStorage.getItem('admin') || 'null'));
    const accessToken = ref<string | null>(localStorage.getItem('token'));

    function saveEmployee() {
        localStorage.setItem('employee', JSON.stringify(employee.value));
    }

    function saveAdmin() {
        localStorage.setItem('admin', JSON.stringify(admin.value));
    }

    function saveAccessToken() {
        localStorage.setItem('token', accessToken.value || '');
    }

    function setEmployee(newEmployee: Employee | null): void {
        employee.value = newEmployee;
        saveEmployee();
    }

    function setAdmin(newAdmin: Admin | null): void {
        admin.value = newAdmin;
        saveAdmin();
    }

    function setAccessToken(newToken: string | null): void {
        accessToken.value = newToken;
        saveAccessToken();
    }

    function logout() {
        employee.value = null;
        admin.value = null;
        accessToken.value = null;
        localStorage.removeItem('employee');
        localStorage.removeItem('admin');
        localStorage.removeItem('token');
    }

    return { employee, admin, accessToken, setEmployee, setAdmin, setAccessToken, logout }
});
