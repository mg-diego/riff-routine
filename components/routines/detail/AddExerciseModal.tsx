"use client";

import React, { useState } from 'react';
import { Exercise } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { DIFFICULTY_COLORS } from '@/lib/constants';
import { useTranslations } from 'next-intl';
import styles from './AddExerciseModal.module.css';
import { cx } from '@/lib/cx';

interface AddExerciseModalProps {
  exercises: Exercise[];
  onAdd: (exerciseId: string) => void;
  onClose: () => void;
}

export function AddExerciseModal({ exercises, onAdd, onClose }: AddExerciseModalProps) {
  const t = useTranslations('AddExerciseModal');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExercises = exercises.filter(ex => 
    ex.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (ex.technique && ex.technique.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Modal title={t('title')} subtitle={t('subtitle')} onClose={onClose}>
      <input
        type="text"
        placeholder={t('searchPlaceholder')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={styles.searchPlaceholderInput}
        autoFocus
      />

      <div className={styles.noResultsGrid}>
        {filteredExercises.length === 0 ? (
          <div className={styles.noResultsBox}>
            <p className={styles.noResultsText}>{t('noResults')}</p>
          </div>
        ) : (
          filteredExercises.map(ex => {
            const hasNoFile = !ex.file_url;
            
            return (
              <div 
                key={ex.id} 
                className={cx(styles.noFileWarningStack, hasNoFile && styles.noFile)}
              >
                <div className={styles.noFileWarningStack2}>
                  <div className={styles.noFileWarningRow}>
                    <div className={styles.noFileWarningStack3}>
                      <h4 className={styles.subheading}>{ex.title}</h4>
                      {hasNoFile && (
                        <span className={styles.noFileWarningLabel}>
                          {t('noFileWarning')}
                        </span>
                      )}
                    </div>
                    {!ex.user_id && (
                      <span className={styles.catalogBadgeLabel}>
                        {t('catalogBadge')}
                      </span>
                    )}
                  </div>
                  <div className={styles.techniqueFallbackRow}>
                    <span className={styles.techniqueFallbackLabel}>{ex.technique || t('techniqueFallback')}</span>
                    <span className={styles.label}>•</span>
                    <span className={styles.difficultyLabel}>{t('difficultyLabel')} <strong style={{ color: DIFFICULTY_COLORS[ex.difficulty || 1] }}>{ex.difficulty || 1}</strong></span>
                  </div>
                </div>
                
                <button 
                  onClick={() => onAdd(ex.id.toString())}
                  className={styles.addButton}
                >
                  {t('addButton')}{hasNoFile && t('addNoFileButton')}
                </button>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}