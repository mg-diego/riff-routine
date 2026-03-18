"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface BecomeProModalProps {
  onClose: () => void;
  description: string;
}

export function BecomeProModal({ onClose, description }: BecomeProModalProps) {
  const router = useRouter();
  const t = useTranslations('BecomeProModal');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#141414', border: '1px solid rgba(220,185,138,0.2)', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--gold)', margin: '0 0 1rem', fontSize: '1.8rem' }}>{t('title')}</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>{description}</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={onClose} 
            style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', borderRadius: '8px', cursor: 'pointer' }}
          >
            {t('close')}
          </button>
          <button 
            onClick={() => router.push('/pro')} 
            style={{ flex: 1, padding: '0.8rem', background: 'var(--gold)', border: 'none', color: '#000', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {t('upgrade')}
          </button>
        </div>
      </div>
    </div>
  );
}