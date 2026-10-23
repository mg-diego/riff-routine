import type { MouseEvent, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './IconActionButton.module.css';

export type IconActionVariant = 'edit' | 'history' | 'delete';

interface IconActionButtonProps {
  variant: IconActionVariant;
  title: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode; // svg paths
}

// Square 42px icon button used in exercise/routine rows; the variant sets the hover accent color
export function IconActionButton({ variant, title, onClick, children }: IconActionButtonProps) {
  return (
    <button onClick={onClick} className={cx(styles.button, styles[variant])} title={title}>
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}
