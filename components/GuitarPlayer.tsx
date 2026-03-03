"use client";

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { supabase } from '../lib/supabase';
import { Exercise } from '../lib/types';
import { PlayerHeader } from './player/PlayerHeader';
import { DropZone } from './player/DropZone';
import { ExercisePanel } from './player/ExercisePanel';
import { SidebarControls } from './player/SidebarControls';

export default function GuitarPlayer() {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const mainScrollRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null);

    const [tracks, setTracks] = useState<any[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [scriptReady, setScriptReady] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const [mode, setMode] = useState<'free' | 'library' | 'routine'>('free');
    const [routineList, setRoutineList] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);

    const [liveBpmCurrent, setLiveBpmCurrent] = useState<number | null>(null);
    const [liveBpmGoal, setLiveBpmGoal] = useState<number | null>(null);

    useEffect(() => {
        if (!scriptReady || !wrapperRef.current) return;

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
        };
    }, [scriptReady]);

    const loadContextData = async (api: any) => {
        const params = new URLSearchParams(window.location.search);
        const routineId = params.get('routine');
        const fileUrl = params.get('file');

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
        } else {
            setMode('free');
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
        // Si no hay file_url no cargamos nada — el placeholder lo gestiona el JSX
    };

    const loadUrlIntoApi = (url: string, api: any) => {
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.arrayBuffer();
            })
            .then(buffer => {
                api.load(new Uint8Array(buffer));
                // FIX: forzar render tras un tick por si el contenedor aún
                // no tenía dimensiones calculadas cuando load() fue llamado
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

    // El ejercicio activo no tiene partitura
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
                        exercise={activeExercise}   // ← único prop nuevo, reemplaza bpmInitial/bpmCurrent/bpmGoal/exerciseName
                    />

                    {mode === 'free' && (
                        <div style={{ padding: '0 2rem' }}>
                            <DropZone fileName={fileName} onFileLoaded={handleFileDrop} />
                        </div>
                    )}

                    { }
                    <div
                        className="alphatab-wrapper"
                        style={{
                            padding: '0 2rem',
                            flex: 1,
                            minHeight: 0,
                            // Ocultar el wrapper si no hay partitura, pero mantenerlo en el DOM
                            display: hasNoScore ? 'none' : 'block',
                        }}
                    >
                        <div
                            className="alphatab-container"
                            style={{
                                position: 'relative',
                                overflow: 'visible',
                                minHeight: '300px', // garantiza dimensiones reales para alphaTab
                            }}
                        >
                            <div ref={wrapperRef} />
                        </div>
                    </div>

                    {/* Placeholder "sin partitura" — fuera del wrapper de alphaTab */}
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