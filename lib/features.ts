// Feature flags (build-time). Unset = feature hidden.

// Teacher mode: navbar toggle, profile activation, student invites and /teacher/* routes.
// Enable with NEXT_PUBLIC_ENABLE_TEACHER_MODE=true
export const TEACHER_MODE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_TEACHER_MODE === 'true';
