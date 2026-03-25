"use client";

import React, { useState, useMemo } from 'react';
import { 
  CHROMATIC_NOTES, 
  MAJOR_INTERVALS, 
  MINOR_INTERVALS, 
  DEGREE_MAP_MAJOR, 
  DEGREE_MAP_MINOR 
} from '@/lib/constants';
import { useTranslations } from 'next-intl';

export function CompositionPanel() {
  const t = useTranslations('CompositionPanel');
  
  const [rootNote, setRootNote] = useState('C');
  const [isMinor, setIsMinor] = useState(false);
  const [progression, setProgression] = useState<{ chord: string, roman: string }[]>([]);
  const [notes, setNotes] = useState('');

  const diatonicChords = useMemo(() => {
    const rootIndex = CHROMATIC_NOTES.indexOf(rootNote);
    const intervals = isMinor ? MINOR_INTERVALS : MAJOR_INTERVALS;
    const degreeMap = isMinor ? DEGREE_MAP_MINOR : DEGREE_MAP_MAJOR;

    return Object.entries(degreeMap).map(([roman, mapping]) => {
      const chordRootIndex = (rootIndex + intervals[mapping.idx]) % 12;
      const chordRootNote = CHROMATIC_NOTES[chordRootIndex];
      return {
        roman: roman,
        chord: `${chordRootNote}${mapping.suffix}`
      };
    });
  }, [rootNote, isMinor]);

  const addChord = (chordObj: { chord: string, roman: string }) => {
    setProgression(prev => [...prev, chordObj]);
  };

  const undoChord = () => {
    setProgression(prev => prev.slice(0, -1));
  };

  const clearProgression = () => {
    setProgression([]);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', width: '100%', height: '100%', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: 'var(--gold)', margin: '0 0 1.5rem 0', fontSize: '1.2rem' }}>{t('keySelector')}</h3>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <select 
              value={rootNote} 
              onChange={(e) => setRootNote(e.target.value)}
              style={{ flex: 1, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem', borderRadius: '6px', outline: 'none', fontWeight: 'bold' }}
            >
              {CHROMATIC_NOTES.map(note => <option key={note} value={note}>{note}</option>)}
            </select>
            <select 
              value={isMinor ? 'minor' : 'major'} 
              onChange={(e) => setIsMinor(e.target.value === 'minor')}
              style={{ flex: 1, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem', borderRadius: '6px', outline: 'none', fontWeight: 'bold' }}
            >
              <option value="major">{t('major')}</option>
              <option value="minor">{t('minor')}</option>
            </select>
          </div>

          <h4 style={{ color: 'var(--muted)', margin: '0 0 1rem 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('diatonicPalette')}
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {diatonicChords.map((item, idx) => (
              <button
                key={idx}
                onClick={() => addChord(item)}
                style={{
                  background: 'rgba(220,185,138,0.1)',
                  border: '1px solid rgba(220,185,138,0.3)',
                  color: 'var(--text)',
                  padding: '0.8rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '60px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,185,138,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,185,138,0.1)'}
              >
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'Bebas Neue, sans-serif' }}>{item.chord}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>{item.roman}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--gold)', margin: 0, fontSize: '1.2rem' }}>{t('progressionBuilder')}</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={undoChord} disabled={progression.length === 0} style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid var(--muted)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: progression.length === 0 ? 'not-allowed' : 'pointer', fontSize: '0.75rem', opacity: progression.length === 0 ? 0.5 : 1 }}>
                {t('undo')}
              </button>
              <button onClick={clearProgression} disabled={progression.length === 0} style={{ background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: progression.length === 0 ? 'not-allowed' : 'pointer', fontSize: '0.75rem', opacity: progression.length === 0 ? 0.5 : 1 }}>
                {t('clearProgression')}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '80px', background: '#111', padding: '1rem', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            {progression.map((item, idx) => (
              <div key={idx} style={{ background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text)' }}>{item.chord}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{item.roman}</span>
              </div>
            ))}
            {progression.length === 0 && (
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 'auto' }}>
                Haz clic en los acordes de arriba para construir tu progresión.
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px' }}>
          <h3 style={{ color: 'var(--gold)', margin: '0 0 1rem 0', fontSize: '1.2rem' }}>{t('notesTitle')}</h3>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('notesPlaceholder')}
            style={{ flex: 1, width: '100%', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1rem', fontFamily: 'DM Sans, sans-serif', resize: 'none', outline: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}