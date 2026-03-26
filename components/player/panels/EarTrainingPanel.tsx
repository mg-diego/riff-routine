"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useAudioSynth } from '@/hooks/useAudioSynth';
import { getChordData } from '@/app/actions/chords';
import { EAR_TRAINING_LEVELS, CHORD_LABELS } from '@/lib/audioExercises';
import { MiniFretboard } from '../MiniFretboard';

const ROOTS      = ["C", "D", "E", "F", "G", "A", "B"];
const CHROMATIC  = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STD_TUNING = ['E', 'A', 'D', 'G', 'B', 'E'];
const STD_BASES  = [40, 45, 50, 55, 59, 64];

function buildPositionData(rawChord: any) {
    if (!rawChord?.positions?.length) return null;
    const getLowestFret = (posObj: any) => {
        const frets = posObj.positions || posObj.frets || [];
        const played = frets.map((f: any) => { const s = String(f).toLowerCase(); return (s === 'x' || s === '0' || s === '-1') ? -1 : parseInt(s, 10); }).filter((f: number) => f > 0);
        return played.length > 0 ? Math.min(...played) : 0;
    };
    const position   = [...rawChord.positions].sort((a, b) => getLowestFret(a) - getLowestFret(b))[0];
    const rawFrets   = position.positions || [];
    const rawFingers = (position.fingerings?.length > 0) ? position.fingerings[0] : [];
    const fingersArr: number[] = Array.isArray(rawFingers)
        ? rawFingers.map((f: any) => typeof f === 'string' && f.toLowerCase() === 'x' ? 0 : parseInt(f, 10) || 0) : [];
    const activeNotesList = rawFrets.reduce((acc: any[], fretVal: any, si: number) => {
        const fretStr = String(fretVal).toLowerCase();
        const fretNum = fretStr === 'x' ? -1 : parseInt(fretStr, 10);
        if (fretNum >= -1) acc.push({ string: 5 - si, fret: fretNum, finger: isNaN(fingersArr[si] || 0) ? 0 : (fingersArr[si] || 0) });
        return acc;
    }, []);
    const absoluteBarres: number[] = [];
    const barreCandidates: Record<string, { fret: number; strings: number[] }> = {};
    rawFingers.forEach((f: any, si: number) => {
        const fn   = parseInt(f, 10);
        const fStr = String(rawFrets[si]).toLowerCase();
        const fn2  = (fStr === 'x' || fStr === '0' || fStr === '-1') ? -1 : parseInt(fStr, 10);
        if (fn > 0 && fn2 > 0) {
            const key = `${fn}_${fn2}`;
            if (!barreCandidates[key]) barreCandidates[key] = { fret: fn2, strings: [] };
            barreCandidates[key].strings.push(si);
        }
    });
    Object.values(barreCandidates).forEach(c => { if (c.strings.length > 1 && !absoluteBarres.includes(c.fret)) absoluteBarres.push(c.fret); });
    return { activeNotesList, absoluteBarres };
}

