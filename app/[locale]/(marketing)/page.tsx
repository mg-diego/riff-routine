"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export default function LandingPage() {
  const t = useTranslations('LandingPage');

  useEffect(() => {
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

    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
      nav?.classList.toggle('scrolled', window.scrollY > 60);
    });

    const reveals = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach((el: Element) => io.observe(el));

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

  body::before {
    content: '';
    position: fixed; inset: 0; z-index: 1; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    opacity: 0.4;
  }

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

  .hero {
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
    padding: 8rem 2rem 4rem;
    position: relative; overflow: hidden;
  }

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

  .stats-bar {
    border-top: 1px solid rgba(220,185,138,0.1);
    border-bottom: 1px solid rgba(220,185,138,0.1);
    padding: 2rem 3rem;
    display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 2rem; text-align: center;
    background: rgba(220,185,138,0.02);
    position: relative; z-index: 2;
  }
  .stat-value {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 3rem; color: var(--gold); line-height: 1;
  }
  .stat-label { font-size: 0.8rem; color: var(--muted); margin-top: 0.3rem; letter-spacing: 0.05em; }

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

  .mock-player {
    background: #0d0d0d; border: 1px solid rgba(220,185,138,0.2);
    border-radius: 12px; padding: 1.25rem; font-size: 0.78rem;
  }
  .mock-bar { height: 4px; background: rgba(255,255,255,0.06); border-radius: 99px; margin: 0.85rem 0; position: relative; overflow: hidden; }
  .mock-bar-fill { height: 100%; border-radius: 99px; background: var(--gold); animation: mock-progress 3s ease-in-out infinite alternate; }
  @keyframes mock-progress { from { width: 35%; } to { width: 75%; } }
  .mock-bpm { font-family: 'Bebas Neue', sans-serif; font-size: 3rem; color: var(--gold); line-height: 1; }
  .mock-tag { display: inline-block; background: rgba(220,185,138,0.12); color: var(--gold); padding: 0.2rem 0.6rem; border-radius: 100px; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.05em; margin-top: 0.5rem; }

  .mock-chart { display: flex; align-items: flex-end; gap: 6px; height: 60px; margin-top: 1rem; }
  .mock-bar-chart { flex: 1; border-radius: 3px 3px 0 0; background: rgba(220,185,138,0.2); transition: height 0.3s; }
  .mock-bar-chart.hi { background: var(--gold); }

  .mock-routine { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
  .mock-routine-item {
    display: flex; align-items: center; gap: 0.75rem;
    background: rgba(255,255,255,0.03); border-radius: 8px; padding: 0.6rem 0.85rem;
    font-size: 0.78rem;
  }
  .mock-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .mock-routine-item span { color: var(--muted); margin-left: auto; font-size: 0.68rem; }

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

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .reveal {
    opacity: 0; transform: translateY(30px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .reveal.visible { opacity: 1; transform: translateY(0); }

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
        <div className="cursor" id="cursor">
          <div className="cursor-ring" id="cursorRing"></div>
          <div className="cursor-dot" id="cursorDot"></div>
        </div>

        <nav id="nav">
          <Link href="/" className="logo" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            <img src="/favicon.ico" alt="RiffRoutine" style={{ width: "24px", height: "24px", marginRight: "0.5rem", borderRadius: "4px" }} />
            Riff<span>Routine</span>
          </Link>
          <ul>
            <li><a href="#features">{t('nav.features')}</a></li>
            <li><a href="#how">{t('nav.how')}</a></li>
            <li><a href="#testimonios">{t('nav.community')}</a></li>
            <li><Link href="/login">{t('nav.login')}</Link></li>
            <li><Link href="/login" className="nav-cta">{t('nav.startFree')}</Link></li>
            <li><LanguageSwitcher /></li>
          </ul>
        </nav>

        <section className="hero">
          <div className="hero-bg-lines"></div>
          <p className="hero-eyebrow">{t('hero.eyebrow')}</p>
          <h1>{t('hero.title1')}<br /><em>{t('hero.title_em')}</em><br />{t('hero.title2')}</h1>
          <p className="hero-sub">{t('hero.sub')}</p>
          <div className="hero-actions">
            <Link href="/login" className="btn-primary">{t('hero.startBtn')}</Link>
            <a href="#features" className="btn-ghost">{t('hero.howBtn')}</a>
          </div>
          <div className="hero-scroll-hint">
            <div className="scroll-line"></div>
            <span>{t('hero.scroll')}</span>
          </div>
        </section>

        <div className="ticker-wrap">
          <div className="ticker">
            <span className="ticker-item">{t('ticker.tabPlayer')}<span className="ticker-dot"></span></span>
            <span className="ticker-item">{t('ticker.bpmControl')}<span className="ticker-dot"></span></span>
            <span className="ticker-item">{t('ticker.routines')}<span className="ticker-dot"></span></span>
            <span className="ticker-item">{t('ticker.stats')}<span className="ticker-dot"></span></span>
            <span className="ticker-item">{t('ticker.streak')}<span className="ticker-dot"></span></span>
            <span className="ticker-item">{t('ticker.heatmap')}<span className="ticker-dot"></span></span>
            <span className="ticker-item">{t('ticker.metronome')}<span className="ticker-dot"></span></span>
            <span className="ticker-item">{t('ticker.loop')}<span className="ticker-dot"></span></span>
            
            <span className="ticker-item">{t('ticker.tabPlayer')}<span className="ticker-dot"></span></span>
            <span className="ticker-item">{t('ticker.bpmControl')}<span className="ticker-dot"></span></span>
            <span className="ticker-item">{t('ticker.routines')}<span className="ticker-dot"></span></span>
            <span className="ticker-item">{t('ticker.stats')}<span className="ticker-dot"></span></span>
            <span className="ticker-item">{t('ticker.streak')}<span className="ticker-dot"></span></span>
            <span className="ticker-item">{t('ticker.heatmap')}<span className="ticker-dot"></span></span>
            <span className="ticker-item">{t('ticker.metronome')}<span className="ticker-dot"></span></span>
            <span className="ticker-item">{t('ticker.loop')}<span className="ticker-dot"></span></span>
          </div>
        </div>

        <div className="stats-bar reveal">
          <div className="stat-item">
            <div className="stat-value" data-target="12400">0</div>
            <div className="stat-label">{t('stats.sessions')}</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" data-target="8300">0</div>
            <div className="stat-label">{t('stats.hours')}</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" data-target="94">0</div>
            <div className="stat-label">{t('stats.improve')}</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" data-target="3100">0</div>
            <div className="stat-label">{t('stats.active')}</div>
          </div>
        </div>

        <section className="features" id="features">
          <div className="features-header reveal">
            <span className="section-label">{t('features.label')}</span>
            <h2 className="section-title">{t('features.title1')}<br />{t('features.title2')} <em>{t('features.title_em')}</em></h2>
          </div>

          <div className="features-grid">
            <div className="feature-card large reveal">
              <div>
                <div className="feature-icon" style={{ background: "rgba(220,185,138,0.1)" }}>🎸</div>
                <h3>{t('features.card1.title')}</h3>
                <p>{t('features.card1.desc')}</p>
                <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <span className="mock-tag">{t('features.card1.tag1')}</span>
                  <span className="mock-tag">{t('features.card1.tag2')}</span>
                  <span className="mock-tag" style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>× 0.75</span>
                  <span className="mock-tag" style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa" }}>{t('features.card1.tag3')}</span>
                </div>
              </div>
              <div className="mock-player">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span style={{ color: "var(--muted)", fontSize: "0.72rem" }}>{t('features.card1.mockMode')}</span>
                  <span style={{ color: "var(--gold)", fontWeight: "700", fontSize: "0.78rem" }}>{t('features.card1.mockLive')}</span>
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", marginBottom: "0.5rem" }}>Eruption — Van Halen</div>
                <div className="mock-bar"><div className="mock-bar-fill"></div></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "0.62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t('features.card1.mockBpmCurrent')}</div>
                    <div className="mock-bpm">132</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t('features.card1.mockTarget')}</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: "#a78bfa" }}>160</div>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <div style={{ background: "var(--gold)", borderRadius: "6px", padding: "0.5rem 1rem", fontWeight: "800", color: "#111", fontSize: "0.8rem" }}>{t('features.card1.mockPlay')}</div>
                    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "0.5rem 0.6rem", fontSize: "0.8rem" }}>⏹</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="feature-card reveal">
              <div className="feature-icon" style={{ background: "rgba(167,139,250,0.1)" }}>📋</div>
              <h3>{t('features.card2.title')}</h3>
              <p>{t('features.card2.desc')}</p>
              <div className="mock-routine">
                <div className="mock-routine-item">
                  <div className="mock-dot" style={{ background: "var(--gold)" }}></div>
                  {t('features.card2.mockEx1')}
                  <span>{t('features.card2.mockEx1Time')}</span>
                </div>
                <div className="mock-routine-item" style={{ border: "1px solid rgba(220,185,138,0.3)", background: "rgba(220,185,138,0.05)" }}>
                  <div className="mock-dot" style={{ background: "#4ade80" }}></div>
                  {t('features.card2.mockEx2')}
                  <span style={{ color: "var(--gold)" }}>{t('features.card2.mockEx2Status')}</span>
                </div>
                <div className="mock-routine-item">
                  <div className="mock-dot" style={{ background: "rgba(255,255,255,0.15)" }}></div>
                  {t('features.card2.mockEx3')}
                  <span>{t('features.card2.mockEx3Time')}</span>
                </div>
              </div>
            </div>

            <div className="feature-card reveal">
              <div className="feature-icon" style={{ background: "rgba(74,222,128,0.1)" }}>📈</div>
              <h3>{t('features.card3.title')}</h3>
              <p>{t('features.card3.desc')}</p>
              <div className="mock-chart" id="mockChart">
                <div className="mock-bar-chart" style={{ height: "30%" }}></div>
                <div className="mock-bar-chart" style={{ height: "45%" }}></div>
                <div className="mock-bar-chart" style={{ height: "40%" }}></div>
                <div className="mock-bar-chart" style={{ height: "60%" }}></div>
                <div className="mock-bar-chart" style={{ height: "55%" }}></div>
                <div className="mock-bar-chart hi" style={{ height: "75%" }}></div>
                <div className="mock-bar-chart hi" style={{ height: "80%" }}></div>
                <div className="mock-bar-chart hi" style={{ height: "90%" }}></div>
              </div>
              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t('features.card3.mockSession1')}</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "rgba(255,255,255,0.4)" }}>84 BPM</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t('features.card3.mockToday')}</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "var(--green)" }}>138 BPM</div>
                </div>
              </div>
            </div>

            <div className="feature-card reveal" style={{ gridColumn: "span 2" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center" }}>
                <div>
                  <div className="feature-icon" style={{ background: "rgba(96,165,250,0.1)" }}>🔥</div>
                  <h3>{t('features.card4.title')}</h3>
                  <p>{t('features.card4.desc')}</p>
                </div>
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "3px", marginBottom: "1rem" }} id="heatmapMock"></div>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)", borderRadius: "8px", padding: "0.6rem 1rem" }}>
                      <div style={{ fontSize: "0.62rem", color: "rgba(251,146,60,0.6)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t('features.card4.mockStreak')}</div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", color: "#fb923c" }}>{t('features.card4.mockStreakVal')}</div>
                    </div>
                    <div style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "8px", padding: "0.6rem 1rem" }}>
                      <div style={{ fontSize: "0.62rem", color: "rgba(96,165,250,0.6)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t('features.card4.mockWeek')}</div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", color: "#60a5fa" }}>{t('features.card4.mockWeekVal')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="how" id="how">
          <div className="how-inner">
            <div className="how-header reveal">
              <span className="section-label">{t('how.label')}</span>
              <h2 className="section-title">{t('how.title1')}<br /><em>{t('how.title_em')}</em></h2>
            </div>
            <div className="steps">
              <div className="step reveal">
                <div className="step-num">01</div>
                <h4>{t('how.step1Title')}</h4>
                <p>{t('how.step1Desc')}</p>
              </div>
              <div className="step reveal" style={{ transitionDelay: "0.15s" }}>
                <div className="step-num">02</div>
                <h4>{t('how.step2Title')}</h4>
                <p>{t('how.step2Desc')}</p>
              </div>
              <div className="step reveal" style={{ transitionDelay: "0.3s" }}>
                <div className="step-num">03</div>
                <h4>{t('how.step3Title')}</h4>
                <p>{t('how.step3Desc')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="proof" id="testimonios">
          <div className="proof-header reveal">
            <span className="section-label">{t('testimonials.label')}</span>
            <h2 className="section-title">{t('testimonials.title1')}<br /><em>{t('testimonials.title_em')}</em></h2>
          </div>
          <div className="testimonials">
            <div className="testimonial reveal">
              <div className="stars">★★★★★</div>
              <p className="testimonial-text">{t('testimonials.t1Text')}</p>
              <div className="testimonial-author">
                <div className="author-avatar">JM</div>
                <div>
                  <div className="author-name">{t('testimonials.t1Author')}</div>
                  <div className="author-role">{t('testimonials.t1Role')}</div>
                </div>
              </div>
            </div>
            <div className="testimonial reveal" style={{ transitionDelay: "0.1s" }}>
              <div className="stars">★★★★★</div>
              <p className="testimonial-text">{t('testimonials.t2Text')}</p>
              <div className="testimonial-author">
                <div className="author-avatar">SL</div>
                <div>
                  <div className="author-name">{t('testimonials.t2Author')}</div>
                  <div className="author-role">{t('testimonials.t2Role')}</div>
                </div>
              </div>
            </div>
            <div className="testimonial reveal" style={{ transitionDelay: "0.2s" }}>
              <div className="stars">★★★★★</div>
              <p className="testimonial-text">{t('testimonials.t3Text')}</p>
              <div className="testimonial-author">
                <div className="author-avatar">AK</div>
                <div>
                  <div className="author-name">{t('testimonials.t3Author')}</div>
                  <div className="author-role">{t('testimonials.t3Role')}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="cta-section"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2.5rem",
            padding: "4rem 2rem",
            textAlign: "center"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
            <span className="section-label" style={{ display: "block", fontWeight: 600, letterSpacing: "0.05em" }}>
              {t('cta.label')}
            </span>

            <h2 className="section-title reveal" style={{ margin: 0, lineHeight: "1.15" }}>
              {t('cta.title1')}<br />
              {t('cta.title2')}<br />
              <em>{t('cta.title_em')}</em>
            </h2>

            <p className="reveal" style={{ margin: 0, maxWidth: "500px", lineHeight: "1.6" }}>
              {t('cta.desc')}
            </p>
          </div>

          <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
            <Link
              href="/login"
              className="btn-primary"
              style={{
                display: "inline-block",
                fontSize: "1.1rem",
                padding: "1.1rem 3rem",
                textDecoration: "none"
              }}
            >
              {t('cta.btn')}
            </Link>
            <p className="cta-note" style={{ margin: 0, fontSize: "0.85rem", opacity: 0.8 }}>
              {t('cta.note')}
            </p>
          </div>
        </section>

        <footer>
          <Link href="#" className="logo" style={{ fontSize: "1.2rem", display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            <img src="/favicon.ico" alt="RiffRoutine" style={{ width: "24px", height: "24px", marginRight: "0.5rem", borderRadius: "4px" }} />
            Riff<span>Routine</span>
          </Link>
          <div className="footer-links">
            <Link href="#">{t('footer.privacy')}</Link>
            <Link href="#">{t('footer.terms')}</Link>
            <Link href="#">{t('footer.contact')}</Link>
          </div>
          <p>{t('footer.copyright')}</p>
        </footer>
      </div>
    </>
  );
}