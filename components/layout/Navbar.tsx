"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';

type Tier = 'free' | 'pro' | 'lifetime';

const TIER_STYLES: Record<Tier, { label: string; bg: string; color: string; border: string }> = {
    free:     { label: 'FREE',     bg: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)' },
    pro:      { label: 'PRO',      bg: 'rgba(220,185,138,0.15)', color: 'var(--gold)',             border: 'rgba(220,185,138,0.35)' },
    lifetime: { label: '∞',        bg: 'var(--gold)',             color: '#111',                   border: 'transparent' },
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
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}>
            {s.label}
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
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (user.email) setEmail(user.email);

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('avatar_url, subscription_tier')
                    .eq('id', user.id)
                    .single();

                if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
                if (profile?.subscription_tier) setTier(profile.subscription_tier as Tier);
            }
        };
        getUser();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const navLinks = [
        { name: t('links.home'),     path: '/home' },
        { name: t('links.routines'), path: '/routines' },
        { name: t('links.library'),  path: '/library' },
        { name: t('links.explore'),  path: '/explore' },
        { name: t('links.practice'), path: '/practice' },
        { name: t('links.stats'),    path: '/stats' },
    ];

    const isDemo = email === 'demo@riffroutine.com';

    return (
        <nav style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1.25rem 3rem',
            background: 'rgba(13,13,13,0.92)', backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(220,185,138,0.1)',
            position: 'sticky', top: 0, zIndex: 100,
        }}>
            <Link href="/home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '28px', height: '28px', position: 'relative' }}>
                    <Image src="/favicon.ico" alt="Logo" fill style={{ objectFit: 'contain' }} />
                </div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: 'var(--gold, #dcb98a)', letterSpacing: '0.05em' }}>
                    Riff<span style={{ color: 'var(--text, #f0e8dc)' }}>Routine</span>
                </div>
            </Link>

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
                            <Link href={link.path} style={{
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

            <div style={{ position: 'relative' }} ref={dropdownRef}>
                {/* Avatar + tier badge */}
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

                {/* Dropdown */}
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
                        {/* User info + tier */}
                        <div style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                {email}
                            </span>
                            {/* Tier pill in dropdown */}
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
        </nav>
    );
}