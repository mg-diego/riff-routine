"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import styles from './Footer.module.css';

export function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className={styles.logoAltFooter}>
      <div className={styles.logoAltRow}>
        
        <Link href="/home" className={styles.logoAltRowLink}>
          <div className={styles.logoAltRow2}>
            <Image 
              src="/favicon.ico" 
              alt={t('logoAlt')} 
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
          <div className={styles.block}>
            Riff<span className={styles.label}>Routine</span>
          </div>
        </Link>

        <div className={styles.privacyRow}>
          <Link href="/privacy" className={styles.privacyLink}
          >
            {t('privacy')}
          </Link>
          <Link href="/terms" className={styles.privacyLink}
          >
            {t('terms')}
          </Link>
          <Link href="/contact" className={styles.privacyLink}
          >
            {t('contact')}
          </Link>
        </div>

        <div className={styles.copyright}>
          {t('copyright', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}