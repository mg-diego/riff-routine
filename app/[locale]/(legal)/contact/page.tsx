"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './page.module.css';
import ui from '@/components/ui/ui.module.css';
import { cx } from '@/lib/cx';

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

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: 'var(--muted)',
    fontSize: '0.8rem',
    fontWeight: 600,
    marginBottom: '0.4rem',
    letterSpacing: '0.04em',
  };

  return (
    <div className={styles.labelStack}>

      {/* Hero */}
      <div className={styles.label}>
        <p className={ui.eyebrow}>
          {t('hero.label')}
        </p>
        <h1 className="page-title">
          {t('hero.title')}
        </h1>
        <p className="page-subtitle">
          {t('hero.subtitle')}
        </p>
      </div>

      <div className={styles.titleRow}>

        {/* Form card */}
        <div className={styles.titleBox}>
          {formState === 'success' ? (
            <div className={styles.titleStack}>
              <div className={styles.row}>
                ✓
              </div>
              <h2 className={styles.titleHeading}>
                {t('form.success.title')}
              </h2>
              <p className={styles.descriptionText}>
                {t('form.success.description')}
              </p>
            </div>
          ) : (
            <div className={styles.titleBoxStack}>

              {/* Name */}
              <div>
                <label style={labelStyle}>{t('form.name.label')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('form.name.placeholder')}
                  className={styles.input}
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
                  className={styles.input}
                  disabled={formState === 'submitting'}
                />
              </div>

              {/* Subject */}
              <div>
                <label style={labelStyle}>{t('form.subject.label')}</label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className={cx(styles.input, styles.defaultSelect)}
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
                  className={cx(styles.input, styles.placeholderTextarea)}
                  disabled={formState === 'submitting'}
                />
              </div>

              {/* Error */}
              {formState === 'error' && (
                <p className={styles.errorText}>
                  {t('form.error', { email: CONTACT_EMAIL })}
                </p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={formState === 'submitting' || !name || !email || !subject || !message}
                className={styles.submittingButton} style={{ opacity: (!name || !email || !subject || !message || formState === 'submitting') ? 0.5 : 1 }}
              >
                {formState === 'submitting' ? t('form.submitting') : t('form.submit')}
              </button>
            </div>
          )}
        </div>

        {/* Side info */}
        <div className={styles.titleRowStack}>

          {/* Email alternative */}
          <div className={styles.titleRowBox}>
            <p className={styles.titleText}>
              {t('alternative.title')}
            </p>
            <p className={styles.descriptionText2}>
              {t('alternative.description')}
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className={styles.link}
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          {/* Response time */}
          <div className={styles.titleRowBox}>
            <p className={styles.titleText}>
              {t('response.title')}
            </p>
            <p className={styles.descriptionText3}>
              {t('response.description')}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}