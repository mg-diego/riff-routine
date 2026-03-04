"use client";

import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Modal, ModalActions } from '../ui/Modal';
import { ExerciseForm } from './ExerciseForm';
import { Exercise } from '../../lib/types';

interface EditModalProps {
  exercise: Exercise;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditModal({ exercise, onClose, onSuccess }: EditModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [name, setName] = useState(exercise.title || '');
  const [categories, setCategories] = useState<string[]>(exercise.technique ? exercise.technique.split(', ') : []);
  const [bpmSuggested, setBpmSuggested] = useState<string | number>(exercise.bpm_suggested || '');
  const [bpmGoal, setBpmGoal] = useState<string | number>(exercise.bpm_goal || '');
  const [difficulty, setDifficulty] = useState(exercise.difficulty || 3);
  const [notes, setNotes] = useState(exercise.notes || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showHistoryImport, setShowHistoryImport] = useState(false);
  const [historyText, setHistoryText] = useState('');
  const [importingHistory, setImportingHistory] = useState(false);

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
    if (!ext || !['gp', 'gp3', 'gp4', 'gp5', 'gpx'].includes(ext)) {
      setError('Formato inválido. Usa .gp, .gp3, .gp4, .gp5 o .gpx');
      return;
    }

    setFile(f);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return setError('El nombre es obligatorio.');
    if (categories.length === 0) return setError('Selecciona al menos una categoría.');

    try {
      setSaving(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Debes iniciar sesión.');

      let currentFileUrl = exercise.file_url;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('guitar_tabs').upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('guitar_tabs').getPublicUrl(filePath);
        currentFileUrl = publicUrl;

        if (exercise.file_url) {
          const oldPath = exercise.file_url.split('/guitar_tabs/')[1];
          if (oldPath) {
            await supabase.storage.from('guitar_tabs').remove([oldPath]);
          }
        }
      }

      const { error: dbError } = await supabase.from('exercises')
        .update({
          title: name.trim(),
          file_url: currentFileUrl,
          technique: categories.join(', '),
          bpm_suggested: bpmSuggested ? parseInt(String(bpmSuggested)) : null,
          bpm_goal: bpmGoal ? parseInt(String(bpmGoal)) : null,
          difficulty,
          notes: notes.trim() || null,
        })
        .eq('id', exercise.id)
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleImportHistory = async () => {
    if (!historyText.trim()) return setError('Pega al menos un registro.');
    try {
      setImportingHistory(true);
      setError(null);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Debes iniciar sesión.');

      const lines = historyText.split('\n').filter(l => l.trim() !== '');
      const logsToInsert = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split('--').map(p => p.trim());
        
        if (parts.length < 2 || parts.length > 3) {
          throw new Error(`Línea ${i + 1} inválida. Formato: YYYY-MM-DD -- BPM -- Minutos (opcional)`);
        }

        const dateStr = parts[0];
        const bpmStr = parts[1];
        const durationStr = parts[2];

        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) throw new Error(`Línea ${i + 1}: Fecha inválida (${dateStr}). Usa YYYY-MM-DD`);

        const bpm = parseInt(bpmStr, 10);
        if (isNaN(bpm)) throw new Error(`Línea ${i + 1}: BPM inválido (${bpmStr})`);

        let durationSeconds = 0;
        if (durationStr) {
          const minutes = parseInt(durationStr, 10);
          if (isNaN(minutes)) throw new Error(`Línea ${i + 1}: Duración inválida (${durationStr})`);
          durationSeconds = minutes * 60;
        }

        logsToInsert.push({
          user_id: user.id,
          exercise_id: exercise.id,
          bpm_used: bpm,
          duration_seconds: durationSeconds,
          created_at: dateObj.toISOString(),
        });
      }

      const { error: insertError } = await supabase.from('practice_logs').insert(logsToInsert);
      if (insertError) throw insertError;

      setHistoryText('');
      setShowHistoryImport(false);
      onSuccess(); 
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setImportingHistory(false);
    }
  };

