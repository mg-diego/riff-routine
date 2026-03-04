import React from 'react';

interface RoutinesPageHeaderProps {
  count: number;
  loading: boolean;
  onCreateClick: () => void;
}

export function RoutinesPageHeader({ count, loading, onCreateClick }: RoutinesPageHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>Mis Rutinas</h1>
        <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
          {loading ? 'Cargando...' : `${count} ${count === 1 ? 'rutina' : 'rutinas'} creadas`}
        </p>
      </div>
      <button onClick={onCreateClick} style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        background: 'var(--gold)', color: '#111', padding: '0.8rem 1.5rem',
        borderRadius: '8px', fontWeight: 700, cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', border: 'none',
        boxShadow: '0 4px 14px rgba(220,185,138,0.25)', transition: 'all 0.2s', whiteSpace: 'nowrap',
        width: 'fit-content', flexShrink: 0
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dark)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Nueva Rutina
      </button>
    </div>
  );
}