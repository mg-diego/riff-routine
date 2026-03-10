import { useState, useEffect, useRef, useCallback } from 'react';

export function useMetronome(activeMetronomeBpm: number) {
    const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const playClick = useCallback(() => {
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
        osc.frequency.value = 1200;

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isMetronomePlaying && activeMetronomeBpm > 0) {
            const msPerBeat = 60000 / activeMetronomeBpm;
            interval = setInterval(() => {
                playClick();
            }, msPerBeat);
        }
        return () => clearInterval(interval);
    }, [isMetronomePlaying, activeMetronomeBpm, playClick]);

    const handleToggleMetronome = () => {
        if (!isMetronomePlaying) playClick();
        setIsMetronomePlaying(!isMetronomePlaying);
    };

    return { isMetronomePlaying, setIsMetronomePlaying, handleToggleMetronome };
}