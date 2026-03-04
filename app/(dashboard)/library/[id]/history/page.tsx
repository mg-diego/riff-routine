"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../../lib/supabase'; 

interface PracticeLog {
  id: string;
  created_at: string;
  bpm_used: number;
  duration_seconds: number;
}

export default function ExerciseHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = params.id as string;

  const [exerciseName, setExerciseName] = useState<string>('');
  const [logs, setLogs] = useState<PracticeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ date: string; bpm: number | string; durationMinutes: number | string }>({
    date: '',
    bpm: '',
    durationMinutes: ''
  });

  const [showHistoryImport, setShowHistoryImport] = useState(false);
  const [historyText, setHistoryText] = useState('');
  const [importingHistory, setImportingHistory] = useState(false);

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
        .select('title')
        .eq('id', exerciseId)
        .single();

      if (exerciseError) throw exerciseError;
      if (exerciseData) setExerciseName(exerciseData.title);

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
    if (!window.confirm('¿Seguro que quieres eliminar este registro?')) return;
    try {
      const { error: deleteError } = await supabase
        .from('practice_logs')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setLogs(logs.filter(log => log.id !== id));
    } catch (err) {
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : String(err)));
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
      if (isNaN(dateObj.getTime())) throw new Error('Fecha inválida');
      
      const bpm = parseInt(String(editForm.bpm), 10);
      if (isNaN(bpm) || bpm <= 0) throw new Error('BPM inválido');

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
      alert('Error al guardar: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleImportHistory = async () => {
    if (!historyText.trim()) return setError('Pega al menos un registro.');
    
    try {
      setImportingHistory(true);
      setError(null);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Debes iniciar sesión.');

      const lines = historyText.split('\n').filter(l => l.trim() !== '');
      const logsToInsert = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split('--').map(p => p.trim());
        
        if (parts.length < 2 || parts.length > 3) {
          throw new Error(`Línea ${i + 1} inválida. Formato: YYYY-MM-DD -- BPM -- Minutos (opcional)`);
        }

        const dateStr = parts[0];
        const bpmStr = parts[1];
        const durationStr = parts[2];

        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) throw new Error(`Línea ${i + 1}: Fecha inválida (${dateStr}). Usa YYYY-MM-DD`);

        const bpm = parseInt(bpmStr, 10);
        if (isNaN(bpm)) throw new Error(`Línea ${i + 1}: BPM inválido (${bpmStr})`);

        let durationSeconds = 0;
        if (durationStr) {
          const minutes = parseInt(durationStr, 10);
          if (isNaN(minutes)) throw new Error(`Línea ${i + 1}: Duración inválida (${durationStr})`);
          durationSeconds = minutes * 60;
        }

        logsToInsert.push({
          user_id: user.id,
          exercise_id: exerciseId,
          bpm_used: bpm,
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <span className="loader" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
      <button
        onClick={() => router.push('/library')}
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
        Volver a la biblioteca
      </button>

      <div style={{ padding: '2rem', background: 'var(--surface)', borderRadius: '12px', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.05)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem', fontSize: '2.5rem', fontFamily: 'Bebas Neue, sans-serif', color: 'var(--gold)', lineHeight: 1 }}>
              Historial de Práctica
            </h1>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1rem' }}>
              {exerciseName ? `Ejercicio: ${exerciseName}` : 'Cargando...'}
            </p>
          </div>

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
              Importar histórico
            </button>
          )}
        </div>

        {error && (
          <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
            ⚠ {error}
          </div>
        )}

        {showHistoryImport ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ margin: '0 0 0.5rem', color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem' }}>Formato requerido:</p>
              <code style={{ color: 'var(--text)', background: '#111', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem' }}>YYYY-MM-DD -- BPM -- Minutos (opcional)</code>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>Ejemplo:<br/>2024-03-01 -- 120<br/>2024-03-02 -- 125 -- 15</p>
            </div>

            <textarea
              value={historyText}
              onChange={e => setHistoryText(e.target.value)}
              placeholder={`2024-03-01 -- 120\n2024-03-02 -- 125 -- 15\n2024-03-03 -- 130 -- 20`}
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
                Cancelar
              </button>
              <button
                onClick={handleImportHistory}
                disabled={importingHistory}
                style={{ flex: 1, padding: '0.8rem', background: 'var(--gold)', border: 'none', color: '#111', borderRadius: '8px', cursor: importingHistory ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: importingHistory ? 0.7 : 1 }}
              >
                {importingHistory ? 'Importando...' : 'Guardar Historial'}
              </button>
            </div>
          </div>
        ) : (
          logs.length === 0 ? (
            <div style={{ background: 'var(--surface2)', padding: '3rem 2rem', borderRadius: '12px', border: '1px dashed rgba(220,185,138,0.3)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: 600 }}>Aún no hay registros</p>
              <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>Practica este ejercicio para ver tu progreso aquí.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '1rem 0.8rem', fontWeight: 600 }}>Fecha</th>
                    <th style={{ padding: '1rem 0.8rem', fontWeight: 600 }}>BPM</th>
                    <th style={{ padding: '1rem 0.8rem', fontWeight: 600 }}>Tiempo</th>
                    <th style={{ padding: '1rem 0.8rem', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {editingId === log.id ? (
                        <>
                          <td style={{ padding: '0.8rem' }}>
                            <input 
                              type="date" 
                              value={editForm.date} 
                              onChange={e => setEditForm({...editForm, date: e.target.value})}
                              style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '6px', width: '100%', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                            />
                          </td>
                          <td style={{ padding: '0.8rem' }}>
                            <input 
                              type="number" 
                              value={editForm.bpm} 
                              onChange={e => setEditForm({...editForm, bpm: e.target.value})}
                              style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '6px', width: '80px', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                            />
                          </td>
                          <td style={{ padding: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <input 
                                type="number" 
                                value={editForm.durationMinutes} 
                                onChange={e => setEditForm({...editForm, durationMinutes: e.target.value})}
                                style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '6px', width: '70px', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                              />
                              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>min</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.8rem', textAlign: 'right' }}>
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
                          <td style={{ padding: '1rem 0.8rem', color: 'var(--text)' }}>{new Date(log.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '1rem 0.8rem', color: 'var(--gold)', fontWeight: 700, fontSize: '1.1rem' }}>{log.bpm_used}</td>
                          <td style={{ padding: '1rem 0.8rem', color: 'var(--muted)' }}>{Math.floor(log.duration_seconds / 60)} min</td>
                          <td style={{ padding: '1rem 0.8rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button onClick={() => startEditing(log)} style={{ background: 'transparent', color: 'var(--muted)', border: 'none', cursor: 'pointer', padding: '0.4rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'} title="Editar">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <button onClick={() => handleDelete(log.id)} style={{ background: 'transparent', color: 'var(--muted)', border: 'none', cursor: 'pointer', padding: '0.4rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#e74c3c'} onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'} title="Eliminar">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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
          )
        )}
      </div>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}