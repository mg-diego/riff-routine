"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { Exercise } from '../../../../lib/types';
import { TECHNIQUES, DIFFICULTY_LABELS, SUBSCRIPTION_TIERS, SubscriptionTier } from '../../../../lib/constants';
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

export default function LibraryPage() {
  const router = useRouter();
  const t = useTranslations('LibraryPage');
  const p = useTranslations('BecomeProModal');

  const [files, setFiles] = useState<ExerciseWithProgress[]>([]);
  const [userTier, setUserTier] = useState<SubscriptionTier>(SUBSCRIPTION_TIERS.FREE);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'rows' | 'cards'>('rows');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [isTechDropdownOpen, setIsTechDropdownOpen] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<string>('created_desc');

  const [currentPage, setCurrentPage] = useState(1);

  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTechniques, difficultyFilter, sortBy]);

  const fetchExercises = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    if (profile) {
      setUserTier((profile.subscription_tier as SubscriptionTier) || SUBSCRIPTION_TIERS.FREE);
    }

    const { data: exercisesData, error: exercisesError } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (exercisesError || !exercisesData) {
      setError(exercisesError?.message || t('errors.load'));
      setLoading(false);
      return;
    }

    const exerciseIds = exercisesData.map(ex => ex.id);

    if (exerciseIds.length > 0) {
      const { data: logsData, error: logsError } = await supabase
        .from('practice_logs')
        .select('exercise_id, bpm_used')
        .in('exercise_id', exerciseIds)
        .eq('user_id', user.id);

      if (!logsError && logsData) {
        const maxBpms: Record<string, number> = {};
        logsData.forEach(log => {
          if (!maxBpms[log.exercise_id] || log.bpm_used > maxBpms[log.exercise_id]) {
            maxBpms[log.exercise_id] = log.bpm_used;
          }
        });

        const enrichedExercises = exercisesData.map(ex => ({
          ...ex,
          max_bpm_achieved: maxBpms[ex.id] || undefined
        }));

        setFiles(enrichedExercises);
      } else {
        setFiles(exercisesData);
      }
    } else {
      setFiles([]);
    }

    setLoading(false);
  };

  const handleDeleteRequest = (exercise: Exercise) => {
    setExerciseToDelete(exercise);
  };

  const { formatExerciseList } = useTranslatedExercise();

  const confirmDelete = async () => {
    if (!exerciseToDelete) return;
    setIsDeleting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('errors.auth'));

      if (exerciseToDelete.file_url && typeof exerciseToDelete.file_url === 'string' && exerciseToDelete.file_url.startsWith('http')) {
        try {
          const url = new URL(exerciseToDelete.file_url);
          const parts = url.pathname.split('/');
          const bucketIndex = parts.indexOf('guitar_tabs');
          if (bucketIndex !== -1) {
            const storagePath = parts.slice(bucketIndex + 1).join('/');
            await supabase.storage.from('guitar_tabs').remove([storagePath]);
          }
        } catch (storageErr) {
          console.warn(storageErr);
        }
      }

      const { error: logsError } = await supabase.from('practice_logs')
        .delete()
        .eq('exercise_id', exerciseToDelete.id);
      if (logsError) throw new Error(`Error en practice_logs: ${logsError.message}`);

      const { error: routinesError } = await supabase.from('routine_exercises')
        .delete()
        .eq('exercise_id', exerciseToDelete.id);
      if (routinesError && routinesError.code !== '42P01') {
        throw new Error(`Error en routine_exercises: ${routinesError.message}`);
      }

      const { data: rawData, error: dbError } = await supabase.from('exercises')
        .delete()
        .eq('id', exerciseToDelete.id)
        .eq('user_id', user.id)
        .select();

      if (dbError) throw new Error(dbError.message);

      let data: Exercise[] = [];
      if (rawData) {
        data = formatExerciseList(rawData);
      }

      if (!data || data.length === 0) throw new Error(t('errors.rls'));

      await fetchExercises();
      setExerciseToDelete(null);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleTechnique = (tech: string) => {
    if (selectedTechniques.includes(tech)) {
      setSelectedTechniques(selectedTechniques.filter(t => t !== tech));
    } else {
      setSelectedTechniques([...selectedTechniques, tech]);
    }
  };

  const handleEditNavigation = (exercise: Exercise) => {
    router.push(`/library/${exercise.id}`);
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedTechniques.length === 0 || selectedTechniques.some(tech => file.technique?.includes(tech));
    const matchesDiff = difficultyFilter !== '' ? file.difficulty === difficultyFilter : true;
    return matchesSearch && matchesCat && matchesDiff;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return a.title.localeCompare(b.title);
      case 'name_desc':
        return b.title.localeCompare(a.title);
      case 'difficulty_desc':
        return (b.difficulty || 0) - (a.difficulty || 0);
      case 'difficulty_asc':
        return (a.difficulty || 0) - (b.difficulty || 0);
      case 'current_bpm_desc':
        return (b.max_bpm_achieved || 0) - (a.max_bpm_achieved || 0);
      case 'goal_bpm_desc':
        return (b.bpm_goal || 0) - (a.bpm_goal || 0);
      case 'created_desc':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const totalPages = Math.ceil(sortedFiles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentFiles = sortedFiles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHistoryNavigation = (exercise: Exercise) => {
    router.push(`/library/${exercise.id}/history`);
  };

  const MAX_FREE_EXERCISES = 10;
  const canCreateExercise = userTier !== SUBSCRIPTION_TIERS.FREE || files.length < MAX_FREE_EXERCISES;

  const handleCreateClick = () => {
    if (canCreateExercise) {
      router.push('/library/new');
    } else {
      setShowProModal(true);
    }
  };

  const handleImportClick = () => {
    if (canCreateExercise) {
      router.push('/library/import');
    } else {
      setShowProModal(true);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>{t('title')}</h1>
          <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            {loading ? t('loading') : (sortedFiles.length === 1 ? t('foundSingular', { count: 1 }) : t('foundPlural', { count: sortedFiles.length }))}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleCreateClick} style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: canCreateExercise ? 'var(--gold)' : 'transparent',
            color: canCreateExercise ? '#111' : 'var(--gold)',
            padding: '0.8rem 1.5rem',
            borderRadius: '8px', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem',
            border: canCreateExercise ? 'none' : '1px solid var(--gold)',
            boxShadow: canCreateExercise ? '0 4px 14px rgba(220,185,138,0.25)' : 'none',
            transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = canCreateExercise ? 'var(--gold-dark)' : 'rgba(220,185,138,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = canCreateExercise ? 'var(--gold)' : 'transparent';
            }}
          >
            {canCreateExercise ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            )}
            {t('newExercise')}
          </button>

          <button
            onClick={handleImportClick}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: canCreateExercise ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              color: canCreateExercise ? 'var(--text)' : 'var(--muted)',
              padding: '0.8rem 1.5rem',
              borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem',
              border: canCreateExercise ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = canCreateExercise ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = canCreateExercise ? 'rgba(255, 255, 255, 0.05)' : 'transparent';
            }}
          >
            {canCreateExercise ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            )}
            {t('importList')}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            flex: '1 1 200px', padding: '0.8rem 1rem', borderRadius: '8px',
            background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem',
            outline: 'none',
          }}
        />

        <div style={{ position: 'relative', flex: '0 1 200px' }}>
          {isTechDropdownOpen && (
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 9 }}
              onClick={() => setIsTechDropdownOpen(false)}
            />
          )}

          <button
            onClick={() => setIsTechDropdownOpen(!isTechDropdownOpen)}
            style={{
              width: '100%', padding: '0.8rem 1rem', borderRadius: '8px',
              background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
              color: selectedTechniques.length > 0 ? 'var(--text)' : 'var(--muted)',
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem',
              outline: 'none', cursor: 'pointer', textAlign: 'left',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}
          >
            {selectedTechniques.length === 0
              ? t('techniquesPlaceholder')
              : selectedTechniques.length === 1 ? t('techniquesSelected', { count: 1 }) : t('techniquesSelectedPlural', { count: selectedTechniques.length })}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isTechDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {isTechDropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%',
              background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '0.5rem', zIndex: 10,
              maxHeight: '250px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem',
                cursor: 'pointer', borderRadius: '4px', color: selectedTechniques.length === 0 ? 'var(--gold)' : 'var(--text)'
              }}>
                <input
                  type="checkbox"
                  checked={selectedTechniques.length === 0}
                  onChange={() => setSelectedTechniques([])}
                  style={{ accentColor: 'var(--gold)' }}
                />
                {t('allTechniques')}
              </label>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.2rem 0' }} />

              {TECHNIQUES.map(tech => (
                <label key={tech} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem',
                  cursor: 'pointer', borderRadius: '4px', color: 'var(--text)'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <input
                    type="checkbox"
                    checked={selectedTechniques.includes(tech)}
                    onChange={() => toggleTechnique(tech)}
                    style={{ accentColor: 'var(--gold)' }}
                  />
                  {tech}
                </label>
              ))}
            </div>
          )}
        </div>

        <select
          value={difficultyFilter}
          onChange={e => setDifficultyFilter(e.target.value === '' ? '' : Number(e.target.value))}
          style={{
            flex: '0 1 150px', padding: '0.8rem 1rem', borderRadius: '8px',
            background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
            color: difficultyFilter !== '' ? 'var(--text)' : 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem',
            outline: 'none', cursor: 'pointer'
          }}
        >
          <option value="">{t('difficultyPlaceholder')}</option>
          {[1, 2, 3, 4, 5].map(n => (
            <option key={n} value={n} style={{ color: 'var(--text)' }}>
              {t('difficultyLevel', { level: n, label: DIFFICULTY_LABELS[n as keyof typeof DIFFICULTY_LABELS] })}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            flex: '0 1 160px', padding: '0.8rem 1rem', borderRadius: '8px',
            background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem',
            outline: 'none', cursor: 'pointer'
          }}
        >
          <option value="created_desc">{t('sortBy.createdDesc')}</option>
          <option value="name_asc">{t('sortBy.nameAsc')}</option>
          <option value="name_desc">{t('sortBy.nameDesc')}</option>
          <option value="difficulty_desc">{t('sortBy.difficultyDesc')}</option>
          <option value="difficulty_asc">{t('sortBy.difficultyAsc')}</option>
          <option value="current_bpm_desc">{t('sortBy.currentBpmDesc')}</option>
          <option value="goal_bpm_desc">{t('sortBy.goalBpmDesc')}</option>
        </select>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.2rem', marginLeft: 'auto' }}>
          <button
            onClick={() => setViewMode('rows')}
            style={{
              background: viewMode === 'rows' ? 'var(--surface2)' : 'transparent',
              color: viewMode === 'rows' ? 'var(--gold)' : 'var(--muted)',
              border: 'none', padding: '0.5rem 0.8rem', borderRadius: '6px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }}
            title={t('viewList')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            style={{
              background: viewMode === 'cards' ? 'var(--surface2)' : 'transparent',
              color: viewMode === 'cards' ? 'var(--gold)' : 'var(--muted)',
              border: 'none', padding: '0.5rem 0.8rem', borderRadius: '6px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }}
            title={t('viewGrid')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>✕</button>
        </div>
      )}

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
          <button
            onClick={() => { setSearchTerm(''); setSelectedTechniques([]); setDifficultyFilter(''); }}
            style={{ marginTop: '1rem', background: 'transparent', color: 'var(--gold)', border: '1px solid var(--gold)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
          >
            {t('noMatchState.clearFilters')}
          </button>
        </div>
      ) : (
        <>
          <div data-onboarding="library-list" style={{
            display: viewMode === 'cards' ? 'grid' : 'flex',
            gridTemplateColumns: viewMode === 'cards' ? 'repeat(auto-fill, minmax(320px, 1fr))' : 'none',
            flexDirection: viewMode === 'rows' ? 'column' : 'row',
            gap: '1.2rem',
            marginBottom: '2rem'
          }}>
            {currentFiles.map((file) => {
              const isReadonly = userTier === SUBSCRIPTION_TIERS.FREE && files.findIndex(f => f.id === file.id) >= MAX_FREE_EXERCISES;
              
              return viewMode === 'cards' ? (
                <ExerciseCard
                  key={file.id}
                  file={file}
                  currentBpm={file.max_bpm_achieved}
                  onEdit={handleEditNavigation}
                  onHistory={handleHistoryNavigation}
                  onDelete={() => handleDeleteRequest(file)}
                  readonly={isReadonly}
                />
              ) : (
                <ExerciseRow
                  key={file.id}
                  file={file}
                  currentBpm={file.max_bpm_achieved}
                  onEdit={handleEditNavigation}
                  onHistory={handleHistoryNavigation}
                  onDelete={() => handleDeleteRequest(file)}
                  readonly={isReadonly}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div data-onboarding="library-list" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  background: 'rgba(255,255,255,0.05)', color: currentPage === 1 ? 'var(--muted)' : 'var(--text)',
                  border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1rem', borderRadius: '8px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                {t('pagination.prev')}
              </button>

              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                {t('pagination.page')} <strong style={{ color: 'var(--gold)' }}>{currentPage}</strong> {t('pagination.of')} {totalPages}
              </span>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  background: 'rgba(255,255,255,0.05)', color: currentPage === totalPages ? 'var(--muted)' : 'var(--text)',
                  border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1rem', borderRadius: '8px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                {t('pagination.next')}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}
        </>
      )}

      {exerciseToDelete && (
        <DeleteConfirmModal
          title={t('deleteModal.title')}
          itemName={exerciseToDelete.title}
          warningMessage={t('deleteModal.warning')}
          isDeleting={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setExerciseToDelete(null)}
        />
      )}

      {showProModal && (
        <BecomeProModal onClose={() => setShowProModal(false)} description={p('libraryLimit')} />
      )}
    </div>
  );
}