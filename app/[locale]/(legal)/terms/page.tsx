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

export default function TermsPage() {
  const t = useTranslations('terms');

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

        {/* Service */}
        <SectionBlock title={t('sections.service.title')}>
          <BodyText>{t('sections.service.description')}</BodyText>
        </SectionBlock>

        {/* Account */}
        <SectionBlock title={t('sections.account.title')}>
          <BulletList items={[
            t('sections.account.items.0'),
            t('sections.account.items.1'),
            t('sections.account.items.2'),
            t('sections.account.items.3'),
          ]} />
        </SectionBlock>

        {/* Content */}
        <SectionBlock title={t('sections.content.title')}>
          <BodyText>{t('sections.content.description')}</BodyText>
        </SectionBlock>

        {/* Acceptable use */}
        <SectionBlock title={t('sections.acceptable.title')}>
          <BodyText>{t('sections.acceptable.description')}</BodyText>
          <BulletList items={[
            t('sections.acceptable.items.0'),
            t('sections.acceptable.items.1'),
            t('sections.acceptable.items.2'),
            t('sections.acceptable.items.3'),
            t('sections.acceptable.items.4'),
          ]} />
        </SectionBlock>

        {/* Availability */}
        <SectionBlock title={t('sections.availability.title')}>
          <BodyText>{t('sections.availability.description')}</BodyText>
        </SectionBlock>

        {/* Termination */}
        <SectionBlock title={t('sections.termination.title')}>
          <BodyText>{t('sections.termination.description')}</BodyText>
        </SectionBlock>

        {/* Disclaimer */}
        <SectionBlock title={t('sections.disclaimer.title')}>
          <BodyText>{t('sections.disclaimer.description')}</BodyText>
        </SectionBlock>

        {/* Liability */}
        <SectionBlock title={t('sections.liability.title')}>
          <BodyText>{t('sections.liability.description')}</BodyText>
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