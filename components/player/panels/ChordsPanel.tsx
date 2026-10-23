"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Fretboard } from '@/components/player/Fretboard';
import { MiniFretboard } from '@/components/player/MiniFretboard';
import { useTranslations } from 'next-intl';
import { getChordData, getChordOptions } from '@/app/actions/chords';
import { useAudioSynth } from '@/hooks/useAudioSynth';
import { CHROMATIC_NOTES, STANDARD_TUNING, ENHARMONICS, BASIC_SUFFIXES } from '@/lib/constants';
import styles from './ChordsPanel.module.css';

const getChordTones = (root: string, suffix: string) => {
    const rootIdx = CHROMATIC_NOTES.indexOf(root);
    if (rootIdx === -1) return [];
    
    let intervals = [0, 4, 7];
    if (suffix === 'm') intervals = [0, 3, 7];
    else if (suffix === '7') intervals = [0, 4, 7, 10];
    else if (suffix === 'm7') intervals = [0, 3, 7, 10];
    else if (suffix === 'maj7') intervals = [0, 4, 7, 11];
    else if (suffix === 'sus2') intervals = [0, 2, 7];
    else if (suffix === 'sus4') intervals = [0, 5, 7];
    else if (suffix === '5') intervals = [0, 7];
    else if (suffix === 'dim') intervals = [0, 3, 6];
    else if (suffix === 'aug') intervals = [0, 4, 8];
    else if (suffix === 'm7b5') intervals = [0, 3, 6, 10];
    else if (suffix === 'dim7') intervals = [0, 3, 6, 9];

    return intervals.map(i => CHROMATIC_NOTES[(rootIdx + i) % 12]);
};

