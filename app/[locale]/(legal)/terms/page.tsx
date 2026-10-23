"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import styles from './page.module.css';
import ui from '@/components/ui/ui.module.css';

const CONTACT_EMAIL = 'hello@riffRoutine.com';

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.block}>
      <h2 className={styles.heading}>
        {title}
      </h2>
      <div className={styles.block2}>
        {children}
      </div>
    </div>
  );
}

function BodyText({ children }: { children: React.ReactNode }) {
  return (
    <p className={styles.text}>
      {children}
    </p>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className={styles.list}>
      {items.map((item, i) => (
        <li key={i} className={styles.item}>{item}</li>
      ))}
    </ul>
  );
}

export default function TermsPage() {
  const t = useTranslations('terms');

  return (
    <div className={styles.labelStack}>

      {/* Hero */}
      <div className={styles.label}>
        <p className={ui.eyebrow}>
          {t('hero.label')}
        </p>
        <h1 className="page-title">
          {t('hero.title')}
        </h1>
        <p className={styles.lastUpdatedText}>
          {t('hero.lastUpdated')}
        </p>
      </div>

      {/* Content card */}
      <div className={styles.introBox}>
        <BodyText>{t('intro')}</BodyText>

        <div className={styles.introBoxBlock} />

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