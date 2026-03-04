"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { Routine, Exercise } from '../../../../lib/types';
import { RoutineHeader } from '../../../../components/routines/detail/RoutineHeader';
import { AddExerciseModal } from '../../../../components/routines/detail/AddExerciseModal';
import { RoutineExerciseItem } from '../../../../components/routines/detail/RoutineExerciseItem';

interface RoutineExerciseDetail {
  id: string;
  routine_id: string;
  exercise_id: string;
  target_bpm: number | null;
  order_index: number;
  target_duration_seconds: number | null;
  session_count?: number; 
  exercises: Exercise;
}

export default function RoutineDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [routineExercises, setRoutineExercises] = useState<RoutineExerciseDetail[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: routineData, error: routineError } = await supabase
      .from('routines')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (routineError || !routineData) {
      setError('No se pudo cargar la rutina.');
      setLoading(false);
      return;
    }
    setRoutine(routineData);

    const { data: exercisesData } = await supabase
      .from('exercises')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('created_at', { ascending: false });

    if (exercisesData) setAllExercises(exercisesData);

    const { data: reData } = await supabase
      .from('routine_exercises')
      .select(`*, exercises (*)`)
      .eq('routine_id', params.id)
      .order('order_index', { ascending: true });

    if (reData) {
        const exerciseIds = reData.map(re => re.exercise_id);
        
        const { data: logsData } = await supabase
            .from('practice_logs')
            .select('exercise_id')
            .in('exercise_id', exerciseIds)
            .eq('user_id', user.id);

        const sessionCounts: Record<string, number> = {};
        if (logsData) {
            logsData.forEach(log => {
                sessionCounts[log.exercise_id] = (sessionCounts[log.exercise_id] || 0) + 1;
            });
        }

        const enrichedData = reData.map(re => ({
            ...re,
            session_count: sessionCounts[re.exercise_id] || 0
        }));

        setRoutineExercises(enrichedData as RoutineExerciseDetail[]);
    }

    setLoading(false);
  };

  const handleAddExercise = async (exerciseId: string) => {
    const nextOrder = routineExercises.length > 0 
      ? Math.max(...routineExercises.map(e => e.order_index)) + 1 
      : 0;

    const { error: insertError } = await supabase
      .from('routine_exercises')
      .insert([{
        routine_id: params.id,
        exercise_id: exerciseId,
        order_index: nextOrder,
        target_duration_seconds: 300
      }]);

    if (insertError) {
      setError(insertError.message);
    } else {
      fetchData();
      setShowAddModal(false);
    }
  };

  const handleRemoveExercise = async (id: string) => {
    setRoutineExercises(prev => prev.filter(e => e.id !== id));
    const { error: deleteError } = await supabase.from('routine_exercises').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      fetchData();
    }
  };

  const handleUpdateSetting = async (id: string, field: string, value: number | null) => {
    setRoutineExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
    const { error: updateError } = await supabase.from('routine_exercises').update({ [field]: value }).eq('id', id);
    if (updateError) {
      setError(updateError.message);
      fetchData();
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === routineExercises.length - 1)) return;
    const newExercises = [...routineExercises];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const tempOrder = newExercises[index].order_index;
    newExercises[index].order_index = newExercises[swapIndex].order_index;
    newExercises[swapIndex].order_index = tempOrder;
    setRoutineExercises(newExercises.sort((a, b) => a.order_index - b.order_index));
    await supabase.from('routine_exercises').upsert([
      { id: newExercises[index].id, routine_id: newExercises[index].routine_id, exercise_id: newExercises[index].exercise_id, order_index: newExercises[index].order_index },
      { id: newExercises[swapIndex].id, routine_id: newExercises[swapIndex].routine_id, exercise_id: newExercises[swapIndex].exercise_id, order_index: newExercises[swapIndex].order_index }
    ]);
  };

  const handleStatsExercise = (id: string) => {
    console.log("Estadísticas del ejercicio:", id);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--muted)' }}>
        <span style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid rgba(220,185,138,0.3)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!routine) return <div style={{ color: 'var(--text)' }}>Rutina no encontrada.</div>;

  const totalDuration = routineExercises.reduce((acc, curr) => acc + (curr.target_duration_seconds || 0), 0);

  return (
    <div>
      {showAddModal && (
        <AddExerciseModal
          exercises={allExercises}
          onAdd={handleAddExercise}
          onClose={() => setShowAddModal(false)}
        />
      )}

      <RoutineHeader
        routine={routine}
        totalDuration={totalDuration}
        exerciseCount={routineExercises.length}
        onAddClick={() => setShowAddModal(true)}
      />

      {error && (
        <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {routineExercises.length === 0 ? (
        <div style={{ background: 'var(--surface)', padding: '4rem 2rem', borderRadius: '12px', border: '1px dashed rgba(220,185,138,0.3)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: 600 }}>Esta rutina está vacía</p>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>Añade ejercicios para empezar a entrenar</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {routineExercises.map((re, index) => (
            <RoutineExerciseItem
              key={re.id}
              item={re}
              index={index}
              isFirst={index === 0}
              isLast={index === routineExercises.length - 1}
              onMove={handleMove}
              onUpdateSetting={handleUpdateSetting}
              onRemove={handleRemoveExercise}
              onStats={handleStatsExercise}
            />
          ))}
        </div>
      )}
    </div>
  );
}