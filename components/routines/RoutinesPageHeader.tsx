"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

interface RoutinesPageHeaderProps {
  count: number;
  loading: boolean;
  canCreateRoutine: boolean;
  onCreateClick: () => void;
}

export function RoutinesPageHeader({ count, loading, canCreateRoutine, onCreateClick }: RoutinesPageHeaderProps) {
  const t = useTranslations('RoutinesPageHeader');

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
          {t('title')}
        </h1>
        <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
          {loading ? t('loading') : t('routineCount', { count })}
        </p>
      </div>
      <button data-onboarding="create-routine" onClick={onCreateClick} style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        background: canCreateRoutine ? 'var(--gold)' : 'transparent',
        color: canCreateRoutine ? '#111' : 'var(--gold)',
        padding: '0.8rem 1.5rem',
        borderRadius: '8px', fontWeight: 700, cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem',
        border: canCreateRoutine ? 'none' : '1px solid var(--gold)',
        boxShadow: canCreateRoutine ? '0 4px 14px rgba(220,185,138,0.25)' : 'none',
        transition: 'all 0.2s', whiteSpace: 'nowrap',
        width: 'fit-content', flexShrink: 0
      }}
        onMouseEnter={e => {
          e.currentTarget.style.background = canCreateRoutine ? 'var(--gold-dark)' : 'rgba(220,185,138,0.1)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = canCreateRoutine ? 'var(--gold)' : 'transparent';
        }}
      >
        {canCreateRoutine ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        )}
        {t('newRoutine')}
      </button>
    </div>
  );
}