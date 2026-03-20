"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

interface DeleteButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function DeleteButton({ onClick }: DeleteButtonProps) {
  const t = useTranslations('DeleteButton');

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
        e.currentTarget.style.color = '#ff4444';
        e.currentTarget.style.borderColor = 'rgba(255,68,68,0.4)';
        e.currentTarget.style.background = 'rgba(255,68,68,0.05)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--muted)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
      }}
      title={t('tooltip')}
    >
      <svg style={{ transform: 'scale(1.8)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    </button>
  );
}