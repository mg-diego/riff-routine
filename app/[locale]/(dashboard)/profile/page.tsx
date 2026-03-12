"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section style={{
      background: 'var(--surface)', borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.05)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ color: 'var(--text)', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{title}</h2>
        {description && <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{description}</p>}
      </div>
      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {children}
      </div>
    </section>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <div>
        <p style={{ color: 'var(--text)', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>{label}</p>
        {description && <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: '0.15rem 0 0' }}>{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none',
        background: checked ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
        cursor: 'pointer', position: 'relative', flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: checked ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: checked ? '#111' : 'rgba(255,255,255,0.5)',
        transition: 'left 0.2s, background 0.2s',
      }} />
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', padding: '0.55rem 0.85rem', color: 'var(--text)',
  fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', outline: 'none',
  width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s',
};

const btnPrimary: React.CSSProperties = {
  padding: '0.55rem 1.1rem', background: 'var(--gold)', border: 'none',
  borderRadius: '8px', color: '#111', fontWeight: 700, fontSize: '0.82rem',
  fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', transition: 'opacity 0.15s', flexShrink: 0,
};

const btnGhost: React.CSSProperties = {
  padding: '0.55rem 1.1rem', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
  color: 'var(--muted)', fontWeight: 600, fontSize: '0.82rem',
  fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
};

export default function ProfilePage() {
  const t = useTranslations('Profile');
  const locale = useLocale();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [usernameSave, setUsernameSave] = useState<SaveState>('idle');

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSave, setPasswordSave] = useState<SaveState>('idle');
  const [passwordError, setPasswordError] = useState('');

  // Preferences (stored in profiles)
  const [leftyMode, setLeftyMode] = useState(false);
  const [defaultView, setDefaultView] = useState<'notes' | 'intervals'>('notes');
  const [prefsSave, setPrefsSave] = useState<SaveState>('idle');

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url, lefty_mode, default_view')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUsername(profile.username || '');
        setAvatarUrl(profile.avatar_url || null);
        setLeftyMode(profile.lefty_mode ?? false);
        setDefaultView(profile.default_view ?? 'notes');
      }
    };
    load();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Preview
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) return;

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
    setAvatarUrl(publicUrl);
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
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setTimeout(() => setPasswordSave('idle'), 2500);
  };

  const handleSavePrefs = async () => {
    if (!userId) return;
    setPrefsSave('saving');
    const { error } = await supabase.from('profiles')
      .update({ lefty_mode: leftyMode, default_view: defaultView })
      .eq('id', userId);
    setPrefsSave(error ? 'error' : 'saved');
    setTimeout(() => setPrefsSave('idle'), 2500);
  };

  const handleDeleteAccount = async () => {
    // Calls a Supabase Edge Function or RPC to delete the user
    // Replace with your actual delete implementation
    await supabase.rpc('delete_user');
    await supabase.auth.signOut();
    router.push(`/${locale}`);
  };

  const handleLanguageSwitch = () => {
    const newLocale = locale === 'es' ? 'en' : 'es';
    const path = window.location.pathname.replace(`/${locale}`, `/${newLocale}`);
    window.location.href = path;
  };

  const saveLabel = (state: SaveState) => {
    if (state === 'saving') return t('saving');
    if (state === 'saved') return t('saved');
    if (state === 'error') return t('error');
    return t('save');
  };

  const displayAvatar = avatarPreview || avatarUrl;
  const initials = username ? username.slice(0, 2).toUpperCase() : '??';

  return (
    <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div>
        <p style={{ color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 0.3rem', opacity: 0.7 }}>
          {t('label')}
        </p>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
          {t('title')}
        </h1>
      </div>

      {/* Avatar + username hero */}
      <div style={{
        background: 'var(--surface)', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap',
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: displayAvatar ? 'transparent' : 'rgba(220,185,138,0.1)',
              border: '2px solid rgba(220,185,138,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', overflow: 'hidden', position: 'relative',
            }}
          >
            {displayAvatar ? (
              <img src={displayAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: 'var(--gold)', letterSpacing: '0.05em' }}>{initials}</span>
            )}
            {/* Hover overlay */}
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
        </div>

        {/* Username input */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {t('account.username')}
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input
              type="text" value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={t('account.usernamePlaceholder')}
              style={{ ...inputStyle, width: '100%' }}
              onFocus={e => e.target.style.borderColor = 'rgba(220,185,138,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button
              onClick={handleSaveUsername}
              disabled={usernameSave === 'saving'}
              style={{ ...btnPrimary, opacity: usernameSave === 'saving' ? 0.6 : 1, width: '100%' }}
            >
              {saveLabel(usernameSave)}
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <Section title={t('security.title')} description={t('security.description')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
            placeholder={t('security.newPassword')} style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(220,185,138,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            placeholder={t('security.confirmPassword')} style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(220,185,138,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          {passwordError && <p style={{ color: '#e74c3c', fontSize: '0.78rem', margin: 0 }}>{passwordError}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSavePassword} disabled={passwordSave === 'saving'} style={{ ...btnPrimary, opacity: passwordSave === 'saving' ? 0.6 : 1 }}>
              {saveLabel(passwordSave)}
            </button>
          </div>
        </div>
      </Section>

      {/* Preferences */}
      <Section title={t('preferences.title')} description={t('preferences.description')}>
        <Row label={t('preferences.language')} description={t('preferences.languageDesc')}>
          <button onClick={handleLanguageSwitch} style={btnGhost}>
            {locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          </button>
        </Row>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }} />

        <Row label={t('preferences.leftyMode')} description={t('preferences.leftyModeDesc')}>
          <Toggle checked={leftyMode} onChange={setLeftyMode} />
        </Row>

        <Row label={t('preferences.defaultView')} description={t('preferences.defaultViewDesc')}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {(['notes', 'intervals'] as const).map(v => (
              <button key={v} onClick={() => setDefaultView(v)} style={{
                padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', transition: 'all 0.15s',
                background: defaultView === v ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
                color: defaultView === v ? '#111' : 'var(--muted)',
                border: defaultView === v ? 'none' : '1px solid rgba(255,255,255,0.08)',
              }}>
                {t(`preferences.${v}`)}
              </button>
            ))}
          </div>
        </Row>

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
          <button onClick={handleSavePrefs} disabled={prefsSave === 'saving'} style={{ ...btnPrimary, opacity: prefsSave === 'saving' ? 0.6 : 1 }}>
            {saveLabel(prefsSave)}
          </button>
        </div>
      </Section>

      {/* Danger zone */}
      <Section title={t('danger.title')}>
        <Row label={t('danger.deleteAccount')} description={t('danger.deleteDescription')}>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} style={{
              ...btnGhost, color: '#e74c3c', borderColor: 'rgba(231,76,60,0.3)',
            }}>
              {t('danger.deleteButton')}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{t('danger.deleteConfirm')}</span>
              <button onClick={handleDeleteAccount} style={{ ...btnPrimary, background: '#e74c3c' }}>
                {t('danger.confirmYes')}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} style={btnGhost}>
                {t('danger.confirmNo')}
              </button>
            </div>
          )}
        </Row>
      </Section>

    </div>
  );
}