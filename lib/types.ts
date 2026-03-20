export interface Exercise {
  id: string;
  user_id: string | null;
  title: string;
  file_url: string | null;
  technique: string | null;
  bpm_suggested: number | null;
  bpm_goal: number | null;
  difficulty: number;
  notes: string | null;
  created_at: string;
  has_bpm?: boolean;
  is_system: boolean;
  forked_from: string | null;
}

export interface Routine {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  target_bpm: number | null;
  order_index: number;
  target_duration_seconds: number | null;
}

export interface ChordDefinition {
  note: string;
  type: string;
}

export interface DbBackingTrack {
  id: string;
  user_id: string;
  title: string;
  youtube_url: string;
  tonality_note: string | null;
  tonality_type: string | null;
  chords: ChordDefinition[];
  bpm: number | null;
}