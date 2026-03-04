import React from 'react';

interface EditButtonProps {
  onClick: () => void;
}

export function EditButton({ onClick }: EditButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        color: 'var(--muted)',
        border: '1px solid rgba(255,255,255,0.08)',
        width: '42px',
        height: '42px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'var(--gold)';
        e.currentTarget.style.borderColor = 'rgba(220,185,138,0.4)';
        e.currentTarget.style.background = 'rgba(220,185,138,0.05)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--muted)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
      }}
      title="Editar"
    >
      <svg style={{ transform: 'scale(1.8)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  );
}