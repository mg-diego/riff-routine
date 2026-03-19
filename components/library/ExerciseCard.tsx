"use client";

import React, { useState } from 'react';
import { Exercise } from '../../lib/types';
import { DIFFICULTY_COLORS } from '../../lib/constants';
import { DeleteButton } from '../ui/DeleteButton';
import { EditButton } from '../ui/EditButton';
import { HistoryButton } from '../ui/HistoryButton';
import { useTranslations } from 'next-intl';

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
    <div style={{
      background: 'var(--surface)',
      padding: '1.4rem',
      borderRadius: '12px',
      border: `1px solid ${missingFile ? 'rgba(231,76,60,0.15)' : 'rgba(255,255,255,0.05)'}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      transition: 'all 0.2s',
      position: 'relative',
      overflow: 'hidden',
      opacity: readonly ? 0.7 : 1
    }}
      onMouseEnter={e => !readonly && (e.currentTarget.style.borderColor = missingFile ? 'rgba(231,76,60,0.4)' : 'rgba(220,185,138,0.3)')}
      onMouseLeave={e => !readonly && (e.currentTarget.style.borderColor = missingFile ? 'rgba(231,76,60,0.15)' : 'rgba(255,255,255,0.05)')}
    >
      {missingFile && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, rgba(231,76,60,0.8), transparent)'
        }} />
      )}

      {/* Título y Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
          {missingFile && (
            <div title={t('noFile')} style={{ color: '#e74c3c', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
          )}
          <h3 style={{
            color: 'var(--text)',
            margin: 0,
            fontSize: '1.05rem',
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'DM Sans, sans-serif'
          }} title={file.title}>
            {file.title}
          </h3>
        </div>

        {/* Badges de Metadatos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{
            background: DIFFICULTY_COLORS[diff] + '15',
            color: DIFFICULTY_COLORS[diff],
            border: `1px solid ${DIFFICULTY_COLORS[diff]}30`,
            borderRadius: '6px',
            padding: '0.2rem 0.5rem',
            fontSize: '0.72rem',
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}>{t('level', { level: diff })}</span>

          {isFromSystem && (
            <span style={{
              fontSize: '0.55rem',
              letterSpacing: '0.05em',
              background: 'rgba(167, 139, 250, 0.15)',
              padding: '0.15rem 0.4rem',
              borderRadius: '4px',
              color: '#a78bfa',
              border: '1px solid rgba(167, 139, 250, 0.2)',
              fontWeight: 800,
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {t('systemBadge')}
            </span>
          )}
        </div>
      </div>

      {readonly && (
        <div style={{
          background: 'rgba(255,193,7,0.1)',
          border: '1px solid rgba(255,193,7,0.2)',
          padding: '0.5rem',
          borderRadius: '6px'
        }}>
          <span style={{
            display: 'block',
            fontSize: '0.7rem',
            color: 'var(--gold)',
            fontWeight: 'bold',
            marginBottom: '0.2rem'
          }}>
            {t('lockedBadge')}
          </span>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--gold)', opacity: 0.8 }}>
            {t('lockedDescription')}
          </p>
        </div>
      )}

      {/* Categorías */}
      {cats.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {cats.slice(0, 3).map(cat => (
            <span key={cat} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--muted)',
              borderRadius: '4px',
              padding: '0.25rem 0.6rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {cat}
            </span>
          ))}
          {cats.length > 3 && <span style={{ color: 'var(--muted)', fontSize: '0.72rem', padding: '0.2rem 0.3rem', fontWeight: 600 }}>+{cats.length - 3}</span>}
        </div>
      )}

      {/* Progress & BPM Section */}
      {(activeBpm || file.bpm_goal) && (
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: hasProgressBpms ? '0.6rem' : 0, fontWeight: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ color: 'var(--gold)' }}>▶</span>
              <span>
                <strong style={{ color: 'var(--text)', fontSize: '0.9rem' }}>{activeBpm || '--'}</strong> {isCurrent ? t('bpmStatus.current') : isSuggested ? t('bpmStatus.suggested') : t('bpmStatus.initial')}
              </span>
            </div>
            {file.bpm_goal && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ color: '#a78bfa' }}>🎯</span>
                <span>
                  <strong style={{ color: 'var(--text)', fontSize: '0.9rem' }}>{file.bpm_goal}</strong> {t('goal')}
                </span>
              </div>
            )}
          </div>
          {hasProgressBpms && (
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: `linear-gradient(90deg, var(--gold), ${progressPercent >= 100 ? '#4ade80' : '#c9a676'})`,
                width: `${progressPercent}%`,
                borderRadius: '4px',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>
          )}
        </div>
      )}

      {file.notes && (
        <p style={{
          margin: 0,
          fontSize: '0.82rem',
          color: 'var(--muted)',
          lineHeight: 1.5,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          fontStyle: 'italic'
        }}>
          "{file.notes}"
        </p>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', width: '100%', alignItems: 'center' }}>
        
        <div style={{ flex: 1, position: 'relative' }}>
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
            style={{
              width: '100%',
              background: readonly ? 'rgba(255,255,255,0.05)' : (missingFile ? 'rgba(255,255,255,0.05)' : 'var(--gold)'),
              color: readonly ? 'var(--muted)' : (missingFile ? 'var(--text)' : '#111'),
              border: readonly || missingFile ? '1px solid rgba(255,255,255,0.1)' : 'none',
              padding: '0.7rem',
              borderRadius: '8px',
              cursor: readonly ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: 800,
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              opacity: readonly ? 0.5 : 1
            }}
            onMouseEnter={e => {
              if (readonly) return;
              e.currentTarget.style.background = missingFile ? 'rgba(255,255,255,0.1)' : '#c9a676';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              if (readonly) return;
              e.currentTarget.style.background = missingFile ? 'rgba(255,255,255,0.05)' : 'var(--gold)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
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
          style={{ 
            opacity: readonly ? 0.3 : 1, 
            cursor: readonly ? 'not-allowed' : 'pointer',
            filter: readonly ? 'grayscale(1)' : 'none',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center'
          }}
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