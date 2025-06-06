import moment from 'moment';

// Utility function to ensure a number or default to 0
const toNumber = (value) => Number(value || 0);

// Main calculation functions
export const calculateTotalEarnings = (employee, config) => {
    const baseEarnings = toNumber(employee.earnings?.travelExpenses) + toNumber(employee.earnings?.otherEarnings);
    const monthlySalary = toNumber(employee.salary);
    const holidayPay = calculateHolidayPay(employee, config);
    const overtimePay = calculateOvertimePay(employee);
    const payheadEarnings = calculatePayheadEarnings(employee.payheads);
    const taxableSupplementary = calculateSupplementaryIncome(employee)?.taxable || 0;
    return monthlySalary + baseEarnings + holidayPay + overtimePay + payheadEarnings + taxableSupplementary;
};

export const calculatePayheadEarnings = (payheads) => {
    const sanitizedPayheads = Array.isArray(payheads)
        ? payheads.filter((p) => p && typeof p === 'object' && 'type' in p && 'amount' in p)
        : [];
    return sanitizedPayheads
        .filter((p) => p.type === 'Earnings')
        .reduce((sum, p) => sum + toNumber(p.amount), 0);
};

export const calculatePayheadDeductions = (payheads) => {
    const sanitizedPayheads = Array.isArray(payheads)
        ? payheads.filter((p) => p && typeof p === 'object' && 'type' in p && 'amount' in p)
        : [];
    return sanitizedPayheads
        .filter((p) => p.type === 'Deductions')
        .reduce((sum, p) => sum + toNumber(p.amount), 0);
};

export const calculateSupplementaryIncome = (employee) => {
    const commission = toNumber(employee.commission);
    const profitSharing = toNumber(employee.profitSharing);
    const fees = toNumber(employee.fees);
    const thirteenthMonthPay = toNumber(employee.thirteenthMonthPay);
    const hazardPay = toNumber(employee.hazardPay);
    const overtimePay = calculateOvertimePay(employee);
    const otherTaxable = toNumber(employee.otherTaxable);

    const totalSupplementary = commission + profitSharing + fees + thirteenthMonthPay + hazardPay + overtimePay + otherTaxable;
    const exemptThirteenthMonth = Math.min(thirteenthMonthPay, 90000);
    const taxableThirteenthMonth = Math.max(0, thirteenthMonthPay - 90000);

    const taxableSupplementaryIncome = commission + profitSharing + fees + taxableThirteenthMonth + hazardPay + overtimePay + otherTaxable;

    return {
        taxable: taxableSupplementaryIncome,
        nonTaxable: exemptThirteenthMonth,
        totalSupplementary,
    };
};

export const calculateNonTaxableIncome = (employee, config) => {
    const isMWE = (employee.salary / 30) <= config.minimumWage;
    const basicSalaryMWE = isMWE ? toNumber(employee.salary) : 0;
    const holidayPayMWE = isMWE ? calculateHolidayPay(employee, config) : 0;
    const overtimePayMWE = isMWE ? calculateOvertimePay(employee) : 0;
    const nightShiftDiffMWE = isMWE ? toNumber(employee.nightShiftDiff) : 0;
    const hazardPayMWE = isMWE ? toNumber(employee.hazardPay) : 0;
    const thirteenthMonthExempt = Math.min(toNumber(employee.thirteenthMonthPay), 90000);
    const deMinimis = Math.min(toNumber(employee.deMinimis), config.deMinimisLimit);
    const sssContribution = calculateSSSContribution(employee.salary);
    const philhealthContribution = calculatePhilHealthContribution(employee.salary);
    const pagibigContribution = calculatePagIBIGContribution(employee.salary);

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
            pagibigContribution,
    };
};

export const calculateLateDeductions = (attendanceRecords, salaryMonth, paydayType) => {
    const [year, month] = salaryMonth.split('-').map(Number);
    const startDate = moment([year, month - 1]).startOf('month');
    const endDate = paydayType === 'mid-month'
        ? moment([year, month - 1, 15]).endOf('day')
        : moment([year, month - 1]).endOf('month');

    const relevantRecords = attendanceRecords.filter(record => {
        const recordDate = moment(record.date);
        return recordDate.isSameOrAfter(startDate) && recordDate.isSameOrBefore(endDate);
    });

    return relevantRecords.reduce((sum, record) => sum + toNumber(record.lateDeduction), 0);
};

