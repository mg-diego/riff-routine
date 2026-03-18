"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Exercise } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { DropZone } from './DropZone';
import { useMetronome } from '../../hooks/useMetronome';
import { EndSessionModal } from './EndSessionModal';
import { useTranslations } from 'next-intl';

interface PlayerHeaderProps {
  mode: 'free' | 'library' | 'routine' | 'scales' | 'improvisation' | 'composition' | 'chords';
  routineLength: number;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onEndSession: (overrideTotalSeconds?: number) => void;
  exercise?: Exercise | null;
  routineTargetBpm?: number | null;
  routineTargetDuration?: number | null;
  elapsedSeconds: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  onSaveExerciseLog: (currentBpm: number | null, goalBpm: number | null, overrideSeconds?: number) => Promise<void>;
  onBpmChange: (bpm: number | null) => void;
  originalBpm?: number | null;
  routineName?: string;
  fileName?: string | null;
  onFileLoaded?: (file: File) => void;
  onResetTimer?: () => void;
  sessionId?: string | null;
  disableBpmInputs?: boolean;
}

const DIFF_COLORS: Record<number, string> = {
  1: '#4ade80', 2: '#a3e635', 3: '#facc15', 4: '#fb923c', 5: '#f87171',
};

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function playTimerAlert() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const beeps = [880, 1046, 1318];
    beeps.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.2;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.18);
    });
    setTimeout(() => ctx.close(), 900);
  } catch (e) {}
}

