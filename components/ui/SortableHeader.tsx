import styles from './SortableHeader.module.css';
export type SortDirection = 'asc' | 'desc';
export interface SortConfig<K extends string> { key: K; direction: SortDirection; }

interface SortableHeaderProps<K extends string> {
  label: string;
  sortKey: K;
  sortConfig: SortConfig<K>;
  onSort: (key: K) => void;
}

export function SortableHeader<K extends string>({ label, sortKey, sortConfig, onSort }: SortableHeaderProps<K>) {
  const isActive = (direction: SortDirection) => sortConfig.key === sortKey && sortConfig.direction === direction;

  return (
    <th onClick={() => onSort(sortKey)} className={styles.th}>
      <div className={styles.row}>
        {label}
        <div className={styles.stack}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={styles.icon} style={{ opacity: isActive('asc') ? 1 : 0.2 }}><polyline points="18 15 12 9 6 15" /></svg>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: isActive('desc') ? 1 : 0.2 }}><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </div>
    </th>
  );
}
