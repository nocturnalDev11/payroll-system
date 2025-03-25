/**
 * Calculates SSS contribution based on monthly salary
 * @param {number} salary Monthly salary amount
 * @returns {number} Calculated SSS contribution
 */
export const calculateSSSContribution = (salary) => {
    const monthlySalary = Math.max(salary || 0, 0);
    if (monthlySalary < 5000) return 250;
    
    const salaryCredit = Math.min(Math.max(monthlySalary, 5000), 35000);
    const regularSSContribution = Math.round(salaryCredit * 0.05);
    let mpfContribution = 0;
    
    if (salaryCredit > 20000) {
        const mpfBase = Math.min(salaryCredit, 35000) - 20000;
        mpfContribution = Math.round(mpfBase * 0.025);
    }
    
    let totalEmployeeContribution = regularSSContribution + mpfContribution;
    if (salaryCredit > 34750) {
        totalEmployeeContribution = 1750;
    }
    return totalEmployeeContribution;
};

/**
 * Calculates PhilHealth contribution based on monthly salary
 * @param {number} salary Monthly salary amount
 * @returns {number} Calculated PhilHealth contribution
 */
export const calculatePhilHealthContribution = (salary) => {
    const monthlySalary = Math.max(salary || 0, 0);
    const minSalary = 10000;
    const maxSalary = 100000;
    const cappedSalary = Math.min(Math.max(monthlySalary, minSalary), maxSalary);
    return Math.round(cappedSalary * 0.025);
};

/**
 * Calculates Pag-IBIG contribution based on monthly salary
 * @param {number} salary Monthly salary amount
 * @returns {number} Calculated Pag-IBIG contribution
 */
export const calculatePagIBIGContribution = (salary) => {
    const monthlySalary = Math.max(salary || 0, 0);
    const maxSalary = 5000;
    const cappedSalary = Math.min(monthlySalary, maxSalary);
    let rate = 0.02;
    if (cappedSalary <= 1500) {
        rate = 0.01;
    }
    return Math.round(cappedSalary * rate);
};

/**
 * Calculates withholding tax based on monthly taxable income
 * @param {number} taxableIncome Monthly taxable income
 * @returns {number} Calculated withholding tax
 */
export const calculateWithholdingTax = (taxableIncome) => {
    const income = taxableIncome || 0;
    if (income <= 20833) return 0;
    if (income <= 33333) return Math.round((income - 20833) * 0.15);
    if (income <= 66667) return Math.round(1875 + (income - 33333) * 0.20);
    if (income <= 166667) return Math.round(13541.80 + (income - 66667) * 0.25);
    if (income <= 666667) return Math.round(90841.80 + (income - 166667) * 0.30);
    return Math.round(408841.80 + (income - 666667) * 0.35);
};

/**
 * Calculates total earnings from base salary and pay heads
 * @param {number} baseSalary Base monthly salary
 * @param {Array} payHeads Array of pay head objects with type and amount
 * @returns {number} Total earnings
 */
export const calculateTotalEarnings = (baseSalary, payHeads = []) => {
    const monthlySalary = baseSalary || 0;
    const earnings = payHeads.filter(p => p && p.type === 'Earnings');
    const totalEarningsFromPayHeads = earnings.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return monthlySalary + totalEarningsFromPayHeads;
};

/**
 * Calculates total deductions including statutory and custom deductions
 * @param {number} baseSalary Base monthly salary
 * @param {Array} payHeads Array of pay head objects with type and amount
 * @param {number} taxableIncome Taxable income for withholding tax calculation
 * @returns {number} Total deductions
 */
export const calculateTotalDeductions = (baseSalary, payHeads = [], taxableIncome) => {
    const sssContribution = calculateSSSContribution(baseSalary);
    const philHealthContribution = calculatePhilHealthContribution(baseSalary);
    const pagIbigContribution = calculatePagIBIGContribution(baseSalary);
    const withholdingTax = calculateWithholdingTax(taxableIncome);
    const deductions = payHeads.filter(p => p && p.type === 'Deductions');
    const totalCustomDeductions = deductions.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return sssContribution + philHealthContribution + pagIbigContribution + withholdingTax + totalCustomDeductions;
};

/**
 * Calculates net salary
 * @param {number} totalEarnings Total earnings
 * @param {number} totalDeductions Total deductions
 * @returns {number} Net salary
 */
export const calculateNetSalary = (totalEarnings, totalDeductions) => {
    return (totalEarnings || 0) - (totalDeductions || 0);
};