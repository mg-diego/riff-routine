import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Exercise } from '../lib/types';

export function usePlayerContext() {
    const [isReady, setIsReady] = useState(false);
    const [mode, setMode] = useState<'free' | 'library' | 'routine' | 'scales' | 'improvisation' | 'composition' | 'chords' | 'rhythm' | 'earTraining'>('free');
    const [routineList, setRoutineList] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [initialUrlToLoad, setInitialUrlToLoad] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            const params = new URLSearchParams(window.location.search);
            const routineId = params.get('routine');
            const fileUrl = params.get('file');
            const idParam = params.get('id');
            const modeParam = params.get('mode');

            if (routineId) {
                setMode('routine');
                const { data } = await supabase
                    .from('routine_exercises')
                    .select('*, exercises(id, title, technique, file_url, created_at, bpm_goal, difficulty, notes, bpm_suggested, has_bpm, user_id)')
                    .eq('routine_id', routineId)
                    .order('order_index', { ascending: true });

                if (data && data.length > 0) {
                    setRoutineList(data);
                    setActiveExercise(data[0].exercises);
                    setFileName(data[0].exercises.title);
                    setInitialUrlToLoad(data[0].exercises.file_url || null);
                }
            } else if (fileUrl) {
                const decodedUrl = decodeURIComponent(fileUrl);
                setFileName(decodedUrl.split('/').pop()?.split('?')[0] || '');

                const { data: { user } } = await supabase.auth.getUser();

                const { data: exercises } = await supabase
                    .from('exercises')
                    .select('*')
                    .eq('file_url', decodedUrl);

                let exercise = null;
                if (exercises && exercises.length > 0) {
                    exercise = exercises.find(e => e.user_id === user?.id)
                        ?? exercises.find(e => e.is_system === true)
                        ?? exercises[0];
                }

                if (exercise) {
                    const isSystemPure = exercise.is_system === true && !exercise.forked_from;
                    setMode(isSystemPure ? 'free' : 'library');
                    setActiveExercise(exercise);
                } else {
                    setMode('free');
                }
                setInitialUrlToLoad(decodedUrl);
            } else if (modeParam) {
                setMode(modeParam as any);

                const sysTitles: Record<string, string> = {
                    scales: 'sys_scales_title',
                    improvisation: 'sys_improvisation_title',
                    composition: 'sys_composition_title',
                    chords: 'sys_chords_title'
                };

                setActiveExercise({
                    title: sysTitles[modeParam] || modeParam,
                    user_id: null,
                    has_bpm: false,
                } as unknown as Exercise);
            } else {
                setMode('free');
            }

            setIsReady(true);
        };

        loadData();
    }, []);

    const changeExercise = (index: number) => {
        if (index >= 0 && index < routineList.length) {
            setCurrentIndex(index);
            const ex = routineList[index].exercises;
            setActiveExercise(ex);
            setFileName(ex.title);
            setInitialUrlToLoad(ex.file_url || null);
        }
    };

    const handleNextExercise = () => changeExercise(currentIndex + 1);
    const handlePrevExercise = () => changeExercise(currentIndex - 1);

    return {
        isReady,
        mode, routineList, currentIndex, activeExercise, fileName, setFileName,
        initialUrlToLoad, handleNextExercise, handlePrevExercise,
    };
}