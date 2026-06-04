"use client";

import React, { useState } from 'react';
import { CHROMATIC_NOTES, SCALES } from '@/lib/constants';
import { useTranslations } from 'next-intl';

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
    const rootIndex = CHROMATIC_NOTES.indexOf(globalRoot);
    const chordRootNote = CHROMATIC_NOTES[(rootIndex + interval) % 12];
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', height: '100%' }}>
      
      <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ color: 'var(--gold)', margin: '0 0 1.5rem 0', fontSize: '1.2rem' }}>
          {t('controlsTitle')}
        </h3>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select 
            value={globalRoot} 
            onChange={(e) => setGlobalRoot(e.target.value)}
            style={{ flex: 1, minWidth: '150px', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '6px', outline: 'none', fontWeight: 'bold', fontSize: '1rem' }}
          >
            {CHROMATIC_NOTES.map(note => <option key={note} value={note}>{note}</option>)}
          </select>
          
          <select 
            value={chordType} 
            onChange={(e) => setChordType(e.target.value as 'triads' | 'tetrads')}
            style={{ flex: 1, minWidth: '150px', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '6px', outline: 'none', fontWeight: 'bold', fontSize: '1rem' }}
          >
            <option value="triads">{t('triads')}</option>
            <option value="tetrads">{t('tetrads')}</option>
          </select>

          <input 
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 2, minWidth: '250px', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '6px', outline: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '1rem' }}
          />
        </div>
      </div>

      <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th style={{ padding: '1rem', borderBottom: '2px solid rgba(255,255,255,0.1)', color: 'var(--gold)', fontWeight: 800, letterSpacing: '0.05em' }}>
                {t('scaleOrMode')}
              </th>
              {Array.from({ length: maxDegrees }).map((_, idx) => (
                <th key={idx} style={{ padding: '1rem', borderBottom: '2px solid rgba(255,255,255,0.1)', color: 'var(--gold)', fontWeight: 800, textAlign: 'center' }}>
                  {romanNumerals[idx]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedByCategory.map((group) => (
              <React.Fragment key={group.category}>
                <tr>
                  <td colSpan={maxDegrees + 1} style={{ padding: '2rem 1rem 0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ color: 'var(--gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
                        {mc(`categories.${group.category}`)}
                      </span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(220,185,138,0.2)' }} />
                    </div>
                  </td>
                </tr>
                {group.keys.map((scaleKey) => {
                  const scaleName = mc(`scales.${scaleKey}.name`);

                  return (
                    <tr key={scaleKey} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text)' }}>
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
                            style={{ 
                              padding: '1rem', 
                              textAlign: 'center',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {chordStr !== '-' ? (
                              <div style={{ 
                                display: 'inline-block',
                                background: isMatch ? 'var(--gold)' : 'rgba(255,255,255,0.03)',
                                color: isMatch ? '#111' : isFaded ? 'rgba(255,255,255,0.2)' : 'var(--text)',
                                padding: '0.5rem 0.8rem',
                                borderRadius: '6px',
                                fontWeight: isMatch ? 800 : 500,
                                fontFamily: 'DM Sans, sans-serif',
                                fontSize: '1rem',
                                letterSpacing: '0.01em',
                                border: isMatch ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.05)',
                                transform: isMatch ? 'scale(1.05)' : 'scale(1)'
                              }}>
                                {chordStr}
                              </div>
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,0.1)' }}>-</span>
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