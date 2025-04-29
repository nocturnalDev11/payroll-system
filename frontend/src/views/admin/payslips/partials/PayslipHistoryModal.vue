<script>
import moment from 'moment';

export default {
    props: {
        show: Boolean,
        selectedEmployee: Object,
        payslipHistory: Array,
        selectedPayslip: Object,
        payslipGenerationStatus: Object,
        isLoading: Boolean,
        iframeError: Boolean,
        sortPreviousField: String,
        sortPreviousAsc: Boolean,
        sortNewField: String,
        sortNewAsc: Boolean,
        positions: Array,
        currentDate: String
    },
    emits: ['close', 'generate-payslip-now', 'generate-payslip', 'select-payslip', 'sort-previous', 'sort-new', 'download-payslip', 'iframe-load', 'iframe-error'],
    computed: {
        sortedPositionHistory() {
            if (!this.selectedEmployee || !this.selectedEmployee.positionHistory) {
                return [{
                    position: this.selectedEmployee?.position || 'N/A',
                    salary: this.selectedEmployee?.salary || 0,
                    startDate: this.selectedEmployee?.hireDate || this.currentDate,
                    endDate: null
                }];
            }
            return [...this.selectedEmployee.positionHistory].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
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
            const previousPayslips = this.payslipHistory.filter(payslip => payslip.position === this.initialPosition.position);
            return previousPayslips.sort((a, b) => {
                if (this.sortPreviousField === 'payDate') {
                    const dateA = moment(a.payDate, 'YYYY-MM-DD');
                    const dateB = moment(b.payDate, 'YYYY-MM-DD');
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
                    const dateA = moment(a.payDate, 'YYYY-MM-DD');
                    const dateB = moment(b.payDate, 'YYYY-MM-DD');
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
    methods: {
        getPositionName(positionName) {
            const position = this.positions.find(p => p.name.trim().toLowerCase() === positionName?.trim().toLowerCase());
            return position ? position.name : positionName || 'Unknown Position';
        },
        canGeneratePayslip(payslip) {
            const today = moment(this.currentDate);
            const payDate = moment(payslip.paydayType === 'mid-month' ? payslip.expectedPaydays.midMonthPayday : payslip.expectedPaydays.endMonthPayday, 'D MMMM YYYY');
            return today.isSameOrAfter(payDate, 'day') && !payslip.payslipDataUrl;
        }
    }
};
</script>

<template>
    <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[80vh] flex flex-col">
            <div class="flex items-center justify-between p-4 border-b border-gray-300">
                <h2 class="text-base font-medium text-gray-800 flex items-center gap-1">
                    <span class="material-icons text-sm">history</span>
                    Payslip History - {{ selectedEmployee?.name }}
                </h2>
                <div class="flex items-center gap-2">
                    <button @click.stop="$emit('generate-payslip-now', selectedEmployee)"
                        class="flex items-center justify-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 px-4 rounded-md"
                        :disabled="isLoading || payslipGenerationStatus.generating">
                        <span class="material-icons text-sm">play_arrow</span>
                        {{ payslipGenerationStatus.generating ? 'Generating...' : 'Generate Now' }}
                    </button>
                    <button @click="$emit('close')" class="p-1 hover:bg-gray-100 rounded-full">
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
                                    @click="$emit('sort-previous', 'payDate')">
                                    Pay Date <span class="material-icons text-xs">{{ sortPreviousField === 'payDate' ?
                                        (sortPreviousAsc ? 'arrow_upward' : 'arrow_downward') : '' }}</span>
                                </th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer"
                                    @click="$emit('sort-previous', 'position')">
                                    Position <span class="material-icons text-xs">{{ sortPreviousField === 'position' ?
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
                                @click="$emit('select-payslip', payslip)">
                                <td class="px-4 py-2 text-sm text-gray-900">{{ payslip.paydayType === 'mid-month' ?
                                    payslip.expectedPaydays.midMonthPayday : payslip.expectedPaydays.endMonthPayday }}
                                </td>
                                <td class="px-4 py-2 text-sm text-gray-500">{{ getPositionName(payslip.position) }}</td>
                                <td class="px-4 py-2 text-sm text-gray-500">₱{{ payslip.salary.toLocaleString() }}</td>
                                <td class="px-4 py-2 text-sm text-gray-500">{{ payslip.payslipDataUrl ? 'Generated' :
                                    'Pending' }}</td>
                                <td class="px-4 py-2">
                                    <button v-if="!payslip.payslipDataUrl"
                                        @click.stop="$emit('generate-payslip', payslip)"
                                        class="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                        :disabled="!canGeneratePayslip(payslip) || payslipGenerationStatus[`${payslip.salaryMonth}-${payslip.paydayType}`]?.generating">
                                        <span class="material-icons text-sm">description</span>
                                        {{
                                            payslipGenerationStatus[`${payslip.salaryMonth}-${payslip.paydayType}`]?.generating
                                        ? 'Generating...' : 'Generate' }}
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="sortedPreviousPayslips.length === 0">
                                <td colspan="5" class="px-4 py-4 text-center text-sm text-gray-500">No previous payslips
                                    available.</td>
                            </tr>
                        </tbody>
                    </table>

                    <div v-if="hasUpdatedPosition">
                        <h3 class="text-sm font-medium text-gray-700 mt-6 mb-2">New Position Payslips</h3>
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50 sticky top-0">
                                <tr>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer"
                                        @click="$emit('sort-new', 'payDate')">
                                        Pay Date <span class="material-icons text-xs">{{ sortNewField === 'payDate' ?
                                            (sortNewAsc ? 'arrow_upward' : 'arrow_downward') : '' }}</span>
                                    </th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer"
                                        @click="$emit('sort-new', 'position')">
                                        Position <span class="material-icons text-xs">{{ sortNewField === 'position' ?
                                            (sortNewAsc ? 'arrow_upward' : 'arrow_downward') : '' }}</span>
                                    </th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Salary</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr v-for="payslip in sortedNewPayslips"
                                    :key="`${payslip.salaryMonth}-${payslip.paydayType}`"
                                    class="hover:bg-blue-50 cursor-pointer"
                                    :class="{ 'bg-blue-100': selectedPayslip?.salaryMonth === payslip.salaryMonth && selectedPayslip?.paydayType === payslip.paydayType }"
                                    @click="$emit('select-payslip', payslip)">
                                    <td class="px-4 py-2 text-sm text-gray-900">{{ payslip.paydayType === 'mid-month' ?
                                        payslip.expectedPaydays.midMonthPayday : payslip.expectedPaydays.endMonthPayday
                                        }}</td>
                                    <td class="px-4 py-2 text-sm text-gray-500">{{ getPositionName(payslip.position) }}
                                    </td>
                                    <td class="px-4 py-2 text-sm text-gray-500">₱{{ payslip.salary.toLocaleString() }}
                                    </td>
                                    <td class="px-4 py-2 text-sm text-gray-500">{{ payslip.payslipDataUrl ? 'Generated'
                                        : 'Pending' }}</td>
                                    <td class="px-4 py-2">
                                        <button v-if="!payslip.payslipDataUrl"
                                            @click.stop="$emit('generate-payslip', payslip)"
                                            class="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                            :disabled="!canGeneratePayslip(payslip) || payslipGenerationStatus[`${payslip.salaryMonth}-${payslip.paydayType}`]?.generating">
                                            <span class="material-icons text-sm">description</span>
                                            {{
                                                payslipGenerationStatus[`${payslip.salaryMonth}-${payslip.paydayType}`]?.generating
                                            ? 'Generating...' : 'Generate' }}
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="sortedNewPayslips.length === 0">
                                    <td colspan="5" class="px-4 py-4 text-center text-sm text-gray-500">No new payslips
                                        available.</td>
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
                                Position: {{ getPositionName(selectedPayslip.position) }} | Salary: ₱{{
                                selectedPayslip.salary.toLocaleString() }}
                            </p>
                        </div>
                        <iframe :src="selectedPayslip.payslipDataUrl" class="w-full h-[50vh] rounded border mb-4"
                            @load="$emit('iframe-load')" @error="$emit('iframe-error')"></iframe>
                        <button @click="$emit('download-payslip')"
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
</template>

<style scoped>
.transition-colors {
    transition: background-color 0.2s ease-in-out;
}

.hover\:bg-blue-50:hover {
    background-color: #eff6ff;
}
</style>