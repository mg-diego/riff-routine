"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { BASIC_SCALE_SUGGESTIONS, CHROMATIC_NOTES, ENHARMONICS, SCALES, BASIC_SUFFIXES } from '@/lib/constants';
import { useTranslations } from 'next-intl';
import { getChordDictionaries } from '@/app/actions/chords';
import { SmartFretboard } from '../SmartFretboard';
import { supabase } from '@/lib/supabase';

const TONALITY_TYPES = [
  { value: 'major', labelKey: 'tonalityTypes.major' },
  { value: 'minor', labelKey: 'tonalityTypes.minor' },
];

export interface ChordDefinition { note: string; type: string; }
export interface BackingTrack {
  id: string; user_id: string | null; title: string; youtube_url: string;
  tonality_note: string | null; tonality_type: string | null; chords: ChordDefinition[]; bpm: number | null;
}

const getYoutubeId = (url: string) => {
  const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return (m && m[2].length === 11) ? m[2] : null;
};
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
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '60vh', width: '100%', maxWidth: '700px', margin: '0 auto', paddingTop: '1rem' }}>
        <button
          onClick={onBack}
          style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
        >
          ← {t('backToLibrary')}
        </button>

        <div style={{ background: 'var(--surface)', padding: '3.5rem 2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>

          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(220,185,138,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid rgba(220,185,138,0.2)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
            </svg>
          </div>

          <h2 style={{ color: 'var(--gold)', margin: '0 0 0.5rem 0', fontSize: '2.2rem', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.02em' }}>
            {t('analyzerTitle')}
          </h2>

          <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: '2.5rem', maxWidth: '85%', lineHeight: 1.6, fontFamily: 'DM Sans, sans-serif' }}>
            {t('analyzerDescription') || 'Pega un enlace de YouTube para analizar el track, añadir sus acordes y practicar con sugerencias de escalas en tiempo real.'}
          </p>

          <div style={{ width: '100%', position: 'relative', maxWidth: '500px' }}>
            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
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
              style={{
                width: '100%', padding: '1.2rem 1.2rem 1.2rem 3rem',
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(220,185,138,0.3)',
                borderRadius: '8px', color: 'var(--text)', outline: 'none',
                fontSize: '1rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                transition: 'border-color 0.2s', boxSizing: 'border-box' as const,
                fontFamily: 'DM Sans, sans-serif'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--gold)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(220,185,138,0.3)'}
            />
          </div>
        </div>

        <div style={{ marginTop: '2rem', width: '100%', paddingBottom: '30%', position: 'relative', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '16px', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'rgba(255,255,255,0.1)', gap: '1rem' }}>
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
            <span style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', letterSpacing: '0.1em', fontWeight: 600 }}>{t('waitingVideo')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', height: '100%' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem' }}>
          ← {t('backToLibrary')}
        </button>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Video column */}
        <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            {/* Columna izquierda: título + BPM */}
            <div style={{ minWidth: 0 }}>
              <input
                value={trackTitle}
                onChange={e => setTrackTitle(e.target.value)}
                disabled={isSystemActive}
                placeholder={t('trackTitlePlaceholder')}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--gold)',
                  fontSize: '1.2rem', fontWeight: 'bold', outline: 'none',
                  width: '100%', fontFamily: 'DM Sans, sans-serif',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.3rem' }}>
                <input
                  type="number" min="40" max="300"
                  value={bpm}
                  onChange={e => setBpm(e.target.value === '' ? '' : parseInt(e.target.value))}
                  disabled={isSystemActive}
                  placeholder="—"
                  style={{
                    width: '52px', background: 'transparent', border: 'none',
                    borderBottom: isSystemActive ? 'none' : '1px solid rgba(220,185,138,0.25)',
                    color: 'var(--gold)', fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: '1.1rem', outline: 'none', opacity: isSystemActive ? 0.4 : 1, padding: 0,
                  }}
                  onFocus={e => { if (!isSystemActive) e.target.style.borderBottomColor = 'var(--gold)'; }}
                  onBlur={e => e.target.style.borderBottomColor = 'rgba(220,185,138,0.25)'}
                />
                <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(220,185,138,0.4)' }}>BPM</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
              {!isSystemActive ? (
                <button onClick={handleSaveCurrentTrack} disabled={isSaving} style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1, fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }} onMouseEnter={e => { if (!isSaving) { e.currentTarget.style.background = 'rgba(74,222,128,0.15)'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)'; } }} onMouseLeave={e => { if (!isSaving) { e.currentTarget.style.background = 'rgba(74,222,128,0.1)'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.2)'; } }}>
                  {isSaving ? t('saving') : (activeTrackId && activeTrackId !== 'new') ? t('updateTrack') : t('saveTrack')}
                </button>
              ) : (
                <div style={{ background: 'var(--gold)', color: '#111', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
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
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px', lineHeight: 1, transition: 'color 0.15s', display: 'flex', alignItems: 'center', alignSelf: 'start' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e74c3c'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px' }}>
            <iframe src={`https://www.youtube.com/embed/${ytVideoId}`}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Analysis column */}
        <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '8px', gap: '0.4rem' }}>
            <button onClick={() => { setInputMode('tonality'); setActiveScale(null); }} style={{ flex: 1, padding: '0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', background: inputMode === 'tonality' ? 'var(--gold)' : 'transparent', color: inputMode === 'tonality' ? '#111' : 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
              {t('knowTonality')}
            </button>
            <button onClick={() => { setInputMode('chords'); setActiveScale(null); }} style={{ flex: 1, padding: '0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', background: inputMode === 'chords' ? 'var(--gold)' : 'transparent', color: inputMode === 'chords' ? '#111' : 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
              {t('knowChords')}
            </button>
          </div>

          {inputMode === 'tonality' && (
            <div>
              <h3 style={{ color: 'var(--text)', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>{t('selectTonality')}</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <select value={tonalityRoot} onChange={e => setTonalityRoot(e.target.value)} disabled={isSystemActive} style={{ flex: 1, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '6px', outline: 'none' }}>
                  <option value="" disabled>{t('rootLabel')}</option>
                  {CHROMATIC_NOTES.map(note => <option key={note} value={note}>{note}</option>)}
                </select>
                <select value={tonalityType} onChange={e => setTonalityType(e.target.value)} disabled={isSystemActive} style={{ flex: 1, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '6px', outline: 'none' }}>
                  <option value="" disabled>{t('typeLabel')}</option>
                  {TONALITY_TYPES.map(type => <option key={type.value} value={type.value}>{t(type.labelKey)}</option>)}
                </select>
              </div>
            </div>
          )}

          {inputMode === 'chords' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '1.1rem' }}>{t('progressionTitle')}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => window.open(`https://chordify.net/search/${encodeURIComponent(`https://youtu.be/${ytVideoId}`)}`, '_blank')}
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'DM Sans, sans-serif', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    title="Buscar acordes en Chordify"
                  >
                    Chordify ↗
                  </button>
                  {!isSystemActive && (
                    <button onClick={handleAddChord} style={{ background: 'rgba(220,185,138,0.1)', color: 'var(--gold)', border: '1px solid rgba(220,185,138,0.3)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'DM Sans, sans-serif' }}>
                      + {t('addChord')}
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {chords.map((chord, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select value={chord.note} onChange={e => handleUpdateChord(idx, 'note', e.target.value)} disabled={isSystemActive} style={{ flex: 1, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem', borderRadius: '6px', outline: 'none' }}>
                      <option value="" disabled>{t('noteLabel')}</option>
                      {chordDictKeys?.map(note => <option key={note} value={note}>{note}</option>)}
                    </select>
                    <select value={chord.type} onChange={e => handleUpdateChord(idx, 'type', e.target.value)} disabled={isSystemActive} style={{ flex: 2, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem', borderRadius: '6px', outline: 'none' }}>
                      <option value="" disabled>{t('typeLabel')}</option>
                      {filteredSuffixes?.map(suffix => <option key={suffix} value={suffix}>{suffix}</option>)}
                    </select>
                    {!isSystemActive && (
                      <button onClick={() => handleRemoveChord(idx)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: 0, width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: '4px' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,76,60,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </div>
                ))}
                {chords.length === 0 && (
                  <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0, fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
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
        <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(220,185,138,0.3)', marginTop: '0.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
            <h3 style={{ color: 'var(--gold)', margin: 0, fontSize: '1.4rem', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {t('fretboardLabel')} <span style={{ color: 'var(--text)' }}>| {activeScale.root} {mc(`scales.${activeScale.name}.name`) || activeScale.name}</span>
            </h3>
            <button
              onClick={() => setActiveScale(null)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                transition: 'all 0.2s',
                fontFamily: 'DM Sans, sans-serif',
                width: 'fit-content',
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
            >
              ✕
            </button>
          </div>
          <SmartFretboard rootNote={activeScale.root} scaleKey={activeScale.name} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {inputMode === 'tonality' && basicScaleSuggestions.length > 0 && (
          <div style={{ background: 'rgba(220,185,138,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '1.2rem' }}>{t('suggestedScales')}</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
              {basicScaleSuggestions.map((scale, i) => {
                const isActive = activeScale?.root === scale.root && activeScale?.name === scale.name;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveScale({ root: scale.root, name: scale.name })}
                    style={{
                      width: '100%',
                      background: isActive ? 'var(--gold)' : 'var(--surface2)',
                      color: isActive ? '#111' : 'var(--text)',
                      padding: '1rem',
                      borderRadius: '8px',
                      fontWeight: isActive ? 700 : 500,
                      border: isActive ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: isActive ? '0 4px 12px rgba(220,185,138,0.3)' : 'none'
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(220,185,138,0.5)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                  >
                    <span style={{ fontSize: '1.1rem', fontFamily: 'DM Sans, sans-serif' }}>{scale.label}</span>
                    <span style={{ display: 'flex', alignItems: 'center', color: isActive ? '#111' : 'var(--gold)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {inputMode === 'chords' && advancedSuggestions && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div style={{ background: 'rgba(220,185,138,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '1.2rem' }}>{t('globalScales')}</h3>
              </div>
              {advancedSuggestions.globalScales.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                  {advancedSuggestions.globalScales.map((scale, i) => {
                    const isActive = activeScale?.root === scale.root && activeScale?.name === scale.name;
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveScale({ root: scale.root, name: scale.name })}
                        style={{
                          width: '100%',
                          background: isActive ? 'var(--gold)' : 'var(--surface2)',
                          color: isActive ? '#111' : 'var(--text)',
                          padding: '1rem',
                          borderRadius: '8px',
                          fontWeight: isActive ? 700 : 500,
                          border: isActive ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          boxShadow: isActive ? '0 4px 12px rgba(220,185,138,0.3)' : 'none'
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(220,185,138,0.5)' }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                      >
                        <span style={{ fontSize: '1.1rem', fontFamily: 'DM Sans, sans-serif' }}>{scale.label}</span>
                        <span style={{ display: 'flex', alignItems: 'center', color: isActive ? '#111' : 'var(--gold)' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>{t('noGlobalScales')}</p>
              )}
            </div>

            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ color: 'var(--text)', margin: '0 0 1.5rem 0', fontSize: '1.2rem' }}>{t('perChordScales')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {advancedSuggestions.perChordSuggestions.map((item, idx) => (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--gold)', fontSize: '1.3rem', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
                      {item.chord}
                    </h4>
                    {item.scales.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {item.scales.slice(0, 5).map((scale, i) => {
                          const isActive = activeScale?.root === scale.root && activeScale?.name === scale.name;
                          return (
                            <button
                              key={i}
                              onClick={() => setActiveScale({ root: scale.root, name: scale.name })}
                              style={{
                                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: isActive ? 'var(--gold)' : 'rgba(255,255,255,0.03)', color: isActive ? '#111' : 'var(--text)',
                                border: isActive ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                                padding: '0.8rem 1rem', borderRadius: '6px', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: isActive ? 600 : 400, fontFamily: 'DM Sans, sans-serif'
                              }}
                              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                            >
                              <span>{scale.label}</span>
                              {isActive ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><polyline points="9 18 15 12 9 6" /></svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>{t('noScalesFound')}</span>
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