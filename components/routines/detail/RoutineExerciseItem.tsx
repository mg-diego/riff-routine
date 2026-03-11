"use client";

import React from 'react';
import { Exercise } from '../../../lib/types';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { useTranslations } from 'next-intl';

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
}

export function RoutineExerciseItem({ item, index, isFirst, isLast, onMove, onUpdateSetting, onRemove }: RoutineExerciseItemProps) {
  const t = useTranslations('RoutineExerciseItem');

  const minutes = item.target_duration_seconds != null
    ? Math.round(item.target_duration_seconds / 60)
    : '';

  const handleMinutesChange = (raw: string) => {
    if (raw === '') { onUpdateSetting(item.id, 'target_duration_seconds', null); return; }
    const mins = Math.min(60, Math.max(1, parseInt(raw)));
    if (!isNaN(mins)) onUpdateSetting(item.id, 'target_duration_seconds', mins * 60);
  };

  return (
    <div style={{ background: 'var(--surface)', padding: '1.2rem 1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <button disabled={isFirst} onClick={() => onMove(index, 'up')} style={{ background: 'none', border: 'none', color: isFirst ? 'rgba(255,255,255,0.1)' : 'var(--muted)', cursor: isFirst ? 'default' : 'pointer', padding: 0 }}>▲</button>
          <button disabled={isLast}  onClick={() => onMove(index, 'down')} style={{ background: 'none', border: 'none', color: isLast  ? 'rgba(255,255,255,0.1)' : 'var(--muted)', cursor: isLast  ? 'default' : 'pointer', padding: 0 }}>▼</button>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>{index + 1}</span>
            <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{item.exercises.title}</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--muted)' }}>
            <span>{item.exercises.technique || t('techniqueFallback')}</span>
            <span>•</span>
            <span>{t('difficultyLabel')} {item.exercises.difficulty || 1}</span>
            <span>•</span>
            <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{t('sessions', { count: item.session_count || 0 })}</span>
          </div>
        </div>

        <div style={{ flex: '0 1 150px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 'bold' }}>
            {t('durationLabel')}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input
              type="number"
              min="1"
              max="60"
              value={minutes}
              placeholder="5"
              onChange={e => handleMinutesChange(e.target.value)}
              style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.5rem', borderRadius: '6px', outline: 'none', width: '70px', fontFamily: 'DM Sans, sans-serif' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('durationUnit')}</span>
          </div>
        </div>

        <div style={{ flex: '0 1 150px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('bpmLabel')}</label>
          <input
            type="number"
            value={item.target_bpm || ''}
            placeholder={item.exercises.bpm_goal?.toString() || t('bpmPlaceholder')}
            onChange={e => onUpdateSetting(item.id, 'target_bpm', e.target.value ? parseInt(e.target.value) : null)}
            style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.5rem', borderRadius: '6px', outline: 'none', width: '100px', fontFamily: 'DM Sans, sans-serif' }}
          />
        </div>

        <DeleteButton onClick={() => onRemove(item.id)} />
      </div>
    </div>
  );
}