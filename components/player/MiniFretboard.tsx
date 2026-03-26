import React from 'react';
import { CHROMATIC_NOTES, STANDARD_BASES, STANDARD_TUNING } from '@/lib/constants';

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
      style={{ 
        width: '100%', 
        background: 'rgba(0,0,0,0.2)', 
        border: '1px solid rgba(255,255,255,0.05)', 
        borderRadius: '8px', 
        padding: '1rem',
        cursor: playRealSound ? 'pointer' : 'default',
        transition: 'all 0.2s'
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
    >
      <div style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: `minmax(20px, auto) ${fretCols}`,
        background: '#2a1a0a',
        border: '1px solid #8b5a2b',
        borderLeft: startFret === 1 ? '4px solid #d4af37' : '1px solid #8b5a2b',
        borderRadius: '4px',
        padding: '0.5rem 0',
        transform: leftyMode ? 'scaleX(-1)' : 'none',
        width: '100%'
      }}>
        <div></div>
        {Array.from({ length: numFrets }).map((_, i) => (
          <div key={`header-${i}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '4px', color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 'bold', transform: leftyMode ? 'scaleX(-1)' : 'none' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', color: '#fff', fontWeight: 'bold', fontSize: '0.75rem', paddingRight: '6px', transform: leftyMode ? 'scaleX(-1)' : 'none' }}>
                <span>{openNote}</span>
                <span style={{ color: nutColor, fontSize: '1.2em', width: '12px', textAlign: 'center', lineHeight: 1 }}>{nutSymbol}</span>
              </div>

              {Array.from({ length: numFrets }).map((_, i) => {
                const fret = startFret + i;
                const currentNote = CHROMATIC_NOTES[(stringRootIndex + fret) % 12];
                const activeNote = activeNotesList.find((n: any) => n.string === stringIndex && n.fret === fret);
                const isActive = !!activeNote;
                const currentFinger = activeNote?.finger || 0;

                let bgColor = '#c4b5fd';
                let textColor = '#fff';
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
                  <div key={`cell-${stringIndex}-${fret}`} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid silver', height: '24px' }}>
                    <div style={{ position: 'absolute', left: 0, right: 0, zIndex: 1, height: `${1 + stringIndex * 0.5}px`, background: 'linear-gradient(to bottom, #d5d5d5 0%, #8a8a8a 40%, #505050 100%)', top: '50%', transform: 'translateY(-50%)' }} />
                    
                    {(isBarreTop || isBarreMiddle || isBarreBottom) && (
                      <div style={{
                        position: 'absolute',
                        top: isBarreTop ? '15%' : '0',
                        bottom: isBarreBottom ? '15%' : '0',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '14px',
                        backgroundColor: 'rgba(196, 181, 253, 0.4)',
                        borderTopLeftRadius: isBarreTop ? '999px' : '0',
                        borderTopRightRadius: isBarreTop ? '999px' : '0',
                        borderBottomLeftRadius: isBarreBottom ? '999px' : '0',
                        borderBottomRightRadius: isBarreBottom ? '999px' : '0',
                        zIndex: 2,
                        pointerEvents: 'none'
                      }} />
                    )}

                    {isActive && (
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%',
                        backgroundColor: bgColor, color: textColor,
                        fontSize: '0.65rem', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 3, boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        transform: leftyMode ? 'scaleX(-1)' : 'none'
                      }}>
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