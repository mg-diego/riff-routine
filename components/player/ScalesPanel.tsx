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
  const [labelMode, setLabelMode] = useState<'notes' | 'intervals'>('notes');
  const [leftyMode, setLeftyMode] = useState(false);
  const [userColors, setUserColors] = useState<Record<number, string>>({});

  const [isEditingPos, setIsEditingPos] = useState<string | null>(null);
  const [draftPosNotes, setDraftPosNotes] = useState<{ string: number, fret: number }[]>([]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '1600px', margin: '0 auto', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', padding: '1rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
        <h1 style={{ fontSize: '1.2rem', color: 'var(--gold)', margin: 0, fontWeight: 'bold' }}>
          {mc(`scales.${scaleKey}.name`)} ({rootNote})
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          <select value={rootNote} onChange={e => setRootNote(e.target.value)} style={{ padding: '0.4rem', background: 'var(--surface2)', color: '#fff', border: '1px solid #555', borderRadius: '6px', outline: 'none' }}>
            {CHROMATIC_NOTES.map(note => <option key={note} value={note}>{note}</option>)}
          </select>
          <select value={scaleKey} onChange={e => setScaleKey(e.target.value)} style={{ padding: '0.4rem', background: 'var(--surface2)', color: '#fff', border: '1px solid #555', borderRadius: '6px', outline: 'none' }}>
            {Object.keys(SCALES).map((key) => <option key={key} value={key}>{mc(`scales.${key}.name`)}</option>)}
          </select>
          <button onClick={playScale} style={{ background: 'var(--gold)', color: '#111', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>{t('playScale')}</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', background: 'var(--surface)', padding: '1rem', borderRadius: '8px' }}>
        <div data-onboarding="scales-selector" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', background: '#1a1a1a', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.9rem' }}>
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><input type="radio" checked={viewMode === 'full'} onChange={() => { setViewMode('full'); setIsEditingPos(null); }} /> {t('viewMode.full')}</label>
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><input type="radio" checked={viewMode === 'positions'} onChange={() => setViewMode('positions')} /> {t('viewMode.positions')}</label>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', background: '#1a1a1a', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.9rem' }}>
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><input type="radio" checked={labelMode === 'notes'} onChange={() => setLabelMode('notes')} /> {t('labelMode.notes')}</label>
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><input type="radio" checked={labelMode === 'intervals'} onChange={() => setLabelMode('intervals')} /> {t('labelMode.intervals')}</label>
        </div>
        <div style={{ display: 'flex', gap: '1rem', background: '#1a1a1a', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.9rem' }}>
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><input type="checkbox" checked={leftyMode} onChange={e => setLeftyMode(e.target.checked)} /> {t('leftyMode')}</label>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--surface)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '12px', marginBottom: '8px', gap: '1rem' }}>
          <div style={{ fontWeight: 'bold', color: 'var(--gold)', fontSize: '1.1rem' }}>{t('scaleConfig')}</div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}><input type="radio" checked={chordType === 'triads'} onChange={() => setChordType('triads')} /> {t('chordType.triads')}</label>
            <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}><input type="radio" checked={chordType === 'tetrads'} onChange={() => setChordType('tetrads')} /> {t('chordType.tetrads')}</label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', width: '100%' }}>
          <div style={{ flex: '3 1 550px', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '80px', flexShrink: 0, color: 'var(--gold)', fontWeight: 'bold', fontSize: '0.95rem' }}>{t('labels.notes')}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                {scaleNotes.map((n: string, i: number) => <div key={i} style={{ flex: '1 1 0%', minWidth: '40px', maxWidth: '75px', textAlign: 'center', background: '#3a3a3a', padding: '6px 2px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>{n}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '80px', flexShrink: 0, color: 'var(--gold)', fontWeight: 'bold', fontSize: '0.95rem' }}>{t('labels.intervals')}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                {scaleData.intervals.map((inv: number, i: number) => <div key={i} style={{ flex: '1 1 0%', minWidth: '40px', maxWidth: '75px', textAlign: 'center', background: '#2c3e50', padding: '6px 2px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>{scaleData.intervalAliases?.[inv] || INTERVAL_NAMES[inv]}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '80px', flexShrink: 0, color: 'var(--gold)', fontWeight: 'bold', fontSize: '0.95rem' }}>{t('labels.chords')}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                {scaleNotes.map((n: string, i: number) => {
                  const chordVal = scaleData[chordType]?.[i];
                  const chordStr = chordVal ? `${n}${chordVal}` : '-';
                  return (
                    <div
                      key={i}
                      onClick={() => chordVal && playChord(n, chordVal)}
                      style={{ flex: '1 1 0%', minWidth: '40px', maxWidth: '75px', textAlign: 'center', background: '#8b5a2b', padding: '6px 2px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: chordVal ? 'pointer' : 'default' }}
                      title={chordVal ? "t('labels.playChordTooltip')" : ""}
                    >
                      {chordStr}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '80px', flexShrink: 0, color: 'var(--gold)', fontWeight: 'bold', fontSize: '0.95rem' }}>{t('labels.colors')}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                {scaleData.intervals.map((inv: number, i: number) => {
                  const currentColor = getIntervalColor(inv);
                  const textColor = (currentColor === '#f1c40f' || currentColor === '#2ecc71') ? '#000' : '#fff';
                  return (
                    <select
                      key={i}
                      value={currentColor}
                      onChange={e => handleColorChange(inv, e.target.value)}
                      style={{ flex: '1 1 0%', minWidth: '40px', maxWidth: '75px', padding: '0', border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', height: '28px', appearance: 'none', WebkitAppearance: 'none', background: currentColor, color: textColor }}
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

          <div style={{ flex: '1 1 200px', background: '#1f1f1f', borderLeft: '4px solid var(--gold)', padding: '1rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
            {scaleData.target || scaleData.chords ? (
              <>
                <p style={{ margin: '0 0 0.6rem 0', wordBreak: 'break-word' }}><span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{t('theory.usage')}</span> {mc(`scales.${scaleKey}.desc`)}</p>
                <p style={{ margin: '0 0 0.6rem 0', wordBreak: 'break-word' }}><span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{t('theory.targetNotes')}</span> {scaleData.target || '-'}</p>
                <p style={{ margin: 0, wordBreak: 'break-word' }}><span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{t('theory.playOver')}</span> {scaleData.chords || '-'}</p>
              </>
            ) : (
              <p style={{ color: '#888', margin: 0 }}>{t('theory.noInfo')}</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {viewMode === 'full' ? (
          <Fretboard {...fretboardProps} />
        ) : (
          <>
            {positionsData?.map((pos: any, idx: number) => (
              <Fretboard 
                key={`${pos.id}-${idx}`} 
                activeNotesList={pos.activeNotes} 
                title={pos.title} 
                positionIndex={pos.id} 
                {...fretboardProps} 
              />
            ))}

            {process.env.NODE_ENV === 'development' && isEditingPos === null && (
              <button
                onClick={() => {
                  const newId = window.prompt("Introduce el identificador de la posición (ej: 3A, 6, CAGED-C):");
                  if (newId && newId.trim() !== "") {
                    setIsEditingPos(newId.trim());
                    setDraftPosNotes([]);
                  }
                }}
                style={{
                  background: 'rgba(220, 185, 138, 0.1)',
                  color: 'var(--gold)',
                  border: '1px dashed var(--gold)',
                  padding: '1rem 2rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  marginTop: '1rem',
                  width: '100%',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(220, 185, 138, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(220, 185, 138, 0.1)'}
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
    </div>
  );
}