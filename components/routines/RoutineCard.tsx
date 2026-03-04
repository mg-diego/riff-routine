"use client";

import React, { useState, useEffect } from 'react';
import { Routine } from '../../lib/types';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { DeleteButton } from '../ui/DeleteButton';
import { EditButton } from '../ui/EditButton';
import { HistoryButton } from '../ui/HistoryButton';

interface RoutineCardProps {
  routine: Routine;
  onDelete: (routine: Routine) => void;
}

export function RoutineCard({ routine, onDelete }: RoutineCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [exerciseTitles, setExerciseTitles] = useState<string[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  useEffect(() => {
    if (isOpen && exerciseTitles.length === 0) {
      fetchExercisePreview();
    }
  }, [isOpen]);

  const fetchExercisePreview = async () => {
    setLoadingExercises(true);
    const { data } = await supabase
      .from('routine_exercises')
      .select('exercises(title)')
      .eq('routine_id', routine.id)
      .order('order_index', { ascending: true });

    if (data) {
      const titles = data.map((item: any) => item.exercises.title);
      setExerciseTitles(titles);
    }
    setLoadingExercises(false);
  };

  const hasExercises = exerciseTitles.length > 0 || (routine as any).exercise_count > 0;

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.05)',
      overflow: 'hidden',
      transition: 'all 0.2s ease'
    }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <span style={{
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            color: 'var(--gold)',
            fontSize: '0.8rem'
          }}>▶</span>
          <div>
            <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{routine.title}</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
              {exerciseTitles.length || (routine as any).exercise_count || 0} ejercicios
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
          <button
            disabled={!hasExercises}
            onClick={() => router.push(`/practice?routine=${routine.id}`)}
            style={{
              background: 'var(--gold)', color: '#111', border: 'none', padding: '0.5rem 1rem',
              borderRadius: '6px', cursor: hasExercises ? 'pointer' : 'not-allowed',
              fontSize: '0.85rem', fontWeight: 700, opacity: hasExercises ? 1 : 0.5
            }}
          >
            🚀 Iniciar
          </button>
          

          <EditButton onClick={() => router.push(`/routines/${routine.id}`)} />
          
          <HistoryButton onClick={() => console.log('Stats', routine.id)} />

          <DeleteButton onClick={() => onDelete(routine)} />
        </div>
      </div>

      {isOpen && (
        <div style={{
          padding: '0 1.5rem 1.5rem 3rem',
          borderTop: '1px solid rgba(255,255,255,0.03)',
          background: 'rgba(0,0,0,0.1)'
        }}>
          {routine.description && (
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem', fontStyle: 'italic' }}>
              {routine.description}
            </p>
          )}

          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {loadingExercises ? (
              <li style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Cargando ejercicios...</li>
            ) : exerciseTitles.length > 0 ? (
              exerciseTitles.map((title, i) => (
                <li key={i} style={{
                  color: 'var(--text)',
                  fontSize: '0.85rem',
                  padding: '0.3rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ color: 'var(--gold)', fontSize: '0.7rem' }}>•</span>
                  {title}
                </li>
              ))
            ) : (
              <li style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No hay ejercicios en esta rutina.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}