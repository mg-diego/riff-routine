"use client";

import React, { useState } from 'react';
import { ImprovPanel, BackingTrack } from '@/components/player/ImprovPanel';
import { BackingTracksLibrary } from '@/components/backingTracks/BackingTracksLibrary';
import { useTranslations } from 'next-intl';

export default function BackingTracksPage() {
    const t = useTranslations('ImprovPanel');
    const [view, setView] = useState<'library' | 'player'>('library');
    const [activeTrack, setActiveTrack] = useState<BackingTrack | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handlePlaySavedTrack = (track: BackingTrack) => {
        setActiveTrack(track);
        setView('player');
    };

    const handleCreateNew = () => {
        setActiveTrack(null);
        setView('player');
    };

    const handleBackToLibrary = () => {
        setRefreshTrigger(prev => prev + 1);
        setView('library');
    };

    if (view === 'player') {
        return (
            <div style={{ padding: '1rem 0' }}>
                <ImprovPanel
                    initialTrack={activeTrack}
                    onBack={handleBackToLibrary}
                    onSaved={() => setRefreshTrigger(prev => prev + 1)}
                />
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem 0' }}>
            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>{t('libraryTitle')}</h1>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {handleCreateNew && (
                        <button onClick={handleCreateNew} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(220,185,138,0.08)', color: 'var(--gold)', border: '1px solid rgba(220,185,138,0.3)', padding: '0.45rem 0.9rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', transition: 'all 0.2s ease', whiteSpace: 'nowrap', flexShrink: 0 }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = '#111'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,185,138,0.08)'; e.currentTarget.style.color = 'var(--gold)'; }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            {t('newTrack')}
                        </button>
                    )}
                </div>
            </div>
            <BackingTracksLibrary
                onPlayTrack={handlePlaySavedTrack}
                refreshTrigger={refreshTrigger}
            />
        </div>
    );
}