"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { BASIC_SCALE_SUGGESTIONS, CHROMATIC_NOTES, ENHARMONICS, SCALES, BASIC_SUFFIXES } from '@/lib/constants';
import { useTranslations } from 'next-intl';
import { getChordDictionaries } from '@/app/actions/chords';
import { SmartFretboard } from '@/components/player/SmartFretboard';
import { supabase } from '@/lib/supabase';
import { getYoutubeId } from '@/lib/utils';
import { BackingTrack, ChordDefinition } from '@/lib/types';
import styles from './ImprovPanel.module.css';
import { cx } from '@/lib/cx';

const TONALITY_TYPES = [
  { value: 'major', labelKey: 'tonalityTypes.major' },
  { value: 'minor', labelKey: 'tonalityTypes.minor' },
];


const normalizeNote = (note: string) => {
  return ENHARMONICS[note] || note;
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

interface ImprovPanelProps {
  initialTrack: BackingTrack | null;
  onBack: () => void;
  onSaved: () => void;
}

export function ImprovPanel({ initialTrack, onBack, onSaved }: ImprovPanelProps) {
  const t = useTranslations('ImprovPanel');
  const mc = useTranslations('MusicConstants');

  const [activeTrackId, setActiveTrackId] = useState<string | null>(initialTrack?.id || null);
  const [ytLink, setYtLink] = useState(initialTrack?.youtube_url || '');
  const [trackTitle, setTrackTitle] = useState(initialTrack?.title || '');
  const [tonalityRoot, setTonalityRoot] = useState(initialTrack?.tonality_note || '');
  const [tonalityType, setTonalityType] = useState(initialTrack?.tonality_type || '');
  const [chords, setChords] = useState<ChordDefinition[]>(initialTrack?.chords || []);

  const initialMode = (initialTrack?.chords && initialTrack.chords.length > 0) ? 'chords' : 'tonality';
  const [inputMode, setInputMode] = useState<'tonality' | 'chords'>(initialMode);

  const [chordDictKeys, setChordDictKeys] = useState<string[]>([]);
  const [chordDictSuffixes, setChordDictSuffixes] = useState<string[]>([]);
  const [activeScale, setActiveScale] = useState<{ root: string; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [bpm, setBpm] = useState<number | ''>(initialTrack?.bpm || '');

  const isSystemActive = initialTrack ? initialTrack.user_id === null : false;

  useEffect(() => {
    getChordDictionaries().then(data => {
      if (data) {
        setChordDictKeys(data.keys);
        setChordDictSuffixes(data.suffixes);
      }
    }).catch((err) => {
      console.error("Error cargando diccionarios:", err);
    });
  }, []);

  const filteredSuffixes = useMemo(() => {
    if (!chordDictSuffixes.length) return [];
    const existingChordsSuffixes = chords.map(c => c.type);

    return chordDictSuffixes.filter(suffix =>
      BASIC_SUFFIXES.includes(suffix) || existingChordsSuffixes.includes(suffix)
    ).sort((a, b) => {
      return BASIC_SUFFIXES.indexOf(a) - BASIC_SUFFIXES.indexOf(b);
    });
  }, [chordDictSuffixes, chords]);

  const handleSaveCurrentTrack = async () => {
    if (!ytLink) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ytId = getYoutubeId(ytLink);
      if (!ytId) return;

      const payload = {
        user_id: user.id,
        title: trackTitle.trim() || t('defaultTrackTitle'),
        youtube_url: ytLink,
        tonality_note: tonalityRoot || null,
        tonality_type: tonalityType || null,
        chords: chords.filter(c => c.note && c.type),
        bpm: bpm || null,
      };

      if (activeTrackId && activeTrackId !== 'new') {
        await supabase.from('backing_tracks').update(payload).eq('id', activeTrackId);
      } else {
        const { data } = await supabase.from('backing_tracks').insert(payload).select().single();
        if (data) setActiveTrackId(data.id);
      }

      onSaved();
    } finally {
      setIsSaving(false);
    }
  };

  const ytVideoId = useMemo(() => getYoutubeId(ytLink), [ytLink]);

  const handleAddChord = () => setChords([...chords, { note: '', type: '' }]);
  const handleUpdateChord = (idx: number, field: 'note' | 'type', value: string) => {
    const next = [...chords]; next[idx][field] = value; setChords(next);
  };
  const handleRemoveChord = (idx: number) => setChords(chords.filter((_, i) => i !== idx));

  const basicScaleSuggestions = useMemo(() => {
    if (inputMode !== 'tonality' || !tonalityRoot || !tonalityType) return [];
    const scaleKeys = BASIC_SCALE_SUGGESTIONS[tonalityType as keyof typeof BASIC_SCALE_SUGGESTIONS] || [];
    return scaleKeys.map(scaleName => ({
      root: tonalityRoot, name: scaleName,
      label: `${tonalityRoot} ${mc(`scales.${scaleName}.name`) || scaleName.charAt(0).toUpperCase() + scaleName.slice(1)}`,
    }));
  }, [tonalityRoot, tonalityType, inputMode, mc]);

  const advancedSuggestions = useMemo(() => {
    if (inputMode !== 'chords' || chords.length === 0) return null;
    const validChords = chords.filter(c => c.note && c.type);
    if (validChords.length === 0) return null;
    const chordRoots = validChords.map(c => normalizeNote(c.note));
    const scaleNames = Object.keys(SCALES);
    const globalScalesRaw: { root: string; name: string }[] = [];
    CHROMATIC_NOTES.forEach(scaleRoot => {
      scaleNames.forEach(scaleName => {
        if (validChords.every(c => doesChordFitScale(normalizeNote(c.note), c.type, scaleRoot, scaleName)))
          globalScalesRaw.push({ root: scaleRoot, name: scaleName });
      });
    });
    globalScalesRaw.sort((a, b) => {
      const iA = chordRoots.indexOf(a.root); const iB = chordRoots.indexOf(b.root);
      return (iA === -1 ? 999 : iA) - (iB === -1 ? 999 : iB);
    });
    const globalScales = globalScalesRaw.map(s => ({
      ...s, label: `${s.root} ${mc(`scales.${s.name}.name`) || s.name.charAt(0).toUpperCase() + s.name.slice(1)}`,
    }));
    const perChordSuggestions = validChords.map(c => {
      const normalizedRoot = normalizeNote(c.note);
      const matchingScales = scaleNames
        .filter(scaleName => doesChordFitScale(normalizedRoot, c.type, normalizedRoot, scaleName))
        .map(scaleName => ({
          root: normalizedRoot, name: scaleName,
          label: `${normalizedRoot} ${mc(`scales.${scaleName}.name`) || scaleName.charAt(0).toUpperCase() + scaleName.slice(1)}`,
        }));
      return { chord: `${c.note} ${c.type}`, scales: matchingScales };
    });
    return { globalScales, perChordSuggestions };
  }, [chords, inputMode, mc]);

  if (!ytVideoId) {
    return (
      <div className={styles.backToLibraryStack}>
        <button
          onClick={onBack}
          className={styles.backToLibraryButton}
        >
          ← {t('backToLibrary')}
        </button>

        <div className={styles.analyzerTitleStack}>

          <div className={styles.row}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
            </svg>
          </div>

          <h2 className={styles.analyzerTitleHeading}>
            {t('analyzerTitle')}
          </h2>

          <p className={styles.analyzerDescriptionText}>
            {t('analyzerDescription') || 'Pega un enlace de YouTube para analizar el track, añadir sus acordes y practicar con sugerencias de escalas en tiempo real.'}
          </p>

          <div className={styles.backingTrackPlaceholder}>
            <div className={styles.backingTrackPlaceholderRow}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </div>
            <input
              type="text"
              value={ytLink}
              onChange={e => setYtLink(e.target.value)}
              placeholder={t('backingTrackPlaceholder')}
              className={styles.backingTrackPlaceholderInput} style={{ boxSizing: 'border-box' as const }}
            />
          </div>
        </div>

        <div className={styles.waitingVideoBox}>
          <div className={styles.waitingVideoStack}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
              <line x1="7" y1="2" x2="7" y2="22"></line>
              <line x1="17" y1="2" x2="17" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="2" y1="7" x2="7" y2="7"></line>
              <line x1="2" y1="17" x2="7" y2="17"></line>
              <line x1="17" y1="17" x2="22" y2="17"></line>
              <line x1="17" y1="7" x2="22" y2="7"></line>
            </svg>
            <span className={styles.waitingVideoLabel}>{t('waitingVideo')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.backToLibraryStack2}>
      {/* Top bar */}
      <div className={styles.backToLibraryRow}>
        <button onClick={onBack} className={styles.backToLibraryButton2}>
          ← {t('backToLibrary')}
        </button>
      </div>

      {/* Main grid */}
      <div className={styles.trackTitlePlaceholderGrid}>
        {/* Video column */}
        <div className={styles.trackTitlePlaceholderBox}>
          <div className={styles.trackTitlePlaceholderGrid2}>
            {/* Columna izquierda: título + BPM */}
            <div className={styles.trackTitlePlaceholder}>
              <input
                value={trackTitle}
                onChange={e => setTrackTitle(e.target.value)}
                disabled={isSystemActive}
                placeholder={t('trackTitlePlaceholder')}
                className={styles.trackTitlePlaceholderInput}
              />
              <div className={styles.trackTitlePlaceholderRow}>
                <input
                  type="number" min="40" max="300"
                  value={bpm}
                  onChange={e => setBpm(e.target.value === '' ? '' : parseInt(e.target.value))}
                  disabled={isSystemActive}
                  placeholder="—"
                  className={styles.input}
                />
                <span className={styles.label}>BPM</span>
              </div>
            </div>
            <div className={styles.savingRow}>
              {!isSystemActive ? (
                <button onClick={handleSaveCurrentTrack} disabled={isSaving} className={styles.savingButton} style={{ cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1 }}>
                  {isSaving ? t('saving') : (activeTrackId && activeTrackId !== 'new') ? t('updateTrack') : t('saveTrack')}
                </button>
              ) : (
                <div className={styles.officialBadgeRow}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  {t('officialBadge')}
                </div>
              )}

              {/* Columna derecha: botón cerrar */}
              {!isSystemActive && (
                <button
                  onClick={() => { setYtLink(''); setActiveScale(null); }}
                  className={styles.button}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className={styles.block}>
            <iframe src={`https://www.youtube.com/embed/${ytVideoId}`}
              className={styles.iframe}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Analysis column */}
        <div className={styles.knowTonalityStack}>
          <div className={styles.knowTonalityRow}>
            <button onClick={() => { setInputMode('tonality'); setActiveScale(null); }} className={styles.knowTonalityButton} style={{ background: inputMode === 'tonality' ? 'var(--gold)' : 'transparent', color: inputMode === 'tonality' ? '#111' : 'var(--muted)' }}>
              {t('knowTonality')}
            </button>
            <button onClick={() => { setInputMode('chords'); setActiveScale(null); }} className={styles.knowTonalityButton} style={{ background: inputMode === 'chords' ? 'var(--gold)' : 'transparent', color: inputMode === 'chords' ? '#111' : 'var(--muted)' }}>
              {t('knowChords')}
            </button>
          </div>

          {inputMode === 'tonality' && (
            <div>
              <h3 className={styles.selectTonalitySubheading}>{t('selectTonality')}</h3>
              <div className={styles.rootLabelRow}>
                <select value={tonalityRoot} onChange={e => setTonalityRoot(e.target.value)} disabled={isSystemActive} className={styles.rootLabelSelect}>
                  <option value="" disabled>{t('rootLabel')}</option>
                  {CHROMATIC_NOTES.map(note => <option key={note} value={note}>{note}</option>)}
                </select>
                <select value={tonalityType} onChange={e => setTonalityType(e.target.value)} disabled={isSystemActive} className={styles.rootLabelSelect}>
                  <option value="" disabled>{t('typeLabel')}</option>
                  {TONALITY_TYPES.map(type => <option key={type.value} value={type.value}>{t(type.labelKey)}</option>)}
                </select>
              </div>
            </div>
          )}

          {inputMode === 'chords' && (
            <div>
              <div className={styles.progressionTitleRow}>
                <h3 className={styles.progressionTitleSubheading}>{t('progressionTitle')}</h3>
                <div className={styles.addChordRow}>
                  <button onClick={() => window.open(`https://chordify.net/search/${encodeURIComponent(`https://youtu.be/${ytVideoId}`)}`, '_blank')}
                    className={styles.addChordRowButton}
                    title="Buscar acordes en Chordify"
                  >
                    Chordify ↗
                  </button>
                  {!isSystemActive && (
                    <button onClick={handleAddChord} className={styles.addChordButton}>
                      + {t('addChord')}
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.noteLabelStack}>
                {chords.map((chord, idx) => (
                  <div key={idx} className={styles.noteLabelRow}>
                    <select value={chord.note} onChange={e => handleUpdateChord(idx, 'note', e.target.value)} disabled={isSystemActive} className={styles.noteLabelSelect}>
                      <option value="" disabled>{t('noteLabel')}</option>
                      {chordDictKeys?.map(note => <option key={note} value={note}>{note}</option>)}
                    </select>
                    <select value={chord.type} onChange={e => handleUpdateChord(idx, 'type', e.target.value)} disabled={isSystemActive} className={styles.typeLabelSelect}>
                      <option value="" disabled>{t('typeLabel')}</option>
                      {filteredSuffixes?.map(suffix => <option key={suffix} value={suffix}>{suffix}</option>)}
                    </select>
                    {!isSystemActive && (
                      <button onClick={() => handleRemoveChord(idx)} className={styles.noteLabelRowButton}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </div>
                ))}
                {chords.length === 0 && (
                  <p className={styles.emptyChordsMessageText}>
                    {t('emptyChordsMessage')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ZONA DE ANÁLISIS, FRETBOARD Y SUGERENCIAS
          ───────────────────────────────────────────────────────────── */}

      {/* 1. EL FRETBOARD (Protagonista) - Sube aquí arriba si hay una escala activa */}
      {activeScale && (
        <div className={styles.fretboardLabelBox}>
          <div className={styles.fretboardLabelRow}>
            <h3 className={styles.fretboardLabelSubheading}>
              {t('fretboardLabel')} <span className={styles.rootLabel}>| {activeScale.root} {mc(`scales.${activeScale.name}.name`) || activeScale.name}</span>
            </h3>
            <button
              onClick={() => setActiveScale(null)}
              className={styles.fretboardLabelRowButton}
            >
              ✕
            </button>
          </div>
          <SmartFretboard rootNote={activeScale.root} scaleKey={activeScale.name} />
        </div>
      )}

      <div className={styles.suggestedScalesStack}>

        {inputMode === 'tonality' && basicScaleSuggestions.length > 0 && (
          <div className={styles.suggestedScalesBox}>
            <div className={styles.suggestedScalesRow}>
              <h3 className={styles.suggestedScalesSubheading}>{t('suggestedScales')}</h3>
            </div>

            <div className={styles.grid}>
              {basicScaleSuggestions.map((scale, i) => {
                const isActive = activeScale?.root === scale.root && activeScale?.name === scale.name;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveScale({ root: scale.root, name: scale.name })}
                    className={cx(styles.suggestedScalesBoxButton, isActive && styles.suggestedScalesBoxButtonActive)}
                  >
                    <span className={styles.suggestedScalesBoxLabel}>{scale.label}</span>
                    <span className={styles.suggestedScalesBoxButtonLabel} style={{ color: isActive ? '#111' : 'var(--gold)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {inputMode === 'chords' && advancedSuggestions && (
          <div className={styles.globalScalesStack}>

            <div className={styles.suggestedScalesBox}>
              <div className={styles.suggestedScalesRow}>
                <h3 className={styles.suggestedScalesSubheading}>{t('globalScales')}</h3>
              </div>
              {advancedSuggestions.globalScales.length > 0 ? (
                <div className={styles.grid}>
                  {advancedSuggestions.globalScales.map((scale, i) => {
                    const isActive = activeScale?.root === scale.root && activeScale?.name === scale.name;
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveScale({ root: scale.root, name: scale.name })}
                        className={cx(styles.suggestedScalesBoxButton, isActive && styles.suggestedScalesBoxButtonActive)}
                      >
                        <span className={styles.suggestedScalesBoxLabel}>{scale.label}</span>
                        <span className={styles.suggestedScalesBoxButtonLabel} style={{ color: isActive ? '#111' : 'var(--gold)' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.noGlobalScalesText}>{t('noGlobalScales')}</p>
              )}
            </div>

            <div className={styles.trackTitlePlaceholderBox}>
              <h3 className={styles.perChordScalesSubheading}>{t('perChordScales')}</h3>
              <div className={styles.noScalesFoundGrid}>
                {advancedSuggestions.perChordSuggestions.map((item, idx) => (
                  <div key={idx} className={styles.noScalesFoundBox}>
                    <h4 className={styles.subheading}>
                      {item.chord}
                    </h4>
                    {item.scales.length > 0 ? (
                      <div className={styles.stack}>
                        {item.scales.slice(0, 5).map((scale, i) => {
                          const isActive = activeScale?.root === scale.root && activeScale?.name === scale.name;
                          return (
                            <button
                              key={i}
                              onClick={() => setActiveScale({ root: scale.root, name: scale.name })}
                              className={cx(styles.noScalesFoundBoxButton, isActive && styles.noScalesFoundBoxButtonActive)}
                            >
                              <span>{scale.label}</span>
                              {isActive ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}><polyline points="9 18 15 12 9 6" /></svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span className={styles.noScalesFoundLabel}>{t('noScalesFound')}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}