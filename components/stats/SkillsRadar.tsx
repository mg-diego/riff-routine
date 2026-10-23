"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { formatTime, getStartDate } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import styles from './SkillsRadar.module.css';

interface Props { dateFilter: string; }

export function SkillsRadar({ dateFilter }: Props) {
  const t = useTranslations('SkillsRadar');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainColor, setMainColor] = useState('var(--gold)');
  const [showLegend, setShowLegend] = useState(false);

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
    'sys_chords_technique': PILLAR_NAMES.THEORY, 'Rhythm': PILLAR_NAMES.RHYTHM, 'Strumming': PILLAR_NAMES.RHYTHM,
    'sys_scales_technique': PILLAR_NAMES.THEORY, 'sys_improvisation_technique': PILLAR_NAMES.EXPRESSION, 'sys_rhythm_technique': PILLAR_NAMES.RHYTHM,
    'sys_ear_training_technique': PILLAR_NAMES.THEORY
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
        .replace('sys_improvisation_technique', 'Improvisation')        
        .replace('sys_ear_training_technique', 'Ear Training')
        .replace('sys_rhythm_technique', 'Rhythm');
      
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
        <div className={styles.tooltipLabelBox} style={{ border: `1px solid ${PILLAR_COLORS[label] || mainColor}` }}>
          <p className={styles.text} style={{ color: PILLAR_COLORS[label] || mainColor }}>
            {label}
          </p>
          <p className={styles.tooltipLabelText}>
            {timeStr} {t('tooltipLabel')}
          </p>
          <div>
            <span className={styles.label}>Técnicas:</span>
            <p className={styles.tooltipLabelBoxText}>
              {techs.join(', ')}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <div className={styles.row}>
      <span className="loader" />
    </div>
  );

  const isEmpty = data.every(d => d.A === 0);
  if (isEmpty) return (
    <div className={styles.noDataStack}>
      <span className={styles.noDataStackLabel}>🎸</span>
      <p className={styles.noDataText}>{t('noData')}</p>
    </div>
  );

  return (
    <div className={styles.titleStack}>
      
      {/* Botón de Información (Info / Cerrar) */}
      <button 
        onClick={() => setShowLegend(!showLegend)}
        title="Ver categorías"
        className={styles.button} style={{ background: showLegend ? 'rgba(255,255,255,0.1)' : 'transparent' }}
      >
        {showLegend ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        )}
      </button>

      <h3 className={styles.titleSubheading}>
        {showLegend ? 'Categorías de Práctica' : t('title')}
      </h3>

      {/* Alternamos entre el Gráfico y la Leyenda */}
      {showLegend ? (
        <div className={`logs-scroll ${styles.stack}`}>
          {Object.entries(groupedTechniques).map(([pillar, techs]) => (
            <div key={pillar} className={styles.box} style={{ borderLeft: `3px solid ${PILLAR_COLORS[pillar] || 'var(--gold)'}` }}>
              <h4 className={styles.subheading} style={{ color: PILLAR_COLORS[pillar] || 'var(--gold)' }}>
                {pillar}
              </h4>
              <p className={styles.titleStackText}>
                {techs.join(', ')}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.tooltipLabel}>
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

      <p className={styles.footerNoteText} style={{ opacity: showLegend ? 0 : 1 }}>
        {t('footerNote')}
      </p>
    </div>
  );
}