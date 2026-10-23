"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { PageSpinner } from '@/components/ui/Spinner';
import { InviteStudentModal } from '@/components/teacher/InviteStudentModal';
import { StudentAvatar } from '@/components/teacher/StudentAvatar';
import styles from './page.module.css';
import ui from '@/components/ui/ui.module.css';

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
        <div className={styles.dot} style={{ background: color, boxShadow: `0 0 6px ${color}60` }} />
    );
}

function WeekBar({ sessions, minutes }: { sessions: number; minutes: number }) {
    // Visual bar: 7 day dots
    const days = Math.min(sessions, 7);
    return (
        <div className={styles.stack}>
            <div className={styles.row}>
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className={styles.block} style={{ background: i < days ? 'var(--gold)' : 'rgba(255,255,255,0.08)' }} />
                ))}
            </div>
            <span className={styles.label}>
                {sessions}d · {minutes}m
            </span>
        </div>
    );
}

function RemoveConfirmModal({ student, onConfirm, onClose }: { student: Student; onClose: () => void; onConfirm: () => Promise<void> }) {
    const t = useTranslations('TeacherStudents');
    const tShared = useTranslations('Teacher');
    const [loading, setLoading] = useState(false);
    const name = student.username ?? student.invite_email.split('@')[0];
    return (
        <div className={ui.overlay}>
            <div className={styles.titleBox}>
                <h3 className={styles.titleSubheading}>{t('remove.title')}</h3>
                <p className={styles.confirmText}>{t('remove.confirm', { name })}</p>
                <div className={styles.cancelRow}>
                    <button onClick={onClose} className={styles.cancelButton}>
                        {t('remove.cancel')}
                    </button>
                    <button onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); }} disabled={loading} className={styles.removingButton} style={{ opacity: loading ? 0.6 : 1 }}>
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
        <PageSpinner color="#c4b5fd" trackColor="rgba(167,139,250,0.15)" />
    );

    return (
        <div className={styles.labelStack}>

            {/* Header */}
            <div className={styles.labelRow}>
                <div>
                    <p className={ui.teacherEyebrow}>
                        {t('label')}
                    </p>
                    <h1 className={ui.teacherTitle}>
                        {t('title')}
                    </h1>
                </div>
                <button
                    onClick={() => setShowInvite(true)}
                    className={styles.inviteButton}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                    </svg>
                    {t('invite')}
                </button>
            </div>

            {/* Filter tabs */}
            <div className={styles.allRow}>
                {([
                    { key: 'all',     label: t('filter.all'),     count: students.length },
                    { key: 'active',  label: t('filter.active'),  count: activeCount },
                    { key: 'pending', label: t('filter.pending'), count: pendingCount },
                ] as const).map(tab => (
                    <button key={tab.key} onClick={() => setFilter(tab.key)} className={styles.button} style={{ background: filter === tab.key ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)', color: filter === tab.key ? '#c4b5fd' : 'var(--muted)' }}>
                        {tab.label}
                        <span className={styles.allRowLabel}>{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Roster table */}
            {filtered.length === 0 ? (
                <div className={styles.emptyBox}>
                    <p className={styles.emptyText}>{t('empty')}</p>
                    <button onClick={() => setShowInvite(true)} className={styles.inviteButton2}>
                        {t('invite')}
                    </button>
                </div>
            ) : (
                <div className={styles.studentBox}>

                    {/* Table header */}
                    <div className={styles.studentGrid}>
                        {[t('col.student'), t('col.activity'), t('col.lastRoutine'), t('col.thisWeek'), ''].map((h, i) => (
                            <span key={i} className={styles.studentGridLabel}>{h}</span>
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
                                className={styles.pendingGrid} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                            >
                                {/* Student */}
                                <div className={styles.pendingRow}>
                                    <div className={styles.pendingRowBlock}>
                                        <StudentAvatar name={name} url={s.avatar_url} size={34} />
                                        {!isPending && (
                                            <div className={styles.layer} style={{ background: actColor }} />
                                        )}
                                    </div>
                                    <div className={styles.block3}>
                                        <p className={styles.text}>{name}</p>
                                        <p className={styles.inviteEmailText}>{s.invite_email}</p>
                                    </div>
                                    {isPending && (
                                        <span className={styles.pendingLabel}>
                                            {t('status.pending')}
                                        </span>
                                    )}
                                </div>

                                {/* Activity */}
                                <div>
                                    {isPending ? (
                                        <span className={styles.pendingGridLabel}>—</span>
                                    ) : (
                                        <div className={styles.lastSessionStack}>
                                            <div className={styles.pendingGridRow}>
                                                <ActivityDot lastSession={s.last_session} />
                                                <span className={styles.pendingGridRowLabel} style={{ color: actColor }}>{t(`activity.${actLabel}`)}</span>
                                            </div>
                                            {s.last_session && (
                                                <span className={styles.lastSessionLabel}>{formatRelative(s.last_session)}</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Last routine */}
                                <div>
                                    {isPending || !s.last_routine ? (
                                        <span className={styles.pendingGridLabel}>—</span>
                                    ) : (
                                        <p className={styles.lastRoutineText}>{s.last_routine}</p>
                                    )}
                                </div>

                                {/* This week */}
                                <div>
                                    {isPending ? (
                                        <span className={styles.pendingGridLabel}>—</span>
                                    ) : (
                                        <WeekBar sessions={s.sessions_this_week} minutes={s.minutes_this_week} />
                                    )}
                                </div>

                                {/* Actions */}
                                <div className={styles.resendRow}>
                                    {isPending ? (
                                        <button
                                            onClick={() => handleResendInvite(s)}
                                            title={t('actions.resend')}
                                            className={styles.resendButton}
                                        >
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.27"/></svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => s.student_id && router.push(`/${locale}/teacher/students/${s.student_id}`)}
                                            title={t('actions.stats')}
                                            className={styles.statsButton}
                                        >
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setRemoveTarget(s)}
                                        title={t('actions.remove')}
                                        className={styles.removeButton}
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showInvite  && <InviteStudentModal onClose={() => setShowInvite(false)} onInvited={fetchStudents} />}
            {removeTarget && <RemoveConfirmModal student={removeTarget} onClose={() => setRemoveTarget(null)} onConfirm={() => handleRemove(removeTarget)} />}
        </div>
    );
}