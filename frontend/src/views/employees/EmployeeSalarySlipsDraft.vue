<template>
    <div class="min-h-screen p-4">
        <div class="max-w-5xl mx-auto">
            <!-- Header -->
            <div class="bg-white rounded-lg shadow-sm p-4 mb-4 flex justify-between items-center">
                <h1 class="text-lg font-medium text-gray-800 flex items-center gap-1">
                    <span class="material-icons text-sm">history</span>
                    My Payslip History
                </h1>
                <button @click="generatePayslipNow"
                    class="flex items-center justify-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 px-4 rounded-md"
                    :disabled="isLoading || payslipGenerationStatus.generating">
                    <span class="material-icons text-sm">play_arrow</span>
                    {{ payslipGenerationStatus.generating ? 'Generating...' : 'Generate Now' }}
                </button>
            </div>

            <!-- Payslip List -->
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">Pay Date</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">Position</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">Salary</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">Action</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="payslip in sortedPayslips" :key="`${payslip.salaryMonth}-${payslip.paydayType}`"
                                class="hover:bg-blue-50 cursor-pointer"
                                :class="{ 'bg-blue-100': selectedPayslip?.salaryMonth === payslip.salaryMonth && selectedPayslip?.paydayType === payslip.paydayType }"
                                @click="selectPayslip(payslip)">
                                <td class="px-4 py-3 text-sm text-gray-900">
                                    {{ payslip.paydayType === 'mid-month' ? payslip.expectedPaydays.midMonthPayday :
                                        payslip.expectedPaydays.endMonthPayday }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-500">{{ payslip.position || 'N/A' }}</td>
                                <td class="px-4 py-3 text-sm text-gray-500">₱{{ payslip.salary.toLocaleString() }}</td>
                                <td class="px-4 py-3 text-sm text-gray-500">{{ payslip.payslipDataUrl ? 'Generated' :
                                    'Pending' }}</td>
                                <td class="px-4 py-3">
                                    <button v-if="!payslip.payslipDataUrl" @click.stop="generatePayslip(payslip)"
                                        class="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                        :disabled="!canGeneratePayslip(payslip) || payslipGenerationStatus[`${payslip.salaryMonth}-${payslip.paydayType}`]?.generating">
                                        <span class="material-icons text-sm">description</span>
                                        {{
                                            payslipGenerationStatus[`${payslip.salaryMonth}-${payslip.paydayType}`]?.generating
                                                ? 'Generating...' : 'Generate' }}
                                    </button>
                                    <button v-else @click.stop="selectPayslip(payslip)"
                                        class="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                                        <span class="material-icons text-sm">visibility</span>
                                        View
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="payslipHistory.length === 0 && !isLoading">
                                <td colspan="5" class="px-4 py-8 text-center">
                                    <div class="flex flex-col items-center gap-2">
                                        <span class="material-icons text-gray-400 text-3xl">search_off</span>
                                        <p class="text-sm text-gray-500">No payslips found.</p>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="isLoading">
                                <td colspan="5" class="px-4 py-8 text-center">
                                    <div class="flex flex-col items-center gap-2">
                                        <span class="material-icons text-blue-500 animate-spin text-3xl">sync</span>
                                        <p class="text-sm text-gray-500">Loading payslips...</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Payslip Preview Modal -->
            <Modal :show="!!selectedPayslip" @close="selectedPayslip = null" max-width="lg" max-height="80vh">
                <div class="p-4">
                    <div v-if="selectedPayslip && selectedPayslip.payslipDataUrl">
                        <h3 class="text-sm font-medium text-gray-700 mb-2">Payslip Preview</h3>
                        <div class="mb-4">
                            <p class="text-sm text-gray-600">
                                Position: {{ selectedPayslip.position }} | Salary: ₱{{
                                    selectedPayslip.salary.toLocaleString() }}
                            </p>
                        </div>
                        <iframe :src="selectedPayslip.payslipDataUrl" class="w-full h-[50vh] rounded border mb-4"
                            @load="onIframeLoad" @error="onIframeError"></iframe>
                        <button @click="downloadPayslip"
                            class="flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded-md">
                            <span class="material-icons text-sm">download</span>
                            Download PDF
                        </button>
                        <div v-if="iframeError"
                            class="mt-3 p-3 bg-red-50 text-red-700 rounded text-sm flex items-center gap-1">
                            <span class="material-icons text-sm">error</span>
                            Error loading payslip. Please try again.
                        </div>
                    </div>
                    <div v-else-if="selectedPayslip" class="text-sm text-gray-500 text-center">
                        Payslip not yet generated.
                    </div>
                </div>
            </Modal>

            <!-- Toast Messages -->
            <div v-if="statusMessage" :class="[
                statusMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
                'fixed bottom-4 right-4 p-3 rounded shadow-lg z-50 flex items-center gap-1 animate-fade-in text-sm'
            ]">
                <span class="material-icons text-sm">
                    {{ statusMessage.includes('successfully') ? 'check_circle' : 'error' }}
                </span>
                {{ statusMessage }}
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import moment from 'moment';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';
import Modal from '@/components/Modal.vue';

applyPlugin(jsPDF);

