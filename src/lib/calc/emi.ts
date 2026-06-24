import { getMonthlyRate } from './rates';
import { getRealValue } from './adjustments';

export interface Prepayment {
  month: number;
  amount: number;
}

export interface EMIParams {
  loanAmount: number;
  interestRate: number; // e.g. 9 for 9% p.a.
  tenureYears: number;
  tenureMonthsOnly?: number; // optional, if specified, overrides tenureYears
  compounding: 'monthly' | 'quarterly' | 'annually' | 'daily';
  rateMethod: 'effective' | 'nominal';
  isFlatRate: boolean;
  prepayments: Prepayment[];
  annualEmiIncreasePct: number; // e.g. 5 for 5% increase every year
}

export interface EMIScheduleItem {
  month: number;
  year: number;
  openingBalance: number;
  emi: number;
  interest: number;
  principal: number;
  prepayment: number;
  closingBalance: number;
}

export interface EMIResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  effectiveTenureMonths: number;
  isPaidEarly: boolean;
  equivalentReducingRate?: number;
  rateGap?: number;
  schedule: EMIScheduleItem[];
}

export function calculateEMI(params: EMIParams): EMIResult {
  const {
    loanAmount,
    interestRate,
    tenureYears,
    tenureMonthsOnly,
    compounding,
    rateMethod,
    isFlatRate,
    prepayments = [],
    annualEmiIncreasePct = 0
  } = params;

  const N = tenureMonthsOnly !== undefined ? tenureMonthsOnly : Math.round(tenureYears * 12);
  const P = loanAmount;

  if (isFlatRate) {
    // Flat rate calculation
    const years = N / 12;
    const flatInterest = P * (interestRate / 100) * years;
    const totalPayment = P + flatInterest;
    const emi = N > 0 ? totalPayment / N : P;

    // Flat schedule
    const schedule: EMIScheduleItem[] = [];
    let balance = P;
    const interestPerMonth = N > 0 ? flatInterest / N : 0;
    const principalPerMonth = N > 0 ? P / N : P;

    for (let m = 1; m <= N; m++) {
      const openingBalance = balance;
      balance = Math.max(0, balance - principalPerMonth);
      schedule.push({
        month: m,
        year: Math.ceil(m / 12),
        openingBalance,
        emi,
        interest: interestPerMonth,
        principal: principalPerMonth,
        prepayment: 0,
        closingBalance: balance
      });
    }

    // Solve for equivalent reducing rate
    const equivalentReducingRate = solveEquivalentReducingRate(P, emi, N);
    const rateGap = equivalentReducingRate - interestRate;

    return {
      emi,
      totalInterest: flatInterest,
      totalPayment,
      effectiveTenureMonths: N,
      isPaidEarly: false,
      equivalentReducingRate,
      rateGap,
      schedule
    };
  }

  // Reducing balance calculation
  const R = getMonthlyRate(interestRate, compounding, rateMethod);
  let emi = 0;

  if (R === 0) {
    emi = N > 0 ? P / N : P;
  } else {
    emi = N > 0 ? (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1) : P;
  }

  // Construct amortization schedule with prepayments & EMI increases
  const schedule: EMIScheduleItem[] = [];
  let balance = P;
  let currentEmi = emi;
  let totalInterest = 0;
  let totalPayment = 0;
  let isPaidEarly = false;
  let effectiveTenureMonths = N;

  for (let m = 1; m <= N; m++) {
    if (balance <= 0) {
      effectiveTenureMonths = m - 1;
      isPaidEarly = true;
      break;
    }

    const openingBalance = balance;

    // Apply annual EMI increase (escalation)
    // Escalate every 12 months, e.g., starting month 13, 25, 37...
    if (annualEmiIncreasePct > 0 && m > 1 && (m - 1) % 12 === 0) {
      currentEmi *= (1 + annualEmiIncreasePct / 100);
    }

    // Interest for the month
    const interest = balance * R;
    totalInterest += interest;

    // Prepayments in month m
    const prepaymentAmount = prepayments.find(p => p.month === m)?.amount || 0;

    // Calculate principal paid from regular EMI
    let principal = currentEmi - interest;
    let actualEmi = currentEmi;

    if (balance + interest <= currentEmi) {
      // Last payment
      principal = balance;
      actualEmi = balance + interest;
      balance = 0;
    } else {
      balance = balance - principal;
    }

    // Apply prepayment
    let actualPrepayment = 0;
    if (balance > 0 && prepaymentAmount > 0) {
      actualPrepayment = Math.min(balance, prepaymentAmount);
      balance -= actualPrepayment;
    }

    totalPayment += actualEmi + actualPrepayment;

    schedule.push({
      month: m,
      year: Math.ceil(m / 12),
      openingBalance,
      emi: actualEmi,
      interest,
      principal,
      prepayment: actualPrepayment,
      closingBalance: balance
    });

    if (balance <= 0) {
      effectiveTenureMonths = m;
      isPaidEarly = m < N;
      break;
    }
  }

  return {
    emi,
    totalInterest,
    totalPayment,
    effectiveTenureMonths,
    isPaidEarly,
    schedule
  };
}

/**
 * Solves for the equivalent reducing rate (nominal annual) that matches a flat EMI.
 */
export function solveEquivalentReducingRate(
  principal: number,
  flatEmi: number,
  tenureMonths: number
): number {
  if (tenureMonths <= 0) return 0;
  
  let low = 0;
  let high = 1.0; // up to 100% per month
  let bestR = 0;

  for (let iter = 0; iter < 50; iter++) {
    const mid = (low + high) / 2;
    const emi = mid === 0
      ? principal / tenureMonths
      : (principal * mid * Math.pow(1 + mid, tenureMonths)) / (Math.pow(1 + mid, tenureMonths) - 1);

    if (emi < flatEmi) {
      bestR = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  return bestR * 12 * 100;
}
