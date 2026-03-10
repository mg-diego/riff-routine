"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { formatTime, getStartDate } from '../../lib/utils';

const TECHNIQUE_MAP: Record<string, string> = {
  'Alternate Picking': 'Velocidad', 'Sweep Picking': 'Velocidad', 'Economy Picking': 'Velocidad',
  'Legato': 'Expresión', 'Bending': 'Expresión', 'Vibrato': 'Expresión', 'Slide': 'Expresión',
  'Fingerstyle': 'Precisión', 'String Skipping': 'Precisión', 'Tapping': 'Precisión',
  'Acordes': 'Ritmo', 'Ritmo': 'Ritmo', 'Strumming': 'Ritmo',
  'Escalas': 'Teoría', 'Arpegios': 'Teoría', 'Modos': 'Teoría'
};

const PILLAR_COLORS: Record<string, string> = {
  'Velocidad': '#f87171', 'Expresión': '#a78bfa',
  'Precisión': '#34d399', 'Ritmo': '#fbbf24', 'Teoría': '#60a5fa'
};

interface Props { dateFilter: string; }

export function SkillsRadar({ dateFilter }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainColor, setMainColor] = useState('var(--gold)');

  useEffect(() => { fetchRadarData(); }, [dateFilter]);

  const fetchRadarData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    let query = supabase
      .from('practice_logs')
      .select('duration_seconds, exercises(technique)')
      .eq('user_id', user.id);

    const startDate = getStartDate(dateFilter);
    if (startDate) query = query.gte('created_at', startDate);

    const { data: logs } = await query;

    if (logs) {
      const stats: Record<string, number> = { 'Velocidad': 0, 'Precisión': 0, 'Ritmo': 0, 'Teoría': 0, 'Expresión': 0 };
      logs.forEach((log: any) => {
        const rawTech = Array.isArray(log.exercises) ? log.exercises[0]?.technique : log.exercises?.technique;
        const pillar = TECHNIQUE_MAP[rawTech] || 'Precisión';
        stats[pillar] += (log.duration_seconds || 0) / 60;
      });

      let dominantPillar = 'Velocidad'; let maxVal = 0;
      Object.entries(stats).forEach(([key, val]) => { if (val > maxVal) { maxVal = val; dominantPillar = key; } });
      setMainColor(PILLAR_COLORS[dominantPillar] || 'var(--gold)');

      const maxValue = Math.max(...Object.values(stats).map(v => Math.round(v)), 1);
      setData(Object.keys(stats).map(key => ({ subject: key, A: Math.round(stats[key]), fullMark: maxValue })));
    }
    setLoading(false);
  };

  if (loading) return (
    <div style={{ background: 'var(--surface)', borderRadius: '12px', height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="loader" />
    </div>
  );

  const isEmpty = data.every(d => d.A === 0);
  if (isEmpty) return (
    <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', height: 450, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '2rem' }}>🎸</span>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>Sin datos para este período</p>
    </div>
  );

  return (
    <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', height: 450, display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ color: 'var(--text)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>
        Radar de Habilidades
      </h3>
      <div style={{ flex: 1, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted)', fontSize: 13, fontWeight: 500 }} />
            <PolarRadiusAxis axisLine={false} tick={false} />
            <Radar name="Tiempo" dataKey="A" stroke={mainColor} fill={mainColor} fillOpacity={0.5} />
            <Tooltip
              formatter={(value: number | undefined) => {
                if (value === undefined) return ['0 MIN', 'Tiempo'];
                const timeParts = formatTime(Math.round(value));
                return [timeParts.map((p: any) => `${p.value} ${p.unit}`).join(' '), 'Tiempo'];
              }}
              contentStyle={{ background: '#111', border: `1px solid ${mainColor}`, borderRadius: '8px' }}
              itemStyle={{ color: mainColor }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
        El color refleja tu enfoque principal en este período.
      </p>
    </div>
  );
}