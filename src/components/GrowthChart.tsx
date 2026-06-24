'use client';

import React, { useState } from 'react';

interface ChartDataPoint {
  label: string; // e.g. "Yr 1", "Mo 12"
  invested: number;
  value: number; // For SWP, this is the remaining corpus; for EMI, this is the outstanding principal
  growth?: number; // Optional, value - invested
}

interface GrowthChartProps {
  data: ChartDataPoint[];
  type: 'stacked-area' | 'depletion-line' | 'emi-balance';
  currencySymbol?: string;
}

export default function GrowthChart({
  data,
  type,
  currencySymbol = '₹'
}: GrowthChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  // Formatting helpers
  const formatIndianNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(num);
  };

  // SVG dimensions
  const width = 600;
  const height = 300;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max values for scaling
  const maxVal = Math.max(...data.map(d => Math.max(d.value, d.invested, 0)));
  const yMax = maxVal === 0 ? 1 : maxVal * 1.1; // 10% headroom

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clampedVal = Math.max(0, val);
    return height - paddingBottom - (clampedVal / yMax) * chartHeight;
  };

  // Generate paths
  let paths: React.ReactNode = null;

  if (type === 'stacked-area') {
    // Two areas: Invested (bottom) and Growth (stacked on top)
    let investedAreaPath = '';
    let totalAreaPath = '';

    data.forEach((d, i) => {
      const x = getX(i);
      const yInvested = getY(d.invested);
      const yValue = getY(d.value);

      if (i === 0) {
        investedAreaPath = `M ${x} ${getY(0)} L ${x} ${yInvested}`;
        totalAreaPath = `M ${x} ${getY(0)} L ${x} ${yValue}`;
      } else {
        investedAreaPath += ` L ${x} ${yInvested}`;
        totalAreaPath += ` L ${x} ${yValue}`;
      }
    });

    // Close the area paths
    const firstX = getX(0);
    const lastX = getX(data.length - 1);
    investedAreaPath += ` L ${lastX} ${getY(0)} Z`;
    totalAreaPath += ` L ${lastX} ${getY(0)} Z`;

    paths = (
      <>
        {/* Total Value Area (Green) */}
        <path d={totalAreaPath} fill="url(#returnsGrad)" opacity="0.85" />
        {/* Invested Area (Blue) */}
        <path d={investedAreaPath} fill="url(#investedGrad)" opacity="0.9" />
      </>
    );
  } else if (type === 'depletion-line' || type === 'emi-balance') {
    // Single line indicating outstanding balance / corpus
    let linePath = '';
    let areaPath = '';

    data.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.value);

      if (i === 0) {
        linePath = `M ${x} ${y}`;
        areaPath = `M ${x} ${getY(0)} L ${x} ${y}`;
      } else {
        linePath += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
      }
    });

    const lastX = getX(data.length - 1);
    areaPath += ` L ${lastX} ${getY(0)} Z`;

    const strokeColor = type === 'depletion-line' ? 'var(--withdrawn)' : 'var(--blue)';
    const gradId = type === 'depletion-line' ? 'withdrawnGrad' : 'investedGrad';

    // Find depletion marker
    const depletionIdx = data.findIndex(d => d.value <= 0);
    const hasDepletion = depletionIdx !== -1;

    paths = (
      <>
        <path d={areaPath} fill={`url(#${gradId})`} opacity="0.3" />
        <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="3" />
        {hasDepletion && (
          <circle
            cx={getX(depletionIdx)}
            cy={getY(0)}
            r="6"
            fill="red"
            stroke="white"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}
          />
        )}
      </>
    );
  }

  // Y-axis grid lines (4 lines)
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', width: '100%', paddingBottom: `${(height / width) * 100}%` }}>
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
        >
          <defs>
            <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--invested)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--invested)" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="returnsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--returns)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--returns)" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="withdrawnGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--withdrawn)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--withdrawn)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={getY(tick)}
                x2={width - paddingRight}
                y2={getY(tick)}
                stroke="var(--border)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={getY(tick) + 4}
                textAnchor="end"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fill: 'var(--slate)' }}
              >
                {tick >= 100000 ? `${(tick / 100000).toFixed(0)}L` : formatIndianNumber(tick)}
              </text>
            </g>
          ))}

          {/* X Axis line */}
          <line
            x1={paddingLeft}
            y1={height - paddingBottom}
            x2={width - paddingRight}
            y2={height - paddingBottom}
            stroke="var(--border)"
            strokeWidth="2"
          />

          {/* X Axis Ticks (Show up to 5 ticks) */}
          {data.length > 1 &&
            [0, Math.floor(data.length * 0.25), Math.floor(data.length * 0.5), Math.floor(data.length * 0.75), data.length - 1].map((idx, i) => {
              const d = data[idx];
              if (!d) return null;
              return (
                <text
                  key={i}
                  x={getX(idx)}
                  y={height - paddingBottom + 18}
                  textAnchor="middle"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fill: 'var(--slate)' }}
                >
                  {d.label}
                </text>
              );
            })}

          {/* Render paths */}
          {paths}

          {/* Hover interactive bars */}
          {data.map((d, i) => {
            const x = getX(i);
            return (
              <rect
                key={i}
                x={x - chartWidth / (data.length * 2)}
                y={paddingTop}
                width={chartWidth / data.length}
                height={chartHeight}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            );
          })}

          {/* Hover line and points */}
          {hoverIndex !== null && data[hoverIndex] && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={paddingTop}
                x2={getX(hoverIndex)}
                y2={height - paddingBottom}
                stroke="var(--slate)"
                strokeDasharray="2 2"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(data[hoverIndex].value)}
                r="5"
                fill={type === 'depletion-line' ? 'var(--withdrawn)' : 'var(--returns)'}
                stroke="white"
                strokeWidth="1.5"
              />
              {type === 'stacked-area' && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(data[hoverIndex].invested)}
                  r="5"
                  fill="var(--invested)"
                  stroke="white"
                  strokeWidth="1.5"
                />
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Custom Tooltip display */}
      {hoverIndex !== null && data[hoverIndex] && (
        <div
          className="mono"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            marginTop: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <span style={{ color: 'var(--slate)' }}>Timeline:</span>{' '}
            <strong>{data[hoverIndex].label}</strong>
          </div>
          {type === 'stacked-area' && (
            <>
              <div>
                <span style={{ color: 'var(--invested)' }}>●</span>{' '}
                <span style={{ color: 'var(--slate)' }}>Invested:</span>{' '}
                <strong>{currencySymbol}{formatIndianNumber(data[hoverIndex].invested)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--returns)' }}>●</span>{' '}
                <span style={{ color: 'var(--slate)' }}>Value:</span>{' '}
                <strong>{currencySymbol}{formatIndianNumber(data[hoverIndex].value)}</strong>
              </div>
            </>
          )}
          {type === 'depletion-line' && (
            <div>
              <span style={{ color: 'var(--withdrawn)' }}>●</span>{' '}
              <span style={{ color: 'var(--slate)' }}>Corpus:</span>{' '}
              <strong>{currencySymbol}{formatIndianNumber(data[hoverIndex].value)}</strong>
            </div>
          )}
          {type === 'emi-balance' && (
            <div>
              <span style={{ color: 'var(--blue)' }}>●</span>{' '}
              <span style={{ color: 'var(--slate)' }}>Balance:</span>{' '}
              <strong>{currencySymbol}{formatIndianNumber(data[hoverIndex].value)}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
