"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { SpotlightRect } from '@/hooks/useOnboarding';
import { ONBOARDING_STEPS } from '@/hooks/onboardingSteps';

const PADDING = 12;

interface OnboardingModalProps {
    currentIndex: number;
    spotlightRect: SpotlightRect | null;
    navigating: boolean;
    isLastStep: boolean;
    onNext: () => void;
    onPrev: () => void;
    onComplete: () => void;
}

const ICONS: Record<string, React.ReactNode> = {
    welcome: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
    ),
    routines: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
    ),
    library: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    ),
    scales: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="2" y1="8" x2="22" y2="8" /><line x1="2" y1="13" x2="22" y2="13" />
            <line x1="7" y1="3" x2="7" y2="17" /><line x1="12" y1="3" x2="12" y2="17" /><line x1="17" y1="3" x2="17" y2="17" />
        </svg>
    ),
    stats: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
};

function Arrow({ position }: { position: 'top' | 'bottom' | 'left' | 'right' }) {
    const s = 9;
    const base: React.CSSProperties = { position: 'absolute', width: 0, height: 0 };
    const styles: Record<string, React.CSSProperties> = {
        bottom: { ...base, top: -s, left: '50%', transform: 'translateX(-50%)', borderLeft: `${s}px solid transparent`, borderRight: `${s}px solid transparent`, borderBottom: `${s}px solid rgba(220,185,138,0.2)` },
        top:    { ...base, bottom: -s, left: '50%', transform: 'translateX(-50%)', borderLeft: `${s}px solid transparent`, borderRight: `${s}px solid transparent`, borderTop: `${s}px solid rgba(220,185,138,0.2)` },
        right:  { ...base, top: '50%', left: -s, transform: 'translateY(-50%)', borderTop: `${s}px solid transparent`, borderBottom: `${s}px solid transparent`, borderRight: `${s}px solid rgba(220,185,138,0.2)` },
        left:   { ...base, top: '50%', right: -s, transform: 'translateY(-50%)', borderTop: `${s}px solid transparent`, borderBottom: `${s}px solid transparent`, borderLeft: `${s}px solid rgba(220,185,138,0.2)` },
    };
    return <div style={styles[position]} />;
}

