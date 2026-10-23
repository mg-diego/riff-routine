"use client";

import React, { useState, useEffect } from 'react';
import { Exercise, Routine } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { EditButton } from '@/components/ui/EditButton';
import { HistoryButton } from '@/components/ui/HistoryButton';
import { useTranslations } from 'next-intl';
import { APP_EVENTS, emitAppEvent } from '@/lib/events';
import { useTranslatedExercise } from '@/hooks/useTranslatedExercise';
import styles from './RoutineCard.module.css';
import { cx } from '@/lib/cx';

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
    <div className={styles.lockedTooltipBox} style={{ opacity: readonly ? 0.7 : 1 }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={styles.lockedTooltipRow}
      >
        <div className={styles.lockedTooltipRow2}>
          <span className={styles.label} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
          <div>
            <h3 className={styles.lockedTooltipSubheading}>
              {routine.title}
              {readonly && (
                <span className={styles.lockedTooltipLabel}>
                  {t('lockedTooltip').toUpperCase()}
                </span>
              )}
            </h3>
            {readonly && (
              <p className={styles.lockedDescriptionText}>
                {t('lockedDescription')}
              </p>
            )}
            <p className={styles.exerciseCountText}>
              {t('exerciseCount', { count: displayCount })}
            </p>
          </div>
        </div>

        <div className={styles.lockedTooltipRow3} onClick={e => e.stopPropagation()}>
          <button
            data-onboarding="routines-06"
            title={readonly ? t('lockedTooltip') : undefined}
            onClick={(e) => {
              if (readonly) {
                e.stopPropagation();
                return;
              }
              emitAppEvent(APP_EVENTS.PLAY_ROUTINE);
              router.push(`/practice?routine=${routine.id}`);
            }}
            className={cx(styles.lockedTooltipButton, readonly && styles.playReadonly)}
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
        <div className={styles.loadingBox}>
          {routine.description && (
            <p className={styles.text}>
              {routine.description}
            </p>
          )}

          <ul className={styles.loadingList}>
            {loadingExercises ? (
              <li className={styles.loadingItem}>{t('loading')}</li>
            ) : exerciseTitles.length > 0 ? (
              exerciseTitles.map((title, i) => (
                <li key={i} className={styles.item}>
                  <span className={styles.loadingListLabel}>•</span>
                  {title}
                </li>
              ))
            ) : (
              <li className={styles.loadingItem}>{t('empty')}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}