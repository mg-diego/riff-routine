"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';

type StudentStatus = 'active' | 'pending' | 'suspended';

interface Student {
    id: string;
    invite_email: string;
    status: StudentStatus;
    student_id: string | null;
    username: string | null;
    avatar_url: string | null;
    last_session: string | null;
    last_routine: string | null;
    sessions_this_week: number;
    minutes_this_week: number;
}

// Activity indicator based on last session
function activityColor(lastSession: string | null): { color: string; label: string } {
    if (!lastSession) return { color: '#6b7280', label: 'inactive' };
    const days = (Date.now() - new Date(lastSession).getTime()) / 86400000;
    if (days < 2)  return { color: '#4ade80', label: 'active' };
    if (days < 5)  return { color: '#facc15', label: 'recent' };
    return { color: '#f87171', label: 'away' };
}

function ActivityDot({ lastSession }: { lastSession: string | null }) {
    const { color } = activityColor(lastSession);
    return (
        <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: color, flexShrink: 0,
            boxShadow: `0 0 6px ${color}60`,
        }} />
    );
}

function WeekBar({ sessions, minutes }: { sessions: number; minutes: number }) {
    // Visual bar: 7 day dots
    const days = Math.min(sessions, 7);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '80px' }}>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} style={{
                        width: '8px', height: '8px', borderRadius: '2px',
                        background: i < days ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
                        transition: 'background 0.2s',
                    }} />
                ))}
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 500 }}>
                {sessions}d · {minutes}m
            </span>
        </div>
    );
}

