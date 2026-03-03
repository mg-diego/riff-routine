"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

const TECHNIQUES = [
  'Alternate Picking', 'Down Picking', 'Legato', 'Tapping',
  'Sweep Picking', 'Rythm', 'Song', 'Solo', 'Hybrid Picking',
  'String Skipping', 'Warm-up', 'Lick', 'Bending', 'Vibrato'
];

const DIFFICULTY_LABELS = { 1: 'Principiante', 2: 'Básico', 3: 'Intermedio', 4: 'Avanzado', 5: 'Experto' };
const DIFFICULTY_COLORS = { 1: '#4ade80', 2: '#a3e635', 3: '#facc15', 4: '#fb923c', 5: '#f87171' };

const labelStyle = {
  display: 'block', fontSize: '0.8rem', fontWeight: 700,
  color: 'var(--text)', letterSpacing: '0.04em', textTransform: 'uppercase',
  marginBottom: '0.5rem',
};
const inputStyle = {
  width: '100%', padding: '0.7rem 0.9rem', borderRadius: '7px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.93rem',
  outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
};

// ─── Shared form fields used by both Upload and Edit modals ──────────────────
function ExerciseForm({ name, setName, categories, setCategories, bpmInit, setBpmInit,
  bpmGoal, setBpmGoal, difficulty, setDifficulty, notes, setNotes }) {

  const toggleCategory = (cat) =>
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  return (
    <>
      {/* Nombre */}
      <div>
        <label style={labelStyle}>Nombre del ejercicio *</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Ej: Sweep picking en Am" style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--gold)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
      </div>

      {/* Categorías */}
      <div>
        <label style={labelStyle}>
          Categorías *
          {categories.length > 0 && <span style={{ color: 'var(--gold)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>{categories.length} seleccionadas</span>}
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.5rem' }}>
          {TECHNIQUES.map(cat => {
            const active = categories.includes(cat);
            return (
              <button key={cat} onClick={() => toggleCategory(cat)} style={{
                padding: '0.35rem 0.85rem', borderRadius: '20px', cursor: 'pointer',
                fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                transition: 'all 0.15s', border: 'none',
                background: active ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                color: active ? '#111' : 'var(--muted)',
                boxShadow: active ? '0 2px 8px rgba(220,185,138,0.3)' : 'none',
                transform: active ? 'scale(1.03)' : 'scale(1)',
              }}>{cat}</button>
            );
          })}
        </div>
      </div>

      {/* BPM */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>BPM Inicial <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
          <input type="number" min="20" max="300" value={bpmInit} onChange={e => setBpmInit(e.target.value)}
            placeholder="Ej: 60" style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--gold)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>
        <div>
          <label style={labelStyle}>BPM Objetivo <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
          <input type="number" min="20" max="300" value={bpmGoal} onChange={e => setBpmGoal(e.target.value)}
            placeholder="Ej: 120" style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--gold)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>
      </div>

      {/* Dificultad */}
      <div>
        <label style={labelStyle}>
          Dificultad
          <span style={{ marginLeft: '0.6rem', color: DIFFICULTY_COLORS[difficulty], fontWeight: 700 }}>
            {difficulty} — {DIFFICULTY_LABELS[difficulty]}
          </span>
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setDifficulty(n)} style={{
              flex: 1, padding: '0.6rem 0', borderRadius: '6px', cursor: 'pointer',
              border: 'none', fontWeight: 700, fontSize: '1rem',
              fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
              background: difficulty >= n ? DIFFICULTY_COLORS[n] : 'rgba(255,255,255,0.05)',
              color: difficulty >= n ? '#111' : 'var(--muted)',
              transform: difficulty === n ? 'scale(1.08)' : 'scale(1)',
              boxShadow: difficulty === n ? `0 4px 12px ${DIFFICULTY_COLORS[n]}55` : 'none',
            }}>{n}</button>
          ))}
        </div>
      </div>

      {/* Notas */}
      <div>
        <label style={labelStyle}>Notas / Observaciones <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Ej: Practicar lento con metrónomo, prestar atención al cambio de cuerda..."
          rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          onFocus={e => e.target.style.borderColor = 'var(--gold)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
      </div>
    </>
  );
}

