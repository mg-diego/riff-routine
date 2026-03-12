import { useMemo } from 'react';
import { CHROMATIC_NOTES, SCALES, STANDARD_BASES, STANDARD_TUNING } from '@/lib/constants';

export function useScaleLogic(rootNote: string, scaleKey: string, viewMode: string, t: any) {
  const scaleData = SCALES[scaleKey];

  const scaleNotes = useMemo(() => {
    const rootIndex = CHROMATIC_NOTES.indexOf(rootNote);
    return scaleData.intervals.map((interval: number) => CHROMATIC_NOTES[(rootIndex + interval) % 12]);
  }, [rootNote, scaleKey, scaleData]);

  const positionsData = useMemo(() => {
    if (viewMode === 'full') return null;

    const N = scaleNotes.length;
    let baseLowest = STANDARD_BASES[5];
    let stringBasesInternal = STANDARD_BASES.map(b => b - baseLowest);
    let eRootIndex = CHROMATIC_NOTES.indexOf(STANDARD_TUNING[5]);

    let positions: { activeNotes: any[], startFret: number, title: string, id: string }[] = [];

    if (N <= 4) {
      let scalePitches: number[] = [];
      for (let pitch = 0; pitch <= 60; pitch++) {
        let noteName = CHROMATIC_NOTES[(eRootIndex + pitch) % 12];
        if (scaleNotes.includes(noteName)) scalePitches.push(pitch);
      }

      for (let p = 0; p < N; p++) {
        let activeNotes = [];
        let startNote = scaleNotes[p];
        let baseFret = (CHROMATIC_NOTES.indexOf(startNote) - eRootIndex + 12) % 12;
        if (baseFret === 0) baseFret += 12;

        let startPitch = baseFret;
        let startIndex = scalePitches.indexOf(startPitch);
        if (startIndex === -1) startIndex = scalePitches.indexOf(startPitch + 12);

        let currentIndex = startIndex;
        let currentString = 5;
        let currentFret = scalePitches[currentIndex] - stringBasesInternal[5];
        let notesOnString = 0;

        while (currentIndex < scalePitches.length && currentString >= 0) {
          let pitch = scalePitches[currentIndex];
          let fretSame = pitch - stringBasesInternal[currentString];
          let fretNext = currentString > 0 ? pitch - stringBasesInternal[currentString - 1] : -1;
          let placeOnSame = false;

          if (notesOnString === 0) {
            placeOnSame = true;
          } else if (notesOnString < 2 && fretSame <= currentFret + 5) {
            let costSame = (fretSame - currentFret) * 1;
            let costNext = Infinity;
            if (fretNext >= 0) {
              if (fretNext < currentFret) costNext = (currentFret - fretNext) * 3 + 2;
              else costNext = (fretNext - currentFret) * 1 + 2;
            }
            if (costSame <= costNext) placeOnSame = true;
          }

          if (placeOnSame && fretSame >= 0 && fretSame <= 24) {
            activeNotes.push({ string: currentString, fret: fretSame, note: CHROMATIC_NOTES[(eRootIndex + pitch) % 12] });
            currentFret = fretSame;
            notesOnString++;
            currentIndex++;
          } else {
            currentString--;
            notesOnString = 0;
          }
        }

        let string6Note = activeNotes.find(n => n.string === 5);
        let startFret = string6Note ? string6Note.fret : 0;
        positions.push({ activeNotes, startFret, title: t('positionTitle', { pos: String(p + 1) }), id: String(p + 1) });
      }
    } else {
      const nps = N <= 5 ? 2 : 3;
      for (let p = 0; p < N; p++) {
        let activeNotes: { string: number, fret: number, note: string }[] = [];
        let startNote = scaleNotes[p];
        let baseFret = (CHROMATIC_NOTES.indexOf(startNote) - eRootIndex + 12) % 12;
        let currentPitch = baseFret;

        for (let s = 5; s >= 0; s--) {
          let found = 0;
          while (found < nps) {
            let noteName = CHROMATIC_NOTES[(eRootIndex + currentPitch) % 12];
            if (scaleNotes.includes(noteName)) {
              let fret = currentPitch - stringBasesInternal[s];
              if (fret < 0) { fret += 12; currentPitch += 12; }
              activeNotes.push({ string: s, fret: fret, note: noteName });
              found++;
            }
            currentPitch++;
          }
        }

        let string6Note = activeNotes.find(n => n.string === 5);
        let startFret = string6Note ? string6Note.fret : 0;

        if (startFret === 0) {
          activeNotes = activeNotes.map(n => ({ ...n, fret: n.fret + 12 }));
          startFret += 12;
        }

        positions.push({ activeNotes, startFret, title: t('positionFretTitle', { pos: String(p + 1), fret: startFret }), id: String(p + 1) });
      }
    }

    positions = positions.map((pos) => {
      const customPosData = scaleData.customPositions?.[pos.id];

      if (customPosData && customPosData.rootStr !== undefined) {
        const rootStr = customPosData.rootStr;
        const stringRootIndex = CHROMATIC_NOTES.indexOf(STANDARD_TUNING[rootStr]);

        let anchorFret = (CHROMATIC_NOTES.indexOf(rootNote) - stringRootIndex + 12) % 12;

        const minOffset = Math.min(...customPosData.notes.map((n: any) => n.o));
        if (anchorFret + minOffset < 0) {
          anchorFret += 12;
        }

        const customActiveNotes = customPosData.notes.map((n: any) => {
          const fret = anchorFret + n.o;
          const noteName = CHROMATIC_NOTES[(CHROMATIC_NOTES.indexOf(STANDARD_TUNING[n.s]) + fret) % 12];
          return { string: n.s, fret, note: noteName };
        }).filter((n: any) => n.fret >= 0 && n.fret <= 24);

        const fallbackStartFret = customActiveNotes.length > 0 ? Math.min(...customActiveNotes.map((n: { string: number; fret: number; note: string }) => n.fret)) : 0;
        return { ...pos, activeNotes: customActiveNotes, startFret: fallbackStartFret };
      }
      return pos;
    });

    positions = positions.filter(pos => {
      if (scaleData.customPositions?.[pos.id]) return true;

      if (scaleData.customPositions) {
        const hasVariants = Object.keys(scaleData.customPositions).some(key => {
          const regex = new RegExp(`^${pos.id}[a-zA-Z]+$`);
          return regex.test(key);
        });

        if (hasVariants) return false;
      }
      return true;
    });

    if (scaleData.customPositions) {
      Object.keys(scaleData.customPositions).forEach(key => {
        if (!positions.some(p => p.id === key)) {
          const customPosData = scaleData.customPositions[key];
          if (customPosData && customPosData.rootStr !== undefined) {
            const rootStr = customPosData.rootStr;
            const stringRootIndex = CHROMATIC_NOTES.indexOf(STANDARD_TUNING[rootStr]);

            let anchorFret = (CHROMATIC_NOTES.indexOf(rootNote) - stringRootIndex + 12) % 12;

            const minOffset = Math.min(...customPosData.notes.map((n: any) => n.o));
            if (anchorFret + minOffset < 0) anchorFret += 12;

            const customActiveNotes = customPosData.notes.map((n: any) => {
              const fret = anchorFret + n.o;
              const noteName = CHROMATIC_NOTES[(CHROMATIC_NOTES.indexOf(STANDARD_TUNING[n.s]) + fret) % 12];
              return { string: n.s, fret, note: noteName };
            }).filter((n: any) => n.fret >= 0 && n.fret <= 24);

            const fallbackStartFret = customActiveNotes.length > 0 ? Math.min(...customActiveNotes.map((n: { string: number; fret: number; note: string }) => n.fret)) : 0;

            positions.push({
              activeNotes: customActiveNotes,
              startFret: fallbackStartFret,
              title: t('positionTitle', { pos: key }),
              id: key
            });
          }
        }
      });
    }

    let extendedPositions: { activeNotes: any[]; startFret: number; title: string; id: string }[] = [];

    positions.forEach(pos => {
      extendedPositions.push(pos);

      let newStartFret12 = pos.startFret + 12;
      if (newStartFret12 <= 24) {
        let newActiveNotes = pos.activeNotes
          .map((n: { string: number; fret: number; note: string }) => ({ ...n, fret: n.fret + 12 }))
          .filter((n: { string: number; fret: number; note: string }) => n.fret <= 24);

        if (newActiveNotes.length > 0) {
          extendedPositions.push({
            activeNotes: newActiveNotes,
            startFret: newStartFret12,
            title: t('positionFretTitle', { pos: pos.id, fret: newStartFret12 }),
            id: pos.id
          });
        }
      }

      let newStartFret24 = pos.startFret + 24;
      if (newStartFret24 <= 24) {
        let newActiveNotes = pos.activeNotes
          .map((n: { string: number; fret: number; note: string }) => ({ ...n, fret: n.fret + 24 }))
          .filter((n: { string: number; fret: number; note: string }) => n.fret <= 24);

        if (newActiveNotes.length > 0) {
          extendedPositions.push({
            activeNotes: newActiveNotes,
            startFret: newStartFret24,
            title: t('positionFretTitle', { pos: pos.id, fret: newStartFret24 }),
            id: pos.id
          });
        }
      }
    });

    return extendedPositions.sort((a, b) => a.startFret - b.startFret);
  }, [viewMode, scaleNotes, t, scaleKey, rootNote, scaleData]);

  return { scaleData, scaleNotes, positionsData };
}