  return (
    <Modal title={showHistoryImport ? "Importar Histórico" : "Editar Ejercicio"} subtitle={exercise.title} onClose={onClose}>
      {showHistoryImport ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ margin: '0 0 0.5rem', color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem' }}>Formato requerido:</p>
            <code style={{ color: 'var(--text)', background: '#111', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem' }}>YYYY-MM-DD -- BPM -- Minutos (opcional)</code>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>Ejemplo:<br/>2024-03-01 -- 120<br/>2024-03-02 -- 125 -- 15</p>
          </div>

          <textarea
            value={historyText}
            onChange={e => setHistoryText(e.target.value)}
            placeholder={`2024-03-01 -- 120\n2024-03-02 -- 125 -- 15\n2024-03-03 -- 130 -- 20`}
            rows={8}
            style={{
              width: '100%', padding: '1rem', borderRadius: '8px', background: 'var(--surface2)',
              border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', fontFamily: 'monospace',
              fontSize: '0.9rem', resize: 'vertical', outline: 'none'
            }}
          />

          {error && (
            <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem' }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={() => { setShowHistoryImport(false); setError(null); }}
              style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              Volver
            </button>
            <button
              onClick={handleImportHistory}
              disabled={importingHistory}
              style={{ flex: 1, padding: '0.8rem', background: 'var(--gold)', border: 'none', color: '#111', borderRadius: '8px', cursor: importingHistory ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: importingHistory ? 0.7 : 1 }}
            >
              {importingHistory ? 'Importando...' : 'Guardar Historial'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            onDrop={handleFileDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--gold)' : file ? 'rgba(74,222,128,0.5)' : 'rgba(220,185,138,0.3)'}`,
              borderRadius: '10px',
              padding: '0.8rem 1.2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'rgba(220,185,138,0.05)' : file ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '80px',
              marginBottom: '1rem'
            }}
          >
            <input ref={inputRef} type="file" accept=".gp,.gp3,.gp4,.gp5,.gpx" onChange={handleFileDrop} hidden />

            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textAlign: 'left' }}>
                <div style={{ fontSize: '1.5rem' }}>🎵</div>
                <div>
                  <p style={{ color: '#4ade80', margin: 0, fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.2 }}>{file.name}</p>
                  <p style={{ color: 'var(--muted)', margin: '0.2rem 0 0', fontSize: '0.72rem' }}>
                    {(file.size / 1024).toFixed(1)} KB · Archivo listo para subir
                  </p>
                </div>
              </div>
            ) : exercise.file_url ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '1.5rem' }}>🔄</div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: 'var(--gold)', margin: 0, fontWeight: 600, fontSize: '0.88rem' }}>Reemplazar archivo (Opcional)</p>
                  <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.75rem' }}>Arrastra un nuevo GP o haz clic</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.4rem' }}>🎸</div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'var(--muted)', margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>
                    Archivo Guitar Pro <span style={{ fontWeight: 400, fontSize: '0.75rem' }}>(opcional)</span>
                  </p>
                  <p style={{ color: 'rgba(106,95,82,0.6)', margin: 0, fontSize: '0.72rem' }}>GP3, GP4, GP5, GPX · arrastra o haz clic</p>
                </div>
              </div>
            )}
          </div>

          <ExerciseForm {...{ name, setName, categories, setCategories, bpmSuggested, setBpmSuggested, bpmGoal, setBpmGoal, difficulty, setDifficulty, notes, setNotes }} />

          {error && (
            <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginTop: '1rem' }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <ModalActions onClose={onClose} onSubmit={handleSubmit} uploading={saving} label="Guardar cambios" />
            
            <button
              onClick={() => { setShowHistoryImport(true); setError(null); }}
              style={{
                background: 'transparent',
                border: '1px dashed rgba(255,255,255,0.1)',
                color: 'var(--muted)',
                padding: '0.6rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Importar histórico de práctica anterior
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}