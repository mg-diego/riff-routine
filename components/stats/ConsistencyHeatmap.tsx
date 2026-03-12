"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslations, useLocale } from 'next-intl';

interface HeatmapData {
  date: string;
  minutes: number;
}

export function ConsistencyHeatmap() {
  const t = useTranslations('ConsistencyHeatmap');
  const locale = useLocale();
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: logsData } = await supabase
        .from('practice_logs')
        .select('created_at, duration_seconds')
        .eq('user_id', user.id);

      const { data: sessionsData } = await supabase
        .from('practice_sessions')
        .select('created_at, total_duration_seconds')
        .eq('user_id', user.id);

      const activityMap: Record<string, number> = {};

      const processRecord = (dateString: string, seconds: number | null) => {
        if (!seconds) return;
        const d = new Date(dateString);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        activityMap[dateKey] = (activityMap[dateKey] || 0) + (seconds / 60);
      };

      if (logsData) {
        logsData.forEach(log => processRecord(log.created_at, log.duration_seconds));
      }

      if (sessionsData) {
        sessionsData.forEach(session => processRecord(session.created_at, session.total_duration_seconds));
      }

      setData(activityMap);
      setLoading(false);
    };

    fetchActivity();
  }, []);

  const today = new Date();
  const days = [];
  const daysToShow = 365;
  
  const startDay = new Date(today);
  startDay.setDate(today.getDate() - daysToShow + 1);
  const startDayOfWeek = startDay.getDay();

  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  for (let i = 0; i < daysToShow; i++) {
    const d = new Date(startDay);
    d.setDate(startDay.getDate() + i);
    days.push(d);
  }

  const getColor = (minutes: number) => {
    if (minutes === 0) return 'rgba(255,255,255,0.03)';
    if (minutes < 15) return 'rgba(220,185,138,0.2)';
    if (minutes < 30) return 'rgba(220,185,138,0.5)';
    if (minutes < 60) return 'rgba(220,185,138,0.8)';
    return 'var(--gold)';
  };

  const months = [
    t('months.0'), t('months.1'), t('months.2'), t('months.3'), 
    t('months.4'), t('months.5'), t('months.6'), t('months.7'), 
    t('months.8'), t('months.9'), t('months.10'), t('months.11')
  ];

  const columnsCount = Math.ceil(days.length / 7);
  const monthLabels = [];
  let lastMonth = -1;

  for (let i = 0; i < columnsCount; i++) {
    const dayIndex = i * 7;
    const dayInCol = days.slice(dayIndex, dayIndex + 7).find(d => d !== null);
    
    if (dayInCol) {
      const currentMonth = dayInCol.getMonth();
      if (currentMonth !== lastMonth) {
        monthLabels.push({ text: months[currentMonth], colIndex: i });
        lastMonth = currentMonth;
      }
    }
  }

  if (loading) return null;

  return (
    <div data-onboarding="stats-chart" style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', overflowX: 'auto' }}>
      <h3 style={{ color: 'var(--text)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', margin: '0 0 1.5rem 0' }}>
        {t('title')}
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 'max-content' }}>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${columnsCount}, 12px)`, 
          gap: '4px', 
          height: '1rem', 
          position: 'relative', 
          color: 'var(--muted)', 
          fontSize: '0.75rem', 
          marginLeft: '28px' 
        }}>
          {monthLabels.map(label => (
            <span key={label.colIndex} style={{ gridColumn: label.colIndex + 1, position: 'absolute', left: 0 }}>
              {label.text}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 12px)', gap: '4px', color: 'var(--muted)', fontSize: '0.65rem', paddingRight: '0.2rem', textAlign: 'right', width: '20px' }}>
            <span style={{ lineHeight: '12px' }}></span>
            <span style={{ lineHeight: '12px' }}>{t('weekdays.mon')}</span>
            <span style={{ lineHeight: '12px' }}></span>
            <span style={{ lineHeight: '12px' }}>{t('weekdays.wed')}</span>
            <span style={{ lineHeight: '12px' }}></span>
            <span style={{ lineHeight: '12px' }}>{t('weekdays.fri')}</span>
            <span style={{ lineHeight: '12px' }}></span>
          </div>

          <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 12px)', gridAutoFlow: 'column', gap: '4px' }}>
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} style={{ width: '12px', height: '12px' }} />;
              }

              const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
              const minutes = data[dateKey] || 0;
              
              const dateStr = day.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              });

              return (
                <div
                  key={dateKey}
                  title={t('tooltip', { date: dateStr, minutes: Math.round(minutes) })}
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: getColor(minutes),
                    borderRadius: '2px',
                    transition: 'transform 0.1s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
        <span>{t('legend.less')}</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.03)' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'rgba(220,185,138,0.2)' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'rgba(220,185,138,0.5)' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'rgba(220,185,138,0.8)' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--gold)' }} />
        </div>
        <span>{t('legend.more')}</span>
      </div>
    </div>
  );
}