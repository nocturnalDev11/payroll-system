export function calculateSSSContribution(salary) {
  const monthlySalary = Math.max(salary || 0, 0);
  if (monthlySalary < 5000) return 250;
  const salaryCredit = Math.min(Math.max(monthlySalary, 5000), 35000);
  const regularSSContribution = Math.round(salaryCredit * 0.05);
  let mpfContribution = salaryCredit > 20000 ? Math.round((Math.min(salaryCredit, 35000) - 20000) * 0.025) : 0;
  return salaryCredit > 34750 ? 1750 : regularSSContribution + mpfContribution;
}

export function calculatePhilHealthContribution(salary) {
  const monthlySalary = Math.max(salary || 0, 0);
  return Math.round(Math.min(Math.max(monthlySalary, 10000), 100000) * 0.025);
}

export function calculatePagIBIGContribution(salary) {
  const monthlySalary = Math.max(salary || 0, 0);
  const cappedSalary = Math.min(monthlySalary, 5000);
  return Math.round(cappedSalary * (cappedSalary <= 1500 ? 0.01 : 0.02));
}

export function calculateWithholdingTax(salary) {
  const taxableIncome = salary || 0;
  if (taxableIncome <= 20833) return 0;
  if (taxableIncome <= 33333) return Math.round((taxableIncome - 20833) * 0.15);
  if (taxableIncome <= 66667) return Math.round(1875 + (taxableIncome - 33333) * 0.20);
  if (taxableIncome <= 166667) return Math.round(13541.80 + (taxableIncome - 66667) * 0.25);
  if (taxableIncome <= 666667) return Math.round(90841.80 + (taxableIncome - 166667) * 0.30);
  return Math.round(408841.80 + (taxableIncome - 666667) * 0.35);
}

export function calculateNewEmployeeNetSalary(employee) {
  if (!employee || !employee.salary) return 0; // Check if employee exists
  const totalEarnings = employee.salary + (employee.earnings?.travelExpenses || 0) + (employee.earnings?.otherEarnings || 0);
  return totalEarnings - (
    calculateSSSContribution(employee.salary) +
    calculatePhilHealthContribution(employee.salary) +
    calculatePagIBIGContribution(employee.salary) +
    calculateWithholdingTax(employee.salary)
  );
}