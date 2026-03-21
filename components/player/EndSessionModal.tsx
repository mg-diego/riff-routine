"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslations } from 'next-intl';
import { useTranslatedExercise } from '../../hooks/useTranslatedExercise';

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
            window.dispatchEvent(new CustomEvent('app:end-routine-practice'));
            onEndSession(totalRoutineSeconds);
        } catch (e) { 
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div data-onboarding="practice-06" style={{ background: '#141414', border: '1px solid rgba(220,185,138,0.2)', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                <div style={{ flexShrink: 0, marginBottom: '1.2rem' }}>
                    <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: 'var(--gold)', margin: '0 0 0.2rem 0', lineHeight: 1 }}>{t('title')}</h2>
                    <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>{t('subtitle')}</p>
                </div>
                <div className="logs-scroll" style={{ overflowY: 'auto', paddingRight: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {loadingLogs ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>{t('loading')}</div>
                    ) : finalLogs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>{t('noData')}</div>
                    ) : (
                        finalLogs.map((log, i) => (
                            <div data-onboarding="practice-05" key={log.exercise_id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <p style={{ margin: '0 0 0.8rem 0', color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {log.title}
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.8rem', alignItems: 'flex-end' }}>
                                    <div>
                                        {log.hasBpm ? (
                                            <>
                                                <label style={{ display: 'block', fontSize: '0.6rem', color: 'rgba(220,185,138,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', fontWeight: 700 }}>{t('bpmFinalLabel')}</label>
                                                <input type="number" placeholder="-" value={log.bpm_used} onChange={e => updateFinalLog(i, 'bpm_used', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--gold)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', fontSize: '1rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box', height: '36px' }} />
                                            </>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingBottom: '0.5rem' }}>
                                                <span style={{ color: 'var(--muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>{t('noBpmLog')}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.6rem', color: 'rgba(220,185,138,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', fontWeight: 700 }}>{t('timeLabel')}</label>
                                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                            <input type="number" placeholder="0" value={log.minutes} onChange={e => updateFinalLog(i, 'minutes', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', outline: 'none', fontSize: '1rem', boxSizing: 'border-box', height: '36px' }} />
                                            <span style={{ color: 'var(--muted)', fontWeight: 'bold' }}>:</span>
                                            <input type="number" placeholder="00" value={log.seconds} onChange={e => updateFinalLog(i, 'seconds', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center', outline: 'none', fontSize: '1rem', boxSizing: 'border-box', height: '36px' }} />
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => clearLog(i)}
                                        title={t('clearLog')}
                                        style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', cursor: 'pointer', padding: '0', width: '36px', height: '36px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
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
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexShrink: 0 }}>
                    <button onClick={() => { onClose(); if (!isTimerRunning) onToggleTimer(); }} disabled={isSaving} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', fontSize: '0.9rem' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        {t('actions.backToPractice')}
                    </button>
                    <button onClick={confirmEndSession} disabled={isSaving} style={{ flex: 1, background: 'var(--gold)', border: 'none', color: '#111', padding: '0.8rem', borderRadius: '8px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: isSaving ? 0.5 : 1, transition: 'all 0.2s', fontSize: '0.9rem' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dark, #c9a676)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}>
                        {isSaving ? t('actions.saving') : t('actions.saveAndExit')}
                    </button>
                </div>
            </div>
        </div>
    );
}