export function ChordsPanel() {
    const t = useTranslations('ChordsPanel');
    const [optionsMap, setOptionsMap] = useState<Record<string, string[]>>({});
    
    const [rootNote, setRootNote] = useState('C');
    const [baseSuffix, setBaseSuffix] = useState('major');
    const [activeBass, setActiveBass] = useState<string | null>(null);
    
    const [positionIndex, setPositionIndex] = useState(0);
    const [chordDisplayMode, setChordDisplayMode] = useState<'notes' | 'fingers'>('fingers');
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);
    const [isGridView, setIsGridView] = useState(false);

    const [rawChord, setRawChord] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const { playRealSound } = useAudioSynth();

    useEffect(() => {
        getChordOptions().then(setOptionsMap);
    }, []);

    useEffect(() => {
        setLoading(true);
        
        const finalSuffix = activeBass 
            ? (baseSuffix === 'major' ? activeBass : `${baseSuffix}${activeBass}`)
            : baseSuffix;

        getChordData(rootNote, finalSuffix).then((data) => {
            setRawChord(data);
            setPositionIndex(0);
            setLoading(false);
        });
    }, [rootNote, baseSuffix, activeBass]);

    const handleRootChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRootNote(e.target.value);
        setBaseSuffix('major');
        setActiveBass(null);
    };

    const handleBaseSuffixChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setBaseSuffix(e.target.value);
        setActiveBass(null);
    };

    const handleBassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val !== 'custom') {
            setActiveBass(val === 'fundamental' ? null : val);
        }
    };

    const handleModeToggle = () => {
        const newMode = !isAdvancedMode;
        setIsAdvancedMode(newMode);
        if (!newMode) {
            setActiveBass(null);
            if (!BASIC_SUFFIXES.includes(baseSuffix)) {
                setBaseSuffix('major');
            }
        }
    };

    const rootSuffixes = optionsMap[rootNote] || [];
    
    const availableBaseSuffixes = useMemo(() => {
        const filtered = rootSuffixes.filter(s => !s.includes('/'));
        return isAdvancedMode ? filtered : filtered.filter(s => BASIC_SUFFIXES.includes(s));
    }, [rootSuffixes, isAdvancedMode]);

    const availableInversions = useMemo(() => {
        return rootSuffixes
            .filter(s => {
                if (baseSuffix === 'major') {
                    return s.startsWith('/') && s.indexOf('/', 1) === -1;
                }
                return s.startsWith(`${baseSuffix}/`);
            })
            .map(s => {
                return baseSuffix === 'major' ? s : s.replace(baseSuffix, '');
            });
    }, [rootSuffixes, baseSuffix]);

    const naturalTones = useMemo(() => {
        return getChordTones(rootNote, baseSuffix);
    }, [rootNote, baseSuffix]);

    const inversionOptions = useMemo(() => {
        const options = [{ label: t('fundamental'), value: 'fundamental' }];
        naturalTones.forEach((tone, idx) => {
            if (idx === 0) return;
            const matchingInv = availableInversions.find(inv => {
                const bassStr = inv.replace('/', '');
                return bassStr === tone || ENHARMONICS[bassStr] === tone || ENHARMONICS[tone] === bassStr;
            });
            if (matchingInv) {
                options.push({
                    label: t('inversionOption', { idx, inv: matchingInv }),
                    value: matchingInv
                });
            }
        });
        return options;
    }, [naturalTones, availableInversions, t]);

    const dd1Value = activeBass === null ? 'fundamental' : (inversionOptions.some(o => o.value === activeBass) ? activeBass : 'custom');

    const chordPositions = useMemo(() => {
        if (!rawChord || !rawChord.positions || !rawChord.positions.length) return [];

        const getLowestFret = (posObj: any) => {
            const frets = posObj.positions || posObj.frets || [];
            const playedFrets = frets
                .map((f: any) => {
                    const str = String(f).toLowerCase();
                    return (str === 'x' || str === '0' || str === '-1') ? -1 : parseInt(str, 10);
                })
                .filter((f: number) => f > 0);
            return playedFrets.length > 0 ? Math.min(...playedFrets) : 0;
        };

        const sortedPositions = [...rawChord.positions].sort((a, b) => getLowestFret(a) - getLowestFret(b));

        return sortedPositions.map((position) => {
            const rawFrets = position.positions || [];
            const rawFingers = (position.fingerings && position.fingerings.length > 0) 
                ? position.fingerings[0] 
                : [];

            let fingersArr: number[] = [];
            if (Array.isArray(rawFingers)) {
                fingersArr = rawFingers.map((f: any) => {
                    if (typeof f === 'string' && f.toLowerCase() === 'x') return 0;
                    return parseInt(f, 10) || 0;
                });
            }

            const activeNotesList = rawFrets.reduce((acc: any[], fretVal: any, stringIndex: number) => {
                const fretStr = String(fretVal).toLowerCase();
                const fretNum = fretStr === 'x' ? -1 : parseInt(fretStr, 10);
                
                if (fretNum >= -1) {
                    const fingerNum = fingersArr[stringIndex] || 0;
                    acc.push({ string: 5 - stringIndex, fret: fretNum, finger: isNaN(fingerNum) ? 0 : fingerNum });
                }
                return acc;
            }, []);

            const absoluteFretsForDisplay = rawFrets.map((f: any) => {
                const fStr = String(f).toLowerCase();
                if (fStr === 'x' || fStr === '-1') return 'X';
                return parseInt(fStr, 10);
            });

            const absoluteBarres: number[] = [];
            const barreCandidates: Record<string, { fret: number, strings: number[] }> = {};

            rawFingers.forEach((f: any, stringIndex: number) => {
                const fingerNum = parseInt(f, 10);
                const fretStr = String(rawFrets[stringIndex]).toLowerCase();
                const fretNum = (fretStr === 'x' || fretStr === '0' || fretStr === '-1') ? -1 : parseInt(fretStr, 10);

                if (fingerNum > 0 && fretNum > 0) {
                    const key = `${fingerNum}_${fretNum}`;
                    if (!barreCandidates[key]) {
                        barreCandidates[key] = { fret: fretNum, strings: [] };
                    }
                    barreCandidates[key].strings.push(stringIndex);
                }
            });

            Object.values(barreCandidates).forEach(candidate => {
                if (candidate.strings.length > 1) {
                    if (!absoluteBarres.includes(candidate.fret)) {
                        absoluteBarres.push(candidate.fret);
                    }
                }
            });

            const bassStringIdx = rawFrets.findIndex((f: any) => String(f).toLowerCase() !== 'x');
            let isInversion = false;
            let bassNoteName = rootNote;

            if (bassStringIdx !== -1) {
                const bassFretStr = String(rawFrets[bassStringIdx]).toLowerCase();
                const bassFret = bassFretStr === 'x' ? 0 : parseInt(bassFretStr, 10);
                
                const openNoteIdx = CHROMATIC_NOTES.indexOf(STANDARD_TUNING[bassStringIdx]);
                bassNoteName = CHROMATIC_NOTES[(openNoteIdx + bassFret) % 12];

                const normRoot = ENHARMONICS[rootNote] || rootNote;
                const normBass = ENHARMONICS[bassNoteName] || bassNoteName;

                isInversion = normRoot !== normBass;
            }

            let displayName = baseSuffix === 'major' ? rootNote : `${rootNote}${baseSuffix}`;
            if (activeBass) {
                displayName += activeBass;
            }

            return {
                name: displayName,
                activeNotesList,
                absoluteBarres,
                fingers: fingersArr,
                originalFrets: absoluteFretsForDisplay,
                isInversion,
                bassNoteName
            };
        });
    }, [rawChord, rootNote, baseSuffix, activeBass]);

    const rootKeys = Object.keys(optionsMap);
    const currentChordData = chordPositions.length > 0 ? chordPositions[Math.min(positionIndex, chordPositions.length - 1)] : null;

    return (
        <div className={styles.titleBox}>
            <div className={styles.titleRow}>
                <h2 className={styles.titleHeading}>
                    {t('title')}
                </h2>

                <div className={styles.rootRow}>
                    
                    <div className={styles.rootStack}>
                        <span className={styles.rootLabel}>{t('root')}</span>
                        <select
                            value={rootNote}
                            onChange={handleRootChange}
                            disabled={rootKeys.length === 0}
                            className={styles.select}
                        >
                            {rootKeys.map(note => (
                                <option key={note} value={note} className={styles.option}>{note}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.rootStack}>
                        <span className={styles.rootLabel}>{t('type')}</span>
                        <select
                            value={baseSuffix}
                            onChange={handleBaseSuffixChange}
                            disabled={availableBaseSuffixes.length === 0}
                            className={styles.rootStackSelect}
                        >
                            {availableBaseSuffixes.map(s => (
                                <option key={s} value={s} className={styles.option}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {isAdvancedMode && (
                        <>
                            <div className={styles.rootStack}>
                                <span className={styles.rootLabel}>{t('inversionLabel')}</span>
                                <select
                                    value={dd1Value}
                                    onChange={handleBassChange}
                                    disabled={inversionOptions.length <= 1}
                                    className={styles.select3}
                                >
                                    {dd1Value === 'custom' && <option value="custom" className={styles.option}>--</option>}
                                    {inversionOptions.map(opt => (
                                        <option key={opt.value} value={opt.value} className={styles.option}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.rootStack}>
                                <span className={styles.rootLabel}>{t('bass')}</span>
                                <select
                                    value={activeBass || 'fundamental'}
                                    onChange={handleBassChange}
                                    disabled={availableInversions.length === 0}
                                    className={styles.fundamentalShortSelect}
                                >
                                    <option value="fundamental" className={styles.option}>{t('fundamentalShort')}</option>
                                    {availableInversions.map(inv => {
                                        const bassNoteStr = inv.replace('/', '');
                                        const isNatural = naturalTones.includes(bassNoteStr) || naturalTones.includes(ENHARMONICS[bassNoteStr] || '');
                                        return (
                                            <option key={inv} value={inv} className={styles.option}>
                                                {inv}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </>
                    )}

                    <div className={styles.advancedModeOnRow}>
                        <button
                            onClick={handleModeToggle}
                            className={styles.advancedModeOnButton} style={{ background: isAdvancedMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)', color: isAdvancedMode ? '#fcd34d' : 'var(--muted)', border: `1px solid ${isAdvancedMode ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255,255,255,0.1)'}` }}
                        >
                            {isAdvancedMode ? t('advancedModeOn') : t('advancedModeOff')}
                        </button>
                    </div>

                    <div className={styles.box} />

                    <div className={styles.detailRow}>
                        <button
                            onClick={() => setIsGridView(false)}
                            className={styles.detailButton} style={{ background: !isGridView ? 'rgba(52, 211, 153, 0.2)' : 'transparent', color: !isGridView ? '#34d399' : 'var(--muted)' }}
                        >
                            {t('detail')}
                        </button>
                        <button
                            onClick={() => setIsGridView(true)}
                            className={styles.detailButton} style={{ background: isGridView ? 'rgba(52, 211, 153, 0.2)' : 'transparent', color: isGridView ? '#34d399' : 'var(--muted)' }}
                        >
                            {t('positions')}
                        </button>
                    </div>

                    <div className={styles.detailRow}>
                        <button
                            onClick={() => setChordDisplayMode('fingers')}
                            className={styles.detailButton} style={{ background: chordDisplayMode === 'fingers' ? 'rgba(167,139,250,0.2)' : 'transparent', color: chordDisplayMode === 'fingers' ? '#c4b5fd' : 'var(--muted)' }}
                        >
                            {t('fingers')}
                        </button>
                        <button
                            onClick={() => setChordDisplayMode('notes')}
                            className={styles.detailButton} style={{ background: chordDisplayMode === 'notes' ? 'rgba(167,139,250,0.2)' : 'transparent', color: chordDisplayMode === 'notes' ? '#c4b5fd' : 'var(--muted)' }}
                        >
                            {t('notes')}
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.loadingBox}>
                {loading ? (
                    <div className={styles.loading}>{t('loading')}</div>
                ) : (
                    <>
                        <div className={styles.notFoundRow}>

                            <div className={styles.notFoundRow2}>
                                <h3 className={styles.notFoundSubheading}>
                                    {currentChordData ? currentChordData.name : t('notFound')}
                                </h3>

                                {currentChordData?.isInversion && (
                                    <span className={styles.inversionLabel}>
                                        {t('inversion', { note: currentChordData.bassNoteName })}
                                    </span>
                                )}
                            </div>

                            {!isGridView && chordPositions.length > 1 && (
                                <div className={styles.positionRow}>
                                    <button
                                        onClick={() => setPositionIndex(p => Math.max(0, p - 1))}
                                        disabled={positionIndex === 0}
                                        className={styles.button} style={{ background: positionIndex === 0 ? 'transparent' : 'rgba(167,139,250,0.15)', color: positionIndex === 0 ? 'rgba(255,255,255,0.2)' : '#c4b5fd', cursor: positionIndex === 0 ? 'not-allowed' : 'pointer' }}
                                    >
                                        &#10094;
                                    </button>

                                    <span className={styles.positionLabel}>
                                        {t('position', { current: Math.min(positionIndex, chordPositions.length - 1) + 1, total: chordPositions.length })}
                                    </span>

                                    <button
                                        onClick={() => setPositionIndex(p => Math.min(chordPositions.length - 1, p + 1))}
                                        disabled={positionIndex === chordPositions.length - 1}
                                        className={styles.button} style={{ background: positionIndex === chordPositions.length - 1 ? 'transparent' : 'rgba(167,139,250,0.15)', color: positionIndex === chordPositions.length - 1 ? 'rgba(255,255,255,0.2)' : '#c4b5fd', cursor: positionIndex === chordPositions.length - 1 ? 'not-allowed' : 'pointer' }}
                                    >
                                        &#10095;
                                    </button>
                                </div>
                            )}
                        </div>

                        {chordPositions.length > 0 && (
                            <div className={styles.positionStack}>
                                
                                {isGridView ? (
                                    <div className={styles.positionGrid}>
                                        {chordPositions.map((pos, idx) => (
                                            <div key={idx} className={styles.positionStack2}>
                                                <div className={styles.position}>
                                                    {t('position', { current: idx + 1, total: chordPositions.length })}
                                                </div>
                                                <MiniFretboard 
                                                    positionData={pos}
                                                    rootNote={rootNote}
                                                    chordDisplayMode={chordDisplayMode}
                                                    playRealSound={playRealSound}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={styles.block}>
                                        <Fretboard
                                            activeNotesList={currentChordData?.activeNotesList}
                                            rootNote={rootNote}
                                            scaleData={{ intervalAliases: {} }}
                                            labelMode="notes"
                                            isChordMode={true}
                                            chordDisplayMode={chordDisplayMode}
                                            absoluteBarres={currentChordData?.absoluteBarres}
                                            playRealSound={playRealSound} 
                                            t={t}
                                        />
                                    </div>
                                )}

                                <div className={styles.fingerIndexRow}>
                                    <div className={styles.fingerIndexRow2}>
                                        <div className={styles.dot} />
                                        <span className={styles.fingerIndexLabel}>{t('fingerIndex')}</span>
                                    </div>
                                    <div className={styles.fingerIndexRow2}>
                                        <div className={styles.fingerIndexRowDot} />
                                        <span className={styles.fingerIndexLabel}>{t('fingerMiddle')}</span>
                                    </div>
                                    <div className={styles.fingerIndexRow2}>
                                        <div className={styles.dot3} />
                                        <span className={styles.fingerIndexLabel}>{t('fingerRing')}</span>
                                    </div>
                                    <div className={styles.fingerPinkyRow}>
                                        <div className={styles.fingerPinkyRowDot} />
                                        <span className={styles.fingerIndexLabel}>{t('fingerPinky')}</span>
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