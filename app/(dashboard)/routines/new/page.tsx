"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { Exercise } from '../../../../lib/types';

interface SelectedExercise {
  id: string;
  title: string;
  technique: string;
  durationMinutes: number | string;
  targetBpm: number | string;
  hasFile: boolean;
}

export default function CreateRoutinePage() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoadingExercises(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('exercises')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAllExercises(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleAddExercise = (ex: Exercise) => {
    if (selectedExercises.find(item => item.id === ex.id)) return;
    
    setSelectedExercises(prev => [...prev, {
      id: ex.id,
      title: ex.title,
      technique: ex.technique || '',
      durationMinutes: 5,
      targetBpm: ex.bpm_goal || '',
      hasFile: !!ex.file_url
    }]);
  };

  const handleRemoveExercise = (id: string) => {
    setSelectedExercises(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateExercise = (id: string, field: keyof SelectedExercise, value: string | number) => {
    setSelectedExercises(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return setError('El nombre de la rutina es obligatorio.');
    
    try {
      setSaving(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión.');

      const { data: routineData, error: routineError } = await supabase
        .from('routines')
        .insert([{
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null
        }])
        .select()
        .single();

      if (routineError) throw routineError;

      if (selectedExercises.length > 0) {
        const routineExercisesToInsert = selectedExercises.map((ex, index) => {
          const mins = parseInt(String(ex.durationMinutes), 10);
          const bpm = parseInt(String(ex.targetBpm), 10);
          
          return {
            routine_id: routineData.id,
            exercise_id: ex.id,
            order_index: index,
            target_duration_seconds: isNaN(mins) ? 300 : mins * 60,
            target_bpm: isNaN(bpm) ? null : bpm
          };
        });

        const { error: insertExercisesError } = await supabase
          .from('routine_exercises')
          .insert(routineExercisesToInsert);

        if (insertExercisesError) throw insertExercisesError;
      }
      
      router.push(`/routines/${routineData.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  };

  const filteredExercises = allExercises.filter(ex => 
    ex.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (ex.technique && ex.technique.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '1rem', borderRadius: '8px',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem',
    outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      <button
        onClick={() => router.push('/routines')}
        style={{
          background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem',
          padding: 0, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Volver a mis rutinas
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: 'var(--gold)', margin: '0 0 1.5rem 0', lineHeight: 1 }}>
              Crear Rutina
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Descripción <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span>
                </label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ej: Rutina enfocada en ganar velocidad..."
                  rows={3} 
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} 
                />
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: 'var(--text)', margin: 0, lineHeight: 1 }}>
                Ejercicios Seleccionados
              </h2>
              <span style={{ background: 'var(--gold)', color: '#111', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
                {selectedExercises.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedExercises.length === 0 ? (
                <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>Añade ejercicios desde la biblioteca a la derecha.</p>
                </div>
              ) : (
                selectedExercises.map((ex, index) => (
                  <div key={ex.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700 }}>#{index + 1}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <p style={{ color: 'var(--text)', margin: 0, fontWeight: 600 }}>{ex.title}</p>
                          {!ex.hasFile && <span title="Este ejercicio no tiene tablatura interactiva" style={{ fontSize: '0.9rem', cursor: 'help' }}>⚠️</span>}
                        </div>
                      </div>
                      <button onClick={() => handleRemoveExercise(ex.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: '0.2rem' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Minutos</label>
                        <input 
                          type="number" 
                          value={ex.durationMinutes} 
                          onChange={e => handleUpdateExercise(ex.id, 'durationMinutes', e.target.value)}
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', outline: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>BPM Objetivo</label>
                        <input 
                          type="number" 
                          value={ex.targetBpm} 
                          onChange={e => handleUpdateExercise(ex.id, 'targetBpm', e.target.value)}
                          placeholder="Opcional"
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {error && (
              <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginTop: '1.5rem' }}>
                ⚠ {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                width: '100%', padding: '1rem', background: 'var(--gold)', color: '#111', marginTop: '1.5rem',
                border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem',
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif',
                opacity: saving ? 0.7 : 1, transition: 'background 0.2s'
              }}
            >
              {saving ? 'Guardando...' : 'Guardar Rutina'}
            </button>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: '2rem', height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: 'var(--text)', margin: '0 0 1.5rem 0', lineHeight: 1 }}>
            Biblioteca
          </h2>

          <input
            type="text"
            placeholder="Buscar por nombre o técnica..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, marginBottom: '1rem', padding: '0.8rem 1rem' }}
          />

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
            {loadingExercises ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem 0' }}>Cargando biblioteca...</p>
            ) : filteredExercises.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem 0' }}>No se encontraron ejercicios.</p>
            ) : (
              filteredExercises.map(ex => {
                const isSelected = selectedExercises.some(item => item.id === ex.id);
                const hasNoFile = !ex.file_url;

                return (
                  <div 
                    key={ex.id}
                    onClick={() => { if (!isSelected) handleAddExercise(ex); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1rem', borderRadius: '8px', cursor: isSelected ? 'default' : 'pointer', transition: 'all 0.2s',
                      background: 'rgba(255,255,255,0.02)', 
                      border: isSelected ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.05)',
                      opacity: isSelected ? 0.5 : 1
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <p style={{ color: 'var(--text)', margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>
                        {ex.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.8rem' }}>
                          {ex.technique || 'Sin categoría'}
                        </p>
                        {hasNoFile && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            ⚠️ Sin GP
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      disabled={isSelected}
                      style={{ 
                        width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                        background: isSelected ? 'transparent' : 'var(--gold)', 
                        color: isSelected ? 'var(--gold)' : '#111',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isSelected ? 'default' : 'pointer'
                      }}
                    >
                      {isSelected ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}