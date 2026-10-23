"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAppEvent } from '@/hooks/useAppEvent';
import { APP_EVENTS } from '@/lib/events';
import { isAdminEmail } from '@/lib/admin';
import { TEACHER_MODE_ENABLED } from '@/lib/features';
import { SubscriptionTier } from '@/lib/constants';
import styles from './Navbar.module.css';

type Tier = SubscriptionTier;
type AppMode = 'student' | 'teacher';

const TIER_STYLES: Record<Tier, { label: string; bg: string; color: string; border: string }> = {
    free: { label: 'FREE', bg: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)' },
    pro: { label: 'PRO', bg: 'rgba(220,185,138,0.15)', color: 'var(--gold)', border: 'rgba(220,185,138,0.35)' },
    lifetime: { label: '∞', bg: 'var(--gold)', color: '#111', border: 'transparent' },
};

function TierBadge({ tier }: { tier: Tier }) {
    const s = TIER_STYLES[tier];
    return (
        <div className={styles.layer} style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
            {s.label}
        </div>
    );
}

function ModeSwitchToggle({ mode, onChange }: { mode: AppMode; onChange: (m: AppMode) => void }) {
    const t = useTranslations('Navbar');
    return (
        <div className={styles.modeStudentRow}>
            {(['student', 'teacher'] as AppMode[]).map((m) => {
                const isActive = mode === m;
                return (
                    <button
                        key={m}
                        onClick={() => onChange(m)}
                        className={styles.modeStudentButton} style={{ background: isActive
                                ? m === 'teacher' ? 'rgba(167,139,250,0.2)' : 'rgba(220,185,138,0.15)'
                                : 'transparent', color: isActive
                                ? m === 'teacher' ? '#c4b5fd' : 'var(--gold)'
                                : 'rgba(255,255,255,0.35)', boxShadow: isActive ? 'inset 0 0 0 1px rgba(255,255,255,0.06)' : 'none' }}
                    >
                        {m === 'student' ? t('modeStudent') : t('modeTeacher')}
                    </button>
                );
            })}
        </div>
    );
}

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const t = useTranslations('Navbar');

    const [email, setEmail] = useState<string>('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [tier, setTier] = useState<Tier>('free');
    const [isTeacher, setIsTeacher] = useState(false);
    const [appMode, setAppMode] = useState<AppMode>('student');
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isProOrLifetime = tier === 'pro' || tier === 'lifetime';

    const getUser = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (user.email) setEmail(user.email);

        const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url, subscription_tier')
            .eq('id', user.id)
            .single();

        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
        if (profile?.subscription_tier) setTier(profile.subscription_tier as Tier);

        // Only active teacher profiles show the toggle (and only while teacher mode is enabled)
        const { data: teacherProfile } = TEACHER_MODE_ENABLED
            ? await supabase
                .from('teacher_profiles')
                .select('id')
                .eq('id', user.id)
                .eq('is_active', true)
                .maybeSingle()
            : { data: null };

        if (teacherProfile) {
            setIsTeacher(true);
            const savedMode = localStorage.getItem('rr_app_mode') as AppMode | null;
            if (savedMode === 'teacher') setAppMode('teacher');
        } else {
            setIsTeacher(false);
            setAppMode('student');
            localStorage.setItem('rr_app_mode', 'student');
        }
    }, []);

    // Initial load
    useEffect(() => { getUser(); }, [getUser]);

    // Listen for teacher mode activation/deactivation from Profile page
    useAppEvent(APP_EVENTS.TEACHER_MODE_CHANGED, getUser);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleModeChange = (m: AppMode) => {
        setAppMode(m);
        localStorage.setItem('rr_app_mode', m);
        router.push(m === 'teacher' ? '/teacher/home' : '/home');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const studentLinks = [
        { name: t('links.home'), path: '/home', onboarding: 'navbarHome' },
        { name: t('links.library'), path: '/library', onboarding: 'navbarLibrary' },
        { name: t('links.routines'), path: '/routines', onboarding: 'navbarRoutines' },        
        { name: t('links.backingTracks'), path: '/backing-tracks', onboarding: 'navbarBackingTracks' },
        { name: t('links.explore'), path: '/explore', onboarding: 'navbarExplore' },
        { name: t('links.practice'), path: '/practice', onboarding: 'navbarPractice' },
        { name: t('links.stats'), path: '/stats', onboarding: 'navbarStats' },
    ];

    const teacherLinks = [
        { name: t('links.teacherDashboard'), path: '/teacher/home', onboarding: 'navbar-teacher-home' },
        { name: t('links.students'), path: '/teacher/students', onboarding: 'navbar-teacher-students' },
        { name: t('links.assignments'), path: '/teacher/assignments', onboarding: 'navbar-teacher-assignments' },       
        { name: t('links.calendar'), path: '/teacher/calendar', onboarding: 'navbar-teacher-calendar' },
    ];

    const navLinks = appMode === 'teacher' ? teacherLinks : studentLinks;
    const isDemo = email === 'demo@riffroutine.com';
    const locale = useLocale();

    return (
        <nav className={styles.activateTeacherNav} style={{ borderBottom: appMode === 'teacher'
                ? '1px solid rgba(167,139,250,0.2)'
                : '1px solid rgba(220,185,138,0.1)' }}>

            {/* ── Logo ── */}
            <Link href="/home" className={styles.rowLink}>
                <div className={styles.block}>
                    <Image src="/favicon.ico" alt="Logo" fill style={{ objectFit: 'contain' }} />
                </div>
                <div className={styles.rowLinkBlock}>
                    Riff<span className={styles.label}>Routine</span>
                </div>
            </Link>

            {/* ── Nav links ── */}
            <ul className={styles.list}>
                {navLinks.map((link) => {
                    const pathSegments = pathname.split('/');
                    const currentPathWithoutLocale = '/' + (pathSegments[2] || pathSegments[1] || '');
                    const isActive = currentPathWithoutLocale === link.path || pathname.includes(link.path);
                    return (
                        <li key={link.name}>
                            <Link data-onboarding={link.onboarding} href={link.path} className={styles.link} style={{ color: isActive ? 'var(--text, #f0e8dc)' : 'var(--muted, rgba(240,232,220,0.45))', fontWeight: isActive ? '600' : '500' }}>
                                {link.name}
                            </Link>
                        </li>
                    );
                })}
            </ul>

            {/* ── Right side ── */}
            <div className={styles.activateTeacherRow}>

                {/* Mode toggle — only when teacher profile is active */}
                {isProOrLifetime && isTeacher && (
                    <ModeSwitchToggle mode={appMode} onChange={handleModeChange} />
                )}

                {/* Activate teacher CTA — pro/lifetime but no active teacher profile */}
                {TEACHER_MODE_ENABLED && isProOrLifetime && !isTeacher && (
                    <Link
                        href="/profile#teacher"
                        className={styles.activateTeacherBox}
                    >
                        {t('activateTeacher')}
                    </Link>
                )}

                {/* ── Avatar + dropdown ── */}
                <div className={styles.profile} ref={dropdownRef}>
                    <div
                        onClick={() => setShowDropdown(!showDropdown)}
                        className={styles.row} style={{ background: avatarUrl ? 'transparent' : 'rgba(220,185,138,0.15)' }}
                    >
                        <div className={styles.dot}>
                            {avatarUrl ? (
                                <Image src={avatarUrl} alt="Avatar" fill style={{ objectFit: 'cover' }} />
                            ) : (
                                <div className={styles.profileRow}>
                                    {email ? email[0] : 'U'}
                                </div>
                            )}
                        </div>
                        <TierBadge tier={tier} />
                    </div>

                    {showDropdown && (
                        <div className={styles.profileStack}>
                            {/* User info + tier pill */}
                            <div className={styles.emailRow}>
                                <span className={styles.emailLabel}>
                                    {email}
                                </span>
                                <span className={styles.profileStackLabel} style={{ background: TIER_STYLES[tier].bg, color: TIER_STYLES[tier].color, border: `1px solid ${TIER_STYLES[tier].border}` }}>
                                    {tier === 'lifetime' ? 'LIFETIME' : tier.toUpperCase()}
                                </span>
                            </div>

                            {!isDemo && (
                                <Link
                                    href="/profile"
                                    onClick={() => setShowDropdown(false)}
                                    className={styles.profileLink}
                                >
                                    {t('profile')}
                                </Link>
                            )}

                            {tier === 'free' && (
                                <Link
                                    href="/pro"
                                    onClick={() => setShowDropdown(false)}
                                    className={styles.upgradeProRow}
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    {t('upgradePro')}
                                </Link>
                            )}

                            {/* Admin link: only when the panel is enabled for this environment */}
                            {isAdminEmail(email) && (
                                <Link
                                    href={`/${locale}/admin`}
                                    onClick={() => setShowDropdown(false)}
                                    className={styles.profileRowLink}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    Admin Panel
                                </Link>
                            )}

                            <div className={styles.box} />

                            <button
                                onClick={handleLogout}
                                className={styles.logoutButton}
                            >
                                {t('logout')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}