"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { Exercise } from '../../../../lib/types';
import { TECHNIQUES, SUBSCRIPTION_TIERS, SubscriptionTier } from '../../../../lib/constants';
import { ExerciseCard } from '../../../../components/library/ExerciseCard';
import { ExerciseRow } from '../../../../components/library/ExerciseRow';
import { DeleteConfirmModal } from '../../../../components/ui/DeleteConfirmModal';
import { useTranslations } from 'next-intl';
import { useTranslatedExercise } from '@/hooks/useTranslatedExercise';
import { BecomeProModal } from '@/components/ui/BecomeProModal';

interface ExerciseWithProgress extends Exercise {
  max_bpm_achieved?: number;
}

const ITEMS_PER_PAGE = 20;

// ── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '6px', padding: '0.4rem 0.7rem',
          fontSize: '0.75rem', color: 'var(--text)', whiteSpace: 'nowrap',
          pointerEvents: 'none', zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          {text}
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            border: '5px solid transparent', borderTopColor: 'rgba(255,255,255,0.1)',
          }} />
        </div>
      )}
    </div>
  );
}

// ── Active filter pills ───────────────────────────────────────────────────────
function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      background: 'rgba(220,185,138,0.1)', border: '1px solid rgba(220,185,138,0.25)',
      borderRadius: '100px', padding: '0.2rem 0.6rem',
      fontSize: '0.72rem', fontWeight: 600, color: 'var(--gold)',
    }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, opacity: 0.7 }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
    </div>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const t = useTranslations('LibraryPage');
  const p = useTranslations('BecomeProModal');
  const { formatExerciseList } = useTranslatedExercise();

  const [files, setFiles] = useState<ExerciseWithProgress[]>([]);
  const [userTier, setUserTier] = useState<SubscriptionTier>(SUBSCRIPTION_TIERS.FREE);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'rows' | 'cards'>('rows');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<string>('created_desc');

  // Filter panel
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  // Close filter panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node) &&
        filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)
      ) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { fetchExercises(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedTechniques, difficultyFilter, sortBy]);

  const fetchExercises = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from('profiles').select('subscription_tier').eq('id', user.id).single();
    if (profile) setUserTier((profile.subscription_tier as SubscriptionTier) || SUBSCRIPTION_TIERS.FREE);

    const { data: exercisesData, error: exercisesError } = await supabase
      .from('exercises').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

    if (exercisesError || !exercisesData) {
      setError(exercisesError?.message || t('errors.load'));
      setLoading(false);
      return;
    }

    // 1. Traducimos todos los ejercicios de una vez usando la utilidad de lista
    const translatedExercises = formatExerciseList(exercisesData);

    const exerciseIds = translatedExercises.map(ex => ex.id);
    if (exerciseIds.length > 0) {
      const { data: logsData, error: logsError } = await supabase
        .from('practice_logs').select('exercise_id, bpm_used')
        .in('exercise_id', exerciseIds).eq('user_id', user.id);

      if (!logsError && logsData) {
        const maxBpms: Record<string, number> = {};
        logsData.forEach(log => {
          if (!maxBpms[log.exercise_id] || log.bpm_used > maxBpms[log.exercise_id])
            maxBpms[log.exercise_id] = log.bpm_used;
        });

        // 2. Mapeamos sobre la lista ya traducida
        setFiles(translatedExercises.map(ex => ({
          ...ex,
          max_bpm_achieved: maxBpms[ex.id] || undefined
        })));
      } else {
        setFiles(translatedExercises);
      }
    } else {
      setFiles([]);
    }
    setLoading(false);
  };

  const handleDeleteRequest = (exercise: Exercise) => setExerciseToDelete(exercise);


  const confirmDelete = async () => {
    if (!exerciseToDelete) return;
    setIsDeleting(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('errors.auth'));

      if (exerciseToDelete.file_url?.startsWith('http')) {
        try {
          const url = new URL(exerciseToDelete.file_url);
          const parts = url.pathname.split('/');
          const bi = parts.indexOf('guitar_tabs');
          if (bi !== -1) await supabase.storage.from('guitar_tabs').remove([parts.slice(bi + 1).join('/')]);
        } catch (e) { console.warn(e); }
      }

      await supabase.from('practice_logs').delete().eq('exercise_id', exerciseToDelete.id);
      const { error: re } = await supabase.from('routine_exercises').delete().eq('exercise_id', exerciseToDelete.id);
      if (re && re.code !== '42P01') throw new Error(`Error en routine_exercises: ${re.message}`);

      const { data: rawData, error: dbError } = await supabase.from('exercises')
        .delete().eq('id', exerciseToDelete.id).eq('user_id', user.id).select();
      if (dbError) throw new Error(dbError.message);

      const data: Exercise[] = rawData ? formatExerciseList(rawData) : [];
      if (!data || data.length === 0) throw new Error(t('errors.rls'));

      await fetchExercises();
      setExerciseToDelete(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleTechnique = (tech: string) => {
    setSelectedTechniques(prev =>
      prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm(''); setSelectedTechniques([]); setDifficultyFilter(''); setSortBy('created_desc');
  };

  const handleEditNavigation = (exercise: Exercise) => router.push(`/library/${exercise.id}`);
  const handleHistoryNavigation = (exercise: Exercise) => router.push(`/library/${exercise.id}/history`);

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedTechniques.length === 0 || selectedTechniques.some(tech => file.technique?.includes(tech));
    const matchesDiff = difficultyFilter !== '' ? file.difficulty === difficultyFilter : true;
    return matchesSearch && matchesCat && matchesDiff;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc': return a.title.localeCompare(b.title);
      case 'name_desc': return b.title.localeCompare(a.title);
      case 'difficulty_desc': return (b.difficulty || 0) - (a.difficulty || 0);
      case 'difficulty_asc': return (a.difficulty || 0) - (b.difficulty || 0);
      case 'current_bpm_desc': return (b.max_bpm_achieved || 0) - (a.max_bpm_achieved || 0);
      case 'goal_bpm_desc': return (b.bpm_goal || 0) - (a.bpm_goal || 0);
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const totalPages = Math.ceil(sortedFiles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentFiles = sortedFiles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const MAX_FREE_EXERCISES = 10;
  const canCreateExercise = userTier !== SUBSCRIPTION_TIERS.FREE || files.length < MAX_FREE_EXERCISES;

  const handleCreateClick = () => {
    if (canCreateExercise) {
      window.dispatchEvent(new CustomEvent('app:open-new-exercise-modal'));
      router.push('/library/new');
    } else {
      setShowProModal(true);
    }
  }

  const handleImportClick = () => canCreateExercise ? router.push('/library/import') : setShowProModal(true);

  // Active filter count for badge
  const activeFilterCount =
    (selectedTechniques.length > 0 ? 1 : 0) +
    (difficultyFilter !== '' ? 1 : 0) +
    (sortBy !== 'created_desc' ? 1 : 0);

  const sortLabel: Record<string, string> = {
    created_desc: t('sortBy.createdDesc'),
    name_asc: t('sortBy.nameAsc'),
    name_desc: t('sortBy.nameDesc'),
    difficulty_desc: t('sortBy.difficultyDesc'),
    difficulty_asc: t('sortBy.difficultyAsc'),
    current_bpm_desc: t('sortBy.currentBpmDesc'),
    goal_bpm_desc: t('sortBy.goalBpmDesc'),
  };

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>{t('title')}</h1>
          <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            {loading ? t('loading') : (sortedFiles.length === 1 ? t('foundSingular', { count: 1 }) : t('foundPlural', { count: sortedFiles.length }))}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Tooltip text={t('tooltips.newExercise')}>
            <button
              data-onboarding="library-01"
              onClick={handleCreateClick}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                background: canCreateExercise ? 'var(--gold)' : 'transparent',
                color: canCreateExercise ? '#111' : 'var(--gold)',
                padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem',
                border: canCreateExercise ? 'none' : '1px solid var(--gold)',
                boxShadow: canCreateExercise ? '0 4px 14px rgba(220,185,138,0.25)' : 'none',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {canCreateExercise ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              )}
              {t('newExercise')}
            </button>
          </Tooltip>

          <Tooltip text={t('tooltips.importList')}>
            <button
              onClick={handleImportClick}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                background: canCreateExercise ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: canCreateExercise ? 'var(--text)' : 'var(--muted)',
                padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem',
                border: canCreateExercise ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {canCreateExercise ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              )}
              {t('importList')}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ── Search + filter bar ── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>

        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <svg style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '8px',
              background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filter button */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            ref={filterBtnRef}
            onClick={() => setFiltersOpen(prev => !prev)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.8rem 1.1rem', borderRadius: '8px',
              background: filtersOpen || activeFilterCount > 0 ? 'rgba(220,185,138,0.1)' : 'var(--surface)',
              border: `1px solid ${filtersOpen || activeFilterCount > 0 ? 'rgba(220,185,138,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: activeFilterCount > 0 ? 'var(--gold)' : 'var(--text)',
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.88rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
            {t('filtersBtn')}
            {activeFilterCount > 0 && (
              <span style={{ background: 'var(--gold)', color: '#111', borderRadius: '100px', fontSize: '0.62rem', fontWeight: 800, padding: '1px 6px', lineHeight: 1.4 }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Filter dropdown panel */}
          {filtersOpen && (
            <div
              ref={filterPanelRef}
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', padding: '1.25rem',
                zIndex: 50, minWidth: '320px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column', gap: '1.1rem',
              }}
            >
              {/* Techniques */}
              <div>
                <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 0.6rem' }}>
                  {t('techniquesPlaceholder')}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {TECHNIQUES.map(tech => {
                    const active = selectedTechniques.includes(tech);
                    return (
                      <button key={tech} onClick={() => toggleTechnique(tech)} style={{
                        padding: '0.3rem 0.7rem', borderRadius: '100px', border: `1px solid ${active ? 'rgba(220,185,138,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        background: active ? 'rgba(220,185,138,0.12)' : 'transparent',
                        color: active ? 'var(--gold)' : 'var(--muted)',
                        fontSize: '0.78rem', fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                        {tech}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 0.6rem' }}>
                  {t('difficultyPlaceholder')}
                </p>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[1, 2, 3, 4, 5].map(n => {
                    const active = difficultyFilter === n;
                    const colors: Record<number, string> = { 1: '#4ade80', 2: '#a3e635', 3: '#facc15', 4: '#fb923c', 5: '#f87171' };
                    return (
                      <button key={n} onClick={() => setDifficultyFilter(active ? '' : n)} style={{
                        padding: '0.35rem 0.7rem', borderRadius: '6px',
                        border: `1px solid ${active ? colors[n] + '60' : 'rgba(255,255,255,0.08)'}`,
                        background: active ? colors[n] + '18' : 'transparent',
                        color: active ? colors[n] : 'var(--muted)',
                        fontSize: '0.78rem', fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                        {'★'.repeat(n)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort */}
              <div>
                <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 0.6rem' }}>
                  {t('sortLabel')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {Object.entries(sortLabel).map(([key, label]) => (
                    <button key={key} onClick={() => setSortBy(key)} style={{
                      padding: '0.45rem 0.6rem', borderRadius: '6px', border: 'none',
                      background: sortBy === key ? 'rgba(220,185,138,0.1)' : 'transparent',
                      color: sortBy === key ? 'var(--gold)' : 'var(--muted)',
                      fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif', fontWeight: sortBy === key ? 700 : 400,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      {label}
                      {sortBy === key && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear all */}
              {activeFilterCount > 0 && (
                <button onClick={() => { clearAllFilters(); setFiltersOpen(false); }} style={{
                  padding: '0.5rem', borderRadius: '7px', border: '1px solid rgba(231,76,60,0.2)',
                  background: 'rgba(231,76,60,0.06)', color: '#e74c3c',
                  fontSize: '0.8rem', fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {t('clearFilters')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.2rem', flexShrink: 0 }}>
          {(['rows', 'cards'] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              background: viewMode === mode ? 'var(--surface2)' : 'transparent',
              color: viewMode === mode ? 'var(--gold)' : 'var(--muted)',
              border: 'none', padding: '0.5rem 0.8rem', borderRadius: '6px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            }} title={mode === 'rows' ? t('viewList') : t('viewGrid')}>
              {mode === 'rows' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active filter pills ── */}
      {(selectedTechniques.length > 0 || difficultyFilter !== '' || sortBy !== 'created_desc') && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
          {selectedTechniques.map(tech => (
            <FilterPill key={tech} label={tech} onRemove={() => toggleTechnique(tech)} />
          ))}
          {difficultyFilter !== '' && (
            <FilterPill label={`${'★'.repeat(difficultyFilter as number)}`} onRemove={() => setDifficultyFilter('')} />
          )}
          {sortBy !== 'created_desc' && (
            <FilterPill label={sortLabel[sortBy]} onRemove={() => setSortBy('created_desc')} />
          )}
          <button onClick={clearAllFilters} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', padding: '0 0.25rem' }}>
            {t('clearFilters')}
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <span className="loader" />
        </div>
      ) : files.length === 0 ? (
        <div style={{ background: 'var(--surface)', padding: '4rem 2rem', borderRadius: '12px', border: '1px dashed rgba(220,185,138,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎸</div>
          <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: 600 }}>{t('emptyState.title')}</p>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>{t('emptyState.subtitle')}</p>
        </div>
      ) : sortedFiles.length === 0 ? (
        <div style={{ background: 'var(--surface)', padding: '4rem 2rem', borderRadius: '12px', border: '1px dashed rgba(220,185,138,0.3)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: 600 }}>{t('noMatchState.title')}</p>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>{t('noMatchState.subtitle')}</p>
          <button onClick={clearAllFilters} style={{ marginTop: '1rem', background: 'transparent', color: 'var(--gold)', border: '1px solid var(--gold)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
            {t('noMatchState.clearFilters')}
          </button>
        </div>
      ) : (
        <>
          <div data-onboarding="library-09" style={{
            display: viewMode === 'cards' ? 'grid' : 'flex',
            gridTemplateColumns: viewMode === 'cards' ? 'repeat(auto-fill, minmax(320px, 1fr))' : 'none',
            flexDirection: viewMode === 'rows' ? 'column' : 'row',
            gap: '1.2rem', marginBottom: '2rem',
          }}>
            {currentFiles.map((file) => {
              const isReadonly = userTier === SUBSCRIPTION_TIERS.FREE && files.findIndex(f => f.id === file.id) >= MAX_FREE_EXERCISES;
              return viewMode === 'cards' ? (
                <ExerciseCard key={file.id} file={file} currentBpm={file.max_bpm_achieved} onEdit={handleEditNavigation} onHistory={handleHistoryNavigation} onDelete={() => handleDeleteRequest(file)} readonly={isReadonly} />
              ) : (
                <ExerciseRow key={file.id} file={file} currentBpm={file.max_bpm_achieved} onEdit={handleEditNavigation} onHistory={handleHistoryNavigation} onDelete={() => handleDeleteRequest(file)} readonly={isReadonly} />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} style={{ background: 'rgba(255,255,255,0.05)', color: currentPage === 1 ? 'var(--muted)' : 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1rem', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                {t('pagination.prev')}
              </button>
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                {t('pagination.page')} <strong style={{ color: 'var(--gold)' }}>{currentPage}</strong> {t('pagination.of')} {totalPages}
              </span>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} style={{ background: 'rgba(255,255,255,0.05)', color: currentPage === totalPages ? 'var(--muted)' : 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1rem', borderRadius: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {t('pagination.next')}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}
        </>
      )}

      {exerciseToDelete && (
        <DeleteConfirmModal
          title={t('deleteModal.title')} itemName={exerciseToDelete.title}
          warningMessage={t('deleteModal.warning')} isDeleting={isDeleting}
          onConfirm={confirmDelete} onCancel={() => setExerciseToDelete(null)}
        />
      )}

      {showProModal && <BecomeProModal onClose={() => setShowProModal(false)} description={p('libraryLimit')} />}
    </div>
  );
}