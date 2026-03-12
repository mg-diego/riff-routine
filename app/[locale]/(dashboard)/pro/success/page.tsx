"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';

type Plan = 'pro' | 'lifetime' | null;

const CONFETTI_COLORS = ['#DDB98A', '#fff', 'rgba(220,185,138,0.5)', 'rgba(255,255,255,0.3)'];

function useConfetti() {
    useEffect(() => {
        const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const pieces = Array.from({ length: 80 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height,
            w: Math.random() * 8 + 4,
            h: Math.random() * 4 + 2,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            rot: Math.random() * Math.PI * 2,
            vx: (Math.random() - 0.5) * 1.5,
            vy: Math.random() * 2 + 1,
            vr: (Math.random() - 0.5) * 0.08,
            opacity: Math.random() * 0.6 + 0.4,
        }));

        let frame: number;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pieces.forEach(p => {
                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;
                p.opacity -= 0.003;
                if (p.y > canvas.height || p.opacity <= 0) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                    p.opacity = Math.random() * 0.6 + 0.4;
                }
            });
            frame = requestAnimationFrame(draw);
        };
        draw();
        const stop = setTimeout(() => cancelAnimationFrame(frame), 5000);
        return () => { cancelAnimationFrame(frame); clearTimeout(stop); };
    }, []);
}

export default function ProSuccessPage() {
    const t = useTranslations('ProSuccess');
    const router = useRouter();
    const locale = useLocale();
    const searchParams = useSearchParams();

    // Stripe passes ?session_id= — you'd verify server-side in production
    const planParam = searchParams.get('plan') as Plan ?? 'pro';
    const isLifetime = planParam === 'lifetime';

    const [visible, setVisible] = useState(false);
    useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);
    useConfetti();

    const perks = isLifetime
        ? [t('perks.unlimited'), t('perks.fullStats'), t('perks.playerFull'), t('perks.earlyAccess'), t('perks.priceLocked'), t('perks.dedicatedSupport')]
        : [t('perks.unlimited'), t('perks.fullStats'), t('perks.playerFull'), t('perks.prioritySupport')];

    return (
        <div style={{ position: 'relative', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>

            {/* Confetti canvas */}
            <canvas id="confetti-canvas" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

            {/* Card */}
            <div style={{
                position: 'relative', zIndex: 1,
                maxWidth: '480px', width: '100%',
                background: 'var(--surface)',
                border: `1.5px solid ${isLifetime ? 'rgba(220,185,138,0.25)' : 'rgba(220,185,138,0.35)'}`,
                borderRadius: '20px', padding: '2.5rem 2rem',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.75rem',
                textAlign: 'center',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}>

                {/* Top glow */}
                <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: '50%', height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(220,185,138,0.7), transparent)',
                }} />

                {/* Icon */}
                <div style={{
                    width: '72px', height: '72px', borderRadius: '20px',
                    background: 'rgba(220,185,138,0.1)', border: '1px solid rgba(220,185,138,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)',
                }}>
                    {isLifetime ? (
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    ) : (
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    )}
                </div>

                {/* Text */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', margin: 0 }}>
                        {isLifetime ? t('badgeLifetime') : t('badgePro')}
                    </p>
                    <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.6rem', color: 'var(--text)', margin: 0, lineHeight: 1.05 }}>
                        {t('headline')}
                    </h1>
                    <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.65, margin: 0 }}>
                        {isLifetime ? t('subLifetime') : t('subPro')}
                    </p>
                </div>

                {/* Divider */}
                <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                {/* Perks unlocked */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, textAlign: 'left' }}>
                        {t('perksTitle')}
                    </p>
                    {perks.map((perk, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span style={{ color: 'var(--text)', fontSize: '0.82rem', textAlign: 'left' }}>{perk}</span>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <button
                    onClick={() => router.push(`/${locale}/home`)}
                    style={{
                        width: '100%', padding: '0.85rem',
                        background: 'var(--gold)', border: 'none', borderRadius: '10px',
                        color: '#111', fontWeight: 800, fontSize: '0.9rem',
                        fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                        transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    {t('cta')}
                </button>

                <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: '-1rem 0 0' }}>
                    {t('emailNote')}
                </p>
            </div>
        </div>
    );
}