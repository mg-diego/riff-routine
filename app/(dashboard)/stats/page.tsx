"use client";

export default function StatsPage() {
  return (
    <div>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: '0 0 0.5rem 0' }}>Estadísticas</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '3rem' }}>Sigue tu progreso, velocidad y consistencia.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: 'var(--muted)', marginTop: 0, fontSize: '0.9rem', textTransform: 'uppercase' }}>Tiempo Total</h3>
          <p style={{ color: 'var(--gold)', fontSize: '2.5rem', margin: 0, fontFamily: 'Bebas Neue, sans-serif' }}>0 min</p>
        </div>
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: 'var(--muted)', marginTop: 0, fontSize: '0.9rem', textTransform: 'uppercase' }}>Días Seguidos</h3>
          <p style={{ color: 'var(--gold)', fontSize: '2.5rem', margin: 0, fontFamily: 'Bebas Neue, sans-serif' }}>0</p>
        </div>
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: 'var(--muted)', marginTop: 0, fontSize: '0.9rem', textTransform: 'uppercase' }}>Ejercicios Completados</h3>
          <p style={{ color: 'var(--gold)', fontSize: '2.5rem', margin: 0, fontFamily: 'Bebas Neue, sans-serif' }}>0</p>
        </div>
      </div>
    </div>
  );
}