"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CHROMATIC_NOTES, CHORD_INTERVALS, INTERVAL_NAMES, PREDEFINED_COLORS, SCALES, DEFAULT_INTERVAL_COLORS } from '@/lib/constants';
import { useScaleLogic } from '@/hooks/useScaleLogic';
import { SmartFretboard } from './SmartFretboard'; // Asumiendo que están en la misma carpeta

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
  const [userColors, setUserColors] = useState<Record<number, string>>({});
  const [showTheory, setShowTheory] = useState(false);

  // Mantenemos useScaleLogic aquí SOLO para alimentar la sección de teoría inferior
  const { scaleData, scaleNotes } = useScaleLogic(rootNote, scaleKey, 'full', t);

  const getIntervalColor = (interval: number) => userColors[interval] || DEFAULT_INTERVAL_COLORS[interval] || '#7f8c8d';

  const handleColorChange = (interval: number, color: string) => {
    setUserColors(prev => ({ ...prev, [interval]: color }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1600px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--surface)', padding: '1.2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
        
        {/* Controles Principales (Raíz y Escala) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
          <select value={rootNote} onChange={e => setRootNote(e.target.value)} style={{ padding: '0.6rem 1rem', background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '8px', outline: 'none', fontSize: '1rem', fontWeight: 'bold' }}>
            {CHROMATIC_NOTES.map(note => <option key={note} value={note}>{note}</option>)}
          </select>
          <select value={scaleKey} onChange={e => setScaleKey(e.target.value)} style={{ padding: '0.6rem 1rem', background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '8px', outline: 'none', fontSize: '1rem', fontWeight: 'bold' }}>
            {Object.keys(SCALES).map((key) => <option key={key} value={key}>{mc(`scales.${key}.name`)}</option>)}
          </select>
        </div>
      </div>

      {/* Renderizamos el nuevo componente inteligente que encapsula todo el dibujo y navegación */}
      <div style={{ width: '100%', background: 'var(--surface)', padding: '2rem 1rem 1rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
        <SmartFretboard 
          rootNote={rootNote} 
          scaleKey={scaleKey} 
          // Pasamos el prop opcional para que SmartFretboard use los colores personalizados si los hay
          customIntervalColors={userColors} 
        />
      </div>

      {/* Panel de Teoría (Se mantiene igual, solo re-estilizado ligeramente) */}
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
                          style={{ flex: '1 1 0%', minWidth: '35px', textAlign: 'center', color: 'var(--gold)', fontWeight: 'bold', fontSize: '0.9rem' }}
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