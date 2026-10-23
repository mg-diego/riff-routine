"use client";

import React, { RefObject, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import styles from './AlphaTabContainer.module.css';

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
                className={`alphatab-wrapper ${styles.block}`}
                style={{ display: hasNoScore ? 'none' : 'block' }}
            >
                <div
                    className={`alphatab-container ${styles.block2}`}
                    style={{ minHeight: isLoaded ? 0 : '300px' }}
                >
                    <div ref={wrapperRef} className={styles.block3} />
                </div>
            </div>

            {hasNoScore && (
                <div className={styles.noScoreMessageStack}>
                    <div className={styles.noScoreMessageStackBlock}>🎸</div>
                    <p>{t('noScoreMessage')}</p>
                </div>
            )}
        </>
    );
}