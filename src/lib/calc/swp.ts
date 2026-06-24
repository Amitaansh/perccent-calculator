import { getMonthlyRate } from './rates';
import { AdjustmentParams, getRealValue, defaultAdjustments } from './adjustments';

export interface SWPParams {
  corpus: number;
  expectedReturn: number; // e.g. 8 for 8% p.a.
  tenureYears: number;
  monthlyWithdrawal: number;
  stepUpPct: number; // e.g. 5 for 5% escalation
  stepUpEnabled: boolean;
  compounding: 'monthly' | 'quarterly' | 'annually' | 'daily';
  rateMethod: 'effective' | 'nominal';
  timing: 'begin' | 'end';
  adjustments: AdjustmentParams;
}

export interface SWPScheduleItem {
  month: number;
  year: number;
  openingBalance: number;
  withdrawal: number;
  growth: number;
  closingBalance: number;
  realClosingBalance?: number;
}

export interface SWPResult {
  totalWithdrawn: number;
  closingCorpus: number;
  longevityMonths: number | null; // null means never depletes
  isNeverDepleted: boolean;
  depletionMonth: number | null;
  realTotalWithdrawn: number;
  realClosingCorpus: number;
  schedule: SWPScheduleItem[];
}

export function runSWPLoop(
  corpus: number,
  withdrawalAmount: number,
  params: {
    expectedReturn: number;
    tenureYears: number;
    stepUpPct: number;
    stepUpEnabled: boolean;
    compounding: 'monthly' | 'quarterly' | 'annually' | 'daily';
    rateMethod: 'effective' | 'nominal';
    timing: 'begin' | 'end';
    adjustments: AdjustmentParams;
  }
): {
  depleted: boolean;
  depletionMonth: number | null;
  totalWithdrawn: number;
  closingCorpus: number;
  schedule: SWPScheduleItem[];
} {
  const {
    expectedReturn,
    tenureYears,
    stepUpPct,
    stepUpEnabled,
    compounding,
    rateMethod,
    timing,
    adjustments
  } = params;

  const n = Math.round(tenureYears * 12);
  const annualNet = adjustments.terEnabled ? expectedReturn - adjustments.terRate : expectedReturn;
  const i = getMonthlyRate(annualNet, compounding, rateMethod);

  let balance = corpus;
  let totalWithdrawn = 0;
  let currentWithdrawal = withdrawalAmount;
  let depletionMonth: number | null = null;
  const schedule: SWPScheduleItem[] = [];

  for (let m = 1; m <= n; m++) {
    const openingBalance = balance;
    let actualWithdrawal = 0;
    let growth = 0;

    if (timing === 'begin') {
      actualWithdrawal = Math.min(balance, currentWithdrawal);
      balance -= actualWithdrawal;
      totalWithdrawn += actualWithdrawal;

      const prev = balance;
      balance *= (1 + i);
      growth = balance - prev;
    } else {
      const prev = balance;
      balance *= (1 + i);
      growth = balance - prev;

      actualWithdrawal = Math.min(balance, currentWithdrawal);
      balance -= actualWithdrawal;
      totalWithdrawn += actualWithdrawal;
    }

    const item: SWPScheduleItem = {
      month: m,
      year: Math.ceil(m / 12),
      openingBalance,
      withdrawal: actualWithdrawal,
      growth,
      closingBalance: balance
    };

    if (adjustments.inflationEnabled) {
      item.realClosingBalance = getRealValue(balance, adjustments.inflationRate, m / 12);
    }

    schedule.push(item);

    // Check for depletion
    if (balance <= 0) {
      depletionMonth = m;
      // Truncate schedule after depletion
      break;
    }

    // Step up check - done at the end of the month
    if (stepUpEnabled && m % 12 === 0) {
      currentWithdrawal *= (1 + stepUpPct / 100);
    }
  }

  return {
    depleted: depletionMonth !== null,
    depletionMonth,
    totalWithdrawn,
    closingCorpus: balance,
    schedule
  };
}

