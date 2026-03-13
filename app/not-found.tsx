"use client";

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function NotFound() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const strings = Array.from({ length: 6 }, (_, i) => ({
            y:         canvas.height * 0.2 + i * (canvas.height * 0.12),
            amplitude: 0,
            phase:     Math.random() * Math.PI * 2,
            decay:     0,
            speed:     2 + i * 0.3,
        }));

        let frame = 0;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            strings.forEach((s, i) => {
                const thickness = 0.6 + i * 0.25;
                const alpha     = 0.12 + i * 0.04;

                ctx.beginPath();
                ctx.strokeStyle = `rgba(220,185,138,${alpha})`;
                ctx.lineWidth   = thickness;

                for (let x = 0; x <= canvas.width; x += 2) {
                    const wave = s.amplitude * Math.sin((x / canvas.width) * Math.PI) *
                        Math.sin(s.phase + frame * 0.04 * s.speed);
                    const y = s.y + wave;
                    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.stroke();

                if (s.amplitude > 0) {
                    s.amplitude *= 0.97;
                    if (s.amplitude < 0.1) s.amplitude = 0;
                }
            });

            frame++;
            requestAnimationFrame(draw);
        };

        draw();

        const pluck = () => {
            const s = strings[Math.floor(Math.random() * strings.length)];
            s.amplitude = 8 + Math.random() * 12;
            s.phase     = Math.random() * Math.PI * 2;
        };

        const interval = setInterval(pluck, 800);
        pluck();

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <style href="not-found-styles" precedence="default">{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;600&display=swap');

                .nf-root {
                    min-height: 100vh;
                    background: #0a0a0a;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    font-family: 'DM Sans', sans-serif;
                    padding: 2rem;
                }
                .nf-canvas {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }
                .nf-frets {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                }
                .nf-fret {
                    position: absolute;
                    top: 0; bottom: 0;
                    width: 1px;
                    background: rgba(255,255,255,0.025);
                }
                .nf-content {
                    position: relative;
                    z-index: 10;
                    text-align: center;
                    max-width: 480px;
                }
                .nf-code {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: clamp(7rem, 20vw, 12rem);
                    line-height: 0.9;
                    color: transparent;
                    -webkit-text-stroke: 1px rgba(220,185,138,0.3);
                    letter-spacing: 0.05em;
                    margin: 0 0 0.5rem;
                    position: relative;
                }
                .nf-code::after {
                    content: '404';
                    position: absolute;
                    inset: 0;
                    color: rgba(220,185,138,0.06);
                    -webkit-text-stroke: 0;
                    transform: translate(3px, 3px);
                    z-index: -1;
                }
                .nf-label {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: clamp(1.2rem, 4vw, 1.8rem);
                    color: #dcc18a;
                    letter-spacing: 0.15em;
                    margin: 0 0 1rem;
                    opacity: 0.9;
                }
                .nf-divider {
                    width: 40px;
                    height: 1px;
                    background: rgba(220,185,138,0.25);
                    margin: 0 auto 2rem;
                }
                .nf-desc {
                    font-size: 0.95rem;
                    color: rgba(240,232,220,0.45);
                    line-height: 1.7;
                    margin: 0 0 2.5rem;
                    font-weight: 300;
                }
                .nf-actions {
                    display: flex;
                    gap: 0.75rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                .nf-btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: #dcc18a;
                    color: #111;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 0.875rem;
                    font-weight: 600;
                    border-radius: 8px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .nf-btn-primary:hover {
                    background: #c9a676;
                    transform: translateY(-1px);
                }
                .nf-btn-secondary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: transparent;
                    color: rgba(240,232,220,0.6);
                    font-family: 'DM Sans', sans-serif;
                    font-size: 0.875rem;
                    font-weight: 500;
                    border-radius: 8px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .nf-btn-secondary:hover {
                    background: rgba(255,255,255,0.05);
                    color: rgba(240,232,220,0.9);
                    border-color: rgba(255,255,255,0.2);
                }
                @keyframes nf-fadein {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .nf-content > * {
                    animation: nf-fadein 0.6s ease both;
                }
                .nf-content > *:nth-child(1) { animation-delay: 0.1s; }
                .nf-content > *:nth-child(2) { animation-delay: 0.2s; }
                .nf-content > *:nth-child(3) { animation-delay: 0.3s; }
                .nf-content > *:nth-child(4) { animation-delay: 0.35s; }
                .nf-content > *:nth-child(5) { animation-delay: 0.4s; }
            `}</style>

            <div className="nf-root">
                <canvas ref={canvasRef} className="nf-canvas" />

                <div className="nf-frets">
                    {[15, 28, 42, 57, 72, 85].map((pct) => (
                        <div key={pct} className="nf-fret" style={{ left: `${pct}%` }} />
                    ))}
                </div>

                <div className="nf-content">
                    <h1 className="nf-code">404</h1>
                    <p className="nf-label">String not found</p>
                    <div className="nf-divider" />
                    <p className="nf-desc">
                        Looks like this fret doesn't exist.<br />
                        Maybe you took a wrong turn at the 12th position.
                    </p>
                    <div className="nf-actions">
                        <Link href="/home" className="nf-btn-primary">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                            </svg>
                            Back to home
                        </Link>
                        <Link href="/routines" className="nf-btn-secondary">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                            </svg>
                            My routines
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}