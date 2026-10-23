"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Routine } from '@/lib/types';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/constants';
import { FREE_TIER_LIMITS, fetchSubscriptionTier, isFreeTier } from '@/lib/subscription';
import { APP_EVENTS, emitAppEvent } from '@/lib/events';
import { RoutinesPageHeader } from '@/components/routines/RoutinesPageHeader';
import { RoutineCard } from '@/components/routines/RoutineCard';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { useTranslations } from 'next-intl';
import { BecomeProModal } from '@/components/ui/BecomeProModal';
import styles from './page.module.css';
import ui from '@/components/ui/ui.module.css';

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

    setUserTier(await fetchSubscriptionTier(user.id));

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

  const canCreateRoutine = !isFreeTier(userTier) || routines.length < FREE_TIER_LIMITS.routines;

  const handleCreateClick = () => {
    if (canCreateRoutine) {
      emitAppEvent(APP_EVENTS.OPEN_NEW_ROUTINE_MODAL);
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
        <div className={`alert-error ${styles.row}`}>
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className={ui.dangerTextButton}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="loader-container">
          <span className="loader" />
        </div>
      ) : routines.length === 0 ? (
        <div className="empty-state">
          <div className={styles.block}>⏱️</div>
          <p className={styles.titleText}>{t('emptyState.title')}</p>
          <p className={styles.subtitleText}>{t('emptyState.subtitle')}</p>
        </div>
      ) : (
        <div data-onboarding="routines-05" className={styles.stack}>
          {routines.map((routine, index) => {
            const isReadonly = isFreeTier(userTier) && index >= FREE_TIER_LIMITS.routines;
            
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