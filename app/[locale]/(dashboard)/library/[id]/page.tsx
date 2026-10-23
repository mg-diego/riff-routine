"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Exercise } from '@/lib/types';
import { ExerciseForm } from '@/components/library/ExerciseForm';
import { useTranslations } from 'next-intl';
import { useTranslatedExercise } from '@/hooks/useTranslatedExercise';
import { VALID_FILE_TYPES } from '@/lib/constants';
import styles from './page.module.css';
import ui from '@/components/ui/ui.module.css';

export default function ExerciseDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations('ExerciseDetailsPage');
    const { formatExercise } = useTranslatedExercise();
    const inputRef = useRef<HTMLInputElement>(null);

    const [exercise, setExercise] = useState<Exercise | null>(null);
    const isSystem = !!exercise?.forked_from;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const [name, setName] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [bpmSuggested, setBpmSuggested] = useState<string | number>('');
    const [bpmGoal, setBpmGoal] = useState<string | number>('');
    const [difficulty, setDifficulty] = useState(3);
    const [notes, setNotes] = useState('');
    
    // Añadimos el estado para controlar el tipo de archivo en la UI
    const [fileType, setFileType] = useState('gp5');

    useEffect(() => {
        fetchExercise();
    }, [params.id]);

    const fetchExercise = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error: dbError } = await supabase
                .from('exercises')
                .select('*')
                .eq('id', params.id)
                .eq('user_id', user.id)
                .single();

            if (dbError || !data) throw new Error(t('errors.loadFailed'));

            setExercise(data);
            setName(formatExercise(data).title || '');
            setCategories(data.technique ? data.technique.split(', ') : []);
            setBpmSuggested(data.bpm_suggested || '');
            setBpmGoal(data.bpm_goal || '');
            setDifficulty(data.difficulty || 3);
            setNotes(data.notes || '');
            
            // Inicializamos el fileType con lo que venga de BD
            setFileType(data.file_type || 'gp5');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setDragOver(false);
        let f: File | undefined;

        if ('dataTransfer' in e) {
            f = e.dataTransfer?.files[0];
        } else {
            f = e.target.files?.[0];
        }

        if (!f) return;

        const ext = f.name.split('.').pop()?.toLowerCase();
        if (!ext || !['gp', 'gp3', 'gp4', 'gp5', 'gpx', 'pdf'].includes(ext)) {
            setError(t('fileDrop.invalidFormat')); 
            return;
        }

        const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5 MB en bytes
        if (ext === 'pdf' && f.size > MAX_PDF_SIZE) {
            setError(t('fileDrop.invalidSize')); // O la traducción que definiste
            return;
        }

        // Seteamos el archivo y actualizamos el tipo de archivo
        setFile(f);
        setFileType(ext === 'pdf' ? 'pdf' : 'gp5');
        setError(null);
    };

    const handleSubmit = async () => {
        if (!exercise) return;
        if (!name.trim()) return setError(t('form.nameRequired'));
        if (categories.length === 0) return setError(t('form.categoryRequired'));

        try {
            setSaving(true);
            setError(null);

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error(t('form.authRequired'));

            let currentFileUrl = exercise.file_url;
            
            // Usamos directamente el estado que ya controlamos en la UI
            const currentFileType = fileType; 

            if (file) {
                const fileExt = file.name.split('.').pop()?.toLowerCase() || 'gp5';
                const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage.from('guitar_tabs').upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('guitar_tabs').getPublicUrl(filePath);
                currentFileUrl = publicUrl;

                if (exercise.file_url) {
                    const oldPath = exercise.file_url.split('/guitar_tabs/')[1];
                    if (oldPath) {
                        await supabase.storage.from('guitar_tabs').remove([oldPath]);
                    }
                }
            }

            const { data: rawData, error: dbError } = await supabase.from('exercises')
                .update({
                    title: name.trim(),
                    file_url: currentFileUrl,
                    file_type: currentFileType, // Guardamos el formato correcto en BD
                    technique: categories.join(', '),
                    bpm_suggested: bpmSuggested ? parseInt(String(bpmSuggested)) : null,
                    bpm_goal: bpmGoal ? parseInt(String(bpmGoal)) : null,
                    difficulty,
                    notes: notes.trim() || null,
                })
                .eq('id', exercise.id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (dbError) throw dbError;

            let data: Exercise | null = null;
            if (rawData) {
                data = formatExercise(rawData as Exercise);
            }

            if (!data) throw new Error(t('errors.rls'));

            router.push('/library');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loader-container">
                <span className="loader" />
            </div>
        );
    }

    if (!exercise) return <div className={styles.notFound}>{t('notFound')}</div>;

    return (
        <div className={styles.back}>
            <button
                onClick={() => router.push('/library')}
                className={ui.backLink}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
                {t('back')}
            </button>

            <div className="surface-card">
                <h1 className={ui.formTitle}>
                    {t('title')}
                </h1>

                <>
                    <div
                        onDrop={handleFileDrop}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onClick={() => inputRef.current?.click()}
                        className={styles.systemFileStack} style={{ border: `2px dashed ${dragOver ? 'var(--gold)' : file ? 'rgba(74,222,128,0.5)' : 'rgba(220,185,138,0.3)'}`, cursor: isSystem ? 'not-allowed' : 'pointer', pointerEvents: isSystem ? 'none' : 'auto', background: dragOver ? 'rgba(220,185,138,0.05)' : file ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)' }}
                    >
                        <input ref={inputRef} type="file" accept={VALID_FILE_TYPES} onChange={handleFileDrop} hidden />

                        {isSystem ? (
                            <div className={styles.systemFileRow}>
                                <div className={styles.block}>🔒</div>
                                <div className={styles.systemFile}>
                                    <p className={styles.systemFileText}>
                                        {t('fileDrop.systemFile')}
                                    </p>
                                    <p className={styles.systemFileDescText}>
                                        {t('fileDrop.systemFileDesc')}
                                    </p>
                                </div>
                            </div>
                        ) : file ? (
                            <div className={styles.readyToUploadRow}>
                                {/* Emoji condicional basado en el nuevo estado */}
                                <div className={styles.block}>{fileType === 'pdf' ? '📄' : '🎵'}</div>
                                <div>
                                    <p className={styles.text}>{file.name}</p>
                                    <p className={styles.readyToUploadText}>
                                        {(file.size / 1024).toFixed(1)} KB · {t('fileDrop.readyToUpload')}
                                    </p>
                                </div>
                            </div>
                        ) : exercise.file_url ? (
                            <div className={styles.replaceFileRow}>
                                <div className={styles.block}>🔄</div>
                                <div className={styles.systemFile}>
                                    <p className={styles.replaceFileText}>{t('fileDrop.replaceFile')}</p>
                                    <p className={styles.dragNewText}>{t('fileDrop.dragNew')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.systemFileRow}>
                                <div className={styles.block}>🎸</div>
                                <div className={styles.optional}>
                                    <p className={styles.systemFileText}>
                                        Guitar Pro / PDF <span className={styles.optionalLabel}>{t('fileDrop.optional')}</span>
                                    </p>
                                    <p className={styles.systemFileDescText}>{t('fileDrop.dragOrClick')}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.stack}>
                        <ExerciseForm {...{ name, setName, categories, setCategories, bpmSuggested, setBpmSuggested, bpmGoal, setBpmGoal, difficulty, setDifficulty, notes, setNotes, isSystem: isSystem || false }} />
                    </div>

                    {error && (
                        <div className={`alert-error ${styles.errorBlock}`}>
                            ⚠ {error}
                        </div>
                    )}

                    <div className={styles.savingStack}>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className={styles.savingButton} style={{ cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                        >
                            {saving ? t('buttons.saving') : t('buttons.save')}
                        </button>
                    </div>
                </>
            </div>
        </div>
    );
}