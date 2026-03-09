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
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <span className="loader" />
            </div>
        );
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
        }}>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Tiempo Total
                </span>
                <p style={{ color: 'var(--text)', fontSize: '2.5rem', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    {formatTime(totalTimeMinutes).map((part, index) => (
                        <React.Fragment key={index}>
                            <span>{part.value}</span>
                            <span style={{ fontSize: '1rem', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, marginRight: '0.2rem' }}>
                                {part.unit}
                            </span>
                        </React.Fragment>
                    ))}
                </p>
            </div>

            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Días Activos</span>
                <p style={{ color: 'var(--text)', fontSize: '2.5rem', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>{activeDays}</p>
            </div>

            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Racha Actual</span>
                <p style={{ color: 'var(--gold)', fontSize: '2.5rem', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>
                    {streak} <span style={{ fontSize: '1rem' }}>{streak === 1 ? 'DÍA' : 'DÍAS'}</span>
                </p>
            </div>

            <BpmVelocityKpi />
        </div>
    );
}