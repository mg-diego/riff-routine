"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Exercise } from '../../../lib/types';

export default function ExplorePage() {
    const router = useRouter();
    const [systemExercises, setSystemExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSystemExercises();
    }, []);

    const fetchSystemExercises = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('exercises')
            .select('*')
            .is('user_id', null)
            .order('title', { ascending: true });

        if (error) {
            setError(error.message);
        } else if (data) {
            setSystemExercises(data);
        }
        setLoading(false);
    };

    const handlePlay = (title: string) => {
        const routes: Record<string, string> = {
            'Escalas': 'scales',
            'Improvisación': 'improvisation'
        };

        const targetTitle = routes[title] || title;

        router.push(`/practice?mode=${encodeURIComponent(targetTitle)}`);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>Explorar Catálogo</h1>
                    <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                        Practica ejercicios base del sistema diseñados para mejorar tu técnica
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
                    <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: 600 }}>No hay ejercicios en el sistema</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {systemExercises.map((exercise) => {
                        const cats = exercise.technique ? exercise.technique.split(', ') : [];

                        return (
                            <div key={exercise.id} style={{
                                background: 'var(--surface)', padding: '1.5rem', borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.05)', display: 'flex',
                                flexDirection: 'column', gap: '1rem', transition: 'border-color 0.2s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(220,185,138,0.2)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{exercise.title}</h3>
                                    </div>

                                    {cats.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
                                            {cats.map(cat => (
                                                <span key={cat} style={{ background: 'rgba(220,185,138,0.1)', color: 'var(--gold)', borderRadius: '20px', padding: '0.15rem 0.5rem', fontSize: '0.68rem', fontWeight: 600 }}>{cat}</span>
                                            ))}
                                        </div>
                                    )}

                                    {exercise.notes && (
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {exercise.notes}
                                        </p>
                                    )}

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                                        {exercise.bpm_initial && <span>Inicio: <strong style={{ color: '#7dd3fc' }}>{exercise.bpm_initial}</strong></span>}
                                        {exercise.bpm_goal && <span>Meta: <strong style={{ color: '#a78bfa' }}>{exercise.bpm_goal}</strong></span>}
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                    <button
                                        onClick={() => handlePlay(exercise.title)}
                                        style={{
                                            width: '100%', background: 'var(--gold)', color: '#111', border: 'none',
                                            padding: '0.6rem', borderRadius: '6px', cursor: 'pointer',
                                            fontSize: '0.88rem', fontWeight: 700, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dark)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}
                                    >
                                        ▶ Tocar
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}