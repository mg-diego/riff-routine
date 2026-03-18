"use client";

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLocale } from 'next-intl';
import { ONBOARDING_STEPS, OnboardingStep } from './onboardingSteps';

export interface SpotlightRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

export function useOnboarding() {
    const locale = useLocale();

    const [active, setActive] = useState(false);
    const [eligible, setEligible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
    const [navigating, setNavigating] = useState(false);
    const observerRef = useRef<MutationObserver | null>(null);

    // ── Sync state from sessionStorage ──────────────────────────────────────
    useEffect(() => {
        const syncState = () => {
            const saved = sessionStorage.getItem('onboarding_step');
            if (saved !== null) {
                setActive(true);
                setCurrentIndex(parseInt(saved, 10));
            } else {
                setActive(false);
            }
        };
        syncState();
        window.addEventListener('onboarding_state_change', syncState);
        return () => window.removeEventListener('onboarding_state_change', syncState);
    }, []);

    // ── Check eligibility from DB ────────────────────────────────────────────
    useEffect(() => {
        const check = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            const { data: profile } = await supabase
                .from('profiles')
                .select('has_completed_onboarding')
                .eq('id', user.id)
                .single();

            if (profile && !profile.has_completed_onboarding) {
                if (!sessionStorage.getItem('onboarding_step')) {
                    setEligible(true);
                    setActive(false);
                }
            } else {
                sessionStorage.removeItem('onboarding_step');
                setActive(false);
            }
            setLoading(false);
        };
        check();
    }, []);

    // ── Apply step when index or active changes ──────────────────────────────
    useEffect(() => {
        if (!active) return;
        const step = ONBOARDING_STEPS[currentIndex];
        applyStep(step);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, active]);

    // ── Listen for waitForEvent — advances when event fires ──────────────────
    // The tooltip STAYS VISIBLE while waiting (no special hiding logic needed —
    // the modal renders as long as active=true regardless of waitForEvent).
    useEffect(() => {
        if (!active) return;
        const step = ONBOARDING_STEPS[currentIndex];
        const eventName = step.waitForEvent;
        if (!eventName) return;

        const handleEvent = () => {
            setTimeout(() => next(), 50);
        };

        window.addEventListener(eventName, handleEvent);
        return () => window.removeEventListener(eventName, handleEvent);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, currentIndex]);

    // ── Cleanup observer ─────────────────────────────────────────────────────
    useEffect(() => {
        return () => observerRef.current?.disconnect();
    }, []);

    const applyStep = (step: OnboardingStep) => {
        // Welcome / finish steps — no spotlight needed
        if (!step.route && !step.target) {
            setSpotlightRect(null);
            setNavigating(false);
            return;
        }

        // Navigate if the step requires a different route
        const targetPath = `/${locale}${step.route}`;
        const currentPath = window.location.pathname + window.location.search;
        const needsNavigation = step.route &&
            !currentPath.startsWith(`/${locale}${step.route.split('?')[0]}`);

        if (needsNavigation) {
            setNavigating(true);
            setSpotlightRect(null);
            window.location.href = targetPath;
            return;
        }

        // Wait for the target element to appear in the DOM
        if (step.target) {
            waitForElement(step, (el) => {
                setNavigating(false);
                updateSpotlight(el);
                window.addEventListener('resize', () => updateSpotlight(el), { passive: true });
            });
        }
    };

    const waitForElement = (step: OnboardingStep, cb: (el: HTMLElement) => void) => {
        observerRef.current?.disconnect();

        const selector = `[data-onboarding="${step.target}"]`;

        const findAndBind = () => {
            const el = document.querySelector<HTMLElement>(selector);
            if (!el) return false;
            cb(el);
            return true;
        };

        if (findAndBind()) return;

        // Element not in DOM yet — observe until it appears (e.g. after navigation)
        const observer = new MutationObserver(() => {
            if (findAndBind()) observer.disconnect();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        observerRef.current = observer;

        // Safety timeout — stop waiting after 8s to avoid hanging
        setTimeout(() => observer.disconnect(), 8000);
    };

    const updateSpotlight = (el: HTMLElement) => {
        const rect = el.getBoundingClientRect();
        setSpotlightRect({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
        });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const notifyStateChange = () => {
        window.dispatchEvent(new Event('onboarding_state_change'));
    };

    const start = () => {
        setEligible(false);
        sessionStorage.setItem('onboarding_step', '0');
        notifyStateChange();
    };

    const next = () => {
        if (currentIndex < ONBOARDING_STEPS.length - 1) {
            const nextIndex = currentIndex + 1;
            sessionStorage.setItem('onboarding_step', String(nextIndex));
            notifyStateChange();
        } else {
            complete();
        }
    };

    const prev = () => {
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            sessionStorage.setItem('onboarding_step', String(prevIndex));
            notifyStateChange();
        }
    };

    const complete = async () => {
        sessionStorage.removeItem('onboarding_step');
        notifyStateChange();
        setEligible(false);
        setActive(false);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_demo')
            .eq('id', user.id)
            .single();

        if (!profile || profile.is_demo) return;

        await supabase
            .from('profiles')
            .update({ has_completed_onboarding: true })
            .eq('id', user.id);
    };

    const isLastStep = currentIndex === ONBOARDING_STEPS.length - 1;
    const currentStep = ONBOARDING_STEPS[currentIndex];

    return {
        active,
        eligible,
        loading,
        navigating,
        currentIndex,
        currentStep,
        spotlightRect,
        isLastStep,
        start,
        next,
        prev,
        complete,
    };
}