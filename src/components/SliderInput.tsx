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
  labelIcon?: React.ReactNode;
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
  tooltip,
  labelIcon
}: SliderInputProps) {
  const [inputValue, setInputValue] = useState(String(value));
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  // Logarithmic scale detection: if range is very large and min is greater than 0
  const isLog = max / min >= 1000 && min > 0;

  // Convert value to slider position (0 to 100)
  const valueToPosition = (val: number): number => {
    if (isLog) {
      const logMin = Math.log(min);
      const logMax = Math.log(max);
      const clampedVal = Math.max(min, Math.min(max, val));
      return ((Math.log(clampedVal) - logMin) / (logMax - logMin)) * 100;
    }
    return ((val - min) / (max - min)) * 100;
  };

  // Convert slider position (0 to 100) to value
  const positionToValue = (pos: number): number => {
    if (isLog) {
      const logMin = Math.log(min);
      const logMax = Math.log(max);
      const val = Math.exp(logMin + (pos / 100) * (logMax - logMin));
      return Math.round(val / step) * step;
    }
    return Math.round((min + (pos / 100) * (max - min)) / step) * step;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pos = Number(e.target.value);
    const val = positionToValue(pos);
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

  return (
    <div className="input-group">
      <div className="input-label-row">
        <label className="input-label" title={tooltip}>
          {labelIcon && <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '6px' }}>{labelIcon}</span>}
          {label}
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '120px' }}>
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
            <span style={{ fontSize: '10px', color: 'var(--amber)', marginTop: '4px', fontWeight: '500', textAlign: 'right' }}>
              Clamped [{min}-{max}]
            </span>
          )}
        </div>
      </div>
      <div className="slider-wrapper">
        {/* Grey inactive track base */}
        <div
          style={{
            position: 'absolute',
            left: '0',
            right: '0',
            height: '6px',
            backgroundColor: 'var(--border)',
            borderRadius: '6px',
            pointerEvents: 'none'
          }}
        />
        {/* Colored active track fill (aligned perfectly to thumb center) */}
        <div
          style={{
            position: 'absolute',
            left: '0',
            height: '6px',
            backgroundColor: 'var(--accent)',
            borderRadius: '6px',
            pointerEvents: 'none',
            width: `calc(9px + (100% - 18px) * (${valueToPosition(value)} / 100))`
          }}
        />
        {/* Transparent range input on top for drag interactions */}
        <input
          type="range"
          className="slider-input"
          min={0}
          max={100}
          step={0.01}
          value={valueToPosition(value)}
          onChange={handleSliderChange}
          aria-label={`${label} slider`}
          style={{
            background: 'transparent',
            position: 'relative',
            zIndex: 2
          }}
        />
      </div>
    </div>
  );
}
