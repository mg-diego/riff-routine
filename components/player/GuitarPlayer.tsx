"use client";

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useSearchParams, useRouter } from 'next/navigation';
import { PlayerHeader } from './PlayerHeader';
import { SidebarControls } from './SidebarControls';
import { ScalesPanel } from './panels/ScalesPanel';
import { ImprovPanel } from './panels/ImprovPanel';
import { BackingTrack } from '@/lib/types';
import { AlphaTabContainer } from './AlphaTabContainer';
import { usePlayerContext } from '@/hooks/usePlayerContext';
import { useAlphaTab } from '@/hooks/useAlphaTab';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { useTranslations } from 'next-intl';
import { CompositionPanel } from './panels/CompositionPanel';
import { useTranslatedExercise } from '@/hooks/useTranslatedExercise';
import { ChordsPanel } from './panels/ChordsPanel';
import { supabase } from '@/lib/supabase';
import { ALPHATAB_SCRIPT_URL } from '@/lib/constants';
import { matchesSpecialMode, resolveSpecialMode } from '@/lib/practiceModes';
import { BackingTracksLibrary } from '@/components/backing-tracks/BackingTracksLibrary';
import { RhythmPanel } from './panels/RhythmPanel';
import { EarTrainingPanel } from './panels/EarTrainingPanel';
import { PdfViewer } from './PdfViewer';
import { Spinner } from '@/components/ui/Spinner';
import { HarmonizationPanel } from './panels/HarmonizationPanel';
import { SpeedPanel } from './panels/SpeedPanel';
import styles from './GuitarPlayer.module.css';

const NEW_TRACK: BackingTrack = { id: 'new', title: '', youtube_url: '', tonality_note: '', tonality_type: '', chords: [], user_id: '', bpm: null };

