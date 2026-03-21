"use client";

import React from 'react';
import GuitarPlayer from '../../../../components/player/GuitarPlayer';
import { useTranslations } from 'next-intl';

export default function PracticePage() {
  const t = useTranslations('PracticePage');

  return (
    <div style={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%' // Aseguramos que el contenedor base pueda crecer
    }}>
      {/* Título con un poco de padding lateral para que respire */}
      <div style={{ marginBottom: '1.5rem', flexShrink: 0, padding: '0 0.5rem' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
          {t('title')}
        </h1>
        <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
          {t('subtitle')}
        </p>
      </div>

      {/* Wrapper totalmente transparente, cediendo el control a GuitarPlayer */}
      <div style={{ 
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <GuitarPlayer />
      </div>
    </div>
  );
}