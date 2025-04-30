<template>
    <Modal :show="showHistoryModal" :max-width="'5xl'" :max-height="'80vh'" :closeable="true"
        @close="$emit('close-history-modal')">
        <div class="flex flex-col h-full">
            <div class="flex items-center justify-between p-4 border-b border-gray-300">
                <h2 class="text-base font-medium text-gray-800 flex items-center gap-1">
                    <span class="material-icons text-sm">history</span>
                    Payslip History - {{ selectedEmployee?.name }}
                </h2>
                <div class="flex items-center gap-2">
                    <button @click.stop="generatePayslipNow(selectedEmployee)"
                        class="flex items-center justify-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 px-4 rounded-md"
                        :disabled="isLoading || payslipGenerationStatus.generating">
                        <span class="material-icons text-sm">play_arrow</span>
                        {{ payslipGenerationStatus.generating ? 'Generating...' : 'Generate Now' }}
                    </button>
                    <button @click="$emit('close-history-modal')" class="p-1 hover:bg-gray-100 rounded-full">
                        <span class="material-icons text-sm">close</span>
                    </button>
                </div>
            </div>
            <div class="flex flex-1 overflow-hidden">
                <div class="w-1/2 p-4 overflow-y-auto border-r border-gray-300">
                    <h3 class="text-sm font-medium text-gray-700 mb-2">Previous Position Payslips</h3>
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50 sticky top-0">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer"
                                    @click="sortPreviousPayslips('payDate')">
                                    Pay Date
                                    <span class="material-icons text-xs">{{
                                        sortPreviousField === 'payDate'
                                            ? sortPreviousAsc
                                                ? 'arrow_upward'
                                                : 'arrow_downward'
                                            : ''
                                    }}</span>
                                </th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer"
                                    @click="sortPreviousPayslips('position')">
                                    Position
                                    <span class="material-icons text-xs">{{
                                        sortPreviousField === 'position'
                                            ? sortPreviousAsc
                                                ? 'arrow_upward'
                                                : 'arrow_downward'
                                            : ''
                                    }}</span>
                                </th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Salary</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            <tr v-for="payslip in sortedPreviousPayslips"
                                :key="`${payslip.salaryMonth}-${payslip.paydayType}`"
                                class="hover:bg-blue-50 cursor-pointer" :class="{
                                    'bg-blue-100':
                                        selectedPayslip?.salaryMonth === payslip.salaryMonth &&
                                        selectedPayslip?.paydayType === payslip.paydayType,
                                }" @click="selectPayslip(payslip)">
                                <td class="px-4 py-2 text-sm text-gray-900">
                                    {{
                                        payslip.paydayType === 'mid-month'
                                            ? payslip.expectedPaydays.midMonthPayday
                                            : payslip.expectedPaydays.endMonthPayday
                                    }}
                                </td>
                                <td class="px-4 py-2 text-sm text-gray-500">
                                    {{ getPositionName(payslip.position) }}
                                </td>
                                <td class="px-4 py-2 text-sm text-gray-500">
                                    ₱{{ payslip.salary.toLocaleString() }}
                                </td>
                                <td class="px-4 py-2 text-sm text-gray-500">
                                    {{ payslip.payslipDataUrl ? 'Generated' : 'Pending' }}
                                </td>
                                <td class="px-4 py-2">
                                    <button v-if="!payslip.payslipDataUrl" @click.stop="generatePayslip(payslip)"
                                        class="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                        :disabled="!canGeneratePayslip(payslip) ||
                                            payslipGenerationStatus[
                                                `${payslip.salaryMonth}-${payslip.paydayType}`
                                            ]?.generating
                                            ">
                                        <span class="material-icons text-sm">description</span>
                                        {{
                                            payslipGenerationStatus[
                                                `${payslip.salaryMonth}-${payslip.paydayType}`
                                            ]?.generating
                                                ? 'Generating...'
                                                : 'Generate'
                                        }}
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="sortedPreviousPayslips.length === 0">
                                <td colspan="5" class="px-4 py-4 text-center text-sm text-gray-500">
                                    No previous payslips available.
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div v-if="hasUpdatedPosition">
                        <h3 class="text-sm font-medium text-gray-700 mt-6 mb-2">
                            New Position Payslips
                        </h3>
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50 sticky top-0">
                                <tr>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer"
                                        @click="sortNewPayslips('payDate')">
                                        Pay Date
                                        <span class="material-icons text-xs">{{
                                            sortNewField === 'payDate'
                                                ? sortNewAsc
                                                    ? 'arrow_upward'
                                                    : 'arrow_downward'
                                                : ''
                                        }}</span>
                                    </th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer"
                                        @click="sortNewPayslips('position')">
                                        Position
                                        <span class="material-icons text-xs">{{
                                            sortNewField === 'position'
                                                ? sortNewAsc
                                                    ? 'arrow_upward'
                                                    : 'arrow_downward'
                                                : ''
                                        }}</span>
                                    </th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                        Salary
                                    </th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                        Status
                                    </th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr v-for="payslip in sortedNewPayslips"
                                    :key="`${payslip.salaryMonth}-${payslip.paydayType}`"
                                    class="hover:bg-blue-50 cursor-pointer" :class="{
                                        'bg-blue-100':
                                            selectedPayslip?.salaryMonth === payslip.salaryMonth &&
                                            selectedPayslip?.paydayType === payslip.paydayType,
                                    }" @click="selectPayslip(payslip)">
                                    <td class="px-4 py-2 text-sm text-gray-900">
                                        {{
                                            payslip.paydayType === 'mid-month'
                                                ? payslip.expectedPaydays.midMonthPayday
                                                : payslip.expectedPaydays.endMonthPayday
                                        }}
                                    </td>
                                    <td class="px-4 py-2 text-sm text-gray-500">
                                        {{ getPositionName(payslip.position) }}
                                    </td>
                                    <td class="px-4 py-2 text-sm text-gray-500">
                                        ₱{{ payslip.salary.toLocaleString() }}
                                    </td>
                                    <td class="px-4 py-2 text-sm text-gray-500">
                                        {{ payslip.payslipDataUrl ? 'Generated' : 'Pending' }}
                                    </td>
                                    <td class="px-4 py-2">
                                        <button v-if="!payslip.payslipDataUrl" @click.stop="generatePayslip(payslip)"
                                            class="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                            :disabled="!canGeneratePayslip(payslip) ||
                                                payslipGenerationStatus[
                                                    `${payslip.salaryMonth}-${payslip.paydayType}`
                                                ]?.generating
                                                ">
                                            <span class="material-icons text-sm">description</span>
                                            {{
                                                payslipGenerationStatus[
                                                    `${payslip.salaryMonth}-${payslip.paydayType}`
                                                ]?.generating
                                                    ? 'Generating...'
                                                    : 'Generate'
                                            }}
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="sortedNewPayslips.length === 0">
                                    <td colspan="5" class="px-4 py-4 text-center text-sm text-gray-500">
                                        No new payslips available.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="w-1/2 p-4 overflow-y-auto">
                    <h3 class="text-sm font-medium text-gray-700 mb-2">Payslip Preview</h3>
                    <div v-if="selectedPayslip && selectedPayslip.payslipDataUrl" class="flex flex-col h-full">
                        <div class="mb-4">
                            <p class="text-sm text-gray-600">
                                Position: {{ getPositionName(selectedPayslip.position) }} |
                                Salary: ₱{{ selectedPayslip.salary.toLocaleString() }}
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
                    <div v-else class="text-sm text-gray-500 text-center mt-4">
                        Select a payslip from the list to preview.
                    </div>
                </div>
            </div>
        </div>
    </Modal>
