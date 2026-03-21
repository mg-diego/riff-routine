"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  const [showLegend, setShowLegend] = useState(false); // <--- Nuevo estado para el panel de Info

  const PILLAR_NAMES = useMemo(() => ({
    SPEED: t('pillars.Speed'),
    EXPRESSION: t('pillars.Expression'),
    PRECISION: t('pillars.Precision'),
    RHYTHM: t('pillars.Rhythm'),
    THEORY: t('pillars.Theory')
  }), [t]);

  const TECHNIQUE_MAP: Record<string, string> = useMemo(() => ({
    'Alternate Picking': PILLAR_NAMES.SPEED, 'Down Picking': PILLAR_NAMES.SPEED, 'Sweep Picking': PILLAR_NAMES.PRECISION, 'Economy Picking': PILLAR_NAMES.SPEED,
    'Legato': PILLAR_NAMES.SPEED, 'Bending': PILLAR_NAMES.EXPRESSION, 'Vibrato': PILLAR_NAMES.EXPRESSION, 'Slide': PILLAR_NAMES.EXPRESSION,
    'Fingerstyle': PILLAR_NAMES.PRECISION, 'String Skipping': PILLAR_NAMES.PRECISION, 'Tapping': PILLAR_NAMES.PRECISION,
    'sys_chords_technique': PILLAR_NAMES.THEORY, 'Rythm': PILLAR_NAMES.RHYTHM, 'Strumming': PILLAR_NAMES.RHYTHM,
    'sys_scales_technique': PILLAR_NAMES.THEORY, 'sys_improvisation_technique': PILLAR_NAMES.EXPRESSION
  }), [PILLAR_NAMES]);

  const PILLAR_COLORS: Record<string, string> = useMemo(() => ({
    [PILLAR_NAMES.SPEED]: '#f87171',
    [PILLAR_NAMES.EXPRESSION]: '#a78bfa',
    [PILLAR_NAMES.PRECISION]: '#34d399',
    [PILLAR_NAMES.RHYTHM]: '#fbbf24',
    [PILLAR_NAMES.THEORY]: '#60a5fa'
  }), [PILLAR_NAMES]);

  // Agrupamos las técnicas por pilar para pintarlas en la leyenda y el tooltip
  const groupedTechniques = useMemo(() => {
    const map: Record<string, string[]> = {};
    Object.entries(TECHNIQUE_MAP).forEach(([tech, pillar]) => {
      // Limpiamos los nombres de sistema para que sean legibles
      const cleanTech = tech
        .replace('sys_chords_technique', 'Chords')
        .replace('sys_scales_technique', 'Scales')
        .replace('sys_improvisation_technique', 'Improvisation');
      
      if (!map[pillar]) map[pillar] = [];
      if (!map[pillar].includes(cleanTech)) map[pillar].push(cleanTech);
    });
    return map;
  }, [TECHNIQUE_MAP]);

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

  // Tooltip personalizado para inyectar la lista de técnicas al pasar el ratón
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const timeParts = formatTime(Math.round(value));
      const timeStr = timeParts.length ? timeParts.map((p: any) => `${p.value} ${p.unit}`).join(' ') : '0 min';
      const techs = groupedTechniques[label] || [];

      return (
        <div style={{ background: '#111', border: `1px solid ${PILLAR_COLORS[label] || mainColor}`, padding: '0.8rem', borderRadius: '8px', minWidth: '180px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <p style={{ margin: '0 0 0.3rem 0', fontWeight: 700, color: PILLAR_COLORS[label] || mainColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </p>
          <p style={{ margin: '0 0 0.8rem 0', color: 'var(--text)', fontWeight: 600 }}>
            {timeStr} {t('tooltipLabel')}
          </p>
          <div>
            <span style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Técnicas:</span>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.4 }}>
              {techs.join(', ')}
            </p>
          </div>
        </div>
      );
    }
    return null;
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
    <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', height: 450, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* Botón de Información (Info / Cerrar) */}
      <button 
        onClick={() => setShowLegend(!showLegend)}
        title="Ver categorías"
        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: showLegend ? 'rgba(255,255,255,0.1)' : 'transparent', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10 }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
      >
        {showLegend ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        )}
      </button>

      <h3 style={{ color: 'var(--text)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>
        {showLegend ? 'Categorías de Práctica' : t('title')}
      </h3>

      {/* Alternamos entre el Gráfico y la Leyenda */}
      {showLegend ? (
        <div className="logs-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem', overflowY: 'auto', padding: '0.5rem 0.5rem 0.5rem 0', marginTop: '0.5rem' }}>
          {Object.entries(groupedTechniques).map(([pillar, techs]) => (
            <div key={pillar} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', borderLeft: `3px solid ${PILLAR_COLORS[pillar] || 'var(--gold)'}` }}>
              <h4 style={{ margin: '0 0 0.4rem 0', color: PILLAR_COLORS[pillar] || 'var(--gold)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {pillar}
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                {techs.join(', ')}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ flex: 1, width: '100%', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted)', fontSize: 13, fontWeight: 500 }} />
              <PolarRadiusAxis axisLine={false} tick={false} />
              <Radar name={t('tooltipLabel')} dataKey="A" stroke={mainColor} fill={mainColor} fillOpacity={0.5} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem', opacity: showLegend ? 0 : 1, transition: 'opacity 0.2s' }}>
        {t('footerNote')}
      </p>
    </div>
  );
}