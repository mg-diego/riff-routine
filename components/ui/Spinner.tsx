import styles from './Spinner.module.css';
// Circular loading spinner (uses the global `spin` keyframes from globals.css)
interface SpinnerProps {
  size?: number;
  color?: string;
  trackColor?: string;
}

export function Spinner({ size = 32, color = 'var(--gold)', trackColor = 'rgba(220,185,138,0.15)' }: SpinnerProps) {
  return (
    <div className={styles.dot} style={{ width: size, height: size, border: `2px solid ${trackColor}`, borderTopColor: color }} />
  );
}

// Centered spinner used while a whole page is loading
export function PageSpinner({ minHeight = '40vh', ...spinner }: SpinnerProps & { minHeight?: string }) {
  return (
    <div className={styles.row} style={{ minHeight }}>
      <Spinner {...spinner} />
    </div>
  );
}
