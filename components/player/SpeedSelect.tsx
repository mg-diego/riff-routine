"use client";

import React, { useState, useRef, useEffect } from 'react';

const SPEEDS = ['0.25', '0.5', '0.75', '1', '1.25', '1.5'];

interface SpeedSelectProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function SpeedSelect({ value, onChange, disabled }: SpeedSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      {/* Trigger */}
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(220,185,138,0.4)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '8px',
          color: disabled ? 'rgba(255,255,255,0.25)' : 'var(--text)',
          padding: '0.45rem 0.75rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '0.85rem',
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 600,
          minWidth: '80px',
          transition: 'border-color 0.15s',
        }}
      >
        <span>× {parseFloat(value).toFixed(2)}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding: '0.35rem',
          zIndex: 100,
          minWidth: '100%',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          animation: 'fadeUp 0.12s ease',
        }}>
          {SPEEDS.map(s => {
            const isActive = s === value;
            return (
              <button
                key={s}
                onClick={() => handleSelect(s)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: isActive ? 'rgba(220,185,138,0.12)' : 'transparent',
                  color: isActive ? 'var(--gold)' : 'var(--text)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.45rem 0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: isActive ? 700 : 400,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                × {parseFloat(s).toFixed(2)}
                {isActive && <span style={{ float: 'right', opacity: 0.7 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}