export const TECHNIQUES = [
    'Alternate Picking', 'Down Picking', 'Legato', 'Tapping',
    'Sweep Picking', 'Rhythm', 'Song', 'Solo', 'Hybrid Picking',
    'String Skipping', 'Warm-up', 'Lick', 'Bending', 'Vibrato'
];

export const DIFFICULTY_COLORS: { [key: number]: string } = {
    1: '#4ade80', 2: '#a3e635', 3: '#facc15', 4: '#fb923c', 5: '#f87171'
};

export const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const STANDARD_TUNING = ['E', 'B', 'G', 'D', 'A', 'E'];
export const MARKED_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

export const INTERVAL_NAMES: Record<number, string> = { 0: '1', 1: '♭2', 2: '2', 3: '♭3', 4: '3', 5: '4', 6: '♭5', 7: '5', 8: '♭6', 9: '6', 10: '♭7', 11: '7' };
export const STANDARD_BASES = [64, 59, 55, 50, 45, 40];

export const PREDEFINED_COLORS: Record<string, string> = {
    '#7f8c8d': 'Gris', '#e74c3c': 'Rojo', '#3498db': 'Azul', '#2ecc71': 'Verde',
    '#f1c40f': 'Amarillo', '#9b59b6': 'Morado', '#e67e22': 'Naranja', '#e84393': 'Rosa'
};
export const DEFAULT_INTERVAL_COLORS: Record<number, string> = { 0: '#e74c3c', 3: '#3498db', 4: '#3498db', 7: '#f1c40f' };

export const CHORD_INTERVALS: Record<string, number[]> = {
    'Maj': [0, 4, 7], 'm': [0, 3, 7], 'dim': [0, 3, 6], 'aug': [0, 4, 8], '5': [0, 7],
    'Maj7': [0, 4, 7, 11], 'm7': [0, 3, 7, 10], '7': [0, 4, 7, 10], 'm7♭5': [0, 3, 6, 10],
    'dim7': [0, 3, 6, 9], 'mMaj7': [0, 3, 7, 11], 'Maj7#5': [0, 4, 8, 11], '7#5': [0, 4, 8, 10],
    '7♭5': [0, 4, 6, 10], 'mMaj7♭5': [0, 3, 6, 11], 'mMaj7#5': [0, 3, 8, 11], 'Maj7♭5': [0, 4, 6, 11],
    'Maj7#3': [0, 5, 7, 11]
};

