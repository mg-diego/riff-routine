"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  LineChart, Line, XAxis, Tooltip, ResponsiveContainer, YAxis,
  ReferenceLine
} from 'recharts';
import { useTranslations, useLocale } from 'next-intl';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePagination } from '@/components/ui/TablePagination';
import { formatClock, formatKpiTime } from '@/lib/utils';
import { Exercise } from '@/lib/types';
import { useTranslatedExercise } from '@/hooks/useTranslatedExercise';
import styles from './page.module.css';
import { cx } from '@/lib/cx';
import ui from '@/components/ui/ui.module.css';

interface RoutineHistoryProps {
  params: Promise<{ id: string }>;
}

type SortKey = 'date' | 'duration' | 'exercises';

function Sparkline({ data, color = '#dcb98a', emptyText }: { data: number[]; color?: string; emptyText: string }) {
  if (data.length < 2) return (
    <div className={styles.row}>
      <span className={styles.label}>{emptyText}</span>
    </div>
  );
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120, h = 40, pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className={styles.icon}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {(() => {
        const last = pts.split(' ').pop()!.split(',');
        return <circle cx={last[0]} cy={last[1]} r="3" fill={color} />;
      })()}
    </svg>
  );
}

export default function RoutineHistoryPage({ params }: RoutineHistoryProps) {
  const router = useRouter();
  const { id } = use(params);
  const t = useTranslations('RoutineDetailHistoryPage');
  const locale = useLocale();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routineName, setRoutineName] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [logsMatrix, setLogsMatrix] = useState<Record<string, Record<string, any>>>({});
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');
  const [sessionLogs, setSessionLogs] = useState<Record<string, any[]>>({});
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [savingLogId, setSavingLogId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ bpm: '', durationMinutes: '' });
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [exerciseStats, setExerciseStats] = useState<Record<string, {
    bpmHistory: number[];
    totalSeconds: number;
    bestBpm: number | null;
    lastBpm: number | null;
    lastSessionDate: string | null;
  }>>({});

  useEffect(() => { fetchHistoryData(); }, [id]);

  const { formatExercise } = useTranslatedExercise();

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('errors.auth'));

      const { data: routineData, error: routineError } = await supabase
        .from('routines').select('title').eq('id', id).single();
      if (routineError) throw routineError;
      setRoutineName(routineData.title);

      const { data: rawExercisesData, error: exercisesError } = await supabase
        .from('routine_exercises')
        .select('exercise_id, target_bpm, target_duration_seconds, order_index, exercises (id, user_id, title)')
        .eq('routine_id', id).order('order_index', { ascending: true });

      if (exercisesError) throw exercisesError;

      const translatedExercises = (rawExercisesData || []).map(item => {
        const rawEx = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises;
        return {
          ...item,
          exercises: formatExercise(rawEx as Exercise)
        };
      });
      setExercises(translatedExercises);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('practice_sessions')
        .select('id, started_at, total_duration_seconds')
        .eq('routine_id', id)
        .not('total_duration_seconds', 'is', null)
        .order('started_at', { ascending: true });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      const chartFormatted = (sessionsData || []).map((s, i) => {
        const d = new Date(s.started_at);
        return {
          name: `${t('history.session')} ${i + 1}`,
          shortDate: d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short' }),
          time: d.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
          minutos: Math.round((s.total_duration_seconds || 0) / 60),
          id: s.id
        };
      });
      setChartData(chartFormatted);

      const exerciseIds = translatedExercises.map(e => e.exercise_id);

      if (exerciseIds.length > 0) {
        const { data: logsData, error: logsError } = await supabase
          .from('practice_logs')
          .select('id, session_id, exercise_id, bpm_used, duration_seconds, created_at')
          .in('exercise_id', exerciseIds).eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (logsError) throw logsError;

        const matrix: Record<string, Record<string, any>> = {};
        translatedExercises.forEach(ex => { matrix[ex.exercise_id] = {}; });

        const logsByEx: Record<string, any[]> = {};
        const sLogs: Record<string, any[]> = {};

        logsData?.forEach(log => {
          if (!logsByEx[log.exercise_id]) logsByEx[log.exercise_id] = [];
          logsByEx[log.exercise_id].push(log);

          if (!sLogs[log.session_id]) sLogs[log.session_id] = [];

          const exMatch = translatedExercises.find(e => e.exercise_id === log.exercise_id);
          const exTitle = exMatch?.exercises?.title;

          sLogs[log.session_id].push({
            ...log,
            title: exTitle || t('errors.unknownExercise')
          });
        });

        setSessionLogs(sLogs);

        Object.keys(logsByEx).forEach(exId => {
          const exLogs = logsByEx[exId];
          exLogs.forEach((log, index) => {
            if (!log.session_id) return;
            let prev = null;
            for (let i = index - 1; i >= 0; i--) {
              if (exLogs[i].session_id !== log.session_id && exLogs[i].bpm_used !== null) {
                prev = exLogs[i].bpm_used; break;
              }
            }
            matrix[exId][log.session_id] = { bpm: log.bpm_used, duration: log.duration_seconds, prevBpm: prev };
          });
        });
        setLogsMatrix(matrix);

        const stats: typeof exerciseStats = {};
        exerciseIds.forEach(exId => {
          const logs = logsByEx[exId] || [];
          const bpmHistory = logs.filter(l => l.bpm_used != null).map(l => l.bpm_used as number);
          const totalSeconds = logs.reduce((acc, l) => acc + (l.duration_seconds || 0), 0);
          const bestBpm = bpmHistory.length > 0 ? Math.max(...bpmHistory) : null;
          const lastLog = [...logs].reverse().find(l => l.bpm_used != null);
          const lastBpm = lastLog?.bpm_used ?? null;
          const lastSessionDate = lastLog
            ? new Date(lastLog.created_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short' })
            : null;
          stats[exId] = { bpmHistory, totalSeconds, bestBpm, lastBpm, lastSessionDate };
        });
        setExerciseStats(stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm(t('table.deleteConfirm'))) return;
    try {
      const { error } = await supabase.from('practice_sessions').delete().eq('id', sessionId);
      if (error) throw error;
      await fetchHistoryData();
    } catch (err) {
      alert(`${t('errors.delete')}: ` + (err instanceof Error ? err.message : String(err)));
    }
  };

  const startEditingLog = (log: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLogId(log.id);
    setEditForm({
      bpm: log.bpm_used?.toString() || '',
      durationMinutes: Math.floor((log.duration_seconds || 0) / 60).toString()
    });
  };

  const cancelEditingLog = (e: React.MouseEvent) => { e.stopPropagation(); setEditingLogId(null); };

  const handleSaveLog = async (logId: string, sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavingLogId(logId);
    try {
      const bpm = parseInt(editForm.bpm);
      const mins = parseInt(editForm.durationMinutes);
      const bpmToSave = isNaN(bpm) ? null : bpm;
      const durationSecs = isNaN(mins) ? 0 : mins * 60;

      const { error: updateError } = await supabase
        .from('practice_logs')
        .update({ bpm_used: bpmToSave, duration_seconds: durationSecs })
        .eq('id', logId);
      if (updateError) throw updateError;

      const { data: allLogs, error: fetchError } = await supabase
        .from('practice_logs')
        .select('duration_seconds')
        .eq('session_id', sessionId);
      if (fetchError) throw fetchError;

      const newTotalSecs = (allLogs || []).reduce((acc, l) => acc + (l.duration_seconds || 0), 0);

      const { error: sessionError } = await supabase
        .from('practice_sessions')
        .update({ total_duration_seconds: newTotalSecs })
        .eq('id', sessionId);
      if (sessionError) throw sessionError;

      setEditingLogId(null);
      await fetchHistoryData();
    } catch (err: any) {
      alert(err.message || t('errors.save'));
    } finally {
      setSavingLogId(null);
    }
  };

  const getHeatmapColor = (bpm: number | null, targetBpm: number | null) => {
    if (bpm === null || !targetBpm) return 'rgba(220,185,138,0.3)';
    const ratio = Math.min(1, bpm / targetBpm);
    return `rgba(220,185,138,${0.1 + ratio * 0.9})`;
  };

  const formatKpi = (totalSecs: number) => formatKpiTime(totalSecs, t('table.min'));

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    setCurrentPage(1);
  };

  const renderSortableHeader = (label: string, key: SortKey) => (
    <SortableHeader label={label} sortKey={key} sortConfig={sortConfig} onSort={handleSort} />
  );

  const getTableData = () => sessions.map(session => {
    const d = new Date(session.started_at);
    return {
      id: session.id,
      timestamp: d.getTime(),
      dateTimeStr: `${d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`,
      duration: session.total_duration_seconds || 0,
      minutos: Math.round((session.total_duration_seconds || 0) / 60),
      exercisesCount: sessionLogs[session.id]?.length || 0
    };
  });

  const sortedTableData = [...getTableData()].sort((a, b) => {
    const key = sortConfig.key;
    const valA = key === 'date' ? a.timestamp : key === 'duration' ? a.duration : a.exercisesCount;
    const valB = key === 'date' ? b.timestamp : key === 'duration' ? b.duration : b.exercisesCount;
    return sortConfig.direction === 'asc' ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
  });

  const totalPages = Math.ceil(sortedTableData.length / itemsPerPage);
  const paginatedData = sortedTableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalSessions = sessions.length;
  const totalSeconds = sessions.reduce((acc, s) => acc + (s.total_duration_seconds || 0), 0);
  const avgSeconds = totalSessions > 0 ? Math.round(totalSeconds / totalSessions) : 0;
  const bestSession = [...sessions].sort((a, b) => (b.total_duration_seconds || 0) - (a.total_duration_seconds || 0))[0];

  const heatmapExercises = exercises.filter(ex => {
    const logs = logsMatrix[ex.exercise_id];
    return logs && Object.values(logs).some(l => l.bpm !== null && l.bpm !== undefined);
  });

  if (loading) return <div className="loader-container"><span className="loader" /></div>;

  return (
    <div className={styles.back}>
      <button onClick={() => router.back()} className={ui.backLink}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        {t('back')}
      </button>

      <div className={styles.performanceIn}>
        <h1 className={styles.performanceInTitle}>
          {t('performanceIn')} <span className={styles.routineNameLabel}>{routineName}</span>
        </h1>
        <p className={styles.sessionsCompletedText}>{totalSessions} {t('sessionsCompleted')}</p>
      </div>

      <div className={styles.statsRow}>
        {(['stats', 'history'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={styles.statsButton} style={{ background: activeTab === tab ? 'var(--gold)' : 'transparent', color: activeTab === tab ? '#111' : 'var(--muted)' }}>
            {tab === 'stats' ? (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>{t('tabs.stats')}</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>{t('tabs.detailedHistory')}</>
            )}
          </button>
        ))}
      </div>

      {error && <div className={`alert-error ${styles.block}`}>⚠ {error}</div>}

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className={styles.backBlock}>📈</div>
          <p className={styles.titleText}>{t('noData.title')}</p>
          <p className={styles.descriptionText}>{t('noData.description')}</p>
        </div>
      ) : activeTab === 'stats' ? (
        <div className={styles.completedSessionsStack}>
          <div className={styles.completedSessionsGrid}>
            {[
              { label: t('stats.completedSessions'), value: totalSessions, color: 'var(--gold)' },
              { label: t('stats.totalTime'), value: formatKpi(totalSeconds), color: 'var(--text)' },
              { label: t('stats.avgSession'), value: formatKpi(avgSeconds), color: 'var(--text)' },
              { label: t('stats.bestSession'), value: bestSession ? formatKpi(bestSession.total_duration_seconds) : '—', color: '#4ade80', sub: bestSession ? new Date(bestSession.started_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined },
            ].map(({ label, value, color, sub }) => (
              <div key={label} className={styles.box}>
                <span className={styles.completedSessionsGridLabel}>{label}</span>
                <p className={styles.text} style={{ color }}>{value}</p>
                {sub && <p className={styles.completedSessionsGridText}>{sub}</p>}
              </div>
            ))}
          </div>

          <div className="surface-card">
            <h2 className={styles.minutesPerSessionHeading}>{t('stats.minutesPerSession')}</h2>
            <div className={styles.completedSessionsStackBlock}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tickFormatter={v => chartData.find(d => d.name === v)?.shortDate || v} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip labelFormatter={label => { const s = chartData.find(d => d.name === label); return s ? `${s.shortDate} - ${s.time}` : label; }} contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(220,185,138,0.3)', borderRadius: '8px', color: '#f0e8dc' }} itemStyle={{ color: '#dcb98a', fontWeight: 700 }} />
                  {avgSeconds > 0 && <ReferenceLine y={Math.round(avgSeconds / 60)} stroke="rgba(220,185,138,0.3)" strokeDasharray="4 4" label={{ value: 'Avg', fill: 'rgba(220,185,138,0.5)', fontSize: 11 }} />}
                  <Line type="monotone" dataKey="minutos" stroke="#dcb98a" strokeWidth={3} dot={{ fill: '#141414', stroke: '#dcb98a', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#dcb98a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {exercises.length > 0 && (
            <div>
              <h2 className={styles.exerciseProgressHeading}>{t('stats.exerciseProgress')}</h2>
              <div className={styles.lastPracticeGrid}>
                {exercises.map(ex => {
                  const st = exerciseStats[ex.exercise_id];
                  const ed = ex.exercises as any;
                  const title = Array.isArray(ed) ? ed[0]?.title : ed?.title;
                  if (!st) return null;
                  const bpmDelta = st.bpmHistory.length >= 2 ? st.bpmHistory[st.bpmHistory.length - 1] - st.bpmHistory[0] : null;
                  const targetBpm = ex.target_bpm;
                  const pctOfGoal = targetBpm && st.lastBpm ? Math.min(100, Math.round((st.lastBpm / targetBpm) * 100)) : null;
                  return (
                    <div key={ex.exercise_id} className={styles.lastPracticeStack}>
                      <div>
                        <h3 className={styles.subheading}>{title}</h3>
                        {st.lastSessionDate && <span className={styles.lastPracticeLabel}>{t('stats.lastPractice')}: {st.lastSessionDate}</span>}
                      </div>
                      {st.bpmHistory.length >= 2 ? (
                        <div>
                          <span className={styles.bpmEvolutionLabel}>{t('stats.bpmEvolution')}</span>
                          <div className={styles.insufficientDataSparkRow}>
                            <Sparkline data={st.bpmHistory} emptyText={t('errors.insufficientDataSpark')} />
                            {bpmDelta !== null && (
                              <span className={styles.bpmDeltaLabel} style={{ color: bpmDelta > 0 ? '#4ade80' : bpmDelta < 0 ? '#f87171' : 'var(--muted)', background: bpmDelta > 0 ? 'rgba(74,222,128,0.1)' : bpmDelta < 0 ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.05)' }}>
                                {bpmDelta > 0 ? '+' : ''}{bpmDelta} BPM
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.label}>{t('stats.insufficientData')}</div>
                      )}
                      <div className={styles.totalTimeShortGrid}>
                        <div>
                          <span className={styles.totalTimeShortLabel}>{t('stats.totalTimeShort')}</span>
                          <span className={styles.totalSecondsLabel}>{formatKpi(st.totalSeconds)}</span>
                        </div>
                        <div>
                          <span className={styles.totalTimeShortLabel}>{t('stats.bestBpm')}</span>
                          <span className={styles.totalTimeShortGridLabel}>{st.bestBpm ?? '—'}</span>
                        </div>
                        <div>
                          <span className={styles.totalTimeShortLabel}>{t('stats.lastBpm')}</span>
                          <span className={styles.label7}>{st.lastBpm ?? '—'}</span>
                        </div>
                      </div>
                      {pctOfGoal !== null && (
                        <div>
                          <div className={styles.towardsGoalRow}>
                            <span className={styles.towardsGoalLabel}>{t('stats.towardsGoal')} ({targetBpm} BPM)</span>
                            <span className={styles.pctOfGoalLabel} style={{ color: pctOfGoal >= 100 ? '#4ade80' : 'var(--gold)' }}>{pctOfGoal}%</span>
                          </div>
                          <div className={styles.lastPracticeStackBox}>
                            <div className={styles.lastPracticeStackBlock} style={{ width: `${pctOfGoal}%`, background: pctOfGoal >= 100 ? '#4ade80' : 'var(--gold)' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {heatmapExercises.length > 0 && (
            <div className={`surface-card ${styles.progressMatrix}`}>
              <h2 className={styles.minutesPerSessionHeading}>{t('stats.progressMatrix')}</h2>
              <div className={styles.exercise}>
                <div className={styles.exerciseRow}>
                  <div className={styles.exercise2}>{t('stats.exercise')}</div>
                  <div className={styles.exerciseRowInner}>
                    {sessions.map(s => (
                      <div key={s.id} className={styles.exerciseRowBlock}>
                        {new Date(s.started_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: '2-digit' })}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.exerciseStack}>
                  {heatmapExercises.map(ex => (
                    <div key={ex.exercise_id} className={styles.exerciseRow2}>
                      <div className={styles.exercise3}>
                        <p className={styles.exerciseText}>{(ex.exercises as any)?.title || t('stats.exercise')}</p>
                        <p className={styles.exerciseStackText}>Obj: {ex.target_bpm ? `${ex.target_bpm} BPM` : '—'} • {formatClock(ex.target_duration_seconds || 0)}</p>
                      </div>
                      <div className={styles.exerciseRowInner}>
                        {sessions.map(session => {
                          const log = logsMatrix[ex.exercise_id]?.[session.id];
                          const diff = log && log.prevBpm !== null && log.bpm !== null ? log.bpm - log.prevBpm : 0;
                          return (
                            <div key={session.id} className={styles.notPracticedStack} style={{ background: log?.bpm != null ? getHeatmapColor(log.bpm, ex.target_bpm) : 'rgba(255,255,255,0.02)' }} title={log ? `BPM: ${log.bpm ?? 'N/A'}\nTiempo: ${formatClock(log.duration)}` : t('stats.notPracticed')}>
                              {log?.bpm != null ? (
                                <div className={styles.notPracticedStackRow}>
                                  <span className={styles.notPracticedStackLabel}>{log.bpm}</span>
                                  {diff !== 0 && <span className={styles.diffLabel} style={{ color: diff > 0 ? '#15803d' : '#b91c1c' }}>{diff > 0 ? '↑' : '↓'}{Math.abs(diff)}</span>}
                                </div>
                              ) : <span className={styles.label11}>—</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.lessGoalRow}>
                <span>{t('stats.lessGoal')}</span>
                <div className={styles.lessGoalRowInner}>
                  {[0.2, 0.5, 0.8, 1].map(o => <div key={o} className={styles.lessGoalRowBlock} style={{ background: `rgba(220,185,138,${o})` }} />)}
                </div>
                <span>{t('stats.goalReached')}</span>
              </div>
            </div>
          )}
        </div>

      ) : (
        <div className={styles.dateTimeBox}>
          <table className={styles.dateTimeTable}>
            <thead>
              <tr className={styles.dateTimeTr}>
                <th className={styles.th}></th>
                {renderSortableHeader(t('table.dateTime'), 'date')}
                {renderSortableHeader(t('table.totalTime'), 'duration')}
                {renderSortableHeader(t('table.exercises'), 'exercises')}
                <th className={styles.actionsTh}>{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map(session => (
                <React.Fragment key={session.id}>
                  <tr onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)} className={cx(styles.minTr, styles.sessionRow, expandedSessionId === session.id && styles.expanded)}>
                    <td className={styles.td}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.minTrIcon} style={{ transform: expandedSessionId === session.id ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
                    </td>
                    <td className={styles.dateTimeStrTd}>{session.dateTimeStr}</td>
                    <td className={styles.minTd}>{session.minutos} {t('table.min')}</td>
                    <td className={styles.exercisesCountTd}>{session.exercisesCount}</td>
                    <td className={styles.deleteTd}>
                      <button onClick={e => { e.stopPropagation(); handleDeleteSession(session.id); }} className={styles.deleteButton}>
                        {t('table.delete')}
                      </button>
                    </td>
                  </tr>
                  {expandedSessionId === session.id && (
                    <tr className={styles.practicedExercisesTr}>
                      <td colSpan={5} className={styles.practicedExercisesTd}>
                        <div className={styles.practicedExercisesBox}>
                          <h4 className={styles.practicedExercisesSubheading}>{t('table.practicedExercises')}</h4>
                          {(!sessionLogs[session.id] || sessionLogs[session.id].length === 0) ? (
                            <p className={styles.noExercisesText}>{t('table.noExercises')}</p>
                          ) : (
                            <table className={styles.exerciseTable}>
                              <thead>
                                <tr className={styles.exerciseTr}>
                                  <th className={styles.exerciseTh}>{t('table.exercise')}</th>
                                  <th className={styles.exerciseTh}>{t('table.bpm')}</th>
                                  <th className={styles.exerciseTh}>{t('table.time')}</th>
                                  <th className={styles.actionsTh2}>{t('table.actions')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sessionLogs[session.id].map(log => (
                                  <tr key={log.id} className={styles.exerciseTableTr}>
                                    {editingLogId === log.id ? (
                                      <>
                                        <td className={styles.exerciseTableTd}>{log.title}</td>
                                        <td className={styles.exerciseTableTrTd}>
                                          <input
                                            type="number"
                                            value={editForm.bpm}
                                            onChange={e => setEditForm({ ...editForm, bpm: e.target.value })}
                                            disabled={savingLogId === log.id}
                                            className={styles.input} style={{ opacity: savingLogId === log.id ? 0.5 : 1 }}
                                          />
                                        </td>
                                        <td className={styles.exerciseTableTrTd}>
                                          <div className={styles.minRow}>
                                            <input
                                              type="number"
                                              value={editForm.durationMinutes}
                                              onChange={e => setEditForm({ ...editForm, durationMinutes: e.target.value })}
                                              disabled={savingLogId === log.id}
                                              className={styles.minRowInput} style={{ opacity: savingLogId === log.id ? 0.5 : 1 }}
                                            />
                                            <span className={styles.minLabel}>{t('table.min')}</span>
                                          </div>
                                        </td>
                                        <td className={styles.td6}>
                                          <div className={styles.exerciseTableRow}>
                                            <button
                                              onClick={cancelEditingLog}
                                              disabled={savingLogId === log.id}
                                              className={styles.button} style={{ cursor: savingLogId === log.id ? 'not-allowed' : 'pointer', opacity: savingLogId === log.id ? 0.4 : 1 }}
                                            >
                                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                            </button>
                                            <button
                                              onClick={e => handleSaveLog(log.id, session.id, e)}
                                              disabled={savingLogId === log.id}
                                              className={styles.exerciseTableButton} style={{ cursor: savingLogId === log.id ? 'not-allowed' : 'pointer' }}
                                            >
                                              {savingLogId === log.id ? (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={styles.exerciseTableIcon}>
                                                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                                </svg>
                                              ) : (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                              )}
                                            </button>
                                          </div>
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td className={styles.td7}>{log.title}</td>
                                        <td className={styles.td8}>{log.bpm_used ?? '---'}</td>
                                        <td className={styles.minTd2}>{Math.floor(log.duration_seconds / 60)} {t('table.min')}</td>
                                        <td className={styles.td9}><button onClick={e => startEditingLog(log, e)} className={styles.exerciseTableTrButton}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button></td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            labels={{ page: t('table.page'), of: t('table.of'), prev: t('table.prev'), next: t('table.next') }}
          />
        </div>
      )}

    </div>
  );
}