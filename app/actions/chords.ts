"use server";

import guitarDb from '@tombatossals/chords-db/lib/guitar.json';

export async function getChordOptions() {
  return {
    keys: guitarDb.keys,
    suffixes: guitarDb.suffixes,
  };
}

export async function getChordData(rootNote: string, suffix: string) {
  const chordGroup = (guitarDb.chords as Record<string, any>)[rootNote];
  
  if (!chordGroup) {
    return null;
  }
  
  const chord = chordGroup.find((c: any) => c.suffix === suffix);
  return chord || null;
}