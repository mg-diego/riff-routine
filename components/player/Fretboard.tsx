import React from 'react';
import { CHROMATIC_NOTES, INTERVAL_NAMES, MARKED_FRETS, STANDARD_BASES, STANDARD_TUNING } from '@/lib/constants';
import styles from './Fretboard.module.css';
import { cx } from '@/lib/cx';

const FINGER_COLORS: Record<number, string> = {
  1: '#3b82f6',
  2: '#10b981',
  3: '#f59e0b',
  4: '#ef4444'
};

export interface FretboardProps {
  activeNotesList?: { string: number; fret: number; finger?: number }[];
  title?: string;
  positionIndex?: number | string;
  rootNote: string;
  scaleData: any;
  scaleNotes?: string[];

  leftyMode?: boolean;
  labelMode?: 'notes' | 'intervals';
  showGhostNotes?: boolean;
  isChordMode?: boolean;
  chordDisplayMode?: 'notes' | 'fingers';
  absoluteBarres?: number[];
  getIntervalColor?: (interval: number) => string;
  t?: any;

  // Compare mode
  compareMode?: boolean;
  scaleNotesB?: string[];
  colorA?: string;
  colorB?: string;

  initAudio?: () => void;
  audioCtx?: AudioContext | null;
  playFreq?: (freq: number, startTime: number, duration: number, vol?: number) => void;
  playRealSound?: (notesToPlay: { note: string; octave: number; string: number }[], isChord: boolean) => void;
  getNoteFrequency?: (noteName: string, octave: number) => number;

  isEditingPos?: number | string | null;
  draftPosNotes?: { string: number; fret: number; finger?: number }[];
  setDraftPosNotes?: React.Dispatch<React.SetStateAction<any[]>>;
  setIsEditingPos?: (val: string | number | null) => void;
  handleExportCustomPosition?: () => void;
}

