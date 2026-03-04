"use client";

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface BulkAddExercisesProps {
  onSuccess?: () => void;
}

export function BulkAddExercises({ onSuccess }: BulkAddExercisesProps) {
  const [inputText, setInputText] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const parseText = () => {
    const lines = inputText.split('\n');
    const extracted = lines
      .map(line => {
        const parts = line.split('--').map(p => p.trim());
        if (parts.length > 0 && parts[0] !== '') {
          return {
            title: parts[0],
            technique: parts[1] || 'General',
            bpm_goal: parts[2] ? parseInt(parts[2], 10) : null
          };
        }
        return null;
      })
      .filter(item => item !== null);

    setParsedData(extracted);
  };

  const handleImport = async () => {
    setIsImporting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user && parsedData.length > 0) {
      const payload = parsedData.map(ex => ({
        ...ex,
        user_id: user.id
      }));

      const { error } = await supabase.from('exercises').insert(payload);

      if (!error) {
        setInputText('');
        setParsedData([]);
        if (onSuccess) onSuccess();
      } else {
        console.error(error);
      }
    }
    setIsImporting(false);
  };

  return (
    <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
      <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: 'var(--gold)', margin: '0 0 1rem 0' }}>
        Importar Ejercicios
      </h2>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Pega tu lista separando el título, la técnica y los BPM objetivo con un guion (-). Un ejercicio por línea.
        <br /><br />
        <strong style={{ color: 'var(--text)' }}>Ejemplo:</strong><br />
        Araña 1234 - Alternate Picking - 120<br />
        Escala Menor - Escalas - 100<br />
        Acordes Abiertos - Ritmo
      </p>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Araña 1234 - Alternate Picking - 100"
        style={{
          width: '100%',
          height: '150px',
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '1rem',
          color: 'var(--text)',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '0.9rem',
          resize: 'vertical',
          marginBottom: '1rem',
          outline: 'none'
        }}
      />

      <button
        onClick={parseText}
        disabled={inputText.trim() === ''}
        style={{
          background: 'var(--surface2)',
          color: 'var(--text)',
          padding: '0.8rem 1.5rem',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: inputText.trim() === '' ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          marginBottom: '2rem'
        }}
      >
        Analizar Texto
      </button>

      {parsedData.length > 0 && (
        <div>
          <h3 style={{ color: 'var(--gold)', fontSize: '1.2rem', marginBottom: '1rem' }}>Vista Previa ({parsedData.length})</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem' }}>
            {parsedData.map((ex, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{ex.title}</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{ex.technique} | {ex.bpm_goal ? `${ex.bpm_goal} BPM` : 'Sin BPM'}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleImport}
            disabled={isImporting}
            style={{
              background: 'var(--gold)',
              color: '#111',
              padding: '0.8rem 2rem',
              borderRadius: '8px',
              border: 'none',
              cursor: isImporting ? 'wait' : 'pointer',
              fontWeight: 600,
              width: '100%'
            }}
          >
            {isImporting ? 'Guardando...' : 'Confirmar y Guardar Todo'}
          </button>
        </div>
      )}
    </div>
  );
}