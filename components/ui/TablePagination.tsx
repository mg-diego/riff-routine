import type { CSSProperties } from 'react';
import styles from './TablePagination.module.css';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  labels: { page: string; of: string; prev: string; next: string };
}

export function TablePagination({ currentPage, totalPages, onPageChange, labels }: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const buttonStyle = (disabled: boolean): CSSProperties => ({
    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    color: disabled ? 'rgba(255,255,255,0.2)' : 'var(--text)',
    padding: '0.5rem 1rem', borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s', fontFamily: 'var(--font-body), sans-serif',
  });

  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <div className={styles.row}>
      <span className={styles.label}>{labels.page} {currentPage} {labels.of} {totalPages}</span>
      <div className={styles.prevRow}>
        <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={isFirst} style={buttonStyle(isFirst)}>
          {labels.prev}
        </button>
        <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={isLast} style={buttonStyle(isLast)}>
          {labels.next}
        </button>
      </div>
    </div>
  );
}
