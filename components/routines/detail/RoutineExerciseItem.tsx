"use client";

import React from 'react';
import { Exercise } from '../../../lib/types';

interface RoutineExerciseDetail {
  id: string;
  routine_id: string;
  exercise_id: string;
  target_bpm: number | null;
  order_index: number;
  target_duration_seconds: number | null;
  session_count?: number; 
  exercises: Exercise;
}

interface RoutineExerciseItemProps {
  item: RoutineExerciseDetail;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onUpdateSetting: (id: string, field: string, value: number | null) => void;
  onRemove: (id: string) => void;
  onStats?: (id: string) => void;
}

export function RoutineExerciseItem({ item, index, isFirst, isLast, onMove, onUpdateSetting, onRemove, onStats }: RoutineExerciseItemProps) {
  return (
    <div style={{ background: 'var(--surface)', padding: '1.2rem 1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <button disabled={isFirst} onClick={() => onMove(index, 'up')} style={{ background: 'none', border: 'none', color: isFirst ? 'rgba(255,255,255,0.1)' : 'var(--muted)', cursor: isFirst ? 'default' : 'pointer', padding: '0' }}>▲</button>
          <button disabled={isLast} onClick={() => onMove(index, 'down')} style={{ background: 'none', border: 'none', color: isLast ? 'rgba(255,255,255,0.1)' : 'var(--muted)', cursor: isLast ? 'default' : 'pointer', padding: '0' }}>▼</button>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>{index + 1}</span>
            <h3 style={{ color: 'var(--text)', margin: '0', fontSize: '1.1rem', fontWeight: 600 }}>{item.exercises.title}</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--muted)' }}>
            <span>{item.exercises.technique || 'General'}</span>
            <span>•</span>
            <span>Dificultad: {item.exercises.difficulty || 1}</span>
            <span>•</span>
            <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{item.session_count || 0} sesiones</span>
          </div>
        </div>

        <div style={{ flex: '0 1 150px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 'bold' }}>Duración (seg)</label>
          <input 
            type="number" 
            value={item.target_duration_seconds || ''} 
            onChange={(e) => onUpdateSetting(item.id, 'target_duration_seconds', e.target.value ? parseInt(e.target.value) : null)}
            style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.5rem', borderRadius: '6px', outline: 'none', width: '100px', fontFamily: 'DM Sans, sans-serif' }}
          />
        </div>

        <div style={{ flex: '0 1 150px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 'bold' }}>BPM Objetivo</label>
          <input 
            type="number" 
            value={item.target_bpm || ''} 
            placeholder={item.exercises.bpm_goal?.toString() || 'Libre'}
            onChange={(e) => onUpdateSetting(item.id, 'target_bpm', e.target.value ? parseInt(e.target.value) : null)}
            style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.5rem', borderRadius: '6px', outline: 'none', width: '100px', fontFamily: 'DM Sans, sans-serif' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.8rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
        <button 
          onClick={() => onStats?.(item.id)}
          style={{ flex: 1, minWidth: '120px', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
        >
          📊 Estadísticas
        </button>
        <button 
          onClick={() => onRemove(item.id)}
          style={{ flex: 1, minWidth: '120px', background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)', padding: '0.6rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#e74c3c'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.1)'; e.currentTarget.style.color = '#e74c3c'; }}
        >
          ✕ Borrar
        </button>
      </div>

    </div>
  );
}