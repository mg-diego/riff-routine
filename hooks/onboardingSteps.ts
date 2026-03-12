export interface OnboardingStep {
    key: string;
    route?: string;               // navigate before showing spotlight
    target?: string;              // data-onboarding attribute value
    tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

// Step 1 is the welcome modal (no route, no target)
// Steps 2-5 navigate and spotlight a real element
export const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        key: 'welcome',
    },
    {
        key: 'routines',
        route: '/routines',
        target: 'create-routine',
        tooltipPosition: 'bottom',
    },
    {
        key: 'library',
        route: '/library',
        target: 'library-list',
        tooltipPosition: 'right',
    },
    {
        key: 'scales',
        route: '/practice?mode=scales',
        target: 'scales-selector',
        tooltipPosition: 'bottom',
    },
    {
        key: 'stats',
        route: '/stats',
        target: 'stats-chart',
        tooltipPosition: 'top',
    },
    {
        key: 'finish',
        route: '/home',
    },
];