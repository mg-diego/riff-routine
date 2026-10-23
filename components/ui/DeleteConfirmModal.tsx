"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import styles from './DeleteConfirmModal.module.css';

interface DeleteConfirmModalProps {
  title: string;
  itemName: string;
  warningMessage: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ 
  title, 
  itemName, 
  warningMessage, 
  isDeleting, 
  onConfirm, 
  onCancel 
}: DeleteConfirmModalProps) {
  const t = useTranslations('DeleteConfirmModal');

  return (
    <div className={styles.cancelOverlay}>
      <div className={styles.cancelBox}>
        <h3 className={styles.subheading}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          {title}
        </h3>
        
        <p className={styles.text}>
          {t.rich('question', {
            item: (chunks) => <strong className={styles.strong}>"{itemName}"</strong>
          })}
        </p>
        
        <div className={styles.box}>
          <p className={styles.warningMessageText}>
            ⚠️ {warningMessage}
          </p>
        </div>
        
        <div className={styles.cancelRow}>
          <button 
            onClick={onCancel} 
            disabled={isDeleting}
            className={styles.cancelButton} style={{ cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.5 : 1 }}
          >
            {t('cancel')}
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isDeleting}
            className={styles.deletingButton} style={{ cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.7 : 1 }}
          >
            {isDeleting ? t('deleting') : t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}