export default function GuitarPlayer() {
    const t = useTranslations('GuitarPlayer');
    const im = useTranslations('ImprovPanel');
    const searchParams = useSearchParams();
    const router = useRouter();
    const trackIdFromUrl = searchParams.get('trackId');

    const wrapperRef = useRef<HTMLDivElement>(null);
    const mainScrollRef = useRef<HTMLDivElement>(null);
    const [scriptReady, setScriptReady] = useState(false);
    const [currentPlaybackBpm, setCurrentPlaybackBpm] = useState<number | null>(null);
    const [originalPlaybackBpm, setOriginalPlaybackBpm] = useState<number | null>(null);

    const [improvTrack, setImprovTrack] = useState<BackingTrack | null>(null);
    const [isLoadingTrack, setIsLoadingTrack] = useState(false);

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

    // file_type may be missing (e.g. routine exercises), so fall back to the URL extension
    const isPdf = activeExercise?.file_type === 'pdf' || !!(activeExercise?.file_url?.toLowerCase().includes('.pdf'));

    useEffect(() => {
        const fetchTrack = async () => {
            if (!matchesSpecialMode('improvisation', mode, activeExercise?.title)) return;

            if (trackIdFromUrl && trackIdFromUrl !== 'new') {
                setIsLoadingTrack(true);
                const { data } = await supabase.from('backing_tracks').select('*').eq('id', trackIdFromUrl).single();
                if (data) setImprovTrack(data);
                setIsLoadingTrack(false);
            } else if (trackIdFromUrl === 'new') {
                setImprovTrack(NEW_TRACK);
            }
        };
        fetchTrack();
    }, [mode, trackIdFromUrl, activeExercise]);

    // Never send PDFs to alphaTab
    useEffect(() => {
        if (scriptReady && initialUrlToLoad) {
            const isPdfUrl = initialUrlToLoad.toLowerCase().includes('.pdf');
            if (!isPdf && !isPdfUrl) {
                loadUrl(initialUrlToLoad);
            } else if (apiRef.current) {
                // Switching from a GP file to a PDF inside a routine: pause the previous score
                apiRef.current.pause();
            }
        }
    }, [initialUrlToLoad, scriptReady, isPdf, loadUrl, apiRef]);

    const { formatExercise } = useTranslatedExercise();
    const translatedExercise = activeExercise ? formatExercise(activeExercise) : null;

    const specialMode = resolveSpecialMode(mode, activeExercise?.title);
    const isSpecialMode = specialMode !== null;
    const isRhythmMode = matchesSpecialMode('rhythm', mode, activeExercise?.title);

    const renderImprovPanel = () => {
        if (isLoadingTrack) {
            return <div className={styles.row}><span className="loader" /></div>;
        }

        if (improvTrack) {
            return (
                <div className={styles.stack}>
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
            <div className={styles.routineBox}>
                <div className={styles.routineRow}>
                    <h3 className={styles.routineSubheading}>
                        {mode === 'routine' ? t('selectTrack.routine') : t('selectTrack.improvise')}
                    </h3>

                    <button
                        onClick={() => setImprovTrack(NEW_TRACK)}
                        className={styles.newTrackButton}
                    >
                        {im('newTrack')}
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
    };

    const specialPanel = (() => {
        switch (specialMode) {
            case 'scales': return <ScalesPanel />;
            case 'rhythm': return <RhythmPanel apiRef={apiRef} />;
            case 'earTraining': return <EarTrainingPanel />;
            case 'improvisation': return renderImprovPanel();
            case 'composition': return <CompositionPanel />;
            case 'chords': return <ChordsPanel />;
            case 'harmonization': return <HarmonizationPanel />;
            case 'speed': return <SpeedPanel />;
            default: return null;
        }
    })();

    const hasNoScore = mode !== 'free' && !isRhythmMode && activeExercise && !activeExercise.file_url;

    // The sidebar (playback controls) only makes sense for alphaTab scores
    const isSidebarDisabled = (isSpecialMode && !isRhythmMode) || !!hasNoScore || isPdf;
    const isBpmDisabled = mode === 'free' && !isLoaded;

    const [localSessionLogs, setLocalSessionLogs] = useState<Record<string, { bpm: number | null, seconds: number }>>({});

    if (!isReady) {
        return (
            <div className={styles.row2}>
                <div className={styles.stack2}>
                    <Spinner size={40} />
                </div>
            </div>
        );
    }

    return (
        <>
            <Script
                src={ALPHATAB_SCRIPT_URL}
                strategy="afterInteractive"
                onReady={() => setScriptReady(true)}
            />

            {/* CAJA PRINCIPAL UNIFICADA Y EXPANDIDA */}
            <div className={styles.titleRow}>
                <main className={`main-panel ${styles.titleMain}`}>
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

                    <div ref={mainScrollRef} className={styles.titleStack}>
                        {isSpecialMode && (
                            <div className={styles.specialPanelStack}>
                                {specialPanel}
                            </div>
                        )}

                        <div className={styles.title} style={{ display: (isSpecialMode && !isRhythmMode) ? 'none' : 'flex' }}>

                            {isPdf && activeExercise?.file_url && (
                                <div className={styles.titleStackInner}>
                                    <PdfViewer url={activeExercise.file_url} />
                                </div>
                            )}

                            {/* Keep the alphaTab container mounted (its ref is required) but hidden for PDFs */}
                            <div className={styles.block} style={{ display: isPdf ? 'none' : 'block' }}>
                                <AlphaTabContainer wrapperRef={wrapperRef} hasNoScore={!!hasNoScore} isLoaded={isLoaded} />
                            </div>

                            {hasNoScore && !isSpecialMode && !isPdf && (
                                <div className={styles.titleStack2}>
                                    <div className={styles.titleStackRow}>
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                            <line x1="12" y1="19" x2="12" y2="22" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className={styles.titleHeading}>
                                            {t('noScore.title')}
                                        </h2>
                                        <p className={styles.descriptionText}>
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