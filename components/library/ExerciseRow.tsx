"use client";

import React, { useState } from 'react';
import { Exercise } from '../../lib/types';
import { DIFFICULTY_COLORS } from '../../lib/constants';
import { DeleteButton } from '../ui/DeleteButton';
import { HistoryButton } from '../ui/HistoryButton';
import { EditButton } from '../ui/EditButton';

interface ExerciseRowProps {
  file: Exercise;
  currentBpm?: number;
  onEdit: (exercise: Exercise) => void;
  onHistory: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
}

export function ExerciseRow({ file, currentBpm, onEdit, onHistory, onDelete }: ExerciseRowProps) {
  const cats = file.technique ? file.technique.split(', ') : [];
  const diff = file.difficulty || 1;

  const activeBpm = currentBpm || file.bpm_suggested || file.bpm_initial;
  const isCurrent = !!currentBpm;
  const isSuggested = !currentBpm && !!file.bpm_suggested;

  const hasProgressBpms = activeBpm && file.bpm_goal;
  const progressPercent = hasProgressBpms ? Math.min(100, (activeBpm! / file.bpm_goal!) * 100) : 0;
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  return (
    <div style={{
      background: 'var(--surface)', padding: '1rem 1.5rem', borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.05)', display: 'flex',
      alignItems: 'center', gap: '1.5rem', transition: 'border-color 0.2s',
      flexWrap: 'wrap'
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(220,185,138,0.2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
    >
      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <h3 style={{ color: 'var(--text)', margin: '0 0 0.4rem 0', fontSize: '1rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.title}>
          {file.title}
        </h3>
        <span style={{
          background: DIFFICULTY_COLORS[diff] + '22', color: DIFFICULTY_COLORS[diff],
          border: `1px solid ${DIFFICULTY_COLORS[diff]}44`,
          borderRadius: '4px', padding: '0.15rem 0.5rem', fontSize: '0.72rem',
          fontWeight: 700, whiteSpace: 'nowrap',
        }}>Nv. {diff}</span>
      </div>

      <div style={{ flex: '1 1 200px', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
        {cats.slice(0, 3).map(cat => (
          <span key={cat} style={{ background: 'rgba(220,185,138,0.1)', color: 'var(--gold)', borderRadius: '20px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 600 }}>{cat}</span>
        ))}
        {cats.length > 3 && <span style={{ color: 'var(--muted)', fontSize: '0.72rem', padding: '0.2rem 0.3rem' }}>+{cats.length - 3}</span>}
      </div>

      <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {(activeBpm || file.bpm_goal) && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)' }}>
              {activeBpm ? (
                <span>▶ <strong style={{ color: 'var(--text)' }}>{activeBpm}</strong> {isCurrent ? 'act.' : isSuggested ? 'sug.' : 'inc.'}</span>
              ) : <span />}
              {file.bpm_goal && <span>🎯 <strong style={{ color: 'var(--text)' }}>{file.bpm_goal}</strong> obj.</span>}
            </div>
            {hasProgressBpms && (
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--gold)', width: `${progressPercent}%`, borderRadius: '3px', transition: 'width 0.3s ease' }} />
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ flex: '0 0 auto', display: 'flex', gap: '0.6rem', marginLeft: 'auto', alignItems: 'center' }}>
        {file.file_url ? (
          <button
            onClick={() => window.location.href = `/practice?file=${encodeURIComponent(file.file_url!)}`}
            style={{
              background: 'var(--gold)',
              color: '#111',
              border: 'none',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textTransform: 'uppercase',
              height: '42px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dark)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 3l16 9-16 9V3z" />
            </svg>
            Tocar
          </button>
        ) : (
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setShowTooltip(file.id)}
            onMouseLeave={() => setShowTooltip(null)}
            onClick={() => {
              setShowTooltip(file.id);
              setTimeout(() => setShowTooltip(null), 2000);
            }}
          >
            <button
              disabled
              style={{
                background: '#2a2a2a',
                color: '#555',
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                cursor: 'not-allowed',
                fontSize: '0.9rem',
                fontWeight: 700,
                fontFamily: 'DM Sans, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textTransform: 'uppercase',
                height: '42px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 3l16 9-16 9V3z" />
              </svg>
              Tocar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </button>

            {showTooltip === file.id && (
              <div style={{
                position: 'absolute',
                bottom: '125%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#ff4444',
                color: 'white',
                padding: '0.5rem 0.8rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                zIndex: 100,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                pointerEvents: 'none'
              }}>
                Pendiente subir el fichero .gp
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderWidth: '6px',
                  borderStyle: 'solid',
                  borderColor: '#ff4444 transparent transparent transparent'
                }} />
              </div>
            )}
          </div>
        )}

        <EditButton onClick={() => onEdit(file)} />

        <HistoryButton onClick={() => onHistory(file)} />

        <DeleteButton onClick={() => onDelete(file)} />
      </div>
    </div>
  );
}