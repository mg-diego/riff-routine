"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Exercise } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { APP_EVENTS, emitAppEvent } from '@/lib/events';
import { useTranslatedExercise } from '@/hooks/useTranslatedExercise';
import styles from './page.module.css';
import ui from '@/components/ui/ui.module.css';
import { cx } from '@/lib/cx';

interface SelectedExercise {
  id: string;
  title: string;
  technique: string;
  durationMinutes: number | string;
  targetBpm: number | string;
  hasFile: boolean;
}

export default function CreateRoutinePage() {
  const router = useRouter();
  const t = useTranslations('CreateRoutinePage');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);

  useEffect(() => {
    fetchExercises();
  }, []);

  const { formatExerciseList } = useTranslatedExercise();

  const fetchExercises = async () => {
    try {
      setLoadingExercises(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rawData, error: fetchError } = await supabase
        .from('exercises')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (rawData) {
        const translatedData = formatExerciseList(rawData as Exercise[]);
        setAllExercises(translatedData);
      } else {
        setAllExercises([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleAddExercise = (ex: Exercise) => {
    if (selectedExercises.find(item => item.id === ex.id)) return;

    setSelectedExercises(prev => [...prev, {
      id: ex.id,
      title: ex.title,
      technique: ex.technique || '',
      durationMinutes: 5,
      targetBpm: ex.bpm_goal || '',
      hasFile: !!ex.file_url
    }]);
  };

  const handleRemoveExercise = (id: string) => {
    setSelectedExercises(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateExercise = (id: string, field: keyof SelectedExercise, value: string | number) => {
    setSelectedExercises(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return setError(t('errors.nameRequired'));

    try {
      setSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('errors.loginRequired'));

      const { data: routineData, error: routineError } = await supabase
        .from('routines')
        .insert([{
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null
        }])
        .select()
        .single();

      if (routineError) throw routineError;

      if (selectedExercises.length > 0) {
        const routineExercisesToInsert = selectedExercises.map((ex, index) => {
          const mins = parseInt(String(ex.durationMinutes), 10);
          const bpm = parseInt(String(ex.targetBpm), 10);

          return {
            routine_id: routineData.id,
            exercise_id: ex.id,
            order_index: index,
            target_duration_seconds: isNaN(mins) ? 300 : mins * 60,
            target_bpm: isNaN(bpm) ? null : bpm
          };
        });

        const { error: insertExercisesError } = await supabase
          .from('routine_exercises')
          .insert(routineExercisesToInsert);

        if (insertExercisesError) throw insertExercisesError;
      }

      emitAppEvent(APP_EVENTS.ROUTINE_CREATED);
      router.push(`/routines`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  };

  const filteredExercises = allExercises.filter(ex =>
    ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ex.technique && ex.technique.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={styles.backButton}>
      <button
        onClick={() => router.push('/routines')}
        className={ui.backLink}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        {t('backButton')}
      </button>

      <div data-onboarding="routines-04" className={styles.titleGrid}>

        <div data-onboarding="routines-02" className={`surface-card ${styles.titleStack}`}>
          <div>
            <h1 className={ui.formTitle}>
              {t('title')}
            </h1>

            <div className={styles.routineNameStack}>
              <div>
                <label className={styles.routineNameFieldLabel}>
                  {t('labels.routineName')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={t('placeholders.routineName')}
                  className={`${styles.input} ${styles.inputFocusable}`}
                />
              </div>

              <div>
                <label className={styles.routineNameFieldLabel}>
                  {t('labels.description')} <span className={styles.optionalLabel}>{t('labels.optional')}</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t('placeholders.description')}
                  rows={3}
                  className={cx(styles.input, styles.descriptionTextarea)}
                />
              </div>
            </div>
          </div>

          <div className={styles.title}>
            <div className={styles.titleRow}>
              <h2 className={styles.titleHeading}>
                {t('selectedExercises.title')}
              </h2>
              <span className={styles.label}>
                {selectedExercises.length}
              </span>
            </div>

            <div className={styles.emptyStack}>
              {selectedExercises.length === 0 ? (
                <div className={styles.emptyBox}>
                  <p className={styles.emptyText}>{t('selectedExercises.empty')}</p>
                </div>
              ) : (
                selectedExercises.map((ex, index) => (
                  <div key={ex.id} className={styles.noFileWarningBox}>
                    <div className={styles.noFileWarningRow}>
                      <div className={styles.noFileWarning}>
                        <span className={styles.label2}>#{index + 1}</span>
                        <div className={styles.noFileWarningRow2}>
                          <p className={styles.text}>{ex.title}</p>
                          {!ex.hasFile && <span title={t('selectedExercises.noFileWarning')} className={styles.noFileWarningLabel}>⚠️</span>}
                        </div>
                      </div>
                      <button onClick={() => handleRemoveExercise(ex.id)} className={styles.button}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>

                    <div className={styles.minutesGrid}>
                      <div className={styles.minutesStack}>
                        <label className={styles.minutesFieldLabel}>{t('labels.minutes')}</label>
                        <input
                          type="number"
                          value={ex.durationMinutes}
                          onChange={e => handleUpdateExercise(ex.id, 'durationMinutes', e.target.value)}
                          className={styles.smallInput}
                        />
                      </div>
                      <div className={styles.minutesStack}>
                        <label className={styles.minutesFieldLabel}>{t('labels.targetBpm')}</label>
                        <input
                          type="number"
                          value={ex.targetBpm}
                          onChange={e => handleUpdateExercise(ex.id, 'targetBpm', e.target.value)}
                          placeholder={t('placeholders.targetBpm')}
                          className={styles.smallInput}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {error && (
              <div className={`alert-error ${styles.block}`}>
                ⚠ {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className={styles.savingButton} style={{ cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? t('buttons.saving') : t('buttons.save')}
            </button>
          </div>
        </div>

        <div data-onboarding="routines-03" className={`surface-card ${styles.titleGridStack}`}>
          <h2 className={styles.titleGridHeading}>
            {t('library.title')}
          </h2>

          <input
            type="text"
            placeholder={t('placeholders.search')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={cx(styles.input, styles.searchInput)}
          />

          <div className={styles.loadingStack}>
            {loadingExercises ? (
              <p className={styles.loadingText}>{t('library.loading')}</p>
            ) : filteredExercises.length === 0 ? (
              <p className={styles.loadingText}>{t('library.notFound')}</p>
            ) : (
              filteredExercises.map(ex => {
                const isSelected = selectedExercises.some(item => item.id === ex.id);
                const hasNoFile = !ex.file_url;

                return (
                  <div
                    key={ex.id}
                    onClick={() => { if (!isSelected) handleAddExercise(ex); }}
                    className={cx(styles.noCategoryRow, isSelected && styles.selected)}
                  >
                    <div className={styles.noCategoryStack}>
                      <p className={styles.noCategoryStackText}>
                        {ex.title}
                      </p>
                      <div className={styles.noFileWarningRow2}>
                        <p className={styles.noCategoryText}>
                          {ex.technique || t('labels.noCategory')}
                        </p>
                        {hasNoFile && (
                          <span className={styles.noGpLabel}>
                            ⚠️ {t('library.noGp')}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      disabled={isSelected}
                      className={styles.noCategoryRowButton} style={{ background: isSelected ? 'transparent' : 'var(--gold)', color: isSelected ? 'var(--gold)' : '#111', cursor: isSelected ? 'default' : 'pointer' }}
                    >
                      {isSelected ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}