"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { useTranslations } from 'next-intl';

const Icons = {
  Guitar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>,
  Routine: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Library: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Explore: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Stats: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Play: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Fire: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  Clock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Target: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Upload: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
};

function formatKpiTime(totalSecs: number, minLabel: string) {
  if (!totalSecs) return `0 ${minLabel}`;
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} ${minLabel}`;
}

function timeAgo(isoString: string, t: any) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return t('timeAgo.mins', { mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('timeAgo.hours', { hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return t('timeAgo.yesterday');
  return t('timeAgo.days', { days });
}

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations('HomePage');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  const [streak, setStreak] = useState(0);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [prevWeekMinutes, setPrevWeekMinutes] = useState(0);
  const [lastSession, setLastSession] = useState<{ routineName: string | null; startedAt: string; durationSeconds: number; routineId: string | null } | null>(null);
  const [closestExercise, setClosestExercise] = useState<{ title: string; pct: number; lastBpm: number; targetBpm: number; exerciseId: string } | null>(null);

  const navSections = [
    { label: t('nav.practice.label'), href: '/practice', icon: Icons.Guitar, desc: t('nav.practice.desc'), accent: '#dcb98a' },
    { label: t('nav.routines.label'), href: '/routines', icon: Icons.Routine, desc: t('nav.routines.desc'), accent: '#a78bfa' },
    { label: t('nav.library.label'), href: '/library', icon: Icons.Library, desc: t('nav.library.desc'), accent: '#60a5fa' },
    { label: t('nav.explore.label'), href: '/explore', icon: Icons.Explore, desc: t('nav.explore.desc'), accent: '#34d399' },
    { label: t('nav.stats.label'), href: '/stats', icon: Icons.Stats, desc: t('nav.stats.desc'), accent: '#f87171' },
  ];

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    setUserName(profile?.username || user.email?.split('@')[0] || t('defaultUser'));

    const { data: sessions } = await supabase
      .from('practice_sessions')
      .select('id, started_at, total_duration_seconds, routine_id, routines(title)')
      .eq('user_id', user.id)
      .not('total_duration_seconds', 'is', null)
      .order('started_at', { ascending: false })
      .limit(50);

    if (sessions && sessions.length > 0) {
      const last = sessions[0];
      const routineData = last.routines as any;
      setLastSession({
        routineName: Array.isArray(routineData) ? routineData[0]?.title : routineData?.title || null,
        startedAt: last.started_at,
        durationSeconds: last.total_duration_seconds,
        routineId: last.routine_id,
      });

      const getLocalDate = (iso: string) => new Date(iso).toLocaleDateString('en-CA');
      const practiceDates = new Set(sessions.map(s => getLocalDate(s.started_at)));
      const today = new Date();
      let streakCount = 0;
      let d = 0;
      const todayStr = getLocalDate(today.toISOString());
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = getLocalDate(yesterday.toISOString());
      if (practiceDates.has(todayStr) || practiceDates.has(yesterdayStr)) {
        const start = practiceDates.has(todayStr) ? today : yesterday;
        while (true) {
          const check = new Date(start); check.setDate(start.getDate() - d);
          if (practiceDates.has(getLocalDate(check.toISOString()))) { streakCount++; d++; } else break;
        }
      }
      setStreak(streakCount);

      const now = Date.now();
      const weekMs = 7 * 24 * 3600 * 1000;
      const weekSecs = sessions.filter(s => now - new Date(s.started_at).getTime() < weekMs).reduce((a, s) => a + (s.total_duration_seconds || 0), 0);
      const prevWeekSecs = sessions.filter(s => { const age = now - new Date(s.started_at).getTime(); return age >= weekMs && age < 2 * weekMs; }).reduce((a, s) => a + (s.total_duration_seconds || 0), 0);
      setWeekMinutes(Math.round(weekSecs / 60));
      setPrevWeekMinutes(Math.round(prevWeekSecs / 60));
    }

    const { data: logs } = await supabase
      .from('practice_logs')
      .select('exercise_id, bpm_used, created_at')
      .eq('user_id', user.id)
      .not('bpm_used', 'is', null)
      .order('created_at', { ascending: false });

    const { data: exercises } = await supabase
      .from('exercises')
      .select('id, title, bpm_goal')
      .eq('user_id', user.id)
      .not('bpm_goal', 'is', null);

    if (logs && exercises) {
      const latestBpm: Record<string, number> = {};
      logs.forEach(l => { if (!(l.exercise_id in latestBpm)) latestBpm[l.exercise_id] = l.bpm_used; });

      let best: typeof closestExercise = null;
      exercises.forEach(ex => {
        const last = latestBpm[ex.id];
        if (!last || !ex.bpm_goal) return;
        const pct = Math.round((last / ex.bpm_goal) * 100);
        if (pct >= 60 && pct < 100 && (!best || pct > best.pct)) {
          best = { title: ex.title, pct, lastBpm: last, targetBpm: ex.bpm_goal, exerciseId: ex.id };
        }
      });
      setClosestExercise(best);
    }

    setLoading(false);
  };

  const weekDelta = weekMinutes - prevWeekMinutes;
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 13 ? t('greeting.morning') : greetingHour < 20 ? t('greeting.afternoon') : t('greeting.evening');

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: '4rem' }}>

      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 0.25rem' }}>{greeting},</p>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3.5rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
          {loading ? '...' : userName}
        </h1>
        <p style={{ color: 'var(--muted)', margin: '0.6rem 0 0', fontSize: '0.95rem' }}>
          {streak > 1 ? t('hero.streakActive', { streak }) : t('hero.noStreak')}
        </p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, rgba(220,185,138,0.12) 0%, rgba(220,185,138,0.04) 100%)',
        border: '1px solid rgba(220,185,138,0.25)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
        flexWrap: 'wrap',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
        onClick={() => lastSession?.routineId ? router.push(`/practice?routine=${lastSession.routineId}`) : router.push('/practice')}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(220,185,138,0.5)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(220,185,138,0.25)')}
      >
        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(220,185,138,0.6)', display: 'block', marginBottom: '0.3rem' }}>
            {lastSession?.routineName ? t('mainCta.continue') : t('mainCta.startNow')}
          </span>
          <h2 style={{ margin: 0, fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: 'var(--text)', lineHeight: 1 }}>
            {lastSession?.routineName || t('mainCta.freePractice')}
          </h2>
          {lastSession && (
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>
              {t('mainCta.lastSession', { 
                time: timeAgo(lastSession.startedAt, t), 
                duration: formatKpiTime(lastSession.durationSeconds, t('time.min')) 
              })}
            </p>
          )}
        </div>
        <button style={{
          background: 'var(--gold)', color: '#111', border: 'none', borderRadius: '50px',
          padding: '0.8rem 1.6rem', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap',
          fontFamily: 'DM Sans, sans-serif', flexShrink: 0,
        }}>
          <Icons.Play /> {lastSession?.routineName ? t('mainCta.btnContinue') : t('mainCta.btnOpenPlayer')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>

        <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ color: streak > 0 ? '#fb923c' : 'var(--muted)' }}><Icons.Fire /></span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>{t('kpis.streak')}</span>
          </div>
          <p style={{ margin: 0, fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', lineHeight: 1, color: streak > 0 ? '#fb923c' : 'var(--muted)' }}>
            {loading ? '—' : (streak === 1 ? t('kpis.days', { count: streak }) : t('kpis.daysPlural', { count: streak }))}
          </p>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ color: '#60a5fa' }}><Icons.Clock /></span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>{t('kpis.thisWeek')}</span>
          </div>
          <p style={{ margin: 0, fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', lineHeight: 1, color: 'var(--text)' }}>
            {loading ? '—' : formatKpiTime(weekMinutes * 60, t('time.min'))}
          </p>
          {!loading && prevWeekMinutes > 0 && (
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: weekDelta >= 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
              {weekDelta >= 0 ? '▲' : '▼'} {t('kpis.vsLastWeek', { delta: Math.abs(weekDelta) })}
            </p>
          )}
        </div>

        <div
          style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1.25rem', cursor: closestExercise ? 'pointer' : 'default', transition: 'border-color 0.2s' }}
          onClick={() => closestExercise && router.push(`/library`)}
          onMouseEnter={e => closestExercise && (e.currentTarget.style.borderColor = 'rgba(220,185,138,0.3)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ color: '#4ade80' }}><Icons.Target /></span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>{t('kpis.almostThere')}</span>
          </div>
          {loading ? (
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>—</p>
          ) : closestExercise ? (
            <>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{closestExercise.title}</p>
              <div style={{ marginTop: '0.5rem', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${closestExercise.pct}%`, background: '#4ade80', borderRadius: 99 }} />
              </div>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: 'var(--muted)' }}>
                {closestExercise.lastBpm} / {closestExercise.targetBpm} BPM · <span style={{ color: '#4ade80', fontWeight: 700 }}>{closestExercise.pct}%</span>
              </p>
            </>
          ) : (
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.4 }}>{t('kpis.addBpmGoal')}</p>
          )}
        </div>
      </div>

      <div style={{
        background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px',
        padding: '1.25rem 1.5rem', marginBottom: '2.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(220,185,138,0.08)', borderRadius: '10px', padding: '0.7rem', color: 'var(--gold)' }}>
            <Icons.Upload />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>{t('secondaryCta.title')}</p>
            <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>{t('secondaryCta.desc')}</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/practice')}
          style={{ background: 'transparent', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '0.6rem 1.2rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'DM Sans, sans-serif', transition: 'border-color 0.2s', whiteSpace: 'nowrap' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
        >
          {t('secondaryCta.btn')}
        </button>
      </div>

      <div>
        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: 'var(--muted)', letterSpacing: '0.08em', margin: '0 0 1rem' }}>{t('quickAccess')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {navSections.map(({ label, href, icon: Icon, desc, accent }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              style={{
                background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '12px', padding: '1.1rem 1rem', textAlign: 'left',
                cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
                display: 'flex', flexDirection: 'column', gap: '0.6rem',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}40`; e.currentTarget.style.background = `color-mix(in srgb, ${accent} 5%, var(--surface))`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.background = 'var(--surface)'; }}
            >
              <span style={{ color: accent }}><Icon /></span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>{label}</p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.3 }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}