"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { PageSpinner } from '@/components/ui/Spinner';
import { InviteStudentModal } from '@/components/teacher/InviteStudentModal';
import { StudentAvatar } from '@/components/teacher/StudentAvatar';
import styles from './page.module.css';
import { cx } from '@/lib/cx';
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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className={styles.box}>
            <p className={styles.text}>{label}</p>
            <p className={styles.text2}>{value}</p>
            {sub && <p className={styles.text3}>{sub}</p>}
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
                    className={styles.inviteStudentButton}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    {t('inviteStudent')}
                </button>
            </div>

            {/* Stats */}
            <div className={styles.activeStudentsGrid}>
                <StatCard label={t('stats.activeStudents')} value={activeStudents} sub={pendingStudents > 0 ? t('stats.pending', { count: pendingStudents }) : undefined} />
                <StatCard label={t('stats.practicedWeek')} value={practicedThisWeek} sub={t('stats.outOf', { total: activeStudents })} />
                <StatCard label={t('stats.assignments')} value={activeAssignments} sub={t('stats.active')} />
                <StatCard label={t('stats.totalStudents')} value={students.length} />
            </div>

            {/* Main split */}
            <div className={styles.titleGrid}>

                {/* Students */}
                <div className={styles.titleBox}>
                    <div className={styles.titleRow}>
                        <h2 className={styles.titleHeading}>
                            {t('students.title')}
                        </h2>
                        <button
                            onClick={() => router.push(`/${locale}/teacher/students`)}
                            className={styles.seeAllButton}
                        >
                            {t('seeAll')} →
                        </button>
                    </div>

                    {students.length === 0 ? (
                        <div className={styles.empty}>
                            <p className={styles.emptyText}>{t('students.empty')}</p>
                            <button
                                onClick={() => setShowInvite(true)}
                                className={styles.inviteStudentButton2}
                            >
                                {t('inviteStudent')}
                            </button>
                        </div>
                    ) : (
                        <div className={styles.stack}>
                            {students.slice(0, 6).map((s) => {
                                const name = s.username ?? s.invite_email.split('@')[0];
                                const sc = STATUS_CONFIG[s.status];
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => s.student_id && router.push(`/${locale}/teacher/students/${s.student_id}`)}
                                        className={cx(styles.row, styles.studentRow, s.student_id && styles.linked)}
                                    >
                                        <StudentAvatar name={name} url={s.avatar_url} size={34} />
                                        <div className={styles.block}>
                                            <p className={styles.titleBoxText}>
                                                {name}
                                            </p>
                                            {s.last_session && (
                                                <p className={styles.lastSessionText}>
                                                    {formatRelative(s.last_session)}
                                                </p>
                                            )}
                                        </div>
                                        <span className={styles.label} style={{ background: sc.bg, color: sc.color }}>
                                            {sc.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Assignments */}
                <div className={styles.titleBox}>
                    <div className={styles.titleRow}>
                        <h2 className={styles.titleHeading}>
                            {t('assignments.title')}
                        </h2>
                        <button
                            onClick={() => router.push(`/${locale}/teacher/assignments`)}
                            className={styles.seeAllButton}
                        >
                            {t('seeAll')} →
                        </button>
                    </div>

                    {assignments.length === 0 ? (
                        <div className={styles.empty}>
                            <p className={styles.emptyText}>{t('assignments.empty')}</p>
                            <button
                                onClick={() => router.push(`/${locale}/teacher/assignments/new`)}
                                className={styles.createButton}
                            >
                                {t('assignments.create')}
                            </button>
                        </div>
                    ) : (
                        <div className={styles.stack}>
                            {assignments.slice(0, 6).map((a, i) => (
                                <div
                                    key={a.id}
                                    className={styles.doneStack} style={{ borderBottom: i < assignments.slice(0, 6).length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                                >
                                    <div className={styles.doneRow}>
                                        <p className={styles.routineTitleText}>
                                            {a.routine_title}
                                        </p>
                                        <span className={styles.doneLabel} style={{ background: a.status === 'completed' ? 'rgba(74,222,128,0.1)' : 'rgba(220,185,138,0.1)', color: a.status === 'completed' ? '#4ade80' : 'var(--gold)' }}>
                                            {a.status === 'completed' ? t('assignments.done') : t('assignments.active')}
                                        </span>
                                    </div>
                                    <div className={styles.dueRow}>
                                        <p className={styles.dueRowText}>
                                            {a.student_name ?? a.student_email}
                                        </p>
                                        {a.due_date && (
                                            <>
                                                <span className={styles.dueRowLabel}>·</span>
                                                <p className={styles.dueText}>
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
                <InviteStudentModal
                    onClose={() => setShowInvite(false)}
                    onInvited={fetchData}
                />
            )}
        </div>
    );
}