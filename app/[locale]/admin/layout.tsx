import { notFound } from 'next/navigation';
import { ADMIN_PANEL_CONFIGURED } from '@/lib/admin';

// Server-side gate: without configured admin emails every admin route is a 404.
// Per-user access (only the configured emails) is checked by the pages themselves.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!ADMIN_PANEL_CONFIGURED) notFound();
  return children;
}
