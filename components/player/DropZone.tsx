"use client";

import { useState } from 'react';

interface DropZoneProps {
  fileName: string | null;
  onFileLoaded: (file: File) => void;
}

export function DropZone({ fileName, onFileLoaded }: DropZoneProps) {
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
    <div
      className={`drop-zone ${isDragOver ? 'dragover' : ''} ${fileName ? 'loaded' : ''}`}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      style={{ marginTop: '2rem' }}
    >
      {fileName ? (
        <>🎵 <strong>{fileName}</strong><span className="sub">Arrastra otro archivo para reemplazar</span></>
      ) : (
        <>🎸 Arrastra aquí tu archivo Guitar Pro<span className="sub">.gp, .gpx, .gp5</span></>
      )}
    </div>
  );
}