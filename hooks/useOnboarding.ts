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
    const [active, setActive] = useState(() => {
        // Si hay un step guardado en session, el onboarding estaba activo
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('onboarding_step') !== null;
        }
        return false;
    });
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
    const [navigating, setNavigating] = useState(false);
    const observerRef = useRef<MutationObserver | null>(null);

    // Check flag on mount
    useEffect(() => {
        const check = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }
            const { data: profile } = await supabase
                .from('profiles')
                .select('has_completed_onboarding')
                .eq('id', user.id)
                .single();
            if (profile && !profile.has_completed_onboarding) setActive(true);
            setLoading(false);
        };
        check();
    }, []);

    // When index changes, navigate + wait for element
    useEffect(() => {
        if (!active) return;
        const step = ONBOARDING_STEPS[currentIndex];
        applyStep(step);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, active]);

    // Cleanup observer on unmount
    useEffect(() => {
        return () => observerRef.current?.disconnect();
    }, []);

    const applyStep = (step: OnboardingStep) => {
        // Welcome step — no navigation, no spotlight
        if (!step.route && !step.target) {
            setSpotlightRect(null);
            setNavigating(false);
            return;
        }

        // Navigate if needed
        const targetPath = `/${locale}${step.route}`;
        const currentPath = window.location.pathname + window.location.search;
        const needsNavigation = step.route && !currentPath.startsWith(`/${locale}${step.route.split('?')[0]}`);

        if (needsNavigation) {
            setNavigating(true);
            setSpotlightRect(null);
            window.location.href = targetPath;
            // After navigation the page reloads — onboarding state is restored
            // via sessionStorage (see persistIndex below)
            return;
        }

        // Wait for element to appear in DOM
        if (step.target) {
            waitForElement(step.target, (el) => {
                setNavigating(false);
                updateSpotlight(el);
                // Update on resize
                window.addEventListener('resize', () => updateSpotlight(el), { passive: true });
            });
        }
    };

    const waitForElement = (target: string, cb: (el: HTMLElement) => void) => {
        observerRef.current?.disconnect();

        const selector = `[data-onboarding="${target}"]`;
        const existing = document.querySelector<HTMLElement>(selector);
        if (existing) { cb(existing); return; }

        const observer = new MutationObserver(() => {
            const el = document.querySelector<HTMLElement>(selector);
            if (el) {
                observer.disconnect();
                cb(el);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        observerRef.current = observer;

        // Fallback timeout after 5s
        setTimeout(() => {
            observer.disconnect();
            setNavigating(false);
        }, 5000);
    };

    const updateSpotlight = (el: HTMLElement) => {
        const rect = el.getBoundingClientRect();
        setSpotlightRect({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
        });
        // Scroll element into view
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const next = () => {
        if (currentIndex < ONBOARDING_STEPS.length - 1) {
            const nextIndex = currentIndex + 1;
            persistIndex(nextIndex);
            setCurrentIndex(nextIndex);
        } else {
            complete();
        }
    };

    const prev = () => {
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            persistIndex(prevIndex);
            setCurrentIndex(prevIndex);
        }
    };

    const complete = async () => {
        setActive(false);
        clearPersistedIndex();

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

    const persistIndex = (index: number) => {
        sessionStorage.setItem('onboarding_step', String(index));
    };

    const clearPersistedIndex = () => {
        sessionStorage.removeItem('onboarding_step');
    };

    useEffect(() => {
        const saved = sessionStorage.getItem('onboarding_step');
        if (saved !== null) {
            setCurrentIndex(parseInt(saved, 10));
        }
    }, []);

    const isLastStep = currentIndex === ONBOARDING_STEPS.length - 1;
    const currentStep = ONBOARDING_STEPS[currentIndex];

    return {
        active,
        loading,
        navigating,
        currentIndex,
        currentStep,
        spotlightRect,
        isLastStep,
        next,
        prev,
        complete,
    };
}