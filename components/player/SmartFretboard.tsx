"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getIntervalColor as resolveIntervalColor } from '@/lib/constants';
import { Fretboard } from './Fretboard';
import { useScaleLogic } from '@/hooks/useScaleLogic';
import { supabase } from '@/lib/supabase';
import { useAudioSynth } from '@/hooks/useAudioSynth';
import styles from './SmartFretboard.module.css';

interface SmartFretboardProps {
  rootNote: string;
  scaleKey: string;
  customIntervalColors?: Record<number, string>;
  // Compare mode
  compareMode?: boolean;
  scaleNotesB?: string[];
  colorA?: string;
  colorB?: string;
}

export function SmartFretboard({
  rootNote,
  scaleKey,
  customIntervalColors = {},
  compareMode = false,
  scaleNotesB = [],
  colorA = '#3b82f6',
  colorB = '#f43f5e',
}: SmartFretboardProps) {
  const t = useTranslations('ScalesPanel');

  const [labelMode, setLabelMode] = useState<'notes' | 'intervals'>('notes');
  const [leftyMode, setLeftyMode] = useState(false);
  // Positions view is incompatible with compare mode — reset if needed
  const [viewMode, setViewMode] = useState<'full' | 'positions'>('full');
  const [carouselIndex, setCarouselIndex] = useState(0);

  const { scaleData, scaleNotes, positionsData } = useScaleLogic(rootNote, scaleKey, viewMode, t);
  const { playRealSound } = useAudioSynth();

  // If compare mode is turned on while in positions view, switch to full
  useEffect(() => {
    if (compareMode && viewMode === 'positions') setViewMode('full');
  }, [compareMode]);

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
  }, [scaleKey, rootNote, viewMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'positions' || !positionsData?.length) return;
      if (e.key === 'ArrowLeft') setCarouselIndex(prev => Math.max(0, prev - 1));
      else if (e.key === 'ArrowRight') setCarouselIndex(prev => Math.min(positionsData.length - 1, prev + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, positionsData]);

  const getIntervalColor = (interval: number) => resolveIntervalColor(interval, customIntervalColors);

  const fretboardProps = {
    rootNote,
    scaleData,
    scaleNotes,
    labelMode,
    leftyMode,
    getIntervalColor,
    playRealSound,
    t,
    isEditingPos: null,
    draftPosNotes: [],
    setDraftPosNotes: () => {},
    setIsEditingPos: () => {},
    handleExportCustomPosition: () => {},
    // Compare
    compareMode,
    scaleNotesB,
    colorA,
    colorB,
  };

  return (
    <div className={styles.fullStack}>
      {/* Toolbar */}
      <div className={styles.fullRow}>

        {/* View mode — positions disabled in compare mode */}
        <div className={styles.fullRow2}>
          <button
            onClick={() => setViewMode('full')}
            className={styles.fullButton} style={{ background: viewMode === 'full' ? 'var(--gold)' : 'transparent', color: viewMode === 'full' ? '#111' : 'var(--muted)' }}
          >
            {t('viewMode.full')}
          </button>
          <button
            onClick={() => !compareMode && setViewMode('positions')}
            disabled={compareMode}
            title={compareMode ? t('viewMode.positionsDisabledInCompare') : undefined}
            className={styles.button} style={{ background: viewMode === 'positions' ? 'var(--gold)' : 'transparent', color: compareMode ? 'rgba(255,255,255,0.2)' : viewMode === 'positions' ? '#111' : 'var(--muted)', cursor: compareMode ? 'not-allowed' : 'pointer' }}
          >
            {t('viewMode.positions')}
          </button>
        </div>

        {/* Label & lefty */}
        <div className={styles.notesRow}>
          {/* In compare mode, only note names make sense */}
          {!compareMode && (
            <>
              <button onClick={() => setLabelMode('notes')} className={styles.notesButton} style={{ background: labelMode === 'notes' ? 'rgba(255,255,255,0.1)' : 'transparent', color: labelMode === 'notes' ? '#fff' : 'var(--muted)' }}>
                {t('labelMode.notes')}
              </button>
              <button onClick={() => setLabelMode('intervals')} className={styles.notesButton} style={{ background: labelMode === 'intervals' ? 'rgba(255,255,255,0.1)' : 'transparent', color: labelMode === 'intervals' ? '#fff' : 'var(--muted)' }}>
                {t('labelMode.intervals')}
              </button>
              <div className={styles.box} />
            </>
          )}
          <button onClick={() => setLeftyMode(!leftyMode)} className={styles.notesButton} style={{ background: leftyMode ? 'var(--gold)' : 'transparent', color: leftyMode ? '#111' : 'var(--muted)' }}>
            {t('leftyMode')}
          </button>
        </div>
      </div>

      {/* Fretboard */}
      <div className={styles.stack}>
        {viewMode === 'full' ? (
          <Fretboard {...fretboardProps} />
        ) : (
          <>
            {(positionsData?.length ?? 0) > 0 && (
              <div className={styles.stack}>
                <div className={styles.row}>
                  <button
                    onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                    disabled={carouselIndex === 0}
                    className={styles.fullStackButton} style={{ color: carouselIndex === 0 ? 'rgba(255,255,255,0.2)' : 'var(--gold)', cursor: carouselIndex === 0 ? 'default' : 'pointer' }}
                  >
                    &lt;
                  </button>

                  <div className={styles.fullStackRow}>
                    {positionsData?.map((pos: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setCarouselIndex(idx)}
                        className={styles.fullStackRowButton} style={{ background: carouselIndex === idx ? 'var(--gold)' : 'rgba(255,255,255,0.1)', color: carouselIndex === idx ? '#111' : '#fff' }}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCarouselIndex(prev => Math.min((positionsData?.length ?? 1) - 1, prev + 1))}
                    disabled={carouselIndex === (positionsData?.length ?? 1) - 1}
                    className={styles.fullStackButton} style={{ color: carouselIndex === (positionsData?.length ?? 1) - 1 ? 'rgba(255,255,255,0.2)' : 'var(--gold)', cursor: carouselIndex === (positionsData?.length ?? 1) - 1 ? 'default' : 'pointer' }}
                  >
                    &gt;
                  </button>
                </div>

                <div className={styles.block}>
                  {positionsData?.[carouselIndex]?.title || `Posición ${carouselIndex + 1}`}
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
            )}
          </>
        )}
      </div>
    </div>
  );
}