"use client";

import React, { useState, useMemo } from 'react';
import { CHROMATIC_NOTES, SCALES, ROMAN_PROGRESSIONS, MAJOR_INTERVALS, MINOR_INTERVALS, DEGREE_MAP_MAJOR, DEGREE_MAP_MINOR} from '@/lib/constants';
import { useTranslations } from 'next-intl';

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export function ImprovPanel() {
  const t = useTranslations('ImprovPanel');
  const [notes, setNotes] = useState('');
  const [rootNote, setRootNote] = useState('C');
  const [progressionObj, setProgressionObj] = useState(ROMAN_PROGRESSIONS[0]);
  const [ytLink, setYtLink] = useState('');

  const ytVideoId = useMemo(() => getYoutubeId(ytLink), [ytLink]);

  const generateProgression = () => {
    const random = ROMAN_PROGRESSIONS[Math.floor(Math.random() * ROMAN_PROGRESSIONS.length)];
    setProgressionObj(random);
  };

  const actualChords = useMemo(() => {
    const rootIndex = CHROMATIC_NOTES.indexOf(rootNote);
    const intervals = progressionObj.isMinorStart ? MINOR_INTERVALS : MAJOR_INTERVALS;
    const degreeMap = progressionObj.isMinorStart ? DEGREE_MAP_MINOR : DEGREE_MAP_MAJOR;

    return progressionObj.roman.split(' - ').map(degree => {
      const mapping = degreeMap[degree];
      if (!mapping) return degree;
      
      const intervalOffset = intervals[mapping.idx];
      const chordRootIndex = (rootIndex + intervalOffset) % 12;
      const chordRootNote = CHROMATIC_NOTES[chordRootIndex];
      
      return `${chordRootNote}${mapping.suffix}`;
    }).join(' - ');
  }, [progressionObj, rootNote]);

  const suggestedScales = useMemo(() => {
    const isMinor = progressionObj.isMinorStart;
    let recommendations: string[] = [];

    if (isMinor) {
      if (SCALES['aeolian']) recommendations.push(t('scaleOf', { scale: SCALES['aeolian'].name, root: rootNote }));
      if (SCALES['pentatonic-minor']) recommendations.push(t('scaleOf', { scale: SCALES['pentatonic-minor'].name, root: rootNote }));
      if (progressionObj.roman.includes('V') && SCALES['harmonic-minor']) {
        recommendations.push(t('scaleOf', { scale: SCALES['harmonic-minor'].name, root: rootNote }));
      }
    } else {
      if (SCALES['ionian']) recommendations.push(t('scaleOf', { scale: SCALES['ionian'].name, root: rootNote }));
      if (SCALES['pentatonic-major']) recommendations.push(t('scaleOf', { scale: SCALES['pentatonic-major'].name, root: rootNote }));
      const relMinorRoot = CHROMATIC_NOTES[(CHROMATIC_NOTES.indexOf(rootNote) + 9) % 12];
      if (SCALES['aeolian']) recommendations.push(t('scaleOf', { scale: SCALES['aeolian'].name, root: relMinorRoot }));
    }

    return recommendations.join(t('joinOr'));
  }, [progressionObj, rootNote, t]);

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr', 
      gap: '2rem', 
      width: '100%', 
      height: '100%',
      alignItems: 'start'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--gold)', margin: 0, fontSize: '1.2rem' }}>{t('ideaGenerator')}</h3>
            <select 
              value={rootNote} 
              onChange={(e) => setRootNote(e.target.value)}
              style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '6px', outline: 'none', fontWeight: 'bold' }}
            >
              {CHROMATIC_NOTES.map(note => (
                <option key={note} value={note}>
                  {t('tonality', { note, type: progressionObj.isMinorStart ? t('minor') : t('major') })}
                </option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '1.2rem', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            {progressionObj.roman}
          </div>
          
          <div style={{ fontSize: '2.5rem', fontFamily: 'Bebas Neue, sans-serif', color: 'var(--text)', marginBottom: '1rem', letterSpacing: '0.05em' }}>
            {actualChords}
          </div>

          <div style={{ background: 'rgba(220,185,138,0.1)', border: '1px solid rgba(220,185,138,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 'bold', marginBottom: '0.4rem' }}>
              {t('scaleSuggestionTitle')}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
              {t('scaleSuggestionText')} <strong>{suggestedScales}</strong>
            </span>
          </div>

          <button 
            onClick={generateProgression}
            style={{ width: '100%', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}
          >
            {t('generateButton')}
          </button>
        </div>

        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: 'var(--gold)', margin: '0 0 1rem 0', fontSize: '1.2rem' }}>{t('backingTrackTitle')}</h3>
          <input 
            type="text" 
            value={ytLink}
            onChange={(e) => setYtLink(e.target.value)}
            placeholder={t('backingTrackPlaceholder')}
            style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'var(--text)', outline: 'none', marginBottom: '1rem', fontFamily: 'DM Sans, sans-serif' }}
          />
          
          {ytVideoId && (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px' }}>
              <iframe 
                src={`https://www.youtube.com/embed/${ytVideoId}`} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px' }}>
          <h3 style={{ color: 'var(--gold)', margin: '0 0 1rem 0', fontSize: '1.2rem' }}>{t('notesTitle')}</h3>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('notesPlaceholder')}
            style={{ 
              flex: 1, width: '100%', background: 'var(--surface2)', color: 'var(--text)', 
              border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1rem', 
              fontFamily: 'DM Sans, sans-serif', resize: 'none', outline: 'none' 
            }}
          />
        </div>
      </div>
    </div>
  );
}