"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CHROMATIC_NOTES, DEFAULT_INTERVAL_COLORS } from '@/lib/constants';
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

interface SmartFretboardProps {
  rootNote: string;
  scaleKey: string;
  customIntervalColors?: Record<number, string>;
}

export function SmartFretboard({ rootNote, scaleKey, customIntervalColors = {} }: SmartFretboardProps) {
  const t = useTranslations('ScalesPanel');

  const [labelMode, setLabelMode] = useState<'notes' | 'intervals'>('notes');
  const [leftyMode, setLeftyMode] = useState(false);
  
  const [viewMode, setViewMode] = useState<'full' | 'positions'>('full');
  const [carouselIndex, setCarouselIndex] = useState(0);

  const { scaleData, scaleNotes, positionsData } = useScaleLogic(rootNote, scaleKey, viewMode, t);

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
      
      if (e.key === 'ArrowLeft') {
        setCarouselIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCarouselIndex(prev => Math.min(positionsData.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, positionsData]);

  const getIntervalColor = (interval: number) => customIntervalColors[interval] || DEFAULT_INTERVAL_COLORS[interval] || '#7f8c8d';

  const fretboardProps = {
    rootNote,
    scaleData,
    scaleNotes,
    labelMode,
    leftyMode,
    getIntervalColor,
    initAudio,
    audioCtx,
    playFreq,
    getNoteFrequency,
    t,
    isEditingPos: null,
    draftPosNotes: [],
    setDraftPosNotes: () => {},
    setIsEditingPos: () => {},
    handleExportCustomPosition: () => {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface2)', padding: '0.8rem', borderRadius: '8px' }}>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setViewMode('full')} style={{ background: viewMode === 'full' ? 'var(--gold)' : 'transparent', color: viewMode === 'full' ? '#111' : 'var(--muted)', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
            {t('viewMode.full')}
          </button>
          <button onClick={() => setViewMode('positions')} style={{ background: viewMode === 'positions' ? 'var(--gold)' : 'transparent', color: viewMode === 'positions' ? '#111' : 'var(--muted)', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
            {t('viewMode.positions')}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => setLabelMode('notes')} style={{ background: labelMode === 'notes' ? 'rgba(255,255,255,0.1)' : 'transparent', color: labelMode === 'notes' ? '#fff' : 'var(--muted)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
            {t('labelMode.notes')}
          </button>
          <button onClick={() => setLabelMode('intervals')} style={{ background: labelMode === 'intervals' ? 'rgba(255,255,255,0.1)' : 'transparent', color: labelMode === 'intervals' ? '#fff' : 'var(--muted)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
            {t('labelMode.intervals')}
          </button>
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }}></div>
          <button onClick={() => setLeftyMode(!leftyMode)} style={{ background: leftyMode ? 'var(--gold)' : 'transparent', color: leftyMode ? '#111' : 'var(--muted)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s' }}>
            {t('leftyMode')}
          </button>
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {viewMode === 'full' ? (
          <Fretboard {...fretboardProps} />
        ) : (
          <>
            {(positionsData?.length ?? 0) > 0 && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  
                  <button
                    onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                    disabled={carouselIndex === 0}
                    style={{ background: 'transparent', color: carouselIndex === 0 ? 'rgba(255,255,255,0.2)' : 'var(--gold)', border: 'none', cursor: carouselIndex === 0 ? 'default' : 'pointer', fontSize: '1.5rem', fontWeight: 'bold', padding: '0 0.5rem' }}
                  >
                    &lt;
                  </button>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {positionsData?.map((pos: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setCarouselIndex(idx)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: carouselIndex === idx ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                          color: carouselIndex === idx ? '#111' : '#fff',
                          border: 'none',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          fontSize: '0.9rem'
                        }}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCarouselIndex(prev => Math.min((positionsData?.length ?? 1) - 1, prev + 1))}
                    disabled={carouselIndex === (positionsData?.length ?? 1) - 1}
                    style={{ background: 'transparent', color: carouselIndex === (positionsData?.length ?? 1) - 1 ? 'rgba(255,255,255,0.2)' : 'var(--gold)', border: 'none', cursor: carouselIndex === (positionsData?.length ?? 1) - 1 ? 'default' : 'pointer', fontSize: '1.5rem', fontWeight: 'bold', padding: '0 0.5rem' }}
                  >
                    &gt;
                  </button>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--gold)', fontWeight: 'bold', fontSize: '1.1rem' }}>
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