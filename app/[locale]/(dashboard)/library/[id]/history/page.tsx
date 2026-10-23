"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useTranslations, useLocale } from 'next-intl';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePagination } from '@/components/ui/TablePagination';
import { formatClock, formatKpiTime } from '@/lib/utils';
import { useTranslatedExercise } from '@/hooks/useTranslatedExercise';
import styles from './page.module.css';
import ui from '@/components/ui/ui.module.css';

interface PracticeLog {
  id: string;
  created_at: string;
  bpm_used: number;
  duration_seconds: number;
}

type SortKey = 'date' | 'bpm' | 'duration';

export default function ExerciseHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('ExerciseHistoryPage');
  const exerciseId = params.id as string;

  const [exerciseName, setExerciseName] = useState<string>('');  
  const { formatExercise } = useTranslatedExercise();
        
  const [targetBpm, setTargetBpm] = useState<number | null>(null);
  const [hasBpm, setHasBpm] = useState<boolean>(true);
  const [logs, setLogs] = useState<PracticeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ date: string; bpm: number | string; durationMinutes: number | string }>({
    date: '',
    bpm: '',
    durationMinutes: ''
  });

  const [showHistoryImport, setShowHistoryImport] = useState(false);
  const [historyText, setHistoryText] = useState('');
  const [importingHistory, setImportingHistory] = useState(false);

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntryForm, setManualEntryForm] = useState({ date: '', bpm: '', durationMinutes: '' });
  const [submittingManual, setSubmittingManual] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (exerciseId) {
      fetchData();
    }
  }, [exerciseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();

      if (exerciseError) throw exerciseError;
      if (exerciseData) {
        const formattedExercise = formatExercise(exerciseData as any);
        setExerciseName(formattedExercise?.title || exerciseData.title);
        setTargetBpm(exerciseData.bpm_goal);
        setHasBpm(exerciseData.has_bpm !== false);
      }

      const { data: logsData, error: logsError } = await supabase
        .from('practice_logs')
        .select('id, created_at, bpm_used, duration_seconds')
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;
      setLogs(logsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('errors.deleteConfirm'))) return;
    try {
      const { error: deleteError } = await supabase
        .from('practice_logs')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setLogs(logs.filter(log => log.id !== id));
    } catch (err) {
      alert(`${t('errors.deleteFailed')} ` + (err instanceof Error ? err.message : String(err)));
    }
  };

  const startEditing = (log: PracticeLog) => {
    setEditingId(log.id);
    const dateObj = new Date(log.created_at);
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 16);
    
    setEditForm({
      date: localISOTime,
      bpm: log.bpm_used || 0,
      durationMinutes: Math.floor((log.duration_seconds || 0) / 60)
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleSave = async (id: string) => {
    try {
      const dateObj = new Date(editForm.date);
      if (isNaN(dateObj.getTime())) throw new Error(t('errors.invalidDate'));
      
      const bpm = hasBpm ? parseInt(String(editForm.bpm), 10) : 0;
      if (hasBpm && (isNaN(bpm) || bpm <= 0)) throw new Error(t('errors.invalidBpm'));

      const minutes = parseInt(String(editForm.durationMinutes), 10);
      const durationSeconds = isNaN(minutes) ? 0 : minutes * 60;

      const { error: updateError } = await supabase
        .from('practice_logs')
        .update({
          created_at: dateObj.toISOString(),
          bpm_used: bpm,
          duration_seconds: durationSeconds
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setLogs(logs.map(log => 
        log.id === id 
          ? { ...log, created_at: dateObj.toISOString(), bpm_used: bpm, duration_seconds: durationSeconds } 
          : log
      ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setEditingId(null);
    } catch (err) {
      alert(`${t('errors.saveFailed')} ` + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleOpenManualEntry = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);
    setManualEntryForm({ date: localISOTime, bpm: '', durationMinutes: '' });
    setShowManualEntry(true);
  };

  const handleManualSubmit = async () => {
    try {
      setSubmittingManual(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('errors.auth'));

      const dateObj = new Date(manualEntryForm.date);
      if (isNaN(dateObj.getTime())) throw new Error(t('errors.invalidDate'));

      const bpm = hasBpm ? parseInt(manualEntryForm.bpm, 10) : 0;
      if (hasBpm && (isNaN(bpm) || bpm <= 0)) throw new Error(t('errors.invalidBpm'));

      const minutes = parseInt(manualEntryForm.durationMinutes, 10);
      const durationSeconds = isNaN(minutes) ? 0 : minutes * 60;

      const { error: insertError } = await supabase
        .from('practice_logs')
        .insert({
          user_id: user.id,
          exercise_id: exerciseId,
          bpm_used: bpm,
          duration_seconds: durationSeconds,
          created_at: dateObj.toISOString()
        });

      if (insertError) throw insertError;

      setShowManualEntry(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleImportHistory = async () => {
    if (!historyText.trim()) return setError(t('errors.emptyImport'));
    
    try {
      setImportingHistory(true);
      setError(null);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error(t('errors.auth'));

      const lines = historyText.split('\n').filter(l => l.trim() !== '');
      const logsToInsert = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split('--').map(p => p.trim());
        
        if (parts.length < 2 || parts.length > 3) {
          throw new Error(t('errors.invalidLine', { line: i + 1 }));
        }

        const dateStr = parts[0];
        const bpmStr = parts[1];
        const durationStr = parts[2];

        let dateObj = new Date(dateStr);
        if (dateStr.length === 10) {
           dateObj = new Date(`${dateStr}T12:00:00`);
        }

        if (isNaN(dateObj.getTime())) throw new Error(t('errors.invalidLineDate', { line: i + 1, date: dateStr }));

        const bpm = parseInt(bpmStr, 10);
        if (hasBpm && isNaN(bpm)) throw new Error(t('errors.invalidLineBpm', { line: i + 1, bpm: bpmStr }));

        let durationSeconds = 0;
        if (durationStr) {
          const minutes = parseInt(durationStr, 10);
          if (isNaN(minutes)) throw new Error(t('errors.invalidLineDuration', { line: i + 1, duration: durationStr }));
          durationSeconds = minutes * 60;
        }

        logsToInsert.push({
          user_id: user.id,
          exercise_id: exerciseId,
          bpm_used: hasBpm ? bpm : 0,
          duration_seconds: durationSeconds,
          created_at: dateObj.toISOString(),
        });
      }

      const { error: insertError } = await supabase.from('practice_logs').insert(logsToInsert);
      if (insertError) throw insertError;

      setHistoryText('');
      setShowHistoryImport(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setImportingHistory(false);
    }
  };

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const renderSortableHeader = (label: string, key: SortKey) => (
    <SortableHeader label={label} sortKey={key} sortConfig={sortConfig} onSort={handleSort} />
  );

  const getTableData = () => {
    return logs.map(log => {
      const dateObj = new Date(log.created_at);
      return {
        ...log,
        timestamp: dateObj.getTime(),
        dateTimeStr: `${dateObj.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${dateObj.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`,
        minutos: Math.floor((log.duration_seconds || 0) / 60)
      };
    });
  };

  const sortedTableData = [...getTableData()].sort((a, b) => {
    let valA, valB;
    switch(sortConfig.key) {
      case 'date': valA = a.timestamp; valB = b.timestamp; break;
      case 'bpm': valA = a.bpm_used; valB = b.bpm_used; break;
      case 'duration': valA = a.duration_seconds; valB = b.duration_seconds; break;
      default: valA = a.timestamp; valB = b.timestamp;
    }
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedTableData.length / itemsPerPage);
  const paginatedData = sortedTableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const maxBpm = logs.length > 0 ? Math.max(...logs.map(l => l.bpm_used)) : 0;
  const totalSessions = logs.length;
  const totalSeconds = logs.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
  const progressPercentage = targetBpm ? Math.min(Math.round((maxBpm / targetBpm) * 100), 100) : 0;

  const formatKpi = (totalSecs: number) => formatKpiTime(totalSecs, t('table.min'));

  const chartLogs = [...logs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  let lastYear: number | null = null;
  
  const chartData = chartLogs.map(log => {
    const d = new Date(log.created_at);
    const year = d.getFullYear();
    const monthDay = d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' });
    const timeStr = d.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    
    let xAxisLabel = monthDay;
    if (lastYear !== year) {
      xAxisLabel = `${monthDay} '${year.toString().slice(-2)}`;
      lastYear = year;
    }

    return {
      uniqueKey: log.id,
      exactTime: `${monthDay} ${year}, ${timeStr}`,
      xAxisLabel: xAxisLabel,
      BPM: log.bpm_used,
      Objetivo: targetBpm,
      Minutos: Math.floor((log.duration_seconds || 0) / 60)
    };
  });

  if (loading) {
    return (
      <div className="loader-container">
        <span className="loader" />
      </div>
    );
  }

  return (
    <div className={styles.back}>
      <button
        onClick={() => router.back()}
        className={ui.backLink}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        {t('back')}
      </button>

      <div className={styles.performanceInRow}>
        <div>
          <h1 className={styles.performanceInTitle}>
            {t('performanceIn')} <span className={styles.label}>{exerciseName}</span>
          </h1>
          <p className={styles.practiceLogsText}>
            {totalSessions} {t('practiceLogs')}
          </p>
        </div>

        <div className={styles.addLogRow}>
          <button
            onClick={handleOpenManualEntry}
            className={styles.addLogButton}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {t('buttons.addLog')}
          </button>

          {!showHistoryImport && (
            <button
              onClick={() => { setShowHistoryImport(true); setError(null); }}
              className={styles.importHistoryButton}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {t('buttons.importHistory')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className={`alert-error ${styles.block}`}>
          ⚠ {error}
        </div>
      )}

      {showHistoryImport && (
        <div className={styles.formatRequiredStack}>
          <div className={styles.formatRequiredBox}>
            <p className={styles.formatRequiredText}>{t('import.formatRequired')}</p>
            <code className={styles.formatExampleCode}>{t('import.formatExample')}</code>
            <p className={styles.exampleText}>{t('import.example')}<br/>2024-03-01 -- 120<br/>2024-03-02 -- 125 -- 15</p>
          </div>

          <textarea
            value={historyText}
            onChange={e => setHistoryText(e.target.value)}
            placeholder={t('import.placeholder')}
            rows={8}
            className={styles.placeholderTextarea}
          />

          <div className={styles.cancelRow}>
            <button
              onClick={() => { setShowHistoryImport(false); setError(null); }}
              className={styles.cancelButton}
            >
              {t('import.cancel')}
            </button>
            <button
              onClick={handleImportHistory}
              disabled={importingHistory}
              className={styles.savingButton} style={{ cursor: importingHistory ? 'not-allowed' : 'pointer', opacity: importingHistory ? 0.7 : 1 }}
            >
              {importingHistory ? t('import.saving') : t('import.save')}
            </button>
          </div>
        </div>
      )}

      <div className={styles.statsRow}>
        <button
          onClick={() => setActiveTab('stats')}
          className={styles.statsButton} style={{ background: activeTab === 'stats' ? 'var(--gold)' : 'transparent', color: activeTab === 'stats' ? '#111' : 'var(--muted)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          {t('buttons.stats')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={styles.detailedHistoryButton} style={{ background: activeTab === 'history' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'history' ? 'var(--text)' : 'var(--muted)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          {t('buttons.detailedHistory')}
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <div className={styles.backBlock}>📈</div>
          <p className={styles.titleText}>{t('noData.title')}</p>
          <p className={styles.descriptionText}>{t('noData.description')}</p>
        </div>
      ) : activeTab === 'stats' ? (
        <div className={styles.goalProgressStack}>
          
          <div className={styles.goalProgressGrid}>

            {hasBpm && (
              <div className={styles.goalProgressBox}>
                <div className={styles.goalProgressRow}>
                  <span className={styles.goalProgressLabel}>
                    {t('stats.goalProgress')}
                  </span>
                  <span className={styles.bpmFormatLabel}>
                    {t('stats.bpmFormat', { current: maxBpm, target: targetBpm || '--' })}
                  </span>
                </div>
                
                <div className={styles.row}>
                  <p className={styles.text}>
                    {progressPercentage}%
                  </p>
                </div>

                <div className={styles.box}>
                  <div className={styles.goalProgressBoxInner} style={{ width: `${progressPercentage}%` }} />
                </div>
              </div>
            )}

            <div className={styles.logsBox}>
              <span className={styles.goalProgressLabel}>{t('stats.logs')}</span>
              <p className={styles.totalSessionsText}>{totalSessions}</p>
            </div>
            <div className={styles.logsBox}>
              <span className={styles.goalProgressLabel}>{t('stats.totalTime')}</span>
              <p className={styles.totalSessionsText}>{formatKpi(totalSeconds)}</p>
            </div>
          </div>

          <div className={styles.targetBpmBox}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="uniqueKey" 
                  tickFormatter={(value) => {
                    const item = chartData.find(d => d.uniqueKey === value);
                    return item ? item.xAxisLabel : '';
                  }}
                  stroke="var(--muted)" 
                  fontSize={12} 
                  tickMargin={15} 
                  axisLine={true} 
                  tickLine={true} 
                  tick={{ fill: 'var(--muted)' }}
                />
                <YAxis 
                  stroke="var(--muted)" 
                  fontSize={12} 
                  tickMargin={10} 
                  axisLine={false} 
                  tickLine={false} 
                  domain={[0, 'dataMax + 10']}
                />
                <Tooltip 
                  labelFormatter={(value) => {
                    const item = chartData.find(d => d.uniqueKey === value);
                    return item ? item.exactTime : value;
                  }}
                  contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text)' }}
                />
                <Legend verticalAlign="top" height={36} iconType="plainline" />
                
                {hasBpm ? (
                  <>
                    {targetBpm && (
                      <Line 
                        type="stepAfter" 
                        name={t('chart.targetBpm')}
                        dataKey="Objetivo" 
                        stroke="#a78bfa" 
                        strokeWidth={2} 
                        strokeDasharray="5 5" 
                        dot={false} 
                        activeDot={false}
                      />
                    )}
                    <Line 
                      type="monotone" 
                      name={t('chart.achievedBpm')}
                      dataKey="BPM" 
                      stroke="var(--gold)" 
                      strokeWidth={3} 
                      dot={{ fill: 'var(--surface)', stroke: 'var(--gold)', strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 6, fill: 'var(--gold)' }} 
                    />
                  </>
                ) : (
                  <Line 
                    type="monotone" 
                    name={`${t('table.time')} (min)`}
                    dataKey="Minutos" 
                    stroke="var(--gold)" 
                    strokeWidth={3} 
                    dot={{ fill: 'var(--surface)', stroke: 'var(--gold)', strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 6, fill: 'var(--gold)' }} 
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className={styles.dateTimeBox}>
          <table className={styles.dateTimeTable}>
            <thead>
              <tr className={styles.dateTimeTr}>
                {renderSortableHeader(t('table.dateTime'), 'date')}
                {hasBpm && renderSortableHeader(t('table.bpm'), 'bpm')}
                {renderSortableHeader(t('table.time'), 'duration')}
                <th className={styles.actionsTh}>{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((log) => (
                <tr key={log.id} className={styles.minTr}>
                  {editingId === log.id ? (
                    <>
                      <td className={styles.td}>
                        <input 
                          type="datetime-local" 
                          value={editForm.date} 
                          onChange={e => setEditForm({...editForm, date: e.target.value})}
                          className={styles.input}
                        />
                      </td>
                      {hasBpm && (
                        <td className={styles.td}>
                          <input 
                            type="number" 
                            value={editForm.bpm} 
                            onChange={e => setEditForm({...editForm, bpm: e.target.value})}
                            className={styles.minTrInput}
                          />
                        </td>
                      )}
                      <td className={styles.td}>
                        <div className={styles.minRow}>
                          <input 
                            type="number" 
                            value={editForm.durationMinutes} 
                            onChange={e => setEditForm({...editForm, durationMinutes: e.target.value})}
                            className={styles.minRowInput}
                          />
                          <span className={styles.minLabel}>{t('table.min')}</span>
                        </div>
                      </td>
                      <td className={styles.minTrTd}>
                        <div className={styles.minTrRow}>
                          <button onClick={cancelEditing} className={styles.button} title="Cancelar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                          <button onClick={() => handleSave(log.id)} className={styles.minTrButton} title="Guardar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className={styles.dateTimeStrTd}>{log.dateTimeStr}</td>
                      {hasBpm && <td className={styles.bpmUsedTd}>{log.bpm_used}</td>}
                      <td className={styles.minTd}>{log.minutos} {t('table.min')}</td>
                      <td className={styles.td5}>
                        <div className={styles.minTrRow}>
                          <button onClick={() => startEditing(log)} className={styles.minTrRowButton} title="Editar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={() => handleDelete(log.id)} className={styles.button4} title="Eliminar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
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

      {showManualEntry && (
        <div className={ui.overlayBlur}>
          <div className={styles.titleBox}>
            <h2 className={styles.titleHeading}>{t('manualEntry.title')}</h2>
            <p className={styles.subtitleText}>{t('manualEntry.subtitle')}</p>
            
            <div className={styles.dateTimeStack}>
              <div>
                <label className={styles.dateTimeFieldLabel}>{t('manualEntry.dateTime')}</label>
                <input 
                  type="datetime-local" 
                  value={manualEntryForm.date}
                  onChange={e => setManualEntryForm({...manualEntryForm, date: e.target.value})}
                  className={styles.dateTimeStackInput}
                />
              </div>
              
              <div className={styles.maxBpmGrid} style={{ gridTemplateColumns: hasBpm ? '1fr 1fr' : '1fr' }}>
                {hasBpm && (
                  <div>
                    <label className={styles.dateTimeFieldLabel}>{t('manualEntry.maxBpm')}</label>
                    <input 
                      type="number" 
                      placeholder="Ej. 120"
                      value={manualEntryForm.bpm}
                      onChange={e => setManualEntryForm({...manualEntryForm, bpm: e.target.value})}
                      className={styles.maxBpmGridInput}
                    />
                  </div>
                )}
                <div>
                  <label className={styles.dateTimeFieldLabel}>{t('manualEntry.minutes')}</label>
                  <input 
                    type="number" 
                    placeholder="Ej. 15"
                    value={manualEntryForm.durationMinutes}
                    onChange={e => setManualEntryForm({...manualEntryForm, durationMinutes: e.target.value})}
                    className={styles.dateTimeStackInput}
                  />
                </div>
              </div>
            </div>

            <div className={styles.cancelRow2}>
              <button 
                onClick={() => setShowManualEntry(false)}
                disabled={submittingManual}
                className={styles.cancelButton2}
              >
                {t('manualEntry.cancel')}
              </button>
              <button 
                onClick={handleManualSubmit}
                disabled={submittingManual || !manualEntryForm.date || (hasBpm && !manualEntryForm.bpm)}
                className={styles.savingButton2} style={{ cursor: (submittingManual || !manualEntryForm.date || (hasBpm && !manualEntryForm.bpm)) ? 'not-allowed' : 'pointer', opacity: (submittingManual || !manualEntryForm.date || (hasBpm && !manualEntryForm.bpm)) ? 0.5 : 1 }}
              >
                {submittingManual ? t('manualEntry.saving') : t('manualEntry.save')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}