import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Exercise } from '@/lib/types';
import { canAddExercises } from '@/lib/subscription';
import { APP_EVENTS, emitAppEvent } from '@/lib/events';

interface BulkExerciseInput {
    title: string;
    technique: string;
    bpm_goal: string;
}

interface CreateExerciseParams {
    name: string;
    categories: string[];
    difficulty: number;
    bpmSuggested: string | number;
    bpmGoal: string | number;
    notes: string;
    file: File | null;
    fileType: string | null;
}

export function useExerciseActions() {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Returns true when the user can add `countToAdd` exercises; otherwise opens the pro modal
    const ensureWithinLimit = async (userId: string, countToAdd: number = 1): Promise<boolean> => {
        let canProceed = false;
        try {
            canProceed = await canAddExercises(userId, countToAdd);
        } catch (err) {
            console.error(err);
        }
        if (!canProceed) emitAppEvent(APP_EVENTS.SHOW_PRO_MODAL);
        return canProceed;
    };

    const validateLimit = async (countToAdd: number = 1): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        return ensureWithinLimit(user.id, countToAdd);
    };

    const importBulkExercises = async (parsedData: BulkExerciseInput[]): Promise<boolean> => {
        setSaving(true); setError(null);
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error('Auth required');

            if (!(await ensureWithinLimit(user.id, parsedData.length))) return false;

            const payload = parsedData.map(ex => ({
                user_id: user.id,
                title: ex.title.trim(),
                technique: ex.technique.trim() || null,
                bpm_goal: ex.bpm_goal ? parseInt(ex.bpm_goal, 10) : null,
                is_system: false
            }));

            const { error: insertError } = await supabase.from('exercises').insert(payload);
            if (insertError) throw insertError;

            emitAppEvent(APP_EVENTS.EXERCISE_CREATED);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            return false;
        } finally {
            setSaving(false);
        }
    };

    const createCustomExercise = async (params: CreateExerciseParams): Promise<string | null> => {
        setSaving(true);
        setError(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error('Auth required');

            if (!(await ensureWithinLimit(user.id))) return null;

            let currentFileUrl = null;

            if (params.file) {
                const fileExt = params.file.name.split('.').pop();
                const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('guitar_tabs').upload(filePath, params.file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('guitar_tabs').getPublicUrl(filePath);
                currentFileUrl = publicUrl;
            }

            const { data: newExercise, error: dbError } = await supabase.from('exercises').insert({
                user_id: user.id,
                title: params.name.trim(),
                file_url: currentFileUrl,
                technique: params.categories.join(', '),
                bpm_suggested: params.bpmSuggested ? parseInt(String(params.bpmSuggested)) : null,
                bpm_goal: params.bpmGoal ? parseInt(String(params.bpmGoal)) : null,
                difficulty: params.difficulty,
                notes: params.notes.trim() || null,
                file_type: params.fileType,
                is_system: false,
            }).select().single();

            if (dbError) throw dbError;

            emitAppEvent(APP_EVENTS.EXERCISE_CREATED);
            return newExercise.id;
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            return null;
        } finally {
            setSaving(false);
        }
    };

    const checkLimitAndFork = async (systemExercise: Exercise): Promise<string | null> => {
        setSaving(true);
        setError(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error('Auth required');

            const { data: existingCopy } = await supabase
                .from('exercises')
                .select('id')
                .eq('forked_from', systemExercise.id)
                .eq('user_id', user.id)
                .maybeSingle();

            if (existingCopy) {
                return existingCopy.id;
            }

            if (!(await ensureWithinLimit(user.id))) return null;

            const { data: newExercise, error: dbError } = await supabase
                .from('exercises')
                .insert({
                    user_id: user.id,
                    title: systemExercise.title,
                    technique: systemExercise.technique,
                    file_url: systemExercise.file_url,
                    is_system: false,
                    bpm_suggested: systemExercise.bpm_suggested,
                    bpm_goal: null,
                    difficulty: systemExercise.difficulty,
                    notes: null,
                    forked_from: systemExercise.id,
                    has_bpm: systemExercise.has_bpm,
                    file_type: systemExercise.file_type
                })
                .select()
                .single();

            if (dbError) throw dbError;

            emitAppEvent(APP_EVENTS.EXERCISE_CREATED);
            return newExercise.id;

        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            return null;
        } finally {
            setSaving(false);
        }
    };

    return { saving, error, setError, createCustomExercise, checkLimitAndFork, validateLimit, importBulkExercises };
}