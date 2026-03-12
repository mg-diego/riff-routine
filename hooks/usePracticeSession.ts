import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export function usePracticeSession(mode: string, routineId: string | null, activeExerciseId: string | null = null) {
  const [exerciseTimes, setExerciseTimes] = useState<Record<string, number>>({});
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [routineName, setRoutineName] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const router = useRouter();

  const currentKey = activeExerciseId || 'free-mode';
  const elapsedSeconds = exerciseTimes[currentKey] || 0;

  useEffect(() => {
    setIsTimerRunning(mode !== 'free');
  }, [mode]);

  useEffect(() => {
    if (mode === 'routine') {
      setIsTimerRunning(false);
    }
  }, [activeExerciseId, mode]);

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
        setExerciseTimes(prev => ({
          ...prev,
          [currentKey]: (prev[currentKey] || 0) + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, currentKey]);

  const toggleTimer = () => setIsTimerRunning(prev => !prev);

  const resetTimer = () => {
    setExerciseTimes({});
    setIsTimerRunning(mode !== 'free');
  };

  const saveExerciseLog = async (exerciseId: string, bpmUsed: number | null, bpmGoal: number | null, routineExerciseId: string | null) => {
    const timeToSave = exerciseTimes[exerciseId] || 0;
    if (mode === 'free' || timeToSave === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existingLog } = await supabase
      .from('practice_logs')
      .select('id')
      .eq('session_id', sessionId)
      .eq('exercise_id', exerciseId)
      .maybeSingle();

    if (existingLog) {
      await supabase.from('practice_logs')
        .update({ duration_seconds: timeToSave, bpm_used: bpmUsed })
        .eq('id', existingLog.id);
    } else {
      await supabase.from('practice_logs').insert({
        user_id: user.id,
        exercise_id: exerciseId,
        session_id: sessionId,
        duration_seconds: timeToSave,
        bpm_used: bpmUsed,
        created_at: new Date().toISOString()
      });
    }

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