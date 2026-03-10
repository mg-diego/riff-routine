"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
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
      if (error) setError(error.message);
      else router.push('/home');
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage('Revisa tu bandeja de entrada para confirmar tu cuenta.');
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
      setError('El acceso demo no está disponible en este momento.');
      setLoading(false);
    } else {
      router.push('/home');
    }
  };

  const features = [
    { icon: '🎸', title: 'Tabs Interactivos', text: 'Control total de velocidad y bucles' },
    { icon: '📋', title: 'Rutinas', text: 'Práctica diaria estructurada' },
    { icon: '🎯', title: 'Seguimiento', text: 'Registra tus BPM y tiempo real' },
    { icon: '📊', title: 'Estadísticas', text: 'Visualiza tu consistencia' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          display: flex;
          min-height: 100vh;
          width: 100vw;
          background: #0d0d0d;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Left panel ── */
        .login-left {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center; /* Centrado perfecto */
          padding: 4rem;
          overflow: hidden;
          background: #0d0d0d;
        }
        
        .login-left::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 30% 40%, rgba(220,185,138,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 80%, rgba(167,139,250,0.04) 0%, transparent 60%);
          pointer-events: none;
        }
        
        .login-left::after {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(
            -55deg,
            transparent, transparent 60px,
            rgba(220,185,138,0.015) 60px,
            rgba(220,185,138,0.015) 61px
          );
        }

        .left-logo {
          position: absolute;
          top: 3rem; left: 4rem;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2rem;
          color: #dcb98a;
          letter-spacing: 0.1em;
          z-index: 10;
          text-decoration: none;
        }

        .left-hero {
          position: relative; z-index: 2;
          max-width: 650px;
        }
        
        .left-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(4rem, 7vw, 6.5rem);
          line-height: 0.9;
          color: #f0e8dc;
          letter-spacing: 0.02em;
          margin-bottom: 2.5rem;
        }
        .left-title .gold { color: #dcb98a; }
        .left-title .outline {
          -webkit-text-stroke: 1.5px rgba(220,185,138,0.5);
          color: transparent;
        }

        /* 2x2 Grid para Features */
        .left-features {
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 2rem 1.5rem;
        }
        
        .left-feature {
          display: flex; align-items: flex-start; gap: 1rem;
          opacity: 0;
          transform: translateY(15px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .left-feature.visible {
          opacity: 1; transform: translateY(0);
        }
        .left-feature-icon {
          width: 42px; height: 42px; border-radius: 10px;
          background: rgba(220,185,138,0.08);
          border: 1px solid rgba(220,185,138,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem; flex-shrink: 0;
        }
        .left-feature-content { display: flex; flex-direction: column; gap: 0.2rem; }
        .left-feature-title { font-weight: 700; color: #f0e8dc; font-size: 0.95rem; }
        .left-feature-text { font-size: 0.82rem; color: rgba(240,232,220,0.55); line-height: 1.4; }

        .left-bottom {
          position: absolute;
          bottom: 3rem; left: 4rem;
          z-index: 10;
          font-size: 0.75rem; color: rgba(106,95,82,0.5);
        }

        .left-deco {
          position: absolute;
          bottom: -2rem; right: -1rem;
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(8rem, 15vw, 14rem);
          color: rgba(220,185,138,0.03);
          letter-spacing: -0.02em;
          line-height: 1;
          pointer-events: none;
          user-select: none;
          z-index: 0;
        }

        /* ── Widgets Decorativos (NUEVO) ── */
        .glass-widget {
          position: absolute;
          background: rgba(20, 20, 20, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(220,185,138,0.15);
          border-radius: 14px;
          padding: 1.2rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 15px 35px rgba(0,0,0,0.4);
          z-index: 5;
          opacity: 0;
          pointer-events: none;
        }
        .widget-1 {
          top: 20%; right: 10%;
          animation: float1 6s ease-in-out infinite;
          transition: opacity 1s ease 0.5s;
        }
        .widget-2 {
          bottom: 25%; right: 18%;
          animation: float2 7s ease-in-out infinite;
          transition: opacity 1s ease 0.7s;
        }
        .glass-widget.visible { opacity: 1; }
        
        .widget-icon {
          font-size: 1.5rem;
          background: rgba(220,185,138,0.1);
          width: 45px; height: 45px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 10px;
        }
        .widget-text { display: flex; flex-direction: column; gap: 0.1rem; }
        .widget-label { font-size: 0.65rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
        .widget-val { font-size: 1.2rem; color: #dcb98a; font-weight: 700; font-family: 'DM Sans', sans-serif;}

        @keyframes float1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(15px); }
        }

        /* ── Right panel ── */
        .login-right {
          width: 480px;
          flex-shrink: 0;
          background: #111;
          border-left: 1px solid rgba(220,185,138,0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 3rem;
          position: relative;
        }
        .login-right::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(220,185,138,0.2), transparent);
        }

        .form-wrap {
          width: 100%;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .form-wrap.visible {
          opacity: 1; transform: translateY(0);
        }

        .form-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2rem; color: #f0e8dc;
          letter-spacing: 0.05em; margin-bottom: 0.3rem;
        }
        .form-sub {
          font-size: 0.85rem; color: #6a5f52;
          margin-bottom: 2rem;
        }

        /* Tabs */
        .auth-tabs {
          display: flex;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 1.75rem;
        }
        .auth-tab {
          flex: 1; padding: 0.55rem;
          border: none; background: transparent;
          color: #6a5f52; font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; font-weight: 600;
          cursor: pointer; border-radius: 7px;
          transition: all 0.2s;
        }
        .auth-tab.active {
          background: rgba(220,185,138,0.12);
          color: #dcb98a;
          border: 1px solid rgba(220,185,138,0.2);
        }

        /* Inputs */
        .input-group {
          display: flex; flex-direction: column; gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        .input-wrap {
          position: relative;
        }
        .input-wrap svg {
          position: absolute; left: 0.9rem; top: 50%;
          transform: translateY(-50%);
          color: #6a5f52; pointer-events: none;
          transition: color 0.2s;
        }
        .input-wrap:focus-within svg { color: #dcb98a; }

        .login-input {
          width: 100%;
          padding: 0.85rem 1rem 0.85rem 2.5rem;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          color: #f0e8dc;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .login-input::placeholder { color: #3a3530; }
        .login-input:focus {
          border-color: rgba(220,185,138,0.35);
          background: rgba(220,185,138,0.03);
        }

        /* Alerts */
        .alert {
          padding: 0.65rem 0.9rem; border-radius: 8px;
          font-size: 0.82rem; margin-bottom: 1rem; text-align: center;
        }
        .alert-error {
          color: #f87171;
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.2);
        }
        .alert-success {
          color: #dcb98a;
          background: rgba(220,185,138,0.08);
          border: 1px solid rgba(220,185,138,0.2);
        }

        /* Primary button */
        .btn-primary {
          width: 100%; padding: 0.9rem;
          border-radius: 100px; border: none;
          background: #dcb98a; color: #111;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem; font-weight: 800;
          cursor: pointer; letter-spacing: 0.01em;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          position: relative; overflow: hidden;
        }
        .btn-primary::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
          pointer-events: none;
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(220,185,138,0.25);
        }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Loading spinner */
        .spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(17,17,17,0.3);
          border-top-color: #111;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 0.5rem; vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Divider */
        .divider {
          display: flex; align-items: center; gap: 0.75rem;
          margin: 1.25rem 0;
        }
        .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.05); }
        .divider-text { font-size: 0.7rem; color: #3a3530; text-transform: uppercase; letter-spacing: 0.1em; }

        /* Demo button */
        .btn-demo {
          width: 100%; padding: 0.8rem;
          border-radius: 100px;
          border: 1px solid rgba(220,185,138,0.2);
          background: transparent; color: #dcb98a;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        .btn-demo:hover:not(:disabled) {
          background: rgba(220,185,138,0.07);
          border-color: rgba(220,185,138,0.35);
        }
        .btn-demo:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Back to landing */
        .back-link {
          margin-top: 2rem; text-align: center;
          font-size: 0.78rem; color: #3a3530;
        }
        .back-link a {
          color: #6a5f52; text-decoration: none;
          transition: color 0.2s;
        }
        .back-link a:hover { color: #dcb98a; }

        /* Mobile */
        @media (max-width: 900px) {
          .glass-widget { display: none; }
        }
        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { width: 100%; border-left: none; padding: 2rem 1.5rem; }
        }
      `}</style>

      <div className="login-root">

        {/* ── LEFT ── */}
        <div className="login-left">
          <a href="/" className="left-logo">RiffRoutine</a>

          {/* Widgets Decorativos Flotantes */}
          <div className={`glass-widget widget-1 ${mounted ? 'visible' : ''}`}>
            <div className="widget-icon">🔥</div>
            <div className="widget-text">
              <span className="widget-label">Racha de Práctica</span>
              <span className="widget-val">14 Días Seguidos</span>
            </div>
          </div>

          <div className={`glass-widget widget-2 ${mounted ? 'visible' : ''}`}>
            <div className="widget-icon">⚡</div>
            <div className="widget-text">
              <span className="widget-label">Pico de Velocidad</span>
              <span className="widget-val">180 BPM</span>
            </div>
          </div>

          <div className="left-hero">
            <h1 className="left-title">
              TU SALA<br />
              DE <span className="gold">ENSAYO</span><br />
              <span className="outline">DIGITAL.</span>
            </h1>
            
            <div className="left-features">
              {features.map((f, i) => (
                <div
                  key={i}
                  className={`left-feature ${mounted ? 'visible' : ''}`}
                  style={{ transitionDelay: `${0.2 + i * 0.1}s` }}
                >
                  <div className="left-feature-icon">{f.icon}</div>
                  <div className="left-feature-content">
                    <span className="left-feature-title">{f.title}</span>
                    <span className="left-feature-text">{f.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="left-bottom">© 2026 RiffRoutine</div>
          <div className="left-deco">RIFF</div>
        </div>

        {/* ── RIGHT ── */}
        <div className="login-right">
          <div className={`form-wrap ${mounted ? 'visible' : ''}`}>

            <div className="form-title">{isLogin ? 'Bienvenido' : 'Únete'}</div>
            <div className="form-sub">{isLogin ? 'Accede a tu cuenta para continuar' : 'Crea tu cuenta gratuita hoy'}</div>

            {/* Toggle tabs */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => { setIsLogin(true); setError(null); setMessage(null); }}
              >
                Iniciar sesión
              </button>
              <button
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => { setIsLogin(false); setError(null); setMessage(null); }}
              >
                Registrarse
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth}>
              <div className="input-group">
                <div className="input-wrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    className="login-input"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="input-wrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    className="login-input"
                    type="password"
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? 'Cargando...' : isLogin ? 'Entrar a RiffRoutine' : 'Crear cuenta gratis'}
              </button>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">o</span>
              <div className="divider-line" />
            </div>

            <button className="btn-demo" onClick={handleDemo} disabled={loading}>
              🎸 <span>Explorar como Invitado</span>
            </button>

            <div className="back-link">
              <a href="/">← Volver a la landing</a>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}