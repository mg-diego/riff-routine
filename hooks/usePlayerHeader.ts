"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useMetronome } from './useMetronome';
import { Exercise } from '@/lib/types';
import { useTranslations } from 'next-intl';

interface UsePlayerHeaderOptions {
    mode:                  string;
    exercise:              Exercise | null | undefined;
    routineTargetBpm:      number | null;
    routineTargetDuration: number | null;
    elapsedSeconds:        number;
    isTimerRunning:        boolean;
    onToggleTimer:         () => void;
    onSaveExerciseLog:     (cur: number | null, goal: number | null, secs?: number) => Promise<void>;
    onBpmChange:           (bpm: number | null) => void;
    originalBpm:           number | null | undefined;
    sessionId:             string | null | undefined;
    disableBpmInputs:      boolean;
}

function playTimerAlert() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        [880, 1046, 1318].forEach((freq, i) => {
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine'; osc.frequency.value = freq;
            const t = ctx.currentTime + i * 0.2;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
            osc.start(t); osc.stop(t + 0.18);
        });
        setTimeout(() => ctx.close(), 900);
    } catch {}
}

export function usePlayerHeader({
    mode, exercise, routineTargetBpm, routineTargetDuration,
    elapsedSeconds: propElapsedSeconds, isTimerRunning, onToggleTimer,
    onSaveExerciseLog, onBpmChange, originalBpm, sessionId, disableBpmInputs,
}: UsePlayerHeaderOptions) {
    const router = useRouter();
    const t      = useTranslations('PlayerHeader');

    const isRoutine     = mode === 'routine';
    const isFree        = mode === 'free';
    const isPreviewMode = exercise?.is_system === true && exercise?.file_url != null;

    // ── BPM ──────────────────────────────────────────────────────────────────
    const [bpmCurrent, setBpmCurrent] = useState('');
    const [bpmGoal,    setBpmGoal]    = useState('');

    // ── Save ─────────────────────────────────────────────────────────────────
    const [isSaving, setIsSaving] = useState(false);
    const [saved,    setSaved]    = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // ── Timer ─────────────────────────────────────────────────────────────────
    const [timerDone,        setTimerDone]        = useState(false);
    const [showEndModal,     setShowEndModal]     = useState(false);
    const [exerciseTimes,    setExerciseTimes]    = useState<Record<string, number>>({});
    const [showTimerTooltip, setShowTimerTooltip] = useState(false);

    const alertedRef          = useRef(false);
    const tooltipTimerRef     = useRef<NodeJS.Timeout | null>(null);
    const shownForExerciseRef = useRef<string | null>(null);
    const autoPausedRef       = useRef(false);
    const isTimerRunningRef   = useRef(isTimerRunning);

    // ── Metronome ─────────────────────────────────────────────────────────────
    const [metronomeBpm, setMetronomeBpm] = useState<number>(100);
    const showBpmInputs  = exercise?.has_bpm !== false;
    const showMetronome  = exercise?.has_bpm === false || (mode === 'library' && !exercise?.file_url);
    const activeMetronomeBpm = showBpmInputs
        ? (parseInt(bpmCurrent) || exercise?.bpm_goal || exercise?.bpm_suggested || 100)
        : metronomeBpm;
    const { isMetronomePlaying, setIsMetronomePlaying, handleToggleMetronome } = useMetronome(activeMetronomeBpm);

    // ── Derived ───────────────────────────────────────────────────────────────
    const currentExerciseKey = exercise?.id || 'free-mode';
    const displaySeconds     = exerciseTimes[currentExerciseKey] !== undefined
        ? exerciseTimes[currentExerciseKey] : propElapsedSeconds;
    const timerPct     = routineTargetDuration ? Math.min(100, (displaySeconds / routineTargetDuration) * 100) : null;
    const bpmSuggested = exercise?.bpm_suggested || (exercise as any)?.bpm_initial || null;

    // ── Latest ref for unmount/beforeunload ───────────────────────────────────
    const latestRef = useRef({ displaySeconds, bpmCurrent, bpmGoal, exercise, saved, isPreviewMode });
    useEffect(() => {
        latestRef.current = { displaySeconds, bpmCurrent, bpmGoal, exercise, saved, isPreviewMode };
    }, [displaySeconds, bpmCurrent, bpmGoal, exercise, saved, isPreviewMode]);

    // ── Sync timer running ref ────────────────────────────────────────────────
    useEffect(() => { isTimerRunningRef.current = isTimerRunning; }, [isTimerRunning]);

    // ── Auto-pause on tab hide ────────────────────────────────────────────────
    useEffect(() => {
        const handle = () => {
            if (document.hidden) {
                if (isTimerRunningRef.current) { onToggleTimer(); autoPausedRef.current = true; }
            } else {
                if (autoPausedRef.current) { if (!isTimerRunningRef.current) onToggleTimer(); autoPausedRef.current = false; }
            }
        };
        document.addEventListener('visibilitychange', handle);
        return () => document.removeEventListener('visibilitychange', handle);
    }, [onToggleTimer]);

    // ── Auto-timer tooltip ────────────────────────────────────────────────────
    useEffect(() => {
        if (!isRoutine || !isTimerRunning) return;
        const key = exercise?.id || 'unknown';
        if (shownForExerciseRef.current === key) return;
        shownForExerciseRef.current = key;
        setShowTimerTooltip(true);
        tooltipTimerRef.current = setTimeout(() => setShowTimerTooltip(false), 3500);
        return () => { if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); };
    }, [isTimerRunning, exercise?.id, isRoutine]);

    // ── Reset on exercise change ──────────────────────────────────────────────
    useEffect(() => {
        alertedRef.current = false;
        setTimerDone(false);
        setIsMetronomePlaying(false);
    }, [exercise?.id, setIsMetronomePlaying]);

    // ── Timer done ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (routineTargetDuration && displaySeconds > 0 && displaySeconds >= routineTargetDuration && !alertedRef.current) {
            alertedRef.current = true;
            setTimerDone(true);
            playTimerAlert();
            setTimeout(() => setTimerDone(false), 4000);
        }
    }, [displaySeconds, routineTargetDuration]);

    // ── Sync elapsed seconds ──────────────────────────────────────────────────
    useEffect(() => {
        if (isTimerRunning)
            setExerciseTimes(prev => ({ ...prev, [currentExerciseKey]: propElapsedSeconds }));
    }, [propElapsedSeconds, isTimerRunning, currentExerciseKey]);

    // ── BPM goal sync ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (disableBpmInputs || !showBpmInputs || isPreviewMode) { setBpmGoal(''); return; }
        const goal = isRoutine && routineTargetBpm != null ? routineTargetBpm : exercise?.bpm_goal;
        setBpmGoal(goal?.toString() || '');
    }, [exercise?.id, routineTargetBpm, mode, disableBpmInputs, showBpmInputs, isPreviewMode]);

    // ── BPM current from last log ─────────────────────────────────────────────
    useEffect(() => {
        let mounted = true;
        if (disableBpmInputs || !exercise?.id || !showBpmInputs || isPreviewMode) {
            setBpmCurrent(''); onBpmChange(null); return;
        }
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !mounted) return;
            const { data } = await supabase
                .from('practice_logs').select('bpm_used')
                .eq('exercise_id', exercise.id).eq('user_id', user.id)
                .order('created_at', { ascending: false }).limit(1).maybeSingle();
            if (!mounted) return;
            if (data?.bpm_used) { setBpmCurrent(data.bpm_used.toString()); onBpmChange(data.bpm_used); }
            else setBpmCurrent('');
        })();
        return () => { mounted = false; };
    }, [exercise?.id, disableBpmInputs, showBpmInputs, isPreviewMode]);

    // ── BPM from score ────────────────────────────────────────────────────────
    useEffect(() => {
        if (originalBpm && !bpmCurrent && !disableBpmInputs && showBpmInputs && !isPreviewMode) {
            setBpmCurrent(originalBpm.toString());
            onBpmChange(originalBpm);
        }
    }, [originalBpm, disableBpmInputs, showBpmInputs, isPreviewMode]);

    // ── beforeunload guard ────────────────────────────────────────────────────
    useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            const { displaySeconds, saved, isPreviewMode } = latestRef.current;
            if (displaySeconds >= 60 && !saved && !isPreviewMode) { e.preventDefault(); e.returnValue = ''; }
        };
        const onLinkClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement).closest('a');
            if (!anchor || anchor.target === '_blank' || anchor.href === window.location.href) return;
            const { displaySeconds, saved, isPreviewMode } = latestRef.current;
            if (displaySeconds >= 60 && !saved && !isPreviewMode) {
                if (!window.confirm(t('alerts.unsavedTime'))) { e.preventDefault(); e.stopPropagation(); }
            }
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        document.addEventListener('click', onLinkClick, true);
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            document.removeEventListener('click', onLinkClick, true);
        };
    }, [t]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const _autoSave = async (secs: number, cur: string, goal: string) => {
        if (!exercise || secs < 60 || isPreviewMode) return;
        const parsedCur  = parseInt(cur);
        const bpmUsed    = !isNaN(parsedCur) && parsedCur > 0 ? parsedCur : (originalBpm || exercise.bpm_goal || null);
        const bpmGoalVal = goal ? parseInt(goal) : null;
        await onSaveExerciseLog(
            disableBpmInputs || !showBpmInputs ? null : bpmUsed,
            disableBpmInputs || !showBpmInputs || isNaN(bpmGoalVal as number) ? null : bpmGoalVal,
            secs,
        ).catch(() => {});
    };

    const handleNext = async (onNext: () => void) => {
        if (isRoutine) await _autoSave(displaySeconds, bpmCurrent, bpmGoal);
        onNext();
    };

    const handlePrev = async (onPrev: () => void) => {
        if (isRoutine) await _autoSave(displaySeconds, bpmCurrent, bpmGoal);
        onPrev();
    };

    const handleCloseClick = async (onEndSession: (secs?: number) => void) => {
        if (isFree) { onEndSession(); return; }
        if (!isRoutine) {
            if (displaySeconds >= 60 && !saved && !isPreviewMode)
                await _autoSave(displaySeconds, bpmCurrent, bpmGoal);
            onEndSession(); return;
        }
        if (isTimerRunning) onToggleTimer();
        if (!isPreviewMode) await _autoSave(displaySeconds, bpmCurrent, bpmGoal);
        if (!sessionId) { onEndSession(); return; }
        window.dispatchEvent(new CustomEvent('app:open-end-routine-modal'));
        setShowEndModal(true);
    };

    const handleSave = async () => {
        if (!exercise || isRoutine || isPreviewMode) return;
        setErrorMsg(''); setIsSaving(true);
        try {
            let cur: number | null = null, goal: number | null = null;
            if (!disableBpmInputs && showBpmInputs) {
                cur = parseInt(bpmCurrent);
                if (isNaN(cur) || cur <= 0) throw new Error(t('errors.invalidBpm'));
                goal = bpmGoal ? parseInt(bpmGoal) : null;
            }
            await onSaveExerciseLog(cur, isNaN(goal as number) ? null : goal, displaySeconds);
            setSaved(true); setTimeout(() => setSaved(false), 2500);
        } catch (err: any) {
            setErrorMsg(err.message || t('errors.saveError'));
        } finally { setIsSaving(false); }
    };

    const handleSaveToLibrary = async () => {
        if (!exercise) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Auth error');
            const { count } = await supabase.from('exercises').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
            if (profile?.subscription_tier === 'free' && count && count >= 10) {
                window.dispatchEvent(new CustomEvent('app:show-pro-modal')); return;
            }
            const { data: newEx, error } = await supabase.from('exercises').insert({
                user_id: user.id, title: exercise.title, technique: exercise.technique,
                file_url: exercise.file_url, is_system: false,
                bpm_suggested: exercise.bpm_suggested, bpm_goal: null,
                difficulty: exercise.difficulty, notes: exercise.notes,
            }).select().single();
            if (error) throw error;
            router.push(`/practice?id=${newEx.id}`);
        } catch (err) { console.error('Error forking exercise:', err); }
    };

    return {
        // state
        bpmCurrent, setBpmCurrent,
        bpmGoal,    setBpmGoal,
        isSaving, saved, errorMsg,
        timerDone, showEndModal, setShowEndModal,
        displaySeconds, timerPct, showTimerTooltip,
        metronomeBpm, setMetronomeBpm,
        // derived
        isPreviewMode, isRoutine, isFree,
        showBpmInputs, showMetronome, bpmSuggested,
        isMetronomePlaying, handleToggleMetronome,
        // handlers
        handleNext, handlePrev,
        handleCloseClick, handleSave, handleSaveToLibrary,
    };
}