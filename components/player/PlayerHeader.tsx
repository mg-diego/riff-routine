"use client";

import { useMemo, useState } from 'react';
import { Exercise } from '../../lib/types';
import { DropZone } from './DropZone';
import { EndSessionModal } from './EndSessionModal';
import { useTranslations } from 'next-intl';
import { usePlayerHeader } from '../../hooks/usePlayerHeader';

interface PlayerHeaderProps {
    mode: 'free' | 'library' | 'routine' | 'scales' | 'improvisation' | 'composition' | 'chords';
    routineList: any[];
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
    sessionId?: string | null;
    disableBpmInputs?: boolean;
    localSessionLogs: Record<string, { bpm: number | null, seconds: number }>;
}

const DIFF_COLORS: Record<number, string> = {
    1: '#4ade80', 2: '#a3e635', 3: '#facc15', 4: '#fb923c', 5: '#f87171',
};

function formatTime(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function ModeBadge({ cfg }: { cfg: { icon: string; label: string; color: string } }) {
    return (
        <div className="ph-badge" style={{ color: cfg.color }}>
            <span style={{ fontSize: '0.8rem' }}>{cfg.icon}</span>
            {cfg.label}
        </div>
    );
}

function TitleSection({ isFree, isRoutine, routineName, exercise, fileName, onFileLoaded, t }: any) {
    if (isFree) return (
        <div style={{ flex: 1 }}>
            <DropZone onFileLoaded={onFileLoaded ?? (() => { })} fileName={fileName ?? null} />
        </div>
    );
    return (
        <>
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
            {exercise?.difficulty && (
                <div className="ph-diff" style={{ color: DIFF_COLORS[exercise.difficulty] }}>
                    {t('labels.level', { diff: exercise.difficulty })}
                </div>
            )}
        </>
    );
}

function RoutineNavigation({ currentIndex, routineLength, onPrev, onNext }: any) {
    return (
        <div data-onboarding="practice-03" className="ph-routine-nav">
            <button className="ph-nav-btn" onClick={onPrev} disabled={currentIndex === 0}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div className="ph-nav-counter">{currentIndex + 1} / {routineLength}</div>
            <button className="ph-nav-btn" onClick={onNext} disabled={currentIndex === routineLength - 1}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
        </div>
    );
}

function BpmInputs({ isPreviewMode, disableBpmInputs, bpmCurrent, bpmGoal, setBpmCurrent, setBpmGoal, onBpmChange, isRoutine, bpmSuggested, handleSaveToLibrary, t }: any) {
    const disabled = isPreviewMode || disableBpmInputs;
    return (
        <div className="ph-bpm-section" style={{ position: 'relative' }}>
            <div className="ph-bpm-block">
                <span className="ph-bpm-label">{t('labels.currentBpm')}</span>
                <input
                    type={disabled ? 'text' : 'number'} className="ph-bpm-input"
                    value={disabled ? '---' : bpmCurrent} disabled={disabled}
                    onChange={e => { if (disabled) return; setBpmCurrent(e.target.value); const v = parseInt(e.target.value); if (!isNaN(v) && v > 0) onBpmChange(v); }}
                    placeholder="---"
                />
            </div>
            <div className="ph-bpm-sep" />
            <div className="ph-bpm-block">
                <span className="ph-bpm-label" style={{ color: 'rgba(255,255,255,0.3)' }}>{t('labels.targetBpm')}</span>
                {isRoutine || disabled ? (
                    <span className="ph-bpm-val" style={{ color: 'rgba(255,255,255,0.4)', opacity: disabled ? 0.3 : 1 }}>
                        {disabled ? '---' : (bpmGoal || '---')}
                    </span>
                ) : (
                    <input type="number" className="ph-bpm-input" style={{ color: 'rgba(255,255,255,0.6)', borderBottomColor: 'rgba(255,255,255,0.1)' }}
                        value={bpmGoal} onChange={e => setBpmGoal(e.target.value)} placeholder="---" />
                )}
            </div>
            {bpmSuggested && !disabled && (
                <div style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', maxWidth: '80px', lineHeight: 1.2 }}>
                    {t('labels.suggestedBpm')}<br />
                    <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{bpmSuggested} BPM</strong>
                </div>
            )}
            {isPreviewMode && (
                <div style={{ position: 'absolute', top: '100%', left: '1.75rem', marginTop: '0.5rem', background: 'rgba(220,185,138,0.1)', border: '1px solid rgba(220,185,138,0.3)', padding: '0.5rem 0.8rem', borderRadius: '8px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '1rem', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>{t('previewMode.message')}</span>
                    <button onClick={handleSaveToLibrary} style={{ background: 'var(--gold)', color: '#111', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                        {t('previewMode.button')}
                    </button>
                </div>
            )}
        </div>
    );
}

export function PlayerHeader({
    mode, routineList, routineLength, currentIndex, onPrev, onNext, onEndSession,
    exercise, routineTargetBpm = null, routineTargetDuration = null,
    elapsedSeconds, isTimerRunning, onToggleTimer,
    onSaveExerciseLog, onBpmChange, originalBpm, routineName,
    fileName, onFileLoaded, sessionId, disableBpmInputs = false, localSessionLogs
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

    const {
        bpmCurrent, setBpmCurrent, bpmGoal, setBpmGoal,
        isSaving, saved, errorMsg,
        timerDone, showEndModal, setShowEndModal,
        displaySeconds, timerPct, showTimerTooltip,
        metronomeBpm, setMetronomeBpm,
        isPreviewMode, isRoutine, isFree,
        showBpmInputs, showMetronome, bpmSuggested,
        isMetronomePlaying, handleToggleMetronome,
        handleNext, handlePrev, handleCloseClick, handleSave, handleSaveToLibrary,
    } = usePlayerHeader({
        mode, exercise, routineTargetBpm, routineTargetDuration,
        elapsedSeconds, isTimerRunning, onToggleTimer,
        onSaveExerciseLog, onBpmChange, originalBpm, sessionId, disableBpmInputs, initialSessionBpm: localSessionLogs[exercise?.id || '']?.bpm
    });

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
                .ph-routine-nav { display: flex; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden; flex-shrink: 0; }
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
                .ph-timer-btn { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; transition: all 0.2s; flex-shrink: 0; }
                .ph-timer-btn:hover { opacity: 0.85; }
                .ph-timer-display { display: flex; flex-direction: column; align-items: flex-start; }
                .ph-timer-status { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; transition: color 0.3s; }
                .ph-timer-val { font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; line-height: 1; font-variant-numeric: tabular-nums; transition: color 0.3s; }
                .ph-timer-target { color: var(--muted, #6a5f52); font-size: 1.2rem; }
                .ph-timer-track { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.05); }
                .ph-timer-fill { height: 100%; transition: width 1s linear, background 0.5s; }
                .ph-right-section { display: flex; align-items: center; justify-content: flex-end; gap: 1.5rem; padding: 0.75rem 1.75rem; }
                .ph-steps { display: flex; align-items: center; gap: 5px; }
                .ph-step { height: 4px; border-radius: 99px; transition: all 0.3s ease; background: rgba(255,255,255,0.1); flex: 1; min-width: 15px; max-width: 40px; }
                .ph-step.done   { background: rgba(167,139,250,0.5); }
                .ph-step.active { background: #a78bfa; box-shadow: 0 0 6px rgba(167,139,250,0.6); }
                .ph-save-btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; font-family: 'DM Sans', sans-serif; border: none; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
                .ph-save-btn.normal { background: var(--gold); color: #111; }
                .ph-save-btn.normal:hover { background: var(--gold-dark, #c9a676); }
                .ph-save-btn.saved  { background: #4ade80; color: #111; }
                .ph-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                @keyframes ph-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.5); } 70% { box-shadow: 0 0 0 10px rgba(74,222,128,0); } }
                .ph-timer-btn.done { animation: ph-pulse 0.7s ease 3; }
                .ph-timer-tooltip { position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%); background: rgba(167,139,250,0.15); border: 1px solid rgba(167,139,250,0.35); border-radius: 8px; padding: 0.45rem 0.75rem; white-space: nowrap; font-size: 0.72rem; font-weight: 600; color: #c4b5fd; pointer-events: none; display: flex; align-items: center; gap: 0.4rem; backdrop-filter: blur(6px); z-index: 20; }
                .ph-timer-tooltip::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: rgba(167,139,250,0.35); }
                @keyframes ph-tooltip-in  { from { opacity:0; transform:translateX(-50%) translateY(4px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
                @keyframes ph-tooltip-out { from { opacity:1; } to { opacity:0; } }
                .ph-timer-tooltip.entering { animation: ph-tooltip-in  0.25s ease forwards; }
                .ph-timer-tooltip.leaving  { animation: ph-tooltip-out 0.4s ease 3.1s forwards; }
            `}</style>

            <div data-onboarding="practice-01" className="ph-root">
                <div className="ph-row1">
                    <ModeBadge cfg={cfg} />
                    <div className="ph-divider" />
                    <TitleSection isFree={isFree} isRoutine={isRoutine} routineName={routineName}
                        exercise={exercise} fileName={fileName} onFileLoaded={onFileLoaded} t={t} />

                    {!isFree && isRoutine && routineLength > 1 && (
                        <RoutineNavigation currentIndex={currentIndex} routineLength={routineLength}
                            onPrev={() => handlePrev(onPrev)} onNext={() => handleNext(onNext)} />
                    )}

                    <button data-onboarding="practice-04" className="ph-close-btn"
                        onClick={() => handleCloseClick(onEndSession)}>
                        {isRoutine ? t('labels.endRoutine') : t('labels.closeExercise')}
                    </button>
                </div>

                {!isFree && (
                    <div className="ph-row2">
                        {showBpmInputs && (
                            <BpmInputs
                                isPreviewMode={isPreviewMode} disableBpmInputs={disableBpmInputs}
                                bpmCurrent={bpmCurrent} bpmGoal={bpmGoal}
                                setBpmCurrent={setBpmCurrent} setBpmGoal={setBpmGoal}
                                onBpmChange={onBpmChange} isRoutine={isRoutine}
                                bpmSuggested={bpmSuggested} t={t}
                                handleSaveToLibrary={handleSaveToLibrary}
                            />
                        )}

                        {showMetronome && (
                            <div className="ph-bpm-section" style={{ borderRight: 'none', paddingLeft: showBpmInputs ? 0 : '1.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {!showBpmInputs && (
                                        <div className="ph-bpm-block">
                                            <span className="ph-bpm-label" style={{ color: 'var(--gold)', opacity: 0.9 }}>{t('labels.metronome')}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <input type="number" min="30" max="240" className="ph-bpm-input" value={metronomeBpm || ''}
                                                    onChange={e => setMetronomeBpm(isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value))}
                                                    onBlur={() => setMetronomeBpm(Math.min(240, Math.max(30, metronomeBpm || 30)))}
                                                    style={{ width: '60px', textAlign: 'center', borderBottom: 'none', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', padding: '0.2rem' }}
                                                />
                                                <span style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'Bebas Neue, sans-serif' }}>BPM</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="ph-bpm-block" style={{ alignItems: 'center' }}>
                                        {showBpmInputs && <span className="ph-bpm-label" style={{ color: 'var(--gold)', opacity: 0.9, marginBottom: '4px' }}>{t('labels.metronome')}</span>}
                                        <button onClick={handleToggleMetronome} title={isMetronomePlaying ? t('tooltips.pauseMetronome') : t('tooltips.startMetronome')}
                                            style={{ width: '42px', height: '42px', borderRadius: '50%', background: isMetronomePlaying ? 'rgba(231,76,60,0.15)' : 'var(--gold)', color: isMetronomePlaying ? '#e74c3c' : '#111', border: isMetronomePlaying ? '1px solid rgba(231,76,60,0.4)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: isMetronomePlaying ? 'none' : '0 4px 12px rgba(220,185,138,0.25)', flexShrink: 0 }}
                                            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                                        >
                                            {isMetronomePlaying ? (
                                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M8.5 3h7l3 18h-13z" /><path d="M12 21l4.5-16" /><circle cx="14.25" cy="13" r="2.5" fill="currentColor" stroke="none" /><path d="M4.5 12.5A8.5 8.5 0 0 1 9 9" opacity="0.7" />
                                                </svg>
                                            ) : (
                                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M8.5 3h7l3 18h-13z" /><path d="M12 21V4" /><circle cx="12" cy="13" r="2.5" fill="currentColor" stroke="none" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="ph-timer-section" style={{ borderLeft: '1px solid rgba(255,255,255,0.04)' }}>
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
                                        background: timerDone ? 'rgba(74,222,128,0.12)' : isTimerRunning ? 'rgba(231,76,60,0.1)' : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${timerDone ? 'rgba(74,222,128,0.3)' : isTimerRunning ? 'rgba(231,76,60,0.2)' : 'rgba(255,255,255,0.07)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    {timerDone ? (
                                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    ) : isTimerRunning ? (
                                        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="3" width="6" height="18" rx="1" /><rect x="14" y="3" width="6" height="18" rx="1" /></svg>
                                    ) : (
                                        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '3px' }}><path d="M5 3L19 12L5 21V3Z" /></svg>
                                    )}
                                </button>
                            </div>

                            <div className="ph-timer-display">
                                <span className="ph-timer-status" style={{ color: timerDone ? '#4ade80' : isTimerRunning ? 'var(--gold)' : 'rgba(255,255,255,0.3)' }}>
                                    {timerDone ? t('labels.timerCompleted') : isTimerRunning ? t('labels.timerRunning') : t('labels.timerPaused')}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                                    <span className="ph-timer-val" style={{ color: timerDone ? '#4ade80' : 'var(--text, #f0e8dc)' }}>
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
                                    <button className={`ph-save-btn ${saved ? 'saved' : 'normal'}`}
                                        onClick={handleSave} disabled={isSaving || saved || isPreviewMode}>
                                        {isSaving ? t('labels.saving') : saved ? t('labels.saved') : t('labels.saveProgress')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {timerPct !== null && (
                            <div className="ph-timer-track">
                                <div className="ph-timer-fill" style={{ width: `${timerPct}%`, background: timerDone ? '#4ade80' : '#a78bfa' }} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showEndModal && sessionId && (
                <EndSessionModal
                    sessionId={sessionId}
                    isTimerRunning={isTimerRunning}
                    onToggleTimer={onToggleTimer}
                    onClose={() => setShowEndModal(false)}
                    onEndSession={secs => { setShowEndModal(false); onEndSession(secs); }}
                    localSessionLogs={localSessionLogs}
                    routineList={routineList}
                />
            )}
        </>
    );
}