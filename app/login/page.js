"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else router.push('/');
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) setError(error.message);
      else setMessage('Revisa tu bandeja de entrada para confirmar tu cuenta.');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw' }}>
      <div style={{ background: 'var(--surface)', padding: '3rem', borderRadius: '10px', width: '100%', maxWidth: '400px', border: '1px solid rgba(220,185,138,0.15)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', color: 'var(--gold)', textAlign: 'center', margin: '0 0 0.5rem 0', letterSpacing: '0.05em' }}>
          RiffRoute
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          {isLogin ? 'Accede a tu cuenta' : 'Crea tu cuenta'}
        </p>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <input
            type="email"
            placeholder="Tu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
          />
          <input
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
          />
          
          {error && <p style={{ color: '#e74c3c', fontSize: '0.85rem', margin: '0', textAlign: 'center' }}>{error}</p>}
          {message && <p style={{ color: 'var(--gold)', fontSize: '0.85rem', margin: '0', textAlign: 'center' }}>{message}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: 'none', background: 'var(--gold)', color: '#111', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem', fontFamily: 'DM Sans, sans-serif' }}
          >
            {loading ? 'Cargando...' : (isLogin ? 'Entrar' : 'Registrarse')}
          </button>
        </form>

        <button
          onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
          style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text)', marginTop: '1.5rem', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
        >
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  );
}