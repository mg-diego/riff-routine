import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Exercise } from '@/lib/types';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/constants';

const MAX_FREE_EXERCISES = 10;

interface CreateExerciseParams {
    name: string;
    categories: string[];
    difficulty: number;
    bpmSuggested: string | number;
    bpmGoal: string | number;
    notes: string;
    file: File | null;
}

export function useExerciseActions() {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkTierLimits = async (userId: string, countToAdd: number = 1): Promise<boolean> => {
        try {
            const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', userId).single();
            const userTier = (profile?.subscription_tier as SubscriptionTier) || SUBSCRIPTION_TIERS.FREE;

            if (userTier === SUBSCRIPTION_TIERS.FREE) {
                const { count } = await supabase.from('exercises').select('*', { count: 'exact', head: true }).eq('user_id', userId);
                if (count !== null && (count + countToAdd) > MAX_FREE_EXERCISES) return false;
            }
            return true;
        } catch (err) {
            console.error(err); return false;
        }
    };

    const validateLimit = async (countToAdd: number = 1): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        const canProceed = await checkTierLimits(user.id, countToAdd);
        if (!canProceed) {
            window.dispatchEvent(new CustomEvent('app:show-pro-modal'));
            return false;
        }
        return true;
    };

    const importBulkExercises = async (parsedData: any[]): Promise<boolean> => {
        setSaving(true); setError(null);
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error('Auth required');

            const canProceed = await checkTierLimits(user.id, parsedData.length);
            if (!canProceed) {
                window.dispatchEvent(new CustomEvent('app:show-pro-modal'));
                return false;
            }

            const payload = parsedData.map(ex => ({
                user_id: user.id,
                title: ex.title.trim(),
                technique: ex.technique.trim() || null,
                bpm_goal: ex.bpm_goal ? parseInt(ex.bpm_goal, 10) : null,
                is_system: false
            }));

            const { error: insertError } = await supabase.from('exercises').insert(payload);
            if (insertError) throw insertError;

            window.dispatchEvent(new CustomEvent('app:exercise-created'));
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

            const canProceed = await checkTierLimits(user.id);
            if (!canProceed) {
                window.dispatchEvent(new CustomEvent('app:show-pro-modal'));
                setSaving(false);
                return null;
            }

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
                is_system: false,
            }).select().single();

            if (dbError) throw dbError;

            window.dispatchEvent(new CustomEvent('app:exercise-created'));
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

            const canProceed = await checkTierLimits(user.id);
            if (!canProceed) {
                window.dispatchEvent(new CustomEvent('app:show-pro-modal'));
                setSaving(false);
                return null;
            }

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
                    has_bpm: systemExercise.has_bpm
                })
                .select()
                .single();

            if (dbError) throw dbError;

            window.dispatchEvent(new CustomEvent('app:exercise-created'));
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