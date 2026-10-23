"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useAudioSynth } from '@/hooks/useAudioSynth';
import { getChordData } from '@/app/actions/chords';
import { EAR_TRAINING_LEVELS, CHORD_LABELS } from '@/lib/audioExercises';
import { MiniFretboard } from '@/components/player/MiniFretboard';
import { CHROMATIC_NOTES } from '@/lib/constants';
import styles from './EarTrainingPanel.module.css';
import { cx } from '@/lib/cx';

const ROOTS      = ["C", "D", "E", "F", "G", "A", "B"];
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
                    const sri      = CHROMATIC_NOTES.indexOf(STD_TUNING[i]);
                    const baseOct  = Math.floor(STD_BASES[i] / 12) - 1;
                    const noteName = CHROMATIC_NOTES[(sri + fret) % 12];
                    const octave   = baseOct + Math.floor((sri + fret) / 12);
                    acc.push({ note: noteName, octave, string: i });
                }
                return acc;
            }, []);
            const sorted = notesToPlay.sort((a: any, b: any) => (a.octave * 12 + CHROMATIC_NOTES.indexOf(a.note)) - (b.octave * 12 + CHROMATIC_NOTES.indexOf(b.note)));
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

            <div className={styles.titleBox}>

                {/* ── Header bar ── */}
                <div className={styles.titleRow}>
                    <div>
                        <h2 className={styles.titleHeading}>{t('title')}</h2>
                        <p className={styles.text}>{level.description}</p>
                    </div>
                    <div className={styles.levelRow}>
                        <div className={styles.levelRow2}>
                            {EAR_TRAINING_LEVELS.map(l => (
                                <button key={l.id} onClick={() => { setLevel(l); generateQuestion(l); setStreak(0); }} className={styles.levelButton} style={{ border: `1px solid ${level.id === l.id ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`, background: level.id === l.id ? 'var(--gold)' : 'transparent', color: level.id === l.id ? '#111' : 'var(--muted)' }}>
                                    {t('level')} {l.id}
                                </button>
                            ))}
                        </div>
                        <div className={styles.currentStreak}>
                            <div className={styles.currentStreak2}>{t('currentStreak')}</div>
                            <div className={styles.block} style={{ color: streak > 0 ? 'var(--gold)' : 'var(--muted)' }}>
                                {streak}{streakEmoji && <span className={styles.label}>{streakEmoji}</span>}
                            </div>
                            {maxStreak > 0 && <div className={styles.record}>{t('record')} {maxStreak}</div>}
                        </div>
                    </div>
                </div>

                {/* ── Two-column body ── */}
                <div className={styles.tapToListenGrid}>

                    {/* Left: play + fretboard */}
                    <div className={styles.tapToListenStack}>
                        <div className={styles.row}>
                            {isPlaying && (
                                <>
                                    <div className={styles.layer} />
                                    <div className={styles.tapToListenStackLayer} />
                                </>
                            )}
                            <button onClick={playCurrentChord} disabled={isChordLoading}
                                className={cx(styles.button, isChordLoading && styles.buttonLoading, isPlaying && styles.buttonPlaying)}>
                                {isChordLoading
                                    ? <div className={styles.dot} />
                                    : <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3L19 12L5 21V3Z"/></svg>
                                }
                            </button>
                        </div>

                        <p className={styles.tapToListenText}>
                            {!hasPlayed ? t('tapToListen') : status === 'idle' ? t('tapAgain') : status === 'success' ? t('correct') : t('incorrect')}
                        </p>

                        {/* Fretboard reveal */}
                        {status !== 'idle' && (
                            <div className={styles.tapToListen}>
                                <div className={styles.chordLabelRow}>
                                    <div className={styles.box} />
                                    <span className={styles.chordLabel} style={{ color: status === 'success' ? '#10b981' : 'var(--gold)' }}>
                                        {chordLabel}
                                    </span>
                                    <div className={styles.box} />
                                </div>
                                {positionData
                                    ? <MiniFretboard positionData={positionData} rootNote={fretboardRoot} chordDisplayMode="fingers" playRealSound={undefined} />
                                    : <div className={styles.tapToListenBox}>{t('tapToListen')}</div>
                                }
                            </div>
                        )}
                    </div>

                    {/* Right: options + next */}
                    <div className={styles.listenFirstStack}>
                        {!hasPlayed && (
                            <p className={styles.listenFirstText}>
                                {t('listenFirst')}
                            </p>
                        )}

                        <div className={styles.grid} style={{ opacity: hasPlayed ? 1 : 0.35 }}>
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
                                    <button key={opt} className={cx(`${styles['et-btn']} ${animCls}`, styles.listenFirstStackButton)}
                                        disabled={status !== 'idle' || !hasPlayed}
                                        onClick={() => handleCheck(opt)}
                                        style={{ background: bg, border: `1px solid ${border}`, color, cursor: (status === 'idle' && hasPlayed) ? 'pointer' : 'not-allowed' }}
                                    >
                                        {CHORD_LABELS[opt] || opt}
                                    </button>
                                );
                            })}
                        </div>

                        {status !== 'idle' && (
                            <button onClick={() => generateQuestion()} className={styles.nextChordButton}
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