"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../../lib/supabase';
import { ExerciseForm } from '../../../../../components/library/ExerciseForm';
import { BecomeProModal } from '../../../../../components/ui/BecomeProModal';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '../../../../../lib/constants';
import { useTranslations } from 'next-intl';

const MAX_FREE_EXERCISES = 10;

export default function NewExercisePage() {
  const router = useRouter();
  const t = useTranslations('NewExercisePage');
  const p = useTranslations('BecomeProModal');
  const inputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [name, setName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [bpmSuggested, setBpmSuggested] = useState<string | number>('');
  const [bpmGoal, setBpmGoal] = useState<string | number>('');
  const [difficulty, setDifficulty] = useState(0);
  const [notes, setNotes] = useState('');

  // Estados para validación de tier
  const [userTier, setUserTier] = useState<SubscriptionTier>(SUBSCRIPTION_TIERS.FREE);
  const [currentExerciseCount, setCurrentExerciseCount] = useState(0);
  const [showProModal, setShowProModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserTier((profile.subscription_tier as SubscriptionTier) || SUBSCRIPTION_TIERS.FREE);
      }

      const { count } = await supabase
        .from('exercises')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count !== null) {
        setCurrentExerciseCount(count);
      }
    };

    fetchUserData();
  }, []);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setDragOver(false);
    let f: File | undefined;

    if ('dataTransfer' in e) {
      f = e.dataTransfer?.files[0];
    } else {
      f = e.target.files?.[0];
    }

    if (!f) return;

    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!ext || !['gp', 'gp3', 'gp4', 'gp5', 'gpx'].includes(ext)) {
      setError(t('fileDrop.invalidFormat'));
      return;
    }

    setFile(f);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return setError(t('form.nameRequired'));
    if (categories.length === 0) return setError(t('form.categoryRequired'));
    if (difficulty < 1 || difficulty > 5) return setError(t('form.difficultyRequired'));

    // Validación de límite del Tier Free
    if (userTier === SUBSCRIPTION_TIERS.FREE && currentExerciseCount >= MAX_FREE_EXERCISES) {
      setShowProModal(true);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error(t('form.authRequired'));

      let currentFileUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('guitar_tabs').upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('guitar_tabs').getPublicUrl(filePath);
        currentFileUrl = publicUrl;
      }

      const { error: dbError } = await supabase.from('exercises').insert({
        user_id: user.id,
        title: name.trim(),
        file_url: currentFileUrl,
        technique: categories.join(', '),
        bpm_suggested: bpmSuggested ? parseInt(String(bpmSuggested)) : null,
        bpm_goal: bpmGoal ? parseInt(String(bpmGoal)) : null,
        difficulty,
        notes: notes.trim() || null,
      });

      if (dbError) throw dbError;

      window.dispatchEvent(new CustomEvent('app:exercise-created'));
      router.push('/library');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-onboarding="library-08" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
      <button
        onClick={() => router.push('/library')}
        style={{
          background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem',
          padding: 0, fontFamily: 'DM Sans, sans-serif', transition: 'color 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        {t('back')}
      </button>

      <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: 'var(--gold)', margin: '0 0 1.5rem 0', lineHeight: 1 }}>
          {t('title')}
        </h1>

        <div
          data-onboarding="library-02"
          onDrop={handleFileDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--gold)' : file ? 'rgba(74,222,128,0.5)' : 'rgba(220,185,138,0.3)'}`,
            borderRadius: '10px',
            padding: '1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'rgba(220,185,138,0.05)' : file ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100px',
            marginBottom: '1.5rem'
          }}
        >
          <input ref={inputRef} type="file" accept=".gp,.gp3,.gp4,.gp5,.gpx" onChange={handleFileDrop} hidden />

          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textAlign: 'left' }}>
              <div style={{ fontSize: '1.8rem' }}>🎵</div>
              <div>
                <p style={{ color: '#4ade80', margin: 0, fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.2 }}>{file.name}</p>
                <p style={{ color: 'var(--muted)', margin: '0.2rem 0 0', fontSize: '0.8rem' }}>
                  {(file.size / 1024).toFixed(1)} KB · {t('fileDrop.readyToUpload')}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontSize: '1.8rem' }}>🎸</div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>
                  {t('fileDrop.guitarProFile')} <span style={{ fontWeight: 400, fontSize: '0.85rem' }}>{t('fileDrop.optional')}</span>
                </p>
                <p style={{ color: 'rgba(106,95,82,0.6)', margin: 0, fontSize: '0.8rem' }}>{t('fileDrop.dragOrClick')}</p>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <ExerciseForm {...{ name, setName, categories, setCategories, bpmSuggested, setBpmSuggested, bpmGoal, setBpmGoal, difficulty, setDifficulty, notes, setNotes }} />
        </div>

        {error && (
          <div style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#e74c3c', fontSize: '0.88rem', marginTop: '1.5rem' }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              width: '100%', padding: '1rem', background: 'var(--gold)', color: '#111',
              border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem',
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif',
              opacity: saving ? 0.7 : 1, transition: 'background 0.2s'
            }}
          >
            {saving ? t('buttons.saving') : t('buttons.save')}
          </button>
        </div>
      </div>

      {showProModal && (
        <BecomeProModal 
          onClose={() => setShowProModal(false)} 
          description={p('libraryLimit')} 
        />
      )}
    </div>
  );
}