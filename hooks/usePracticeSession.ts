import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export function usePracticeSession(mode: string, routineId: string | null) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [routineName, setRoutineName] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    setIsTimerRunning(mode !== 'free');
  }, [mode]);

  useEffect(() => {
    let isMounted = true;

    const fetchRoutineName = async () => {
      if (mode === 'routine' && routineId) {
        const { data } = await supabase
          .from('routines')
          .select('title')
          .eq('id', routineId)
          .maybeSingle();

        if (isMounted && data) {
          setRoutineName(data.title || '');
        }
      } else {
        if (isMounted) setRoutineName('');
      }
    };

    fetchRoutineName();

    return () => { isMounted = false; };
  }, [mode, routineId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const toggleTimer = () => setIsTimerRunning(prev => !prev);

  const resetTimer = () => {
    setElapsedSeconds(0);
    setIsTimerRunning(mode !== 'free');
  };

  const saveExerciseLog = async (exerciseId: string, bpmUsed: number, bpmGoal: number | null, routineExerciseId: string | null) => {
    if (mode === 'free' || elapsedSeconds === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('practice_logs').insert({
      user_id: user.id,
      exercise_id: exerciseId,
      duration_seconds: elapsedSeconds,
      bpm_used: bpmUsed,
      created_at: new Date().toISOString()
    });

    if (bpmGoal !== null) {
      if (mode === 'routine' && routineExerciseId) {
        await supabase.from('routine_exercises')
          .update({ target_bpm: bpmGoal })
          .eq('id', routineExerciseId);
      } else {
        await supabase.from('exercises')
          .update({ bpm_goal: bpmGoal })
          .eq('id', exerciseId)
          .eq('user_id', user.id);
      }
    }

    resetTimer();
  };

  const handleEndSession = (fallbackPath: string) => {
    resetTimer();
    router.push(fallbackPath);
  };

  return {
    elapsedSeconds,
    isTimerRunning,
    routineName,
    toggleTimer,
    saveExerciseLog,
    handleEndSession,
    resetTimer
  };
}