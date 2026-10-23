"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import styles from './RoutinesPageHeader.module.css';
import { cx } from '@/lib/cx';

interface RoutinesPageHeaderProps {
  count: number;
  loading: boolean;
  canCreateRoutine: boolean;
  onCreateClick: () => void;
}

export function RoutinesPageHeader({ count, loading, canCreateRoutine, onCreateClick }: RoutinesPageHeaderProps) {
  const t = useTranslations('RoutinesPageHeader');

  return (
    <div className={styles.titleRow}>
      <div>
        <h1 className="page-title">
          {t('title')}
        </h1>
        <p className="page-subtitle">
          {loading ? t('loading') : t('routineCount', { count })}
        </p>
      </div>
      <button data-onboarding="routines-01" onClick={onCreateClick} className={cx(styles.newRoutineButton, !canCreateRoutine && styles.locked)}
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