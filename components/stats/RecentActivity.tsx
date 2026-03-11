"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getStartDate } from '../../lib/utils';
import { useTranslations, useLocale } from 'next-intl';

interface Props { dateFilter: string; }

interface ActivityLog {
  id: string;
  created_at: string;
  bpm_used: number | null;
  duration_seconds: number | null;
  exercises: { title: string; technique: string | null; };
}

interface GroupedDay {
  dateLabel: string;
  logs: ActivityLog[];
}

const ITEMS_PER_PAGE = 10;

function TechniqueTag({ technique }: { technique: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    'Legato':      { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa' },
    'Picking':     { bg: 'rgba(96,165,250,0.15)',  text: '#60a5fa' },
    'Sweep':       { bg: 'rgba(52,211,153,0.15)',  text: '#34d399' },
    'Tapping':     { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24' },
    'Vibrato':     { bg: 'rgba(248,113,113,0.15)', text: '#f87171' },
    'Bending':     { bg: 'rgba(220,185,138,0.15)', text: '#dcb98a' },
  };
  const color = colors[technique] || { bg: 'rgba(255,255,255,0.07)', text: 'var(--muted)' };
  return (
    <span style={{ background: color.bg, color: color.text, fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '100px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {technique}
    </span>
  );
}

export function RecentActivity({ dateFilter }: Props) {
  const t = useTranslations('RecentActivity');
  const locale = useLocale();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => { setPage(1); }, [dateFilter]);
  useEffect(() => { fetchActivity(); }, [page, dateFilter]);

  const fetchActivity = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from('practice_logs')
      .select('id, created_at, bpm_used, duration_seconds, exercises(title, technique)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const startDate = getStartDate(dateFilter);
    if (startDate) query = query.gte('created_at', startDate);

    const { data, count } = await query.range(from, to);

    if (data) {
      setLogs(data.map((log: any) => ({
        id: log.id,
        created_at: log.created_at,
        bpm_used: log.bpm_used,
        duration_seconds: log.duration_seconds,
        exercises: {
          title: Array.isArray(log.exercises) ? log.exercises[0]?.title : log.exercises?.title,
          technique: Array.isArray(log.exercises) ? log.exercises[0]?.technique : log.exercises?.technique,
        }
      })));
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
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <span className="loader" />
    </div>
  );

  if (logs.length === 0 && page === 1) return (
    <div style={{ background: 'var(--surface)', padding: '3rem', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)', textAlign: 'center' }}>
      <p style={{ color: 'var(--muted)', margin: 0 }}>{t('empty')}</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: 'var(--text)', margin: 0, letterSpacing: '0.05em' }}>
          {t('title')}
        </h2>
        <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{t('totalCount', { count: totalCount })}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {grouped.map(group => (
          <div key={group.dateLabel}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                {group.dateLabel}
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {group.logs.map(log => (
                <div key={log.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto',
                  alignItems: 'center', gap: '1rem',
                  background: 'var(--surface)', padding: '0.9rem 1.25rem',
                  borderRadius: '100px', border: '1px solid rgba(255,255,255,0.03)',
                  transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)'}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.exercises?.title || t('unknownExercise')}
                      </span>
                      {log.exercises?.technique && <TechniqueTag technique={log.exercises.technique} />}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.15rem', display: 'block' }}>
                      {new Date(log.created_at).toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', display: 'block' }}>{t('timeLabel')}</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>{formatDuration(log.duration_seconds)}</span>
                    </div>
                    {log.bpm_used != null && (
                      <div style={{ textAlign: 'right', minWidth: '52px' }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(220,185,138,0.5)', display: 'block' }}>{t('bpmLabel')}</span>
                        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: 'var(--gold)', lineHeight: 1 }}>{log.bpm_used}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            {t('pagination', { current: page, total: totalPages })}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)', color: page === 1 ? 'rgba(255,255,255,0.2)' : 'var(--text)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.88rem', transition: 'border-color 0.2s' }}
            >
              {t('prev')}
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)', color: page === totalPages ? 'rgba(255,255,255,0.2)' : 'var(--text)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.88rem', transition: 'border-color 0.2s' }}
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}