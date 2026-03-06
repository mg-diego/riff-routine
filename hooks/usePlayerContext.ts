import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Exercise } from '../lib/types';

export function usePlayerContext() {
    const [mode, setMode] = useState<'free' | 'library' | 'routine' | 'scales' | 'improvisation'>('free');
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
            const modeParam = params.get('mode');

            if (routineId) {
                setMode('routine');
                const { data } = await supabase
                    .from('routine_exercises')
                    .select('*, exercises(*)')
                    .eq('routine_id', routineId)
                    .order('order_index', { ascending: true });

                if (data && data.length > 0) {
                    setRoutineList(data);
                    setActiveExercise(data[0].exercises);
                    setFileName(data[0].exercises.title);
                    if (data[0].exercises.file_url) setInitialUrlToLoad(data[0].exercises.file_url);
                }
            } else if (fileUrl) {
                const decodedUrl = decodeURIComponent(fileUrl);
                setFileName(decodedUrl.split('/').pop()?.split('?')[0] || '');
                const { data } = await supabase.from('exercises').select('*').eq('file_url', decodedUrl).single();

                if (data) {
                    setMode('library');
                    setActiveExercise(data);
                } else {
                    setMode('free');
                }
                setInitialUrlToLoad(decodedUrl);
            } else if (modeParam) {
                setMode(modeParam as any);
                const titles: Record<string, string> = { 'scales': 'Escalas', 'improvisation': 'Improvisación' };
                setActiveExercise({ title: titles[modeParam] || modeParam } as Exercise);
            } else {
                setMode('free');
            }
        };

        loadData();
    }, []);

    const changeExercise = (index: number) => {
        if (index >= 0 && index < routineList.length) {
            setCurrentIndex(index);
            const ex = routineList[index].exercises;
            setActiveExercise(ex);
            setFileName(ex.title);
            if (ex.file_url) setInitialUrlToLoad(ex.file_url);
        }
    };

    const handleNextExercise = () => changeExercise(currentIndex + 1);
    const handlePrevExercise = () => changeExercise(currentIndex - 1);

    return { 
        mode, routineList, currentIndex, activeExercise, fileName, setFileName, 
        initialUrlToLoad, handleNextExercise, handlePrevExercise 
    };
}