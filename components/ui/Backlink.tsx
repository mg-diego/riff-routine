"use client";

import Link from 'next/link';

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        color: 'var(--muted)',
        fontSize: '0.85rem',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        transition: 'color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
    >
      ← {label}
    </Link>
  );
}