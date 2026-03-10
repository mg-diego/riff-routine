"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Routine } from '../../../lib/types';

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
  const [isHovered, setIsHovered] = useState(false);
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
        style={{ ...sharedStyle, display: 'block' }}
      />
    );
  }

  const Tag = as;
  return (
    <Tag
      style={{ ...style, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={startEdit}
    >
      <span>{value || <span style={{ opacity: 0.35 }}>{placeholder}</span>}</span>
      <span style={{
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.15s',
        color: 'rgba(220,185,138,0.6)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
      }}>
        <PencilIcon />
      </span>
    </Tag>
  );
}

export function RoutineHeader({ routine, totalDuration, exerciseCount, onAddClick, onUpdateRoutine }: RoutineHeaderProps) {
  const router = useRouter();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <button onClick={() => router.push('/routines')} style={{ background: 'transparent', color: 'var(--muted)', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem' }}>
        ← Volver a Mis Rutinas
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <EditableField
            as="h1"
            value={routine.title}
            placeholder="Nombre de la rutina"
            onSave={val => onUpdateRoutine?.('title', val)}
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}
            inputStyle={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', letterSpacing: '0.02em' }}
          />

          <EditableField
            as="p"
            value={routine.description || ''}
            placeholder="Sin descripción — click para añadir"
            onSave={val => onUpdateRoutine?.('description', val)}
            style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.95rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 'normal' }}
            inputStyle={{ color: 'var(--muted)', fontSize: '0.95rem' }}
          />

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text)' }}>
              ⏱️ Tiempo estimado: <strong style={{ color: 'var(--gold)' }}>{formatTime(totalDuration)}</strong>
            </span>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text)' }}>
              🎸 Ejercicios: <strong style={{ color: 'var(--gold)' }}>{exerciseCount}</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={onAddClick} style={{ background: 'transparent', color: 'var(--text)', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            + Añadir Ejercicio
          </button>
        </div>
      </div>
    </>
  );
}