"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CHROMATIC_NOTES, INTERVAL_NAMES, PREDEFINED_COLORS, SCALES, getIntervalColor as resolveIntervalColor } from '@/lib/constants';
import { useScaleLogic } from '@/hooks/useScaleLogic';
import { SmartFretboard } from '@/components/player/SmartFretboard';
import styles from './ScalesPanel.module.css';
import { cx } from '@/lib/cx';

const COLOR_KEYS: Record<string, string> = {
  '#7f8c8d': 'grey', '#e74c3c': 'red', '#3498db': 'blue', '#2ecc71': 'green',
  '#f1c40f': 'yellow', '#9b59b6': 'purple', '#e67e22': 'orange', '#e84393': 'pink'
};

const COMPARE_COLOR_A = '#3b82f6';
const COMPARE_COLOR_B = '#f43f5e';

// Selects share one class; only the compare-mode accent border is dynamic
const accentStyle = (accent?: string) =>
  (accent ? { '--select-accent': accent } : undefined) as React.CSSProperties | undefined;

export function ScalesPanel() {
  const t = useTranslations('ScalesPanel');
  const mc = useTranslations('MusicConstants');

  const [rootNote, setRootNote] = useState('A');
  const [scaleKey, setScaleKey] = useState('pentatonic-minor');
  const [rootNoteB, setRootNoteB] = useState('A');
  const [scaleKeyB, setScaleKeyB] = useState('pentatonic-major');

  const [compareMode, setCompareMode] = useState(false);
  const [chordType, setChordType] = useState<'triads' | 'tetrads'>('triads');
  const [userColors, setUserColors] = useState<Record<number, string>>({});
  const [showTheory, setShowTheory] = useState(false);

  const { scaleData, scaleNotes } = useScaleLogic(rootNote, scaleKey, 'full', t);
  const { scaleNotes: scaleNotesB } = useScaleLogic(rootNoteB, scaleKeyB, 'full', t);

  const getIntervalColor = (interval: number) => resolveIntervalColor(interval, userColors);
  const handleColorChange = (interval: number, color: string) =>
    setUserColors(prev => ({ ...prev, [interval]: color }));

  const CATEGORY_ORDER = [
    'major-scale-modes',
    'minor-scales',
    'pentatonics',
    'triads',
    'arpeggios',    
    'hirajoshi-modes',
    'exotic',
    'others'
  ];

  const scaleSortedKeys = Object.keys(SCALES).sort((a, b) => {
    const orderA = SCALES[a].order || 999;
    const orderB = SCALES[b].order || 999;

    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return mc(`scales.${a}.name`).localeCompare(mc(`scales.${b}.name`));
  });

  const groupedScales = scaleSortedKeys.reduce<Record<string, string[]>>((acc, key) => {
    const categoryKey = SCALES[key].category || 'others';
    if (!acc[categoryKey]) acc[categoryKey] = [];
    acc[categoryKey].push(key);
    return acc;
  }, {});

  const sortedGroupedEntries = Object.entries(groupedScales).sort(([keyA], [keyB]) => {
    const indexA = CATEGORY_ORDER.indexOf(keyA);
    const indexB = CATEGORY_ORDER.indexOf(keyB);

    const pA = indexA === -1 ? 999 : indexA;
    const pB = indexB === -1 ? 999 : indexB;

    return pA - pB;
  });

  const commonNotes = compareMode ? scaleNotes.filter((n: string) => scaleNotesB.includes(n)) : [];
  const onlyInA = compareMode ? scaleNotes.filter((n: string) => !scaleNotesB.includes(n)) : [];
  const onlyInB = compareMode ? scaleNotesB.filter((n: string) => !scaleNotes.includes(n)) : [];
  const totalUnion = [...new Set([...scaleNotes, ...scaleNotesB])].length;

  return (
    <div className={styles.scaleAStack}>

      {/* ── Scale selector ──────────────────────────────────────────────── */}
      <div className={styles.scaleAStack2}>

        {/* Three-column grid: A panel | toggle | B panel */}
        <div className={styles.scaleAGrid}>

          {/* ── Panel A ──────────────────────────────────────────────────── */}
          <div className={styles.scaleAStack3} style={{ border: compareMode ? `1.5px solid ${COMPARE_COLOR_A}44` : '1px solid #252525', background: compareMode ? `${COMPARE_COLOR_A}08` : '#111' }}>
            <span className={styles.scaleALabel} style={{ color: compareMode ? COMPARE_COLOR_A : '#555' }}>
              {compareMode && <span className={styles.label} style={{ background: COMPARE_COLOR_A }} />}
              {compareMode ? t('compare.scaleA') : t('compare.scale')}
            </span>
            <div className={styles.row}>
              <select value={rootNote} onChange={e => setRootNote(e.target.value)}
                className={cx(styles.select, styles.rootSelect)} style={accentStyle(compareMode ? `${COMPARE_COLOR_A}66` : undefined)}>
                {CHROMATIC_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <select
                value={scaleKey}
                onChange={e => setScaleKey(e.target.value)}
                className={styles.select} style={accentStyle(compareMode ? `${COMPARE_COLOR_A}66` : undefined)}
              >
                {sortedGroupedEntries.map(([categoryKey, keys]) => (
                  <optgroup key={categoryKey} label={mc(`categories.${categoryKey}`)}>
                    {keys.map(k => (
                      <option key={k} value={k}>{mc(`scales.${k}.name`)}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {compareMode && (
              <div className={styles.exclusive} style={{ color: `${COMPARE_COLOR_A}cc` }}>
                {onlyInA.length > 0 ? <><span className={styles.exclusiveLabel}>{t('compare.exclusive')}: </span><strong>{onlyInA.join(' · ')}</strong></> : <span className={styles.noExclusiveLabel}>{t('compare.noExclusive')}</span>}
              </div>
            )}
          </div>

          {/* ── Center toggle ─────────────────────────────────────────────── */}
          <div className={styles.deactivateStack}>
            <button
              onClick={() => setCompareMode(v => !v)}
              title={compareMode ? t('compare.deactivate') : t('compare.activate')}
              className={styles.deactivateButton} style={{ border: compareMode ? 'none' : '1.5px dashed #333', background: compareMode
                  ? `conic-gradient(${COMPARE_COLOR_A} 0deg 180deg, ${COMPARE_COLOR_B} 180deg 360deg)`
                  : '#161616', color: compareMode ? '#fff' : '#555' }}
            >
              {compareMode ? '✕' : '⇄'}
            </button>
            <span className={styles.onLabel} style={{ color: compareMode ? 'var(--gold)' : '#444' }}>
              {compareMode ? t('compare.on') : 'vs'}
            </span>
          </div>

          {/* ── Panel B ──────────────────────────────────────────────────── */}
          <div
            onClick={() => { if (!compareMode) setCompareMode(true); }}
            className={styles.scaleAStack3} style={{ border: compareMode ? `1.5px solid ${COMPARE_COLOR_B}44` : '1.5px dashed #252525', background: compareMode ? `${COMPARE_COLOR_B}08` : 'transparent', cursor: compareMode ? 'default' : 'pointer', opacity: compareMode ? 1 : 0.45 }}
          >
            <span className={styles.scaleALabel} style={{ color: compareMode ? COMPARE_COLOR_B : '#555' }}>
              {compareMode && <span className={styles.label} style={{ background: COMPARE_COLOR_B }} />}
              {compareMode ? t('compare.scaleB') : t('compare.addScale')}
            </span>
            <div className={styles.row} style={{ pointerEvents: compareMode ? 'auto' : 'none' }}>
              <select value={rootNoteB} onChange={e => setRootNoteB(e.target.value)}
                className={cx(styles.select, styles.rootSelect)} style={accentStyle(compareMode ? `${COMPARE_COLOR_B}66` : undefined)}>
                {CHROMATIC_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <select
                value={scaleKeyB}
                onChange={e => setScaleKeyB(e.target.value)}
                className={styles.select} style={accentStyle(compareMode ? `${COMPARE_COLOR_B}66` : undefined)}
              >
                {sortedGroupedEntries.map(([categoryKey, keys]) => (
                  <optgroup key={categoryKey} label={mc(`categories.${categoryKey}`)}>
                    {keys.map(k => (
                      <option key={k} value={k}>{mc(`scales.${k}.name`)}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {compareMode && (
              <div className={styles.exclusive} style={{ color: `${COMPARE_COLOR_B}cc` }}>
                {onlyInB.length > 0 ? <><span className={styles.exclusiveLabel}>{t('compare.exclusive')}: </span><strong>{onlyInB.join(' · ')}</strong></> : <span className={styles.noExclusiveLabel}>{t('compare.noExclusive')}</span>}
              </div>
            )}
          </div>
        </div>

        {/* ── Legend bar (only in compare mode) ─────────────────────────── */}
        {compareMode && (
          <div className={styles.onlyARow}>
            <LegendItem color={COMPARE_COLOR_A} label={t('compare.onlyA')} notes={commonNotes.length === scaleNotes.length && onlyInA.length === 0 ? [] : onlyInA} />
            <LegendItem isShared colorA={COMPARE_COLOR_A} colorB={COMPARE_COLOR_B} label={t('compare.common')} notes={commonNotes} />
            <LegendItem color={COMPARE_COLOR_B} label={t('compare.onlyB')} notes={onlyInB} />
            <div className={styles.compatibilityRow}>
              <span>{t('compare.compatibility')}</span>
              <SimilarityBar shared={commonNotes.length} total={totalUnion} />
            </div>
          </div>
        )}
      </div>

      {/* ── Fretboard ─────────────────────────────────────────────────── */}
      <div className={styles.box}>
        <SmartFretboard
          rootNote={rootNote}
          scaleKey={scaleKey}
          customIntervalColors={userColors}
          compareMode={compareMode}
          scaleNotesB={scaleNotesB}
          colorA={COMPARE_COLOR_A}
          colorB={COMPARE_COLOR_B}
        />
      </div>

      {/* ── Theory panel ──────────────────────────────────────────────── */}
      <div className={styles.scaleConfigBox}>
        <button
          onClick={() => setShowTheory(!showTheory)}
          className={styles.scaleConfigButton}
        >
          <div className={styles.scaleConfigRow}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            {t('scaleConfig')}
          </div>
          <span className={styles.scaleConfigButtonLabel} style={{ transform: showTheory ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </button>

        {showTheory && (
          <div className={styles.triads}>
            <div className={styles.triadsRow}>
              <div className={styles.triadsRow2}>
                <button onClick={() => setChordType('triads')} className={styles.triadsButton} style={{ background: chordType === 'triads' ? '#333' : 'transparent', color: chordType === 'triads' ? '#fff' : '#888' }}>{t('chordType.triads')}</button>
                <button onClick={() => setChordType('tetrads')} className={styles.triadsButton} style={{ background: chordType === 'tetrads' ? '#333' : 'transparent', color: chordType === 'tetrads' ? '#fff' : '#888' }}>{t('chordType.tetrads')}</button>
              </div>
            </div>

            <div className={styles.notesRow}>
              <div className={styles.notesStack}>

                <TheoryRow label={t('labels.notes')}>
                  {scaleNotes.map((n: string, i: number) => <TheoryCell key={i}>{n}</TheoryCell>)}
                </TheoryRow>

                <TheoryRow label={t('labels.intervals')}>
                  {scaleData.intervals.map((inv: number, i: number) => (
                    <TheoryCell key={i}>{scaleData.intervalAliases?.[inv] || INTERVAL_NAMES[inv]}</TheoryCell>
                  ))}
                </TheoryRow>

                <TheoryRow label={t('labels.chords')}>
                  {scaleNotes.map((n: string, i: number) => {
                    const v = scaleData[chordType]?.[i];
                    return <TheoryCell key={i} gold>{v ? `${n}${v}` : '-'}</TheoryCell>;
                  })}
                </TheoryRow>

                {!compareMode && (
                  <div className={styles.colorsGrid}>
                    <div className={styles.colors}>{t('labels.colors')}</div>
                    <div className={styles.colorsGridRow}>
                      {scaleData.intervals.map((inv: number, i: number) => {
                        const cur = getIntervalColor(inv);
                        const tc = (cur === '#f1c40f' || cur === '#2ecc71') ? '#000' : '#fff';
                        return (
                          <select key={i} value={cur} onChange={e => handleColorChange(inv, e.target.value)}
                            className={styles.colorsGridSelect} style={{ background: cur, color: tc }}>
                            {Object.entries(PREDEFINED_COLORS).map(([hex]) => (
                              <option key={hex} value={hex}>{mc(`colors.${COLOR_KEYS[hex]}`)}</option>
                            ))}
                          </select>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.usageStack}>
                {scaleData.target || scaleData.chords ? (
                  <>
                    <p className={styles.usageText}><span className={styles.usageLabel}>{t('theory.usage')}</span>{mc(`scales.${scaleKey}.desc`)}</p>
                    <p className={styles.usageText}><span className={styles.usageLabel}>{t('theory.targetNotes')}</span>{scaleData.target || '-'}</p>
                    <p className={styles.playOverText}>          <span className={styles.usageLabel}>{t('theory.playOver')}</span>{scaleData.chords || '-'}</p>
                  </>
                ) : (
                  <p className={styles.noInfoText}>{t('theory.noInfo')}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function TheoryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.colorsGrid}>
      <div className={styles.colors}>{label}</div>
      <div className={styles.colorsGridRow}>{children}</div>
    </div>
  );
}

function TheoryCell({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <div className={styles.block} style={{ color: gold ? 'var(--gold)' : '#fff' }}>
      {children}
    </div>
  );
}

interface LegendItemProps {
  color?: string; colorA?: string; colorB?: string;
  isShared?: boolean; label: string; notes: string[];
}
function LegendItem({ color, colorA, colorB, isShared, label, notes }: LegendItemProps) {
  return (
    <div className={styles.row3}>
      <div className={styles.dot} style={{ background: isShared ? `linear-gradient(90deg, ${colorA} 50%, ${colorB} 50%)` : color, opacity: isShared ? 0.65 : 1 }} />
      <div>
        <div className={styles.block2}>{label}</div>
        <div className={styles.block3}>
          {notes.length > 0 ? notes.join(' · ') : '—'}
        </div>
      </div>
    </div>
  );
}

function SimilarityBar({ shared, total }: { shared: number; total: number }) {
  const pct = total > 0 ? Math.round((shared / total) * 100) : 0;
  const col = pct >= 70 ? '#2ecc71' : pct >= 40 ? '#f1c40f' : '#e74c3c';
  return (
    <div className={styles.row3}>
      <div className={styles.box2}>
        <div className={styles.block4} style={{ width: `${pct}%`, background: col }} />
      </div>
      <span className={styles.label3} style={{ color: col }}>{pct}%</span>
    </div>
  );
}