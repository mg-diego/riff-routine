"use client";

export default function RoutinesPage() {
  return (
    <div>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: '0 0 0.5rem 0' }}>Mis Rutinas</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '3rem' }}>Organiza tus ejercicios y crea planes de práctica diarios.</p>
      <div style={{ background: 'var(--surface)', padding: '3rem', borderRadius: '12px', border: '1px dashed rgba(220,185,138,0.4)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text)', marginBottom: '1.5rem' }}>Aún no has creado ninguna rutina.</p>
        <button style={{ background: 'var(--gold)', color: '#111', padding: '0.8rem 1.5rem', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          + Crear Nueva Rutina
        </button>
      </div>
    </div>
  );
}