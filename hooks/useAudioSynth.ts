import { useRef, useState, useEffect } from 'react';
import * as Tone from 'tone';

export function useAudioSynth() {
    const samplerRef = useRef<Tone.Sampler | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Inicializamos el Sampler con audios reales
        samplerRef.current = new Tone.Sampler({
            urls: {
                "E2": "E2.mp3",
                "A2": "A2.mp3",
                "D3": "D3.mp3",
                "G3": "G3.mp3",
                "B3": "B3.mp3",
                "E4": "E4.mp3",
            },
            // IMPORTANTE: Ruta local dentro de la carpeta 'public' de Next.js
            baseUrl: "/samples/guitar/acoustic/",
            onload: () => {
                setIsLoaded(true);
            }
        }).toDestination();
        
        // Añadimos Reverb para emular la caja de resonancia de madera
        const reverb = new Tone.Reverb(1.5).toDestination();
        samplerRef.current.connect(reverb);

        return () => {
            samplerRef.current?.dispose();
        };
    }, []);

    const playRealSound = async (notesToPlay: { note: string; octave: number; string: number }[], isChord: boolean) => {
        await Tone.start();

        if (!samplerRef.current || !isLoaded) {
            console.warn("Los audios reales aún se están cargando...");
            return;
        }

        const now = Tone.now();
        const strumDelay = isChord ? 0.1 : 0.3; // Rasgueo rápido vs Punteo de escala

        notesToPlay.forEach((n, i) => {
            const noteName = `${n.note}${n.octave}`;
            // Disparamos el audio real con su duración y volumen (velocity)
            samplerRef.current?.triggerAttackRelease(noteName, "2n", now + (i * strumDelay), isChord ? 0.8 : 1);
        });
    };

    return { playRealSound, isLoaded };
}