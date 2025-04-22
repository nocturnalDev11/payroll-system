<template>
    <div class="mx-auto max-w-[85rem] p-5 font-inter text-gray-800">
        <div class="mb-5 flex w-full flex-wrap items-center justify-between">
            <!-- Month Navigation -->
            <div class="month-navigation flex items-center justify-start gap-4">
                <button @click="prevMonth" :disabled="currentMonthIndex === 0"
                    class="nav-button flex items-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300">
                    <span class="material-icons mr-1">chevron_left</span> Previous
                </button>
                <div class="month-display">
                    <h2 class="m-0 text-xl text-gray-800">{{ months[currentMonthIndex] }} {{ currentYear }}</h2>
                </div>
                <button @click="nextMonth" :disabled="currentMonthIndex === months.length - 1"
                    class="nav-button flex items-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300">
                    Next <span class="material-icons ml-1">chevron_right</span>
                </button>
            </div>

            <!-- Legend for calendar markers -->
            <div class="calendar-legend mt-2 flex gap-4">
                <div class="legend-item flex items-center text-sm text-gray-600">
                    <span
                        class="legend-color holiday mr-1 h-4 w-4 rounded border border-yellow-200 bg-yellow-100"></span>
                    <span>Holiday</span>
                </div>
                <div class="legend-item flex items-center text-sm text-gray-600">
                    <span
                        class="legend-color leave-requested mr-1 h-4 w-4 rounded border border-green-200 bg-green-100"></span>
                    <span>Leave Requested</span>
                </div>
                <div class="legend-item flex items-center text-sm text-gray-600">
                    <span
                        class="legend-color today mr-1 h-4 w-4 rounded border-2 border-blue-500 bg-transparent"></span>
                    <span>Today</span>
                </div>
            </div>
        </div>

        <!-- Calendar View -->
        <div class="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
            <div class="grid grid-cols-7 border-b border-gray-200 bg-gray-100 p-4 text-center font-semibold">
                <span v-for="day in daysOfWeek" :key="day" class="day-header text-sm text-gray-600">{{ day }}</span>
            </div>
            <div class="grid grid-cols-7 gap-px bg-gray-200">
                <!-- Empty cells for days before the first of the month -->
                <div v-for="n in firstDayOfMonth" :key="'empty-' + n"
                    class="calendar-day empty min-h-[100px] bg-gray-100"></div>

                <!-- Days of the month -->
                <div v-for="day in daysInMonth" :key="day"
                    class="calendar-day relative flex min-h-[100px] flex-col bg-white p-1 transition-colors group"
                    :class="{
                        'bg-green-100': hasLeaveRequest(day),
                        'bg-yellow-100': isHoliday(day) && !hasLeaveRequest(day),
                        'bg-gray-50': isWeekend(day) && !isHoliday(day) && !hasLeaveRequest(day),
                        'border-2 border-blue-500': isToday(day),
                        'cursor-pointer hover:bg-blue-50': !isHoliday(day)
                    }" @click="!isHoliday(day) && openLeaveRequestModal(day)">
                    <span class="day-number mb-1 text-sm font-semibold text-gray-700">{{ day }}</span>
                    <div class="day-content flex flex-1 flex-col overflow-hidden text-xs">
                        <span v-if="isHoliday(day)" class="holiday-name mb-1 font-semibold text-yellow-800">{{
                            getHolidayName(day) }}</span>
                        <span v-if="isHoliday(day)" class="holiday-type italic text-yellow-800">{{ getHolidayType(day)
                        }}</span>
                        <div v-if="hasLeaveRequest(day)"
                            class="leave-badge mt-2 p-1 rounded-lg flex flex-col gap-[5px] border border-green-200 bg-white/50"
                            :class="{
                                'border-green-500': getLeaveStatus(day).toLowerCase() === 'approved',
                                'border-red-500': getLeaveStatus(day).toLowerCase() === 'disapproved',
                                'border-yellow-500': getLeaveStatus(day).toLowerCase() === 'pending'
                            }">
                            <span class="leave-type font-semibold text-green-800">{{ getLeaveType(day) }}</span>
                            <span class="truncate text-green-800">{{ getLeaveReason(day) }}</span>
                            <span class="leave-status self-end text-[10px] font-semibold uppercase text-green-800"
                                :class="{
                                    'text-green-600': getLeaveStatus(day).toLowerCase() === 'approved',
                                    'text-red-600': getLeaveStatus(day).toLowerCase() === 'disapproved',
                                    'text-yellow-600': getLeaveStatus(day).toLowerCase() === 'pending'
                                }">{{ getLeaveStatus(day) }}</span>
                        </div>
                    </div>

                    <div v-if="!isHoliday(day) && !hasLeaveRequest(day)"
                        class="day-action mt-auto flex justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        <span
                            class="request-leave-badge cursor-pointer rounded bg-blue-200/50 px-1.5 py-0.5 text-xs text-blue-600">
                            + Request Leave
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Leave Request Modal -->
        <transition name="modal-fade">
            <div v-if="showRequestLeave"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                @click.self="closeLeaveRequestModal">
                <div class="mx-4 w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
                    <div class="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-3">
                        <h2 class="text-lg font-semibold text-gray-800">
                            {{ isUpdating ? 'Update Leave Request' : 'Request Leave' }}
                        </h2>
                        <button class="cursor-pointer text-xl font-bold leading-none text-gray-600 hover:text-gray-800"
                            @click="closeLeaveRequestModal">
                            <span class="material-icons text-sm">close</span>
                        </button>
                    </div>

                    <div class="p-4">
                        <div class="mb-4 flex items-center rounded bg-gray-50 p-2">
                            <span class="mr-2 font-semibold text-gray-600">Start date:</span>
                            <span class="font-medium text-blue-600">{{ selectedDate }}</span>
                        </div>

                        <form @submit.prevent="submitLeaveRequest">
                            <div class="mb-4 flex flex-col rounded bg-gray-50 p-2">
                                <span class="mb-1 font-semibold text-gray-600">End date:</span>
                                <input type="date" v-model="leaveForm.endDate"
                                    class="w-full rounded-lg border border-gray-300 p-2 outline-none focus:border-blue-300 focus:ring focus:ring-blue-200"
                                    required>
                            </div>

                            <div class="mb-4">
                                <label for="leave-type" class="mb-1 block text-sm font-medium text-gray-700">Leave
                                    Type</label>
                                <select v-model="leaveForm.type" id="leave-type" required
                                    class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="Vacation">Vacation</option>
                                    <option value="Sick">Sick</option>
                                    <option value="Personal">Personal</option>
                                    <option value="Family">Family</option>
                                    <option value="Bereavement">Bereavement</option>
                                </select>
                            </div>

                            <div class="mb-4 relative">
                                <label for="reason" class="mb-1 block text-sm font-medium text-gray-700">Reason</label>
                                <textarea v-model="leaveForm.reason" id="reason"
                                    placeholder="Please provide a brief explanation..." required
                                    class="h-32 w-full resize-y rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                                <span class="absolute bottom-4 right-2 text-xs"
                                    :class="leaveForm.reason.length > 150 ? 'text-red-500' : 'text-gray-500'">
                                    {{ leaveForm.reason.length }}/200
                                </span>
                            </div>

                            <div class="mt-6 flex justify-end gap-3">
                                <button type="button" @click="closeLeaveRequestModal"
                                    class="rounded-md border border-gray-300 bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200">Cancel</button>
                                <button type="submit"
                                    class="flex min-w-[120px] items-center justify-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                                    :disabled="isSubmitting">
                                    <span v-if="isSubmitting"
                                        class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                    <span v-else>Submit Request</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    <div v-if="statusMessage"
                        :class="['border-t border-gray-200 p-3 text-center font-medium', statusMessageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                        {{ statusMessage }}
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';
import { v4 as uuidv4 } from 'uuid';

