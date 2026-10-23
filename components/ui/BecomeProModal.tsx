"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import styles from './BecomeProModal.module.css';
import ui from '@/components/ui/ui.module.css';

interface BecomeProModalProps {
  onClose: () => void;
  description: string;
}

export function BecomeProModal({ onClose, description }: BecomeProModalProps) {
  const router = useRouter();
  const t = useTranslations('BecomeProModal');

  return (
    <div className={ui.overlayBlur}>
      <div className={styles.titleBox}>
        <h2 className={styles.titleHeading}>{t('title')}</h2>
        <p className={styles.text}>{description}</p>
        <div className={styles.closeRow}>
          <button 
            onClick={onClose} 
            className={styles.closeButton}
          >
            {t('close')}
          </button>
          <button 
            onClick={() => router.push('/pro')} 
            className={styles.upgradeButton}
          >
            {t('upgrade')}
          </button>
        </div>
      </div>
    </div>
  );
}