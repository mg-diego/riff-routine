"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ title, subtitle, onClose, children }: ModalProps) {
  const t = useTranslations('Modal');

  return (
    <div className={styles.closeOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.closeBox}>
        <div className={styles.closeRow}>
          <div>
            <h2 className={styles.heading}>{title}</h2>
            <p className={styles.text}>{subtitle}</p>
          </div>
          <button 
            onClick={onClose} 
            title={t('close')}
            className={styles.closeButton}
          >✕</button>
        </div>
        <div className={styles.stack}>
          {children}
        </div>
      </div>
    </div>
  );
}

interface ModalActionsProps {
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
  uploading: boolean;
  label: string;
}

export function ModalActions({ onClose, onSubmit, uploading, label }: ModalActionsProps) {
  const t = useTranslations('Modal');

  return (
    <div className={styles.cancelRow}>
      <button onClick={onClose} className={styles.cancelButton}
      >{t('cancel')}</button>
      <button onClick={onSubmit} disabled={uploading} className={styles.savingButton} style={{ cursor: uploading ? 'not-allowed' : 'pointer', background: uploading ? 'rgba(220,185,138,0.3)' : 'var(--gold)', color: uploading ? 'var(--muted)' : '#111', boxShadow: uploading ? 'none' : '0 4px 14px rgba(220,185,138,0.25)' }}>
        {uploading ? (
          <>
            <span className={styles.label} />
            {t('saving')}
          </>
        ) : label}
      </button>
    </div>
  );
}