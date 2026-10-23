"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { formatKpiTime } from '@/lib/utils';
import { useOnboarding } from '@/hooks/useOnboarding'; // Asegúrate de ajustar la ruta si es necesario

const Icons = {
  Guitar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" /></svg>,
  Routine: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  Library: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>,
  Explore: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Stats: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  Play: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>,
  Fire: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>,
  Clock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  Target: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  Upload: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
  Info: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
};
import styles from './page.module.css';
import { TEACHER_MODE_ENABLED } from '@/lib/features';
import { cx } from '@/lib/cx';

interface PendingInvite {
  id: string;
  teacher_id: string;
  teacher_name: string | null;
  teacher_avatar: string | null;
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

// ── Invite card ──────────────────────────────────────────────────────────────
function InviteCard({ invite, onAccept, onDecline }: {
  invite: PendingInvite;
  onAccept: (id: string, teacherId: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
}) {
  const t = useTranslations('HomePage');
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null);
  const name = invite.teacher_name ?? t('invites.unknownTeacher');
  const initials = name.slice(0, 2).toUpperCase();

  const handle = async (action: 'accept' | 'decline') => {
    setLoading(action);
    if (action === 'accept') await onAccept(invite.id, invite.teacher_id);
    else await onDecline(invite.id);
    setLoading(null);
  };

  return (
    <div className={styles.badgeRow}>
      {/* Teacher avatar */}
      <div className={styles.row} style={{ background: invite.teacher_avatar ? 'transparent' : 'rgba(167,139,250,0.15)' }}>
        {invite.teacher_avatar
          ? <img src={invite.teacher_avatar} alt={name} className={styles.image} />
          : <span className={styles.label}>{initials}</span>
        }
      </div>

      {/* Text */}
      <div className={styles.badge}>
        <div className={styles.badgeRow2}>
          <span className={styles.badgeLabel}>
            {t('invites.badge')}
          </span>
        </div>
        <p className={styles.messageText}>
          {t('invites.message', { teacher: name })}
        </p>
      </div>

      {/* Actions */}
      <div className={styles.declineRow}>
        <button
          onClick={() => handle('decline')}
          disabled={!!loading}
          className={styles.declineButton} style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading === 'decline' ? 0.5 : 1 }}
        >
          {t('invites.decline')}
        </button>
        <button
          onClick={() => handle('accept')}
          disabled={!!loading}
          className={styles.acceptingButton} style={{ background: loading === 'accept' ? 'rgba(167,139,250,0.3)' : 'rgba(167,139,250,0.2)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading === 'accept' ? 0.6 : 1 }}
        >
          {loading === 'accept' ? t('invites.accepting') : t('invites.accept')}
        </button>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations('HomePage');
  const {
    eligible: onboardingEligible,
    start: startOnboarding,
    complete: completeOnboarding
  } = useOnboarding();

  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [streak, setStreak] = useState(0);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [prevWeekMinutes, setPrevWeekMinutes] = useState(0);
  const [lastSession, setLastSession] = useState<{ routineName: string | null; startedAt: string; durationSeconds: number; routineId: string | null } | null>(null);
  const [closestExercise, setClosestExercise] = useState<{ title: string; pct: number; lastBpm: number; targetBpm: number; exerciseId: string } | null>(null);

  // ── Pending invites ────────────────────────────────────────────────────────
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  // ──────────────────────────────────────────────────────────────────────────

  const navSections = [
    { label: t('nav.practice.label'), href: '/practice', icon: Icons.Guitar, desc: t('nav.practice.desc'), accent: '#dcb98a' },
    { label: t('nav.library.label'), href: '/library', icon: Icons.Library, desc: t('nav.library.desc'), accent: '#60a5fa' },
    { label: t('nav.routines.label'), href: '/routines', icon: Icons.Routine, desc: t('nav.routines.desc'), accent: '#a78bfa' },
    { label: t('nav.explore.label'), href: '/explore', icon: Icons.Explore, desc: t('nav.explore.desc'), accent: '#34d399' },
    { label: t('nav.stats.label'), href: '/stats', icon: Icons.Stats, desc: t('nav.stats.desc'), accent: '#f87171' },
  ];

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();
    setUserName(profile?.username || user.email?.split('@')[0] || t('defaultUser'));

    // ── Fetch pending invites ──────────────────────────────────────────────
    if (TEACHER_MODE_ENABLED && user.email) {
      const { data: invites } = await supabase
        .from('teacher_students')
        .select('id, teacher_id, profiles:teacher_id(username, avatar_url)')
        .eq('invite_email', user.email.toLowerCase())
        .eq('status', 'pending');

      if (invites) {
        setPendingInvites(invites.map(i => ({
          id: i.id,
          teacher_id: i.teacher_id,
          teacher_name: (i.profiles as any)?.username ?? null,
          teacher_avatar: (i.profiles as any)?.avatar_url ?? null,
        })));
      }
    }
    // ──────────────────────────────────────────────────────────────────────

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
      const latestData: Record<string, { bpm: number; date: string }> = {};

      logs.forEach(l => {
        if (!(l.exercise_id in latestData)) {
          latestData[l.exercise_id] = { bpm: l.bpm_used, date: l.created_at };
        }
      });

      let best: typeof closestExercise & { score?: number } | null = null;
      const now = Date.now();

      exercises.forEach(ex => {
        const last = latestData[ex.id];
        if (!last || !ex.bpm_goal) return;

        const pct = Math.round((last.bpm / ex.bpm_goal) * 100);

        if (pct >= 60 && pct < 100) {
          const lastDate = new Date(last.date).getTime();
          const daysPassed = (now - lastDate) / (1000 * 60 * 60 * 24);

          const timePenalty = Math.min(daysPassed * 0.5, 30);
          const score = pct - timePenalty;

          if (!best || score > best.score!) {
            best = {
              title: ex.title,
              pct,
              lastBpm: last.bpm,
              targetBpm: ex.bpm_goal,
              exerciseId: ex.id,
              score
            };
          }
        }
      });

      setClosestExercise(best);
    }

    setLoading(false);
  };

