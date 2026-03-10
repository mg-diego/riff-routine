"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { GlobalKpis } from '../../../components/stats/GlobalKpis';
import { RecentActivity } from '@/components/stats/RecentActivity';
import { ConsistencyHeatmap } from '@/components/stats/ConsistencyHeatmap';
import { StatsCarousel } from '@/components/stats/StatsCarousel';

const DATE_OPTIONS = [
  { value: '7',   label: 'Últimos 7 días' },
  { value: '30',  label: 'Últimos 30 días' },
  { value: '90',  label: 'Últimos 3 meses' },
  { value: 'all', label: 'Todo el tiempo' },
];

export default function StatsPage() {
  const [dateFilter, setDateFilter] = useState('30');
  const [loading, setLoading] = useState(true);
  const [totalTimeMinutes, setTotalTimeMinutes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeDays, setActiveDays] = useState(0);

  useEffect(() => { fetchGlobalStats(); }, []);

  const fetchGlobalStats = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: sessionsData } = await supabase
      .from('practice_sessions')
      .select('created_at, total_duration_seconds')
      .eq('user_id', user.id);

    const { data: logsData } = await supabase
      .from('practice_logs')
      .select('created_at, duration_seconds')
      .eq('user_id', user.id);

    let totalSecs = 0;
    const allDates = new Set<string>();
    const getLocalDateStr = (iso: string | number | Date) => new Date(iso).toLocaleDateString('en-CA');

    sessionsData?.forEach(s => {
      totalSecs += s.total_duration_seconds || 0;
      allDates.add(getLocalDateStr(s.created_at));
    });

    logsData?.forEach(log => {
      allDates.add(getLocalDateStr(log.created_at));
      if (totalSecs === 0) totalSecs += log.duration_seconds || 0;
    });

    setTotalTimeMinutes(Math.floor(totalSecs / 60));
    setActiveDays(allDates.size);

    // Streak
    const today = new Date();
    const todayStr = getLocalDateStr(today);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);
    let currentStreak = 0;
    if (allDates.has(todayStr) || allDates.has(yesterdayStr)) {
      const startRef = allDates.has(todayStr) ? today : yesterday;
      let d = 0;
      while (true) {
        const check = new Date(startRef); check.setDate(startRef.getDate() - d);
        if (allDates.has(getLocalDateStr(check))) { currentStreak++; d++; } else break;
      }
    }
    setStreak(currentStreak);
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', paddingBottom: '4rem', overflowX: 'hidden' }}>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>Estadísticas</h1>
          <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>Métricas globales de rendimiento y consistencia.</p>
        </div>
      </div>

      {/* ── KPIs globales ────────────────────────────────────────────── */}
      <GlobalKpis
        totalTimeMinutes={totalTimeMinutes}
        activeDays={activeDays}
        streak={streak}
        loading={loading}
      />

      {/* ── Heatmap ──────────────────────────────────────────────────── */}
      <div style={{ marginTop: '2rem', marginBottom: '3rem' }}>
        <ConsistencyHeatmap />
      </div>

      {/* ── Análisis detallado ───────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ color: 'var(--text)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', margin: 0, lineHeight: 1 }}>
            Análisis Detallado
          </h2>
          <p style={{ color: 'var(--muted)', margin: '0.3rem 0 0', fontSize: '0.85rem' }}>
            Distribución por técnica, habilidades y actividad reciente.
          </p>
        </div>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '0.3rem', gap: '0.25rem' }}>
          {DATE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDateFilter(opt.value)}
              style={{
                background: dateFilter === opt.value ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: dateFilter === opt.value ? 'var(--text)' : 'var(--muted)',
                border: 'none',
                padding: '0.45rem 0.9rem',
                borderRadius: '7px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: dateFilter === opt.value ? 700 : 400,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid: Carousel + Activity ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <StatsCarousel dateFilter={dateFilter} />
        </div>
        <div style={{ minWidth: 0 }}>
          <RecentActivity dateFilter={dateFilter} />
        </div>
      </div>
    </div>
  );
}