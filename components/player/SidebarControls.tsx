"use client";

import { useState, useEffect } from 'react';

interface SidebarControlsProps {
  apiRef: React.MutableRefObject<any>;
  isLoaded: boolean;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  tracks: any[];
  setTracks: React.Dispatch<React.SetStateAction<any[]>>;
  currentPlaybackBpm?: number | null;
  originalBpm?: number | null;
}

export function SidebarControls({ 
  apiRef, 
  isLoaded, 
  isPlaying, 
  setIsPlaying, 
  tracks, 
  setTracks,
  currentPlaybackBpm,
  originalBpm
}: SidebarControlsProps) {
  const [speed, setSpeed] = useState('1');
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [isCountIn, setIsCountIn] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [hasSelection, setHasSelection] = useState(false);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);

  useEffect(() => {
    if (isLoaded) {
      setActiveTrackIndex(0);
    }
  }, [isLoaded]);

  useEffect(() => {
    if (!apiRef.current || !originalBpm || !isLoaded) return;
    
    const baseBpm = (currentPlaybackBpm && currentPlaybackBpm > 0) ? currentPlaybackBpm : originalBpm;
    const multiplier = parseFloat(speed);
    
    apiRef.current.playbackSpeed = (baseBpm * multiplier) / originalBpm;
  }, [currentPlaybackBpm, speed, originalBpm, isLoaded, apiRef]);

  useEffect(() => {
    if (!apiRef.current || !isLoaded) return;
    
    const handleRangeChanged = () => {
      if (apiRef.current) {
        setHasSelection(apiRef.current.playbackRange !== null);
      }
    };

    apiRef.current.playbackRangeChanged.on(handleRangeChanged);

    return () => {
      apiRef.current?.playbackRangeChanged?.off(handleRangeChanged);
    };
  }, [apiRef, isLoaded]);

  const clearSelection = () => {
    if (!apiRef.current) return;
    apiRef.current.playbackRange = null;
    if (apiRef.current.clearPlaybackRangeHighlight) {
      apiRef.current.clearPlaybackRangeHighlight();
    }
    setHasSelection(false);
  };

  const handlePlayPause = () => apiRef.current?.playPause();
  const handleStop = () => { apiRef.current?.stop(); setIsPlaying(false); };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSpeed(e.target.value);
  };

  const handleMetronome = () => {
    if (!apiRef.current) return;
    const next = !isMetronomeOn;
    setIsMetronomeOn(next);
    apiRef.current.metronomeVolume = next ? 1 : 0;
  };

  const handleCountIn = () => {
    if (!apiRef.current) return;
    const next = !isCountIn;
    setIsCountIn(next);
    apiRef.current.countInVolume = next ? 1 : 0;
  };

  const handleLooping = () => {
    if (!apiRef.current) return;
    const next = !isLooping;
    setIsLooping(next);
    apiRef.current.isLooping = next;
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

  return (
    <>
      <style>{`
        .sidebar-root {
          position: relative;
          height: 100vh;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: #141414;
          border-left: 1px solid rgba(220,185,138,0.1);
          transition: width 0.35s cubic-bezier(.4,0,.2,1), min-width 0.35s cubic-bezier(.4,0,.2,1);
          overflow: hidden;
        }
        .sidebar-root.open  { width: 300px; min-width: 300px; }
        .sidebar-root.closed { width: 52px; min-width: 52px; }

        .sidebar-toggle {
          position: absolute;
          top: 1.2rem;
          right: 0.85rem;
          z-index: 10;
          width: 30px; height: 30px;
          border-radius: 6px;
          border: 1px solid rgba(220,185,138,0.2);
          background: rgba(220,185,138,0.07);
          color: var(--gold, #dcb98a);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, border-color 0.2s;
          font-size: 0.75rem;
          flex-shrink: 0;
        }
        .sidebar-toggle:hover {
          background: rgba(220,185,138,0.15);
          border-color: rgba(220,185,138,0.4);
        }

        .sidebar-icons {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.2rem;
          padding-top: 4.5rem;
          opacity: 0;
          transition: opacity 0.15s;
          pointer-events: none;
        }
        .sidebar-root.closed .sidebar-icons {
          opacity: 1;
          pointer-events: auto;
        }
        .sidebar-icon-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(220,185,138,0.3);
        }
        .sidebar-icon-dot.active { background: var(--gold, #dcb98a); }

        .sidebar-content {
          position: absolute;
          top: 0; left: 0;
          width: 300px;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 1.4rem 1.25rem 2rem 1.25rem;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
          opacity: 1;
          transition: opacity 0.2s ease 0.1s;
          scrollbar-width: thin;
          scrollbar-color: rgba(220,185,138,0.2) transparent;
        }
        .sidebar-root.closed .sidebar-content {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.1s ease;
        }

        .sb-section-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(220,185,138,0.5);
          margin: 0 0 0.75rem 0;
        }

        .sb-select {
          width: 100%;
          padding: 0.6rem 0.8rem;
          background: rgba(255,255,255,0.04);
          color: var(--text, #f0e8dc);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236a5f52' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          padding-right: 2rem;
        }
        .sb-select:focus { border-color: rgba(220,185,138,0.4); }
        .sb-select:disabled { opacity: 0.35; cursor: not-allowed; }

        .sb-toggle-btn {
          width: 100%;
          padding: 0.6rem 0.8rem;
          border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: var(--text, #f0e8dc);
          text-align: left;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .sb-toggle-btn.on {
          background: rgba(231,76,60,0.15);
          border-color: rgba(231,76,60,0.4);
          color: #e74c3c;
        }
        .sb-toggle-btn.loop.on {
          background: rgba(167,139,250,0.15);
          border-color: rgba(167,139,250,0.4);
          color: #a78bfa;
        }
        .sb-toggle-btn.sel.on {
          background: rgba(220,185,138,0.15);
          border-color: rgba(220,185,138,0.4);
          color: var(--gold, #dcb98a);
        }
        .sb-toggle-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .sb-transport {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0.5rem;
        }
        .sb-play {
          padding: 0.65rem;
          background: var(--gold, #dcb98a);
          color: #111;
          border: none;
          border-radius: 7px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 0.88rem;
          transition: background 0.2s;
          text-align: center;
        }
        .sb-play:hover:not(:disabled) { background: #c9a676; }
        .sb-play:disabled { opacity: 0.35; cursor: not-allowed; }

        .sb-stop {
          padding: 0.65rem 0.85rem;
          background: rgba(255,255,255,0.04);
          color: var(--text, #f0e8dc);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 7px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background 0.2s;
        }
        .sb-stop:hover:not(:disabled) { background: rgba(255,255,255,0.08); }
        .sb-stop:disabled { opacity: 0.35; cursor: not-allowed; }

        .sb-divider {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.05);
          margin: 0;
        }

        .sb-track {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 0.75rem 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          transition: all 0.2s;
        }
        .sb-track:hover { border-color: rgba(220,185,138,0.15); }
        .sb-track.active {
          border-color: rgba(220,185,138,0.5);
          background: rgba(220,185,138,0.08);
          box-shadow: inset 3px 0 0 var(--gold, #dcb98a);
        }

        .sb-track-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
        }
        .sb-track-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text, #f0e8dc);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          transition: color 0.2s;
        }
        .sb-track.active .sb-track-name {
          color: var(--gold, #dcb98a);
          font-weight: 700;
        }

        .sb-track-eye {
          background: none;
          border: none;
          color: rgba(220,185,138,0.4);
          cursor: pointer;
          padding: 0.15rem;
          display: flex;
          align-items: center;
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .sb-track-eye:hover { color: var(--gold, #dcb98a); }
        .sb-track.active .sb-track-eye { color: var(--gold, #dcb98a); opacity: 1; }

        .sb-track-vol {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .sb-vol-label {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: rgba(220,185,138,0.35);
          flex-shrink: 0;
          width: 22px;
        }
        .sb-vol-slider {
          flex: 1;
          accent-color: var(--gold, #dcb98a);
          cursor: pointer;
          height: 3px;
        }

        .sb-track-actions {
          display: flex;
          gap: 0.4rem;
        }
        .sb-mute, .sb-solo {
          flex: 1;
          padding: 0.25rem;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .sb-mute {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.4);
        }
        .sb-mute:hover { background: rgba(231,76,60,0.2); color: #e74c3c; }
        .sb-mute.on { background: #e74c3c; color: #fff; }

        .sb-solo {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.4);
        }
        .sb-solo:hover { background: rgba(241,196,15,0.2); color: #f1c40f; }
        .sb-solo.on { background: #f1c40f; color: #111; }
      `}</style>

      <aside className={`sidebar-root ${isOpen ? 'open' : 'closed'}`}>

        <button
          className="sidebar-toggle"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Ocultar panel' : 'Mostrar panel'}
          style={{ right: isOpen ? '0.85rem' : '50%', transform: isOpen ? 'none' : 'translateX(50%)' }}
        >
          {isOpen ? '›' : '‹'}
        </button>

        <div className="sidebar-icons">
          <div className={`sidebar-icon-dot ${isLoaded ? 'active' : ''}`} title="Player" />
          <div className={`sidebar-icon-dot ${isPlaying ? 'active' : ''}`} title="Reproduciendo" />
          <div className={`sidebar-icon-dot ${tracks.length > 0 ? 'active' : ''}`} title="Pistas" />
        </div>

        <div className="sidebar-content">

          <div style={{ paddingTop: '2.4rem' }}>
            <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(220,185,138,0.4)' }}>Panel</p>
            <h2 style={{ margin: '0.2rem 0 0', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', letterSpacing: '0.06em', color: 'var(--gold, #dcb98a)' }}>Controles</h2>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <p className="sb-section-label" style={{ margin: 0 }}>Velocidad</p>
            </div>
            <select 
              className="sb-select" 
              value={speed} 
              onChange={handleSpeedChange} 
              disabled={!isLoaded}
            >
              <option value="0.25">× 0.25</option>
              <option value="0.5">× 0.50</option>
              <option value="0.75">× 0.75</option>
              <option value="1">× 1.00</option>
              <option value="1.25">× 1.25</option>
              <option value="1.5">× 1.50</option>
            </select>
          </div>

          {effectiveBpm !== null && (
            <div style={{ textAlign: 'center', background: 'rgba(220,185,138,0.05)', padding: '0.5rem', borderRadius: '7px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 'bold' }}>
                BPM EFECTIVO: {effectiveBpm}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p className="sb-section-label">Herramientas</p>
            <button className={`sb-toggle-btn ${isMetronomeOn ? 'on' : ''}`} onClick={handleMetronome} disabled={!isLoaded}>
              {isMetronomeOn ? '🔴' : '⚪️'} Metrónomo
            </button>
            <button className={`sb-toggle-btn ${isCountIn ? 'on' : ''}`} onClick={handleCountIn} disabled={!isLoaded}>
              {isCountIn ? '🔴' : '⚪️'} Cuenta atrás
            </button>
            <button className={`sb-toggle-btn loop ${isLooping ? 'on' : ''}`} onClick={handleLooping} disabled={!isLoaded}>
              {isLooping ? '🟣' : '⚪️'} Bucle
            </button>
            <button 
              className={`sb-toggle-btn sel ${hasSelection ? 'on' : ''}`} 
              onClick={clearSelection} 
              disabled={!isLoaded || !hasSelection}
            >
              {hasSelection ? '✖️ Limpiar selección' : '🖱️ Arrastra para selec.'}
            </button>
          </div>

          <hr className="sb-divider" />

          <div>
            <p className="sb-section-label">Reproducción</p>
            <div className="sb-transport">
              <button className="sb-play" onClick={handlePlayPause} disabled={!isLoaded}>
                {isPlaying ? '⏸ Pausar' : '▶ Reproducir'}
              </button>
              <button className="sb-stop" onClick={handleStop} disabled={!isLoaded} title="Detener">
                ⏹
              </button>
            </div>
          </div>

          {tracks.length > 0 && (
            <>
              <hr className="sb-divider" />
              <div>
                <p className="sb-section-label">Pistas — {tracks.length}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tracks.map((track, index) => {
                    const isMuted = track.playbackInfo?.isMute ?? false;
                    const isSolo  = track.playbackInfo?.isSolo ?? false;
                    const isActive = activeTrackIndex === index;
                    return (
                      <div key={index} className={`sb-track ${isActive ? 'active' : ''}`}>
                        <div className="sb-track-header">
                          <span className="sb-track-name" title={track.name}>{track.name}</span>
                          <button className="sb-track-eye" onClick={() => handleTrackView(track, index)} title="Ver tablatura">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        </div>
                        <div className="sb-track-vol">
                          <span className="sb-vol-label">VOL</span>
                          <input type="range" className="sb-vol-slider" min="0" max="2" step="0.1" defaultValue="1"
                            onChange={(e) => changeVolume(track, e.target.value)} />
                        </div>
                        <div className="sb-track-actions">
                          <button className={`sb-mute ${isMuted ? 'on' : ''}`} onClick={() => toggleMute(track)}>MUTE</button>
                          <button className={`sb-solo ${isSolo ? 'on' : ''}`} onClick={() => toggleSolo(track)}>SOLO</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}