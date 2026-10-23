"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { APP_EVENTS, emitAppEvent } from '@/lib/events';
import { useTranslatedExercise } from '@/hooks/useTranslatedExercise';
import styles from './EndSessionModal.module.css';
import ui from '@/components/ui/ui.module.css';

interface EndSessionModalProps {
    sessionId: string;
    isTimerRunning: boolean;
    onToggleTimer: () => void;
    onClose: () => void;
    onEndSession: (overrideTotalSeconds?: number) => void;
    localSessionLogs: Record<string, { bpm: number | null, seconds: number }>;
    routineList: any[];
}

export function EndSessionModal({
    sessionId,
    isTimerRunning,
    onToggleTimer,
    onClose,
    onEndSession,
    localSessionLogs,
    routineList
}: EndSessionModalProps) {
    const t = useTranslations('EndSessionModal');
    const { formatExercise } = useTranslatedExercise();
    const [finalLogs, setFinalLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    useEffect(() => {
        if (initialLoadDone) return;

        const grouped: Record<string, any> = {};

        routineList.forEach(re => {
            const ed = re.exercises as any;
            const exerciseData = Array.isArray(ed) ? ed[0] : (ed || re);
            const translatedEx = exerciseData ? formatExercise(exerciseData) : null;
            const exerciseId = re.exercise_id || exerciseData?.id;

            if (!exerciseId) return;

            const localLog = localSessionLogs[exerciseId];
            const localBpm = localLog?.bpm;
            
            let localSecs = localLog?.seconds || 0;
            if (localSecs > 0 && localSecs < 60) {
                localSecs = 60;
            }

            let bpmUsed = '';
            if (localBpm != null) {
                bpmUsed = localBpm.toString();
            }

            grouped[exerciseId] = {
                exercise_id: exerciseId,
                title: translatedEx?.title || t('exerciseLabel'),
                hasBpm: exerciseData?.has_bpm !== false,
                bpm_used: bpmUsed,
                duration_seconds: localSecs
            };
        });

        setFinalLogs(Object.values(grouped).map(g => ({
            ...g,
            minutes: g.duration_seconds > 0 ? Math.floor(g.duration_seconds / 60).toString() : '',
            seconds: g.duration_seconds > 0 ? (g.duration_seconds % 60).toString() : ''
        })));
        
        setLoadingLogs(false);
        setInitialLoadDone(true);
    }, [routineList, localSessionLogs, t, formatExercise, initialLoadDone]);

    const updateFinalLog = (index: number, field: string, value: string) => {
        const updated = [...finalLogs];
        updated[index][field] = value;
        setFinalLogs(updated);
    };

    const clearLog = (index: number) => {
        const updated = [...finalLogs];
        updated[index].minutes = '';
        updated[index].seconds = '';
        updated[index].bpm_used = '';
        setFinalLogs(updated);
    };

    const confirmEndSession = async () => {
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User auth error");

            let totalRoutineSeconds = 0;

            for (const log of finalLogs) {
                let totalSecs = (parseInt(log.minutes) || 0) * 60 + (parseInt(log.seconds) || 0);
                
                if (totalSecs > 0 && totalSecs < 60) {
                    totalSecs = 60;
                }
                
                let bpmVal: number | null = parseInt(log.bpm_used);
                if (isNaN(bpmVal)) bpmVal = null;

                if (totalSecs === 0) continue;

                totalRoutineSeconds += totalSecs;

                await supabase.from('practice_logs').insert({
                    user_id: user.id,
                    session_id: sessionId,
                    exercise_id: log.exercise_id,
                    bpm_used: bpmVal,
                    duration_seconds: totalSecs,
                    created_at: new Date().toISOString()
                });
            }
            emitAppEvent(APP_EVENTS.END_ROUTINE_PRACTICE);
            onEndSession(totalRoutineSeconds);
        } catch (e) { 
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={ui.overlayBlur}>
            <div data-onboarding="practice-06" className={styles.titleStack}>
                <div className={styles.title}>
                    <h2 className={styles.titleHeading}>{t('title')}</h2>
                    <p className={styles.subtitleText}>{t('subtitle')}</p>
                </div>
                <div className={`logs-scroll ${styles.loadingStack}`}>
                    {loadingLogs ? (
                        <div className={styles.loading}>{t('loading')}</div>
                    ) : finalLogs.length === 0 ? (
                        <div className={styles.loading}>{t('noData')}</div>
                    ) : (
                        finalLogs.map((log, i) => (
                            <div data-onboarding="practice-05" key={log.exercise_id} className={styles.bpmFinalLabelBox}>
                                <p className={styles.text}>
                                    {log.title}
                                </p>

                                <div className={styles.bpmFinalLabelGrid}>
                                    <div>
                                        {log.hasBpm ? (
                                            <>
                                                <label className={styles.bpmFinalLabelFieldLabel}>{t('bpmFinalLabel')}</label>
                                                <input type="number" placeholder="-" value={log.bpm_used} onChange={e => updateFinalLog(i, 'bpm_used', e.target.value)} className={styles.input} />
                                            </>
                                        ) : (
                                            <div className={styles.noBpmLogRow}>
                                                <span className={styles.noBpmLogLabel}>{t('noBpmLog')}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className={styles.bpmFinalLabelFieldLabel}>{t('timeLabel')}</label>
                                        <div className={styles.row}>
                                            <input type="number" placeholder="0" value={log.minutes} onChange={e => updateFinalLog(i, 'minutes', e.target.value)} className={styles.bpmFinalLabelGridInput} />
                                            <span className={styles.label}>:</span>
                                            <input type="number" placeholder="00" value={log.seconds} onChange={e => updateFinalLog(i, 'seconds', e.target.value)} className={styles.bpmFinalLabelGridInput} />
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => clearLog(i)}
                                        title={t('clearLog')}
                                        className={styles.clearLogButton}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className={styles.backToPracticeRow}>
                    <button onClick={() => { onClose(); if (!isTimerRunning) onToggleTimer(); }} disabled={isSaving} className={styles.backToPracticeButton}>
                        {t('actions.backToPractice')}
                    </button>
                    <button onClick={confirmEndSession} disabled={isSaving} className={styles.savingButton} style={{ cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.5 : 1 }}>
                        {isSaving ? t('actions.saving') : t('actions.saveAndExit')}
                    </button>
                </div>
            </div>
        </div>
    );
}