  // ── Invite handlers ────────────────────────────────────────────────────────
  const handleAcceptInvite = async (inviteId: string, teacherId: string) => {
    if (!userId) return;
    await supabase
      .from('teacher_students')
      .update({ student_id: userId, status: 'active', invite_token: null, updated_at: new Date().toISOString() })
      .eq('id', inviteId);
    setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
  };

  const handleDeclineInvite = async (inviteId: string) => {
    await supabase
      .from('teacher_students')
      .update({ status: 'removed', updated_at: new Date().toISOString() })
      .eq('id', inviteId);
    setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
  };
  // ──────────────────────────────────────────────────────────────────────────

  const weekDelta = weekMinutes - prevWeekMinutes;
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 13 ? t('greeting.morning') : greetingHour < 20 ? t('greeting.afternoon') : t('greeting.evening');

  return (
    <div data-onboarding="home" className={styles.streakActive}>

      {/* Header */}
      <div className={styles.streakActive2}>
        <p className={styles.text}>{greeting},</p>
        <h1 className={styles.title}>
          {loading ? '...' : userName}
        </h1>
        <p className={styles.streakActiveText}>
          {streak > 1 ? t('hero.streakActive', { streak }) : t('hero.noStreak')}
        </p>
      </div>

      {/* ── Pending invites ── */}
      {pendingInvites.length > 0 && (
        <div className={styles.stack}>
          {pendingInvites.map(invite => (
            <InviteCard
              key={invite.id}
              invite={invite}
              onAccept={handleAcceptInvite}
              onDecline={handleDeclineInvite}
            />
          ))}
        </div>
      )}

      {/* ── Onboarding CTA (Conditional) ── */}
      {onboardingEligible && (
        <div className={styles.titleRow}>
          <div className={styles.titleRowInner}>
            <div className={styles.titleRowInnerRow}>
              <Icons.Info />
            </div>
            <div>
              <h3 className={styles.titleSubheading}>
                {t('onboarding.title', { defaultValue: '¿Quieres realizar el tutorial de la aplicación?' })}
              </h3>
              <p className={styles.descText}>
                {t('onboarding.desc', { defaultValue: 'Descubre cómo sacarle el máximo partido a todas las herramientas.' })}
              </p>
            </div>
          </div>

          <div className={styles.btnStartRow}>
            <button
              onClick={startOnboarding}
              className={styles.btnStartButton}
            >
              {t('onboarding.btnStart', { defaultValue: 'Comenzar' })}
            </button>
            <button
              onClick={completeOnboarding}
              className={styles.btnSkipButton}
            >
              {t('onboarding.btnSkip', { defaultValue: 'Marcar como completado' })}
            </button>
          </div>
        </div>
      )}

      {/* Main CTA */}
      <div className={styles.continueRow}
        onClick={() => lastSession?.routineId ? router.push(`/practice?routine=${lastSession.routineId}`) : router.push('/practice')}
      >
        <div>
          <span className={styles.continueLabel}>
            {lastSession?.routineName ? t('mainCta.continue') : t('mainCta.startNow')}
          </span>
          <h2 className={styles.freePracticeHeading}>
            {lastSession?.routineName || t('mainCta.freePractice')}
          </h2>
          {lastSession && (
            <p className={styles.lastSessionText}>
              {t('mainCta.lastSession', { time: timeAgo(lastSession.startedAt, t), duration: formatKpiTime(lastSession.durationSeconds, t('time.min')) })}
            </p>
          )}
        </div>
        <button className={styles.btnContinueButton}>
          <Icons.Play /> {lastSession?.routineName ? t('mainCta.btnContinue') : t('mainCta.btnOpenPlayer')}
        </button>
      </div>

      {/* KPIs */}
      <div className={styles.streakGrid}>
        <div className={styles.streakBox}>
          <div className={styles.streakRow}>
            <span style={{ color: streak > 0 ? '#fb923c' : 'var(--muted)' }}><Icons.Fire /></span>
            <span className="section-label">{t('kpis.streak')}</span>
          </div>
          <p className={styles.daysText} style={{ color: streak > 0 ? '#fb923c' : 'var(--muted)' }}>
            {loading ? '—' : (streak === 1 ? t('kpis.days', { count: streak }) : t('kpis.daysPlural', { count: streak }))}
          </p>
        </div>

        <div className={styles.streakBox}>
          <div className={styles.streakRow}>
            <span className={styles.streakRowLabel}><Icons.Clock /></span>
            <span className="section-label">{t('kpis.thisWeek')}</span>
          </div>
          <p className={styles.minText}>
            {loading ? '—' : formatKpiTime(weekMinutes * 60, t('time.min'))}
          </p>
          {!loading && prevWeekMinutes > 0 && (
            <p className={styles.vsLastWeekText} style={{ color: weekDelta >= 0 ? '#4ade80' : '#f87171' }}>
              {weekDelta >= 0 ? '▲' : '▼'} {t('kpis.vsLastWeek', { delta: Math.abs(weekDelta) })}
            </p>
          )}
        </div>

        <div
          className={cx(styles.almostThereBox, closestExercise && styles.clickable)}
          onClick={() => closestExercise && router.push(`/library/${closestExercise.exerciseId}/history`)}
        >
          <div className={styles.streakRow}>
            <span className={styles.label3}><Icons.Target /></span>
            <span className="section-label">{t('kpis.almostThere')}</span>
          </div>
          {loading ? (
            <p className={styles.almostThereBoxText}>—</p>
          ) : closestExercise ? (
            <>
              <p className={styles.text3}>{closestExercise.title}</p>
              <div className={styles.box}>
                <div className={styles.almostThereBoxInner} style={{ width: `${closestExercise.pct}%` }} />
              </div>
              <p className={styles.lastBpmText}>
                {closestExercise.lastBpm} / {closestExercise.targetBpm} BPM · <span className={styles.almostThereBoxLabel}>{closestExercise.pct}%</span>
              </p>
            </>
          ) : (
            <p className={styles.addBpmGoalText}>{t('kpis.addBpmGoal')}</p>
          )}
        </div>
      </div>

      {/* Secondary CTA */}
      <div className={styles.streakActiveRow}>
        <div className={styles.titleRowInner}>
          <div className={styles.streakActiveBox}>
            <Icons.Upload />
          </div>
          <div>
            <p className={styles.titleText}>{t('secondaryCta.title')}</p>
            <p className={styles.descText2}>{t('secondaryCta.desc')}</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/practice')}
          className={styles.btnButton}
        >
          {t('secondaryCta.btn')}
        </button>
      </div>

      {/* Quick access */}
      <div>
        <h2 className={styles.quickAccessHeading}>{t('quickAccess')}</h2>
        <div className={styles.grid}>
          {navSections.map(({ label, href, icon: Icon, desc, accent }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={styles.button}
              style={{ '--accent': accent } as React.CSSProperties}
            >
              <span className={styles.accentIcon}><Icon /></span>
              <div>
                <p className={styles.text5}>{label}</p>
                <p className={styles.text6}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}