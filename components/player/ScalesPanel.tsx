"use client";

import React, { useState, useMemo } from 'react';

const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STANDARD_TUNING = ['E', 'B', 'G', 'D', 'A', 'E']; 
const MARKED_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

const SCALES: Record<string, { name: string, intervals: number[] }> = {
  'pentatonic-minor': { name: 'Pentatónica Menor', intervals: [0, 3, 5, 7, 10] },
  'pentatonic-major': { name: 'Pentatónica Mayor', intervals: [0, 2, 4, 7, 9] },
  'blues': { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
  'ionian': { name: 'Jónica (Mayor)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  'dorian': { name: 'Dórica', intervals: [0, 2, 3, 5, 7, 9, 10] },
  'phrygian': { name: 'Frigia', intervals: [0, 1, 3, 5, 7, 8, 10] },
  'lydian': { name: 'Lidia', intervals: [0, 2, 4, 6, 7, 9, 11] },
  'mixolydian': { name: 'Mixolidia', intervals: [0, 2, 4, 5, 7, 9, 10] },
  'aeolian': { name: 'Eólica (Menor)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  'locrian': { name: 'Locria', intervals: [0, 1, 3, 5, 6, 8, 10] },
  'harmonic-minor': { name: 'Menor Armónica', intervals: [0, 2, 3, 5, 7, 8, 11] },
  'melodic-minor': { name: 'Menor Melódica', intervals: [0, 2, 3, 5, 7, 9, 11] }
};

export function ScalesPanel() {
  const [rootNote, setRootNote] = useState('A');
  const [scaleKey, setScaleKey] = useState('pentatonic-minor');

  const scaleNotes = useMemo(() => {
    const rootIndex = CHROMATIC_NOTES.indexOf(rootNote);
    const intervals = SCALES[scaleKey].intervals;
    return intervals.map(interval => CHROMATIC_NOTES[(rootIndex + interval) % 12]);
  }, [rootNote, scaleKey]);

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', gap: '1rem', background: 'var(--surface)', padding: '1rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Tónica</label>
          <select 
            value={rootNote} 
            onChange={e => setRootNote(e.target.value)}
            style={{ padding: '0.6rem', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', outline: 'none' }}
          >
            {CHROMATIC_NOTES.map(note => <option key={note} value={note}>{note}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Escala</label>
          <select 
            value={scaleKey} 
            onChange={e => setScaleKey(e.target.value)}
            style={{ padding: '0.6rem', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', outline: 'none' }}
          >
            {Object.entries(SCALES).map(([key, data]) => <option key={key} value={key}>{data.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '40px repeat(24, minmax(45px, 1fr))', 
          background: '#2a1a0a', 
          border: '2px solid #8b5a2b', 
          borderRadius: '8px', 
          padding: '12px 20px 12px 0',
          minWidth: '1000px'
        }}>
          
          <div></div>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={`header-${i}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '10px', color: 'var(--gold)', fontSize: '14px', fontWeight: 'bold' }}>
              {i + 1}
            </div>
          ))}

          {STANDARD_TUNING.map((openNote, stringIndex) => {
            const stringRootIndex = CHROMATIC_NOTES.indexOf(openNote);
            
            return (
              <React.Fragment key={`string-${stringIndex}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '16px', paddingRight: '8px' }}>
                  {openNote}
                </div>

                {Array.from({ length: 24 }).map((_, fretIndex) => {
                  const fret = fretIndex + 1;
                  const currentNote = CHROMATIC_NOTES[(stringRootIndex + fret) % 12];
                  const isActive = scaleNotes.includes(currentNote);
                  const isRoot = currentNote === rootNote;
                  const isMarked = MARKED_FRETS.includes(fret);

                  return (
                    <div key={`cell-${stringIndex}-${fret}`} style={{
                      position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRight: '3px solid silver', height: '42px',
                      backgroundColor: isMarked ? 'rgba(255, 255, 255, 0.05)' : 'transparent'
                    }}>
                      <div style={{
                        position: 'absolute', left: 0, right: 0, zIndex: 1,
                        height: `${1 + stringIndex * 0.5}px`,
                        background: 'linear-gradient(to bottom, #d5d5d5 0%, #8a8a8a 40%, #505050 100%)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.5)'
                      }} />
                      
                      {isActive && (
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          backgroundColor: isRoot ? '#e74c3c' : '#3498db',
                          color: '#fff', fontSize: '11px', fontWeight: 'bold',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          zIndex: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        }}>
                          {currentNote}
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
}