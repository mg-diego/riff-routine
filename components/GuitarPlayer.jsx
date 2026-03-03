"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function GuitarPlayer() {
  const router = useRouter();

  const wrapperRef    = useRef(null);
  const mainScrollRef = useRef(null);
  const apiRef        = useRef(null);

  const [tracks,        setTracks]        = useState([]);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [isLoaded,      setIsLoaded]      = useState(false);
  const [isDragOver,    setIsDragOver]    = useState(false);
  const [speed,         setSpeed]         = useState('1');
  const [scriptReady,   setScriptReady]   = useState(false);
  const [fileName,      setFileName]      = useState(null); // nombre del archivo precargado

  useEffect(() => {
    if (!scriptReady || !wrapperRef.current) return;

    const api = new window.alphaTab.AlphaTabApi(wrapperRef.current, {
      core: { engine: 'html5', useWorkers: true },
      display: { layoutMode: 'page', staveProfile: 'scoretab' },
      player: {
        enablePlayer: true,
        enableCursor: true,
        enableElementHighlighting: true,
        scrollElement: mainScrollRef.current,
        soundFont: 'https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.3.0/dist/soundfont/sonivox.sf2',
      },
    });

    apiRef.current = api;

    api.scoreLoaded.on((score) => setTracks(score.tracks));
    api.soundFontLoad.on(() => setIsLoaded(true));
    api.playerStateChanged.on((args) => setIsPlaying(args.state === 1));
    api.playerFinished.on(() => setIsPlaying(false));

    // ── Precargar archivo desde ?file= en la URL ──────────────────────────────
    const params = new URLSearchParams(window.location.search);
    const fileUrl = params.get('file');
    if (fileUrl) {
      const decoded = decodeURIComponent(fileUrl);
      // Extraer nombre del archivo de la URL para mostrarlo en el drop zone
      const name = decoded.split('/').pop().split('?')[0];
      setFileName(name);

      fetch(decoded)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then(buffer => api.load(new Uint8Array(buffer)))
        .catch(err => console.error('[GuitarPlayer] Error precargando archivo:', err));
    }
    // ─────────────────────────────────────────────────────────────────────────

    return () => {
      apiRef.current?.destroy();
      apiRef.current = null;
    };
  }, [scriptReady]);

  const handlePlayPause = () => apiRef.current?.playPause();
  const handleStop      = () => { apiRef.current?.stop(); setIsPlaying(false); };

  const handleMetronome = () => {
    if (!apiRef.current) return;
    const next = !isMetronomeOn;
    setIsMetronomeOn(next);
    apiRef.current.metronomeVolume = next ? 1 : 0;
  };

  const handleSpeedChange = (e) => {
    const val = e.target.value;
    setSpeed(val);
    if (apiRef.current) apiRef.current.playbackSpeed = parseFloat(val);
  };

  const handleTrackView = (track) => apiRef.current?.renderTracks([track]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file || !apiRef.current) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (['gp3','gp4','gp5','gpx','gp'].includes(ext)) {
      setTracks([]);
      setIsPlaying(false);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => apiRef.current.load(new Uint8Array(evt.target.result));
      reader.readAsArrayBuffer(file);
    } else {
      alert('Archivo inválido.');
    }
  };

  const toggleMute = (track) => {
    if (!apiRef.current) return;
    const next = !(track.playbackInfo?.isMute ?? false);
    if (track.playbackInfo) track.playbackInfo.isMute = next;
    apiRef.current.changeTrackMute([track], next);
    setTracks(prev => [...prev]);
  };

  const toggleSolo = (track) => {
    if (!apiRef.current) return;
    const next = !(track.playbackInfo?.isSolo ?? false);
    if (track.playbackInfo) track.playbackInfo.isSolo = next;
    apiRef.current.changeTrackSolo([track], next);
    setTracks(prev => [...prev]);
  };

  const changeVolume = (track, volume) => {
    apiRef.current?.changeTrackVolume([track], parseFloat(volume));
  };

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.3.0/dist/alphaTab.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />

      <div style={{ display: 'flex', width: '100vw' }}>
        <main className="main-panel" ref={mainScrollRef} id="main-scroll-area">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>RiffRoutine</h1>
              <span>gp3 · gp4 · gp5 · gpx · gp</span>
            </div>
            <button
              onClick={() => router.push('/')}
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
            >
              ✕ Cerrar y Volver
            </button>
          </header>

          {/* Drop zone — muestra el archivo precargado si hay uno */}
          <div
            className={`drop-zone ${isDragOver ? 'dragover' : ''} ${fileName ? 'loaded' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
          >
            {fileName ? (
              <>
                🎵 <strong>{fileName}</strong>
                <span className="sub">Arrastra otro archivo para reemplazar</span>
              </>
            ) : (
              <>
                🎸 Arrastra aquí tu archivo Guitar Pro
                <span className="sub">Se adaptará a la ventana y se pintará la tablatura debajo</span>
              </>
            )}
          </div>

          <div className="alphatab-wrapper">
            <div className="alphatab-container" style={{ position: 'relative', overflow: 'visible' }}>
              <div ref={wrapperRef} />
            </div>
          </div>
        </main>

        <aside className="sidebar">
          <h2>Controles</h2>

          <div className="player-controls">
            <select value={speed} onChange={handleSpeedChange} disabled={!isLoaded}>
              <option value="0.25">25% Velocidad</option>
              <option value="0.5">50% Velocidad</option>
              <option value="0.75">75% Velocidad</option>
              <option value="1">100% Velocidad</option>
              <option value="1.25">125% Velocidad</option>
              <option value="1.5">150% Velocidad</option>
            </select>

            <button className={`metronome-btn ${isMetronomeOn ? 'active' : ''}`} onClick={handleMetronome} disabled={!isLoaded}>
              ⏱ Metrónomo: {isMetronomeOn ? 'ON' : 'OFF'}
            </button>

            <button id="play-pause-btn" onClick={handlePlayPause} disabled={!isLoaded}>
              {isPlaying ? '⏸ Pausar' : '▶ Reproducir'}
            </button>

            <button id="stop-btn" onClick={handleStop} disabled={!isLoaded}>
              ⏹ Detener
            </button>
          </div>

          {tracks.length > 0 && (
            <div className="mixer">
              <h3>Pistas</h3>
              <div className="mixer-tracks">
                {tracks.map((track, index) => {
                  const isMuted = track.playbackInfo?.isMute ?? false;
                  const isSolo  = track.playbackInfo?.isSolo ?? false;
                  return (
                    <div key={index} className="track-row">
                      <div className="track-header">
                        <span className="track-name" title={track.name}>{track.name}</span>
                        <button className="btn-view" onClick={() => handleTrackView(track)}>
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </div>
                      <div className="track-volume">
                        <span>Vol</span>
                        <input type="range" className="vol-slider" min="0" max="2" step="0.1" defaultValue="1"
                          onChange={(e) => changeVolume(track, e.target.value)} />
                      </div>
                      <div className="track-actions">
                        <button className={`btn-mute ${isMuted ? 'muted' : ''}`} onClick={() => toggleMute(track)}>Mute</button>
                        <button className={`btn-solo ${isSolo ? 'active' : ''}`} onClick={() => toggleSolo(track)}>Solo</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}