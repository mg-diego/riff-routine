"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface RhythmPanelProps {
    apiRef: React.MutableRefObject<any>;
}

interface SequenceMeasure {
    uid: string;
    id: number;
    label: string;
    symbol: React.ReactNode;
    fraction: string;
    customTex?: string;
}

const TupletIcon = ({ note, num }: { note: string, num?: number }) => (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, minWidth: '24px' }}>
        {num && (
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.6rem', fontWeight: 700, marginBottom: '-4px', opacity: 0.9 }}>
                <span style={{ borderTop: '1px solid currentColor', borderLeft: '1px solid currentColor', width: '3px', height: '4px' }} />
                <span style={{ padding: '0 3px', transform: 'translateY(-1px)' }}>{num}</span>
                <span style={{ borderTop: '1px solid currentColor', borderRight: '1px solid currentColor', width: '3px', height: '4px' }} />
            </div>
        )}
        <span style={{ fontSize: '1.2rem' }}>{note}</span>
    </div>
);

export function RhythmPanel({ apiRef }: RhythmPanelProps) {
    const t = useTranslations('RhythmPanel');
    const [difficulty, setDifficulty] = useState<number>(1);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const SUBDIVISIONS = [
        { id: 4, label: t('labels.negras'), symbol: <TupletIcon note="♩" />, fraction: '1/4' },
        { id: 8, label: t('labels.corcheas'), symbol: <TupletIcon note="♫" />, fraction: '1/8' },
        { id: 12, label: t('labels.tresillos'), symbol: <TupletIcon note="♫" num={3} />, fraction: '3x' },
        { id: 16, label: t('labels.semicorcheas'), symbol: <TupletIcon note="♬" />, fraction: '1/16' },
        { id: 20, label: t('labels.quincillo'), symbol: <TupletIcon note="♬" num={5} />, fraction: '5x' },
        { id: 24, label: t('labels.seisillo'), symbol: <TupletIcon note="♬" num={6} />, fraction: '6x' },
        { id: 28, label: t('labels.septillo'), symbol: <TupletIcon note="♬" num={7} />, fraction: '7x' },
        { id: 36, label: t('labels.nonillo'), symbol: <TupletIcon note="♬" num={9} />, fraction: '9x' }
    ];

    const [sequence, setSequence] = useState<SequenceMeasure[]>([
    ]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const generateAlphaTex = () => {
        let tex = `\\title "Rythm Generator"\n\\subtitle "Focus & Timing"\n\\tempo 80\n.\n`;

        const measures = sequence.map(measure => {
            if (measure.customTex) return measure.customTex;

            if (measure.id === 4) return ":4 0.6 0.6 0.6 0.6";
            if (measure.id === 8) return ":8 0.6 0.6 0.6 0.6 0.6 0.6 0.6 0.6";
            if (measure.id === 12) {
                const trip = ":8 {tu 3} 0.6 0.6 0.6";
                return `${trip} ${trip} ${trip} ${trip}`;
            }
            if (measure.id === 16) return ":16 0.6 0.6 0.6 0.6 0.6 0.6 0.6 0.6 0.6 0.6 0.6 0.6 0.6 0.6 0.6 0.6";
            if (measure.id === 20) {
                const quin = ":16 {tu 5} 0.6 0.6 0.6 0.6 0.6";
                return `${quin} ${quin} ${quin} ${quin}`;
            }
            if (measure.id === 24) {
                const sex = ":16 {tu 6} 0.6 0.6 0.6 0.6 0.6 0.6";
                return `${sex} ${sex} ${sex} ${sex}`;
            }
            if (measure.id === 28) {
                const sep = ":16 {tu 7} 0.6 0.6 0.6 0.6 0.6 0.6 0.6";
                return `${sep} ${sep} ${sep} ${sep}`;
            }
            if (measure.id === 36) {
                const non = ":32 {tu 9} 0.6 0.6 0.6 0.6 0.6 0.6 0.6 0.6 0.6";
                return `${non} ${non} ${non} ${non}`;
            }
            return "";
        });

        tex += measures.join(" | ");
        return tex;
    };

    useEffect(() => {
        if (apiRef.current && sequence.length > 0) {
            apiRef.current.tex(generateAlphaTex());
        }
    }, [sequence, apiRef]);

    const handleAddMeasure = (id: number) => {
        const figure = SUBDIVISIONS.find(s => s.id === id);
        if (figure) {
            setSequence(prev => [...prev, { uid: `meas-${Date.now()}-${Math.random()}`, ...figure }]);
        }
    };

    const handleRemoveMeasure = (uidToRemove: string) => {
        setSequence(prev => prev.filter(m => m.uid !== uidToRemove));
    };

    const handleGenerateRandom = () => {
        const seq: SequenceMeasure[] = [];
        for (let i = 0; i < 4; i++) {
            const uid = `rand-${Date.now()}-${i}`;
            
            if (difficulty === 1) {
                const pool = [4, 8, 16];
                const choice = pool[Math.floor(Math.random() * pool.length)];
                const sub = SUBDIVISIONS.find(s => s.id === choice)!;
                seq.push({ ...sub, uid });
            } else {
                let customTex = "";
                
                for (let b = 0; b < 4; b++) {
                    if (difficulty === 2) {
                        const pool = [":4 0.6", ":8 0.6 0.6", ":16 0.6 0.6 0.6 0.6"];
                        customTex += pool[Math.floor(Math.random() * pool.length)] + " ";
                    } else if (difficulty === 3) {
                        const pool = [":4 0.6", ":4 r", ":8 0.6 0.6", ":8 0.6 r", ":8 {tu 3} 0.6 0.6 0.6"];
                        customTex += pool[Math.floor(Math.random() * pool.length)] + " ";
                    } else if (difficulty === 4) {
                        const pool = [
                            "0.6.8 0.6.16 0.6.16",
                            "0.6.16 0.6.16 0.6.8",
                            "0.6.16 0.6.8 0.6.16",
                            "0.6.8 r.8",
                            "r.8 0.6.8",
                            "0.6.16 0.6.16 r.8",
                            "r.8 0.6.16 0.6.16",
                            ":16 0.6 0.6 0.6 0.6"
                        ];
                        customTex += pool[Math.floor(Math.random() * pool.length)] + " ";
                    } else if (difficulty === 5) {
                        const pool = [":16 {tu 5} 0.6 0.6 0.6 0.6 0.6", ":16 {tu 7} 0.6 0.6 0.6 0.6 0.6 0.6 0.6", ":32 {tu 9} 0.6 0.6 0.6 0.6 0.6 0.6 0.6 0.6 0.6", ":16 r 0.6 0.6 r"];
                        customTex += pool[Math.floor(Math.random() * pool.length)] + " ";
                    }
                }

                seq.push({
                    uid,
                    id: 99 + difficulty,
                    label: `${t('labels.mixed')} ${difficulty}`,
                    symbol: <TupletIcon note="⚄" />, 
                    fraction: `L${difficulty}`,
                    customTex: customTex.trim()
                });
            }
        }
        setSequence(seq);
    };

    return (
        <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', width: '100%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h3 style={{ color: 'var(--gold)', marginTop: 0, marginBottom: '0.5rem', fontSize: '1.4rem', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
                        {t('title')}
                    </h3>
                    <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5, maxWidth: '600px' }}>
                        {t('description')}
                    </p>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{ 
                                background: 'transparent', color: 'var(--text)', border: 'none', 
                                padding: '0.4rem 0.8rem', outline: 'none', cursor: 'pointer', 
                                fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: '0.5rem' 
                            }}
                        >
                            {t(`levels.${difficulty}`)}
                            <span style={{ fontSize: '0.7em', opacity: 0.6, transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                        </button>

                        {isDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 8px)',
                                right: 0,
                                background: '#1a1a1a',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '10px',
                                padding: '0.35rem',
                                zIndex: 100,
                                minWidth: '180px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                animation: 'fadeUp 0.12s ease',
                            }}>
                                {[1, 2, 3, 4, 5].map(lvl => {
                                    const isActive = lvl === difficulty;
                                    return (
                                        <button
                                            key={lvl}
                                            onClick={() => {
                                                setDifficulty(lvl);
                                                setIsDropdownOpen(false);
                                            }}
                                            style={{
                                                display: 'block', width: '100%', textAlign: 'left',
                                                background: isActive ? 'rgba(220,185,138,0.12)' : 'transparent',
                                                color: isActive ? 'var(--gold)' : 'var(--text)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '0.45rem 0.75rem',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontFamily: 'DM Sans, sans-serif',
                                                fontWeight: isActive ? 700 : 400,
                                                transition: 'background 0.1s',
                                            }}
                                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            {t(`levels.${lvl}`)}
                                            {isActive && <span style={{ float: 'right', opacity: 0.7 }}>✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleGenerateRandom}
                        style={{ background: 'var(--gold)', color: '#111', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                    >
                        {t('generate')}
                    </button>
                </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', minHeight: '80px' }}>
                <p style={{ margin: '0 0 0.8rem 0', color: 'rgba(220,185,138,0.7)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {t('sequencePreview')}
                </p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    {sequence.map((measure, index) => (
                        <React.Fragment key={measure.uid}>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(220,185,138,0.1)', border: '1px solid rgba(220,185,138,0.3)', borderRadius: '6px', overflow: 'hidden' }}>
                                <span style={{ padding: '0.4rem 0.6rem', color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <span style={{ fontSize: '1.1rem' }}>{measure.symbol}</span>
                                    {measure.label}
                                </span>
                                <button 
                                    onClick={() => handleRemoveMeasure(measure.uid)}
                                    disabled={sequence.length === 1}
                                    style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderLeft: '1px solid rgba(220,185,138,0.2)', color: sequence.length === 1 ? 'rgba(255,255,255,0.2)' : 'var(--muted)', padding: '0.4rem 0.6rem', cursor: sequence.length === 1 ? 'not-allowed' : 'pointer', transition: 'color 0.2s' }}
                                    onMouseEnter={e => { if (sequence.length > 1) e.currentTarget.style.color = '#e74c3c' }}
                                    onMouseLeave={e => { if (sequence.length > 1) e.currentTarget.style.color = 'var(--muted)' }}
                                >
                                    ✕
                                </button>
                            </div>
                            {index < sequence.length - 1 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>➔</span>}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div>
                <p style={{ margin: '0 0 0.8rem 0', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('addMeasure')}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem' }}>
                    {SUBDIVISIONS.map(sub => (
                        <button
                            key={sub.id}
                            onClick={() => handleAddMeasure(sub.id)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.6rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{sub.symbol}</span>
                            + {sub.label}
                        </button>
                    ))}
                </div>
                <p style={{ margin: '1rem 0 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    {t('tips')}
                </p>
            </div>

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(4px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}