"use client";

import React from 'react';
import GuitarPlayer from '@/components/player/GuitarPlayer';
import { useTranslations } from 'next-intl';
import styles from './page.module.css';

export default function PracticePage() {
  const t = useTranslations('PracticePage');

  return (
    <div className={styles.titleStack}>
      {/* Título con un poco de padding lateral para que respire */}
      <div className={styles.title}>
        <h1 className="page-title">
          {t('title')}
        </h1>
        <p className="page-subtitle">
          {t('subtitle')}
        </p>
      </div>

      {/* Wrapper totalmente transparente, cediendo el control a GuitarPlayer */}
      <div className={styles.stack}>
        <GuitarPlayer />
      </div>
    </div>
  );
}