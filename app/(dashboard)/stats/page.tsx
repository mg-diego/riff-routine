"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { GlobalKpis } from '../../../components/stats/GlobalKpis';
import { RecentActivity } from '@/components/stats/RecentActivity';
import { ConsistencyHeatmap } from '@/components/stats/ConsistencyHeatmap';
import { StatsCarousel } from '@/components/stats/StatsCarousel';

export default function StatsPage() {
  const [dateFilter, setDateFilter] = useState('30');
  const [loading, setLoading] = useState(true);

  const [totalTimeMinutes, setTotalTimeMinutes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeDays, setActiveDays] = useState(0);

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const fetchGlobalStats = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

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

    const getLocalDateStr = (isoString: string | number | Date) => {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-CA');
    };

    if (sessionsData) {
      sessionsData.forEach(s => {
        totalSecs += s.total_duration_seconds || 0;
        allDates.add(getLocalDateStr(s.created_at));
      });
    }

    if (logsData) {
      logsData.forEach(log => {
        allDates.add(getLocalDateStr(log.created_at));
      });

      if (totalSecs === 0) {
        logsData.forEach(log => {
          totalSecs += log.duration_seconds || 0;
        });
      }
    }

    setTotalTimeMinutes(Math.floor(totalSecs / 60));
    setActiveDays(allDates.size);

    let currentStreak = 0;
    const today = new Date();
    const todayStr = getLocalDateStr(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);

    if (allDates.has(todayStr) || allDates.has(yesterdayStr)) {
      const startRef = allDates.has(todayStr) ? today : yesterday;
      let d = 0;
      while (true) {
        const checkDate = new Date(startRef);
        checkDate.setDate(startRef.getDate() - d);
        if (allDates.has(getLocalDateStr(checkDate))) {
          currentStreak++;
          d++;
        } else {
          break;
        }
      }
    }

    setStreak(currentStreak);
    setLoading(false);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      paddingBottom: '3rem',
      overflowX: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>Estadísticas</h1>
          <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            Métricas globales de rendimiento y consistencia.
          </p>
        </div>
      </div>

      {/* SECCIÓN SUPERIOR: KPIs Y MAPA DE CALOR (HISTÓRICO) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
        <GlobalKpis
          totalTimeMinutes={totalTimeMinutes}
          activeDays={activeDays}
          streak={streak}
          loading={loading}
        />
        <div style={{ marginTop: '1rem' }}>
          <ConsistencyHeatmap />
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <main style={{ width: '100%', minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ color: 'var(--text)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', margin: 0 }}>
                Análisis Detallado
              </h2>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  outline: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="90">Últimos 3 meses</option>
                <option value="all">Todo el tiempo</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
              <div style={{ minWidth: 0 }}>
                <StatsCarousel />
              </div>
              <div style={{ minWidth: 0 }}>
                <RecentActivity />
              </div>
            </div>
          </div>
      </main>
    </div>
  );
}