"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CHROMATIC_NOTES, INTERVAL_NAMES, PREDEFINED_COLORS, SCALES, DEFAULT_INTERVAL_COLORS } from '@/lib/constants';
import { useScaleLogic } from '@/hooks/useScaleLogic';
import { SmartFretboard } from '../SmartFretboard';

const COLOR_KEYS: Record<string, string> = {
  '#7f8c8d': 'grey', '#e74c3c': 'red', '#3498db': 'blue', '#2ecc71': 'green',
  '#f1c40f': 'yellow', '#9b59b6': 'purple', '#e67e22': 'orange', '#e84393': 'pink'
};

const COMPARE_COLOR_A = '#3b82f6';
const COMPARE_COLOR_B = '#f43f5e';

export function ScalesPanel() {
  const t = useTranslations('ScalesPanel');
  const mc = useTranslations('MusicConstants');

  const [rootNote, setRootNote]   = useState('A');
  const [scaleKey, setScaleKey]   = useState('pentatonic-minor');
  const [rootNoteB, setRootNoteB] = useState('A');
  const [scaleKeyB, setScaleKeyB] = useState('pentatonic-major');

  const [compareMode, setCompareMode] = useState(false);
  const [chordType, setChordType]     = useState<'triads' | 'tetrads'>('triads');
  const [userColors, setUserColors]   = useState<Record<number, string>>({});
  const [showTheory, setShowTheory]   = useState(false);

  const { scaleData, scaleNotes }   = useScaleLogic(rootNote,  scaleKey,  'full', t);
  const { scaleNotes: scaleNotesB } = useScaleLogic(rootNoteB, scaleKeyB, 'full', t);

  const getIntervalColor = (interval: number) =>
    userColors[interval] || DEFAULT_INTERVAL_COLORS[interval] || '#7f8c8d';
  const handleColorChange = (interval: number, color: string) =>
    setUserColors(prev => ({ ...prev, [interval]: color }));

  const scaleSortedKeys = Object.keys(SCALES).sort((a, b) =>
    mc(`scales.${a}.name`).localeCompare(mc(`scales.${b}.name`))
  );

  const commonNotes = compareMode ? scaleNotes.filter((n: string) =>  scaleNotesB.includes(n)) : [];
  const onlyInA     = compareMode ? scaleNotes.filter((n: string) => !scaleNotesB.includes(n)) : [];
  const onlyInB     = compareMode ? scaleNotesB.filter((n: string) => !scaleNotes.includes(n)) : [];
  const totalUnion  = [...new Set([...scaleNotes, ...scaleNotesB])].length;

  const selectStyle = (accent?: string): React.CSSProperties => ({
    flex: 1, minWidth: 0,
    padding: '0.55rem 0.6rem',
    background: '#0d0d0d',
    color: '#fff',
    border: `1px solid ${accent ?? '#2a2a2a'}`,
    borderRadius: '7px',
    outline: 'none',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    transition: 'border-color 0.2s',
    cursor: 'pointer',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1600px', margin: '0 auto', boxSizing: 'border-box' }}>

      {/* ── Scale selector ──────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', padding: '1.1rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Three-column grid: A panel | toggle | B panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 1fr', alignItems: 'stretch', gap: '0.6rem' }}>

          {/* ── Panel A ──────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '0.45rem',
            padding: '0.75rem 0.9rem',
            borderRadius: '9px',
            border: compareMode ? `1.5px solid ${COMPARE_COLOR_A}44` : '1px solid #252525',
            background: compareMode ? `${COMPARE_COLOR_A}08` : '#111',
            transition: 'all 0.25s',
          }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: compareMode ? COMPARE_COLOR_A : '#555', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {compareMode && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COMPARE_COLOR_A, display: 'inline-block' }} />}
              {compareMode ? t('compare.scaleA') : t('compare.scale')}
            </span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <select value={rootNote} onChange={e => setRootNote(e.target.value)}
                style={{ ...selectStyle(compareMode ? `${COMPARE_COLOR_A}66` : undefined), flex: '0 0 64px', width: '64px' }}>
                {CHROMATIC_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <select value={scaleKey} onChange={e => setScaleKey(e.target.value)}
                style={selectStyle(compareMode ? `${COMPARE_COLOR_A}66` : undefined)}>
                {scaleSortedKeys.map(k => <option key={k} value={k}>{mc(`scales.${k}.name`)}</option>)}
              </select>
            </div>
            {compareMode && (
              <div style={{ fontSize: '0.72rem', color: `${COMPARE_COLOR_A}cc`, minHeight: '1rem' }}>
                {onlyInA.length > 0 ? <><span style={{ opacity: 0.6 }}>{t('compare.exclusive')}: </span><strong>{onlyInA.join(' · ')}</strong></> : <span style={{ opacity: 0.4 }}>{t('compare.noExclusive')}</span>}
              </div>
            )}
          </div>

          {/* ── Center toggle ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <button
              onClick={() => setCompareMode(v => !v)}
              title={compareMode ? t('compare.deactivate') : t('compare.activate')}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                border: compareMode ? 'none' : '1.5px dashed #333',
                background: compareMode
                  ? `conic-gradient(${COMPARE_COLOR_A} 0deg 180deg, ${COMPARE_COLOR_B} 180deg 360deg)`
                  : '#161616',
                color: compareMode ? '#fff' : '#555',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', fontWeight: 'bold',
                transition: 'all 0.25s',
                flexShrink: 0,
              }}
            >
              {compareMode ? '✕' : '⇄'}
            </button>
            <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: compareMode ? 'var(--gold)' : '#444', fontWeight: 'bold' }}>
              {compareMode ? t('compare.on') : 'vs'}
            </span>
          </div>

          {/* ── Panel B ──────────────────────────────────────────────────── */}
          <div
            onClick={() => { if (!compareMode) setCompareMode(true); }}
            style={{
              display: 'flex', flexDirection: 'column', gap: '0.45rem',
              padding: '0.75rem 0.9rem',
              borderRadius: '9px',
              border: compareMode ? `1.5px solid ${COMPARE_COLOR_B}44` : '1.5px dashed #252525',
              background: compareMode ? `${COMPARE_COLOR_B}08` : 'transparent',
              transition: 'all 0.25s',
              cursor: compareMode ? 'default' : 'pointer',
              opacity: compareMode ? 1 : 0.45,
            }}
          >
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: compareMode ? COMPARE_COLOR_B : '#555', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {compareMode && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COMPARE_COLOR_B, display: 'inline-block' }} />}
              {compareMode ? t('compare.scaleB') : t('compare.addScale')}
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', pointerEvents: compareMode ? 'auto' : 'none' }}>
              <select value={rootNoteB} onChange={e => setRootNoteB(e.target.value)}
                style={{ ...selectStyle(compareMode ? `${COMPARE_COLOR_B}66` : undefined), flex: '0 0 64px', width: '64px' }}>
                {CHROMATIC_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <select value={scaleKeyB} onChange={e => setScaleKeyB(e.target.value)}
                style={selectStyle(compareMode ? `${COMPARE_COLOR_B}66` : undefined)}>
                {scaleSortedKeys.map(k => <option key={k} value={k}>{mc(`scales.${k}.name`)}</option>)}
              </select>
            </div>
            {compareMode && (
              <div style={{ fontSize: '0.72rem', color: `${COMPARE_COLOR_B}cc`, minHeight: '1rem' }}>
                {onlyInB.length > 0 ? <><span style={{ opacity: 0.6 }}>{t('compare.exclusive')}: </span><strong>{onlyInB.join(' · ')}</strong></> : <span style={{ opacity: 0.4 }}>{t('compare.noExclusive')}</span>}
              </div>
            )}
          </div>
        </div>

        {/* ── Legend bar (only in compare mode) ─────────────────────────── */}
        {compareMode && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.2rem', padding: '0.6rem 0.9rem', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <LegendItem color={COMPARE_COLOR_A} label={t('compare.onlyA')} notes={commonNotes.length === scaleNotes.length && onlyInA.length === 0 ? [] : onlyInA} />
            <LegendItem isShared colorA={COMPARE_COLOR_A} colorB={COMPARE_COLOR_B} label={t('compare.common')} notes={commonNotes} />
            <LegendItem color={COMPARE_COLOR_B} label={t('compare.onlyB')} notes={onlyInB} />
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
              <span>{t('compare.compatibility')}</span>
              <SimilarityBar shared={commonNotes.length} total={totalUnion} />
            </div>
          </div>
        )}
      </div>

      {/* ── Fretboard ─────────────────────────────────────────────────── */}
      <div style={{ width: '100%', background: 'var(--surface)', padding: '2rem 1rem 1rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
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
      <div style={{ background: 'var(--surface)', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
        <button
          onClick={() => setShowTheory(!showTheory)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 1.5rem', background: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            {t('scaleConfig')}
          </div>
          <span style={{ color: 'var(--gold)', transform: showTheory ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>▼</span>
        </button>

        {showTheory && (
          <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid #222' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', background: '#111', borderRadius: '6px', padding: '0.2rem' }}>
                <button onClick={() => setChordType('triads')}  style={{ background: chordType === 'triads'  ? '#333' : 'transparent', color: chordType === 'triads'  ? '#fff' : '#888', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>{t('chordType.triads')}</button>
                <button onClick={() => setChordType('tetrads')} style={{ background: chordType === 'tetrads' ? '#333' : 'transparent', color: chordType === 'tetrads' ? '#fff' : '#888', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>{t('chordType.tetrads')}</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

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
                  <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '1rem', alignItems: 'center', background: '#1a1a1a', padding: '0.8rem 1rem', borderRadius: '8px' }}>
                    <div style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('labels.colors')}</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {scaleData.intervals.map((inv: number, i: number) => {
                        const cur = getIntervalColor(inv);
                        const tc  = (cur === '#f1c40f' || cur === '#2ecc71') ? '#000' : '#fff';
                        return (
                          <select key={i} value={cur} onChange={e => handleColorChange(inv, e.target.value)}
                            style={{ flex: '1 1 0%', minWidth: '35px', padding: 0, border: '1px solid #333', borderRadius: '4px', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', fontSize: '0.75rem', height: '24px', appearance: 'none', WebkitAppearance: 'none', background: cur, color: tc }}>
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

              <div style={{ flex: '1 1 250px', background: '#111', borderLeft: '3px solid var(--gold)', padding: '1.5rem', borderRadius: '8px', fontSize: '0.95rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {scaleData.target || scaleData.chords ? (
                  <>
                    <p style={{ margin: '0 0 1rem' }}><span style={{ color: '#888', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>{t('theory.usage')}</span>{mc(`scales.${scaleKey}.desc`)}</p>
                    <p style={{ margin: '0 0 1rem' }}><span style={{ color: '#888', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>{t('theory.targetNotes')}</span>{scaleData.target || '-'}</p>
                    <p style={{ margin: 0 }}>          <span style={{ color: '#888', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>{t('theory.playOver')}</span>{scaleData.chords || '-'}</p>
                  </>
                ) : (
                  <p style={{ color: '#666', margin: 0, textAlign: 'center', fontStyle: 'italic' }}>{t('theory.noInfo')}</p>
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
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '1rem', alignItems: 'center', background: '#1a1a1a', padding: '0.8rem 1rem', borderRadius: '8px' }}>
      <div style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

function TheoryCell({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <div style={{ flex: '1 1 0%', minWidth: '35px', textAlign: 'center', color: gold ? 'var(--gold)' : '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
      <div style={{ width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0, background: isShared ? `linear-gradient(90deg, ${colorA} 50%, ${colorB} 50%)` : color, opacity: isShared ? 0.65 : 1 }} />
      <div>
        <div style={{ fontSize: '0.67rem', color: 'var(--muted)', lineHeight: 1.1 }}>{label}</div>
        <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 'bold', letterSpacing: '0.03em' }}>
          {notes.length > 0 ? notes.join(' · ') : '—'}
        </div>
      </div>
    </div>
  );
}

function SimilarityBar({ shared, total }: { shared: number; total: number }) {
  const pct = total > 0 ? Math.round((shared / total) * 100) : 0;
  const col  = pct >= 70 ? '#2ecc71' : pct >= 40 ? '#f1c40f' : '#e74c3c';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
      <div style={{ width: '64px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: '2px', transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: '0.78rem', color: col, fontWeight: 'bold', minWidth: '28px' }}>{pct}%</span>
    </div>
  );
}