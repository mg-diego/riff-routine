"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { SpeedSelect } from '@/components/player/SpeedSelect';
import { useTranslations } from 'next-intl';
import type { model } from '@coderline/alphatab';
import type { AlphaTabApiRef } from '@/hooks/useAlphaTab';
import styles from './SidebarControls.module.css';
import { cx } from '@/lib/cx';

interface SidebarControlsProps {
  apiRef: AlphaTabApiRef;
  isLoaded: boolean;
  isPlaying: boolean;
  // setIsPlaying eliminado: la única fuente de verdad es playerStateChanged en useAlphaTab.
  // Llamarlo manualmente desincronizaba el estado React con el estado interno de AlphaTab.
  tracks: model.Track[];
  setTracks: React.Dispatch<React.SetStateAction<model.Track[]>>;
  currentPlaybackBpm?: number | null;
  originalBpm?: number | null;
  forceDisabled: boolean;
}

interface ShortcutToast {
  id: number;
  icon: string;
  label: string;
}

const SPEEDS = ['0.25', '0.5', '0.75', '1', '1.25', '1.5'];

export function SidebarControls({
  apiRef,
  isLoaded,
  isPlaying,
  tracks,
  setTracks,
  currentPlaybackBpm,
  originalBpm,
  forceDisabled
}: SidebarControlsProps) {
  const t = useTranslations('SidebarControls');

  const [speed, setSpeed] = useState('1');
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [isCountIn, setIsCountIn] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [hasSelection, setHasSelection] = useState(false);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [toast, setToast] = useState<ShortcutToast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastId = useRef(0);

  const showToast = useCallback((icon: string, label: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastId.current += 1;
    setToast({ id: toastId.current, icon, label });
    toastTimer.current = setTimeout(() => setToast(null), 1400);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!apiRef.current) return;
    apiRef.current.playPause();
  }, [apiRef]);

  const handleStop = useCallback(() => {
    if (!apiRef.current) return;
    apiRef.current.stop();
    // NO llamar setIsPlaying aquí — playerStateChanged actualizará el estado automáticamente
  }, [apiRef]);

  const handleMetronome = useCallback(() => {
    if (!apiRef.current) return;
    setIsMetronomeOn(prev => {
      const next = !prev;
      if (apiRef.current) apiRef.current.metronomeVolume = next ? 1 : 0;
      return next;
    });
  }, [apiRef]);

  const handleLooping = useCallback(() => {
    if (!apiRef.current) return;
    setIsLooping(prev => {
      const next = !prev;
      if (apiRef.current) apiRef.current.isLooping = next;
      return next;
    });
  }, [apiRef]);

  const handleSpeedUp = useCallback(() => {
    setSpeed(prev => {
      const idx = SPEEDS.indexOf(prev);
      return idx < SPEEDS.length - 1 ? SPEEDS[idx + 1] : prev;
    });
  }, []);

  const handleSpeedDown = useCallback(() => {
    setSpeed(prev => {
      const idx = SPEEDS.indexOf(prev);
      return idx > 0 ? SPEEDS[idx - 1] : prev;
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          showToast(
            isPlaying ? '⏸' : '▶',
            isPlaying ? t('toasts.pause') : t('toasts.play')
          );
          break;

        case 'Escape':
          e.preventDefault();
          handleStop();
          showToast('⏹', t('toasts.stop'));
          break;

        case 'KeyM':
          e.preventDefault();
          handleMetronome();
          setIsMetronomeOn(prev => {
            showToast('🥁', prev ? t('toasts.metronomeOff') : t('toasts.metronomeOn'));
            return prev;
          });
          break;

        case 'KeyL':
          e.preventDefault();
          handleLooping();
          setIsLooping(prev => {
            showToast('🔁', prev ? t('toasts.loopOff') : t('toasts.loopOn'));
            return prev;
          });
          break;

        case 'Equal':
        case 'NumpadAdd':
          e.preventDefault();
          handleSpeedUp();
          showToast('⚡', t('toasts.speedUp'));
          break;

        case 'Minus':
        case 'NumpadSubtract':
          e.preventDefault();
          handleSpeedDown();
          showToast('🐢', t('toasts.speedDown'));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoaded, isPlaying, handlePlayPause, handleStop, handleMetronome, handleLooping, handleSpeedUp, handleSpeedDown, showToast, t]);

  useEffect(() => {
    if (forceDisabled) setIsOpen(false);
  }, [forceDisabled]);

  useEffect(() => {
    if (isLoaded) setActiveTrackIndex(0);
  }, [isLoaded]);

  useEffect(() => {
    if (!apiRef.current || !originalBpm || !isLoaded) return;
    const baseBpm = (currentPlaybackBpm && currentPlaybackBpm > 0) ? currentPlaybackBpm : originalBpm;
    apiRef.current.playbackSpeed = (baseBpm * parseFloat(speed)) / originalBpm;
  }, [currentPlaybackBpm, speed, originalBpm, isLoaded, apiRef]);

  useEffect(() => {
    if (!apiRef.current || !isLoaded) return;
    const handleRangeChanged = () => {
      if (apiRef.current) setHasSelection(apiRef.current.playbackRange !== null);
    };
    apiRef.current.playbackRangeChanged.on(handleRangeChanged);
    return () => { apiRef.current?.playbackRangeChanged?.off(handleRangeChanged); };
  }, [apiRef, isLoaded]);

  const clearSelection = () => {
    if (!apiRef.current) return;
    apiRef.current.playbackRange = null;
    if (apiRef.current.clearPlaybackRangeHighlight) apiRef.current.clearPlaybackRangeHighlight();
    setHasSelection(false);
  };

  const handleCountIn = () => {
    if (!apiRef.current) return;
    const next = !isCountIn;
    setIsCountIn(next);
    apiRef.current.countInVolume = next ? 1 : 0;
  };

  const handleTrackView = (track: any, index: number) => {
    setActiveTrackIndex(index);
    apiRef.current?.renderTracks([track]);
  };

  const toggleMute = (track: any) => {
    if (!apiRef.current) return;
    const next = !(track.playbackInfo?.isMute ?? false);
    if (track.playbackInfo) track.playbackInfo.isMute = next;
    apiRef.current.changeTrackMute([track], next);
    setTracks(prev => [...prev]);
  };

  const toggleSolo = (track: any) => {
    if (!apiRef.current) return;
    const next = !(track.playbackInfo?.isSolo ?? false);
    if (track.playbackInfo) track.playbackInfo.isSolo = next;
    apiRef.current.changeTrackSolo([track], next);
    setTracks(prev => [...prev]);
  };

  const changeVolume = (track: any, volume: string) => {
    apiRef.current?.changeTrackVolume([track], parseFloat(volume));
  };

  const baseBpmToDisplay = (currentPlaybackBpm && currentPlaybackBpm > 0) ? currentPlaybackBpm : originalBpm;
  const effectiveBpm = baseBpmToDisplay ? Math.round(baseBpmToDisplay * parseFloat(speed)) : null;
  const actuallyOpen = isOpen && !forceDisabled;

  return (
    <>

      {toast && (
        <div key={toast.id} className={styles['sb-toast']}>
          <span className={styles['sb-toast-icon']}>{toast.icon}</span>
          {toast.label}
        </div>
      )}

      <aside data-onboarding="practice-02" className={`${styles['sidebar-root']} ${actuallyOpen ? styles.open : styles.closed}`}>
        {!forceDisabled && (
          <button
            className={cx(styles['sidebar-toggle'], styles.button)}
            onClick={() => setIsOpen(o => !o)}
            style={{ right: actuallyOpen ? '0.85rem' : '11px' }}
          >
            {actuallyOpen ? '›' : '‹'}
          </button>
        )}

        <div className={styles['sidebar-icons']}>
          <div className={`${styles['sidebar-icon-dot']} ${isLoaded ? styles.active : ''}`} />
          <div className={`${styles['sidebar-icon-dot']} ${isPlaying ? styles.active : ''}`} />
          <div className={`${styles['sidebar-icon-dot']} ${tracks.length > 0 ? styles.active : ''}`} />
        </div>

        <div className={styles['sidebar-content']}>
          <div className={styles.panel}>
            <p className={cx(styles['sb-section-label'], styles.panelText)}>{t('sections.panel')}</p>
            <h2 className={styles.controlsHeading}>{t('sections.controls')}</h2>
          </div>

          <div>
            <p className={styles['sb-section-label']}>{t('sections.speed')}</p>
            <SpeedSelect value={speed} onChange={setSpeed} disabled={!isLoaded} />
            <div className={styles.shortcutsRow}>
              <span className={styles.shortcutsLabel}>{t('labels.shortcuts')}</span>
              <span className={styles['sb-kbd']}>−</span>
              <span className={styles.label}>/</span>
              <span className={styles['sb-kbd']}>+</span>
            </div>
          </div>

          {effectiveBpm !== null && (
            <div className={styles.bpmBox}>
              <span className={styles.bpmLabel}>{t('labels.bpm', { value: effectiveBpm })}</span>
            </div>
          )}

          <div className={styles.toolsStack}>
            <p className={styles['sb-section-label']}>{t('sections.tools')}</p>
            <button className={`${styles['sb-toggle-btn']} ${isMetronomeOn ? styles.on : ''}`} onClick={handleMetronome} disabled={!isLoaded}>
              {isMetronomeOn ? '🔴' : '⚪️'} {t('labels.metronome')} <span className={styles['sb-kbd']}>M</span>
            </button>
            <button className={`${styles['sb-toggle-btn']} ${isCountIn ? styles.on : ''}`} onClick={handleCountIn} disabled={!isLoaded}>
              {isCountIn ? '🔴' : '⚪️'} {t('labels.countIn')}
            </button>
            <button className={`${styles['sb-toggle-btn']} ${styles.loop} ${isLooping ? styles.on : ''}`} onClick={handleLooping} disabled={!isLoaded}>
              {isLooping ? '🟣' : '⚪️'} {t('labels.loop')} <span className={styles['sb-kbd']}>L</span>
            </button>
            <button className={`${styles['sb-toggle-btn']} ${styles.sel} ${hasSelection ? styles.on : ''}`} onClick={clearSelection} disabled={!isLoaded || !hasSelection}>
              {hasSelection ? `✖️ ${t('labels.clearSelection')}` : `🖱️ ${t('labels.dragToSelect')}`}
            </button>
          </div>

          <hr className={styles['sb-divider']} />

          <div>
            <p className={styles['sb-section-label']}>{t('sections.playback')}</p>
            <div className={styles['sb-transport']}>
              <button className={styles['sb-play']} onClick={handlePlayPause} disabled={!isLoaded}>
                {isPlaying ? `⏸ ${t('labels.pause')}` : `▶ ${t('labels.play')}`}
              </button>
              <button className={styles['sb-stop']} onClick={handleStop} disabled={!isLoaded}>⏹</button>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Play / Pause</span>
              <span className={styles['sb-kbd']}>Espacio</span>
              <span className={styles.openLabel}>Stop</span>
              <span className={styles['sb-kbd']}>Esc</span>
            </div>
          </div>

          {tracks.length > 0 && (
            <>
              <hr className={styles['sb-divider']} />
              <div>
                <p className={styles['sb-section-label']}>{t('sections.tracks', { count: tracks.length })}</p>
                <div className={styles.toolsStack}>
                  {tracks.map((track, index) => (
                    <div key={index} className={`${styles['sb-track']} ${activeTrackIndex === index ? styles.active : ''}`}>
                      <div className={styles['sb-track-header']}>
                        <span className={styles['sb-track-name']}>{track.name}</span>
                        <button className={styles['sb-track-eye']} onClick={() => handleTrackView(track, index)}>
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        </button>
                      </div>
                      <div className={styles['sb-track-vol']}>
                        <span className={styles['sb-vol-label']}>{t('labels.vol')}</span>
                        <input type="range" className={styles['sb-vol-slider']} min="0" max="2" step="0.1" defaultValue="1" onChange={(e) => changeVolume(track, e.target.value)} />
                      </div>
                      <div className={styles['sb-track-actions']}>
                        <button className={`${styles['sb-mute']} ${track.playbackInfo?.isMute ? styles.on : ''}`} onClick={() => toggleMute(track)}>{t('labels.mute')}</button>
                        <button className={`${styles['sb-solo']} ${track.playbackInfo?.isSolo ? styles.on : ''}`} onClick={() => toggleSolo(track)}>{t('labels.solo')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}