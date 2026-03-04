"use client";

import React from 'react';
import { BpmVelocityKpi } from './BpmVelocityKpi';

interface GlobalKpisProps {
    totalTimeMinutes: number;
    activeDays: number;
    streak: number;
    loading: boolean;
}

const formatTime = (totalMinutes: number) => {
    if (!totalMinutes || totalMinutes === 0) return [{ value: 0, unit: 'MIN' }];

    const years = Math.floor(totalMinutes / 525600);
    const months = Math.floor((totalMinutes % 525600) / 43200);
    const days = Math.floor((totalMinutes % 43200) / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    const parts = [];
    if (years > 0) parts.push({ value: years, unit: years === 1 ? 'AÑO' : 'AÑOS' });
    if (months > 0) parts.push({ value: months, unit: months === 1 ? 'MES' : 'MESES' });
    if (days > 0 && years === 0) parts.push({ value: days, unit: days === 1 ? 'DÍA' : 'DÍAS' });
    if (hours > 0 && months === 0 && years === 0) parts.push({ value: hours, unit: 'H' });
    if (minutes > 0 && days === 0 && months === 0 && years === 0) parts.push({ value: minutes, unit: 'MIN' });

    return parts.slice(0, 2);
};

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