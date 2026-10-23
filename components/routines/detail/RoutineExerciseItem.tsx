"use client";

import React from 'react';
import { Exercise } from '@/lib/types';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { useTranslations } from 'next-intl';
import styles from './RoutineExerciseItem.module.css';

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
    <div className={styles.techniqueFallbackStack}>
      <div className={styles.techniqueFallbackRow}>

        <div className={styles.stack}>
          <button disabled={isFirst} onClick={() => onMove(index, 'up')} className={styles.button} style={{ color: isFirst ? 'rgba(255,255,255,0.1)' : 'var(--muted)', cursor: isFirst ? 'default' : 'pointer' }}>▲</button>
          <button disabled={isLast}  onClick={() => onMove(index, 'down')} className={styles.button} style={{ color: isLast  ? 'rgba(255,255,255,0.1)' : 'var(--muted)', cursor: isLast  ? 'default' : 'pointer' }}>▼</button>
        </div>

        <div className={styles.techniqueFallback}>
          <div className={styles.row}>
            <span className={styles.label}>{index + 1}</span>
            <h3 className={styles.subheading}>{item.exercises.title}</h3>
          </div>
          <div className={styles.techniqueFallbackRow2}>
            <span>{item.exercises.technique || t('techniqueFallback')}</span>
            <span>•</span>
            <span>{t('difficultyLabel')} {item.exercises.difficulty || 1}</span>
            <span>•</span>
            <span className={styles.sessionsLabel}>{t('sessions', { count: item.session_count || 0 })}</span>
          </div>
        </div>

        <div className={styles.durationLabelStack}>
          <label className={styles.durationLabelFieldLabel}>
            {t('durationLabel')}
          </label>
          <div className={styles.durationUnitRow}>
            <input
              type="number"
              min="1"
              max="60"
              value={minutes}
              placeholder="5"
              onChange={e => handleMinutesChange(e.target.value)}
              className={styles.input}
            />
            <span className={styles.durationUnitLabel}>{t('durationUnit')}</span>
          </div>
        </div>

        <div className={styles.durationLabelStack}>
          <label className={styles.durationLabelFieldLabel}>{t('bpmLabel')}</label>
          <input
            type="number"
            value={item.target_bpm || ''}
            placeholder={item.exercises.bpm_goal?.toString() || t('bpmPlaceholder')}
            onChange={e => onUpdateSetting(item.id, 'target_bpm', e.target.value ? parseInt(e.target.value) : null)}
            className={styles.bpmPlaceholderInput}
          />
        </div>

        <DeleteButton onClick={() => onRemove(item.id)} />
      </div>
    </div>
  );
}