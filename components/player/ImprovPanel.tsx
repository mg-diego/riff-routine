"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { BASIC_SCALE_SUGGESTIONS, CHROMATIC_NOTES, SCALES } from '@/lib/constants';
import { useTranslations } from 'next-intl';
import { getChordOptions } from '@/app/actions/chords';
import { SmartFretboard } from './SmartFretboard';

const TONALITY_TYPES = [
  { value: 'major', label: 'Mayor' },
  { value: 'minor', label: 'Menor' }
];

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const normalizeNote = (note: string) => {
  const map: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
  return map[note] || note;
};

const doesChordFitScale = (chordRoot: string, chordSuffix: string, scaleRoot: string, scaleName: string) => {
  const scaleDef = SCALES[scaleName];
  if (!scaleDef) return false;

  const scaleRootIdx = CHROMATIC_NOTES.indexOf(scaleRoot);
  const chordRootIdx = CHROMATIC_NOTES.indexOf(chordRoot);
  if (scaleRootIdx === -1 || chordRootIdx === -1) return false;

  const interval = (chordRootIdx - scaleRootIdx + 12) % 12;
  const degreeIndex = scaleDef.intervals.indexOf(interval);

  if (degreeIndex === -1) return false;

  const scaleTriad = scaleDef.triads?.[degreeIndex];
  const scaleTetrad = scaleDef.tetrads?.[degreeIndex];

  if (chordSuffix === 'major') return scaleTriad === 'Maj' || scaleTetrad === 'Maj7' || scaleTetrad === '7';
  if (chordSuffix === 'minor') return scaleTriad === 'm' || scaleTetrad === 'm7' || scaleTetrad === 'm7♭5';
  if (chordSuffix === 'dim') return scaleTriad === 'dim' || scaleTetrad === 'm7♭5';
  if (chordSuffix === 'maj7') return scaleTetrad === 'Maj7';
  if (chordSuffix === 'm7') return scaleTetrad === 'm7';
  if (chordSuffix === '7') return scaleTetrad === '7';
  if (chordSuffix === 'm7b5') return scaleTetrad === 'm7♭5';

  return chordSuffix === scaleTriad || chordSuffix === scaleTetrad;
};

