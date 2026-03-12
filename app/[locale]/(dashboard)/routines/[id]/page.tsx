"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../../lib/supabase';
import { Routine, Exercise } from '../../../../../lib/types';
import { RoutineHeader } from '../../../../../components/routines/detail/RoutineHeader';
import { AddExerciseModal } from '../../../../../components/routines/detail/AddExerciseModal';
import { RoutineExerciseItem } from '../../../../../components/routines/detail/RoutineExerciseItem';
import { useTranslations } from 'next-intl';
import { useTranslatedExercise } from '@/hooks/useTranslatedExercise';

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
  const t = useTranslations('RoutineDetailsPage');

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [routineExercises, setRoutineExercises] = useState<RoutineExerciseDetail[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState<string>('');
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const hasUnsavedChanges = savedSnapshot !== JSON.stringify(
    routineExercises.map(({ id, order_index, target_bpm, target_duration_seconds }) =>
      ({ id, order_index, target_bpm, target_duration_seconds })
    )
  );

  const snapshotFrom = (list: RoutineExerciseDetail[]) =>
    JSON.stringify(list.map(({ id, order_index, target_bpm, target_duration_seconds }) =>
      ({ id, order_index, target_bpm, target_duration_seconds })
    ));

  const { formatExercise, formatExerciseList } = useTranslatedExercise();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: routineData, error: routineError } = await supabase
      .from('routines').select('*').eq('id', params.id).eq('user_id', user.id).single();

    if (routineError || !routineData) {
      setError(t('errors.loadFailed'));
      setLoading(false);
      return;
    }
    setRoutine(routineData);

    const { data: exercisesData } = await supabase
      .from('exercises')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('created_at', { ascending: false });

    if (exercisesData) {
      setAllExercises(formatExerciseList(exercisesData as Exercise[]));
    }

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
      logsData?.forEach(log => {
        sessionCounts[log.exercise_id] = (sessionCounts[log.exercise_id] || 0) + 1;
      });

      const enriched = reData.map(re => {
        const rawEx = Array.isArray(re.exercises) ? re.exercises[0] : re.exercises;
        return {
          ...re,
          exercises: formatExercise(rawEx as Exercise),
          session_count: sessionCounts[re.exercise_id] || 0
        };
      }) as RoutineExerciseDetail[];

      setRoutineExercises(enriched);
      setSavedSnapshot(snapshotFrom(enriched));
    }
    setLoading(false);
    // Quitamos formatExercise y formatExerciseList de aquí para evitar el loop
  }, [params.id, router, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateRoutine = async (field: 'title' | 'description', value: string) => {
    if (!routine) return;
    setRoutine(prev => prev ? { ...prev, [field]: value } : prev);
    const { error } = await supabase.from('routines').update({ [field]: value }).eq('id', routine.id);
    if (error) { setError(error.message); fetchData(); }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    try {
      const upsertData = routineExercises.map(re => ({
        id: re.id,
        routine_id: re.routine_id,
        exercise_id: re.exercise_id,
        order_index: re.order_index,
        target_bpm: re.target_bpm,
        target_duration_seconds: re.target_duration_seconds,
      }));
      const { error: upsertError } = await supabase.from('routine_exercises').upsert(upsertData);
      if (upsertError) throw upsertError;
      setSavedSnapshot(snapshotFrom(routineExercises));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e: any) {
      setError(e.message || t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddExercise = async (exerciseId: string) => {
    const nextOrder = routineExercises.length > 0
      ? Math.max(...routineExercises.map(e => e.order_index)) + 1 : 0;
    const { error: insertError } = await supabase
      .from('routine_exercises').insert([{ routine_id: params.id, exercise_id: exerciseId, order_index: nextOrder, target_duration_seconds: 300 }]);
    if (insertError) { setError(insertError.message); }
    else { fetchData(); setShowAddModal(false); }
  };

  const handleRemoveExercise = async (id: string) => {
    setRoutineExercises(prev => prev.filter(e => e.id !== id));
    const { error: deleteError } = await supabase.from('routine_exercises').delete().eq('id', id);
    if (deleteError) { setError(deleteError.message); fetchData(); }
    else setSavedSnapshot(() => {
      const updated = routineExercises.filter(e => e.id !== id);
      return snapshotFrom(updated);
    });
  };

  const handleUpdateSetting = (id: string, field: string, value: number | null) => {
    setRoutineExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === routineExercises.length - 1)) return;
    const newList = [...routineExercises];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    const tempOrder = newList[index].order_index;
    newList[index].order_index = newList[swapIdx].order_index;
    newList[swapIdx].order_index = tempOrder;
    setRoutineExercises(newList.sort((a, b) => a.order_index - b.order_index));
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="loader" /></div>;
  if (!routine) return <div style={{ color: 'var(--text)' }}>{t('errors.notFound')}</div>;

  const totalDuration = routineExercises.reduce((acc, curr) => acc + (curr.target_duration_seconds || 0), 0);

  return (
    <div>
      {showAddModal && (
        <AddExerciseModal exercises={allExercises} onAdd={handleAddExercise} onClose={() => setShowAddModal(false)} />
      )}

      <RoutineHeader
        routine={routine}
        totalDuration={totalDuration}
        exerciseCount={routineExercises.length}
        onAddClick={() => setShowAddModal(true)}
        onUpdateRoutine={handleUpdateRoutine}
      />

      {error && (
        <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {hasUnsavedChanges && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(220,185,138,0.07)', border: '1px solid rgba(220,185,138,0.25)',
          borderRadius: '10px', padding: '0.75rem 1.25rem', marginBottom: '1.5rem',
          gap: '1rem',
        }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--gold)', fontWeight: 600 }}>
            ● {t('unsavedChanges.label')}
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={fetchData}
              disabled={saving}
              style={{ padding: '0.45rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif' }}
            >
              {t('unsavedChanges.discard')}
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              style={{
                padding: '0.45rem 1.25rem', borderRadius: '8px', border: 'none',
                background: saving ? 'rgba(220,185,138,0.5)' : 'var(--gold)',
                color: '#111', cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem', fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.2s',
              }}
            >
              {saving ? t('unsavedChanges.saving') : t('unsavedChanges.save')}
            </button>
          </div>
        </div>
      )}

      {saveSuccess && !hasUnsavedChanges && (
        <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '10px', padding: '0.75rem 1.25rem', marginBottom: '1.5rem', color: '#4ade80', fontSize: '0.88rem', fontWeight: 600 }}>
          ✓ {t('success.saved')}
        </div>
      )}

      {routineExercises.length === 0 ? (
        <div style={{ background: 'var(--surface)', padding: '4rem 2rem', borderRadius: '12px', border: '1px dashed rgba(220,185,138,0.3)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: 600 }}>{t('emptyState.title')}</p>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>{t('emptyState.subtitle')}</p>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}