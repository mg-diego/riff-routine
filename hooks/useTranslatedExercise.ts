import { useTranslations } from 'next-intl';
import { Exercise } from '@/lib/types';

const SYS_KEYS = new Set([
  'sys_scales_title',
  'sys_scales_technique', 
  'sys_scales_notes',
  'sys_improvisation_title',
  'sys_improvisation_technique',
  'sys_improvisation_notes',
  'sys_composition_title',
  'sys_composition_technique',
  'sys_composition_notes',
  'sys_chords_title',
  'sys_chords_technique',
  'sys_chords_notes',
  'sys_3_notes_beat_title',
  'sys_3_notes_beat_technique',
  'sys_3_notes_beat_notes',
  'sys_4_notes_beat_title',
  'sys_4_notes_beat_technique',
  'sys_4_notes_beat_notes'
]);

const safeTranslate = (st: (key: string) => string, key: string): string => {
  if (!key || !SYS_KEYS.has(key)) return key;
  try {
    return st(key);
  } catch {
    return key;
  }
};

export function useTranslatedExercise() {
  const st = useTranslations('SystemExercises');

  const formatExercise = (exercise: Exercise): Exercise => {
    // Only translate if it's a system exercise with a known sys key
    if (exercise.user_id !== null) return exercise;
    if (!exercise.title?.startsWith('sys_')) return exercise;

    return {
      ...exercise,
      title:     safeTranslate(st, exercise.title),
      technique: safeTranslate(st, exercise.technique ?? ''),
      notes:     safeTranslate(st, exercise.notes ?? ''),
    };
  };

  const formatExerciseList = (exercises: Exercise[]): Exercise[] => {
    return exercises.map(formatExercise);
  };

  return { formatExercise, formatExerciseList };
}