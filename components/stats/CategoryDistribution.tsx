"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getStartDate } from '../../lib/utils';
import { useTranslations } from 'next-intl';
import { Exercise } from '@/lib/types';
import { useTranslatedExercise } from '@/hooks/useTranslatedExercise';

interface DistributionData { name: string; value: number; }
const COLORS = ['#dcb98a', '#a78bfa', '#34d399', '#f87171', '#fbbf24', '#818cf8'];

interface Props { dateFilter: string; }

export function CategoryDistribution({ dateFilter }: Props) {
  const t = useTranslations('CategoryDistribution');
  const [data, setData] = useState<DistributionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDistribution(); }, [dateFilter]);

  const { formatExercise } = useTranslatedExercise();

  const fetchDistribution = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    let query = supabase
      .from('practice_logs')
      .select('duration_seconds, exercises(id, user_id, title, technique)')
      .eq('user_id', user.id);

    const startDate = getStartDate(dateFilter);
    if (startDate) query = query.gte('created_at', startDate);

    const { data: logs } = await query;

    if (logs) {
      const stats: Record<string, number> = {};

      logs.forEach((log: any) => {
        const rawExercise = Array.isArray(log.exercises) ? log.exercises[0] : log.exercises;
        const translatedEx = formatExercise(rawExercise as Exercise);
        const techniqueField = translatedEx?.technique || t('generalFallback');
        const seconds = log.duration_seconds || 0;
        const techniqueList = techniqueField.split(',').map((t: string) => t.trim()).filter(Boolean);

        if (techniqueList.length > 0) {
          const secsEach = seconds / techniqueList.length;
          techniqueList.forEach((tech: string) => {
            stats[tech] = (stats[tech] || 0) + secsEach;
          });
        }
      });

      setData(
        Object.entries(stats)
          .map(([name, secs]) => ({ name, value: Number((secs / 60).toFixed(1)) }))
          .filter(d => d.value > 0)
          .sort((a, b) => b.value - a.value)
      );
    }
    setLoading(false);
  };

  const formatTime = (totalMinutes: number) => {
    if (!totalMinutes) return `0 ${t('timeUnits.minute')}`;
    const m = Math.round(totalMinutes);
    if (m < 60) return `${m} ${t('timeUnits.minute')}`;
    const months = Math.floor(m / 43200); let rem = m % 43200;
    const days = Math.floor(rem / 1440); rem = rem % 1440;
    const hours = Math.floor(rem / 60); const mins = rem % 60;
    const parts: string[] = [];
    if (months > 0) parts.push(`${months} ${months > 1 ? t('timeUnits.months') : t('timeUnits.month')}`);
    if (days > 0) parts.push(`${days}${t('timeUnits.day')}`);
    if (hours > 0) parts.push(`${hours}${t('timeUnits.hour')}`);
    if (mins > 0) parts.push(`${mins}${t('timeUnits.minute')}`);
    return parts.join(' ');
  };

  const totalMinutesAllCategories = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0);
  }, [data]);

  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, fill, percent, name }: any) => {
    if (percent < 0.04) return null;

    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';

    return (
      <text 
        x={x} 
        y={y} 
        fill={fill} 
        textAnchor={textAnchor} 
        dominantBaseline="central" 
        fontSize="0.75rem" 
        fontWeight="600"
        fontFamily="DM Sans, sans-serif"
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const categoryData = payload[0].payload;
      const percentage = totalMinutesAllCategories > 0 
        ? ((categoryData.value / totalMinutesAllCategories) * 100).toFixed(1) 
        : 0;

      return (
        <div style={{
          background: '#111',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '0.8rem 1rem',
          boxShadow: '0 8px 16px rgba(0,0,0,0.4)'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {categoryData.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ color: 'var(--gold)', fontSize: '1.2rem', fontWeight: 700, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}>
              {formatTime(categoryData.value)}
            </span>
            <span style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600 }}>
              ({percentage}%)
            </span>
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

  if (data.length === 0) return (
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
          <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <Pie 
              data={data} 
              cx="50%" 
              cy="50%" 
              innerRadius="55%" 
              outerRadius="80%" 
              paddingAngle={3} 
              dataKey="value"
              label={renderCustomLabel}
              labelLine={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
            >
              {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}