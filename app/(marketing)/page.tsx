"use client";

import { useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {

  useEffect(() => {
    // ── Cursor ────────────────────────────────────
      const dot = document.getElementById('cursorDot');
      const ring = document.getElementById('cursorRing');
      let mx = 0, my = 0, rx = 0, ry = 0;
      document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
      function animCursor() {
        rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
        if (dot) { dot.style.left = mx + 'px'; dot.style.top = my + 'px'; }
        if (ring) { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; }
        requestAnimationFrame(animCursor);
      }
      animCursor();
    
      // ── Nav scroll ────────────────────────────────
      const nav = document.getElementById('nav');
      window.addEventListener('scroll', () => {
        nav?.classList.toggle('scrolled', window.scrollY > 60);
      });

      // ── Reveal on scroll ──────────────────────────
      const reveals = document.querySelectorAll('.reveal');
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
      }, { threshold: 0.12 });
      reveals.forEach((el: Element) => io.observe(el));

      // ── Counter animation ─────────────────────────
      function animCounter(el: HTMLElement) {
        const target = parseInt(el.dataset.target || '0');
        const duration = 1800;
        const start = performance.now();
        function update(now: number) {
          const pct = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - pct, 3);
          el.textContent = Math.round(eased * target).toLocaleString('es-ES');
          if (pct < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
      }
      const counterObs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { animCounter(e.target as HTMLElement); counterObs.unobserve(e.target); } });
      }, { threshold: 0.5 });
      document.querySelectorAll('[data-target]').forEach(el => counterObs.observe(el));
    
      // ── Mini heatmap ──────────────────────────────
      const hm = document.getElementById('heatmapMock');
      if (hm) {
        for (let i = 0; i < 84; i++) {
          const cell = document.createElement('div');
          const rand = Math.random();
          const opacity = rand < 0.35 ? 0.04 : rand < 0.6 ? 0.2 : rand < 0.8 ? 0.5 : rand < 0.93 ? 0.8 : 1;
          cell.style.cssText = `height:10px;border-radius:2px;background:rgba(220,185,138,${opacity});`;
          hm.appendChild(cell);
        }
      }
  }, []);

  return (
    <>
      <style>{`
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --gold: #dcb98a;
    --gold-dim: rgba(220,185,138,0.15);
    --bg: #0d0d0d;
    --surface: #141414;
    --surface2: #1a1a1a;
    --text: #f0e8dc;
    --muted: rgba(240,232,220,0.45);
    --red: #e74c3c;
    --violet: #a78bfa;
    --green: #4ade80;
    --blue: #60a5fa;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    overflow-x: hidden;
    cursor: none;
  }

  /* ── Custom cursor ─────────────────────────── */
  .cursor {
    position: fixed; top: 0; left: 0; pointer-events: none; z-index: 9999;
    mix-blend-mode: difference;
  }
  .cursor-dot {
    width: 8px; height: 8px; background: var(--gold);
    border-radius: 50%; position: absolute;
    transform: translate(-50%, -50%);
    transition: transform 0.1s;
  }
  .cursor-ring {
    width: 36px; height: 36px;
    border: 1.5px solid rgba(220,185,138,0.5);
    border-radius: 50%; position: absolute;
    transform: translate(-50%, -50%);
    transition: all 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  body:has(a:hover) .cursor-ring,
  body:has(button:hover) .cursor-ring { transform: translate(-50%, -50%) scale(2); opacity: 0.4; }

  /* ── Noise overlay ─────────────────────────── */
  body::before {
    content: '';
    position: fixed; inset: 0; z-index: 1; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    opacity: 0.4;
  }

  /* ── Nav ───────────────────────────────────── */
  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 1.25rem 3rem;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid transparent;
    transition: all 0.3s;
  }
  nav.scrolled {
    background: rgba(13,13,13,0.92);
    border-color: rgba(220,185,138,0.1);
    backdrop-filter: blur(12px);
  }
  .logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.6rem; color: var(--gold); letter-spacing: 0.05em;
    text-decoration: none;
  }
  .logo span { color: var(--text); }
  nav ul { list-style: none; display: flex; gap: 2.5rem; align-items: center; }
  nav a { color: var(--muted); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.2s; }
  nav a:hover { color: var(--text); }
  .nav-cta {
    background: var(--gold) !important; color: #111 !important;
    padding: 0.55rem 1.4rem; border-radius: 100px;
    font-weight: 700 !important; font-size: 0.88rem !important;
    transition: opacity 0.2s !important;
  }
  .nav-cta:hover { opacity: 0.88; }

  /* ── Hero ──────────────────────────────────── */
  .hero {
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
    padding: 8rem 2rem 4rem;
    position: relative; overflow: hidden;
  }

  /* Glow orb */
  .hero::after {
    content: '';
    position: absolute; top: 20%; left: 50%;
    transform: translateX(-50%);
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(220,185,138,0.07) 0%, transparent 70%);
    pointer-events: none; animation: pulse-glow 6s ease-in-out infinite;
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
    50% { opacity: 1; transform: translateX(-50%) scale(1.15); }
  }

  /* Diagonal lines bg */
  .hero-bg-lines {
    position: absolute; inset: 0; pointer-events: none; overflow: hidden;
  }
  .hero-bg-lines::before {
    content: '';
    position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
    background: repeating-linear-gradient(
      -45deg,
      transparent, transparent 60px,
      rgba(220,185,138,0.015) 60px, rgba(220,185,138,0.015) 61px
    );
    animation: lines-drift 30s linear infinite;
  }
  @keyframes lines-drift { from { transform: translate(0,0); } to { transform: translate(61px, 61px); } }

  .hero-eyebrow {
    font-family: 'Space Mono', monospace;
    font-size: 0.72rem; letter-spacing: 0.25em; text-transform: uppercase;
    color: var(--gold); opacity: 0.7;
    margin-bottom: 1.5rem;
    animation: fade-up 0.8s ease both;
  }

  .hero h1 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(4rem, 12vw, 10rem);
    line-height: 0.9;
    letter-spacing: -0.01em;
    animation: fade-up 0.8s 0.1s ease both;
  }
  .hero h1 em {
    font-style: normal;
    color: transparent;
    -webkit-text-stroke: 2px var(--gold);
  }

  .hero-sub {
    max-width: 540px;
    color: var(--muted); font-size: 1.1rem; line-height: 1.6;
    margin: 2rem auto 2.5rem;
    animation: fade-up 0.8s 0.2s ease both;
  }

  .hero-actions {
    display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;
    animation: fade-up 0.8s 0.3s ease both;
  }
  .btn-primary {
    background: var(--gold); color: #111;
    padding: 1rem 2.5rem; border-radius: 100px;
    font-weight: 800; font-size: 1rem;
    text-decoration: none; border: none; cursor: none;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 0 0 0 rgba(220,185,138,0.4);
    letter-spacing: 0.02em;
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(220,185,138,0.3);
  }
  .btn-ghost {
    background: transparent; color: var(--text);
    padding: 1rem 2.5rem; border-radius: 100px;
    font-weight: 600; font-size: 1rem;
    text-decoration: none; border: 1px solid rgba(255,255,255,0.15);
    cursor: none; transition: border-color 0.2s;
  }
  .btn-ghost:hover { border-color: rgba(255,255,255,0.4); }

  .hero-scroll-hint {
    position: absolute; bottom: 2.5rem; left: 50%; transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
    color: var(--muted); font-size: 0.72rem; letter-spacing: 0.15em; text-transform: uppercase;
    animation: fade-up 1s 0.6s ease both;
  }
  .scroll-line {
    width: 1px; height: 40px;
    background: linear-gradient(to bottom, rgba(220,185,138,0.5), transparent);
    animation: scroll-line 2s ease-in-out infinite;
  }
  @keyframes scroll-line {
    0% { transform: scaleY(0); transform-origin: top; }
    50% { transform: scaleY(1); transform-origin: top; }
    51% { transform: scaleY(1); transform-origin: bottom; }
    100% { transform: scaleY(0); transform-origin: bottom; }
  }

  /* ── Stats bar ─────────────────────────────── */
  .stats-bar {
    border-top: 1px solid rgba(220,185,138,0.1);
    border-bottom: 1px solid rgba(220,185,138,0.1);
    padding: 2rem 3rem;
    display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 2rem; text-align: center;
    background: rgba(220,185,138,0.02);
    position: relative; z-index: 2;
  }
  .stat-item {}
  .stat-value {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 3rem; color: var(--gold); line-height: 1;
  }
  .stat-label { font-size: 0.8rem; color: var(--muted); margin-top: 0.3rem; letter-spacing: 0.05em; }

  /* ── Sections shared ───────────────────────── */
  section { position: relative; z-index: 2; }
  .section-label {
    font-family: 'Space Mono', monospace;
    font-size: 0.68rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--gold); opacity: 0.6; display: block; margin-bottom: 1rem;
  }
  .section-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(2.5rem, 5vw, 4rem);
    line-height: 1; letter-spacing: 0.01em;
  }
  .section-title em { font-style: normal; color: var(--gold); }

  /* ── Features ──────────────────────────────── */
  .features {
    padding: 8rem 3rem;
    max-width: 1200px; margin: 0 auto;
  }
  .features-header { margin-bottom: 4rem; }
  .features-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  .feature-card {
    background: var(--surface); border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px; padding: 2.5rem;
    position: relative; overflow: hidden;
    transition: border-color 0.3s, transform 0.3s;
    cursor: none;
  }
  .feature-card:hover { border-color: rgba(220,185,138,0.25); transform: translateY(-4px); }
  .feature-card.large { grid-column: span 2; display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
  .feature-card::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at top left, rgba(220,185,138,0.04), transparent 60%);
    pointer-events: none;
  }
  .feature-icon {
    width: 48px; height: 48px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 1.5rem; font-size: 1.4rem;
  }
  .feature-card h3 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.8rem; margin-bottom: 0.75rem; letter-spacing: 0.02em;
  }
  .feature-card p { color: var(--muted); font-size: 0.92rem; line-height: 1.65; }

  /* Mock UI inside feature card */
  .mock-player {
    background: #0d0d0d; border: 1px solid rgba(220,185,138,0.2);
    border-radius: 12px; padding: 1.25rem; font-size: 0.78rem;
  }
  .mock-bar { height: 4px; background: rgba(255,255,255,0.06); border-radius: 99px; margin: 0.85rem 0; position: relative; overflow: hidden; }
  .mock-bar-fill { height: 100%; border-radius: 99px; background: var(--gold); animation: mock-progress 3s ease-in-out infinite alternate; }
  @keyframes mock-progress { from { width: 35%; } to { width: 75%; } }
  .mock-bpm { font-family: 'Bebas Neue', sans-serif; font-size: 3rem; color: var(--gold); line-height: 1; }
  .mock-tag { display: inline-block; background: rgba(220,185,138,0.12); color: var(--gold); padding: 0.2rem 0.6rem; border-radius: 100px; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.05em; margin-top: 0.5rem; }

  /* BPM Chart mock */
  .mock-chart { display: flex; align-items: flex-end; gap: 6px; height: 60px; margin-top: 1rem; }
  .mock-bar-chart { flex: 1; border-radius: 3px 3px 0 0; background: rgba(220,185,138,0.2); transition: height 0.3s; }
  .mock-bar-chart.hi { background: var(--gold); }

  /* Routine mock */
  .mock-routine { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
  .mock-routine-item {
    display: flex; align-items: center; gap: 0.75rem;
    background: rgba(255,255,255,0.03); border-radius: 8px; padding: 0.6rem 0.85rem;
    font-size: 0.78rem;
  }
  .mock-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .mock-routine-item span { color: var(--muted); margin-left: auto; font-size: 0.68rem; }

  /* ── How it works ──────────────────────────── */
  .how {
    padding: 8rem 3rem;
    background: linear-gradient(to bottom, transparent, rgba(220,185,138,0.02), transparent);
  }
  .how-inner { max-width: 1000px; margin: 0 auto; }
  .how-header { text-align: center; margin-bottom: 5rem; }
  .steps {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 2rem; position: relative;
  }
  .steps::before {
    content: '';
    position: absolute; top: 32px; left: calc(16.66% + 1rem); right: calc(16.66% + 1rem);
    height: 1px; background: linear-gradient(to right, transparent, rgba(220,185,138,0.3), transparent);
  }
  .step { text-align: center; }
  .step-num {
    width: 64px; height: 64px; border-radius: 50%;
    border: 1px solid rgba(220,185,138,0.3);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; color: var(--gold);
    margin: 0 auto 1.5rem;
    background: var(--bg);
    position: relative; z-index: 1;
  }
  .step h4 { font-family: 'Bebas Neue', sans-serif; font-size: 1.4rem; margin-bottom: 0.75rem; }
  .step p { color: var(--muted); font-size: 0.88rem; line-height: 1.6; }

  /* ── Social proof ──────────────────────────── */
  .proof {
    padding: 8rem 3rem;
    max-width: 1200px; margin: 0 auto;
  }
  .proof-header { margin-bottom: 3rem; }
  .testimonials {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
  .testimonial {
    background: var(--surface); border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px; padding: 2rem;
    transition: border-color 0.3s;
  }
  .testimonial:hover { border-color: rgba(220,185,138,0.2); }
  .testimonial-text { color: var(--text); font-size: 0.92rem; line-height: 1.7; margin-bottom: 1.5rem; font-style: italic; }
  .testimonial-text::before { content: '"'; color: var(--gold); font-size: 2rem; line-height: 0; vertical-align: -0.5rem; margin-right: 0.2rem; font-style: normal; }
  .testimonial-author { display: flex; align-items: center; gap: 0.75rem; }
  .author-avatar {
    width: 38px; height: 38px; border-radius: 50%;
    background: rgba(220,185,138,0.15); border: 1px solid rgba(220,185,138,0.3);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Bebas Neue', sans-serif; font-size: 1rem; color: var(--gold);
    flex-shrink: 0;
  }
  .author-name { font-weight: 700; font-size: 0.88rem; }
  .author-role { font-size: 0.75rem; color: var(--muted); }
  .stars { color: var(--gold); font-size: 0.8rem; margin-bottom: 0.75rem; }

  /* ── CTA final ─────────────────────────────── */
  .cta-section {
    padding: 10rem 3rem;
    text-align: center; position: relative; overflow: hidden;
  }
  .cta-section::before {
    content: '';
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 800px; height: 400px;
    background: radial-gradient(ellipse, rgba(220,185,138,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .cta-section .section-title { font-size: clamp(3rem, 8vw, 6rem); margin-bottom: 1.5rem; }
  .cta-section p { color: var(--muted); max-width: 480px; margin: 0 auto 3rem; font-size: 1rem; line-height: 1.6; }
  .cta-note { margin-top: 1.5rem; font-size: 0.78rem; color: var(--muted); }

  /* ── Footer ────────────────────────────────── */
  footer {
    border-top: 1px solid rgba(255,255,255,0.05);
    padding: 3rem; display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 1rem;
    position: relative; z-index: 2;
  }
  footer p { color: var(--muted); font-size: 0.82rem; }
  .footer-links { display: flex; gap: 2rem; }
  .footer-links a { color: var(--muted); font-size: 0.82rem; text-decoration: none; transition: color 0.2s; }
  .footer-links a:hover { color: var(--text); }

  /* ── Animations ────────────────────────────── */
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .reveal {
    opacity: 0; transform: translateY(30px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  /* ── Ticker ────────────────────────────────── */
  .ticker-wrap {
    overflow: hidden; border-top: 1px solid rgba(220,185,138,0.1);
    border-bottom: 1px solid rgba(220,185,138,0.1);
    padding: 0.85rem 0; background: rgba(220,185,138,0.02);
    position: relative; z-index: 2;
  }
  .ticker {
    display: flex; gap: 4rem; width: max-content;
    animation: ticker 25s linear infinite;
  }
  .ticker-item {
    font-family: 'Space Mono', monospace; font-size: 0.75rem;
    color: rgba(220,185,138,0.35); letter-spacing: 0.1em; text-transform: uppercase;
    white-space: nowrap; display: flex; align-items: center; gap: 1rem;
  }
  .ticker-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--gold); opacity: 0.4; }
  @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  @media (max-width: 768px) {
    nav { padding: 1rem 1.5rem; }
    nav ul { display: none; }
    .features { padding: 5rem 1.5rem; }
    .features-grid { grid-template-columns: 1fr; }
    .feature-card.large { grid-column: span 1; grid-template-columns: 1fr; }
    .how { padding: 5rem 1.5rem; }
    .steps { grid-template-columns: 1fr; }
    .steps::before { display: none; }
    .proof { padding: 5rem 1.5rem; }
    .testimonials { grid-template-columns: 1fr; }
    .cta-section { padding: 6rem 1.5rem; }
    footer { padding: 2rem 1.5rem; flex-direction: column; text-align: center; }
    body { cursor: auto; }
    .cursor { display: none; }
    .stats-bar { padding: 2rem 1.5rem; }
  }
      `}</style>

      <div>
        {/* Custom cursor */}
        <div className="cursor" id="cursor">
          <div className="cursor-ring" id="cursorRing"></div>
          <div className="cursor-dot" id="cursorDot"></div>
        </div>
        
        {/* Nav */}
        <nav id="nav">
          <a href="#" className="logo">Riff<span>Routine</span></a>
          <ul>
            <li><a href="#features">Funciones</a></li>
            <li><a href="#how">Cómo funciona</a></li>
            <li><a href="#testimonios">Comunidad</a></li>
            <li><a href="/login">Entrar</a></li>
            <li><a href="/login" className="nav-cta">Empezar gratis</a></li>
          </ul>
        </nav>
        
        {/* Hero */}
        <section className="hero">
          <div className="hero-bg-lines"></div>
          <p className="hero-eyebrow">La herramienta de práctica para guitarristas serios</p>
          <h1>TOCA<br/><em>MEJOR</em><br/>CADA DÍA</h1>
          <p className="hero-sub">RiffRoutine es tu sala de ensayo personal. Sube tus tabs, construye rutinas, mide tu progreso y nunca más practiques sin rumbo.</p>
          <div className="hero-actions">
            <a href="/register" className="btn-primary">Empieza gratis ahora</a>
            <a href="#features" className="btn-ghost">Ver cómo funciona</a>
          </div>
          <div className="hero-scroll-hint">
            <div className="scroll-line"></div>
            <span>Scroll</span>
          </div>
        </section>
        
        {/* Ticker */}
        <div className="ticker-wrap">
          <div className="ticker">
            {/* duplicated for seamless loop */}
            <span className="ticker-item">Reproductor de tabs<span className="ticker-dot"></span></span>
            <span className="ticker-item">Control de BPM<span className="ticker-dot"></span></span>
            <span className="ticker-item">Rutinas de práctica<span className="ticker-dot"></span></span>
            <span className="ticker-item">Estadísticas de consistencia<span className="ticker-dot"></span></span>
            <span className="ticker-item">Racha diaria<span className="ticker-dot"></span></span>
            <span className="ticker-item">Mapa de progreso<span className="ticker-dot"></span></span>
            <span className="ticker-item">Metrónomo integrado<span className="ticker-dot"></span></span>
            <span className="ticker-item">Modo bucle<span className="ticker-dot"></span></span>
            <span className="ticker-item">Reproductor de tabs<span className="ticker-dot"></span></span>
            <span className="ticker-item">Control de BPM<span className="ticker-dot"></span></span>
            <span className="ticker-item">Rutinas de práctica<span className="ticker-dot"></span></span>
            <span className="ticker-item">Estadísticas de consistencia<span className="ticker-dot"></span></span>
            <span className="ticker-item">Racha diaria<span className="ticker-dot"></span></span>
            <span className="ticker-item">Mapa de progreso<span className="ticker-dot"></span></span>
            <span className="ticker-item">Metrónomo integrado<span className="ticker-dot"></span></span>
            <span className="ticker-item">Modo bucle<span className="ticker-dot"></span></span>
          </div>
        </div>
        
        {/* Stats */}
        <div className="stats-bar reveal">
          <div className="stat-item">
            <div className="stat-value" data-target="12400">0</div>
            <div className="stat-label">Sesiones completadas</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" data-target="8300">0</div>
            <div className="stat-label">Horas de práctica</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" data-target="94">0</div>
            <div className="stat-label">% usuarios mejoran su BPM</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" data-target="3100">0</div>
            <div className="stat-label">Guitarristas activos</div>
          </div>
        </div>
        
        {/* Features */}
        <section className="features" id="features">
          <div className="features-header reveal">
            <span className="section-label">Funciones</span>
            <h2 className="section-title">Todo lo que necesitas<br/>para <em>progresar</em></h2>
          </div>
        
          <div className="features-grid">
            {/* Reproductor - card grande */}
            <div className="feature-card large reveal">
              <div>
                <div className="feature-icon" style={{background: "rgba(220,185,138,0.1)"}}>🎸</div>
                <h3>Reproductor Inmersivo</h3>
                <p>Carga cualquier archivo Guitar Pro o tab y practícalo en nuestro reproductor con metrónomo integrado, control de velocidad, modo bucle y visualización de partituras. Tu sala de ensayo en el navegador.</p>
                <div style={{marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap"}}>
                  <span className="mock-tag">Metrónomo</span>
                  <span className="mock-tag">Bucle</span>
                  <span className="mock-tag" style={{background: "rgba(167,139,250,0.12)", color: "#a78bfa"}}>× 0.75</span>
                  <span className="mock-tag" style={{background: "rgba(96,165,250,0.12)", color: "#60a5fa"}}>Pistas múltiples</span>
                </div>
              </div>
              <div className="mock-player">
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem"}}>
                  <span style={{color: "var(--muted)", fontSize: "0.72rem"}}>MODO EJERCICIO</span>
                  <span style={{color: "var(--gold)", fontWeight: "700", fontSize: "0.78rem"}}>● EN VIVO</span>
                </div>
                <div style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", marginBottom: "0.5rem"}}>Eruption — Van Halen</div>
                <div className="mock-bar"><div className="mock-bar-fill"></div></div>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "0.75rem"}}>
                  <div>
                    <div style={{fontSize: "0.62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em"}}>BPM actual</div>
                    <div className="mock-bpm">132</div>
                  </div>
                  <div style={{textAlign: "right"}}>
                    <div style={{fontSize: "0.62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em"}}>Objetivo</div>
                    <div style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: "#a78bfa"}}>160</div>
                  </div>
                  <div style={{display: "flex", gap: "0.4rem"}}>
                    <div style={{background: "var(--gold)", borderRadius: "6px", padding: "0.5rem 1rem", fontWeight: "800", color: "#111", fontSize: "0.8rem"}}>▶ Play</div>
                    <div style={{background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "0.5rem 0.6rem", fontSize: "0.8rem"}}>⏹</div>
                  </div>
                </div>
              </div>
            </div>
        
            {/* Rutinas */}
            <div className="feature-card reveal">
              <div className="feature-icon" style={{background: "rgba(167,139,250,0.1)"}}>📋</div>
              <h3>Rutinas Inteligentes</h3>
              <p>Crea rutinas de práctica con duración y BPM objetivo por ejercicio. El temporizador automático te avisa cuando es hora de pasar al siguiente.</p>
              <div className="mock-routine">
                <div className="mock-routine-item">
                  <div className="mock-dot" style={{background: "var(--gold)"}}></div>
                  Alternate Picking — Escala mayor
                  <span>10 min</span>
                </div>
                <div className="mock-routine-item" style={{border: "1px solid rgba(220,185,138,0.3)", background: "rgba(220,185,138,0.05)"}}>
                  <div className="mock-dot" style={{background: "#4ade80"}}></div>
                  Sweep Picking — Arpegio Am
                  <span style={{color: "var(--gold)"}}>● Activo</span>
                </div>
                <div className="mock-routine-item">
                  <div className="mock-dot" style={{background: "rgba(255,255,255,0.15)"}}></div>
                  Legato — Lick de Satch
                  <span>15 min</span>
                </div>
              </div>
            </div>
        
            {/* BPM Tracking */}
            <div className="feature-card reveal">
              <div className="feature-icon" style={{background: "rgba(74,222,128,0.1)"}}>📈</div>
              <h3>Tracking de BPM</h3>
              <p>Registra tu velocidad en cada sesión y visualiza cómo mejoras con el tiempo. Porcentaje hacia tu objetivo, histórico y comparativa entre sesiones.</p>
              <div className="mock-chart" id="mockChart">
                <div className="mock-bar-chart" style={{height: "30%"}}></div>
                <div className="mock-bar-chart" style={{height: "45%"}}></div>
                <div className="mock-bar-chart" style={{height: "40%"}}></div>
                <div className="mock-bar-chart" style={{height: "60%"}}></div>
                <div className="mock-bar-chart" style={{height: "55%"}}></div>
                <div className="mock-bar-chart hi" style={{height: "75%"}}></div>
                <div className="mock-bar-chart hi" style={{height: "80%"}}></div>
                <div className="mock-bar-chart hi" style={{height: "90%"}}></div>
              </div>
              <div style={{marginTop: "1rem", display: "flex", justifyContent: "space-between"}}>
                <div>
                  <div style={{fontSize: "0.62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em"}}>Primera sesión</div>
                  <div style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "rgba(255,255,255,0.4)"}}>84 BPM</div>
                </div>
                <div style={{textAlign: "right"}}>
                  <div style={{fontSize: "0.62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em"}}>Hoy</div>
                  <div style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "var(--green)"}}>138 BPM</div>
                </div>
              </div>
            </div>
        
            {/* Stats */}
            <div className="feature-card reveal" style={{gridColumn: "span 2"}}>
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center"}}>
                <div>
                  <div className="feature-icon" style={{background: "rgba(96,165,250,0.1)"}}>🔥</div>
                  <h3>Estadísticas & Consistencia</h3>
                  <p>Mapa de calor anual, racha de días, tiempo total acumulado por técnica, radar de habilidades. Todo para que nunca pierdas el hilo de tu progreso.</p>
                </div>
                <div>
                  {/* Mini heatmap mock */}
                  <div style={{display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "3px", marginBottom: "1rem"}} id="heatmapMock"></div>
                  <div style={{display: "flex", gap: "1rem", flexWrap: "wrap"}}>
                    <div style={{background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)", borderRadius: "8px", padding: "0.6rem 1rem"}}>
                      <div style={{fontSize: "0.62rem", color: "rgba(251,146,60,0.6)", textTransform: "uppercase", letterSpacing: "0.06em"}}>Racha</div>
                      <div style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", color: "#fb923c"}}>23 días 🔥</div>
                    </div>
                    <div style={{background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "8px", padding: "0.6rem 1rem"}}>
                      <div style={{fontSize: "0.62rem", color: "rgba(96,165,250,0.6)", textTransform: "uppercase", letterSpacing: "0.06em"}}>Esta semana</div>
                      <div style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", color: "#60a5fa"}}>4h 20m</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* How it works */}
        <section className="how" id="how">
          <div className="how-inner">
            <div className="how-header reveal">
              <span className="section-label">Proceso</span>
              <h2 className="section-title">En 3 pasos estás<br/><em>practicando</em></h2>
            </div>
            <div className="steps">
              <div className="step reveal">
                <div className="step-num">01</div>
                <h4>Crea tu cuenta</h4>
                <p>Regístrate gratis en menos de 30 segundos. Sin tarjeta, sin compromisos. Solo tú y tu guitarra.</p>
              </div>
              <div className="step reveal" style={{transitionDelay: "0.15s"}}>
                <div className="step-num">02</div>
                <h4>Sube tus tabs</h4>
                <p>Importa tus archivos Guitar Pro, crea ejercicios propios y organízalos en tu biblioteca personal.</p>
              </div>
              <div className="step reveal" style={{transitionDelay: "0.3s"}}>
                <div className="step-num">03</div>
                <h4>Practica con foco</h4>
                <p>Lanza una rutina, sigue el temporizador y registra tu BPM. Tu progreso se guarda solo.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials */}
        <section className="proof" id="testimonios">
          <div className="proof-header reveal">
            <span className="section-label">Comunidad</span>
            <h2 className="section-title">Lo que dicen los<br/><em>guitarristas</em></h2>
          </div>
          <div className="testimonials">
            <div className="testimonial reveal">
              <div className="stars">★★★★★</div>
              <p className="testimonial-text">Llevaba años practicando sin estructura. Desde que uso RiffRoutine sé exactamente cuánto he mejorado y qué tengo que trabajar.</p>
              <div className="testimonial-author">
                <div className="author-avatar">JM</div>
                <div>
                  <div className="author-name">Jorge M.</div>
                  <div className="author-role">Guitarrista intermedio · Madrid</div>
                </div>
              </div>
            </div>
            <div className="testimonial reveal" style={{transitionDelay: "0.1s"}}>
              <div className="stars">★★★★★</div>
              <p className="testimonial-text">El sistema de rutinas es una locura. Puedo reproducir la tab mientras corre el temporizador y el metrónomo. Todo en uno.</p>
              <div className="testimonial-author">
                <div className="author-avatar">SL</div>
                <div>
                  <div className="author-name">Sara L.</div>
                  <div className="author-role">Semi-profesional · Barcelona</div>
                </div>
              </div>
            </div>
            <div className="testimonial reveal" style={{transitionDelay: "0.2s"}}>
              <div className="stars">★★★★★</div>
              <p className="testimonial-text">Ver cómo sube tu BPM semana a semana es adictivo. Pasé de 90 a 145 BPM en alt picking en 3 meses con disciplina real.</p>
              <div className="testimonial-author">
                <div className="author-avatar">AK</div>
                <div>
                  <div className="author-name">Alex K.</div>
                  <div className="author-role">Guitarrista avanzado · Valencia</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Final */}
        <section className="cta-section">
          <span className="section-label" style={{display: "block", marginBottom: "1rem"}}>¿Listo?</span>
          <h2 className="section-title reveal">DEJA DE<br/>TOCAR AL<br/><em>AZAR</em></h2>
          <p className="reveal">Únete a miles de guitarristas que practican con intención, miden su progreso y mejoran cada semana.</p>
          <div className="reveal">
            <a href="/register" className="btn-primary" style={{fontSize: "1.1rem", padding: "1.1rem 3rem"}}>Empieza gratis — sin tarjeta</a>
            <p className="cta-note">✓ Gratis para siempre &nbsp;·&nbsp; ✓ Sin instalación &nbsp;·&nbsp; ✓ Cancela cuando quieras</p>
          </div>
        </section>
        
        {/* Footer */}
        <footer>
          <a href="#" className="logo" style={{fontSize: "1.2rem"}}>Riff<span>Routine</span></a>
          <div className="footer-links">
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
            <a href="#">Contacto</a>
          </div>
          <p>© 2026 RiffRoutine. Hecho para guitarristas.</p>
        </footer>
      </div>
    </>
  );
}