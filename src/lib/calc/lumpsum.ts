import { getMonthlyRate } from './rates';
import { AdjustmentParams, calculateLTCG, getRealValue, defaultAdjustments } from './adjustments';

export interface LumpsumParams {
  amount: number;
  expectedReturn: number; // e.g. 12 for 12% p.a.
  tenureYears: number;
  compounding: 'monthly' | 'quarterly' | 'annually' | 'daily';
  rateMethod: 'effective' | 'nominal';
  adjustments: AdjustmentParams;
}

export interface LumpsumScheduleItem {
  month: number;
  year: number;
  openingBalance: number;
  contribution: number;
  growth: number;
  closingBalance: number;
  investedAccumulated: number;
  realClosingBalance?: number;
}

export interface LumpsumResult {
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
  schedule: LumpsumScheduleItem[];
}

export function calculateLumpsum(params: LumpsumParams): LumpsumResult {
  const {
    amount,
    expectedReturn,
    tenureYears,
    compounding,
    rateMethod,
    adjustments
  } = params;

  const n = Math.round(tenureYears * 12);
  const annualNet = adjustments.terEnabled ? expectedReturn - adjustments.terRate : expectedReturn;
  const iNetOfExpense = getMonthlyRate(annualNet, compounding, rateMethod);

  const schedule: LumpsumScheduleItem[] = [];
  let balance = amount;
  const invested = amount;

  for (let m = 1; m <= n; m++) {
    const openingBalance = balance;
    const prevBalance = balance;
    balance *= (1 + iNetOfExpense);
    const growth = balance - prevBalance;

    const item: LumpsumScheduleItem = {
      month: m,
      year: Math.ceil(m / 12),
      openingBalance,
      contribution: m === 1 ? amount : 0, // only contributed in first month
      growth,
      closingBalance: balance,
      investedAccumulated: invested
    };

    if (adjustments.inflationEnabled) {
      item.realClosingBalance = getRealValue(balance, adjustments.inflationRate, m / 12);
    }

    schedule.push(item);
  }

  const maturityValueGross = balance;

  // Apply exit load
  const exitLoadPaid = (adjustments.exitLoadEnabled && n < adjustments.exitLoadLockInMonths)
    ? maturityValueGross * (adjustments.exitLoadRate / 100)
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
