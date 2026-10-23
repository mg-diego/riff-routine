"use client";

import React, { useState } from 'react';
import { CHROMATIC_NOTES, ROOTS, SCALES, NORMALIZE_ROOT, INTERVAL_OFFSET, SHARP_NOTES, FLAT_NOTES, FLAT_ROOTS } from '@/lib/constants';
import { useTranslations } from 'next-intl';
import styles from './HarmonizationPanel.module.css';

const CATEGORY_ORDER = [
  'major-scale-modes',
  'minor-scales',
  'pentatonics',
  'triads',
  'arpeggios',
  'exotic',
  'hirajoshi-modes',
  'others'
];

const getProperNoteName = (rootNote: string, interval: number) => {
  const normalizedRoot = NORMALIZE_ROOT[rootNote] || rootNote;
  const rootLetter = normalizedRoot.charAt(0);
  const rootLetterIndex = ROOTS.indexOf(rootLetter);
  
  const expectedLetter = ROOTS[(rootLetterIndex + INTERVAL_OFFSET[interval]) % 7];
  
  const rootIndex = CHROMATIC_NOTES.indexOf(rootNote);
  const pitchClass = (rootIndex + interval) % 12;
  
  const sharpNote = SHARP_NOTES[pitchClass];
  const flatNote = FLAT_NOTES[pitchClass];
  
  if (sharpNote.charAt(0) === expectedLetter) return sharpNote;
  if (flatNote.charAt(0) === expectedLetter) return flatNote;
  
  const isFlat = FLAT_ROOTS.includes(normalizedRoot);
  return isFlat ? flatNote : sharpNote;
};

export function HarmonizationPanel() {
  const t = useTranslations('HarmonizationPanel');
  const mc = useTranslations('MusicConstants');

  const [globalRoot, setGlobalRoot] = useState('C');
  const [chordType, setChordType] = useState<'triads' | 'tetrads'>('tetrads');
  const [searchQuery, setSearchQuery] = useState('');

  const getChordString = (scaleKey: string, gradeIdx: number) => {
    const scale = SCALES[scaleKey];
    if (!scale || !scale.intervals || scale.intervals.length <= gradeIdx) return '-';
    
    const interval = scale.intervals[gradeIdx];
    const chordRootNote = getProperNoteName(globalRoot, interval);
    const chordExtension = scale[chordType]?.[gradeIdx];
    
    return chordExtension ? `${chordRootNote}${chordExtension}` : '-';
  };

  const maxDegrees = Math.max(...Object.values(SCALES).map((s: any) => s.intervals?.length || 0));
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

  const sortedScaleKeys = Object.keys(SCALES).sort((a, b) => {
    const orderA = SCALES[a].order || 999;
    const orderB = SCALES[b].order || 999;
    if (orderA !== orderB) return orderA - orderB;
    return mc(`scales.${a}.name`).localeCompare(mc(`scales.${b}.name`));
  });

  const groupedByCategory = CATEGORY_ORDER.reduce((acc, cat) => {
    const keys = sortedScaleKeys.filter(k => (SCALES[k].category || 'others') === cat);
    if (keys.length > 0) acc.push({ category: cat, keys });
    return acc;
  }, [] as { category: string; keys: string[] }[]);

  const orphanedKeys = sortedScaleKeys.filter(k => {
    const cat = SCALES[k].category || 'others';
    return !CATEGORY_ORDER.includes(cat);
  });

  if (orphanedKeys.length > 0) {
    groupedByCategory.push({ category: 'others', keys: orphanedKeys });
  }

  const handleChordClick = (chordStr: string) => {
    if (chordStr === '-') return;
    setSearchQuery(prev => prev === chordStr ? '' : chordStr);
  };

  return (
    <div className={styles.controlsTitleStack}>
      <div className="surface-card">
        <h3 className={styles.controlsTitleSubheading}>
          {t('controlsTitle')}
        </h3>
        
        <div className={styles.triadsRow}>
          <select 
            value={globalRoot} 
            onChange={(e) => setGlobalRoot(e.target.value)}
            className={styles.select}
          >
            {CHROMATIC_NOTES.map(note => <option key={note} value={note}>{note}</option>)}
          </select>
          
          <select 
            value={chordType} 
            onChange={(e) => setChordType(e.target.value as 'triads' | 'tetrads')}
            className={styles.select}
          >
            <option value="triads">{t('triads')}</option>
            <option value="tetrads">{t('tetrads')}</option>
          </select>

          <input 
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchPlaceholderInput}
          />
        </div>
      </div>

      <div className={`surface-card ${styles.scaleOrMode}`}>
        <table className={styles.scaleOrModeTable}>
          <thead>
            <tr>
              <th className={styles.scaleOrModeTh}>
                {t('scaleOrMode')}
              </th>
              {Array.from({ length: maxDegrees }).map((_, idx) => (
                <th key={idx} className={styles.th}>
                  {romanNumerals[idx]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedByCategory.map((group) => (
              <React.Fragment key={group.category}>
                <tr>
                  <td colSpan={maxDegrees + 1} className={styles.td}>
                    <div className={styles.row}>
                      <span className={styles.label}>
                        {mc(`categories.${group.category}`)}
                      </span>
                      <div className={styles.box} />
                    </div>
                  </td>
                </tr>
                {group.keys.map((scaleKey) => {
                  const scaleName = mc(`scales.${scaleKey}.name`);

                  return (
                    <tr key={scaleKey} className={styles.tr}>
                      <td className={styles.scaleNameTd}>
                        <div className={styles.block}>
                          {scaleName}
                        </div>
                      </td>
                      
                      {Array.from({ length: maxDegrees }).map((_, idx) => {
                        const chordStr = getChordString(scaleKey, idx);
                        const isMatch = searchQuery.trim() !== '' && chordStr !== '-' && chordStr.toLowerCase().includes(searchQuery.trim().toLowerCase());
                        const isFaded = searchQuery.trim() !== '' && !isMatch;

                        return (
                          <td 
                            key={idx} 
                            className={styles.chordStrTd}
                          >
                            {chordStr !== '-' ? (
                              <div 
                                onClick={() => handleChordClick(chordStr)}
                                className={styles.chordStrBlock} style={{ background: isMatch ? 'var(--gold)' : 'rgba(255,255,255,0.03)', color: isMatch ? '#111' : isFaded ? 'rgba(255,255,255,0.2)' : 'var(--text)', fontWeight: isMatch ? 800 : 500, border: isMatch ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.05)', transform: isMatch ? 'scale(1.05)' : 'scale(1)' }}
                              >
                                {chordStr}
                              </div>
                            ) : (
                              <span className={styles.scaleOrModeTableLabel}>-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}