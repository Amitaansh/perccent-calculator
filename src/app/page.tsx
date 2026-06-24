'use client';

import React, { useState, useEffect, useMemo } from 'react';
import SliderInput from '@/components/SliderInput';
import DonutChart from '@/components/DonutChart';
import GrowthChart from '@/components/GrowthChart';
import TransparencyPanel from '@/components/TransparencyPanel';
import ScheduleTable from '@/components/ScheduleTable';
import { calculateSIP } from '@/lib/calc/sip';
import { calculateLumpsum } from '@/lib/calc/lumpsum';
import { calculateSWP, solveSustainableWithdrawal, solveLongevity } from '@/lib/calc/swp';
import { calculateEMI, Prepayment } from '@/lib/calc/emi';
import { defaultAdjustments, AdjustmentParams } from '@/lib/calc/adjustments';
import { getMethodLabel } from '@/lib/calc/rates';
import { encodeStateToUrl, decodeStateFromUrl, CalculatorState } from '@/utils/urlState';
import { Share2, Download, Plus, Trash2, Scale, PiggyBank, Wallet, Landmark, CircleDollarSign, Calendar, Coins, Settings, Moon, Sun } from 'lucide-react';

export default function Home() {
  // Active mode
  const [mode, setMode] = useState<'sip' | 'lumpsum' | 'swp' | 'emi'>('sip');
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);

  // Theme management
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = systemPrefersDark ? 'dark' : 'light';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Input states
  // SIP
  const [sipAmount, setSipAmount] = useState<number>(5000);
  const [sipReturn, setSipReturn] = useState<number>(12);
  const [sipTenure, setSipTenure] = useState<number>(10);
  const [stepUpEnabled, setStepUpEnabled] = useState<boolean>(false);
  const [stepUpPct, setStepUpPct] = useState<number>(10);

  // Lumpsum
  const [lumpAmount, setLumpAmount] = useState<number>(100000);
  const [lumpReturn, setLumpReturn] = useState<number>(12);
  const [lumpTenure, setLumpTenure] = useState<number>(10);

  // SWP
  const [swpCorpus, setSwpCorpus] = useState<number>(1000000);
  const [swpReturn, setSwpReturn] = useState<number>(8);
  const [swpWithdrawal, setSwpWithdrawal] = useState<number>(8000);
  const [swpTenure, setSwpTenure] = useState<number>(20);
  const [swpStepUpEnabled, setSwpStepUpEnabled] = useState<boolean>(false);
  const [swpStepUpPct, setSwpStepUpPct] = useState<number>(5);

  // EMI
  const [emiAmount, setEmiAmount] = useState<number>(1000000);
  const [emiRate, setEmiRate] = useState<number>(9);
  const [emiTenure, setEmiTenure] = useState<number>(20);
  const [isFlatRate, setIsFlatRate] = useState<boolean>(false);
  const [prepayments, setPrepayments] = useState<Prepayment[]>([]);
  const [annualEmiIncrease, setAnnualEmiIncrease] = useState<number>(0);

  // Prepayment helper input
  const [newPrepayMonth, setNewPrepayMonth] = useState<number>(12);
  const [newPrepayAmount, setNewPrepayAmount] = useState<number>(50000);

  // Advanced & Adjustments (Shared)
  const [compounding, setCompounding] = useState<'monthly' | 'quarterly' | 'annually' | 'daily'>('monthly');
  const [rateMethod, setRateMethod] = useState<'effective' | 'nominal'>('effective');
  const [timing, setTiming] = useState<'begin' | 'end'>('begin');
  
  // Real world adjustment toggles
  const [inflationEnabled, setInflationEnabled] = useState<boolean>(false);
  const [inflationRate, setInflationRate] = useState<number>(6);
  const [terEnabled, setTerEnabled] = useState<boolean>(false);
  const [terRate, setTerRate] = useState<number>(1.5);
  const [exitLoadEnabled, setExitLoadEnabled] = useState<boolean>(false);
  const [exitLoadRate, setExitLoadRate] = useState<number>(1.0);
  const [exitLoadLockInMonths, setExitLoadLockInMonths] = useState<number>(12);
  const [ltcgEnabled, setLtcgEnabled] = useState<boolean>(false);
  const [ltcgExemption, setLtcgExemption] = useState<number>(125000);
  const [ltcgRate, setLtcgRate] = useState<number>(12.5);

  // Comparison Mode
  const [comparisonEnabled, setComparisonEnabled] = useState<boolean>(true);
  const [compareMetric, setCompareMetric] = useState<'rate-method' | 'timing' | 'step-up' | 'flat-reducing'>('rate-method');

  // Load state from URL on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const decoded = decodeStateFromUrl(window.location.search);
      setMode(decoded.mode as any);
      
      const s = decoded.state;
      if (s.monthlyAmount) {
        setSipAmount(s.monthlyAmount);
        setSwpWithdrawal(s.monthlyAmount);
      }
      if (s.amount) setLumpAmount(s.amount);
      if (s.corpus) setSwpCorpus(s.corpus);
      if (s.loanAmount) setEmiAmount(s.loanAmount);
      if (s.expectedReturn) {
        setSipReturn(s.expectedReturn);
        setLumpReturn(s.expectedReturn);
        setSwpReturn(s.expectedReturn);
      }
      if (s.interestRate) setEmiRate(s.interestRate);
      if (s.tenureYears) {
        setSipTenure(s.tenureYears);
        setLumpTenure(s.tenureYears);
        setSwpTenure(s.tenureYears);
        setEmiTenure(s.tenureYears);
      }
      if (s.compounding) setCompounding(s.compounding);
      if (s.rateMethod) setRateMethod(s.rateMethod);
      if (s.timing) setTiming(s.timing);
      if (s.stepUpEnabled) setStepUpEnabled(s.stepUpEnabled);
      if (s.stepUpPct) setStepUpPct(s.stepUpPct);
      if (s.monthlyWithdrawal) setSwpWithdrawal(s.monthlyWithdrawal);
      if (s.swpStepUpEnabled) setSwpStepUpEnabled(s.swpStepUpEnabled);
      if (s.swpStepUpPct) setSwpStepUpPct(s.swpStepUpPct);
      if (s.isFlatRate) setIsFlatRate(s.isFlatRate);
      if (s.annualEmiIncreasePct) setAnnualEmiIncrease(s.annualEmiIncreasePct);
      if (s.prepayments) setPrepayments(s.prepayments);
      
      if (s.adjustments) {
        const a = s.adjustments;
        setInflationEnabled(!!a.inflationEnabled);
        setInflationRate(a.inflationRate || 6);
        setTerEnabled(!!a.terEnabled);
        setTerRate(a.terRate || 1.5);
        setExitLoadEnabled(!!a.exitLoadEnabled);
        setExitLoadRate(a.exitLoadRate || 1.0);
        setExitLoadLockInMonths(a.exitLoadLockInMonths || 12);
        setLtcgEnabled(!!a.ltcgEnabled);
        setLtcgExemption(a.ltcgExemption || 125000);
        setLtcgRate(a.ltcgRate || 12.5);
      }
    }
  }, []);

  // Update URL parameters when state changes
  const activeParams = useMemo<CalculatorState>(() => {
    const adjustments: AdjustmentParams = {
      inflationEnabled,
      inflationRate,
      terEnabled,
      terRate,
      exitLoadEnabled,
      exitLoadRate,
      exitLoadLockInMonths,
      ltcgEnabled,
      ltcgExemption,
      ltcgRate
    };

    switch (mode) {
      case 'sip':
        return { monthlyAmount: sipAmount, expectedReturn: sipReturn, tenureYears: sipTenure, stepUpEnabled, stepUpPct, compounding, rateMethod, timing, adjustments };
      case 'lumpsum':
        return { amount: lumpAmount, expectedReturn: lumpReturn, tenureYears: lumpTenure, compounding, rateMethod, adjustments };
      case 'swp':
        return { corpus: swpCorpus, expectedReturn: swpReturn, monthlyWithdrawal: swpWithdrawal, tenureYears: swpTenure, swpStepUpEnabled, swpStepUpPct, compounding, rateMethod, timing, adjustments };
      case 'emi':
        return { loanAmount: emiAmount, interestRate: emiRate, tenureYears: emiTenure, isFlatRate, compounding, rateMethod, annualEmiIncreasePct: annualEmiIncrease, prepayments, adjustments };
    }
  }, [mode, sipAmount, sipReturn, sipTenure, stepUpEnabled, stepUpPct, lumpAmount, lumpReturn, lumpTenure, swpCorpus, swpReturn, swpWithdrawal, swpTenure, swpStepUpEnabled, swpStepUpPct, emiAmount, emiRate, emiTenure, isFlatRate, compounding, rateMethod, timing, inflationEnabled, inflationRate, terEnabled, terRate, exitLoadEnabled, exitLoadRate, exitLoadLockInMonths, ltcgEnabled, ltcgExemption, ltcgRate, annualEmiIncrease, prepayments]);

  useEffect(() => {
    const query = encodeStateToUrl(mode, activeParams);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', query);
    }
  }, [mode, activeParams]);

  // Compute primary calculator result
  const result = useMemo(() => {
    const adjustments: AdjustmentParams = {
      inflationEnabled,
      inflationRate,
      terEnabled,
      terRate,
      exitLoadEnabled,
      exitLoadRate,
      exitLoadLockInMonths,
      ltcgEnabled,
      ltcgExemption,
      ltcgRate
    };

    if (mode === 'sip') {
      return calculateSIP({
        monthlyAmount: sipAmount,
        expectedReturn: sipReturn,
        tenureYears: sipTenure,
        stepUpPct,
        stepUpEnabled,
        compounding,
        rateMethod,
        timing,
        adjustments
      });
    } else if (mode === 'lumpsum') {
      return calculateLumpsum({
        amount: lumpAmount,
        expectedReturn: lumpReturn,
        tenureYears: lumpTenure,
        compounding,
        rateMethod,
        adjustments
      });
    } else if (mode === 'swp') {
      return calculateSWP({
        corpus: swpCorpus,
        expectedReturn: swpReturn,
        monthlyWithdrawal: swpWithdrawal,
        tenureYears: swpTenure,
        stepUpPct: swpStepUpPct,
        stepUpEnabled: swpStepUpEnabled,
        compounding,
        rateMethod,
        timing,
        adjustments
      });
    } else {
      return calculateEMI({
        loanAmount: emiAmount,
        interestRate: emiRate,
        tenureYears: emiTenure,
        compounding,
        rateMethod,
        isFlatRate,
        prepayments,
        annualEmiIncreasePct: annualEmiIncrease
      });
    }
  }, [mode, sipAmount, sipReturn, sipTenure, stepUpPct, stepUpEnabled, lumpAmount, lumpReturn, lumpTenure, swpCorpus, swpReturn, swpWithdrawal, swpTenure, swpStepUpPct, swpStepUpEnabled, emiAmount, emiRate, emiTenure, isFlatRate, compounding, rateMethod, timing, inflationEnabled, inflationRate, terEnabled, terRate, exitLoadEnabled, exitLoadRate, exitLoadLockInMonths, ltcgEnabled, ltcgExemption, ltcgRate, prepayments, annualEmiIncrease]);

  // Compute comparison calculator result
  const comparisonResult = useMemo(() => {
    if (!comparisonEnabled) return null;

    const adjustments: AdjustmentParams = {
      inflationEnabled,
      inflationRate,
      terEnabled,
      terRate,
      exitLoadEnabled,
      exitLoadRate,
      exitLoadLockInMonths,
      ltcgEnabled,
      ltcgExemption,
      ltcgRate
    };

    let compareRateMethod = rateMethod;
    let compareTiming = timing;
    let compareStepUp = stepUpEnabled;
    let compareFlatRate = isFlatRate;

    if (compareMetric === 'rate-method') {
      compareRateMethod = rateMethod === 'effective' ? 'nominal' : 'effective';
    } else if (compareMetric === 'timing') {
      compareTiming = timing === 'begin' ? 'end' : 'begin';
    } else if (compareMetric === 'step-up') {
      compareStepUp = !stepUpEnabled;
    } else if (compareMetric === 'flat-reducing') {
      compareFlatRate = !isFlatRate;
    }

    if (mode === 'sip') {
      return calculateSIP({
        monthlyAmount: sipAmount,
        expectedReturn: sipReturn,
        tenureYears: sipTenure,
        stepUpPct,
        stepUpEnabled: compareStepUp,
        compounding,
        rateMethod: compareRateMethod,
        timing: compareTiming,
        adjustments
      });
    } else if (mode === 'lumpsum') {
      return calculateLumpsum({
        amount: lumpAmount,
        expectedReturn: lumpReturn,
        tenureYears: lumpTenure,
        compounding,
        rateMethod: compareRateMethod,
        adjustments
      });
    } else if (mode === 'swp') {
      return calculateSWP({
        corpus: swpCorpus,
        expectedReturn: swpReturn,
        monthlyWithdrawal: swpWithdrawal,
        tenureYears: swpTenure,
        stepUpPct: swpStepUpPct,
        stepUpEnabled: swpStepUpEnabled,
        compounding,
        rateMethod: compareRateMethod,
        timing: compareTiming,
        adjustments
      });
    } else {
      return calculateEMI({
        loanAmount: emiAmount,
        interestRate: emiRate,
        tenureYears: emiTenure,
        compounding,
        rateMethod: compareRateMethod,
        isFlatRate: compareFlatRate,
        prepayments,
        annualEmiIncreasePct: annualEmiIncrease
      });
    }
  }, [comparisonEnabled, compareMetric, mode, sipAmount, sipReturn, sipTenure, stepUpPct, stepUpEnabled, lumpAmount, lumpReturn, lumpTenure, swpCorpus, swpReturn, swpWithdrawal, swpTenure, swpStepUpPct, swpStepUpEnabled, emiAmount, emiRate, emiTenure, isFlatRate, compounding, rateMethod, timing, inflationEnabled, inflationRate, terEnabled, terRate, exitLoadEnabled, exitLoadRate, exitLoadLockInMonths, ltcgEnabled, ltcgExemption, ltcgRate, prepayments, annualEmiIncrease]);

  // Prepayment handlers
  const addPrepayment = () => {
    if (newPrepayMonth > 0 && newPrepayAmount > 0) {
      setPrepayments((prev) => {
        const existingIdx = prev.findIndex((p) => p.month === newPrepayMonth);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx].amount = newPrepayAmount;
          return updated.sort((a, b) => a.month - b.month);
        }
        return [...prev, { month: newPrepayMonth, amount: newPrepayAmount }].sort((a, b) => a.month - b.month);
      });
    }
  };

  const removePrepayment = (month: number) => {
    setPrepayments((prev) => prev.filter((p) => p.month !== month));
  };

  // Indian Formatting
  const fmt = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(num);
  };

  // Export PDF/PNG
  const exportPDF = async () => {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    const input = document.getElementById('calculator-content');
    if (input) {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`perccent-calculator-${mode}.pdf`);
    }
  };

  // Copy shareable link
  const copyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert('Shareable configuration link copied to clipboard!');
    }
  };

  // Build chart data
  const chartData = useMemo(() => {
    if (!result || !result.schedule) return [];
    
    const schedule = result.schedule;
    const yearPoints = schedule.filter((item) => item.month % 12 === 0 || item.month === schedule.length);

    return yearPoints.map((item) => ({
      label: `Yr ${item.year}`,
      invested: (item as any).investedAccumulated || 0,
      value: item.closingBalance
    }));
  }, [result]);

  // Formulas and Descriptions for Transparency Panel
  const transparencyProps = useMemo(() => {
    const compoundingLabel = `${compounding} compounding`;
    const timingLabel = timing === 'begin' ? 'Annuity-due (start-of-period)' : 'Ordinary annuity (end-of-period)';

    if (mode === 'sip') {
      const formulas = {
        begin: 'FV = P * (((1 + i)^n - 1) / i) * (1 + i)',
        end: 'FV = P * (((1 + i)^n - 1) / i)'
      };
      
      const annualNet = terEnabled ? sipReturn - terRate : sipReturn;

      return {
        formula: stepUpEnabled ? 'Iterative simulation: Balance[t] = (Balance[t-1] + Contribution[t]) * (1 + i)' : formulas[timing],
        variables: {
          'Monthly amount (P)': `₹${fmt(sipAmount)}`,
          'Rate p.a. (gross)': `${sipReturn}%`,
          'Rate net of TER': `${annualNet}%`,
          'Tenure (n)': `${sipTenure * 12} months`
        },
        assumptions: [
          `Rate Method: ${rateMethod === 'effective' ? 'Effective' : 'Nominal'}`,
          `Compounding cadence: ${compoundingLabel}`,
          `Contributions timing: ${timingLabel}`,
          terEnabled ? `TER of ${terRate}% p.a. reduces gross returns.` : 'No TER applied.',
          exitLoadEnabled ? `Exit load of ${exitLoadRate}% applies for redemptions under ${exitLoadLockInMonths} months (FIFO).` : 'No exit load applied.',
          ltcgEnabled ? `LTCG tax of ${ltcgRate}% applied on gains exceeding ₹1.25L exemption.` : 'No LTCG tax applied.'
        ]
      };
    } else if (mode === 'lumpsum') {
      return {
        formula: 'FV = P * (1 + i)^n',
        variables: {
          'One-time principal (P)': `₹${fmt(lumpAmount)}`,
          'Rate p.a.': `${lumpReturn}%`,
          'Tenure (n)': `${lumpTenure * 12} months`
        },
        assumptions: [
          `Compounding: ${compoundingLabel}`,
          `Method used: ${rateMethod === 'effective' ? 'Effective rate' : 'Nominal rate'}`,
          terEnabled ? `TER of ${terRate}% reduces the rate p.a.` : 'No TER applied.',
          exitLoadEnabled ? `Exit load of ${exitLoadRate}% if redeemed under ${exitLoadLockInMonths} months.` : 'No exit load.',
          ltcgEnabled ? `LTCG tax of ${ltcgRate}% applied above ₹1.25L gains.` : 'No LTCG tax.'
        ]
      };
    } else if (mode === 'swp') {
      return {
        formula: 'Iterative simulation: Balance[t] = (Balance[t-1] - Withdrawal[t]) * (1 + i)',
        variables: {
          'Initial corpus (P)': `₹${fmt(swpCorpus)}`,
          'Withdrawal (W)': `₹${fmt(swpWithdrawal)}`,
          'Rate p.a.': `${swpReturn}%`,
          'Tenure (n)': `${swpTenure * 12} months`
        },
        assumptions: [
          `Withdrawals made at the ${timing === 'begin' ? 'start' : 'end'} of each month.`,
          `Compounding: ${compoundingLabel} (${rateMethod})`,
          swpStepUpEnabled ? `Withdrawal escalates by ${swpStepUpPct}% annually.` : 'Flat withdrawal schedule.',
          terEnabled ? `TER of ${terRate}% applied.` : 'No TER.'
        ]
      };
    } else {
      return {
        formula: isFlatRate ? 'EMI = (Principal + FlatInterest) / N' : 'EMI = P * R * (1 + R)^N / ((1 + R)^N - 1)',
        variables: {
          'Loan Amount (P)': `₹${fmt(emiAmount)}`,
          'Interest Rate': `${emiRate}% p.a.`,
          'Tenure (N)': `${emiTenure * 12} months`
        },
        assumptions: [
          isFlatRate ? 'Flat Interest: calculated on original principal throughout.' : 'Reducing Balance Interest: calculated on outstanding principal.',
          `Compounding: ${compoundingLabel}`,
          prepayments.length > 0 ? `${prepayments.length} prepayment(s) scheduled.` : 'No prepayment scheduled.',
          annualEmiIncrease > 0 ? `EMI escalates by ${annualEmiIncrease}% every year.` : 'Fixed EMI throughout.'
        ]
      };
    }
  }, [mode, sipAmount, sipReturn, sipTenure, stepUpEnabled, stepUpPct, lumpAmount, lumpReturn, lumpTenure, swpCorpus, swpReturn, swpWithdrawal, swpTenure, swpStepUpEnabled, swpStepUpPct, emiAmount, emiRate, emiTenure, isFlatRate, compounding, rateMethod, timing, inflationEnabled, inflationRate, terEnabled, terRate, exitLoadEnabled, exitLoadRate, exitLoadLockInMonths, ltcgEnabled, ltcgExemption, ltcgRate, prepayments, annualEmiIncrease]);

  return (
    <div
      id="calculator-content"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header aligned with company template */}
      <header className="header" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '16px 0' }}>
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="Perccent Logo" className="header-logo" />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="header-title">
              Financial Calculators
            </div>
            <button
              onClick={toggleTheme}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--slate)'
              }}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content wrapper */}
      <main style={{ flex: '1', padding: '32px 0' }}>
        <div className="wrap">
          
          {/* Tabs and Actions Row in a single horizontal bar */}
          <div className="segmented-actions-container">
            {/* Mode Switcher segmented tabs */}
            <div className="segmented-control" style={{ margin: 0 }}>
              <button className={`tab-btn ${mode === 'sip' ? 'active' : ''}`} onClick={() => { setMode('sip'); }}>
                <PiggyBank size={16} /> SIP
              </button>
              <button className={`tab-btn ${mode === 'lumpsum' ? 'active' : ''}`} onClick={() => { setMode('lumpsum'); }}>
                <Wallet size={16} /> Lumpsum
              </button>
              <button className={`tab-btn ${mode === 'swp' ? 'active' : ''}`} onClick={() => { setMode('swp'); }}>
                <CircleDollarSign size={16} /> SWP
              </button>
              <button className={`tab-btn ${mode === 'emi' ? 'active' : ''}`} onClick={() => { setMode('emi'); }}>
                <Landmark size={16} /> EMI
              </button>
            </div>

            {/* Action Row containing export/share links */}
            <div className="actions-row">
              <button className="btn btn-secondary" onClick={copyShareLink} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={16} /> Share Config
              </button>
              <button className="btn btn-primary" onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={16} /> Download PDF
              </button>
            </div>
          </div>

          <div className="calc-container">
            {/* Left Panel: Inputs */}
            <div className="panel-card">
              <h2 style={{ marginBottom: '24px' }}>Inputs</h2>
              
              {/* Conditional Inputs by Mode with prefix label markers and calendar icons */}
              {mode === 'sip' && (
                <>
                  <SliderInput label="Monthly investment" value={sipAmount} min={100} max={10000000} step={500} onChange={setSipAmount} symbol="₹" labelIcon={<span style={{ fontWeight: 'bold' }}>₹</span>} />
                  <SliderInput label="Expected return rate (% p.a.)" value={sipReturn} min={0} max={40} step={0.5} onChange={setSipReturn} symbol="%" symbolPosition="suffix" labelIcon={<span style={{ fontWeight: 'bold' }}>%</span>} />
                  <SliderInput label="Investment Duration (Years)" value={sipTenure} min={1} max={50} step={1} onChange={setSipTenure} symbol="yrs" symbolPosition="suffix" labelIcon={<Calendar size={15} />} />
                  
                  {/* Step-up options */}
                  <div style={{ margin: '16px 0 24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                      <input type="checkbox" checked={stepUpEnabled} onChange={(e) => setStepUpEnabled(e.target.checked)} />
                      Enable Annual Step-up
                    </label>
                    {stepUpEnabled && (
                      <div style={{ marginTop: '16px' }}>
                        <SliderInput label="Annual step-up escalation" value={stepUpPct} min={0} max={50} step={1} onChange={setStepUpPct} symbol="%" symbolPosition="suffix" labelIcon={<span style={{ fontWeight: 'bold' }}>%</span>} />
                      </div>
                    )}
                  </div>
                </>
              )}

              {mode === 'lumpsum' && (
                <>
                  <SliderInput label="Total Investment" value={lumpAmount} min={500} max={10000000} step={1000} onChange={setLumpAmount} symbol="₹" labelIcon={<span style={{ fontWeight: 'bold' }}>₹</span>} />
                  <SliderInput label="Expected return rate (% p.a.)" value={lumpReturn} min={0} max={40} step={0.5} onChange={setLumpReturn} symbol="%" symbolPosition="suffix" labelIcon={<span style={{ fontWeight: 'bold' }}>%</span>} />
                  <SliderInput label="Investment Duration (Years)" value={lumpTenure} min={1} max={50} step={1} onChange={setLumpTenure} symbol="yrs" symbolPosition="suffix" labelIcon={<Calendar size={15} />} />
                </>
              )}

              {mode === 'swp' && (
                <>
                  <SliderInput label="Initial Corpus" value={swpCorpus} min={1000} max={100000000} step={5000} onChange={setSwpCorpus} symbol="₹" labelIcon={<span style={{ fontWeight: 'bold' }}>₹</span>} />
                  <SliderInput label="Monthly Withdrawal" value={swpWithdrawal} min={100} max={swpCorpus} step={500} onChange={setSwpWithdrawal} symbol="₹" labelIcon={<span style={{ fontWeight: 'bold' }}>₹</span>} />
                  <SliderInput label="Expected return rate (% p.a.)" value={swpReturn} min={0} max={40} step={0.5} onChange={setSwpReturn} symbol="%" symbolPosition="suffix" labelIcon={<span style={{ fontWeight: 'bold' }}>%</span>} />
                  <SliderInput label="Withdrawal Duration (Years)" value={swpTenure} min={1} max={50} step={1} onChange={setSwpTenure} symbol="yrs" symbolPosition="suffix" labelIcon={<Calendar size={15} />} />
                  
                  {/* Step-up options */}
                  <div style={{ margin: '16px 0 24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                      <input type="checkbox" checked={swpStepUpEnabled} onChange={(e) => setSwpStepUpEnabled(e.target.checked)} />
                      Enable Annual Step-up Withdrawal
                    </label>
                    {swpStepUpEnabled && (
                      <div style={{ marginTop: '16px' }}>
                        <SliderInput label="Annual escalation" value={swpStepUpPct} min={0} max={50} step={1} onChange={setSwpStepUpPct} symbol="%" symbolPosition="suffix" labelIcon={<span style={{ fontWeight: 'bold' }}>%</span>} />
                      </div>
                    )}
                  </div>
                </>
              )}

              {mode === 'emi' && (
                <>
                  <SliderInput label="Loan Amount" value={emiAmount} min={1000} max={100000000} step={5000} onChange={setEmiAmount} symbol="₹" labelIcon={<span style={{ fontWeight: 'bold' }}>₹</span>} />
                  <SliderInput label="Interest Rate (% p.a.)" value={emiRate} min={0} max={36} step={0.1} onChange={setEmiRate} symbol="%" symbolPosition="suffix" labelIcon={<span style={{ fontWeight: 'bold' }}>%</span>} />
                  <SliderInput label="Loan Tenure (Years)" value={emiTenure} min={1} max={40} step={1} onChange={setEmiTenure} symbol="yrs" symbolPosition="suffix" labelIcon={<Calendar size={15} />} />
                  
                  {/* Flat vs Reducing toggle */}
                  <div style={{ margin: '16px 0', display: 'flex', gap: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                      <input type="radio" name="emiType" checked={!isFlatRate} onChange={() => setIsFlatRate(false)} />
                      Reducing Balance (Default)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                      <input type="radio" name="emiType" checked={isFlatRate} onChange={() => setIsFlatRate(true)} />
                      Flat Interest Rate
                    </label>
                  </div>

                  {/* Prepayments & EMI Increase */}
                  {!isFlatRate && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                      <h3 style={{ marginBottom: '12px' }}>Prepayments &amp; Escalation</h3>
                      
                      <SliderInput label="Annual EMI Increase" value={annualEmiIncrease} min={0} max={30} step={0.5} onChange={setAnnualEmiIncrease} symbol="%" symbolPosition="suffix" labelIcon={<span style={{ fontWeight: 'bold' }}>%</span>} />
                      
                      {/* Prepayments List */}
                      <div style={{ marginTop: '16px' }}>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--slate)', marginBottom: '8px' }}>
                          Lump-sum Prepayments
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '11px', color: 'var(--slate)' }}>Month</label>
                            <input
                              type="number"
                              className="input-value-chip"
                              style={{ width: '100%', textAlign: 'left' }}
                              value={newPrepayMonth}
                              onChange={(e) => setNewPrepayMonth(Number(e.target.value))}
                            />
                          </div>
                          <div style={{ flex: 2 }}>
                            <label style={{ fontSize: '11px', color: 'var(--slate)' }}>Amount (₹)</label>
                            <input
                              type="number"
                              className="input-value-chip"
                              style={{ width: '100%', textAlign: 'left' }}
                              value={newPrepayAmount}
                              onChange={(e) => setNewPrepayAmount(Number(e.target.value))}
                            />
                          </div>
                          <button className="btn btn-secondary" onClick={addPrepayment} style={{ marginTop: '18px', padding: '10px 14px' }}>
                            <Plus size={16} /> Add
                          </button>
                        </div>

                        {prepayments.length > 0 && (
                          <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px' }}>
                            {prepayments.map((p) => (
                              <div key={p.month} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '13px' }}>Month {p.month}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 'bold' }}>₹{fmt(p.amount)}</span>
                                  <Trash2 size={14} color="red" style={{ cursor: 'pointer' }} onClick={() => removePrepayment(p.month)} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Advanced Panel (Expandable accordion) */}
              <div style={{ marginTop: '28px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '8px 0',
                    cursor: 'pointer',
                    color: 'var(--accent)',
                    fontWeight: '700',
                    fontSize: '15px',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={18} /> Advanced Settings &amp; Adjustments
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{advancedOpen ? 'Hide ▴' : 'Show ▾'}</span>
                </button>
                
                {advancedOpen && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--slate)', marginBottom: '6px' }}>Rate Method</label>
                        <select
                          className="input-value-chip"
                          style={{ width: '100%', textAlign: 'left' }}
                          value={rateMethod}
                          onChange={(e) => setRateMethod(e.target.value as any)}
                        >
                          <option value="effective">Effective rate</option>
                          <option value="nominal">Nominal rate</option>
                        </select>
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--slate)', marginBottom: '6px' }}>Compounding Cadence</label>
                        <select
                          className="input-value-chip"
                          style={{ width: '100%', textAlign: 'left' }}
                          value={compounding}
                          onChange={(e) => setCompounding(e.target.value as any)}
                        >
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="annually">Annually</option>
                          <option value="daily">Daily</option>
                        </select>
                      </div>
                    </div>

                    {mode !== 'lumpsum' && (
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--slate)', marginBottom: '6px' }}>Timing</label>
                        <select
                          className="input-value-chip"
                          style={{ width: '100%', textAlign: 'left' }}
                          value={timing}
                          onChange={(e) => setTiming(e.target.value as any)}
                        >
                          <option value="begin">Start of Period (Annuity-due)</option>
                          <option value="end">End of Period (Ordinary)</option>
                        </select>
                      </div>
                    )}

                    {/* Real-world adjustment layers */}
                    <h4 style={{ fontSize: '13px', color: 'var(--slate)', marginBottom: '12px' }}>Real-world Adjustment Layers</h4>

                    {/* Inflation */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                        <input type="checkbox" checked={inflationEnabled} onChange={(e) => setInflationEnabled(e.target.checked)} />
                        Inflation Adjustments (Default: Off)
                      </label>
                      {inflationEnabled && (
                        <div style={{ marginTop: '8px', paddingLeft: '20px' }}>
                          <SliderInput label="Annual Inflation Rate" value={inflationRate} min={1} max={20} step={0.5} onChange={setInflationRate} symbol="%" symbolPosition="suffix" labelIcon={<span style={{ fontWeight: 'bold' }}>%</span>} />
                        </div>
                      )}
                    </div>

                    {/* TER */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                        <input type="checkbox" checked={terEnabled} onChange={(e) => setTerEnabled(e.target.checked)} />
                        Expense Ratio (TER) (Default: Off)
                      </label>
                      {terEnabled && (
                        <div style={{ marginTop: '8px', paddingLeft: '20px' }}>
                          <SliderInput label="Annual Expense Ratio" value={terRate} min={0.1} max={5} step={0.05} onChange={setTerRate} symbol="%" symbolPosition="suffix" labelIcon={<span style={{ fontWeight: 'bold' }}>%</span>} />
                        </div>
                      )}
                    </div>

                    {/* Exit Load */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                        <input type="checkbox" checked={exitLoadEnabled} onChange={(e) => setExitLoadEnabled(e.target.checked)} />
                        Exit Load Haircut (Default: Off)
                      </label>
                      {exitLoadEnabled && (
                        <div style={{ marginTop: '8px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <SliderInput label="Exit Load Rate" value={exitLoadRate} min={0.1} max={5} step={0.1} onChange={setExitLoadRate} symbol="%" symbolPosition="suffix" labelIcon={<span style={{ fontWeight: 'bold' }}>%</span>} />
                          <SliderInput label="Lock-in Period" value={exitLoadLockInMonths} min={1} max={36} step={1} onChange={setExitLoadLockInMonths} symbol="mo" symbolPosition="suffix" labelIcon={<Calendar size={15} />} />
                        </div>
                      )}
                    </div>

                    {/* LTCG Tax */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                        <input type="checkbox" checked={ltcgEnabled} onChange={(e) => setLtcgEnabled(e.target.checked)} />
                        LTCG Tax on Gains (Default: Off)
                      </label>
                      {ltcgEnabled && (
                        <div style={{ marginTop: '8px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <SliderInput label="LTCG Exemption" value={ltcgExemption} min={10000} max={500000} step={5000} onChange={setLtcgExemption} symbol="₹" labelIcon={<span style={{ fontWeight: 'bold' }}>₹</span>} />
                          <SliderInput label="LTCG Tax Rate" value={ltcgRate} min={5} max={30} step={0.5} onChange={setLtcgRate} symbol="%" symbolPosition="suffix" labelIcon={<span style={{ fontWeight: 'bold' }}>%</span>} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>            {/* Right Panel: Results Summary Card only */}
            <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
              <div className="summary-box" style={{ margin: 0 }}>
                <div className="summary-title" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                  {mode === 'emi' ? 'Loan Summary' : 'Investment Summary'}
                </div>
                
                {/* SIP / Lumpsum summary item list */}
                {(mode === 'sip' || mode === 'lumpsum') && (
                  <>
                    <div className="summary-item">
                      <div className="summary-label">Total Investment</div>
                      <div className="summary-value">₹{fmt((result as any).invested)}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Estimated Returns</div>
                      <div className="summary-value summary-value-highlight">₹{fmt((result as any).maturityValueNet - (result as any).invested)}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Future Value</div>
                      <div className="summary-value" style={{ fontSize: '28px', fontWeight: 800 }}>₹{fmt((result as any).maturityValueNet)}</div>
                    </div>
                  </>
                )}

                {/* SWP summary item list */}
                {mode === 'swp' && (
                  <>
                    <div className="summary-item">
                      <div className="summary-label">Initial Corpus</div>
                      <div className="summary-value">₹{fmt(swpCorpus)}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Total Payouts (Withdrawn)</div>
                      <div className="summary-value summary-value-highlight">₹{fmt((result as any).totalWithdrawn)}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Final Balance (Remaining Corpus)</div>
                      <div className="summary-value" style={{ fontSize: '28px', fontWeight: 800 }}>₹{fmt((result as any).closingCorpus)}</div>
                    </div>
                  </>
                )}

                {/* EMI summary item list */}
                {mode === 'emi' && (
                  <>
                    <div className="summary-item">
                      <div className="summary-label">Principal Amount</div>
                      <div className="summary-value">₹{fmt(emiAmount)}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Interest Payable</div>
                      <div className="summary-value summary-value-highlight">₹{fmt((result as any).totalInterest)}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Total Amount Payable</div>
                      <div className="summary-value" style={{ fontSize: '28px', fontWeight: 800 }}>₹{fmt((result as any).totalPayment)}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Charts Section: Symmetrical layout below Inputs & Summary */}
          <div className="charts-grid">
            {/* Left Card: Asset Allocation / Split */}
            <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', width: '100%', marginBottom: '16px' }}>
                {mode === 'emi' ? 'Payment Split' : mode === 'swp' ? 'Withdrawal Split' : 'Asset Allocation'}
              </h2>
              <div style={{ width: '100%', background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', justifyContent: 'center' }}>
                {mode === 'sip' && (
                  <DonutChart
                    invested={(result as any).invested}
                    returns={(result as any).maturityValueNet - (result as any).invested}
                    totalValue={(result as any).maturityValueNet}
                    centerLabel="Maturity"
                  />
                )}
                {mode === 'lumpsum' && (
                  <DonutChart
                    invested={(result as any).invested}
                    returns={(result as any).maturityValueNet - (result as any).invested}
                    totalValue={(result as any).maturityValueNet}
                    centerLabel="Maturity"
                  />
                )}
                {mode === 'swp' && (
                  <DonutChart
                    invested={(result as any).closingCorpus}
                    withdrawn={(result as any).totalWithdrawn}
                    totalValue={swpCorpus + (result as any).totalWithdrawn - (result as any).closingCorpus}
                    centerLabel="Remaining"
                  />
                )}
                {mode === 'emi' && (
                  <DonutChart
                    invested={emiAmount}
                    withdrawn={(result as any).totalInterest}
                    totalValue={(result as any).totalPayment}
                    centerLabel="Total Pay"
                  />
                )}
              </div>
            </div>

            {/* Right Card: Growth Timeline */}
            <div className="panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px' }}>
                {mode === 'swp' ? 'Corpus Depletion Timeline' : mode === 'emi' ? 'Amortization Balance' : 'Growth Projection'}
              </h2>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <GrowthChart
                  data={chartData}
                  type={mode === 'swp' ? 'depletion-line' : mode === 'emi' ? 'emi-balance' : 'stacked-area'}
                />
              </div>
            </div>
          </div>

          {/* Comparison & Math Disclosures Section */}
          <div className="comparison-math-grid">
            {/* Left Card: Configuration Comparison */}
            <div className="panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Scale size={20} style={{ color: 'var(--accent)' }} /> Config Comparison
                </h2>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--slate)', fontWeight: 600 }}>Compare against:</span>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <button
                        className={`btn ${compareMetric === 'rate-method' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setCompareMetric('rate-method')}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Effective vs Nominal
                      </button>
                      {mode !== 'lumpsum' && (
                        <button
                          className={`btn ${compareMetric === 'timing' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setCompareMetric('timing')}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Annuity vs Ordinary
                        </button>
                      )}
                      {mode === 'sip' && (
                        <button
                          className={`btn ${compareMetric === 'step-up' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setCompareMetric('step-up')}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Step-Up vs Flat
                        </button>
                      )}
                      {mode === 'emi' && (
                        <button
                          className={`btn ${compareMetric === 'flat-reducing' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setCompareMetric('flat-reducing')}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Flat vs Reducing
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Display results comparison side by side */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <table className="comparison-table">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ color: 'var(--slate)', fontSize: '11px', textTransform: 'uppercase' }}>Metric</th>
                          <th style={{ color: 'var(--ink)', fontSize: '11px', textTransform: 'uppercase' }}>Active</th>
                          <th style={{ color: 'var(--ink)', fontSize: '11px', textTransform: 'uppercase' }}>Twin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(mode === 'sip' || mode === 'lumpsum') && (
                          <>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              <td>Maturity (Net)</td>
                              <td style={{ fontWeight: 'bold' }}>₹{fmt((result as any).maturityValueNet)}</td>
                              <td style={{ fontWeight: 'bold' }}>₹{fmt((comparisonResult as any)?.maturityValueNet || 0)}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              <td>Est. Returns</td>
                              <td style={{ color: 'var(--accent)' }}>₹{fmt((result as any).estimatedReturns)}</td>
                              <td style={{ color: 'var(--accent)' }}>₹{fmt((comparisonResult as any)?.estimatedReturns || 0)}</td>
                            </tr>
                          </>
                        )}
                        {mode === 'swp' && (
                          <>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              <td>Total Withdrawn</td>
                              <td style={{ color: 'var(--withdrawn)' }}>₹{fmt((result as any).totalWithdrawn)}</td>
                              <td style={{ color: 'var(--withdrawn)' }}>₹{fmt((comparisonResult as any)?.totalWithdrawn || 0)}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              <td>Depletion Month</td>
                              <td>{(result as any).depletionMonth || 'never'}</td>
                              <td>{(comparisonResult as any)?.depletionMonth || 'never'}</td>
                            </tr>
                          </>
                        )}
                        {mode === 'emi' && (
                          <>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              <td>Monthly EMI</td>
                              <td style={{ fontWeight: 'bold' }}>₹{fmt((result as any).emi)}</td>
                              <td style={{ fontWeight: 'bold' }}>₹{fmt((comparisonResult as any)?.emi || 0)}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              <td>Total Interest</td>
                              <td style={{ color: 'var(--withdrawn)' }}>₹{fmt((result as any).totalInterest)}</td>
                              <td style={{ color: 'var(--withdrawn)' }}>₹{fmt((comparisonResult as any)?.totalInterest || 0)}</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
            </div>

            {/* Right Card: Mathematical Disclosures */}
            <div className="panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px' }}>
                Mathematical Disclosures
              </h2>
              <div style={{ flex: 1 }}>
                <TransparencyPanel
                  formula={transparencyProps.formula}
                  variables={transparencyProps.variables as unknown as Record<string, string | number>}
                  assumptions={transparencyProps.assumptions}
                />
              </div>
            </div>
          </div>

          {/* Full-width Compliance & Disclosures Card */}
          <div className="panel-card" style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
              Compliance &amp; Disclosure
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--slate)', lineHeight: '1.6', margin: 0 }}>
              {mode === 'emi' ? (
                "Actual lender terms, interest calculations, processing fees, and floating-rate resets may differ from these illustrative amortizations. Consult your financial provider before making borrowing decisions."
              ) : (
                "These are illustrative estimates based on the assumptions shown and are not guaranteed returns. Mutual fund investments are subject to market risks; read all scheme-related documents carefully."
              )}
            </p>
          </div>

          {/* Schedule Table (Year-by-year & Month-by-month breakdown) */}
          <div className="panel-card">
            <h2>Breakdown Schedule</h2>
            <p className="text-mute" style={{ fontSize: '14px', marginBottom: '16px' }}>
              Click on a year row below to expand the month-by-month detail.
            </p>
            <ScheduleTable
              schedule={result?.schedule || []}
              type={mode}
              showRealValues={inflationEnabled}
            />
          </div>
        </div>
      </main>

      {/* Footer (no emojis) */}
      <footer className="footer">
        <div className="wrap">
          <div>PERCCENT · UNIFIED CALCULATOR · v1.0</div>
          <div style={{ marginTop: '4px' }}>Perccent Edge Private Limited · ARN 327237 · CIN U62010KA2025PTC198146</div>
        </div>
      </footer>
    </div>
  );
}
