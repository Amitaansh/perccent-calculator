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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="formula-block" style={{ margin: 0 }}>
        <div style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--ink)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Formula
        </div>
        <div style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 600, lineHeight: 1.5, color: 'var(--ink)', padding: '12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          {formula}
        </div>
        <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
          <span style={{ color: 'var(--slate)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Resolved variables:</span>
          <div style={{ display: 'flex', gap: '14px 20px', flexWrap: 'wrap', marginTop: '6px' }}>
            {Object.entries(variables).map(([key, val]) => (
              <span key={key} style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink)' }}>
                <strong>{key}</strong> = {val}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="assumptions-box" style={{ margin: 0, paddingLeft: '12px', borderLeft: '3px solid var(--accent)' }}>
        <div style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', color: 'var(--ink)' }}>
          Applied Assumptions
        </div>
        <ul style={{ listStyleType: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {assumptions.map((item, idx) => (
            <li key={idx} style={{ fontSize: '13px', color: 'var(--slate)' }}>
              • {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
