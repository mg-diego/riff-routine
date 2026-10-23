"use client";

import React, { useState } from 'react';
import { Exercise } from '@/lib/types';
import { DIFFICULTY_COLORS } from '@/lib/constants';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { EditButton } from '@/components/ui/EditButton';
import { HistoryButton } from '@/components/ui/HistoryButton';
import { useTranslations } from 'next-intl';
import styles from './ExerciseCard.module.css';
import { cx } from '@/lib/cx';

interface ExerciseCardProps {
  file: Exercise;
  currentBpm?: number;
  onEdit: (exercise: Exercise) => void;
  onHistory: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
  readonly?: boolean;
}

export function ExerciseCard({ file, currentBpm, onEdit, onHistory, onDelete, readonly = false }: ExerciseCardProps) {
  const t = useTranslations('ExerciseRow');
  
  const cats = file.technique ? file.technique.split(', ') : [];
  const diff = file.difficulty || 1;
  const isFromSystem = !!file.forked_from;

  const activeBpm = currentBpm || file.bpm_suggested;
  const isCurrent = !!currentBpm;
  const isSuggested = !currentBpm && !!file.bpm_suggested;

  const hasProgressBpms = activeBpm && file.bpm_goal;
  const progressPercent = hasProgressBpms ? Math.min(100, (activeBpm! / file.bpm_goal!) * 100) : 0;

  const missingFile = !file.file_url;

  return (
    <div className={cx(styles.noFileStack, missingFile && styles.missing, readonly && styles.readonly)}>
      {missingFile && (
        <div className={styles.layer} />
      )}

      {/* Título y Header */}
      <div className={styles.noFileStack2}>
        <div className={styles.noFileRow}>
          {missingFile && (
            <div title={t('noFile')} className={styles.noFileRow2}>
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

        {/* Badges de Metadatos */}
        <div className={styles.levelRow}>
          <span className={styles.levelLabel} style={{ background: DIFFICULTY_COLORS[diff] + '15', color: DIFFICULTY_COLORS[diff], border: `1px solid ${DIFFICULTY_COLORS[diff]}30` }}>{t('level', { level: diff })}</span>

          {isFromSystem && (
            <span className={styles.systemBadgeLabel}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {t('systemBadge')}
            </span>
          )}
        </div>
      </div>

      {readonly && (
        <div className={styles.lockedBadgeBox}>
          <span className={styles.lockedBadgeLabel}>
            {t('lockedBadge')}
          </span>
          <p className={styles.lockedDescriptionText}>
            {t('lockedDescription')}
          </p>
        </div>
      )}

      {/* Categorías */}
      {cats.length > 0 && (
        <div className={styles.row}>
          {cats.slice(0, 3).map(cat => (
            <span key={cat} className={styles.label}>
              {cat}
            </span>
          ))}
          {cats.length > 3 && <span className={styles.noFileStackLabel}>+{cats.length - 3}</span>}
        </div>
      )}

      {/* Progress & BPM Section */}
      {(activeBpm || file.bpm_goal) && (
        <div className={styles.currentBox}>
          <div className={styles.currentRow} style={{ marginBottom: hasProgressBpms ? '0.6rem' : 0 }}>
            <div className={styles.currentRow2}>
              <span className={styles.currentRowLabel}>▶</span>
              <span>
                <strong className={styles.strong}>{activeBpm || '--'}</strong> {isCurrent ? t('bpmStatus.current') : isSuggested ? t('bpmStatus.suggested') : t('bpmStatus.initial')}
              </span>
            </div>
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

      {file.notes && (
        <p className={styles.text}>
          "{file.notes}"
        </p>
      )}

      {/* Action Buttons */}
      <div className={styles.lockedTooltipRow}>
        
        <div className={styles.lockedTooltip}>
          <button
            title={readonly ? t('lockedTooltip') : undefined}
            onClick={(e) => {
              if (readonly) {
                e.preventDefault();
                return;
              }
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
        </div>

        {/* Lógica de Deshabilitado para EditButton */}
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
            <EditButton onClick={() => {}} />
          </div>
        </div>
        
        <HistoryButton onClick={() => onHistory(file)} />
        <DeleteButton onClick={() => onDelete(file)} />
      </div>
    </div>
  );
}