<template>
    <div class="employee-holidays">
        <div class="header-container">
            <!-- Month Navigation -->
            <div class="month-navigation">
                <button @click="prevMonth" :disabled="currentMonthIndex === 0" class="nav-button">
                    <span class="nav-icon">◀</span> Previous
                </button>
                <div class="month-display">
                    <h2>{{ months[currentMonthIndex] }} {{ currentYear }}</h2>
                </div>
                <button @click="nextMonth" :disabled="currentMonthIndex === months.length - 1" class="nav-button">
                    Next <span class="nav-icon">▶</span>
                </button>
            </div>

            <!-- Legend for calendar markers -->
            <div class="calendar-legend">
                <div class="legend-item">
                    <span class="legend-color holiday"></span>
                    <span>Holiday</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color leave-requested"></span>
                    <span>Leave Requested</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color today"></span>
                    <span>Today</span>
                </div>
            </div>
        </div>

        <!-- Calendar View -->
        <div class="calendar-container">
            <div class="calendar-header">
                <span v-for="day in daysOfWeek" :key="day" class="day-header">{{ day }}</span>
            </div>
            <div class="calendar-grid">
                <!-- Empty cells for days before the first of the month -->
                <div v-for="n in firstDayOfMonth" :key="'empty-' + n" class="calendar-day empty"></div>

                <!-- Days of the month -->
                <div v-for="day in daysInMonth" :key="day" class="calendar-day" :class="{
                    'holiday': isHoliday(day),
                    'today': isToday(day),
                    'clickable': !isHoliday(day),
                    'leave-requested': hasLeaveRequest(day),
                    'weekend': isWeekend(day)
                }" @click="!isHoliday(day) && openLeaveRequestModal(day)">
                    <span class="day-number">{{ day }}</span>
                    <div class="day-content">
                        <span v-if="isHoliday(day)" class="holiday-name">{{ getHolidayName(day) }}</span>
                        <span v-if="isHoliday(day)" class="holiday-type">{{ getHolidayType(day) }}</span>
                        <div v-if="hasLeaveRequest(day)" class="leave-badge" :class="getLeaveStatusClass(day)">
                            <span class="leave-type">{{ getLeaveType(day) }}</span>
                            <span class="leave-reason">{{ getLeaveReason(day) }}</span>
                            <span class="leave-status">{{ getLeaveStatus(day) }}</span>
                        </div>
                    </div>
                    <div v-if="!isHoliday(day) && !hasLeaveRequest(day)" class="day-action">
                        <span class="request-leave-badge">+ Request Leave</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Leave Request Modal -->
        <transition name="modal-fade">
            <div v-if="showRequestLeave"
                class="fixed inset-0 bg-black/30 flex backdrop-blur-md items-center justify-center z-50"
                @click.self="closeLeaveRequestModal">
                <div class="bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden shadow-xl">
                    <div class="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h2 class="text-lg font-semibold text-gray-800">
                            {{ isUpdating ? 'Update Leave Request' : 'Request Leave' }}
                        </h2>
                        <button class="text-gray-600 text-xl font-bold leading-none hover:text-gray-800 cursor-pointer"
                            @click="closeLeaveRequestModal">
                            <span class="material-icons text-sm">close</span>
                        </button>
                    </div>

                    <div class="p-4">
                        <div class="mb-4 p-2 bg-gray-50 rounded flex items-center">
                            <span class="font-semibold text-gray-600 mr-2">Start date:</span>
                            <span class="text-blue-600 font-medium">{{ selectedDate }}</span>
                        </div>

                        <form @submit.prevent="submitLeaveRequest">
                            <div class="mb-4 p-2 bg-gray-50 rounded flex flex-col">
                                <span class="font-semibold text-gray-600 mr-2">End date:</span>
                                <input type="date" v-model="leaveForm.endDate"
                                    class="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:border-blue-300 outline-none"
                                    required>
                            </div>

                            <div class="mb-4">
                                <label for="leave-type" class="block text-sm font-medium text-gray-700 mb-1">Leave
                                    Type</label>
                                <select v-model="leaveForm.type" id="leave-type" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="Vacation">Vacation</option>
                                    <option value="Sick">Sick</option>
                                    <option value="Personal">Personal</option>
                                    <option value="Family">Family</option>
                                    <option value="Bereavement">Bereavement</option>
                                </select>
                            </div>

                            <div class="mb-4 relative">
                                <label for="reason" class="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                <textarea v-model="leaveForm.reason" id="reason"
                                    placeholder="Please provide a brief explanation..." required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y h-32"></textarea>
                                <span class="absolute bottom-4 right-2 text-xs"
                                    :class="leaveForm.reason.length > 150 ? 'text-red-500' : 'text-gray-500'">
                                    {{ leaveForm.reason.length }}/200
                                </span>
                            </div>

                            <div class="flex justify-end gap-3 mt-6">
                                <button type="button" @click="closeLeaveRequestModal"
                                    class="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 font-medium">Cancel</button>
                                <button type="submit"
                                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center justify-center min-w-[120px]"
                                    :disabled="isSubmitting">
                                    <span v-if="isSubmitting"
                                        class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                    <span v-else>Submit Request</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    <div v-if="statusMessage"
                        :class="['p-3 text-center font-medium border-t border-gray-200', statusMessageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
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
            return dayOfWeek === 0 || dayOfWeek === 6; // 0 is Sunday, 6 is Saturday
        },
        openLeaveRequestModal(day) {
            this.selectedDay = day;
            this.selectedDate = `${this.months[this.currentMonthIndex]} ${day}, ${this.currentYear}`;
            this.showRequestLeave = true;

            if (this.hasLeaveRequest(day)) {
                const existingRequest = this.getLeaveRequest(day);
                this.isUpdating = true;
                this.currentLeaveRequestId = existingRequest._id;
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
                // Store all leave requests without filtering by month here
                this.leaveRequests = requests;
            } catch (error) {
                console.error('Failed to fetch leave requests:', error);
                this.statusMessage = 'Failed to load leave requests.';
                this.statusMessageType = 'error';
                setTimeout(() => (this.statusMessage = ''), 3000);
            }
        },
        hasLeaveRequest(day) {
            const currentDate = new Date(this.currentYear, this.currentMonthIndex, day);
            return this.leaveRequests.some(request => {
                const startDate = new Date(request.startDate);
                const endDate = new Date(request.endDate);
                // Check if currentDate falls within startDate and endDate (inclusive)
                return currentDate >= startDate && currentDate <= endDate;
            });
        },
        getLeaveRequest(day) {
            const currentDate = new Date(this.currentYear, this.currentMonthIndex, day);
            return this.leaveRequests.find(request => {
                const startDate = new Date(request.startDate);
                const endDate = new Date(request.endDate);
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
                case 'approved': return 'status-approved';
                case 'rejected': return 'status-rejected';
                case 'pending': return 'status-pending';
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

            // Validate that endDate is not before startDate
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
                    // Update existing leave request
                    response = await fetch(`${BASE_API_URL}/api/leaves/${this.currentLeaveRequestId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(leaveRequest)
                    });
                } else {
                    // Create new leave request
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
/* Existing styles for non-modal elements */
.employee-holidays {
    text-align: left;
    padding: 20px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    color: #333;
}

.header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 20px;
    width: 100%;
}

.month-navigation {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 15px;
}

.month-display h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
}

.nav-button {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: background-color 0.2s;
}

.nav-button:hover {
    background-color: #2980b9;
}

.nav-button:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
}

.nav-icon {
    display: inline-block;
    margin: 0 5px;
}

.calendar-legend {
    display: flex;
    gap: 15px;
    margin-top: 10px;
}

.legend-item {
    display: flex;
    align-items: center;
    font-size: 0.85rem;
    color: #666;
}

.legend-color {
    width: 16px;
    height: 16px;
    border-radius: 3px;
    margin-right: 5px;
}

.legend-color.holiday {
    background-color: #fff3cd;
    border: 1px solid #ffeeba;
}

.legend-color.leave-requested {
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
}

.legend-color.today {
    border: 2px solid #007bff;
    background-color: transparent;
}

.calendar-container {
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    background-color: white;
    width: 100%;
}

.calendar-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-weight: 600;
    background-color: #f5f5f5;
    padding: 15px 0;
    border-bottom: 1px solid #e8e8e8;
}

.day-header {
    font-size: 0.9rem;
    color: #666;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background-color: #e8e8e8;
}

.calendar-day {
    background: white;
    min-height: 100px;
    display: flex;
    flex-direction: column;
    padding: 5px;
    position: relative;
    transition: background-color 0.2s;
}

.calendar-day.empty {
    background: #f5f5f5;
}

.calendar-day.clickable {
    cursor: pointer;
}

.calendar-day.clickable:hover {
    background: #f0f7ff;
}

.calendar-day.holiday {
    background: #fff3cd;
}

.calendar-day.weekend:not(.holiday):not(.leave-requested) {
    background: #f9f9f9;
}

.calendar-day.today {
    border: 2px solid #007bff;
}

.calendar-day.leave-requested {
    background: #d4edda;
}

.day-number {
    font-size: 0.9rem;
    font-weight: 600;
    color: #444;
    align-self: flex-start;
    margin-bottom: 5px;
}

.day-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    font-size: 0.8rem;
    word-break: break-word;
    overflow: hidden;
}

.holiday-name {
    color: #856404;
    font-weight: 600;
    margin-bottom: 3px;
}

.holiday-type {
    color: #856404;
    font-size: 0.75rem;
    font-style: italic;
}

.leave-badge {
    margin-top: 5px;
    padding: 4px 6px;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.5);
    border: 1px solid #c3e6cb;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.leave-badge.status-approved {
    border-color: #28a745;
}

.leave-badge.status-rejected {
    border-color: #dc3545;
}

.leave-badge.status-pending {
    border-color: #ffc107;
}

.leave-type {
    font-weight: 600;
    color: #155724;
}

.leave-reason {
    color: #155724;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.leave-status {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #155724;
    align-self: flex-end;
}

.status-approved .leave-status {
    color: #28a745;
}

.status-rejected .leave-status {
    color: #dc3545;
}

.status-pending .leave-status {
    color: #ffc107;
}

.day-action {
    margin-top: auto;
    display: flex;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
}

.calendar-day.clickable:hover .day-action {
    opacity: 1;
}

.request-leave-badge {
    font-size: 0.75rem;
    color: #007bff;
    padding: 3px 6px;
    border-radius: 4px;
    background-color: rgba(0, 123, 255, 0.1);
    cursor: pointer;
}

/* Modal transition styles */
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>