export default {
    name: "EmployeeHolidays",
    data() {
        return {
            currentMonthIndex: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            months: [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ],
            daysOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            holidays: [
                { date: "January 1", name: "New Year's Day", type: "Regular Holiday", monthIndex: 0 },
                { date: "January 23", name: "First Philippine Republic Day", type: "Special Working", monthIndex: 0 },
                { date: "February 25", name: "EDSA People Power Revolution", type: "Special Non-Working", monthIndex: 1 },
                { date: "March 31", name: "Holi Festival (Hindu Community)", type: "Special Working", monthIndex: 2 },
                { date: "April 6", name: "Maundy Thursday", type: "Regular Holiday", monthIndex: 3 },
                { date: "April 7", name: "Good Friday", type: "Regular Holiday", monthIndex: 3 },
                { date: "April 9", name: "Araw ng Kagitingan", type: "Regular Holiday", monthIndex: 3 },
                { date: "May 1", name: "Labor Day", type: "Regular Holiday", monthIndex: 4 },
                { date: "June 12", name: "Independence Day", type: "Regular Holiday", monthIndex: 5 },
                { date: "July 6", name: "Eid'l Adha (Feast of Sacrifice)", type: "Regular Holiday", monthIndex: 6 },
                { date: "August 21", name: "Ninoy Aquino Day", type: "Special Non-Working", monthIndex: 7 },
                { date: "August 28", name: "National Heroes Day", type: "Regular Holiday", monthIndex: 7 },
                { date: "September 3", name: "Surrender of Gen. Yamashita", type: "Special Working", monthIndex: 8 },
                { date: "October 31", name: "All Saints' Day (Observance)", type: "Special Working", monthIndex: 9 },
                { date: "November 1", name: "All Saints' Day", type: "Special Non-Working", monthIndex: 10 },
                { date: "November 2", name: "All Souls' Day", type: "Special Non-Working", monthIndex: 10 },
                { date: "November 30", name: "Bonifacio Day", type: "Regular Holiday", monthIndex: 10 },
                { date: "December 8", name: "Feast of the Immaculate Conception", type: "Special Non-Working", monthIndex: 11 },
                { date: "December 24", name: "Christmas Eve", type: "Special Non-Working", monthIndex: 11 },
                { date: "December 25", name: "Christmas Day", type: "Regular Holiday", monthIndex: 11 },
                { date: "December 30", name: "Rizal Day", type: "Regular Holiday", monthIndex: 11 },
                { date: "December 31", name: "New Year's Eve", type: "Special Non-Working", monthIndex: 11 },
            ],
            showRequestLeave: false,
            selectedDate: '',
            selectedDay: null,
            leaveForm: {
                type: 'Vacation',
                reason: '',
                endDate: ''
            },
            statusMessage: '',
            statusMessageType: 'success',
            leaveRequests: [],
            isSubmitting: false,
            isUpdating: false,
            currentLeaveRequestId: null
        };
    },
    computed: {
        daysInMonth() {
            return new Date(this.currentYear, this.currentMonthIndex + 1, 0).getDate();
        },
        firstDayOfMonth() {
            return new Date(this.currentYear, this.currentMonthIndex, 1).getDay();
        },
        filteredHolidays() {
            return this.holidays.filter(h => h.monthIndex === this.currentMonthIndex);
        }
    },
    methods: {
        prevMonth() {
            if (this.currentMonthIndex > 0) {
                this.currentMonthIndex--;
            } else {
                this.currentMonthIndex = 11;
                this.currentYear--;
            }
            this.fetchLeaveRequests();
        },
        nextMonth() {
            if (this.currentMonthIndex < this.months.length - 1) {
                this.currentMonthIndex++;
            } else {
                this.currentMonthIndex = 0;
                this.currentYear++;
            }
            this.fetchLeaveRequests();
        },
        isHoliday(day) {
            const dateStr = `${this.months[this.currentMonthIndex]} ${day}`;
            return this.filteredHolidays.some(h => h.date === dateStr);
        },
        getHolidayName(day) {
            const dateStr = `${this.months[this.currentMonthIndex]} ${day}`;
            const holiday = this.filteredHolidays.find(h => h.date === dateStr);
            return holiday ? holiday.name : '';
        },
        getHolidayType(day) {
            const dateStr = `${this.months[this.currentMonthIndex]} ${day}`;
            const holiday = this.filteredHolidays.find(h => h.date === dateStr);
            return holiday ? holiday.type : '';
        },
        isToday(day) {
            const today = new Date();
            return today.getFullYear() === this.currentYear &&
                today.getMonth() === this.currentMonthIndex &&
                today.getDate() === day;
        },
        isWeekend(day) {
            const date = new Date(this.currentYear, this.currentMonthIndex, day);
            const dayOfWeek = date.getDay();
            return dayOfWeek === 0 || dayOfWeek === 6;
        },
        openLeaveRequestModal(day) {
            this.selectedDay = day;
            this.selectedDate = `${this.months[this.currentMonthIndex]} ${day}, ${this.currentYear}`;
            this.showRequestLeave = true;

            if (this.hasLeaveRequest(day)) {
                const existingRequest = this.getLeaveRequest(day);
                this.isUpdating = true;
                this.currentLeaveRequestId = existingRequest._id || existingRequest.id;
                this.leaveForm.type = existingRequest.type;
                this.leaveForm.reason = existingRequest.reason;
                this.leaveForm.endDate = new Date(existingRequest.endDate).toISOString().split('T')[0];
            } else {
                this.isUpdating = false;
                this.currentLeaveRequestId = null;
                this.leaveForm = { type: 'Vacation', reason: '', endDate: '' };
            }
        },
        closeLeaveRequestModal() {
            this.showRequestLeave = false;
            this.leaveForm = { type: 'Vacation', reason: '', endDate: '' };
            this.statusMessage = '';
        },
        getAuthData() {
            const authStore = useAuthStore();
            const token = authStore.accessToken;
            if (!token) {
                console.error('No token found');
                return { employeeId: null, token: null };
            }
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.exp * 1000 < Date.now()) {
                    console.error('Token has expired');
                    authStore.logout();
                    return { employeeId: null, token: null };
                }
                console.log('Token payload:', payload);
                return { employeeId: payload.employeeId, token };
            } catch (error) {
                console.error('Failed to parse token:', error);
                return { employeeId: null, token: null };
            }
        },
        async fetchLeaveRequests() {
            const authStore = useAuthStore();
            const { employeeId, token } = this.getAuthData();
            if (!employeeId || !token) {
                this.statusMessage = 'Authentication required. Please log in again.';
                this.statusMessageType = 'error';
                setTimeout(() => (this.statusMessage = ''), 3000);
                return;
            }
            try {
                const response = await fetch(`${BASE_API_URL}/api/leaves/employee/${employeeId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                });
                if (!response.ok) throw new Error(`Failed to fetch: ${await response.text()}`);
                const requests = await response.json();
                console.log('Fetched leave requests:', requests);
                this.leaveRequests = requests;
                this.$forceUpdate();
            } catch (error) {
                console.error('Failed to fetch leave requests:', error);
                this.statusMessage = 'Failed to load leave requests.';
                this.statusMessageType = 'error';
                setTimeout(() => (this.statusMessage = ''), 3000);
            }
        },
        hasLeaveRequest(day) {
            const currentDate = new Date(this.currentYear, this.currentMonthIndex, day);
            currentDate.setHours(0, 0, 0, 0);
            return this.leaveRequests.some(request => {
                const startDate = new Date(request.startDate);
                const endDate = new Date(request.endDate);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(0, 0, 0, 0);
                return currentDate >= startDate && currentDate <= endDate;
            });
        },
        getLeaveRequest(day) {
            const currentDate = new Date(this.currentYear, this.currentMonthIndex, day);
            currentDate.setHours(0, 0, 0, 0);
            return this.leaveRequests.find(request => {
                const startDate = new Date(request.startDate);
                const endDate = new Date(request.endDate);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(0, 0, 0, 0);
                return currentDate >= startDate && currentDate <= endDate;
            });
        },
        getLeaveReason(day) {
            const request = this.getLeaveRequest(day);
            return request ? request.reason : '';
        },
        getLeaveType(day) {
            const request = this.getLeaveRequest(day);
            return request ? request.type : '';
        },
        getLeaveStatus(day) {
            const request = this.getLeaveRequest(day);
            return request ? request.status : '';
        },
        getLeaveStatusClass(day) {
            const request = this.getLeaveRequest(day);
            if (!request) return '';
            switch (request.status.toLowerCase()) {
                case 'approved': return 'approved';
                case 'disapproved': return 'disapproved';
                case 'pending': return 'pending';
                default: return '';
            }
        },
        async submitLeaveRequest() {
            this.isSubmitting = true;
            this.statusMessage = '';

            const { employeeId, token } = this.getAuthData();
            if (!employeeId || !token) {
                this.statusMessage = 'Authentication required. Please log in again.';
                this.statusMessageType = 'error';
                this.isSubmitting = false;
                return;
            }

            if (!this.leaveForm.reason.trim()) {
                this.statusMessage = 'Please provide a reason for your leave request.';
                this.statusMessageType = 'error';
                this.isSubmitting = false;
                return;
            }

            const startDate = new Date(this.currentYear, this.currentMonthIndex, this.selectedDay).toISOString();
            const endDate = new Date(this.leaveForm.endDate).toISOString();

            if (new Date(endDate) < new Date(startDate)) {
                this.statusMessage = 'End date cannot be before start date.';
                this.statusMessageType = 'error';
                this.isSubmitting = false;
                return;
            }

            const leaveRequest = {
                employeeId,
                startDate,
                endDate,
                type: this.leaveForm.type,
                reason: this.leaveForm.reason,
                status: 'Pending'
            };

            try {
                let response;
                if (this.isUpdating) {
                    response = await fetch(`${BASE_API_URL}/api/leaves/${this.currentLeaveRequestId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(leaveRequest)
                    });
                } else {
                    leaveRequest.id = uuidv4();
                    response = await fetch(`${BASE_API_URL}/api/leaves`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(leaveRequest)
                    });
                }

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`Failed to ${this.isUpdating ? 'update' : 'submit'} leave request: ${text}`);
                }

                this.statusMessage = `Leave request ${this.isUpdating ? 'updated' : 'submitted'} successfully!`;
                this.statusMessageType = 'success';
                await this.fetchLeaveRequests();
                setTimeout(() => {
                    this.closeLeaveRequestModal();
                }, 2000);
            } catch (error) {
                console.error(`Failed to ${this.isUpdating ? 'update' : 'submit'} leave request:`, error);
                this.statusMessage = `Failed to ${this.isUpdating ? 'update' : 'submit'} leave request. Please try again.`;
                this.statusMessageType = 'error';
            } finally {
                this.isSubmitting = false;
            }
        }
    },
    mounted() {
        this.fetchLeaveRequests();
    }
};
</script>

<style scoped>
/* Modal transition styles */
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

/* Ensure calendar-day hover works with day-action */
.calendar-day:hover .day-action {
    opacity: 1;
}
</style>