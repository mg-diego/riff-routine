import { useTranslations } from 'next-intl';
import { Exercise } from '@/lib/types';

const SYSTEM_KEY_PREFIX = 'sys_';

export function useTranslatedExercise() {
  const st = useTranslations('SystemExercises');

  // System exercises store i18n keys (e.g. "sys_scales_title") instead of text
  const translate = (key: string): string => {
    if (!key || !key.startsWith(SYSTEM_KEY_PREFIX) || !st.has(key)) return key;
    return st(key);
  };

  const formatExercise = (exercise: Exercise): Exercise => {
    if (!exercise.title?.startsWith(SYSTEM_KEY_PREFIX)) return exercise;

    return {
      ...exercise,
      title:     translate(exercise.title),
      technique: translate(exercise.technique ?? ''),
      notes:     translate(exercise.notes ?? ''),
    };
  };

  const formatExerciseList = (exercises: Exercise[]): Exercise[] => {
    return exercises.map(formatExercise);
  };

  return { formatExercise, formatExerciseList };
}
