"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Routine } from '../../../lib/types';
import { RoutinesPageHeader } from '../../../components/routines/RoutinesPageHeader';
import { RoutineCard } from '../../../components/routines/RoutineCard';
import { DeleteConfirmModal } from '../../../components/ui/DeleteConfirmModal';

export default function RoutinesPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('routines')
      .select(`
        *,
        routine_exercises (count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedRoutines = data.map((routine: any) => ({
        ...routine,
        exercise_count: routine.routine_exercises?.[0]?.count || 0
      }));
      setRoutines(formattedRoutines);
    }

    setLoading(false);
  };

  const confirmDelete = async () => {
    if (!routineToDelete) return;
    setIsDeleting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const result = await supabase
        .from('routines')
        .delete()
        .eq('id', routineToDelete.id)
        .eq('user_id', user.id);

      if (result.error) throw result.error;

      await fetchRoutines();
      setRoutineToDelete(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsDeleting(false);
    }
  };
  

  return (
    <div>
      <RoutinesPageHeader
        count={routines.length}
        loading={loading}
        onCreateClick={() => router.push('/routines/new')}
      />

      {error && (
        <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <span className="loader" />
        </div>
      ) : routines.length === 0 ? (
        <div style={{ background: 'var(--surface)', padding: '4rem 2rem', borderRadius: '12px', border: '1px dashed rgba(220,185,138,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏱️</div>
          <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: 600 }}>No tienes rutinas</p>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>Agrupa ejercicios para practicar de forma organizada</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onDelete={() => setRoutineToDelete(routine)}
            />
          ))}
        </div>
      )}

      {routineToDelete && (
        <DeleteConfirmModal
          title="Eliminar Rutina"
          itemName={routineToDelete.title}
          warningMessage="Esta acción es irreversible. La rutina y su configuración se perderán, pero tu historial de práctica de los ejercicios individuales se conservará."
          isDeleting={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setRoutineToDelete(null)}
        />
      )}
    </div>
  );
}