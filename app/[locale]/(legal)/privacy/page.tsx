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

export default function PrivacyPage() {
  const t = useTranslations('privacy');

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

        {/* Data collected */}
        <SectionBlock title={t('sections.dataCollected.title')}>
          {(['account', 'files', 'progress', 'technical'] as const).map(key => (
            <div key={key} className={styles.block4}>
              <p className={styles.introBoxText}>
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
          <div className={styles.purposeBox}>
            <p className={styles.purposeBoxText}>Supabase</p>
            <p className={styles.purposeText}>{t('sections.dataSharing.providers.0.purpose')}</p>
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