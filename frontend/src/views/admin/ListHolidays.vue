<template>
    <div class="calendar-wrapper">
        <!-- Header with month/year navigation -->
        <div class="calendar-header">
            <button @click="prevMonth" class="nav-button">◀</button>
            <h2>{{ currentMonthName }} {{ currentYear }}</h2>
            <button @click="nextMonth" class="nav-button">▶</button>
        </div>

        <!-- Calendar grid -->
        <div class="calendar">
            <!-- Days of week header -->
            <div v-for="day in daysOfWeek" :key="day" class="calendar-cell day-name">
                {{ day }}
            </div>

            <!-- Calendar days -->
            <div v-for="(day, index) in calendarDays" :key="index" :class="[
                'calendar-cell',
                { 'other-month': !day.isCurrentMonth },
                { 'today': day.isToday },
                { 'has-holiday': day.holiday },
                { 'has-tasks': day.tasks && day.tasks.length > 0 }
            ]" @click="selectDay(day)">
                <div class="date-number">{{ day.date }}</div>
                <div v-if="day.holiday" class="holiday-indicator"
                    :class="day.holiday.type.toLowerCase().replace(' ', '-')"></div>
                <div v-if="day.tasks && day.tasks.length" class="task-indicator">
                    {{ day.tasks.length }} task{{ day.tasks.length > 1 ? 's' : '' }}
                </div>
            </div>
        </div>

        <!-- Monthly holidays summary -->
        <div class="monthly-holidays">
            <h3>{{ currentMonthName }} Holidays</h3>
            <div class="holiday-list">
                <div v-for="(holiday, index) in currentMonthHolidays" :key="index" class="holiday-item"
                    :class="holiday.type.toLowerCase().replace(' ', '-')" @click="selectHoliday(holiday)">
                    <div class="holiday-date-small">{{ holiday.date.split(' ')[1] }}</div>
                    <div class="holiday-name-small">{{ holiday.name }}</div>
                </div>
            </div>
        </div>

        <!-- Day Detail Modal -->
        <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
            <div class="modal-content" :class="{ 'has-holiday': selectedDay.holiday }">
                <button class="close-button" @click="closeModal">×</button>

                <div class="modal-header">
                    <div class="date-header">{{ formatDate(selectedDay.fullDate) }}</div>
                    <div v-if="selectedDay.holiday" class="holiday-section">
                        <h3 class="holiday-name">{{ selectedDay.holiday.name }}</h3>
                        <div class="holiday-badge" :class="selectedDay.holiday.type.toLowerCase().replace(' ', '-')">
                            {{ selectedDay.holiday.type }}
                        </div>
                    </div>
                </div>

                <div class="modal-body">
                    <!-- Holiday Info -->
                    <div v-if="selectedDay.holiday" class="holiday-info-section">
                        <p class="holiday-description">{{ selectedDay.holiday.description }}</p>
                        <div class="holiday-info">
                            <div class="info-item">
                                <strong>Pay Rules:</strong>
                                <span v-if="selectedDay.holiday.type === 'Regular Holiday'">
                                    100% additional pay for working, or 100% pay if not working
                                </span>
                                <span v-else-if="selectedDay.holiday.type === 'Special Non-Working'">
                                    30% additional pay for working, or no pay if not working
                                </span>
                                <span v-else>
                                    No additional pay for working
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Tasks Section -->
                    <div class="tasks-section">
                        <h4>Tasks</h4>
                        <div class="task-list">
                            <div v-for="(task, index) in selectedDay.tasks" :key="index" class="task-item">
                                <input type="text" v-model="selectedDay.tasks[index]"
                                    @blur="updateTask(selectedDay, index)" class="task-input"
                                    placeholder="Enter task description" />
                                <button @click="removeTask(index)" class="remove-task">×</button>
                            </div>
                        </div>
                        <button @click="addTask" class="add-task-btn">+ Add Task</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "PhilippineCalendar",
    data() {
        return {
            currentDate: new Date(),
            selectedDay: null,
            showModal: false,
            daysOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            tasksByDay: {}, // Store tasks by date string (YYYY-MM-DD)
            holidays: [
                {
                    date: "January 1",
                    name: "New Year's Day",
                    type: "Regular Holiday",
                    description: "A public holiday marking the start of a new year according to the Gregorian calendar."
                },
                {
                    date: "January 2",
                    name: "Special Working Holiday",
                    type: "Special Working",
                    description: "Additional holiday to create a long weekend."
                },
                {
                    date: "January 23",
                    name: "First Philippine Republic Day",
                    type: "Special Working",
                    description: "Commemorates the establishment of the First Philippine Republic in 1899."
                },
                {
                    date: "February 25",
                    name: "EDSA People Power Revolution",
                    type: "Special Non-Working",
                    description: "Commemorates the People Power Revolution of 1986 that peacefully overthrew President Ferdinand Marcos."
                },
                {
                    date: "April 6",
                    name: "Maundy Thursday",
                    type: "Regular Holiday",
                    description: "Christian holiday commemorating the Last Supper of Jesus Christ with the Apostles."
                },
                {
                    date: "April 7",
                    name: "Good Friday",
                    type: "Regular Holiday",
                    description: "Christian holiday commemorating the crucifixion of Jesus Christ."
                },
                {
                    date: "April 8",
                    name: "Black Saturday",
                    type: "Special Non-Working",
                    description: "Christian holiday preceding Easter Sunday."
                },
                {
                    date: "April 9",
                    name: "Araw ng Kagitingan",
                    type: "Regular Holiday",
                    description: "Day of Valor, commemorating the fall of Bataan during World War II."
                },
                {
                    date: "May 1",
                    name: "Labor Day",
                    type: "Regular Holiday",
                    description: "Honors the contributions of workers to society."
                },
                {
                    date: "June 12",
                    name: "Independence Day",
                    type: "Regular Holiday",
                    description: "Commemorates the Philippine Declaration of Independence from Spain in 1898."
                },
                {
                    date: "July 6",
                    name: "Eid'l Adha",
                    type: "Regular Holiday",
                    description: "Islamic holiday, the Feast of Sacrifice."
                },
                {
                    date: "August 21",
                    name: "Ninoy Aquino Day",
                    type: "Special Non-Working",
                    description: "Commemorates the assassination of Senator Benigno Aquino Jr."
                },
                {
                    date: "August 28",
                    name: "National Heroes Day",
                    type: "Regular Holiday",
                    description: "Honors and remembers all Philippine national heroes."
                },
                {
                    date: "September 3",
                    name: "Surrender of Gen. Yamashita",
                    type: "Special Working",
                    description: "Commemorates the surrender of Japanese General Tomoyuki Yamashita in 1945."
                },
                {
                    date: "November 1",
                    name: "All Saints' Day",
                    type: "Special Non-Working",
                    description: "Christian feast day honoring all saints."
                },
                {
                    date: "November 2",
                    name: "All Souls' Day",
                    type: "Special Non-Working",
                    description: "Christian feast day for commemorating the faithful departed."
                },
                {
                    date: "November 30",
                    name: "Bonifacio Day",
                    type: "Regular Holiday",
                    description: "Honors Andrés Bonifacio, a Filipino revolutionary leader."
                },
                {
                    date: "December 8",
                    name: "Feast of the Immaculate Conception",
                    type: "Special Non-Working",
                    description: "Catholic feast day celebrating the Immaculate Conception of the Virgin Mary."
                },
                {
                    date: "December 24",
                    name: "Christmas Eve",
                    type: "Special Non-Working",
                    description: "Day before Christmas Day."
                },
                {
                    date: "December 25",
                    name: "Christmas Day",
                    type: "Regular Holiday",
                    description: "Christian holiday celebrating the birth of Jesus Christ."
                },
                {
                    date: "December 30",
                    name: "Rizal Day",
                    type: "Regular Holiday",
                    description: "Commemorates the execution of José Rizal, a Philippine national hero."
                },
                {
                    date: "December 31",
                    name: "New Year's Eve",
                    type: "Special Non-Working",
                    description: "Last day of the year according to the Gregorian calendar."
                },
            ]
        };
    },
    computed: {
        currentYear() {
            return this.currentDate.getFullYear();
        },
        currentMonth() {
            return this.currentDate.getMonth();
        },
        currentMonthName() {
            return new Date(this.currentYear, this.currentMonth, 1).toLocaleString('default', { month: 'long' });
        },
        calendarDays() {
            return this.generateCalendarDays();
        },
        currentMonthHolidays() {
            return this.holidays.filter(holiday => {
                const holidayDate = this.parseHolidayDate(holiday.date);
                return holidayDate.getMonth() === this.currentMonth;
            }).sort((a, b) => {
                const dateA = this.parseHolidayDate(a.date).getDate();
                const dateB = this.parseHolidayDate(b.date).getDate();
                return dateA - dateB;
            });
        }
    },
    methods: {
        parseHolidayDate(dateStr) {
            const [month, day] = dateStr.split(' ');
            const monthIndex = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ].indexOf(month);
            return new Date(this.currentYear, monthIndex, parseInt(day));
        },

        formatDate(date) {
            if (!date) return '';
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },

        generateCalendarDays() {
            const days = [];
            const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
            const lastDayOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
            const firstDayWeekday = firstDayOfMonth.getDay();
            const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();

            // Previous month days
            for (let i = firstDayWeekday - 1; i >= 0; i--) {
                const dayNumber = prevMonthLastDay - i;
                const fullDate = new Date(this.currentYear, this.currentMonth - 1, dayNumber);
                const dateKey = fullDate.toISOString().split('T')[0];
                days.push({
                    date: dayNumber,
                    fullDate: fullDate,
                    isCurrentMonth: false,
                    isToday: this.isToday(fullDate),
                    holiday: this.getHolidayForDate(fullDate),
                    tasks: this.tasksByDay[dateKey] || []
                });
            }

            // Current month days
            for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
                const fullDate = new Date(this.currentYear, this.currentMonth, i);
                const dateKey = fullDate.toISOString().split('T')[0];
                days.push({
                    date: i,
                    fullDate: fullDate,
                    isCurrentMonth: true,
                    isToday: this.isToday(fullDate),
                    holiday: this.getHolidayForDate(fullDate),
                    tasks: this.tasksByDay[dateKey] || []
                });
            }

            // Next month days
            const daysNeeded = 42 - days.length;
            for (let i = 1; i <= daysNeeded; i++) {
                const fullDate = new Date(this.currentYear, this.currentMonth + 1, i);
                const dateKey = fullDate.toISOString().split('T')[0];
                days.push({
                    date: i,
                    fullDate: fullDate,
                    isCurrentMonth: false,
                    isToday: this.isToday(fullDate),
                    holiday: this.getHolidayForDate(fullDate),
                    tasks: this.tasksByDay[dateKey] || []
                });
            }

            return days;
        },

        isToday(date) {
            const today = new Date();
            return date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
        },

        getHolidayForDate(date) {
            const month = date.toLocaleString('default', { month: 'long' });
            const day = date.getDate();
            const dateString = `${month} ${day}`;
            return this.holidays.find(holiday => holiday.date === dateString) || null;
        },

        prevMonth() {
            this.currentDate = new Date(this.currentYear, this.currentMonth - 1, 1);
            this.closeModal();
        },

        nextMonth() {
            this.currentDate = new Date(this.currentYear, this.currentMonth + 1, 1);
            this.closeModal();
        },

        selectDay(day) {
            this.selectedDay = { ...day, tasks: [...(day.tasks || [])] };
            this.showModal = true;
        },

        selectHoliday(holiday) {
            const holidayDate = this.parseHolidayDate(holiday.date);
            const holidayDay = this.calendarDays.find(day =>
                day.fullDate.getDate() === holidayDate.getDate() &&
                day.fullDate.getMonth() === holidayDate.getMonth()
            );
            if (holidayDay) {
                this.selectDay(holidayDay);
            }
        },

        closeModal() {
            this.showModal = false;
            this.selectedDay = null;
        },

        addTask() {
            if (!this.selectedDay.tasks) {
                this.selectedDay.tasks = [];
            }
            this.selectedDay.tasks.push('');
            this.updateTasksInStorage();
        },

        updateTask(day, index) {
            if (this.selectedDay.tasks[index].trim() === '') {
                this.removeTask(index);
            } else {
                this.updateTasksInStorage();
            }
        },

        removeTask(index) {
            this.selectedDay.tasks.splice(index, 1);
            this.updateTasksInStorage();
        },

        updateTasksInStorage() {
            const dateKey = this.selectedDay.fullDate.toISOString().split('T')[0];
            this.$set(this.tasksByDay, dateKey, [...this.selectedDay.tasks]);
            this.$forceUpdate();
        },

        handleEscape(e) {
            if (e.key === 'Escape' && this.showModal) {
                this.closeModal();
            }
        }
    },
    mounted() {
        document.addEventListener('keydown', this.handleEscape);
    },
    beforeUnmount() {
        document.removeEventListener('keydown', this.handleEscape);
    }
};
</script>

