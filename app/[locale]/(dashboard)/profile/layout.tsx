import { getLocale, getTranslations } from 'next-intl/server';
import { BackLink } from '../../../../components/ui/Backlink';

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getTranslations('Navbar');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '860px' }}>

        {/* Top bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2.5rem',
        }}>
          <BackLink href={`/${locale}/home`} label={t('links.home')} />
        </div>

        {children}

      </div>
    </div>
  );
}