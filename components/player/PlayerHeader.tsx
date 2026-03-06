"use client";

import { useState, useEffect } from 'react';
import { Exercise } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { DropZone } from './DropZone';

interface PlayerHeaderProps {
  mode: 'free' | 'library' | 'routine' | 'scales' | 'improvisation';
  routineLength: number;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onEndSession: () => void;
  exercise?: Exercise | null;
  routineTargetBpm?: number | null;
  routineTargetDuration?: number | null;
  elapsedSeconds: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  onSaveExerciseLog: (currentBpm: number, goalBpm: number | null) => Promise<void>;
  onBpmChange: (bpm: number | null) => void;
  originalBpm?: number | null;
  routineName?: string;
  fileName?: string | null;
  onFileLoaded?: (file: File) => void;
}

const MODE_CONFIG = {
  free: { label: 'Práctica Libre', color: '#7dd3fc' },
  library: { label: 'Ejercicio', color: 'var(--gold)' },
  routine: { label: 'Rutina', color: '#a78bfa' },
  scales: { label: 'Escalas', color: 'var(--gold)' },
  improvisation: { label: 'Improvisación', color: 'var(--gold)' },
};

const DIFF_COLORS: Record<number, string> = {
  1: '#4ade80', 2: '#a3e635', 3: '#facc15', 4: '#fb923c', 5: '#f87171',
};

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlayerHeader({
  mode, routineLength, currentIndex, onPrev, onNext, onEndSession,
  exercise, routineTargetBpm = null, routineTargetDuration = null,
  elapsedSeconds, isTimerRunning, onToggleTimer,
  onSaveExerciseLog, onBpmChange, originalBpm, routineName,
  fileName, onFileLoaded
}: PlayerHeaderProps) {
  const cfg = MODE_CONFIG[mode] ?? MODE_CONFIG.free;
  const isRoutine = mode === 'routine';
  const isFree = mode === 'free';

  const [bpmCurrent, setBpmCurrent] = useState('');
  const [bpmGoal, setBpmGoal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync goal BPM
  useEffect(() => {
    const goal = isRoutine && routineTargetBpm != null
      ? routineTargetBpm
      : exercise?.bpm_goal;
    setBpmGoal(goal?.toString() || '');
  }, [exercise?.id, routineTargetBpm, mode]);

  // Fetch last used BPM from practice_logs
  useEffect(() => {
    let mounted = true;
    if (!exercise?.id) { setBpmCurrent(''); onBpmChange(null); return; }

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
  }, [exercise?.id]);

  useEffect(() => {
    if (originalBpm && !bpmCurrent) {
      setBpmCurrent(originalBpm.toString());
      onBpmChange(originalBpm);
    }
  }, [originalBpm]);

  const handleSave = async () => {
    if (!exercise || isRoutine) return;
    setErrorMsg('');
    setIsSaving(true);
    try {
      const cur = parseInt(bpmCurrent);
      if (isNaN(cur) || cur <= 0) throw new Error('BPM inválido');
      const goal = bpmGoal ? parseInt(bpmGoal) : null;
      await onSaveExerciseLog(cur, isNaN(goal as number) ? null : goal);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isFree && !isRoutine && elapsedSeconds > 0 && !saved) {
      if (!window.confirm('Tienes tiempo sin registrar. ¿Seguro que quieres salir?')) return;
    }
    onEndSession();
  };

  const bpmSuggested = exercise?.bpm_suggested || exercise?.bpm_initial || null;
  const cats = exercise?.technique ? exercise.technique.split(', ') : [];
  const diff = exercise?.difficulty;
  const timerPct = routineTargetDuration
    ? Math.min(100, (elapsedSeconds / routineTargetDuration) * 100)
    : null;

  return (
    <>
      <style>{`
        .ph-root {
          display: flex; flex-direction: column; width: 100%; flex-shrink: 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          font-family: 'DM Sans', sans-serif;
        }

        /* ══ ROW 1 ══════════════════════════════════════════════════ */
        .ph-row1 {
          display: flex; 
          align-items: center; 
          gap: 0.75rem;
          width: 100%;
          box-sizing: border-box;
          padding: 0 1.75rem;
          background: #0e0e0e;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          min-height: 56px;
          overflow: hidden;
        }

        /* Left block: routine name + exercise name stacked */
        .ph-title-stack {
          display: flex; flex-direction: column; justify-content: center;
          flex: 1; min-width: 0; gap: 0.1rem;
        }
        .ph-routine-name {
          font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--muted, #6a5f52);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          display: flex; align-items: center; gap: 0.4rem;
        }
        .ph-routine-name-val { color: #a78bfa; }

        .ph-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.5rem; color: var(--text, #f0e8dc);
          margin: 0; line-height: 1.05;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .ph-badge {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.2rem 0.65rem; border-radius: 100px;
          font-size: 0.62rem; font-weight: 700; letter-spacing: 0.07em;
          text-transform: uppercase; border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03); flex-shrink: 0; white-space: nowrap;
        }

        .ph-divider { width: 1px; height: 16px; background: rgba(255,255,255,0.07); flex-shrink: 0; }

        .ph-diff {
          font-size: 0.62rem; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.25rem;
          flex-shrink: 0;
        }

        /* Routine pill nav */
        .ph-routine-nav {
          display: flex; align-items: center; gap: 0;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 100px; overflow: hidden; flex-shrink: 0;
        }
        .ph-nav-btn {
          display: flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; cursor: pointer;
          background: transparent; border: none; color: var(--text, #f0e8dc);
          transition: background 0.2s; flex-shrink: 0;
        }
        .ph-nav-btn:hover:not(:disabled) { background: rgba(255,255,255,0.06); }
        .ph-nav-btn:disabled { opacity: 0.25; cursor: not-allowed; }
        .ph-nav-counter {
          font-size: 0.72rem; font-weight: 700; color: var(--muted, #6a5f52);
          padding: 0 0.6rem; letter-spacing: 0.04em; white-space: nowrap;
          border-left: 1px solid rgba(255,255,255,0.06);
          border-right: 1px solid rgba(255,255,255,0.06);
        }

        /* Close / End session */
        .ph-close-btn {
          padding: 0.4rem 0.9rem; border-radius: 100px;
          font-size: 0.75rem; font-weight: 600; cursor: pointer;
          transition: all 0.2s; flex-shrink: 0; white-space: nowrap;
          font-family: 'DM Sans', sans-serif; max-width: 160px;
          overflow: hidden; text-overflow: ellipsis;
        }

        /* ══ ROW 2 (non-free modes) ══════════════════════════════════ */
        .ph-row2 {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          width: 100%;
          box-sizing: border-box;
          background: rgba(0,0,0,0.25);
          min-height: 64px;
        }

        /* BPM section (left) */
        .ph-bpm-section {
          display: flex; align-items: center; gap: 1.5rem;
          padding: 0.75rem 1.75rem;
          border-right: 1px solid rgba(255,255,255,0.04);
        }
        .ph-bpm-block { display: flex; flex-direction: column; gap: 2px; }
        .ph-bpm-label {
          font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .ph-bpm-val {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.6rem; line-height: 1; letter-spacing: 0.02em;
        }
        .ph-bpm-input {
          width: 56px; padding: 0; background: transparent; border: none;
          border-bottom: 1px solid; font-family: 'Bebas Neue', sans-serif;
          font-size: 1.6rem; line-height: 1; outline: none;
          letter-spacing: 0.02em;
        }
        .ph-bpm-sep { width: 1px; height: 32px; background: rgba(255,255,255,0.06); flex-shrink: 0; }

        /* Timer section (center) */
        .ph-timer-section {
          display: flex; align-items: center; gap: 1rem;
          padding: 0.75rem 2rem;
          border-right: 1px solid rgba(255,255,255,0.04);
          justify-content: center;
        }
        .ph-timer-btn {
          width: 38px; height: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; border: none; transition: all 0.2s; flex-shrink: 0;
        }
        .ph-timer-display { display: flex; flex-direction: column; align-items: flex-start; }
        .ph-timer-status {
          font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .ph-timer-val {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.8rem; line-height: 1; font-variant-numeric: tabular-nums;
          color: var(--text, #f0e8dc);
        }
        .ph-timer-target { color: var(--muted, #6a5f52); font-size: 1.2rem; }

        /* Timer progress bar */
        .ph-timer-track {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: rgba(255,255,255,0.05);
        }
        .ph-timer-fill {
          height: 100%; background: #a78bfa;
          transition: width 1s linear;
        }

        /* Progress + save section (right) */
        .ph-right-section {
          display: flex; align-items: center; justify-content: flex-end;
          gap: 1.5rem; padding: 0.75rem 1.75rem;
        }

        /* Step dots progress */
        .ph-steps { display: flex; align-items: center; gap: 5px; }
        .ph-step {
          height: 4px; border-radius: 99px;
          transition: all 0.3s ease; background: rgba(255,255,255,0.1);
        }
        .ph-step.done    { background: rgba(167,139,250,0.5); }
        .ph-step.active  { background: #a78bfa; box-shadow: 0 0 6px rgba(167,139,250,0.6); }

        /* Save button */
        .ph-save-btn {
          padding: 0.5rem 1.2rem; border-radius: 100px;
          font-size: 0.78rem; font-weight: 700; cursor: pointer;
          transition: all 0.2s; border: none; white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
        }

        /* Notes strip */
        .ph-notes-strip {
          padding: 0.4rem 1.75rem;
          background: rgba(255,255,255,0.01);
          border-top: 1px solid rgba(255,255,255,0.03);
          font-size: 0.75rem; color: rgba(255,255,255,0.3);
          line-height: 1.4;
          display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <header className="ph-root">

        {/* ══ ROW 1: badge · [routine/exercise titles] · diff · nav · close ══ */}
        <div className="ph-row1">

          {/* Mode badge */}
          <div className="ph-badge" style={{ color: cfg.color }}>
            {cfg.label}
          </div>

          <div className="ph-divider" />

          {/* Title stack: routine name (small) + exercise name (large) OR DropZone */}
          <div className="ph-title-stack">
            {isRoutine && routineName && (
              <div className="ph-routine-name">
                <span>Rutina</span>
                <span className="ph-routine-name-val">{routineName}</span>
              </div>
            )}

            {isFree ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <DropZone
                  fileName={fileName ?? null}
                  onFileLoaded={onFileLoaded || (() => { })}
                />
              </div>
            ) : (
              <h1 className="ph-title">
                {exercise?.title ?? ''}
              </h1>
            )}
          </div>

          {/* Difficulty */}
          {diff && DIFF_COLORS[diff] && (
            <span className="ph-diff" style={{ color: DIFF_COLORS[diff] }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: DIFF_COLORS[diff] }} />
              Nv.{diff}
            </span>
          )}

          {/* Routine navigation pill */}
          {isRoutine && routineLength > 0 && (
            <div className="ph-routine-nav">
              <button className="ph-nav-btn" onClick={onPrev} disabled={currentIndex === 0}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <span className="ph-nav-counter">{currentIndex + 1} / {routineLength}</span>
              <button className="ph-nav-btn" onClick={onNext} disabled={currentIndex === routineLength - 1}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}

          {/* Close / end session */}
          {isRoutine && routineLength > 0 && (
            <button
              className="ph-close-btn"
              onClick={handleClose}
              style={{
                background: '#a78bfa',
                color: '#111',
                border: 'none',
              }}
            >
              {'⏹ Finalizar'}
            </button>
          )}

        </div>

        {/* ══ ROW 2: BPM · Timer · Progress+Save (non-free only) ══ */}
        <div className="ph-row2" style={{ position: 'relative' }}>

          <div className="ph-bpm-section">
            <div className="ph-bpm-block" style={{ opacity: isFree ? 0.3 : 1 }}>
              <span className="ph-bpm-label" style={{ color: 'var(--muted, #6a5f52)' }}>Sugerido</span>
              <span className="ph-bpm-val" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {bpmSuggested ?? '—'}
              </span>
            </div>

            <div className="ph-bpm-sep" style={{ opacity: isFree ? 0.3 : 1 }} />

            <div className="ph-bpm-block">
              <span className="ph-bpm-label" style={{ color: 'var(--gold, #dcb98a)' }}>Actual</span>
              <input
                type="number"
                className="ph-bpm-input"
                value={bpmCurrent}
                placeholder="—"
                style={{ color: 'var(--gold, #dcb98a)', borderBottomColor: 'rgba(220,185,138,0.3)' }}
                onChange={e => {
                  setBpmCurrent(e.target.value);
                  const n = parseInt(e.target.value);
                  onBpmChange(!isNaN(n) && n > 0 ? n : null);
                }}
              />
            </div>

            <div className="ph-bpm-sep" style={{ opacity: isFree ? 0.3 : 1 }} />

            <div className="ph-bpm-block" style={{ opacity: isFree ? 0.3 : 1 }}>
              <span className="ph-bpm-label" style={{ color: '#a78bfa' }}>Objetivo</span>
              <input
                type="number"
                className="ph-bpm-input"
                value={bpmGoal}
                placeholder="—"
                style={{
                  color: '#a78bfa',
                  borderBottomColor: 'rgba(167,139,250,0.3)',
                  cursor: isFree || (exercise?.user_id === null && !isRoutine) ? 'not-allowed' : 'text'
                }}
                onChange={e => setBpmGoal(e.target.value)}
                disabled={isFree || (exercise?.user_id === null && !isRoutine)}
              />
            </div>
          </div>

          <div className="ph-timer-section" style={{ opacity: isFree ? 0.3 : 1, pointerEvents: isFree ? 'none' : 'auto' }}>
            <button
              className="ph-timer-btn"
              onClick={onToggleTimer}
              disabled={isFree}
              style={{
                background: isTimerRunning ? 'rgba(231,76,60,0.12)' : 'rgba(255,255,255,0.05)',
                color: isTimerRunning ? '#e74c3c' : 'var(--muted, #6a5f52)',
                border: `1px solid ${isTimerRunning ? 'rgba(231,76,60,0.25)' : 'rgba(255,255,255,0.07)'}`,
                cursor: isFree ? 'not-allowed' : 'pointer'
              }}
            >
              {isTimerRunning
                ? <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z" /></svg>
                : <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: 1 }}><path d="M8 5v14l11-7z" /></svg>
              }
            </button>

            <div className="ph-timer-display">
              <span className="ph-timer-status" style={{ color: isTimerRunning ? '#e74c3c' : 'var(--muted, #6a5f52)' }}>
                {isTimerRunning ? '● Grabando' : '⏸ Pausado'}
              </span>
              <span className="ph-timer-val">
                {formatTime(elapsedSeconds)}
                {routineTargetDuration && (
                  <span className="ph-timer-target"> / {formatTime(routineTargetDuration)}</span>
                )}
              </span>
            </div>
          </div>

          <div className="ph-right-section" style={{ opacity: isFree ? 0.3 : 1 }}>
            {isRoutine && routineLength > 1 && (
              <div className="ph-steps">
                {Array.from({ length: Math.min(routineLength, 10) }).map((_, i) => (
                  <div
                    key={i}
                    className={`ph-step ${i < currentIndex ? 'done' : i === currentIndex ? 'active' : ''}`}
                    style={{ width: i === currentIndex ? 20 : 8 }}
                  />
                ))}
                {routineLength > 10 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--muted)', marginLeft: 2 }}>+{routineLength - 10}</span>
                )}
              </div>
            )}

            {!isRoutine && (
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                <button
                  className="ph-save-btn"
                  onClick={handleSave}
                  disabled={isFree || isSaving || elapsedSeconds === 0}
                  style={{
                    background: saved ? 'rgba(74,222,128,0.1)' : 'var(--gold, #dcb98a)',
                    color: saved ? '#4ade80' : '#111',
                    opacity: (isFree || isSaving || elapsedSeconds === 0) ? 0.35 : 1,
                    cursor: (isFree || isSaving || elapsedSeconds === 0) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSaving ? 'Guardando…' : saved ? '✓ Registrado' : 'Guardar Progreso'}
                </button>
                {errorMsg && (
                  <span style={{ color: '#ef4444', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>{errorMsg}</span>
                )}
              </div>
            )}
          </div>

          {!isFree && timerPct !== null && (
            <div className="ph-timer-track">
              <div className="ph-timer-fill" style={{ width: `${timerPct}%` }} />
            </div>
          )}
        </div>

        {/* ══ Notes strip ══ */}
        {!isFree && exercise?.notes && (
          <div className="ph-notes-strip">📝 {exercise.notes}</div>
        )}

      </header>
    </>
  );
}