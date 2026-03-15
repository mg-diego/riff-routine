"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CHROMATIC_NOTES, CHORD_INTERVALS, INTERVAL_NAMES, PREDEFINED_COLORS, SCALES, STANDARD_TUNING, DEFAULT_INTERVAL_COLORS } from '@/lib/constants';
import { Fretboard } from './Fretboard';
import { useScaleLogic } from '@/hooks/useScaleLogic';
import { supabase } from '@/lib/supabase';

let audioCtx: AudioContext | null = null;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playFreq(freq: number, startTime: number, duration: number, vol = 0.2) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(vol, startTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function getNoteFrequency(noteName: string, octave: number) {
  const noteIndex = CHROMATIC_NOTES.indexOf(noteName);
  const midiNote = (octave + 1) * 12 + noteIndex;
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

const COLOR_KEYS: Record<string, string> = {
  '#7f8c8d': 'grey', '#e74c3c': 'red', '#3498db': 'blue', '#2ecc71': 'green',
  '#f1c40f': 'yellow', '#9b59b6': 'purple', '#e67e22': 'orange', '#e84393': 'pink'
};

export function ScalesPanel() {
  const t = useTranslations('ScalesPanel');
  const mc = useTranslations('MusicConstants');

  const [rootNote, setRootNote] = useState('A');
  const [scaleKey, setScaleKey] = useState('pentatonic-minor');
  const [chordType, setChordType] = useState<'triads' | 'tetrads'>('triads');
  const [viewMode, setViewMode] = useState<'full' | 'positions'>('full');
  const [posViewMode, setPosViewMode] = useState<'carousel' | 'list'>('carousel');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [labelMode, setLabelMode] = useState<'notes' | 'intervals'>('notes');
  const [leftyMode, setLeftyMode] = useState(false);
  const [userColors, setUserColors] = useState<Record<number, string>>({});

  const [isEditingPos, setIsEditingPos] = useState<string | null>(null);
  const [draftPosNotes, setDraftPosNotes] = useState<{ string: number, fret: number }[]>([]);
  const [showTheory, setShowTheory] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('lefty_mode, default_view')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.lefty_mode !== null) setLeftyMode(profile.lefty_mode);
          if (profile.default_view) setLabelMode(profile.default_view);
        }
      }
    };
    fetchPreferences();
  }, []);

  useEffect(() => {
    setCarouselIndex(0);
  }, [scaleKey, rootNote]);

  const { scaleData, scaleNotes, positionsData } = useScaleLogic(rootNote, scaleKey, viewMode, t);

  const getIntervalColor = (interval: number) => userColors[interval] || DEFAULT_INTERVAL_COLORS[interval] || '#7f8c8d';

  const handleColorChange = (interval: number, color: string) => {
    setUserColors(prev => ({ ...prev, [interval]: color }));
  };

  const playChord = (rootStr: string, cType: string) => {
    initAudio();
    if (!audioCtx) return;
    const intervals = CHORD_INTERVALS[cType];
    if (!intervals) return;

    const rootIdx = CHROMATIC_NOTES.indexOf(rootStr);
    const currentTime = audioCtx.currentTime;

    intervals.forEach(interval => {
      const noteIdx = (rootIdx + interval) % 12;
      const octaveOffset = Math.floor((rootIdx + interval) / 12);
      const octave = 3 + octaveOffset;
      const freq = getNoteFrequency(CHROMATIC_NOTES[noteIdx], octave);
      playFreq(freq, currentTime, 1.8, 0.12);
    });
  };

  const playScale = () => {
    initAudio();
    if (!audioCtx) return;
    let currentTime = audioCtx.currentTime;
    let currentOctave = 3;

    scaleNotes.forEach((note: string, i: number) => {
      let noteIdx = CHROMATIC_NOTES.indexOf(note);
      if (i > 0 && noteIdx < CHROMATIC_NOTES.indexOf(scaleNotes[i - 1])) currentOctave++;
      let freq = getNoteFrequency(note, currentOctave);
      playFreq(freq, currentTime + i * 0.35, 0.6, 0.2);
    });

    let lastNoteIdx = CHROMATIC_NOTES.indexOf(scaleNotes[scaleNotes.length - 1]);
    let rootIdx = CHROMATIC_NOTES.indexOf(rootNote);
    if (rootIdx <= lastNoteIdx) currentOctave++;

    let finalFreq = getNoteFrequency(rootNote, currentOctave);
    playFreq(finalFreq, currentTime + scaleNotes.length * 0.35, 1.2, 0.2);
  };

  const handleExportCustomPosition = () => {
    if (draftPosNotes.length === 0 || isEditingPos === null) return;

    const rootNotesInShape = draftPosNotes.filter(n => {
      const stringBaseIndex = CHROMATIC_NOTES.indexOf(STANDARD_TUNING[n.string]);
      const noteName = CHROMATIC_NOTES[(stringBaseIndex + n.fret) % 12];
      return noteName === rootNote;
    });

    if (rootNotesInShape.length === 0) {
      alert(`Para exportar, la figura debe contener al menos una nota tónica (${rootNote}).`);
      return;
    }

    rootNotesInShape.sort((a, b) => b.string - a.string);
    const anchorNote = rootNotesInShape[0];

    const exportData = {
      rootStr: anchorNote.string,
      notes: draftPosNotes.map(n => ({
        s: n.string,
        o: n.fret - anchorNote.fret
      }))
    };

    const jsonStr = JSON.stringify(exportData);
    const snippet = `"${isEditingPos}": ${jsonStr}`;

    navigator.clipboard.writeText(snippet);
    alert(`Copiado al portapapeles:\n\n${snippet}\n\nPégalo en lib/constants.ts bajo customPositions de '${scaleKey}'`);
    setIsEditingPos(null);
  };

  const fretboardProps = {
    rootNote,
    scaleData,
    isEditingPos,
    draftPosNotes,
    setDraftPosNotes,
    setIsEditingPos,
    handleExportCustomPosition,
    initAudio,
    audioCtx,
    playFreq,
    getNoteFrequency,
    leftyMode,
    labelMode,
    scaleNotes,
    getIntervalColor,
    t
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1600px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--surface)', padding: '1.2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <select value={rootNote} onChange={e => setRootNote(e.target.value)} style={{ padding: '0.6rem 1rem', background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '8px', outline: 'none', fontSize: '1rem', fontWeight: 'bold' }}>
              {CHROMATIC_NOTES.map(note => <option key={note} value={note}>{note}</option>)}
            </select>
            <select value={scaleKey} onChange={e => setScaleKey(e.target.value)} style={{ padding: '0.6rem 1rem', background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '8px', outline: 'none', fontSize: '1rem', fontWeight: 'bold' }}>
              {Object.keys(SCALES).map((key) => <option key={key} value={key}>{mc(`scales.${key}.name`)}</option>)}
            </select>
            <button onClick={playScale} style={{ background: 'var(--gold)', color: '#111', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              {t('playScale')}
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1a1a1a', padding: '0.3rem', borderRadius: '8px' }}>
            <button onClick={() => setLabelMode('notes')} style={{ background: labelMode === 'notes' ? '#333' : 'transparent', color: labelMode === 'notes' ? '#fff' : '#888', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
              {t('labelMode.notes')}
            </button>
            <button onClick={() => setLabelMode('intervals')} style={{ background: labelMode === 'intervals' ? '#333' : 'transparent', color: labelMode === 'intervals' ? '#fff' : '#888', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
              {t('labelMode.intervals')}
            </button>
            <div style={{ width: '1px', height: '20px', background: '#333', margin: '0 4px' }}></div>
            <button onClick={() => setLeftyMode(!leftyMode)} style={{ background: leftyMode ? 'var(--gold)' : 'transparent', color: leftyMode ? '#111' : '#888', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
              {t('leftyMode')}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'center', background: '#111', padding: '0.5rem', borderRadius: '8px', border: '1px solid #222' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => { setViewMode('full'); setIsEditingPos(null); }} style={{ background: viewMode === 'full' ? 'var(--gold)' : 'transparent', color: viewMode === 'full' ? '#111' : '#888', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
              {t('viewMode.full')}
            </button>
            <button onClick={() => setViewMode('positions')} style={{ background: viewMode === 'positions' ? 'var(--gold)' : 'transparent', color: viewMode === 'positions' ? '#111' : '#888', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
              {t('viewMode.positions')}
            </button>
          </div>

          {viewMode === 'positions' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid #333', paddingLeft: '1rem' }}>
              <button onClick={() => setPosViewMode('carousel')} style={{ background: posViewMode === 'carousel' ? '#333' : 'transparent', color: posViewMode === 'carousel' ? '#fff' : '#888', border: '1px solid #333', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
                {t('viewMode.carousel')}
              </button>
              <button onClick={() => setPosViewMode('list')} style={{ background: posViewMode === 'list' ? '#333' : 'transparent', color: posViewMode === 'list' ? '#fff' : '#888', border: '1px solid #333', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
                {t('viewMode.list')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--surface)', padding: '2rem 1rem 1rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
        {viewMode === 'full' ? (
          <Fretboard {...fretboardProps} />
        ) : (
          <>
            {posViewMode === 'carousel' && (positionsData?.length ?? 0) > 0 ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem', background: '#111', padding: '0.5rem 1.5rem', borderRadius: '50px', border: '1px solid #333' }}>
                  <button
                    onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                    disabled={carouselIndex === 0}
                    style={{ background: 'transparent', color: carouselIndex === 0 ? '#333' : 'var(--gold)', border: 'none', cursor: carouselIndex === 0 ? 'default' : 'pointer', fontSize: '1.5rem', fontWeight: 'bold', padding: '0 0.5rem' }}
                  >
                    &lt;
                  </button>
                  <div style={{ minWidth: '160px', textAlign: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {positionsData?.[carouselIndex]?.title || `Posición ${carouselIndex + 1}`}
                    <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {carouselIndex + 1} de {positionsData?.length || 0}
                    </div>
                  </div>
                  <button
                    onClick={() => setCarouselIndex(prev => Math.min((positionsData?.length ?? 1) - 1, prev + 1))}
                    disabled={carouselIndex === (positionsData?.length ?? 1) - 1}
                    style={{ background: 'transparent', color: carouselIndex === (positionsData?.length ?? 1) - 1 ? '#333' : 'var(--gold)', border: 'none', cursor: carouselIndex === (positionsData?.length ?? 1) - 1 ? 'default' : 'pointer', fontSize: '1.5rem', fontWeight: 'bold', padding: '0 0.5rem' }}
                  >
                    &gt;
                  </button>
                </div>

                {positionsData?.[carouselIndex] && (
                  <Fretboard
                    activeNotesList={positionsData[carouselIndex].activeNotes}
                    title=""
                    positionIndex={positionsData[carouselIndex].id}
                    showGhostNotes={true}
                    {...fretboardProps}
                  />
                )}
              </div>
            ) : (
              positionsData?.map((pos: any, idx: number) => (
                <Fretboard 
                  key={`${pos.id}-${idx}`} 
                  activeNotesList={pos.activeNotes} 
                  title={pos.title} 
                  positionIndex={pos.id}
                  showGhostNotes={false}
                  {...fretboardProps} 
                />
              ))
            )}

            {process.env.NODE_ENV === 'development' && isEditingPos === null && (
              <button
                onClick={() => {
                  const newId = window.prompt("Introduce el identificador de la posición (ej: 3A, 6, CAGED-C):");
                  if (newId && newId.trim() !== "") {
                    setIsEditingPos(newId.trim());
                    setDraftPosNotes([]);
                  }
                }}
                style={{ background: 'rgba(220, 185, 138, 0.05)', color: 'var(--gold)', border: '1px dashed rgba(220, 185, 138, 0.3)', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '1rem', width: '100%', maxWidth: '400px', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220, 185, 138, 0.1)'; e.currentTarget.style.borderColor = 'var(--gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220, 185, 138, 0.05)'; e.currentTarget.style.borderColor = 'rgba(220, 185, 138, 0.3)'; }}
              >
                + Crear Posición Custom Extra
              </button>
            )}

            {isEditingPos !== null && (!positionsData || !positionsData.some((p: any) => p.id === isEditingPos)) && (
              <Fretboard
                activeNotesList={[]}
                title={t('positionTitle', { pos: isEditingPos })}
                positionIndex={isEditingPos}
                {...fretboardProps}
              />
            )}
          </>
        )}
      </div>

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
                <button onClick={() => setChordType('triads')} style={{ background: chordType === 'triads' ? '#333' : 'transparent', color: chordType === 'triads' ? '#fff' : '#888', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>{t('chordType.triads')}</button>
                <button onClick={() => setChordType('tetrads')} style={{ background: chordType === 'tetrads' ? '#333' : 'transparent', color: chordType === 'tetrads' ? '#fff' : '#888', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>{t('chordType.tetrads')}</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '1rem', alignItems: 'center', background: '#1a1a1a', padding: '0.8rem 1rem', borderRadius: '8px' }}>
                  <div style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('labels.notes')}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {scaleNotes.map((n: string, i: number) => <div key={i} style={{ flex: '1 1 0%', minWidth: '35px', textAlign: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{n}</div>)}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '1rem', alignItems: 'center', background: '#1a1a1a', padding: '0.8rem 1rem', borderRadius: '8px' }}>
                  <div style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('labels.intervals')}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {scaleData.intervals.map((inv: number, i: number) => <div key={i} style={{ flex: '1 1 0%', minWidth: '35px', textAlign: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{scaleData.intervalAliases?.[inv] || INTERVAL_NAMES[inv]}</div>)}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '1rem', alignItems: 'center', background: '#1a1a1a', padding: '0.8rem 1rem', borderRadius: '8px' }}>
                  <div style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('labels.chords')}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {scaleNotes.map((n: string, i: number) => {
                      const chordVal = scaleData[chordType]?.[i];
                      const chordStr = chordVal ? `${n}${chordVal}` : '-';
                      return (
                        <div
                          key={i}
                          onClick={() => chordVal && playChord(n, chordVal)}
                          style={{ flex: '1 1 0%', minWidth: '35px', textAlign: 'center', color: 'var(--gold)', fontWeight: 'bold', fontSize: '0.9rem', cursor: chordVal ? 'pointer' : 'default' }}
                          title={chordVal ? "t('labels.playChordTooltip')" : ""}
                        >
                          {chordStr}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '1rem', alignItems: 'center', background: '#1a1a1a', padding: '0.8rem 1rem', borderRadius: '8px' }}>
                  <div style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('labels.colors')}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {scaleData.intervals.map((inv: number, i: number) => {
                      const currentColor = getIntervalColor(inv);
                      const textColor = (currentColor === '#f1c40f' || currentColor === '#2ecc71') ? '#000' : '#fff';
                      return (
                        <select
                          key={i}
                          value={currentColor}
                          onChange={e => handleColorChange(inv, e.target.value)}
                          style={{ flex: '1 1 0%', minWidth: '35px', padding: '0', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', fontSize: '0.75rem', height: '24px', appearance: 'none', WebkitAppearance: 'none', background: currentColor, color: textColor }}
                        >
                          {Object.entries(PREDEFINED_COLORS).map(([hex, name]) => (
                            <option key={hex} value={hex}>{mc(`colors.${COLOR_KEYS[hex]}`)}</option>
                          ))}
                        </select>
                      );
                    })}
                  </div>
                </div>

              </div>

              <div style={{ flex: '1 1 250px', background: '#111', borderLeft: '3px solid var(--gold)', padding: '1.5rem', borderRadius: '8px', fontSize: '0.95rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {scaleData.target || scaleData.chords ? (
                  <>
                    <p style={{ margin: '0 0 1rem 0' }}><span style={{ color: '#888', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>{t('theory.usage')}</span> {mc(`scales.${scaleKey}.desc`)}</p>
                    <p style={{ margin: '0 0 1rem 0' }}><span style={{ color: '#888', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>{t('theory.targetNotes')}</span> {scaleData.target || '-'}</p>
                    <p style={{ margin: 0 }}><span style={{ color: '#888', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>{t('theory.playOver')}</span> {scaleData.chords || '-'}</p>
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