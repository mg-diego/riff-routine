"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Fretboard } from './Fretboard';
import { useTranslations } from 'next-intl';
import { getChordData, getChordOptions } from '@/app/actions/chords';

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ENHARMONICS: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
const STD_TUNING = ['E', 'A', 'D', 'G', 'B', 'E'];

export function ChordsPanel() {
    const t = useTranslations('ChordsPanel');
    const [rootNote, setRootNote] = useState('C');
    const [suffix, setSuffix] = useState('major');
    const [positionIndex, setPositionIndex] = useState(0);
    const [chordDisplayMode, setChordDisplayMode] = useState<'notes' | 'fingers'>('fingers');

    const [options, setOptions] = useState<{ keys: string[], suffixes: string[] }>({ keys: [], suffixes: [] });
    const [rawChord, setRawChord] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getChordOptions().then(setOptions);
    }, []);

    useEffect(() => {
        setLoading(true);
        getChordData(rootNote, suffix).then((data) => {
            setRawChord(data);
            setPositionIndex(0);
            setLoading(false);
        });
    }, [rootNote, suffix]);

    const handleRootChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRootNote(e.target.value);
    };

    const handleSuffixChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSuffix(e.target.value);
    };

    const chordData = useMemo(() => {
        if (!rawChord || !rawChord.positions.length) return null;

        const safeIndex = Math.min(positionIndex, rawChord.positions.length - 1);
        const position = rawChord.positions[safeIndex];

        let fingersArr: number[] = [];
        if (Array.isArray(position.fingers)) {
            fingersArr = position.fingers;
        } else if (typeof position.fingers === 'string') {
            fingersArr = position.fingers.split('').map(Number);
        }

        const activeNotesList = position.frets.reduce((acc: any[], fretNum: number, stringIndex: number) => {
            if (fretNum > 0) {
                const absoluteFret = fretNum + position.baseFret - 1;
                const fingerNum = fingersArr[stringIndex] || 0;
                acc.push({ string: 5 - stringIndex, fret: absoluteFret, finger: isNaN(fingerNum) ? 0 : fingerNum });
            }
            return acc;
        }, []);

        const absoluteFretsForDisplay = position.frets.map((f: number) => {
            if (f === -1) return 'X';
            if (f === 0) return '0';
            return f + position.baseFret - 1;
        });

        const rawBarres = Array.isArray(position.barres) ? position.barres : (position.barres != null ? [position.barres] : []);
        const absoluteBarres = rawBarres.map((b: any) => parseInt(b.toString(), 10) + position.baseFret - 1);

        const bassStringIdx = position.frets.findIndex((f: number) => f !== -1);
        let isInversion = false;
        let bassNoteName = rootNote;

        if (bassStringIdx !== -1) {
            const bassFret = position.frets[bassStringIdx];
            const absFret = bassFret === 0 ? 0 : bassFret + position.baseFret - 1;
            const openNoteIdx = CHROMATIC.indexOf(STD_TUNING[bassStringIdx]);
            bassNoteName = CHROMATIC[(openNoteIdx + absFret) % 12];

            const normRoot = ENHARMONICS[rootNote] || rootNote;
            const normBass = ENHARMONICS[bassNoteName] || bassNoteName;

            isInversion = normRoot !== normBass;
        }

        return {
            name: `${rootNote} ${suffix}`,
            activeNotesList,
            absoluteBarres,
            fingers: fingersArr,
            originalFrets: absoluteFretsForDisplay,
            totalPositions: rawChord.positions.length,
            currentIndex: safeIndex,
            isInversion,
            bassNoteName
        };
    }, [rawChord, positionIndex, rootNote, suffix]);

    const dummyFn = () => { };

    return (
        <div style={{ padding: '2rem', background: 'var(--surface)', borderRadius: '12px', color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ color: 'var(--gold)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', margin: 0, letterSpacing: '0.04em' }}>
                    {t('title')}
                </h2>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <select
                        value={rootNote}
                        onChange={handleRootChange}
                        disabled={options.keys.length === 0}
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--text)', padding: '0.5rem 1rem', borderRadius: '8px',
                            fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', outline: 'none', cursor: 'pointer'
                        }}
                    >
                        {options.keys.map(note => (
                            <option key={note} value={note} style={{ background: '#111' }}>{note}</option>
                        ))}
                    </select>

                    <select
                        value={suffix}
                        onChange={handleSuffixChange}
                        disabled={options.suffixes.length === 0}
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--text)', padding: '0.5rem 1rem', borderRadius: '8px',
                            fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', outline: 'none', cursor: 'pointer',
                            maxWidth: '150px'
                        }}
                    >
                        {options.suffixes.map(s => (
                            <option key={s} value={s} style={{ background: '#111' }}>{s}</option>
                        ))}
                    </select>

                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.2rem' }}>
                        <button
                            onClick={() => setChordDisplayMode('fingers')}
                            style={{
                                background: chordDisplayMode === 'fingers' ? 'rgba(167,139,250,0.2)' : 'transparent',
                                color: chordDisplayMode === 'fingers' ? '#c4b5fd' : 'var(--muted)',
                                border: 'none', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            {t('fingers')}
                        </button>
                        <button
                            onClick={() => setChordDisplayMode('notes')}
                            style={{
                                background: chordDisplayMode === 'notes' ? 'rgba(167,139,250,0.2)' : 'transparent',
                                color: chordDisplayMode === 'notes' ? '#c4b5fd' : 'var(--muted)',
                                border: 'none', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            {t('notes')}
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>

                {loading ? (
                    <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--muted)' }}>{t('loading')}</div>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                                <h3 style={{
                                    fontFamily: 'Bebas Neue, sans-serif',
                                    fontSize: '3rem',
                                    margin: 0,
                                    color: 'var(--text)',
                                    lineHeight: 1,
                                    textTransform: 'none'
                                }}>
                                    {chordData ? chordData.name : t('notFound')}
                                </h3>

                                {chordData?.isInversion && (
                                    <span style={{
                                        fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d',
                                        padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 700, letterSpacing: '0.05em', border: '1px solid rgba(245, 158, 11, 0.3)'
                                    }}>
                                        {t('inversion', { note: chordData.bassNoteName })}
                                    </span>
                                )}
                            </div>

                            {chordData && chordData.totalPositions > 1 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <button
                                        onClick={() => setPositionIndex(p => Math.max(0, p - 1))}
                                        disabled={chordData.currentIndex === 0}
                                        style={{
                                            background: chordData.currentIndex === 0 ? 'transparent' : 'rgba(167,139,250,0.15)',
                                            border: 'none', borderRadius: '6px', width: '32px', height: '32px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: chordData.currentIndex === 0 ? 'rgba(255,255,255,0.2)' : '#c4b5fd',
                                            cursor: chordData.currentIndex === 0 ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                    </button>

                                    <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 600, minWidth: '80px', textAlign: 'center' }}>
                                        {t('position', { current: chordData.currentIndex + 1, total: chordData.totalPositions })}
                                    </span>

                                    <button
                                        onClick={() => setPositionIndex(p => Math.min(chordData.totalPositions - 1, p + 1))}
                                        disabled={chordData.currentIndex === chordData.totalPositions - 1}
                                        style={{
                                            background: chordData.currentIndex === chordData.totalPositions - 1 ? 'transparent' : 'rgba(167,139,250,0.15)',
                                            border: 'none', borderRadius: '6px', width: '32px', height: '32px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: chordData.currentIndex === chordData.totalPositions - 1 ? 'rgba(255,255,255,0.2)' : '#c4b5fd',
                                            cursor: chordData.currentIndex === chordData.totalPositions - 1 ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        {chordData && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'flex-start' }}>

                                <div style={{ width: '100%', overflowX: 'auto' }}>
                                    <Fretboard
                                        activeNotesList={chordData.activeNotesList}
                                        rootNote={rootNote}
                                        scaleData={{ intervalAliases: {} }}
                                        scaleNotes={[]}
                                        getIntervalColor={() => '#c4b5fd'}
                                        showGhostNotes={false}
                                        labelMode="notes"
                                        leftyMode={false}
                                        isEditingPos={false}
                                        t={t}
                                        initAudio={dummyFn}
                                        playFreq={dummyFn}
                                        getNoteFrequency={() => 0}
                                        setDraftPosNotes={dummyFn}
                                        setIsEditingPos={dummyFn}
                                        handleExportCustomPosition={dummyFn}
                                        isChordMode={true}
                                        chordDisplayMode={chordDisplayMode}
                                        absoluteBarres={chordData.absoluteBarres}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }} />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('fingerIndex')}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('fingerMiddle')}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('fingerRing')}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('fingerPinky')}</span>
                                    </div>
                                </div>

                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}