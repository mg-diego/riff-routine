import { useEffect, useRef, useState, RefObject, useCallback } from 'react';
import type { AlphaTabApi, model, synth } from '@coderline/alphatab';
import { ALPHATAB_CDN_URL, ALPHATAB_SCRIPT_URL } from '@/lib/constants';

export type AlphaTabApiRef = RefObject<AlphaTabApi | null>;

export function useAlphaTab(
    wrapperRef: RefObject<HTMLDivElement | null>,
    mainScrollRef: RefObject<HTMLDivElement | null>,
    scriptReady: boolean,
    setOriginalPlaybackBpm: (bpm: number) => void
) {
    const apiRef = useRef<AlphaTabApi | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [tracks, setTracks] = useState<model.Track[]>([]);

    const loadTokenRef = useRef(0);
    const destroyedRef = useRef(false);



    useEffect(() => {
        const alphaTab = window.alphaTab;
        if (!scriptReady || !wrapperRef.current || !alphaTab) return;

        destroyedRef.current = false;

        const api = new alphaTab.AlphaTabApi(wrapperRef.current, {
            core: {
                engine: 'html5',
                useWorkers: true,
                // Explicit CDN paths: workers/worklets and the Bravura font are resolved from here
                scriptFile: ALPHATAB_SCRIPT_URL,
                fontDirectory: `${ALPHATAB_CDN_URL}/font/`,
            },
            display: { layoutMode: alphaTab.LayoutMode.Page, staveProfile: alphaTab.StaveProfile.ScoreTab },
            player: {
                // Synthesizer only: GP8 audio backing tracks would ignore track mute/solo/volume
                playerMode: alphaTab.PlayerMode.EnabledSynthesizer,
                enableCursor: true,
                enableElementHighlighting: true,
                scrollElement: mainScrollRef.current ?? undefined,
                soundFont: `${ALPHATAB_CDN_URL}/soundfont/sonivox.sf2`,
            },
        });

        apiRef.current = api;

        // scoreLoaded dispara en cada carga — es la única fuente de verdad para isLoaded.
        // soundFontLoad no es fiable: en Strict Mode / remounts el evento puede no disparar
        // porque el soundfont ya está cacheado por el navegador.
        const onScoreLoaded = (score: model.Score) => {
            setTracks(score.tracks);
            setOriginalPlaybackBpm(score.tempo);
            setIsLoaded(true);
        };

        const onPlayerStateChanged = (args: synth.PlayerStateChangedEventArgs) => {
            setIsPlaying(args.state === alphaTab.synth.PlayerState.Playing);
        };

        const onPlayerFinished = () => {
            setIsPlaying(false);
        };

        api.scoreLoaded.on(onScoreLoaded);
        api.playerStateChanged.on(onPlayerStateChanged);
        api.playerFinished.on(onPlayerFinished);

        // Resume the AudioContext when coming back from background (public synth output API)
        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible') return;
            try {
                apiRef.current?.player?.output.activate();
            } catch { /* ignorar */ }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (destroyedRef.current) return;
            destroyedRef.current = true;

            try {
                api.scoreLoaded.off(onScoreLoaded);
                api.playerStateChanged.off(onPlayerStateChanged);
                api.playerFinished.off(onPlayerFinished);
            } catch { /* ignorar */ }

            document.removeEventListener('visibilitychange', handleVisibilityChange);

            try { api.stop(); } catch { /* ignorar */ }
            try { api.destroy(); } catch { /* ignorar */ }

            apiRef.current = null;
            setIsLoaded(false);
            setIsPlaying(false);
            setTracks([]);
        };
    }, [scriptReady]);


    const loadUrl = useCallback((url: string) => {
        if (!apiRef.current) return;

        setIsLoaded(false);
        setIsPlaying(false);

        const token = ++loadTokenRef.current;

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.arrayBuffer();
            })
            .then(buffer => {
                if (token !== loadTokenRef.current) return;
                if (!apiRef.current) return;

                apiRef.current.load(new Uint8Array(buffer));

                setTimeout(() => {
                    if (token !== loadTokenRef.current) return;
                    apiRef.current?.render();
                }, 100);

                setTimeout(() => {
                    if (token !== loadTokenRef.current) return;
                    apiRef.current?.render();
                }, 400);
            })
            .catch(err => console.error('[useAlphaTab] loadUrl error:', err));
    }, []);

    const loadFile = useCallback((file: File) => {
        if (!apiRef.current) return;

        setIsLoaded(false);
        setIsPlaying(false);

        const token = ++loadTokenRef.current;

        const reader = new FileReader();
        reader.onload = (evt) => {
            if (token !== loadTokenRef.current) return;
            if (!apiRef.current) return;

            apiRef.current.load(new Uint8Array(evt.target?.result as ArrayBuffer));

            setTimeout(() => {
                if (token !== loadTokenRef.current) return;
                apiRef.current?.render();
            }, 100);

            setTimeout(() => {
                if (token !== loadTokenRef.current) return;
                apiRef.current?.render();
            }, 400);
        };
        reader.readAsArrayBuffer(file);
    }, []);

    return {
        apiRef,
        isLoaded,
        isPlaying,
        setIsPlaying,
        tracks,
        setTracks,
        loadUrl,
        loadFile,
    };
}