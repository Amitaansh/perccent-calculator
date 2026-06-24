import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSIP,
  calculateLumpsum,
  calculateSWP,
  calculateEMI,
  getMonthlyRate,
  defaultAdjustments
} from '../index';

describe('Perccent Unified Calculator Engine Tests', () => {
  // T1: SIP ₹5,000/mo, 12% p.a., 10 yrs, effective, annuity-due -> Maturity ≈ ₹11,20,000
  it('T1: SIP effective annuity-due', () => {
    const result = calculateSIP({
      monthlyAmount: 5000,
      expectedReturn: 12,
      tenureYears: 10,
      stepUpPct: 0,
      stepUpEnabled: false,
      compounding: 'monthly',
      rateMethod: 'effective',
      timing: 'begin',
      adjustments: defaultAdjustments
    });
    
    assert.ok(Math.abs(result.invested - 600000) < 1, `Invested was ${result.invested}`);
    assert.ok(Math.abs(result.maturityValueGross - 1120000) / 1120000 < 0.005, `Maturity was ${result.maturityValueGross}`);
  });

  // T2: Same as T1 but nominal (÷12) -> Maturity ≈ ₹11,61,700
  it('T2: SIP nominal annuity-due', () => {
    const result = calculateSIP({
      monthlyAmount: 5000,
      expectedReturn: 12,
      tenureYears: 10,
      stepUpPct: 0,
      stepUpEnabled: false,
      compounding: 'monthly',
      rateMethod: 'nominal',
      timing: 'begin',
      adjustments: defaultAdjustments
    });
    
    assert.ok(Math.abs(result.maturityValueGross - 1161700) / 1161700 < 0.005, `Maturity was ${result.maturityValueGross}`);
  });

  // T3: Lumpsum ₹1,00,000, 12% p.a., 10 yrs, effective -> Maturity ≈ ₹3,10,585
  it('T3: Lumpsum effective', () => {
    const result = calculateLumpsum({
      amount: 100000,
      expectedReturn: 12,
      tenureYears: 10,
      compounding: 'monthly',
      rateMethod: 'effective',
      adjustments: defaultAdjustments
    });
    
    assert.ok(Math.abs(result.maturityValueGross - 310585) / 310585 < 0.005, `Maturity was ${result.maturityValueGross}`);
  });

  // T4: EMI ₹10,00,000, 9% p.a., 20 yrs, reducing -> EMI ≈ ₹8,997, Total interest ≈ ₹11,59,300
  it('T4: EMI reducing', () => {
    const result = calculateEMI({
      loanAmount: 1000000,
      interestRate: 9,
      tenureYears: 20,
      compounding: 'monthly',
      rateMethod: 'nominal', // standard bank nominal reducing
      isFlatRate: false,
      prepayments: [],
      annualEmiIncreasePct: 0
    });
    
    assert.ok(Math.abs(result.emi - 8997) / 8997 < 0.005, `EMI was ${result.emi}`);
    assert.ok(Math.abs(result.totalInterest - 1159300) / 1159300 < 0.005, `Total interest was ${result.totalInterest}`);
  });

  // T5: EMI same but flat -> Flat interest = ₹18,00,000, flat EMI = ₹11,667
  it('T5: EMI flat', () => {
    const result = calculateEMI({
      loanAmount: 1000000,
      interestRate: 9,
      tenureYears: 20,
      compounding: 'monthly',
      rateMethod: 'nominal',
      isFlatRate: true,
      prepayments: [],
      annualEmiIncreasePct: 0
    });
    
    assert.ok(Math.abs(result.totalInterest - 1800000) < 1, `Flat interest was ${result.totalInterest}`);
    assert.ok(Math.abs(result.emi - 11667) / 11667 < 0.005, `Flat EMI was ${result.emi}`);
  });

  // T6: SWP corpus ₹12,00,000, 0% return, withdraw ₹10,000/mo -> Longevity = exactly 120 months
  it('T6: SWP 0% return', () => {
    const result = calculateSWP({
      corpus: 1200000,
      expectedReturn: 0,
      tenureYears: 20,
      monthlyWithdrawal: 10000,
      stepUpPct: 0,
      stepUpEnabled: false,
      compounding: 'monthly',
      rateMethod: 'effective',
      timing: 'begin',
      adjustments: defaultAdjustments
    });
    
    assert.strictEqual(result.depletionMonth, 120);
    assert.strictEqual(result.isNeverDepleted, false);
  });

  // T7: SWP corpus ₹10,00,000, 8% p.a., withdraw ₹5,000/mo -> Corpus grows (longevity = never within tenure)
  it('T7: SWP corpus grows', () => {
    const result = calculateSWP({
      corpus: 1000000,
      expectedReturn: 8,
      tenureYears: 20,
      monthlyWithdrawal: 5000,
      stepUpPct: 0,
      stepUpEnabled: false,
      compounding: 'monthly',
      rateMethod: 'effective',
      timing: 'begin',
      adjustments: defaultAdjustments
    });
    
    assert.strictEqual(result.depletionMonth, null);
    assert.strictEqual(result.isNeverDepleted, true);
  });

  // T8: Effective-rate invariant (1 + i)^12 == 1.12 within 1e-9 for 12%
  it('T8: Effective-rate invariant', () => {
    const i = getMonthlyRate(12, 'monthly', 'effective');
    const compound = Math.pow(1 + i, 12);
    assert.ok(Math.abs(compound - 1.12) < 1e-9, `Compound was ${compound}`);
  });
});
