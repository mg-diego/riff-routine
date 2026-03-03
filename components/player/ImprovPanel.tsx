"use client";

import React, { useState } from 'react';

const PROGRESSIONS = [
  "I - IV - V (Ej: C - F - G)",
  "ii - V - I (Ej: Dm - G - C)",
  "vi - IV - I - V (Ej: Am - F - C - G)",
  "I - vi - ii - V (Ej: C - Am - Dm - G)"
];

export function ImprovPanel() {
  const [notes, setNotes] = useState('');
  const [progression, setProgression] = useState(PROGRESSIONS[0]);

  const generateProgression = () => {
    const random = PROGRESSIONS[Math.floor(Math.random() * PROGRESSIONS.length)];
    setProgression(random);
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--gold)', margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Generador de Ideas</h3>
        <div style={{ fontSize: '2rem', fontFamily: 'Bebas Neue, sans-serif', color: 'var(--text)', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
          {progression}
        </div>
        <button 
          onClick={generateProgression}
          style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🎲 Otra progresión
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <label style={{ color: 'var(--gold)', fontWeight: 'bold' }}>Bloc de Notas de Composición</label>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anota aquí los acordes, trastes o ideas que te vayan surgiendo..."
          style={{ 
            width: '100%', height: '200px', background: 'var(--surface)', color: 'var(--text)', 
            border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1rem', 
            fontFamily: 'DM Sans, sans-serif', resize: 'vertical', outline: 'none' 
          }}
        />
      </div>
    </div>
  );
}