"use client";

import React, { useState, useEffect } from 'react';
import { Exercise, Routine } from '../../lib/types';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { DeleteButton } from '../ui/DeleteButton';
import { EditButton } from '../ui/EditButton';
import { HistoryButton } from '../ui/HistoryButton';
import { useTranslations } from 'next-intl';
import { useTranslatedExercise } from '@/hooks/useTranslatedExercise';

interface RoutineCardProps {
  routine: Routine;
  onDelete: (routine: Routine) => void;
  readonly?: boolean;
}

export function RoutineCard({ routine, onDelete, readonly = false }: RoutineCardProps) {
  const t = useTranslations('RoutineCard');
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const [exerciseCount, setExerciseCount] = useState<number | null>(null);
  const [exerciseTitles, setExerciseTitles] = useState<string[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  useEffect(() => {
    if ((routine as any).exercise_count !== undefined) {
      setExerciseCount((routine as any).exercise_count);
    } else {
      fetchExerciseCount();
    }
  }, [routine]);

  useEffect(() => {
    if (isOpen && exerciseTitles.length === 0) {
      fetchExercisePreview();
    }
  }, [isOpen]);

  const fetchExerciseCount = async () => {
    const { count } = await supabase
      .from('routine_exercises')
      .select('*', { count: 'exact', head: true })
      .eq('routine_id', routine.id);

    setExerciseCount(count || 0);
  };

  const { formatExercise } = useTranslatedExercise();

  const fetchExercisePreview = async () => {
    setLoadingExercises(true);
    const { data } = await supabase
      .from('routine_exercises')
      .select('exercises(id, user_id, title)')
      .eq('routine_id', routine.id)
      .order('order_index', { ascending: true });

    if (data) {
      const titles = data.map((item: any) => {
        const translatedEx = formatExercise(item.exercises as Exercise);
        return translatedEx.title;
      });
      setExerciseTitles(titles);
      setExerciseCount(titles.length);
    }
    setLoadingExercises(false);
  };

  const displayCount = exerciseCount !== null ? exerciseCount : 0;

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.05)',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      opacity: readonly ? 0.7 : 1
    }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <span style={{
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            color: 'var(--gold)',
            fontSize: '0.8rem'
          }}>▶</span>
          <div>
            <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
              {routine.title}
              {readonly && (
                <span style={{
                  marginLeft: '0.75rem',
                  fontSize: '0.7rem',
                  background: 'rgba(255,193,7,0.1)', // Un tono más de advertencia
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  color: 'var(--gold)',
                  fontWeight: 'bold',
                  verticalAlign: 'middle'
                }}>
                  {t('lockedTooltip').toUpperCase()}
                </span>
              )}
            </h3>
            {readonly && (
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--gold)', opacity: 0.8 }}>
                {t('lockedDescription')}
              </p>
            )}
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
              {t('exerciseCount', { count: displayCount })}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
          <button
            data-onboarding="routines-06"
            title={readonly ? t('lockedTooltip') : undefined}
            onClick={(e) => {
              if (readonly) {
                e.stopPropagation();
                return;
              }
              window.dispatchEvent(new CustomEvent('app:play-routine'));
              router.push(`/practice?routine=${routine.id}`);
            }}
            style={{
              background: readonly ? 'rgba(255,255,255,0.05)' : 'var(--gold)',
              color: readonly ? 'var(--muted)' : '#111',
              border: readonly ? '1px solid rgba(255,255,255,0.1)' : 'none',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              cursor: readonly ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textTransform: 'uppercase',
              height: '42px',
              opacity: readonly ? 0.5 : 1
            }}
            onMouseEnter={e => !readonly && (e.currentTarget.style.background = 'var(--gold-dark)')}
            onMouseLeave={e => !readonly && (e.currentTarget.style.background = 'var(--gold)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 3l16 9-16 9V3z" />
            </svg>
            {t('playButton')}
          </button>

          <div
            title={readonly ? t('lockedTooltip') : undefined}
            style={{
              opacity: readonly ? 0.5 : 1,
              cursor: readonly ? 'not-allowed' : 'pointer'
            }}
            onClick={(e) => {
              if (readonly) {
                e.stopPropagation();
              } else {
                router.push(`/routines/${routine.id}`);
              }
            }}
          >
            <div style={{ pointerEvents: readonly ? 'none' : 'auto' }}>
              <EditButton onClick={() => { }} />
            </div>
          </div>

          <HistoryButton onClick={() => router.push(`/routines/${routine.id}/history`)} />

          <DeleteButton onClick={() => onDelete(routine)} />
        </div>
      </div>

      {isOpen && (
        <div style={{
          padding: '0 1.5rem 1.5rem 3rem',
          borderTop: '1px solid rgba(255,255,255,0.03)',
          background: 'rgba(0,0,0,0.1)'
        }}>
          {routine.description && (
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem', fontStyle: 'italic' }}>
              {routine.description}
            </p>
          )}

          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {loadingExercises ? (
              <li style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t('loading')}</li>
            ) : exerciseTitles.length > 0 ? (
              exerciseTitles.map((title, i) => (
                <li key={i} style={{
                  color: 'var(--text)',
                  fontSize: '0.85rem',
                  padding: '0.3rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ color: 'var(--gold)', fontSize: '0.7rem' }}>•</span>
                  {title}
                </li>
              ))
            ) : (
              <li style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t('empty')}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}