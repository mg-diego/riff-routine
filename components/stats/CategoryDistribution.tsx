"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getStartDate } from '../../lib/utils';
import { useTranslations } from 'next-intl';

interface DistributionData { name: string; value: number; }
const COLORS = ['#dcb98a', '#a78bfa', '#34d399', '#f87171', '#fbbf24', '#818cf8'];

interface Props { dateFilter: string; }

export function CategoryDistribution({ dateFilter }: Props) {
  const t = useTranslations('CategoryDistribution');
  const [data, setData] = useState<DistributionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDistribution(); }, [dateFilter]);

  const fetchDistribution = async () => {
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
      const stats: Record<string, number> = {};
      logs.forEach((log: any) => {
        const techniqueField = (Array.isArray(log.exercises)
          ? log.exercises[0]?.technique
          : log.exercises?.technique) || t('generalFallback');
        const seconds = log.duration_seconds || 0;
        const techniqueList = techniqueField.split(',').map((t: string) => t.trim()).filter(Boolean);
        const secsEach = seconds / techniqueList.length;
        techniqueList.forEach((tech: string) => { stats[tech] = (stats[tech] || 0) + secsEach; });
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
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" paddingAngle={3} dataKey="value">
              {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
            </Pie>
            <Tooltip formatter={(value: any, name: any) => [formatTime(Number(value)), name]} contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: 'var(--text)' }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}