export const SCALES: Record<string, any> = {
    'ionian': {
        intervals: [0, 2, 4, 5, 7, 9, 11],
        triads: ['Maj', 'm', 'm', 'Maj', 'Maj', 'm', 'dim'],
        tetrads: ['Maj7', 'm7', 'm7', 'Maj7', '7', 'm7', 'm7♭5'],
        target: '3, 7',
        chords: 'Maj, Maj7'
    },
    'dorian': {
        intervals: [0, 2, 3, 5, 7, 9, 10],
        triads: ['m', 'm', 'Maj', 'Maj', 'm', 'dim', 'Maj'],
        tetrads: ['m7', 'm7', 'Maj7', '7', 'm7', 'm7♭5', 'Maj7'],
        target: '♭3, 6',
        chords: 'm, m7'
    },
    'phrygian': {
        intervals: [0, 1, 3, 5, 7, 8, 10],
        triads: ['m', 'Maj', 'Maj', 'm', 'dim', 'Maj', 'm'],
        tetrads: ['m7', 'Maj7', '7', 'm7', 'm7♭5', 'Maj7', 'm7'],
        target: '♭2, ♭3',
        chords: 'm, m7'
    },
    'lydian': {
        intervals: [0, 2, 4, 6, 7, 9, 11],
        intervalAliases: { 6: '#4' },
        triads: ['Maj', 'Maj', 'm', 'dim', 'Maj', 'm', 'm'],
        tetrads: ['Maj7', '7', 'm7', 'm7♭5', 'Maj7', 'm7', 'm7'],
        target: '#4, 7',
        chords: 'Maj, Maj7, Maj7#11'
    },
    'mixolydian': {
        intervals: [0, 2, 4, 5, 7, 9, 10],
        triads: ['Maj', 'm', 'dim', 'Maj', 'm', 'm', 'Maj'],
        tetrads: ['7', 'm7', 'm7♭5', 'Maj7', 'm7', 'm7', 'Maj7'],
        target: '3, ♭7',
        chords: '7, 9, 13 (Dominantes)'
    },
    'aeolian': {
        intervals: [0, 2, 3, 5, 7, 8, 10],
        triads: ['m', 'dim', 'Maj', 'm', 'm', 'Maj', 'Maj'],
        tetrads: ['m7', 'm7♭5', 'Maj7', 'm7', 'm7', 'Maj7', '7'],
        target: '♭3, ♭6',
        chords: 'm, m7'
    },
    'locrian': {
        intervals: [0, 1, 3, 5, 6, 8, 10],
        triads: ['dim', 'Maj', 'm', 'm', 'Maj', 'Maj', 'm'],
        tetrads: ['m7♭5', 'Maj7', 'm7', 'm7', 'Maj7', '7', 'm7'],
        target: '♭2, ♭5',
        chords: 'dim, m7♭5'
    },
    'blues': {
        intervals: [0, 3, 5, 6, 7, 10],
        triads: ['m', 'Maj', 'm', 'dim', 'm', 'Maj'],
        tetrads: ['m7', 'Maj7', 'm7', 'dim7', 'm7', '7'],
        target: '♭3, ♭5, ♭7',
        chords: 'Dominantes (7), m7'
    },
    'pentatonic-minor': {
        intervals: [0, 3, 5, 7, 10],
        triads: ['m', 'Maj', 'm', 'm', 'Maj'],
        tetrads: ['m7', 'Maj7', 'm7', 'm7', '7'],
        target: '1, ♭3, 5',
        chords: 'm, m7, acordes 7'
    },
    'pentatonic-major': {
        intervals: [0, 2, 4, 7, 9],
        triads: ['Maj', 'm', 'm', '5', 'm'],
        tetrads: ['Maj7', 'm7', 'm7', '7', 'm7'],
        target: '1, 3, 5',
        chords: 'Maj, Maj7'
    },
    'harmonic-minor': {
        intervals: [0, 2, 3, 5, 7, 8, 11],
        triads: ['m', 'dim', 'aug', 'm', 'Maj', 'Maj', 'dim'],
        tetrads: ['mMaj7', 'm7♭5', 'Maj7#5', 'm7', '7', 'Maj7', 'dim7'],
        target: '♭6, 7',
        chords: 'm, mMaj7, 7 (V grado)'
    },
    'harmonic-major': {
        intervals: [0, 2, 4, 5, 7, 8, 11],
        triads: ['Maj', 'dim', 'm', 'm', 'Maj', 'aug', 'dim'],
        tetrads: ['Maj7', 'm7♭5', 'm7', 'mMaj7', '7', 'Maj7#5', 'dim7'],
        target: '3, ♭6',
        chords: 'Maj, Maj7'
    },
    'melodic-minor': {
        intervals: [0, 2, 3, 5, 7, 9, 11],
        triads: ['m', 'm', 'aug', 'Maj', 'Maj', 'dim', 'dim'],
        tetrads: ['mMaj7', 'm7', 'Maj7#5', '7', '7', 'm7♭5', 'm7♭5'],
        target: '6, 7',
        chords: 'mMaj7, m6'
    },
    'double-harmonic': {
        intervals: [0, 1, 4, 5, 7, 8, 11],
        triads: ['Maj', 'Maj', 'm', 'm', 'dim', 'aug', 'm'],
        tetrads: ['Maj7', 'Maj7', 'm7', 'mMaj7', '7♭5', 'Maj7#5', 'm7'],
        target: '♭2, 7',
        chords: 'Maj, Maj7'
    },
    'hungarian': {
        intervals: [0, 2, 3, 6, 7, 8, 11],
        intervalAliases: { 6: '#4' },
        triads: ['m', 'dim', 'm', 'm', 'm', 'aug', 'Maj'],
        tetrads: ['7', 'dim7', 'mMaj7♭5', 'm7♭5', 'mMaj7#5', 'm7', 'Maj7#5'],
        target: '#4, 7',
        chords: 'm, mMaj7'
    },
    'persian': {
        intervals: [0, 1, 4, 5, 6, 8, 11],
        triads: ['dim', 'm', 'm', 'm', 'Maj', 'aug', 'dim'],
        tetrads: ['Maj7♭5', 'Maj7', 'm', 'mMaj7', 'Maj7#3', 'Maj7#5', 'dim7'],
        target: '♭2, 3, ♭6',
        chords: 'Dim, Maj7♭5'
    },
    'neopolitan': {
        intervals: [0, 1, 3, 5, 7, 9, 11],
        triads: ['m', 'Maj', 'aug', 'Maj', 'Maj', 'dim', 'dim'],
        tetrads: ['mMaj7', 'Maj7#5', 'Maj7#5', 'Maj7', '7♭5', 'm7♭5', 'dim7'],
        target: '♭2, 7',
        chords: 'm, mMaj7'
    },
    'neopolitan-minor': {
        intervals: [0, 1, 3, 5, 7, 8, 11],
        triads: ['m', 'Maj', 'aug', 'm', 'Maj', 'Maj', 'dim'],
        tetrads: ['mMaj7', 'Maj7', '7#5', 'm7♭5', '7♭5', 'Maj7', 'dim7'],
        target: '♭2, ♭6',
        chords: 'm, mMaj7'
    },
    'diminished': {
        intervals: [0, 2, 3, 5, 6, 8, 9, 11],
        intervalAliases: { 9: '♭♭7' },
        triads: ['dim', 'dim', 'dim', 'dim', 'dim', 'dim', 'dim', 'dim'],
        tetrads: ['dim7', 'dim7', 'dim7', 'dim7', 'dim7', 'dim7', 'dim7', 'dim7'],
        target: '♭5, ♭♭7',
        chords: 'dim7'
    },
    'augmented': {
        intervals: [0, 3, 4, 7, 8, 11],
        intervalAliases: { 3: '#2', 8: '#5' },
        triads: ['aug', 'aug', 'aug', 'aug', 'aug', 'aug'],
        tetrads: ['Maj7#5', 'Maj7#5', 'Maj7#5', 'Maj7#5', 'Maj7#5', 'Maj7#5'],
        target: '#5',
        chords: 'aug, 7#5'
    },
    'm7-arpeggio': {
        intervals: [0, 4, 7, 11],
        triads: ['Maj', 'm', 'm', 'dim'],
        tetrads: ['Maj7', 'm7', '7', 'm7♭5'],
        target: '3, 7',
        chords: 'Maj7',
        customPositions: {
            "1": { "rootStr": 5, "notes": [{ "s": 5, "o": 0 }, { "s": 5, "o": 4 }, { "s": 4, "o": 2 }, { "s": 3, "o": 1 }, { "s": 3, "o": 2 }, { "s": 2, "o": 1 }, { "s": 1, "o": 0 }, { "s": 1, "o": 4 }, { "s": 0, "o": 0 }, { "s": 0, "o": 4 }] },
            "2A": { "rootStr": 3, "notes": [{ "s": 5, "o": 2 }, { "s": 4, "o": 4 }, { "s": 3, "o": 4 }, { "s": 2, "o": 2 }, { "s": 1, "o": 2 }, { "s": 1, "o": 3 }, { "s": 0, "o": 2 }, { "s": 0, "o": 5 }, { "s": 4, "o": 0 }, { "s": 3, "o": 0 }] },
            "2B": { "rootStr": 4, "notes": [{ "s": 5, "o": -3 }, { "s": 5, "o": 0 }, { "s": 4, "o": -1 }, { "s": 4, "o": 0 }, { "s": 3, "o": -1 }, { "s": 2, "o": -3 }, { "s": 1, "o": -3 }, { "s": 1, "o": -2 }, { "s": 0, "o": -3 }, { "s": 0, "o": 0 }] },
            "3A": { "rootStr": 4, "notes": [{ "s": 4, "o": 0 }, { "s": 5, "o": 0 }, { "s": 4, "o": -1 }, { "s": 3, "o": -1 }, { "s": 3, "o": 2 }, { "s": 2, "o": 1 }, { "s": 1, "o": 2 }, { "s": 0, "o": 0 }, { "s": 0, "o": 4 }, { "s": 2, "o": 2 }] },
            "3B": { "rootStr": 4, "notes": [{ "s": 5, "o": 0 }, { "s": 4, "o": 0 }, { "s": 5, "o": 4 }, { "s": 4, "o": 4 }, { "s": 3, "o": 2 }, { "s": 2, "o": 2 }, { "s": 2, "o": 1 }, { "s": 1, "o": 2 }, { "s": 0, "o": 0 }, { "s": 0, "o": 4 }] },
            "4": { "rootStr": 5, "notes": [{ "s": 5, "o": -1 }, { "s": 5, "o": 0 }, { "s": 4, "o": -1 }, { "s": 4, "o": 2 }, { "s": 3, "o": 2 }, { "s": 3, "o": 1 }, { "s": 2, "o": 1 }, { "s": 1, "o": 0 }, { "s": 0, "o": -1 }, { "s": 0, "o": 0 }] }
        }
    },
    'min7-arpeggio': {
        intervals: [0, 3, 7, 10],
        triads: ['m', 'Maj', 'm', 'Maj'],
        tetrads: ['m7', 'Maj7', 'm7', '7'],
        target: '♭3, ♭7',
        chords: 'm7',
        customPositions: {
            "1": { "rootStr": 5, "notes": [{ "s": 5, "o": 0 }, { "s": 5, "o": 3 }, { "s": 4, "o": 2 }, { "s": 3, "o": 2 }, { "s": 3, "o": 0 }, { "s": 2, "o": 0 }, { "s": 1, "o": 0 }, { "s": 1, "o": 3 }, { "s": 0, "o": 0 }, { "s": 0, "o": 3 }] },
            "2A": { "rootStr": 3, "notes": [{ "s": 5, "o": 1 }, { "s": 4, "o": 3 }, { "s": 3, "o": 3 }, { "s": 4, "o": 0 }, { "s": 3, "o": 0 }, { "s": 2, "o": 2 }, { "s": 1, "o": 1 }, { "s": 1, "o": 3 }, { "s": 0, "o": 1 }, { "s": 0, "o": 5 }] },
            "2B": { "rootStr": 4, "notes": [{ "s": 5, "o": -4 }, { "s": 4, "o": -2 }, { "s": 3, "o": -2 }, { "s": 2, "o": -3 }, { "s": 1, "o": -2 }, { "s": 0, "o": -4 }, { "s": 0, "o": 0 }, { "s": 5, "o": 0 }, { "s": 4, "o": 0 }, { "s": 2, "o": 0 }] },
            "3A": { "rootStr": 4, "notes": [{ "s": 5, "o": 0 }, { "s": 4, "o": 0 }, { "s": 4, "o": -2 }, { "s": 3, "o": -2 }, { "s": 2, "o": 0 }, { "s": 2, "o": -3 }, { "s": 1, "o": -2 }, { "s": 1, "o": 1 }, { "s": 0, "o": 0 }, { "s": 0, "o": 3 }] },
            "3B": { "rootStr": 4, "notes": [{ "s": 5, "o": 0 }, { "s": 4, "o": 0 }, { "s": 4, "o": -2 }, { "s": 3, "o": -2 }, { "s": 2, "o": 0 }, { "s": 1, "o": -2 }, { "s": 1, "o": 1 }, { "s": 0, "o": 0 }, { "s": 0, "o": 3 }, { "s": 3, "o": 2 }] },
            "3C": { "rootStr": 4, "notes": [{ "s": 5, "o": 0 }, { "s": 4, "o": 0 }, { "s": 2, "o": 0 }, { "s": 1, "o": 1 }, { "s": 0, "o": 0 }, { "s": 0, "o": 3 }, { "s": 3, "o": 2 }, { "s": 5, "o": 3 }, { "s": 4, "o": 3 }, { "s": 2, "o": 2 }] },
            "4": { "rootStr": 5, "notes": [{ "s": 5, "o": -2 }, { "s": 5, "o": 0 }, { "s": 4, "o": -2 }, { "s": 3, "o": 0 }, { "s": 2, "o": 0 }, { "s": 1, "o": 0 }, { "s": 0, "o": 0 }, { "s": 3, "o": -3 }, { "s": 2, "o": -3 }, { "s": 0, "o": -2 }] }
        }
    },
    'dom7-arpeggio': {
        intervals: [0, 4, 7, 10],
        triads: ['Maj', 'dim', 'm', 'Maj'],
        tetrads: ['7', 'dim7', 'm7', 'Maj7'],
        target: '3, ♭7',
        chords: '7',
        customPositions: {
            "1A": { "rootStr": 5, "notes": [{ "s": 5, "o": 0 }, { "s": 4, "o": 2 }, { "s": 3, "o": 2 }, { "s": 4, "o": -1 }, { "s": 3, "o": 0 }, { "s": 2, "o": 1 }, { "s": 1, "o": 0 }, { "s": 1, "o": 3 }, { "s": 0, "o": 0 }, { "s": 0, "o": 4 }] },
            "1B": { "rootStr": 5, "notes": [{ "s": 5, "o": 0 }, { "s": 4, "o": 2 }, { "s": 3, "o": 2 }, { "s": 3, "o": 0 }, { "s": 2, "o": 1 }, { "s": 1, "o": 3 }, { "s": 0, "o": 4 }, { "s": 5, "o": 4 }, { "s": 1, "o": 0 }, { "s": 0, "o": 0 }] },
            "2A": { "rootStr": 3, "notes": [{ "s": 5, "o": 2 }, { "s": 4, "o": 3 }, { "s": 3, "o": 4 }, { "s": 4, "o": 0 }, { "s": 3, "o": 0 }, { "s": 2, "o": 2 }, { "s": 1, "o": 3 }, { "s": 1, "o": 1 }, { "s": 0, "o": 2 }] },
            "2B": { "rootStr": 4, "notes": [{ "s": 5, "o": -3 }, { "s": 4, "o": -2 }, { "s": 3, "o": -1 }, { "s": 2, "o": -3 }, { "s": 1, "o": -2 }, { "s": 0, "o": -3 }, { "s": 5, "o": 0 }, { "s": 4, "o": 0 }, { "s": 2, "o": 0 }, { "s": 0, "o": 0 }] },
            "3A": { "rootStr": 4, "notes": [{ "s": 5, "o": 0 }, { "s": 4, "o": 0 }, { "s": 3, "o": 2 }, { "s": 2, "o": 2 }, { "s": 0, "o": 3 }, { "s": 4, "o": -2 }, { "s": 3, "o": -1 }, { "s": 2, "o": 0 }, { "s": 1, "o": 2 }, { "s": 0, "o": 0 }] },
            "3B": { "rootStr": 4, "notes": [{ "s": 5, "o": 0 }, { "s": 4, "o": 0 }, { "s": 3, "o": 2 }, { "s": 2, "o": 2 }, { "s": 0, "o": 3 }, { "s": 2, "o": 0 }, { "s": 1, "o": 2 }, { "s": 0, "o": 0 }, { "s": 5, "o": 3 }, { "s": 4, "o": 4 }] },
            "4": { "rootStr": 5, "notes": [{ "s": 5, "o": -2 }, { "s": 5, "o": 0 }, { "s": 4, "o": -1 }, { "s": 3, "o": 0 }, { "s": 3, "o": -3 }, { "s": 2, "o": -3 }, { "s": 1, "o": 0 }, { "s": 0, "o": -2 }, { "s": 0, "o": 0 }, { "s": 1, "o": -3 }] }
        }
    },
    'major-triad': {
        intervals: [0, 4, 7],
        triads: ['Maj', 'm', 'm'],
        tetrads: ['Maj7', 'm7', '7'],
        target: '1, 3, 5',
        chords: 'Maj',
        customPositions: {
            "1": { "rootStr": 5, "notes": [{ "s": 5, "o": 0 }, { "s": 5, "o": 4 }, { "s": 4, "o": 2 }, { "s": 3, "o": 2 }, { "s": 2, "o": 1 }, { "s": 1, "o": 0 }, { "s": 0, "o": 0 }, { "s": 0, "o": 4 }] },
            "2": { "rootStr": 4, "notes": [{ "s": 5, "o": -3 }, { "s": 4, "o": 0 }, { "s": 0, "o": -3 }, { "s": 1, "o": -2 }, { "s": 2, "o": -3 }, { "s": 0, "o": 0 }, { "s": 3, "o": -1 }, { "s": 5, "o": 0 }] },
            "3": { "rootStr": 4, "notes": [{ "s": 5, "o": 0 }, { "s": 4, "o": 0 }, { "s": 4, "o": 4 }, { "s": 3, "o": 2 }, { "s": 2, "o": 2 }, { "s": 1, "o": 2 }, { "s": 0, "o": 5 }, { "s": 0, "o": 0 }] }
        }
    },
    'minor-triad': {
        intervals: [0, 3, 7],
        triads: ['m', 'Maj', 'm'],
        tetrads: ['m7', 'Maj7', 'm7'],
        target: '1, b3, 5',
        chords: 'm',
        customPositions: {
            "1": { "rootStr": 5, "notes": [{ "s": 5, "o": 0 }, { "s": 5, "o": 3 }, { "s": 4, "o": 2 }, { "s": 3, "o": 2 }, { "s": 1, "o": 0 }, { "s": 0, "o": 0 }, { "s": 2, "o": 0 }, { "s": 0, "o": 3 }] },
            "2": { "rootStr": 4, "notes": [{ "s": 4, "o": 0 }, { "s": 0, "o": -4 }, { "s": 1, "o": -2 }, { "s": 2, "o": -3 }, { "s": 3, "o": -2 }, { "s": 4, "o": -5 }, { "s": 5, "o": -4 }, { "s": 0, "o": 0 }] },
            "3": { "rootStr": 4, "notes": [{ "s": 5, "o": 0 }, { "s": 4, "o": 0 }, { "s": 4, "o": 3 }, { "s": 3, "o": 2 }, { "s": 2, "o": 2 }, { "s": 0, "o": 5 }, { "s": 0, "o": 0 }, { "s": 1, "o": 1 }] }
        }
    },
    'hirajoshi': {
        intervals: [0, 2, 3, 7, 8],
        triads: ['m', 'dim', 'Maj', 'm', 'Maj'],
        tetrads: ['m7', 'm7♭5', 'Maj7', 'm7', 'Maj7'],
        target: '2, ♭6',
        chords: 'm, m7',
        customPositions: {
            "3": { "rootStr": 4, "notes": [{ "s": 5, "o": 0 }, { "s": 5, "o": 1 }, { "s": 4, "o": 0 }, { "s": 4, "o": 2 }, { "s": 3, "o": -2 }, { "s": 3, "o": 2 }, { "s": 2, "o": -2 }, { "s": 2, "o": 2 }, { "s": 1, "o": 0 }, { "s": 1, "o": 1 }, { "s": 0, "o": 0 }, { "s": 0, "o": 1 }] }
        }
    },
    'iwato': {
        intervals: [0, 1, 5, 6, 10],
        triads: ['dim', 'Maj', 'm', 'm', 'Maj'],
        tetrads: ['m7♭5', 'Maj7', 'm7', 'm7', 'Maj7'],
        target: '♭2, ♭5',
        chords: 'dim'
    },
    'kumoi': {
        intervals: [0, 2, 3, 7, 9],
        triads: ['m', 'm', 'Maj', 'm', 'dim'],
        tetrads: ['m7', 'm7', 'Maj7', 'm7', 'm7♭5'],
        target: '2, 6',
        chords: 'm, m6'
    },
    'hon-kumoi': {
        intervals: [0, 1, 5, 7, 8],
        triads: ['m', 'Maj', 'Maj', 'm', 'dim'],
        tetrads: ['m7', 'Maj7', '7', 'm7', 'm7♭5'],
        target: '♭2, 5',
        chords: 'm'
    },
    'chinese': {
        intervals: [0, 4, 6, 7, 11],
        intervalAliases: { 6: '#4' },
        triads: ['Maj', 'dim', 'm', 'm', 'Maj'],
        tetrads: ['Maj7', 'm7♭5', 'm7', 'm7', 'Maj7'],
        target: '3, 5',
        chords: 'Maj, Maj7'
    }
};