// ─── Modal base ───────────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#161616', border: '1px solid rgba(220,185,138,0.2)',
        borderRadius: '16px', width: '100%', maxWidth: 620,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: 'var(--gold)', margin: 0, letterSpacing: '0.05em' }}>{title}</h2>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.82rem' }}>{subtitle}</p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--muted)',
            width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--muted)'; }}
          >✕</button>
        </div>
        <div style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, onSuccess }) {
  const inputRef = useRef(null);
  const [file,       setFile]       = useState(null);
  const [name,       setName]       = useState('');
  const [categories, setCategories] = useState([]);
  const [bpmInit,    setBpmInit]    = useState('');
  const [bpmGoal,    setBpmGoal]    = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [notes,      setNotes]      = useState('');
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState(null);
  const [dragOver,   setDragOver]   = useState(false);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files[0] || e.target.files[0];
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['gp','gp3','gp4','gp5','gpx'].includes(ext)) {
      setError('Formato inválido. Usa .gp, .gp3, .gp4, .gp5 o .gpx');
      return;
    }
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^/.]+$/, ''));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) return setError('Selecciona un archivo primero.');
    if (!name.trim()) return setError('El nombre es obligatorio.');
    if (categories.length === 0) return setError('Selecciona al menos una categoría.');
    try {
      setUploading(true); setError(null);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Debes iniciar sesión.');
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('guitar_tabs').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('guitar_tabs').getPublicUrl(filePath);
      const { error: dbError } = await supabase.from('exercises').insert([{
        user_id: user.id, title: name.trim(), file_url: publicUrl,
        technique: categories.join(', '),
        bpm_initial: bpmInit ? parseInt(bpmInit) : null,
        bpm_goal:    bpmGoal ? parseInt(bpmGoal) : null,
        difficulty, notes: notes.trim() || null,
      }]);
      if (dbError) throw dbError;
      onSuccess(); onClose();
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  };

  return (
    <Modal title="Nuevo Ejercicio" subtitle="Sube un archivo Guitar Pro y configura sus metadatos" onClose={onClose}>
      {/* Drop zone */}
      <div
        onDrop={handleFileDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--gold)' : file ? 'rgba(74,222,128,0.5)' : 'rgba(220,185,138,0.3)'}`,
          borderRadius: '10px', padding: '1.75rem', textAlign: 'center', cursor: 'pointer',
          background: dragOver ? 'rgba(220,185,138,0.05)' : file ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.2s',
        }}
      >
        <input ref={inputRef} type="file" accept=".gp,.gp3,.gp4,.gp5,.gpx" onChange={handleFileDrop} hidden />
        {file ? (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🎵</div>
            <p style={{ color: '#4ade80', margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{file.name}</p>
            <p style={{ color: 'var(--muted)', margin: '0.25rem 0 0', fontSize: '0.78rem' }}>{(file.size / 1024).toFixed(1)} KB · Clic para cambiar</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎸</div>
            <p style={{ color: 'var(--gold)', margin: 0, fontWeight: 600 }}>Arrastra tu archivo aquí</p>
            <p style={{ color: 'var(--muted)', margin: '0.3rem 0 0', fontSize: '0.8rem' }}>.gp · .gp3 · .gp4 · .gp5 · .gpx</p>
          </>
        )}
      </div>

      <ExerciseForm {...{ name, setName, categories, setCategories, bpmInit, setBpmInit, bpmGoal, setBpmGoal, difficulty, setDifficulty, notes, setNotes }} />

      {error && (
        <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem' }}>
          ⚠ {error}
        </div>
      )}

      <ModalActions onClose={onClose} onSubmit={handleSubmit} uploading={uploading} label="Guardar ejercicio" />
    </Modal>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ exercise, onClose, onSuccess }) {
  const [name,       setName]       = useState(exercise.title || '');
  const [categories, setCategories] = useState(exercise.technique ? exercise.technique.split(', ') : []);
  const [bpmInit,    setBpmInit]    = useState(exercise.bpm_initial || '');
  const [bpmGoal,    setBpmGoal]    = useState(exercise.bpm_goal || '');
  const [difficulty, setDifficulty] = useState(exercise.difficulty || 3);
  const [notes,      setNotes]      = useState(exercise.notes || '');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState(null);

  const handleSubmit = async () => {
    if (!name.trim()) return setError('El nombre es obligatorio.');
    if (categories.length === 0) return setError('Selecciona al menos una categoría.');
    try {
      setSaving(true); setError(null);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Debes iniciar sesión.');
      const { error: dbError } = await supabase.from('exercises')
        .update({
          title: name.trim(),
          technique: categories.join(', '),
          bpm_initial: bpmInit ? parseInt(bpmInit) : null,
          bpm_goal:    bpmGoal ? parseInt(bpmGoal) : null,
          difficulty, notes: notes.trim() || null,
        })
        .eq('id', exercise.id)
        .eq('user_id', user.id);
      if (dbError) throw dbError;
      onSuccess(); onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Editar Ejercicio" subtitle={`Editando: ${exercise.title}`} onClose={onClose}>
      <ExerciseForm {...{ name, setName, categories, setCategories, bpmInit, setBpmInit, bpmGoal, setBpmGoal, difficulty, setDifficulty, notes, setNotes }} />

      {error && (
        <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem' }}>
          ⚠ {error}
        </div>
      )}

      <ModalActions onClose={onClose} onSubmit={handleSubmit} uploading={saving} label="Guardar cambios" />
    </Modal>
  );
}

// ─── Modal action buttons (shared) ───────────────────────────────────────────
function ModalActions({ onClose, onSubmit, uploading, label }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
      <button onClick={onClose} style={{
        flex: 1, padding: '0.85rem', borderRadius: '8px', cursor: 'pointer',
        background: 'transparent', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif',
        fontWeight: 600, fontSize: '0.95rem', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >Cancelar</button>
      <button onClick={onSubmit} disabled={uploading} style={{
        flex: 2, padding: '0.85rem', borderRadius: '8px', cursor: uploading ? 'not-allowed' : 'pointer',
        background: uploading ? 'rgba(220,185,138,0.3)' : 'var(--gold)',
        color: uploading ? 'var(--muted)' : '#111',
        fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.95rem', border: 'none',
        transition: 'all 0.2s', boxShadow: uploading ? 'none' : '0 4px 14px rgba(220,185,138,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
      }}>
        {uploading ? (
          <>
            <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(220,185,138,0.3)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Guardando…
          </>
        ) : label}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LibraryPage() {
  const [files,       setFiles]       = useState([]);
  const [showUpload,  setShowUpload]  = useState(false);
  const [editTarget,  setEditTarget]  = useState(null); // exercise object to edit
  const [error,       setError]       = useState(null);

  useEffect(() => { fetchExercises(); }, []);

  const fetchExercises = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('exercises').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error) setFiles(data);
  };

  const handleDelete = async (exercise) => {
    if (!confirm(`¿Eliminar "${exercise.title}"?`)) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // FIX: extraer el storage path correctamente desde la URL pública de Supabase
      // La URL tiene forma: .../storage/v1/object/public/guitar_tabs/USER_ID/FILE.gp
      const url = new URL(exercise.file_url);
      const parts = url.pathname.split('/');
      const bucketIndex = parts.indexOf('guitar_tabs');
      const storagePath = parts.slice(bucketIndex + 1).join('/');

      const { error: storageError } = await supabase.storage.from('guitar_tabs').remove([storagePath]);
      if (storageError) console.warn('Storage delete error (non-blocking):', storageError.message);

      const { error: dbError } = await supabase.from('exercises')
        .delete().eq('id', exercise.id).eq('user_id', user.id);
      if (dbError) throw dbError;

      fetchExercises();
    } catch (e) { setError(e.message); }
  };

  return (
    <div>
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={fetchExercises} />}
      {editTarget && <EditModal exercise={editTarget} onClose={() => setEditTarget(null)} onSuccess={fetchExercises} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>Biblioteca</h1>
          <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            {files.length} {files.length === 1 ? 'ejercicio' : 'ejercicios'} guardados
          </p>
        </div>
        <button onClick={() => setShowUpload(true)} style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          background: 'var(--gold)', color: '#111', padding: '0.8rem 1.5rem',
          borderRadius: '8px', fontWeight: 700, cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', border: 'none',
          boxShadow: '0 4px 14px rgba(220,185,138,0.25)', transition: 'all 0.2s', whiteSpace: 'nowrap',
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

      {error && (
        <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Empty state */}
      {files.length === 0 ? (
        <div style={{ background: 'var(--surface)', padding: '4rem 2rem', borderRadius: '12px', border: '1px dashed rgba(220,185,138,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎸</div>
          <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: 600 }}>Tu biblioteca está vacía</p>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>Sube tu primer ejercicio para empezar</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.2rem' }}>
          {files.map((file) => {
            const cats = file.technique ? file.technique.split(', ') : [];
            const diff = file.difficulty || 1;
            return (
              <div key={file.id} style={{
                background: 'var(--surface)', padding: '1.4rem', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.05)', display: 'flex',
                flexDirection: 'column', gap: '0.85rem', transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(220,185,138,0.2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
              >
                {/* Title + difficulty */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '1rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={file.title}>
                    {file.title}
                  </h3>
                  <span style={{
                    background: DIFFICULTY_COLORS[diff] + '22', color: DIFFICULTY_COLORS[diff],
                    border: `1px solid ${DIFFICULTY_COLORS[diff]}44`,
                    borderRadius: '4px', padding: '0.15rem 0.5rem', fontSize: '0.72rem',
                    fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                  }}>Nv. {diff}</span>
                </div>

                {/* Categories */}
                {cats.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {cats.slice(0, 3).map(cat => (
                      <span key={cat} style={{ background: 'rgba(220,185,138,0.1)', color: 'var(--gold)', borderRadius: '20px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 600 }}>{cat}</span>
                    ))}
                    {cats.length > 3 && <span style={{ color: 'var(--muted)', fontSize: '0.72rem', padding: '0.2rem 0.3rem' }}>+{cats.length - 3}</span>}
                  </div>
                )}

                {/* BPM */}
                {(file.bpm_initial || file.bpm_goal) && (
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--muted)' }}>
                    {file.bpm_initial && <span>▶ <strong style={{ color: 'var(--text)' }}>{file.bpm_initial}</strong> BPM inicio</span>}
                    {file.bpm_goal    && <span>🎯 <strong style={{ color: 'var(--text)' }}>{file.bpm_goal}</strong> BPM objetivo</span>}
                  </div>
                )}

                {/* Notes preview */}
                {file.notes && (
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {file.notes}
                  </p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.25rem' }}>
                  <button
                    onClick={() => window.location.href = `/practice?file=${encodeURIComponent(file.file_url)}`}
                    style={{ flex: 1, background: 'var(--gold)', color: '#111', border: 'none', padding: '0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, fontFamily: 'DM Sans, sans-serif', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dark)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}
                  >▶ Tocar</button>

                  {/* Edit */}
                  <button
                    onClick={() => setEditTarget(file)}
                    style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.6rem 0.75rem', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.borderColor = 'rgba(220,185,138,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    title="Editar"
                  >✏️</button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(file)}
                    style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.6rem 0.75rem', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#e74c3c'; e.currentTarget.style.borderColor = 'rgba(231,76,60,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    title="Eliminar"
                  >🗑</button>
                </div>
              </div>
            );
          })}
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