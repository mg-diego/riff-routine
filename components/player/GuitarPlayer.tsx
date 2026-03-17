"use client";

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { PlayerHeader } from './PlayerHeader';
import { SidebarControls } from './SidebarControls';
import { ScalesPanel } from './ScalesPanel';
import { ImprovPanel } from './ImprovPanel';
import { AlphaTabContainer } from './AlphaTabContainer';
import { usePlayerContext } from '../../hooks/usePlayerContext';
import { useAlphaTab } from '../../hooks/useAlphaTab';
import { usePracticeSession } from '../../hooks/usePracticeSession';
import { useTranslations } from 'next-intl';
import { CompositionPanel } from './CompositionPanel';
import { useTranslatedExercise } from '../../hooks/useTranslatedExercise';
import { ChordsPanel } from './ChordsPanel';

export default function GuitarPlayer() {
    const t = useTranslations('GuitarPlayer');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const mainScrollRef = useRef<HTMLDivElement>(null);
    const [scriptReady, setScriptReady] = useState(false);
    const [currentPlaybackBpm, setCurrentPlaybackBpm] = useState<number | null>(null);
    const [originalPlaybackBpm, setOriginalPlaybackBpm] = useState<number | null>(null);

    useEffect(() => {
        return () => console.log('[GuitarPlayer] UNMOUNTED');
    }, []);

    const {
        isReady,
        mode, routineList, currentIndex, activeExercise,
        fileName, setFileName, initialUrlToLoad,
        handleNextExercise, handlePrevExercise,
    } = usePlayerContext();

    const {
        apiRef, tracks, setTracks, isPlaying, setIsPlaying,
        isLoaded, loadUrl, loadFile,
    } = useAlphaTab(wrapperRef, mainScrollRef, scriptReady, setOriginalPlaybackBpm);

    const {
        elapsedSeconds, isTimerRunning, routineName, sessionId,
        toggleTimer, saveExerciseLog, handleEndSession,
    } = usePracticeSession(mode, routineList[currentIndex]?.routine_id || null, activeExercise?.id || null);

    useEffect(() => {
        console.log('[GuitarPlayer] load effect:', { scriptReady, initialUrlToLoad });
        if (scriptReady && initialUrlToLoad) {
            loadUrl(initialUrlToLoad);
        }
    }, [initialUrlToLoad, scriptReady]);

    // ── Mode helpers ────────────────────────────────────────────────────────
    const { formatExercise } = useTranslatedExercise();

    // translatedExercise is used for display only — activeExercise keeps the raw keys
    const translatedExercise = activeExercise ? formatExercise(activeExercise) : null;

    const isSpecialMode =
        mode === 'scales' || activeExercise?.title === 'sys_scales_title' ||
        mode === 'improvisation' || activeExercise?.title === 'sys_improvisation_title' ||
        mode === 'composition' || activeExercise?.title === 'sys_composition_title' ||
        mode === 'chords' || activeExercise?.title === 'sys_chords_title';

    const specialPanel =
        (mode === 'scales' || activeExercise?.title === 'sys_scales_title') ? <ScalesPanel /> :
            (mode === 'improvisation' || activeExercise?.title === 'sys_improvisation_title') ? <ImprovPanel /> :
                (mode === 'composition' || activeExercise?.title === 'sys_composition_title') ? <CompositionPanel /> :                
                    (mode === 'chords' || activeExercise?.title === 'sys_chords_title') ? <ChordsPanel /> :
                        null;

    const hasNoScore = mode !== 'free' && activeExercise && !activeExercise.file_url;
    const isSidebarDisabled = isSpecialMode || !!hasNoScore;
    const isBpmDisabled = mode === 'free' && !isLoaded;

    // ── Loading skeleton — prevents flash of wrong mode/onboarding ──────────
    if (!isReady) {
        return (
            <div style={{
                display: 'flex', width: '100%', height: '100%',
                minHeight: '600px', borderRadius: '12px',
                background: 'var(--surface)', overflow: 'hidden',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        border: '2px solid rgba(220,185,138,0.15)',
                        borderTopColor: 'var(--gold)',
                        animation: 'gp-spin 0.8s linear infinite',
                    }} />
                    <style>{`@keyframes gp-spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    return (
        <>
            <Script
                src="https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.3.0/dist/alphaTab.js"
                strategy="afterInteractive"
                onReady={() => setScriptReady(true)}
            />

            <div style={{
                display: 'flex', width: '100%', height: '100%',
                minHeight: '600px', borderRadius: '12px',
                background: 'var(--surface)', overflow: 'hidden', position: 'relative',
            }}>
                <main className="main-panel" style={{
                    flex: 1, width: 0, minWidth: 0,
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', position: 'relative',
                }}>
                    <PlayerHeader
                        mode={mode}
                        routineLength={routineList.length}
                        currentIndex={currentIndex}
                        onPrev={handlePrevExercise}
                        onNext={handleNextExercise}
                        onEndSession={(overrideTotal?: number) => handleEndSession('/routines', overrideTotal)}
                        exercise={translatedExercise}
                        routineTargetBpm={routineList[currentIndex]?.target_bpm ?? null}
                        routineTargetDuration={routineList[currentIndex]?.target_duration_seconds ?? null}
                        elapsedSeconds={elapsedSeconds}
                        isTimerRunning={isTimerRunning}
                        onToggleTimer={toggleTimer}
                        onBpmChange={setCurrentPlaybackBpm}
                        originalBpm={originalPlaybackBpm}
                        routineName={routineName}
                        fileName={fileName}
                        onFileLoaded={(file) => { setFileName(file.name); loadFile(file); }}
                        onSaveExerciseLog={async (bpmCurrent, bpmGoal) => {
                            if (activeExercise) {
                                await saveExerciseLog(
                                    activeExercise.id, bpmCurrent, bpmGoal,
                                    routineList[currentIndex]?.id || null,
                                );
                            }
                        }}
                        sessionId={sessionId}
                        disableBpmInputs={isBpmDisabled}
                    />

                    <div ref={mainScrollRef} style={{
                        flex: 1,
                        overflowX: 'hidden', // Previene scrolls horizontales accidentales
                        overflowY: 'auto',   // Scroll vertical principal
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        width: '100%',
                    }}>
                        {isSpecialMode && (
                            <div style={{
                                padding: '1rem 2rem',
                                flex: '1 0 auto',           // Permite que el panel crezca sin restricciones
                                minHeight: 'min-content',   // Evita que el contenedor recorte el contenido
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {specialPanel}
                            </div>
                        )}

                        <div style={{
                            //flex: '1 0 auto',
                            //minHeight: 'min-content',
                            position: 'relative',
                            width: '100%',
                            display: isSpecialMode ? 'none' : 'flex',
                            flexDirection: 'column',
                        }}>
                            <AlphaTabContainer wrapperRef={wrapperRef} hasNoScore={!!hasNoScore} isLoaded={isLoaded} />

                            {hasNoScore && !isSpecialMode && (
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--muted)', gap: '1.5rem', padding: '2rem',
                                    textAlign: 'center', background: 'var(--surface)', zIndex: 10,
                                }}>
                                    <div style={{
                                        width: '80px', height: '80px', borderRadius: '50%',
                                        background: 'rgba(220,185,138,0.1)', border: '1px solid rgba(220,185,138,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)',
                                    }}>
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                            <line x1="12" y1="19" x2="12" y2="22" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 style={{
                                            fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem',
                                            margin: '0 0 0.5rem 0', color: 'var(--text)', letterSpacing: '0.05em',
                                        }}>
                                            {t('noScore.title')}
                                        </h2>
                                        <p style={{ margin: 0, maxWidth: '420px', lineHeight: 1.6, fontSize: '0.95rem' }}>
                                            {t('noScore.description')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                <SidebarControls
                    apiRef={apiRef}
                    isLoaded={isLoaded}
                    isPlaying={isPlaying}
                    tracks={tracks}
                    setTracks={setTracks}
                    currentPlaybackBpm={currentPlaybackBpm}
                    originalBpm={originalPlaybackBpm}
                    forceDisabled={isSidebarDisabled}
                />
            </div>
        </>
    );
}