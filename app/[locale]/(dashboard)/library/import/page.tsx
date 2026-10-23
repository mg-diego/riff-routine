"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TECHNIQUES } from '@/lib/constants';
import { useTranslations } from 'next-intl';
import { useExerciseActions } from '@/hooks/useExerciseActions';
import styles from './page.module.css';
import ui from '@/components/ui/ui.module.css';

interface ParsedExercise {
    id: string;
    title: string;
    technique: string;
    bpm_goal: string;
    error?: string;
}

export default function ImportExercisesPage() {
    const router = useRouter();
    const t = useTranslations('ImportExercisesPage');
    
    // --- Integramos el Hook ---
    const { saving, error: hookError, setError: setHookError, validateLimit, importBulkExercises } = useExerciseActions();

    const [inputText, setInputText] = useState('');
    const [parsedData, setParsedData] = useState<ParsedExercise[]>([]);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const validateTechnique = (techString: string): string | undefined => {
        if (!techString || techString.trim() === '') return t('errors.techniqueRequired');
        const inputTechs = techString.split(',').map(t => t.trim()).filter(Boolean);
        if (inputTechs.length === 0) return t('errors.techniqueRequired');
        
        const invalidTechs = inputTechs.filter(tech => !TECHNIQUES.includes(tech));
        if (invalidTechs.length > 0) return t('errors.invalidTechnique', { techs: invalidTechs.join(', ') });
        return undefined;
    };

    const parseText = async () => {
        setGlobalError(null);
        setHookError(null);
        const lines = inputText.split('\n');
        const extracted: ParsedExercise[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;

            const parts = line.split('--').map(p => p.trim());
            if (parts.length > 0 && parts[0] !== '') {
                const title = parts[0];
                const techInput = parts[1] || '';
                const bpmInput = parts[2] || '';
                const error = validateTechnique(techInput);

                extracted.push({
                    id: crypto.randomUUID(),
                    title,
                    technique: techInput,
                    bpm_goal: bpmInput,
                    error
                });
            }
        }

        if (extracted.length === 0) {
            setGlobalError(t('errors.noValidExercises'));
            setParsedData([]);
            return;
        }

        // --- Validación limpia a través del hook ---
        const canProceed = await validateLimit(extracted.length);
        if (!canProceed) return; // El modal se dispara automáticamente desde el hook

        setParsedData(extracted);
    };

    const handleUpdateRow = (id: string, field: keyof ParsedExercise, value: string) => {
        setParsedData(prev => prev.map(row => {
            if (row.id !== id) return row;
            const updatedRow = { ...row, [field]: value };
            if (field === 'technique') {
                updatedRow.error = validateTechnique(value);
            }
            return updatedRow;
        }));
    };

    const handleToggleTechnique = (id: string, currentTechString: string, tech: string) => {
        const currentTechs = currentTechString ? currentTechString.split(',').map(t => t.trim()).filter(Boolean) : [];
        let newTechs;

        if (currentTechs.includes(tech)) {
            newTechs = currentTechs.filter(t => t !== tech);
        } else {
            const validCurrent = currentTechs.filter(t => TECHNIQUES.includes(t));
            newTechs = [...validCurrent, tech];
        }

        handleUpdateRow(id, 'technique', newTechs.join(', '));
    };

    const handleRemoveRow = (id: string) => {
        setParsedData(prev => prev.filter(row => row.id !== id));
    };

    const handleImport = async () => {
        const hasErrors = parsedData.some(row => row.error || !row.title.trim());
        if (hasErrors) {
            setGlobalError(t('errors.fixErrors'));
            return;
        }

        if (parsedData.length === 0) return;

        // --- Ejecución limpia a través del hook ---
        const success = await importBulkExercises(parsedData);
        if (success) {
            router.push('/library');
        }
    };

    const hasInvalidRows = parsedData.some(row => row.error || !row.title.trim() || !row.technique.trim());
    const displayError = globalError || hookError;

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

                {parsedData.length === 0 ? (
                    <>
                        <div className={styles.text}>
                            <p className={styles.textText}>{t('instructions.text')}</p>
                            <div className={styles.formatRequiredBox}>
                                <p className={styles.formatRequiredText}>{t('instructions.formatRequired')}</p>
                                <code className={styles.formatExampleCode}>{t('instructions.formatExample')}</code><br /><br />
                                <code className={styles.example1Code}>{t('instructions.example1')}</code><br />
                                <code className={styles.example1Code}>{t('instructions.example2')}</code>
                            </div>
                            <div className={styles.allowedTechniques}>
                                <p className={styles.allowedTechniquesText}>{t('instructions.allowedTechniques')}</p>
                                <div className={styles.row}>
                                    {TECHNIQUES.map(tech => (
                                        <span key={tech} className={styles.label}>
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <textarea
                            value={inputText}
                            onChange={(e) => {
                                setInputText(e.target.value);
                                if (globalError) setGlobalError(null);
                            }}
                            placeholder={t('input.placeholder')}
                            className={styles.placeholderTextarea}
                        />

                        {displayError && (
                            <div className={`alert-error ${styles.block}`}>
                                ⚠ {displayError}
                            </div>
                        )}

                        <button
                            onClick={parseText}
                            disabled={inputText.trim() === ''}
                            className={styles.analyzeButton} style={{ cursor: inputText.trim() === '' ? 'not-allowed' : 'pointer' }}
                        >
                            {t('input.analyzeButton')}
                        </button>
                    </>
                ) : (
                    <>
                        <div className={styles.titleRow}>
                            <h3 className={styles.titleSubheading}>{t('review.title', { count: parsedData.length })}</h3>
                            <button onClick={() => { setParsedData([]); setOpenDropdownId(null); }} className={styles.backToTextButton}>
                                {t('review.backToText')}
                            </button>
                        </div>

                        <div className={styles.titleStack}>
                            {parsedData.map((ex) => {
                                const currentTechs = ex.technique ? ex.technique.split(',').map(t => t.trim()).filter(Boolean) : [];
                                const isOpen = openDropdownId === ex.id;

                                return (
                                    <div key={ex.id} className={styles.titleGrid} style={{ background: ex.error ? 'rgba(231,76,60,0.05)' : 'rgba(0,0,0,0.2)', border: `1px solid ${ex.error ? 'rgba(231,76,60,0.3)' : 'rgba(255,255,255,0.05)'}` }}>
                                        
                                        {/* Título */}
                                        <div className={styles.titleGridStack}>
                                            <label className={styles.titleFieldLabel}>{t('review.labels.title')}</label>
                                            <input type="text" value={ex.title} onChange={(e) => handleUpdateRow(ex.id, 'title', e.target.value)} className={styles.input} style={{ border: `1px solid ${!ex.title.trim() ? '#e74c3c' : 'rgba(255,255,255,0.1)'}` }} />
                                        </div>

                                        {/* Técnica */}
                                        <div className={styles.techniqueStack}>
                                            <label className={styles.titleFieldLabel}>{t('review.labels.technique')}</label>
                                            {isOpen && <div className={styles.overlay} onClick={() => setOpenDropdownId(null)} />}
                                            <button onClick={() => setOpenDropdownId(isOpen ? null : ex.id)} className={styles.selectButton} style={{ border: `1px solid ${ex.error ? '#e74c3c' : 'rgba(255,255,255,0.1)'}`, color: ex.technique ? 'var(--text)' : 'var(--muted)' }}>
                                                <span className={styles.selectLabel}>{ex.technique || t('review.labels.select')}</span>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon} style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                                            </button>

                                            {isOpen && (
                                                <div className={styles.layer}>
                                                    {TECHNIQUES.map(tech => (
                                                        <label key={tech} className={styles.fieldLabel}>
                                                            <input type="checkbox" checked={currentTechs.includes(tech)} onChange={() => handleToggleTechnique(ex.id, ex.technique, tech)} className={styles.techniqueStackInput} />
                                                            {tech}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                            {ex.error && <span className={styles.errorLabel}>{ex.error}</span>}
                                        </div>

                                        {/* BPM */}
                                        <div className={styles.titleGridStack}>
                                            <label className={styles.titleFieldLabel}>{t('review.labels.bpm')}</label>
                                            <input type="number" value={ex.bpm_goal} onChange={(e) => handleUpdateRow(ex.id, 'bpm_goal', e.target.value)} placeholder={t('review.labels.optional')} className={styles.optionalInput} />
                                        </div>

                                        {/* Borrar Fila */}
                                        <div className={styles.deleteRow}>
                                            <button onClick={() => handleRemoveRow(ex.id)} className={styles.deleteRowButton} title={t('review.actions.deleteRow')}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {displayError && (
                            <div className={`alert-error ${styles.text}`}>
                                ⚠ {displayError}
                            </div>
                        )}

                        <button
                            onClick={handleImport}
                            disabled={saving || hasInvalidRows}
                            className={styles.savingButton} style={{ cursor: saving || hasInvalidRows ? 'not-allowed' : 'pointer', opacity: saving || hasInvalidRows ? 0.5 : 1 }}
                        >
                            {saving ? t('review.actions.saving') : t('review.actions.confirmSave')}
                        </button>
                    </>
                )}
            </div>

        </div>
    );
}