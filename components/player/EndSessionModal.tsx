"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslations } from 'next-intl';
import { useTranslatedExercise } from '../../hooks/useTranslatedExercise';

interface EndSessionModalProps {
    sessionId: string;
    showBpmInputs: boolean;
    isTimerRunning: boolean;
    onToggleTimer: () => void;
    onClose: () => void;
    onEndSession: (overrideTotalSeconds?: number) => void;
}

export function EndSessionModal({
    sessionId,
    showBpmInputs,
    isTimerRunning,
    onToggleTimer,
    onClose,
    onEndSession
}: EndSessionModalProps) {
    const t = useTranslations('EndSessionModal');
    const { formatExercise } = useTranslatedExercise();
    const [finalLogs, setFinalLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data: sessionData } = await supabase.from('practice_sessions').select('routine_id').eq('id', sessionId).single();
                if (!sessionData?.routine_id) { onEndSession(); return; }

                const { data: routineExercises } = await supabase.from('routine_exercises').select('exercise_id, exercises(*)').eq('routine_id', sessionData.routine_id).order('order_index', { ascending: true });
                const { data: existingLogs } = await supabase.from('practice_logs').select('id, exercise_id, bpm_used, duration_seconds').eq('session_id', sessionId);

                const grouped: Record<string, any> = {};

                routineExercises?.forEach(re => {
                    const ed = re.exercises as any;
                    const exerciseData = Array.isArray(ed) ? ed[0] : ed;
                    const translatedEx = exerciseData ? formatExercise(exerciseData) : null;

                    grouped[re.exercise_id] = {
                        exercise_id: re.exercise_id,
                        title: translatedEx?.title || t('exerciseLabel'),
                        hasFile: !!translatedEx?.file_url,
                        bpm_used: '',
                        duration_seconds: 0,
                        idsToDelete: []
                    };
                });

                existingLogs?.forEach(log => {
                    if (grouped[log.exercise_id]) {
                        grouped[log.exercise_id].duration_seconds += log.duration_seconds;
                        grouped[log.exercise_id].bpm_used = log.bpm_used?.toString() || '';
                        grouped[log.exercise_id].idsToDelete.push(log.id);
                    }
                });

                setFinalLogs(Object.values(grouped).map(g => ({
                    ...g,
                    minutes: g.duration_seconds > 0 ? Math.floor(g.duration_seconds / 60).toString() : '',
                    seconds: g.duration_seconds > 0 ? (g.duration_seconds % 60).toString() : ''
                })));
            } catch (err) { } finally {
                setLoadingLogs(false);
            }
        };

        fetchLogs();
    }, [sessionId, onEndSession, t, formatExercise]);

    const updateFinalLog = (index: number, field: string, value: string) => {
        const updated = [...finalLogs];
        updated[index][field] = value;
        setFinalLogs(updated);
    };

    const confirmEndSession = async () => {
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User auth error");

            let totalRoutineSeconds = 0;

            for (const log of finalLogs) {
                const totalSecs = (parseInt(log.minutes) || 0) * 60 + (parseInt(log.seconds) || 0);
                let bpmVal: number | null = parseInt(log.bpm_used);
                if (isNaN(bpmVal)) bpmVal = null;

                if (totalSecs === 0) {
                    if (log.idsToDelete.length > 0) {
                        await supabase.from('practice_logs').delete().in('id', log.idsToDelete);
                    }
                    continue;
                }

                totalRoutineSeconds += totalSecs;

                if (log.idsToDelete.length > 0) {
                    const mainId = log.idsToDelete[0];
                    const dups = log.idsToDelete.slice(1);
                    if (dups.length > 0) await supabase.from('practice_logs').delete().in('id', dups);
                    await supabase.from('practice_logs').update({ bpm_used: bpmVal, duration_seconds: totalSecs }).eq('id', mainId);
                } else {
                    await supabase.from('practice_logs').insert({
                        user_id: user.id,
                        session_id: sessionId,
                        exercise_id: log.exercise_id,
                        bpm_used: bpmVal,
                        duration_seconds: totalSecs,
                        created_at: new Date().toISOString()
                    });
                }
            }

            onEndSession(totalRoutineSeconds);
        } catch (e) { } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#141414', border: '1px solid rgba(220,185,138,0.2)', borderRadius: '12px', padding: '2.5rem', width: '100%', maxWidth: '550px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                <div style={{ flexShrink: 0, marginBottom: '1.5rem' }}>
                    <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: '0 0 0.5rem 0', lineHeight: 1 }}>{t('title')}</h2>
                    <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.95rem' }}>{t('subtitle')}</p>
                </div>
                <div className="logs-scroll" style={{ overflowY: 'auto', paddingRight: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {loadingLogs ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>{t('loading')}</div>
                    ) : (
                        finalLogs.map((log, i) => (
                            <div key={log.exercise_id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <p style={{ margin: '0 0 1rem 0', color: 'var(--text)', fontWeight: 600, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.title}</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        {showBpmInputs ? (
                                            <>
                                                <label style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(220,185,138,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', fontWeight: 700 }}>{t('bpmFinalLabel')}</label>
                                                <input type={log.hasFile ? 'number' : 'text'} placeholder="-" value={log.hasFile ? log.bpm_used : '---'} onChange={e => { if (log.hasFile) updateFinalLog(i, 'bpm_used', e.target.value); }} disabled={!log.hasFile} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--gold)', padding: '0.7rem', borderRadius: '6px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 700, outline: 'none', opacity: log.hasFile ? 1 : 0.3, cursor: log.hasFile ? 'auto' : 'not-allowed', boxSizing: 'border-box' }} />
                                            </>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                                                <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>{t('noBpmLog')}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(220,185,138,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', fontWeight: 700 }}>{t('timeLabel')}</label>
                                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                            <input type="number" placeholder="0" value={log.minutes} onChange={e => updateFinalLog(i, 'minutes', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.7rem', borderRadius: '6px', textAlign: 'center', outline: 'none', fontSize: '1.1rem', boxSizing: 'border-box' }} />
                                            <span style={{ color: 'var(--muted)', fontWeight: 'bold' }}>:</span>
                                            <input type="number" placeholder="00" value={log.seconds} onChange={e => updateFinalLog(i, 'seconds', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.7rem', borderRadius: '6px', textAlign: 'center', outline: 'none', fontSize: '1.1rem', boxSizing: 'border-box' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexShrink: 0 }}>
                    <button onClick={() => { onClose(); if (!isTimerRunning) onToggleTimer(); }} disabled={isSaving} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        {t('actions.backToPractice')}
                    </button>
                    <button onClick={confirmEndSession} disabled={isSaving} style={{ flex: 1, background: 'var(--gold)', border: 'none', color: '#111', padding: '1rem', borderRadius: '8px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: isSaving ? 0.5 : 1, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dark, #c9a676)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}>
                        {isSaving ? t('actions.saving') : t('actions.saveAndExit')}
                    </button>
                </div>
            </div>
        </div>
    );
}