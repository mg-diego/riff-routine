"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Exercise } from '../../../lib/types';
import { TECHNIQUES, DIFFICULTY_LABELS } from '../../../lib/constants';
import { UploadModal } from '../../../components/library/UploadModal';
import { EditModal } from '../../../components/library/EditModal';
import { ExerciseCard } from '../../../components/library/ExerciseCard';
import { ExerciseRow } from '../../../components/library/ExerciseRow';

export default function LibraryPage() {
  const router = useRouter();
  const [files, setFiles] = useState<Exercise[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [editTarget, setEditTarget] = useState<Exercise | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'rows'>('cards');

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<number | ''>('');

  useEffect(() => { 
    fetchExercises(); 
  }, []);

  const fetchExercises = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase
      .from('exercises').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setFiles(data);
    }
    
    setLoading(false);
  };

  const handleDelete = async (exercise: Exercise) => {
    if (!confirm(`¿Eliminar "${exercise.title}"?`)) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (exercise.file_url) {
        const url = new URL(exercise.file_url);
        const parts = url.pathname.split('/');
        const bucketIndex = parts.indexOf('guitar_tabs');
        if (bucketIndex !== -1) {
          const storagePath = parts.slice(bucketIndex + 1).join('/');
          const { error: storageError } = await supabase.storage.from('guitar_tabs').remove([storagePath]);
          if (storageError) console.warn(storageError.message);
        }
      }

      const { error: dbError } = await supabase.from('exercises')
        .delete().eq('id', exercise.id).eq('user_id', user.id);
      if (dbError) throw dbError;

      fetchExercises();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter ? file.technique?.includes(categoryFilter) : true;
    const matchesDiff = difficultyFilter !== '' ? file.difficulty === difficultyFilter : true;
    return matchesSearch && matchesCat && matchesDiff;
  });

  return (
    <div>
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={fetchExercises} />}
      {editTarget && <EditModal exercise={editTarget} onClose={() => setEditTarget(null)} onSuccess={fetchExercises} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>Biblioteca</h1>
          <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            {loading ? 'Cargando ejercicios...' : `${files.length} ${files.length === 1 ? 'ejercicio' : 'ejercicios'} guardados`}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setShowUpload(true)} style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'var(--gold)', color: '#111', padding: '0.8rem 1.5rem',
            borderRadius: '8px', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', border: 'none',
            boxShadow: '0 4px 14px rgba(220,185,138,0.25)', transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dark)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo ejercicio
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Buscar por nombre..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            flex: '1 1 250px', padding: '0.8rem 1rem', borderRadius: '8px',
            background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        <select 
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{
            flex: '0 1 180px', padding: '0.8rem 1rem', borderRadius: '8px',
            background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
            color: categoryFilter ? 'var(--text)' : 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem',
            outline: 'none', cursor: 'pointer'
          }}
        >
          <option value="">Todas las técnicas</option>
          {TECHNIQUES.map(tech => (
            <option key={tech} value={tech} style={{ color: 'var(--text)' }}>{tech}</option>
          ))}
        </select>
        <select 
          value={difficultyFilter}
          onChange={e => setDifficultyFilter(e.target.value === '' ? '' : Number(e.target.value))}
          style={{
            flex: '0 1 180px', padding: '0.8rem 1rem', borderRadius: '8px',
            background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
            color: difficultyFilter !== '' ? 'var(--text)' : 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem',
            outline: 'none', cursor: 'pointer'
          }}
        >
          <option value="">Cualquier dificultad</option>
          {[1, 2, 3, 4, 5].map(n => (
            <option key={n} value={n} style={{ color: 'var(--text)' }}>Nv. {n} - {DIFFICULTY_LABELS[n]}</option>
          ))}
        </select>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.2rem', marginLeft: 'auto' }}>
          <button 
            onClick={() => setViewMode('cards')}
            style={{
              background: viewMode === 'cards' ? 'var(--surface2)' : 'transparent',
              color: viewMode === 'cards' ? 'var(--gold)' : 'var(--muted)',
              border: 'none', padding: '0.5rem 0.8rem', borderRadius: '6px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }}
            title="Vista de cuadrícula"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <button 
            onClick={() => setViewMode('rows')}
            style={{
              background: viewMode === 'rows' ? 'var(--surface2)' : 'transparent',
              color: viewMode === 'rows' ? 'var(--gold)' : 'var(--muted)',
              border: 'none', padding: '0.5rem 0.8rem', borderRadius: '6px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }}
            title="Vista de lista"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
        </div>
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
      ) : files.length === 0 ? (
        <div style={{ background: 'var(--surface)', padding: '4rem 2rem', borderRadius: '12px', border: '1px dashed rgba(220,185,138,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎸</div>
          <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: 600 }}>Tu biblioteca está vacía</p>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>Sube tu primer ejercicio para empezar</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div style={{ background: 'var(--surface)', padding: '4rem 2rem', borderRadius: '12px', border: '1px dashed rgba(220,185,138,0.3)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: 600 }}>No hay coincidencias</p>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>Prueba a cambiar los filtros o el término de búsqueda</p>
          <button 
            onClick={() => { setSearchTerm(''); setCategoryFilter(''); setDifficultyFilter(''); }}
            style={{ marginTop: '1rem', background: 'transparent', color: 'var(--gold)', border: '1px solid var(--gold)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div style={{ 
          display: viewMode === 'cards' ? 'grid' : 'flex', 
          gridTemplateColumns: viewMode === 'cards' ? 'repeat(auto-fill, minmax(260px, 1fr))' : 'none',
          flexDirection: viewMode === 'rows' ? 'column' : 'row',
          gap: '1.2rem' 
        }}>
          {filteredFiles.map((file) => (
            viewMode === 'cards' ? (
              <ExerciseCard key={file.id} file={file} onEdit={setEditTarget} onDelete={handleDelete} />
            ) : (
              <ExerciseRow key={file.id} file={file} onEdit={setEditTarget} onDelete={handleDelete} />
            )
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        :root {
          --gold: #dcb98a; --gold-dark: #b8945f;
          --surface: #1c1c1c; --surface2: #252525;
          --text: #f0e8dc; --muted: #6a5f52;
        }
      `}</style>
    </div>
  );
}