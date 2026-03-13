"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';

const MONTHLY_PRICE = 4.99;
const ANNUAL_TOTAL = 39.99;
const LIFETIME_PRICE = 119;
const ANNUAL_MONTHLY_EQUIVALENT = (ANNUAL_TOTAL / 12).toFixed(2);

type Plan = 'free' | 'pro' | 'lifetime';
type FeatureValue = boolean | string;

interface Feature {
    label: string;
    free: FeatureValue;
    pro: FeatureValue;
    lifetime: FeatureValue;
}

export default function ProPage() {
    const t = useTranslations('Pro');
    const router = useRouter();
    const locale = useLocale();

    const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
    const [currentTier, setCurrentTier] = useState<Plan>('free');
    const [isLoading, setIsLoading] = useState(false);
    const [tierLoading, setTierLoading] = useState(true);

    const price = billing === 'annual' ? ANNUAL_MONTHLY_EQUIVALENT : MONTHLY_PRICE.toFixed(2);
    const annualSaving = Math.round((1 - ANNUAL_TOTAL / (MONTHLY_PRICE * 12)) * 100);
    
    useEffect(() => {
        const load = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('subscription_tier')
                    .eq('id', user.id)
                    .single();
                if (profile?.subscription_tier) setCurrentTier(profile.subscription_tier as Plan);
            } finally {
                setTierLoading(false);
            }
        };
        load();
    }, []);

    const handleUpgradePro = async () => {
        try {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push(`/${locale}/login`); return; }

            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    interval: billing,
                    plan: 'pro',
                }),
            });
            const { url } = await response.json();
            if (url) window.location.href = url;
        } catch (error) {
            console.error('[pro] checkout error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpgradeLifetime = async () => {
        try {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push(`/${locale}/login`); return; }

            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    plan: 'lifetime',
                }),
            });
            const { url } = await response.json();
            if (url) window.location.href = url;
        } catch (error) {
            console.error('[pro] lifetime checkout error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Defensive CTA logic per plan
    const getCtaState = (plan: Plan): { label: string; disabled: boolean; action?: () => void } => {
        if (tierLoading) return { label: '...', disabled: true };

        if (plan === 'free') {
            return { label: t('free.cta'), disabled: true };
        }
        if (plan === 'pro') {
            if (currentTier === 'pro') return { label: t('currentPlan'), disabled: true };
            if (currentTier === 'lifetime') return { label: t('notAvailable'), disabled: true };
            return { label: isLoading ? t('loading') : t('pro.cta'), disabled: isLoading, action: handleUpgradePro };
        }
        if (plan === 'lifetime') {
            if (currentTier === 'lifetime') return { label: t('currentPlan'), disabled: true };
            return { label: isLoading ? t('loading') : t('lifetime.cta'), disabled: isLoading, action: handleUpgradeLifetime };
        }
        return { label: t('free.cta'), disabled: true };
    };

    const features: Feature[] = [
        { label: t('features.routines'), free: t('features.routinesFree'), pro: t('features.unlimited'), lifetime: t('features.unlimited') },
        { label: t('features.exercises'), free: t('features.exercisesFree'), pro: t('features.unlimited'), lifetime: t('features.unlimited') },
        { label: t('features.library'), free: true, pro: true, lifetime: true },
        { label: t('features.scales'), free: true, pro: true, lifetime: true },
        { label: t('features.stats'), free: t('features.statsBasic'), pro: t('features.statsFull'), lifetime: t('features.statsFull') },
        { label: t('features.player'), free: t('features.playerBasic'), pro: t('features.playerFull'), lifetime: t('features.playerFull') },
        { label: t('features.earlyAccess'), free: false, pro: false, lifetime: true },
        { label: t('features.noFuturePriceRaise'), free: false, pro: false, lifetime: true },
        { label: t('features.support'), free: t('features.supportCom'), pro: t('features.supportPri'), lifetime: t('features.supportDedicated') },
    ];

    return (
        <div style={{
            maxWidth: '980px', margin: '0 auto',
            padding: '3rem 1.5rem 4rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem',
        }}>

            {/* Header */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <p style={{ color: 'var(--gold)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0, opacity: 0.8 }}>
                    {t('eyebrow')}
                </p>
                <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2.6rem, 6vw, 4.2rem)', color: 'var(--text)', margin: 0, lineHeight: 1 }}>
                    {t('headline')}
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem', maxWidth: '500px', lineHeight: 1.7, margin: 0 }}>
                    {t('subheadline')}
                </p>
            </div>

            {/* Billing toggle */}
            <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--surface)', borderRadius: '100px',
                padding: '0.3rem', border: '1px solid rgba(255,255,255,0.06)',
            }}>
                {(['monthly', 'annual'] as const).map(b => (
                    <button key={b} onClick={() => setBilling(b)} style={{
                        padding: '0.45rem 1.2rem', borderRadius: '100px', border: 'none',
                        background: billing === b ? 'var(--gold)' : 'transparent',
                        color: billing === b ? '#111' : 'var(--muted)',
                        fontWeight: 700, fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif',
                        cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                    }}>
                        {t(`billing.${b}`)}
                        {b === 'annual' && (
                            <span style={{
                                background: billing === 'annual' ? 'rgba(0,0,0,0.18)' : 'rgba(220,185,138,0.15)',
                                color: billing === 'annual' ? '#111' : 'var(--gold)',
                                fontSize: '0.62rem', fontWeight: 800,
                                padding: '0.1rem 0.4rem', borderRadius: '100px',
                            }}>
                                -{annualSaving}%
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', width: '100%', alignItems: 'start' }}>
                <PlanCard
                    plan="free"
                    title="Free"
                    price="€0"
                    priceSub={t('billing.forever')}
                    description={t('free.description')}
                    ctaState={getCtaState('free')}
                    features={features}
                    t={t}
                />
                <PlanCard
                    plan="pro"
                    title="Pro"
                    price={`€${price}`}
                    priceSub={t('billing.perMonth')}
                    priceNote={
                        billing === 'annual'
                            ? t('billing.billedAnnually', { total: ANNUAL_TOTAL.toFixed(2) })
                            : undefined
                    } description={t('pro.description')}
                    badge={t('pro.badge')}
                    highlighted
                    ctaState={getCtaState('pro')}
                    features={features}
                    currentTier={currentTier}
                    t={t}
                />
                <PlanCard
                    plan="lifetime"
                    title="Lifetime"
                    price={`€${LIFETIME_PRICE}`}
                    priceSub={t('billing.oneTime')}
                    description={t('lifetime.description')}
                    ctaState={getCtaState('lifetime')}
                    features={features}
                    t={t}
                />
            </div>

            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', textAlign: 'center', opacity: 0.55, maxWidth: '480px' }}>
                {t('footer')}
            </p>
        </div>
    );
}

/* ─── Plan Card ─── */

interface CtaState { label: string; disabled: boolean; action?: () => void; }

interface PlanCardProps {
    plan: Plan;
    title: string;
    price: string;
    priceSub: string;
    priceNote?: string;
    description: string;
    badge?: string;
    highlighted?: boolean;
    ctaState: CtaState;
    currentTier?: Plan;
    features: Feature[];
    t: (key: string, values?: Record<string, string>) => string;
}

function PlanCard({
    plan, title, price, priceSub, priceNote,
    description, badge, highlighted, ctaState,
    currentTier, features, t,
}: PlanCardProps) {
    const isLifetime = plan === 'lifetime';
    const isCurrentPlan = currentTier === plan;

    return (
        <div style={{
            background: 'var(--surface)', borderRadius: '16px',
            border: highlighted
                ? '1.5px solid rgba(220,185,138,0.4)'
                : isLifetime
                    ? '1.5px solid rgba(220,185,138,0.15)'
                    : '1px solid rgba(255,255,255,0.06)',
            padding: '1.75rem 1.5rem',
            display: 'flex', flexDirection: 'column', gap: '1.5rem',
            position: 'relative', overflow: 'hidden',
            boxShadow: highlighted ? '0 0 48px rgba(220,185,138,0.07)' : 'none',
        }}>

            {(highlighted || isLifetime) && (
                <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: highlighted ? '65%' : '40%', height: '1px',
                    background: highlighted
                        ? 'linear-gradient(90deg, transparent, rgba(220,185,138,0.7), transparent)'
                        : 'linear-gradient(90deg, transparent, rgba(220,185,138,0.3), transparent)',
                }} />
            )}

            {/* Badge — "Most popular" or "Best value" or "Current plan" */}
            {(badge || isCurrentPlan || isLifetime) && (
                <div style={{
                    position: 'absolute', top: '1.1rem', right: '1.1rem',
                    background: isCurrentPlan
                        ? 'rgba(255,255,255,0.07)'
                        : highlighted ? 'var(--gold)' : 'rgba(220,185,138,0.1)',
                    color: isCurrentPlan ? 'var(--muted)' : highlighted ? '#111' : 'var(--gold)',
                    border: isCurrentPlan || (!highlighted && isLifetime) ? '1px solid rgba(220,185,138,0.25)' : 'none',
                    fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em',
                    textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: '100px',
                }}>
                    {isCurrentPlan ? t('currentPlan') : badge ?? t('lifetime.badge')}
                </div>
            )}

            {/* Price */}
            <div>
                <p style={{
                    color: highlighted ? 'var(--gold)' : isLifetime ? 'rgba(220,185,138,0.6)' : 'var(--muted)',
                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase', margin: '0 0 0.4rem',
                }}>
                    {title}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.6rem', lineHeight: 1, color: highlighted ? 'var(--gold)' : 'var(--text)' }}>
                        {price}
                    </span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{priceSub}</span>
                </div>
                {priceNote && <p style={{ color: 'var(--muted)', fontSize: '0.73rem', margin: '0.2rem 0 0' }}>{priceNote}</p>}
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.6rem 0 0', lineHeight: 1.55 }}>{description}</p>
            </div>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                {features.map((f, i) => {
                    const val = f[plan];
                    const active = val !== false;
                    return (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                            {active ? (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                    stroke={highlighted ? 'var(--gold)' : isLifetime ? 'rgba(220,185,138,0.7)' : 'rgba(255,255,255,0.35)'}
                                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                    style={{ flexShrink: 0, marginTop: '2px' }}>
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                    stroke="rgba(255,255,255,0.12)" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round"
                                    style={{ flexShrink: 0, marginTop: '2px' }}>
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            )}
                            <span style={{ fontSize: '0.8rem', color: active ? 'var(--text)' : 'rgba(255,255,255,0.2)', lineHeight: 1.4 }}>
                                {f.label}
                                {typeof val === 'string' && (
                                    <span style={{
                                        marginLeft: '0.3rem', fontSize: '0.72rem', fontWeight: 700,
                                        color: highlighted ? 'var(--gold)' : isLifetime ? 'rgba(220,185,138,0.65)' : 'var(--muted)',
                                    }}>
                                        — {val}
                                    </span>
                                )}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* CTA */}
            <button
                onClick={ctaState.action}
                disabled={ctaState.disabled}
                style={{
                    padding: '0.8rem', borderRadius: '10px',
                    fontWeight: 800, fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif',
                    cursor: ctaState.disabled ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.15s',
                    opacity: ctaState.disabled ? 0.5 : 1,
                    background: highlighted
                        ? 'var(--gold)'
                        : isLifetime
                            ? 'rgba(220,185,138,0.1)'
                            : 'rgba(255,255,255,0.04)',
                    color: highlighted ? '#111' : isLifetime ? 'var(--gold)' : 'var(--muted)',
                    border: highlighted
                        ? 'none'
                        : isLifetime
                            ? '1px solid rgba(220,185,138,0.25)'
                            : '1px solid rgba(255,255,255,0.08)',
                } as React.CSSProperties}
                onMouseEnter={e => { if (!ctaState.disabled) e.currentTarget.style.opacity = '0.8'; }}
                onMouseLeave={e => { if (!ctaState.disabled) e.currentTarget.style.opacity = '1'; }}
            >
                {ctaState.label}
            </button>

            {highlighted && !ctaState.disabled && (
                <p style={{ color: 'var(--muted)', fontSize: '0.7rem', textAlign: 'center', margin: '-1rem 0 0' }}>
                    {t('pro.guarantee')}
                </p>
            )}
        </div>
    );
}