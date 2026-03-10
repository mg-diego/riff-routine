"use client";

import React from 'react';
import { BpmVelocityKpi } from './BpmVelocityKpi';
import { formatTime } from '@/lib/utils';

interface GlobalKpisProps {
  totalTimeMinutes: number;
  activeDays: number;
  streak: number;
  loading: boolean;
}

export function GlobalKpis({ totalTimeMinutes, activeDays, streak, loading }: GlobalKpisProps) {
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <span className="loader" />
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>

      {/* Tiempo Total */}
      <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(96,165,250,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Tiempo Total</span>
        </div>
        <p style={{ color: 'var(--text)', fontSize: '2.4rem', margin: 0, fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: '0.3rem', flexWrap: 'wrap' }}>
          {formatTime(totalTimeMinutes).map((part: { value: number; unit: string }, index: number) => (
            <React.Fragment key={index}>
              <span>{part.value}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>{part.unit}</span>
            </React.Fragment>
          ))}
        </p>
      </div>

      {/* Días Activos */}
      <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(52,211,153,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Días Activos</span>
        </div>
        <p style={{ color: 'var(--text)', fontSize: '2.4rem', margin: 0, fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>
          {activeDays}
          <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, marginLeft: '0.3rem' }}>días</span>
        </p>
      </div>

      {/* Racha */}
      <div style={{ background: streak > 0 ? 'linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(251,146,60,0.02) 100%)' : 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: `1px solid ${streak > 0 ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.04)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={streak > 0 ? '#fb923c' : 'rgba(255,255,255,0.3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Racha Actual</span>
        </div>
        <p style={{ color: streak > 0 ? '#fb923c' : 'var(--muted)', fontSize: '2.4rem', margin: 0, fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>
          {streak}
          <span style={{ fontSize: '0.9rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, marginLeft: '0.3rem' }}>
            {streak === 1 ? 'día' : 'días'}
          </span>
        </p>
        {streak >= 7 && (
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: '#fb923c', fontWeight: 600 }}>
            🔥 ¡{streak >= 30 ? 'Racha épica' : streak >= 14 ? 'Increíble' : 'Gran racha'}!
          </p>
        )}
      </div>

      {/* BPM Velocity KPI — sin cambios */}
      <BpmVelocityKpi />
    </div>
  );
}