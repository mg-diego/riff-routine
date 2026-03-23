"use client";

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useSearchParams, useRouter } from 'next/navigation'; // <-- NUEVOS IMPORTS
import { PlayerHeader } from './PlayerHeader';
import { SidebarControls } from './SidebarControls';
import { ScalesPanel } from './ScalesPanel';
import { BackingTrack, ImprovPanel } from './ImprovPanel';
import { AlphaTabContainer } from './AlphaTabContainer';
import { usePlayerContext } from '../../hooks/usePlayerContext';
import { useAlphaTab } from '../../hooks/useAlphaTab';
import { usePracticeSession } from '../../hooks/usePracticeSession';
import { useTranslations } from 'next-intl';
import { CompositionPanel } from './CompositionPanel';
import { useTranslatedExercise } from '../../hooks/useTranslatedExercise';
import { ChordsPanel } from './ChordsPanel';
import { supabase } from '@/lib/supabase'; // <-- ASEGÚRATE DE IMPORTAR SUPABASE
import { BackingTracksLibrary } from '../backingTracks/BackingTracksLibrary';

export default function GuitarPlayer() {
    const t = useTranslations('GuitarPlayer');
    const searchParams = useSearchParams();
    const router = useRouter();
    const trackIdFromUrl = searchParams.get('trackId'); // <-- CAPTURAMOS EL ID DE LA URL

    const wrapperRef = useRef<HTMLDivElement>(null);
    const mainScrollRef = useRef<HTMLDivElement>(null);
    const [scriptReady, setScriptReady] = useState(false);
    const [currentPlaybackBpm, setCurrentPlaybackBpm] = useState<number | null>(null);
    const [originalPlaybackBpm, setOriginalPlaybackBpm] = useState<number | null>(null);

    // NUEVOS ESTADOS PARA MANEJAR LA PISTA ÚNICA
    const [improvTrack, setImprovTrack] = useState<BackingTrack | null>(null);
    const [isLoadingTrack, setIsLoadingTrack] = useState(false);

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

    // FETCH DE LA PISTA SI ESTAMOS EN MODO IMPROVISACIÓN
    useEffect(() => {
        const fetchTrack = async () => {
            if (mode !== 'improvisation' && activeExercise?.title !== 'sys_improvisation_title') return;

            if (trackIdFromUrl && trackIdFromUrl !== 'new') {
                setIsLoadingTrack(true);
                const { data } = await supabase.from('backing_tracks').select('*').eq('id', trackIdFromUrl).single();
                if (data) setImprovTrack(data);
                setIsLoadingTrack(false);
            } else if (trackIdFromUrl === 'new') {
                // Genera la pista en blanco si el usuario le dio a "Nueva pista"
                setImprovTrack({ id: 'new', title: '', youtube_url: '', tonality_note: '', tonality_type: '', chords: [], user_id: '', bpm: null });
            }
        };
        fetchTrack();
    }, [mode, trackIdFromUrl, activeExercise]);

    useEffect(() => {
        if (scriptReady && initialUrlToLoad) {
            loadUrl(initialUrlToLoad);
        }
    }, [initialUrlToLoad, scriptReady]);

    const { formatExercise } = useTranslatedExercise();
    const translatedExercise = activeExercise ? formatExercise(activeExercise) : null;

    const isSpecialMode =
        mode === 'scales' || activeExercise?.title === 'sys_scales_title' ||
        mode === 'improvisation' || activeExercise?.title === 'sys_improvisation_title' ||
        mode === 'composition' || activeExercise?.title === 'sys_composition_title' ||
        mode === 'chords' || activeExercise?.title === 'sys_chords_title';

    // RENDERIZADO DEL PANEL ESPECIAL (Limpio y sin librería)
    const specialPanel = (() => {
        if (mode === 'scales' || activeExercise?.title === 'sys_scales_title') return <ScalesPanel />;

        if (mode === 'improvisation' || activeExercise?.title === 'sys_improvisation_title') {
            if (isLoadingTrack) {
                return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><span className="loader" /></div>;
            }

            if (improvTrack) {
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                        <ImprovPanel
                            initialTrack={improvTrack}
                            onBack={() => {
                                if (mode === 'routine') {
                                    setImprovTrack(null);
                                } else {
                                    router.push('/backing-tracks');
                                }
                            }}
                            onSaved={() => { }}
                        />
                    </div>
                );
            }

            return (
                <div style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ color: 'var(--gold)', margin: 0, fontSize: '1.2rem', fontFamily: 'Bebas Neue' }}>
                            {mode === 'routine' ? 'Selecciona una pista para este paso de la rutina' : 'Selecciona una pista para improvisar'}
                        </h3>

                        <button
                            onClick={() => setImprovTrack({ id: 'new', title: '', youtube_url: '', tonality_note: '', tonality_type: '', chords: [], user_id: '', bpm: null })}
                            style={{ background: 'var(--gold)', border: 'none', color: '#111', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.85rem', transition: 'transform 0.15s ease' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            + Crear Nueva Pista
                        </button>
                    </div>

                    <BackingTracksLibrary
                        isMiniMode={true}
                        onPlayTrack={(track) => {
                            setImprovTrack(track);
                        }}
                    />
                </div>
            );
        }

        if (mode === 'composition' || activeExercise?.title === 'sys_composition_title') return <CompositionPanel />;
        if (mode === 'chords' || activeExercise?.title === 'sys_chords_title') return <ChordsPanel />;

        return null;
    })();

    const hasNoScore = mode !== 'free' && activeExercise && !activeExercise.file_url;
    const isSidebarDisabled = isSpecialMode || !!hasNoScore;
    const isBpmDisabled = mode === 'free' && !isLoaded;

    const [localSessionLogs, setLocalSessionLogs] = useState<Record<string, { bpm: number | null, seconds: number }>>({});

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

    // ... todo tu código superior (hooks, specialPanel, etc) se mantiene igual ...

    return (
        <>
            <Script
                src="https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.3.0/dist/alphaTab.js"
                strategy="afterInteractive"
                onReady={() => setScriptReady(true)}
            />

            {/* CAJA PRINCIPAL UNIFICADA Y EXPANDIDA */}
            <div style={{
                display: 'flex',
                width: '100%',
                // Hacemos que ocupe casi toda la pantalla, restando el espacio del título y nav
                minHeight: 'calc(100vh - 180px)',
                borderRadius: '12px',
                background: 'var(--surface)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)', // Le da volumen
                overflow: 'hidden',
                position: 'relative',
            }}>
                <main className="main-panel" style={{
                    flex: 1, width: 0, minWidth: 0,
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', position: 'relative',
                }}>
                    <PlayerHeader
                        mode={mode}
                        routineList={routineList}
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
                        sessionId={sessionId}
                        disableBpmInputs={isBpmDisabled}
                        localSessionLogs={localSessionLogs}
                        onSaveExerciseLog={async (bpmCurrent, bpmGoal, secs = 0) => {
                            if (mode === 'routine' && activeExercise) {
                                setLocalSessionLogs(prev => {
                                    const existing = prev[activeExercise.id] || { bpm: null, seconds: 0 };
                                    return {
                                        ...prev,
                                        [activeExercise.id]: {
                                            bpm: bpmCurrent,
                                            seconds: existing.seconds + secs
                                        }
                                    };
                                });
                            } else if (activeExercise) {
                                await saveExerciseLog(
                                    activeExercise.id,
                                    bpmCurrent,
                                    bpmGoal,
                                    routineList[currentIndex]?.id || null,
                                    secs
                                );
                            }
                        }}
                    />

                    <div ref={mainScrollRef} style={{
                        flex: 1,
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        width: '100%',
                    }}>
                        {isSpecialMode && (
                            <div style={{
                                // Reducimos un poco el padding vertical para ganar espacio
                                padding: '1.5rem 2rem',
                                flex: '1 0 auto',
                                minHeight: 'min-content',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {specialPanel}
                            </div>
                        )}

                        <div style={{
                            position: 'relative',
                            width: '100%',
                            display: isSpecialMode ? 'none' : 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            padding: '1.5rem 1.75rem',
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