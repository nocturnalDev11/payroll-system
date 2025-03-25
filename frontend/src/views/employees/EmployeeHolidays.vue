<template>
    <div class="employee-holidays">
        <div class="header-container">
            <!-- Month Navigation -->
            <div class="month-navigation">
                <button @click="prevMonth" :disabled="currentMonthIndex === 0">◀ Prev</button>
                <div class="month-column">
                    <span>{{ months[currentMonthIndex] }}</span>
                </div>
                <button @click="nextMonth" :disabled="currentMonthIndex === months.length - 1">Next ▶</button>
            </div>
        </div>

        <!-- Holiday Boxes -->
        <div class="holidays-container">
            <h2>{{ months[currentMonthIndex] }} Holidays</h2>
            <div v-if="filteredHolidays.length > 0" class="holiday-grid">
                <div v-for="(holiday, index) in filteredHolidays" :key="index" class="holiday-box">
                    <strong>{{ holiday.date }}</strong>
                    <p>{{ holiday.name }}</p>
                    <span :class="holiday.type === 'Regular Holiday' ? 'holiday-type regular' : 'holiday-type special'">
                        {{ holiday.type }}
                    </span>
                </div>
            </div>
            <p v-else>No holidays this month.</p>
        </div>
    </div>
</template>

<script>
export default {
    name: "EmployeeHolidays",
    data() {
        return {
            currentMonthIndex: new Date().getMonth(),
            months: [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ],
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
        };
    },
    computed: {
        filteredHolidays() {
            return this.holidays.filter(h => h.monthIndex === this.currentMonthIndex);
        }
    },
    methods: {
        prevMonth() {
            if (this.currentMonthIndex > 0) {
                this.currentMonthIndex--;
            }
        },
        nextMonth() {
            if (this.currentMonthIndex < this.months.length - 1) {
                this.currentMonthIndex++;
            }
        }
    }
};
</script>

<style scoped>
.employee-holidays {
    text-align: left;
    padding: 20px;
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

/* Header Container */
.header-container {
    display: flex;
    justify-content: flex-start;
    /* Move to the left */
    align-items: center;
    margin-bottom: 20px;
    width: 100%;
}

/* Month Navigation */
.month-navigation {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    /* Move buttons to the left */
}

.month-navigation button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 15px;
    margin: 0 10px;
    cursor: pointer;
    border-radius: 5px;
    font-size: 16px;
}

.month-navigation button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

/* Month Column */
.month-column {
    background: #f0f0f0;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 18px;
    font-weight: bold;
    min-width: 120px;
    text-align: center;
    margin: 0 10px;
}

/* Holiday Containers */
.holidays-container {
    border: 1px solid #ddd;
    padding: 20px;
    border-radius: 8px;
    background-color: #f9f9f9;
    width: 80%;
    margin-left: 0;
    /* Align to left */
}


/* Holiday Grid */
.holiday-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-top: 20px;
}

/* Individual Holiday Boxes */
.holiday-box {
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    text-align: center;
    transition: transform 0.2s ease-in-out;
}

/* .holiday-box:hover {
  transform: scale(1.05);
} */

.holiday-box strong {
    font-size: 18px;
    color: #007bff;
}

.holiday-box p {
    font-size: 16px;
    margin: 5px 0;
}

/* Holiday Type Styling */
.holiday-type {
    font-size: 14px;
    color: #fff;
    padding: 5px 10px;
    border-radius: 15px;
    display: inline-block;
    margin-top: 5px;
}

.holiday-type.regular {
    background: #28a745;
}

.holiday-type.special {
    background: #ff5733;
}
</style>
