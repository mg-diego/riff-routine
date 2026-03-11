"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';

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
      <style>{`
        @keyframes dz-pulse {
          0% { box-shadow: 0 0 0 0 rgba(125, 211, 252, 0.15); }
          70% { box-shadow: 0 0 0 8px rgba(125, 211, 252, 0); }
          100% { box-shadow: 0 0 0 0 rgba(125, 211, 252, 0); }
        }

        .dz-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1.25rem;
          border-radius: 100px;
          border: 1px dashed rgba(125, 211, 252, 0.5);
          background: rgba(125, 211, 252, 0.05);
          color: #f0e8dc;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          max-width: 480px;
          cursor: pointer;
        }

        .dz-container:not(.loaded):not(.dragover) {
          animation: dz-pulse 3s infinite;
        }

        .dz-container:hover:not(.loaded) {
          background: rgba(125, 211, 252, 0.1);
          border-color: rgba(125, 211, 252, 0.8);
          transform: translateY(-1px);
        }

        .dz-container.dragover {
          border: 2px dashed #7dd3fc;
          background: rgba(125, 211, 252, 0.2);
          transform: scale(1.02);
          box-shadow: 0 0 25px rgba(125, 211, 252, 0.2);
          color: #fff;
        }

        .dz-container.loaded {
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.04);
          color: var(--text, #f0e8dc);
        }

        .dz-container.loaded:hover {
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.08);
        }

        .dz-sub {
          font-size: 0.65rem;
          color: #7dd3fc;
          margin-left: auto;
          white-space: nowrap;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dz-container.loaded .dz-sub {
          color: rgba(255, 255, 255, 0.4);
        }

        .dz-container.dragover .dz-sub {
          color: #fff;
        }

        .dz-filename {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
          font-weight: 700;
        }
      `}</style>
      
      <div
        className={`dz-container ${isDragOver ? 'dragover' : ''} ${fileName ? 'loaded' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
      >
        {fileName ? (
          <>
            <span style={{ fontSize: '1.1rem' }}>🎵</span> 
            <span className="dz-filename">{fileName}</span>
            <span className="dz-sub">{t('dragToReplace')}</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: '1.1rem' }}>🎸</span> 
            <span>{t('dragFileHere')}</span>
            <span className="dz-sub">{t('supportedFormats')}</span>
          </>
        )}
      </div>
    </>
  );
}