export function ImprovPanel() {
  const t = useTranslations('ImprovPanel');
  const mc = useTranslations('MusicConstants');

  const [ytLink, setYtLink] = useState('');
  const [inputMode, setInputMode] = useState<'tonality' | 'chords'>('tonality');

  const [tonalityRoot, setTonalityRoot] = useState('');
  const [tonalityType, setTonalityType] = useState('');
  const [chords, setChords] = useState<{ root: string; type: string }[]>([]);

  const [chordDictKeys, setChordDictKeys] = useState<string[]>([]);
  const [chordDictSuffixes, setChordDictSuffixes] = useState<string[]>([]);

  const [activeScale, setActiveScale] = useState<{ root: string; name: string } | null>(null);

  useEffect(() => {
    getChordOptions().then((data) => {
      if (data) {
        setChordDictKeys(data.keys);
        setChordDictSuffixes(data.suffixes);
      }
    }).catch(() => { });
  }, []);

  const ytVideoId = useMemo(() => getYoutubeId(ytLink), [ytLink]);

  const handleAddChord = () => {
    setChords([...chords, { root: '', type: '' }]);
  };

  const handleUpdateChord = (index: number, field: 'root' | 'type', value: string) => {
    const newChords = [...chords];
    newChords[index][field] = value;
    setChords(newChords);
  };

  const handleRemoveChord = (index: number) => {
    setChords(chords.filter((_, i) => i !== index));
  };

  const basicScaleSuggestions = useMemo(() => {
    if (inputMode !== 'tonality' || !tonalityRoot || !tonalityType) return [];

    const r = tonalityRoot;
    const scaleKeys = BASIC_SCALE_SUGGESTIONS[tonalityType as keyof typeof BASIC_SCALE_SUGGESTIONS] || [];

    return scaleKeys.map(scaleName => ({
      root: r,
      name: scaleName,
      label: `${r} ${mc(`scales.${scaleName}.name`) || scaleName.charAt(0).toUpperCase() + scaleName.slice(1)}`
    }));
  }, [tonalityRoot, tonalityType, inputMode, mc]);

  const advancedSuggestions = useMemo(() => {
    if (inputMode !== 'chords' || chords.length === 0) return null;

    const validChords = chords.filter(c => c.root && c.type);
    if (validChords.length === 0) return null;

    const chordRoots = validChords.map(c => normalizeNote(c.root));
    const globalScalesRaw: { root: string, name: string }[] = [];
    const scaleNames = Object.keys(SCALES);

    CHROMATIC_NOTES.forEach(scaleRoot => {
      scaleNames.forEach(scaleName => {
        const fitsAll = validChords.every(c => {
          const normalizedRoot = normalizeNote(c.root);
          return doesChordFitScale(normalizedRoot, c.type, scaleRoot, scaleName);
        });
        if (fitsAll) {
          globalScalesRaw.push({ root: scaleRoot, name: scaleName });
        }
      });
    });

    globalScalesRaw.sort((a, b) => {
      let idxA = chordRoots.indexOf(a.root);
      let idxB = chordRoots.indexOf(b.root);
      if (idxA === -1) idxA = 999;
      if (idxB === -1) idxB = 999;
      return idxA - idxB;
    });

    const globalScales = globalScalesRaw.map(s => ({
      root: s.root,
      name: s.name,
      label: `${s.root} ${mc(`scales.${s.name}.name`) || s.name.charAt(0).toUpperCase() + s.name.slice(1)}`
    }));

    const perChordSuggestions = validChords.map(c => {
      const matchingScales: { root: string, name: string, label: string }[] = [];
      const normalizedRoot = normalizeNote(c.root);
      scaleNames.forEach(scaleName => {
        if (doesChordFitScale(normalizedRoot, c.type, normalizedRoot, scaleName)) {
          matchingScales.push({
            root: normalizedRoot,
            name: scaleName,
            label: `${normalizedRoot} ${mc(`scales.${scaleName}.name`) || scaleName.charAt(0).toUpperCase() + scaleName.slice(1)}`
          });
        }
      });
      return { chord: `${c.root} ${c.type}`, scales: matchingScales };
    });

    return { globalScales, perChordSuggestions };
  }, [chords, inputMode, mc]);

  if (!ytVideoId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: 'var(--gold)', marginBottom: '2rem', fontSize: '2rem', fontFamily: 'Bebas Neue, sans-serif' }}>
          {t('analyzerTitle', { defaultValue: 'Backing Track Analyzer' })}
        </h2>
        <input
          type="text"
          value={ytLink}
          onChange={(e) => setYtLink(e.target.value)}
          placeholder={t('backingTrackPlaceholder', { defaultValue: 'Pega aquí el enlace de YouTube de tu backing track...' })}
          style={{ width: '100%', padding: '1.2rem', background: 'var(--surface)', border: '1px solid rgba(220,185,138,0.3)', borderRadius: '8px', color: 'var(--text)', outline: 'none', fontSize: '1.1rem', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', height: '100%' }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

        <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--gold)', margin: 0, fontSize: '1.2rem' }}>{t('backingTrackTitle', { defaultValue: 'Backing Track' })}</h3>
            <button
              onClick={() => { setYtLink(''); setActiveScale(null); }}
              style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              {t('changeVideo', { defaultValue: 'Cambiar vídeo ✕' })}
            </button>
          </div>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px' }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytVideoId}`}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '8px', gap: '0.4rem' }}>
            <button
              onClick={() => { setInputMode('tonality'); setActiveScale(null); }}
              style={{ flex: 1, padding: '0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', background: inputMode === 'tonality' ? 'var(--gold)' : 'transparent', color: inputMode === 'tonality' ? '#111' : 'var(--muted)' }}
            >
              {t('knowTonality', { defaultValue: 'Sé la tonalidad' })}
            </button>
            <button
              onClick={() => { setInputMode('chords'); setActiveScale(null); }}
              style={{ flex: 1, padding: '0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', background: inputMode === 'chords' ? 'var(--gold)' : 'transparent', color: inputMode === 'chords' ? '#111' : 'var(--muted)' }}
            >
              {t('knowChords', { defaultValue: 'Sé los acordes' })}
            </button>
          </div>

          {inputMode === 'tonality' && (
            <div>
              <h3 style={{ color: 'var(--text)', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>{t('selectTonality', { defaultValue: 'Selecciona la Tonalidad' })}</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <select
                  value={tonalityRoot}
                  onChange={(e) => setTonalityRoot(e.target.value)}
                  style={{ flex: 1, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '6px', outline: 'none' }}
                >
                  <option value="" disabled>{t('rootLabel', { defaultValue: 'Raíz...' })}</option>
                  {CHROMATIC_NOTES.map(note => <option key={note} value={note}>{note}</option>)}
                </select>
                <select
                  value={tonalityType}
                  onChange={(e) => setTonalityType(e.target.value)}
                  style={{ flex: 1, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '6px', outline: 'none' }}
                >
                  <option value="" disabled>{t('typeLabel', { defaultValue: 'Tipo...' })}</option>
                  {TONALITY_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {inputMode === 'chords' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '1.1rem' }}>{t('progressionTitle', { defaultValue: 'Progresión de Acordes' })}</h3>
                <button
                  onClick={handleAddChord}
                  style={{ background: 'rgba(220,185,138,0.1)', color: 'var(--gold)', border: '1px solid rgba(220,185,138,0.3)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  + {t('addChord', { defaultValue: 'Añadir' })}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {chords.map((chord, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      value={chord.root}
                      onChange={(e) => handleUpdateChord(index, 'root', e.target.value)}
                      style={{ flex: 1, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem', borderRadius: '6px', outline: 'none' }}
                    >
                      <option value="" disabled>{t('noteLabel', { defaultValue: 'Nota...' })}</option>
                      {chordDictKeys.map(note => <option key={note} value={note}>{note}</option>)}
                    </select>
                    <select
                      value={chord.type}
                      onChange={(e) => handleUpdateChord(index, 'type', e.target.value)}
                      style={{ flex: 2, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem', borderRadius: '6px', outline: 'none' }}
                    >
                      <option value="" disabled>{t('typeLabel', { defaultValue: 'Tipo...' })}</option>
                      {chordDictSuffixes.map(suffix => <option key={suffix} value={suffix}>{suffix}</option>)}
                    </select>
                    <button
                      onClick={() => handleRemoveChord(index)}
                      style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: '0', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: '4px' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,76,60,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}
                {chords.length === 0 && (
                  <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0, fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
                    {t('emptyChordsMessage', { defaultValue: 'Añade los acordes que identifiques en el track.' })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {inputMode === 'tonality' && basicScaleSuggestions.length > 0 && (
          <div style={{ background: 'rgba(220,185,138,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(220,185,138,0.2)' }}>
            <h3 style={{ color: 'var(--gold)', margin: '0 0 1rem 0', fontSize: '1.2rem' }}>{t('suggestedScales', { defaultValue: 'Escalas Sugeridas' })}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.8rem' }}>
              {basicScaleSuggestions.map((scale, i) => {
                const isActive = activeScale?.root === scale.root && activeScale?.name === scale.name;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveScale({ root: scale.root, name: scale.name })}
                    style={{
                      width: '100%',
                      background: isActive ? 'var(--gold)' : 'rgba(220,185,138,0.15)',
                      color: isActive ? '#111' : 'var(--text)',
                      padding: '0.8rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                      fontSize: '0.95rem'
                    }}
                  >
                    {scale.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {inputMode === 'chords' && advancedSuggestions && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(220,185,138,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(220,185,138,0.2)' }}>
              <h3 style={{ color: 'var(--gold)', margin: '0 0 1rem 0', fontSize: '1.2rem' }}>{t('globalScales', { defaultValue: 'Escalas para toda la progresión' })}</h3>
              {advancedSuggestions.globalScales.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.8rem' }}>
                  {advancedSuggestions.globalScales.map((scale, i) => {
                    const isActive = activeScale?.root === scale.root && activeScale?.name === scale.name;
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveScale({ root: scale.root, name: scale.name })}
                        style={{
                          width: '100%',
                          background: isActive ? 'var(--gold)' : 'rgba(220,185,138,0.15)',
                          color: isActive ? '#111' : 'var(--text)',
                          padding: '0.8rem 1rem',
                          borderRadius: '8px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'center',
                          fontSize: '0.95rem'
                        }}
                      >
                        {scale.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: 'var(--muted)', margin: 0 }}>{t('noGlobalScales', { defaultValue: 'No se ha encontrado ninguna escala diatónica que encaje perfectamente sobre todos estos acordes. Prueba a modular usando las sugerencias por acorde.' })}</p>
              )}
            </div>

            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ color: 'var(--gold)', margin: '0 0 1rem 0', fontSize: '1.2rem' }}>{t('perChordScales', { defaultValue: 'Opciones por Acorde' })}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {advancedSuggestions.perChordSuggestions.map((item, idx) => (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 0.8rem 0', color: 'var(--text)', fontSize: '1.1rem' }}>{item.chord}</h4>
                    {item.scales.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {item.scales.slice(0, 5).map((scale, i) => {
                          const isActive = activeScale?.root === scale.root && activeScale?.name === scale.name;
                          return (
                            <button
                              key={i}
                              onClick={() => setActiveScale({ root: scale.root, name: scale.name })}
                              style={{
                                width: '100%',
                                background: isActive ? 'var(--gold)' : 'transparent',
                                color: isActive ? '#111' : 'var(--muted)',
                                border: '1px solid rgba(220,185,138,0.3)',
                                padding: '0.6rem 0.8rem',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: isActive ? 600 : 'normal'
                              }}
                            >
                              {scale.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t('noScalesFound', { defaultValue: 'Sin sugerencias directas' })}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeScale && (
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '1rem' }}>
            <h3 style={{ color: 'var(--gold)', margin: '0 0 1.5rem 0', fontSize: '1.2rem', textAlign: 'center' }}>
              Fretboard - {activeScale.root} {mc(`scales.${activeScale.name}.name`) || activeScale.name}
            </h3>

            <SmartFretboard rootNote={activeScale.root} scaleKey={activeScale.name} />
          </div>
        )}

      </div>
    </div>
  );
}