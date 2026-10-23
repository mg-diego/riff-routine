"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Routine } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { formatClock } from '@/lib/utils';
import styles from './RoutineHeader.module.css';

interface RoutineHeaderProps {
  routine: Routine;
  totalDuration: number;
  exerciseCount: number;
  onAddClick: () => void;
  onUpdateRoutine?: (field: 'title' | 'description', value: string) => void;
}

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

function EditableField({
  value,
  onSave,
  as = 'h1',
  placeholder,
  style,
  inputStyle,
}: {
  value: string;
  onSave: (val: string) => void;
  as?: 'h1' | 'p';
  placeholder?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  const startEdit = () => { setDraft(value); setIsEditing(true); };

  const commit = () => {
    setIsEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && as === 'h1') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setDraft(value); setIsEditing(false); }
  };

  useEffect(() => {
    if (isEditing) (inputRef.current as HTMLElement)?.focus();
  }, [isEditing]);

  if (isEditing) {
    const sharedStyle: React.CSSProperties = {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(220,185,138,0.4)',
      borderRadius: '6px',
      outline: 'none',
      color: 'inherit',
      fontFamily: 'inherit',
      fontSize: 'inherit',
      fontWeight: 'inherit',
      lineHeight: 'inherit',
      padding: '0.15em 0.4em',
      width: '100%',
      resize: 'none',
      ...inputStyle,
    };

    return as === 'h1' ? (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={sharedStyle}
      />
    ) : (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        rows={2}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={styles.textarea} style={{ ...sharedStyle }}
      />
    );
  }

  const Tag = as;
  return (
    <Tag
      className={styles.editable}
      style={{ ...style, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}
      onClick={startEdit}
    >
      <span>{value || <span className={styles.label}>{placeholder}</span>}</span>
      <span className={styles.editableLabel}>
        <PencilIcon />
      </span>
    </Tag>
  );
}

export function RoutineHeader({ routine, totalDuration, exerciseCount, onAddClick, onUpdateRoutine }: RoutineHeaderProps) {
  const router = useRouter();
  const t = useTranslations('RoutineHeader');

  return (
    <>
      <button onClick={() => router.push('/routines')} className={styles.backButton}>
        {t('back')}
      </button>

      <div className={styles.titlePlaceholderRow}>
        <div className={styles.titlePlaceholder}>
          <EditableField
            as="h1"
            value={routine.title}
            placeholder={t('titlePlaceholder')}
            onSave={val => onUpdateRoutine?.('title', val)}
            style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}
            inputStyle={{ fontFamily: 'var(--font-display), sans-serif', fontSize: '3rem', color: 'var(--gold)', letterSpacing: '0.02em' }}
          />

          <EditableField
            as="p"
            value={routine.description || ''}
            placeholder={t('descriptionPlaceholder')}
            onSave={val => onUpdateRoutine?.('description', val)}
            style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.95rem', fontFamily: 'var(--font-body), sans-serif', fontWeight: 'normal' }}
            inputStyle={{ color: 'var(--muted)', fontSize: '0.95rem' }}
          />

          <div className={styles.estimatedTimeRow}>
            <span className={styles.estimatedTimeLabel}>
              {t('estimatedTime')} <strong className={styles.strong}>{formatClock(totalDuration)}</strong>
            </span>
            <span className={styles.estimatedTimeLabel}>
              {t('exercisesCount')} <strong className={styles.strong}>{exerciseCount}</strong>
            </span>
          </div>
        </div>

        <div className={styles.addExerciseRow}>
          <button onClick={onAddClick} className={styles.addExerciseButton}>
            {t('addExercise')}
          </button>
        </div>
      </div>
    </>
  );
}