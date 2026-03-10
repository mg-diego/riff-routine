"use client";

import React from 'react';
import Link from 'next/link';

export function Footer() {
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
        
        {/* Logo igual que Landing y Nav */}
        <Link href="/home" style={{ textDecoration: 'none' }}>
          <div style={{ 
            fontFamily: 'Bebas Neue, sans-serif', 
            fontSize: '1.2rem', 
            color: 'var(--gold, #dcb98a)', 
            letterSpacing: '0.05em' 
          }}>
            Riff<span style={{ color: 'var(--text, #f0e8dc)' }}>Routine</span>
          </div>
        </Link>

        {/* Links */}
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.82rem' }}>
          <Link href="/privacidad" style={{ color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text, #f0e8dc)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            Privacidad
          </Link>
          <Link href="/terminos" style={{ color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text, #f0e8dc)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            Términos
          </Link>
          <Link href="/contacto" style={{ color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text, #f0e8dc)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            Contacto
          </Link>
        </div>

        {/* Copyright */}
        <div style={{ fontSize: '0.82rem' }}>
          © {new Date().getFullYear()} RiffRoutine. Hecho para guitarristas.
        </div>
      </div>
    </footer>
  );
}