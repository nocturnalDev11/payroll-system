import { ref, computed } from 'vue';
import axios from 'axios';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';

export function useEmployeeData() {
    const authStore = useAuthStore();
    const state = ref({
        employees: [],
        positions: [],
        attendanceAffectedDeductions: [],
        isLoading: false,
        statusMessage: '',
    });

    const fetchPositions = async (retries = 3, delay = 1000) => {
        for (let i = 0; i < retries; i++) {
            try {
                const token = authStore.accessToken || localStorage.getItem('token') || '';
                if (!token) throw new Error('No authentication token found');
                const headers = {
                    Authorization: `Bearer ${token}`,
                    'user-role': 'admin',
                    'user-id': authStore.admin?._id || localStorage.getItem('userId') || '',
                };
                const response = await axios.get(`${BASE_API_URL}/api/positions`, { headers });
                state.value.positions = response.data.map((position) => ({
                    name: position.name,
                    salary: position.salary,
                }));
                return;
            } catch (error) {
                if (i === retries - 1) {
                    showErrorMessage('Failed to load positions after multiple attempts.');
                }
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    };

    const fetchEmployees = async () => {
        state.value.isLoading = true;
        const token = authStore.accessToken || localStorage.getItem('token') || '';
        try {
            if (!token) throw new Error('No authentication token found');
            const response = await axios.get(`${BASE_API_URL}/api/employees`, {
                headers: {
                Authorization: `Bearer ${token}`,
                'user-role': 'admin',
                'user-id': authStore.admin?._id || localStorage.getItem('userId') || '',
                },
            });
            state.value.employees = response.data
            .filter((employee) => employee.status !== 'pending' && employee.status !== 'archived')
            .map((employee) => {
                const latestPosition = getLatestPosition(employee);
                return {
                    ...employee,
                    id: employee._id,
                    name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Unnamed Employee',
                    position: latestPosition.position,
                    salary: latestPosition.salary,
                    positionHistory: Array.isArray(employee.positionHistory) && employee.positionHistory.length > 0
                        ? employee.positionHistory
                        : [
                            {
                                position: employee.position || 'N/A',
                                salary: employee.salary || 0,
                                startDate: employee.hireDate || state.value.currentDate,
                                endDate: null,
                            },
                        ],
                    payheads: Array.isArray(employee.payheads) ? employee.payheads : [],
                    createdAt: employee.createdAt || employee.hireDate,
                    updatedAt: employee.updatedAt,
                };
            });
            showSuccessMessage('Employees loaded successfully!');
        } catch (error) {
            showErrorMessage(`Failed to load employees: ${error.message}`);
        } finally {
            state.value.isLoading = false;
        }
    };

    const fetchAttendanceAffectedDeductions = async (retries = 3, delay = 1000) => {
        for (let i = 0; i < retries; i++) {
            state.value.isLoading = true;
            const token = authStore.accessToken || localStorage.getItem('token') || '';
            try {
                if (!token) throw new Error('No authentication token found');
                const response = await axios.get(`${BASE_API_URL}/api/payheads`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'user-role': 'admin',
                        'user-id': authStore.admin?._id || localStorage.getItem('userId') || '',
                    },
                    params: { isAttendanceAffected: true },
                });
                state.value.attendanceAffectedDeductions = response.data
                .filter((payhead) => payhead.type === 'Deductions' && payhead.isAttendanceAffected === true)
                .map((payhead) => ({
                    id: payhead._id || payhead.id,
                    name: payhead.name,
                    amount: Number(payhead.amount || 0),
                    type: payhead.type,
                    description: payhead.description || '',
                    isRecurring: payhead.isRecurring || false,
                    isAttendanceAffected: payhead.isAttendanceAffected || false,
                }));
                if (state.value.attendanceAffectedDeductions.length === 0) {
                    showErrorMessage('No attendance-affected deductions available.');
                } else {
                    showSuccessMessage('Attendance-affected deductions loaded successfully!');
                }
                return;
            } catch (error) {
                if (i === retries - 1) {
                    showErrorMessage(`Failed to load deductions: ${error.message}`);
                }
                await new Promise((resolve) => setTimeout(resolve, delay));
            } finally {
                state.value.isLoading = false;
            }
        }
    };

    const getLatestPosition = (employee) => {
        if (!Array.isArray(employee.positionHistory) || employee.positionHistory.length === 0) {
            return {
                position: employee.position || 'N/A',
                salary: employee.salary || 0,
                startDate: employee.hireDate || state.value.currentDate,
            };
        }
        const sortedHistory = [...employee.positionHistory].sort(
            (a, b) => new Date(b.startDate) - new Date(a.startDate)
        );
        return sortedHistory.find((h) => !h.endDate) || sortedHistory[0];
    };

    const showSuccessMessage = (message) => {
        state.value.statusMessage = message;
        setTimeout(() => (state.value.statusMessage = ''), 3000);
    };

    const showErrorMessage = (message) => {
        state.value.statusMessage = message;
        setTimeout(() => (state.value.statusMessage = ''), 5000);
    };

    return {
        state,
        fetchPositions,
        fetchEmployees,
        fetchAttendanceAffectedDeductions,
        getLatestPosition,
        showSuccessMessage,
        showErrorMessage,
    };
}