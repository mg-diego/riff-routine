import React from 'react';
import { CHROMATIC_NOTES, STANDARD_BASES, STANDARD_TUNING } from '@/lib/constants';
import styles from './MiniFretboard.module.css';

const FINGER_COLORS: Record<number, string> = {
  1: '#3b82f6',
  2: '#10b981',
  3: '#f59e0b',
  4: '#ef4444'
};

export interface MiniFretboardProps {
  positionData: any;
  rootNote: string;
  leftyMode?: boolean;
  chordDisplayMode?: 'notes' | 'fingers';
  playRealSound?: (notesToPlay: { note: string; octave: number; string: number }[], isChord: boolean) => void;
}

export function MiniFretboard({
  positionData,
  rootNote,
  leftyMode = false,
  chordDisplayMode = 'fingers',
  playRealSound
}: MiniFretboardProps) {
  const { activeNotesList, absoluteBarres } = positionData;

  const playedFrets = activeNotesList.filter((n: any) => n.fret > 0).map((n: any) => n.fret);
  const minFret = playedFrets.length > 0 ? Math.min(...playedFrets) : 1;
  const maxFret = playedFrets.length > 0 ? Math.max(...playedFrets) : 4;
  
  const startFret = minFret <= 2 ? 1 : minFret;
  const endFret = Math.max(startFret + 3, maxFret);
  const numFrets = endFret - startFret + 1;

  const fretCols = Array.from({ length: numFrets }, () => '1fr').join(' ');

  const handlePlayPos = () => {
    if (!playRealSound || !activeNotesList || activeNotesList.length === 0) return;
    const playableNotes = activeNotesList.filter((n: any) => n.fret >= 0);
    const mappedNotes = playableNotes.map((n: any) => {
      const stringRootIndex = CHROMATIC_NOTES.indexOf(STANDARD_TUNING[n.string]);
      const baseOctave = Math.floor(STANDARD_BASES[n.string] / 12) - 1;
      const noteName = CHROMATIC_NOTES[(stringRootIndex + n.fret) % 12];
      const octave = baseOctave + Math.floor((stringRootIndex + n.fret) / 12);
      return { note: noteName, octave, string: n.string, fret: n.fret };
    }).sort((a: any, b: any) => {
      const pitchA = STANDARD_BASES[a.string] + a.fret;
      const pitchB = STANDARD_BASES[b.string] + b.fret;
      return pitchA - pitchB;
    });
    playRealSound(mappedNotes, true);
  };

  return (
    <div 
      onClick={handlePlayPos}
      className={styles.box} style={{ cursor: playRealSound ? 'pointer' : 'default' }}
    >
      <div className={styles.grid} style={{ gridTemplateColumns: `minmax(20px, auto) ${fretCols}`, borderLeft: startFret === 1 ? '4px solid #d4af37' : '1px solid #8b5a2b', transform: leftyMode ? 'scaleX(-1)' : 'none' }}>
        <div></div>
        {Array.from({ length: numFrets }).map((_, i) => (
          <div key={`header-${i}`} className={styles.row} style={{ transform: leftyMode ? 'scaleX(-1)' : 'none' }}>
            {startFret + i}
          </div>
        ))}

        {STANDARD_TUNING.map((openNote, stringIndex) => {
          const stringRootIndex = CHROMATIC_NOTES.indexOf(openNote);

          let nutSymbol = null;
          let nutColor = 'inherit';
          const stringData = activeNotesList.find((n: any) => n.string === stringIndex);
          if (!stringData || stringData.fret === -1) {
            nutSymbol = '✕';
            nutColor = '#ef4444';
          } else if (stringData.fret === 0) {
            nutSymbol = '○';
            nutColor = '#10b981';
          }

          return (
            <React.Fragment key={`string-${stringIndex}`}>
              <div className={styles.openNoteRow} style={{ transform: leftyMode ? 'scaleX(-1)' : 'none' }}>
                <span>{openNote}</span>
                <span className={styles.label} style={{ color: nutColor }}>{nutSymbol}</span>
              </div>

              {Array.from({ length: numFrets }).map((_, i) => {
                const fret = startFret + i;
                const currentNote = CHROMATIC_NOTES[(stringRootIndex + fret) % 12];
                const activeNote = activeNotesList.find((n: any) => n.string === stringIndex && n.fret === fret);
                const isActive = !!activeNote;
                const currentFinger = activeNote?.finger || 0;

                let bgColor = '#c4b5fd';
                const textColor = '#fff';
                let displayText = currentNote;

                if (isActive) {
                  if (currentFinger > 0) {
                    bgColor = FINGER_COLORS[currentFinger] || bgColor;
                    if (chordDisplayMode === 'fingers') {
                      displayText = currentFinger.toString();
                    }
                  }
                }

                let isBarreTop = false;
                let isBarreBottom = false;
                let isBarreMiddle = false;

                if (absoluteBarres?.includes(fret)) {
                  const notesAtBarreFret = activeNotesList.filter((n: any) => n.fret === fret);
                  if (notesAtBarreFret.length > 0) {
                    const barreLowestPitchStr = Math.max(...notesAtBarreFret.map((n: any) => n.string));
                    const chordHighestPitchStr = Math.min(...activeNotesList.map((n: any) => n.string));
                    if (stringIndex >= chordHighestPitchStr && stringIndex <= barreLowestPitchStr) {
                      if (stringIndex === chordHighestPitchStr) isBarreTop = true;
                      if (stringIndex === barreLowestPitchStr) isBarreBottom = true;
                      if (stringIndex > chordHighestPitchStr && stringIndex < barreLowestPitchStr) isBarreMiddle = true;
                    }
                  }
                }

                return (
                  <div key={`cell-${stringIndex}-${fret}`} className={styles.displayTextRow}>
                    <div className={styles.layer} style={{ height: `${1 + stringIndex * 0.5}px` }} />
                    
                    {(isBarreTop || isBarreMiddle || isBarreBottom) && (
                      <div className={styles.displayTextRowLayer} style={{ top: isBarreTop ? '15%' : '0', bottom: isBarreBottom ? '15%' : '0', borderTopLeftRadius: isBarreTop ? '999px' : '0', borderTopRightRadius: isBarreTop ? '999px' : '0', borderBottomLeftRadius: isBarreBottom ? '999px' : '0', borderBottomRightRadius: isBarreBottom ? '999px' : '0' }} />
                    )}

                    {isActive && (
                      <div className={styles.row4} style={{ backgroundColor: bgColor, color: textColor, transform: leftyMode ? 'scaleX(-1)' : 'none' }}>
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
  );
}