"use client";

import React from 'react';
import GuitarPlayer from '../../../components/player/GuitarPlayer';

export default function PracticePage() {
  return (
    <div style={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
          Sala de Práctica
        </h1>
        <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
          Concéntrate en tu técnica, sigue el metrónomo y domina el ejercicio.
        </p>
      </div>

      <div style={{ 
        background: 'var(--surface)', 
        borderRadius: '12px', 
        border: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden',
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        width: '100%',
        minWidth: 0 
      }}>
        <GuitarPlayer />
      </div>
    </div>
  );
}