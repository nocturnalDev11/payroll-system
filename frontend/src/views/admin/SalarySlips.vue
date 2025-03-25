<template>
    <div class="min-h-screen p-1">
        <div class="max-w-8xl mx-auto">
            <!-- Header Section -->
            <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div class="relative">
                        <span class="material-icons absolute left-2 top-2 text-gray-400 text-sm">search</span>
                        <input v-model="searchQuery" type="text" placeholder="Search employee by name..."
                            class="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                    </div>
                    <button @click="refreshData"
                        class="flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded-md"
                        :disabled="isLoading">
                        <span class="material-icons text-sm">{{ isLoading ? 'sync' : 'refresh' }}</span>
                        {{ isLoading ? 'Refreshing...' : 'Refresh Data' }}
                    </button>
                    <button @click="generateAllPayslips"
                        class="flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-4 rounded-md"
                        :disabled="isLoading || isGeneratingAll">
                        <span class="material-icons text-sm">{{ isGeneratingAll ? 'sync' : 'description' }}</span>
                        {{ isGeneratingAll ? 'Generating...' : 'Generate All' }}
                    </button>
                    <button @click="showPrintModal"
                        class="flex items-center justify-center gap-1 bg-purple-500 hover:bg-purple-600 text-white text-sm py-2 px-4 rounded-md"
                        :disabled="isLoading">
                        <span class="material-icons text-sm">print</span>
                        Print All
                    </button>
                    <button @click="showUpdatePositionModal"
                        class="flex items-center justify-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 px-4 rounded-md"
                        :disabled="isLoading">
                        <span class="material-icons text-sm">edit</span>
                        Update Position
                    </button>
                </div>
            </div>

            <!-- Employee List -->
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 mb-4">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                                    <div class="flex items-center gap-1">
                                        <span class="material-icons text-gray-400 text-sm">person</span>
                                        Name
                                    </div>
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                                    <div class="flex items-center gap-1">
                                        <span class="material-icons text-gray-400 text-sm">badge</span>
                                        Employee ID
                                    </div>
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                                    <div class="flex items-center gap-1">
                                        <span class="material-icons text-gray-400 text-sm">work</span>
                                        Position
                                    </div>
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                                    <div class="flex items-center gap-1">
                                        <span class="material-icons text-gray-400 text-sm">payments</span>
                                        Hourly Rate
                                    </div>
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                                    <div class="flex items-center gap-1">
                                        <span class="material-icons text-gray-400 text-sm">account_balance_wallet</span>
                                        Basic Salary
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="employee in paginatedEmployees" :key="employee.id"
                                class="hover:bg-blue-50 transition-colors cursor-pointer"
                                @click="showPayslipHistory(employee)">
                                <td class="px-4 py-3 text-sm text-gray-900">{{ employee.name }}</td>
                                <td class="px-4 py-3 text-sm text-gray-500">{{ employee.empNo }}</td>
                                <td class="px-4 py-3 text-sm text-gray-500">
                                    {{ getPositionName(employee.position) }}
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-900">
                                    ₱{{ getHourlyRate(employee.position).toLocaleString() }}
                                </td>
                                <td class="px-4 py-3 text-sm text-blue-600">
                                    ₱{{ getPositionSalary(employee.position).toLocaleString() }}
                                </td>
                            </tr>
                            <tr v-if="paginatedEmployees.length === 0 && !isLoading">
                                <td colspan="5" class="px-4 py-8 text-center">
                                    <div class="flex flex-col items-center gap-2">
                                        <span class="material-icons text-gray-400 text-3xl">search_off</span>
                                        <p class="text-sm text-gray-500">No employees found.</p>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="isLoading">
                                <td colspan="5" class="px-4 py-8 text-center">
                                    <div class="flex flex-col items-center gap-2">
                                        <span class="material-icons text-blue-500 animate-spin text-3xl">sync</span>
                                        <p class="text-sm text-gray-500">Loading employees...</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="flex items-center justify-between px-4 py-3 bg-gray-50">
                    <div class="text-xs text-gray-700">
                        Showing page {{ currentPage }} of {{ totalPages }}
                    </div>
                    <div class="flex gap-2">
                        <button @click="prevPage" :disabled="currentPage === 1 || isLoading"
                            class="inline-flex items-center px-3 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                            <span class="material-icons text-sm mr-1">chevron_left</span>
                            Previous
                        </button>
                        <button @click="nextPage" :disabled="currentPage === totalPages || isLoading"
                            class="inline-flex items-center px-3 py-1 text-xs bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                            Next
                            <span class="material-icons text-sm ml-1">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Payslip History Modal -->
            <div v-if="showHistoryModal"
                class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[80vh] flex flex-col">
                    <div class="flex items-center justify-between p-4 border-b">
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
                            <button @click="showHistoryModal = false" class="p-1 hover:bg-gray-100 rounded-full">
                                <span class="material-icons text-sm">close</span>
                            </button>
                        </div>
                    </div>
                    <div class="flex flex-1 overflow-hidden">
                        <div class="w-1/2 p-4 overflow-y-auto border-r">
                            <!-- Previous Position Payslips (Initial Position) -->
                            <h3 class="text-sm font-medium text-gray-700 mb-2">Previous Position Payslips</h3>
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer"
                                            @click="sortPreviousPayslips('payDate')">
                                            Pay Date <span class="material-icons text-xs">{{ sortPreviousField ===
                                                'payDate' ?
                                                (sortPreviousAsc ? 'arrow_upward' : 'arrow_downward') : '' }}</span>
                                        </th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer"
                                            @click="sortPreviousPayslips('position')">
                                            Position <span class="material-icons text-xs">{{ sortPreviousField ===
                                                'position' ?
                                                (sortPreviousAsc ? 'arrow_upward' : 'arrow_downward') : '' }}</span>
                                        </th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Salary</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    <tr v-for="payslip in sortedPreviousPayslips"
                                        :key="`${payslip.salaryMonth}-${payslip.paydayType}`"
                                        class="hover:bg-blue-50 cursor-pointer"
                                        :class="{ 'bg-blue-100': selectedPayslip?.salaryMonth === payslip.salaryMonth && selectedPayslip?.paydayType === payslip.paydayType }"
                                        @click="selectPayslip(payslip)">
                                        <td class="px-4 py-2 text-sm text-gray-900">
                                            {{ payslip.paydayType === 'mid-month' ?
                                                payslip.expectedPaydays.midMonthPayday :
                                            payslip.expectedPaydays.endMonthPayday }}
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
                                            <button v-if="!payslip.payslipDataUrl"
                                                @click.stop="generatePayslip(payslip)"
                                                class="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                                :disabled="!canGeneratePayslip(payslip) || payslipGenerationStatus[`${payslip.salaryMonth}-${payslip.paydayType}`]?.generating">
                                                <span class="material-icons text-sm">description</span>
                                                {{
                                                    payslipGenerationStatus[`${payslip.salaryMonth}-${payslip.paydayType}`]?.generating
                                                ?
                                                'Generating...' : 'Generate' }}
                                            </button>
                                        </td>
                                    </tr>
                                    <tr v-if="sortedPreviousPayslips.length === 0">
                                        <td colspan="5" class="px-4 py-4 text-center text-sm text-gray-500">No previous
                                            payslips available.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <!-- New Position Payslips (Only After Update) -->
                            <div v-if="hasUpdatedPosition">
                                <h3 class="text-sm font-medium text-gray-700 mt-6 mb-2">New Position Payslips</h3>
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer"
                                                @click="sortNewPayslips('payDate')">
                                                Pay Date <span class="material-icons text-xs">{{ sortNewField ===
                                                    'payDate' ? (sortNewAsc ?
                                                    'arrow_upward' : 'arrow_downward') : '' }}</span>
                                            </th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer"
                                                @click="sortNewPayslips('position')">
                                                Position <span class="material-icons text-xs">{{ sortNewField ===
                                                    'position' ? (sortNewAsc ?
                                                    'arrow_upward' : 'arrow_downward') : '' }}</span>
                                            </th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Salary
                                            </th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Status
                                            </th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200">
                                        <tr v-for="payslip in sortedNewPayslips"
                                            :key="`${payslip.salaryMonth}-${payslip.paydayType}`"
                                            class="hover:bg-blue-50 cursor-pointer"
                                            :class="{ 'bg-blue-100': selectedPayslip?.salaryMonth === payslip.salaryMonth && selectedPayslip?.paydayType === payslip.paydayType }"
                                            @click="selectPayslip(payslip)">
                                            <td class="px-4 py-2 text-sm text-gray-900">
                                                {{ payslip.paydayType === 'mid-month' ?
                                                    payslip.expectedPaydays.midMonthPayday :
                                                payslip.expectedPaydays.endMonthPayday }}
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
                                                <button v-if="!payslip.payslipDataUrl"
                                                    @click.stop="generatePayslip(payslip)"
                                                    class="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                                    :disabled="!canGeneratePayslip(payslip) || payslipGenerationStatus[`${payslip.salaryMonth}-${payslip.paydayType}`]?.generating">
                                                    <span class="material-icons text-sm">description</span>
                                                    {{
                                                        payslipGenerationStatus[`${payslip.salaryMonth}-${payslip.paydayType}`]?.generating
                                                    ?
                                                    'Generating...' : 'Generate' }}
                                                </button>
                                            </td>
                                        </tr>
                                        <tr v-if="sortedNewPayslips.length === 0">
                                            <td colspan="5" class="px-4 py-4 text-center text-sm text-gray-500">No new
                                                payslips available.
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
                                <iframe :src="selectedPayslip.payslipDataUrl"
                                    class="w-full h-[50vh] rounded border mb-4" @load="onIframeLoad"
                                    @error="onIframeError"></iframe>
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
            </div>

            <!-- Update Position Modal -->
            <div v-if="showUpdateModal"
                class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                    <h2 class="text-base font-medium text-gray-800 mb-4 flex items-center gap-1">
                        <span class="material-icons text-sm">edit</span>
                        Update Employee Position
                    </h2>
                    <div class="mb-4">
                        <label class="block text-sm text-gray-700 mb-1">Select Employee</label>
                        <select v-model="selectedEmployeeForUpdate" class="w-full p-2 border rounded text-sm">
                            <option value="" disabled>Select an employee</option>
                            <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                                {{ emp.name }} ({{ getPositionName(emp.position) }})
                            </option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm text-gray-700 mb-1">New Position</label>
                        <select v-model="newPosition" class="w-full p-2 border rounded text-sm">
                            <option value="" disabled>Select a position</option>
                            <option v-for="pos in positions" :key="pos.name" :value="pos.name">
                                {{ pos.name }} (₱{{ pos.salary.toLocaleString() }})
                            </option>
                        </select>
                    </div>
                    <div class="flex justify-end gap-2">
                        <button @click="showUpdateModal = false"
                            class="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
                            Cancel
                        </button>
                        <button @click="updateEmployeePosition"
                            class="flex items-center gap-1 px-4 py-2 text-sm text-white bg-orange-500 rounded hover:bg-orange-600"
                            :disabled="!selectedEmployeeForUpdate || !newPosition || isLoading">
                            <span class="material-icons text-sm">save</span>
                            Update
                        </button>
                    </div>
                </div>
            </div>

            <!-- Print All Modal -->
            <div v-if="showPrintAllModal"
                class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                    <div class="flex items-center justify-between p-4 border-b">
                        <h2 class="text-base font-medium text-gray-800 flex items-center gap-1">
                            <span class="material-icons text-sm">print</span>
                            Print Payslips
                        </h2>
                        <button @click="showPrintAllModal = false" class="p-1 hover:bg-gray-100 rounded-full">
                            <span class="material-icons text-sm">close</span>
                        </button>
                    </div>
                    <div class="p-4 overflow-y-auto">
                        <h3 class="text-sm font-medium text-gray-700 mb-2">Select Employees to Print</h3>
                        <div v-if="employeesWithPayslips.length > 0" class="mb-4">
                            <label class="flex items-center">
                                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll"
                                    class="large-checkbox mr-2" />
                                <span class="text-sm text-gray-900 font-medium">Select All</span>
                            </label>
                        </div>
                        <div v-if="employeesWithPayslips.length > 0">
                            <div v-for="emp in employeesWithPayslips" :key="emp.id"
                                class="flex items-center py-2 border-b">
                                <input type="checkbox" v-model="selectedEmployeesForPrint" :value="emp.id"
                                    class="large-checkbox mr-2" />
                                <span class="text-sm text-gray-900">{{ emp.name }} - Most Recent: {{
                                    emp.latestPayslipDate }}</span>
                            </div>
                        </div>
                        <div v-else class="text-sm text-gray-500 text-center py-4">
                            No employees with generated payslips found in history.
                        </div>
                    </div>
                    <div class="p-4 border-t flex justify-end gap-2">
                        <button @click="showPrintAllModal = false"
                            class="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
                            Cancel
                        </button>
                        <button @click="printSelectedPayslips"
                            class="flex items-center gap-1 px-4 py-2 text-sm text-white bg-purple-500 rounded hover:bg-purple-600"
                            :disabled="selectedEmployeesForPrint.length === 0 || isPrinting">
                            <span class="material-icons text-sm">print</span>
                            {{ isPrinting ? 'Printing...' : 'Print Selected' }}
                        </button>
                    </div>
                </div>
            </div>

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
import autoTable from 'jspdf-autotable';
import moment from 'moment';
import { useAuthStore } from '@/stores/auth.store.js';

