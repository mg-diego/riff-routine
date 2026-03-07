import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export function usePracticeSession(mode: string, routineId: string | null) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [routineName, setRoutineName] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsTimerRunning(mode !== 'free');
  }, [mode]);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      if (mode === 'free') return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      if (isMounted) setSessionStartTime(now);

      const { data } = await supabase.from('practice_sessions').insert({
        user_id: user.id,
        routine_id: routineId || null,
        started_at: now.toISOString(),
      }).select('id').maybeSingle();

      if (isMounted && data) {
        setSessionId(data.id);
      }
    };

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

    initSession();
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
      session_id: sessionId,
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

  const handleEndSession = async (fallbackPath: string, overrideTotalSeconds?: number) => {
    if (sessionId && sessionStartTime) {
      const endedAt = new Date();
      const totalDuration = overrideTotalSeconds !== undefined 
        ? overrideTotalSeconds 
        : Math.floor((endedAt.getTime() - sessionStartTime.getTime()) / 1000);

      await supabase.from('practice_sessions')
        .update({
          ended_at: endedAt.toISOString(),
          total_duration_seconds: totalDuration
        })
        .eq('id', sessionId);
    }

    resetTimer();
    router.push(fallbackPath);
  };

  return {
    elapsedSeconds,
    isTimerRunning,
    routineName,
    sessionId,
    toggleTimer,
    saveExerciseLog,
    handleEndSession,
    resetTimer
  };
}