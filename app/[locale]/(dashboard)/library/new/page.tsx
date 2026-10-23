"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ExerciseForm } from '@/components/library/ExerciseForm';
import { useTranslations } from 'next-intl';
import { useExerciseActions } from '@/hooks/useExerciseActions';
import { VALID_FILE_TYPES } from '@/lib/constants';
import styles from './page.module.css';
import ui from '@/components/ui/ui.module.css';

export default function NewExercisePage() {
  const router = useRouter();
  const t = useTranslations('NewExercisePage');
  const inputRef = useRef<HTMLInputElement>(null);

  const { saving, error, createCustomExercise, setError } = useExerciseActions();

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [name, setName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [bpmSuggested, setBpmSuggested] = useState<string | number>('');
  const [bpmGoal, setBpmGoal] = useState<string | number>('');
  const [difficulty, setDifficulty] = useState(0);
  const [notes, setNotes] = useState('');
  const [fileType, setFileType] = useState('gp5');

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
    if (!ext || !['gp', 'gp3', 'gp4', 'gp5', 'gpx', 'pdf'].includes(ext)) {
      setError(t('fileDrop.invalidFormat'));
      return;
    }

    const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5 MB en bytes
    if (ext === 'pdf' && f.size > MAX_PDF_SIZE) {
      setError(t('fileDrop.invalidSize')); // Asegúrate de tener esta traducción
      return;
    }

    // ACTUALIZACIÓN DE LÓGICA: Seteamos tanto el archivo como su tipo
    setFile(f);
    setFileType(ext === 'pdf' ? 'pdf' : 'gp5');
    setError(null);

    if (!name.trim()) {
      const fileNameWithoutExt = f.name.replace(/\.[^/.]+$/, "");
      setName(fileNameWithoutExt);
    }
  };

  const handleSubmit = async () => {
    // Validaciones locales de UI rápidas
    if (!name.trim()) return setError(t('form.nameRequired'));
    if (categories.length === 0) return setError(t('form.categoryRequired'));
    if (difficulty < 1 || difficulty > 5) return setError(t('form.difficultyRequired'));

    // Delegamos la creación al hook
    const newExerciseId = await createCustomExercise({
      name,
      categories,
      difficulty,
      bpmSuggested,
      bpmGoal,
      notes,
      file,
      fileType // Ahora sí enviará 'pdf' si el usuario subió un PDF
    });

    if (newExerciseId) {
      router.push('/library');
    }
  };

  return (
    <div data-onboarding="library-08" className={styles.back}>
      <button
        onClick={() => router.push('/library')}
        className={ui.backLink}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        {t('back')}
      </button>

      <div className="surface-card">
        <h1 className={ui.formTitle}>
          {t('title')}
        </h1>

        <div
          data-onboarding="library-02"
          onDrop={handleFileDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={styles.readyToUploadStack} style={{ border: `2px dashed ${dragOver ? 'var(--gold)' : file ? 'rgba(74,222,128,0.5)' : 'rgba(220,185,138,0.3)'}`, background: dragOver ? 'rgba(220,185,138,0.05)' : file ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)' }}
        >
          {/* Se usa la constante que debería incluir .pdf */}
          <input ref={inputRef} type="file" accept={VALID_FILE_TYPES} onChange={handleFileDrop} hidden />

          {file ? (
            <div className={styles.readyToUploadRow}>
              {/* Cambia el emoji dinámicamente si es PDF */}
              <div className={styles.block}>{fileType === 'pdf' ? '📄' : '🎵'}</div>
              <div>
                <p className={styles.text}>{file.name}</p>
                <p className={styles.readyToUploadText}>
                  {(file.size / 1024).toFixed(1)} KB · {t('fileDrop.readyToUpload')}
                </p>
              </div>
            </div>
          ) : (
            <div className={styles.optionalRow}>
              <div className={styles.block}>🎸</div>
              <div className={styles.optional}>
                <p className={styles.optionalText}>
                  {/* Aquí podrías añadir una clave nueva al JSON: fileDrop.guitarProOrPdfFile */}
                  Guitar Pro / PDF <span className={styles.optionalLabel}>{t('fileDrop.optional')}</span>
                </p>
                <p className={styles.dragOrClickText}>{t('fileDrop.dragOrClick')}</p>
              </div>
            </div>
          )}
        </div>

        <div className={styles.stack}>
          <ExerciseForm {...{ name, setName, categories, setCategories, bpmSuggested, setBpmSuggested, bpmGoal, setBpmGoal, difficulty, setDifficulty, notes, setNotes, isSystem: false }} />
        </div>

        {error && (
          <div className={`alert-error ${styles.errorBlock}`}>
            ⚠ {error}
          </div>
        )}

        <div className={styles.savingStack}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={styles.savingButton} style={{ cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? t('buttons.saving') : t('buttons.save')}
          </button>
        </div>
      </div>

    </div>
  );
}