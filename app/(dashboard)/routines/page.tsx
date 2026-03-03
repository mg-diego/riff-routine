"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Routine } from '../../../lib/types';
import { Modal, ModalActions } from '../../../components/ui/Modal';

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setRoutines(data);
    }
    
    setLoading(false);
  };

  const handleDelete = async (routine: Routine) => {
    if (!confirm(`¿Eliminar la rutina "${routine.title}"?`)) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error: dbError } = await supabase
        .from('routines')
        .delete()
        .eq('id', routine.id)
        .eq('user_id', user.id);
        
      if (dbError) throw dbError;

      fetchRoutines();
    } catch (e) { 
      setError(e instanceof Error ? e.message : String(e)); 
    }
  };

  return (
    <div>
      {showCreateModal && <CreateRoutineModal onClose={() => setShowCreateModal(false)} onSuccess={fetchRoutines} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>Mis Rutinas</h1>
          <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            {loading ? 'Cargando...' : `${routines.length} ${routines.length === 1 ? 'rutina' : 'rutinas'} creadas`}
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} style={{
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

      {error && (
        <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--muted)' }}>
          <span style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid rgba(220,185,138,0.3)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : routines.length === 0 ? (
        <div style={{ background: 'var(--surface)', padding: '4rem 2rem', borderRadius: '12px', border: '1px dashed rgba(220,185,138,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏱️</div>
          <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: 600 }}>No tienes rutinas</p>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>Agrupa ejercicios para practicar de forma organizada</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {routines.map((routine) => (
            <div key={routine.id} style={{
              background: 'var(--surface)', padding: '1.5rem', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.05)', display: 'flex',
              flexDirection: 'column', gap: '1rem', transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(220,185,138,0.2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
            >
              <div>
                <h3 style={{ color: 'var(--text)', margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 600 }}>{routine.title}</h3>
                {routine.description && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {routine.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                <button
                  onClick={() => window.location.href = `/routines/${routine.id}`}
                  style={{ flex: 1, background: 'var(--gold)', color: '#111', border: 'none', padding: '0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, fontFamily: 'DM Sans, sans-serif', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dark)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}
                >Configurar</button>

                <button
                  onClick={() => handleDelete(routine)}
                  style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.6rem 0.75rem', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#e74c3c'; e.currentTarget.style.borderColor = 'rgba(231,76,60,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  title="Eliminar"
                >🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function CreateRoutineModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) return setError('El nombre es obligatorio.');
    
    try {
      setSaving(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión.');

      const { error: dbError } = await supabase
        .from('routines')
        .insert([{
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null
        }]);

      if (dbError) throw dbError;
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.7rem 0.9rem', borderRadius: '7px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.93rem',
    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
  };

  return (
    <Modal title="Nueva Rutina" subtitle="Crea una colección para organizar tus ejercicios" onClose={onClose}>
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Nombre de la rutina *
        </label>
        <input 
          type="text" 
          value={title} 
          onChange={e => setTitle(e.target.value)}
          placeholder="Ej: Calentamiento Diario" 
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--gold)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} 
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Descripción <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span>
        </label>
        <textarea 
          value={description} 
          onChange={e => setDescription(e.target.value)}
          placeholder="Ej: Rutina de 20 minutos enfocada en precisión..."
          rows={3} 
          style={{ ...inputStyle, resize: 'vertical' }}
          onFocus={e => e.target.style.borderColor = 'var(--gold)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} 
        />
      </div>

      {error && (
        <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem' }}>
          ⚠ {error}
        </div>
      )}

      <ModalActions onClose={onClose} onSubmit={handleSubmit} uploading={saving} label="Crear rutina" />
    </Modal>
  );
}