'use client';

import React from 'react';

interface DonutChartProps {
  invested: number;
  returns?: number;
  withdrawn?: number;
  totalValue: number;
  centerLabel: string;
  currencySymbol?: string;
}

export default function DonutChart({
  invested,
  returns = 0,
  withdrawn = 0,
  totalValue,
  centerLabel,
  currencySymbol = '₹'
}: DonutChartProps) {
  const formatIndianNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatShortIndianNumber = (num: number) => {
    if (num >= 10000000) {
      return `${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `${(num / 100000).toFixed(2)} L`;
    }
    return formatIndianNumber(num);
  };

  // SVG parameters
  const size = 220; // Increased size to make it a major component
  const strokeWidth = 22; // Thicker stroke for premium look
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate percentages
  const total = invested + returns + withdrawn;
  const investedPct = total > 0 ? invested / total : 1;
  const returnsPct = total > 0 ? returns / total : 0;
  const withdrawnPct = total > 0 ? withdrawn / total : 0;

  // Calculate strokes
  const investedStroke = circumference * investedPct;
  const returnsStroke = circumference * returnsPct;
  const withdrawnStroke = circumference * withdrawnPct;

  // Calculate offsets (starting from top, i.e., -90 degrees)
  let offset = 0;
  const investedOffset = offset;
  offset -= investedStroke;
  
  const returnsOffset = offset;
  offset -= returnsStroke;

  const withdrawnOffset = offset;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%', padding: '12px 0' }}>
      {/* Centered Large Donut */}
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          {/* Invested slice */}
          {investedStroke > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="var(--invested)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${investedStroke} ${circumference}`}
              strokeDashoffset={investedOffset}
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
          )}
          {/* Returns slice */}
          {returnsStroke > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="var(--returns)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${returnsStroke} ${circumference}`}
              strokeDashoffset={returnsOffset}
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
          )}
          {/* Withdrawn / Interest slice */}
          {withdrawnStroke > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="var(--withdrawn)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${withdrawnStroke} ${circumference}`}
              strokeDashoffset={withdrawnOffset}
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
          )}
        </svg>

        {/* Center Text */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '20px'
          }}
        >
          <span style={{ fontSize: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-body)', color: 'var(--slate)', letterSpacing: '0.06em', fontWeight: 600 }}>
            {centerLabel}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', color: 'var(--ink)', marginTop: '6px', letterSpacing: '-0.02em' }}>
            {currencySymbol}{formatShortIndianNumber(totalValue)}
          </span>
        </div>
      </div>

      {/* Legend below the donut (styled full width of summary) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '300px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--invested)' }} />
            <span style={{ color: 'var(--slate)', fontWeight: 500 }}>Invested</span>
          </div>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{currencySymbol}{formatIndianNumber(invested)}</span>
        </div>

        {returns > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--returns)' }} />
              <span style={{ color: 'var(--slate)', fontWeight: 500 }}>Est. Returns</span>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--returns)' }}>{currencySymbol}{formatIndianNumber(returns)}</span>
          </div>
        )}

        {withdrawn > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--withdrawn)' }} />
              <span style={{ color: 'var(--slate)', fontWeight: 500 }}>{withdrawn === invested ? 'Interest' : 'Payouts'}</span>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--withdrawn)' }}>{currencySymbol}{formatIndianNumber(withdrawn)}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
          <strong style={{ color: 'var(--ink)' }}>Total Value</strong>
          <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '15px' }}>{currencySymbol}{formatIndianNumber(totalValue)}</span>
        </div>
      </div>
    </div>
  );
}
