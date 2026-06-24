import { AdjustmentParams, defaultAdjustments } from '@/lib/calc/adjustments';

export interface CalculatorState {
  // Common
  monthlyAmount?: number;
  amount?: number;
  corpus?: number;
  loanAmount?: number;
  expectedReturn?: number;
  interestRate?: number;
  tenureYears?: number;
  compounding?: 'monthly' | 'quarterly' | 'annually' | 'daily';
  rateMethod?: 'effective' | 'nominal';
  timing?: 'begin' | 'end';
  
  // Step-up
  stepUpPct?: number;
  stepUpEnabled?: boolean;
  
  // SWP
  monthlyWithdrawal?: number;
  swpStepUpPct?: number;
  swpStepUpEnabled?: boolean;
  
  // EMI
  isFlatRate?: boolean;
  annualEmiIncreasePct?: number;
  prepayments?: { month: number; amount: number }[];
  
  // Adjustments
  adjustments?: AdjustmentParams;
}

export function encodeStateToUrl(mode: string, state: CalculatorState): string {
  const query = new URLSearchParams();
  query.set('mode', mode);

  for (const [key, val] of Object.entries(state)) {
    if (key === 'adjustments' && val) {
      for (const [adjKey, adjVal] of Object.entries(val)) {
        query.set(`a_${adjKey}`, String(adjVal));
      }
    } else if (key === 'prepayments' && val) {
      query.set(key, JSON.stringify(val));
    } else if (val !== undefined && val !== null) {
      query.set(key, String(val));
    }
  }

  return `?${query.toString()}`;
}

export function decodeStateFromUrl(searchParamsStr: string): { mode: string; state: CalculatorState } {
  const query = new URLSearchParams(searchParamsStr);
  const mode = query.get('mode') || 'sip';
  
  const state: CalculatorState = {
    adjustments: { ...defaultAdjustments }
  };

  for (const [key, val] of query.entries()) {
    if (key === 'mode') continue;

    if (key.startsWith('a_')) {
      const adjKey = key.substring(2) as keyof AdjustmentParams;
      if (val === 'true' || val === 'false') {
        (state.adjustments as any)[adjKey] = val === 'true';
      } else if (!isNaN(Number(val))) {
        (state.adjustments as any)[adjKey] = Number(val);
      } else {
        (state.adjustments as any)[adjKey] = val;
      }
    } else if (key === 'prepayments') {
      try {
        state.prepayments = JSON.parse(val);
      } catch (e) {
        state.prepayments = [];
      }
    } else {
      const castKey = key as keyof Omit<CalculatorState, 'adjustments'>;
      if (val === 'true' || val === 'false') {
        (state as any)[castKey] = val === 'true';
      } else if (!isNaN(Number(val)) && key !== 'compounding' && key !== 'rateMethod' && key !== 'timing') {
        (state as any)[castKey] = Number(val);
      } else {
        (state as any)[castKey] = val;
      }
    }
  }

  return { mode, state };
}
