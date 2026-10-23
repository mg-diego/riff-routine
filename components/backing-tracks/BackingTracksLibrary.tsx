"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { BackingTrack } from '@/lib/types';
import { getYoutubeId } from '@/lib/utils';
import styles from './BackingTracksLibrary.module.css';
import { cx } from '@/lib/cx';

const formatMusicKey = (note?: string | null, type?: string | null) =>
    note ? `${note} ${type || ''}`.trim() : '';

// ── TrackCard ─────────────────────────────────────────────────────
function TrackCard({ track, onPlay, onDeleteRequest, t }: { track: BackingTrack; onPlay: (t: BackingTrack) => void; onDeleteRequest: (t: BackingTrack) => void; t: any }) {
    const ytId = getYoutubeId(track.youtube_url);
    const tonalityDisplay = formatMusicKey(track.tonality_note, track.tonality_type);
    const isSystem = track.user_id === null;

    return (
        <div className={styles.noThumbnailStack}
        >
            <div className={styles.noThumbnailBox}>
                {ytId
                    ? <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={track.title} className={styles.image} />
                    : <div className={styles.noThumbnailRow}>{t('noThumbnail')}</div>
                }
                <div className={styles.layer} />

                <div className={styles.officialDisclaimerRow}>
                    {isSystem && (
                        <div title={t('officialDisclaimer') || "Pista oficial del sistema (No editable)"} className={styles.officialDisclaimerRow2}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                            {t('officialBadge')}
                        </div>
                    )}
                    {!isSystem && <DeleteButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onDeleteRequest(track); }} />}
                </div>

                {track.bpm && (
                    <div className={styles.row}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                        {track.bpm} BPM
                    </div>
                )}

                <button onClick={() => onPlay(track)} className={styles.button}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className={styles.icon}><path d="M6 4l14 8-14 8V4z" /></svg>
                </button>
            </div>

            <div className={styles.untitledTrackStack}>
                <h4 title={track.title} className={styles.untitledTrackSubheading}>
                    {track.title || t('untitledTrack')}
                </h4>
                <div className={styles.stack}>
                    {tonalityDisplay && (
                        <div className={styles.tonalityDisplayRow}>
                            <span className={styles.label}>
                                {tonalityDisplay}
                            </span>
                        </div>
                    )}
                    {track.chords && track.chords.length > 0 && (
                        <div className={styles.noteRow}>
                            {track.chords.map((chord, idx) => (
                                <span key={idx} className={styles.noteLabel}>
                                    {formatMusicKey(chord.note, chord.type)}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── FilterPill ────────────────────────────────────────────────────────────────
function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <div className={styles.row4}>
            {label}
            <button onClick={onRemove} className={styles.button2}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
interface BackingTracksLibraryProps {
    onPlayTrack: (track: BackingTrack) => void;
    isMiniMode?: boolean;
    refreshTrigger?: number;
}

export function BackingTracksLibrary({ onPlayTrack, isMiniMode = false, refreshTrigger = 0 }: BackingTracksLibraryProps) {
    const t = useTranslations('ImprovPanel');

    const [savedTracks, setSavedTracks] = useState<BackingTrack[]>([]);
    const [isLoadingTracks, setIsLoadingTracks] = useState(true);
    const [trackToDelete, setTrackToDelete] = useState<BackingTrack | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ── Filter state ──────────────────────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filterTonality, setFilterTonality] = useState('');
    const [filterChords, setFilterChords] = useState<string[]>([]);
    const [bpmMin, setBpmMin] = useState<number | ''>('');
    const [bpmMax, setBpmMax] = useState<number | ''>('');

    const filterPanelRef = useRef<HTMLDivElement>(null);
    const filterBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node) &&
                filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node))
                setFiltersOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const fetchTracks = async () => {
        setIsLoadingTracks(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('backing_tracks')
                .select('*')
                .or(`user_id.eq.${user.id},user_id.is.null`)
                .order('created_at', { ascending: false });
            if (data) setSavedTracks(data as BackingTrack[]);
        }
        setIsLoadingTracks(false);
    };

    useEffect(() => { fetchTracks(); }, [refreshTrigger]);

    const confirmDeleteTrack = async () => {
        if (!trackToDelete) return;
        setIsDeleting(true);
        await supabase.from('backing_tracks').delete().eq('id', trackToDelete.id);
        setSavedTracks(prev => prev.filter(t => t.id !== trackToDelete.id));
        setIsDeleting(false);
        setTrackToDelete(null);
    };

    // ── Derived: unique tonalities + chords from all tracks ───────────────────
    const allTonalities = useMemo(() => {
        const set = new Set<string>();
        savedTracks.forEach(t => { if (t.tonality_note) set.add(formatMusicKey(t.tonality_note, t.tonality_type)); });
        return [...set].sort();
    }, [savedTracks]);

    const allChords = useMemo(() => {
        const set = new Set<string>();
        savedTracks.forEach(t => t.chords?.forEach(c => { if (c.note && c.type) set.add(formatMusicKey(c.note, c.type)); }));
        return [...set].sort();
    }, [savedTracks]);

    const globalBpmMax = useMemo(() => {
        const max = Math.max(0, ...savedTracks.map(t => t.bpm || 0));
        return max > 0 ? max : 300;
    }, [savedTracks]);

    // Slider safe values
    const safeGlobalMax = globalBpmMax || 300;
    const safeMin = Math.max(0, Math.min(Number(bpmMin) || 0, safeGlobalMax));
    const safeMax = Math.max(safeMin, Math.min(bpmMax === '' ? safeGlobalMax : Number(bpmMax), safeGlobalMax));

    // ── Active filter count ───────────────────────────────────────────────────
    const activeFilterCount =
        (filterTonality ? 1 : 0) +
        filterChords.length +
        (safeMin > 0 || safeMax < safeGlobalMax ? 1 : 0);

    const clearAllFilters = () => {
        setFilterTonality(''); setFilterChords([]); setBpmMin(''); setBpmMax('');
    };

    // ── Filtering ─────────────────────────────────────────────────────────────
    const filterTrack = (track: BackingTrack) => {
        const q = search.toLowerCase();
        if (q) {
            const inTitle = track.title?.toLowerCase().includes(q) || false;
            const inTonality = formatMusicKey(track.tonality_note, track.tonality_type).toLowerCase().includes(q);
            const inChords = track.chords?.some(c => formatMusicKey(c.note, c.type).toLowerCase().includes(q)) || false;
            if (!inTitle && !inTonality && !inChords) return false;
        }
        if (filterTonality) {
            const trackTonality = formatMusicKey(track.tonality_note, track.tonality_type);
            if (trackTonality !== filterTonality) return false;
        }
        if (filterChords.length > 0) {
            const trackChordLabels = track.chords?.map(c => formatMusicKey(c.note, c.type)) || [];
            if (!filterChords.every(fc => trackChordLabels.includes(fc))) return false;
        }
        if (safeMin > 0 || safeMax < safeGlobalMax) {
            const trackBpm = track.bpm || 0;
            if (trackBpm < safeMin || trackBpm > safeMax) return false;
        }
        return true;
    };

    const systemTracks = savedTracks.filter(t => t.user_id === null && filterTrack(t));
    const userTracks = savedTracks.filter(t => t.user_id !== null && filterTrack(t));
    const totalVisible = systemTracks.length + userTracks.length;

    return (
        <div className={styles.searchPlaceholderStack} style={{ gap: isMiniMode ? '1.5rem' : '2rem' }}>

            {/* ── Search + filter bar ── */}
            <div className={styles.searchPlaceholderRow}>
                {/* Search */}
                <div className={styles.searchPlaceholder}>
                    <svg className={styles.searchPlaceholderIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                        className={styles.searchPlaceholderInput} style={{ boxSizing: 'border-box' as const }}
                    />
                </div>

                {/* Filter button */}
                <div className={styles.filtersBtn}>
                    <button ref={filterBtnRef} onClick={() => setFiltersOpen(p => !p)} className={styles.filtersBtnButton} style={{ background: filtersOpen || activeFilterCount > 0 ? 'rgba(220,185,138,0.1)' : 'var(--surface)', border: `1px solid ${filtersOpen || activeFilterCount > 0 ? 'rgba(220,185,138,0.3)' : 'rgba(255,255,255,0.08)'}`, color: activeFilterCount > 0 ? 'var(--gold)' : 'var(--text)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
                        {t('filtersBtn')}
                        {activeFilterCount > 0 && (
                            <span className={styles.activeFilterCountLabel}>
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {/* Filter dropdown */}
                    {filtersOpen && (
                        <div ref={filterPanelRef} className={styles.filterTonalityStack}>

                            {/* Tonality */}
                            <div>
                                <p className={styles.filterTonalityText}>{t('filterTonality')}</p>
                                <div className={styles.filterTonalityStackRow}>
                                    {allTonalities.map(ton => (
                                        <button key={ton} onClick={() => setFilterTonality(filterTonality === ton ? '' : ton)} className={styles.filterTonalityStackButton} style={{ border: `1px solid ${filterTonality === ton ? 'rgba(220,185,138,0.4)' : 'rgba(255,255,255,0.08)'}`, background: filterTonality === ton ? 'rgba(220,185,138,0.12)' : 'transparent', color: filterTonality === ton ? 'var(--gold)' : 'var(--muted)' }}>
                                            {ton}
                                        </button>
                                    ))}
                                    {allTonalities.length === 0 && <span className={styles.filterTonalityStackLabel}>—</span>}
                                </div>
                            </div>

                            {/* Chords */}
                            <div>
                                <p className={styles.filterTonalityText}>{t('filterChords')}</p>
                                <div className={styles.chordRow}>
                                    {allChords.map(chord => {
                                        const active = filterChords.includes(chord);
                                        return (
                                            <button key={chord} onClick={() => setFilterChords(active ? filterChords.filter(c => c !== chord) : [...filterChords, chord])} className={styles.filterTonalityStackButton} style={{ border: `1px solid ${active ? 'rgba(220,185,138,0.4)' : 'rgba(255,255,255,0.08)'}`, background: active ? 'rgba(220,185,138,0.12)' : 'transparent', color: active ? 'var(--gold)' : 'var(--muted)' }}>
                                                {chord}
                                            </button>
                                        );
                                    })}
                                    {allChords.length === 0 && <span className={styles.filterTonalityStackLabel}>—</span>}
                                </div>
                            </div>

                            {/* BPM slider */}
                            <div>
                                <div className={styles.safeMinRow}>
                                    <p className={styles.text}>BPM</p>
                                    <span className={styles.safeMinLabel}>
                                        {safeMin} – {safeMax}
                                    </span>
                                </div>
                                <div className={styles.row8}>

                                    <div className={styles.filterTonalityStackLayer} />

                                    <div className={styles.layer3} style={{ left: `${(safeMin / safeGlobalMax) * 100}%`, right: `${100 - (safeMax / safeGlobalMax) * 100}%` }} />

                                    <input 
                                        type="range" 
                                        className={styles['dual-slider']} 
                                        min={0} 
                                        max={safeGlobalMax} 
                                        value={safeMin}
                                        onChange={e => setBpmMin(Math.min(Number(e.target.value), safeMax - 1))}
                                        style={{ zIndex: safeMin > safeGlobalMax - 10 ? 3 : 4 }}
                                    />
                                    
                                    <input 
                                        type="range" 
                                        className={cx(styles['dual-slider'], styles.input)} 
                                        min={0} 
                                        max={safeGlobalMax} 
                                        value={safeMax}
                                        onChange={e => setBpmMax(Math.max(Number(e.target.value), safeMin + 1))}
                                    />
                                </div>
                                <div className={styles.safeGlobalMaxRow}>
                                    <span className={styles.safeGlobalMaxRowLabel}>0</span>
                                    <span className={styles.safeGlobalMaxRowLabel}>{safeGlobalMax}</span>
                                </div>
                            </div>

                            {/* Clear */}
                            {activeFilterCount > 0 && (
                                <button onClick={() => { clearAllFilters(); setFiltersOpen(false); }} className={styles.clearFiltersButton}>
                                    {t('clearFilters')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Results count ── */}
            {(search || activeFilterCount > 0) && !isLoadingTracks && (
                <p className={styles.foundSingularText}>
                    {totalVisible === 1 ? t('foundSingular', { count: 1 }) : t('foundPlural', { count: totalVisible })}
                </p>
            )}

            {/* ── Content ── */}
            {isLoadingTracks ? (
                <div className={styles.loadingRow}>
                    <span className={styles.loadingLabel}>{t('loading')}</span>
                </div>
            ) : (
                <>  
                    <div>
                        <h3 className={styles.myTracksTitleSubheading} style={{ fontSize: isMiniMode ? '1rem' : '1.2rem' }}>{t('myTracksTitle')}</h3>
                        {userTracks.length > 0 ? (
                            <div className={styles.grid} style={{ gridTemplateColumns: isMiniMode ? 'repeat(auto-fill, minmax(220px, 1fr))' : 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                {userTracks.map(track => <TrackCard key={track.id} track={track} onPlay={onPlayTrack} onDeleteRequest={setTrackToDelete} t={t} />)}
                            </div>
                        ) : (
                            <div className={styles.noUserTracksStack}>
                                <span className={styles.noUserTracksLabel}>
                                    {t('noUserTracks') || "Aún no tienes backing tracks guardados."}
                                </span>                                
                            </div>
                        )}
                    </div>
                    
                    {systemTracks.length > 0 && (
                        <div>
                            <h3 className={styles.myTracksTitleSubheading} style={{ fontSize: isMiniMode ? '1rem' : '1.2rem' }}>{t('officialTracksTitle')}</h3>
                            <div className={styles.grid} style={{ gridTemplateColumns: isMiniMode ? 'repeat(auto-fill, minmax(220px, 1fr))' : 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                {systemTracks.map(track => <TrackCard key={track.id} track={track} onPlay={onPlayTrack} onDeleteRequest={setTrackToDelete} t={t} />)}
                            </div>
                        </div>
                    )}

                    {totalVisible === 0 && (
                        <div className={styles.noMatchState} style={{ fontSize: isMiniMode ? '0.85rem' : '1rem' }}>
                            {search || activeFilterCount > 0 ? (t('noMatchState') || "No se han encontrado resultados.") : (t('emptyState') || "No hay pistas.")}
                        </div>
                    )}
                </>
            )}

            {trackToDelete && (
                <DeleteConfirmModal
                    title={t('deleteModalTitle')} itemName={trackToDelete.title}
                    warningMessage={t('deleteModalWarning')} isDeleting={isDeleting}
                    onConfirm={confirmDeleteTrack} onCancel={() => setTrackToDelete(null)}
                />
            )}
        </div>
    );
}