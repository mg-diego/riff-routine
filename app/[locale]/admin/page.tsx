"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { PageSpinner } from '@/components/ui/Spinner';
import { isAdminEmail } from '@/lib/admin';
import styles from './page.module.css';

interface UserRow {
    id:                string;
    email:             string | null;
    username:          string | null;
    avatar_url:        string | null;
    subscription_tier: string | null;
    created_at:        string;
    is_demo:           boolean;
    language:          string | null;
    premium_until:     string | null;
    last_session:      string | null;
    session_count:     number;
}

interface Stats {
    totalUsers:        number;
    proUsers:          number;
    lifetimeUsers:     number;
    freeUsers:         number;
    demoUsers:         number;
    totalExercises:    number;
    userExercises:     number;
    totalSessions:     number;
    sessionsThisWeek:  number;
    totalRoutines:     number;
    avgSessionMinutes: number;
    activeThisWeek:    number;
}

const TIER_STYLES: Record<string, { bg: string; color: string }> = {
    free:     { bg: 'rgba(255,255,255,0.06)',  color: 'rgba(255,255,255,0.4)' },
    pro:      { bg: 'rgba(220,185,138,0.12)',  color: '#dcc18a' },
    lifetime: { bg: 'rgba(220,185,138,0.9)',   color: '#111' },
};

function StatCard({ label, value, sub, color = 'var(--text)' }: { label: string; value: string | number; sub?: string; color?: string }) {
    return (
        <div className={styles.box}>
            <p className={styles.text}>{label}</p>
            <p className={styles.text2} style={{ color }}>{value}</p>
            {sub && <p className={styles.text3}>{sub}</p>}
        </div>
    );
}

function TierPill({ tier }: { tier: string | null }) {
    const s = TIER_STYLES[tier ?? 'free'] ?? TIER_STYLES.free;
    return (
        <span className={styles.label} style={{ background: s.bg, color: s.color }}>
            {tier === 'lifetime' ? '∞ LIFE' : (tier ?? 'free').toUpperCase()}
        </span>
    );
}

