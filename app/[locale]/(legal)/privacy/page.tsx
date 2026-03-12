"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

const CONTACT_EMAIL = 'hello@riffRoutine.com';

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h2 style={{
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: '1.6rem',
        color: 'var(--gold)',
        margin: '0 0 0.75rem 0',
        letterSpacing: '0.03em',
      }}>
        {title}
      </h2>
      <div style={{ borderLeft: '3px solid rgba(220,185,138,0.25)', paddingLeft: '1.25rem' }}>
        {children}
      </div>
    </div>
  );
}

function BodyText({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.75, margin: '0 0 0.75rem 0' }}>
      {children}
    </p>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {items.map((item, i) => (
        <li key={i} style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  const t = useTranslations('privacy');

  return (
    <div style={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Hero */}
      <div style={{ marginBottom: '2rem', flexShrink: 0 }}>
        <p style={{ color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 0.4rem 0', opacity: 0.7 }}>
          {t('hero.label')}
        </p>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
          {t('hero.title')}
        </h1>
        <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.85rem' }}>
          {t('hero.lastUpdated')}
        </p>
      </div>

      {/* Content card */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        padding: '2.5rem',
        maxWidth: '780px',
        width: '100%',
      }}>
        <BodyText>{t('intro')}</BodyText>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '2rem 0' }} />

        {/* Data collected */}
        <SectionBlock title={t('sections.dataCollected.title')}>
          {(['account', 'files', 'progress', 'technical'] as const).map(key => (
            <div key={key} style={{ marginBottom: '1rem' }}>
              <p style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
                {t(`sections.dataCollected.items.${key}.title`)}
              </p>
              <BodyText>{t(`sections.dataCollected.items.${key}.description`)}</BodyText>
            </div>
          ))}
        </SectionBlock>

        {/* How we use */}
        <SectionBlock title={t('sections.howWeUse.title')}>
          <BulletList items={[
            t('sections.howWeUse.items.0'),
            t('sections.howWeUse.items.1'),
            t('sections.howWeUse.items.2'),
            t('sections.howWeUse.items.3'),
            t('sections.howWeUse.items.4'),
          ]} />
        </SectionBlock>

        {/* Storage */}
        <SectionBlock title={t('sections.dataStorage.title')}>
          <BodyText>{t('sections.dataStorage.description')}</BodyText>
        </SectionBlock>

        {/* Sharing */}
        <SectionBlock title={t('sections.dataSharing.title')}>
          <BodyText>{t('sections.dataSharing.description')}</BodyText>
          <div style={{ background: 'rgba(220,185,138,0.05)', border: '1px solid rgba(220,185,138,0.15)', borderRadius: '8px', padding: '0.85rem 1.1rem', marginTop: '0.75rem' }}>
            <p style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.85rem', margin: '0 0 0.2rem 0' }}>Supabase</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>{t('sections.dataSharing.providers.0.purpose')}</p>
          </div>
        </SectionBlock>

        {/* Retention */}
        <SectionBlock title={t('sections.retention.title')}>
          <BodyText>{t('sections.retention.description')}</BodyText>
        </SectionBlock>

        {/* Rights */}
        <SectionBlock title={t('sections.rights.title')}>
          <BodyText>{t('sections.rights.description')}</BodyText>
          <BulletList items={[
            t('sections.rights.items.0'),
            t('sections.rights.items.1'),
            t('sections.rights.items.2'),
            t('sections.rights.items.3'),
            t('sections.rights.items.4'),
          ]} />
          <BodyText>
            {t('sections.rights.contact', { email: CONTACT_EMAIL })}
          </BodyText>
        </SectionBlock>

        {/* Cookies */}
        <SectionBlock title={t('sections.cookies.title')}>
          <BodyText>{t('sections.cookies.description')}</BodyText>
        </SectionBlock>

        {/* Changes */}
        <SectionBlock title={t('sections.changes.title')}>
          <BodyText>{t('sections.changes.description')}</BodyText>
        </SectionBlock>

        {/* Contact */}
        <SectionBlock title={t('sections.contact.title')}>
          <BodyText>
            {t('sections.contact.description', { email: CONTACT_EMAIL })}
          </BodyText>
        </SectionBlock>
      </div>
    </div>
  );
}