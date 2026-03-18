"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(231,76,60,0.4)', maxWidth: '420px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
        <h3 style={{ color: '#e74c3c', marginTop: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          {title}
        </h3>
        
        <p style={{ color: 'var(--text)', fontSize: '1rem', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
          {t.rich('question', {
            item: (chunks) => <strong style={{ color: '#fff' }}>"{itemName}"</strong>
          })}
        </p>
        
        <div style={{ background: 'rgba(231,76,60,0.1)', padding: '1rem', borderRadius: '8px', border: '1px dashed rgba(231,76,60,0.3)', marginBottom: '2rem' }}>
          <p style={{ color: '#fc8181', margin: 0, fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.4 }}>
            ⚠️ {warningMessage}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button 
            onClick={onCancel} 
            disabled={isDeleting}
            style={{ background: 'transparent', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: isDeleting ? 'not-allowed' : 'pointer', fontWeight: 600, transition: 'all 0.2s', opacity: isDeleting ? 0.5 : 1 }}
          >
            {t('cancel')}
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isDeleting}
            style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: isDeleting ? 'not-allowed' : 'pointer', fontWeight: 600, transition: 'all 0.2s', opacity: isDeleting ? 0.7 : 1 }}
          >
            {isDeleting ? t('deleting') : t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}