export function EarTrainingPanel() {
    const t = useTranslations('EarTrainingPanel');
    const { playRealSound } = useAudioSynth();

    const [level,          setLevel]          = useState(EAR_TRAINING_LEVELS[0]);
    const [currentChord,   setCurrentChord]   = useState<{ root: string; type: string } | null>(null);
    const [status,         setStatus]         = useState<'idle' | 'success' | 'error'>('idle');
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isChordLoading, setIsChordLoading] = useState(false);
    const [isPlaying,      setIsPlaying]      = useState(false);
    const [hasPlayed,      setHasPlayed]      = useState(false);
    const [positionData,   setPositionData]   = useState<any>(null);
    const [fretboardRoot,  setFretboardRoot]  = useState<string>('C');
    const [streak,         setStreak]         = useState(0);
    const [maxStreak,      setMaxStreak]      = useState(0);

    const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const stableOptions  = useMemo(() => [...level.types].sort(), [level]);

    const generateQuestion = useCallback(async (selectedLevel = level) => {
        setStatus('idle');
        setSelectedOption(null);
        setCurrentChord(null);
        setPositionData(null);
        setHasPlayed(false);
        const randomType = selectedLevel.types[Math.floor(Math.random() * selectedLevel.types.length)];
        const randomRoot = ROOTS[Math.floor(Math.random() * ROOTS.length)];
        setCurrentChord({ root: randomRoot, type: randomType });
    }, [level]);

    useEffect(() => { generateQuestion(); }, [generateQuestion]);
    useEffect(() => () => { if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current); }, []);

    const playCurrentChord = async () => {
        if (!currentChord || isChordLoading) return;
        setIsChordLoading(true);
        setIsPlaying(true);
        try {
            const data = await getChordData(currentChord.root, currentChord.type);
            if (!data?.positions?.length) return;
            const pos      = data.positions[0];
            const rawFrets = pos.positions || [];
            const notesToPlay = rawFrets.reduce((acc: any[], fStr: string, i: number) => {
                const fret = fStr.toLowerCase() === 'x' ? -1 : parseInt(fStr, 10);
                if (fret >= 0) {
                    const sri      = CHROMATIC.indexOf(STD_TUNING[i]);
                    const baseOct  = Math.floor(STD_BASES[i] / 12) - 1;
                    const noteName = CHROMATIC[(sri + fret) % 12];
                    const octave   = baseOct + Math.floor((sri + fret) / 12);
                    acc.push({ note: noteName, octave, string: i });
                }
                return acc;
            }, []);
            const sorted = notesToPlay.sort((a: any, b: any) => (a.octave * 12 + CHROMATIC.indexOf(a.note)) - (b.octave * 12 + CHROMATIC.indexOf(b.note)));
            if (sorted.length > 0) playRealSound(sorted, true);
            const pd = buildPositionData(data);
            if (pd) { setPositionData(pd); setFretboardRoot(currentChord.root); }
            setHasPlayed(true);
        } catch (e) {
            console.error('Error playing chord:', e);
        } finally {
            setIsChordLoading(false);
            playTimeoutRef.current = setTimeout(() => setIsPlaying(false), 1200);
        }
    };

    const handleCheck = (option: string) => {
        if (status !== 'idle' || !hasPlayed) return;
        setSelectedOption(option);
        if (option === currentChord?.type) {
            setStatus('success');
            const next = streak + 1;
            setStreak(next);
            if (next > maxStreak) setMaxStreak(next);
        } else {
            setStatus('error');
            setStreak(0);
        }
    };

    const streakEmoji = streak >= 10 ? '🔥🔥' : streak >= 5 ? '🔥' : streak > 0 ? '✨' : '';
    const chordLabel  = currentChord ? `${currentChord.root} ${CHORD_LABELS[currentChord.type] || currentChord.type}` : '—';

    return (
        <>
            <style>{`
                @keyframes et-fadeInUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
                @keyframes et-slideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
                @keyframes et-ripple    { 0% { transform:translate(-50%,-50%) scale(0.5); opacity:0.6; } 100% { transform:translate(-50%,-50%) scale(2.8); opacity:0; } }
                @keyframes et-pulse     { 0%,100% { box-shadow:0 0 0 0 rgba(220,185,138,0.4); } 50% { box-shadow:0 0 0 12px rgba(220,185,138,0); } }
                @keyframes et-shake     { 0%,100% { transform:translateX(0); } 20%,60% { transform:translateX(-4px); } 40%,80% { transform:translateX(4px); } }
                @keyframes et-pop       { 0% { transform:scale(1); } 40% { transform:scale(1.06); } 100% { transform:scale(1); } }
                .et-btn { transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s; }
                .et-btn:hover:not(:disabled) { transform: translateY(-1px); }
                .et-success { animation: et-pop 0.25s ease; }
                .et-error   { animation: et-shake 0.3s ease; }
            `}</style>

            <div style={{ background: 'var(--surface)', borderRadius: '12px', color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden' }}>

                {/* ── Header bar ── */}
                <div style={{ padding: '1.1rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h2 style={{ color: 'var(--gold)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', margin: 0, letterSpacing: '0.04em', lineHeight: 1 }}>{t('title')}</h2>
                        <p style={{ color: 'var(--muted)', margin: '0.15rem 0 0', fontSize: '0.75rem' }}>{level.description}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                            {EAR_TRAINING_LEVELS.map(l => (
                                <button key={l.id} onClick={() => { setLevel(l); generateQuestion(l); setStreak(0); }} style={{ padding: '0.3rem 0.75rem', borderRadius: '100px', border: `1px solid ${level.id === l.id ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`, background: level.id === l.id ? 'var(--gold)' : 'transparent', color: level.id === l.id ? '#111' : 'var(--muted)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, transition: 'all 0.2s' }}>
                                    {t('level')} {l.id}
                                </button>
                            ))}
                        </div>
                        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '1.25rem', textAlign: 'right' }}>
                            <div style={{ fontSize: '0.55rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em' }}>{t('currentStreak')}</div>
                            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: streak > 0 ? 'var(--gold)' : 'var(--muted)', lineHeight: 1 }}>
                                {streak}{streakEmoji && <span style={{ fontSize: '0.9rem', marginLeft: '2px' }}>{streakEmoji}</span>}
                            </div>
                            {maxStreak > 0 && <div style={{ fontSize: '0.55rem', color: 'rgba(220,185,138,0.4)' }}>{t('record')} {maxStreak}</div>}
                        </div>
                    </div>
                </div>

                {/* ── Two-column body ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

                    {/* Left: play + fretboard */}
                    <div style={{ padding: '2rem 1.75rem', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isPlaying && (
                                <>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '96px', height: '96px', borderRadius: '50%', border: '2px solid rgba(220,185,138,0.5)', animation: 'et-ripple 1s ease-out forwards' }} />
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '96px', height: '96px', borderRadius: '50%', border: '2px solid rgba(220,185,138,0.3)', animation: 'et-ripple 1s ease-out 0.2s forwards' }} />
                                </>
                            )}
                            <button onClick={playCurrentChord} disabled={isChordLoading} style={{ width: '96px', height: '96px', borderRadius: '50%', background: isChordLoading ? 'rgba(255,255,255,0.03)' : 'rgba(220,185,138,0.06)', border: `2px solid ${isChordLoading ? 'rgba(255,255,255,0.15)' : 'var(--gold)'}`, color: isChordLoading ? 'var(--muted)' : 'var(--gold)', cursor: isChordLoading ? 'wait' : 'pointer', opacity: isChordLoading ? 0.5 : 1, transition: 'all 0.2s', animation: isPlaying ? 'et-pulse 1s ease infinite' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                onMouseEnter={e => { if (!isChordLoading) e.currentTarget.style.background = 'rgba(220,185,138,0.14)'; }}
                                onMouseLeave={e => { if (!isChordLoading) e.currentTarget.style.background = 'rgba(220,185,138,0.06)'; }}
                            >
                                {isChordLoading
                                    ? <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(220,185,138,0.2)', borderTopColor: 'var(--gold)', animation: 'et-ripple 0.7s linear infinite' }} />
                                    : <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3L19 12L5 21V3Z"/></svg>
                                }
                            </button>
                        </div>

                        <p style={{ color: 'var(--muted)', fontSize: '0.75rem', margin: 0, fontStyle: 'italic', textAlign: 'center' }}>
                            {!hasPlayed ? t('tapToListen') : status === 'idle' ? t('tapAgain') : status === 'success' ? t('correct') : t('incorrect')}
                        </p>

                        {/* Fretboard reveal */}
                        {status !== 'idle' && (
                            <div style={{ width: '100%', animation: 'et-slideDown 0.3s ease' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
                                    <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.06)' }} />
                                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: status === 'success' ? '#10b981' : 'var(--gold)', letterSpacing: '0.04em' }}>
                                        {chordLabel}
                                    </span>
                                    <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.06)' }} />
                                </div>
                                {positionData
                                    ? <MiniFretboard positionData={positionData} rootNote={fretboardRoot} chordDisplayMode="fingers" playRealSound={undefined} />
                                    : <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.78rem' }}>{t('tapToListen')}</div>
                                }
                            </div>
                        )}
                    </div>

                    {/* Right: options + next */}
                    <div style={{ padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.9rem' }}>
                        {!hasPlayed && (
                            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', textAlign: 'center', margin: '0 0 0.25rem', fontStyle: 'italic' }}>
                                {t('listenFirst')}
                            </p>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', opacity: hasPlayed ? 1 : 0.35, transition: 'opacity 0.2s' }}>
                            {stableOptions.map(opt => {
                                const isCorrect  = opt === currentChord?.type;
                                const isSelected = opt === selectedOption;
                                const revealed   = status !== 'idle';
                                let bg = 'rgba(255,255,255,0.03)', border = 'rgba(255,255,255,0.08)', color = 'var(--text)', animCls = '';
                                if (revealed) {
                                    if (isCorrect)       { bg = 'rgba(16,185,129,0.12)'; border = '#10b981'; color = '#10b981'; if (isSelected) animCls = 'et-success'; }
                                    else if (isSelected) { bg = 'rgba(239,68,68,0.12)';  border = '#ef4444'; color = '#ef4444'; animCls = 'et-error'; }
                                }
                                return (
                                    <button key={opt} className={`et-btn ${animCls}`}
                                        disabled={status !== 'idle' || !hasPlayed}
                                        onClick={() => handleCheck(opt)}
                                        style={{ padding: '1rem 0.75rem', borderRadius: '10px', background: bg, border: `1px solid ${border}`, color, fontWeight: 700, fontSize: '0.88rem', fontFamily: 'DM Sans, sans-serif', cursor: (status === 'idle' && hasPlayed) ? 'pointer' : 'not-allowed' }}
                                    >
                                        {CHORD_LABELS[opt] || opt}
                                    </button>
                                );
                            })}
                        </div>

                        {status !== 'idle' && (
                            <button onClick={() => generateQuestion()} style={{ padding: '0.75rem', borderRadius: '100px', background: 'var(--gold)', color: '#111', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.04em', boxShadow: '0 4px 14px rgba(220,185,138,0.25)', animation: 'et-fadeInUp 0.25s ease', transition: 'opacity 0.15s', marginTop: '0.25rem' }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                                {t('nextChord')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}