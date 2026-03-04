"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface ActivityLog {
  id: string;
  created_at: string;
  bpm_used: number;
  duration_seconds: number | null;
  exercises: {
    title: string;
    technique: string | null;
  };
}

export function RecentActivity() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('practice_logs')
      .select(`
        id,
        created_at,
        bpm_used,
        duration_seconds,
        exercises (title, technique)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15);

    if (data) {
      const formattedLogs = data.map((log: any) => ({
        id: log.id,
        created_at: log.created_at,
        bpm_used: log.bpm_used,
        duration_seconds: log.duration_seconds,
        exercises: {
          title: Array.isArray(log.exercises) ? log.exercises[0]?.title : log.exercises?.title,
          technique: Array.isArray(log.exercises) ? log.exercises[0]?.technique : log.exercises?.technique
        }
      }));
      setLogs(formattedLogs);
    }
    setLoading(false);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return `Hoy, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
        <span style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid rgba(220,185,138,0.3)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div style={{ background: 'var(--surface)', padding: '3rem', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Aún no hay registros de práctica.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      {logs.map((log) => (
        <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '1.2rem 1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div>
            <h4 style={{ margin: '0 0 0.3rem 0', color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600 }}>
              {log.exercises?.title || 'Ejercicio Desconocido'}
            </h4>
            <div style={{ display: 'flex', gap: '0.8rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
              <span>{formatDate(log.created_at)}</span>
              {log.exercises?.technique && (
                <>
                  <span>•</span>
                  <span>{log.exercises.technique}</span>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Tiempo</span>
              <span style={{ color: 'var(--text)', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>{formatDuration(log.duration_seconds)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Velocidad</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                <span style={{ fontSize: '1.8rem', fontFamily: 'Bebas Neue, sans-serif', color: 'var(--gold)', lineHeight: 1 }}>{log.bpm_used}</span>
                <span style={{ color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 700 }}>BPM</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}