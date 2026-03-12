"use client";

import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingModal } from './OnboardingModal';

export function OnboardingWrapper() {
    const {
        active, loading, navigating,
        currentIndex, spotlightRect,
        isLastStep, next, prev, complete,
    } = useOnboarding();

    if (loading || !active) return null;

    return (
        <OnboardingModal
            currentIndex={currentIndex}
            spotlightRect={spotlightRect}
            navigating={navigating}
            isLastStep={isLastStep}
            onNext={next}
            onPrev={prev}
            onComplete={complete}
        />
    );
}