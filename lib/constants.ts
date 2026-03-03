export const TECHNIQUES = [
  'Alternate Picking', 'Down Picking', 'Legato', 'Tapping',
  'Sweep Picking', 'Rythm', 'Song', 'Solo', 'Hybrid Picking',
  'String Skipping', 'Warm-up', 'Lick', 'Bending', 'Vibrato'
];

export const DIFFICULTY_LABELS: { [key: number]: string } = { 
  1: 'Principiante', 2: 'Básico', 3: 'Intermedio', 4: 'Avanzado', 5: 'Experto' 
};

export const DIFFICULTY_COLORS: { [key: number]: string } = { 
  1: '#4ade80', 2: '#a3e635', 3: '#facc15', 4: '#fb923c', 5: '#f87171' 
};

export const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const STANDARD_TUNING = ['E', 'B', 'G', 'D', 'A', 'E']; 
export const MARKED_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

export const INTERVAL_NAMES: Record<number, string> = {0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'};
export const STANDARD_BASES = [64, 59, 55, 50, 45, 40];

export const PREDEFINED_COLORS: Record<string, string> = {
  '#7f8c8d': 'Gris', '#e74c3c': 'Rojo', '#3498db': 'Azul', '#2ecc71': 'Verde',
  '#f1c40f': 'Amarillo', '#9b59b6': 'Morado', '#e67e22': 'Naranja', '#e84393': 'Rosa'
};
export const DEFAULT_INTERVAL_COLORS: Record<number, string> = { 0: '#e74c3c', 3: '#3498db', 4: '#3498db', 7: '#f1c40f' };

export const CHORD_INTERVALS: Record<string, number[]> = {
  'Maj': [0, 4, 7], 'm': [0, 3, 7], 'dim': [0, 3, 6], 'aug': [0, 4, 8], '5': [0, 7],
  'Maj7': [0, 4, 7, 11], 'm7': [0, 3, 7, 10], '7': [0, 4, 7, 10], 'm7b5': [0, 3, 6, 10],
  'dim7': [0, 3, 6, 9], 'mMaj7': [0, 3, 7, 11], 'Maj7#5': [0, 4, 8, 11], '7#5': [0, 4, 8, 10],
  '7b5': [0, 4, 6, 10], 'mMaj7b5': [0, 3, 6, 11], 'mMaj7#5': [0, 3, 8, 11], 'Maj7b5': [0, 4, 6, 11],
  'Maj7#3': [0, 5, 7, 11]
};

export const SCALES: Record<string, any> = {
  'ionian': { 
    name: 'Jónica (Mayor)', 
    intervals: [0, 2, 4, 5, 7, 9, 11], 
    triads: ['Maj', 'm', 'm', 'Maj', 'Maj', 'm', 'dim'], 
    tetrads: ['Maj7', 'm7', 'm7', 'Maj7', '7', 'm7', 'm7b5'], 
    desc: 'Escala mayor natural. Sonido alegre, brillante y resolutivo. Es la base de la música occidental.', 
    target: '3, 7', 
    chords: 'Maj, Maj7' 
  },
  'dorian': { 
    name: 'Dórica', 
    intervals: [0, 2, 3, 5, 7, 9, 10], 
    triads: ['m', 'm', 'Maj', 'Maj', 'm', 'dim', 'Maj'], 
    tetrads: ['m7', 'm7', 'Maj7', '7', 'm7', 'm7b5', 'Maj7'], 
    desc: 'Escala menor con una 6 mayor. Sonido melancólico pero con un toque flotante y brillante. Clásica en Jazz, Funk y Blues rock.', 
    target: 'b3, 6', 
    chords: 'm, m7' 
  },
  'phrygian': { 
    name: 'Frigia', 
    intervals: [0, 1, 3, 5, 7, 8, 10], 
    triads: ['m', 'Maj', 'Maj', 'm', 'dim', 'Maj', 'm'], 
    tetrads: ['m7', 'Maj7', '7', 'm7', 'm7b5', 'Maj7', 'm7'], 
    desc: 'Sonido oscuro, exótico y con mucha tensión debido a su b2. Es la escala característica del flamenco y muy usada en Metal.', 
    target: 'b2, b3', 
    chords: 'm, m7' 
  },
  'lydian': { 
    name: 'Lidia', 
    intervals: [0, 2, 4, 6, 7, 9, 11], 
    intervalAliases: {6: '#4'}, 
    triads: ['Maj', 'Maj', 'm', 'dim', 'Maj', 'm', 'm'], 
    tetrads: ['Maj7', '7', 'm7', 'm7b5', 'Maj7', 'm7', 'm7'], 
    desc: 'Escala mayor con la 4 aumentada. Sonido misterioso, espacial, onírico y muy abierto. Común en música de cine.', 
    target: '#4, 7', 
    chords: 'Maj, Maj7, Maj7#11' 
  },
  'mixolydian': { 
    name: 'Mixolidia', 
    intervals: [0, 2, 4, 5, 7, 9, 10], 
    triads: ['Maj', 'm', 'dim', 'Maj', 'm', 'm', 'Maj'], 
    tetrads: ['7', 'm7', 'm7b5', 'Maj7', 'm7', 'm7', 'Maj7'], 
    desc: 'Escala mayor con la 7 menor. Alegre pero con una tensión característica. Es la escala por excelencia del Blues, Rock y Funk.', 
    target: '3, b7', 
    chords: '7, 9, 13 (Dominantes)' 
  },
  'aeolian': { 
    name: 'Eólica (Menor)', 
    intervals: [0, 2, 3, 5, 7, 8, 10], 
    triads: ['m', 'dim', 'Maj', 'm', 'm', 'Maj', 'Maj'], 
    tetrads: ['m7', 'm7b5', 'Maj7', 'm7', 'm7', 'Maj7', '7'], 
    desc: 'La escala menor natural. Sonido triste, melancólico o épico. La más utilizada para progresiones menores.', 
    target: 'b3, b6', 
    chords: 'm, m7' 
  },
  'locrian': { 
    name: 'Locria', 
    intervals: [0, 1, 3, 5, 6, 8, 10], 
    triads: ['dim', 'Maj', 'm', 'm', 'Maj', 'Maj', 'm'], 
    tetrads: ['m7b5', 'Maj7', 'm7', 'm7', 'Maj7', '7', 'm7'], 
    desc: 'El modo más inestable y disonante debido a que no tiene 5 justa. Se usa mayormente en Jazz y pasajes muy tensos de Metal.', 
    target: 'b2, b5', 
    chords: 'dim, m7b5' 
  },
  'blues': { 
    name: 'Blues', 
    intervals: [0, 3, 5, 6, 7, 10], 
    triads: ['m', 'Maj', 'm', 'dim', 'm', 'Maj'], 
    tetrads: ['m7', 'Maj7', 'm7', 'dim7', 'm7', '7'], 
    desc: 'La escala pentatónica menor a la que se le añade la "Blue Note" (la b5). Aporta el característico sonido sucio del blues.', 
    target: 'b3, b5, b7', 
    chords: 'Dominantes (7), m7' 
  },
  'pentatonic-minor': { 
    name: 'Pentatónica Menor', 
    intervals: [0, 3, 5, 7, 10], 
    triads: ['m', 'Maj', 'm', 'm', 'Maj'], 
    tetrads: ['m7', 'Maj7', 'm7', 'm7', '7'], 
    desc: 'La escala más popular de la guitarra moderna. Cinco notas sin semitonos que la hacen facilísima para improvisar.', 
    target: '1, b3, 5', 
    chords: 'm, m7, acordes 7' 
  },
  'pentatonic-major': { 
    name: 'Pentatónica Mayor', 
    intervals: [0, 2, 4, 7, 9], 
    triads: ['Maj', 'm', 'm', '5', 'm'], 
    tetrads: ['Maj7', 'm7', 'm7', '7', 'm7'], 
    desc: 'Versión brillante de cinco notas. Sonido campestre, alegre y dulce. Es el pilar del Country y Pop.', 
    target: '1, 3, 5', 
    chords: 'Maj, Maj7' 
  },
  'harmonic-minor': { 
    name: 'Menor Armónica', 
    intervals: [0, 2, 3, 5, 7, 8, 11], 
    triads: ['m', 'dim', 'aug', 'm', 'Maj', 'Maj', 'dim'], 
    tetrads: ['mMaj7', 'm7b5', 'Maj7#5', 'm7', '7', 'Maj7', 'dim7'], 
    desc: 'Escala menor natural a la que se le sube la 7 para generar una fuerte tensión. Sonido clásico, barroco y árabe.', 
    target: 'b6, 7', 
    chords: 'm, mMaj7, 7 (V grado)' 
  },
  'harmonic-major': { 
    name: 'Mayor Armónica', 
    intervals: [0, 2, 4, 5, 7, 8, 11], 
    triads: ['Maj', 'dim', 'm', 'm', 'Maj', 'aug', 'dim'], 
    tetrads: ['Maj7', 'm7b5', 'm7', 'mMaj7', '7', 'Maj7#5', 'dim7'], 
    desc: 'Una escala rara y exótica que combina la alegría de la tercera mayor con la oscuridad de la sexta menor.', 
    target: '3, b6', 
    chords: 'Maj, Maj7' 
  },
  'melodic-minor': { 
    name: 'Menor Melódica', 
    intervals: [0, 2, 3, 5, 7, 9, 11], 
    triads: ['m', 'm', 'aug', 'Maj', 'Maj', 'dim', 'dim'], 
    tetrads: ['mMaj7', 'm7', 'Maj7#5', '7', '7', 'm7b5', 'm7b5'], 
    desc: 'Escala menor natural con la 6 y 7 mayores. Muy fluida y resolutiva, usada en Jazz contemporáneo.', 
    target: '6, 7', 
    chords: 'mMaj7, m6' 
  },
  'double-harmonic': { 
    name: 'Doble Armónica', 
    intervals: [0, 1, 4, 5, 7, 8, 11], 
    triads: ['Maj', 'Maj', 'm', 'm', 'dim', 'aug', 'm'], 
    tetrads: ['Maj7', 'Maj7', 'm7', 'mMaj7', '7b5', 'Maj7#5', 'm7'], 
    desc: 'Escala de sonido Bizantino o Árabe. Cuenta con dos segundas aumentadas en su estructura, haciéndola muy exótica.', 
    target: 'b2, 7', 
    chords: 'Maj, Maj7' 
  },
  'hungarian': { 
    name: 'Húngara', 
    intervals: [0, 2, 3, 6, 7, 8, 11], 
    intervalAliases: {6: '#4'}, 
    triads: ['m', 'dim', 'm', 'm', 'm', 'aug', 'Maj'], 
    tetrads: ['7', 'dim7', 'mMaj7b5', 'm7b5', 'mMaj7#5', 'm7', 'Maj7#5'], 
    desc: 'Escala menor gitana. Es esencialmente la menor armónica pero con la cuarta aumentada (#4). Sonido metal neoclásico.', 
    target: '#4, 7', 
    chords: 'm, mMaj7' 
  },
  'persian': { 
    name: 'Persa', 
    intervals: [0, 1, 4, 5, 6, 8, 11], 
    triads: ['dim', 'm', 'm', 'm', 'Maj', 'aug', 'dim'], 
    tetrads: ['Maj7b5', 'Maj7', 'm', 'mMaj7', 'Maj7#3', 'Maj7#5', 'dim7'], 
    desc: 'Sonido muy tenso y rico en semitonos. Evoca fuertemente las melodías del Medio Oriente.', 
    target: 'b2, 3, b6', 
    chords: 'Dim, Maj7b5' 
  },
  'neopolitan': { 
    name: 'Napolitana', 
    intervals: [0, 1, 3, 5, 7, 9, 11], 
    triads: ['m', 'Maj', 'aug', 'Maj', 'Maj', 'dim', 'dim'], 
    tetrads: ['mMaj7', 'Maj7#5', 'Maj7#5', 'Maj7', '7b5', 'm7b5', 'dim7'], 
    desc: 'Combina el inicio disonante de la escala Frigia (b2) con la brillantez resolutiva de la escala Mayor (7).', 
    target: 'b2, 7', 
    chords: 'm, mMaj7' 
  },
  'neopolitan-minor': { 
    name: 'Menor Napolitana', 
    intervals: [0, 1, 3, 5, 7, 8, 11], 
    triads: ['m', 'Maj', 'aug', 'm', 'Maj', 'Maj', 'dim'], 
    tetrads: ['mMaj7', 'Maj7', '7#5', 'm7b5', '7b5', 'Maj7', 'dim7'], 
    desc: 'Similar a la menor armónica pero con el añadido oscuro de una segunda bemol (b2). Sonido gótico y dramático.', 
    target: 'b2, b6', 
    chords: 'm, mMaj7' 
  },
  'diminished': { 
    name: 'Disminuida', 
    intervals: [0, 2, 3, 5, 6, 8, 9, 11], 
    intervalAliases: {9: 'bb7'}, 
    triads: ['dim', 'dim', 'dim', 'dim', 'dim', 'dim', 'dim', 'dim'], 
    tetrads: ['dim7', 'dim7', 'dim7', 'dim7', 'dim7', 'dim7', 'dim7', 'dim7'], 
    desc: 'Escala octatónica simétrica que alterna Tono-Semitono. Genera una tensión constante e infinita.', 
    target: 'b5, bb7', 
    chords: 'dim7' 
  },
  'augmented': { 
    name: 'Aumentada', 
    intervals: [0, 3, 4, 7, 8, 11], 
    intervalAliases: {3: '#2', 8: '#5'}, 
    triads: ['aug', 'aug', 'aug', 'aug', 'aug', 'aug'], 
    tetrads: ['Maj7#5', 'Maj7#5', 'Maj7#5', 'Maj7#5', 'Maj7#5', 'Maj7#5'], 
    desc: 'Escala hexátona formada por superposición de tonos enteros. Evoca un sentimiento irreal de flotabilidad.', 
    target: '#5', 
    chords: 'aug, 7#5' 
  },
  'm7-arpeggio': { 
    name: 'Arpegio M7', 
    intervals: [0, 4, 7, 11], 
    triads: ['Maj', 'm', 'm', 'dim'], 
    tetrads: ['Maj7', 'm7', '7', 'm7b5'], 
    desc: 'Las 4 notas estructurales de un acorde Mayor con 7ª Mayor. Perfecto para barridos en progresiones mayores.', 
    target: '3, 7', 
    chords: 'Maj7' 
  },
  'min7-arpeggio': { 
    name: 'Arpegio m7', 
    intervals: [0, 3, 7, 10], 
    triads: ['m', 'Maj', 'm', 'Maj'], 
    tetrads: ['m7', 'Maj7', 'm7', '7'], 
    desc: 'Las 4 notas estructurales de un acorde menor con 7ª. Imprescindible para sweep picking sobre acordes menores.', 
    target: 'b3, b7', 
    chords: 'm7' 
  },
  'dom7-arpeggio': { 
    name: 'Arpegio Dominante', 
    intervals: [0, 4, 7, 10], 
    triads: ['Maj', 'dim', 'm', 'Maj'], 
    tetrads: ['7', 'dim7', 'm7', 'Maj7'], 
    desc: 'Arpegio del acorde dominante. Su intervalo inestable de tritono crea la necesidad obligada de resolver.', 
    target: '3, b7', 
    chords: '7' 
  },
  'major-triad': { 
    name: 'Tríada Mayor', 
    intervals: [0, 4, 7], 
    triads: ['Maj', 'm', 'm'], 
    tetrads: ['Maj7', 'm7', '7'], 
    desc: 'El acorde mayor básico tocado de forma lineal. Fuerte, brillante y estático.', 
    target: '1, 3, 5', 
    chords: 'Maj' 
  },
  'minor-triad': { 
    name: 'Tríada Menor', 
    intervals: [0, 3, 7], 
    triads: ['m', 'Maj', 'm'], 
    tetrads: ['m7', 'Maj7', 'm7'], 
    desc: 'El acorde menor básico tocado de forma lineal. Oscuro y triste.', 
    target: '1, b3, 5', 
    chords: 'm' 
  },
  'hirajoshi': { 
    name: 'Hirajōshi (6th)', 
    intervals: [0, 2, 3, 7, 8], 
    triads: ['m', 'dim', 'Maj', 'm', 'Maj'], 
    tetrads: ['m7', 'm7b5', 'Maj7', 'm7', 'Maj7'], 
    desc: 'Escala pentatónica tradicional de Japón derivada de la afinación del Koto. Sonido melancólico y épico.', 
    target: '2, b6', 
    chords: 'm, m7' 
  },
  'iwato': { 
    name: 'Iwato (7th)', 
    intervals: [0, 1, 5, 6, 10], 
    triads: ['dim', 'Maj', 'm', 'm', 'Maj'], 
    tetrads: ['m7b5', 'Maj7', 'm7', 'm7', 'Maj7'], 
    desc: 'Escala pentatónica oriental extremadamente disonante y oscura, similar a un modo Locrio sin tercera.', 
    target: 'b2, b5', 
    chords: 'dim' 
  },
  'kumoi': { 
    name: 'Kumoi (1st)', 
    intervals: [0, 2, 3, 7, 9], 
    triads: ['m', 'm', 'Maj', 'm', 'dim'], 
    tetrads: ['m7', 'm7', 'Maj7', 'm7', 'm7b5'], 
    desc: 'Variante pentatónica japonesa (Sakura). Ofrece un tono ceremonial, antiguo e introspectivo.', 
    target: '2, 6', 
    chords: 'm, m6' 
  },
  'hon-kumoi': { 
    name: 'Hon Kumoi-joshi', 
    intervals: [0, 1, 5, 7, 8], 
    triads: ['m', 'Maj', 'Maj', 'm', 'dim'], 
    tetrads: ['m7', 'Maj7', '7', 'm7', 'm7b5'], 
    desc: 'Escala tradicional basada en saltos interválicos muy dramáticos. Sonido profundo y reflexivo.', 
    target: 'b2, 5', 
    chords: 'm' 
  },
  'chinese': { 
    name: 'China (4th)', 
    intervals: [0, 4, 6, 7, 11], 
    intervalAliases: {6: '#4'}, 
    triads: ['Maj', 'dim', 'm', 'm', 'Maj'], 
    tetrads: ['Maj7', 'm7b5', 'm7', 'm7', 'Maj7'], 
    desc: 'Basada en afinaciones orientales tradicionales. Su estructura evita terceras y sextas menores.', 
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