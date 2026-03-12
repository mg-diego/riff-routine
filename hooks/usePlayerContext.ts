import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Exercise } from '../lib/types';
import { useTranslatedExercise } from './useTranslatedExercise';

export function usePlayerContext() {
    const [mode, setMode] = useState<'free' | 'library' | 'routine' | 'scales' | 'improvisation' | 'composition'>('free');
    const [routineList, setRoutineList] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [initialUrlToLoad, setInitialUrlToLoad] = useState<string | null>(null);

    const { formatExercise } = useTranslatedExercise();

    useEffect(() => {
        const loadData = async () => {
            const params = new URLSearchParams(window.location.search);
            const routineId = params.get('routine');
            const fileUrl = params.get('file');
            const idParam = params.get('id');
            const modeParam = params.get('mode');

            if (routineId) {
                setMode('routine');
                const { data: rawRoutineData } = await supabase
                    .from('routine_exercises')
                    .select('*, exercises(id, user_id, title, technique, file_url, created_at, bpm_goal, difficulty, notes, bpm_suggested, has_bpm)')
                    .eq('routine_id', routineId)
                    .order('order_index', { ascending: true });

                if (rawRoutineData && rawRoutineData.length > 0) {
                    const translatedRoutine = rawRoutineData.map(item => ({
                        ...item,
                        exercises: formatExercise(item.exercises as unknown as Exercise)
                    }));

                    setRoutineList(translatedRoutine);
                    const firstEx = translatedRoutine[0].exercises;
                    setActiveExercise(firstEx);
                    setFileName(firstEx.title);
                    setInitialUrlToLoad(firstEx.file_url || null);
                }
            } else if (fileUrl) {
                const decodedUrl = decodeURIComponent(fileUrl);
                setFileName(decodedUrl.split('/').pop()?.split('?')[0] || '');
                const { data: rawEx } = await supabase.from('exercises').select('*').eq('file_url', decodedUrl).single();

                if (rawEx) {
                    const translatedEx = formatExercise(rawEx as Exercise);
                    setMode('library');
                    setActiveExercise(translatedEx);
                } else {
                    setMode('free');
                }
                setInitialUrlToLoad(decodedUrl);
            } else if (idParam) {
                const { data: rawEx } = await supabase.from('exercises').select('*').eq('id', idParam).single();

                if (rawEx) {
                    const translatedEx = formatExercise(rawEx as Exercise);
                    setMode('library');
                    setActiveExercise(translatedEx);
                    setFileName(translatedEx.title);
                } else {
                    setMode('free');
                }
                setInitialUrlToLoad(null);
            } else if (modeParam) {
                setMode(modeParam as any);
                const titles: Record<string, string> = {
                    'scales': 'scales',
                    'improvisation': 'improvisation',
                    'composition': 'composition'
                };

                const virtualEx = formatExercise({
                    title: titles[modeParam] || modeParam,
                    user_id: null,
                    has_bpm: false
                } as unknown as Exercise);

                setActiveExercise(virtualEx);
                setFileName(virtualEx.title);
            } else {
                setMode('free');
            }
        };

        loadData();
    }, [formatExercise]);

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
        mode, routineList, currentIndex, activeExercise, fileName, setFileName,
        initialUrlToLoad, handleNextExercise, handlePrevExercise
    };
}