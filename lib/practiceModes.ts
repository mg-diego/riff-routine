// Special modes render a dedicated panel instead of (or on top of) the score.
// Order matters: it is the priority used when resolving which panel to show.
export const SPECIAL_MODES = [
  'scales',
  'rhythm',
  'earTraining',
  'improvisation',
  'composition',
  'chords',
  'harmonization',
  'speed',
] as const;

export type SpecialMode = typeof SPECIAL_MODES[number];
export type PracticeMode = 'free' | 'library' | 'routine' | SpecialMode;

// Title of the system exercise backing each special mode (also an i18n key in `SystemExercises`).
export const SYSTEM_EXERCISE_TITLES: Record<SpecialMode, string> = {
  scales: 'sys_scales_title',
  rhythm: 'sys_rhythm_title',
  earTraining: 'sys_ear_training_title',
  improvisation: 'sys_improvisation_title',
  composition: 'sys_composition_title',
  chords: 'sys_chords_title',
  harmonization: 'sys_harmonization_title',
  speed: 'sys_speed_title',
};

export const isSpecialMode = (value: string): value is SpecialMode =>
  (SPECIAL_MODES as readonly string[]).includes(value);

// A special mode is active either because the player was opened with `?mode=` or because
// the current exercise (e.g. inside a routine) is the matching system exercise.
export const matchesSpecialMode = (target: SpecialMode, mode: PracticeMode, exerciseTitle?: string | null) =>
  mode === target || exerciseTitle === SYSTEM_EXERCISE_TITLES[target];

export const resolveSpecialMode = (mode: PracticeMode, exerciseTitle?: string | null): SpecialMode | null =>
  SPECIAL_MODES.find(target => matchesSpecialMode(target, mode, exerciseTitle)) ?? null;
