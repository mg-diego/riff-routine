"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PageSpinner } from '@/components/ui/Spinner';
import { isAdminEmail } from '@/lib/admin';
import React from 'react';
import styles from './page.module.css';



interface UserProfile {
    id: string;
    email: string | null;
    username: string | null;
    avatar_url: string | null;
    subscription_tier: string | null;
    created_at: string;
    is_demo: boolean;
    language: string | null;
    premium_until: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    lefty_mode: boolean;
    default_view: string | null;
}

interface Session {
    id: string;
    started_at: string;
    ended_at: string | null;
    total_duration_seconds: number | null;
    routine_title: string | null;
}

interface Routine {
    id: string;
    title: string;
    created_at: string;
    exercise_count: number;
}

interface Exercise {
    id: string;
    title: string;
    technique: string | null;
    created_at: string;
    has_file: boolean;
    bpm_goal: number | null;
    difficulty: number | null;
}

interface StorageFile {
    name: string;
    size: number;
    created_at: string | null;
}

interface StorageStats {
    files: StorageFile[];
    totalBytes: number;
    fileCount: number;
}

const TIER_STYLES: Record<string, { bg: string; color: string }> = {
    free: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' },
    pro: { bg: 'rgba(220,185,138,0.12)', color: '#dcc18a' },
    lifetime: { bg: 'rgba(220,185,138,0.9)', color: '#111' },
};

function TierPill({ tier }: { tier: string | null }) {
    const s = TIER_STYLES[tier ?? 'free'] ?? TIER_STYLES.free;
    return (
        <span className={styles.label} style={{ background: s.bg, color: s.color }}>
            {tier === 'lifetime' ? '∞ LIFETIME' : (tier ?? 'free').toUpperCase()}
        </span>
    );
}

