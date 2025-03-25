import { defineStore } from 'pinia';
import { BASE_API_URL } from '../utils/constants.ts';

export const useAttendanceStore = defineStore("attendance", {
    state: () => ({
        attendanceRecords: [],
        loading: false,
        error: null
    }),

    actions: {
        async timeIn(employeeId: string) {
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
            } catch (err: any) {
                this.error = err.message || "Failed to time in";
                throw new Error(this.error);
            }
        },

        async timeOut(employeeId: string) {
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
            } catch (err: any) {
                this.error = err.message || "Failed to time out";
            }
        },

        async fetchAttendance() {
            this.loading = true;
            this.error = null;
            try {
                const response = await fetch(`${BASE_API_URL}/api/attendance`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (!response.ok) {
                    throw new Error(await response.text());
                }

                const data = await response.json();
                // Filter for today's records (assuming date is a Date string or timestamp)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                this.attendanceRecords = data.filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate >= today && recordDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
                });
            } catch (err: any) {
                this.error = err.message || "Failed to fetch attendance records";
                console.error(this.error);
            } finally {
                this.loading = false;
            }
        }
    }
});