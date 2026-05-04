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
}

interface Assignment {
    id: string;
    student_email: string;
    student_name: string | null;
    routine_title: string;
    assigned_at: string;
    due_date: string | null;
    status: 'active' | 'completed' | 'archived';
}

const STATUS_CONFIG: Record<StudentStatus, { label: string; color: string; bg: string }> = {
    active: { label: 'Active', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
    pending: { label: 'Pending', color: '#dcc18a', bg: 'rgba(220,185,138,0.1)' },
    suspended: { label: 'Paused', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)' },
};

function Avatar({ name, url, size = 36 }: { name: string; url: string | null; size?: number }) {
    const initials = name ? name.slice(0, 2).toUpperCase() : '??';
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            background: url ? 'transparent' : 'rgba(167,139,250,0.15)',
            border: '1px solid rgba(167,139,250,0.2)',
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            {url
                ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: size * 0.38, color: '#c4b5fd', letterSpacing: '0.03em' }}>{initials}</span>
            }
        </div>
    );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div style={{
            background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '10px', padding: '1.1rem 1.25rem',
        }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 0.35rem' }}>{label}</p>
            <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: 'var(--text)', margin: 0, lineHeight: 1 }}>{value}</p>
            {sub && <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: '0.3rem 0 0' }}>{sub}</p>}
        </div>
    );
}

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
    const t = useTranslations('TeacherDashboard');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInvite = async () => {
        if (!email.trim()) return;
        setLoading(true); setError('');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const normalizedEmail = email.trim().toLowerCase();

            if (user.email && normalizedEmail === user.email.toLowerCase()) {
                setError(t('invite.cannotInviteSelf')); 
                setLoading(false); 
                return;
            }

            // Check student limit
            const { count } = await supabase
                .from('teacher_students')
                .select('*', { count: 'exact', head: true })
                .eq('teacher_id', user.id)
                .in('status', ['active', 'pending']);

            const { data: profile } = await supabase
                .from('profiles')
                .select('subscription_tier')
                .eq('id', user.id)
                .single();

            const maxStudents = profile?.subscription_tier === 'lifetime' ? 999999 : 5;
            if ((count ?? 0) >= maxStudents) {
                setError(t('invite.limitReached'));
                setLoading(false); return;
            }

            // Check if already invited
            const { data: existing } = await supabase
                .from('teacher_students')
                .select('id')
                .eq('teacher_id', user.id)
                .eq('invite_email', email.trim().toLowerCase())
                .maybeSingle();

            if (existing) { setError(t('invite.alreadyInvited')); setLoading(false); return; }

            // Insert as pending — student_id resolved later when they accept
            const token = crypto.randomUUID();
            const { error: insertError } = await supabase
                .from('teacher_students')
                .insert({
                    teacher_id: user.id,
                    student_id: null,
                    invite_email: email.trim().toLowerCase(),
                    invite_token: token,
                    status: 'pending',
                });

            if (insertError) { setError(t('invite.error')); return; }

            onInvited();
            onClose();
        } catch {
            setError(t('invite.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: '1rem',
        }}>
            <div style={{
                background: 'var(--surface)', border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: '14px', padding: '1.75rem', width: '100%', maxWidth: '420px',
                fontFamily: 'DM Sans, sans-serif',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div>
                        <h3 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: '#c4b5fd', margin: '0 0 0.2rem', letterSpacing: '0.04em' }}>
                            {t('invite.title')}
                        </h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: 0 }}>{t('invite.subtitle')}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '2px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleInvite()}
                        placeholder={t('invite.emailPlaceholder')}
                        style={{
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px', padding: '0.65rem 0.85rem', color: 'var(--text)',
                            fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', outline: 'none', width: '100%',
                            boxSizing: 'border-box',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.4)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        autoFocus
                    />
                    {error && <p style={{ color: '#e74c3c', fontSize: '0.78rem', margin: 0 }}>{error}</p>}
                    <button
                        onClick={handleInvite}
                        disabled={loading || !email.trim()}
                        style={{
                            padding: '0.65rem', background: loading ? 'rgba(167,139,250,0.3)' : 'rgba(167,139,250,0.2)',
                            border: '1px solid rgba(167,139,250,0.35)', borderRadius: '8px',
                            color: '#c4b5fd', fontWeight: 700, fontSize: '0.875rem',
                            fontFamily: 'DM Sans, sans-serif', cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s', opacity: !email.trim() ? 0.5 : 1,
                        }}
                    >
                        {loading ? t('invite.sending') : t('invite.send')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function TeacherDashboardPage() {
    const t = useTranslations('TeacherDashboard');
    const router = useRouter();
    const locale = useLocale();

    const [userId, setUserId] = useState<string | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);

    const activeStudents = students.filter(s => s.status === 'active').length;
    const pendingStudents = students.filter(s => s.status === 'pending').length;
    const activeAssignments = assignments.filter(a => a.status === 'active').length;

    const practicedThisWeek = students.filter(s => {
        if (!s.last_session) return false;
        const diff = Date.now() - new Date(s.last_session).getTime();
        return diff < 7 * 24 * 60 * 60 * 1000;
    }).length;

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        // Fetch students with their profile data
        const { data: ts } = await supabase
            .from('teacher_students')
            .select(`
                id, invite_email, status, student_id,
                profiles:student_id ( username, avatar_url )
            `)
            .eq('teacher_id', user.id)
            .neq('status', 'removed')
            .order('created_at', { ascending: false });

        if (ts) {
            const pendingEmails = ts
                .filter(s => !s.student_id)
                .map(s => s.invite_email);

            // Look up pending students by email in profiles
            const { data: pendingProfiles } = pendingEmails.length > 0
                ? await supabase
                    .from('profiles')
                    .select('id, username, avatar_url, email')
                    .in('email', pendingEmails)
                : { data: [] };

            const pendingMap: Record<string, { username: string | null; avatar_url: string | null }> = {};
            (pendingProfiles ?? []).forEach(p => {
                if (p.email) pendingMap[p.email] = { username: p.username, avatar_url: p.avatar_url };
            });

            // Last sessions
            const studentIds = ts.filter(s => s.student_id).map(s => s.student_id as string);
            const { data: sessions } = studentIds.length > 0
                ? await supabase
                    .from('practice_sessions')
                    .select('user_id, started_at')
                    .in('user_id', studentIds)
                    .order('started_at', { ascending: false })
                : { data: [] };

            const lastSessionMap: Record<string, string> = {};
            (sessions ?? []).forEach(s => {
                if (!lastSessionMap[s.user_id]) lastSessionMap[s.user_id] = s.started_at;
            });

            setStudents(ts.map(s => {
                // Active student: use joined profile
                const activeProfile = s.student_id ? (s.profiles as any) : null;
                // Pending student: use email lookup
                const pendingProfile = !s.student_id ? pendingMap[s.invite_email] : null;

                return {
                    id: s.id,
                    invite_email: s.invite_email,
                    status: s.status as StudentStatus,
                    student_id: s.student_id,
                    username: activeProfile?.username ?? pendingProfile?.username ?? null,
                    avatar_url: activeProfile?.avatar_url ?? pendingProfile?.avatar_url ?? null,
                    last_session: s.student_id ? (lastSessionMap[s.student_id] ?? null) : null,
                };
            }));
        }

        // Fetch assignments with routine + student info
        const { data: sa } = await supabase
            .from('shared_assignments')
            .select(`
                id, assigned_at, due_date, status,
                routines:routine_id ( title ),
                teacher_students!inner ( invite_email, profiles:student_id ( username ) )
            `)
            .eq('teacher_id', user.id)
            .order('assigned_at', { ascending: false })
            .limit(10);

        if (sa) {
            setAssignments(sa.map(a => ({
                id: a.id,
                student_email: (a.teacher_students as any)?.invite_email ?? '—',
                student_name: (a.teacher_students as any)?.profiles?.username ?? null,
                routine_title: (a.routines as any)?.title ?? '—',
                assigned_at: a.assigned_at,
                due_date: a.due_date,
                status: a.status as 'active' | 'completed' | 'archived',
            })));
        }

        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

    const formatRelative = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const days = Math.floor(diff / 86400000);
        if (days === 0) return t('time.today');
        if (days === 1) return t('time.yesterday');
        return t('time.daysAgo', { days });
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
            <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                border: '2px solid rgba(167,139,250,0.15)', borderTopColor: '#c4b5fd',
                animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '1.75rem', fontFamily: 'DM Sans, sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
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
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.65rem 1.25rem',
                        background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)',
                        borderRadius: '8px', color: '#c4b5fd', fontWeight: 700, fontSize: '0.875rem',
                        fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(167,139,250,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(167,139,250,0.15)'}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    {t('inviteStudent')}
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                <StatCard label={t('stats.activeStudents')} value={activeStudents} sub={pendingStudents > 0 ? t('stats.pending', { count: pendingStudents }) : undefined} />
                <StatCard label={t('stats.practicedWeek')} value={practicedThisWeek} sub={t('stats.outOf', { total: activeStudents })} />
                <StatCard label={t('stats.assignments')} value={activeAssignments} sub={t('stats.active')} />
                <StatCard label={t('stats.totalStudents')} value={students.length} />
            </div>

            {/* Main split */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>

                {/* Students */}
                <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: 'var(--text)', margin: 0, letterSpacing: '0.04em' }}>
                            {t('students.title')}
                        </h2>
                        <button
                            onClick={() => router.push(`/${locale}/teacher/students`)}
                            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}
                        >
                            {t('seeAll')} →
                        </button>
                    </div>

                    {students.length === 0 ? (
                        <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 1rem' }}>{t('students.empty')}</p>
                            <button
                                onClick={() => setShowInvite(true)}
                                style={{
                                    padding: '0.5rem 1rem', background: 'rgba(167,139,250,0.12)',
                                    border: '1px solid rgba(167,139,250,0.25)', borderRadius: '7px',
                                    color: '#c4b5fd', fontSize: '0.8rem', fontWeight: 600,
                                    fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                                }}
                            >
                                {t('inviteStudent')}
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {students.slice(0, 6).map((s, i) => {
                                const name = s.username ?? s.invite_email.split('@')[0];
                                const sc = STATUS_CONFIG[s.status];
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => s.student_id && router.push(`/${locale}/teacher/students/${s.student_id}`)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.85rem',
                                            padding: '0.85rem 1.25rem',
                                            borderBottom: i < students.slice(0, 6).length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                            cursor: s.student_id ? 'pointer' : 'default',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => { if (s.student_id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <Avatar name={name} url={s.avatar_url} size={34} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {name}
                                            </p>
                                            {s.last_session && (
                                                <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: '1px 0 0' }}>
                                                    {formatRelative(s.last_session)}
                                                </p>
                                            )}
                                        </div>
                                        <span style={{
                                            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em',
                                            padding: '2px 7px', borderRadius: '5px',
                                            background: sc.bg, color: sc.color,
                                        }}>
                                            {sc.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Assignments */}
                <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: 'var(--text)', margin: 0, letterSpacing: '0.04em' }}>
                            {t('assignments.title')}
                        </h2>
                        <button
                            onClick={() => router.push(`/${locale}/teacher/assignments`)}
                            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}
                        >
                            {t('seeAll')} →
                        </button>
                    </div>

                    {assignments.length === 0 ? (
                        <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 1rem' }}>{t('assignments.empty')}</p>
                            <button
                                onClick={() => router.push(`/${locale}/teacher/assignments/new`)}
                                style={{
                                    padding: '0.5rem 1rem', background: 'rgba(220,185,138,0.1)',
                                    border: '1px solid rgba(220,185,138,0.2)', borderRadius: '7px',
                                    color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 600,
                                    fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                                }}
                            >
                                {t('assignments.create')}
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {assignments.slice(0, 6).map((a, i) => (
                                <div
                                    key={a.id}
                                    style={{
                                        padding: '0.85rem 1.25rem',
                                        borderBottom: i < assignments.slice(0, 6).length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                        display: 'flex', flexDirection: 'column', gap: '0.2rem',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                        <p style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                            {a.routine_title}
                                        </p>
                                        <span style={{
                                            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
                                            padding: '2px 7px', borderRadius: '5px', flexShrink: 0,
                                            background: a.status === 'completed' ? 'rgba(74,222,128,0.1)' : 'rgba(220,185,138,0.1)',
                                            color: a.status === 'completed' ? '#4ade80' : 'var(--gold)',
                                        }}>
                                            {a.status === 'completed' ? t('assignments.done') : t('assignments.active')}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: 0 }}>
                                            {a.student_name ?? a.student_email}
                                        </p>
                                        {a.due_date && (
                                            <>
                                                <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.65rem' }}>·</span>
                                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', margin: 0 }}>
                                                    {t('assignments.due')} {formatDate(a.due_date)}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showInvite && (
                <InviteModal
                    onClose={() => setShowInvite(false)}
                    onInvited={fetchData}
                />
            )}
        </div>
    );
}