<style scoped>
/* Styles remain unchanged from your previous version */
.calendar-wrapper {
    max-width: 1000px;
    margin: 0 auto;
    font-family: 'Roboto', Arial, sans-serif;
    color: #333;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    padding: 20px;
    position: relative;
}

/* Calendar Header */
.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 10px 0;
    border-bottom: 2px solid #f0f0f0;
}

.calendar-header h2 {
    font-size: 24px;
    font-weight: 500;
    margin: 0;
    color: #2c3e50;
}

.nav-button {
    background: #3498db;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: background 0.3s;
}

.nav-button:hover {
    background: #2980b9;
}

/* Calendar Grid */
.calendar {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 5px;
    margin-bottom: 20px;
}

.calendar-cell {
    aspect-ratio: 1/1;
    border: 1px solid #e0e0e0;
    padding: 10px;
    text-align: center;
    border-radius: 5px;
    position: relative;
    transition: transform 0.2s, box-shadow 0.2s;
}

.calendar-cell:not(.day-name) {
    cursor: pointer;
}

.calendar-cell:hover:not(.day-name) {
    transform: translateY(-3px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
}

.day-name {
    font-weight: bold;
    color: #7f8c8d;
    background-color: #f7f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
}

.date-number {
    font-size: 18px;
    font-weight: 500;
}

.other-month {
    opacity: 0.4;
}

.today {
    background-color: #e8f4f8;
    border: 2px solid #3498db;
    font-weight: bold;
}

.has-holiday {
    position: relative;
}

.has-tasks {
    background-color: #f0f8ff;
}

.holiday-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 6px;
}

