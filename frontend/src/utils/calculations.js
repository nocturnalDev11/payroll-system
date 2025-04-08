import moment from "moment";

export const config = {
    minimumWage: 610,
    deMinimisLimit: 90000,
    regularHolidays: [],
    specialNonWorkingDays: [],
};

export function calculateSSSContribution(salary) {
    const monthlySalary = Math.max(salary || 0, 0);
    if (monthlySalary < 5000) return 250;
    const salaryCredit = Math.min(Math.max(monthlySalary, 5000), 35000);
    const regularSSContribution = Math.round(salaryCredit * 0.05);
    const mpfContribution = salaryCredit > 20000 ? Math.round((Math.min(salaryCredit, 35000) - 20000) * 0.025) : 0;
    return salaryCredit > 34750 ? 1750 : regularSSContribution + mpfContribution;
}

export function calculatePhilHealthContribution(salary) {
    const monthlySalary = Math.max(salary || 0, 0);
    return Math.round(Math.min(Math.max(monthlySalary, 10000), 100000) * 0.025);
}

export function calculatePagIBIGContribution(salary) {
    const cappedSalary = Math.min(Math.max(salary || 0, 0), 5000);
    return Math.round(cappedSalary * (cappedSalary <= 1500 ? 0.01 : 0.02));
}

export function calculateWithholdingTax(taxableIncome) {
    if (taxableIncome <= 20833) return 0;
    if (taxableIncome <= 33333) return Math.round((taxableIncome - 20833) * 0.15);
    if (taxableIncome <= 66667) return Math.round(1875 + (taxableIncome - 33333) * 0.20);
    if (taxableIncome <= 166667) return Math.round(13541.80 + (taxableIncome - 66667) * 0.25);
    if (taxableIncome <= 666667) return Math.round(90841.80 + (taxableIncome - 166667) * 0.30);
    return Math.round(408841.80 + (taxableIncome - 666667) * 0.35);
}

export function calculatePayheadAmount(payheads, type) {
    return (Array.isArray(payheads) ? payheads : [])
        .filter(p => p?.type === type)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
}

export function calculateSupplementaryIncome(employee) {
    const {
        commission = 0,
        profitSharing = 0,
        fees = 0,
        thirteenthMonthPay = 0,
        hazardPay = 0,
        overtimeHours = {},
        otherTaxable = 0,
        salary = 0,
    } = employee || {};

    const hourlyRate = salary / (8 * 22);
    const otPay = (overtimeHours.regular || 0) * hourlyRate * 1.25 + (overtimeHours.holiday || 0) * hourlyRate * 1.3;

    const total = commission + profitSharing + fees + thirteenthMonthPay + hazardPay + otPay + otherTaxable;
    const exempt13th = Math.min(thirteenthMonthPay, 90000);
    const taxable13th = Math.max(0, thirteenthMonthPay - 90000);

    return {
        totalSupplementary: total,
        taxable: commission + profitSharing + fees + taxable13th + hazardPay + otPay + otherTaxable,
        nonTaxable: exempt13th
    };
}

// Non-taxable computation
export function calculateNonTaxableIncome(employee) {
    const isMWE = (employee.salary / 30) <= config.minimumWage;
    const basic = isMWE ? employee.salary : 0;
    const dailyRate = employee.salary / 30;
    const ot = isMWE ? calculateOvertimePay(employee) : 0;
    const holiday = isMWE ? calculateHolidayPay(employee) : 0;
    const nightDiff = isMWE ? (employee.nightShiftDiff || 0) : 0;
    const hazard = isMWE ? (employee.hazardPay || 0) : 0;
    const deMinimis = Math.min(employee.deMinimis || 0, config.deMinimisLimit);
    const thirteenthMonth = Math.min(employee.thirteenthMonthPay || 0, 90000);

    return {
        totalNonTaxable:
            basic + holiday + ot + nightDiff + hazard +
            thirteenthMonth + deMinimis +
            calculateSSSContribution(employee.salary) +
            calculatePhilHealthContribution(employee.salary) +
            calculatePagIBIGContribution(employee.salary)
    };
}

// Core salary breakdowns
export function calculateHolidayPay(employee) {
    const dailyRate = (employee.salary / 30) || 0;
    const salaryMonth = employee.salaryMonth
        ? employee.salaryMonth.split('-').slice(0, 2).join('-')
        : moment().format('YYYY-MM');

    const isRegular = config.regularHolidays.some(date => moment(date, 'MM/DD/YYYY').format('YYYY-MM') === salaryMonth);
    const isSpecial = config.specialNonWorkingDays.some(date => moment(date, 'MM/DD/YYYY').format('YYYY-MM') === salaryMonth);

    return isRegular ? dailyRate * 2 : isSpecial ? dailyRate * 1.3 : 0;
}

export function calculateOvertimePay(employee) {
    const hourlyRate = employee.salary / (8 * 22);
    const regularOT = (employee.overtimeHours?.regular || 0) * hourlyRate * 1.25;
    const holidayOT = (employee.overtimeHours?.holiday || 0) * hourlyRate * 1.3;
    return regularOT + holidayOT;
}

export function calculateTotalEarnings(employee) {
    const baseEarnings = (employee.earnings?.travelExpenses || 0) + (employee.earnings?.otherEarnings || 0);
    const payheadEarnings = calculatePayheadAmount(employee.payheads, 'Earnings');
    const supplementary = calculateSupplementaryIncome(employee).taxable;
    const holidayPay = calculateHolidayPay(employee);
    const overtime = calculateOvertimePay(employee);

    return (employee.salary || 0) + baseEarnings + payheadEarnings + supplementary + holidayPay + overtime;
}

export function calculateTotalDeductions(employee) {
    const sss = calculateSSSContribution(employee.salary);
    const philhealth = calculatePhilHealthContribution(employee.salary);
    const pagibig = calculatePagIBIGContribution(employee.salary);
    const tax = calculateWithholdingTax(
        calculateTotalEarnings(employee) - calculateNonTaxableIncome(employee).totalNonTaxable
    );
    const payheadDeductions = calculatePayheadAmount(employee.payheads, 'Deductions');

    return sss + philhealth + pagibig + tax + payheadDeductions;
}

export function calculateNetSalary(employee) {
    return employee && employee.salary ? calculateTotalEarnings(employee) - calculateTotalDeductions(employee) : 0;
}

export function calculateRequestNetSalary(request) {
    if (!request || !request.salary) return 0;
    const totalEarnings = (request.earnings?.travelExpenses || 0) + (request.earnings?.otherEarnings || 0) + (request.salary || 0);
    return totalEarnings - (
        calculateSSSContribution(request.salary) +
        calculatePhilHealthContribution(request.salary) +
        calculatePagIBIGContribution(request.salary) +
        calculateWithholdingTax(request.salary)
    );
}

export function calculateNewEmployeeNetSalary(employee) {
    if (!employee || !employee.salary) return 0;
    const totalEarnings = employee.salary + (employee.earnings?.travelExpenses || 0) + (employee.earnings?.otherEarnings || 0);
    return totalEarnings - (
        calculateSSSContribution(employee.salary) +
        calculatePhilHealthContribution(employee.salary) +
        calculatePagIBIGContribution(employee.salary) +
        calculateWithholdingTax(employee.salary)
    );
}