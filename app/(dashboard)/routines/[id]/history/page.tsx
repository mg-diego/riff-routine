"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../../lib/supabase';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts';

interface RoutineHistoryProps {
  params: Promise<{ id: string }>;
}

type SortKey = 'date' | 'duration' | 'exercises';

export default function RoutineHistoryPage({ params }: RoutineHistoryProps) {
  const router = useRouter();
  const { id } = use(params);
  
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
  const [editForm, setEditForm] = useState({ bpm: '', durationMinutes: '' });

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchHistoryData();
  }, [id]);

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data: routineData, error: routineError } = await supabase
        .from('routines')
        .select('title')
        .eq('id', id)
        .single();

      if (routineError) throw routineError;
      setRoutineName(routineData.title);

      const { data: exercisesData, error: exercisesError } = await supabase
        .from('routine_exercises')
        .select(`
          exercise_id,
          target_bpm,
          target_duration_seconds,
          order_index,
          exercises (title)
        `)
        .eq('routine_id', id)
        .order('order_index', { ascending: true });

      if (exercisesError) throw exercisesError;
      setExercises(exercisesData || []);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('practice_sessions')
        .select('id, started_at, total_duration_seconds')
        .eq('routine_id', id)
        .not('total_duration_seconds', 'is', null)
        .order('started_at', { ascending: true });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      const chartFormattedData = (sessionsData || []).map((session, index) => {
        const dateObj = new Date(session.started_at);
        return {
          name: `Sesión ${index + 1}`,
          shortDate: dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
          time: dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          minutos: Math.round((session.total_duration_seconds || 0) / 60),
          id: session.id
        };
      });
      setChartData(chartFormattedData);

      const exerciseIds = exercisesData?.map(ex => ex.exercise_id) || [];

      if (exerciseIds.length > 0) {
        const { data: logsData, error: logsError } = await supabase
          .from('practice_logs')
          .select('id, session_id, exercise_id, bpm_used, duration_seconds, created_at')
          .in('exercise_id', exerciseIds)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (logsError) throw logsError;

        const matrix: Record<string, Record<string, any>> = {};
        
        exercisesData?.forEach(ex => {
          matrix[ex.exercise_id] = {};
        });

        const logsByEx: Record<string, any[]> = {};
        const sLogs: Record<string, any[]> = {};

        logsData?.forEach(log => {
          if (!logsByEx[log.exercise_id]) logsByEx[log.exercise_id] = [];
          logsByEx[log.exercise_id].push(log);

          if (!sLogs[log.session_id]) sLogs[log.session_id] = [];
          
          const exMatch = exercisesData?.find(e => e.exercise_id === log.exercise_id);
          const exerciseData = exMatch?.exercises as any;
          const exTitle = Array.isArray(exerciseData) ? exerciseData[0]?.title : exerciseData?.title;

          sLogs[log.session_id].push({
            ...log,
            title: exTitle || 'Ejercicio Desconocido'
          });
        });

        setSessionLogs(sLogs);

        Object.keys(logsByEx).forEach(exId => {
          const exLogs = logsByEx[exId];
          exLogs.forEach((log, index) => {
            if (!log.session_id) return;
            
            let prev = null;
            for (let i = index - 1; i >= 0; i--) {
              if (exLogs[i].session_id !== log.session_id) {
                prev = exLogs[i].bpm_used;
                break;
              }
            }

            matrix[exId][log.session_id] = {
              bpm: log.bpm_used,
              duration: log.duration_seconds,
              prevBpm: prev
            };
          });
        });

        setLogsMatrix(matrix);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta sesión y todos sus registros? Esta acción no se puede deshacer.')) return;
    
    try {
      const { error } = await supabase
        .from('practice_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      
      await fetchHistoryData();
    } catch (err) {
      alert('Error al eliminar la sesión: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const startEditingLog = (log: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLogId(log.id);
    setEditForm({
      bpm: log.bpm_used.toString(),
      durationMinutes: Math.floor((log.duration_seconds || 0) / 60).toString()
    });
  };

  const cancelEditingLog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLogId(null);
  };

  const handleSaveLog = async (logId: string, sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const bpm = parseInt(editForm.bpm);
      const mins = parseInt(editForm.durationMinutes);

      if (isNaN(bpm) || bpm <= 0) throw new Error("BPM inválido");
      const durationSecs = isNaN(mins) ? 0 : mins * 60;

      const { error: updateError } = await supabase
        .from('practice_logs')
        .update({ bpm_used: bpm, duration_seconds: durationSecs })
        .eq('id', logId);

      if (updateError) throw updateError;

      const updatedSessionLogs = sessionLogs[sessionId].map(l => 
        l.id === logId ? { ...l, bpm_used: bpm, duration_seconds: durationSecs } : l
      );
      const newTotalSecs = updatedSessionLogs.reduce((acc, l) => acc + (l.duration_seconds || 0), 0);

      const { error: sessionError } = await supabase
        .from('practice_sessions')
        .update({ total_duration_seconds: newTotalSecs })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      setSessionLogs(prev => ({
        ...prev,
        [sessionId]: updatedSessionLogs
      }));

      setChartData(prev => prev.map(c => 
        c.id === sessionId ? { ...c, minutos: Math.round(newTotalSecs / 60) } : c
      ));

      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, total_duration_seconds: newTotalSecs } : s
      ));

      const logToEdit = sessionLogs[sessionId].find(l => l.id === logId);
      if (logToEdit) {
        setLogsMatrix(prev => ({
          ...prev,
          [logToEdit.exercise_id]: {
            ...prev[logToEdit.exercise_id],
            [sessionId]: {
              ...prev[logToEdit.exercise_id]?.[sessionId],
              bpm: bpm,
              duration: durationSecs
            }
          }
        }));
      }

      setEditingLogId(null);
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    }
  };

  const getHeatmapColor = (bpm: number, targetBpm: number | null) => {
    if (!targetBpm) return 'rgba(220,185,138,0.3)';
    const ratio = Math.min(1, bpm / targetBpm);
    const opacity = 0.1 + (ratio * 0.9);
    return `rgba(220,185,138,${opacity})`;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatKpiTime = (totalSecs: number) => {
    if (!totalSecs) return '0 min';
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
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
    return sessions.map(session => {
      const dateObj = new Date(session.started_at);
      return {
        id: session.id,
        timestamp: dateObj.getTime(),
        dateTimeStr: `${dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
        duration: session.total_duration_seconds || 0,
        minutos: Math.round((session.total_duration_seconds || 0) / 60),
        exercisesCount: sessionLogs[session.id]?.length || 0
      };
    });
  };

  const sortedTableData = [...getTableData()].sort((a, b) => {
    let valA, valB;
    switch(sortConfig.key) {
      case 'date': valA = a.timestamp; valB = b.timestamp; break;
      case 'duration': valA = a.duration; valB = b.duration; break;
      case 'exercises': valA = a.exercisesCount; valB = b.exercisesCount; break;
      default: valA = a.timestamp; valB = b.timestamp;
    }
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedTableData.length / itemsPerPage);
  const paginatedData = sortedTableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalSessions = sessions.length;
  const totalSeconds = sessions.reduce((acc, curr) => acc + (curr.total_duration_seconds || 0), 0);
  const avgSeconds = totalSessions > 0 ? Math.round(totalSeconds / totalSessions) : 0;

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
        Volver
      </button>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--text)', margin: '0 0 0.5rem 0', lineHeight: 1 }}>
          Rendimiento en <span style={{ color: 'var(--gold)' }}>{routineName}</span>
        </h1>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.95rem' }}>
          {totalSessions} sesiones completadas
        </p>
      </div>

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
          Estadísticas
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
          Historial detallado
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          ⚠ {error}
        </div>
      )}

      {sessions.length === 0 ? (
        <div style={{ background: 'var(--surface)', padding: '4rem 2rem', borderRadius: '12px', border: '1px dashed rgba(220,185,138,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
          <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: 600 }}>Aún no hay datos</p>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>Completa tu primera sesión de práctica para ver las estadísticas aquí.</p>
        </div>
      ) : activeTab === 'stats' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.3s ease' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Sesiones Completadas</span>
              <p style={{ color: 'var(--gold)', fontSize: '2.5rem', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>{totalSessions}</p>
            </div>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Tiempo Total</span>
              <p style={{ color: 'var(--text)', fontSize: '2.5rem', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>{formatKpiTime(totalSeconds)}</p>
            </div>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Promedio por Sesión</span>
              <p style={{ color: 'var(--text)', fontSize: '2.5rem', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>{formatKpiTime(avgSeconds)}</p>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: 'var(--text)', margin: '0 0 1.5rem 0', letterSpacing: '0.05em' }}>
              Minutos por sesión
            </h2>
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(255,255,255,0.2)" 
                    tickFormatter={(value) => {
                      const session = chartData.find(d => d.name === value);
                      return session ? session.shortDate : value;
                    }}
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.2)" 
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    labelFormatter={(label) => {
                      const session = chartData.find(d => d.name === label);
                      return session ? `${session.shortDate} - ${session.time}` : label;
                    }}
                    contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(220,185,138,0.3)', borderRadius: '8px', color: '#f0e8dc' }}
                    itemStyle={{ color: '#dcb98a', fontWeight: 700 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="minutos" 
                    stroke="#dcb98a" 
                    strokeWidth={3} 
                    dot={{ fill: '#141414', stroke: '#dcb98a', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#dcb98a' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: 'var(--text)', margin: '0 0 1.5rem 0', letterSpacing: '0.05em' }}>
              Matriz de Progreso (BPM)
            </h2>
            <div style={{ minWidth: '800px' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '250px', flexShrink: 0, fontWeight: 700, color: 'var(--muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Ejercicio
                </div>
                <div style={{ display: 'flex', flex: 1, gap: '0.5rem' }}>
                  {sessions.map(session => {
                    const sessionTime = new Date(session.started_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div 
                        key={session.id} 
                        style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', cursor: 'default' }}
                        title={`Sesión a las ${sessionTime}`} 
                      >
                        {new Date(session.started_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {exercises.map(ex => (
                  <div key={ex.exercise_id} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '250px', flexShrink: 0, paddingRight: '1rem' }}>
                      <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ex.exercises?.title || 'Ejercicio Desconocido'}
                      </p>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
                        Obj: {ex.target_bpm ? `${ex.target_bpm} BPM` : '—'} • {formatTime(ex.target_duration_seconds || 0)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flex: 1, gap: '0.5rem' }}>
                      {sessions.map(session => {
                        const log = logsMatrix[ex.exercise_id]?.[session.id];
                        const diff = log && log.prevBpm !== null ? log.bpm - log.prevBpm : 0;
                        
                        return (
                          <div 
                            key={session.id} 
                            style={{ 
                              flex: 1, 
                              background: log ? getHeatmapColor(log.bpm, ex.target_bpm) : 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.05)',
                              borderRadius: '6px',
                              height: '40px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: log ? '#111' : 'transparent',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              transition: 'all 0.2s'
                            }}
                            title={log ? `BPM: ${log.bpm}\nTiempo: ${formatTime(log.duration)}` : 'No practicado'}
                          >
                            {log ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>{log.bpm}</span>
                                {diff !== 0 && (
                                  <span style={{ 
                                    fontSize: '0.65rem',
                                    color: diff > 0 ? '#15803d' : '#b91c1c',
                                    background: 'rgba(255,255,255,0.6)',
                                    padding: '1px 3px',
                                    borderRadius: '3px',
                                    lineHeight: 1
                                  }}>
                                    {diff > 0 ? '↑' : '↓'} {Math.abs(diff)}
                                  </span>
                                )}
                              </div>
                            ) : '-'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '2rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
              <span>Menos cerca del objetivo</span>
              <div style={{ display: 'flex', gap: '0.2rem' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(220,185,138,0.2)' }} />
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(220,185,138,0.5)' }} />
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(220,185,138,0.8)' }} />
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(220,185,138,1)' }} />
              </div>
              <span>Objetivo superado / alcanzado</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: 700, width: '40px' }}></th>
                {renderSortableHeader('Fecha y Hora', 'date')}
                {renderSortableHeader('Tiempo Total', 'duration')}
                {renderSortableHeader('Ejercicios Completados', 'exercises')}
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: 700, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((session) => (
                <React.Fragment key={session.id}>
                  <tr 
                    onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                    style={{ 
                      borderBottom: expandedSessionId === session.id ? 'none' : '1px solid rgba(255,255,255,0.05)', 
                      transition: 'background 0.2s',
                      cursor: 'pointer',
                      background: expandedSessionId === session.id ? 'rgba(255,255,255,0.02)' : 'transparent'
                    }} 
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} 
                    onMouseLeave={e => e.currentTarget.style.background = expandedSessionId === session.id ? 'rgba(255,255,255,0.02)' : 'transparent'}
                  >
                    <td style={{ padding: '1rem 0 1rem 1.5rem', color: 'var(--muted)' }}>
                      <svg 
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: expandedSessionId === session.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text)', fontWeight: 500 }}>{session.dateTimeStr}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--gold)', fontWeight: 700 }}>{session.minutos} min</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--muted)' }}>{session.exercisesCount}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }} 
                        style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)', padding: '0.5rem 0.8rem', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem', fontWeight: 600 }} 
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.2)'; }} 
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.1)'; }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                  
                  {expandedSessionId === session.id && (
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td colSpan={5} style={{ padding: 0 }}>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem 1.5rem 1.5rem 4rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ejercicios Practicados</h4>
                          
                          {(!sessionLogs[session.id] || sessionLogs[session.id].length === 0) ? (
                            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>No hay ejercicios registrados en esta sesión.</p>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', overflow: 'hidden' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--muted)', fontSize: '0.8rem' }}>
                                  <th style={{ padding: '0.8rem 1rem', fontWeight: 600 }}>Ejercicio</th>
                                  <th style={{ padding: '0.8rem 1rem', fontWeight: 600 }}>BPM</th>
                                  <th style={{ padding: '0.8rem 1rem', fontWeight: 600 }}>Tiempo</th>
                                  <th style={{ padding: '0.8rem 1rem', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sessionLogs[session.id].map(log => (
                                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    {editingLogId === log.id ? (
                                      <>
                                        <td style={{ padding: '0.8rem 1rem', color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600 }}>{log.title}</td>
                                        <td style={{ padding: '0.6rem 1rem' }}>
                                          <input 
                                            type="number" 
                                            value={editForm.bpm} 
                                            onChange={e => setEditForm({...editForm, bpm: e.target.value})}
                                            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem', borderRadius: '4px', width: '70px', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                                          />
                                        </td>
                                        <td style={{ padding: '0.6rem 1rem' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <input 
                                              type="number" 
                                              value={editForm.durationMinutes} 
                                              onChange={e => setEditForm({...editForm, durationMinutes: e.target.value})}
                                              style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem', borderRadius: '4px', width: '60px', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                                            />
                                            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>min</span>
                                          </div>
                                        </td>
                                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>
                                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                            <button onClick={(e) => cancelEditingLog(e)} style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }} title="Cancelar">
                                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                            </button>
                                            <button onClick={(e) => handleSaveLog(log.id, session.id, e)} style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }} title="Guardar">
                                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                            </button>
                                          </div>
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td style={{ padding: '0.8rem 1rem', color: 'var(--text)', fontSize: '0.9rem' }}>{log.title}</td>
                                        <td style={{ padding: '0.8rem 1rem', color: 'var(--gold)', fontWeight: 700, fontSize: '0.9rem' }}>{log.bpm_used}</td>
                                        <td style={{ padding: '0.8rem 1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>{Math.floor(log.duration_seconds / 60)} min</td>
                                        <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                                          <button onClick={(e) => startEditingLog(log, e)} style={{ background: 'transparent', color: 'var(--muted)', border: 'none', cursor: 'pointer', padding: '0.3rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'} title="Editar">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                          </button>
                                        </td>
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
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Página {currentPage} de {totalPages}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1} 
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : 'var(--text)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif' }}
                >
                  Anterior
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages} 
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : 'var(--text)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif' }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}