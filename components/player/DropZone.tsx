"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './DropZone.module.css';

interface DropZoneProps {
  fileName: string | null;
  onFileLoaded: (file: File) => void;
}

export function DropZone({ fileName, onFileLoaded }: DropZoneProps) {
  const t = useTranslations('DropZone');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileLoaded(file);
    }
  };

  return (
    <>
      
      <div
        className={`${styles['dz-container']} ${isDragOver ? styles.dragover : ''} ${fileName ? styles.loaded : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
      >
        {fileName ? (
          <>
            <span className={styles.label}>🎵</span> 
            <span className={styles['dz-filename']}>{fileName}</span>
            <span className={styles['dz-sub']}>{t('dragToReplace')}</span>
          </>
        ) : (
          <>
            <span className={styles.label}>🎸</span> 
            <span>{t('dragFileHere')}</span>
            <span className={styles['dz-sub']}>{t('supportedFormats')}</span>
          </>
        )}
      </div>
    </>
  );
}