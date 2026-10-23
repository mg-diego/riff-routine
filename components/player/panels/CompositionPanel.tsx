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
import styles from './CompositionPanel.module.css';

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
    <div className={styles.keySelectorGrid}>
      <div className={styles.keySelectorStack}>
        
        <div className="surface-card">
          <h3 className={styles.keySelectorSubheading}>{t('keySelector')}</h3>
          <div className={styles.majorRow}>
            <select 
              value={rootNote} 
              onChange={(e) => setRootNote(e.target.value)}
              className={styles.select}
            >
              {CHROMATIC_NOTES.map(note => <option key={note} value={note}>{note}</option>)}
            </select>
            <select 
              value={isMinor ? 'minor' : 'major'} 
              onChange={(e) => setIsMinor(e.target.value === 'minor')}
              className={styles.select}
            >
              <option value="major">{t('major')}</option>
              <option value="minor">{t('minor')}</option>
            </select>
          </div>

          <h4 className={styles.diatonicPaletteSubheading}>
            {t('diatonicPalette')}
          </h4>
          <div className={styles.row}>
            {diatonicChords.map((item, idx) => (
              <button
                key={idx}
                onClick={() => addChord(item)}
                className={styles.button}
              >
                <span className={styles.label}>{item.chord}</span>
                <span className={styles.romanLabel}>{item.roman}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="surface-card">
          <div className={styles.progressionBuilderRow}>
            <h3 className={styles.progressionBuilderSubheading}>{t('progressionBuilder')}</h3>
            <div className={styles.undoRow}>
              <button onClick={undoChord} disabled={progression.length === 0} className={styles.undoButton} style={{ cursor: progression.length === 0 ? 'not-allowed' : 'pointer', opacity: progression.length === 0 ? 0.5 : 1 }}>
                {t('undo')}
              </button>
              <button onClick={clearProgression} disabled={progression.length === 0} className={styles.clearProgressionButton} style={{ cursor: progression.length === 0 ? 'not-allowed' : 'pointer', opacity: progression.length === 0 ? 0.5 : 1 }}>
                {t('clearProgression')}
              </button>
            </div>
          </div>

          <div className={styles.chordRow}>
            {progression.map((item, idx) => (
              <div key={idx} className={styles.row3}>
                <span className={styles.chordLabel}>{item.chord}</span>
                <span className={styles.label4}>{item.roman}</span>
              </div>
            ))}
            {progression.length === 0 && (
              <span className={styles.keySelectorStackLabel}>
                Haz clic en los acordes de arriba para construir tu progresión.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.notesTitleStack}>
        <div className={`surface-card ${styles.notesTitleStack2}`}>
          <h3 className={styles.notesTitleSubheading}>{t('notesTitle')}</h3>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('notesPlaceholder')}
            className={styles.notesPlaceholderTextarea}
          />
        </div>
      </div>
    </div>
  );
}