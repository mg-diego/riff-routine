"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { Exercise } from '../../../../lib/types';
import { useTranslations } from 'next-intl';
import { HistoryButton } from '@/components/ui/HistoryButton';

export default function ExplorePage() {
    const router = useRouter();
    const t = useTranslations('ExplorePage');
    const st = useTranslations('SystemExercises');

    const [systemExercises, setSystemExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleHistoryNavigation = (exercise: Exercise) => router.push(`/library/${exercise.id}/history`);

    useEffect(() => {
        fetchSystemExercises();
    }, []);

    const fetchSystemExercises = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('exercises')
            .select('*')
            .is('is_system', true)
            .order('title', { ascending: true });

        if (error) {
            setError(error.message);
        } else if (data) {
            setSystemExercises(data);
        }
        setLoading(false);
    };

    const handlePlay = (exercise: Exercise) => {
        if (exercise.file_url) {
            router.push(`/practice?file=${encodeURIComponent(exercise.file_url)}`);
        } else {
            const routes: Record<string, string> = {
                'sys_scales_title': 'scales',
                'sys_improvisation_title': 'improvisation',
                'sys_composition_title': 'composition',
                'sys_chords_title': 'chords'
            };

            const targetTitle = routes[exercise.title] || exercise.title;
            router.push(`/practice?mode=${encodeURIComponent(targetTitle)}`);
        }
    };

    // --- Lógica de Agrupación ---
    const toolsExercises = systemExercises.filter(ex => !ex.file_url);
    const tabsExercises = systemExercises.filter(ex => ex.file_url);

    // Agrupamos los ejercicios con file_url usando su primera técnica como clave
    const groupedTabs = tabsExercises.reduce((acc, exercise) => {
        const mainTech = exercise.technique ? exercise.technique.split(',')[0].trim() : 'General';
        if (!acc[st(mainTech)]) acc[st(mainTech)] = [];
        acc[st(mainTech)].push(exercise);
        return acc;
    }, {} as Record<string, Exercise[]>);

    // --- Helper para renderizar las tarjetas y no repetir código ---
    const renderExerciseCard = (exercise: Exercise) => {
        const displayTitle = st(exercise.title);
        const displayTechnique = exercise.technique ? st(exercise.technique) : '';
        const displayNotes = exercise.notes ? st(exercise.notes) : '';
        const cats = displayTechnique ? displayTechnique.split(', ') : [];

        return (
            <div key={exercise.id} style={{
                background: 'var(--surface)', padding: '1.5rem', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.05)', display: 'flex',
                flexDirection: 'column', gap: '1rem', transition: 'border-color 0.2s', position: 'relative'
            }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(220,185,138,0.2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
            >
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '1.1rem', fontWeight: 600, paddingRight: '2.5rem' }}>
                            {displayTitle}
                        </h3>
                        <HistoryButton onClick={() => handleHistoryNavigation(exercise)} />
                    </div>

                    {cats.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
                            {cats.map(cat => (
                                <span key={cat} style={{ background: 'rgba(220,185,138,0.1)', color: 'var(--gold)', borderRadius: '20px', padding: '0.15rem 0.5rem', fontSize: '0.68rem', fontWeight: 600 }}>
                                    {cat}
                                </span>
                            ))}
                        </div>
                    )}

                    {displayNotes && (
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {displayNotes}
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {exercise.bpm_goal && <span>{t('exercise.goal')}: <strong style={{ color: '#a78bfa' }}>{exercise.bpm_goal}</strong></span>}
                    </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                    <button
                        onClick={() => handlePlay(exercise)}
                        style={{
                            width: '100%', background: 'var(--gold)', color: '#111', border: 'none',
                            padding: '0.6rem', borderRadius: '6px', cursor: 'pointer',
                            fontSize: '0.88rem', fontWeight: 700, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dark)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}
                    >
                        {t('exercise.playButton')}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>{t('title')}</h1>
                    <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                        {t('subtitle')}
                    </p>
                </div>
            </div>

            {error && (
                <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>⚠ {error}</span>
                    <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <span className="loader" />
                </div>
            ) : systemExercises.length === 0 ? (
                <div style={{ background: 'var(--surface)', padding: '4rem 2rem', borderRadius: '12px', border: '1px dashed rgba(220,185,138,0.3)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: 600 }}>{t('emptyState')}</p>
                </div>
            ) : (
                <div data-onboarding="explore-01" style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                    
                    {/* BLOQUE 1: Herramientas sin archivo (Escalas, Acordes, etc.) */}
                    {toolsExercises.length > 0 && (
                        <section>
                            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', color: 'var(--text)', margin: '0 0 1.5rem 0', letterSpacing: '0.02em' }}>
                                {t('blocks.tools')}
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                {toolsExercises.map(renderExerciseCard)}
                            </div>
                        </section>
                    )}

                    {/* BLOQUE 2: Ejercicios con GP5, agrupados por técnica */}
                    {tabsExercises.length > 0 && (
                        <section>
                            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', color: 'var(--text)', margin: '0 0 2rem 0', letterSpacing: '0.02em', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                {t('blocks.exercises')}
                            </h2>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                                {Object.entries(groupedTabs).map(([technique, exercises]) => (
                                    <div key={technique}>
                                        <h3 style={{ color: 'var(--gold)', fontSize: '1.2rem', margin: '0 0 1rem 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ width: '8px', height: '8px', background: 'var(--gold)', borderRadius: '50%', display: 'inline-block' }}></span>
                                            {technique === 'General' ? t('blocks.general') : technique}
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                            {exercises.map(renderExerciseCard)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}