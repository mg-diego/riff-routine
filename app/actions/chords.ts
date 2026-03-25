"use server";

import { promises as fs } from 'fs';
import path from 'path';

type ChordDb = Record<string, any[]>;

let cachedChords: ChordDb | null = null;
let cachedOptions: Record<string, string[]> | null = null;

const ROOTS = ["C#", "Db", "D#", "Eb", "F#", "Gb", "G#", "Ab", "A#", "Bb", "C", "D", "E", "F", "G", "A", "B"];

async function loadDb(): Promise<ChordDb> {
  if (!cachedChords) {
    const filePath = path.join(process.cwd(), 'data', 'chords.json');
    const fileContent = await fs.readFile(filePath, 'utf8');
    cachedChords = JSON.parse(fileContent) as ChordDb;
  }
  return cachedChords;
}

export async function getChordOptions() {
  if (cachedOptions) return cachedOptions;

  const db = await loadDb();
  const rawKeys = Object.keys(db);
  
  const optionsMap: Record<string, string[]> = {};

  rawKeys.forEach(key => {
    const root = ROOTS.find(r => key.startsWith(r));
    if (root) {
      if (!optionsMap[root]) optionsMap[root] = [];
      const suffix = key.slice(root.length) || "major";
      optionsMap[root].push(suffix);
    }
  });

  const sortedMap: Record<string, string[]> = {};
  ROOTS.forEach(r => {
    if (optionsMap[r]) {
      sortedMap[r] = optionsMap[r].sort();
    }
  });

  cachedOptions = sortedMap;
  return cachedOptions;
}

export async function getChordData(rootNote: string, suffix: string) {
  const db = await loadDb();
  const queryKey = suffix === "major" ? rootNote : `${rootNote}${suffix}`;
  const chordPositions = db[queryKey];
  
  if (!chordPositions) return null;
  
  return {
    positions: chordPositions
  };
}