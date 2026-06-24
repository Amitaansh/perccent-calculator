'use client';

import React, { useState, useEffect } from 'react';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  symbol: string;
  symbolPosition?: 'prefix' | 'suffix';
  tooltip?: string;
}

export default function SliderInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  symbol,
  symbolPosition = 'prefix',
  tooltip
}: SliderInputProps) {
  const [inputValue, setInputValue] = useState(String(value));
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onChange(val);
    setIsClamped(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setInputValue(rawVal);

    const val = Number(rawVal.replace(/,/g, ''));
    if (!isNaN(val)) {
      if (val < min) {
        setIsClamped(true);
      } else if (val > max) {
        setIsClamped(true);
      } else {
        setIsClamped(false);
        onChange(val);
      }
    }
  };

  const handleTextBlur = () => {
    const val = Number(inputValue.replace(/,/g, ''));
    if (isNaN(val) || val < min) {
      onChange(min);
      setInputValue(String(min));
    } else if (val > max) {
      onChange(max);
      setInputValue(String(max));
    }
    setIsClamped(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTextBlur();
    }
  };

  const formatNumber = (val: string) => {
    const num = Number(val.replace(/,/g, ''));
    if (isNaN(num)) return val;
    return num.toLocaleString('en-IN');
  };

  // Generate formatted display value
  const displayVal = symbolPosition === 'prefix' ? `${symbol}${formatNumber(inputValue)}` : `${formatNumber(inputValue)} ${symbol}`;

  return (
    <div className="input-group">
      <div className="input-label-row">
        <label className="input-label" title={tooltip}>
          {label}
          {tooltip && <span style={{ marginLeft: '4px', cursor: 'help', fontSize: '12px' }}>ℹ️</span>}
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <input
            type="text"
            className="input-value-chip"
            value={inputValue}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={handleKeyDown}
            aria-label={label}
          />
          {isClamped && (
            <span style={{ fontSize: '10px', color: 'var(--amber)', marginTop: '4px', fontWeight: '500' }}>
              Clamped to range [{min} - {max}]
            </span>
          )}
        </div>
      </div>
      <div className="slider-wrapper">
        <input
          type="range"
          className="slider-input"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          aria-label={`${label} slider`}
        />
        <div
          style={{
            position: 'absolute',
            left: '0',
            height: '6px',
            backgroundColor: 'var(--blue)',
            borderRadius: '6px',
            pointerEvents: 'none',
            width: `${((value - min) / (max - min)) * 100}%`
          }}
        />
      </div>
    </div>
  );
}
