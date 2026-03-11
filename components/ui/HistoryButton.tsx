"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

interface HistoryButtonProps {
  onClick: () => void;
}

export function HistoryButton({ onClick }: HistoryButtonProps) {
  const t = useTranslations('HistoryButton');

  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        color: 'var(--muted)',
        border: '1px solid rgba(255,255,255,0.08)',
        width: '42px',
        height: '42px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = '#60a5fa';
        e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)';
        e.currentTarget.style.background = 'rgba(96,165,250,0.05)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--muted)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
      }}
      title={t('tooltip')}
    >
      <svg style={{ transform: 'scale(1.8)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    </button>
  );
}