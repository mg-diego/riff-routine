"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

interface ModalProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ title, subtitle, onClose, children }: ModalProps) {
  const t = useTranslations('Modal');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#161616', border: '1px solid rgba(220,185,138,0.2)',
        borderRadius: '16px', width: '100%', maxWidth: 620,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: 'var(--gold)', margin: 0, letterSpacing: '0.05em' }}>{title}</h2>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.82rem' }}>{subtitle}</p>
          </div>
          <button 
            onClick={onClose} 
            title={t('close')}
            style={{
              background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--muted)',
              width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--muted)'; }}
          >✕</button>
        </div>
        <div style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
      <button onClick={onClose} style={{
        flex: 1, padding: '0.85rem', borderRadius: '8px', cursor: 'pointer',
        background: 'transparent', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif',
        fontWeight: 600, fontSize: '0.95rem', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >{t('cancel')}</button>
      <button onClick={onSubmit} disabled={uploading} style={{
        flex: 2, padding: '0.85rem', borderRadius: '8px', cursor: uploading ? 'not-allowed' : 'pointer',
        background: uploading ? 'rgba(220,185,138,0.3)' : 'var(--gold)',
        color: uploading ? 'var(--muted)' : '#111',
        fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.95rem', border: 'none',
        transition: 'all 0.2s', boxShadow: uploading ? 'none' : '0 4px 14px rgba(220,185,138,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
      }}>
        {uploading ? (
          <>
            <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(220,185,138,0.3)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            {t('saving')}
          </>
        ) : label}
      </button>
    </div>
  );
}