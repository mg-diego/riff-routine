"use client";

import React from 'react';
import { Exercise } from '../../lib/types';
import { DIFFICULTY_COLORS } from '../../lib/constants';

interface ExerciseCardProps {
  file: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
}

export function ExerciseCard({ file, onEdit, onDelete }: ExerciseCardProps) {
  const cats = file.technique ? file.technique.split(', ') : [];
  const diff = file.difficulty || 1;
  
  const hasProgressBpms = file.bpm_current && file.bpm_goal;
  const progressPercent = hasProgressBpms ? Math.min(100, (file.bpm_current! / file.bpm_goal!) * 100) : 0;

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

      {(file.bpm_initial || file.bpm_current || file.bpm_goal) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)' }}>
            {file.bpm_current ? (
              <span>▶ <strong style={{ color: 'var(--text)' }}>{file.bpm_current}</strong> act.</span>
            ) : file.bpm_initial ? (
              <span>▶ <strong style={{ color: 'var(--text)' }}>{file.bpm_initial}</strong> inc.</span>
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

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.25rem' }}>
        {file.file_url ? (
          <button
            onClick={() => window.location.href = `/practice?file=${encodeURIComponent(file.file_url!)}`}
            style={{ flex: 1, background: 'var(--gold)', color: '#111', border: 'none', padding: '0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, fontFamily: 'DM Sans, sans-serif', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dark)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}
          >▶ Tocar</button>
        ) : (
          <button
            onClick={() => window.location.href = `/practice?mode=free`}
            style={{ flex: 1, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, fontFamily: 'DM Sans, sans-serif', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}
          >▶ Libre</button>
        )}

        <button
          onClick={() => onEdit(file)}
          style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.6rem 0.75rem', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.borderColor = 'rgba(220,185,138,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          title="Editar"
        >✏️</button>

        <button
          onClick={() => onDelete(file)}
          style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.6rem 0.75rem', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#e74c3c'; e.currentTarget.style.borderColor = 'rgba(231,76,60,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          title="Eliminar"
        >🗑</button>
      </div>
    </div>
  );
}