export const PROGRESSIONS = [
    "I - IV - V (Ej: C - F - G)",
    "ii - V - I (Ej: Dm - G - C)",
    "vi - IV - I - V (Ej: Am - F - C - G)",
    "I - vi - ii - V (Ej: C - Am - Dm - G)"
];

export const ROMAN_PROGRESSIONS = [
    { roman: "I - V - vi - IV", isMinorStart: false },
    { roman: "ii - V - I", isMinorStart: false }, // Se resuelve en Mayor
    { roman: "vi - IV - I - V", isMinorStart: true },
    { roman: "I - vi - IV - V", isMinorStart: false },
    { roman: "i - iv - V", isMinorStart: true }, // Progresión menor clásica
    { roman: "I - IV - vi - V", isMinorStart: false },
];

export const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11]; // I, ii, iii, IV, V, vi, vii°
export const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10]; // i, ii°, III, iv, v, VI, VII

export const DEGREE_MAP_MAJOR: Record<string, { idx: number, suffix: string }> = {
    'I': { idx: 0, suffix: '' },
    'ii': { idx: 1, suffix: 'm' },
    'iii': { idx: 2, suffix: 'm' },
    'IV': { idx: 3, suffix: '' },
    'V': { idx: 4, suffix: '' },
    'vi': { idx: 5, suffix: 'm' },
    'vii°': { idx: 6, suffix: 'dim' },
};

export const DEGREE_MAP_MINOR: Record<string, { idx: number, suffix: string }> = {
    'i': { idx: 0, suffix: 'm' },
    'ii°': { idx: 1, suffix: 'dim' },
    'III': { idx: 2, suffix: '' },
    'iv': { idx: 3, suffix: 'm' },
    'v': { idx: 4, suffix: 'm' },
    'V': { idx: 4, suffix: '' },
    'VI': { idx: 5, suffix: '' },
    'VII': { idx: 6, suffix: '' },
};

export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin'
} as const;
export type Role = typeof ROLES[keyof typeof ROLES];

export const SUBSCRIPTION_TIERS = {
    FREE: 'free',
    PRO: 'pro'
} as const;
export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS];


export const BASIC_SCALE_SUGGESTIONS = {
  minor: [
    'pentatonic-minor',
    'aeolian',
    'dorian',
    'phrygian',
    'hirajoshi'
  ],
  major: [
    'pentatonic-major',
    'ionian',
    'mixolydian',
    'lydian'
  ]
} as const;