function Avatar({ name, url, size = 36 }: { name: string; url: string | null; size?: number }) {
    const initials = name ? name.slice(0, 2).toUpperCase() : '??';
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            background: url ? 'transparent' : 'rgba(167,139,250,0.12)',
            border: '1px solid rgba(167,139,250,0.2)',
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            {url
                ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: size * 0.38, color: '#c4b5fd' }}>{initials}</span>
            }
        </div>
    );
}

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
    const t = useTranslations('TeacherStudents');    
    const tShared = useTranslations('Teacher');
    const [email,   setEmail]   = useState('');
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');

    const handleInvite = async () => {
        if (!email.trim()) return;
        setLoading(true); setError('');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { count } = await supabase
                .from('teacher_students')
                .select('*', { count: 'exact', head: true })
                .eq('teacher_id', user.id)
                .in('status', ['active', 'pending']);

            const { data: profile } = await supabase
                .from('profiles').select('subscription_tier').eq('id', user.id).single();

            const max = profile?.subscription_tier === 'lifetime' ? 999999 : 5;
            if ((count ?? 0) >= max) { setError(t('invite.limitReached')); setLoading(false); return; }

            const { data: existing } = await supabase
                .from('teacher_students').select('id')
                .eq('teacher_id', user.id).eq('invite_email', email.trim().toLowerCase()).maybeSingle();
            if (existing) { setError(t('invite.alreadyInvited')); setLoading(false); return; }

            await supabase.from('teacher_students').insert({
                teacher_id:   user.id,
                student_id:   null,
                invite_email: email.trim().toLowerCase(),
                invite_token: crypto.randomUUID(),
                status:       'pending',
            });

            onInvited(); onClose();
        } catch { setError(t('invite.error')); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '14px', padding: '1.75rem', width: '100%', maxWidth: '400px', fontFamily: 'DM Sans, sans-serif' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div>
                        <h3 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: '#c4b5fd', margin: '0 0 0.2rem', letterSpacing: '0.04em' }}>{t('invite.title')}</h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: 0 }}>{t('invite.subtitle')}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleInvite()}
                        placeholder={t('invite.emailPlaceholder')}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.65rem 0.85rem', color: 'var(--text)', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.4)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        autoFocus
                    />
                    {error && <p style={{ color: '#e74c3c', fontSize: '0.78rem', margin: 0 }}>{error}</p>}
                    <button onClick={handleInvite} disabled={loading || !email.trim()} style={{ padding: '0.65rem', background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.35)', borderRadius: '8px', color: '#c4b5fd', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', cursor: loading ? 'not-allowed' : 'pointer', opacity: !email.trim() ? 0.5 : 1 }}>
                        {loading ? t('invite.sending') : t('invite.send')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function RemoveConfirmModal({ student, onConfirm, onClose }: { student: Student; onClose: () => void; onConfirm: () => Promise<void> }) {
    const t = useTranslations('TeacherStudents');
    const tShared = useTranslations('Teacher');
    const [loading, setLoading] = useState(false);
    const name = student.username ?? student.invite_email.split('@')[0];
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: '14px', padding: '1.75rem', width: '100%', maxWidth: '380px', fontFamily: 'DM Sans, sans-serif' }}>
                <h3 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: '#e74c3c', margin: '0 0 0.5rem' }}>{t('remove.title')}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>{t('remove.confirm', { name })}</p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '0.55rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
                        {t('remove.cancel')}
                    </button>
                    <button onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); }} disabled={loading} style={{ padding: '0.55rem 1rem', background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: '7px', color: '#e74c3c', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
                        {loading ? t('remove.removing') : t('remove.confirm_btn')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function TeacherStudentsPage() {
    const t      = useTranslations('TeacherStudents');    
    const tShared = useTranslations('Teacher');
    const router = useRouter();
    const locale = useLocale();

    const [students,      setStudents]      = useState<Student[]>([]);
    const [loading,       setLoading]       = useState(true);
    const [showInvite,    setShowInvite]    = useState(false);
    const [removeTarget,  setRemoveTarget]  = useState<Student | null>(null);
    const [filter,        setFilter]        = useState<'all' | 'active' | 'pending'>('all');

    const fetchStudents = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: ts } = await supabase
            .from('teacher_students')
            .select(`id, invite_email, status, student_id, profiles:student_id(username, avatar_url)`)
            .eq('teacher_id', user.id)
            .neq('status', 'removed')
            .order('created_at', { ascending: false });

        if (!ts) { setLoading(false); return; }

        // Enrich pending students via email lookup
        const pendingEmails = ts.filter(s => !s.student_id).map(s => s.invite_email);
        const { data: pendingProfiles } = pendingEmails.length > 0
            ? await supabase.from('profiles').select('email, username, avatar_url').in('email', pendingEmails)
            : { data: [] };

        const pendingMap: Record<string, { username: string | null; avatar_url: string | null }> = {};
        (pendingProfiles ?? []).forEach((p: any) => {
            if (p.email) pendingMap[p.email] = { username: p.username, avatar_url: p.avatar_url };
        });

        // Last session + weekly activity per active student
        const studentIds = ts.filter(s => s.student_id).map(s => s.student_id as string);
        const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

        const { data: sessions } = studentIds.length > 0
            ? await supabase
                .from('practice_sessions')
                .select('user_id, started_at, total_duration_seconds, routines:routine_id(title)')
                .in('user_id', studentIds)
                .order('started_at', { ascending: false })
            : { data: [] };

        // Build per-student maps
        const lastSessionMap:  Record<string, string>         = {};
        const lastRoutineMap:  Record<string, string>         = {};
        const weekSessionsMap: Record<string, number>         = {};
        const weekMinutesMap:  Record<string, number>         = {};

        (sessions ?? []).forEach((s: any) => {
            if (!lastSessionMap[s.user_id]) {
                lastSessionMap[s.user_id] = s.started_at;
                const rt = Array.isArray(s.routines) ? s.routines[0] : s.routines;
                lastRoutineMap[s.user_id] = rt?.title ?? null;
            }
            if (s.started_at >= weekAgo) {
                weekSessionsMap[s.user_id] = (weekSessionsMap[s.user_id] ?? 0) + 1;
                weekMinutesMap[s.user_id]  = (weekMinutesMap[s.user_id] ?? 0) + Math.round((s.total_duration_seconds ?? 0) / 60);
            }
        });

        setStudents(ts.map(s => {
            const active  = s.student_id ? (s.profiles as any) : null;
            const pending = !s.student_id ? pendingMap[s.invite_email] : null;
            return {
                id:                 s.id,
                invite_email:       s.invite_email,
                status:             s.status as StudentStatus,
                student_id:         s.student_id,
                username:           active?.username    ?? pending?.username    ?? null,
                avatar_url:         active?.avatar_url  ?? pending?.avatar_url  ?? null,
                last_session:       s.student_id ? (lastSessionMap[s.student_id] ?? null) : null,
                last_routine:       s.student_id ? (lastRoutineMap[s.student_id] ?? null) : null,
                sessions_this_week: s.student_id ? (weekSessionsMap[s.student_id] ?? 0) : 0,
                minutes_this_week:  s.student_id ? (weekMinutesMap[s.student_id] ?? 0) : 0,
            };
        }));

        setLoading(false);
    };

    useEffect(() => { fetchStudents(); }, []);

    const handleRemove = async (student: Student) => {
        await supabase
            .from('teacher_students')
            .update({ status: 'removed', updated_at: new Date().toISOString() })
            .eq('id', student.id);
        setStudents(prev => prev.filter(s => s.id !== student.id));
        setRemoveTarget(null);
    };

    const handleResendInvite = async (student: Student) => {
        // Regenerate token — in a real setup you'd trigger an email here
        await supabase
            .from('teacher_students')
            .update({ invite_token: crypto.randomUUID() })
            .eq('id', student.id);
    };

    const formatRelative = (iso: string) => {
        const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
        if (days === 0) return tShared('time.today');
        if (days === 1) return t('time.yesterday');
        return t('time.daysAgo', { days });
    };

    const filtered = students.filter(s =>
        filter === 'all'     ? true :
        filter === 'active'  ? s.status === 'active' :
        filter === 'pending' ? s.status === 'pending' : true
    );

    const activeCount  = students.filter(s => s.status === 'active').length;
    const pendingCount = students.filter(s => s.status === 'pending').length;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(167,139,250,0.15)', borderTopColor: '#c4b5fd', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'DM Sans, sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                    <p style={{ color: '#c4b5fd', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 0.3rem', opacity: 0.7 }}>
                        {t('label')}
                    </p>
                    <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: '#c4b5fd', margin: 0, lineHeight: 1 }}>
                        {t('title')}
                    </h1>
                </div>
                <button
                    onClick={() => setShowInvite(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)', borderRadius: '8px', color: '#c4b5fd', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(167,139,250,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(167,139,250,0.15)'}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                    </svg>
                    {t('invite')}
                </button>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
                {([
                    { key: 'all',     label: t('filter.all'),     count: students.length },
                    { key: 'active',  label: t('filter.active'),  count: activeCount },
                    { key: 'pending', label: t('filter.pending'), count: pendingCount },
                ] as const).map(tab => (
                    <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                        padding: '0.35rem 0.85rem', borderRadius: '6px', border: 'none',
                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                        fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
                        background: filter === tab.key ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                        color: filter === tab.key ? '#c4b5fd' : 'var(--muted)',
                    }}>
                        {tab.label}
                        <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', opacity: 0.7 }}>{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Roster table */}
            {filtered.length === 0 ? (
                <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 1rem' }}>{t('empty')}</p>
                    <button onClick={() => setShowInvite(true)} style={{ padding: '0.55rem 1.1rem', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '8px', color: '#c4b5fd', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
                        {t('invite')}
                    </button>
                </div>
            ) : (
                <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>

                    {/* Table header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr auto', gap: '1rem', padding: '0.65rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
                        {[t('col.student'), t('col.activity'), t('col.lastRoutine'), t('col.thisWeek'), ''].map((h, i) => (
                            <span key={i} style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</span>
                        ))}
                    </div>

                    {/* Rows */}
                    {filtered.map((s, i) => {
                        const name       = s.username ?? s.invite_email.split('@')[0];
                        const isPending  = s.status === 'pending';
                        const { color: actColor, label: actLabel } = activityColor(s.last_session);

                        return (
                            <div
                                key={s.id}
                                style={{
                                    display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr auto',
                                    gap: '1rem', padding: '0.9rem 1.25rem', alignItems: 'center',
                                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                {/* Student */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        <Avatar name={name} url={s.avatar_url} size={34} />
                                        {!isPending && (
                                            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '9px', height: '9px', borderRadius: '50%', background: actColor, border: '1.5px solid #0e0e0e' }} />
                                        )}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.invite_email}</p>
                                    </div>
                                    {isPending && (
                                        <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.07em', padding: '2px 6px', borderRadius: '4px', background: 'rgba(220,185,138,0.1)', color: 'var(--gold)', flexShrink: 0 }}>
                                            {t('status.pending')}
                                        </span>
                                    )}
                                </div>

                                {/* Activity */}
                                <div>
                                    {isPending ? (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>—</span>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <ActivityDot lastSession={s.last_session} />
                                                <span style={{ fontSize: '0.72rem', color: actColor, fontWeight: 600 }}>{t(`activity.${actLabel}`)}</span>
                                            </div>
                                            {s.last_session && (
                                                <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{formatRelative(s.last_session)}</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Last routine */}
                                <div>
                                    {isPending || !s.last_routine ? (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>—</span>
                                    ) : (
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.last_routine}</p>
                                    )}
                                </div>

                                {/* This week */}
                                <div>
                                    {isPending ? (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>—</span>
                                    ) : (
                                        <WeekBar sessions={s.sessions_this_week} minutes={s.minutes_this_week} />
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    {isPending ? (
                                        <button
                                            onClick={() => handleResendInvite(s)}
                                            title={t('actions.resend')}
                                            style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(220,185,138,0.08)', border: '1px solid rgba(220,185,138,0.15)', color: 'var(--gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,185,138,0.15)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,185,138,0.08)'}
                                        >
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.27"/></svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => s.student_id && router.push(`/${locale}/teacher/students/${s.student_id}`)}
                                            title={t('actions.stats')}
                                            style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', color: '#c4b5fd', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(167,139,250,0.15)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(167,139,250,0.08)'}
                                        >
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setRemoveTarget(s)}
                                        title={t('actions.remove')}
                                        style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.12)', color: '#e74c3c', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,76,60,0.14)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(231,76,60,0.06)'}
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showInvite  && <InviteModal onClose={() => setShowInvite(false)} onInvited={fetchStudents} />}
            {removeTarget && <RemoveConfirmModal student={removeTarget} onClose={() => setRemoveTarget(null)} onConfirm={() => handleRemove(removeTarget)} />}
        </div>
    );
}