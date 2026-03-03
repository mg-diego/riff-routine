"use client";

import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Modal, ModalActions } from '../ui/Modal';
import { ExerciseForm } from './ExerciseForm';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [bpmInit, setBpmInit] = useState<string | number>('');
  const [bpmCurrent, setBpmCurrent] = useState<string | number>('');
  const [bpmGoal, setBpmGoal] = useState<string | number>('');
  const [difficulty, setDifficulty] = useState(3);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setDragOver(false);
    let f: File | undefined;
    if ('dataTransfer' in e) {
      f = e.dataTransfer?.files[0];
    } else {
      f = e.target.files?.[0];
    }
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!ext || !['gp','gp3','gp4','gp5','gpx'].includes(ext)) {
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
        bpm_initial: bpmInit ? parseInt(String(bpmInit)) : null,
        bpm_current: bpmCurrent ? parseInt(String(bpmCurrent)) : null,
        bpm_goal:    bpmGoal ? parseInt(String(bpmGoal)) : null,
        difficulty, notes: notes.trim() || null,
      }]);
      if (dbError) throw dbError;
      onSuccess(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setUploading(false); }
  };

  return (
    <Modal title="Nuevo Ejercicio" subtitle="Sube un archivo Guitar Pro y configura sus metadatos" onClose={onClose}>
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

      <ExerciseForm {...{ name, setName, categories, setCategories, bpmInit, setBpmInit, bpmCurrent, setBpmCurrent, bpmGoal, setBpmGoal, difficulty, setDifficulty, notes, setNotes }} />

      {error && (
        <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem' }}>
          ⚠ {error}
        </div>
      )}

      <ModalActions onClose={onClose} onSubmit={handleSubmit} uploading={uploading} label="Guardar ejercicio" />
    </Modal>
  );
}