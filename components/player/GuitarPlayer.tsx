"use client";

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { PlayerHeader } from './PlayerHeader';
import { SidebarControls } from './SidebarControls';
import { ScalesPanel } from './ScalesPanel';
import { ImprovPanel } from './ImprovPanel';
import { ScoreViewer } from './ScoreViewer';
import { usePlayerContext } from '../../hooks/usePlayerContext';
import { useAlphaTab } from '../../hooks/useAlphaTab';
import { usePracticeSession } from '../../hooks/usePracticeSession';

export default function GuitarPlayer() {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const mainScrollRef = useRef<HTMLDivElement>(null);
    const [scriptReady, setScriptReady] = useState(false);
    const [currentPlaybackBpm, setCurrentPlaybackBpm] = useState<number | null>(null);
    const [originalPlaybackBpm, setOriginalPlaybackBpm] = useState<number | null>(null);

    const {
        mode,
        routineList,
        currentIndex,
        activeExercise,
        fileName,
        setFileName,
        initialUrlToLoad,
        handleNextExercise,
        handlePrevExercise
    } = usePlayerContext();

    const {
        apiRef,
        tracks,
        setTracks,
        isPlaying,
        setIsPlaying,
        isLoaded,
        loadUrl,
        loadFile
    } = useAlphaTab(wrapperRef, mainScrollRef, scriptReady, setOriginalPlaybackBpm);

    const {
        elapsedSeconds,
        isTimerRunning,
        routineName,
        sessionId,
        toggleTimer,
        saveExerciseLog,
        handleEndSession
    } = usePracticeSession(mode, routineList[currentIndex]?.routine_id || null, activeExercise?.id || null);

    useEffect(() => {
        if (scriptReady && isLoaded && initialUrlToLoad) {
            loadUrl(initialUrlToLoad);
        }
    }, [initialUrlToLoad, scriptReady, isLoaded]);

    const hasNoScore = mode !== 'free' && activeExercise && !activeExercise.file_url;
    const isScoreMode = ['free', 'library', 'routine'].includes(mode);
    
    const isSidebarDisabled = !isScoreMode || !!hasNoScore;
    console.log('mode: ', mode)

    return (
        <>
            <Script
                src="https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.3.0/dist/alphaTab.js"
                strategy="afterInteractive"
                onReady={() => setScriptReady(true)}
            />

            <div style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                minHeight: '600px',
                borderRadius: '12px',
                background: 'var(--surface)',
                overflow: 'hidden',
                position: 'relative',
            }}>
                <main
                    className="main-panel"
                    style={{
                        flex: 1,
                        width: 0,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    <PlayerHeader
                        mode={mode}
                        routineLength={routineList.length}
                        currentIndex={currentIndex}
                        onPrev={handlePrevExercise}
                        onNext={handleNextExercise}
                        onEndSession={(overrideTotal?: number) => handleEndSession('/routines', overrideTotal)}
                        exercise={activeExercise}
                        routineTargetBpm={routineList[currentIndex]?.target_bpm ?? null}
                        routineTargetDuration={routineList[currentIndex]?.target_duration_seconds ?? null}
                        elapsedSeconds={elapsedSeconds}
                        isTimerRunning={isTimerRunning}
                        onToggleTimer={toggleTimer}
                        onBpmChange={setCurrentPlaybackBpm}
                        originalBpm={originalPlaybackBpm}
                        routineName={routineName}
                        fileName={fileName}
                        onFileLoaded={(file) => {
                            setFileName(file.name);
                            loadFile(file);
                        }}
                        onSaveExerciseLog={async (bpmCurrent, bpmGoal) => {
                            if (activeExercise) {
                                await saveExerciseLog(
                                    activeExercise.id,
                                    bpmCurrent,
                                    bpmGoal,
                                    routineList[currentIndex]?.id || null
                                );
                            }
                        }}
                        sessionId={sessionId}
                        disableBpmInputs={isSidebarDisabled}
                    />

                    <div
                        ref={mainScrollRef}
                        style={{
                            flex: 1,
                            overflow: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative'
                        }}
                    >
                        {(mode === 'scales' || activeExercise?.title === 'Escalas') && (
                            <div style={{
                                padding: '1rem 2rem',
                                flexShrink: 0,
                                minWidth: 'min-content',
                                boxSizing: 'border-box'
                            }}>
                                <ScalesPanel />
                            </div>
                        )}

                        {(mode === 'improvisation' || activeExercise?.title === "Improvisación") && (
                            <div style={{
                                padding: '1rem 2rem',
                                flexShrink: 0,
                                minWidth: 'min-content',
                                boxSizing: 'border-box'
                            }}>
                                <ImprovPanel />
                            </div>
                        )}

                        {isScoreMode && (
                            <div style={{ flex: 1, position: 'relative', minWidth: 'min-content' }}>
                                <ScoreViewer wrapperRef={wrapperRef} hasNoScore={!!hasNoScore} apiRef={apiRef} />
                            </div>
                        )}
                    </div>
                </main>

                <SidebarControls
                    apiRef={apiRef}
                    isLoaded={isLoaded}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
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