export function OnboardingModal({
    currentIndex, spotlightRect, navigating,
    isLastStep, onNext, onPrev, onComplete,
}: OnboardingModalProps) {
    const t = useTranslations('onboarding');
    const step = ONBOARDING_STEPS[currentIndex];
    const isWelcome = !step.route && !step.target;
    const pos = step.tooltipPosition || 'bottom';

    const getTooltipStyle = (): React.CSSProperties => {
        if (!spotlightRect || isWelcome) {
            return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }
        const gap = PADDING + 16;
        const r = spotlightRect;
        switch (pos) {
            case 'bottom': return { position: 'absolute', top: r.top + r.height + gap, left: r.left + r.width / 2, transform: 'translateX(-50%)' };
            case 'top':    return { position: 'absolute', top: r.top - gap, left: r.left + r.width / 2, transform: 'translate(-50%, -100%)' };
            case 'right':  return { position: 'absolute', top: r.top + r.height / 2, left: r.left + r.width + gap, transform: 'translateY(-50%)' };
            case 'left':   return { position: 'absolute', top: r.top + r.height / 2, left: r.left - gap, transform: 'translate(-100%, -50%)' };
            default:       return { position: 'absolute', top: r.top + r.height + gap, left: r.left + r.width / 2, transform: 'translateX(-50%)' };
        }
    };

    const Dots = () => (
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            {ONBOARDING_STEPS.map((_, i) => (
                <div key={i} style={{
                    width: i === currentIndex ? '16px' : '6px', height: '6px',
                    borderRadius: '3px',
                    background: i === currentIndex ? 'var(--gold)' : 'rgba(220,185,138,0.2)',
                    transition: 'all 0.2s ease',
                }} />
            ))}
        </div>
    );

    const NavButtons = ({ welcome }: { welcome?: boolean }) => (
        navigating ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.78rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid rgba(220,185,138,0.25)', borderTopColor: 'var(--gold)', animation: 'ob-spin 0.7s linear infinite' }} />
                {t('navigating')}
            </div>
        ) : (
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                {currentIndex > 0 && (
                    <button onClick={onPrev} style={{
                        flex: 1, padding: welcome ? '0.65rem' : '0.5rem 0.65rem',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '7px', color: 'var(--muted)', cursor: 'pointer',
                        fontSize: welcome ? '0.85rem' : '0.78rem', fontWeight: 600,
                        fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--muted)'; }}
                    >{t('prev')}</button>
                )}
                <button onClick={isLastStep ? onComplete : onNext} style={{
                    flex: currentIndex > 0 ? 2 : 1,
                    padding: welcome ? '0.65rem' : '0.5rem 0.65rem',
                    background: 'var(--gold)', border: 'none', borderRadius: '7px', color: '#111',
                    cursor: 'pointer', fontSize: welcome ? '0.85rem' : '0.78rem', fontWeight: 700,
                    fontFamily: 'DM Sans, sans-serif', transition: 'opacity 0.15s',
                }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >{isLastStep ? t('finish') : t('next')}</button>
            </div>
        )
    );

    const SkipButton = ({ size = '0.78rem' }: { size?: string }) => (
        <button onClick={onComplete} style={{
            background: 'none', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', fontSize: size, padding: '0.2rem',
            fontFamily: 'DM Sans, sans-serif', transition: 'color 0.15s',
            alignSelf: 'center',
        }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
        >
            {t('skip')}
        </button>
    );

    return (
        <>
            <style>{`
                @keyframes ob-fade  { from { opacity:0 } to { opacity:1 } }
                @keyframes ob-up    { from { opacity:0; transform:translate(-50%,calc(-50% + 10px)) } to { opacity:1; transform:translate(-50%,-50%) } }
                @keyframes ob-pulse { 0%,100% { box-shadow:0 0 0 0 rgba(220,185,138,0.35) } 60% { box-shadow:0 0 0 7px rgba(220,185,138,0) } }
                @keyframes ob-spin  { to { transform:rotate(360deg) } }
            `}</style>

            {/* Backdrop */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none' }}>
                {spotlightRect && !isWelcome ? (
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'auto' }} onClick={onComplete}>
                        <defs>
                            <mask id="ob-mask">
                                <rect width="100%" height="100%" fill="white" />
                                <rect x={spotlightRect.left - PADDING} y={spotlightRect.top - PADDING} width={spotlightRect.width + PADDING * 2} height={spotlightRect.height + PADDING * 2} rx="8" fill="black" />
                            </mask>
                        </defs>
                        <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#ob-mask)" />
                    </svg>
                ) : (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)', pointerEvents: 'auto' }} onClick={onComplete} />
                )}
                {spotlightRect && !isWelcome && (
                    <div style={{
                        position: 'absolute',
                        top: spotlightRect.top - PADDING, left: spotlightRect.left - PADDING,
                        width: spotlightRect.width + PADDING * 2, height: spotlightRect.height + PADDING * 2,
                        borderRadius: '8px', border: '1.5px solid rgba(220,185,138,0.5)',
                        animation: 'ob-pulse 2s ease infinite', pointerEvents: 'none',
                    }} />
                )}
            </div>

            {/* ── WELCOME modal — large centered ── */}
            {isWelcome && (
                <div onClick={e => e.stopPropagation()} style={{
                    ...getTooltipStyle(), zIndex: 1001,
                    background: 'var(--surface)', border: '1px solid rgba(220,185,138,0.2)',
                    borderRadius: '16px', padding: '2rem',
                    width: '100%', maxWidth: '420px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                    animation: 'ob-up 0.22s ease',
                    pointerEvents: 'auto', textAlign: 'center',
                }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '14px',
                        background: 'rgba(220,185,138,0.1)', border: '1px solid rgba(220,185,138,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)',
                    }}>
                        {ICONS.welcome}
                    </div>
                    <div>
                        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: 'var(--gold)', margin: '0 0 0.5rem', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                            {t('slides.welcome.title')}
                        </h2>
                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
                            {t('slides.welcome.description')}
                        </p>
                    </div>
                    <Dots />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                        <NavButtons welcome />
                        <SkipButton />
                    </div>
                </div>
            )}

            {/* ── SPOTLIGHT tooltip — compact ── */}
            {!isWelcome && (
                <div onClick={e => e.stopPropagation()} style={{
                    ...getTooltipStyle(), zIndex: 1001,
                    background: 'var(--surface)', border: '1px solid rgba(220,185,138,0.2)',
                    borderRadius: '10px', padding: '1rem 1rem 0.9rem',
                    width: '100%', maxWidth: '260px',
                    display: 'flex', flexDirection: 'column', gap: '0.75rem',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.55)',
                    animation: 'ob-fade 0.18s ease',
                    pointerEvents: 'auto',
                }}>
                    <Arrow position={pos} />

                    {/* Header: icon + title only — no skip here */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                            width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
                            background: 'rgba(220,185,138,0.1)', border: '1px solid rgba(220,185,138,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)',
                        }}>
                            {ICONS[step.key]}
                        </div>
                        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: 'var(--gold)', letterSpacing: '0.04em', lineHeight: 1.2, flex: 1 }}>
                            {t(`slides.${step.key}.title`)}
                        </span>
                    </div>

                    <p style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>
                        {navigating ? t('navigating') : t(`slides.${step.key}.description`)}
                    </p>

                    <Dots />
                    <NavButtons />

                    {/* Skip below nav buttons — never overlaps title */}
                    <SkipButton size="0.7rem" />
                </div>
            )}
        </>
    );
}