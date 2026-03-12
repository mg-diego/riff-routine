"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

const CONTACT_EMAIL = 'hello@riffRoutine.com';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactPage() {
  const t = useTranslations('contact');

  const [formState, setFormState] = useState<FormState>('idle');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!name || !email || !subject || !message) return;
    setFormState('submitting');
    try {
      // Replace with your actual form submission endpoint
      await new Promise(res => setTimeout(res, 1200));
      setFormState('success');
    } catch {
      setFormState('error');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.7rem 0.9rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: 'var(--text)',
    fontSize: '0.9rem',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: 'var(--muted)',
    fontSize: '0.8rem',
    fontWeight: 600,
    marginBottom: '0.4rem',
    letterSpacing: '0.04em',
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Hero */}
      <div style={{ marginBottom: '2rem', flexShrink: 0 }}>
        <p style={{ color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 0.4rem 0', opacity: 0.7 }}>
          {t('hero.label')}
        </p>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
          {t('hero.title')}
        </h1>
        <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
          {t('hero.subtitle')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Form card */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.05)',
          padding: '2rem',
          flex: '1 1 480px',
          minWidth: 0,
        }}>
          {formState === 'success' ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(220,185,138,0.1)', border: '1px solid rgba(220,185,138,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                ✓
              </div>
              <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: 'var(--gold)', margin: 0 }}>
                {t('form.success.title')}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', margin: 0, maxWidth: '360px' }}>
                {t('form.success.description')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Name */}
              <div>
                <label style={labelStyle}>{t('form.name.label')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('form.name.placeholder')}
                  style={inputStyle}
                  disabled={formState === 'submitting'}
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>{t('form.email.label')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('form.email.placeholder')}
                  style={inputStyle}
                  disabled={formState === 'submitting'}
                />
              </div>

              {/* Subject */}
              <div>
                <label style={labelStyle}>{t('form.subject.label')}</label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                  disabled={formState === 'submitting'}
                >
                  <option value="">{t('form.subject.options.default')}</option>
                  <option value="bug">{t('form.subject.options.bug')}</option>
                  <option value="feature">{t('form.subject.options.feature')}</option>
                  <option value="account">{t('form.subject.options.account')}</option>
                  <option value="privacy">{t('form.subject.options.privacy')}</option>
                  <option value="other">{t('form.subject.options.other')}</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label style={labelStyle}>{t('form.message.label')}</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={t('form.message.placeholder')}
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
                  disabled={formState === 'submitting'}
                />
              </div>

              {/* Error */}
              {formState === 'error' && (
                <p style={{ color: '#e74c3c', fontSize: '0.85rem', margin: 0 }}>
                  {t('form.error', { email: CONTACT_EMAIL })}
                </p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={formState === 'submitting' || !name || !email || !subject || !message}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--gold)',
                  color: '#111',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: (!name || !email || !subject || !message || formState === 'submitting') ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {formState === 'submitting' ? t('form.submitting') : t('form.submit')}
              </button>
            </div>
          )}
        </div>

        {/* Side info */}
        <div style={{ flex: '0 1 260px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Email alternative */}
          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '1.25rem 1.5rem',
          }}>
            <p style={{ color: 'var(--gold)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', margin: '0 0 0.4rem 0', letterSpacing: '0.03em' }}>
              {t('alternative.title')}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 0.5rem 0' }}>
              {t('alternative.description')}
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              style={{ color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          {/* Response time */}
          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '1.25rem 1.5rem',
          }}>
            <p style={{ color: 'var(--gold)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', margin: '0 0 0.4rem 0', letterSpacing: '0.03em' }}>
              {t('response.title')}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
              {t('response.description')}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}