export const calculateTotalDeductions = (employee, config, attendanceRecords, salaryMonth, paydayType) => {
    const sssContribution = calculateSSSContribution(employee.salary);
    const philhealthContribution = calculatePhilHealthContribution(employee.salary);
    const pagibigContribution = calculatePagIBIGContribution(employee.salary);
    const withholdingTax = calculateWithholdingTax(employee, config);
    const payheadDeductions = calculatePayheadDeductions(employee.payheads);
    const lateDeductions = attendanceRecords
        ? calculateLateDeductions(attendanceRecords, salaryMonth, paydayType)
        : toNumber(employee.lateDeductions);

    return sssContribution + philhealthContribution + pagibigContribution + withholdingTax + payheadDeductions + lateDeductions;
};

export const calculateNetSalary = (employee, config, attendanceRecords, salaryMonth, paydayType) => {
    const totalEarnings = calculateTotalEarnings(employee, config);
    const totalDeductions = calculateTotalDeductions(employee, config, attendanceRecords, salaryMonth, paydayType);
    return totalEarnings - totalDeductions;
};

export const calculateHolidayPay = (employee, config) => {
    const dailyRate = toNumber(employee.salary) / 30;
    const salaryMonth = employee.salaryMonth
        ? employee.salaryMonth.split('-')[0] + '-' + employee.salaryMonth.split('-')[1]
        : moment().format('YYYY-MM');
    const regularHolidays = config.regularHolidays || [];
    const specialNonWorkingDays = config.specialNonWorkingDays || [];
    const isRegularHoliday = regularHolidays.some((holiday) =>
        moment(holiday, 'MM/DD/YYYY').format('YYYY-MM') === salaryMonth
    );
    const isSpecialHoliday = specialNonWorkingDays.some((holiday) =>
        moment(holiday, 'MM/DD/YYYY').format('YYYY-MM') === salaryMonth
    );
    if (isRegularHoliday) return dailyRate * 2;
    if (isSpecialHoliday) return dailyRate * 1.3;
    return 0;
};

export const calculateOvertimePay = (employee) => {
    const hourlyRate = toNumber(employee.salary) / (8 * 22);
    const regularOTHours = toNumber(employee.overtimeHours?.regular);
    const holidayOTHours = toNumber(employee.overtimeHours?.holiday);
    const regularOTPay = regularOTHours * hourlyRate * 1.25;
    const holidayOTPay = holidayOTHours * hourlyRate * 1.3;
    return regularOTPay + holidayOTPay;
};

export const calculateSSSContribution = (salary) => {
    const monthlySalaryCredit = Math.min(Math.max(toNumber(salary), 5000), 35000);
    const employeeShareRate = 0.045;
    return Math.round(monthlySalaryCredit * employeeShareRate);
};

export const calculatePhilHealthContribution = (salary) => {
    const rate = 0.05;
    const monthlySalary = Math.min(toNumber(salary), 100000);
    return Math.round((monthlySalary * rate) / 2);
};

export const calculatePagIBIGContribution = (salary) => {
    const cappedSalary = Math.min(toNumber(salary), 5000); // Cap salary at 5,000 for Pag-IBIG
    const contribution = cappedSalary * 0.02; // 2% rate
    return Math.min(contribution, 100); // Cap contribution at 100
};

export const calculateWithholdingTax = (employee, config) => {
    const nonTaxable = calculateNonTaxableIncome(employee, config).totalNonTaxable;
    const taxableIncome = calculateTotalEarnings(employee, config) - nonTaxable;
    if (taxableIncome <= 20833) return 0;
    if (taxableIncome <= 33333) return (taxableIncome - 20833) * 0.15; // Keep as decimal for precision
    if (taxableIncome <= 66667) return 1875 + (taxableIncome - 33333) * 0.20;
    if (taxableIncome <= 166667) return 13541.80 + (taxableIncome - 66667) * 0.25;
    if (taxableIncome <= 666667) return 90841.80 + (taxableIncome - 166667) * 0.30;
    return 408841.80 + (taxableIncome - 666667) * 0.35;
};