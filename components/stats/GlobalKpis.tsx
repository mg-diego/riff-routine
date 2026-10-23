"use client";

import React from 'react';
import { BpmVelocityKpi } from './BpmVelocityKpi';
import { formatTime } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import styles from './GlobalKpis.module.css';

interface GlobalKpisProps {
  totalTimeMinutes: number;
  activeDays: number;
  streak: number;
  loading: boolean;
}

export function GlobalKpis({ totalTimeMinutes, activeDays, streak, loading }: GlobalKpisProps) {
  const t = useTranslations('GlobalKpis');

  if (loading) return (
    <div className="loader-container">
      <span className="loader" />
    </div>
  );

  const getStreakMessage = (count: number) => {
    if (count >= 30) return t('streakMessages.epic');
    if (count >= 14) return t('streakMessages.incredible');
    return t('streakMessages.great');
  };

  return (
    <div data-onboarding="stats-01" className={styles.totalTimeGrid}>

      <div className={styles.totalTimeBox}>
        <div className={styles.totalTimeRow}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(96,165,250,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span className="section-label">
            {t('totalTime')}
          </span>
        </div>
        <p className={styles.text}>
          {formatTime(totalTimeMinutes).map((part: { value: number; unit: string }, index: number) => (
            <React.Fragment key={index}>
              <span>{part.value}</span>
              <span className={styles.label}>{part.unit}</span>
            </React.Fragment>
          ))}
        </p>
      </div>

      <div className={styles.totalTimeBox}>
        <div className={styles.totalTimeRow}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(52,211,153,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span className="section-label">
            {t('activeDays')}
          </span>
        </div>
        <p className={styles.daysUnitText}>
          {activeDays}
          <span className={styles.daysUnitLabel}>
            {t('daysUnit', { count: activeDays })}
          </span>
        </p>
      </div>

      <div className={styles.currentStreak} style={{ background: streak > 0 ? 'linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(251,146,60,0.02) 100%)' : 'var(--surface)', border: `1px solid ${streak > 0 ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.04)'}` }}>
        <div className={styles.totalTimeRow}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={streak > 0 ? '#fb923c' : 'rgba(255,255,255,0.3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
          <span className="section-label">
            {t('currentStreak')}
          </span>
        </div>
        <p className={styles.daysUnitText2} style={{ color: streak > 0 ? '#fb923c' : 'var(--muted)' }}>
          {streak}
          <span className={styles.daysUnitLabel2}>
            {t('daysUnit', { count: streak })}
          </span>
        </p>
        {streak >= 7 && (
          <p className={styles.streakText}>
            🔥 {getStreakMessage(streak)}
          </p>
        )}
      </div>

      <BpmVelocityKpi />
    </div>
  );
}