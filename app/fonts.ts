import { Bebas_Neue, DM_Sans } from 'next/font/google';

// Self-hosted at build time by next/font (no render-blocking request to Google Fonts).
// Exposed as CSS variables: var(--font-display) and var(--font-body).
export const displayFont = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

// Variable font: a single file covers every weight used in the app (300–800)
export const bodyFont = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});
