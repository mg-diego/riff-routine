"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Exercise } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { DropZone } from './DropZone';

interface PlayerHeaderProps {
  mode: 'free' | 'library' | 'routine' | 'scales' | 'improvisation';
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

const MODE_CONFIG = {
  free: { label: 'Práctica Libre', icon: '🎸', color: '#7dd3fc' },
  library: { label: 'Ejercicio', icon: '📚', color: 'var(--gold)' },
  routine: { label: 'Rutina', icon: '🔁', color: '#a78bfa' },
  scales: { label: 'Escalas', icon: '🎹', color: 'var(--gold)' },
  improvisation: { label: 'Improvisación', icon: '🎷', color: 'var(--gold)' },
};

const DIFF_COLORS: Record<number, string> = {
  1: '#4ade80', 2: '#a3e635', 3: '#facc15', 4: '#fb923c', 5: '#f87171',
};

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Sonido: 3 pitidos cortos ascendentes via Web Audio API ──────────────────
function playTimerAlert() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const beeps = [880, 1046, 1318]; // La5 → Do6 → Mi6
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
  } catch (e) {
    console.warn('[PlayerHeader] Web Audio not available:', e);
  }
}

export function PlayerHeader({
  mode, routineLength, currentIndex, onPrev, onNext, onEndSession,
  exercise, routineTargetBpm = null, routineTargetDuration = null,
  elapsedSeconds: propElapsedSeconds, isTimerRunning, onToggleTimer,
  onSaveExerciseLog, onBpmChange, originalBpm, routineName,
  fileName, onFileLoaded, onResetTimer, sessionId, disableBpmInputs = false
}: PlayerHeaderProps) {
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
  const [finalLogs, setFinalLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [exerciseTimes, setExerciseTimes] = useState<Record<string, number>>({});

  // Ref para disparar la alerta solo una vez por ejercicio
  const alertedRef = useRef(false);

  const currentExerciseKey = exercise?.id || 'free-mode';
  const displaySeconds = exerciseTimes[currentExerciseKey] !== undefined
    ? exerciseTimes[currentExerciseKey]
    : propElapsedSeconds;

  // ── Resetear alerta al cambiar de ejercicio ─────────────────────────────
  useEffect(() => {
    alertedRef.current = false;
    setTimerDone(false);
  }, [exercise?.id]);

  // ── Disparar aviso cuando se alcanza el tiempo objetivo ─────────────────
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

  // ── Sync exercise times ─────────────────────────────────────────────────
  useEffect(() => {
    if (isTimerRunning) {
      setExerciseTimes(prev => ({
        ...prev,
        [currentExerciseKey]: propElapsedSeconds
      }));
    }
  }, [propElapsedSeconds, isTimerRunning, currentExerciseKey]);

  useEffect(() => {
    if (isRoutine && isTimerRunning) onToggleTimer();
  }, [currentIndex]);

  // ── BPM sync ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (disableBpmInputs) { setBpmGoal(''); return; }
    const goal = isRoutine && routineTargetBpm != null ? routineTargetBpm : exercise?.bpm_goal;
    setBpmGoal(goal?.toString() || '');
  }, [exercise?.id, routineTargetBpm, mode, disableBpmInputs]);

  useEffect(() => {
    let mounted = true;
    if (disableBpmInputs || !exercise?.id) { setBpmCurrent(''); onBpmChange(null); return; }
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
  }, [exercise?.id, disableBpmInputs]);

  useEffect(() => {
    if (originalBpm && !bpmCurrent && !disableBpmInputs) {
      setBpmCurrent(originalBpm.toString());
      onBpmChange(originalBpm);
    }
  }, [originalBpm, disableBpmInputs]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const autoSaveLog = async () => {
    if (!exercise || displaySeconds === 0) return;
    try {
      let cur: number | null = null;
      let goal: number | null = null;
      if (!disableBpmInputs) {
        const parsedCur = parseInt(bpmCurrent);
        cur = !isNaN(parsedCur) && parsedCur > 0 ? parsedCur : (originalBpm || exercise.bpm_goal || null);
        goal = bpmGoal ? parseInt(bpmGoal) : null;
      }
      await onSaveExerciseLog(cur, isNaN(goal as number) ? null : goal, displaySeconds);
    } catch (err) { console.error(err); }
  };

  const handleNext = async () => { if (isRoutine) await autoSaveLog(); onNext(); };
  const handlePrev = async () => { if (isRoutine) await autoSaveLog(); onPrev(); };

  const handleCloseClick = async () => {
    if (isFree) { onEndSession(); return; }
    if (!isRoutine) {
      if (displaySeconds > 0 && !saved) {
        if (!window.confirm('Tienes tiempo sin registrar. ¿Seguro que quieres salir?')) return;
      }
      onEndSession(); return;
    }
    if (isTimerRunning) onToggleTimer();
    await autoSaveLog();
    if (!sessionId) { onEndSession(); return; }
    setLoadingLogs(true);
    setShowEndModal(true);
    try {
      const { data: sessionData } = await supabase.from('practice_sessions').select('routine_id').eq('id', sessionId).single();
      if (!sessionData?.routine_id) { onEndSession(); return; }
      const { data: routineExercises } = await supabase.from('routine_exercises').select('exercise_id, exercises(title, file_url)').eq('routine_id', sessionData.routine_id).order('order_index', { ascending: true });
      const { data: existingLogs } = await supabase.from('practice_logs').select('id, exercise_id, bpm_used, duration_seconds').eq('session_id', sessionId);
      const grouped: Record<string, any> = {};
      routineExercises?.forEach(re => {
        const ed = re.exercises as any;
        grouped[re.exercise_id] = { exercise_id: re.exercise_id, title: (Array.isArray(ed) ? ed[0]?.title : ed?.title) || 'Ejercicio', hasFile: !!(Array.isArray(ed) ? ed[0]?.file_url : ed?.file_url), bpm_used: '', duration_seconds: 0, idsToDelete: [] };
      });
      existingLogs?.forEach(log => {
        if (grouped[log.exercise_id]) {
          grouped[log.exercise_id].duration_seconds += log.duration_seconds;
          grouped[log.exercise_id].bpm_used = log.bpm_used?.toString() || '';
          grouped[log.exercise_id].idsToDelete.push(log.id);
        }
      });
      setFinalLogs(Object.values(grouped).map(g => ({ ...g, minutes: g.duration_seconds > 0 ? Math.floor(g.duration_seconds / 60).toString() : '', seconds: g.duration_seconds > 0 ? (g.duration_seconds % 60).toString() : '' })));
    } catch (err) { console.error(err); }
    finally { setLoadingLogs(false); }
  };

  const updateFinalLog = (index: number, field: string, value: string) => {
    const updated = [...finalLogs]; updated[index][field] = value; setFinalLogs(updated);
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
        if (totalSecs === 0) { if (log.idsToDelete.length > 0) await supabase.from('practice_logs').delete().in('id', log.idsToDelete); continue; }
        totalRoutineSeconds += totalSecs;
        if (log.idsToDelete.length > 0) {
          const mainId = log.idsToDelete[0];
          const dups = log.idsToDelete.slice(1);
          if (dups.length > 0) await supabase.from('practice_logs').delete().in('id', dups);
          await supabase.from('practice_logs').update({ bpm_used: bpmVal, duration_seconds: totalSecs }).eq('id', mainId);
        } else {
          await supabase.from('practice_logs').insert({ user_id: user.id, session_id: sessionId, exercise_id: log.exercise_id, bpm_used: bpmVal, duration_seconds: totalSecs, created_at: new Date().toISOString() });
        }
      }
      setShowEndModal(false);
      onEndSession(totalRoutineSeconds);
    } catch (e) { console.error(e); alert('Error'); }
    finally { setIsSaving(false); }
  };

  const handleSave = async () => {
    if (!exercise || isRoutine) return;
    setErrorMsg(''); setIsSaving(true);
    try {
      let cur: number | null = null, goal: number | null = null;
      if (!disableBpmInputs) {
        cur = parseInt(bpmCurrent);
        if (isNaN(cur) || cur <= 0) throw new Error('BPM inválido');
        goal = bpmGoal ? parseInt(bpmGoal) : null;
      }
      await onSaveExerciseLog(cur, isNaN(goal as number) ? null : goal, displaySeconds);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err: any) { setErrorMsg(err.message || 'Error al guardar'); }
    finally { setIsSaving(false); }
  };

  const bpmSuggested = exercise?.bpm_suggested || exercise?.bpm_initial || null;
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
        .ph-row2 { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.25); min-height: 64px; position: relative; }
        .ph-bpm-section { display: flex; align-items: center; gap: 1.5rem; padding: 0.75rem 1.75rem; border-right: 1px solid rgba(255,255,255,0.04); }
        .ph-bpm-block { display: flex; flex-direction: column; gap: 2px; }
        .ph-bpm-label { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(220,185,138,0.5); }
        .ph-bpm-val { font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; line-height: 1; letter-spacing: 0.02em; color: var(--text); }
        .ph-bpm-input { width: 56px; padding: 0; background: transparent; border: none; border-bottom: 1px solid rgba(220,185,138,0.3); font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; line-height: 1; outline: none; letter-spacing: 0.02em; color: var(--gold); transition: border-color 0.2s; }
        .ph-bpm-input:focus { border-color: var(--gold); }
        .ph-bpm-input:disabled { opacity: 0.3; cursor: not-allowed; border-bottom: none; }
        .ph-bpm-sep { width: 1px; height: 32px; background: rgba(255,255,255,0.06); flex-shrink: 0; }
        .ph-timer-section { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 2rem; border-right: 1px solid rgba(255,255,255,0.04); justify-content: center; position: relative; }
        .ph-timer-btn { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; transition: all 0.2s; flex-shrink: 0; background: rgba(255,255,255,0.05); color: var(--text); }
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

        /* Timer done pulse ring */
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
      `}</style>

      <div className="ph-root">
        {/* ── ROW 1 ─────────────────────────────────────────────────── */}
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
                  Rutina: <span className="ph-routine-name-val">{routineName}</span>
                </div>
              )}
              <h1 className="ph-title" title={exercise?.title || fileName || 'Sin archivo'}>
                {exercise?.title || fileName || 'Cargando...'}
              </h1>
            </div>
          )}

          {!isFree && exercise && diff && (
            <div className="ph-diff" style={{ color: DIFF_COLORS[diff] }}>Nv. {diff}</div>
          )}

          {!isFree && isRoutine && routineLength > 1 && (
            <div className="ph-routine-nav">
              <button className="ph-nav-btn" onClick={handlePrev} disabled={currentIndex === 0}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <div className="ph-nav-counter">{currentIndex + 1} / {routineLength}</div>
              <button className="ph-nav-btn" onClick={handleNext} disabled={currentIndex === routineLength - 1}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}

          <button className="ph-close-btn" onClick={handleCloseClick}>
            {isRoutine ? 'Finalizar Rutina' : 'Cerrar Ejercicio'}
          </button>
        </div>

        {/* ── ROW 2 ─────────────────────────────────────────────────── */}
        {!isFree && (
          <div className="ph-row2">

            {/* BPM */}
            <div className="ph-bpm-section">
              <div className="ph-bpm-block">
                <span className="ph-bpm-label">BPM Actual</span>
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
                <span className="ph-bpm-label" style={{ color: 'rgba(255,255,255,0.3)' }}>Objetivo</span>
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
                  Sugerido:<br /><strong style={{ color: 'rgba(255,255,255,0.5)' }}>{bpmSuggested} BPM</strong>
                </div>
              )}
            </div>

            {/* Timer */}
            <div className="ph-timer-section">
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
                }}
              >
                {timerDone ? (
                  // Checkmark cuando el tiempo se completó
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : isTimerRunning ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                )}
              </button>

              <div className="ph-timer-display">
                <span
                  className="ph-timer-status"
                  style={{
                    color: timerDone ? '#4ade80' : isTimerRunning ? 'var(--gold)' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {timerDone ? '✓ ¡Tiempo completado!' : isTimerRunning ? 'Practicando' : 'Pausado'}
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

            {/* Right: progress / save */}
            <div className="ph-right-section">
              {isRoutine ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', width: '100%', maxWidth: '200px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                    Progreso
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
                    {isSaving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar progreso'}
                  </button>
                </div>
              )}
            </div>

            {/* Barra de progreso del timer */}
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

      {/* ── Modal Finalizar Rutina ──────────────────────────────────── */}
      {showEndModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#141414', border: '1px solid rgba(220,185,138,0.2)', borderRadius: '12px', padding: '2.5rem', width: '100%', maxWidth: '550px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ flexShrink: 0, marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: '0 0 0.5rem 0', lineHeight: 1 }}>Finalizar Rutina</h2>
              <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.95rem' }}>Verifica y ajusta los datos finales de la sesión antes de guardar.</p>
            </div>
            <div className="logs-scroll" style={{ overflowY: 'auto', paddingRight: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {loadingLogs ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Cargando ejercicios...</div>
              ) : (
                finalLogs.map((log, i) => (
                  <div key={log.exercise_id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ margin: '0 0 1rem 0', color: 'var(--text)', fontWeight: 600, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.title}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(220,185,138,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', fontWeight: 700 }}>BPM Final</label>
                        <input type={log.hasFile ? 'number' : 'text'} placeholder="-" value={log.hasFile ? log.bpm_used : '---'} onChange={e => { if (log.hasFile) updateFinalLog(i, 'bpm_used', e.target.value); }} disabled={!log.hasFile} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--gold)', padding: '0.7rem', borderRadius: '6px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 700, outline: 'none', opacity: log.hasFile ? 1 : 0.3, cursor: log.hasFile ? 'auto' : 'not-allowed', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(220,185,138,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', fontWeight: 700 }}>Tiempo</label>
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
              <button onClick={() => { setShowEndModal(false); if (!isTimerRunning) onToggleTimer(); }} disabled={isSaving} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                Volver a la práctica
              </button>
              <button onClick={confirmEndSession} disabled={isSaving} style={{ flex: 1, background: 'var(--gold)', border: 'none', color: '#111', padding: '1rem', borderRadius: '8px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: isSaving ? 0.5 : 1, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dark, #c9a676)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}>
                {isSaving ? 'Guardando...' : 'Guardar y Salir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}