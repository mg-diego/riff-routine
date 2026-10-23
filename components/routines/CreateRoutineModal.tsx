"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal, ModalActions } from '@/components/ui/Modal';
import { useTranslations } from 'next-intl';
import styles from './CreateRoutineModal.module.css';
import { cx } from '@/lib/cx';

interface CreateRoutineModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateRoutineModal({ onClose, onSuccess }: CreateRoutineModalProps) {
  const t = useTranslations('CreateRoutineModal');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) return setError(t('errors.nameRequired'));
    
    try {
      setSaving(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('errors.sessionRequired'));

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

  return (
    <Modal title={t('title')} subtitle={t('subtitle')} onClose={onClose}>
      <div className={styles.nameLabelStack}>
        <div>
          <label className={styles.nameLabelFieldLabel}>
            {t('nameLabel')}
          </label>
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            placeholder={t('namePlaceholder')} 
            className={`${styles.input} ${styles.inputFocusable}`} 
          />
        </div>

        <div>
          <label className={styles.nameLabelFieldLabel}>
            {t('descriptionLabel')} <span className={styles.optionalLabel}>{t('optional')}</span>
          </label>
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            rows={3} 
            className={cx(styles.input, styles.descriptionPlaceholderTextarea)} 
          />
        </div>

        {error && (
          <div className="alert-error">
            ⚠ {error}
          </div>
        )}
      </div>

      <ModalActions onClose={onClose} onSubmit={handleSubmit} uploading={saving} label={t('createButton')} />
    </Modal>
  );
}