import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Employee {
    id: string,
    username: string,
    email: string,
}

export const useAuthStore = defineStore('auth', () => {
    const employee = ref<Employee | null>(JSON.parse(localStorage.getItem('employee') || 'null'));
    const accessToken = ref<string>(localStorage.getItem('token') || '');

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

    function setEmployee(newEmployee: Employee): void {
        employee.value = newEmployee;
        saveEmployee();
    }

    function setAccessToken(newToken: string): void {
        console.log(`access token ${newToken}`);
        accessToken.value = newToken;
        saveAccessToken();
    }

    return { employee, accessToken, setEmployee, setAccessToken };
});
