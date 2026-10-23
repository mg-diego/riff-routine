"use client";

import React from 'react';
import { TECHNIQUES, DIFFICULTY_COLORS } from '@/lib/constants';
import { useTranslations } from 'next-intl';
import styles from './ExerciseForm.module.css';
import { cx } from '@/lib/cx';

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
    isSystem: boolean;
}

const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.8rem', fontWeight: 700,
    color: 'var(--text)', letterSpacing: '0.04em', textTransform: 'uppercase',
    marginBottom: '0.5rem',
};

export function ExerciseForm({
    name, setName, categories, setCategories, bpmSuggested, setBpmSuggested, bpmGoal, setBpmGoal, difficulty, setDifficulty, notes, setNotes, isSystem
}: ExerciseFormProps) {
    const t = useTranslations('ExerciseForm');
    const tConstants = useTranslations('MusicConstants');

    const toggleCategory = (cat: string) =>
        setCategories((prev: string[]) => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

    return (
        <>
            <div data-onboarding="library-03">
                <label style={labelStyle}>{t('name')}</label>
                <input type="text" value={name} onChange={e => !isSystem && setName(e.target.value)}
                    placeholder={t('namePlaceholder')}
                    readOnly={isSystem}
                    className={cx(styles.input, styles.nameInput)} style={{ opacity: isSystem ? 0.5 : 1, cursor: isSystem ? 'not-allowed' : 'text' }} />
            </div>

            <div data-onboarding="library-04">
                <label style={labelStyle}>
                    {t('categories')}
                    {categories.length > 0 && (
                        <span className={styles.selectedLabel}>
                            {t('selected', { count: categories.length })}
                        </span>
                    )}
                </label>
                <div className={styles.grid}>
                    {TECHNIQUES.map(cat => {
                        const active = categories.includes(cat);
                        return (
                            <button
                                key={cat}
                                onClick={() => toggleCategory(cat)}
                                className={styles.button} style={{ borderColor: active ? 'var(--gold)' : 'rgba(255,255,255,0.05)', background: active ? 'var(--gold)' : 'rgba(255,255,255,0.04)', color: active ? '#111' : 'var(--muted)', boxShadow: active ? '0 2px 8px rgba(220,185,138,0.2)' : 'none', opacity: isSystem ? 0.5 : 1, cursor: isSystem ? 'not-allowed' : 'pointer', pointerEvents: isSystem ? 'none' : 'auto' }}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div data-onboarding="library-05" className={styles.bpmSuggestedGrid}>
                <div>
                    <label style={labelStyle}>{t('bpmSuggested')}</label>
                    <input type="number" min="20" max="300" value={bpmSuggested} onChange={e => setBpmSuggested(e.target.value)}
                        placeholder={t('bpmSuggestedPlaceholder')} className={`${styles.input} ${styles.inputFocusable}`} />
                </div>
                <div>
                    <label style={labelStyle}>{t('bpmGoal')}</label>
                    <input type="number" min="20" max="300" value={bpmGoal} onChange={e => setBpmGoal(e.target.value)}
                        placeholder={t('bpmGoalPlaceholder')} className={`${styles.input} ${styles.bpmGoalPlaceholderFocusable}`} />
                </div>
            </div>

            <div data-onboarding="library-06">
                <label style={labelStyle}>
                    {t('difficulty')}
                    <span className={styles.difficultyLevelLabel} style={{ color: DIFFICULTY_COLORS[difficulty] }}>
                        {t('difficultyLevel', { level: difficulty, label: tConstants(`difficulty.${difficulty}`) })}
                    </span>
                </label>
                <div className={styles.row}>
                    {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setDifficulty(n)} className={styles.button2} style={{ background: difficulty >= n ? DIFFICULTY_COLORS[n] : 'rgba(255,255,255,0.05)', color: difficulty >= n ? '#111' : 'var(--muted)', transform: difficulty === n ? 'scale(1.08)' : 'scale(1)', boxShadow: difficulty === n ? `0 4px 12px ${DIFFICULTY_COLORS[n]}55` : 'none', cursor: isSystem ? 'not-allowed' : 'pointer', pointerEvents: isSystem ? 'none' : 'auto' }}>{n}</button>
                    ))}
                </div>
            </div>

            <div data-onboarding="library-07">
                <label style={labelStyle}>{t('notes')}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder={t('notesPlaceholder')}
                    rows={3} className={cx(styles.input, styles.notesPlaceholderTextarea)} />
            </div>
        </>
    );
}