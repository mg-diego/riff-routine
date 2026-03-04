export interface Exercise {
  id: string;
  user_id: string;
  title: string;
  file_url: string | null;
  technique: string | null;
  bpm_initial: number | null;
  bpm_suggested: number | null;
  bpm_goal: number | null;
  difficulty: number;
  notes: string | null;
  created_at: string;
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