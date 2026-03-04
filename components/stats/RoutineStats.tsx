"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface RoutineOption {
  id: string;
  title: string;
}

interface RoutineSession {
  id: string;
  created_at: string;
  total_duration_seconds: number;
}

export function RoutineStats() {
  const [routines, setRoutines] = useState<RoutineOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [sessions, setSessions] = useState<RoutineSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutinesWithSessions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessionsData } = await supabase
        .from('practice_sessions')
        .select('routine_id')
        .eq('user_id', user.id)
        .not('routine_id', 'is', null);

      if (!sessionsData || sessionsData.length === 0) {
        setLoading(false);
        return;
      }

      const activeRoutineIds = Array.from(new Set(sessionsData.map(s => s.routine_id)));

      const { data: routinesData } = await supabase
        .from('routines')
        .select('id, title')
        .in('id', activeRoutineIds);

      if (routinesData) {
        setRoutines(routinesData);
        if (routinesData.length > 0) {
          setSelectedId(routinesData[0].id);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchRoutinesWithSessions();
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    const fetchSessionsForRoutine = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('practice_sessions')
        .select('id, created_at, total_duration_seconds')
        .eq('user_id', user.id)
        .eq('routine_id', selectedId)
        .order('created_at', { ascending: true });

      if (data) {
        setSessions(data);
      }
      setLoading(false);
    };

    fetchSessionsForRoutine();
  }, [selectedId]);

  const totalSessions = sessions.length;
  const totalSeconds = sessions.reduce((acc, curr) => acc + (curr.total_duration_seconds || 0), 0);
  const avgSeconds = totalSessions > 0 ? Math.round(totalSeconds / totalSessions) : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const chartData = sessions.map(session => {
    const d = new Date(session.created_at);
    const dateStr = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    return {
      exactTime: `${dateStr}, ${timeStr}`,
      Minutos: Number(((session.total_duration_seconds || 0) / 60).toFixed(1))
    };
  });

  if (routines.length === 0 && !loading) {
    return (
      <div style={{ background: 'var(--surface)', padding: '3rem', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', margin: 0 }}>No tienes sesiones completadas de rutinas específicas todavía.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <label style={{ color: 'var(--muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>
          Selecciona una rutina:
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{
            flex: '1', maxWidth: '400px', padding: '0.8rem 1rem', borderRadius: '8px',
            background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: '1rem',
            outline: 'none', cursor: 'pointer'
          }}
        >
          {routines.map(rt => (
            <option key={rt.id} value={rt.id}>{rt.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted)' }}>
          <span style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid rgba(220,185,138,0.3)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Sesiones Completadas</span>
              <p style={{ color: 'var(--gold)', fontSize: '2.5rem', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>{totalSessions}</p>
            </div>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Tiempo Total</span>
              <p style={{ color: 'var(--text)', fontSize: '2.5rem', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>{formatTime(totalSeconds)}</p>
            </div>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Promedio por Sesión</span>
              <p style={{ color: 'var(--text)', fontSize: '2.5rem', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>{formatTime(avgSeconds)}</p>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', padding: '2rem 2rem 3rem 2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', width: '100%', minHeight: '350px', height: '50vh', maxHeight: '500px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="exactTime" 
                  tickFormatter={(value) => value.split(',')[0]}
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
                  domain={[0, 'auto']}
                />
                <Tooltip 
                  contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar 
                  dataKey="Minutos" 
                  fill="var(--gold)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}