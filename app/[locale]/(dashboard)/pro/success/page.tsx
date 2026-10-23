"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import styles from './page.module.css';

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
        <div className={styles.badgeLifetimeRow}>

            {/* Confetti canvas */}
            <canvas id="confetti-canvas" className={styles.canvas} />

            {/* Card */}
            <div className={styles.badgeLifetimeStack} style={{ border: `1.5px solid ${isLifetime ? 'rgba(220,185,138,0.25)' : 'rgba(220,185,138,0.35)'}`, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}>

                {/* Top glow */}
                <div className={styles.layer} />

                {/* Icon */}
                <div className={styles.row}>
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
                <div className={styles.badgeLifetimeStack2}>
                    <p className={styles.badgeLifetimeText}>
                        {isLifetime ? t('badgeLifetime') : t('badgePro')}
                    </p>
                    <h1 className={styles.headlineTitle}>
                        {t('headline')}
                    </h1>
                    <p className={styles.subLifetimeText}>
                        {isLifetime ? t('subLifetime') : t('subPro')}
                    </p>
                </div>

                {/* Divider */}
                <div className={styles.box} />

                {/* Perks unlocked */}
                <div className={styles.perksTitleStack}>
                    <p className={styles.perksTitleText}>
                        {t('perksTitle')}
                    </p>
                    {perks.map((perk, i) => (
                        <div key={i} className={styles.perkRow}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}>
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span className={styles.label}>{perk}</span>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <button
                    onClick={() => router.push(`/${locale}/home`)}
                    className={styles.ctaButton}
                >
                    {t('cta')}
                </button>

                <p className={styles.emailNoteText}>
                    {t('emailNote')}
                </p>
            </div>
        </div>
    );
}