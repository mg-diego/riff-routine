import styles from './StudentAvatar.module.css';
export function StudentAvatar({ name, url, size = 36 }: { name: string; url: string | null; size?: number }) {
    const initials = name ? name.slice(0, 2).toUpperCase() : '??';
    return (
        <div className={styles.row} style={{ width: size, height: size, background: url ? 'transparent' : 'rgba(167,139,250,0.15)' }}>
            {url
                // eslint-disable-next-line @next/next/no-img-element -- avatars come from arbitrary storage URLs
                ? <img src={url} alt={name} className={styles.image} />
                : <span className={styles.label} style={{ fontSize: size * 0.38 }}>{initials}</span>
            }
        </div>
    );
}
