"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { supabase } from '../../lib/supabase';
import { Exercise } from '../../lib/types';
import { PlayerHeader } from './PlayerHeader';
import { DropZone } from './DropZone';
import { SidebarControls } from './SidebarControls';
import { ScalesPanel } from './ScalesPanel';
import { ImprovPanel } from './ImprovPanel';

export default function GuitarPlayer() {
    const router = useRouter();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const mainScrollRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null);

    const sessionRef = useRef<string | null>(null);
    const startTimeRef = useRef<number>(0);
    const initializedRef = useRef(false);

    const [tracks, setTracks] = useState<any[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [scriptReady, setScriptReady] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const [mode, setMode] = useState<'free' | 'library' | 'routine' | 'scales' | 'improvisation'>('free');
    const [routineList, setRoutineList] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
    const [sessionId, setSessionId] = useState<string>('');
    const [sessionActive, setSessionActive] = useState(true);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (sessionActive) {
                e.preventDefault();
                e.returnValue = 'Tienes una sesión de práctica activa. Si sales sin finalizar, no se guardará tu tiempo total.';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [sessionActive]);

    useEffect(() => {
        if (!scriptReady || !wrapperRef.current || initializedRef.current) return;
        initializedRef.current = true;

        const params = new URLSearchParams(window.location.search);
        const currentRoutineId = params.get('routine');

        const initializeSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const newSessionId = crypto.randomUUID();
            sessionRef.current = newSessionId;
            startTimeRef.current = Date.now();
            setSessionId(newSessionId);

            await supabase.from('practice_sessions').insert({
                id: newSessionId,
                user_id: user.id,
                routine_id: currentRoutineId || null
            });
        };

        initializeSession();

        const api = new (window as any).alphaTab.AlphaTabApi(wrapperRef.current, {
            core: { engine: 'html5', useWorkers: true },
            display: { layoutMode: 'page', staveProfile: 'scoretab' },
            player: {
                enablePlayer: true,
                enableCursor: true,
                enableElementHighlighting: true,
                scrollElement: mainScrollRef.current,
                soundFont: 'https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.3.0/dist/soundfont/sonivox.sf2',
            },
        });

        apiRef.current = api;

        api.scoreLoaded.on((score: any) => setTracks(score.tracks));
        api.soundFontLoad.on(() => setIsLoaded(true));
        api.playerStateChanged.on((args: any) => setIsPlaying(args.state === 1));
        api.playerFinished.on(() => setIsPlaying(false));

        loadContextData(api);

        return () => {
            apiRef.current?.destroy();
            apiRef.current = null;
            initializedRef.current = false;
        };
    }, [scriptReady]);

    const handleEndSession = async (fallbackPath: string) => {
        setSessionActive(false);

        if (sessionRef.current) {
            const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
            await supabase.from('practice_sessions')
                .update({
                    ended_at: new Date().toISOString(),
                    total_duration_seconds: durationSeconds
                })
                .eq('id', sessionRef.current);
        }

        router.push(fallbackPath);
    };

    const loadContextData = async (api: any) => {
        const params = new URLSearchParams(window.location.search);
        const routineId = params.get('routine');
        const fileUrl = params.get('file');
        const modeParam = params.get('mode');

        if (routineId) {
            setMode('routine');
            const { data } = await supabase
                .from('routine_exercises')
                .select('*, exercises(*)')
                .eq('routine_id', routineId)
                .order('order_index', { ascending: true });

            if (data && data.length > 0) {
                setRoutineList(data);
                loadExerciseIntoPlayer(data[0].exercises, api);
            }
        } else if (fileUrl) {
            const decodedUrl = decodeURIComponent(fileUrl);
            const name = decodedUrl.split('/').pop()?.split('?')[0] || '';
            setFileName(name);

            const { data } = await supabase
                .from('exercises').select('*').eq('file_url', decodedUrl).single();

            if (data) {
                setMode('library');
                loadExerciseIntoPlayer(data, api);
            } else {
                setMode('free');
                loadUrlIntoApi(decodedUrl, api);
            }
        } else if (modeParam) {
            setMode(modeParam as any);

            const reverseMapping: Record<string, string> = {
                'scales': 'Escalas',
                'improvisation': 'Improvisación'
            };

            setActiveExercise({ title: reverseMapping[modeParam] || modeParam } as Exercise);

        } else {
            setMode('free');
            setActiveExercise(null);
        }
    };

    const loadExerciseIntoPlayer = (exercise: Exercise, api: any) => {
        setActiveExercise(exercise);
        setFileName(exercise.title);
        setTracks([]);
        setIsPlaying(false);

        if (exercise.file_url) {
            loadUrlIntoApi(exercise.file_url, api);
        }
    };

    const loadUrlIntoApi = (url: string, api: any) => {
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.arrayBuffer();
            })
            .then(buffer => {
                api.load(new Uint8Array(buffer));
                setTimeout(() => api.render(), 50);
            })
            .catch(err => console.error('[GuitarPlayer] Error cargando archivo:', err));
    };

    const handleNextExercise = () => {
        if (currentIndex < routineList.length - 1) {
            const next = currentIndex + 1;
            setCurrentIndex(next);
            loadExerciseIntoPlayer(routineList[next].exercises, apiRef.current);
        }
    };

    const handlePrevExercise = () => {
        if (currentIndex > 0) {
            const prev = currentIndex - 1;
            setCurrentIndex(prev);
            loadExerciseIntoPlayer(routineList[prev].exercises, apiRef.current);
        }
    };

    const handleFileDrop = (file: File) => {
        if (!apiRef.current) return;
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (['gp3', 'gp4', 'gp5', 'gpx', 'gp'].includes(ext || '')) {
            setTracks([]);
            setIsPlaying(false);
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (evt) => {
                apiRef.current.load(new Uint8Array(evt.target?.result as ArrayBuffer));
                setTimeout(() => apiRef.current?.render(), 50);
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert('Archivo inválido.');
        }
    };

    const hasNoScore = mode !== 'free' && activeExercise && !activeExercise.file_url;

    return (
        <>
            <Script
                src="https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.3.0/dist/alphaTab.js"
                strategy="afterInteractive"
                onReady={() => setScriptReady(true)}
            />

            <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
                <main
                    className="main-panel"
                    ref={mainScrollRef}
                    id="main-scroll-area"
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minWidth: 0 }}
                >
                    <PlayerHeader
                        mode={mode}
                        routineLength={routineList.length}
                        currentIndex={currentIndex}
                        onPrev={handlePrevExercise}
                        onNext={handleNextExercise}
                        onEndSession={handleEndSession}
                        exercise={activeExercise}
                        routineTargetBpm={routineList[currentIndex]?.target_bpm ?? null}
                        routineExerciseId={routineList[currentIndex]?.id ?? null}
                        routineTargetDuration={routineList[currentIndex]?.target_duration_seconds ?? null}
                        sessionId={sessionId}
                    />

                    {mode === 'free' && (
                        <div style={{ padding: '0 2rem' }}>
                            <DropZone fileName={fileName} onFileLoaded={handleFileDrop} />
                        </div>
                    )}

                    {mode === 'scales' && (
                        <div style={{ padding: '0 2rem' }}>
                            <ScalesPanel />
                        </div>
                    )}

                    {mode === 'improvisation' && (
                        <div style={{ padding: '0 2rem' }}>
                            <ImprovPanel />
                        </div>
                    )}

                    <div
                        className="alphatab-wrapper"
                        style={{
                            padding: '0 2rem',
                            flex: 1,
                            minHeight: 0,
                            display: hasNoScore ? 'none' : 'block',
                        }}
                    >
                        <div
                            className="alphatab-container"
                            style={{
                                position: 'relative',
                                overflow: 'visible',
                                minHeight: '300px',
                            }}
                        >
                            <div ref={wrapperRef} />
                        </div>
                    </div>

                    {hasNoScore && (
                        <div style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--muted)', flexDirection: 'column', gap: '1rem'
                        }}>
                            <div style={{ fontSize: '3rem' }}>🎸</div>
                            <p>Ejercicio sin partitura. ¡Usa el metrónomo y a tocar!</p>
                        </div>
                    )}
                </main>

                <SidebarControls
                    apiRef={apiRef}
                    isLoaded={isLoaded}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    tracks={tracks}
                    setTracks={setTracks}
                />
            </div>
        </>
    );
}