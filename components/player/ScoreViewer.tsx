import React, { RefObject } from 'react';

interface ScoreViewerProps {
    wrapperRef: RefObject<HTMLDivElement | null>;
    hasNoScore: boolean;
}

export function ScoreViewer({ wrapperRef, hasNoScore }: ScoreViewerProps) {
    return (
        <>
            <div
                className="alphatab-wrapper"
                style={{
                    padding: '0 2rem',
                    flex: 1,
                    minHeight: 0,
                    display: hasNoScore ? 'none' : 'block',
                }}
            >
                <div
                    className="alphatab-container"
                    style={{ position: 'relative', overflow: 'visible', minHeight: '300px' }}
                >
                    <div ref={wrapperRef} />
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