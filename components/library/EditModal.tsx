"use client";

import React, { useState } from 'react';
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
  const [name, setName] = useState(exercise.title || '');
  const [categories, setCategories] = useState<string[]>(exercise.technique ? exercise.technique.split(', ') : []);
  const [bpmInit, setBpmInit] = useState<string | number>(exercise.bpm_initial || '');
  const [bpmCurrent, setBpmCurrent] = useState<string | number>(exercise.bpm_current || '');
  const [bpmGoal, setBpmGoal] = useState<string | number>(exercise.bpm_goal || '');
  const [difficulty, setDifficulty] = useState(exercise.difficulty || 3);
  const [notes, setNotes] = useState(exercise.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          bpm_initial: bpmInit ? parseInt(String(bpmInit)) : null,
          bpm_current: bpmCurrent ? parseInt(String(bpmCurrent)) : null,
          bpm_goal:    bpmGoal ? parseInt(String(bpmGoal)) : null,
          difficulty, notes: notes.trim() || null,
        })
        .eq('id', exercise.id)
        .eq('user_id', user.id);
      if (dbError) throw dbError;
      onSuccess(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Editar Ejercicio" subtitle={`Editando: ${exercise.title}`} onClose={onClose}>
      <ExerciseForm {...{ name, setName, categories, setCategories, bpmInit, setBpmInit, bpmCurrent, setBpmCurrent, bpmGoal, setBpmGoal, difficulty, setDifficulty, notes, setNotes }} />

      {error && (
        <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem' }}>
          ⚠ {error}
        </div>
      )}

      <ModalActions onClose={onClose} onSubmit={handleSubmit} uploading={saving} label="Guardar cambios" />
    </Modal>
  );
}