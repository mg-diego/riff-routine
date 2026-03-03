"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { Routine, Exercise } from '../../../../lib/types';
import { Modal, ModalActions } from '../../../../components/ui/Modal';
import { DIFFICULTY_COLORS } from '../../../../lib/constants';

interface RoutineExerciseDetail {
  id: string;
  routine_id: string;
  exercise_id: string;
  target_bpm: number | null;
  order_index: number;
  target_duration_seconds: number | null;
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (exercisesData) setAllExercises(exercisesData);

    const { data: reData } = await supabase
      .from('routine_exercises')
      .select(`
        *,
        exercises (*)
      `)
      .eq('routine_id', params.id)
      .order('order_index', { ascending: true });

    if (reData) setRoutineExercises(reData as RoutineExerciseDetail[]);

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
    const { error: deleteError } = await supabase
      .from('routine_exercises')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      fetchData();
    }
  };

  const handleUpdateSetting = async (id: string, field: string, value: number | null) => {
    const { error: updateError } = await supabase
      .from('routine_exercises')
      .update({ [field]: value })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
    } else {
      fetchData();
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === routineExercises.length - 1)
    ) return;

    const newExercises = [...routineExercises];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const tempOrder = newExercises[index].order_index;
    newExercises[index].order_index = newExercises[swapIndex].order_index;
    newExercises[swapIndex].order_index = tempOrder;

    setRoutineExercises(newExercises.sort((a, b) => a.order_index - b.order_index));

    await supabase
      .from('routine_exercises')
      .upsert([
        { id: newExercises[index].id, routine_id: newExercises[index].routine_id, exercise_id: newExercises[index].exercise_id, order_index: newExercises[index].order_index },
        { id: newExercises[swapIndex].id, routine_id: newExercises[swapIndex].routine_id, exercise_id: newExercises[swapIndex].exercise_id, order_index: newExercises[swapIndex].order_index }
      ]);
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
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      {showAddModal && (
        <Modal title="Añadir a la rutina" subtitle="Selecciona un ejercicio de tu biblioteca" onClose={() => setShowAddModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '50vh', overflowY: 'auto' }}>
            {allExercises.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center' }}>No tienes ejercicios en tu biblioteca.</p>
            ) : (
              allExercises.map(ex => (
                <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--surface2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.3rem 0', color: 'var(--text)', fontSize: '0.95rem' }}>{ex.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{ex.technique || 'General'}</span>
                  </div>
                  <button 
                    onClick={() => handleAddExercise(ex.id.toString())}
                    style={{ background: 'var(--gold)', color: '#111', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                  >
                    Añadir
                  </button>
                </div>
              ))
            )}
          </div>
          <ModalActions onClose={() => setShowAddModal(false)} onSubmit={() => setShowAddModal(false)} uploading={false} label="Cerrar" />
        </Modal>
      )}

      <button onClick={() => router.push('/routines')} style={{ background: 'transparent', color: 'var(--muted)', border: 'none', padding: '0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem' }}>
        ← Volver a Mis Rutinas
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>{routine.title}</h1>
          <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.95rem' }}>
            {routine.description || 'Sin descripción'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text)' }}>
              ⏱️ Tiempo estimado: <strong style={{ color: 'var(--gold)' }}>{formatTime(totalDuration)}</strong>
            </span>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text)' }}>
              🎸 Ejercicios: <strong style={{ color: 'var(--gold)' }}>{routineExercises.length}</strong>
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowAddModal(true)} style={{ background: 'transparent', color: 'var(--text)', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            + Añadir Ejercicio
          </button>
          <button 
            disabled={routineExercises.length === 0}
            onClick={() => router.push(`/practice?routine=${routine.id}`)}
            style={{ background: routineExercises.length === 0 ? 'var(--surface2)' : 'var(--gold)', color: routineExercises.length === 0 ? 'var(--muted)' : '#111', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: routineExercises.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            ▶ Iniciar Sesión
          </button>
        </div>
      </div>

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
            <div key={re.id} style={{ background: 'var(--surface)', padding: '1rem 1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <button disabled={index === 0} onClick={() => handleMove(index, 'up')} style={{ background: 'none', border: 'none', color: index === 0 ? 'rgba(255,255,255,0.1)' : 'var(--muted)', cursor: index === 0 ? 'default' : 'pointer', padding: '0' }}>▲</button>
                <button disabled={index === routineExercises.length - 1} onClick={() => handleMove(index, 'down')} style={{ background: 'none', border: 'none', color: index === routineExercises.length - 1 ? 'rgba(255,255,255,0.1)' : 'var(--muted)', cursor: index === routineExercises.length - 1 ? 'default' : 'pointer', padding: '0' }}>▼</button>
              </div>

              <div style={{ flex: '1 1 200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>{index + 1}</span>
                  <h3 style={{ color: 'var(--text)', margin: '0', fontSize: '1.1rem', fontWeight: 600 }}>{re.exercises.title}</h3>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {re.exercises.technique || 'General'} · Dificultad: {re.exercises.difficulty || 1}
                </span>
              </div>

              <div style={{ flex: '0 1 150px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 'bold' }}>Duración (seg)</label>
                <input 
                  type="number" 
                  value={re.target_duration_seconds || ''} 
                  onChange={(e) => handleUpdateSetting(re.id, 'target_duration_seconds', e.target.value ? parseInt(e.target.value) : null)}
                  style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.5rem', borderRadius: '6px', outline: 'none', width: '100px', fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>

              <div style={{ flex: '0 1 150px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 'bold' }}>BPM Objetivo</label>
                <input 
                  type="number" 
                  value={re.target_bpm || ''} 
                  placeholder={re.exercises.bpm_goal?.toString() || 'Libre'}
                  onChange={(e) => handleUpdateSetting(re.id, 'target_bpm', e.target.value ? parseInt(e.target.value) : null)}
                  style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.5rem', borderRadius: '6px', outline: 'none', width: '100px', fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>

              <div style={{ marginLeft: 'auto' }}>
                <button 
                  onClick={() => handleRemoveExercise(re.id)}
                  style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 0.8rem', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#e74c3c'; e.currentTarget.style.borderColor = 'rgba(231,76,60,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}