"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface SidebarControlsProps {
  apiRef: React.MutableRefObject<any>;
  isLoaded: boolean;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  tracks: any[];
  setTracks: React.Dispatch<React.SetStateAction<any[]>>;
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
  setIsPlaying,
  tracks,
  setTracks,
  currentPlaybackBpm,
  originalBpm,
  forceDisabled
}: SidebarControlsProps) {
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

  // ── Toast helper ────────────────────────────────────────────────
  const showToast = useCallback((icon: string, label: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastId.current += 1;
    setToast({ id: toastId.current, icon, label });
    toastTimer.current = setTimeout(() => setToast(null), 1400);
  }, []);

  // ── Handlers ────────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    if (!apiRef.current) return;
    apiRef.current.playPause();
  }, [apiRef]);

  const handleStop = useCallback(() => {
    if (!apiRef.current) return;
    apiRef.current.stop();
    setIsPlaying(false);
  }, [apiRef, setIsPlaying]);

  const handleMetronome = useCallback(() => {
    if (!apiRef.current) return;
    setIsMetronomeOn(prev => {
      const next = !prev;
      apiRef.current.metronomeVolume = next ? 1 : 0;
      return next;
    });
  }, [apiRef]);

  const handleLooping = useCallback(() => {
    if (!apiRef.current) return;
    setIsLooping(prev => {
      const next = !prev;
      apiRef.current.isLooping = next;
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

  // ── Keyboard shortcuts ───────────────────────────────────────────
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
            isPlaying ? 'Pausar' : 'Reproducir'
          );
          break;

        case 'Escape':
          e.preventDefault();
          handleStop();
          showToast('⏹', 'Detener');
          break;

        case 'KeyM':
          e.preventDefault();
          handleMetronome();
          setIsMetronomeOn(prev => {
            showToast('🥁', prev ? 'Metrónomo off' : 'Metrónomo on');
            return prev; // el estado lo maneja handleMetronome
          });
          break;

        case 'KeyL':
          e.preventDefault();
          handleLooping();
          setIsLooping(prev => {
            showToast('🔁', prev ? 'Bucle off' : 'Bucle on');
            return prev;
          });
          break;

        case 'Equal': // + / =
        case 'NumpadAdd':
          e.preventDefault();
          handleSpeedUp();
          showToast('⚡', 'Velocidad +');
          break;

        case 'Minus':
        case 'NumpadSubtract':
          e.preventDefault();
          handleSpeedDown();
          showToast('🐢', 'Velocidad −');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoaded, isPlaying, handlePlayPause, handleStop, handleMetronome, handleLooping, handleSpeedUp, handleSpeedDown, showToast]);

  // ── Resto de efectos ─────────────────────────────────────────────
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
      <style>{`
        .sidebar-root {
          position: relative; height: 100%; flex-shrink: 0;
          display: flex; flex-direction: column;
          background: #141414; border-left: 1px solid rgba(220,185,138,0.1);
          transition: width 0.35s cubic-bezier(.4,0,.2,1);
          overflow: hidden; z-index: 20;
        }
        .sidebar-root.open  { width: 300px; }
        .sidebar-root.closed { width: 52px; }

        .sidebar-toggle {
          position: absolute; top: 1.2rem; z-index: 30;
          width: 30px; height: 30px; border-radius: 6px;
          border: 1px solid rgba(220,185,138,0.2);
          background: rgba(20,20,20,0.9); color: var(--gold,#dcb98a);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; font-size: 0.75rem;
        }
        .sidebar-toggle:hover { background: rgba(220,185,138,0.15); border-color: rgba(220,185,138,0.4); }

        .sidebar-icons {
          position: absolute; top: 0; left: 0; width: 52px;
          display: flex; flex-direction: column; align-items: center;
          gap: 1.2rem; padding-top: 4.5rem;
          opacity: 0; transition: opacity 0.2s; pointer-events: none;
        }
        .sidebar-root.closed .sidebar-icons { opacity: 1; pointer-events: auto; }
        .sidebar-icon-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(220,185,138,0.3); }
        .sidebar-icon-dot.active { background: var(--gold,#dcb98a); }

        .sidebar-content {
          width: 300px; height: 100%; overflow-y: auto; overflow-x: hidden;
          padding: 1.4rem 1.25rem 2rem; box-sizing: border-box;
          display: flex; flex-direction: column; gap: 1.75rem;
          opacity: 1; transition: opacity 0.2s;
          scrollbar-width: thin; scrollbar-color: rgba(220,185,138,0.2) transparent;
        }
        .sidebar-root.closed .sidebar-content { opacity: 0; pointer-events: none; }

        /* Shortcut hints */
        .sb-kbd {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.6rem;
          font-weight: 700; font-family: monospace; letter-spacing: 0.03em;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.35); margin-left: auto; flex-shrink: 0;
        }

        /* Toast */
        .sb-toast {
          position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 0.6rem;
          background: rgba(20,20,20,0.95); border: 1px solid rgba(220,185,138,0.25);
          border-radius: 100px; padding: 0.55rem 1.1rem;
          font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 600;
          color: var(--text,#f0e8dc); z-index: 9999; pointer-events: none;
          box-shadow: 0 4px 24px rgba(0,0,0,0.5);
          animation: sb-toast-in 0.15s ease;
        }
        @keyframes sb-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .sb-toast-icon { font-size: 1.1rem; }

        .sb-section-label {
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(220,185,138,0.5); margin: 0 0 0.75rem;
        }
        .sb-select {
          width: 100%; padding: 0.6rem 0.8rem;
          background: rgba(255,255,255,0.04); color: var(--text,#f0e8dc);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 7px;
          font-family: 'DM Sans', sans-serif; font-size: 0.85rem;
          outline: none; cursor: pointer; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236a5f52' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 0.75rem center; padding-right: 2rem;
        }
        .sb-toggle-btn {
          width: 100%; padding: 0.6rem 0.8rem; border-radius: 7px;
          font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04);
          color: var(--text,#f0e8dc); text-align: left;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .sb-toggle-btn.on       { background: rgba(231,76,60,0.15);  border-color: rgba(231,76,60,0.4);  color: #e74c3c; }
        .sb-toggle-btn.loop.on  { background: rgba(167,139,250,0.15); border-color: rgba(167,139,250,0.4); color: #a78bfa; }
        .sb-toggle-btn.sel.on   { background: rgba(220,185,138,0.15); border-color: rgba(220,185,138,0.4); color: var(--gold,#dcb98a); }
        .sb-transport { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; }
        .sb-play { padding: 0.65rem; background: var(--gold,#dcb98a); color: #111; border: none; border-radius: 7px; cursor: pointer; font-weight: 700; }
        .sb-stop { padding: 0.65rem 0.85rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 7px; cursor: pointer; color: var(--text,#f0e8dc); }
        .sb-divider { border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 0; }
        .sb-track { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 0.75rem 0.85rem; display: flex; flex-direction: column; gap: 0.55rem; }
        .sb-track.active { border-color: rgba(220,185,138,0.5); background: rgba(220,185,138,0.08); box-shadow: inset 3px 0 0 var(--gold,#dcb98a); }
        .sb-track-header { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
        .sb-track-name { font-size: 0.82rem; font-weight: 600; color: var(--text,#f0e8dc); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
        .sb-track-eye { background: none; border: none; color: rgba(220,185,138,0.4); cursor: pointer; padding: 0.15rem; display: flex; align-items: center; }
        .sb-track-vol { display: flex; align-items: center; gap: 0.6rem; }
        .sb-vol-label { font-size: 0.62rem; font-weight: 700; color: rgba(220,185,138,0.35); width: 22px; }
        .sb-vol-slider { flex: 1; accent-color: var(--gold,#dcb98a); cursor: pointer; height: 3px; }
        .sb-track-actions { display: flex; gap: 0.4rem; }
        .sb-mute, .sb-solo { flex: 1; padding: 0.25rem; font-size: 0.68rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; }
        .sb-mute { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); }
        .sb-mute.on { background: #e74c3c; color: #fff; }
        .sb-solo { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); }
        .sb-solo.on { background: #f1c40f; color: #111; }

        /* Shortcuts reference card */
        .sb-shortcuts-card {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px; padding: 0.85rem;
          display: flex; flex-direction: column; gap: 0.45rem;
        }
        .sb-shortcut-row {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 0.75rem; color: rgba(255,255,255,0.35);
        }
      `}</style>

      {/* Toast overlay */}
      {toast && (
        <div key={toast.id} className="sb-toast">
          <span className="sb-toast-icon">{toast.icon}</span>
          {toast.label}
        </div>
      )}

      <aside className={`sidebar-root ${actuallyOpen ? 'open' : 'closed'}`}>
        {!forceDisabled && (
          <button
            className="sidebar-toggle"
            onClick={() => setIsOpen(o => !o)}
            style={{ right: actuallyOpen ? '0.85rem' : '11px', transition: 'right 0.35s cubic-bezier(.4,0,.2,1)' }}
          >
            {actuallyOpen ? '›' : '‹'}
          </button>
        )}

        <div className="sidebar-icons">
          <div className={`sidebar-icon-dot ${isLoaded ? 'active' : ''}`} />
          <div className={`sidebar-icon-dot ${isPlaying ? 'active' : ''}`} />
          <div className={`sidebar-icon-dot ${tracks.length > 0 ? 'active' : ''}`} />
        </div>

        <div className="sidebar-content">
          <div style={{ paddingTop: '2.4rem' }}>
            <p className="sb-section-label" style={{ opacity: 0.5 }}>Panel</p>
            <h2 style={{ margin: '0.2rem 0 0', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color: 'var(--gold,#dcb98a)' }}>Controles</h2>
          </div>

          {/* Velocidad */}
          <div>
            <p className="sb-section-label">Velocidad</p>
            <select className="sb-select" value={speed} onChange={e => setSpeed(e.target.value)} disabled={!isLoaded}>
              <option value="0.25">× 0.25</option>
              <option value="0.5">× 0.50</option>
              <option value="0.75">× 0.75</option>
              <option value="1">× 1.00</option>
              <option value="1.25">× 1.25</option>
              <option value="1.5">× 1.50</option>
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.3rem', marginTop: '0.4rem' }}>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', marginRight: 'auto', alignSelf: 'center' }}>Atajos:</span>
              <span className="sb-kbd">−</span>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>/</span>
              <span className="sb-kbd">+</span>
            </div>
          </div>

          {effectiveBpm !== null && (
            <div style={{ textAlign: 'center', background: 'rgba(220,185,138,0.05)', padding: '0.5rem', borderRadius: '7px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 'bold' }}>BPM: {effectiveBpm}</span>
            </div>
          )}

          {/* Herramientas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p className="sb-section-label">Herramientas</p>
            <button className={`sb-toggle-btn ${isMetronomeOn ? 'on' : ''}`} onClick={handleMetronome} disabled={!isLoaded}>
              {isMetronomeOn ? '🔴' : '⚪️'} Metrónomo <span className="sb-kbd">M</span>
            </button>
            <button className={`sb-toggle-btn ${isCountIn ? 'on' : ''}`} onClick={handleCountIn} disabled={!isLoaded}>
              {isCountIn ? '🔴' : '⚪️'} Cuenta atrás
            </button>
            <button className={`sb-toggle-btn loop ${isLooping ? 'on' : ''}`} onClick={handleLooping} disabled={!isLoaded}>
              {isLooping ? '🟣' : '⚪️'} Bucle <span className="sb-kbd">L</span>
            </button>
            <button className={`sb-toggle-btn sel ${hasSelection ? 'on' : ''}`} onClick={clearSelection} disabled={!isLoaded || !hasSelection}>
              {hasSelection ? '✖️ Limpiar selección' : '🖱️ Arrastra para selec.'}
            </button>
          </div>

          <hr className="sb-divider" />

          {/* Reproducción */}
          <div>
            <p className="sb-section-label">Reproducción</p>
            <div className="sb-transport">
              <button className="sb-play" onClick={handlePlayPause} disabled={!isLoaded}>
                {isPlaying ? '⏸ Pausar' : '▶ Reproducir'}
              </button>
              <button className="sb-stop" onClick={handleStop} disabled={!isLoaded}>⏹</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.45rem' }}>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>Play / Pause</span>
              <span className="sb-kbd">Espacio</span>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', marginLeft: '0.75rem' }}>Stop</span>
              <span className="sb-kbd">Esc</span>
            </div>
          </div>

          {tracks.length > 0 && (
            <>
              <hr className="sb-divider" />
              <div>
                <p className="sb-section-label">Pistas — {tracks.length}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tracks.map((track, index) => (
                    <div key={index} className={`sb-track ${activeTrackIndex === index ? 'active' : ''}`}>
                      <div className="sb-track-header">
                        <span className="sb-track-name">{track.name}</span>
                        <button className="sb-track-eye" onClick={() => handleTrackView(track, index)}>
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </div>
                      <div className="sb-track-vol">
                        <span className="sb-vol-label">VOL</span>
                        <input type="range" className="sb-vol-slider" min="0" max="2" step="0.1" defaultValue="1" onChange={(e) => changeVolume(track, e.target.value)} />
                      </div>
                      <div className="sb-track-actions">
                        <button className={`sb-mute ${track.playbackInfo?.isMute ? 'on' : ''}`} onClick={() => toggleMute(track)}>MUTE</button>
                        <button className={`sb-solo ${track.playbackInfo?.isSolo ? 'on' : ''}`} onClick={() => toggleSolo(track)}>SOLO</button>
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