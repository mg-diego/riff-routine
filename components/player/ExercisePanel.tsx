"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Exercise } from '../../lib/types';

interface ExercisePanelProps {
  exercise: Exercise;
  onBpmChange?: (bpmCurrent: number | null, bpmGoal: number | null) => void;
}

const DIFFICULTY_COLORS: Record<number, string> = {
  1: '#4ade80', 2: '#a3e635', 3: '#facc15', 4: '#fb923c', 5: '#f87171'
};
const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Principiante', 2: 'Básico', 3: 'Intermedio', 4: 'Avanzado', 5: 'Experto'
};

export function ExercisePanel({ exercise, onBpmChange }: ExercisePanelProps) {
  const [bpmCurrent, setBpmCurrent] = useState<string>('');
  const [bpmGoal,    setBpmGoal]    = useState<string>('');
  const [isSaving,   setIsSaving]   = useState(false);
  const [saved,      setSaved]      = useState(false);

  // Sync when exercise changes (routine navigation)
  useEffect(() => {
    setBpmCurrent(exercise.bpm_current?.toString() || exercise.bpm_initial?.toString() || '');
    setBpmGoal(exercise.bpm_goal?.toString() || '');
  }, [exercise.id]);

  // Notify parent on every change so PlayerHeader stays in sync
  useEffect(() => {
    onBpmChange?.(
      bpmCurrent ? parseInt(bpmCurrent) : null,
      bpmGoal    ? parseInt(bpmGoal)    : null,
    );
  }, [bpmCurrent, bpmGoal]);

  const saveBpms = async () => {
    setIsSaving(true);
    await supabase.from('exercises').update({
      bpm_current: bpmCurrent ? parseInt(bpmCurrent) : null,
      bpm_goal:    bpmGoal    ? parseInt(bpmGoal)    : null,
    }).eq('id', exercise.id);
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const cats = exercise.technique ? exercise.technique.split(', ') : [];
  const diff = exercise.difficulty;
  const diffColor = diff ? DIFFICULTY_COLORS[diff] : null;

  return (
    <div style={{
      background: 'var(--surface)', margin: '1.5rem 0',
      borderRadius: '12px', border: '1px solid rgba(220,185,138,0.15)',
      overflow: 'hidden',
    }}>
      {/* Top strip */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap',
      }}>
        {/* Title + meta */}
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <h2 style={{ color: 'var(--gold)', margin: 0, fontSize: '1.3rem', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.04em' }}>
              {exercise.title}
            </h2>
            {diff && diffColor && (
              <span style={{
                background: diffColor + '22', color: diffColor,
                border: `1px solid ${diffColor}44`,
                borderRadius: '4px', padding: '0.1rem 0.5rem',
                fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
              }}>
                {DIFFICULTY_LABELS[diff]}
              </span>
            )}
          </div>

          {/* Categories */}
          {cats.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
              {cats.map(cat => (
                <span key={cat} style={{
                  background: 'rgba(220,185,138,0.08)', color: 'var(--gold)',
                  borderRadius: '20px', padding: '0.15rem 0.6rem',
                  fontSize: '0.7rem', fontWeight: 600,
                }}>{cat}</span>
              ))}
            </div>
          )}

          {/* Notes */}
          {exercise.notes ? (
            <p style={{
              color: 'var(--text)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0,
              padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)',
              borderRadius: '6px', borderLeft: '3px solid rgba(220,185,138,0.4)',
            }}>
              {exercise.notes}
            </p>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0, fontStyle: 'italic' }}>
              Sin notas para este ejercicio.
            </p>
          )}
        </div>

        {/* BPM panel — única fuente de verdad */}
        <div style={{
          flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: '0.85rem',
          background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(220,185,138,0.5)' }}>
            Progreso BPM
          </p>

          {/* BPM inicial (readonly) */}
          {exercise.bpm_initial && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inicial</span>
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: '#7dd3fc', letterSpacing: '0.04em' }}>
                {exercise.bpm_initial} BPM
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
                BPM Actual
              </label>
              <input
                type="number" value={bpmCurrent}
                onChange={e => setBpmCurrent(e.target.value)}
                style={{
                  width: '100%', padding: '0.5rem 0.6rem', boxSizing: 'border-box',
                  background: 'rgba(220,185,138,0.06)', border: '1px solid rgba(220,185,138,0.2)',
                  color: '#dcb98a', borderRadius: '6px', fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '1.1rem', textAlign: 'center', outline: 'none',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
                BPM Meta
              </label>
              <input
                type="number" value={bpmGoal}
                onChange={e => setBpmGoal(e.target.value)}
                style={{
                  width: '100%', padding: '0.5rem 0.6rem', boxSizing: 'border-box',
                  background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)',
                  color: '#a78bfa', borderRadius: '6px', fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '1.1rem', textAlign: 'center', outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            onClick={saveBpms} disabled={isSaving}
            style={{
              background: saved ? 'rgba(74,222,128,0.1)' : 'transparent',
              color: saved ? '#4ade80' : 'var(--gold)',
              border: `1px solid ${saved ? 'rgba(74,222,128,0.4)' : 'rgba(220,185,138,0.3)'}`,
              padding: '0.5rem', borderRadius: '6px', cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '0.82rem', fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.2s',
            }}
          >
            {isSaving ? 'Guardando…' : saved ? '✓ Guardado' : '💾 Guardar progreso'}
          </button>
        </div>
      </div>
    </div>
  );
}