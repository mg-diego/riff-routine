"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type Tier = 'free' | 'pro' | 'lifetime';
type AppMode = 'student' | 'teacher';

const TIER_STYLES: Record<Tier, { label: string; bg: string; color: string; border: string }> = {
    free: { label: 'FREE', bg: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)' },
    pro: { label: 'PRO', bg: 'rgba(220,185,138,0.15)', color: 'var(--gold)', border: 'rgba(220,185,138,0.35)' },
    lifetime: { label: '∞', bg: 'var(--gold)', color: '#111', border: 'transparent' },
};

function TierBadge({ tier }: { tier: Tier }) {
    const s = TIER_STYLES[tier];
    return (
        <div style={{
            position: 'absolute', bottom: '-4px', right: '-6px',
            background: s.bg, color: s.color,
            border: `1px solid ${s.border}`,
            fontSize: '0.48rem', fontWeight: 800,
            letterSpacing: '0.06em', lineHeight: 1,
            padding: '2px 4px', borderRadius: '4px',
            fontFamily: 'DM Sans, sans-serif',
            pointerEvents: 'none', whiteSpace: 'nowrap',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}>
            {s.label}
        </div>
    );
}

function ModeSwitchToggle({ mode, onChange }: { mode: AppMode; onChange: (m: AppMode) => void }) {
    const t = useTranslations('Navbar');
    return (
        <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', padding: '3px', gap: '2px',
        }}>
            {(['student', 'teacher'] as AppMode[]).map((m) => {
                const isActive = mode === m;
                return (
                    <button
                        key={m}
                        onClick={() => onChange(m)}
                        style={{
                            padding: '0.3rem 0.75rem', borderRadius: '6px', border: 'none',
                            cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                            fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.02em',
                            transition: 'all 0.18s ease',
                            background: isActive
                                ? m === 'teacher' ? 'rgba(167,139,250,0.2)' : 'rgba(220,185,138,0.15)'
                                : 'transparent',
                            color: isActive
                                ? m === 'teacher' ? '#c4b5fd' : 'var(--gold)'
                                : 'rgba(255,255,255,0.35)',
                            boxShadow: isActive ? 'inset 0 0 0 1px rgba(255,255,255,0.06)' : 'none',
                        }}
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

        // Only active teacher profiles show the toggle
        const { data: teacherProfile } = await supabase
            .from('teacher_profiles')
            .select('id')
            .eq('id', user.id)
            .eq('is_active', true)
            .maybeSingle();

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
    useEffect(() => {
        const handleTeacherModeChanged = () => getUser();
        window.addEventListener('teacher-mode-changed', handleTeacherModeChanged);
        return () => window.removeEventListener('teacher-mode-changed', handleTeacherModeChanged);
    }, [getUser]);

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
        <nav style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1.25rem 3rem',
            background: 'rgba(13,13,13,0.92)', backdropFilter: 'blur(12px)',
            borderBottom: appMode === 'teacher'
                ? '1px solid rgba(167,139,250,0.2)'
                : '1px solid rgba(220,185,138,0.1)',
            position: 'sticky', top: 0, zIndex: 100,
        }}>

            {/* ── Logo ── */}
            <Link href="/home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '28px', height: '28px', position: 'relative' }}>
                    <Image src="/favicon.ico" alt="Logo" fill style={{ objectFit: 'contain' }} />
                </div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: 'var(--gold, #dcb98a)', letterSpacing: '0.05em' }}>
                    Riff<span style={{ color: 'var(--text, #f0e8dc)' }}>Routine</span>
                </div>
            </Link>

            {/* ── Nav links ── */}
            <ul style={{
                display: 'flex', gap: '2.5rem', listStyle: 'none',
                margin: 0, padding: 0, fontFamily: 'DM Sans, sans-serif', alignItems: 'center',
            }}>
                {navLinks.map((link) => {
                    const pathSegments = pathname.split('/');
                    const currentPathWithoutLocale = '/' + (pathSegments[2] || pathSegments[1] || '');
                    const isActive = currentPathWithoutLocale === link.path || pathname.includes(link.path);
                    return (
                        <li key={link.name}>
                            <Link data-onboarding={link.onboarding} href={link.path} style={{
                                textDecoration: 'none', fontSize: '0.9rem',
                                color: isActive ? 'var(--text, #f0e8dc)' : 'var(--muted, rgba(240,232,220,0.45))',
                                fontWeight: isActive ? '600' : '500',
                                transition: 'color 0.2s ease',
                            }}>
                                {link.name}
                            </Link>
                        </li>
                    );
                })}
            </ul>

            {/* ── Right side ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

                {/* Mode toggle — only when teacher profile is active */}
                {isProOrLifetime && isTeacher && (
                    <ModeSwitchToggle mode={appMode} onChange={handleModeChange} />
                )}

                {/* Activate teacher CTA — pro/lifetime but no active teacher profile */}
                {isProOrLifetime && !isTeacher && (
                    <Link
                        href="/profile#teacher"
                        style={{
                            fontSize: '0.75rem', fontWeight: 600,
                            color: 'rgba(167,139,250,0.8)', textDecoration: 'none',
                            padding: '0.3rem 0.75rem',
                            border: '1px solid rgba(167,139,250,0.2)',
                            borderRadius: '6px', transition: 'all 0.2s',
                            fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(167,139,250,0.08)';
                            e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'rgba(167,139,250,0.2)';
                        }}
                    >
                        {t('activateTeacher')}
                    </Link>
                )}

                {/* ── Avatar + dropdown ── */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <div
                        onClick={() => setShowDropdown(!showDropdown)}
                        style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            background: avatarUrl ? 'transparent' : 'rgba(220,185,138,0.15)',
                            border: '1px solid rgba(220,185,138,0.3)',
                            color: 'var(--gold, #dcb98a)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            fontFamily: 'Bebas Neue, sans-serif', cursor: 'pointer',
                            fontSize: '1.1rem', textTransform: 'uppercase',
                            transition: 'all 0.2s ease',
                            position: 'relative', overflow: 'visible',
                        }}
                    >
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                            {avatarUrl ? (
                                <Image src={avatarUrl} alt="Avatar" fill style={{ objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {email ? email[0] : 'U'}
                                </div>
                            )}
                        </div>
                        <TierBadge tier={tier} />
                    </div>

                    {showDropdown && (
                        <div style={{
                            position: 'absolute', top: 'calc(100% + 0.75rem)', right: '0',
                            background: 'var(--surface, #141414)', border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '12px', padding: '0.5rem',
                            display: 'flex', flexDirection: 'column',
                            minWidth: '220px', zIndex: 50,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            fontFamily: 'DM Sans, sans-serif',
                        }}>
                            {/* User info + tier pill */}
                            <div style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                    {email}
                                </span>
                                <span style={{
                                    fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.07em',
                                    padding: '2px 6px', borderRadius: '5px', flexShrink: 0, marginLeft: '0.5rem',
                                    background: TIER_STYLES[tier].bg,
                                    color: TIER_STYLES[tier].color,
                                    border: `1px solid ${TIER_STYLES[tier].border}`,
                                }}>
                                    {tier === 'lifetime' ? 'LIFETIME' : tier.toUpperCase()}
                                </span>
                            </div>

                            {!isDemo && (
                                <Link
                                    href="/profile"
                                    onClick={() => setShowDropdown(false)}
                                    style={{
                                        textDecoration: 'none', color: 'var(--text)',
                                        padding: '0.6rem 0.5rem', borderRadius: '6px',
                                        fontSize: '0.85rem', fontWeight: '500',
                                        transition: 'background 0.2s ease', display: 'block',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    {t('profile')}
                                </Link>
                            )}

                            {tier === 'free' && (
                                <Link
                                    href="/pro"
                                    onClick={() => setShowDropdown(false)}
                                    style={{
                                        textDecoration: 'none',
                                        padding: '0.6rem 0.5rem', borderRadius: '6px',
                                        fontSize: '0.85rem', fontWeight: '700',
                                        transition: 'background 0.2s ease', display: 'flex',
                                        alignItems: 'center', gap: '0.4rem',
                                        color: 'var(--gold)',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,185,138,0.07)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    {t('upgradePro')}
                                </Link>
                            )}

                            {/* --- ENLACE OCULTO DE ADMIN (Solo visible para ti) --- */}
                            {email === 'diego.mg.umh@gmail.com' && (
                                <Link
                                    href={`/${locale}/admin`}
                                    onClick={() => setShowDropdown(false)}
                                    style={{
                                        textDecoration: 'none', color: '#a855f7', // Color morado/distintivo para diferenciarlo
                                        padding: '0.6rem 0.5rem', borderRadius: '6px',
                                        fontSize: '0.85rem', fontWeight: '700',
                                        transition: 'background 0.2s ease', display: 'flex',
                                        alignItems: 'center', gap: '0.4rem',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    Admin Panel
                                </Link>
                            )}

                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.25rem 0' }} />

                            <button
                                onClick={handleLogout}
                                style={{
                                    background: 'transparent', border: 'none', color: 'var(--red, #e74c3c)',
                                    textAlign: 'left', padding: '0.6rem 0.5rem', cursor: 'pointer',
                                    borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600',
                                    transition: 'background 0.2s ease',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,76,60,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
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