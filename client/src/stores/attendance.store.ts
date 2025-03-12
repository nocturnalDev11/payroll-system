import { defineStore } from 'pinia';
import { BASE_API_URL } from '../utils/constants.ts';

interface AttendanceRecord {
    _id: string;
    employeeId: string;
    date: string;
    timeIn?: string;
    timeOut?: string;
    morningTimeIn?: string;
    morningTimeOut?: string;
    afternoonTimeIn?: string;
    afternoonTimeOut?: string;
    status?: string;
    name?: string;
    position?: string;
    employeeIdNumber?: string;
    email?: string;
}

interface Employee {
    _id: string;
    firstName: string;
    lastName: string;
    employeeIdNumber: string;
    position: string;
    email?: string;
}

export const useAttendanceStore = defineStore("attendance", {
    state: () => ({
        attendanceRecords: [] as AttendanceRecord[],
        loading: false,
        error: null as string | null,
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

                const data: AttendanceRecord = await response.json();
                this.attendanceRecords.push(data);
                return data;
            } catch (err: any) {
                this.error = err.message || "Failed to time in";
                throw new Error(this.error ?? "Unknown error");
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

                const data: AttendanceRecord = await response.json();
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
                const attendanceResponse = await fetch(`${BASE_API_URL}/api/attendance`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (!attendanceResponse.ok) {
                    throw new Error(await attendanceResponse.text());
                }

                const attendanceData: AttendanceRecord[] = await attendanceResponse.json();
                console.log('Attendance Data:', attendanceData);

                const employeeResponse = await fetch(`${BASE_API_URL}/api/employees`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (!employeeResponse.ok) {
                    throw new Error(await employeeResponse.text());
                }

                const employeeData: Employee[] = await employeeResponse.json();
                console.log('Employee Data:', employeeData);

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                this.attendanceRecords = attendanceData
                    .filter(record => {
                        const recordDate = new Date(record.date);
                        return recordDate >= today && recordDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
                    })
                    .map(record => {
                        const employee = employeeData.find(emp => emp._id === record.employeeId);
                        const mappedRecord = {
                            ...record,
                            name: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee',
                            position: employee?.position || 'N/A',
                            employeeIdNumber: employee?.employeeIdNumber || 'N/A',
                            email: employee?.email || 'N/A',
                        };
                        console.log('Mapped Record:', mappedRecord);
                        return mappedRecord;
                    });
            } catch (err: any) {
                this.error = err.message || "Failed to fetch attendance records";
                console.error(this.error);
            } finally {
                this.loading = false;
            }
        },
    },
});