.holiday-indicator.regular-holiday {
    background-color: #e74c3c;
}

.holiday-indicator.special-working {
    background-color: #f39c12;
}

.holiday-indicator.special-non-working {
    background-color: #9b59b6;
}

.task-indicator {
    position: absolute;
    bottom: 5px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: #4682b4;
    background: rgba(255, 255, 255, 0.8);
    padding: 2px 5px;
    border-radius: 10px;
}

/* Monthly Holidays */
.monthly-holidays {
    margin-top: 30px;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 10px;
}

.monthly-holidays h3 {
    color: #2c3e50;
    margin-top: 0;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 10px;
}

.holiday-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 10px;
}

.holiday-item {
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    cursor: pointer;
    transition: transform 0.2s;
    display: flex;
    align-items: center;
    position: relative;
    overflow: hidden;
}

.holiday-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
}

.holiday-item:before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 5px;
}

.holiday-item.regular-holiday:before {
    background-color: #e74c3c;
}

.holiday-item.special-working:before {
    background-color: #f39c12;
}

.holiday-item.special-non-working:before {
    background-color: #9b59b6;
}

.holiday-date-small {
    font-weight: bold;
    margin-right: 15px;
    min-width: 30px;
    text-align: center;
}

.holiday-name-small {
    font-weight: 400;
}

