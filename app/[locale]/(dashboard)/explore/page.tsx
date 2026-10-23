"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Exercise } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { HistoryButton } from '@/components/ui/HistoryButton';
import { useExerciseActions } from '@/hooks/useExerciseActions';
import styles from './page.module.css';
import { cx } from '@/lib/cx';
import ui from '@/components/ui/ui.module.css';

export default function ExplorePage() {
    const router = useRouter();
    const t = useTranslations('ExplorePage');
    const st = useTranslations('SystemExercises');

    const { checkLimitAndFork, saving, error: hookError, setError: setHookError } = useExerciseActions();

    const [systemExercises, setSystemExercises] = useState<Exercise[]>([]);
    const [addedExercises, setAddedExercises] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [addedToast, setAddedToast] = useState<string | null>(null);

    const handleHistoryNavigation = (exercise: Exercise) => router.push(`/library/${exercise.id}/history`);

    useEffect(() => {
        fetchSystemExercises();
    }, []);

    const fetchSystemExercises = async () => {
        setLoading(true);

        const { data: sysData, error: sysError } = await supabase
            .from('exercises')
            .select('*')
            .is('is_system', true)
            .order('title', { ascending: true });

        if (sysError) {
            setError(sysError.message);
            setLoading(false);
            return;
        }

        if (sysData) {
            setSystemExercises(sysData);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: userData } = await supabase
                .from('exercises')
                .select('forked_from')
                .eq('user_id', user.id)
                .not('forked_from', 'is', null);

            if (userData) {
                const addedIds = new Set(userData.map(ex => ex.forked_from as string));
                setAddedExercises(addedIds);
            }
        }

        setLoading(false);
    };

    const handlePlay = (exercise: Exercise) => {
    if (exercise.file_url) {
        router.push(`/practice?file=${encodeURIComponent(exercise.file_url)}`);
    } else {
        if (exercise.title === 'sys_improvisation_title') {
            router.push('/backing-tracks');
            return;
        }

        const routes: Record<string, string> = {
            'sys_scales_title': 'scales',
            'sys_composition_title': 'composition',
            'sys_chords_title': 'chords',
            'sys_rhythm_title': 'rhythm',
            'sys_ear_training_title': 'earTraining',
            'sys_harmonization_title': 'harmonization'
        };

        const targetTitle = routes[exercise.title] || exercise.title;
        router.push(`/practice?mode=${encodeURIComponent(targetTitle)}`);
    }
};

    const handleAddToLibrary = async (exercise: Exercise) => {
        const newId = await checkLimitAndFork(exercise);

        if (newId) {
            setAddedExercises(prev => new Set(prev).add(exercise.id));
            setAddedToast(st(exercise.title));
            setTimeout(() => setAddedToast(null), 3000);
        }
    };

    const toolsExercises = systemExercises.filter(ex => !ex.file_url);
    const tabsExercises = systemExercises.filter(ex => ex.file_url);

    const groupedTabs = tabsExercises.reduce((acc, exercise) => {
        const mainTech = exercise.technique ? exercise.technique.split(',')[0].trim() : 'General';
        if (!acc[(mainTech)]) acc[(mainTech)] = [];
        acc[(mainTech)].push(exercise);
        return acc;
    }, {} as Record<string, Exercise[]>);

    const renderExerciseCard = (exercise: Exercise) => {
        const displayTitle = st(exercise.title);
        const displayTechnique = exercise.technique && !!exercise.file_url? exercise.technique : st(exercise?.technique || "") ;
        const displayNotes = exercise.notes ? st(exercise.notes) : '';
        const cats = displayTechnique ? displayTechnique.split(', ') : [];

        const showAddButton = exercise.is_system && exercise.file_url != null;
        const isAlreadyAdded = addedExercises.has(exercise.id);

        return (
            <div key={exercise.id} className={styles.goalStack}
            >
                <div>
                    <div className={styles.row}>
                        <h3 className={styles.subheading}>
                            {displayTitle}
                        </h3>
                        {!exercise.file_url && (<HistoryButton onClick={() => handleHistoryNavigation(exercise)} />)}
                    </div>

                    {cats.length > 0 && (
                        <div className={styles.goalStackRow}>
                            {cats.map(cat => (
                                <span key={cat} className={styles.label}>
                                    {cat}
                                </span>
                            ))}
                        </div>
                    )}

                    {displayNotes && (
                        <p className={styles.text}>
                            {displayNotes}
                        </p>
                    )}

                    <div className={styles.goalRow}>
                        {exercise.bpm_goal && <span>{t('exercise.goal')}: <strong className={styles.strong}>{exercise.bpm_goal}</strong></span>}
                    </div>
                </div>

                <div className={styles.playButtonRow}>
                    <button
                        onClick={() => handlePlay(exercise)}
                        className={styles.playButton}
                    >
                        {t('exercise.playButton')}
                    </button>

                    {showAddButton && (
                        <button
                            onClick={() => !isAlreadyAdded && handleAddToLibrary(exercise)}
                            disabled={saving || isAlreadyAdded}
                            className={cx(styles.alreadyAddedButton, isAlreadyAdded && styles.added)}
                            style={{ cursor: (saving || isAlreadyAdded) ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}
                        >
                            {isAlreadyAdded ? (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    <span className={styles.alreadyAddedLabel}>{t('exercise.alreadyAdded')}</span>
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    <span className={styles.alreadyAddedLabel}>{t('exercise.addToLibrary')}</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const displayError = error || hookError;

    return (
        <div className={styles.title}>
            {addedToast && (
                <div className={styles.addedToastRow}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Añadido: {addedToast}
                </div>
            )}


            <div className={styles.titleRow}>
                <div>
                    <h1 className="page-title">{t('title')}</h1>
                    <p className="page-subtitle">
                        {t('subtitle')}
                    </p>
                </div>
            </div>

            {displayError && (
                <div className={`alert-error ${styles.displayErrorRow}`}>
                    <span>⚠ {displayError}</span>
                    <button onClick={() => { setError(null); setHookError(null); }} className={ui.dangerTextButton}>✕</button>
                </div>
            )}

            {loading ? (
                <div className="loader-container">
                    <span className="loader" />
                </div>
            ) : systemExercises.length === 0 ? (
                <div className="empty-state">
                    <p className={styles.emptyStateText}>{t('emptyState')}</p>
                </div>
            ) : (
                <div data-onboarding="explore-01" className={styles.toolsStack}>

                    {toolsExercises.length > 0 && (
                        <section>
                            <h2 className={styles.toolsHeading}>
                                {t('blocks.tools')}
                            </h2>
                            <div className={styles.grid}>
                                {toolsExercises.map(renderExerciseCard)}
                            </div>
                        </section>
                    )}

                    {tabsExercises.length > 0 && (
                        <section>
                            <h2 className={styles.exercisesHeading}>
                                {t('blocks.exercises')}
                            </h2>

                            <div className={styles.generalStack}>
                                {Object.entries(groupedTabs).map(([technique, exercises]) => (
                                    <div key={technique}>
                                        <h3 className={styles.generalSubheading}>
                                            <span className={styles.generalSubheadingLabel}></span>
                                            {technique === 'General' ? t('blocks.general') : technique}
                                        </h3>
                                        <div className={styles.grid}>
                                            {exercises.map(renderExerciseCard)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

        </div>
    );
}