"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DistributionData {
  name: string;
  value: number;
}

const COLORS = ['#dcb98a', '#a78bfa', '#34d399', '#f87171', '#fbbf24', '#818cf8'];

export function CategoryDistribution() {
  const [data, setData] = useState<DistributionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDistribution();
  }, []);

  const fetchDistribution = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: logs } = await supabase
      .from('practice_logs')
      .select('duration_seconds, exercises(technique)')
      .eq('user_id', user.id);

    if (logs) {
      const stats: Record<string, number> = {};

      logs.forEach((log: any) => {
        const techniqueField = Array.isArray(log.exercises)
          ? log.exercises[0]?.technique
          : log.exercises?.technique || 'General';

        const seconds = log.duration_seconds || 0;

        const techniqueList = techniqueField
          .split(',')
          .map((t: string) => t.trim())
          .filter((t: string) => t !== '');

        const secondsPerTechnique = seconds / techniqueList.length;

        techniqueList.forEach((tech: string) => {
          stats[tech] = (stats[tech] || 0) + secondsPerTechnique;
        });
      });

      const formattedData = Object.keys(stats).map(key => ({
        name: key,
        value: Number((stats[key] / 60).toFixed(1))
      })).filter(item => item.value > 0);

      setData(formattedData.sort((a, b) => b.value - a.value));
    }
    setLoading(false);
  };

  if (loading) return null;

  return (
    <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', height: '450px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ color: 'var(--text)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>
        Distribución por Técnica
      </h3>
      <div style={{ flex: 1, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="90%"
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [`${value} min`, 'Tiempo']}
              contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--text)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}