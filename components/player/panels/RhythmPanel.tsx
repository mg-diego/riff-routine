"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { AlphaTabApiRef } from '@/hooks/useAlphaTab';
import styles from './RhythmPanel.module.css';
import { cx } from '@/lib/cx';

interface RhythmPanelProps {
    apiRef: AlphaTabApiRef;
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
    <div className={styles.row}>
        {num && (
            <div className={styles.row2}>
                <span className={styles.label} />
                <span className={styles.label2}>{num}</span>
                <span className={styles.label3} />
            </div>
        )}
        <span className={styles.noteLabel}>{note}</span>
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
        let tex = `\\title "rhythm Generator"\n\\subtitle "Focus & Timing"\n\\tempo 80\n.\n`;

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
        <div className={styles.titleBox}>
            
            <div className={styles.titleRow}>
                <div>
                    <h3 className={styles.titleSubheading}>
                        {t('title')}
                    </h3>
                    <p className={styles.descriptionText}>
                        {t('description')}
                    </p>
                </div>
                
                <div className={styles.generateRow}>
                    
                    <div ref={dropdownRef} className={styles.block}>
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={styles.button}
                        >
                            {t(`levels.${difficulty}`)}
                            <span className={styles.generateRowLabel} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                        </button>

                        {isDropdownOpen && (
                            <div className={styles.layer}>
                                {[1, 2, 3, 4, 5].map(lvl => {
                                    const isActive = lvl === difficulty;
                                    return (
                                        <button
                                            key={lvl}
                                            onClick={() => {
                                                setDifficulty(lvl);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={cx(styles.generateRowButton, isActive && styles.generateRowButtonActive)}
                                        >
                                            {t(`levels.${lvl}`)}
                                            {isActive && <span className={styles.generateRowButtonLabel}>✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleGenerateRandom}
                        className={styles.generateButton}
                    >
                        {t('generate')}
                    </button>
                </div>
            </div>

            <div className={styles.sequencePreviewBox}>
                <p className={styles.sequencePreviewText}>
                    {t('sequencePreview')}
                </p>
                
                <div className={styles.symbolRow}>
                    {sequence.map((measure, index) => (
                        <React.Fragment key={measure.uid}>
                            <div className={styles.row4}>
                                <span className={styles.symbolLabel}>
                                    <span className={styles.label8}>{measure.symbol}</span>
                                    {measure.label}
                                </span>
                                <button 
                                    onClick={() => handleRemoveMeasure(measure.uid)}
                                    disabled={sequence.length === 1}
                                    className={styles.sequencePreviewBoxButton}
                                >
                                    ✕
                                </button>
                            </div>
                            {index < sequence.length - 1 && <span className={styles.sequencePreviewBoxLabel}>➔</span>}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div>
                <p className={styles.addMeasureText}>
                    {t('addMeasure')}
                </p>
                <div className={styles.grid}>
                    {SUBDIVISIONS.map(sub => (
                        <button
                            key={sub.id}
                            onClick={() => handleAddMeasure(sub.id)}
                            className={styles.symbolButton}
                        >
                            <span className={styles.noteLabel}>{sub.symbol}</span>
                            + {sub.label}
                        </button>
                    ))}
                </div>
                <p className={styles.tipsText}>
                    {t('tips')}
                </p>
            </div>

        </div>
    );
}