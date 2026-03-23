"use client";

import React, { useState } from 'react';
import { BackingTracksLibrary } from '@/components/backing-tracks/BackingTracksLibrary';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function BackingTracksPage() {
    const t = useTranslations('ImprovPanel');
    const router = useRouter();
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
                    {t('libraryTitle')}
                </h1>
                
                <button 
                    onClick={() => router.push('/practice?mode=improvisation&trackId=new')}
                    style={{ background: 'var(--gold)', color: '#111', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'transform 0.15s ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {t('newTrackButton')}
                </button>
            </div>
            
            <BackingTracksLibrary 
                isMiniMode={false}
                refreshTrigger={refreshTrigger}
                onPlayTrack={(track) => {
                    router.push(`/practice?mode=improvisation&trackId=${track.id}`);
                }}
            />
        </div>
    );
}