export default {
    name: 'EmployeeSalarySlips',
    components: { Modal },
    data() {
        return {
            employee: null,
            payslipHistory: [],
            selectedPayslip: null,
            payslipGenerationStatus: { generating: false },
            isLoading: false,
            statusMessage: '',
            iframeError: false,
            currentDate: new Date().toISOString().split('T')[0],
            config: {
                minimumWage: 610,
                deMinimisLimit: 10000,
                regularHolidays: [],
                specialNonWorkingDays: [],
            },
        };
    },
    setup() {
        const authStore = useAuthStore();
        return { authStore };
    },
    computed: {
        sortedPayslips() {
            return [...this.payslipHistory].sort((a, b) => {
                const dateA = moment(a.payDate, 'YYYY-MM-DD');
                const dateB = moment(b.payDate, 'YYYY-MM-DD');
                return dateB - dateA; // Descending order
            });
        },
    },
    async created() {
        if (!this.authStore.isAuthenticated || this.authStore.userRole !== 'employee') {
            this.showErrorMessage('Please log in as an employee to access this page.');
            this.$router.push('/employee-login');
            return;
        }
        this.isLoading = true;
        try {
            await this.fetchEmployeeData();
            await this.fetchPayslips();
        } catch (error) {
            console.error('Error in created hook:', error);
            this.showErrorMessage('Failed to load payslips.');
        } finally {
            this.isLoading = false;
        }
    },
    methods: {
        async fetchEmployeeData() {
            const token = this.authStore.accessToken;
            const userId = this.authStore.employee?._id;
            if (!token || !userId) throw new Error('Authentication required');
            const response = await axios.get(`${BASE_API_URL}/api/employees/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'user-role': 'employee',
                    'user-id': userId,
                },
            });
            console.log('API Response:', response.data); // Debug raw response
            this.employee = {
                ...response.data,
                id: response.data._id,
                name: `${response.data.firstName} ${response.data.lastName}`.trim(),
                positionHistory: Array.isArray(response.data.positionHistory) && response.data.positionHistory.length > 0
                    ? response.data.positionHistory.map(history => ({
                        position: history.position || response.data.position || 'N/A', // Ensure position is set
                        salary: history.salary || response.data.salary || 0,
                        startDate: history.startDate || response.data.hireDate || this.currentDate,
                        endDate: history.endDate || null,
                    }))
                    : [{
                        position: response.data.position || 'N/A', // Fallback to employee.position
                        salary: response.data.salary || 0,
                        startDate: response.data.hireDate || this.currentDate,
                        endDate: null,
                    }],
            };
            console.log('Processed Employee:', this.employee); // Debug processed employee
        },

        getActivePositionForDate(positionHistory, date) {
            console.log('Position History:', positionHistory); // Debug
            console.log('Target Date:', date); // Debug

            if (!Array.isArray(positionHistory) || positionHistory.length === 0) {
                console.warn('No position history, using fallback');
                return {
                    position: this.employee.position || 'N/A',
                    salary: this.employee.salary || 0,
                    startDate: this.employee.hireDate || this.currentDate,
                };
            }

            const targetDate = moment(date);
            const sortedHistory = [...positionHistory].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

            const activePosition = sortedHistory.find(history => {
                const startDate = moment(history.startDate);
                const endDate = history.endDate ? moment(history.endDate) : moment('9999-12-31');
                const isActive = targetDate.isSameOrAfter(startDate, 'day') && targetDate.isSameOrBefore(endDate, 'day');
                console.log(`Checking history: Start ${startDate.format('YYYY-MM-DD')}, End ${endDate.format('YYYY-MM-DD')}, Active: ${isActive}`); // Debug
                return isActive;
            });

            const result = activePosition || sortedHistory[sortedHistory.length - 1] || {
                position: this.employee.position || 'N/A',
                salary: this.employee.salary || 0,
                startDate: this.employee.hireDate || this.currentDate,
            };
            console.log('Selected Active Position:', result); // Debug
            return result;
        },

        async fetchPayslips() {
            const token = this.authStore.accessToken;
            const userId = this.authStore.employee?._id;
            if (!token || !userId) throw new Error('Authentication required');

            const today = moment(this.currentDate);
            const hireDate = moment(this.employee.hireDate || this.currentDate);
            let backendPayslips = [];
            try {
                const response = await axios.get(`${BASE_API_URL}/api/payslips/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'employee',
                        'user-id': userId,
                    },
                });
                backendPayslips = response.data || [];
            } catch (error) {
                console.error('Error fetching payslips:', error);
            }

            const payslipHistory = [];
            let currentDate = hireDate.clone().startOf('month');

            while (currentDate.isSameOrBefore(today, 'day')) {
                const salaryMonth = currentDate.format('YYYY-MM');
                const expectedPaydays = this.getExpectedPayday(hireDate.toDate(), salaryMonth);

                const midMonthDate = moment(`${salaryMonth}-15`, 'YYYY-MM-DD');
                if (midMonthDate.isSameOrAfter(hireDate, 'day')) {
                    const midPosition = this.getActivePositionForDate(this.employee.positionHistory, midMonthDate);
                    console.log('Mid-month position:', midPosition); // Debug
                    const midPayslip = backendPayslips.find(p => p.salaryMonth === salaryMonth && p.paydayType === 'mid-month') || {};
                    payslipHistory.push({
                        salaryMonth,
                        paydayType: 'mid-month',
                        payDate: midMonthDate.format('YYYY-MM-DD'),
                        position: midPosition.position,
                        salary: midPosition.salary,
                        totalSalary: midPayslip.salary ? this.calculateNetSalary({
                            ...this.employee,
                            position: midPosition.position,
                            salary: midPosition.salary,
                            salaryMonth
                        }) : null,
                        payslipDataUrl: midPayslip.payslipData ? `data:application/pdf;base64,${midPayslip.payslipData}` : null,
                        employee: { ...this.employee, position: midPosition.position, salary: midPosition.salary, salaryMonth },
                        expectedPaydays,
                    });
                }

                const endMonthDate = moment(salaryMonth).endOf('month');
                if (endMonthDate.isSameOrAfter(hireDate, 'day')) {
                    const endPosition = this.getActivePositionForDate(this.employee.positionHistory, endMonthDate);
                    console.log('End-month position:', endPosition); // Debug
                    const endPayslip = backendPayslips.find(p => p.salaryMonth === salaryMonth && p.paydayType === 'end-of-month') || {};
                    payslipHistory.push({
                        salaryMonth,
                        paydayType: 'end-of-month',
                        payDate: endMonthDate.format('YYYY-MM-DD'),
                        position: endPosition.position,
                        salary: endPosition.salary,
                        totalSalary: endPayslip.salary ? this.calculateNetSalary({
                            ...this.employee,
                            position: endPosition.position,
                            salary: endPosition.salary,
                            salaryMonth
                        }) : null,
                        payslipDataUrl: endPayslip.payslipData ? `data:application/pdf;base64,${endPayslip.payslipData}` : null,
                        employee: { ...this.employee, position: endPosition.position, salary: endPosition.salary, salaryMonth },
                        expectedPaydays,
                    });
                }

                currentDate.add(15, 'days').startOf('day');
                if (currentDate.date() > 15) {
                    currentDate.startOf('month').add(1, 'month');
                }
            }

            this.payslipHistory = payslipHistory;
            // Remove automatic selection of selectedPayslip
            // this.selectedPayslip = payslipHistory.find(p => p.payslipDataUrl) || null;

            for (const payslip of payslipHistory) {
                if (!payslip.payslipDataUrl && today.isSameOrAfter(moment(payslip.payDate), 'day')) {
                    await this.generatePayslip(payslip);
                }
            }
        },

        async generatePayslipNow() {
            this.payslipGenerationStatus.generating = true;
            try {
                const today = moment(this.currentDate);
                const salaryMonth = today.format('YYYY-MM');
                const lastDayOfMonth = today.clone().endOf('month').date();
                const payDate = today.isBefore(moment(`${salaryMonth}-15`, 'YYYY-MM-DD').endOf('day'))
                    ? moment(`${salaryMonth}-15`, 'YYYY-MM-DD')
                    : moment(`${salaryMonth}-${lastDayOfMonth}`, 'YYYY-MM-DD');
                const activePosition = this.getActivePositionForDate(this.employee.positionHistory, payDate);
                if (!activePosition || !activePosition.position || activePosition.salary === undefined) {
                    this.showErrorMessage('No valid position for current date.');
                    return;
                }
                const updatedEmployee = { ...this.employee, position: activePosition.position, salary: activePosition.salary };
                const expectedPaydays = this.getExpectedPayday(this.employee.hireDate, salaryMonth);

                const paydayType = payDate.date() === 15 ? 'mid-month' : 'end-of-month';
                const employeeSalaryMonth = `${salaryMonth}-${paydayType === 'mid-month' ? '15' : lastDayOfMonth}`;

                let payslipData = {
                    salaryMonth,
                    paydayType,
                    payDate: payDate.format('YYYY-MM-DD'),
                    position: activePosition.position,
                    salary: activePosition.salary,
                    employee: { ...updatedEmployee, salaryMonth: employeeSalaryMonth },
                    expectedPaydays,
                };

                const pdfPayslipData = this.createPayslipData(payslipData.employee);
                const pdfBlob = await this.generatePdf(pdfPayslipData);
                const url = URL.createObjectURL(pdfBlob);
                const base64Data = await this.blobToBase64(pdfBlob);

                const payload = {
                    employeeId: this.employee.id,
                    empNo: String(this.employee.empNo),
                    payslipData: base64Data.split(',')[1],
                    salaryMonth: payslipData.salaryMonth,
                    paydayType: payslipData.paydayType,
                    position: activePosition.position,
                    salary: Number(activePosition.salary),
                    payDate: payDate.format('YYYY-MM-DD'),
                };

                const token = this.authStore.accessToken;
                if (!token) throw new Error('No authentication token available');

                const response = await axios.post(`${BASE_API_URL}/api/payslips/generate`, payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'employee',
                        'user-id': this.employee.id,
                    },
                });

                if (response.status === 201 || response.status === 200) {
                    payslipData.payslipDataUrl = url;
                    payslipData.totalSalary = this.calculateNetSalary(payslipData.employee);
                    const existingPayslipIndex = this.payslipHistory.findIndex(p =>
                        p.salaryMonth === payslipData.salaryMonth && p.paydayType === payslipData.paydayType
                    );
                    if (existingPayslipIndex !== -1) {
                        this.payslipHistory[existingPayslipIndex] = payslipData;
                    } else {
                        this.payslipHistory.push(payslipData);
                    }
                    this.selectedPayslip = payslipData;
                    this.showSuccessMessage(`Payslip generated for ${payslipData.paydayType === 'mid-month' ? expectedPaydays.midMonthPayday : expectedPaydays.endMonthPayday}!`);
                }
            } catch (error) {
                console.error('Error generating payslip now:', error);
                this.showErrorMessage(`Failed to generate payslip: ${error.message}`);
            } finally {
                this.payslipGenerationStatus.generating = false;
            }
        },
        canGeneratePayslip(payslip) {
            const today = moment(this.currentDate);
            const payDate = moment(payslip.paydayType === 'mid-month' ? payslip.expectedPaydays.midMonthPayday : payslip.expectedPaydays.endMonthPayday, 'D MMMM YYYY');
            return today.isSameOrAfter(payDate, 'day') && !payslip.payslipDataUrl;
        },
        async generatePayslip(payslip) {
            const employee = payslip.employee;
            const payDate = moment(payslip.payDate, 'YYYY-MM-DD');
            const activePosition = this.getActivePositionForDate(employee.positionHistory, payDate);
            const updatedEmployee = { ...employee, position: activePosition.position, salary: activePosition.salary };

            const key = `${payslip.salaryMonth}-${payslip.paydayType}`;
            this.payslipGenerationStatus[key] = { generating: true };

            try {
                const payslipData = this.createPayslipData(updatedEmployee);
                const pdfBlob = await this.generatePdf(payslipData);
                const base64Data = await this.blobToBase64(pdfBlob);
                const url = URL.createObjectURL(pdfBlob);

                // Log activePosition to ensure position and salary are valid
                console.log('Active Position:', activePosition);

                // Construct payload
                const payload = {
                    employeeId: employee.id,
                    empNo: String(employee.empNo), // Ensure empNo is a string
                    payslipData: base64Data.split(',')[1],
                    salaryMonth: payslip.salaryMonth,
                    paydayType: payslip.paydayType,
                    position: activePosition.position || 'N/A', // Fallback if position is undefined
                    salary: Number(activePosition.salary) || 0, // Ensure salary is a number, fallback to 0
                    payDate: payDate.format('YYYY-MM-DD'),
                };

                // Log payload to debug
                console.log('Payload for POST:', payload);

                const token = this.authStore.accessToken;
                if (!token) throw new Error('No authentication token available');

                const response = await axios.post(`${BASE_API_URL}/api/payslips/generate`, payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'employee',
                        'user-id': employee.id,
                    },
                });

                if (response.status === 201 || response.status === 200) {
                    payslip.payslipDataUrl = url;
                    payslip.position = activePosition.position;
                    payslip.salary = activePosition.salary;
                    payslip.totalSalary = this.calculateNetSalary(updatedEmployee);
                    this.payslipHistory = this.payslipHistory.map(p =>
                        p.salaryMonth === payslip.salaryMonth && p.paydayType === payslip.paydayType ? payslip : p
                    );
                    this.selectedPayslip = payslip;
                    this.showSuccessMessage(`Payslip generated for ${payslip.paydayType === 'mid-month' ? payslip.expectedPaydays.midMonthPayday : payslip.expectedPaydays.endMonthPayday}!`);
                }
            } catch (error) {
                console.error('Error generating payslip:', error.response?.data || error.message);
                this.showErrorMessage(`Failed to generate payslip: ${error.response?.data?.message || error.message}`);
            } finally {
                this.payslipGenerationStatus[key] = { generating: false };
            }
        },

        getActivePositionForDate(positionHistory, date) {
            console.log('Position History:', positionHistory); // Debug
            console.log('Target Date:', date); // Debug

            if (!Array.isArray(positionHistory) || positionHistory.length === 0) {
                console.warn('No position history, using fallback');
                return {
                    position: this.employee.position || 'N/A',
                    salary: this.employee.salary || 0,
                    startDate: this.employee.hireDate || this.currentDate,
                };
            }

            const targetDate = moment(date);
            const sortedHistory = [...positionHistory].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

            const activePosition = sortedHistory.find(history => {
                const startDate = moment(history.startDate);
                const endDate = history.endDate ? moment(history.endDate) : moment('9999-12-31');
                const isActive = targetDate.isSameOrAfter(startDate, 'day') && targetDate.isSameOrBefore(endDate, 'day');
                console.log(`Checking history: Start ${startDate.format('YYYY-MM-DD')}, End ${endDate.format('YYYY-MM-DD')}, Active: ${isActive}`); // Debug
                return isActive;
            });

            const result = activePosition || sortedHistory[sortedHistory.length - 1] || {
                position: this.employee.position || 'N/A',
                salary: this.employee.salary || 0,
                startDate: this.employee.hireDate || this.currentDate,
            };
            console.log('Selected Active Position:', result); // Debug
            return result;
        },

        async generatePayslip(payslip) {
            const employee = payslip.employee;
            const payDate = moment(payslip.payDate, 'YYYY-MM-DD');
            const activePosition = this.getActivePositionForDate(employee.positionHistory, payDate);
            const updatedEmployee = { ...employee, position: activePosition.position, salary: activePosition.salary };

            const key = `${payslip.salaryMonth}-${payslip.paydayType}`;
            this.payslipGenerationStatus[key] = { generating: true };

            try {
                const payslipData = this.createPayslipData(updatedEmployee);
                const pdfBlob = await this.generatePdf(payslipData);
                const base64Data = await this.blobToBase64(pdfBlob);
                const url = URL.createObjectURL(pdfBlob);

                const payload = {
                    employeeId: employee.id,
                    empNo: String(employee.empNo),
                    payslipData: base64Data.split(',')[1],
                    salaryMonth: payslip.salaryMonth,
                    paydayType: payslip.paydayType,
                    position: activePosition.position || 'N/A',
                    salary: Number(activePosition.salary) || 0,
                    payDate: payDate.format('YYYY-MM-DD'),
                };

                console.log('Payload for POST:', payload); // Debug

                const token = this.authStore.accessToken;
                if (!token) throw new Error('No authentication token available');

                const response = await axios.post(`${BASE_API_URL}/api/payslips/generate`, payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'employee',
                        'user-id': employee.id,
                    },
                });

                if (response.status === 201 || response.status === 200) {
                    payslip.payslipDataUrl = url;
                    payslip.position = activePosition.position;
                    payslip.salary = activePosition.salary;
                    payslip.totalSalary = this.calculateNetSalary(updatedEmployee);
                    this.payslipHistory = this.payslipHistory.map(p =>
                        p.salaryMonth === payslip.salaryMonth && p.paydayType === payslip.paydayType ? payslip : p
                    );
                    this.selectedPayslip = payslip;
                    this.showSuccessMessage(`Payslip generated for ${payslip.paydayType === 'mid-month' ? payslip.expectedPaydays.midMonthPayday : payslip.expectedPaydays.endMonthPayday}!`);
                }
            } catch (error) {
                console.error('Error generating payslip:', error.response?.data || error.message);
                this.showErrorMessage(`Failed to generate payslip: ${error.response?.data?.message || error.message}`);
            } finally {
                this.payslipGenerationStatus[key] = { generating: false };
            }
        },
        getExpectedPayday(hireDate, salaryMonth) {
            const [year, month] = salaryMonth.split('-').map(part => parseInt(part, 10));
            const lastDay = new Date(year, month, 0).getDate();
            let midMonth = new Date(year, month - 1, 15);
            let endMonth = new Date(year, month - 1, lastDay);

            const hireMoment = moment(hireDate);
            const monthStart = moment(`${year}-${month}-01`, 'YYYY-MM-DD');

            if (hireMoment.isAfter(monthStart)) {
                if (hireMoment.isAfter(moment(midMonth))) midMonth = hireMoment.toDate();
                if (hireMoment.isAfter(moment(endMonth))) endMonth = hireMoment.toDate();
            }

            const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;
            while (isWeekend(midMonth)) midMonth.setDate(midMonth.getDate() - 1);
            while (isWeekend(endMonth)) endMonth.setDate(endMonth.getDate() - 1);

            return {
                midMonthPayday: midMonth.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
                endMonthPayday: endMonth.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
            };
        },
        createPayslipData(employee) {
            const salaryDate = moment(employee.salaryMonth, 'YYYY-MM').format('MM/DD/YYYY');
            const basicSalary = employee.salary || 0;

            const sanitizedPayheads = Array.isArray(employee.payheads)
                ? employee.payheads.filter((ph) => ph && typeof ph === 'object' && 'type' in ph && 'name' in ph && 'amount' in ph)
                : [];

            const payheadDeductions = sanitizedPayheads
                .filter((ph) => ph.type === 'Deductions')
                .reduce((sum, ph) => sum + Number(ph.amount || 0), 0) || 0;

            const sss = this.calculateSSSContribution(basicSalary);
            const philhealth = this.calculatePhilHealthContribution(basicSalary);
            const pagibig = this.calculatePagIBIGContribution(basicSalary);
            const withholdingTax = this.calculateWithholdingTax(employee);
            const totalDeductions = sss + philhealth + pagibig + withholdingTax + payheadDeductions;
            const netSalary = (basicSalary - payheadDeductions) - (sss + philhealth + pagibig + withholdingTax);

            const earnings = sanitizedPayheads
                .filter((ph) => ph.type === 'Earnings')
                .map((ph) => ({ name: ph.name, amount: this.formatNumber(ph.amount) }));

            const deductions = sanitizedPayheads
                .filter((ph) => ph.type === 'Deductions')
                .map((ph) => ({ name: ph.name, amount: this.formatNumber(ph.amount) }));

            return {
                salaryDate,
                empNo: employee.empNo || 'N/A',
                lastName: employee.lastName || 'N/A',
                middleName: employee.middleName || 'N/A',
                firstName: employee.firstName || 'N/A',
                birthDate: moment(employee.birthDate).isValid() ? moment(employee.birthDate).format('MM/DD/YYYY') : 'N/A',
                hireDate: moment(employee.hireDate).isValid() ? moment(employee.hireDate).format('MM/DD/YYYY') : 'N/A',
                civilStatus: employee.civilStatus || 'SINGLE',
                sss: employee.sss || 'N/A',
                tin: employee.tin || 'N/A',
                philhealth: employee.philhealth || 'N/A',
                pagibig: employee.pagibig || 'N/A',
                position: employee.position || 'N/A',
                basicSalary: this.formatNumber(basicSalary),
                totalDeductions: this.formatNumber(totalDeductions),
                netSalary: this.formatNumber(netSalary),
                sssDeduction: this.formatNumber(sss),
                philhealthDeduction: this.formatNumber(philhealth),
                pagibigDeduction: this.formatNumber(pagibig),
                withholdingTax: this.formatNumber(withholdingTax),
                payheads: sanitizedPayheads,
                earnings,
                deductions,
                paidLeavesDays: employee.paidLeaves?.days || 0,
                absencesDays: employee.absences?.days || 0,
                paidLeavesAmount: this.formatNumber(employee.paidLeaves?.amount || 0),
                absencesAmount: this.formatNumber(employee.absences?.amount ? -employee.absences.amount : 0),
            };
        },
        async generatePdf(payslipData) {
            const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [216, 279] });
            pdfDoc.setFont('Helvetica');

            const margin = 10;
            const pageWidth = pdfDoc.internal.pageSize.getWidth();
            const contentWidth = pageWidth - 2 * margin;
            const columnWidth = (contentWidth - 20) / 2;
            const lineHeight = 5;
            const pageHeight = pdfDoc.internal.pageSize.getHeight();

            function addText(doc, text, x, y, options = {}) {
                text = text?.toString() || 'N/A';
                text = text.replace('₱', 'P');
                doc.setFontSize(options.fontSize || 10);
                doc.setFont(options.font || 'Helvetica', options.fontStyle || 'normal');
                doc.setTextColor(...(options.textColor || [0, 0, 0]));
                doc.text(text, x, y, { align: options.align || 'left', maxWidth: options.maxWidth });
            }

            function addLabelValue(doc, label, value, x, y) {
                addText(doc, label, x, y, { fontSize: 9, fontStyle: 'bold' });
                addText(doc, value, x + 35, y, { fontSize: 9, maxWidth: columnWidth - 35 });
            }

            pdfDoc.setFillColor(0, 128, 0);
            pdfDoc.rect(margin, margin, contentWidth, 10, 'F');
            addText(pdfDoc, 'RIGHTJOB Solutions', margin + 5, margin + 7, {
                fontSize: 12,
                fontStyle: 'bold',
                textColor: [255, 255, 255],
            });
            addText(pdfDoc, 'PAYSLIP', margin + contentWidth / 2, margin + 7, {
                fontSize: 12,
                fontStyle: 'bold',
                textColor: [255, 255, 255],
                align: 'center',
            });

            let y = margin + 15;
            addText(pdfDoc, 'Salary Date:', margin + contentWidth - 40, y, { fontSize: 9 });
            addText(pdfDoc, payslipData.salaryDate, margin + contentWidth - 20, y, { fontSize: 9 });

            y += 10;
            addText(pdfDoc, 'Personal Information', margin, y, { fontSize: 11, fontStyle: 'bold' });
            y += lineHeight;
            const leftPersonalInfo = [
                ['Emp No.', payslipData.empNo],
                ['Last Name', payslipData.lastName],
                ['Middle Name', payslipData.middleName],
                ['First Name', payslipData.firstName],
                ['Birth Date', payslipData.birthDate],
                ['Hire Date', payslipData.hireDate],
                ['Position', payslipData.position],
                ['Basic Salary', `P${payslipData.basicSalary}`],
            ];
            leftPersonalInfo.forEach(([label, value], index) => {
                addLabelValue(pdfDoc, label, value, margin, y + index * lineHeight);
            });

            let yRight = y;
            addText(pdfDoc, 'Additional Info', margin + columnWidth + 10, yRight, { fontSize: 11, fontStyle: 'bold' });
            yRight += lineHeight;
            const rightPersonalInfo = [
                ['Civil Status', payslipData.civilStatus],
                ['SSS', payslipData.sss],
                ['TIN', payslipData.tin],
                ['Philhealth', payslipData.philhealth],
                ['PAG-IBIG', payslipData.pagibig],
            ];
            rightPersonalInfo.forEach(([label, value], index) => {
                addLabelValue(pdfDoc, label, value, margin + columnWidth + 10, yRight + index * lineHeight);
            });

            y = Math.max(y + leftPersonalInfo.length * lineHeight, yRight + rightPersonalInfo.length * lineHeight) + 10;

            addText(pdfDoc, 'Deductions', margin, y, { fontSize: 11, fontStyle: 'bold' });
            y += lineHeight;
            const leftDeductions = [
                ['SSS', `P${payslipData.sssDeduction}`],
                ['Philhealth', `P${payslipData.philhealthDeduction}`],
                ['PAG-IBIG', `P${payslipData.pagibigDeduction}`],
            ];
            const rightDeductions = [['Withholding Tax', `P${payslipData.withholdingTax}`]];
            leftDeductions.forEach(([label, value], index) => {
                addLabelValue(pdfDoc, label, value, margin, y + index * lineHeight);
            });
            rightDeductions.forEach(([label, value], index) => {
                addLabelValue(pdfDoc, label, value, margin + columnWidth + 10, y + index * lineHeight);
            });
            y += Math.max(leftDeductions.length, rightDeductions.length) * lineHeight + 5;

            addText(pdfDoc, 'Summary', margin, y, { fontSize: 11, fontStyle: 'bold' });
            y += lineHeight;
            addText(pdfDoc, 'Total Deductions:', margin, y, { fontSize: 9, fontStyle: 'bold' });
            addText(pdfDoc, `(P${payslipData.totalDeductions})`, margin + 35, y, { fontSize: 9 });
            addText(pdfDoc, 'Net Salary:', margin + columnWidth + 10, y, { fontSize: 9, fontStyle: 'bold' });
            addText(pdfDoc, `P${payslipData.netSalary}`, margin + columnWidth + 45, y, { fontSize: 9 });
            y += lineHeight + 10;

            addText(pdfDoc, 'Earnings', margin, y, { fontSize: 11, fontStyle: 'bold' });
            y += lineHeight;
            if (payslipData.earnings.length > 0) {
                const earningsTableData = payslipData.earnings.map((earning) => [
                    earning.name,
                    `P${earning.amount}`,
                ]);
                pdfDoc.autoTable({
                    startY: y,
                    head: [['Description', 'Amount']],
                    body: earningsTableData,
                    margin: { left: margin, right: margin },
                    styles: { fontSize: 9, cellPadding: 1.5 },
                    headStyles: { fillColor: [0, 128, 0], textColor: [255, 255, 255] },
                    columnStyles: {
                        0: { cellWidth: contentWidth * 0.7 },
                        1: { cellWidth: contentWidth * 0.3, halign: 'right' },
                    },
                });
                y = pdfDoc.lastAutoTable.finalY + 5;
            } else {
                addText(pdfDoc, 'None', margin, y, { fontSize: 9 });
                y += lineHeight + 5;
            }

            addText(pdfDoc, 'Other Deductions', margin, y, { fontSize: 11, fontStyle: 'bold' });
            y += lineHeight;
            if (payslipData.deductions.length > 0) {
                const deductionsTableData = payslipData.deductions.map((deduction) => [
                    deduction.name,
                    `P${deduction.amount}`,
                ]);
                pdfDoc.autoTable({
                    startY: y,
                    head: [['Description', 'Amount']],
                    body: deductionsTableData,
                    margin: { left: margin, right: margin },
                    styles: { fontSize: 9, cellPadding: 1.5 },
                    headStyles: { fillColor: [0, 128, 0], textColor: [255, 255, 255] },
                    columnStyles: {
                        0: { cellWidth: contentWidth * 0.7 },
                        1: { cellWidth: contentWidth * 0.3, halign: 'right' },
                    },
                });
                y = pdfDoc.lastAutoTable.finalY + 5;
            } else {
                addText(pdfDoc, 'None', margin, y, { fontSize: 9 });
                y += lineHeight + 5;
            }

            const footerY = pageHeight - margin - 5;
            if (y > footerY - 10) {
                pdfDoc.addPage();
                y = margin;
            }
            addText(pdfDoc, 'This is a computer-generated payslip; no signature required.', margin + contentWidth / 2, footerY, {
                fontSize: 8,
                align: 'center',
            });

            return pdfDoc.output('blob');
        },
        blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        },
        selectPayslip(payslip) {
            this.selectedPayslip = payslip;
            this.iframeError = false;
        },
        async downloadPayslip() {
            if (!this.selectedPayslip || !this.selectedPayslip.payslipDataUrl) return;
            try {
                const response = await fetch(this.selectedPayslip.payslipDataUrl);
                if (!response.ok) throw new Error('Failed to fetch payslip PDF');
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Payslip_${this.employee.name}_${this.selectedPayslip.paydayType === 'mid-month' ? this.selectedPayslip.expectedPaydays.midMonthPayday : this.selectedPayslip.expectedPaydays.endMonthPayday}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error downloading payslip:', error);
                this.showErrorMessage('Failed to download payslip.');
            }
        },
        formatNumber(value) {
            return Number(value || 0).toFixed(2);
        },
        calculateTotalEarnings(employee) {
            const baseEarnings = (employee.earnings?.travelExpenses || 0) + (employee.earnings?.otherEarnings || 0);
            const monthlySalary = employee.salary || 0;
            const holidayPay = this.calculateHolidayPay(employee) || 0;
            const overtimePay = this.calculateOvertimePay(employee) || 0;
            const payheadEarnings = this.calculatePayheadEarnings(employee.payheads) || 0;
            const taxableSupplementary = this.calculateSupplementaryIncome(employee)?.taxable || 0;
            return monthlySalary + baseEarnings + holidayPay + overtimePay + payheadEarnings + taxableSupplementary || 0;
        },
        calculatePayheadEarnings(payheads) {
            const sanitizedPayheads = Array.isArray(payheads)
                ? payheads.filter((p) => p && typeof p === 'object' && 'type' in p && 'amount' in p)
                : [];
            return sanitizedPayheads
                .filter((p) => p.type === 'Earnings')
                .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
        },
        calculatePayheadDeductions(payheads) {
            const sanitizedPayheads = Array.isArray(payheads)
                ? payheads.filter((p) => p && typeof p === 'object' && 'type' in p && 'amount' in p)
                : [];
            return sanitizedPayheads
                .filter((p) => p.type === 'Deductions')
                .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
        },
        calculateSupplementaryIncome(employee) {
            const commission = employee.commission || 0;
            const profitSharing = employee.profitSharing || 0;
            const fees = employee.fees || 0;
            const thirteenthMonthPay = employee.thirteenthMonthPay || 0;
            const hazardPay = employee.hazardPay || 0;
            const overtimePay = this.calculateOvertimePay(employee) || 0;
            const otherTaxable = employee.otherTaxable || 0;

            const totalSupplementary = commission + profitSharing + fees + thirteenthMonthPay + hazardPay + overtimePay + otherTaxable;
            const exemptThirteenthMonth = Math.min(thirteenthMonthPay, 90000) || 0;
            const taxableThirteenthMonth = Math.max(0, thirteenthMonthPay - 90000) || 0;

            const taxableSupplementaryIncome = commission + profitSharing + fees + taxableThirteenthMonth + hazardPay + overtimePay + otherTaxable;

            return {
                taxable: taxableSupplementaryIncome || 0,
                nonTaxable: exemptThirteenthMonth || 0,
                totalSupplementary: totalSupplementary || 0,
            };
        },
        calculateNonTaxableIncome(employee) {
            const isMWE = (employee.salary / 30) <= this.config.minimumWage;
            const basicSalaryMWE = isMWE ? employee.salary : 0;
            const holidayPayMWE = isMWE ? this.calculateHolidayPay(employee) : 0;
            const overtimePayMWE = isMWE ? this.calculateOvertimePay(employee) : 0;
            const nightShiftDiffMWE = isMWE ? (employee.nightShiftDiff || 0) : 0;
            const hazardPayMWE = isMWE ? (employee.hazardPay || 0) : 0;
            const thirteenthMonthExempt = Math.min(employee.thirteenthMonthPay || 0, 90000) || 0;
            const deMinimis = Math.min(employee.deMinimis || 0, this.config.deMinimisLimit) || 0;
            const sssContribution = this.calculateSSSContribution(employee.salary) || 0;
            const philhealthContribution = this.calculatePhilHealthContribution(employee.salary) || 0;
            const pagibigContribution = this.calculatePagIBIGContribution(employee.salary) || 0;

            return {
                totalNonTaxable:
                    basicSalaryMWE +
                    holidayPayMWE +
                    overtimePayMWE +
                    nightShiftDiffMWE +
                    hazardPayMWE +
                    thirteenthMonthExempt +
                    deMinimis +
                    sssContribution +
                    philhealthContribution +
                    pagibigContribution || 0,
            };
        },
        calculateTotalDeductions(employee) {
            const sssContribution = this.calculateSSSContribution(employee.salary) || 0;
            const philhealthContribution = this.calculatePhilHealthContribution(employee.salary) || 0;
            const pagibigContribution = this.calculatePagIBIGContribution(employee.salary) || 0;
            const withholdingTax = this.calculateWithholdingTax(employee) || 0;
            const payheadDeductions = this.calculatePayheadDeductions(employee.payheads) || 0;

            return sssContribution + philhealthContribution + pagibigContribution + withholdingTax + payheadDeductions || 0;
        },
        calculateNetSalary(employee) {
            const totalEarnings = this.calculateTotalEarnings(employee) || 0;
            const totalDeductions = this.calculateTotalDeductions(employee) || 0;
            return totalEarnings - totalDeductions || 0;
        },
        calculateHolidayPay(employee) {
            const dailyRate = (employee.salary / 30) || 0;
            const salaryMonth = employee.salaryMonth
                ? employee.salaryMonth.split('-')[0] + '-' + employee.salaryMonth.split('-')[1]
                : moment(this.currentDate).format('YYYY-MM');
            const regularHolidays = this.config.regularHolidays || [];
            const specialNonWorkingDays = this.config.specialNonWorkingDays || [];
            const isRegularHoliday = regularHolidays.some((holiday) =>
                moment(holiday, 'MM/DD/YYYY').format('YYYY-MM') === salaryMonth
            );
            const isSpecialHoliday = specialNonWorkingDays.some((holiday) =>
                moment(holiday, 'MM/DD/YYYY').format('YYYY-MM') === salaryMonth
            );
            if (isRegularHoliday) return dailyRate * 2 || 0;
            if (isSpecialHoliday) return dailyRate * 1.3 || 0;
            return 0;
        },
        calculateOvertimePay(employee) {
            const hourlyRate = employee.salary / (8 * 22) || 0;
            const regularOTHours = employee.overtimeHours?.regular || 0;
            const holidayOTHours = employee.overtimeHours?.holiday || 0;
            const regularOTPay = regularOTHours * hourlyRate * 1.25 || 0;
            const holidayOTPay = holidayOTHours * hourlyRate * 1.3 || 0;
            return regularOTPay + holidayOTPay || 0;
        },
        calculateSSSContribution(salary) {
            const monthlySalaryCredit = Math.min(Math.max(salary || 0, 5000), 35000);
            return Math.round(monthlySalaryCredit * 0.045) || 0;
        },
        calculatePhilHealthContribution(salary) {
            const monthlySalary = Math.min(salary || 0, 100000);
            return Math.round((monthlySalary * 0.05) / 2) || 0;
        },
        calculatePagIBIGContribution(salary) {
            const cappedSalary = Math.min(salary || 0, 10000);
            return Math.round(cappedSalary * 0.02) || 0;
        },
        calculateWithholdingTax(employee) {
            const nonTaxable = this.calculateNonTaxableIncome(employee).totalNonTaxable || 0;
            const taxableIncome = (this.calculateTotalEarnings(employee) || 0) - nonTaxable || 0;
            if (taxableIncome <= 20833) return 0;
            if (taxableIncome <= 33333) return Math.round((taxableIncome - 20833) * 0.15) || 0;
            if (taxableIncome <= 66667) return Math.round(1875 + (taxableIncome - 33333) * 0.20) || 0;
            if (taxableIncome <= 166667) return Math.round(13541.80 + (taxableIncome - 66667) * 0.25) || 0;
            if (taxableIncome <= 666667) return Math.round(90841.80 + (taxableIncome - 166667) * 0.30) || 0;
            return Math.round(408841.80 + (taxableIncome - 666667) * 0.35) || 0;
        },
        onIframeLoad() {
            this.iframeError = false;
        },
        onIframeError() {
            this.iframeError = true;
            this.showErrorMessage('Error loading payslip preview.');
        },
        showSuccessMessage(message) {
            this.statusMessage = message;
            setTimeout(() => { this.statusMessage = ''; }, 3000);
        },
        showErrorMessage(message) {
            this.statusMessage = message;
            setTimeout(() => { this.statusMessage = ''; }, 5000);
        },
    },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined');

button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.transition-colors {
    transition: background-color 0.2s ease-in-out;
}

.hover\:bg-blue-50:hover {
    background-color: #eff6ff;
}

@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(1rem);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in {
    animation: fade-in 0.3s ease-out;
}

.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>