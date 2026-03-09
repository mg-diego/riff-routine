import React, { RefObject, useEffect, useRef } from 'react';

interface ScoreViewerProps {
    wrapperRef: RefObject<HTMLDivElement | null>;
    hasNoScore: boolean;
}

export function ScoreViewer({ wrapperRef, hasNoScore }: ScoreViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let resizeTimer: NodeJS.Timeout;
        let lastWidth = container.offsetWidth;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const newWidth = entry.contentRect.width;
                
                // Solo disparamos el redibujado si el contenedor cambia más de 30px
                // (Ignora apariciones de scrollbars o sub-píxeles que causan bucles infinitos)
                if (Math.abs(newWidth - lastWidth) > 30) {
                    lastWidth = newWidth;
                    
                    clearTimeout(resizeTimer);
                    
                    // Esperamos 350ms para asegurar que la animación CSS del Sidebar haya terminado
                    resizeTimer = setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                    }, 350); 
                }
            }
        });

        observer.observe(container);

        return () => {
            observer.disconnect();
            clearTimeout(resizeTimer);
        };
    }, []);

    return (
        <>
            <div
                ref={containerRef}
                className="alphatab-wrapper"
                style={{
                    padding: '0 2rem',
                    flex: 1,
                    minHeight: 0,
                    display: hasNoScore ? 'none' : 'block',
                    width: '100%',
                    overflow: 'hidden'
                }}
            >
                <div
                    className="alphatab-container"
                    style={{ position: 'relative', minHeight: '300px', width: '100%' }}
                >
                    <div ref={wrapperRef} style={{ width: '100%' }} />
                </div>
            </div>

            {hasNoScore && (
                <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--muted)', flexDirection: 'column', gap: '1rem'
                }}>
                    <div style={{ fontSize: '3rem' }}>🎸</div>
                    <p>Ejercicio sin partitura. ¡Usa el cronómetro y a tocar!</p>
                </div>
            )}
        </>
    );
}