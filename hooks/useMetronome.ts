import { useState, useEffect, useRef, useCallback } from 'react';

export function useMetronome(activeMetronomeBpm: number, beatsPerMeasure: number = 4) {
    const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const currentBeatRef = useRef(0);

    const playClick = useCallback((isFirstBeat: boolean) => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.value = isFirstBeat ? 1600 : 1200;

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(isFirstBeat ? 0.6 : 0.4, ctx.currentTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isMetronomePlaying && activeMetronomeBpm > 0) {
            const msPerBeat = 60000 / activeMetronomeBpm;
            interval = setInterval(() => {
                currentBeatRef.current = (currentBeatRef.current + 1) % beatsPerMeasure;
                playClick(currentBeatRef.current === 0);
            }, msPerBeat);
        }
        return () => clearInterval(interval);
    }, [isMetronomePlaying, activeMetronomeBpm, beatsPerMeasure, playClick]);

    const handleToggleMetronome = () => {
        if (!isMetronomePlaying) {
            currentBeatRef.current = 0;
            playClick(true);
        }
        setIsMetronomePlaying(!isMetronomePlaying);
    };

    return { isMetronomePlaying, setIsMetronomePlaying, handleToggleMetronome };
}