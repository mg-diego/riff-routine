"use client";

import React, { RefObject, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface AlphaTabContainerProps {
    wrapperRef: RefObject<HTMLDivElement | null>;
    hasNoScore: boolean;
    isLoaded: boolean;
}

export function AlphaTabContainer({ wrapperRef, hasNoScore, isLoaded }: AlphaTabContainerProps) {
    const t = useTranslations('AlphaTabContainer');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let resizeTimer: NodeJS.Timeout;
        let lastWidth = container.offsetWidth;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const newWidth = entry.contentRect.width;

                if (Math.abs(newWidth - lastWidth) > 30) {
                    lastWidth = newWidth;

                    clearTimeout(resizeTimer);
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
                    display: hasNoScore ? 'none' : 'block',
                    width: '100%',
                    overflow: 'visible'
                }}
            >
                <div
                    className="alphatab-container"
                    style={{ position: 'relative', minHeight: isLoaded ? 0 : '300px', width: '100%' }}
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
                    <p>{t('noScoreMessage')}</p>
                </div>
            )}
        </>
    );
}