export function Fretboard({
  activeNotesList = [],
  title,
  positionIndex,
  rootNote,
  scaleData,
  isEditingPos,
  draftPosNotes = [],
  setDraftPosNotes,
  setIsEditingPos,
  handleExportCustomPosition,
  initAudio,
  audioCtx,
  playFreq,
  playRealSound,
  getNoteFrequency,
  leftyMode = false,
  labelMode = 'notes',
  scaleNotes = [],
  getIntervalColor,
  showGhostNotes = false,
  isChordMode = false,
  chordDisplayMode = 'notes',
  absoluteBarres = [],
  compareMode = false,
  scaleNotesB = [],
  colorA = '#3b82f6',
  colorB = '#f43f5e',
  t = (key: string) => key
}: FretboardProps) {

  const rootIndexGlobal = CHROMATIC_NOTES.indexOf(rootNote);
  const aliases = scaleData?.intervalAliases || {};
  const isCurrentlyEditing = isEditingPos === positionIndex && positionIndex !== undefined && positionIndex !== null;
  const isDevMode = process.env.NODE_ENV === 'development';
  const displayedNotes = isCurrentlyEditing ? draftPosNotes : activeNotesList;

  const handlePlayPos = () => {
    if (!displayedNotes || displayedNotes.length === 0) return;
    const playableNotes = displayedNotes.filter(n => n.fret >= 0);

    if (playRealSound) {
      const mappedNotes = playableNotes.map(n => {
        const stringRootIndex = CHROMATIC_NOTES.indexOf(STANDARD_TUNING[n.string]);
        const baseOctave = Math.floor(STANDARD_BASES[n.string] / 12) - 1;
        const noteName = CHROMATIC_NOTES[(stringRootIndex + n.fret) % 12];
        const octave = baseOctave + Math.floor((stringRootIndex + n.fret) / 12);
        return { note: noteName, octave, string: n.string, fret: n.fret };
      }).sort((a, b) => (STANDARD_BASES[a.string] + a.fret) - (STANDARD_BASES[b.string] + b.fret));

      playRealSound(mappedNotes, isChordMode);
      return;
    }

    if (!initAudio || !playFreq || !audioCtx) return;
    initAudio();

    const sortedNotes = [...playableNotes].sort((a: any, b: any) =>
      (STANDARD_BASES[a.string] + a.fret) - (STANDARD_BASES[b.string] + b.fret)
    );

    const currentTime = audioCtx.currentTime;
    const strumDelay = isChordMode ? 0.04 : 0.3;

    sortedNotes.forEach((n: any, i: number) => {
      const pitch = STANDARD_BASES[n.string] + n.fret;
      const freq = 440 * Math.pow(2, (pitch - 69) / 12);
      playFreq(freq, currentTime + i * strumDelay, 0.8, 0.2);
    });
  };

  const handleCellClick = (stringIndex: number, fret: number, currentNote: string, currentOctave: number) => {
    if (isCurrentlyEditing && setDraftPosNotes) {
      setDraftPosNotes((prev: any) => {
        const exists = prev.find((n: any) => n.string === stringIndex && n.fret === fret);
        if (exists) return prev.filter((n: any) => !(n.string === stringIndex && n.fret === fret));
        return [...prev, { string: stringIndex, fret }];
      });
    } else {
      if (playRealSound) {
        playRealSound([{ note: currentNote, octave: currentOctave, string: stringIndex }], false);
        return;
      }
      if (initAudio && getNoteFrequency && playFreq && audioCtx) {
        initAudio();
        const freq = getNoteFrequency(currentNote, currentOctave);
        playFreq(freq, audioCtx.currentTime, 0.8, 0.2);
      }
    }
  };

  const fretCols = Array.from({ length: 24 }, (_, i) => {
    const minWidth = 6;
    const maxWidth = 10;
    const width = maxWidth - (i * ((maxWidth - minWidth) / 23));
    return `${width}fr`;
  }).join(' ');

  const showHeader = title || (displayedNotes && displayedNotes.length > 0 && !isCurrentlyEditing && (playRealSound || initAudio));

  return (
    <div className={styles.block}>
      {showHeader ? (
        <div className={styles.row} style={{ justifyContent: title ? 'space-between' : 'flex-end' }}>
          {title && (
            <div className={styles.row2}>
              <h3 className={styles.subheading}>{title}</h3>
              {isDevMode && positionIndex !== undefined && setIsEditingPos && setDraftPosNotes && (
                isCurrentlyEditing ? (
                  <div className={styles.row3}>
                    <button onClick={() => setDraftPosNotes([])} className={styles.button}>
                      Limpiar
                    </button>
                    <button onClick={handleExportCustomPosition} className={styles.button2}>
                      Exportar a TS
                    </button>
                    <button onClick={() => setIsEditingPos(null)} className={styles.button3}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button onClick={() => {
                    setIsEditingPos(positionIndex);
                    setDraftPosNotes(activeNotesList ? [...activeNotesList] : []);
                  }} className={styles.button4}>
                    ✎ Editar Posición
                  </button>
                )
              )}
            </div>
          )}

          {displayedNotes && displayedNotes.length > 0 && !isCurrentlyEditing && (playRealSound || initAudio) && (
            <button
              onClick={handlePlayPos}
              className={styles.button5}
            >
              <span>▶</span> {isChordMode ? 'Escuchar Acorde' : 'Tocar Escala'}
            </button>
          )}
        </div>
      ) : null}

      <div className={styles.openNoteBlock}>
        <div className={styles.grid} style={{ gridTemplateColumns: `minmax(40px, 6%) ${fretCols}`, border: isCurrentlyEditing ? '2px dashed #34d399' : '2px solid #8b5a2b', transform: leftyMode ? 'scaleX(-1)' : 'none' }}>
          <div></div>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={`header-${i}`} className={styles.openNoteBlockRow} style={{ transform: leftyMode ? 'scaleX(-1)' : 'none' }}>
              {i + 1}
            </div>
          ))}

          {STANDARD_TUNING.map((openNote, stringIndex) => {
            const stringRootIndex = CHROMATIC_NOTES.indexOf(openNote);
            const baseOctave = Math.floor(STANDARD_BASES[stringIndex] / 12) - 1;

            let nutSymbol = null;
            let nutColor = 'inherit';

            if (isChordMode) {
              const stringData = (displayedNotes || []).find((n: any) => n.string === stringIndex);
              if (!stringData || stringData.fret === -1) { nutSymbol = '✕'; nutColor = '#ef4444'; }
              else if (stringData.fret === 0) { nutSymbol = '○'; nutColor = '#10b981'; }
            }

            return (
              <React.Fragment key={`string-${stringIndex}`}>
                <div className={styles.openNoteRow} style={{ transform: leftyMode ? 'scaleX(-1)' : 'none' }}>
                  <span>{openNote}</span>
                  <span className={styles.label} style={{ color: nutColor, fontSize: nutSymbol === '✕' ? '1.4em' : '2.5em' }}>{nutSymbol}</span>
                </div>

                {Array.from({ length: 24 }).map((_, fretIndex) => {
                  const fret = fretIndex + 1;
                  const currentNote = CHROMATIC_NOTES[(stringRootIndex + fret) % 12];
                  const currentNoteIndex = CHROMATIC_NOTES.indexOf(currentNote);
                  const interval = (currentNoteIndex - rootIndexGlobal + 12) % 12;
                  const intervalNameStr = aliases[interval] || INTERVAL_NAMES[interval];
                  const currentOctave = baseOctave + Math.floor((stringRootIndex + fret) / 12);

                  const isNoteInScale = scaleNotes?.includes(currentNote);
                  let isInActiveList = false;
                  let currentFinger = 0;

                  if (isCurrentlyEditing || activeNotesList) {
                    const activeNote = (displayedNotes || []).find((n: any) => n.string === stringIndex && n.fret === fret);
                    if (activeNote) { isInActiveList = true; currentFinger = activeNote.finger || 0; }
                  }

                  // ─── Visibility & opacity logic ───────────────────────────────
                  let isActive = false;
                  let noteOpacity = 1;
                  let isCompareShared = false;
                  let isCompareOnlyA = false;
                  let isCompareOnlyB = false;

                  if (isCurrentlyEditing) {
                    isActive = isInActiveList;
                    noteOpacity = isNoteInScale ? 1 : 0.4;
                  } else if (compareMode) {
                    const inA = scaleNotes?.includes(currentNote) ?? false;
                    const inB = scaleNotesB?.includes(currentNote) ?? false;
                    isActive = inA || inB;
                    if (inA && inB) { isCompareShared = true; noteOpacity = 0.3; }
                    else if (inA) { isCompareOnlyA = true; }
                    else if (inB) { isCompareOnlyB = true; }
                  } else if (activeNotesList && activeNotesList.length > 0) {
                    if (showGhostNotes && !isChordMode) {
                      isActive = isNoteInScale;
                      noteOpacity = isInActiveList ? 1 : 0.15;
                    } else {
                      isActive = isInActiveList;
                      noteOpacity = 1;
                    }
                  } else {
                    isActive = isNoteInScale;
                    noteOpacity = 1;
                  }

                  // ─── Color logic ──────────────────────────────────────────────
                  let bgColor = getIntervalColor ? getIntervalColor(interval) : '#c4b5fd';
                  let textColor = (bgColor === '#f1c40f' || bgColor === '#2ecc71') ? '#000' : '#fff';
                  // In compare mode, interval colors are overridden by A/B colors
                  if (compareMode && isActive) {
                    if (isCompareOnlyA) { bgColor = colorA; textColor = '#fff'; }
                    else if (isCompareOnlyB) { bgColor = colorB; textColor = '#fff'; }
                    // isCompareShared handled via gradient below
                  }

                  let displayText = labelMode === 'notes' ? currentNote : intervalNameStr;
                  // In compare mode always show note names for clarity
                  if (compareMode) displayText = currentNote;

                  if (isChordMode && isInActiveList) {
                    if (currentFinger > 0) {
                      bgColor = FINGER_COLORS[currentFinger] || bgColor;
                      textColor = '#fff';
                      displayText = chordDisplayMode === 'fingers' ? currentFinger.toString() : currentNote;
                    } else {
                      displayText = currentNote;
                    }
                  }

                  // ─── Barre logic ──────────────────────────────────────────────
                  let isBarreTop = false, isBarreBottom = false, isBarreMiddle = false;

                  if (isChordMode && absoluteBarres?.includes(fret)) {
                    const allNotesInChord = displayedNotes || [];
                    const notesAtBarreFret = allNotesInChord.filter((n: any) => n.fret === fret);
                    if (notesAtBarreFret.length > 0) {
                      const maxStr = Math.max(...notesAtBarreFret.map((n: any) => n.string));
                      const minStr = Math.min(...allNotesInChord.map((n: any) => n.string));
                      if (stringIndex >= minStr && stringIndex <= maxStr) {
                        if (stringIndex === minStr) isBarreTop = true;
                        if (stringIndex === maxStr) isBarreBottom = true;
                        if (stringIndex > minStr && stringIndex < maxStr) isBarreMiddle = true;
                      }
                    }
                  }

                  // ─── Dot markers ──────────────────────────────────────────────
                  const isSingleDotFret = [3, 5, 7, 9, 15, 17, 19, 21].includes(fret);
                  const isDoubleDotFret = fret === 12 || fret === 24;
                  const hasSingleDot = isSingleDotFret && stringIndex === 2;
                  const hasDoubleDot = isDoubleDotFret && (stringIndex === 1 || stringIndex === 3);
                  const isMarked = MARKED_FRETS.includes(fret);

                  // ─── Dot background: gradient for shared notes ────────────────
                  const dotBackground = isCompareShared
                    ? `linear-gradient(90deg, ${colorA} 50%, ${colorB} 50%)`
                    : bgColor;

                  return (
                    <div key={`cell-${stringIndex}-${fret}`}
                      onClick={() => handleCellClick(stringIndex, fret, currentNote, currentOctave)}
                      className={styles.displayTextRow} style={{ backgroundColor: isMarked ? 'rgba(255, 255, 255, 0.03)' : 'transparent', cursor: isCurrentlyEditing || initAudio || playRealSound ? 'pointer' : 'default' }}>

                      {(hasSingleDot || hasDoubleDot) && (
                        <div className={styles.layer} />
                      )}

                      <div className={styles.displayTextRowLayer} style={{ height: `${1 + stringIndex * 0.5}px` }} />

                      {(isBarreTop || isBarreMiddle || isBarreBottom) && (
                        <div className={styles.layer3} style={{ top: isBarreTop ? '15%' : '0', bottom: isBarreBottom ? '15%' : '0', borderTopLeftRadius: isBarreTop ? '999px' : '0', borderTopRightRadius: isBarreTop ? '999px' : '0', borderBottomLeftRadius: isBarreBottom ? '999px' : '0', borderBottomRightRadius: isBarreBottom ? '999px' : '0' }} />
                      )}

                      {isActive && (
                        <div
                          className={cx(styles.row7, leftyMode && styles.lefty, !isCurrentlyEditing && (initAudio || playRealSound) && styles.playable)}
                          style={{ background: dotBackground, color: isCompareShared ? '#fff' : textColor, boxShadow: isCompareShared
                              ? `0 2px 6px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.15)`
                              : '0 2px 4px rgba(0,0,0,0.5)', opacity: noteOpacity, textShadow: isCompareShared ? '0 1px 2px rgba(0,0,0,0.8)' : 'none' }}
                        >
                          {displayText}
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