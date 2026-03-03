"use client";

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: '0 0 0.5rem 0' }}>Tu Centro de Comando</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '3rem' }}>Bienvenido de nuevo a RiffRoutine. ¿Qué vamos a tocar hoy?</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(220,185,138,0.15)' }}>
          <h2 style={{ color: 'var(--text)', marginTop: 0 }}>Práctica Libre</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Sube un archivo sobre la marcha y ponte a tocar en el reproductor inmersivo.</p>
          <button onClick={() => router.push('/practice')} style={{ background: 'var(--gold)', color: '#111', padding: '0.8rem 1.5rem', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
            Abrir Reproductor
          </button>
        </div>

        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ color: 'var(--text)', marginTop: 0 }}>Última Rutina</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Aún no tienes rutinas registradas. Ve a la sección de rutinas para planificar tu semana.</p>
          <button onClick={() => router.push('/routines')} style={{ background: 'transparent', color: 'var(--text)', padding: '0.8rem 1.5rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
            Ir a Mis Rutinas
          </button>
        </div>
      </div>
    </div>
  );
}