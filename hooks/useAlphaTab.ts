import { useEffect, useRef, useState, RefObject, useCallback } from 'react';

export function useAlphaTab(
    wrapperRef: RefObject<HTMLDivElement | null>,
    mainScrollRef: RefObject<HTMLDivElement | null>,
    scriptReady: boolean,
    setOriginalPlaybackBpm: (bpm: number) => void
) {
    const apiRef = useRef<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [tracks, setTracks] = useState<any[]>([]);

    const loadTokenRef = useRef(0);
    const destroyedRef = useRef(false);



    useEffect(() => {
        if (!scriptReady || !wrapperRef.current) return;

        destroyedRef.current = false;

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

        // scoreLoaded dispara en cada carga — es la única fuente de verdad para isLoaded.
        // soundFontLoad no es fiable: en Strict Mode / remounts el evento puede no disparar
        // porque el soundfont ya está cacheado por el navegador.
        const onScoreLoaded = (score: any) => {
            setTracks(score.tracks);
            setOriginalPlaybackBpm(score.tempo);
            setIsLoaded(true);
        };

        const onPlayerStateChanged = (args: any) => {
            setIsPlaying(args.state === 1);
        };

        const onPlayerFinished = () => {
            setIsPlaying(false);
        };

        api.scoreLoaded.on(onScoreLoaded);
        api.playerStateChanged.on(onPlayerStateChanged);
        api.playerFinished.on(onPlayerFinished);

        // Reanudar AudioContext al volver de background
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && apiRef.current) {
                try {
                    const ctx = apiRef.current.player?.context || apiRef.current._playerContext;
                    if (ctx && ctx.state === 'suspended') ctx.resume();
                } catch { /* ignorar */ }
            }
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

            try { api.stop?.(); } catch { /* ignorar */ }
            try { api.destroy?.(); } catch { /* ignorar */ }

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