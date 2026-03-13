"use client";

import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingModal } from './OnboardingModal';

export function OnboardingWrapper() {
    const {
        active, loading, navigating,
        currentIndex, spotlightRect,
        isLastStep, next, prev, complete,
    } = useOnboarding();

    // Don't render anything until we know whether to show onboarding
    if (loading) return null;
    if (!active) return null;

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