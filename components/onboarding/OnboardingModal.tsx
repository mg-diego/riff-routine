"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SpotlightRect } from '@/hooks/useOnboarding';
import { ONBOARDING_STEPS } from '@/hooks/onboardingSteps';
import css from './OnboardingModal.module.css';

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
    home: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    navbarLibrary: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    ),
    navbarRoutines: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
    ),
    navbarPractice: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
        </svg>
    ),
    navbarExplore: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
        </svg>
    ),
    navbarStats: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
    finish: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
};

function Arrow({ position }: { position: 'top' | 'bottom' | 'left' | 'right' }) {
    const s = 9;
    const base: React.CSSProperties = { position: 'absolute', width: 0, height: 0 };
    const styles: Record<string, React.CSSProperties> = {
        bottom: { ...base, top: -s, left: '50%', transform: 'translateX(-50%)', borderLeft: `${s}px solid transparent`, borderRight: `${s}px solid transparent`, borderBottom: `${s}px solid rgba(220,185,138,0.2)` },
        top: { ...base, bottom: -s, left: '50%', transform: 'translateX(-50%)', borderLeft: `${s}px solid transparent`, borderRight: `${s}px solid transparent`, borderTop: `${s}px solid rgba(220,185,138,0.2)` },
        right: { ...base, top: '50%', left: -s, transform: 'translateY(-50%)', borderTop: `${s}px solid transparent`, borderBottom: `${s}px solid transparent`, borderRight: `${s}px solid rgba(220,185,138,0.2)` },
        left: { ...base, top: '50%', right: -s, transform: 'translateY(-50%)', borderTop: `${s}px solid transparent`, borderBottom: `${s}px solid transparent`, borderLeft: `${s}px solid rgba(220,185,138,0.2)` },
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
    const isWaitingForEvent = !!step.waitForEvent;

    // 1. Añadimos estado para escuchar el scroll de la ventana
    const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleScroll = () => {
            setScrollPos({ x: window.scrollX, y: window.scrollY });
        };
        handleScroll(); // Capturar posición inicial
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const getTooltipStyle = (): React.CSSProperties => {
        if (!spotlightRect || isWelcome) {
            return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }
        const gap = PADDING + 16;

        // 2. Restamos el scroll a la coordenada original absoluta para cuadrarlo con el contenedor Fixed
        const r = spotlightRect;
        const top = r.top - scrollPos.y;
        const left = r.left - scrollPos.x;

        switch (pos) {
            case 'bottom': return { position: 'absolute', top: top + r.height + gap, left: left + r.width / 2, transform: 'translateX(-50%)' };
            case 'top': return { position: 'absolute', top: top - gap, left: left + r.width / 2, transform: 'translate(-50%, -100%)' };
            case 'right': return { position: 'absolute', top: top + r.height / 2, left: left + r.width + gap, transform: 'translateY(-50%)' };
            case 'left': return { position: 'absolute', top: top + r.height / 2, left: left - gap, transform: 'translate(-100%, -50%)' };
            default: return { position: 'absolute', top: top + r.height + gap, left: left + r.width / 2, transform: 'translateX(-50%)' };
        }
    };

    const Dots = () => (
        <div className={css.row}>
            {ONBOARDING_STEPS.map((_, i) => (
                <div key={i} className={css.block} style={{ width: i === currentIndex ? '16px' : '6px', background: i === currentIndex ? 'var(--gold)' : 'rgba(220,185,138,0.2)' }} />
            ))}
        </div>
    );

    const NavButtons = ({ welcome }: { welcome?: boolean }) => {
        if (navigating) {
            return (
                <div className={css.navigatingRow}>
                    <div className={css.dot} />
                    {t('navigating')}
                </div>
            );
        }

        // Si el paso requiere una acción física en la UI, ocultamos el botón "Siguiente"
        const isActionRequired = step.waitForEvent && !isWelcome;

        return (
            <div className={css.prevStack}>
                <div className={css.prevRow}>
                    {currentIndex > 0 && (
                        <button onClick={onPrev} className={css.prevButton} style={{ padding: welcome ? '0.65rem' : '0.5rem 0.65rem', fontSize: welcome ? '0.85rem' : '0.78rem' }}
                        >{t('prev')}</button>
                    )}

                    {!isActionRequired ? (
                        <button onClick={isLastStep ? onComplete : onNext} className={css.finishButton} style={{ flex: currentIndex > 0 ? 2 : 1, padding: welcome ? '0.65rem' : '0.5rem 0.65rem', fontSize: welcome ? '0.85rem' : '0.78rem' }}
                        >
                            {isLastStep ? t('finish') : t('next')}
                        </button>
                    ) : (
                        <div className={css.actionRequiredRow}>
                            {t('actionRequired', { defaultValue: 'Haz clic para continuar' })}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const SkipButton = ({ size = '0.78rem' }: { size?: string }) => (
        <button onClick={onComplete} className={css.skipButton} style={{ fontSize: size }}
        >
            {t('skip')}
        </button>
    );

    return (
        <>

            <div className={css.overlay}>
                {spotlightRect && !isWelcome ? (
                    <svg className={css.icon} style={{ pointerEvents: isWaitingForEvent ? 'none' : 'auto' }} onClick={undefined}>
                        <defs>
                            <mask id="ob-mask">
                                <rect width="100%" height="100%" fill="white" />
                                {/* 3. Aplicamos la misma corrección del scroll a la máscara SVG */}
                                <rect
                                    x={(spotlightRect.left - scrollPos.x) - PADDING}
                                    y={(spotlightRect.top - scrollPos.y) - PADDING}
                                    width={spotlightRect.width + PADDING * 2}
                                    height={spotlightRect.height + PADDING * 2}
                                    rx="8" fill="black"
                                />
                            </mask>
                        </defs>
                        <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#ob-mask)" />
                    </svg>
                ) : (
                    <div className={css.layer} style={{ background: isWaitingForEvent ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.72)', pointerEvents: isWaitingForEvent ? 'none' : 'auto' }} onClick={undefined} />
                )}

                {spotlightRect && !isWelcome && (
                    <div className={css.layer2} style={{ top: (spotlightRect.top - scrollPos.y) - PADDING, left: (spotlightRect.left - scrollPos.x) - PADDING, width: spotlightRect.width + PADDING * 2, height: spotlightRect.height + PADDING * 2 }} />
                )}
            </div>

            {/* ── WELCOME modal — large centered ── */}
            {isWelcome && (
                <div onClick={e => e.stopPropagation()} className={css.titleStack} style={{ ...getTooltipStyle() }}>
                    <div className={css.welcomeRow}>
                        {ICONS.welcome}
                    </div>
                    <div>
                        <h2 className={css.titleHeading}>
                            {t('slides.welcome.title')}
                        </h2>
                        <p className={css.descriptionText}>
                            {t('slides.welcome.description')}
                        </p>
                    </div>
                    <Dots />
                    <div className={css.stack}>
                        <NavButtons welcome />
                        <SkipButton />
                    </div>
                </div>
            )}

            {/* ── SPOTLIGHT tooltip — compact ── */}
            {!isWelcome && (
                <div onClick={e => e.stopPropagation()} className={css.navigatingStack} style={{ ...getTooltipStyle() }}>
                    <Arrow position={pos} />

                    <div className={css.navigatingStackRow}>
                        <div className={css.navigatingStackRowInner}>
                            {ICONS[step.key]}
                        </div>
                        <span className={css.label}>
                            {t(`slides.${step.key}.title`)}
                        </span>
                    </div>

                    <p className={css.navigatingText}>
                        {navigating ? t('navigating') : t(`slides.${step.key}.description`)}
                    </p>

                    <Dots />
                    <NavButtons />

                    <SkipButton size="0.7rem" />
                </div>
            )}
        </>
    );
}