export function PlayerHeader({
  mode, routineLength, currentIndex, onPrev, onNext, onEndSession,
  exercise, routineTargetBpm = null, routineTargetDuration = null,
  elapsedSeconds: propElapsedSeconds, isTimerRunning, onToggleTimer,
  onSaveExerciseLog, onBpmChange, originalBpm, routineName,
  fileName, onFileLoaded, sessionId, disableBpmInputs = false
}: PlayerHeaderProps) {
  const t = useTranslations('PlayerHeader');
  
  const MODE_CONFIG = useMemo(() => ({
    free: { label: t('modes.free'), icon: '🎸', color: '#7dd3fc' },
    library: { label: t('modes.library'), icon: '📚', color: 'var(--gold)' },
    routine: { label: t('modes.routine'), icon: '🔁', color: '#a78bfa' },
    scales: { label: t('modes.scales'), icon: '🎹', color: 'var(--gold)' },
    improvisation: { label: t('modes.improvisation'), icon: '🎷', color: 'var(--gold)' },
    composition: { label: t('modes.composition'), icon: '🧠', color: 'var(--gold)' },    
    chords: { label: t('modes.chords'), icon: '🎵', color: 'var(--gold)' },
  }), [t]);

  const cfg = MODE_CONFIG[mode] ?? MODE_CONFIG.free;
  const isRoutine = mode === 'routine';
  const isFree = mode === 'free';

  const [bpmCurrent, setBpmCurrent] = useState('');
  const [bpmGoal, setBpmGoal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [timerDone, setTimerDone] = useState(false);

  const [showEndModal, setShowEndModal] = useState(false);
  const [exerciseTimes, setExerciseTimes] = useState<Record<string, number>>({});
  
  const [metronomeBpm, setMetronomeBpm] = useState<number>(100);

  // ── Auto-timer tooltip ──────────────────────────────────────────────────
  const [showTimerTooltip, setShowTimerTooltip] = useState(false);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shownForExerciseRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isRoutine || !isTimerRunning) return;

    const exerciseKey = exercise?.id || 'unknown';
    if (shownForExerciseRef.current === exerciseKey) return;

    shownForExerciseRef.current = exerciseKey;
    setShowTimerTooltip(true);

    tooltipTimerRef.current = setTimeout(() => {
      setShowTimerTooltip(false);
    }, 3500);

    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, [isTimerRunning, exercise?.id, isRoutine]);
  // ───────────────────────────────────────────────────────────────────────

  // ── Auto-pause al cambiar de pestaña ─────────────────────────────────────
  const autoPausedRef = useRef(false);
  const isTimerRunningRef = useRef(isTimerRunning);

  // Mantenemos la referencia actualizada sin relanzar el effect principal
  useEffect(() => {
    isTimerRunningRef.current = isTimerRunning;
  }, [isTimerRunning]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Si el usuario cambia de pestaña y el timer está corriendo, lo pausamos y lo recordamos
        if (isTimerRunningRef.current) {
          onToggleTimer();
          autoPausedRef.current = true;
        }
      } else {
        // Si el usuario vuelve a la pestaña y fuimos nosotros quienes lo pausamos, lo reanudamos
        if (autoPausedRef.current) {
          if (!isTimerRunningRef.current) {
            onToggleTimer();
          }
          autoPausedRef.current = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onToggleTimer]);
  // ───────────────────────────────────────────────────────────────────────

  const alertedRef = useRef(false);

  const currentExerciseKey = exercise?.id || 'free-mode';
  const displaySeconds = exerciseTimes[currentExerciseKey] !== undefined
    ? exerciseTimes[currentExerciseKey]
    : propElapsedSeconds;

  const isMissingFile = !exercise?.file_url;
  const showBpmInputs = exercise?.has_bpm !== false;
  const showMetronome = exercise?.has_bpm === false || (mode === 'library' && isMissingFile);

  const activeMetronomeBpm = showBpmInputs 
    ? (parseInt(bpmCurrent) || exercise?.bpm_goal || exercise?.bpm_suggested || 100)
    : metronomeBpm;

  const { isMetronomePlaying, setIsMetronomePlaying, handleToggleMetronome } = useMetronome(activeMetronomeBpm);

  useEffect(() => {
    alertedRef.current = false;
    setTimerDone(false);
    setIsMetronomePlaying(false); 
  }, [exercise?.id, setIsMetronomePlaying]);

  useEffect(() => {
    if (
      routineTargetDuration &&
      displaySeconds > 0 &&
      displaySeconds >= routineTargetDuration &&
      !alertedRef.current
    ) {
      alertedRef.current = true;
      setTimerDone(true);
      playTimerAlert();
      setTimeout(() => setTimerDone(false), 4000);
    }
  }, [displaySeconds, routineTargetDuration]);

  useEffect(() => {
    if (isTimerRunning) {
      setExerciseTimes(prev => ({
        ...prev,
        [currentExerciseKey]: propElapsedSeconds
      }));
    }
  }, [propElapsedSeconds, isTimerRunning, currentExerciseKey]);

  useEffect(() => {
    if (disableBpmInputs || !showBpmInputs) { setBpmGoal(''); return; }
    const goal = isRoutine && routineTargetBpm != null ? routineTargetBpm : exercise?.bpm_goal;
    setBpmGoal(goal?.toString() || '');
  }, [exercise?.id, routineTargetBpm, mode, disableBpmInputs, showBpmInputs]);

  useEffect(() => {
    let mounted = true;
    if (disableBpmInputs || !exercise?.id || !showBpmInputs) { setBpmCurrent(''); onBpmChange(null); return; }
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
  }, [exercise?.id, disableBpmInputs, showBpmInputs]);

  useEffect(() => {
    if (originalBpm && !bpmCurrent && !disableBpmInputs && showBpmInputs) {
      setBpmCurrent(originalBpm.toString());
      onBpmChange(originalBpm);
    }
  }, [originalBpm, disableBpmInputs, showBpmInputs]);


  // ── Bloque de seguridad contra cierre, recarga y navegación ────────────
  const latestDataRef = useRef({
    displaySeconds,
    bpmCurrent,
    bpmGoal,
    exercise,
    saved
  });

  useEffect(() => {
    latestDataRef.current = { displaySeconds, bpmCurrent, bpmGoal, exercise, saved };
  }, [displaySeconds, bpmCurrent, bpmGoal, exercise, saved]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const { displaySeconds, saved } = latestDataRef.current;
      if (displaySeconds >= 60 && !saved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor || anchor.target === '_blank' || anchor.href === window.location.href) return;

      const { displaySeconds, saved } = latestDataRef.current;

      if (displaySeconds >= 60 && !saved) {
        const confirmLeave = window.confirm(t('alerts.unsavedTime') || 'You have unsaved practice time. Are you sure you want to leave?');
        if (!confirmLeave) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleLinkClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [t]);

  useEffect(() => {
    return () => {
      const { displaySeconds, bpmCurrent, bpmGoal, exercise, saved } = latestDataRef.current;
      
      if (displaySeconds >= 60 && !saved && exercise) {
        let cur: number | null = null;
        let goal: number | null = null;
        
        if (!disableBpmInputs && showBpmInputs) {
          const parsedCur = parseInt(bpmCurrent);
          cur = !isNaN(parsedCur) && parsedCur > 0 ? parsedCur : (originalBpm || exercise.bpm_goal || null);
          goal = bpmGoal ? parseInt(bpmGoal) : null;
        }
        
        onSaveExerciseLog(cur, isNaN(goal as number) ? null : goal, displaySeconds).catch(() => {});
      }
    };
  }, [onSaveExerciseLog, disableBpmInputs, showBpmInputs, originalBpm]);
  // ───────────────────────────────────────────────────────────────────────

  const autoSaveLog = async (secondsToSave: number, currentBpmValue: string, currentGoalValue: string) => {
    if (!exercise || secondsToSave < 60) return;
    try {
      let cur: number | null = null;
      let goal: number | null = null;
      if (!disableBpmInputs && showBpmInputs) {
        const parsedCur = parseInt(currentBpmValue);
        cur = !isNaN(parsedCur) && parsedCur > 0 ? parsedCur : (originalBpm || exercise.bpm_goal || null);
        goal = currentGoalValue ? parseInt(currentGoalValue) : null;
      }
      await onSaveExerciseLog(cur, isNaN(goal as number) ? null : goal, secondsToSave);
    } catch (err) {}
  };

  const handleNext = async () => { 
    if (isRoutine) await autoSaveLog(displaySeconds, bpmCurrent, bpmGoal); 
    onNext(); 
  };
  
  const handlePrev = async () => { 
    if (isRoutine) await autoSaveLog(displaySeconds, bpmCurrent, bpmGoal); 
    onPrev(); 
  };

  const handleCloseClick = async () => {
    if (isFree) { 
      onEndSession(); 
      return; 
    }
    
    if (!isRoutine) {
      if (displaySeconds >= 60 && !saved) {
        await autoSaveLog(displaySeconds, bpmCurrent, bpmGoal);
      }
      onEndSession(); 
      return;
    }

    if (isTimerRunning) onToggleTimer();
    await autoSaveLog(displaySeconds, bpmCurrent, bpmGoal);
    
    if (!sessionId) { 
      onEndSession(); 
      return; 
    }
    window.dispatchEvent(new CustomEvent('app:open-end-routine-modal'));
    setShowEndModal(true);
  };

  const handleSave = async () => {
    if (!exercise || isRoutine) return;
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
    } catch (err: any) { setErrorMsg(err.message || t('errors.saveError')); }
    finally { setIsSaving(false); }
  };

  const bpmSuggested = exercise?.bpm_suggested || null;
  const diff = exercise?.difficulty;
  const timerPct = routineTargetDuration ? Math.min(100, (displaySeconds / routineTargetDuration) * 100) : null;

  return (
    <>
      <style>{`
        .ph-root { display: flex; flex-direction: column; width: 100%; flex-shrink: 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-family: 'DM Sans', sans-serif; }
        .ph-row1 { display: flex; align-items: center; gap: 0.75rem; width: 100%; box-sizing: border-box; padding: 0 1.75rem; background: #0e0e0e; border-bottom: 1px solid rgba(255,255,255,0.04); min-height: 56px; overflow: hidden; }
        .ph-title-stack { display: flex; flex-direction: column; justify-content: center; flex: 1; min-width: 0; gap: 0.1rem; }
        .ph-routine-name { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted, #6a5f52); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; gap: 0.4rem; }
        .ph-routine-name-val { color: #a78bfa; }
        .ph-title { font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; color: var(--text, #f0e8dc); margin: 0; line-height: 1.05; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ph-badge { display: flex; align-items: center; gap: 0.4rem; padding: 0.2rem 0.65rem; border-radius: 100px; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03); flex-shrink: 0; white-space: nowrap; }
        .ph-divider { width: 1px; height: 16px; background: rgba(255,255,255,0.07); flex-shrink: 0; }
        .ph-diff { font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0; }
        .ph-routine-nav { display: flex; align-items: center; gap: 0; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden; flex-shrink: 0; }
        .ph-nav-btn { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; cursor: pointer; background: transparent; border: none; color: var(--text, #f0e8dc); transition: background 0.2s; flex-shrink: 0; }
        .ph-nav-btn:hover:not(:disabled) { background: rgba(255,255,255,0.06); }
        .ph-nav-btn:disabled { opacity: 0.25; cursor: not-allowed; }
        .ph-nav-counter { font-size: 0.72rem; font-weight: 700; color: var(--muted, #6a5f52); padding: 0 0.6rem; letter-spacing: 0.04em; white-space: nowrap; border-left: 1px solid rgba(255,255,255,0.06); border-right: 1px solid rgba(255,255,255,0.06); }
        .ph-close-btn { padding: 0.4rem 0.9rem; border-radius: 100px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s; flex-shrink: 0; white-space: nowrap; font-family: 'DM Sans', sans-serif; max-width: 160px; overflow: hidden; text-overflow: ellipsis; background: rgba(255,255,255,0.05); color: var(--text); border: 1px solid rgba(255,255,255,0.1); }
        .ph-close-btn:hover { background: rgba(231,76,60,0.2); color: #e74c3c; border-color: rgba(231,76,60,0.5); }
        .ph-row2 { display: flex; align-items: center; justify-content: space-between; width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.25); min-height: 64px; position: relative; }
        .ph-bpm-section { display: flex; align-items: center; gap: 1.5rem; padding: 0.75rem 1.75rem; border-right: 1px solid rgba(255,255,255,0.04); flex-wrap: nowrap; }
        .ph-bpm-block { display: flex; flex-direction: column; gap: 2px; }
        .ph-bpm-label { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(220,185,138,0.5); }
        .ph-bpm-val { font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; line-height: 1; letter-spacing: 0.02em; color: var(--text); }
        .ph-bpm-input { width: 56px; padding: 0; background: transparent; border: none; border-bottom: 1px solid rgba(220,185,138,0.3); font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; line-height: 1; outline: none; letter-spacing: 0.02em; color: var(--gold); transition: border-color 0.2s; }
        .ph-bpm-input:focus { border-color: var(--gold); }
        .ph-bpm-input:disabled { opacity: 0.3; cursor: not-allowed; border-bottom: none; }
        .ph-bpm-sep { width: 1px; height: 32px; background: rgba(255,255,255,0.06); flex-shrink: 0; }
        .ph-timer-section { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 2rem; border-right: 1px solid rgba(255,255,255,0.04); justify-content: center; flex: 1; }
        .ph-timer-btn { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; transition: all 0.2s; flex-shrink: 0; background: rgba(255,255,255,0.05); color: var(--text); }
        .ph-timer-btn:hover { background: rgba(255,255,255,0.1); }
        .ph-timer-display { display: flex; flex-direction: column; align-items: flex-start; }
        .ph-timer-status { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; transition: color 0.3s; }
        .ph-timer-val { font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; line-height: 1; font-variant-numeric: tabular-nums; transition: color 0.3s; }
        .ph-timer-target { color: var(--muted, #6a5f52); font-size: 1.2rem; }
        .ph-timer-track { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.05); }
        .ph-timer-fill { height: 100%; transition: width 1s linear, background 0.5s; }
        .ph-right-section { display: flex; align-items: center; justify-content: flex-end; gap: 1.5rem; padding: 0.75rem 1.75rem; }
        .ph-steps { display: flex; align-items: center; gap: 5px; }
        .ph-step { height: 4px; border-radius: 99px; transition: all 0.3s ease; background: rgba(255,255,255,0.1); flex: 1; min-width: 15px; max-width: 40px; }
        .ph-step.done    { background: rgba(167,139,250,0.5); }
        .ph-step.active  { background: #a78bfa; box-shadow: 0 0 6px rgba(167,139,250,0.6); }
        .ph-save-btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; font-family: 'DM Sans', sans-serif; border: none; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .ph-save-btn.normal { background: var(--gold); color: #111; }
        .ph-save-btn.normal:hover { background: var(--gold-dark, #c9a676); }
        .ph-save-btn.saved { background: #4ade80; color: #111; }
        @keyframes ph-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.5); }
          70%  { box-shadow: 0 0 0 10px rgba(74,222,128,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
        }
        .ph-timer-btn.done { animation: ph-pulse 0.7s ease 3; }
        .logs-scroll::-webkit-scrollbar { width: 6px; }
        .logs-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 4px; }
        .logs-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .logs-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

        /* ── Auto-timer tooltip ── */
        .ph-timer-tooltip {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          background: rgba(167,139,250,0.15);
          border: 1px solid rgba(167,139,250,0.35);
          border-radius: 8px;
          padding: 0.45rem 0.75rem;
          white-space: nowrap;
          font-size: 0.72rem;
          font-weight: 600;
          color: #c4b5fd;
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          backdrop-filter: blur(6px);
          z-index: 20;
        }
        .ph-timer-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: rgba(167,139,250,0.35);
        }
        @keyframes ph-tooltip-in {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes ph-tooltip-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        .ph-timer-tooltip.entering { animation: ph-tooltip-in 0.25s ease forwards; }
        .ph-timer-tooltip.leaving  { animation: ph-tooltip-out 0.4s ease 3.1s forwards; }
      `}</style>

      <div data-onboarding="practice-01" className="ph-root">
        <div className="ph-row1">
          <div className="ph-badge" style={{ color: cfg.color }}>
            <span style={{ fontSize: '0.8rem' }}>{cfg.icon}</span>
            {cfg.label}
          </div>

          <div className="ph-divider" />

          {isFree ? (
            <div style={{ flex: 1 }}>
              <DropZone onFileLoaded={onFileLoaded ?? (() => {})} fileName={fileName ?? null} />
            </div>
          ) : (
            <div className="ph-title-stack">
              {isRoutine && routineName && (
                <div className="ph-routine-name">
                  {t('labels.routine')} <span className="ph-routine-name-val">{routineName}</span>
                </div>
              )}
              <h1 className="ph-title" title={exercise?.title || fileName || t('labels.noFile')}>
                {exercise?.title || fileName || t('labels.loading')}
              </h1>
            </div>
          )}

          {!isFree && exercise && diff && (
            <div className="ph-diff" style={{ color: DIFF_COLORS[diff] }}>{t('labels.level', { diff })}</div>
          )}

          {!isFree && isRoutine && routineLength > 1 && (
            <div data-onboarding="practice-03" className="ph-routine-nav">
              <button className="ph-nav-btn" onClick={handlePrev} disabled={currentIndex === 0}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <div className="ph-nav-counter">{currentIndex + 1} / {routineLength}</div>
              <button className="ph-nav-btn" onClick={handleNext} disabled={currentIndex === routineLength - 1}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}

          <button data-onboarding="practice-04" className="ph-close-btn" onClick={handleCloseClick}>
            {isRoutine ? t('labels.endRoutine') : t('labels.closeExercise')}
          </button>
        </div>

        {!isFree && (
          <div className="ph-row2">
            <div className="ph-bpm-section">
              {showBpmInputs && (
                <>
                  <div className="ph-bpm-block">
                    <span className="ph-bpm-label">{t('labels.currentBpm')}</span>
                    <input
                      type={disableBpmInputs ? 'text' : 'number'}
                      className="ph-bpm-input"
                      value={disableBpmInputs ? '---' : bpmCurrent}
                      disabled={disableBpmInputs}
                      onChange={e => {
                        if (disableBpmInputs) return;
                        setBpmCurrent(e.target.value);
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val > 0) onBpmChange(val);
                      }}
                      placeholder="---"
                    />
                  </div>

                  <div className="ph-bpm-sep" />

                  <div className="ph-bpm-block">
                    <span className="ph-bpm-label" style={{ color: 'rgba(255,255,255,0.3)' }}>{t('labels.targetBpm')}</span>
                    {isRoutine || disableBpmInputs ? (
                      <span className="ph-bpm-val" style={{ color: 'rgba(255,255,255,0.4)', opacity: disableBpmInputs ? 0.3 : 1 }}>
                        {disableBpmInputs ? '---' : (bpmGoal || '---')}
                      </span>
                    ) : (
                      <input
                        type="number"
                        className="ph-bpm-input"
                        style={{ color: 'rgba(255,255,255,0.6)', borderBottomColor: 'rgba(255,255,255,0.1)' }}
                        value={bpmGoal}
                        onChange={e => setBpmGoal(e.target.value)}
                        placeholder="---"
                      />
                    )}
                  </div>

                  {bpmSuggested && !disableBpmInputs && (
                    <div style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', maxWidth: '80px', lineHeight: 1.2 }}>
                      {t('labels.suggestedBpm')}<br /><strong style={{ color: 'rgba(255,255,255,0.5)' }}>{bpmSuggested} BPM</strong>
                    </div>
                  )}
                </>
              )}

              {showBpmInputs && showMetronome && (
                <div className="ph-bpm-sep" style={{ margin: '0 0.5rem' }} />
              )}

              {showMetronome && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  
                  {!showBpmInputs && (
                    <div className="ph-bpm-block">
                      <span className="ph-bpm-label" style={{ color: 'var(--gold)', opacity: 0.9 }}>{t('labels.metronome')}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <input
                          type="number"
                          min="30"
                          max="240"
                          className="ph-bpm-input"
                          value={metronomeBpm || ''}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            setMetronomeBpm(isNaN(val) ? 0 : val);
                          }}
                          onBlur={() => {
                            let val = metronomeBpm;
                            if (!val || val < 30) val = 30;
                            if (val > 240) val = 240;
                            setMetronomeBpm(val);
                          }}
                          style={{ width: '60px', textAlign: 'center', borderBottom: 'none', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', padding: '0.2rem' }}
                        />
                        <span style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>BPM</span>
                      </div>
                    </div>
                  )}

                  <div className="ph-bpm-block" style={{ alignItems: 'center', justifyContent: 'center' }}>
                    {showBpmInputs && <span className="ph-bpm-label" style={{ color: 'var(--gold)', opacity: 0.9, marginBottom: '4px' }}>{t('labels.metronome')}</span>}
                    <button
                      onClick={handleToggleMetronome}
                      style={{
                        width: '42px', height: '42px', borderRadius: '50%',
                        background: isMetronomePlaying ? 'rgba(231,76,60,0.15)' : 'var(--gold)',
                        color: isMetronomePlaying ? '#e74c3c' : '#111',
                        border: isMetronomePlaying ? '1px solid rgba(231,76,60,0.4)' : 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: isMetronomePlaying ? 'none' : '0 4px 12px rgba(220,185,138,0.25)',
                        flexShrink: 0
                      }}
                      onMouseEnter={e => {
                        if(!isMetronomePlaying) {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.background = '#c9a676';
                        } else {
                          e.currentTarget.style.background = 'rgba(231,76,60,0.25)';
                        }
                      }}
                      onMouseLeave={e => {
                        if(!isMetronomePlaying) {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.background = 'var(--gold)';
                        } else {
                          e.currentTarget.style.background = 'rgba(231,76,60,0.15)';
                        }
                      }}
                      title={isMetronomePlaying ? t('tooltips.pauseMetronome') : t('tooltips.startMetronome')}
                    >
                      {isMetronomePlaying ? (
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8.5 3h7l3 18h-13z" />
                          <path d="M12 21l4.5-16" />
                          <circle cx="14.25" cy="13" r="2.5" fill="currentColor" stroke="none" />
                          <path d="M4.5 12.5A8.5 8.5 0 0 1 9 9" opacity="0.7" />
                        </svg>
                      ) : (
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8.5 3h7l3 18h-13z" />
                          <path d="M12 21V4" />
                          <circle cx="12" cy="13" r="2.5" fill="currentColor" stroke="none" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="ph-timer-section">
              {/* Timer button with auto-start tooltip */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {showTimerTooltip && (
                  <div className="ph-timer-tooltip entering leaving">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    {t('labels.timerAutoStarted')}
                  </div>
                )}
                <button
                  className={`ph-timer-btn${timerDone ? ' done' : ''}`}
                  onClick={onToggleTimer}
                  style={{
                    color: timerDone ? '#4ade80' : isTimerRunning ? '#e74c3c' : '#4ade80',
                    background: timerDone
                      ? 'rgba(74,222,128,0.12)'
                      : isTimerRunning
                        ? 'rgba(231,76,60,0.1)'
                        : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${timerDone ? 'rgba(74,222,128,0.3)' : isTimerRunning ? 'rgba(231,76,60,0.2)' : 'rgba(255,255,255,0.07)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {timerDone ? (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isTimerRunning ? (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="4" y="3" width="6" height="18" rx="1" />
                      <rect x="14" y="3" width="6" height="18" rx="1" />
                    </svg>
                  ) : (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '3px' }}>
                      <path d="M5 3L19 12L5 21V3Z" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="ph-timer-display">
                <span
                  className="ph-timer-status"
                  style={{
                    color: timerDone ? '#4ade80' : isTimerRunning ? 'var(--gold)' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {timerDone ? t('labels.timerCompleted') : isTimerRunning ? t('labels.timerRunning') : t('labels.timerPaused')}
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                  <span
                    className="ph-timer-val"
                    style={{ color: timerDone ? '#4ade80' : 'var(--text, #f0e8dc)' }}
                  >
                    {formatTime(displaySeconds || 0)}
                  </span>
                  {routineTargetDuration && (
                    <span className="ph-timer-target">/ {formatTime(routineTargetDuration)}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="ph-right-section">
              {isRoutine ? (
                <div data-onboarding="practice-03" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', width: '100%', maxWidth: '200px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                    {t('labels.progress')}
                  </span>
                  <div className="ph-steps" style={{ width: '100%' }}>
                    {Array.from({ length: routineLength }).map((_, i) => (
                      <div key={i} className={`ph-step ${i < currentIndex ? 'done' : i === currentIndex ? 'active' : ''}`} />
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {errorMsg && <span style={{ color: '#e74c3c', fontSize: '0.75rem', fontWeight: 600 }}>{errorMsg}</span>}
                  <button className={`ph-save-btn ${saved ? 'saved' : 'normal'}`} onClick={handleSave} disabled={isSaving || saved}>
                    {isSaving ? t('labels.saving') : saved ? t('labels.saved') : t('labels.saveProgress')}
                  </button>
                </div>
              )}
            </div>

            {timerPct !== null && (
              <div className="ph-timer-track">
                <div
                  className="ph-timer-fill"
                  style={{
                    width: `${timerPct}%`,
                    background: timerDone ? '#4ade80' : '#a78bfa',
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {showEndModal && sessionId && (
        <EndSessionModal
          sessionId={sessionId}
          showBpmInputs={showBpmInputs}
          isTimerRunning={isTimerRunning}
          onToggleTimer={onToggleTimer}
          onClose={() => setShowEndModal(false)}
          onEndSession={(overrideTotalSeconds) => {
            setShowEndModal(false);
            onEndSession(overrideTotalSeconds);
          }}
        />
      )}
    </>
  );
}