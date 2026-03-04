"use client";

import React from 'react';
import { Exercise } from '../../lib/types';
import { DIFFICULTY_COLORS } from '../../lib/constants';
import { useState } from 'react';

interface ExerciseCardProps {
  file: Exercise;
  currentBpm?: number;
  onEdit: (exercise: Exercise) => void;
  onHistory: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
}

export function ExerciseCard({ file, currentBpm, onEdit, onHistory, onDelete }: ExerciseCardProps) {
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
      background: 'var(--surface)', padding: '1.4rem', borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.05)', display: 'flex',
      flexDirection: 'column', gap: '0.85rem', transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(220,185,138,0.2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '1rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={file.title}>
          {file.title}
        </h3>
        <span style={{
          background: DIFFICULTY_COLORS[diff] + '22', color: DIFFICULTY_COLORS[diff],
          border: `1px solid ${DIFFICULTY_COLORS[diff]}44`,
          borderRadius: '4px', padding: '0.15rem 0.5rem', fontSize: '0.72rem',
          fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
        }}>Nv. {diff}</span>
      </div>

      {cats.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {cats.slice(0, 3).map(cat => (
            <span key={cat} style={{ background: 'rgba(220,185,138,0.1)', color: 'var(--gold)', borderRadius: '20px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 600 }}>{cat}</span>
          ))}
          {cats.length > 3 && <span style={{ color: 'var(--muted)', fontSize: '0.72rem', padding: '0.2rem 0.3rem' }}>+{cats.length - 3}</span>}
        </div>
      )}

      {(activeBpm || file.bpm_goal) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)' }}>
            {activeBpm ? (
              <span>▶ <strong style={{ color: 'var(--text)' }}>{activeBpm}</strong> {isCurrent ? 'act.' : isSuggested ? 'sug.' : 'inc.'}</span>
            ) : <span />}
            {file.bpm_goal && <span>🎯 <strong style={{ color: 'var(--text)' }}>{file.bpm_goal}</strong> obj.</span>}
          </div>
          {hasProgressBpms && (
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: 'var(--gold)',
                width: `${progressPercent}%`,
                borderRadius: '3px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          )}
        </div>
      )}

      {file.notes && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {file.notes}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', width: '100%', position: 'relative' }}>
        {file.file_url ? (
          <button
            onClick={() => window.location.href = `/practice?file=${encodeURIComponent(file.file_url!)}`}
            style={{
              flex: 1,
              background: 'var(--gold)',
              color: '#111',
              border: 'none',
              padding: '0.7rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
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
            style={{ flex: 1, position: 'relative' }}
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
                width: '100%',
                background: '#2a2a2a',
                color: '#555',
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '0.7rem',
                borderRadius: '6px',
                cursor: 'not-allowed',
                fontSize: '0.9rem',
                fontWeight: 700,
                fontFamily: 'DM Sans, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.03em'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 3l16 9-16 9V3z" />
              </svg>
              Tocar
              <svg
                width="16" height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff4444"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
                zIndex: 10,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                pointerEvents: 'none',
                animation: 'fadeIn 0.2s ease-out'
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

        <button
          onClick={() => onEdit(file)}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            color: 'var(--muted)',
            border: '1px solid rgba(255,255,255,0.08)',
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.borderColor = 'rgba(220,185,138,0.4)'; e.currentTarget.style.background = 'rgba(220,185,138,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          title="Editar"
        >
          <svg style={{ transform: 'scale(1.8)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        <button
          onClick={() => onHistory(file)}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            color: 'var(--muted)',
            border: '1px solid rgba(255,255,255,0.08)',
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#60a5fa'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)'; e.currentTarget.style.background = 'rgba(96,165,250,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          title="Historial de Práctica"
        >
          <svg style={{ transform: 'scale(1.8)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>

        <button
          onClick={() => onDelete(file)}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            color: 'var(--muted)',
            border: '1px solid rgba(255,255,255,0.08)',
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ff4444'; e.currentTarget.style.borderColor = 'rgba(255,68,68,0.4)'; e.currentTarget.style.background = 'rgba(255,68,68,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          title="Eliminar"
        >
          <svg style={{ transform: 'scale(1.8)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div >
  );
}