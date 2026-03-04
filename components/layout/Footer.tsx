"use client";

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer style={{
      background: '#0a0a0a',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      padding: '2rem',
      marginTop: 'auto',
      color: 'var(--muted)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🎸</span>
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: 'var(--text)', letterSpacing: '0.05em' }}>
            GUITAR ROUTINE
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
          <Link href="/contacto" style={{ color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            Contacto
          </Link>
          <Link href="/terminos" style={{ color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            Términos
          </Link>
          <Link href="/privacidad" style={{ color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            Privacidad
          </Link>
        </div>

        <div style={{ fontSize: '0.8rem' }}>
          © {new Date().getFullYear()} Guitar Routine. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}