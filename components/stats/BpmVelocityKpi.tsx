"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import styles from './BpmVelocityKpi.module.css';

export function BpmVelocityKpi() {
  const t = useTranslations('BpmVelocityKpi');
  const [velocity, setVelocity] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBpmVelocity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: logs } = await supabase
        .from('practice_logs')
        .select('exercise_id, bpm_used, created_at')
        .eq('user_id', user.id);

      if (!logs || logs.length === 0) {
        setVelocity(0);
        setLoading(false);
        return;
      }

      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);

      const recentMaxBpm = new Map<string, number>();
      const pastMaxBpm = new Map<string, number>();

      logs.forEach(log => {
        const logDate = new Date(log.created_at);
        const isRecent = logDate >= sevenDaysAgo;

        if (isRecent) {
          const currentMax = recentMaxBpm.get(log.exercise_id) || 0;
          if (log.bpm_used > currentMax) {
            recentMaxBpm.set(log.exercise_id, log.bpm_used);
          }
        } else {
          const currentMax = pastMaxBpm.get(log.exercise_id) || 0;
          if (log.bpm_used > currentMax) {
            pastMaxBpm.set(log.exercise_id, log.bpm_used);
          }
        }
      });

      let totalDelta = 0;
      let count = 0;

      recentMaxBpm.forEach((recentBpm, exerciseId) => {
        const pastBpm = pastMaxBpm.get(exerciseId);
        if (pastBpm !== undefined && pastBpm > 0) {
          totalDelta += (recentBpm - pastBpm);
          count++;
        }
      });

      if (count > 0) {
        setVelocity(Math.round(totalDelta / count));
      } else {
        setVelocity(0);
      }
      
      setLoading(false);
    };

    fetchBpmVelocity();
  }, []);

  if (loading) {
    return (
      <div className={`surface-card ${styles.row}`}>
        <span className={styles.label} />
      </div>
    );
  }

  const isPositive = velocity !== null && velocity > 0;
  const isNeutral = velocity === 0;
  const color = isPositive ? '#34d399' : isNeutral ? 'var(--muted)' : '#e74c3c';
  const sign = isPositive ? '+' : '';

  return (
    <div className="surface-card">
      <h3 className={styles.titleSubheading}>
        {t('title')}
      </h3>
      <div className={styles.unitRow}>
        <p className={styles.text} style={{ color: color }}>
          {sign}{velocity}
        </p>
        <span className={styles.unitLabel}>{t('unit')}</span>
      </div>
      <p className={styles.descriptionText}>
        {t('description')}
      </p>
    </div>
  );
}