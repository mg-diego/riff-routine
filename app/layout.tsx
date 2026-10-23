// Pass-through root layout: <html>/<body> are rendered by app/[locale]/layout.tsx (so `lang` matches the
// locale while pages stay statically rendered) and by app/not-found.tsx for unmatched routes.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
