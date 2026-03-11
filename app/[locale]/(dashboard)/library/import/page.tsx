"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../../lib/supabase';
import { TECHNIQUES } from '../../../../../lib/constants';
import { useTranslations } from 'next-intl';

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
    
    const [inputText, setInputText] = useState('');
    const [parsedData, setParsedData] = useState<ParsedExercise[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const validateTechnique = (techString: string): string | undefined => {
        if (!techString || techString.trim() === '') {
            return t('errors.techniqueRequired');
        }
        const inputTechs = techString.split(',').map(t => t.trim()).filter(Boolean);
        if (inputTechs.length === 0) {
            return t('errors.techniqueRequired');
        }
        const invalidTechs = inputTechs.filter(tech => !TECHNIQUES.includes(tech));
        if (invalidTechs.length > 0) {
            return t('errors.invalidTechnique', { techs: invalidTechs.join(', ') });
        }
        return undefined;
    };

    const parseText = () => {
        setGlobalError(null);
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

        setIsImporting(true);
        setGlobalError(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error(t('errors.auth'));

            const payload = parsedData.map(ex => ({
                user_id: user.id,
                title: ex.title.trim(),
                technique: ex.technique.trim() || null,
                bpm_goal: ex.bpm_goal ? parseInt(ex.bpm_goal, 10) : null
            }));

            const { error: insertError } = await supabase.from('exercises').insert(payload);
            if (insertError) throw insertError;

            router.push('/library');
        } catch (err) {
            setGlobalError(err instanceof Error ? err.message : String(err));
            setIsImporting(false);
        }
    };

    const hasInvalidRows = parsedData.some(row => row.error || !row.title.trim() || !row.technique.trim());

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
            <button
                onClick={() => router.push('/library')}
                style={{
                    background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem',
                    padding: 0, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
                {t('back')}
            </button>

            <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: 'var(--gold)', margin: '0 0 1.5rem 0', lineHeight: 1 }}>
                    {t('title')}
                </h1>

                {parsedData.length === 0 ? (
                    <>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ color: 'var(--muted)', margin: '0 0 0.5rem', fontSize: '0.9rem' }}>
                                {t('instructions.text')}
                            </p>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <p style={{ margin: '0 0 0.5rem', color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem' }}>{t('instructions.formatRequired')}</p>
                                <code style={{ color: 'var(--text)', background: '#111', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem' }}>{t('instructions.formatExample')}</code><br /><br />
                                <code style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t('instructions.example1')}</code><br />
                                <code style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t('instructions.example2')}</code>
                            </div>
                            <div style={{ margin: '0.8rem 0 0' }}>
                                <p style={{ color: 'var(--gold)', margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                    {t('instructions.allowedTechniques')}
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {TECHNIQUES.map(tech => (
                                        <span
                                            key={tech}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: 'var(--muted)',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
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
                            style={{
                                width: '100%', height: '200px', background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1rem',
                                color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem',
                                resize: 'vertical', marginBottom: '1rem', outline: 'none'
                            }}
                        />

                        {globalError && (
                            <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginBottom: '1rem' }}>
                                ⚠ {globalError}
                            </div>
                        )}

                        <button
                            onClick={parseText}
                            disabled={inputText.trim() === ''}
                            style={{
                                width: '100%', background: 'var(--surface2)', color: 'var(--text)', padding: '1rem',
                                borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                                cursor: inputText.trim() === '' ? 'not-allowed' : 'pointer', fontWeight: 600, transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => { if (inputText.trim() !== '') e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                            onMouseLeave={e => { if (inputText.trim() !== '') e.currentTarget.style.background = 'var(--surface2)'; }}
                        >
                            {t('input.analyzeButton')}
                        </button>
                    </>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: 'var(--text)', margin: 0 }}>{t('review.title', { count: parsedData.length })}</h3>
                            <button
                                onClick={() => { setParsedData([]); setOpenDropdownId(null); }}
                                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}
                            >
                                {t('review.backToText')}
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
                            {parsedData.map((ex) => {
                                const currentTechs = ex.technique ? ex.technique.split(',').map(t => t.trim()).filter(Boolean) : [];
                                const isOpen = openDropdownId === ex.id;

                                return (
                                    <div key={ex.id} style={{
                                        display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: '0.8rem', alignItems: 'start',
                                        background: ex.error ? 'rgba(231,76,60,0.05)' : 'rgba(0,0,0,0.2)',
                                        border: `1px solid ${ex.error ? 'rgba(231,76,60,0.3)' : 'rgba(255,255,255,0.05)'}`,
                                        padding: '1rem', borderRadius: '8px'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('review.labels.title')}</label>
                                            <input
                                                type="text"
                                                value={ex.title}
                                                onChange={(e) => handleUpdateRow(ex.id, 'title', e.target.value)}
                                                style={{
                                                    width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'var(--surface)',
                                                    border: `1px solid ${!ex.title.trim() ? '#e74c3c' : 'rgba(255,255,255,0.1)'}`,
                                                    color: 'var(--text)', outline: 'none'
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', position: 'relative' }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('review.labels.technique')}</label>

                                            {isOpen && (
                                                <div
                                                    style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                                                    onClick={() => setOpenDropdownId(null)}
                                                />
                                            )}

                                            <button
                                                onClick={() => setOpenDropdownId(isOpen ? null : ex.id)}
                                                style={{
                                                    width: '100%', padding: '0.5rem', borderRadius: '4px',
                                                    background: 'var(--surface)',
                                                    border: `1px solid ${ex.error ? '#e74c3c' : 'rgba(255,255,255,0.1)'}`,
                                                    color: ex.technique ? 'var(--text)' : 'var(--muted)',
                                                    outline: 'none', cursor: 'pointer', textAlign: 'left',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    minHeight: '34px'
                                                }}
                                            >
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {ex.technique || t('review.labels.select')}
                                                </span>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </button>

                                            {isOpen && (
                                                <div style={{
                                                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%',
                                                    background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '8px', padding: '0.5rem', zIndex: 10,
                                                    maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                                                }}>
                                                    {TECHNIQUES.map(tech => (
                                                        <label key={tech} style={{
                                                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem',
                                                            cursor: 'pointer', borderRadius: '4px', color: 'var(--text)', fontSize: '0.85rem'
                                                        }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={currentTechs.includes(tech)}
                                                                onChange={() => handleToggleTechnique(ex.id, ex.technique, tech)}
                                                                style={{ accentColor: 'var(--gold)' }}
                                                            />
                                                            {tech}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}

                                            {ex.error && <span style={{ color: '#e74c3c', fontSize: '0.7rem' }}>{ex.error}</span>}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t('review.labels.bpm')}</label>
                                            <input
                                                type="number"
                                                value={ex.bpm_goal}
                                                onChange={(e) => handleUpdateRow(ex.id, 'bpm_goal', e.target.value)}
                                                placeholder={t('review.labels.optional')}
                                                style={{
                                                    width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'var(--surface)',
                                                    border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', outline: 'none'
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '1.2rem' }}>
                                            <button
                                                onClick={() => handleRemoveRow(ex.id)}
                                                style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: '0.5rem' }}
                                                title={t('review.actions.deleteRow')}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {globalError && (
                            <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                                ⚠ {globalError}
                            </div>
                        )}

                        <button
                            onClick={handleImport}
                            disabled={isImporting || hasInvalidRows}
                            style={{
                                width: '100%', background: 'var(--gold)', color: '#111', padding: '1rem',
                                borderRadius: '8px', border: 'none', cursor: isImporting || hasInvalidRows ? 'not-allowed' : 'pointer',
                                fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s',
                                opacity: isImporting || hasInvalidRows ? 0.5 : 1
                            }}
                        >
                            {isImporting ? t('review.actions.saving') : t('review.actions.confirmSave')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}