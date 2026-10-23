// Admin panel access: only the users listed here (comma-separated), in every environment.
//   NEXT_PUBLIC_ADMIN_EMAILS=me@example.com,other@example.com
// With no emails configured the panel doesn't exist (routes are a 404).
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

export const ADMIN_PANEL_CONFIGURED = ADMIN_EMAILS.length > 0;

export const isAdminEmail = (email: string | null | undefined) =>
  !!email && ADMIN_EMAILS.includes(email.toLowerCase());
