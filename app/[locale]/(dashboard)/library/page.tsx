"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Exercise } from '@/lib/types';
import { TECHNIQUES, SUBSCRIPTION_TIERS, SubscriptionTier, DIFFICULTY_COLORS } from '@/lib/constants';
import { FREE_TIER_LIMITS, fetchSubscriptionTier, isFreeTier } from '@/lib/subscription';
import { APP_EVENTS, emitAppEvent } from '@/lib/events';
import { ExerciseCard } from '@/components/library/ExerciseCard';
import { ExerciseRow } from '@/components/library/ExerciseRow';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { useTranslations } from 'next-intl';
import { useTranslatedExercise } from '@/hooks/useTranslatedExercise';
import { BecomeProModal } from '@/components/ui/BecomeProModal';
import styles from './page.module.css';
import ui from '@/components/ui/ui.module.css';

interface ExerciseWithProgress extends Exercise {
  max_bpm_achieved?: number;
}

const ITEMS_PER_PAGE = 20;

// ── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      {children}
      <div className={styles.layer}>
        {text}
        <div className={styles.layer2} />
      </div>
    </div>
  );
}

// ── Active filter pills ───────────────────────────────────────────────────────
function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className={styles.row2}>
      {label}
      <button onClick={onRemove} className={styles.button}>
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

    setUserTier(await fetchSubscriptionTier(user.id));

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

  const canCreateExercise = !isFreeTier(userTier) || files.length < FREE_TIER_LIMITS.exercises;

  const handleCreateClick = () => {
    if (canCreateExercise) {
      emitAppEvent(APP_EVENTS.OPEN_NEW_EXERCISE_MODAL);
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
      <div className={styles.titleRow}>
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle">
            {loading ? t('loading') : (sortedFiles.length === 1 ? t('foundSingular', { count: 1 }) : t('foundPlural', { count: sortedFiles.length }))}
          </p>
        </div>

        <div className={styles.newExerciseRow}>
          <Tooltip text={t('tooltips.newExercise')}>
            <button
              data-onboarding="library-01"
              onClick={handleCreateClick}
              className={styles.newExerciseButton} style={{ background: canCreateExercise ? 'var(--gold)' : 'transparent', color: canCreateExercise ? '#111' : 'var(--gold)', border: canCreateExercise ? 'none' : '1px solid var(--gold)', boxShadow: canCreateExercise ? '0 4px 14px rgba(220,185,138,0.25)' : 'none' }}
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
              className={styles.importListButton} style={{ background: canCreateExercise ? 'rgba(255,255,255,0.05)' : 'transparent', color: canCreateExercise ? 'var(--text)' : 'var(--muted)', border: canCreateExercise ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)' }}
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
      <div className={styles.searchPlaceholderRow}>

        {/* Search */}
        <div className={styles.searchPlaceholder}>
          <svg className={styles.icon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.searchPlaceholderInput}
          />
        </div>

        {/* Filter button */}
        <div className={styles.filtersBtn}>
          <button
            ref={filterBtnRef}
            onClick={() => setFiltersOpen(prev => !prev)}
            className={styles.filtersBtnButton} style={{ background: filtersOpen || activeFilterCount > 0 ? 'rgba(220,185,138,0.1)' : 'var(--surface)', border: `1px solid ${filtersOpen || activeFilterCount > 0 ? 'rgba(220,185,138,0.3)' : 'rgba(255,255,255,0.1)'}`, color: activeFilterCount > 0 ? 'var(--gold)' : 'var(--text)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
            {t('filtersBtn')}
            {activeFilterCount > 0 && (
              <span className={styles.label}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Filter dropdown panel */}
          {filtersOpen && (
            <div
              ref={filterPanelRef}
              className={styles.techniquesPlaceholderStack}
            >
              {/* Techniques */}
              <div>
                <p className={styles.techniquesPlaceholderText}>
                  {t('techniquesPlaceholder')}
                </p>
                <div className={styles.techRow}>
                  {TECHNIQUES.map(tech => {
                    const active = selectedTechniques.includes(tech);
                    return (
                      <button key={tech} onClick={() => toggleTechnique(tech)} className={styles.techButton} style={{ border: `1px solid ${active ? 'rgba(220,185,138,0.4)' : 'rgba(255,255,255,0.08)'}`, background: active ? 'rgba(220,185,138,0.12)' : 'transparent', color: active ? 'var(--gold)' : 'var(--muted)' }}>
                        {tech}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <p className={styles.techniquesPlaceholderText}>
                  {t('difficultyPlaceholder')}
                </p>
                <div className={styles.techniquesPlaceholderStackRow}>
                  {[1, 2, 3, 4, 5].map(n => {
                    const active = difficultyFilter === n;
                    const colors = DIFFICULTY_COLORS;
                    return (
                      <button key={n} onClick={() => setDifficultyFilter(active ? '' : n)} className={styles.techniquesPlaceholderStackButton} style={{ border: `1px solid ${active ? colors[n] + '60' : 'rgba(255,255,255,0.08)'}`, background: active ? colors[n] + '18' : 'transparent', color: active ? colors[n] : 'var(--muted)' }}>
                        {'★'.repeat(n)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort */}
              <div>
                <p className={styles.techniquesPlaceholderText}>
                  {t('sortLabel')}
                </p>
                <div className={styles.stack}>
                  {Object.entries(sortLabel).map(([key, label]) => (
                    <button key={key} onClick={() => setSortBy(key)} className={styles.button4} style={{ background: sortBy === key ? 'rgba(220,185,138,0.1)' : 'transparent', color: sortBy === key ? 'var(--gold)' : 'var(--muted)', fontWeight: sortBy === key ? 700 : 400 }}>
                      {label}
                      {sortBy === key && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear all */}
              {activeFilterCount > 0 && (
                <button onClick={() => { clearAllFilters(); setFiltersOpen(false); }} className={styles.clearFiltersButton}>
                  {t('clearFilters')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className={styles.viewListRow}>
          {(['rows', 'cards'] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)} className={styles.viewListButton} style={{ background: viewMode === mode ? 'var(--surface2)' : 'transparent', color: viewMode === mode ? 'var(--gold)' : 'var(--muted)' }} title={mode === 'rows' ? t('viewList') : t('viewGrid')}>
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
        <div className={styles.clearFiltersRow}>
          {selectedTechniques.map(tech => (
            <FilterPill key={tech} label={tech} onRemove={() => toggleTechnique(tech)} />
          ))}
          {difficultyFilter !== '' && (
            <FilterPill label={`${'★'.repeat(difficultyFilter as number)}`} onRemove={() => setDifficultyFilter('')} />
          )}
          {sortBy !== 'created_desc' && (
            <FilterPill label={sortLabel[sortBy]} onRemove={() => setSortBy('created_desc')} />
          )}
          <button onClick={clearAllFilters} className={styles.clearFiltersButton2}>
            {t('clearFilters')}
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className={`alert-error ${styles.errorRow}`}>
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className={ui.dangerTextButton}>✕</button>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="loader-container">
          <span className="loader" />
        </div>
      ) : files.length === 0 ? (
        <div className="empty-state">
          <div className={styles.block}>🎸</div>
          <p className={styles.titleText}>{t('emptyState.title')}</p>
          <p className={styles.subtitleText}>{t('emptyState.subtitle')}</p>
        </div>
      ) : sortedFiles.length === 0 ? (
        <div className="empty-state">
          <p className={styles.titleText}>{t('noMatchState.title')}</p>
          <p className={styles.subtitleText}>{t('noMatchState.subtitle')}</p>
          <button onClick={clearAllFilters} className={styles.clearFiltersButton3}>
            {t('noMatchState.clearFilters')}
          </button>
        </div>
      ) : (
        <>
          <div data-onboarding="library-09" className={styles.block2} style={{ display: viewMode === 'cards' ? 'grid' : 'flex', gridTemplateColumns: viewMode === 'cards' ? 'repeat(auto-fill, minmax(320px, 1fr))' : 'none', flexDirection: viewMode === 'rows' ? 'column' : 'row' }}>
            {currentFiles.map((file) => {
              const isReadonly = isFreeTier(userTier) && files.findIndex(f => f.id === file.id) >= FREE_TIER_LIMITS.exercises;
              return viewMode === 'cards' ? (
                <ExerciseCard key={file.id} file={file} currentBpm={file.max_bpm_achieved} onEdit={handleEditNavigation} onHistory={handleHistoryNavigation} onDelete={() => handleDeleteRequest(file)} readonly={isReadonly} />
              ) : (
                <ExerciseRow key={file.id} file={file} currentBpm={file.max_bpm_achieved} onEdit={handleEditNavigation} onHistory={handleHistoryNavigation} onDelete={() => handleDeleteRequest(file)} readonly={isReadonly} />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className={styles.prevRow}>
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className={styles.prevButton} style={{ color: currentPage === 1 ? 'var(--muted)' : 'var(--text)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                {t('pagination.prev')}
              </button>
              <span className={styles.pageLabel}>
                {t('pagination.page')} <strong className={styles.strong}>{currentPage}</strong> {t('pagination.of')} {totalPages}
              </span>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className={styles.prevButton} style={{ color: currentPage === totalPages ? 'var(--muted)' : 'var(--text)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
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