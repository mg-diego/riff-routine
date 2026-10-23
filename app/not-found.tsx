"use client";

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import styles from './not-found.module.css';
import { bodyFont, displayFont } from './fonts';

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

    // Unmatched routes skip the [locale] layout, so this page renders its own document
    return (
        <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
        <body>

            <div className={styles['nf-root']}>
                <canvas ref={canvasRef} className={styles['nf-canvas']} />

                <div className={styles['nf-frets']}>
                    {[15, 28, 42, 57, 72, 85].map((pct) => (
                        <div key={pct} className={styles['nf-fret']} style={{ left: `${pct}%` }} />
                    ))}
                </div>

                <div className={styles['nf-content']}>
                    <h1 className={styles['nf-code']}>404</h1>
                    <p className={styles['nf-label']}>String not found</p>
                    <div className={styles['nf-divider']} />
                    <p className={styles['nf-desc']}>
                        Looks like this fret doesn't exist.<br />
                        Maybe you took a wrong turn at the 12th position.
                    </p>
                    <div className={styles['nf-actions']}>
                        <Link href="/home" className={styles['nf-btn-primary']}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                            </svg>
                            Back to home
                        </Link>
                        <Link href="/routines" className={styles['nf-btn-secondary']}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                            </svg>
                            My routines
                        </Link>
                    </div>
                </div>
            </div>
        </body>
        </html>
    );
}