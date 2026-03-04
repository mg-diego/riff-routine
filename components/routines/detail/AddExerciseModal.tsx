"use client";

import React, { useState } from 'react';
import { Exercise } from '../../../lib/types';
import { Modal } from '../../ui/Modal';
import { DIFFICULTY_COLORS } from '../../../lib/constants';

interface AddExerciseModalProps {
  exercises: Exercise[];
  onAdd: (exerciseId: string) => void;
  onClose: () => void;
}

export function AddExerciseModal({ exercises, onAdd, onClose }: AddExerciseModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExercises = exercises.filter(ex => 
    ex.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (ex.technique && ex.technique.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Modal title="Añadir Ejercicio" subtitle="Selecciona un ejercicio del catálogo o tu biblioteca personal" onClose={onClose}>
      <input
        type="text"
        placeholder="Buscar por nombre o técnica..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: '100%', padding: '0.9rem 1.2rem', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', outline: 'none', marginBottom: '1.5rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', transition: 'border-color 0.2s' }}
        onFocus={e => e.target.style.borderColor = 'var(--gold)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        autoFocus
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
        {filteredExercises.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.95rem' }}>No se encontraron ejercicios con esa búsqueda.</p>
          </div>
        ) : (
          filteredExercises.map(ex => (
            <div key={ex.id} style={{ display: 'flex', flexDirection: 'column', padding: '1.2rem', background: 'var(--surface)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s', gap: '1rem' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(220,185,138,0.3)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.8rem' }}>
                  <h4 style={{ margin: 0, color: 'var(--text)', fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.2 }}>{ex.title}</h4>
                  {!ex.user_id && (
                    <span style={{ background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      Catálogo
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{ex.technique || 'General'}</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                  <span style={{ color: 'var(--muted)' }}>Dificultad: <strong style={{ color: DIFFICULTY_COLORS[ex.difficulty || 1] }}>{ex.difficulty || 1}</strong></span>
                </div>
              </div>
              
              <button 
                onClick={() => onAdd(ex.id.toString())}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s', fontSize: '0.9rem', marginTop: 'auto' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = '#111'; e.currentTarget.style.borderColor = 'var(--gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                + Añadir
              </button>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}