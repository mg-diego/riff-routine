export interface OnboardingStep {
    key: string;
    route?: string;
    target?: string;
    tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
    waitForEvent?: 'app:exercise-created' | 'app:routine-created' | 'app:play-exercise' | 'app:play-routine' | 'app:open-new-exercise-modal' | 'app:open-new-routine-modal' | 'app:open-end-routine-modal' | 'app:end-routine-practice';
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        key: 'welcome',
    },
    {
        key: 'home',
        route: '/home',
        target: 'home',
        tooltipPosition: 'right',
    },
    {
        key: 'navbarLibrary',
        route: '/library',
        target: 'navbarLibrary',
        tooltipPosition: 'bottom',
    },
    {
        key: 'library-01',
        route: '/library',
        target: 'library-01',
        tooltipPosition: 'left',
        waitForEvent: 'app:open-new-exercise-modal',
    },
    {
        key: 'library-02',
        route: '/library/new',
        target: 'library-02',
        tooltipPosition: 'left',
    },
    {
        key: 'library-03',
        target: 'library-03',
        tooltipPosition: 'left',
    },
    {
        key: 'library-04',
        target: 'library-04',
        tooltipPosition: 'left',
    },
    {
        key: 'library-05',
        target: 'library-05',
        tooltipPosition: 'left',
    },
    {
        key: 'library-06',
        target: 'library-06',
        tooltipPosition: 'left',
    },
    {
        key: 'library-07',
        target: 'library-07',
        tooltipPosition: 'left',
    },
    {
        key: 'library-08',
        target: 'library-08',
        tooltipPosition: 'left',
        waitForEvent: 'app:exercise-created',
    },
    {
        key: 'library-09',
        route: '/library',
        target: 'library-09',
        tooltipPosition: 'left',
    },
    {
        key: 'library-10',
        route: '/library',
        target: 'library-10',
        tooltipPosition: 'left',
        waitForEvent: 'app:play-exercise',
    },
    {
        key: 'practice-01',
        target: 'practice-01',
        tooltipPosition: 'bottom',
    },
    {
        key: 'practice-02',
        target: 'practice-02',
        tooltipPosition: 'left',
    },
    {
        key: 'navbarRoutines',
        route: '/routines',
        target: 'navbarRoutines',
        tooltipPosition: 'bottom',
    },
    {
        key: 'routines-01',
        route: '/routines',
        target: 'routines-01',
        tooltipPosition: 'left',
        waitForEvent: 'app:open-new-routine-modal',
    },
    {
        key: 'routines-02',
        route: '/routines/new',
        target: 'routines-02',
        tooltipPosition: 'left',
    },
    {
        key: 'routines-03',
        route: '/routines/new',
        target: 'routines-03',
        tooltipPosition: 'right',
    },
    {
        key: 'routines-04',
        route: '/routines/new',
        target: 'routines-04',
        tooltipPosition: 'left',
        waitForEvent: 'app:routine-created',
    },
    {
        key: 'routines-05',
        route: '/routines',
        target: 'routines-05',
        tooltipPosition: 'left'
    },
    {
        key: 'routines-06',
        route: '/routines',
        target: 'routines-06',
        tooltipPosition: 'left',
        waitForEvent: 'app:play-routine',
    },
    {
        key: 'practice-03',
        target: 'practice-03',
        tooltipPosition: 'left',
    },
    {
        key: 'practice-04',
        target: 'practice-04',
        tooltipPosition: 'left',
        waitForEvent: 'app:open-end-routine-modal',
    },
    {
        key: 'practice-05',
        target: 'practice-05',
        tooltipPosition: 'left',
    },
    {
        key: 'practice-06',
        target: 'practice-06',
        tooltipPosition: 'left',
        waitForEvent: 'app:end-routine-practice',
    },
    {
        key: 'navbarExplore',
        route: '/explore',
        target: 'navbarExplore',
        tooltipPosition: 'bottom',
    },
    {
        key: 'explore-01',
        route: '/explore',
        target: 'explore-01',
        tooltipPosition: 'bottom',
    },
    {
        key: 'navbarStats',
        route: '/stats',
        target: 'navbarStats',
        tooltipPosition: 'bottom',
    },
    {
        key: 'stats-01',
        route: '/stats',
        target: 'stats-01',
        tooltipPosition: 'bottom',
    },
    {
        key: 'stats-02',
        route: '/stats',
        target: 'stats-02',
        tooltipPosition: 'bottom',
    },
    {
        key: 'finish',
        route: '/home',
    },
];