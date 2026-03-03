export interface Exercise {
  id: number;
  created_at: string;
  user_id: string;
  title: string;
  file_url: string | null;
  technique: string;
  bpm_initial: number | null;
  bpm_current: number | null;
  bpm_goal: number | null;
  difficulty: number;
  notes: string | null;
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