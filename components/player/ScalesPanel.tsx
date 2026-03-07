"use client";

import { CHROMATIC_NOTES, CHORD_INTERVALS, INTERVAL_NAMES, MARKED_FRETS, PREDEFINED_COLORS, SCALES, STANDARD_BASES, STANDARD_TUNING, DEFAULT_INTERVAL_COLORS } from '@/lib/constants';
import React, { useState, useMemo } from 'react';

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

export function ScalesPanel() {
  const [rootNote, setRootNote] = useState('A');
  const [scaleKey, setScaleKey] = useState('pentatonic-minor');
  const [chordType, setChordType] = useState<'triads' | 'tetrads'>('triads');
  const [viewMode, setViewMode] = useState<'full' | 'positions'>('full');
  const [labelMode, setLabelMode] = useState<'notes' | 'intervals'>('notes');
  const [leftyMode, setLeftyMode] = useState(false);
  const [userColors, setUserColors] = useState<Record<number, string>>({});

  const scaleData = SCALES[scaleKey];
  
  const scaleNotes = useMemo(() => {
    const rootIndex = CHROMATIC_NOTES.indexOf(rootNote);
    return scaleData.intervals.map((interval: number) => CHROMATIC_NOTES[(rootIndex + interval) % 12]);
  }, [rootNote, scaleKey]);

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
      if (i > 0 && noteIdx < CHROMATIC_NOTES.indexOf(scaleNotes[i-1])) currentOctave++;
      let freq = getNoteFrequency(note, currentOctave);
      playFreq(freq, currentTime + i * 0.35, 0.6, 0.2);
    });

    let lastNoteIdx = CHROMATIC_NOTES.indexOf(scaleNotes[scaleNotes.length-1]);
    let rootIdx = CHROMATIC_NOTES.indexOf(rootNote);
    if (rootIdx <= lastNoteIdx) currentOctave++;
    
    let finalFreq = getNoteFrequency(rootNote, currentOctave);
    playFreq(finalFreq, currentTime + scaleNotes.length * 0.35, 1.2, 0.2);
  };

  const positionsData = useMemo(() => {
    if (viewMode === 'full') return null;

    const N = scaleNotes.length;
    let baseLowest = STANDARD_BASES[5];
    let stringBasesInternal = STANDARD_BASES.map(b => b - baseLowest);
    let eRootIndex = CHROMATIC_NOTES.indexOf(STANDARD_TUNING[5]);
    
    let positions = [];

    if (N <= 4) {
      let scalePitches: number[] = [];
      for (let pitch = 0; pitch <= 60; pitch++) {
        let noteName = CHROMATIC_NOTES[(eRootIndex + pitch) % 12];
        if (scaleNotes.includes(noteName)) scalePitches.push(pitch);
      }

      for (let p = 0; p < N; p++) {
        let activeNotes = [];
        let startNote = scaleNotes[p];
        let baseFret = (CHROMATIC_NOTES.indexOf(startNote) - eRootIndex + 12) % 12;
        if (baseFret === 0) baseFret += 12;

        let startPitch = baseFret;
        let startIndex = scalePitches.indexOf(startPitch);
        if (startIndex === -1) startIndex = scalePitches.indexOf(startPitch + 12);

        let currentIndex = startIndex;
        let currentString = 5;
        let currentFret = scalePitches[currentIndex] - stringBasesInternal[5];
        let notesOnString = 0;

        while (currentIndex < scalePitches.length && currentString >= 0) {
            let pitch = scalePitches[currentIndex];
            let fretSame = pitch - stringBasesInternal[currentString];
            let fretNext = currentString > 0 ? pitch - stringBasesInternal[currentString - 1] : -1;
            let placeOnSame = false;

            if (notesOnString === 0) {
                 placeOnSame = true;
            } else if (notesOnString < 2 && fretSame <= currentFret + 5) {
                 let costSame = (fretSame - currentFret) * 1;
                 let costNext = Infinity;
                 if (fretNext >= 0) {
                     if (fretNext < currentFret) costNext = (currentFret - fretNext) * 3 + 2;
                     else costNext = (fretNext - currentFret) * 1 + 2;
                 }
                 if (costSame <= costNext) placeOnSame = true;
            }

            if (placeOnSame && fretSame >= 0 && fretSame <= 24) {
                activeNotes.push({ string: currentString, fret: fretSame, note: CHROMATIC_NOTES[(eRootIndex + pitch) % 12] });
                currentFret = fretSame;
                notesOnString++;
                currentIndex++;
            } else {
                currentString--;
                notesOnString = 0;
            }
        }

        let string6Note = activeNotes.find(n => n.string === 5);
        let startFret = string6Note ? string6Note.fret : 0;
        positions.push({ activeNotes, startFret, title: `Posición ${p + 1}` });
      }
    } else {
      const nps = N <= 5 ? 2 : 3;
      for (let p = 0; p < N; p++) {
        let activeNotes = [];
        let startNote = scaleNotes[p];
        let baseFret = (CHROMATIC_NOTES.indexOf(startNote) - eRootIndex + 12) % 12;
        let currentPitch = baseFret;

        for (let s = 5; s >= 0; s--) {
          let found = 0;
          while (found < nps) {
            let noteName = CHROMATIC_NOTES[(eRootIndex + currentPitch) % 12];
            if (scaleNotes.includes(noteName)) {
              let fret = currentPitch - stringBasesInternal[s];
              if (fret < 0) { fret += 12; currentPitch += 12; }
              activeNotes.push({string: s, fret: fret, note: noteName});
              found++;
            }
            currentPitch++;
          }
        }

        let string6Note = activeNotes.find(n => n.string === 5);
        let startFret = string6Note ? string6Note.fret : 0;

        if (startFret === 0) {
          activeNotes = activeNotes.map(n => ({...n, fret: n.fret + 12}));
          startFret += 12;
        }

        positions.push({ activeNotes, startFret, title: `Posición ${p + 1} (traste ${startFret})` });
      }
    }

    let extendedPositions: { activeNotes: { string: number; fret: number; note: string; }[] | { fret: number; string: number; note: string; }[] | { fret: number; string: number; note: string; }[]; startFret: number; title: string; }[] = [];
    
    positions.forEach(pos => {
      extendedPositions.push(pos);
      
      let newStartFret12 = pos.startFret + 12;
      if (newStartFret12 <= 24) {
        let newActiveNotes = pos.activeNotes
          .map(n => ({ ...n, fret: n.fret + 12 }))
          .filter(n => n.fret <= 24);
        
        if (newActiveNotes.length > 0) {
          let baseTitle = pos.title.split(' (')[0];
          extendedPositions.push({
            activeNotes: newActiveNotes,
            startFret: newStartFret12,
            title: `${baseTitle} (traste ${newStartFret12})`
          });
        }
      }

      let newStartFret24 = pos.startFret + 24;
      if (newStartFret24 <= 24) {
        let newActiveNotes = pos.activeNotes
          .map(n => ({ ...n, fret: n.fret + 24 }))
          .filter(n => n.fret <= 24);
        
        if (newActiveNotes.length > 0) {
          let baseTitle = pos.title.split(' (')[0];
          extendedPositions.push({
            activeNotes: newActiveNotes,
            startFret: newStartFret24,
            title: `${baseTitle} (traste ${newStartFret24})`
          });
        }
      }
    });

    return extendedPositions.sort((a, b) => a.startFret - b.startFret);
  }, [viewMode, scaleNotes]);

  const Fretboard = ({ activeNotesList, title }: { activeNotesList?: any[], title?: string }) => {
    const rootIndexGlobal = CHROMATIC_NOTES.indexOf(rootNote);
    const aliases = scaleData.intervalAliases || {};

    const handlePlayPos = () => {
      initAudio();
      if (!audioCtx || !activeNotesList) return;
      
      const sortedNotes = [...activeNotesList].sort((a, b) => {
        const pitchA = STANDARD_BASES[a.string] + a.fret;
        const pitchB = STANDARD_BASES[b.string] + b.fret;
        return pitchA - pitchB;
      });

      let currentTime = audioCtx.currentTime;
      sortedNotes.forEach((n, i) => {
        const pitch = STANDARD_BASES[n.string] + n.fret;
        const freq = 440 * Math.pow(2, (pitch - 69) / 12);
        playFreq(freq, currentTime + i * 0.3, 0.5, 0.2);
      });
    };

    return (
      <div style={{ width: '100%', marginBottom: '3rem' }}>
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0 1rem' }}>
            <h3 style={{ color: 'var(--gold)', margin: 0 }}>{title}</h3>
            {activeNotesList && (
              <button onClick={handlePlayPos} style={{ background: 'var(--surface2)', color: 'var(--gold)', border: '1px solid var(--gold)', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                ▶ Reproducir Posición
              </button>
            )}
          </div>
        )}
        <div style={{ width: '100%', paddingBottom: '1rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'minmax(15px, 4%) repeat(24, minmax(0, 1fr))', 
            background: '#2a1a0a', 
            border: '2px solid #8b5a2b', 
            borderRadius: '8px', 
            padding: '1% 1% 1% 0',
            width: '100%',
            transform: leftyMode ? 'scaleX(-1)' : 'none'
          }}>
            <div></div>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={`header-${i}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '10px', color: 'var(--gold)', fontSize: 'clamp(8px, 1.2vw, 14px)', fontWeight: 'bold', transform: leftyMode ? 'scaleX(-1)' : 'none' }}>
                {i + 1}
              </div>
            ))}

            {STANDARD_TUNING.map((openNote, stringIndex) => {
              const stringRootIndex = CHROMATIC_NOTES.indexOf(openNote);
              const baseOctave = Math.floor(STANDARD_BASES[stringIndex] / 12) - 1;
              
              return (
                <React.Fragment key={`string-${stringIndex}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: 'clamp(10px, 1.5vw, 16px)', paddingRight: '4px', transform: leftyMode ? 'scaleX(-1)' : 'none' }}>
                    {openNote}
                  </div>

                  {Array.from({ length: 24 }).map((_, fretIndex) => {
                    const fret = fretIndex + 1;
                    const currentNote = CHROMATIC_NOTES[(stringRootIndex + fret) % 12];
                    const currentNoteIndex = CHROMATIC_NOTES.indexOf(currentNote);
                    const interval = (currentNoteIndex - rootIndexGlobal + 12) % 12;
                    const intervalNameStr = aliases[interval] || INTERVAL_NAMES[interval];
                    const currentOctave = baseOctave + Math.floor((stringRootIndex + fret) / 12);
                    
                    let isActive = false;
                    if (activeNotesList) {
                      isActive = activeNotesList.some(n => n.string === stringIndex && n.fret === fret);
                    } else {
                      isActive = scaleNotes.includes(currentNote);
                    }

                    const isMarked = MARKED_FRETS.includes(fret);
                    const bgColor = getIntervalColor(interval);
                    const textColor = (bgColor === '#f1c40f' || bgColor === '#2ecc71') ? '#000' : '#fff';

                    return (
                      <div key={`cell-${stringIndex}-${fret}`} style={{
                        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRight: 'clamp(1px, 0.2vw, 3px) solid silver', height: 'clamp(20px, 3.5vw, 42px)',
                        backgroundColor: isMarked ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
                      }}>
                        <div style={{
                          position: 'absolute', left: 0, right: 0, zIndex: 1,
                          height: `${1 + stringIndex * 0.5}px`,
                          background: 'linear-gradient(to bottom, #d5d5d5 0%, #8a8a8a 40%, #505050 100%)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.5)'
                        }} />
                        
                        {isActive && (
                          <div 
                            onClick={() => {
                              initAudio();
                              const freq = getNoteFrequency(currentNote, currentOctave);
                              playFreq(freq, audioCtx!.currentTime, 0.8, 0.2);
                            }}
                            style={{
                              width: 'clamp(12px, 2.5vw, 26px)', height: 'clamp(12px, 2.5vw, 26px)', borderRadius: '50%',
                              backgroundColor: bgColor, color: textColor, 
                              fontSize: 'clamp(6px, 1vw, 11px)', fontWeight: 'bold',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              zIndex: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                              cursor: 'pointer', transform: leftyMode ? 'scaleX(-1)' : 'none',
                              transition: 'transform 0.1s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = leftyMode ? 'scaleX(-1) scale(1.15)' : 'scale(1.15)'}
                            onMouseLeave={e => e.currentTarget.style.transform = leftyMode ? 'scaleX(-1)' : 'none'}
                          >
                            {labelMode === 'notes' ? currentNote : intervalNameStr}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '1600px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', padding: '1rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
        <h1 style={{ fontSize: '1.2rem', color: 'var(--gold)', margin: 0, fontWeight: 'bold' }}>{scaleData.name} ({rootNote})</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          <select value={rootNote} onChange={e => setRootNote(e.target.value)} style={{ padding: '0.4rem', background: 'var(--surface2)', color: '#fff', border: '1px solid #555', borderRadius: '6px', outline: 'none' }}>
            {CHROMATIC_NOTES.map(note => <option key={note} value={note}>{note}</option>)}
          </select>
          <select value={scaleKey} onChange={e => setScaleKey(e.target.value)} style={{ padding: '0.4rem', background: 'var(--surface2)', color: '#fff', border: '1px solid #555', borderRadius: '6px', outline: 'none' }}>
            {Object.entries(SCALES).map(([key, data]) => <option key={key} value={key}>{data.name}</option>)}
          </select>
          <button onClick={playScale} style={{ background: 'var(--gold)', color: '#111', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>▶ Reproducir Escala</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', background: 'var(--surface)', padding: '1rem', borderRadius: '8px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', background: '#1a1a1a', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.9rem' }}>
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><input type="radio" checked={viewMode === 'full'} onChange={() => setViewMode('full')} /> Completo</label>
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><input type="radio" checked={viewMode === 'positions'} onChange={() => setViewMode('positions')} /> Posiciones</label>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', background: '#1a1a1a', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.9rem' }}>
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><input type="radio" checked={labelMode === 'notes'} onChange={() => setLabelMode('notes')} /> Notas</label>
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><input type="radio" checked={labelMode === 'intervals'} onChange={() => setLabelMode('intervals')} /> Intervalos</label>
        </div>
        <div style={{ display: 'flex', gap: '1rem', background: '#1a1a1a', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.9rem' }}>
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><input type="checkbox" checked={leftyMode} onChange={e => setLeftyMode(e.target.checked)} /> Zurdo</label>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--surface)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '12px', marginBottom: '8px', gap: '1rem' }}>
          <div style={{ fontWeight: 'bold', color: 'var(--gold)', fontSize: '1.1rem' }}>Configuración de la Escala</div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}><input type="radio" checked={chordType === 'triads'} onChange={() => setChordType('triads')} /> Tríadas</label>
            <label style={{ cursor: 'pointer', fontSize: '0.9rem' }}><input type="radio" checked={chordType === 'tetrads'} onChange={() => setChordType('tetrads')} /> Tétradas</label>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', width: '100%' }}>
          <div style={{ flex: '3 1 550px', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '80px', flexShrink: 0, color: 'var(--gold)', fontWeight: 'bold', fontSize: '0.95rem' }}>Notas</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                {scaleNotes.map((n: string, i: number) => <div key={i} style={{ flex: '1 1 0%', minWidth: '40px', maxWidth: '75px', textAlign: 'center', background: '#3a3a3a', padding: '6px 2px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>{n}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '80px', flexShrink: 0, color: 'var(--gold)', fontWeight: 'bold', fontSize: '0.95rem' }}>Intervalos</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                {scaleData.intervals.map((inv: number, i: number) => <div key={i} style={{ flex: '1 1 0%', minWidth: '40px', maxWidth: '75px', textAlign: 'center', background: '#2c3e50', padding: '6px 2px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>{scaleData.intervalAliases?.[inv] || INTERVAL_NAMES[inv]}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '80px', flexShrink: 0, color: 'var(--gold)', fontWeight: 'bold', fontSize: '0.95rem' }}>Acordes</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                {scaleNotes.map((n: string, i: number) => {
                  const chordVal = scaleData[chordType]?.[i];
                  const chordStr = chordVal ? `${n}${chordVal}` : '-';
                  return (
                    <div 
                      key={i} 
                      onClick={() => chordVal && playChord(n, chordVal)}
                      style={{ flex: '1 1 0%', minWidth: '40px', maxWidth: '75px', textAlign: 'center', background: '#8b5a2b', padding: '6px 2px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: chordVal ? 'pointer' : 'default' }}
                      title={chordVal ? "Reproducir acorde" : ""}
                    >
                      {chordStr}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '80px', flexShrink: 0, color: 'var(--gold)', fontWeight: 'bold', fontSize: '0.95rem' }}>Colores</div>
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
                      {Object.entries(PREDEFINED_COLORS).map(([hex, name]) => <option key={hex} value={hex}>{name}</option>)}
                    </select>
                  );
                })}
              </div>
            </div>

          </div>

          <div style={{ flex: '1 1 200px', background: '#1f1f1f', borderLeft: '4px solid var(--gold)', padding: '1rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
            {scaleData.desc ? (
              <>
                <p style={{ margin: '0 0 0.6rem 0', wordBreak: 'break-word' }}><span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>🎵 Uso:</span> {scaleData.desc}</p>
                <p style={{ margin: '0 0 0.6rem 0', wordBreak: 'break-word' }}><span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>🎯 Notas:</span> {scaleData.target || '-'}</p>
                <p style={{ margin: 0, wordBreak: 'break-word' }}><span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>🎸 Tocar sobre:</span> {scaleData.chords || '-'}</p>
              </>
            ) : (
              <p style={{ color: '#888', margin: 0 }}>Selecciona una escala para ver su información teórica.</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {viewMode === 'full' ? (
          <Fretboard />
        ) : (
          positionsData?.map((pos, idx) => (
            <Fretboard key={idx} activeNotesList={pos.activeNotes} title={pos.title} />
          ))
        )}
      </div>
    </div>
  );
}