function formatRelative(iso: string | null) {
    if (!iso) return '—';
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

export default function AdminDashboard() {
    const router  = useRouter();
    const locale  = useLocale();
    const [stats,   setStats]   = useState<Stats | null>(null);
    const [users,   setUsers]   = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search,  setSearch]  = useState('');
    const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'pro' | 'lifetime'>('all');
    const [sortBy,  setSortBy]  = useState<'created_at' | 'last_session' | 'session_count'>('created_at');

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !isAdminEmail(user.email)) { router.replace('/'); return; }

            const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

            const [
                profilesRes,
                exercisesRes,
                userExercisesRes,
                sessionsRes,
                weekSessionsRes,
                routinesRes,
                sessionDurRes,
                weekActiveRes,
            ] = await Promise.all([
                supabase.from('profiles').select('id, email, username, avatar_url, subscription_tier, created_at, is_demo, language, premium_until'),
                supabase.from('exercises').select('*', { count: 'exact', head: true }),
                supabase.from('exercises').select('*', { count: 'exact', head: true }).not('is_system', 'is', false),
                supabase.from('practice_sessions').select('*', { count: 'exact', head: true }),
                supabase.from('practice_sessions').select('*', { count: 'exact', head: true }).gte('started_at', weekAgo),
                supabase.from('routines').select('*', { count: 'exact', head: true }),
                supabase.from('practice_sessions').select('total_duration_seconds').not('total_duration_seconds', 'is', null),
                supabase.from('practice_sessions').select('user_id').gte('started_at', weekAgo),
            ]);

            // Per-user session stats
            const { data: userSessions } = await supabase
                .from('practice_sessions')
                .select('user_id, started_at')
                .order('started_at', { ascending: false });

            const lastSessionMap:  Record<string, string> = {};
            const sessionCountMap: Record<string, number> = {};
            (userSessions ?? []).forEach(s => {
                if (!lastSessionMap[s.user_id]) lastSessionMap[s.user_id] = s.started_at;
                sessionCountMap[s.user_id] = (sessionCountMap[s.user_id] ?? 0) + 1;
            });

            // Active users this week
            const activeThisWeek = new Set((weekActiveRes.data ?? []).map((s: any) => s.user_id)).size;

            // Avg session duration
            const durations = (sessionDurRes.data ?? []).map((s: any) => s.total_duration_seconds).filter(Boolean);
            const avgSecs   = durations.length > 0 ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length : 0;

            const profiles = profilesRes.data ?? [];

            setStats({
                totalUsers:        profiles.length,
                proUsers:          profiles.filter(p => p.subscription_tier === 'pro').length,
                lifetimeUsers:     profiles.filter(p => p.subscription_tier === 'lifetime').length,
                freeUsers:         profiles.filter(p => p.subscription_tier === 'free' && !p.is_demo).length,
                demoUsers:         profiles.filter(p => p.is_demo).length,
                totalExercises:    exercisesRes.count ?? 0,
                userExercises:     userExercisesRes.count ?? 0,
                totalSessions:     sessionsRes.count ?? 0,
                sessionsThisWeek:  weekSessionsRes.count ?? 0,
                totalRoutines:     routinesRes.count ?? 0,
                avgSessionMinutes: Math.round(avgSecs / 60),
                activeThisWeek,
            });

            setUsers(profiles.map(p => ({
                ...p,
                last_session:  lastSessionMap[p.id]  ?? null,
                session_count: sessionCountMap[p.id] ?? 0,
            })));

            setLoading(false);
        };
        init();
    }, [router]);

    const filteredUsers = users
        .filter(u => {
            const matchSearch = !search ||
                u.email?.toLowerCase().includes(search.toLowerCase()) ||
                u.username?.toLowerCase().includes(search.toLowerCase());
            const matchTier = tierFilter === 'all' || u.subscription_tier === tierFilter;
            return matchSearch && matchTier;
        })
        .sort((a, b) => {
            if (sortBy === 'last_session') {
                if (!a.last_session) return 1;
                if (!b.last_session) return -1;
                return new Date(b.last_session).getTime() - new Date(a.last_session).getTime();
            }
            if (sortBy === 'session_count') return b.session_count - a.session_count;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

    if (loading) return (
        <PageSpinner minHeight="60vh" color="#a855f7" trackColor="rgba(168,85,247,0.2)" />
    );

    if (!stats) return null;

    return (
        <div className={styles.stack}>

            {/* Header */}
            <div>
                <p className={styles.text4}>Internal</p>
                <h1 className={styles.title}>Admin Overview</h1>
            </div>

            {/* Users stats */}
            <div>
                <p className={styles.text5}>Users</p>
                <div className={styles.grid}>
                    <StatCard label="Total"        value={stats.totalUsers}    color="#a855f7" />
                    <StatCard label="Free"         value={stats.freeUsers}     color="rgba(255,255,255,0.5)" sub={`${Math.round(stats.freeUsers / stats.totalUsers * 100)}%`} />
                    <StatCard label="PRO"          value={stats.proUsers}      color="var(--gold)" sub={`${Math.round(stats.proUsers / stats.totalUsers * 100)}%`} />
                    <StatCard label="Lifetime"     value={stats.lifetimeUsers} color="#dcc18a" sub={`${Math.round(stats.lifetimeUsers / stats.totalUsers * 100)}%`} />
                    <StatCard label="Active / wk"  value={stats.activeThisWeek} color="#4ade80" sub={`${Math.round(stats.activeThisWeek / stats.totalUsers * 100)}% of users`} />
                    <StatCard label="Demo"         value={stats.demoUsers}     color="rgba(255,255,255,0.3)" />
                </div>
            </div>

            {/* Activity stats */}
            <div>
                <p className={styles.text5}>Activity</p>
                <div className={styles.grid}>
                    <StatCard label="Sessions"      value={stats.totalSessions.toLocaleString()} color="#60a5fa" />
                    <StatCard label="This week"     value={stats.sessionsThisWeek}               color="#60a5fa" sub="sessions" />
                    <StatCard label="Avg duration"  value={`${stats.avgSessionMinutes}m`}        color="#60a5fa" sub="per session" />
                    <StatCard label="Routines"      value={stats.totalRoutines.toLocaleString()}  color="#f472b6" />
                    <StatCard label="Exercises"     value={stats.totalExercises.toLocaleString()} color="var(--gold)" />
                    <StatCard label="User content"  value={stats.userExercises.toLocaleString()}  color="var(--gold)" sub="user-created" />
                </div>
            </div>

            {/* Users table */}
            <div className={styles.box2}>
                {/* Table controls */}
                <div className={styles.row}>
                    <h2 className={styles.heading}>
                        Users <span className={styles.label2}>{filteredUsers.length}</span>
                    </h2>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search email or username..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className={styles.input}
                    />

                    {/* Tier filter */}
                    <div className={styles.row2}>
                        {(['all', 'free', 'pro', 'lifetime'] as const).map(t => (
                            <button key={t} onClick={() => setTierFilter(t)} className={styles.button} style={{ background: tierFilter === t ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.04)', color: tierFilter === t ? '#a855f7' : 'var(--muted)' }}>
                                {t.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className={styles.select}>
                        <option value="created_at">Sort: Newest</option>
                        <option value="last_session">Sort: Last active</option>
                        <option value="session_count">Sort: Most sessions</option>
                    </select>
                </div>

                {/* Column headers */}
                <div className={styles.grid2}>
                    {['User', 'Tier', 'Joined', 'Last active', 'Sessions', 'Lang'].map(h => (
                        <span key={h} className={styles.label3}>{h}</span>
                    ))}
                </div>

                {/* Rows */}
                <div className={styles.block}>
                    {filteredUsers.map((u, i) => {
                        const name    = u.username ?? u.email?.split('@')[0] ?? 'Unknown';
                        const isDemo  = u.is_demo;
                        const activity = u.last_session
                            ? (Date.now() - new Date(u.last_session).getTime()) / 86400000
                            : null;
                        const actColor = activity === null ? 'rgba(255,255,255,0.15)'
                            : activity < 2  ? '#4ade80'
                            : activity < 7  ? '#facc15'
                            : '#f87171';

                        return (
                            <div key={u.id} onClick={() => router.push(`/${locale}/admin/users/${u.id}`)} className={styles.grid3} style={{ borderBottom: i < filteredUsers.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                            >
                                {/* User */}
                                <div className={styles.row3}>
                                    <div className={styles.row4} style={{ background: u.avatar_url ? 'transparent' : 'rgba(168,85,247,0.12)' }}>
                                        {u.avatar_url
                                            ? <img src={u.avatar_url} alt={name} className={styles.image} />
                                            : <span className={styles.label4}>{name.slice(0, 2).toUpperCase()}</span>
                                        }
                                    </div>
                                    <div className={styles.block2}>
                                        <p className={styles.text6} style={{ color: isDemo ? 'var(--muted)' : 'var(--text)' }}>
                                            {name} {isDemo && <span className={styles.label5}>demo</span>}
                                        </p>
                                        <p className={styles.emailText}>{u.email}</p>
                                    </div>
                                </div>

                                {/* Tier */}
                                <div><TierPill tier={u.subscription_tier} /></div>

                                {/* Joined */}
                                <span className={styles.createdAtLabel}>{formatDate(u.created_at)}</span>

                                {/* Last active */}
                                <div className={styles.lastSessionRow}>
                                    <div className={styles.dot} style={{ background: actColor }} />
                                    <span className={styles.createdAtLabel}>{formatRelative(u.last_session)}</span>
                                </div>

                                {/* Sessions */}
                                <span className={styles.sessionCountLabel} style={{ color: u.session_count > 0 ? 'var(--text)' : 'var(--muted)' }}>
                                    {u.session_count}
                                </span>

                                {/* Lang */}
                                <span className={styles.label8}>{u.language ?? '—'}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}