</template>

<script>
import axios from 'axios';
import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import moment from 'moment';
import { BASE_API_URL } from '@/utils/constants.js';
import { useAuthStore } from '@/stores/auth.store.js';
import {
    calculateNetSalary,
    calculateLateDeductions,
    calculatePayheadDeductions,
    calculateSSSContribution,
    calculatePhilHealthContribution,
    calculatePagIBIGContribution,
    calculateWithholdingTax,
} from '@/utils/calculations.js';
import Modal from '@/components/Modal.vue';

applyPlugin(jsPDF);

export default {
    name: 'PayslipHistoryModal',
    components: {
        Modal,
    },
    props: {
        showHistoryModal: Boolean,
        selectedEmployee: Object,
        positions: Array,
        allPayslipHistories: Object,
        currentDate: String,
        config: Object,
    },
    data() {
        return {
            payslipHistory: [],
            selectedPayslip: null,
            payslipGenerationStatus: {},
            iframeError: false,
            isLoading: false,
            sortPreviousField: 'payDate',
            sortPreviousAsc: true,
            sortNewField: 'payDate',
            sortNewAsc: true,
        };
    },
    setup() {
        const authStore = useAuthStore();
        return { authStore };
    },
    computed: {
        sortedPositionHistory() {
            if (!this.selectedEmployee || !this.selectedEmployee.positionHistory) {
                return [
                    {
                        position: this.selectedEmployee?.position || 'N/A',
                        salary: this.selectedEmployee?.salary || 0,
                        startDate:
                            this.selectedEmployee?.hireDate ||
                            this.currentDate.toISOString().split('T')[0],
                        endDate: null,
                    },
                ];
            }
            return [...this.selectedEmployee.positionHistory].sort(
                (a, b) => new Date(a.startDate) - new Date(b.startDate)
            );
        },
        initialPosition() {
            return this.sortedPositionHistory[0];
        },
        latestPosition() {
            return this.sortedPositionHistory[this.sortedPositionHistory.length - 1];
        },
        hasUpdatedPosition() {
            return this.sortedPositionHistory.length > 1;
        },
        sortedPreviousPayslips() {
            const previousPayslips = this.payslipHistory.filter(
                (payslip) => payslip.position === this.initialPosition.position
            );
            return previousPayslips.sort((a, b) => {
                if (this.sortPreviousField === 'payDate') {
                    const dateA = moment(a.payDate, 'YYYY-MM-DD');
                    const dateB = moment(b.payDate, 'YYYY-MM-DD');
                    return this.sortPreviousAsc ? dateA - dateB : dateB - dateA;
                } else if (this.sortPreviousField === 'position') {
                    const posA = this.getPositionName(a.position);
                    const posB = this.getPositionName(b.position);
                    return this.sortPreviousAsc
                        ? posA.localeCompare(posB)
                        : posB.localeCompare(posA);
                }
                return 0;
            });
        },
        sortedNewPayslips() {
            const newPayslips = this.payslipHistory.filter(
                (payslip) =>
                    payslip.position === this.latestPosition.position &&
                    this.hasUpdatedPosition &&
                    moment(payslip.salaryMonth, 'YYYY-MM').isSameOrAfter(
                        moment(this.latestPosition.startDate, 'YYYY-MM-DD'),
                        'month'
                    )
            );
            return newPayslips.sort((a, b) => {
                if (this.sortNewField === 'payDate') {
                    const dateA = moment(a.payDate, 'YYYY-MM-DD');
                    const dateB = moment(b.payDate, 'YYYY-MM-DD');
                    return this.sortNewAsc ? dateA - dateB : dateB - dateA;
                } else if (this.sortNewField === 'position') {
                    const posA = this.getPositionName(a.position);
                    const posB = this.getPositionName(b.position);
                    return this.sortNewAsc
                        ? posA.localeCompare(posB)
                        : posB.localeCompare(posA);
                }
                return 0;
            });
        },
    },
    watch: {
        selectedEmployee: {
            immediate: true,
            async handler(newEmployee) {
                if (newEmployee) {
                    await this.showPayslipHistory(newEmployee);
                }
            },
        },
    },
    methods: {
        async showPayslipHistory(employee) {
            this.isLoading = true;
            if (!employee?.id || !employee?.empNo) {
                this.$emit('show-error-message', 'Invalid employee data');
                console.error('Invalid employee:', employee);
                this.isLoading = false;
                return;
            }

            const token = this.authStore.accessToken || localStorage.getItem('token');
            if (!token) {
                this.$emit('show-error-message', 'Authentication required. Please log in.');
                this.$router.push('/admin-login');
                return;
            }

            const today = moment(this.currentDate);
            const hireDate = moment(employee.hireDate || this.currentDate);
            let backendPayslips = [];
            try {
                const response = await axios.get(
                    `${BASE_API_URL}/api/payslips/${employee.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'user-role': 'admin',
                        },
                    }
                );
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
                    const midPosition = this.getActivePositionForDate(
                        employee.positionHistory,
                        midMonthDate
                    );
                    const midPayslip =
                        backendPayslips.find(
                            (p) =>
                                p.salaryMonth === salaryMonth &&
                                p.paydayType === 'mid-month'
                        ) || {};

                    payslipHistory.push({
                        salaryMonth,
                        paydayType: 'mid-month',
                        payDate: midMonthDate.format('YYYY-MM-DD'),
                        position: midPosition.position,
                        salary: midPosition.salary,
                        totalSalary: midPayslip.salary
                            ? calculateNetSalary(
                                {
                                    ...employee,
                                    position: midPosition.position,
                                    salary: midPosition.salary,
                                },
                                this.config,
                                [],
                                salaryMonth,
                                'mid-month'
                            )
                            : null,
                        payslipDataUrl: midPayslip.payslipData
                            ? `data:application/pdf;base64,${midPayslip.payslipData}`
                            : null,
                        employee: {
                            ...employee,
                            position: midPosition.position,
                            salary: midPosition.salary,
                            salaryMonth: salaryMonth,
                        },
                        expectedPaydays,
                    });
                }

                const endMonthDate = moment(salaryMonth).endOf('month');
                if (endMonthDate.isSameOrAfter(hireDate, 'day')) {
                    const endPosition = this.getActivePositionForDate(
                        employee.positionHistory,
                        endMonthDate
                    );
                    const endPayslip =
                        backendPayslips.find(
                            (p) =>
                                p.salaryMonth === salaryMonth &&
                                p.paydayType === 'end-of-month'
                        ) || {};

                    payslipHistory.push({
                        salaryMonth,
                        paydayType: 'end-of-month',
                        payDate: endMonthDate.format('YYYY-MM-DD'),
                        position: endPosition.position,
                        salary: endPosition.salary,
                        totalSalary: endPayslip.salary
                            ? calculateNetSalary(
                                {
                                    ...employee,
                                    position: endPosition.position,
                                    salary: endPosition.salary,
                                },
                                this.config,
                                [],
                                salaryMonth,
                                'end-of-month'
                            )
                            : null,
                        payslipDataUrl: endPayslip.payslipData
                            ? `data:application/pdf;base64,${endPayslip.payslipData}`
                            : null,
                        employee: {
                            ...employee,
                            position: endPosition.position,
                            salary: endPosition.salary,
                            salaryMonth: salaryMonth,
                        },
                        expectedPaydays,
                    });
                }

                currentDate.add(15, 'days').startOf('day');
                if (currentDate.date() > 15) {
                    currentDate.startOf('month').add(1, 'month');
                }
            }

            this.$emit('update:allPayslipHistories', {
                ...this.allPayslipHistories,
                [employee.id]: payslipHistory,
            });
            this.payslipHistory = payslipHistory;
            this.selectedPayslip =
                payslipHistory.find((p) => p.payslipDataUrl) || payslipHistory[0] || null;
            this.isLoading = false;

            for (const payslip of payslipHistory) {
                if (
                    !payslip.payslipDataUrl &&
                    today.isSameOrAfter(moment(payslip.payDate), 'day')
                ) {
                    await this.generatePayslip(payslip);
                }
            }
        },
        canGeneratePayslip(payslip) {
            const today = moment(this.currentDate);
            const payDate = moment(
                payslip.paydayType === 'mid-month'
                    ? payslip.expectedPaydays.midMonthPayday
                    : payslip.expectedPaydays.endMonthPayday,
                'D MMMM YYYY'
            );
            return today.isSameOrAfter(payDate, 'day') && !payslip.payslipDataUrl;
        },
        async generatePayslip(payslip) {
            const employee = payslip.employee;
            if (!employee?.id || !employee?.empNo) {
                this.$emit('show-error-message', 'Employee data is incomplete.');
                return;
            }

            const payDate = moment(payslip.payDate, 'YYYY-MM-DD');
            const positionHistory = Array.isArray(employee.positionHistory)
                ? employee.positionHistory
                : [];
            const activePosition = this.getActivePositionForDate(positionHistory, payDate);

            if (!activePosition?.position || activePosition.salary === undefined) {
                this.$emit('show-error-message', 'Invalid position or salary for this date.');
                return;
            }

            const token = this.authStore.accessToken || localStorage.getItem('token');
            if (!token) throw new Error('No authentication token available');

            let attendanceRecords = [];
            try {
                const response = await axios.get(
                    `${BASE_API_URL}/api/attendance/${employee.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'user-role': 'admin',
                        },
                    }
                );
                attendanceRecords = response.data || [];
            } catch (error) {
                console.error('Error fetching attendance:', error);
                this.$emit('show-error-message', 'Failed to load attendance data.');
            }

            const updatedEmployee = {
                ...employee,
                position: activePosition.position,
                salary: activePosition.salary,
            };
            const key = `${payslip.salaryMonth}-${payslip.paydayType}`;
            this.payslipGenerationStatus[key] = { generating: true };

            try {
                const payslipData = this.createPayslipData(
                    updatedEmployee,
                    attendanceRecords,
                    payslip.salaryMonth,
                    payslip.paydayType
                );
                const pdfBlob = await this.generatePdf(payslipData);
                const base64Data = await this.blobToBase64(pdfBlob);
                const url = URL.createObjectURL(pdfBlob);

                const payload = {
                    employeeId: employee.id,
                    empNo: String(employee.empNo),
                    payslipData: base64Data.split(',')[1],
                    salaryMonth: payslip.salaryMonth,
                    paydayType: payslip.paydayType,
                    position: activePosition.position,
                    salary: Number(activePosition.salary),
                    payDate: payDate.format('YYYY-MM-DD'),
                };

                const response = await axios.post(
                    `${BASE_API_URL}/api/payslips/generate`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'user-role': 'admin',
                        },
                    }
                );

                if (response.status === 201 || response.status === 200) {
                    payslip.payslipDataUrl = url;
                    payslip.position = activePosition.position;
                    payslip.salary = activePosition.salary;
                    payslip.totalSalary = calculateNetSalary(
                        updatedEmployee,
                        this.config,
                        attendanceRecords,
                        payslip.salaryMonth,
                        payslip.paydayType
                    );
                    this.selectedPayslip = payslip;

                    const employeeHistory = this.allPayslipHistories[employee.id] || [];
                    const updatedHistory = employeeHistory.map((p) =>
                        p.salaryMonth === payslip.salaryMonth &&
                            p.paydayType === payslip.paydayType
                            ? payslip
                            : p
                    );
                    if (
                        !employeeHistory.some(
                            (p) =>
                                p.salaryMonth === payslip.salaryMonth &&
                                p.paydayType === payslip.paydayType
                        )
                    ) {
                        updatedHistory.push(payslip);
                    }
                    this.$emit('update:allPayslipHistories', {
                        ...this.allPayslipHistories,
                        [employee.id]: updatedHistory,
                    });
                    this.payslipHistory = updatedHistory;

                    this.$emit(
                        'show-success-message',
                        `Payslip generated for ${employee.name} - ${payslip.paydayType === 'mid-month'
                            ? payslip.expectedPaydays.midMonthPayday
                            : payslip.expectedPaydays.endMonthPayday
                        }!`
                    );
                }
            } catch (error) {
                console.error('Error generating payslip:', error.response?.data || error.message);
                this.$emit(
                    'show-error-message',
                    `Failed to generate payslip: ${error.response?.data?.message || error.message}`
                );
            } finally {
                this.payslipGenerationStatus[key] = { generating: false };
            }
        },
        async generatePayslipNow(employee) {
            this.payslipGenerationStatus.generating = true;
            try {
                const today = moment(this.currentDate);
                const salaryMonth = today.format('YYYY-MM');
                const lastDayOfMonth = today.clone().endOf('month').date();
                const payDate = today.isBefore(
                    moment(`${salaryMonth}-15`, 'YYYY-MM-DD').endOf('day')
                )
                    ? moment(`${salaryMonth}-15`, 'YYYY-MM-DD')
                    : moment(`${salaryMonth}-${lastDayOfMonth}`, 'YYYY-MM-DD');
                const activePosition = this.getActivePositionForDate(
                    employee.positionHistory,
                    payDate
                );
                if (
                    !activePosition ||
                    !activePosition.position ||
                    activePosition.salary === undefined
                ) {
                    this.$emit('show-error-message', 'No valid position for current date.');
                    return;
                }

                const token = this.authStore.accessToken || localStorage.getItem('token');
                if (!token)
                    throw new Error('No authentication token available. Please log in.');

                let attendanceRecords = [];
                try {
                    const response = await axios.get(
                        `${BASE_API_URL}/api/attendance/${employee.id}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'user-role': 'admin',
                            },
                        }
                    );
                    attendanceRecords = response.data || [];
                } catch (error) {
                    console.error('Error fetching attendance:', error);
                    this.$emit('show-error-message', 'Failed to load attendance data.');
                }

                const updatedEmployee = {
                    ...employee,
                    position: activePosition.position,
                    salary: activePosition.salary,
                };
                const expectedPaydays = this.getExpectedPayday(employee.hireDate, salaryMonth);

                const paydayType = payDate.date() === 15 ? 'mid-month' : 'end-of-month';
                const employeeSalaryMonth = `${salaryMonth}-${paydayType === 'mid-month' ? '15' : lastDayOfMonth
                    }`;

                let payslipData = {
                    salaryMonth,
                    paydayType,
                    position: activePosition.position,
                    salary: activePosition.salary,
                    employee: { ...updatedEmployee, salaryMonth: employeeSalaryMonth },
                    expectedPaydays,
                };

                const pdfPayslipData = this.createPayslipData(
                    payslipData.employee,
                    attendanceRecords,
                    payslipData.salaryMonth,
                    payslipData.paydayType
                );
                const pdfBlob = await this.generatePdf(pdfPayslipData);
                const url = URL.createObjectURL(pdfBlob);
                const base64Data = await this.blobToBase64(pdfBlob);

                const payload = {
                    employeeId: employee.id,
                    empNo: String(employee.empNo),
                    payslipData: base64Data.split(',')[1],
                    salaryMonth: payslipData.salaryMonth,
                    paydayType: payslipData.paydayType,
                    position: activePosition.position,
                    salary: Number(activePosition.salary),
                    payDate: payDate.format('YYYY-MM-DD'),
                };

                const response = await axios.post(
                    `${BASE_API_URL}/api/payslips/generate`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'user-role': 'admin',
                        },
                    }
                );

                if (response.status === 201 || response.status === 200) {
                    payslipData.payslipDataUrl = url;
                    payslipData.totalSalary = calculateNetSalary(
                        payslipData.employee,
                        this.config,
                        attendanceRecords,
                        salaryMonth,
                        paydayType
                    );
                    let employeeHistory = this.allPayslipHistories[employee.id] || [];
                    const existingPayslipIndex = employeeHistory.findIndex(
                        (p) =>
                            p.salaryMonth === payslipData.salaryMonth &&
                            p.paydayType === payslipData.paydayType
                    );

                    if (existingPayslipIndex !== -1) {
                        employeeHistory[existingPayslipIndex] = payslipData;
                    } else {
                        employeeHistory.push(payslipData);
                    }

                    this.$emit('update:allPayslipHistories', {
                        ...this.allPayslipHistories,
                        [employee.id]: employeeHistory,
                    });
                    this.payslipHistory = employeeHistory;
                    this.selectedPayslip = payslipData;

                    this.$emit(
                        'show-success-message',
                        `Payslip generated now for ${employee.name} - ${payslipData.paydayType === 'mid-month'
                            ? expectedPaydays.midMonthPayday
                            : expectedPaydays.endMonthPayday
                        }!`
                    );
                }
            } catch (error) {
                console.error('Error generating payslip now:', error);
                this.$emit(
                    'show-error-message',
                    `Failed to generate payslip: ${error.message}`
                );
                if (
                    error.message === 'No authentication token available. Please log in.'
                ) {
                    this.$router.push('/admin-login');
                }
            } finally {
                this.payslipGenerationStatus.generating = false;
            }
        },
        getPositionName(positionName) {
            const position = this.positions.find(
                (p) => p.name.trim().toLowerCase() === positionName?.trim().toLowerCase()
            );
            return position ? position.name : positionName || 'Unknown Position';
        },
        getActivePositionForDate(positionHistory, date) {
            if (!Array.isArray(positionHistory) || positionHistory.length === 0) {
                return {
                    position: 'N/A',
                    salary: 0,
                    startDate:
                        this.selectedEmployee?.hireDate ||
                        this.currentDate.toISOString().split('T')[0],
                };
            }
            const targetDate = moment(date);
            const sortedHistory = [...positionHistory].sort(
                (a, b) => new Date(a.startDate) - new Date(b.startDate)
            );
            const activePosition = sortedHistory.find((history) => {
                const startDate = moment(history.startDate);
                const endDate = history.endDate
                    ? moment(history.endDate)
                    : moment('9999-12-31');
                return (
                    targetDate.isSameOrAfter(startDate, 'day') &&
                    targetDate.isSameOrBefore(endDate, 'day')
                );
            });
            return activePosition || sortedHistory[sortedHistory.length - 1];
        },
        getExpectedPayday(hireDate, salaryMonth) {
            const [year, month] = salaryMonth.split('-').map((part) => parseInt(part, 10));
            const lastDay = new Date(year, month, 0).getDate();
            let midMonth = new Date(year, month - 1, 15);
            let endMonth = new Date(year, month - 1, lastDay);

            const hireMoment = moment(hireDate);
            const monthStart = moment(`${year}-${month}-01`, 'YYYY-MM-DD');

            if (hireMoment.isAfter(monthStart)) {
                if (hireMoment.isAfter(moment(midMonth))) {
                    midMonth = hireMoment.toDate();
                }
                if (hireMoment.isAfter(moment(endMonth))) {
                    endMonth = hireMoment.toDate();
                }
            }

            const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

            while (isWeekend(midMonth)) {
                midMonth.setDate(midMonth.getDate() - 1);
            }

            while (isWeekend(endMonth)) {
                endMonth.setDate(endMonth.getDate() - 1);
            }

            return {
                midMonthPayday: midMonth.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                }),
                endMonthPayday: endMonth.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                }),
            };
        },
        createPayslipData(employee, attendanceRecords, salaryMonth, paydayType) {
            const salaryDate = moment(employee.salaryMonth, 'YYYY-MM-DD').format(
                'MM/DD/YYYY'
            );
            const basicSalary = employee.salary || 0;

            const sanitizedPayheads = Array.isArray(employee.payheads)
                ? employee.payheads.filter(
                    (ph) =>
                        ph &&
                        typeof ph === 'object' &&
                        'type' in ph &&
                        'name' in ph &&
                        'amount' in ph
                )
                : [];

            const [year, month] = salaryMonth.split('-');
            const lastDay = new Date(year, month, 0).getDate();
            const startDate =
                paydayType === 'mid-month'
                    ? `${year}-${month}-01`
                    : `${year}-${month}-16`;
            const endDate =
                paydayType === 'mid-month'
                    ? `${year}-${month}-15`
                    : `${year}-${month}-${lastDay}`;

            const filteredAttendanceRecords = attendanceRecords.filter((record) => {
                const recordDate = moment(record.date).format('YYYY-MM-DD');
                return (
                    moment(recordDate).isSameOrAfter(startDate, 'day') &&
                    moment(recordDate).isSameOrBefore(endDate, 'day')
                );
            });

            const lateDeduction = calculateLateDeductions(
                filteredAttendanceRecords,
                salaryMonth,
                paydayType
            );
            const attendanceIssues = filteredAttendanceRecords.some(
                (record) => record.status === 'late' || record.status === 'absent'
            );
            const payheadDeductions = calculatePayheadDeductions(
                sanitizedPayheads.filter(
                    (ph) =>
                        ph.type === 'Deductions' &&
                        (!ph.isAttendanceAffected ||
                            (ph.isAttendanceAffected && attendanceIssues))
                )
            );

            const sss = calculateSSSContribution(basicSalary);
            const philhealth = calculatePhilHealthContribution(basicSalary);
            const pagibig = calculatePagIBIGContribution(basicSalary);
            const withholdingTax = calculateWithholdingTax(employee, this.config);
            const totalDeductions =
                sss + philhealth + pagibig + withholdingTax + payheadDeductions + lateDeduction;
            const netSalary = basicSalary - totalDeductions;

            const paidLeavesDays = employee.paidLeaves?.days || 0;
            const absencesDays = employee.absences?.days || 0;
            const paidLeavesAmount = employee.paidLeaves?.amount || 0;
            const absencesAmount = employee.absences ? -(employee.absences.amount || 0) : 0;

            const earnings = sanitizedPayheads
                .filter((ph) => ph.type === 'Earnings')
                .map((ph) => ({
                    name: ph.name,
                    amount: this.formatNumber(ph.amount),
                }));

            const deductions = sanitizedPayheads
                .filter(
                    (ph) =>
                        ph.type === 'Deductions' &&
                        (!ph.isAttendanceAffected ||
                            (ph.isAttendanceAffected && attendanceIssues))
                )
                .map((ph) => ({
                    name: ph.name,
                    amount: this.formatNumber(ph.amount),
                }));

            if (lateDeduction > 0) {
                deductions.push({
                    name: 'Late Deductions',
                    amount: this.formatNumber(lateDeduction),
                });
            }

            return {
                salaryDate,
                empNo: employee.empNo || 'N/A',
                lastName: employee.lastName || 'N/A',
                middleName: employee.middleName || 'N/A',
                firstName: employee.firstName || 'N/A',
                birthDate: moment(employee.birthDate).isValid()
                    ? moment(employee.birthDate).format('MM/DD/YYYY')
                    : 'N/A',
                hireDate: moment(employee.hireDate).isValid()
                    ? moment(employee.hireDate).format('MM/DD/YYYY')
                    : 'N/A',
                civilStatus: employee.civilStatus || 'SINGLE',
                sss: employee.sss || 'N/A',
                tin: employee.tin || 'N/A',
                philhealth: employee.philhealth || 'N/A',
                pagibig: employee.pagibig || 'N/A',
                position: this.getPositionName(employee.position) || 'N/A',
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
                paidLeavesDays,
                absencesDays,
                paidLeavesAmount: this.formatNumber(paidLeavesAmount),
                absencesAmount: this.formatNumber(absencesAmount),
            };
        },
        formatNumber(value) {
            return Number(value || 0).toFixed(2);
        },
        async generatePdf(payslipData, doc) {
            const pdfDoc = doc || new jsPDF({ orientation: 'portrait', unit: 'mm', format: [216, 279] });
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

            return doc ? undefined : pdfDoc.output('blob');
        },
        blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        },
        sortPreviousPayslips(field) {
            if (this.sortPreviousField === field) {
                this.sortPreviousAsc = !this.sortPreviousAsc;
            } else {
                this.sortPreviousField = field;
                this.sortPreviousAsc = true;
            }
        },
        sortNewPayslips(field) {
            if (this.sortNewField === field) {
                this.sortNewAsc = !this.sortNewAsc;
            } else {
                this.sortNewField = field;
                this.sortNewAsc = true;
            }
        },
        selectPayslip(payslip) {
            this.selectedPayslip = payslip.payslipDataUrl ? payslip : null;
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
                link.download = `Payslip_${this.selectedEmployee.name}_${this.selectedPayslip.paydayType === 'mid-month'
                        ? this.selectedPayslip.expectedPaydays.midMonthPayday
                        : this.selectedPayslip.expectedPaydays.endMonthPayday
                    }.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error downloading payslip:', error);
                this.$emit('show-error-message', 'Failed to download payslip.');
            }
        },
        onIframeLoad() {
            this.iframeError = false;
        },
        onIframeError() {
            this.iframeError = true;
            this.$emit('show-error-message', 'Error loading payslip preview.');
        },
    },
    emits: [
        'close-history-modal',
        'update:allPayslipHistories',
        'show-success-message',
        'show-error-message',
    ],
};
</script>

<style scoped>
.hover\:bg-blue-50:hover {
    background-color: #eff6ff;
}
</style>