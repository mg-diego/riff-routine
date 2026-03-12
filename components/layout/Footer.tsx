"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer style={{
      background: 'var(--bg, #0d0d0d)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      padding: '3rem',
      marginTop: 'auto',
      color: 'var(--muted, rgba(240,232,220,0.45))',
      fontFamily: 'DM Sans, sans-serif',
      position: 'relative',
      zIndex: 2
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        
        <Link href="/home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '20px',
            height: '20px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.8
          }}>
            <Image 
              src="/favicon.ico" 
              alt={t('logoAlt')} 
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
          <div style={{ 
            fontFamily: 'Bebas Neue, sans-serif', 
            fontSize: '1.2rem', 
            color: 'var(--gold, #dcb98a)', 
            letterSpacing: '0.05em' 
          }}>
            Riff<span style={{ color: 'var(--text, #f0e8dc)' }}>Routine</span>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.82rem' }}>
          <Link href="/privacy" style={{ color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text, #f0e8dc)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            {t('privacy')}
          </Link>
          <Link href="/terms" style={{ color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text, #f0e8dc)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            {t('terms')}
          </Link>
          <Link href="/contact" style={{ color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text, #f0e8dc)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            {t('contact')}
          </Link>
        </div>

        <div style={{ fontSize: '0.82rem' }}>
          {t('copyright', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}