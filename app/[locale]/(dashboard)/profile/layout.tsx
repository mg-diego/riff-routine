import { getLocale, getTranslations } from 'next-intl/server';
import { BackLink } from '@/components/ui/Backlink';
import styles from './layout.module.css';

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getTranslations('Navbar');

  return (
    <div className={styles.homeRow}>
      <div className={styles.home}>

        {/* Top bar */}
        <div className={styles.homeRow2}>
          <BackLink href={`/${locale}/home`} label={t('links.home')} />
        </div>

        {children}

      </div>
    </div>
  );
}