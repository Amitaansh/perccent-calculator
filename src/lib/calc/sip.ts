import { getMonthlyRate } from './rates';
import { AdjustmentParams, calculateExitLoad, calculateLTCG, getRealValue, defaultAdjustments } from './adjustments';

export interface SIPParams {
  monthlyAmount: number;
  expectedReturn: number; // e.g. 12 for 12% p.a.
  tenureYears: number;
  stepUpPct: number; // e.g. 10 for 10%
  stepUpEnabled: boolean;
  compounding: 'monthly' | 'quarterly' | 'annually' | 'daily';
  rateMethod: 'effective' | 'nominal';
  timing: 'begin' | 'end';
  adjustments: AdjustmentParams;
}

export interface ScheduleItem {
  month: number;
  year: number;
  openingBalance: number;
  contribution: number;
  growth: number;
  closingBalance: number;
  investedAccumulated: number;
  realClosingBalance?: number;
}

export interface SIPResult {
  invested: number;
  maturityValueGross: number;
  exitLoadPaid: number;
  taxPaid: number;
  maturityValueNet: number;
  estimatedReturns: number;
  realInvested: number;
  realMaturityValueGross: number;
  realMaturityValueNet: number;
  realEstimatedReturns: number;
  schedule: ScheduleItem[];
}

export function calculateSIP(params: SIPParams): SIPResult {
  const {
    monthlyAmount,
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
  
  // Determine if we must use the iterative engine
  const useIterative =
    stepUpEnabled ||
    adjustments.inflationEnabled ||
    adjustments.terEnabled ||
    adjustments.exitLoadEnabled ||
    adjustments.ltcgEnabled;

  // Let's implement the closed form first as a fallback/fast-path for flat SIP
  if (!useIterative) {
    const i = getMonthlyRate(expectedReturn, compounding, rateMethod);
    let invested = monthlyAmount * n;
    let maturityValueGross = 0;

    if (i === 0) {
      maturityValueGross = monthlyAmount * n;
    } else {
      if (timing === 'begin') {
        maturityValueGross = monthlyAmount * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
      } else {
        maturityValueGross = monthlyAmount * ((Math.pow(1 + i, n) - 1) / i);
      }
    }

    const estimatedReturns = maturityValueGross - invested;

    // Fill a basic schedule for display
    const schedule: ScheduleItem[] = [];
    let balance = 0;
    let investedAccum = 0;
    for (let m = 1; m <= n; m++) {
      const opening = balance;
      let growth = 0;
      if (timing === 'begin') {
        balance += monthlyAmount;
        investedAccum += monthlyAmount;
        const prev = balance;
        balance *= (1 + i);
        growth = balance - prev;
      } else {
        const prev = balance;
        balance *= (1 + i);
        growth = balance - prev;
        balance += monthlyAmount;
        investedAccum += monthlyAmount;
      }
      schedule.push({
        month: m,
        year: Math.ceil(m / 12),
        openingBalance: opening,
        contribution: monthlyAmount,
        growth,
        closingBalance: balance,
        investedAccumulated: investedAccum
      });
    }

    return {
      invested,
      maturityValueGross,
      exitLoadPaid: 0,
      taxPaid: 0,
      maturityValueNet: maturityValueGross,
      estimatedReturns,
      realInvested: invested,
      realMaturityValueGross: maturityValueGross,
      realMaturityValueNet: maturityValueGross,
      realEstimatedReturns: estimatedReturns,
      schedule
    };
  }

  // Iterative engine
  const annualNet = adjustments.terEnabled ? expectedReturn - adjustments.terRate : expectedReturn;
  const iNetOfExpense = getMonthlyRate(annualNet, compounding, rateMethod);

  let balance = 0;
  let invested = 0;
  let contribution = monthlyAmount;
  const contributionValues: number[] = [];
  const schedule: ScheduleItem[] = [];

  for (let m = 1; m <= n; m++) {
    const openingBalance = balance;
    const currentContribution = contribution;

    if (timing === 'begin') {
      balance += currentContribution;
      invested += currentContribution;
      contributionValues.push(currentContribution);
    }

    const prevBalance = balance;
    balance *= (1 + iNetOfExpense);
    const growth = balance - prevBalance;

    // Compound each contribution individually for exit load tracking (FIFO)
    for (let k = 0; k < contributionValues.length; k++) {
      contributionValues[k] *= (1 + iNetOfExpense);
    }

    if (timing === 'end') {
      balance += currentContribution;
      invested += currentContribution;
      contributionValues.push(currentContribution);
    }

    const item: ScheduleItem = {
      month: m,
      year: Math.ceil(m / 12),
      openingBalance,
      contribution: currentContribution,
      growth,
      closingBalance: balance,
      investedAccumulated: invested
    };

    if (adjustments.inflationEnabled) {
      item.realClosingBalance = getRealValue(balance, adjustments.inflationRate, m / 12);
    }

    schedule.push(item);

    // Step up check - done at the end of the month
    if (stepUpEnabled && m % 12 === 0) {
      contribution *= (1 + stepUpPct / 100);
    }
  }

  const maturityValueGross = balance;

  // Apply exit load
  const exitLoadPaid = adjustments.exitLoadEnabled
    ? calculateExitLoad(contributionValues, n, adjustments.exitLoadLockInMonths, adjustments.exitLoadRate)
    : 0;

  const maturityValueAfterExitLoad = maturityValueGross - exitLoadPaid;

  // Apply LTCG tax
  const gains = Math.max(0, maturityValueAfterExitLoad - invested);
  const taxPaid = adjustments.ltcgEnabled
    ? calculateLTCG(gains, adjustments.ltcgExemption, adjustments.ltcgRate)
    : 0;

  const maturityValueNet = maturityValueAfterExitLoad - taxPaid;
  const estimatedReturns = maturityValueNet - invested;

  // Apply inflation adjustments for summary
  const realInvested = adjustments.inflationEnabled
    ? getRealValue(invested, adjustments.inflationRate, tenureYears)
    : invested;

  const realMaturityValueGross = adjustments.inflationEnabled
    ? getRealValue(maturityValueGross, adjustments.inflationRate, tenureYears)
    : maturityValueGross;

  const realMaturityValueNet = adjustments.inflationEnabled
    ? getRealValue(maturityValueNet, adjustments.inflationRate, tenureYears)
    : maturityValueNet;

  const realEstimatedReturns = realMaturityValueNet - realInvested;

  return {
    invested,
    maturityValueGross,
    exitLoadPaid,
    taxPaid,
    maturityValueNet,
    estimatedReturns,
    realInvested,
    realMaturityValueGross,
    realMaturityValueNet,
    realEstimatedReturns,
    schedule
  };
}
