'use client';

import React from 'react';

interface TransparencyPanelProps {
  formula: string;
  variables: Record<string, string | number>;
  assumptions: string[];
}

export default function TransparencyPanel({
  formula,
  variables,
  assumptions
}: TransparencyPanelProps) {
  return (
    <details className="transparency-details" open>
      <summary style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--blue)', cursor: 'pointer', listStyle: 'none' }}>
        ▾ Show the math &amp; assumptions
      </summary>
      
      <div className="formula-block">
        <div style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--ink)' }}>
          Formula:
        </div>
        <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', lineHeight: 1.5, color: 'var(--ink)' }}>
          {formula}
        </div>
        <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
          <span style={{ color: 'var(--slate)', fontSize: '13px', fontWeight: '600' }}>Resolved variables:</span>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '6px' }}>
            {Object.entries(variables).map(([key, val]) => (
              <span key={key} style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink)' }}>
                <strong>{key}</strong> = {val}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="assumptions-box">
        <div style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px', color: 'var(--ink)' }}>
          Applied Assumptions
        </div>
        <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
          {assumptions.map((item, idx) => (
            <li key={idx} style={{ marginTop: '4px', fontSize: '13px', color: 'var(--slate)' }}>
              • {item}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
