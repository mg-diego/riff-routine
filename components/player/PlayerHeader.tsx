"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Exercise } from '../../lib/types';

interface PlayerHeaderProps {
    mode: 'free' | 'library' | 'routine' | 'scales' | 'improvisation';
    routineLength: number;
    currentIndex: number;
    onPrev: () => void;
    onNext: () => void;
    exercise?: Exercise | null;
}

const MODE_CONFIG = {
    free: { label: 'Práctica Libre', icon: '🎸', color: '#7dd3fc', back: '/' },
    library: { label: 'Modo Biblioteca', icon: '📚', color: '#dcb98a', back: '/library' },
    routine: { label: 'Modo Rutina', icon: '🔁', color: '#a78bfa', back: '/routines' },
    scales: { label: 'Escalas', icon: '🔁', color: '#a78bfa', back: '/explore' },
    improvisation: { label: 'Escalas', icon: '🔁', color: '#a78bfa', back: '/explore' },
};

const DIFF_COLORS: Record<number, string> = {
    1: '#4ade80', 2: '#a3e635', 3: '#facc15', 4: '#fb923c', 5: '#f87171',
};

export function PlayerHeader({ mode, routineLength, currentIndex, onPrev, onNext, exercise }: PlayerHeaderProps) {
    const router = useRouter();
    const cfg = MODE_CONFIG[mode] ?? MODE_CONFIG.free;

    const [bpmCurrent, setBpmCurrent] = useState('');
    const [bpmGoal, setBpmGoal] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setBpmCurrent(exercise?.bpm_current?.toString() || exercise?.bpm_initial?.toString() || '');
        setBpmGoal(exercise?.bpm_goal?.toString() || '');
    }, [exercise?.id]);

    const saveBpms = async () => {
        if (!exercise || exercise.user_id === null) return;
        setIsSaving(true);
        await supabase.from('exercises').update({
            bpm_current: bpmCurrent ? parseInt(bpmCurrent) : null,
            bpm_goal: bpmGoal ? parseInt(bpmGoal) : null,
        }).eq('id', exercise.id);
        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const isSystem = exercise?.user_id === null;
    const bpmInitial = exercise?.bpm_initial ?? null;
    const activeBpm = bpmCurrent ? parseInt(bpmCurrent) : null;
    const goalBpm = bpmGoal ? parseInt(bpmGoal) : null;

    const minBpm = bpmInitial || 20;
    const maxBpm = goalBpm ? Math.max(goalBpm, minBpm + 10) : Math.max(minBpm + 50, (activeBpm || 0) + 20);
    const validCurrent = Math.min(Math.max(activeBpm || minBpm, minBpm), maxBpm);
    const progressPercent = ((validCurrent - minBpm) / (maxBpm - minBpm)) * 100;

    const showBpm = mode !== 'free' && exercise && (bpmInitial !== null || goalBpm !== null || activeBpm !== null);
    const cats = exercise?.technique ? exercise.technique.split(', ') : [];
    const diff = exercise?.difficulty;

    return (
        <>
            <style>{`
        .ph-root {
          display: flex;
          flex-direction: column;
          background: #0a0a0a;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
          width: 100%;
        }

        .ph-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          gap: 1rem;
        }

        .ph-identity {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 0;
        }

        .ph-badge {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.3rem 0.75rem; border-radius: 8px;
          font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em;
          text-transform: uppercase; border: 1px solid;
          flex-shrink: 0; white-space: nowrap;
        }

        .ph-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2rem; letter-spacing: 0.04em;
          margin: 0; line-height: 1;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .ph-tags {
          display: flex; align-items: center; gap: 0.5rem;
          flex-wrap: wrap; margin-left: 0.5rem;
        }

        .ph-cat {
          background: rgba(220,185,138,0.12); color: var(--gold, #dcb98a);
          border-radius: 6px; padding: 0.2rem 0.6rem;
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; border: 1px solid rgba(220,185,138,0.2);
        }

        .ph-diff {
          border-radius: 6px; padding: 0.2rem 0.6rem;
          font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ph-nav-container {
          display: flex; align-items: center; gap: 1rem; flex-shrink: 0;
        }
        
        .ph-dots { display: flex; gap: 4px; align-items: center; margin-right: 0.5rem; }
        .ph-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.15); transition: all 0.2s; }
        .ph-dot.active { background: var(--gold, #dcb98a); transform: scale(1.4); box-shadow: 0 0 8px rgba(220,185,138,0.5); }
        .ph-dot.done   { background: rgba(220,185,138,0.4); }

        .ph-btn {
          padding: 0.5rem 1rem; border-radius: 6px;
          font-family: 'DM Sans', sans-serif; font-size: 0.85rem;
          font-weight: 600; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 0.4rem;
        }

        .ph-btn-nav {
          border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: var(--text, #f0e8dc);
        }
        .ph-btn-nav:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
        .ph-btn-nav:disabled { opacity: 0.3; cursor: not-allowed; }
        
        .ph-btn-primary {
          background: var(--gold, #dcb98a); color: #111; border: none; font-weight: 700;
        }
        .ph-btn-primary:hover:not(:disabled) { background: #c9a676; }

        .ph-btn-close {
          background: transparent; color: var(--muted, #6a5f52); border: 1px solid rgba(255,255,255,0.1);
        }
        .ph-btn-close:hover { background: rgba(231,76,60,0.1); color: #e74c3c; border-color: rgba(231,76,60,0.3); }

        .ph-bottom-row {
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          background: rgba(255,255,255,0.01);
          min-height: 80px;
        }

        .ph-notes-section {
          flex: 1;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          border-right: 1px solid rgba(255,255,255,0.03);
          max-width: 45%;
        }
        .ph-notes-text {
          font-size: 0.85rem; color: rgba(255,255,255,0.6);
          line-height: 1.4; margin: 0;
          border-left: 3px solid rgba(220,185,138,0.4);
          padding-left: 0.8rem; font-style: italic;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }

        .ph-bpm-section {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 2rem;
          padding: 0 1.5rem;
          flex: 1;
        }

        .ph-bpm-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
        }

        .ph-bpm-lbl {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted, #6a5f52);
        }

        .ph-bpm-input {
          width: 70px;
          padding: 0.4rem;
          text-align: center;
          border-radius: 6px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.6rem;
          outline: none;
          transition: all 0.2s;
        }

        .ph-bpm-input.start {
          background: rgba(125,211,252,0.05);
          border: 1px solid rgba(125,211,252,0.1);
          color: #7dd3fc;
        }
        .ph-bpm-input.start:disabled {
          opacity: 0.8;
          cursor: not-allowed;
        }

        .ph-bpm-input.current {
          background: rgba(220,185,138,0.08);
          border: 1px solid rgba(220,185,138,0.3);
          color: var(--gold, #dcb98a);
        }
        .ph-bpm-input.current:focus:not(:disabled) {
          border-color: var(--gold, #dcb98a);
          background: rgba(220,185,138,0.15);
        }
        .ph-bpm-input.current:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ph-bpm-input.goal {
          background: rgba(167,139,250,0.08);
          border: 1px solid rgba(167,139,250,0.3);
          color: #a78bfa;
        }
        .ph-bpm-input.goal:focus:not(:disabled) {
          border-color: #a78bfa;
          background: rgba(167,139,250,0.15);
        }
        .ph-bpm-input.goal:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ph-system-badge {
          font-size: 0.75rem;
          color: var(--muted);
          font-style: italic;
          padding: 0.6rem 1rem;
          margin-left: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
      `}</style>

            <header className="ph-root">

                <div className="ph-top-row">
                    <div className="ph-identity">
                        <div className="ph-badge" style={{ color: cfg.color, borderColor: cfg.color + '40', background: cfg.color + '15' }}>
                            <span>{cfg.icon}</span> {cfg.label}
                        </div>

                        <h1 className="ph-title" style={{ color: cfg.color }} title={exercise?.title ?? 'Modo Libre'}>
                            {exercise?.title ?? 'Sin pista seleccionada'}
                        </h1>

                        {(cats.length > 0 || diff) && (
                            <div className="ph-tags">
                                {diff && DIFF_COLORS[diff] && (
                                    <span className="ph-diff" style={{ background: DIFF_COLORS[diff] + '20', color: DIFF_COLORS[diff], border: `1px solid ${DIFF_COLORS[diff]}40` }}>
                                        Nv. {diff}
                                    </span>
                                )}
                                {cats.map(cat => <span key={cat} className="ph-cat">{cat}</span>)}
                            </div>
                        )}
                    </div>

                    <div className="ph-nav-container">
                        {mode === 'routine' && routineLength > 0 && (
                            <>
                                <div className="ph-dots">
                                    {Array.from({ length: Math.min(routineLength, 8) }).map((_, i) => (
                                        <div key={i} className={`ph-dot ${i === currentIndex ? 'active' : i < currentIndex ? 'done' : ''}`} />
                                    ))}
                                    {routineLength > 8 && <span style={{ color: 'var(--muted)', fontSize: '0.7rem', marginLeft: 4 }}>+{routineLength - 8}</span>}
                                </div>
                                <button className="ph-btn ph-btn-nav" onClick={onPrev} disabled={currentIndex === 0}>← Ant</button>
                                <button className="ph-btn ph-btn-primary" onClick={onNext} disabled={currentIndex === routineLength - 1}>Siguiente →</button>
                            </>
                        )}
                        <button className="ph-btn ph-btn-close" onClick={() => router.push(cfg.back)}>✕ Cerrar</button>
                    </div>
                </div>

                <div className="ph-bottom-row">
                    <div className="ph-notes-section">
                        {exercise?.notes ? (
                            <p className="ph-notes-text">{exercise.notes}</p>
                        ) : (
                            <p className="ph-notes-text" style={{ opacity: 0.3, borderLeftColor: 'transparent', fontStyle: 'normal' }}>
                                {mode === 'free' ? 'Arrastra un archivo Guitar Pro para comenzar a tocar.' : 'No hay notas añadidas para este ejercicio.'}
                            </p>
                        )}
                    </div>

                    {showBpm && (
                        <div className="ph-bpm-section">

                            <div className="ph-bpm-group">
                                <input
                                    type="text"
                                    className="ph-bpm-input start"
                                    value={bpmInitial ?? '—'}
                                    disabled
                                />
                                <span className="ph-bpm-lbl">Inicio</span>
                            </div>

                            <div className="ph-bpm-group">
                                <input
                                    type="number"
                                    className="ph-bpm-input current"
                                    value={bpmCurrent}
                                    placeholder="—"
                                    onChange={e => setBpmCurrent(e.target.value)}
                                    disabled={isSystem}
                                    title={isSystem ? "Solo lectura" : "BPM Actual"}
                                />
                                <span className="ph-bpm-lbl">Actual</span>
                            </div>

                            <div className="ph-bpm-group">
                                <input
                                    type="number"
                                    className="ph-bpm-input goal"
                                    value={bpmGoal}
                                    placeholder="—"
                                    onChange={e => setBpmGoal(e.target.value)}
                                    disabled={isSystem}
                                    title={isSystem ? "Solo lectura" : "BPM Objetivo"}
                                />
                                <span className="ph-bpm-lbl">Objetivo</span>
                            </div>

                            {isSystem ? (
                                <div className="ph-system-badge">
                                    <span>🔒</span> Ejercicio de sistema (Solo lectura)
                                </div>
                            ) : (
                                <button className="ph-btn ph-btn-nav" onClick={saveBpms} disabled={isSaving} style={{
                                    background: saved ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
                                    color: saved ? '#4ade80' : 'var(--gold)',
                                    borderColor: saved ? 'rgba(74,222,128,0.4)' : 'rgba(220,185,138,0.3)',
                                    padding: '0.6rem 1rem',
                                    marginLeft: '0.5rem',
                                    alignSelf: 'center'
                                }}>
                                    {isSaving ? '...' : saved ? '✓ Guardado' : '💾 Guardar'}
                                </button>
                            )}

                        </div>
                    )}
                </div>
            </header>
        </>
    );
}