import { defineStore } from 'pinia';
import { BASE_API_URL } from '../utils/constants.js';
import { useAuthStore } from './auth.store.js';

export const useAttendanceStore = defineStore("attendance", {
    state: () => ({
        attendanceRecords: [],
        loading: false,
        error: null
    }),

    actions: {
        async timeIn(employeeId) {
            try {
                const response = await fetch(`${BASE_API_URL}/api/attendance/time-in`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ employeeId }),
                });

                if (!response.ok) {
                    throw new Error(await response.text());
                }

                const data = await response.json();
                this.attendanceRecords.push(data);
                return data;
            } catch (err) {
                this.error = err.message || "Failed to time in";
                throw new Error(this.error);
            }
        },

        async timeOut(employeeId) {
            try {
                const response = await fetch(`${BASE_API_URL}/api/attendance/time-out`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ employeeId }),
                });

                if (!response.ok) {
                    throw new Error(await response.text());
                }

                const data = await response.json();
                this.attendanceRecords = this.attendanceRecords.map(record =>
                    record._id === data._id ? data : record
                );
            } catch (err) {
                this.error = err.message || "Failed to time out";
            }
        },

        async fetchAttendance() {
            this.loading = true;
            this.error = null;
            const authStore = useAuthStore();
            try {
                const response = await fetch(`${BASE_API_URL}/api/attendance?date=${new Date().toISOString().split('T')[0]}`, {
                    method: "GET",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${authStore.accessToken}`
                    },
                });

                if (!response.ok) {
                    throw new Error(await response.text());
                }

                const data = await response.json();
                this.attendanceRecords = data; // No need to filter if date query is used
            } catch (err) {
                this.error = err.message || "Failed to fetch attendance records";
                console.error(this.error);
            } finally {
                this.loading = false;
            }
        }
    }
});
