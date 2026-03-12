import { useTranslations } from 'next-intl';
import { Exercise } from '@/lib/types';

export function useTranslatedExercise() {
  const st = useTranslations('SystemExercises');

  const formatExercise = (exercise: Exercise): Exercise => {
    if (exercise.user_id !== null) {
      return exercise;
    }

    return {
      ...exercise,
      title: st(exercise.title),
      technique: exercise.technique ? st(exercise.technique) : exercise.technique,
      notes: exercise.notes ? st(exercise.notes) : exercise.notes,
    };
  };

  const formatExerciseList = (exercises: Exercise[]): Exercise[] => {
    return exercises.map(formatExercise);
  };

  return { formatExercise, formatExerciseList };
}