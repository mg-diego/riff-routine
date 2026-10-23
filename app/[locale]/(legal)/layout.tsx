import { getLocale } from 'next-intl/server';
import { BackLink } from '@/components/ui/Backlink';
import styles from './layout.module.css';

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <div className={styles.row}>
      <div className={styles.block}>

        {/* Top bar */}
        <div className={styles.row2}>
          <BackLink href={`/${locale}`} label='RiffRoutine' />
        </div>

        {children}

      </div>
    </div>
  );
}