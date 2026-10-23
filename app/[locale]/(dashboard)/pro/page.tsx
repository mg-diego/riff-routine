"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SubscriptionTier } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';
import { cx } from '@/lib/cx';

const MONTHLY_PRICE = 4.99;
const ANNUAL_TOTAL = 39.99;
const LIFETIME_PRICE = 119;
const ANNUAL_MONTHLY_EQUIVALENT = (ANNUAL_TOTAL / 12).toFixed(2);

type Plan = SubscriptionTier;
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
        <div className={styles.eyebrowStack}>

            {/* Header */}
            <div className={styles.eyebrowStack2}>
                <p className={styles.eyebrowText}>
                    {t('eyebrow')}
                </p>
                <h1 className={styles.headlineTitle}>
                    {t('headline')}
                </h1>
                <p className={styles.subheadlineText}>
                    {t('subheadline')}
                </p>
            </div>

            {/* Billing toggle */}
            <div className={styles.row}>
                {(['monthly', 'annual'] as const).map(b => (
                    <button key={b} onClick={() => setBilling(b)} className={styles.button} style={{ background: billing === b ? 'var(--gold)' : 'transparent', color: billing === b ? '#111' : 'var(--muted)' }}>
                        {t(`billing.${b}`)}
                        {b === 'annual' && (
                            <span className={styles.label} style={{ background: billing === 'annual' ? 'rgba(0,0,0,0.18)' : 'rgba(220,185,138,0.15)', color: billing === 'annual' ? '#111' : 'var(--gold)' }}>
                                -{annualSaving}%
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Cards */}
            <div className={styles.foreverGrid}>
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

            <p className={styles.footerText}>
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
        <div className={styles.currentPlanStack} style={{ border: highlighted
                ? '1.5px solid rgba(220,185,138,0.4)'
                : isLifetime
                    ? '1.5px solid rgba(220,185,138,0.15)'
                    : '1px solid rgba(255,255,255,0.06)', boxShadow: highlighted ? '0 0 48px rgba(220,185,138,0.07)' : 'none' }}>

            {(highlighted || isLifetime) && (
                <div className={styles.layer} style={{ width: highlighted ? '65%' : '40%', background: highlighted
                        ? 'linear-gradient(90deg, transparent, rgba(220,185,138,0.7), transparent)'
                        : 'linear-gradient(90deg, transparent, rgba(220,185,138,0.3), transparent)' }} />
            )}

            {/* Badge — "Most popular" or "Best value" or "Current plan" */}
            {(badge || isCurrentPlan || isLifetime) && (
                <div className={styles.currentPlanLayer} style={{ background: isCurrentPlan
                        ? 'rgba(255,255,255,0.07)'
                        : highlighted ? 'var(--gold)' : 'rgba(220,185,138,0.1)', color: isCurrentPlan ? 'var(--muted)' : highlighted ? '#111' : 'var(--gold)', border: isCurrentPlan || (!highlighted && isLifetime) ? '1px solid rgba(220,185,138,0.25)' : 'none' }}>
                    {isCurrentPlan ? t('currentPlan') : badge ?? t('lifetime.badge')}
                </div>
            )}

            {/* Price */}
            <div>
                <p className={styles.text} style={{ color: highlighted ? 'var(--gold)' : isLifetime ? 'rgba(220,185,138,0.6)' : 'var(--muted)' }}>
                    {title}
                </p>
                <div className={styles.priceRow}>
                    <span className={styles.priceLabel} style={{ color: highlighted ? 'var(--gold)' : 'var(--text)' }}>
                        {price}
                    </span>
                    <span className={styles.priceSubLabel}>{priceSub}</span>
                </div>
                {priceNote && <p className={styles.priceNoteText}>{priceNote}</p>}
                <p className={styles.descriptionText}>{description}</p>
            </div>

            {/* Features */}
            <div className={styles.stack}>
                {features.map((f, i) => {
                    const val = f[plan];
                    const active = val !== false;
                    return (
                        <div key={i} className={styles.currentPlanStackRow}>
                            {active ? (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                    stroke={highlighted ? 'var(--gold)' : isLifetime ? 'rgba(220,185,138,0.7)' : 'rgba(255,255,255,0.35)'}
                                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                    className={styles.icon}>
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                    stroke="rgba(255,255,255,0.12)" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round"
                                    className={styles.icon}>
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            )}
                            <span className={styles.currentPlanStackLabel} style={{ color: active ? 'var(--text)' : 'rgba(255,255,255,0.2)' }}>
                                {f.label}
                                {typeof val === 'string' && (
                                    <span className={styles.currentPlanStackLabelInner} style={{ color: highlighted ? 'var(--gold)' : isLifetime ? 'rgba(220,185,138,0.65)' : 'var(--muted)' }}>
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
                className={cx(styles.cta, highlighted ? styles.ctaHighlighted : isLifetime && styles.ctaLifetime)}
            >
                {ctaState.label}
            </button>

            {highlighted && !ctaState.disabled && (
                <p className={styles.guaranteeText}>
                    {t('pro.guarantee')}
                </p>
            )}
        </div>
    );
}