"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { Routine } from '../../../../lib/types';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '../../../../lib/constants';
import { RoutinesPageHeader } from '../../../../components/routines/RoutinesPageHeader';
import { RoutineCard } from '../../../../components/routines/RoutineCard';
import { DeleteConfirmModal } from '../../../../components/ui/DeleteConfirmModal';
import { useTranslations } from 'next-intl';
import { BecomeProModal } from '@/components/ui/BecomeProModal';

export default function RoutinesPage() {
  const router = useRouter();
  const t = useTranslations('RoutinesPage');
  const p = useTranslations('BecomeProModal');

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [userTier, setUserTier] = useState<SubscriptionTier>(SUBSCRIPTION_TIERS.FREE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    if (profile) {
      setUserTier((profile.subscription_tier as SubscriptionTier) || SUBSCRIPTION_TIERS.FREE);
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
      if (!user) throw new Error(t('errors.unauthenticated'));

      const result = await supabase
        .from('routines')
        .delete()
        .eq('id', routineToDelete.id)
        .eq('user_id', user.id);

      if (result.error) throw result.error;

      await fetchData();
      setRoutineToDelete(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsDeleting(false);
    }
  };

  const MAX_FREE_ROUTINES = 3;
  const canCreateRoutine = userTier !== SUBSCRIPTION_TIERS.FREE || routines.length < MAX_FREE_ROUTINES;

  const handleCreateClick = () => {
    if (canCreateRoutine) {
      window.dispatchEvent(new CustomEvent('app:open-new-routine-modal'));
      router.push('/routines/new');
    } else {
      setShowProModal(true);
    }
  };

  return (
    <div>
      <RoutinesPageHeader
        count={routines.length}
        loading={loading}
        canCreateRoutine={canCreateRoutine}
        onCreateClick={handleCreateClick}
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
          <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: 600 }}>{t('emptyState.title')}</p>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>{t('emptyState.subtitle')}</p>
        </div>
      ) : (
        <div data-onboarding="routines-05" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {routines.map((routine, index) => {
            const isReadonly = userTier === SUBSCRIPTION_TIERS.FREE && index >= MAX_FREE_ROUTINES;
            
            return (
              <RoutineCard
                key={routine.id}
                routine={routine}
                onDelete={() => setRoutineToDelete(routine)}
                readonly={isReadonly}
              />
            );
          })}
        </div>
      )}

      {routineToDelete && (
        <DeleteConfirmModal
          title={t('deleteModal.title')}
          itemName={routineToDelete.title}
          warningMessage={t('deleteModal.warning')}
          isDeleting={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setRoutineToDelete(null)}
        />
      )}

      {showProModal && (
        <BecomeProModal onClose={() => setShowProModal(false)} description={p('routineLimit')} />
      )}
    </div>
  );
}