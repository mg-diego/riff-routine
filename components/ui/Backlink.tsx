"use client";

import Link from 'next/link';
import styles from './Backlink.module.css';

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={styles.row}
    >
      ← {label}
    </Link>
  );
}