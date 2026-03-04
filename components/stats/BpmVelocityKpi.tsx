"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function BpmVelocityKpi() {
  const [velocity, setVelocity] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBpmVelocity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: logs } = await supabase
        .from('practice_logs')
        .select('exercise_id, bpm_used, created_at')
        .eq('user_id', user.id);

      if (!logs || logs.length === 0) {
        setVelocity(0);
        setLoading(false);
        return;
      }

      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);

      const recentMaxBpm = new Map<string, number>();
      const pastMaxBpm = new Map<string, number>();

      logs.forEach(log => {
        const logDate = new Date(log.created_at);
        const isRecent = logDate >= sevenDaysAgo;

        if (isRecent) {
          const currentMax = recentMaxBpm.get(log.exercise_id) || 0;
          if (log.bpm_used > currentMax) {
            recentMaxBpm.set(log.exercise_id, log.bpm_used);
          }
        } else {
          const currentMax = pastMaxBpm.get(log.exercise_id) || 0;
          if (log.bpm_used > currentMax) {
            pastMaxBpm.set(log.exercise_id, log.bpm_used);
          }
        }
      });

      let totalDelta = 0;
      let count = 0;

      recentMaxBpm.forEach((recentBpm, exerciseId) => {
        const pastBpm = pastMaxBpm.get(exerciseId);
        if (pastBpm !== undefined && pastBpm > 0) {
          totalDelta += (recentBpm - pastBpm);
          count++;
        }
      });

      if (count > 0) {
        setVelocity(Math.round(totalDelta / count));
      } else {
        setVelocity(0);
      }
      
      setLoading(false);
    };

    fetchBpmVelocity();
  }, []);

  if (loading) {
    return (
      <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid rgba(220,185,138,0.3)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const isPositive = velocity !== null && velocity > 0;
  const isNeutral = velocity === 0;
  const color = isPositive ? '#34d399' : isNeutral ? 'var(--muted)' : '#e74c3c';
  const sign = isPositive ? '+' : '';

  return (
    <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <h3 style={{ color: 'var(--muted)', marginTop: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        BPM Velocity (7 días)
      </h3>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <p style={{ color: color, fontSize: '3rem', margin: 0, fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>
          {sign}{velocity}
        </p>
        <span style={{ fontSize: '1.2rem', color: 'var(--muted)', fontWeight: 600 }}>BPM</span>
      </div>
      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
        Mejora media por ejercicio
      </p>
    </div>
  );
}