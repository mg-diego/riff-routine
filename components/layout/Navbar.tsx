"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '../ui/LanguageSwitcher'; 

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Navbar');
  
  const [email, setEmail] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
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
    { name: t('links.home'), path: '/home' },
    { name: t('links.routines'), path: '/routines' },
    { name: t('links.library'), path: '/library' },
    { name: t('links.explore'), path: '/explore' },
    { name: t('links.practice'), path: '/practice' },
    { name: t('links.stats'), path: '/stats' },
  ];

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1.25rem 3rem', 
      background: 'rgba(13,13,13,0.92)', 
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(220,185,138,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <Link href="/home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{ width: '28px', height: '28px', position: 'relative' }}>
           <Image 
              src="/favicon.ico"
              alt="Logo"
              fill
              style={{ objectFit: 'contain' }}
           />
        </div>
        <div style={{ 
          fontFamily: 'Bebas Neue, sans-serif', 
          fontSize: '1.6rem', 
          color: 'var(--gold, #dcb98a)', 
          letterSpacing: '0.05em' 
        }}>
          Riff<span style={{ color: 'var(--text, #f0e8dc)' }}>Routine</span>
        </div>
      </Link>

      <ul style={{ 
        display: 'flex', 
        gap: '2.5rem', 
        listStyle: 'none', 
        margin: 0, 
        padding: 0,
        fontFamily: 'DM Sans, sans-serif',
        alignItems: 'center'
      }}>
        {navLinks.map((link) => {
          const pathSegments = pathname.split('/');
          const currentPathWithoutLocale = '/' + (pathSegments[2] || pathSegments[1] || '');
          const isActive = currentPathWithoutLocale === link.path || pathname.includes(link.path);

          return (
            <li key={link.name}>
              <Link
                href={link.path}
                style={{
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  color: isActive ? 'var(--text, #f0e8dc)' : 'var(--muted, rgba(240,232,220,0.45))',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'color 0.2s ease',
                }}
              >
                {link.name}
              </Link>
            </li>
          );
        })}
      </ul>

      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <div
          onClick={() => setShowDropdown(!showDropdown)}
          style={{ 
            width: '38px', height: '38px', borderRadius: '50%', 
            background: 'rgba(220,185,138,0.15)', border: '1px solid rgba(220,185,138,0.3)',
            color: 'var(--gold, #dcb98a)', display: 'flex', justifyContent: 'center', 
            alignItems: 'center', fontFamily: 'Bebas Neue, sans-serif', cursor: 'pointer', 
            fontSize: '1.1rem', textTransform: 'uppercase', transition: 'all 0.2s ease'
          }}
        >
          {email ? email[0] : 'U'}
        </div>

        {showDropdown && (
          <div style={{ 
            position: 'absolute', top: 'calc(100% + 0.5rem)', right: '0', 
            background: 'var(--surface, #141414)', border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '12px', padding: '0.5rem', display: 'flex', flexDirection: 'column', 
            minWidth: '220px', zIndex: 50, boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            fontFamily: 'DM Sans, sans-serif'
          }}>
            <span style={{ 
              fontSize: '0.75rem', color: 'var(--muted)', padding: '0.75rem 0.5rem', 
              borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.25rem'
            }}>
              {email}
            </span>

            {/* Fila de Idioma */}
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              padding: '0.4rem 0.5rem', marginBottom: '0.25rem' 
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: '500' }}>
                {t('languageLabel')}
              </span>
              <LanguageSwitcher />
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.25rem 0' }} />

            <button 
              onClick={handleLogout} 
              style={{ 
                background: 'transparent', border: 'none', color: 'var(--red, #e74c3c)', 
                textAlign: 'left', padding: '0.6rem 0.5rem', cursor: 'pointer', 
                borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', transition: 'background 0.2s ease'
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