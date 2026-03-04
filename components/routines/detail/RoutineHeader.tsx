"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Routine } from '../../../lib/types';

interface RoutineHeaderProps {
  routine: Routine;
  totalDuration: number;
  exerciseCount: number;
  onAddClick: () => void;
}

export function RoutineHeader({ routine, totalDuration, exerciseCount, onAddClick }: RoutineHeaderProps) {
  const router = useRouter();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <button onClick={() => router.push('/routines')} style={{ background: 'transparent', color: 'var(--muted)', border: 'none', padding: '0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem' }}>
        ← Volver a Mis Rutinas
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>{routine.title}</h1>
          <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.95rem' }}>
            {routine.description || 'Sin descripción'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text)' }}>
              ⏱️ Tiempo estimado: <strong style={{ color: 'var(--gold)' }}>{formatTime(totalDuration)}</strong>
            </span>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text)' }}>
              🎸 Ejercicios: <strong style={{ color: 'var(--gold)' }}>{exerciseCount}</strong>
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={onAddClick} style={{ background: 'transparent', color: 'var(--text)', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            + Añadir Ejercicio
          </button>
        </div>
      </div>
    </>
  );
}