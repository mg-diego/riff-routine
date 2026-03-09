import { useEffect, useRef, useState, RefObject } from 'react';

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
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!scriptReady || !wrapperRef.current || initializedRef.current) return;
        initializedRef.current = true;

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

        api.scoreLoaded.on((score: any) => {
            setTracks(score.tracks);
            setOriginalPlaybackBpm(score.tempo);
        });
        api.soundFontLoad.on(() => setIsLoaded(true));
        api.playerStateChanged.on((args: any) => setIsPlaying(args.state === 1));
        api.playerFinished.on(() => setIsPlaying(false));

        return () => {
            apiRef.current?.destroy();
            apiRef.current = null;
            initializedRef.current = false;
        };
    }, [scriptReady, wrapperRef, mainScrollRef]);

    const loadUrl = (url: string) => {
        if (!apiRef.current) return;
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.arrayBuffer();
            })
            .then(buffer => {
                apiRef.current.load(new Uint8Array(buffer));
                // Doble render: uno inmediato y otro diferido por si el contenedor
                // acaba de pasar de display:none a visible (cambio de ejercicio en rutina)
                setTimeout(() => apiRef.current?.render(), 50);
                setTimeout(() => apiRef.current?.render(), 300);
            })
            .catch(err => console.error('[useAlphaTab] loadUrl error:', err));
    };

    const loadFile = (file: File) => {
        if (!apiRef.current) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            apiRef.current.load(new Uint8Array(evt.target?.result as ArrayBuffer));
            setTimeout(() => apiRef.current?.render(), 50);
            setTimeout(() => apiRef.current?.render(), 300);
        };
        reader.readAsArrayBuffer(file);
    };

    return { apiRef, isLoaded, isPlaying, setIsPlaying, tracks, setTracks, loadUrl, loadFile };
}