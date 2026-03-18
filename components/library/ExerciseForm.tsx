"use client";

import React from 'react';
import { TECHNIQUES, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '../../lib/constants';
import { useTranslations } from 'next-intl';

interface ExerciseFormProps {
    name: string;
    setName: React.Dispatch<React.SetStateAction<string>>;
    categories: string[];
    setCategories: React.Dispatch<React.SetStateAction<string[]>>;
    bpmSuggested: number | string;
    setBpmSuggested: React.Dispatch<React.SetStateAction<number | string>>;
    bpmGoal: number | string;
    setBpmGoal: React.Dispatch<React.SetStateAction<number | string>>;
    difficulty: number;
    setDifficulty: React.Dispatch<React.SetStateAction<number>>;
    notes: string;
    setNotes: React.Dispatch<React.SetStateAction<string>>;
}

const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.8rem', fontWeight: 700,
    color: 'var(--text)', letterSpacing: '0.04em', textTransform: 'uppercase',
    marginBottom: '0.5rem',
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.7rem 0.9rem', borderRadius: '7px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.93rem',
    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
};

export function ExerciseForm({
    name, setName, categories, setCategories, bpmSuggested, setBpmSuggested, bpmGoal, setBpmGoal, difficulty, setDifficulty, notes, setNotes
}: ExerciseFormProps) {
    const t = useTranslations('ExerciseForm');

    const toggleCategory = (cat: string) =>
        setCategories((prev: string[]) => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

    return (
        <>
            <div data-onboarding="library-03">
                <label style={labelStyle}>{t('name')}</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder={t('namePlaceholder')} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>

            <div data-onboarding="library-04">
                <label style={labelStyle}>
                    {t('categories')}
                    {categories.length > 0 && (
                        <span style={{ color: 'var(--gold)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                            {t('selected', { count: categories.length })}
                        </span>
                    )}
                </label>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                    gap: '0.5rem',
                    marginTop: '0.5rem'
                }}>
                    {TECHNIQUES.map(cat => {
                        const active = categories.includes(cat);
                        return (
                            <button
                                key={cat}
                                onClick={() => toggleCategory(cat)}
                                style={{
                                    padding: '0.5rem 0.25rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontWeight: 600,
                                    transition: 'all 0.15s',
                                    border: '1px solid',
                                    borderColor: active ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                                    background: active ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
                                    color: active ? '#111' : 'var(--muted)',
                                    boxShadow: active ? '0 2px 8px rgba(220,185,138,0.2)' : 'none',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div data-onboarding="library-05" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={labelStyle}>{t('bpmSuggested')}</label>
                    <input type="number" min="20" max="300" value={bpmSuggested} onChange={e => setBpmSuggested(e.target.value)}
                        placeholder={t('bpmSuggestedPlaceholder')} style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
                <div>
                    <label style={labelStyle}>{t('bpmGoal')}</label>
                    <input type="number" min="20" max="300" value={bpmGoal} onChange={e => setBpmGoal(e.target.value)}
                        placeholder={t('bpmGoalPlaceholder')} style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
            </div>

            <div data-onboarding="library-06">
                <label style={labelStyle}>
                    {t('difficulty')}
                    <span style={{ marginLeft: '0.6rem', color: DIFFICULTY_COLORS[difficulty], fontWeight: 700 }}>
                        {t('difficultyLevel', { level: difficulty, label: DIFFICULTY_LABELS[difficulty as keyof typeof DIFFICULTY_LABELS] })}
                    </span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setDifficulty(n)} style={{
                            flex: 1, padding: '0.6rem 0', borderRadius: '6px', cursor: 'pointer',
                            border: 'none', fontWeight: 700, fontSize: '1rem',
                            fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
                            background: difficulty >= n ? DIFFICULTY_COLORS[n] : 'rgba(255,255,255,0.05)',
                            color: difficulty >= n ? '#111' : 'var(--muted)',
                            transform: difficulty === n ? 'scale(1.08)' : 'scale(1)',
                            boxShadow: difficulty === n ? `0 4px 12px ${DIFFICULTY_COLORS[n]}55` : 'none',
                        }}>{n}</button>
                    ))}
                </div>
            </div>

            <div data-onboarding="library-07">
                <label style={labelStyle}>{t('notes')}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder={t('notesPlaceholder')}
                    rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
        </>
    );
}