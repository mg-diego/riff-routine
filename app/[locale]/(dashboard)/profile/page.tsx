"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { APP_EVENTS, emitAppEvent } from '@/lib/events';
import { SubscriptionTier } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/utils';
import styles from './page.module.css';
import { TEACHER_MODE_ENABLED } from '@/lib/features';
import { cx } from '@/lib/cx';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type Tier = SubscriptionTier;

const TIER_CONFIG: Record<Tier, { label: string; bg: string; color: string; border: string }> = {
  free: { label: 'FREE', bg: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)', border: 'rgba(255,255,255,0.1)' },
  pro: { label: 'PRO', bg: 'rgba(220,185,138,0.12)', color: 'var(--gold)', border: 'rgba(220,185,138,0.35)' },
  lifetime: { label: 'LIFETIME', bg: 'var(--gold)', color: '#111', border: 'transparent' },
};

function TierPill({ tier }: { tier: Tier }) {
  const c = TIER_CONFIG[tier];
  return (
    <span className={styles.label} style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {c.label}
    </span>
  );
}

function Section({ id, title, description, isDanger, accent, children }: {
  id?: string; title: string; description?: string;
  isDanger?: boolean; accent?: 'purple'; children: React.ReactNode
}) {
  const borderColor = isDanger
    ? 'rgba(231,76,60,0.5)'
    : accent === 'purple'
      ? 'rgba(167,139,250,0.25)'
      : 'rgba(255,255,255,0.05)';
  const headerBorder = isDanger
    ? '1px solid rgba(231,76,60,0.2)'
    : accent === 'purple'
      ? '1px solid rgba(167,139,250,0.15)'
      : '1px solid rgba(255,255,255,0.05)';
  const titleColor = isDanger ? '#e74c3c' : accent === 'purple' ? '#c4b5fd' : 'var(--text)';
  const descColor = isDanger ? 'rgba(231,76,60,0.8)' : 'var(--muted)';

  return (
    <section id={id} className={styles.section} style={{ border: `1px solid ${borderColor}` }}>
      <div className={styles.block} style={{ borderBottom: headerBorder }}>
        <h2 className={styles.heading} style={{ color: titleColor }}>{title}</h2>
        {description && <p className={styles.text} style={{ color: descColor }}>{description}</p>}
      </div>
      <div className={styles.stack}>
        {children}
      </div>
    </section>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <div>
        <p className={styles.text2}>{label}</p>
        {description && <p className={styles.descriptionText}>{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={styles.button} style={{ background: checked ? 'var(--gold)' : 'rgba(255,255,255,0.1)' }}>
      <div className={styles.layer} style={{ left: checked ? '23px' : '3px', background: checked ? '#111' : 'rgba(255,255,255,0.5)' }} />
    </button>
  );
}

export default function ProfilePage() {
  const t = useTranslations('Profile');
  const locale = useLocale();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [usernameSave, setUsernameSave] = useState<SaveState>('idle');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSave, setPasswordSave] = useState<SaveState>('idle');
  const [passwordError, setPasswordError] = useState('');

  const [leftyMode, setLeftyMode] = useState(false);
  const [defaultView, setDefaultView] = useState<'notes' | 'intervals'>('notes');
  const [prefsSave, setPrefsSave] = useState<SaveState>('idle');

  const [tier, setTier] = useState<Tier>('free');
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // ── Teacher mode ────────────────────────────────────────────
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherBio, setTeacherBio] = useState('');
  const [teacherSave, setTeacherSave] = useState<SaveState>('idle');
  const [activatingTeacher, setActivatingTeacher] = useState(false);
  // ────────────────────────────────────────────────────────────

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isProOrLifetime = tier === 'pro' || tier === 'lifetime';

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url, lefty_mode, default_view, subscription_tier, premium_until')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUsername(profile.username || '');
        setAvatarUrl(profile.avatar_url || null);
        setLeftyMode(profile.lefty_mode ?? false);
        setDefaultView(profile.default_view ?? 'notes');
        setTier((profile.subscription_tier as Tier) ?? 'free');
        setPremiumUntil(profile.premium_until ?? null);
      }

      // Check teacher profile
      const { data: teacherProfile } = TEACHER_MODE_ENABLED
        ? await supabase
          .from('teacher_profiles')
          .select('bio')
          .eq('id', user.id)
          .maybeSingle()
        : { data: null };

      if (teacherProfile) {
        setIsTeacher(true);
        setTeacherBio(teacherProfile.bio || '');
      }
    };
    load();
  }, []);

  // Scroll to #teacher anchor on mount
  useEffect(() => {
    if (window.location.hash === '#teacher') {
      setTimeout(() => {
        document.getElementById('teacher')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) { showToast(t('avatar.invalidFormat'), 'error'); return; }
    try {
      const compressedFile = await compressImage(file, 400);
      if (compressedFile.size > 500 * 1024) { showToast(t('avatar.tooLarge'), 'error'); return; }
      const previewReader = new FileReader();
      previewReader.onload = ev => setAvatarPreview(ev.target?.result as string);
      previewReader.readAsDataURL(compressedFile);
      const path = `${userId}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(path, compressedFile, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) { showToast(t('avatar.uploadError'), 'error'); return; }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const urlWithCacheBuster = `${publicUrl}?v=${Date.now()}`;
      const { error: updateError } = await supabase
        .from('profiles').update({ avatar_url: urlWithCacheBuster }).eq('id', userId);
      if (updateError) showToast(t('avatar.uploadError'), 'error');
      else { setAvatarUrl(urlWithCacheBuster); showToast(t('avatar.uploadSuccess'), 'success'); }
    } catch { showToast(t('avatar.uploadError'), 'error'); }
  };

  const handleSaveUsername = async () => {
    if (!userId || !username.trim()) return;
    setUsernameSave('saving');
    const { error } = await supabase.from('profiles').update({ username: username.trim() }).eq('id', userId);
    setUsernameSave(error ? 'error' : 'saved');
    setTimeout(() => setUsernameSave('idle'), 2500);
  };

  const handleSavePassword = async () => {
    setPasswordError('');
    if (newPassword !== confirmPassword) { setPasswordError(t('security.passwordMismatch')); return; }
    if (newPassword.length < 8) { setPasswordError(t('security.passwordTooShort')); return; }
    setPasswordSave('saving');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPasswordError(error.message); setPasswordSave('error'); return; }
    setPasswordSave('saved');
    setNewPassword(''); setConfirmPassword('');
    setTimeout(() => setPasswordSave('idle'), 2500);
  };

  const handleSavePrefs = async () => {
    if (!userId) return;
    setPrefsSave('saving');
    const { error } = await supabase.from('profiles')
      .update({ lefty_mode: leftyMode, default_view: defaultView }).eq('id', userId);
    setPrefsSave(error ? 'error' : 'saved');
    setTimeout(() => setPrefsSave('idle'), 2500);
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
      else showToast(t('subscription.portalError'), 'error');
    } catch {
      showToast(t('subscription.portalError'), 'error');
    } finally {
      setPortalLoading(false);
    }
  };

  // ── Teacher handlers ─────────────────────────────────────────
  const handleActivateTeacher = async () => {
    if (!userId) return;
    setActivatingTeacher(true);
    try {
      const { error } = await supabase
        .from('teacher_profiles')
        .upsert({ id: userId, bio: teacherBio || '', is_active: true });

      if (error) { showToast(t('teacher.activateError'), 'error'); return; }
      setIsTeacher(true);
      showToast(t('teacher.activateSuccess'), 'success');
      localStorage.setItem('rr_app_mode', 'student');
    } catch {
      showToast(t('teacher.activateError'), 'error');
    } finally {
      setActivatingTeacher(false);
      emitAppEvent(APP_EVENTS.TEACHER_MODE_CHANGED);
    }
  };

  const handleSaveTeacherBio = async () => {
    if (!userId) return;
    setTeacherSave('saving');
    const { error } = await supabase
      .from('teacher_profiles')
      .update({ bio: teacherBio })
      .eq('id', userId);
    setTeacherSave(error ? 'error' : 'saved');
    setTimeout(() => setTeacherSave('idle'), 2500);
  };

  const handleDeactivateTeacher = async () => {
    if (!userId) return;
    const { error } = await supabase
      .from('teacher_profiles')
      .update({ is_active: false })
      .eq('id', userId);
    if (error) { showToast(t('teacher.deactivateError'), 'error'); return; }
    setIsTeacher(false);
    localStorage.setItem('rr_app_mode', 'student');
    showToast(t('teacher.deactivateSuccess'), 'success');
    emitAppEvent(APP_EVENTS.TEACHER_MODE_CHANGED);
  };
  // ────────────────────────────────────────────────────────────

  const handleDeleteAccount = async () => {
    await supabase.rpc('delete_user');
    await supabase.auth.signOut();
    router.push(`/${locale}`);
  };

  const handleLanguageSwitch = async () => {
    const newLocale = locale === 'es' ? 'en' : 'es';
    if (userId) await supabase.from('profiles').update({ language: newLocale }).eq('id', userId);
    window.location.href = window.location.pathname.replace(`/${locale}`, `/${newLocale}`);
  };

  const saveLabel = (state: SaveState) => {
    if (state === 'saving') return t('saving');
    if (state === 'saved') return t('saved');
    if (state === 'error') return t('error');
    return t('save');
  };

  const displayAvatar = avatarPreview || avatarUrl;
  const initials = username ? username.slice(0, 2).toUpperCase() : '??';
  const renewalDate = premiumUntil
    ? new Date(premiumUntil).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className={styles.labelStack}>

      {/* Header */}
      <div>
        <p className={styles.labelText}>
          {t('label')}
        </p>
        <h1 className={styles.title}>
          {t('title')}
        </h1>
      </div>

      {/* Avatar + username */}
      <div className={styles.usernameRow}>
        <div className={styles.initialsBlock}>
          <div onClick={() => fileInputRef.current?.click()} className={styles.initialsRow} style={{ background: displayAvatar ? 'transparent' : 'rgba(220,185,138,0.1)' }}>
            {displayAvatar
              ? <img src={displayAvatar} alt="avatar" className={styles.image} />
              : <span className={styles.initialsLabel}>{initials}</span>
            }
            <div className={styles.usernameRowInner}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className={styles.hiddenFileInput} />
        </div>

        <div className={styles.username}>
          <div className={styles.usernameRow2}>
            <label className={styles.usernameFieldLabel}>
              {t('account.username')}
            </label>
            <TierPill tier={tier} />
          </div>
          <div className={styles.usernamePlaceholderStack}>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder={t('account.usernamePlaceholder')} className={cx(styles.input, styles.usernamePlaceholderInput)}
            />
            <button onClick={handleSaveUsername} disabled={usernameSave === 'saving'}
              className={cx(styles.btnPrimary, styles.usernamePlaceholderInput)} style={{ opacity: usernameSave === 'saving' ? 0.6 : 1 }}>
              {saveLabel(usernameSave)}
            </button>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <Section title={t('subscription.title')} description={t('subscription.description')}>
        <Row label={t('subscription.currentPlan')}>
          <TierPill tier={tier} />
        </Row>
        {tier === 'pro' && renewalDate && (
          <Row label={t('subscription.renewsOn')} description={renewalDate}><div /></Row>
        )}
        {tier === 'lifetime' && (
          <Row label={t('subscription.lifetime')} description={t('subscription.lifetimeDesc')}><div /></Row>
        )}
        <div className={styles.upgradeRow}>
          {tier === 'free' && (
            <button onClick={() => router.push(`/${locale}/pro`)} className={styles.btnPrimary}>
              {t('subscription.upgrade')} →
            </button>
          )}
          {tier === 'pro' && (
            <>
              <button onClick={handleManageSubscription} disabled={portalLoading}
                className={styles.btnGhost} style={{ opacity: portalLoading ? 0.6 : 1 }}>
                {portalLoading ? t('subscription.loading') : t('subscription.manage')}
              </button>
              <button onClick={() => router.push(`/${locale}/pro`)} className={styles.btnPrimary}>
                {t('subscription.upgradeLifetime')} →
              </button>
            </>
          )}
          {tier === 'lifetime' && (
            <p className={styles.lifetimeManageText}>
              {t('subscription.lifetimeManage')}
            </p>
          )}
        </div>
      </Section>

      {/* ── Teacher mode ── */}
      {TEACHER_MODE_ENABLED && isProOrLifetime && (
        <Section
          id="teacher"
          title={t('teacher.title')}
          description={t('teacher.description')}
          accent="purple"
        >
          {!isTeacher ? (
            /* Not yet activated */
            <div className={styles.feature1Stack}>
              <div className={styles.usernamePlaceholderStack}>
                {[
                  t('teacher.feature1'),
                  t('teacher.feature2'),
                  t('teacher.feature3'),
                ].map((f, i) => (
                  <div key={i} className={styles.usernamePlaceholderStackRow}>
                    <div className={styles.usernamePlaceholderStackRowInner}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className={styles.usernamePlaceholderStackLabel}>{f}</span>
                  </div>
                ))}
              </div>
              <div className={styles.activatingRow}>
                <button
                  onClick={handleActivateTeacher}
                  disabled={activatingTeacher}
                  className={styles.btnPurple} style={{ opacity: activatingTeacher ? 0.6 : 1 }}
                >
                  {activatingTeacher ? t('teacher.activating') : t('teacher.activate')}
                </button>
              </div>
            </div>
          ) : (
            /* Already a teacher */
            <>
              <div className={styles.activeRow}>
                <div className={styles.activeRowInner}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className={styles.activeLabel}>
                  {t('teacher.active')}
                </span>
              </div>

              <div className={styles.usernamePlaceholderStack}>
                <label className={styles.usernameFieldLabel}>
                  {t('teacher.bioLabel')}
                </label>
                <textarea
                  value={teacherBio}
                  onChange={e => setTeacherBio(e.target.value)}
                  placeholder={t('teacher.bioPlaceholder')}
                  rows={3}
                  className={cx(styles.input, styles.bioPlaceholderTextarea)}
                />
              </div>

              <div className={styles.deactivateRow}>
                <button
                  onClick={handleDeactivateTeacher}
                  className={cx(styles.btnGhost, styles.deactivateButton)}
                >
                  {t('teacher.deactivate')}
                </button>
                <button
                  onClick={handleSaveTeacherBio}
                  disabled={teacherSave === 'saving'}
                  className={styles.btnPurple} style={{ opacity: teacherSave === 'saving' ? 0.6 : 1 }}
                >
                  {saveLabel(teacherSave)}
                </button>
              </div>
            </>
          )}
        </Section>
      )}

      {/* Security */}
      <Section title={t('security.title')} description={t('security.description')}>
        <div className={styles.newPasswordStack}>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
            placeholder={t('security.newPassword')} className={`${styles.input} ${styles.inputFocusable}`}
          />
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            placeholder={t('security.confirmPassword')} className={`${styles.input} ${styles.confirmPasswordFocusable}`}
          />
          {passwordError && <p className={styles.passwordErrorText}>{passwordError}</p>}
          <div className={styles.passwordSaveRow}>
            <button onClick={handleSavePassword} disabled={passwordSave === 'saving'}
              className={styles.btnPrimary} style={{ opacity: passwordSave === 'saving' ? 0.6 : 1 }}>
              {saveLabel(passwordSave)}
            </button>
          </div>
        </div>
      </Section>

      {/* Preferences */}
      <Section title={t('preferences.title')} description={t('preferences.description')}>
        <Row label={t('preferences.language')} description={t('preferences.languageDesc')}>
          <button onClick={handleLanguageSwitch} className={styles.btnGhost}>
            {locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          </button>
        </Row>
        <div className={styles.labelStackBlock} />
        <Row label={t('preferences.leftyMode')} description={t('preferences.leftyModeDesc')}>
          <Toggle checked={leftyMode} onChange={setLeftyMode} />
        </Row>
        <Row label={t('preferences.defaultView')} description={t('preferences.defaultViewDesc')}>
          <div className={styles.labelStackRow}>
            {(['notes', 'intervals'] as const).map(v => (
              <button key={v} onClick={() => setDefaultView(v)} className={styles.labelStackButton} style={{ background: defaultView === v ? 'var(--gold)' : 'rgba(255,255,255,0.04)', color: defaultView === v ? '#111' : 'var(--muted)', border: defaultView === v ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                {t(`preferences.${v}`)}
              </button>
            ))}
          </div>
        </Row>
        <div className={styles.prefsSaveRow}>
          <button onClick={handleSavePrefs} disabled={prefsSave === 'saving'}
            className={styles.btnPrimary} style={{ opacity: prefsSave === 'saving' ? 0.6 : 1 }}>
            {saveLabel(prefsSave)}
          </button>
        </div>
      </Section>

      {/* Danger */}
      <Section title={t('danger.title')} isDanger>
        <Row label={t('danger.deleteAccount')} description={t('danger.deleteDescription')}>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              className={cx(styles.btnGhost, styles.deleteButton)}>
              {t('danger.deleteButton')}
            </button>
          ) : (
            <div className={styles.deleteConfirmRow}>
              <span className={styles.deleteConfirmLabel}>{t('danger.deleteConfirm')}</span>
              <button onClick={handleDeleteAccount} className={cx(styles.btnPrimary, styles.confirmYesButton)}>
                {t('danger.confirmYes')}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className={styles.btnGhost}>
                {t('danger.confirmNo')}
              </button>
            </div>
          )}
        </Row>
      </Section>

      {/* Toast */}
      {toast && (
        <div className={styles.block4} style={{ background: toast.type === 'success' ? '#2ecc71' : '#e74c3c' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}