/* Modal Popup */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

.modal-content {
    background-color: white;
    width: 90%;
    max-width: 600px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    position: relative;
    overflow: hidden;
    animation: slideIn 0.3s ease-out;
    display: flex;
    flex-direction: column;
}

@keyframes slideIn {
    from {
        transform: translateY(50px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.modal-content.has-holiday:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 8px;
}

.modal-content.has-holiday.regular-holiday:before {
    background-color: #e74c3c;
}

.modal-content.has-holiday.special-working:before {
    background-color: #f39c12;
}

.modal-content.has-holiday.special-non-working:before {
    background-color: #9b59b6;
}

.close-button {
    position: absolute;
    top: 15px;
    right: 15px;
    background: rgba(0, 0, 0, 0.1);
    border: none;
    color: #333;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s;
}

.close-button:hover {
    background: rgba(0, 0, 0, 0.2);
}

.modal-header {
    padding: 25px 25px 15px;
}

.date-header {
    color: #7f8c8d;
    font-size: 16px;
    margin-bottom: 10px;
}

.holiday-section {
    margin-top: 10px;
}

.modal-body {
    padding: 0 25px 25px;
}

.holiday-info-section {
    margin-bottom: 20px;
}

.holiday-date {
    color: #7f8c8d;
    font-size: 14px;
}

.holiday-name {
    font-size: 24px;
    margin: 10px 0;
    color: #2c3e50;
}

.holiday-badge {
    display: inline-block;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    margin-bottom: 15px;
}

.holiday-badge.regular-holiday {
    background-color: #e74c3c;
}

.holiday-badge.special-working {
    background-color: #f39c12;
}

.holiday-badge.special-non-working {
    background-color: #9b59b6;
}

.holiday-description {
    color: #34495e;
    line-height: 1.6;
    margin-bottom: 20px;
}

.holiday-info {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
}

.info-item {
    margin-bottom: 10px;
}

.info-item:last-child {
    margin-bottom: 0;
}

.tasks-section {
    margin-top: 20px;
}

.tasks-section h4 {
    color: #2c3e50;
    margin-bottom: 10px;
}

.task-list {
    max-height: 200px;
    overflow-y: auto;
    margin-bottom: 15px;
}

.task-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.task-input {
    flex: 1;
    padding: 8px;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    margin-right: 10px;
    font-size: 14px;
}

.task-input:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
}

.remove-task {
    background: #e74c3c;
    color: white;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.remove-task:hover {
    background: #c0392b;
}

.add-task-btn {
    background: #3498db;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.3s;
}

.add-task-btn:hover {
    background: #2980b9;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
    .calendar-cell {
        padding: 5px;
    }

    .date-number {
        font-size: 14px;
    }

    .holiday-list {
        grid-template-columns: 1fr;
    }

    .modal-content {
        width: 95%;
        max-height: 80vh;
        overflow-y: auto;
    }
}
</style>