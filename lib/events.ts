// Window-level events used to decouple UI pieces (pro modal, onboarding steps, etc.)
export const APP_EVENTS = {
  SHOW_PRO_MODAL: 'app:show-pro-modal',
  EXERCISE_CREATED: 'app:exercise-created',
  ROUTINE_CREATED: 'app:routine-created',
  PLAY_EXERCISE: 'app:play-exercise',
  PLAY_ROUTINE: 'app:play-routine',
  OPEN_NEW_EXERCISE_MODAL: 'app:open-new-exercise-modal',
  OPEN_NEW_ROUTINE_MODAL: 'app:open-new-routine-modal',
  OPEN_END_ROUTINE_MODAL: 'app:open-end-routine-modal',
  END_ROUTINE_PRACTICE: 'app:end-routine-practice',
  TEACHER_MODE_CHANGED: 'teacher-mode-changed',
} as const;

export type AppEventName = typeof APP_EVENTS[keyof typeof APP_EVENTS];

export const emitAppEvent = (name: AppEventName) => {
  window.dispatchEvent(new CustomEvent(name));
};