jsPDF.prototype.autoTable = autoTable.default;

export default {
    name: 'SalarySlips',
    data() {
        return {
            employees: [],
            positions: [],
            searchQuery: '',
            currentPage: 1,
            itemsPerPage: 10,
            payslipGenerationStatus: {},
            isLoading: false,
            isGeneratingAll: false,
            statusMessage: '',
            showHistoryModal: false,
            selectedEmployee: null,
            selectedPayslip: null,
            payslipHistory: [],
            allPayslipHistories: {},
            iframeError: false,
            config: {
                minimumWage: 0,
                deMinimisLimit: 0,
                regularHolidays: [],
                specialNonWorkingDays: [],
            },
            showPrintAllModal: false,
            employeesWithPayslips: [],
            selectedEmployeesForPrint: [],
            isPrinting: false,
            selectAll: false,
            showUpdateModal: false,
            selectedEmployeeForUpdate: '',
            newPosition: '',
            sortPreviousField: 'payDate',
            sortPreviousAsc: true,
            sortNewField: 'payDate',
            sortNewAsc: true,
            currentDate: new Date('2025-03-17'), // Matches your initial context; adjust as needed
        };
    },
    setup() {
        const authStore = useAuthStore();
        return { authStore };
    },
    computed: {
        filteredEmployees() {
            return this.employees.filter((employee) => {
                const name = employee && employee.name ? employee.name : '';
                return name.toLowerCase().includes(this.searchQuery.toLowerCase());
            });
        },
        totalPages() {
            return Math.ceil(this.filteredEmployees.length / this.itemsPerPage) || 1;
        },
        paginatedEmployees() {
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            return this.filteredEmployees.slice(start, end).sort((a, b) => {
                return a.position.localeCompare(b.position);
            });
        },
        sortedPositionHistory() {
            if (!this.selectedEmployee || !this.selectedEmployee.positionHistory) {
                return [{
                    position: this.selectedEmployee?.position || 'N/A',
                    salary: this.selectedEmployee?.salary || 0,
                    startDate: this.selectedEmployee?.hireDate || this.currentDate.toISOString().split('T')[0],
                    endDate: null
                }];
            }
            return [...this.selectedEmployee.positionHistory].sort((a, b) =>
                new Date(a.startDate) - new Date(b.startDate)
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
            const previousPayslips = this.payslipHistory.filter(payslip =>
                payslip.position === this.initialPosition.position
            );
            return previousPayslips.sort((a, b) => {
                if (this.sortPreviousField === 'payDate') {
                    const dateA = moment(a.paydayType === 'mid-month' ? a.expectedPaydays.midMonthPayday : a.expectedPaydays.endMonthPayday, 'D MMMM YYYY');
                    const dateB = moment(b.paydayType === 'mid-month' ? b.expectedPaydays.midMonthPayday : b.expectedPaydays.endMonthPayday, 'D MMMM YYYY');
                    return this.sortPreviousAsc ? dateA - dateB : dateB - dateA;
                } else if (this.sortPreviousField === 'position') {
                    const posA = this.getPositionName(a.position);
                    const posB = this.getPositionName(b.position);
                    return this.sortPreviousAsc ? posA.localeCompare(posB) : posB.localeCompare(posA);
                }
                return 0;
            });
        },
sortedNewPayslips() {
            const newPayslips = this.payslipHistory.filter(payslip =>
                payslip.position === this.latestPosition.position &&
                this.hasUpdatedPosition &&
                moment(payslip.salaryMonth, 'YYYY-MM').isSameOrAfter(moment(this.latestPosition.startDate, 'YYYY-MM-DD'), 'month')
            );
            return newPayslips.sort((a, b) => {
                if (this.sortNewField === 'payDate') {
                    const dateA = moment(a.paydayType === 'mid-month' ? a.expectedPaydays.midMonthPayday : a.expectedPaydays.endMonthPayday, 'D MMMM YYYY');
                    const dateB = moment(b.paydayType === 'mid-month' ? b.expectedPaydays.midMonthPayday : b.expectedPaydays.endMonthPayday, 'D MMMM YYYY');
                    return this.sortNewAsc ? dateA - dateB : dateB - dateA;
                } else if (this.sortNewField === 'position') {
                    const posA = this.getPositionName(a.position);
                    const posB = this.getPositionName(b.position);
                    return this.sortNewAsc ? posA.localeCompare(posB) : posB.localeCompare(posA);
                }
                return 0;
            });
        }
    },
    async created() {
        if (!this.authStore.isAuthenticated || !this.authStore.isAdmin) {
            console.error('User is not authenticated as admin. Redirecting to login...');
            this.showErrorMessage('Please log in as an admin to access this page.');
            this.$router.push('/admin-login');
            return;
        }

        this.isLoading = true;
        try {
            await this.fetchConfig();
            await this.fetchPositionsWithRetry();
            await this.fetchEmployees();
        } catch (error) {
            console.error('Error in created hook:', error);
            this.showErrorMessage('Failed to initialize component. Please try again.');
        } finally {
            this.isLoading = false;
        }
    },
    methods: {
        async fetchConfig() {
            try {
                const token = this.authStore.accessToken || localStorage.getItem('token');
                if (!token) throw new Error('No authentication token found');
                const response = await axios.get('http://localhost:7777/api/config', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'admin',
                    },
                });
                this.config = {
                    minimumWage: response.data.minimumWage || 610,
                    deMinimisLimit: response.data.deMinimisLimit || 10000,
                    regularHolidays: response.data.regularHolidays || [],
                    specialNonWorkingDays: response.data.specialNonWorkingDays || [],
                };
            } catch (error) {
                console.error('Error fetching config:', error);
                this.showErrorMessage('Failed to load configuration. Using defaults.');
                this.config = {
                    minimumWage: 610,
                    deMinimisLimit: 10000,
                    regularHolidays: [],
                    specialNonWorkingDays: [],
                };
            }
        },
        async fetchPositionsWithRetry(retries = 3, delay = 1000) {
            for (let i = 0; i < retries; i++) {
                try {
                    const userId = this.authStore.admin?._id || localStorage.getItem('userId') || '';
                    const token = this.authStore.accessToken || localStorage.getItem('token') || '';
                    if (!token) throw new Error('No authentication token found');
                    console.log('Fetching positions with:', { userId, token: token.slice(0, 20) + '...' });
                    const response = await axios.get('http://localhost:7777/api/positions', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'user-role': 'admin',
                            'user-id': userId,
                        },
                    });
                    this.positions = response.data.map(position => ({
                        name: position.name,
                        salary: position.salary
                    }));
                    return;
                } catch (error) {
                    console.error(`Attempt ${i + 1} to fetch positions failed:`, error);
                    if (i === retries - 1) {
                        this.showErrorMessage('Failed to load positions after multiple attempts.');
                    } else {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
        },
        getPositionName(positionName) {
            const position = this.positions.find(p => p.name.trim().toLowerCase() === positionName?.trim().toLowerCase());
            return position ? position.name : positionName || 'Unknown Position';
        },
        getPositionSalary(positionName) {
            const position = this.positions.find(p => p.name.trim().toLowerCase() === positionName?.trim().toLowerCase());
            return position ? position.salary : 0;
        },
        getHourlyRate(positionName) {
            const salary = this.getPositionSalary(positionName);
            return salary / (8 * 22);
        },
        async fetchEmployees() {
            this.isLoading = true;
            this.statusMessage = '';
            const userId = this.authStore.admin?._id || localStorage.getItem('userId') || '';
            const token = this.authStore.accessToken || localStorage.getItem('token') || '';
            console.log('Fetching employees with:', { userId, token: token.slice(0, 20) + '...' });
            try {
                if (!token) throw new Error('No authentication token found');
                const response = await axios.get('http://localhost:7777/api/employees', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'admin',
                        'user-id': userId,
                    },
                });
                this.employees = response.data.map((employee) => {
                    const latestPosition = this.getLatestPosition(employee);
                    const name = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Unnamed Employee';
                    return {
                        ...employee,
                        id: employee._id, // Explicitly set id to _id (string)
                        name,
                        position: latestPosition.position,
                        salary: latestPosition.salary,
                        positionHistory: Array.isArray(employee.positionHistory) && employee.positionHistory.length > 0 ? employee.positionHistory : [{
                            position: employee.position || 'N/A',
                            salary: employee.salary || 0,
                            startDate: employee.hireDate || this.currentDate.toISOString().split('T')[0],
                            endDate: null
                        }],
                        createdAt: employee.createdAt || employee.hireDate,
                        updatedAt: employee.updatedAt
                    };
                });
                this.showSuccessMessage('Employees loaded successfully!');
            } catch (error) {
                console.error('Error fetching employees:', error);
                this.showErrorMessage(`Failed to load employees: ${error.message}`);
            } finally {
                this.isLoading = false;
            }
        },
        async refreshData() {
            this.isLoading = true;
            try {
                await this.fetchConfig();
                await this.fetchPositionsWithRetry();
                await this.fetchEmployees();
                if (this.showHistoryModal && this.selectedEmployee) {
                    await this.showPayslipHistory(this.selectedEmployee);
                }
            } catch (error) {
                console.error('Error refreshing data:', error);
                this.showErrorMessage(`Failed to refresh data: ${error.message}`);
            } finally {
                this.isLoading = false;
            }
        },
        async showPayslipHistory(employee) {
            this.isLoading = true;
            if (!employee || !employee.id || !employee.empNo) {
                this.showErrorMessage('Invalid employee data');
                console.error('Invalid employee:', employee);
                this.isLoading = false;
                return;
            }

            const token = this.authStore.accessToken || localStorage.getItem('token');
            if (!token) {
                this.showErrorMessage('Authentication required. Please log in.');
                this.$router.push('/admin-login');
                return;
            }

            this.selectedEmployee = {
                ...employee,
                positionHistory: Array.isArray(employee.positionHistory) && employee.positionHistory.length > 0 ? employee.positionHistory : [{
                    position: employee.position || 'N/A',
                    salary: employee.salary || 0,
                    startDate: employee.hireDate || this.currentDate.toISOString().split('T')[0],
                    endDate: null
                }]
            };

            const today = moment(this.currentDate);
            const hireDate = moment(this.selectedEmployee.hireDate || this.currentDate);
            let backendPayslips = [];
            try {
                const response = await axios.get(`http://localhost:7777/api/payslips/${this.selectedEmployee.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'admin',
                    },
                });
                backendPayslips = response.data || [];
                console.log('Fetched backend payslips:', backendPayslips);
            } catch (error) {
                console.error('Error fetching payslips:', error);
            }

            const payslipHistory = [];
            let currentPayDate = hireDate.clone();

            while (currentPayDate.isSameOrBefore(today, 'day')) {
                const salaryMonth = currentPayDate.format('YYYY-MM');
                const expectedPaydays = this.getExpectedPayday(hireDate.toDate(), salaryMonth);
                const payDate = currentPayDate.clone();
                const positionAtPayDate = this.getActivePositionForDate(this.selectedEmployee.positionHistory, payDate);
                const paydayType = payDate.date() === 15 ? 'mid-month' : 'end-of-month'; // Adjusted to match backend expectation
                const existingPayslip = backendPayslips.find(p =>
                    p.salaryMonth === salaryMonth && p.paydayType === paydayType && moment(p.payDate).isSame(payDate, 'day')
                ) || {};

                const payslip = {
                    salaryMonth,
                    paydayType,
                    payDate: payDate.format('YYYY-MM-DD'),
                    position: positionAtPayDate.position,
                    salary: positionAtPayDate.salary,
                    totalSalary: existingPayslip.salary ? this.calculateNetSalary({ ...this.selectedEmployee, position: positionAtPayDate.position, salary: positionAtPayDate.salary }) : null,
                    payslipDataUrl: existingPayslip.payslipData ? `data:application/pdf;base64,${existingPayslip.payslipData}` : null,
                    employee: {
                        ...this.selectedEmployee,
                        position: positionAtPayDate.position,
                        salary: positionAtPayDate.salary,
                        salaryMonth: payDate.format('YYYY-MM-DD')
                    },
                    expectedPaydays,
                };
                payslipHistory.push(payslip);

                if (!payslip.payslipDataUrl && today.isSameOrAfter(payDate, 'day')) {
                    await this.generatePayslip(payslip);
                }

                currentPayDate.add(15, 'days');
            }

            this.allPayslipHistories[this.selectedEmployee.id] = payslipHistory;
            this.payslipHistory = payslipHistory;
            this.selectedPayslip = payslipHistory.find(p => p.payslipDataUrl) || payslipHistory[0] || null;
            this.showHistoryModal = true;
            this.isLoading = false;
        },
        canGeneratePayslip(payslip) {
            const today = moment(this.currentDate);
            const payDate = moment(payslip.paydayType === 'mid-month' ? payslip.expectedPaydays.midMonthPayday : payslip.expectedPaydays.endMonthPayday, 'D MMMM YYYY');
            return today.isSameOrAfter(payDate, 'day') && !payslip.payslipDataUrl;
        },
        async generatePayslip(payslip) {
            const employee = payslip.employee;
            if (!employee || !employee.id || !employee.empNo) {
                this.showErrorMessage('Employee data is incomplete.');
                console.error('Invalid employee data:', employee);
                return;
            }

            const payDate = moment(
                payslip.paydayType === 'mid-month'
                    ? `${payslip.salaryMonth}-15`
                    : `${payslip.salaryMonth}-${moment(payslip.salaryMonth).daysInMonth()}`,
                'YYYY-MM-DD'
            );
            if (!payDate.isValid()) {
                this.showErrorMessage('Invalid pay date calculated.');
                console.error('Invalid payDate:', payslip.salaryMonth, payslip.paydayType);
                return;
            }

            const positionHistory = Array.isArray(employee.positionHistory) ? employee.positionHistory : [];
            const activePosition = this.getActivePositionForDate(positionHistory, payDate);
            if (!activePosition || !activePosition.position || activePosition.salary === undefined) {
                this.showErrorMessage('Invalid position or salary for this date.');
                console.error('Invalid activePosition:', activePosition, 'Position History:', positionHistory);
                return;
            }

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
                    position: activePosition.position,
                    salary: Number(activePosition.salary)
                };

                console.log('Sending payload to backend:', payload);

                if (!payload.employeeId || !payload.empNo || !payload.payslipData ||
                    !payload.salaryMonth || !payload.paydayType || !payload.position ||
                    payload.salary === undefined || isNaN(payload.salary)) {
                    throw new Error('Payload is missing required fields or contains invalid data');
                }

                const token = this.authStore.accessToken || localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token available. Please log in.');
                }

                const response = await axios.post('http://localhost:7777/api/payslips/generate', payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'admin'
                    },
                });

                console.log('Payslip generated successfully:', response.data);
                if (response.status === 201 || response.status === 200) {
                    payslip.payslipDataUrl = url;
                    payslip.position = activePosition.position;
                    payslip.salary = activePosition.salary;
                    payslip.totalSalary = this.calculateNetSalary(updatedEmployee);
                    this.selectedPayslip = payslip;

                    const employeeHistory = this.allPayslipHistories[employee.id] || [];
                    const updatedHistory = employeeHistory.map(p =>
                        p.salaryMonth === payslip.salaryMonth && p.paydayType === payslip.paydayType ? payslip : p
                    );
                    if (!employeeHistory.some(p => p.salaryMonth === payslip.salaryMonth && p.paydayType === payslip.paydayType)) {
                        updatedHistory.push(payslip);
                    }
                    this.allPayslipHistories[employee.id] = updatedHistory;
                    this.payslipHistory = updatedHistory;

                    this.showSuccessMessage(`Payslip generated for ${employee.name} - ${payslip.paydayType === 'mid-month' ? payslip.expectedPaydays.midMonthPayday : payslip.expectedPaydays.endMonthPayday}!`);
                }
            } catch (error) {
                console.error('Error generating payslip:', error);
                this.showErrorMessage(`Failed to generate payslip: ${error.message}`);
                if (error.response) {
                    console.error('Backend response:', error.response.data);
                }
                if (error.message === 'No authentication token available. Please log in.') {
                    this.$router.push('/admin-login');
                }
            } finally {
                this.payslipGenerationStatus[key] = { generating: false };
            }
        },
        async generateAllPayslips() {
            this.isGeneratingAll = true;
            this.statusMessage = '';
            try {
                for (const employee of this.employees) {
                    if (!this.allPayslipHistories[employee.id]) {
                        await this.showPayslipHistory(employee);
                        this.showHistoryModal = false;
                    }
                }

                const payslipsToGenerate = [];
                for (const employee of this.employees) {
                    const history = this.allPayslipHistories[employee.id] || [];
                    const duePayslips = history.filter(payslip => this.canGeneratePayslip(payslip));
                    payslipsToGenerate.push(...duePayslips);
                }

                if (payslipsToGenerate.length === 0) {
                    this.showErrorMessage('No payslips are due for generation.');
                    return;
                }

                for (const payslip of payslipsToGenerate) {
                    await this.generatePayslip(payslip);
                }

                this.showSuccessMessage(`Generated ${payslipsToGenerate.length} payslips successfully!`);
            } catch (error) {
                console.error('Error generating all payslips:', error);
                this.showErrorMessage(`Failed to generate all payslips: ${error.message}`);
            } finally {
                this.isGeneratingAll = false;
            }
        },
        getLatestPosition(employee) {
            if (!Array.isArray(employee.positionHistory) || employee.positionHistory.length === 0) {
                return {
                    position: employee.position || 'N/A',
                    salary: employee.salary || 0,
                    startDate: employee.hireDate || this.currentDate.toISOString().split('T')[0]
                };
            }
            const sortedHistory = [...employee.positionHistory].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
            return sortedHistory.find(h => !h.endDate) || sortedHistory[0];
        },
        getActivePositionForDate(positionHistory, date) {
            if (!Array.isArray(positionHistory) || positionHistory.length === 0) {
                return {
                    position: 'N/A',
                    salary: 0,
                    startDate: this.selectedEmployee?.hireDate || this.currentDate.toISOString().split('T')[0]
                };
            }
            const targetDate = moment(date);
            const activePosition = positionHistory.find(history => {
                const startDate = moment(history.startDate);
                const endDate = history.endDate ? moment(history.endDate) : moment(this.currentDate);
                return targetDate.isSameOrAfter(startDate, 'day') && targetDate.isSameOrBefore(endDate, 'day');
            });
            return activePosition || positionHistory[positionHistory.length - 1];
        },
        async generatePayslipNow(employee) {
            this.payslipGenerationStatus.generating = true;
            try {
                const today = moment(this.currentDate);
                const salaryMonth = today.format('YYYY-MM');
                const lastDayOfMonth = today.clone().endOf('month').date();
                const payDate = today.isBefore(moment(`${salaryMonth}-15`, 'YYYY-MM-DD').endOf('day'))
                    ? moment(`${salaryMonth}-15`, 'YYYY-MM-DD')
                    : moment(`${salaryMonth}-${lastDayOfMonth}`, 'YYYY-MM-DD');
                const activePosition = this.getActivePositionForDate(employee.positionHistory, payDate);
                if (!activePosition || !activePosition.position || activePosition.salary === undefined) {
                    this.showErrorMessage('No valid position for current date.');
                    console.error('Invalid activePosition:', activePosition);
                    return;
                }
                const updatedEmployee = { ...employee, position: activePosition.position, salary: activePosition.salary };
                const expectedPaydays = this.getExpectedPayday(employee.hireDate, salaryMonth);

                const paydayType = payDate.date() === 15 ? 'mid-month' : 'end-of-month';
                const employeeSalaryMonth = `${salaryMonth}-${paydayType === 'mid-month' ? '15' : lastDayOfMonth}`;

                let payslipData = {
                    salaryMonth,
                    paydayType,
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
                    employeeId: employee.id, // Use string ID directly
                    empNo: String(employee.empNo),
                    payslipData: base64Data.split(',')[1],
                    salaryMonth: payslipData.salaryMonth,
                    paydayType: payslipData.paydayType,
                    position: activePosition.position,
                    salary: Number(activePosition.salary)
                };

                console.log('Sending payload to backend (generatePayslipNow):', payload);

                if (!payload.employeeId || !payload.empNo || !payload.payslipData ||
                    !payload.salaryMonth || !payload.paydayType || !payload.position ||
                    payload.salary === undefined || isNaN(payload.salary)) {
                    throw new Error('Payload is missing required fields or contains invalid data');
                }

                const token = this.authStore.accessToken || localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token available. Please log in.');
                }

                const response = await axios.post('http://localhost:7777/api/payslips/generate', payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-role': 'admin'
                    },
                });

                console.log('Payslip generated successfully (generatePayslipNow):', response.data);
                if (response.status === 201 || response.status === 200) {
                    payslipData.payslipDataUrl = url;
                    payslipData.totalSalary = this.calculateNetSalary(payslipData.employee);
                    let employeeHistory = this.allPayslipHistories[employee.id] || [];
                    const existingPayslipIndex = employeeHistory.findIndex(p =>
                        p.salaryMonth === payslipData.salaryMonth && p.paydayType === payslipData.paydayType
                    );

                    if (existingPayslipIndex !== -1) {
                        employeeHistory[existingPayslipIndex] = payslipData;
                    } else {
                        employeeHistory.push(payslipData);
                    }

                    this.allPayslipHistories[employee.id] = employeeHistory;
                    this.payslipHistory = employeeHistory;
                    this.selectedPayslip = payslipData;

                    this.showSuccessMessage(`Payslip generated now for ${employee.name} - ${payslipData.paydayType === 'mid-month' ? expectedPaydays.midMonthPayday : expectedPaydays.endMonthPayday}!`);
                }
            } catch (error) {
                console.error('Error generating payslip now:', error);
                this.showErrorMessage(`Failed to generate payslip: ${error.message}`);
                if (error.response) {
                    console.error('Backend response:', error.response.data);
                }
                if (error.message === 'No authentication token available. Please log in.') {
                    this.$router.push('/admin-login');
                }
            } finally {
                this.payslipGenerationStatus.generating = false;
            }
        },
        showUpdatePositionModal() {
            this.selectedEmployeeForUpdate = '';
            this.newPosition = '';
            this.showUpdateModal = true;
        },
        async updateEmployeePosition() {
            if (!this.selectedEmployeeForUpdate || !this.newPosition) return;
            this.isLoading = true;
            try {
                const employee = this.employees.find(emp => emp.id === this.selectedEmployeeForUpdate);
                const newPositionData = this.positions.find(pos => pos.name === this.newPosition);
                const today = moment(this.currentDate).format('YYYY-MM-DD');

                const updatedPositionHistory = employee.positionHistory.map(history => {
                    if (!history.endDate) {
                        return { ...history, endDate: today };
                    }
                    return history;
                });
                updatedPositionHistory.push({
                    position: newPositionData.name,
                    salary: newPositionData.salary,
                    startDate: today,
                    endDate: null
                });

                const response = await axios.put(`http://localhost:7777/api/employees/${employee.id}`, {
                    ...employee,
                    position: newPositionData.name,
                    salary: newPositionData.salary,
                    positionHistory: updatedPositionHistory
                }, {
                    headers: { 'user-role': 'admin' }
                });

                if (response.status === 200) {
                    employee.position = newPositionData.name;
                    employee.salary = newPositionData.salary;
                    employee.positionHistory = updatedPositionHistory;
                    this.showSuccessMessage(`Position updated for ${employee.name} to ${newPositionData.name}!`);
                    this.showUpdateModal = false;

                    await this.showPayslipHistory(employee);
                    await this.generatePayslipNow(employee);
                    this.showHistoryModal = true;
                }
            } catch (error) {
                console.error('Error updating position:', error);
                this.showErrorMessage(`Failed to update position: ${error.message}`);
            } finally {
                this.isLoading = false;
            }
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
        showPrintModal() {
            this.employeesWithPayslips = [];
            this.selectedEmployeesForPrint = [];
            this.selectAll = false;

            for (const employee of this.employees) {
                const history = this.allPayslipHistories[employee.id] || [];
                const generatedPayslips = history.filter(p => p.payslipDataUrl);

                if (generatedPayslips.length > 0) {
                    const latestPayslip = generatedPayslips.reduce((latest, current) => {
                        const latestDate = moment(`${latest.salaryMonth}-${latest.paydayType === 'mid-month' ? '15' : moment(`${latest.salaryMonth}-01`).endOf('month').date()}`, 'YYYY-MM-DD');
                        const currentDate = moment(`${current.salaryMonth}-${current.paydayType === 'mid-month' ? '15' : moment(`${current.salaryMonth}-01`).endOf('month').date()}`, 'YYYY-MM-DD');
                        return currentDate.isAfter(latestDate) ? current : latest;
                    });
                    const latestDateStr = latestPayslip.paydayType === 'mid-month'
                        ? latestPayslip.expectedPaydays.midMonthPayday
                        : latestPayslip.expectedPaydays.endMonthPayday;

                    this.employeesWithPayslips.push({
                        id: employee.id,
                        name: employee.name,
                        latestPayslipDate: latestDateStr,
                        latestPayslip: latestPayslip,
                    });
                }
            }

            if (this.employeesWithPayslips.length === 0) {
                this.showErrorMessage('No employees with generated payslips in history.');
            } else {
                this.showPrintAllModal = true;
            }
        },
        toggleSelectAll() {
            if (this.selectAll) {
                this.selectedEmployeesForPrint = this.employeesWithPayslips.map(emp => emp.id);
            } else {
                this.selectedEmployeesForPrint = [];
            }
        },
        async printSelectedPayslips() {
            if (this.selectedEmployeesForPrint.length === 0) return;

            this.isPrinting = true;
            try {
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: [216, 279]
                });

                for (let i = 0; i < this.selectedEmployeesForPrint.length; i++) {
                    const empId = this.selectedEmployeesForPrint[i];
                    const empData = this.employeesWithPayslips.find(e => e.id === empId);
                    const employee = this.employees.find(e => e.id === empId);
                    const payslip = empData.latestPayslip;
                    const payDate = moment(`${payslip.salaryMonth}-${payslip.paydayType === 'mid-month' ? '15' : moment(payslip.salaryMonth).daysInMonth()}`, 'YYYY-MM-DD');
                    const activePosition = this.getActivePositionForDate(employee.positionHistory, payDate);
                    const updatedEmployee = { ...employee, position: activePosition.position, salary: activePosition.salary };

                    const payslipData = this.createPayslipData(updatedEmployee);
                    await this.generatePdf(payslipData, doc);

                    if (i < this.selectedEmployeesForPrint.length - 1) {
                        doc.addPage();
                    }
                }

                doc.autoPrint();
                window.open(doc.output('bloburl'), '_blank');
                this.showSuccessMessage('Payslips printed successfully!');
                this.showPrintAllModal = false;
            } catch (error) {
                console.error('Error printing payslips:', error);
                this.showErrorMessage(`Failed to print payslips: ${error.message}`);
            } finally {
                this.isPrinting = false;
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
                link.download = `Payslip_${this.selectedEmployee.name}_${this.selectedPayslip.paydayType === 'mid-month' ? this.selectedPayslip.expectedPaydays.midMonthPayday : this.selectedPayslip.expectedPaydays.endMonthPayday}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error downloading payslip:', error);
                this.showErrorMessage('Failed to download payslip.');
            }
        },
        formatDate(date) {
            return moment(date).isValid() ? moment(date).format('D MMMM YYYY') : 'Invalid Date';
        },
        calculateTotalEarnings(employee) {
            const baseEarnings = (employee.earnings ? employee.earnings.travelExpenses : 0) + (employee.earnings ? employee.earnings.otherEarnings : 0);
            const monthlySalary = employee.salary || 0;
            const holidayPay = this.calculateHolidayPay(employee) || 0;
            const overtimePay = this.calculateOvertimePay(employee) || 0;
            const payheadEarnings = this.calculatePayheadEarnings(employee.payheads) || 0;
            const taxableSupplementary = this.calculateSupplementaryIncome(employee) ? this.calculateSupplementaryIncome(employee).taxable : 0;
            return monthlySalary + baseEarnings + holidayPay + overtimePay + payheadEarnings + taxableSupplementary || 0;
        },
        calculatePayheadEarnings(payheads) {
            return payheads
                .filter(p => p.type === 'Earnings')
                .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
        },
        calculatePayheadDeductions(payheads) {
            return payheads
                .filter(p => p.type === 'Deductions')
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
                totalSupplementary: totalSupplementary || 0
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
                totalNonTaxable: basicSalaryMWE + holidayPayMWE + overtimePayMWE + nightShiftDiffMWE + hazardPayMWE + thirteenthMonthExempt + deMinimis + sssContribution + philhealthContribution + pagibigContribution || 0
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
            const isRegularHoliday = regularHolidays.some(holiday => moment(holiday, 'MM/DD/YYYY').format('YYYY-MM') === salaryMonth);
            const isSpecialHoliday = specialNonWorkingDays.some(holiday => moment(holiday, 'MM/DD/YYYY').format('YYYY-MM') === salaryMonth);
            if (isRegularHoliday) return dailyRate * 2 || 0;
            if (isSpecialHoliday) return dailyRate * 1.3 || 0;
            return 0;
        },
        calculateOvertimePay(employee) {
            const hourlyRate = employee.salary / (8 * 22) || 0;
            const regularOTHours = employee.overtimeHours ? employee.overtimeHours.regular : 0;
            const holidayOTHours = employee.overtimeHours ? employee.overtimeHours.holiday : 0;
            const regularOTPay = regularOTHours * hourlyRate * 1.25 || 0;
            const holidayOTPay = holidayOTHours * hourlyRate * 1.3 || 0;
            return regularOTPay + holidayOTPay || 0;
        },
        calculateSSSContribution(salary) {
            const monthlySalaryCredit = Math.min(Math.max(salary || 0, 5000), 35000) || 0;
            const employeeShareRate = 0.045;
            return Math.round(monthlySalaryCredit * employeeShareRate) || 0;
        },
        calculatePhilHealthContribution(salary) {
            const rate = 0.05;
            const monthlySalary = Math.min(salary || 0, 100000) || 0;
            return Math.round((monthlySalary * rate) / 2) || 0;
        },
        calculatePagIBIGContribution(salary) {
            const rate = 0.02;
            const cappedSalary = Math.min(salary || 0, 10000) || 0;
            return Math.round(cappedSalary * rate) || 0;
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
        getExpectedPayday(hireDate, salaryMonth) {
            const [year, month] = salaryMonth.split('-').map(part => parseInt(part, 10));
            const lastDay = new Date(year, month, 0).getDate();
            let payday1 = new Date(year, month - 1, 15);
            let payday2 = new Date(year, month - 1, lastDay);

            const hireMoment = moment(hireDate);
            if (hireMoment.isAfter(moment(`${year}-${month}-15`, 'YYYY-MM-DD'))) {
                payday1 = hireMoment.toDate();
            }
            if (hireMoment.isAfter(moment(`${year}-${month}-${lastDay}`, 'YYYY-MM-DD'))) {
                payday2 = hireMoment.toDate();
            }

            const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;
            while (isWeekend(payday1)) {
                const nextDay = new Date(payday1);
                nextDay.setDate(payday1.getDate() + 1);
                if (nextDay.getMonth() !== payday1.getMonth()) break;
                payday1 = nextDay;
            }
            while (isWeekend(payday2)) {
                const prevDay = new Date(payday2);
                prevDay.setDate(payday2.getDate() - 1);
                if (prevDay.getMonth() !== payday2.getMonth()) break;
                payday2 = prevDay;
            }

            return {
                midMonthPayday: payday1.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
                endMonthPayday: payday2.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
            };
        },
        createPayslipData(employee) {
            const salaryDate = moment(employee.salaryMonth, 'YYYY-MM-DD').format('MM/DD/YYYY');
            const basicSalary = employee.salary || 0;
            const sss = this.calculateSSSContribution(basicSalary) || 0;
            const philhealth = this.calculatePhilHealthContribution(basicSalary) || 0;
            const pagibig = this.calculatePagIBIGContribution(basicSalary) || 0;
            const totalDeductions = sss + philhealth + pagibig + (this.calculateWithholdingTax(employee) || 0) || 0;
            const netSalary = this.calculateNetSalary(employee) || 0;
            const paidLeavesDays = employee.paidLeaves ? employee.paidLeaves.days : 0;
            const absencesDays = employee.absences ? employee.absences.days : 0;
            const paidLeavesAmount = employee.paidLeaves ? employee.paidLeaves.amount : 0;
            const absencesAmount = employee.absences ? -(employee.absences.amount) : 0;
            const paydays = this.getExpectedPayday(employee.hireDate, employee.salaryMonth.split('-')[0] + '-' + employee.salaryMonth.split('-')[1]);

            return {
                salaryDate: salaryDate,
                empNo: employee.empNo || 'N/A',
                lastName: employee.lastName || 'N/A',
                middleName: employee.middleName || 'N/A',
                firstName: employee.firstName || 'N/A',
                birthDate: moment(employee.birthDate).isValid() ? moment(employee.birthDate).format('MM/DD/YYYY') : 'N/A',
                hireDate: moment(employee.hireDate).isValid() ? moment(employee.hireDate).format('MM/DD/YYYY') : 'N/A',
                civilStatus: employee.civilStatus || 'SINGLE',
                dependents: employee.dependents || 0,
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
                paidLeavesDays: paidLeavesDays,
                absencesDays: absencesDays,
                paidLeavesAmount: this.formatNumber(paidLeavesAmount),
                absencesAmount: this.formatNumber(absencesAmount),
                withholdingTax: this.formatNumber(this.calculateWithholdingTax(employee) || 0),
                payheads: employee.payheads || [],
                expectedPaydays: paydays
            };
        },
        formatNumber(value) {
            const num = Number(value) || 0;
            return num.toFixed(2);
        },
        async generatePdf(payslipData, doc) {
            const pdfDoc = doc || new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [216, 279]
            });

            pdfDoc.setFont('Helvetica');

            const margin = 10;
            const pageWidth = pdfDoc.internal.pageSize.getWidth();
            const contentWidth = pageWidth - 2 * margin;
            const columnWidth = (contentWidth - 20) / 2;
            const lineHeight = 5;
            const pageHeight = pdfDoc.internal.pageSize.getHeight();

            function addText(doc, text, x, y, options) {
                options = options || {};
                text = text || 'N/A';
                text = text.replace('₱', 'P');
                doc.setFontSize(options.fontSize || 10);
                doc.setFont(options.font || 'Helvetica', options.fontStyle || 'normal');
                doc.setTextColor(
                    options.textColor ? options.textColor[0] : 0,
                    options.textColor ? options.textColor[1] : 0,
                    options.textColor ? options.textColor[2] : 0
                );
                doc.text(text, x, y, { align: options.align || 'left', maxWidth: options.maxWidth });
            }

            function addLabelValue(doc, label, value, x, y) {
                addText(doc, label, x, y, { fontSize: 9, fontStyle: 'bold' });
                addText(doc, value, x + 35, y, { fontSize: 9, maxWidth: columnWidth - 35 });
            }

            pdfDoc.setFillColor(0, 128, 0);
            pdfDoc.rect(margin, margin, contentWidth, 10, 'F');
            addText(pdfDoc, 'RIGHTJOB Solutions', margin + 5, margin + 7, { fontSize: 12, fontStyle: 'bold', textColor: [255, 255, 255] });
            addText(pdfDoc, 'PAYSLIP', margin + contentWidth / 2, margin + 7, { fontSize: 12, fontStyle: 'bold', textColor: [255, 255, 255], align: 'center' });

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
                ['Basic Salary', `P${payslipData.basicSalary}`]
            ];
            leftPersonalInfo.forEach(([label, value], index) => {
                addLabelValue(pdfDoc, label, value, margin, y + index * lineHeight);
            });

            let yRight = y;
            addText(pdfDoc, 'Additional Info', margin + columnWidth + 10, yRight, { fontSize: 11, fontStyle: 'bold' });
            yRight += lineHeight;
            const rightPersonalInfo = [
                ['Civil Status', payslipData.civilStatus],
                ['Dependents', payslipData.dependents.toString()],
                ['SSS', payslipData.sss],
                ['TIN', payslipData.tin],
                ['Philhealth', payslipData.philhealth],
                ['PAG-IBIG', payslipData.pagibig]
            ];
            rightPersonalInfo.forEach(([label, value], index) => {
                addLabelValue(pdfDoc, label, value, margin + columnWidth + 10, yRight + index * lineHeight);
            });

            y = Math.max(y + leftPersonalInfo.length * lineHeight, yRight + rightPersonalInfo.length * lineHeight) + 10;

            addText(pdfDoc, 'Expected Paydays', margin, y, { fontSize: 11, fontStyle: 'bold' });
            addText(pdfDoc, 'Mid-Month:', margin, y + lineHeight);
            addText(pdfDoc, payslipData.expectedPaydays.midMonthPayday, margin + 35, y + lineHeight, { maxWidth: columnWidth - 35 });
            addText(pdfDoc, 'End-of-Month:', margin + columnWidth + 10, y + lineHeight);
            addText(pdfDoc, payslipData.expectedPaydays.endMonthPayday, margin + columnWidth + 45, y + lineHeight, { maxWidth: columnWidth - 35 });
            y += 2 * lineHeight + 10;

            addText(pdfDoc, 'Deductions', margin, y, { fontSize: 11, fontStyle: 'bold' });
            y += lineHeight;
            const leftDeductions = [
                ['SSS', `P${payslipData.sssDeduction}`],
                ['Philhealth', `P${payslipData.philhealthDeduction}`],
                ['PAG-IBIG', `P${payslipData.pagibigDeduction}`]
            ];
            leftDeductions.forEach(([label, value], index) => {
                addLabelValue(pdfDoc, label, value, margin, y + index * lineHeight);
            });

            const rightDeductions = [
                ['Withholding Tax', `P${payslipData.withholdingTax}`]
            ];
            rightDeductions.forEach(([label, value], index) => {
                addLabelValue(pdfDoc, label, value, margin + columnWidth + 10, y + index * lineHeight);
            });
            y += Math.max(leftDeductions.length, rightDeductions.length) * lineHeight + 10;

            addText(pdfDoc, 'Summary', margin, y, { fontSize: 11, fontStyle: 'bold' });
            y += lineHeight;
            addText(pdfDoc, 'Total Deductions:', margin, y, { fontSize: 9, fontStyle: 'bold' });
            addText(pdfDoc, `(P${payslipData.totalDeductions})`, margin + 35, y, { fontSize: 9 });
            addText(pdfDoc, 'Net Salary:', margin + columnWidth + 10, y, { fontSize: 9, fontStyle: 'bold' });
            addText(pdfDoc, `P${payslipData.netSalary}`, margin + columnWidth + 45, y, { fontSize: 9 });

            const footerY = pageHeight - margin - 5;
            addText(pdfDoc, 'This is a computer-generated payslip; no signature required.', margin + contentWidth / 2, footerY, { fontSize: 8, align: 'center' });

            if (!doc) {
                return pdfDoc.output('blob');
            }
        },
        blobToBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        },
        prevPage() {
            if (this.currentPage > 1) this.currentPage--;
        },
        nextPage() {
            if (this.currentPage < this.totalPages) this.currentPage++;
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
        }
    }
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

.large-checkbox {
    width: 1.25rem;
    height: 1.25rem;
}
</style>