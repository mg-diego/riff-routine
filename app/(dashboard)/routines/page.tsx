"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Routine } from '../../../lib/types';
import { RoutinesPageHeader } from '../../../components/routines/RoutinesPageHeader';
import { RoutineCard } from '../../../components/routines/RoutineCard';
import { CreateRoutineModal } from '../../../components/routines/CreateRoutineModal';

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
      
    if (!error && data) setRoutines(data);
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
      {showCreateModal && (
        <CreateRoutineModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={fetchRoutines} 
        />
      )}

      <RoutinesPageHeader 
        count={routines.length} 
        loading={loading} 
        onCreateClick={() => setShowCreateModal(true)} 
      />

      {error && (
        <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <span className="loader" />
        </div>
      ) : routines.length === 0 ? (
        <div style={{ background: 'var(--surface)', padding: '4rem 2rem', borderRadius: '12px', border: '1px dashed rgba(220,185,138,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏱️</div>
          <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: 600 }}>No tienes rutinas</p>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>Agrupa ejercicios para practicar de forma organizada</p>
        </div>
      ) : (
        /* Cambio de Grid a Flex Column para el diseño de filas */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {routines.map((routine) => (
            <RoutineCard 
              key={routine.id} 
              routine={routine} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      )}

      <style>{`
        .loader { 
          display: inline-block; width: 24px; height: 24px; 
          border: 3px solid rgba(220,185,138,0.3); border-top-color: var(--gold); 
          borderRadius: 50%; animation: spin 0.8s linear infinite; 
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}