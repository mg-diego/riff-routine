"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getStartDate } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { Exercise } from '@/lib/types';
import { useTranslatedExercise } from '@/hooks/useTranslatedExercise';
import styles from './RecentActivity.module.css';
import { cx } from '@/lib/cx';

interface Props { dateFilter: string; }

interface ActivityLog {
  id: string;
  created_at: string;
  bpm_used: number | null;
  duration_seconds: number | null;
  exercises: { id: string; title: string; technique: string | null; };
}

interface GroupedDay {
  dateLabel: string;
  logs: ActivityLog[];
}

const ITEMS_PER_PAGE = 10;

function TechniqueTag({ technique }: { technique: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    'Legato': { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa' },
    'Picking': { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' },
    'Sweep': { bg: 'rgba(52,211,153,0.15)', text: '#34d399' },
    'Tapping': { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
    'Vibrato': { bg: 'rgba(248,113,113,0.15)', text: '#f87171' },
    'Bending': { bg: 'rgba(220,185,138,0.15)', text: '#dcb98a' },
  };
  const color = colors[technique] || { bg: 'rgba(255,255,255,0.07)', text: 'var(--muted)' };
  return (
    <span className={styles.label} style={{ background: color.bg, color: color.text }}>
      {technique}
    </span>
  );
}

export function RecentActivity({ dateFilter }: Props) {
  const router = useRouter();
  const t = useTranslations('RecentActivity');
  const locale = useLocale();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => { setPage(1); }, [dateFilter]);
  useEffect(() => { fetchActivity(); }, [page, dateFilter]);

  const { formatExercise } = useTranslatedExercise();

  const fetchActivity = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from('practice_logs')
      .select('id, created_at, bpm_used, duration_seconds, exercises(id, user_id, title, technique)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const startDate = getStartDate(dateFilter);
    if (startDate) query = query.gte('created_at', startDate);

    const { data, count } = await query.range(from, to);

    if (data) {
      setLogs(data.map((log: any) => {
        const rawExercise = Array.isArray(log.exercises) ? log.exercises[0] : log.exercises;
        const translatedEx = formatExercise(rawExercise as Exercise);

        return {
          id: log.id,
          created_at: log.created_at,
          bpm_used: log.bpm_used,
          duration_seconds: log.duration_seconds,
          exercises: {
            id: rawExercise?.id || '',
            title: translatedEx?.title || '',
            technique: translatedEx?.technique || '',
          }
        };
      }));
    }
    if (count !== null) setTotalCount(count);
    setLoading(false);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s > 0 ? `${s}s` : ''}` : `${s}s`;
  };

  const getDateLabel = (iso: string) => {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    if (isToday) return t('dates.today');
    if (isYesterday) return t('dates.yesterday');
    return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const grouped: GroupedDay[] = [];
  logs.forEach(log => {
    const label = getDateLabel(log.created_at);
    const existing = grouped.find(g => g.dateLabel === label);
    if (existing) existing.logs.push(log);
    else grouped.push({ dateLabel: label, logs: [log] });
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (loading) return (
    <div className={styles.row}>
      <span className="loader" />
    </div>
  );

  if (logs.length === 0 && page === 1) return (
    <div className={styles.emptyBox}>
      <p className={styles.emptyText}>{t('empty')}</p>
    </div>
  );

  return (
    <div>
      <div className={styles.titleRow}>
        <h2 className={styles.titleHeading}>
          {t('title')}
        </h2>
        <span className={styles.totalCountLabel}>{t('totalCount', { count: totalCount })}</span>
      </div>

      <div className={styles.unknownExerciseStack}>
        {grouped.map(group => (
          <div key={group.dateLabel}>
            <div className={styles.dateLabelRow}>
              <span className={styles.dateLabel}>
                {group.dateLabel}
              </span>
              <div className={styles.box} />
            </div>

            <div className={styles.unknownExerciseStack2}>
              {group.logs.map(log => {
                const isClickable = log.bpm_used != null && log.exercises?.id;

                return (
                  <div key={log.id} 
                    onClick={() => {
                      if (isClickable) {
                        router.push(`/library/${log.exercises.id}/history`);
                      }
                    }}
                    className={cx(styles.unknownExerciseGrid, isClickable && styles.clickable)}
                  >
                    <div className={styles.unknownExercise}>
                      <div className={styles.unknownExerciseRow}>
                        <span className={styles.unknownExerciseLabel}>
                          {log.exercises?.title || t('unknownExercise')}
                        </span>
                        {log.exercises?.technique && <TechniqueTag technique={log.exercises.technique} />}
                      </div>
                      <span className={styles.label3}>
                        {new Date(log.created_at).toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className={styles.timeLabelRow}>
                      <div className={styles.timeLabel}>
                        <span className={styles.timeLabelLabel}>{t('timeLabel')}</span>
                        <span className={styles.durationSecondsLabel}>{formatDuration(log.duration_seconds)}</span>
                      </div>
                      {log.bpm_used != null && (
                        <div className={styles.bpmLabel}>
                          <span className={styles.bpmLabelLabel}>{t('bpmLabel')}</span>
                          <span className={styles.bpmUsedLabel}>{log.bpm_used}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className={styles.paginationRow}>
          <span className={styles.paginationLabel}>
            {t('pagination', { current: page, total: totalPages })}
          </span>
          <div className={styles.prevRow}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={styles.prevButton} style={{ color: page === 1 ? 'rgba(255,255,255,0.2)' : 'var(--text)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              {t('prev')}
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={styles.prevButton} style={{ color: page === totalPages ? 'rgba(255,255,255,0.2)' : 'var(--text)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}