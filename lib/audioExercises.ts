export const EAR_TRAINING_LEVELS = [
  {
    id: 1,
    name: "Iniciación",
    types: ["major", "m"],
    description: "Distingue entre la sonoridad alegre (Mayor) y triste (Menor)."
  },
  {
    id: 2,
    name: "Intermedio",
    types: ["major", "m", "sus2", "sus4", "5"],
    description: "Añade la tensión de los suspendidos y la fuerza de las quintas."
  },
  {
    id: 3,
    name: "Avanzado",
    types: ["major", "m", "7", "m7", "maj7", "sus2", "sus4"],
    description: "Identifica las séptimas clásicas del Blues, Jazz y Pop."
  },
  {
    id: 4,
    name: "Experto",
    types: ["major", "m", "7", "m7", "maj7", "dim", "aug", "m7b5"],
    description: "Disonancias complejas y estructuras alteradas."
  }
];

export const CHORD_LABELS: Record<string, string> = {
  "major": "Major",
  "m": "Minor",
  "7": "7th",
  "m7": "Minor 7th",
  "maj7": "Major 7th",
  "sus2": "Sus 2",
  "sus4": "Sus 4",
  "5": "Power Chord (5)",
  "dim": "Diminished",
  "aug": "Augmented",
  "m7b5": "m7b5 (Half-dim)"
};