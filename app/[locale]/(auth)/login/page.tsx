"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import styles from './page.module.css';
import { cx } from '@/lib/cx';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('LoginPage');

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message); // Nota: Supabase devuelve errores en inglés por defecto
      else router.push('/home');
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage(t('auth.signupSuccess'));
    }
    setLoading(false);
  };

  const handleDemo = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: 'demo@riffroutine.com',
      password: 'demo1234',
    });
    if (error) {
      setError(t('auth.demoError'));
      setLoading(false);
    } else {
      router.push('/home');
    }
  };

  const features = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
      ),
      title: t('features.tabsTitle'), text: t('features.tabsText')
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        </svg>
      ),
      title: t('features.routinesTitle'), text: t('features.routinesText')
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      title: t('features.trackingTitle'), text: t('features.trackingText')
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      title: t('features.statsTitle'), text: t('features.statsText')
    },
  ];

  return (
    <>

      <div className={styles['login-root']}>

        {/* ── LEFT ── */}
        <div className={styles['login-left']}>
          <a href="/" className={cx(styles['left-logo'], styles.link)}>
            <img src="/favicon.ico" alt="RiffRoutine" className={styles.image} />
            <span><span className={styles.label}>Riff</span><span className={styles.label2}>Routine</span></span>
          </a>

          {/* Widgets Decorativos Flotantes */}
          <div className={`${styles['glass-widget']} ${styles['widget-1']} ${mounted ? styles.visible : ''}`}>
            <div className={styles['widget-icon']}>🔥</div>
            <div className={styles['widget-text']}>
              <span className={styles['widget-label']}>{t('leftPanel.widget1Label')}</span>
              <span className={styles['widget-val']}>{t('leftPanel.widget1Val')}</span>
            </div>
          </div>

          <div className={`${styles['glass-widget']} ${styles['widget-2']} ${mounted ? styles.visible : ''}`}>
            <div className={styles['widget-icon']}>⚡</div>
            <div className={styles['widget-text']}>
              <span className={styles['widget-label']}>{t('leftPanel.widget2Label')}</span>
              <span className={styles['widget-val']}>{t('leftPanel.widget2Val')}</span>
            </div>
          </div>

          <div className={styles['left-hero']}>
            <h1 className={styles['left-title']}>
              {t('leftPanel.titleLine1')}<br />
              {t('leftPanel.titleLine2')} <span className={styles.gold}>{t('leftPanel.titleLine2Gold')}</span><br />
              <span className={styles.outline}>{t('leftPanel.titleLine3')}</span>
            </h1>

            <div className={styles['left-features']}>
              {features.map((f, i) => (
                <div
                  key={i}
                  className={`${styles['left-feature']} ${mounted ? styles.visible : ''}`}
                  style={{ transitionDelay: `${0.2 + i * 0.1}s` }}
                >
                  <div className={styles['left-feature-icon']}>{f.icon}</div>
                  <div className={styles['left-feature-content']}>
                    <span className={styles['left-feature-title']}>{f.title}</span>
                    <span className={styles['left-feature-text']}>{f.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles['left-bottom']}>© 2026 RiffRoutine</div>
          <div className={styles['left-deco']}>RIFF</div>
        </div>

        {/* ── RIGHT ── */}
        <div className={styles['login-right']}>
          <div className={`${styles['form-wrap']} ${mounted ? styles.visible : ''}`}>

            <div className={styles['form-title']}>{isLogin ? t('form.titleLogin') : t('form.titleSignup')}</div>
            <div className={styles['form-sub']}>{isLogin ? t('form.subLogin') : t('form.subSignup')}</div>

            {/* Toggle tabs */}
            <div className={styles['auth-tabs']}>
              <button
                className={`${styles['auth-tab']} ${isLogin ? styles.active : ''}`}
                onClick={() => { setIsLogin(true); setError(null); setMessage(null); }}
              >
                {t('form.tabLogin')}
              </button>
              <button
                className={`${styles['auth-tab']} ${!isLogin ? styles.active : ''}`}
                onClick={() => { setIsLogin(false); setError(null); setMessage(null); }}
              >
                {t('form.tabSignup')}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth}>
              <div className={styles['input-group']}>
                <div className={styles['input-wrap']}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    className={styles['login-input']}
                    type="email"
                    placeholder={t('form.emailPlaceholder')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className={styles['input-wrap']}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    className={styles['login-input']}
                    type="password"
                    placeholder={t('form.passwordPlaceholder')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                </div>
              </div>

              {error && <div className={`${styles.alert} ${styles['alert-error']}`}>{error}</div>}
              {message && <div className={`${styles.alert} ${styles['alert-success']}`}>{message}</div>}

              <button type="submit" className={styles['btn-primary']} disabled={loading}>
                {loading && <span className={styles.spinner} />}
                {loading ? t('form.loading') : isLogin ? t('form.btnSubmitLogin') : t('form.btnSubmitSignup')}
              </button>
            </form>

            <div className={styles.divider}>
              <div className={styles['divider-line']} />
              <span className={styles['divider-text']}>{t('form.divider')}</span>
              <div className={styles['divider-line']} />
            </div>

            <button className={styles['btn-demo']} onClick={handleDemo} disabled={loading}>
              🎸 <span>{t('form.btnDemo')}</span>
            </button>

            <div className={styles['back-link']}>
              <a href="/">
                {t('form.backLink')}
              </a>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}