export function calculateSWP(params: SWPParams): SWPResult {
  const loopResult = runSWPLoop(params.corpus, params.monthlyWithdrawal, params);

  // Apply inflation adjustments to totals
  const realTotalWithdrawn = params.adjustments.inflationEnabled
    ? getRealValue(loopResult.totalWithdrawn, params.adjustments.inflationRate, params.tenureYears)
    : loopResult.totalWithdrawn;

  const realClosingCorpus = params.adjustments.inflationEnabled
    ? getRealValue(loopResult.closingCorpus, params.adjustments.inflationRate, params.tenureYears)
    : loopResult.closingCorpus;

  // Let's determine if it never depletes.
  // A corpus "never depletes" if by the end of the tenure it hasn't depleted
  // AND the closing corpus is growing relative to previous years, or if the monthly interest >= withdrawal.
  // In the T7 case: SWP corpus 10,00,000, 8% return, withdraw 5,000.
  // Growth is 80k/yr, withdrawal is 60k/yr. The corpus will grow indefinitely.
  let isNeverDepleted = !loopResult.depleted;
  
  // If it didn't deplete, let's verify if the growth is sustainable
  if (isNeverDepleted) {
    const annualNet = params.adjustments.terEnabled ? params.expectedReturn - params.adjustments.terRate : params.expectedReturn;
    const i = getMonthlyRate(annualNet, params.compounding, params.rateMethod);
    // Check growth >= withdrawal
    // For 'begin': growth on (corpus - W) >= W => (corpus - W) * i >= W
    // For 'end': growth on corpus >= W => corpus * i >= W
    const checkGrowth = params.timing === 'begin'
      ? (params.corpus - params.monthlyWithdrawal) * i
      : params.corpus * i;
    
    if (checkGrowth < params.monthlyWithdrawal && !params.stepUpEnabled) {
      // It will eventually deplete, just not within the current tenure
      isNeverDepleted = false;
    }
  }

  return {
    totalWithdrawn: loopResult.totalWithdrawn,
    closingCorpus: loopResult.closingCorpus,
    longevityMonths: loopResult.depletionMonth,
    isNeverDepleted: isNeverDepleted && !loopResult.depleted,
    depletionMonth: loopResult.depletionMonth,
    realTotalWithdrawn,
    realClosingCorpus,
    schedule: loopResult.schedule
  };
}

/**
 * Solves for the maximum sustainable monthly withdrawal W that leaves balance >= 0 at the end of the tenure.
 */
export function solveSustainableWithdrawal(params: Omit<SWPParams, 'monthlyWithdrawal'>): number {
  let low = 0;
  // A safe upper bound for withdrawal is the corpus itself
  let high = params.corpus;
  let bestW = 0;

  for (let iter = 0; iter < 40; iter++) {
    const mid = (low + high) / 2;
    const result = runSWPLoop(params.corpus, mid, params);
    if (result.depleted) {
      high = mid;
    } else {
      bestW = mid;
      low = mid;
    }
  }

  return bestW;
}

/**
 * Solves for the longevity (depletion month) given corpus, rate and withdrawal.
 */
export function solveLongevity(params: SWPParams): number | 'never' {
  // If growth >= withdrawal, return 'never'
  const annualNet = params.adjustments.terEnabled ? params.expectedReturn - params.adjustments.terRate : params.expectedReturn;
  const i = getMonthlyRate(annualNet, params.compounding, params.rateMethod);
  
  if (i > 0 && !params.stepUpEnabled) {
    const growth = params.timing === 'begin'
      ? (params.corpus - params.monthlyWithdrawal) * i
      : params.corpus * i;
    if (growth >= params.monthlyWithdrawal) {
      return 'never';
    }
  }

  // Simulate up to 100 years to find exact depletion month
  const paramsLargeTenure = {
    ...params,
    tenureYears: 100 // search up to 100 years
  };
  const result = runSWPLoop(params.corpus, params.monthlyWithdrawal, paramsLargeTenure);
  return result.depletionMonth !== null ? result.depletionMonth : 'never';
}
