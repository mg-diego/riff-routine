"use client";

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useTranslations } from 'next-intl';
import styles from './PdfViewer.module.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
    url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
    const t = useTranslations('PdfViewer');
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setPageNumber(1);
    }

    return (
        <div className={styles.stack}>
            <div className={styles.row}>
                <div className={styles.pageNumberRow}>
                    <button 
                        onClick={() => setPageNumber(p => Math.max(1, p - 1))} 
                        disabled={pageNumber <= 1}
                        className={styles.button} style={{ color: pageNumber <= 1 ? 'var(--muted)' : 'var(--text)', cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer' }}
                    >
                        ←
                    </button>
                    <span className={styles.label}>
                        {pageNumber} / {numPages || '-'}
                    </span>
                    <button 
                        onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))} 
                        disabled={pageNumber >= (numPages || 1)}
                        className={styles.button} style={{ color: pageNumber >= (numPages || 1) ? 'var(--muted)' : 'var(--text)', cursor: pageNumber >= (numPages || 1) ? 'not-allowed' : 'pointer' }}
                    >
                        →
                    </button>
                </div>

                <div className={styles.row3}>
                    <button 
                        onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
                        className={styles.button2}
                    >
                        -
                    </button>
                    <span className={styles.label2}>
                        {Math.round(scale * 100)}%
                    </span>
                    <button 
                        onClick={() => setScale(s => Math.min(3.0, s + 0.2))}
                        className={styles.button2}
                    >
                        +
                    </button>
                </div>
            </div>

            <div className={styles.row4}>
                <Document 
                    file={url} 
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className={styles.block}>Cargando partitura...</div>}
                    error={<div className={styles.block2}>Error al cargar el PDF.</div>}
                >
                    <Page 
                        pageNumber={pageNumber} 
                        scale={scale} 
                        renderTextLayer={true} 
                        renderAnnotationLayer={true} 
                        className={styles['pdf-page-custom']}
                    />
                </Document>
            </div>

        </div>
    );
}