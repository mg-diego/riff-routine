"use client";

import { useMemo, useState } from 'react';
import { Exercise } from '@/lib/types';
import { DIFFICULTY_COLORS } from '@/lib/constants';
import { PracticeMode } from '@/lib/practiceModes';
import { formatClock } from '@/lib/utils';
import { DropZone } from './DropZone';
import { EndSessionModal } from './EndSessionModal';
import { useTranslations } from 'next-intl';
import { usePlayerHeader } from '@/hooks/usePlayerHeader';
import { RoutineListItem } from '@/hooks/usePlayerContext';
import styles from './PlayerHeader.module.css';
import { cx } from '@/lib/cx';

interface PlayerHeaderProps {
    mode: PracticeMode;
    routineList: RoutineListItem[];
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

function ModeBadge({ cfg }: { cfg: { icon: string; label: string; color: string } }) {
    return (
        <div className={styles['ph-badge']} style={{ color: cfg.color }}>
            <span className={styles.label}>{cfg.icon}</span>
            {cfg.label}
        </div>
    );
}

function TitleSection({ isFree, isRoutine, routineName, exercise, fileName, onFileLoaded, t, isPdf }: any) {
    if (isFree) return (
        <div className={styles.block}>
            <DropZone onFileLoaded={onFileLoaded ?? (() => { })} fileName={fileName ?? null} />
        </div>
    );

    const hasFile = !!(exercise?.file_url || fileName);

    return (
        <>
            <div className={styles['ph-title-stack']}>
                {isRoutine && routineName && (
                    <div className={styles['ph-routine-name']}>
                        {t('labels.routine')} <span className={styles['ph-routine-name-val']}>{routineName}</span>
                    </div>
                )}
                <div className={styles.noFileRow}>
                    <h1 className={styles['ph-title']} title={exercise?.title || fileName || t('labels.noFile')}>
                        {exercise?.title || fileName || t('labels.loading')}
                    </h1>
                    
                    {hasFile && (
                        <span className={styles.noFileRowLabel} style={{ background: isPdf ? 'rgba(231, 76, 60, 0.15)' : 'rgba(52, 152, 219, 0.15)', color: isPdf ? '#e74c3c' : '#3498db' }}>
                            {isPdf ? '📄 PDF' : '🎵 GP5'}
                        </span>
                    )}
                </div>
            </div>
            {exercise?.difficulty && (
                <div className={styles['ph-diff']} style={{ color: DIFFICULTY_COLORS[exercise.difficulty] }}>
                    {t('labels.level', { diff: exercise.difficulty })}
                </div>
            )}
        </>
    );
}

function RoutineNavigation({ currentIndex, routineLength, onPrev, onNext }: any) {
    return (
        <div data-onboarding="practice-03" className={styles['ph-routine-nav']}>
            <button className={styles['ph-nav-btn']} onClick={onPrev} disabled={currentIndex === 0}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div className={styles['ph-nav-counter']}>{currentIndex + 1} / {routineLength}</div>
            <button className={styles['ph-nav-btn']} onClick={onNext} disabled={currentIndex === routineLength - 1}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
        </div>
    );
}

function BpmInputs({ isPreviewMode, disableBpmInputs, bpmCurrent, bpmGoal, setBpmCurrent, setBpmGoal, onBpmChange, isRoutine, bpmSuggested, handleSaveToLibrary, t }: any) {
    const disabled = isPreviewMode || disableBpmInputs;
    return (
        <div className={cx(styles['ph-bpm-section'], styles.currentBpm)}>
            <div className={styles['ph-bpm-block']}>
                <span className={styles['ph-bpm-label']}>{t('labels.currentBpm')}</span>
                <input
                    type={disabled ? 'text' : 'number'} className={styles['ph-bpm-input']}
                    value={disabled ? '---' : bpmCurrent} disabled={disabled}
                    onChange={e => { if (disabled) return; setBpmCurrent(e.target.value); const v = parseInt(e.target.value); if (!isNaN(v) && v > 0) onBpmChange(v); }}
                    placeholder="---"
                />
            </div>
            <div className={styles['ph-bpm-sep']} />
            <div className={styles['ph-bpm-block']}>
                <span className={cx(styles['ph-bpm-label'], styles.targetBpmLabel)}>{t('labels.targetBpm')}</span>
                {isRoutine || disabled ? (
                    <span className={cx(styles['ph-bpm-val'], styles.currentBpmLabel)} style={{ opacity: disabled ? 0.3 : 1 }}>
                        {disabled ? '---' : (bpmGoal || '---')}
                    </span>
                ) : (
                    <input type="number" className={cx(styles['ph-bpm-input'], styles.input)}
                        value={bpmGoal} onChange={e => setBpmGoal(e.target.value)} placeholder="---" />
                )}
            </div>
            {bpmSuggested && !disabled && (
                <div className={styles.suggestedBpm}>
                    {t('labels.suggestedBpm')}<br />
                    <strong className={styles.strong}>{bpmSuggested} BPM</strong>
                </div>
            )}
            {isPreviewMode && (
                <div className={styles.messageRow}>
                    <span className={styles.messageLabel}>{t('previewMode.message')}</span>
                    <button onClick={handleSaveToLibrary} className={styles.buttonButton}>
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

    const MODE_CONFIG: Record<PracticeMode, { label: string; icon: string; color: string }> = useMemo(() => ({
        free: { label: t('modes.free'), icon: '🎸', color: '#7dd3fc' },
        library: { label: t('modes.library'), icon: '📚', color: 'var(--gold)' },
        routine: { label: t('modes.routine'), icon: '🔁', color: '#a78bfa' },
        scales: { label: t('modes.scales'), icon: '🎹', color: 'var(--gold)' },
        improvisation: { label: t('modes.improvisation'), icon: '🎷', color: 'var(--gold)' },
        composition: { label: t('modes.composition'), icon: '🧠', color: 'var(--gold)' },
        chords: { label: t('modes.chords'), icon: '🎵', color: 'var(--gold)' },
        rhythm: { label: t('modes.rhythm'), icon: '🥁', color: 'var(--gold)' },        
        earTraining: { label: t('modes.earTraining'), icon: '👂', color: 'var(--gold)' },
        harmonization: { label: t('modes.harmonization'), icon: '🎸', color: 'var(--gold)' },        
        speed: { label: t('modes.speed'), icon: '🎸', color: 'var(--gold)' }
    }), [t]);

    const cfg = MODE_CONFIG[mode] ?? MODE_CONFIG.free;

    const hasFile = !!(exercise?.file_url || fileName);
    const isLocalPdf = fileName?.toLowerCase().endsWith('.pdf');
    const isDbPdf = exercise?.file_type === 'pdf' || !!(exercise?.file_url?.toLowerCase().includes('.pdf'));
    const isPdf = isDbPdf || isLocalPdf;

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

    const shouldShowMetronome = showMetronome || isPdf || !hasFile;

    return (
        <>

            <div data-onboarding="practice-01" className={styles['ph-root']}>
                <div className={styles['ph-row1']}>
                    <ModeBadge cfg={cfg} />
                    <div className={styles['ph-divider']} />
                    <TitleSection isFree={isFree} isRoutine={isRoutine} routineName={routineName}
                        exercise={exercise} fileName={fileName} onFileLoaded={onFileLoaded} t={t} isPdf={isPdf} />

                    {!isFree && isRoutine && routineLength > 1 && (
                        <RoutineNavigation currentIndex={currentIndex} routineLength={routineLength}
                            onPrev={() => handlePrev(onPrev)} onNext={() => handleNext(onNext)} />
                    )}

                    <button data-onboarding="practice-04" className={styles['ph-close-btn']}
                        onClick={() => handleCloseClick(onEndSession)}>
                        {isRoutine ? t('labels.endRoutine') : t('labels.closeExercise')}
                    </button>
                </div>

                {!isFree && (
                    <div className={styles['ph-row2']}>
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

                        {shouldShowMetronome && (
                            <div className={cx(styles['ph-bpm-section'], styles.metronome)} style={{ paddingLeft: showBpmInputs ? 0 : '1.75rem' }}>
                                <div className={styles.metronomeRow}>
                                    {!showBpmInputs && (
                                        <div className={styles['ph-bpm-block']}>
                                            <span className={cx(styles['ph-bpm-label'], styles.metronomeLabel)}>{t('labels.metronome')}</span>
                                            <div className={styles.row}>
                                                <input type="number" min="30" max="240" className={cx(styles['ph-bpm-input'], styles.metronomeRowInput)} value={metronomeBpm || ''}
                                                    onChange={e => setMetronomeBpm(isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value))}
                                                    onBlur={() => setMetronomeBpm(Math.min(240, Math.max(30, metronomeBpm || 30)))}
                                                />
                                                <span className={styles.metronomeRowLabel}>BPM</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className={cx(styles['ph-bpm-block'], styles.metronome2)}>
                                        {showBpmInputs && <span className={cx(styles['ph-bpm-label'], styles.metronomeLabel2)}>{t('labels.metronome')}</span>}
                                        <button onClick={handleToggleMetronome} title={isMetronomePlaying ? t('tooltips.pauseMetronome') : t('tooltips.startMetronome')}
                                            className={styles.pauseMetronomeButton} style={{ background: isMetronomePlaying ? 'rgba(231,76,60,0.15)' : 'var(--gold)', color: isMetronomePlaying ? '#e74c3c' : '#111', border: isMetronomePlaying ? '1px solid rgba(231,76,60,0.4)' : 'none', boxShadow: isMetronomePlaying ? 'none' : '0 4px 12px rgba(220,185,138,0.25)' }}
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

                        <div className={cx(styles['ph-timer-section'], styles.timerAutoStarted)}>
                            <div className={styles.timerAutoStarted2}>
                                {showTimerTooltip && (
                                    <div className={`${styles['ph-timer-tooltip']} ${styles.entering} ${styles.leaving}`}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        {t('labels.timerAutoStarted')}
                                    </div>
                                )}
                                <button
                                    className={cx(`${styles['ph-timer-btn']}${timerDone ? ` ${styles.done}` : ''}`, styles.button)}
                                    onClick={onToggleTimer}
                                    style={{ color: timerDone ? '#4ade80' : isTimerRunning ? '#e74c3c' : '#4ade80', background: timerDone ? 'rgba(74,222,128,0.12)' : isTimerRunning ? 'rgba(231,76,60,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${timerDone ? 'rgba(74,222,128,0.3)' : isTimerRunning ? 'rgba(231,76,60,0.2)' : 'rgba(255,255,255,0.07)'}` }}
                                >
                                    {timerDone ? (
                                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    ) : isTimerRunning ? (
                                        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="3" width="6" height="18" rx="1" /><rect x="14" y="3" width="6" height="18" rx="1" /></svg>
                                    ) : (
                                        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className={styles.icon}><path d="M5 3L19 12L5 21V3Z" /></svg>
                                    )}
                                </button>
                            </div>

                            <div className={styles['ph-timer-display']}>
                                <span className={styles['ph-timer-status']} style={{ color: timerDone ? '#4ade80' : isTimerRunning ? 'var(--gold)' : 'rgba(255,255,255,0.3)' }}>
                                    {timerDone ? t('labels.timerCompleted') : isTimerRunning ? t('labels.timerRunning') : t('labels.timerPaused')}
                                </span>
                                <div className={styles.routineTargetDurationRow}>
                                    <span className={styles['ph-timer-val']} style={{ color: timerDone ? '#4ade80' : 'var(--text, #f0e8dc)' }}>
                                        {formatClock(displaySeconds || 0)}
                                    </span>
                                    {routineTargetDuration && (
                                        <span className={styles['ph-timer-target']}>/ {formatClock(routineTargetDuration)}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles['ph-right-section']}>
                            {isRoutine ? (
                                <div data-onboarding="practice-03" className={styles.progressStack}>
                                    <span className={styles.progressLabel}>
                                        {t('labels.progress')}
                                    </span>
                                    <div className={cx(styles['ph-steps'], styles.progressStackBlock)}>
                                        {Array.from({ length: routineLength }).map((_, i) => (
                                            <div key={i} className={`${styles['ph-step']} ${i < currentIndex ? styles.done : i === currentIndex ? styles.active : ''}`} />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.metronomeRow}>
                                    {errorMsg && <span className={styles.errorMsgLabel}>{errorMsg}</span>}
                                    <button className={`${styles['ph-save-btn']} ${saved ? styles.saved : styles.normal}`}
                                        onClick={handleSave} disabled={isSaving || saved || isPreviewMode}>
                                        {isSaving ? t('labels.saving') : saved ? t('labels.saved') : t('labels.saveProgress')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {timerPct !== null && (
                            <div className={styles['ph-timer-track']}>
                                <div className={styles['ph-timer-fill']} style={{ width: `${timerPct}%`, background: timerDone ? '#4ade80' : '#a78bfa' }} />
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