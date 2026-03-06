"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Mis Rutinas', path: '/routines' },
    { name: 'Mi Biblioteca', path: '/library' },
    { name: 'Explorar', path: '/explore' },
    { name: 'Practicar', path: '/practice' },
    { name: 'Estadísticas', path: '/stats' },
  ];

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 3rem', background: 'var(--surface)', borderBottom: '1px solid rgba(220,185,138,0.15)' }}>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: 'var(--gold)', letterSpacing: '0.05em' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>RiffRoutine</Link>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.path}
            style={{
              textDecoration: 'none',
              color: pathname === link.path ? 'var(--gold)' : 'var(--text)',
              fontWeight: pathname === link.path ? '600' : '400',
              transition: 'color 0.2s'
            }}
          >
            {link.name}
          </Link>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <div
          onClick={() => setShowDropdown(!showDropdown)}
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gold)', color: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.2rem', textTransform: 'uppercase' }}
        >
          {email ? email[0] : 'U'}
        </div>

        {showDropdown && (
          <div style={{ position: 'absolute', top: '50px', right: '0', background: 'var(--surface2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px', zIndex: 50 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {email}
            </span>
            <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#e74c3c', textAlign: 'left', padding: '0.5rem', cursor: 'pointer', borderRadius: '4px' }}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}