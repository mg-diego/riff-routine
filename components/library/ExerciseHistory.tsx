"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslations } from 'next-intl';

interface PracticeLog {
  id: string;
  created_at: string;
  bpm_used: number;
  duration_seconds: number;
}

interface ExerciseHistoryProps {
  exerciseId: string;
  onClose: () => void;
}

export function ExerciseHistory({ exerciseId, onClose }: ExerciseHistoryProps) {
  const t = useTranslations('ExerciseHistory');
  const [logs, setLogs] = useState<PracticeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ date: string; bpm: number | string; durationMinutes: number | string }>({
    date: '',
    bpm: '',
    durationMinutes: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [exerciseId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error: dbError } = await supabase
        .from('practice_logs')
        .select('id, created_at, bpm_used, duration_seconds')
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      setLogs(data || []);
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
      alert(`${t('errors.deleteError')} ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const startEditing = (log: PracticeLog) => {
    setEditingId(log.id);
    setEditForm({
      date: new Date(log.created_at).toISOString().split('T')[0],
      bpm: log.bpm_used,
      durationMinutes: Math.floor(log.duration_seconds / 60)
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleSave = async (id: string) => {
    try {
      const dateObj = new Date(editForm.date);
      if (isNaN(dateObj.getTime())) throw new Error(t('errors.invalidDate'));
      
      const bpm = parseInt(String(editForm.bpm), 10);
      if (isNaN(bpm) || bpm <= 0) throw new Error(t('errors.invalidBpm'));

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
      ));
      setEditingId(null);
    } catch (err) {
      alert(`${t('errors.saveError')} ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: '12px', color: 'var(--text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--gold)' }}>{t('title')}</h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
      </div>

      {error && <div style={{ color: '#e74c3c', marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>{t('loading')}</p>
      ) : logs.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>{t('emptyState')}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.8rem', fontWeight: 600 }}>{t('table.date')}</th>
                <th style={{ padding: '0.8rem', fontWeight: 600 }}>{t('table.bpm')}</th>
                <th style={{ padding: '0.8rem', fontWeight: 600 }}>{t('table.minutes')}</th>
                <th style={{ padding: '0.8rem', fontWeight: 600, textAlign: 'right' }}>{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {editingId === log.id ? (
                    <>
                      <td style={{ padding: '0.5rem' }}>
                        <input 
                          type="date" 
                          value={editForm.date} 
                          onChange={e => setEditForm({...editForm, date: e.target.value})}
                          style={{ background: 'var(--surface2)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem', borderRadius: '4px', width: '100%' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input 
                          type="number" 
                          value={editForm.bpm} 
                          onChange={e => setEditForm({...editForm, bpm: e.target.value})}
                          style={{ background: 'var(--surface2)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem', borderRadius: '4px', width: '70px' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input 
                          type="number" 
                          value={editForm.durationMinutes} 
                          onChange={e => setEditForm({...editForm, durationMinutes: e.target.value})}
                          style={{ background: 'var(--surface2)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem', borderRadius: '4px', width: '70px' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleSave(log.id)} title={t('actions.save')} style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </button>
                          <button onClick={cancelEditing} title={t('actions.cancel')} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '0.8rem' }}>{new Date(log.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>{log.bpm_used}</td>
                      <td style={{ padding: '0.8rem' }}>{Math.floor(log.duration_seconds / 60)}{t('table.minSuffix')}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => startEditing(log)} style={{ background: 'transparent', color: 'var(--muted)', border: 'none', cursor: 'pointer', padding: '0.4rem' }} title={t('actions.edit')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={() => handleDelete(log.id)} style={{ background: 'transparent', color: '#e74c3c', border: 'none', cursor: 'pointer', padding: '0.4rem' }} title={t('actions.delete')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}