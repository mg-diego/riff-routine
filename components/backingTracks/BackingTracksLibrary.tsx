"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { BackingTrack } from '@/components/player/ImprovPanel';

const getYoutubeId = (url: string) => {
    const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (m && m[2].length === 11) ? m[2] : null;
};
const formatMusicKey = (note?: string | null, type?: string | null) =>
    note ? `${note} ${type || ''}`.trim() : '';

// ── TrackCard (unchanged) ─────────────────────────────────────────────────────
function TrackCard({ track, onPlay, onDeleteRequest, t }: { track: BackingTrack; onPlay: (t: BackingTrack) => void; onDeleteRequest: (t: BackingTrack) => void; t: any }) {
    const ytId = getYoutubeId(track.youtube_url);
    const tonalityDisplay = formatMusicKey(track.tonality_note, track.tonality_type);
    const isSystem = track.user_id === null;

    return (
        <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s ease' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(220,185,138,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
        >
            <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#0e0e0e' }}>
                {ytId
                    ? <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={track.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                    : <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>{t('noThumbnail')}</div>
                }
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.8) 100%)' }} />

                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 10, display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    {isSystem && (
                        <div style={{ background: 'var(--gold)', color: '#111', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                            {t('verifiedBadge')}
                        </div>
                    )}
                    {!isSystem && <DeleteButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onDeleteRequest(track); }} />}
                </div>

                {track.bpm && (
                    <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', zIndex: 10, background: 'rgba(0,0,0,0.7)', color: 'var(--gold)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.3rem', backdropFilter: 'blur(2px)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                        {track.bpm} BPM
                    </div>
                )}

                <button onClick={() => onPlay(track)} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gold)', color: '#111', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', transition: 'transform 0.15s ease', zIndex: 5 }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '3px' }}><path d="M6 4l14 8-14 8V4z" /></svg>
                </button>
            </div>

            <div style={{ padding: '1.2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 title={track.title} style={{ margin: '0 0 1rem 0', color: 'var(--text)', fontSize: '1.05rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.6em' }}>
                    {track.title}
                </h4>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {tonalityDisplay && (
                        <div style={{ display: 'flex' }}>
                            <span style={{ background: 'rgba(220,185,138,0.1)', color: 'var(--gold)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                {tonalityDisplay}
                            </span>
                        </div>
                    )}
                    {track.chords && track.chords.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {track.chords.map((chord, idx) => (
                                <span key={idx} style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
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
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(220,185,138,0.1)', border: '1px solid rgba(220,185,138,0.25)', borderRadius: '100px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, color: 'var(--gold)' }}>
            {label}
            <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, opacity: 0.7 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
interface BackingTracksLibraryProps {
    onPlayTrack: (track: BackingTrack) => void;
    onCreateNew?: () => void;
    isMiniMode?: boolean;
    refreshTrigger?: number;
}

export function BackingTracksLibrary({ onPlayTrack, onCreateNew, isMiniMode = false, refreshTrigger = 0 }: BackingTracksLibraryProps) {
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
    const [bpmMin, setBpmMin] = useState(0);
    const [bpmMax, setBpmMax] = useState(300);

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

    // ── Active filter count ───────────────────────────────────────────────────
    const activeFilterCount =
        (filterTonality ? 1 : 0) +
        filterChords.length +
        (bpmMin > 0 || bpmMax < globalBpmMax ? 1 : 0);

    const clearAllFilters = () => {
        setFilterTonality(''); setFilterChords([]); setBpmMin(0); setBpmMax(globalBpmMax);
    };

    // ── Filtering ─────────────────────────────────────────────────────────────
    const filterTrack = (track: BackingTrack) => {
        const q = search.toLowerCase();
        if (q) {
            const inTitle = track.title.toLowerCase().includes(q);
            const inTonality = formatMusicKey(track.tonality_note, track.tonality_type).toLowerCase().includes(q);
            const inChords = track.chords?.some(c => formatMusicKey(c.note, c.type).toLowerCase().includes(q));
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
        if (bpmMin > 0 || bpmMax < globalBpmMax) {
            const bpm = track.bpm || 0;
            if (bpm < bpmMin || bpm > bpmMax) return false;
        }
        return true;
    };

    const systemTracks = savedTracks.filter(t => t.user_id === null && filterTrack(t));
    const userTracks = savedTracks.filter(t => t.user_id !== null && filterTrack(t));
    const totalVisible = systemTracks.length + userTracks.length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMiniMode ? '1.5rem' : '2rem' }}>

            {/* ── Search + filter bar ── */}
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 0' }}>
                    <svg style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                        style={{ width: '100%', padding: '0.7rem 0.9rem 0.7rem 2.35rem', borderRadius: '8px', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const }}
                        onFocus={e => e.target.style.borderColor = 'rgba(220,185,138,0.3)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                </div>

                {/* Filter button */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button ref={filterBtnRef} onClick={() => setFiltersOpen(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.7rem 1rem', borderRadius: '8px', background: filtersOpen || activeFilterCount > 0 ? 'rgba(220,185,138,0.1)' : 'var(--surface)', border: `1px solid ${filtersOpen || activeFilterCount > 0 ? 'rgba(220,185,138,0.3)' : 'rgba(255,255,255,0.08)'}`, color: activeFilterCount > 0 ? 'var(--gold)' : 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
                        {t('filtersBtn')}
                        {activeFilterCount > 0 && (
                            <span style={{ background: 'var(--gold)', color: '#111', borderRadius: '100px', fontSize: '0.6rem', fontWeight: 800, padding: '1px 6px', lineHeight: 1.4 }}>
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {/* Filter dropdown */}
                    {filtersOpen && (
                        <div ref={filterPanelRef} style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.25rem', zIndex: 50, minWidth: '300px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                            {/* Tonality */}
                            <div>
                                <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 0.6rem' }}>{t('filterTonality')}</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                    {allTonalities.map(ton => (
                                        <button key={ton} onClick={() => setFilterTonality(filterTonality === ton ? '' : ton)} style={{ padding: '0.3rem 0.65rem', borderRadius: '100px', border: `1px solid ${filterTonality === ton ? 'rgba(220,185,138,0.4)' : 'rgba(255,255,255,0.08)'}`, background: filterTonality === ton ? 'rgba(220,185,138,0.12)' : 'transparent', color: filterTonality === ton ? 'var(--gold)' : 'var(--muted)', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', transition: 'all 0.15s' }}>
                                            {ton}
                                        </button>
                                    ))}
                                    {allTonalities.length === 0 && <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>—</span>}
                                </div>
                            </div>

                            {/* Chords */}
                            <div>
                                <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 0.6rem' }}>{t('filterChords')}</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: '120px', overflowY: 'auto' }}>
                                    {allChords.map(chord => {
                                        const active = filterChords.includes(chord);
                                        return (
                                            <button key={chord} onClick={() => setFilterChords(active ? filterChords.filter(c => c !== chord) : [...filterChords, chord])} style={{ padding: '0.3rem 0.65rem', borderRadius: '100px', border: `1px solid ${active ? 'rgba(220,185,138,0.4)' : 'rgba(255,255,255,0.08)'}`, background: active ? 'rgba(220,185,138,0.12)' : 'transparent', color: active ? 'var(--gold)' : 'var(--muted)', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', transition: 'all 0.15s' }}>
                                                {chord}
                                            </button>
                                        );
                                    })}
                                    {allChords.length === 0 && <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>—</span>}
                                </div>
                            </div>

                            {/* BPM slider */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>BPM</p>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.04em' }}>
                                        {bpmMin} – {bpmMax}
                                    </span>
                                </div>
                                <style>{`
                                    .bpm-slider { width: 100%; height: 4px; border-radius: 2px; outline: none; cursor: pointer; accent-color: var(--gold); }
                                `}</style>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <input type="range" className="bpm-slider" min={0} max={globalBpmMax} value={bpmMin}
                                        onChange={e => setBpmMin(Math.min(Number(e.target.value), bpmMax - 1))}
                                    />
                                    <input type="range" className="bpm-slider" min={0} max={globalBpmMax} value={bpmMax}
                                        onChange={e => setBpmMax(Math.max(Number(e.target.value), bpmMin + 1))}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>0</span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>{globalBpmMax}</span>
                                </div>
                            </div>

                            {/* Clear */}
                            {activeFilterCount > 0 && (
                                <button onClick={() => { clearAllFilters(); setFiltersOpen(false); }} style={{ padding: '0.5rem', borderRadius: '7px', border: '1px solid rgba(231,76,60,0.2)', background: 'rgba(231,76,60,0.06)', color: '#e74c3c', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
                                    {t('clearFilters')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Active pills ── */}
            {(filterTonality || filterChords.length > 0 || bpmMin > 0 || bpmMax < globalBpmMax) && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '-0.75rem' }}>
                    {filterTonality && <FilterPill label={filterTonality} onRemove={() => setFilterTonality('')} />}
                    {filterChords.map(c => <FilterPill key={c} label={c} onRemove={() => setFilterChords(filterChords.filter(fc => fc !== c))} />)}
                    {(bpmMin > 0 || bpmMax < globalBpmMax) && <FilterPill label={`${bpmMin}–${bpmMax} BPM`} onRemove={() => { setBpmMin(0); setBpmMax(globalBpmMax); }} />}
                    <button onClick={clearAllFilters} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', padding: '0 0.25rem' }}>
                        {t('clearFilters')}
                    </button>
                </div>
            )}

            {/* ── Results count ── */}
            {(search || activeFilterCount > 0) && !isLoadingTracks && (
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '-0.5rem 0 0' }}>
                    {totalVisible === 1 ? t('foundSingular', { count: 1 }) : t('foundPlural', { count: totalVisible })}
                </p>
            )}

            {/* ── Content ── */}
            {isLoadingTracks ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{t('loading')}</span>
                </div>
            ) : (
                <>  
                    <div>
                        <h3 style={{ color: 'var(--text)', fontSize: isMiniMode ? '1rem' : '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>{t('myTracksTitle')}</h3>
                        {userTracks.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: isMiniMode ? 'repeat(auto-fill, minmax(220px, 1fr))' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {userTracks.map(track => <TrackCard key={track.id} track={track} onPlay={onPlayTrack} onDeleteRequest={setTrackToDelete} t={t} />)}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
                                    {t('noUserTracks') || "Aún no tienes backing tracks guardados."}
                                </span>
                                {onCreateNew && (
                                    <button
                                        onClick={onCreateNew}
                                        style={{
                                            background: 'transparent', color: 'var(--gold)', border: '1px solid var(--gold)',
                                            padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer',
                                            fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', fontWeight: 600,
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = '#111'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gold)'; }}
                                    >
                                        + {t('newTrack')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {systemTracks.length > 0 && (
                        <div>
                            <h3 style={{ color: 'var(--text)', fontSize: isMiniMode ? '1rem' : '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>{t('verifiedTracksTitle')}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: isMiniMode ? 'repeat(auto-fill, minmax(220px, 1fr))' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {systemTracks.map(track => <TrackCard key={track.id} track={track} onPlay={onPlayTrack} onDeleteRequest={setTrackToDelete} t={t} />)}
                            </div>
                        </div>
                    )}

                    {totalVisible === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--muted)', fontSize: isMiniMode ? '0.85rem' : '1rem' }}>
                            {search || activeFilterCount > 0 ? t('noMatchState') : t('emptyState')}
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