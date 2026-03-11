"use client";

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Modal, ModalActions } from '../ui/Modal';
import { useTranslations } from 'next-intl';

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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.7rem 0.9rem', borderRadius: '7px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.93rem',
    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
  };

  return (
    <Modal title={t('title')} subtitle={t('subtitle')} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {t('nameLabel')}
          </label>
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            placeholder={t('namePlaceholder')} 
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--gold)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} 
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {t('descriptionLabel')} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{t('optional')}</span>
          </label>
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)}
            placeholder={t('descriptionPlaceholder')}
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
      </div>

      <ModalActions onClose={onClose} onSubmit={handleSubmit} uploading={saving} label={t('createButton')} />
    </Modal>
  );
}