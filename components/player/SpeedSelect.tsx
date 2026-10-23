"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import styles from './SpeedSelect.module.css';
import { cx } from '@/lib/cx';

const SPEEDS = ['0.25', '0.5', '0.75', '1', '1.25', '1.5'];

interface SpeedSelectProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function SpeedSelect({ value, onChange, disabled }: SpeedSelectProps) {
  const t = useTranslations('SpeedSelect');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
    <div ref={ref} className={styles.format}>
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className={styles.formatButton} style={{ border: `1px solid ${open ? 'rgba(220,185,138,0.4)' : 'rgba(255,255,255,0.1)'}`, color: disabled ? 'rgba(255,255,255,0.25)' : 'var(--text)', cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <span>{t('format', { value: parseFloat(value).toFixed(2) })}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={styles.icon} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className={styles.formatLayer}>
          {SPEEDS.map(s => {
            const isActive = s === value;
            return (
              <button
                key={s}
                onClick={() => handleSelect(s)}
                className={cx(styles.formatLayerButton, isActive && styles.formatLayerButtonActive)}
              >
                {t('format', { value: parseFloat(s).toFixed(2) })}
                {isActive && <span className={styles.label}>✓</span>}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}