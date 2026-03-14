import React from 'react';
import { CHROMATIC_NOTES, INTERVAL_NAMES, MARKED_FRETS, STANDARD_BASES, STANDARD_TUNING } from '@/lib/constants';

export function Fretboard({
  activeNotesList,
  title,
  positionIndex,
  rootNote,
  scaleData,
  isEditingPos,
  draftPosNotes,
  setDraftPosNotes,
  setIsEditingPos,
  handleExportCustomPosition,
  initAudio,
  audioCtx,
  playFreq,
  getNoteFrequency,
  leftyMode,
  labelMode,
  scaleNotes,
  getIntervalColor,
  showGhostNotes, // <-- NUEVA PROP
  t
}: any) {
  const rootIndexGlobal = CHROMATIC_NOTES.indexOf(rootNote);
  const aliases = scaleData.intervalAliases || {};
  const isCurrentlyEditing = isEditingPos === positionIndex && positionIndex !== undefined;
  const isDevMode = process.env.NODE_ENV === 'development';
  const displayedNotes = isCurrentlyEditing ? draftPosNotes : activeNotesList;

  const handlePlayPos = () => {
    initAudio();
    if (!audioCtx || !displayedNotes) return;

    const sortedNotes = [...displayedNotes].sort((a: any, b: any) => {
      const pitchA = STANDARD_BASES[a.string] + a.fret;
      const pitchB = STANDARD_BASES[b.string] + b.fret;
      return pitchA - pitchB;
    });

    let currentTime = audioCtx.currentTime;
    sortedNotes.forEach((n: any, i: number) => {
      const pitch = STANDARD_BASES[n.string] + n.fret;
      const freq = 440 * Math.pow(2, (pitch - 69) / 12);
      playFreq(freq, currentTime + i * 0.3, 0.5, 0.2);
    });
  };

  const handleCellClick = (stringIndex: number, fret: number, currentNote: string, currentOctave: number) => {
    if (isCurrentlyEditing) {
      setDraftPosNotes((prev: any) => {
        const exists = prev.find((n: any) => n.string === stringIndex && n.fret === fret);
        if (exists) return prev.filter((n: any) => !(n.string === stringIndex && n.fret === fret));
        return [...prev, { string: stringIndex, fret }];
      });
    } else {
      initAudio();
      const freq = getNoteFrequency(currentNote, currentOctave);
      playFreq(freq, audioCtx!.currentTime, 0.8, 0.2);
    }
  };

  const fretCols = Array.from({ length: 24 }, (_, i) => {
    const minWidth = 6;
    const maxWidth = 10;
    const width = maxWidth - (i * ((maxWidth - minWidth) / 23));
    return `${width}fr`;
  }).join(' ');

  return (
    <div style={{ width: '100%', marginBottom: '3rem' }}>
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h3 style={{ color: 'var(--gold)', margin: 0 }}>{title}</h3>
            {isDevMode && positionIndex !== undefined && (
              isCurrentlyEditing ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setDraftPosNotes([])} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    Limpiar
                  </button>
                  <button onClick={handleExportCustomPosition} style={{ background: '#34d399', color: '#111', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    Exportar a TS
                  </button>
                  <button onClick={() => setIsEditingPos(null)} style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid var(--muted)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <button onClick={() => {
                  setIsEditingPos(positionIndex);
                  setDraftPosNotes(activeNotesList ? [...activeNotesList] : []);
                }} style={{ background: 'transparent', color: 'var(--muted)', border: '1px dashed rgba(255,255,255,0.2)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                  ✎ Editar Posición
                </button>
              )
            )}
          </div>
          {displayedNotes && displayedNotes.length > 0 && !isCurrentlyEditing && (
            <button onClick={handlePlayPos} style={{ background: 'var(--surface2)', color: 'var(--gold)', border: '1px solid var(--gold)', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
              {t('fretboard.playPosition')}
            </button>
          )}
        </div>
      )}
      <div style={{ width: '100%', paddingBottom: '1rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `minmax(15px, 4%) ${fretCols}`,
          background: '#2a1a0a',
          border: isCurrentlyEditing ? '2px dashed #34d399' : '2px solid #8b5a2b',
          borderRadius: '8px',
          padding: '1% 1% 1% 0',
          width: '100%',
          transform: leftyMode ? 'scaleX(-1)' : 'none',
          transition: 'border 0.2s'
        }}>
          <div></div>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={`header-${i}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '10px', color: 'var(--gold)', fontSize: 'clamp(8px, 1.2vw, 14px)', fontWeight: 'bold', transform: leftyMode ? 'scaleX(-1)' : 'none' }}>
              {i + 1}
            </div>
          ))}

          {STANDARD_TUNING.map((openNote, stringIndex) => {
            const stringRootIndex = CHROMATIC_NOTES.indexOf(openNote);
            const baseOctave = Math.floor(STANDARD_BASES[stringIndex] / 12) - 1;

            return (
              <React.Fragment key={`string-${stringIndex}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: 'clamp(10px, 1.5vw, 16px)', paddingRight: '4px', transform: leftyMode ? 'scaleX(-1)' : 'none' }}>
                  {openNote}
                </div>

                {Array.from({ length: 24 }).map((_, fretIndex) => {
                  const fret = fretIndex + 1;
                  const currentNote = CHROMATIC_NOTES[(stringRootIndex + fret) % 12];
                  const currentNoteIndex = CHROMATIC_NOTES.indexOf(currentNote);
                  const interval = (currentNoteIndex - rootIndexGlobal + 12) % 12;
                  const intervalNameStr = aliases[interval] || INTERVAL_NAMES[interval];
                  const currentOctave = baseOctave + Math.floor((stringRootIndex + fret) / 12);

                  // --- LOGICA DE RENDERIZADO MEJORADA ---
                  let isNoteInScale = scaleNotes.includes(currentNote);
                  let isInActiveList = false;
                  
                  if (isCurrentlyEditing || activeNotesList) {
                    isInActiveList = (displayedNotes || []).some((n: any) => n.string === stringIndex && n.fret === fret);
                  }

                  let isActive = false;
                  let noteOpacity = 1;

                  if (isCurrentlyEditing) {
                    isActive = isInActiveList;
                    noteOpacity = isNoteInScale ? 1 : 0.4;
                  } else if (activeNotesList) {
                    if (showGhostNotes) {
                      isActive = isNoteInScale;
                      noteOpacity = isInActiveList ? 1 : 0.15; // El "Modo Fantasma"
                    } else {
                      isActive = isInActiveList;
                      noteOpacity = 1;
                    }
                  } else {
                    isActive = isNoteInScale;
                    noteOpacity = 1;
                  }
                  // --------------------------------------

                  const isMarked = MARKED_FRETS.includes(fret);
                  const bgColor = getIntervalColor(interval);
                  const textColor = (bgColor === '#f1c40f' || bgColor === '#2ecc71') ? '#000' : '#fff';

                  const isSingleDotFret = [3, 5, 7, 9, 15, 17, 19, 21].includes(fret);
                  const isDoubleDotFret = fret === 12 || fret === 24;
                  const hasSingleDot = isSingleDotFret && stringIndex === 2;
                  const hasDoubleDot = isDoubleDotFret && (stringIndex === 1 || stringIndex === 3);

                  return (
                    <div key={`cell-${stringIndex}-${fret}`}
                      onClick={() => handleCellClick(stringIndex, fret, currentNote, currentOctave)}
                      style={{
                        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRight: 'clamp(1px, 0.2vw, 3px) solid silver', height: 'clamp(20px, 3.5vw, 42px)',
                        backgroundColor: isMarked ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                        cursor: isCurrentlyEditing ? 'crosshair' : 'default'
                      }}>

                      {(hasSingleDot || hasDoubleDot) && (
                        <div style={{
                          position: 'absolute', top: '100%', left: '50%', transform: 'translate(-50%, -50%)',
                          width: 'clamp(10px, 1.5vw, 16px)', height: 'clamp(10px, 1.5vw, 16px)',
                          borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          zIndex: 0, pointerEvents: 'none'
                        }} />
                      )}

                      <div style={{
                        position: 'absolute', left: 0, right: 0, zIndex: 1,
                        height: `${1 + stringIndex * 0.5}px`,
                        background: 'linear-gradient(to bottom, #d5d5d5 0%, #8a8a8a 40%, #505050 100%)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        top: '50%', transform: 'translateY(-50%)'
                      }} />

                      {isActive && (
                        <div
                          style={{
                            width: 'clamp(12px, 2.5vw, 26px)', height: 'clamp(12px, 2.5vw, 26px)', borderRadius: '50%',
                            backgroundColor: bgColor, color: textColor,
                            fontSize: 'clamp(6px, 1vw, 11px)', fontWeight: 'bold',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            cursor: isCurrentlyEditing ? 'crosshair' : 'pointer',
                            transform: leftyMode ? 'scaleX(-1)' : 'none',
                            transition: 'transform 0.1s',
                            opacity: noteOpacity
                          }}
                          onMouseEnter={e => {
                            if (!isCurrentlyEditing) e.currentTarget.style.transform = leftyMode ? 'scaleX(-1) scale(1.15)' : 'scale(1.15)';
                          }}
                          onMouseLeave={e => {
                            if (!isCurrentlyEditing) e.currentTarget.style.transform = leftyMode ? 'scaleX(-1)' : 'none';
                          }}
                        >
                          {labelMode === 'notes' ? currentNote : intervalNameStr}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}