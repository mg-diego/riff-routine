"use client";

import React, { useState } from 'react';
import { BackingTracksLibrary } from '@/components/backing-tracks/BackingTracksLibrary';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function BackingTracksPage() {
    const t = useTranslations('ImprovPanel');
    const router = useRouter();
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <div className={styles.libraryTitleStack}>
            <div className={styles.libraryTitleRow}>
                <h1 className="page-title">
                    {t('libraryTitle')}
                </h1>
                
                <button 
                    onClick={() => router.push('/practice?mode=improvisation&trackId=new')}
                    className={styles.newTrackButton}
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