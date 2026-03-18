"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../../../lib/supabase';
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
import { useTranslatedExercise } from '@/hooks/useTranslatedExercise';

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
        let formattedExercise = formatExercise(exerciseData as any);
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
    <th 
      onClick={() => handleSort(key)} 
      style={{ padding: '1.2rem 1.5rem', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {label}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: sortConfig.key === key && sortConfig.direction === 'asc' ? 1 : 0.2, marginBottom: '-4px' }}><polyline points="18 15 12 9 6 15"/></svg>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: sortConfig.key === key && sortConfig.direction === 'desc' ? 1 : 0.2 }}><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
    </th>
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

  const formatKpiTime = (totalSecs: number) => {
    if (!totalSecs) return `0 ${t('table.min')}`;
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} ${t('table.min')}`;
  };

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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <span className="loader" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      <button
        onClick={() => router.back()}
        style={{
          background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem',
          padding: 0, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        {t('back')}
      </button>

      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--text)', margin: '0 0 0.5rem 0', lineHeight: 1 }}>
            {t('performanceIn')} <span style={{ color: 'var(--gold)' }}>{exerciseName}</span>
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.95rem' }}>
            {totalSessions} {t('practiceLogs')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleOpenManualEntry}
            style={{
              background: 'var(--gold)',
              border: 'none',
              color: '#111',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--gold)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {t('buttons.addLog')}
          </button>

          {!showHistoryImport && (
            <button
              onClick={() => { setShowHistoryImport(true); setError(null); }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text)',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
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
        <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          ⚠ {error}
        </div>
      )}

      {showHistoryImport && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s ease', marginBottom: '2rem', background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ margin: '0 0 0.5rem', color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem' }}>{t('import.formatRequired')}</p>
            <code style={{ color: 'var(--text)', background: '#111', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem' }}>{t('import.formatExample')}</code>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>{t('import.example')}<br/>2024-03-01 -- 120<br/>2024-03-02 -- 125 -- 15</p>
          </div>

          <textarea
            value={historyText}
            onChange={e => setHistoryText(e.target.value)}
            placeholder={t('import.placeholder')}
            rows={8}
            style={{
              width: '100%', padding: '1rem', borderRadius: '8px', background: 'var(--surface2)',
              border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', fontFamily: 'monospace',
              fontSize: '0.9rem', resize: 'vertical', outline: 'none'
            }}
          />

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={() => { setShowHistoryImport(false); setError(null); }}
              style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              {t('import.cancel')}
            </button>
            <button
              onClick={handleImportHistory}
              disabled={importingHistory}
              style={{ flex: 1, padding: '0.8rem', background: 'var(--gold)', border: 'none', color: '#111', borderRadius: '8px', cursor: importingHistory ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: importingHistory ? 0.7 : 1 }}
            >
              {importingHistory ? t('import.saving') : t('import.save')}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
        <button
          onClick={() => setActiveTab('stats')}
          style={{
            background: activeTab === 'stats' ? 'var(--gold)' : 'transparent',
            color: activeTab === 'stats' ? '#111' : 'var(--muted)',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          {t('buttons.stats')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            background: activeTab === 'history' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'history' ? 'var(--text)' : 'var(--muted)',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          {t('buttons.detailedHistory')}
        </button>
      </div>

      {logs.length === 0 ? (
        <div style={{ background: 'var(--surface)', padding: '4rem 2rem', borderRadius: '12px', border: '1px dashed rgba(220,185,138,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
          <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: 600 }}>{t('noData.title')}</p>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>{t('noData.description')}</p>
        </div>
      ) : activeTab === 'stats' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.3s ease' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>

            {hasBpm && (
              <div style={{ 
                background: 'var(--surface)', 
                padding: '1.5rem', 
                borderRadius: '10px', 
                border: '1px solid rgba(255,255,255,0.03)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {t('stats.goalProgress')}
                  </span>
                  <span style={{ color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 700 }}>
                    {t('stats.bpmFormat', { current: maxBpm, target: targetBpm || '--' })}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
                  <p style={{ color: 'var(--text)', fontSize: '2.5rem', margin: 0, fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>
                    {progressPercentage}%
                  </p>
                </div>

                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${progressPercentage}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))',
                    borderRadius: '10px',
                    transition: 'width 1s ease-out'
                  }} />
                </div>
              </div>
            )}

            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{t('stats.logs')}</span>
              <p style={{ color: 'var(--text)', fontSize: '2.5rem', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>{totalSessions}</p>
            </div>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{t('stats.totalTime')}</span>
              <p style={{ color: 'var(--text)', fontSize: '2.5rem', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>{formatKpiTime(totalSeconds)}</p>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', padding: '2rem 2rem 3rem 2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', width: '100%', minHeight: '350px', height: '50vh', maxHeight: '500px' }}>
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
        <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {renderSortableHeader(t('table.dateTime'), 'date')}
                {hasBpm && renderSortableHeader(t('table.bpm'), 'bpm')}
                {renderSortableHeader(t('table.time'), 'duration')}
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: 700, textAlign: 'right' }}>{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {editingId === log.id ? (
                    <>
                      <td style={{ padding: '0.8rem 1.5rem' }}>
                        <input 
                          type="datetime-local" 
                          value={editForm.date} 
                          onChange={e => setEditForm({...editForm, date: e.target.value})}
                          style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '6px', width: '100%', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                        />
                      </td>
                      {hasBpm && (
                        <td style={{ padding: '0.8rem 1.5rem' }}>
                          <input 
                            type="number" 
                            value={editForm.bpm} 
                            onChange={e => setEditForm({...editForm, bpm: e.target.value})}
                            style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '6px', width: '80px', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                          />
                        </td>
                      )}
                      <td style={{ padding: '0.8rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <input 
                            type="number" 
                            value={editForm.durationMinutes} 
                            onChange={e => setEditForm({...editForm, durationMinutes: e.target.value})}
                            style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '6px', width: '70px', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                          />
                          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t('table.min')}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.8rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={cancelEditing} style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; }} title="Cancelar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                          <button onClick={() => handleSave(log.id)} style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.2)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.1)'; }} title="Guardar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text)', fontWeight: 500 }}>{log.dateTimeStr}</td>
                      {hasBpm && <td style={{ padding: '1rem 1.5rem', color: 'var(--gold)', fontWeight: 700, fontSize: '1.1rem' }}>{log.bpm_used}</td>}
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--muted)' }}>{log.minutos} {t('table.min')}</td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => startEditing(log)} style={{ background: 'transparent', color: 'var(--muted)', border: 'none', cursor: 'pointer', padding: '0.4rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'} title="Editar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={() => handleDelete(log.id)} style={{ background: 'transparent', color: 'var(--muted)', border: 'none', cursor: 'pointer', padding: '0.4rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e74c3c'} onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'} title="Eliminar">
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
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{t('table.page')} {currentPage} {t('table.of')} {totalPages}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1} 
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : 'var(--text)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif' }}
                >
                  {t('table.prev')}
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages} 
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : 'var(--text)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif' }}
                >
                  {t('table.next')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showManualEntry && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#141414', border: '1px solid rgba(220,185,138,0.2)', borderRadius: '12px', padding: '2.5rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', fontFamily: 'DM Sans, sans-serif' }}>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: 'var(--gold)', margin: '0 0 0.5rem 0', lineHeight: 1 }}>{t('manualEntry.title')}</h2>
            <p style={{ color: 'var(--muted)', margin: '0 0 2rem 0', fontSize: '0.95rem' }}>{t('manualEntry.subtitle')}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 700 }}>{t('manualEntry.dateTime')}</label>
                <input 
                  type="datetime-local" 
                  value={manualEntryForm.date}
                  onChange={e => setManualEntryForm({...manualEntryForm, date: e.target.value})}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.8rem', borderRadius: '8px', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: hasBpm ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                {hasBpm && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 700 }}>{t('manualEntry.maxBpm')}</label>
                    <input 
                      type="number" 
                      placeholder="Ej. 120"
                      value={manualEntryForm.bpm}
                      onChange={e => setManualEntryForm({...manualEntryForm, bpm: e.target.value})}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--gold)', padding: '0.8rem', borderRadius: '8px', outline: 'none', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}
                    />
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 700 }}>{t('manualEntry.minutes')}</label>
                  <input 
                    type="number" 
                    placeholder="Ej. 15"
                    value={manualEntryForm.durationMinutes}
                    onChange={e => setManualEntryForm({...manualEntryForm, durationMinutes: e.target.value})}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.8rem', borderRadius: '8px', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
              <button 
                onClick={() => setShowManualEntry(false)}
                disabled={submittingManual}
                style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {t('manualEntry.cancel')}
              </button>
              <button 
                onClick={handleManualSubmit}
                disabled={submittingManual || !manualEntryForm.date || (hasBpm && !manualEntryForm.bpm)}
                style={{ flex: 1, background: 'var(--gold)', border: 'none', color: '#111', padding: '0.8rem', borderRadius: '8px', cursor: (submittingManual || !manualEntryForm.date || (hasBpm && !manualEntryForm.bpm)) ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: (submittingManual || !manualEntryForm.date || (hasBpm && !manualEntryForm.bpm)) ? 0.5 : 1, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dark)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}
              >
                {submittingManual ? t('manualEntry.saving') : t('manualEntry.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}