"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
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

interface ExerciseOption {
  id: string;
  title: string;
  bpm_goal: number | null;
}

interface ExerciseLog {
  id: string;
  created_at: string;
  bpm_used: number;
  duration_seconds: number | null;
}

export function ExerciseStats() {
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercisesWithLogs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: logsData } = await supabase
        .from('practice_logs')
        .select('exercise_id')
        .eq('user_id', user.id);

      if (!logsData || logsData.length === 0) {
        setLoading(false);
        return;
      }

      const activeExerciseIds = Array.from(new Set(logsData.map(l => l.exercise_id)));

      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('id, title, bpm_goal')
        .in('id', activeExerciseIds);

      if (exercisesData) {
        setExercises(exercisesData);
        if (exercisesData.length > 0) {
          setSelectedId(exercisesData[0].id);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchExercisesWithLogs();
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    const fetchLogsForExercise = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('practice_logs')
        .select('id, created_at, bpm_used, duration_seconds')
        .eq('user_id', user.id)
        .eq('exercise_id', selectedId)
        .order('created_at', { ascending: true });

      if (data) {
        setLogs(data);
      }
      setLoading(false);
    };

    fetchLogsForExercise();
  }, [selectedId]);

  const maxBpm = logs.length > 0 ? Math.max(...logs.map(l => l.bpm_used)) : 0;
  const totalSessions = logs.length;
  const totalSeconds = logs.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const selectedExercise = exercises.find(ex => ex.id === selectedId);
  const targetBpm = selectedExercise?.bpm_goal || null;

  let lastYear: number | null = null;

  const chartData = logs.map(log => {
    const d = new Date(log.created_at);
    const year = d.getFullYear();
    const monthDay = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
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
      Objetivo: targetBpm
    };
  });

  if (exercises.length === 0 && !loading) {
    return (
      <div style={{ background: 'var(--surface)', padding: '3rem', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', margin: 0 }}>No tienes registros de ejercicios específicos todavía.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <label style={{ color: 'var(--muted)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>
          Selecciona un ejercicio:
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
          {exercises.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.title}</option>
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
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>BPM Máximo</span>
              <p style={{ color: 'var(--gold)', fontSize: '2.5rem', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>{maxBpm}</p>
            </div>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Sesiones</span>
              <p style={{ color: 'var(--text)', fontSize: '2.5rem', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>{totalSessions}</p>
            </div>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Tiempo Invertido</span>
              <p style={{ color: 'var(--text)', fontSize: '2.5rem', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>{formatTime(totalSeconds)}</p>
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
                {targetBpm && (
                  <Line 
                    type="stepAfter" 
                    name="BPM Objetivo"
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
                  name="BPM Logrado"
                  dataKey="BPM" 
                  stroke="var(--gold)" 
                  strokeWidth={3} 
                  dot={{ fill: 'var(--surface)', stroke: 'var(--gold)', strokeWidth: 2, r: 4 }} 
                  activeDot={{ r: 6, fill: 'var(--gold)' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}