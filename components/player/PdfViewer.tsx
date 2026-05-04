"use client";

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useTranslations } from 'next-intl';

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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                        onClick={() => setPageNumber(p => Math.max(1, p - 1))} 
                        disabled={pageNumber <= 1}
                        style={{ background: 'rgba(255,255,255,0.05)', color: pageNumber <= 1 ? 'var(--muted)' : 'var(--text)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                    >
                        ←
                    </button>
                    <span style={{ color: 'var(--muted)', fontSize: '0.9rem', fontFamily: 'DM Sans, sans-serif', minWidth: '80px', textAlign: 'center' }}>
                        {pageNumber} / {numPages || '-'}
                    </span>
                    <button 
                        onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))} 
                        disabled={pageNumber >= (numPages || 1)}
                        style={{ background: 'rgba(255,255,255,0.05)', color: pageNumber >= (numPages || 1) ? 'var(--muted)' : 'var(--text)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: pageNumber >= (numPages || 1) ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                    >
                        →
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                        onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        -
                    </button>
                    <span style={{ color: 'var(--gold)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', width: '45px', justifyContent: 'center' }}>
                        {Math.round(scale * 100)}%
                    </span>
                    <button 
                        onClick={() => setScale(s => Math.min(3.0, s + 0.2))}
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        +
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '1rem', display: 'flex', justifyContent: 'center', background: '#1a1a1a' }}>
                <Document 
                    file={url} 
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div style={{ color: 'var(--gold)', padding: '2rem' }}>Cargando partitura...</div>}
                    error={<div style={{ color: '#e74c3c', padding: '2rem' }}>Error al cargar el PDF.</div>}
                >
                    <Page 
                        pageNumber={pageNumber} 
                        scale={scale} 
                        renderTextLayer={true} 
                        renderAnnotationLayer={true} 
                        className="pdf-page-custom"
                    />
                </Document>
            </div>

            <style>{`
                .pdf-page-custom {
                    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
                    border-radius: 4px;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}