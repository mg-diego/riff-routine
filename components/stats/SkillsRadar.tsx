"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { formatTime, getStartDate } from '../../lib/utils';
import { useTranslations } from 'next-intl';

interface Props { dateFilter: string; }

export function SkillsRadar({ dateFilter }: Props) {
  const t = useTranslations('SkillsRadar');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainColor, setMainColor] = useState('var(--gold)');

  const PILLAR_NAMES = {
    SPEED: t('pillars.Speed'),
    EXPRESSION: t('pillars.Expression'),
    PRECISION: t('pillars.Precision'),
    RHYTHM: t('pillars.Rhythm'),
    THEORY: t('pillars.Theory')
  };

  const TECHNIQUE_MAP: Record<string, string> = {
    'Alternate Picking': PILLAR_NAMES.SPEED, 'Sweep Picking': PILLAR_NAMES.SPEED, 'Economy Picking': PILLAR_NAMES.SPEED,
    'Legato': PILLAR_NAMES.EXPRESSION, 'Bending': PILLAR_NAMES.EXPRESSION, 'Vibrato': PILLAR_NAMES.EXPRESSION, 'Slide': PILLAR_NAMES.EXPRESSION,
    'Fingerstyle': PILLAR_NAMES.PRECISION, 'String Skipping': PILLAR_NAMES.PRECISION, 'Tapping': PILLAR_NAMES.PRECISION,
    'Acordes': PILLAR_NAMES.RHYTHM, 'Ritmo': PILLAR_NAMES.RHYTHM, 'Strumming': PILLAR_NAMES.RHYTHM,
    'Escalas': PILLAR_NAMES.THEORY, 'Arpegios': PILLAR_NAMES.THEORY, 'Modos': PILLAR_NAMES.THEORY
  };

  const PILLAR_COLORS: Record<string, string> = {
    [PILLAR_NAMES.SPEED]: '#f87171',
    [PILLAR_NAMES.EXPRESSION]: '#a78bfa',
    [PILLAR_NAMES.PRECISION]: '#34d399',
    [PILLAR_NAMES.RHYTHM]: '#fbbf24',
    [PILLAR_NAMES.THEORY]: '#60a5fa'
  };

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
      const stats: Record<string, number> = { 
        [PILLAR_NAMES.SPEED]: 0, 
        [PILLAR_NAMES.PRECISION]: 0, 
        [PILLAR_NAMES.RHYTHM]: 0, 
        [PILLAR_NAMES.THEORY]: 0, 
        [PILLAR_NAMES.EXPRESSION]: 0 
      };

      logs.forEach((log: any) => {
        const rawTech = Array.isArray(log.exercises) ? log.exercises[0]?.technique : log.exercises?.technique;
        const pillar = TECHNIQUE_MAP[rawTech] || PILLAR_NAMES.PRECISION;
        stats[pillar] += (log.duration_seconds || 0) / 60;
      });

      let dominantPillar = PILLAR_NAMES.SPEED; 
      let maxVal = 0;
      Object.entries(stats).forEach(([key, val]) => { 
        if (val > maxVal) { maxVal = val; dominantPillar = key; } 
      });
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
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>{t('noData')}</p>
    </div>
  );

  return (
    <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', height: 450, display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ color: 'var(--text)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>
        {t('title')}
      </h3>
      <div style={{ flex: 1, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted)', fontSize: 13, fontWeight: 500 }} />
            <PolarRadiusAxis axisLine={false} tick={false} />
            <Radar name={t('tooltipLabel')} dataKey="A" stroke={mainColor} fill={mainColor} fillOpacity={0.5} />
            <Tooltip
              formatter={(value: number | undefined) => {
                if (value === undefined) return [`0 ${t('pillars.Theory')}`, t('tooltipLabel')];
                const timeParts = formatTime(Math.round(value));
                return [timeParts.map((p: any) => `${p.value} ${p.unit}`).join(' '), t('tooltipLabel')];
              }}
              contentStyle={{ background: '#111', border: `1px solid ${mainColor}`, borderRadius: '8px' }}
              itemStyle={{ color: mainColor }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
        {t('footerNote')}
      </p>
    </div>
  );
}