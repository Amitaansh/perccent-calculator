'use client';

import React, { useState } from 'react';

interface ScheduleItem {
  month: number;
  year: number;
  openingBalance: number;
  contribution?: number; // for SIP/Lumpsum
  withdrawal?: number; // for SWP
  emi?: number; // for EMI
  interest?: number; // for EMI
  principal?: number; // for EMI
  prepayment?: number; // for EMI
  growth?: number;
  closingBalance: number;
  investedAccumulated?: number;
  realClosingBalance?: number;
}

interface ScheduleTableProps {
  schedule: ScheduleItem[];
  type: 'sip' | 'lumpsum' | 'swp' | 'emi';
  currencySymbol?: string;
  showRealValues?: boolean;
}

interface YearSummary {
  year: number;
  openingBalance: number;
  totalContribution: number;
  totalWithdrawal: number;
  totalEmi: number;
  totalInterest: number;
  totalPrincipal: number;
  totalPrepayment: number;
  totalGrowth: number;
  closingBalance: number;
  months: ScheduleItem[];
}

export default function ScheduleTable({
  schedule,
  type,
  currencySymbol = '₹',
  showRealValues = false
}: ScheduleTableProps) {
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});

  if (!schedule || schedule.length === 0) return null;

  // Format money
  const fmt = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(num);
  };

  // Group by year
  const yearSummaries: YearSummary[] = [];
  
  schedule.forEach((item) => {
    const y = item.year;
    let summary = yearSummaries.find((s) => s.year === y);
    
    if (!summary) {
      summary = {
        year: y,
        openingBalance: item.openingBalance,
        totalContribution: 0,
        totalWithdrawal: 0,
        totalEmi: 0,
        totalInterest: 0,
        totalPrincipal: 0,
        totalPrepayment: 0,
        totalGrowth: 0,
        closingBalance: item.closingBalance,
        months: []
      };
      yearSummaries.push(summary);
    }
    
    // Accumulate
    summary.totalContribution += item.contribution || 0;
    summary.totalWithdrawal += item.withdrawal || 0;
    summary.totalEmi += item.emi || 0;
    summary.totalInterest += item.interest || 0;
    summary.totalPrincipal += item.principal || 0;
    summary.totalPrepayment += item.prepayment || 0;
    summary.totalGrowth += item.growth || 0;
    summary.closingBalance = item.closingBalance; // Last month's closing balance is the year's closing
    summary.months.push(item);
  });

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  // Columns depending on mode
  const renderHeaders = () => {
    switch (type) {
      case 'sip':
      case 'lumpsum':
        return (
          <>
            <th>Year / Month</th>
            <th className="num">Opening Bal</th>
            <th className="num">Invested</th>
            <th className="num">Growth</th>
            <th className="num">Closing Bal</th>
            {showRealValues && <th className="num">Real Closing</th>}
          </>
        );
      case 'swp':
        return (
          <>
            <th>Year / Month</th>
            <th className="num">Opening Bal</th>
            <th className="num">Withdrawal</th>
            <th className="num">Growth</th>
            <th className="num">Closing Bal</th>
            {showRealValues && <th className="num">Real Closing</th>}
          </>
        );
      case 'emi':
        return (
          <>
            <th>Year / Month</th>
            <th className="num">Opening Bal</th>
            <th className="num">EMI Paid</th>
            <th className="num">Interest</th>
            <th className="num">Principal</th>
            <th className="num">Prepayment</th>
            <th className="num">Closing Bal</th>
          </>
        );
    }
  };

  const renderYearRow = (summary: YearSummary) => {
    const isExpanded = !!expandedYears[summary.year];
    
    switch (type) {
      case 'sip':
      case 'lumpsum':
        return (
          <tr key={`y-${summary.year}`} onClick={() => toggleYear(summary.year)} style={{ cursor: 'pointer', fontWeight: 600, background: 'var(--surface)' }}>
            <td>{isExpanded ? '▼' : '▶'} Year {summary.year}</td>
            <td className="num">{currencySymbol}{fmt(summary.openingBalance)}</td>
            <td className="num">{currencySymbol}{fmt(summary.totalContribution)}</td>
            <td className="num" style={{ color: 'var(--green-deep)' }}>+{currencySymbol}{fmt(summary.totalGrowth)}</td>
            <td className="num">{currencySymbol}{fmt(summary.closingBalance)}</td>
            {showRealValues && (
              <td className="num" style={{ color: 'var(--slate)' }}>
                {currencySymbol}{fmt(summary.months[summary.months.length - 1].realClosingBalance || 0)}
              </td>
            )}
          </tr>
        );
      case 'swp':
        return (
          <tr key={`y-${summary.year}`} onClick={() => toggleYear(summary.year)} style={{ cursor: 'pointer', fontWeight: 600, background: 'var(--surface)' }}>
            <td>{isExpanded ? '▼' : '▶'} Year {summary.year}</td>
            <td className="num">{currencySymbol}{fmt(summary.openingBalance)}</td>
            <td className="num" style={{ color: 'var(--withdrawn)' }}>{currencySymbol}{fmt(summary.totalWithdrawal)}</td>
            <td className="num" style={{ color: 'var(--green-deep)' }}>+{currencySymbol}{fmt(summary.totalGrowth)}</td>
            <td className="num">{currencySymbol}{fmt(summary.closingBalance)}</td>
            {showRealValues && (
              <td className="num" style={{ color: 'var(--slate)' }}>
                {currencySymbol}{fmt(summary.months[summary.months.length - 1].realClosingBalance || 0)}
              </td>
            )}
          </tr>
        );
      case 'emi':
        return (
          <tr key={`y-${summary.year}`} onClick={() => toggleYear(summary.year)} style={{ cursor: 'pointer', fontWeight: 600, background: 'var(--surface)' }}>
            <td>{isExpanded ? '▼' : '▶'} Year {summary.year}</td>
            <td className="num">{currencySymbol}{fmt(summary.openingBalance)}</td>
            <td className="num">{currencySymbol}{fmt(summary.totalEmi)}</td>
            <td className="num" style={{ color: 'var(--withdrawn)' }}>{currencySymbol}{fmt(summary.totalInterest)}</td>
            <td className="num">{currencySymbol}{fmt(summary.totalPrincipal)}</td>
            <td className="num" style={{ color: 'var(--blue)' }}>{currencySymbol}{fmt(summary.totalPrepayment)}</td>
            <td className="num">{currencySymbol}{fmt(summary.closingBalance)}</td>
          </tr>
        );
    }
  };

  const renderMonthRow = (item: ScheduleItem) => {
    switch (type) {
      case 'sip':
      case 'lumpsum':
        return (
          <tr key={`m-${item.month}`} style={{ background: 'var(--bg)', fontSize: '13px', color: 'var(--slate)' }}>
            <td style={{ paddingLeft: '32px' }}>Month {item.month}</td>
            <td className="num">{currencySymbol}{fmt(item.openingBalance)}</td>
            <td className="num">{currencySymbol}{fmt(item.contribution || 0)}</td>
            <td className="num">+{currencySymbol}{fmt(item.growth || 0)}</td>
            <td className="num">{currencySymbol}{fmt(item.closingBalance)}</td>
            {showRealValues && <td className="num">{currencySymbol}{fmt(item.realClosingBalance || 0)}</td>}
          </tr>
        );
      case 'swp':
        return (
          <tr key={`m-${item.month}`} style={{ background: 'var(--bg)', fontSize: '13px', color: 'var(--slate)' }}>
            <td style={{ paddingLeft: '32px' }}>Month {item.month}</td>
            <td className="num">{currencySymbol}{fmt(item.openingBalance)}</td>
            <td className="num">{currencySymbol}{fmt(item.withdrawal || 0)}</td>
            <td className="num">+{currencySymbol}{fmt(item.growth || 0)}</td>
            <td className="num">{currencySymbol}{fmt(item.closingBalance)}</td>
            {showRealValues && <td className="num">{currencySymbol}{fmt(item.realClosingBalance || 0)}</td>}
          </tr>
        );
      case 'emi':
        return (
          <tr key={`m-${item.month}`} style={{ background: 'var(--bg)', fontSize: '13px', color: 'var(--slate)' }}>
            <td style={{ paddingLeft: '32px' }}>Month {item.month}</td>
            <td className="num">{currencySymbol}{fmt(item.openingBalance)}</td>
            <td className="num">{currencySymbol}{fmt(item.emi || 0)}</td>
            <td className="num">{currencySymbol}{fmt(item.interest || 0)}</td>
            <td className="num">{currencySymbol}{fmt(item.principal || 0)}</td>
            <td className="num">{currencySymbol}{fmt(item.prepayment || 0)}</td>
            <td className="num">{currencySymbol}{fmt(item.closingBalance)}</td>
          </tr>
        );
    }
  };

  return (
    <div style={{ overflowX: 'auto', marginTop: '24px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }}>
      <table className="breakdown-table">
        <thead>
          <tr>{renderHeaders()}</tr>
        </thead>
        <tbody>
          {yearSummaries.map((summary) => {
            const isExpanded = !!expandedYears[summary.year];
            const rows = [renderYearRow(summary)];
            if (isExpanded) {
              summary.months.forEach((monthItem) => {
                rows.push(renderMonthRow(monthItem));
              });
            }
            return rows;
          })}
        </tbody>
      </table>
    </div>
  );
}