function SectionCard({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
    return (
        <div className={styles.box} style={{ border: `1px solid ${accent ? accent + '20' : 'rgba(255,255,255,0.05)'}` }}>
            <div className={styles.block}>
                <h2 className={styles.heading} style={{ color: accent ?? 'var(--text)' }}>{title}</h2>
            </div>
            <div className={styles.block2}>
                {children}
            </div>
        </div>
    );
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDuration(secs: number | null) {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const DIFF_COLORS: Record<number, string> = { 1: '#4ade80', 2: '#a3e635', 3: '#facc15', 4: '#fb923c', 5: '#f87171' };

export default function AdminUserDetail() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [storage, setStorage] = useState<StorageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionPage, setSessionPage] = useState(0);
    const SESSION_PAGE_SIZE = 10;

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !isAdminEmail(user.email)) { router.replace('/'); return; }

            const [profileRes, sessionsRes, routinesRes, exercisesRes] = await Promise.all([
                supabase.from('profiles')
                    .select('id, email, username, avatar_url, subscription_tier, created_at, is_demo, language, premium_until, stripe_customer_id, stripe_subscription_id, lefty_mode, default_view')
                    .eq('id', userId)
                    .single(),

                supabase.from('practice_sessions')
                    .select('id, started_at, ended_at, total_duration_seconds, routines:routine_id(title)')
                    .eq('user_id', userId)
                    .order('started_at', { ascending: false })
                    .limit(100),

                supabase.from('routines')
                    .select('id, title, created_at, routine_exercises(id)')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false }),

                supabase.from('exercises')
                    .select('id, title, technique, created_at, file_url, bpm_goal, difficulty')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false }),
            ]);

            if (profileRes.data) setProfile(profileRes.data as UserProfile);

            setSessions((sessionsRes.data ?? []).map((s: any) => ({
                id: s.id,
                started_at: s.started_at,
                ended_at: s.ended_at,
                total_duration_seconds: s.total_duration_seconds,
                routine_title: Array.isArray(s.routines) ? s.routines[0]?.title : s.routines?.title ?? null,
            })));

            setRoutines((routinesRes.data ?? []).map((r: any) => ({
                id: r.id,
                title: r.title,
                created_at: r.created_at,
                exercise_count: Array.isArray(r.routine_exercises) ? r.routine_exercises.length : 0,
            })));

            setExercises((exercisesRes.data ?? []).map((e: any) => ({
                id: e.id,
                title: e.title,
                technique: e.technique,
                created_at: e.created_at,
                has_file: !!e.file_url,
                bpm_goal: e.bpm_goal,
                difficulty: e.difficulty,
            })));

            // Storage — list files in avatars bucket for this user
            const [avatarFiles, guitarFiles] = await Promise.all([
                supabase.storage.from('avatars').list(userId, { limit: 100 }),
                supabase.storage.from('guitar_tabs').list(userId, { limit: 100 }),
            ]);

            // List exercise files (if stored per user path)
            const { data: exerciseFiles } = await supabase.storage
                .from('exercises')
                .list(userId, { limit: 100 });

            const allFiles: StorageFile[] = [
                ...(avatarFiles.data ?? []).map(f => ({
                    name: `avatars/${f.name}`,
                    size: f.metadata?.size ?? 0,
                    created_at: f.created_at ?? null,
                })),
                ...(guitarFiles.data ?? []).map(g => ({
                    name: `guitar_tabs/${g.name}`,
                    size: g.metadata?.size ?? 0,
                    created_at: g.created_at ?? null,
                })),
            ];

            setStorage({
                files: allFiles,
                totalBytes: allFiles.reduce((a, f) => a + f.size, 0),
                fileCount: allFiles.length,
            });

            setLoading(false);
        };
        init();
    }, [userId, router]);

    if (loading) return (
        <PageSpinner minHeight="60vh" color="#a855f7" trackColor="rgba(168,85,247,0.2)" />
    );

    if (!profile) return (
        <div className={styles.block3}>User not found.</div>
    );

    const name = profile.username ?? profile.email?.split('@')[0] ?? 'Unknown';
    const totalMinutes = sessions.reduce((a, s) => a + Math.round((s.total_duration_seconds ?? 0) / 60), 0);
    const avgMinutes = sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0;
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const sessionsWeek = sessions.filter(s => new Date(s.started_at) > weekAgo).length;
    const paginatedSessions = sessions.slice(sessionPage * SESSION_PAGE_SIZE, (sessionPage + 1) * SESSION_PAGE_SIZE);
    const totalSessionPages = Math.ceil(sessions.length / SESSION_PAGE_SIZE);

    return (
        <div className={styles.stack}>

            {/* Back */}
            <button onClick={() => router.back()} className={styles.button}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                Back to admin
            </button>

            {/* Profile header */}
            <div className={styles.row}>
                <div className={styles.row2} style={{ background: profile.avatar_url ? 'transparent' : 'rgba(168,85,247,0.12)' }}>
                    {profile.avatar_url
                        ? <img src={profile.avatar_url} alt={name} className={styles.image} />
                        : <span className={styles.label2}>{name.slice(0, 2).toUpperCase()}</span>
                    }
                </div>
                <div className={styles.block4}>
                    <div className={styles.row3}>
                        <h1 className={styles.title}>{name}</h1>
                        <TierPill tier={profile.subscription_tier} />
                        {profile.is_demo && <span className={styles.label3}>DEMO</span>}
                    </div>
                    <p className={styles.text}>{profile.email}</p>
                    <p className={styles.text2}>
                        ID: <span className={styles.label4}>{profile.id}</span>
                    </p>
                </div>

                {/* Quick stats */}
                <div className={styles.row4}>
                    {[
                        { label: 'Joined', value: formatDate(profile.created_at) },
                        { label: 'Sessions', value: sessions.length },
                        { label: 'This week', value: sessionsWeek },
                        { label: 'Avg dur', value: `${avgMinutes}m` },
                        { label: 'Language', value: (profile.language ?? '—').toUpperCase() },
                    ].map(({ label, value }) => (
                        <div key={label} className={styles.stack2}>
                            <span className={styles.label5}>{label}</span>
                            <span className={styles.label6}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2-col grid */}
            <div className={styles.grid}>

                {/* Stripe */}
                <SectionCard title="Stripe" accent="#60a5fa">
                    <div className={styles.stack3}>
                        {[
                            { label: 'Customer ID', value: profile.stripe_customer_id },
                            { label: 'Subscription ID', value: profile.stripe_subscription_id },
                            { label: 'Premium until', value: profile.premium_until ? formatDate(profile.premium_until) : null },
                        ].map(({ label, value }) => (
                            <div key={label} className={styles.row5}>
                                <span className={styles.label7}>{label}</span>
                                <span className={styles.label8} style={{ color: value ? 'var(--text)' : 'rgba(255,255,255,0.2)', fontFamily: value?.startsWith('cus_') || value?.startsWith('sub_') ? 'monospace' : 'inherit' }}>
                                    {value ?? '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* Preferences */}
                <SectionCard title="Preferences" accent="#a855f7">
                    <div className={styles.stack3}>
                        {[
                            { label: 'Lefty mode', value: profile.lefty_mode ? 'Yes' : 'No' },
                            { label: 'Default view', value: profile.default_view ?? '—' },
                            { label: 'Language', value: profile.language?.toUpperCase() ?? '—' },
                            { label: 'Onboarding', value: 'N/A' },
                        ].map(({ label, value }) => (
                            <div key={label} className={styles.row5}>
                                <span className={styles.label7}>{label}</span>
                                <span className={styles.label9}>{value}</span>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* Storage */}
                <SectionCard title={`Storage · ${storage ? formatBytes(storage.totalBytes) : '…'} · ${storage?.fileCount ?? 0} files`} accent="#34d399">
                    {storage && storage.files.length > 0 ? (
                        <div className={styles.stack4}>
                            {storage.files.map((f, i) => (
                                <div key={i} className={styles.row6}>
                                    <span className={styles.label10}>{f.name}</span>
                                    <span className={styles.sizeLabel}>{formatBytes(f.size)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={styles.text3}>No files found in storage.</p>
                    )}
                </SectionCard>

                {/* Routines */}
                <SectionCard title={`Routines · ${routines.length}`} accent="#f472b6">
                    {routines.length === 0
                        ? <p className={styles.text3}>No routines.</p>
                        : (
                            <div className={styles.stack4}>
                                {routines.map(r => (
                                    <div key={r.id} className={styles.row7}>
                                        <span className={styles.label12}>{r.title}</span>
                                        <div className={styles.exerciseCountRow}>
                                            <span className={styles.exerciseCountLabel}>{r.exercise_count} ex</span>
                                            <span className={styles.exerciseCountLabel}>{formatDate(r.created_at)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    }
                </SectionCard>
            </div>

            {/* Exercises */}
            <SectionCard title={`Exercises · ${exercises.length}`} accent="var(--gold)">
                {exercises.length === 0
                    ? <p className={styles.text3}>No exercises created.</p>
                    : (
                        <div className={styles.grid2}>
                            {['Title', 'Technique', 'BPM Goal', 'Difficulty', 'File'].map(h => (
                                <span key={h} className={styles.label14}>{h}</span>
                            ))}
                            {exercises.map(e => (
                                <React.Fragment key={e.id}>
                                    <span key={`${e.id}-t`} className={styles.label15}>{e.title}</span>
                                    <span key={`${e.id}-te`} className={styles.label16}>{e.technique ?? '—'}</span>
                                    <span key={`${e.id}-b`} className={styles.label17} style={{ color: e.bpm_goal ? 'var(--gold)' : 'var(--muted)' }}>{e.bpm_goal ?? '—'}</span>
                                    <span key={`${e.id}-d`} className={styles.label17} style={{ color: e.difficulty ? DIFF_COLORS[e.difficulty] : 'var(--muted)' }}>{e.difficulty ? '★'.repeat(e.difficulty) : '—'}</span>
                                    <span key={`${e.id}-f`} className={styles.label18} style={{ color: e.has_file ? '#4ade80' : 'rgba(255,255,255,0.2)' }}>{e.has_file ? '✓ GP' : '—'}</span>
                                </React.Fragment>
                            ))}
                        </div>
                    )
                }
            </SectionCard>

            {/* Sessions */}
            <SectionCard title={`Sessions · ${sessions.length} total · ${totalMinutes}m practiced`} accent="#60a5fa">
                {sessions.length === 0
                    ? <p className={styles.text3}>No sessions yet.</p>
                    : (
                        <>
                            <div className={styles.grid3}>
                                {['Date', 'Routine', 'Duration', 'Ended'].map(h => (
                                    <span key={h} className={styles.label14}>{h}</span>
                                ))}
                                {paginatedSessions.map(s => (
                                    <React.Fragment key={s.id}>
                                        <span key={`${s.id}-d`} className={styles.startedAtLabel}>{formatDate(s.started_at)}</span>
                                        <span key={`${s.id}-r`} className={styles.label20} style={{ color: s.routine_title ? 'var(--text)' : 'rgba(255,255,255,0.25)' }}>{s.routine_title ?? 'Free practice'}</span>
                                        <span key={`${s.id}-dur`} className={styles.totalDurationSecondsLabel} style={{ color: s.total_duration_seconds ? 'var(--text)' : 'var(--muted)' }}>{formatDuration(s.total_duration_seconds)}</span>
                                        <span key={`${s.id}-e`} className={styles.label18} style={{ color: s.ended_at ? '#4ade80' : '#f87171' }}>{s.ended_at ? '✓' : '—'}</span>
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalSessionPages > 1 && (
                                <div className={styles.totalSessionPagesRow}>
                                    <span className={styles.totalSessionPagesLabel}>
                                        {sessionPage + 1} / {totalSessionPages}
                                    </span>
                                    <button onClick={() => setSessionPage(p => Math.max(0, p - 1))} disabled={sessionPage === 0} className={styles.totalSessionPagesRowButton} style={{ opacity: sessionPage === 0 ? 0.3 : 1 }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                    </button>
                                    <button onClick={() => setSessionPage(p => Math.min(totalSessionPages - 1, p + 1))} disabled={sessionPage === totalSessionPages - 1} className={styles.totalSessionPagesRowButton} style={{ opacity: sessionPage === totalSessionPages - 1 ? 0.3 : 1 }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                    </button>
                                </div>
                            )}
                        </>
                    )
                }
            </SectionCard>
        </div>
    );
}