"use client";

import React from 'react';
import { Exercise } from '@/lib/types';
import { DIFFICULTY_COLORS } from '@/lib/constants';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { HistoryButton } from '@/components/ui/HistoryButton';
import { EditButton } from '@/components/ui/EditButton';
import { useTranslations } from 'next-intl';
import { APP_EVENTS, emitAppEvent } from '@/lib/events';
import styles from './ExerciseRow.module.css';
import { cx } from '@/lib/cx';

interface ExerciseRowProps {
  file: Exercise;
  currentBpm?: number;
  onEdit: (exercise: Exercise) => void;
  onHistory: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
  readonly?: boolean;
}

export function ExerciseRow({ file, currentBpm, onEdit, onHistory, onDelete, readonly = false }: ExerciseRowProps) {
  const t = useTranslations('ExerciseRow');

  const isFromSystem = !!file.forked_from;
  const cats = file.technique ? file.technique.split(', ') : [];
  const diff = file.difficulty || 1;

  const activeBpm = currentBpm || file.bpm_suggested;
  const isCurrent = !!currentBpm;
  const isSuggested = !currentBpm && !!file.bpm_suggested;

  const hasProgressBpms = activeBpm && file.bpm_goal;
  const progressPercent = hasProgressBpms ? Math.min(100, (activeBpm! / file.bpm_goal!) * 100) : 0;

  const missingFile = !file.file_url;

  return (
    <div className={cx(styles.noFileRow, missingFile && styles.missing, readonly && styles.readonly)}>
      {missingFile && (
        <div className={styles.layer} />
      )}

      <div className={styles.noFile}>
        {/* Fila 1: Icono y Título */}
        <div className={styles.noFileRow2}>
          {missingFile && (
            <div title={t('noFile')} className={styles.noFileRow3}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
          )}
          <h3 className={styles.subheading} title={file.title}>
            {file.title}
          </h3>
        </div>

        {/* Fila 2: Badges (Dificultad + Sistema/Locked) */}
        <div className={styles.levelRow}>
          {/* Chip de Nivel */}
          <span className={styles.levelLabel} style={{ background: DIFFICULTY_COLORS[diff] + '15', color: DIFFICULTY_COLORS[diff], border: `1px solid ${DIFFICULTY_COLORS[diff]}30` }}>{t('level', { level: diff })}</span>

          {/* Chip de Sistema (Violeta) */}
          {isFromSystem && (
            <span className={styles.systemBadgeLabel}>
              {t('systemBadge')}
            </span>
          )}

          {/* Chip de Locked (Solo si readonly es true) */}
          {readonly && (
            <span className={styles.lockedBadgeLabel}>
              {t('lockedBadge')}
            </span>
          )}
        </div>

        {readonly && (
          <p className={styles.lockedDescriptionText}>
            {t('lockedDescription')}
          </p>
        )}
      </div>

      <div className={styles.row}>
        {cats.slice(0, 3).map(cat => (
          <span key={cat} className={styles.label}>
            {cat}
          </span>
        ))}
        {cats.length > 3 && <span className={styles.noFileRowLabel}>+{cats.length - 3}</span>}
      </div>

      <div className={styles.currentStack}>
        {(activeBpm || file.bpm_goal) && (
          <div className={styles.currentBox}>
            <div className={styles.currentRow} style={{ marginBottom: hasProgressBpms ? '0.4rem' : 0 }}>
              {activeBpm ? (
                <div className={styles.currentRow2}>
                  <span className={styles.currentRowLabel}>▶</span>
                  <span>
                    <strong className={styles.strong}>{activeBpm}</strong> {isCurrent ? t('bpmStatus.current') : isSuggested ? t('bpmStatus.suggested') : t('bpmStatus.initial')}
                  </span>
                </div>
              ) : <span />}
              {file.bpm_goal && (
                <div className={styles.currentRow2}>
                  <span className={styles.label4}>🎯</span>
                  <span>
                    <strong className={styles.strong}>{file.bpm_goal}</strong> {t('goal')}
                  </span>
                </div>
              )}
            </div>
            {hasProgressBpms && (
              <div className={styles.box}>
                <div className={styles.block} style={{ background: `linear-gradient(90deg, var(--gold), ${progressPercent >= 100 ? '#4ade80' : '#c9a676'})`, width: `${progressPercent}%` }} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.lockedTooltipRow}>

        <button
          data-onboarding="library-10"
          title={readonly ? t('lockedTooltip') : undefined}
          onClick={(e) => {
            if (readonly) {
              e.preventDefault();
              return;
            }
            emitAppEvent(APP_EVENTS.PLAY_EXERCISE);
            if (file.file_url) {
              window.location.href = `/practice?file=${encodeURIComponent(file.file_url)}`;
            } else {
              window.location.href = `/practice?id=${file.id}`;
            }
          }}
          className={cx(styles.lockedTooltipButton, readonly ? styles.playReadonly : missingFile && styles.playMissing)}
        >
          {missingFile ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 3h7l3 18h-13z" /><path d="M12 21l4.5-16" /><circle cx="14.25" cy="13" r="2.5" fill="currentColor" stroke="none" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4l14 8-14 8V4z" />
            </svg>
          )}
          {missingFile ? t('freePractice') : t('play')}
        </button>

        <div
          title={readonly ? t('lockedTooltip') : undefined}
          className={styles.lockedTooltipRow2} style={{ opacity: readonly ? 0.3 : 1, cursor: readonly ? 'not-allowed' : 'pointer', filter: readonly ? 'grayscale(1)' : 'none' }}
          onClick={(e) => {
            if (readonly) {
              e.stopPropagation();
            } else {
              onEdit(file);
            }
          }}
        >
          <div style={{ pointerEvents: readonly ? 'none' : 'auto' }}>
            <EditButton onClick={() => { }} />
          </div>
        </div>

        <HistoryButton onClick={() => onHistory(file)} />
        <DeleteButton onClick={() => onDelete(file)} />
      </div>
    </div>
  );
}