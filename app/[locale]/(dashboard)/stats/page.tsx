"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { GlobalKpis } from '../../../../components/stats/GlobalKpis';
import { RecentActivity } from '@/components/stats/RecentActivity';
import { ConsistencyHeatmap } from '@/components/stats/ConsistencyHeatmap';
import { StatsCarousel } from '@/components/stats/StatsCarousel';
import { useTranslations } from 'next-intl';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '../../../../lib/constants';
import { BecomeProModal } from '@/components/ui/BecomeProModal';

export default function StatsPage() {
  const t = useTranslations('StatsPage');
  const p = useTranslations('BecomeProModal');

  const DATE_OPTIONS = [
    { value: '7',  label: t('dateOptions.7days') },
    { value: '30', label: t('dateOptions.30days') },
    { value: '90', label: t('dateOptions.90days') },
    { value: 'all', label: t('dateOptions.allTime') },
  ];

  const [dateFilter, setDateFilter] = useState('30');
  const [loading, setLoading] = useState(true);
  const [totalTimeMinutes, setTotalTimeMinutes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeDays, setActiveDays] = useState(0);
  
  const [userTier, setUserTier] = useState<SubscriptionTier>(SUBSCRIPTION_TIERS.FREE);
  const [showProModal, setShowProModal] = useState(false);

  useEffect(() => { fetchGlobalStats(); }, []);

  const fetchGlobalStats = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    if (profile) {
      setUserTier((profile.subscription_tier as SubscriptionTier) || SUBSCRIPTION_TIERS.FREE);
    }

    const { data: sessionsData } = await supabase
      .from('practice_sessions')
      .select('id, created_at, total_duration_seconds')
      .eq('user_id', user.id);

    const { data: logsData } = await supabase
      .from('practice_logs')
      .select('created_at, duration_seconds, session_id')
      .eq('user_id', user.id);

    let totalSecs = 0;
    const allDates = new Set<string>();
    
    const getLocalDateStr = (iso: string) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    sessionsData?.forEach(s => {
      totalSecs += s.total_duration_seconds || 0;
      allDates.add(getLocalDateStr(s.created_at));
    });

    logsData?.forEach(log => {
      allDates.add(getLocalDateStr(log.created_at));
      
      if (!log.session_id) {
        totalSecs += log.duration_seconds || 0;
      }
    });

    setTotalTimeMinutes(Math.floor(totalSecs / 60));
    setActiveDays(allDates.size);

    const today = new Date();
    const todayStr = getLocalDateStr(today.toISOString());
    const yesterday = new Date(today); 
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday.toISOString());
    
    let currentStreak = 0;
    
    if (allDates.has(todayStr) || allDates.has(yesterdayStr)) {
      const startRef = allDates.has(todayStr) ? today : yesterday;
      let d = 0;
      while (true) {
        const check = new Date(startRef); 
        check.setDate(startRef.getDate() - d);
        if (allDates.has(getLocalDateStr(check.toISOString()))) { 
          currentStreak++; 
          d++; 
        } else {
          break;
        }
      }
    }
    
    setStreak(currentStreak);
    setLoading(false);
  };

  const isPro = userTier !== SUBSCRIPTION_TIERS.FREE;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', paddingBottom: '4rem', overflowX: 'hidden' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
            {t('title')}
          </h1>
          <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            {t('subtitle')}
          </p>
        </div>
      </div>

      <GlobalKpis
        totalTimeMinutes={totalTimeMinutes}
        activeDays={activeDays}
        streak={streak}
        loading={loading}
      />

      <div style={{ marginTop: '2rem', marginBottom: '3rem' }}>
        <ConsistencyHeatmap />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ color: 'var(--text)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', margin: 0, lineHeight: 1 }}>
            {t('detailedAnalysisTitle')}
          </h2>
          <p style={{ color: 'var(--muted)', margin: '0.3rem 0 0', fontSize: '0.85rem' }}>
            {t('detailedAnalysisSubtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '0.3rem', gap: '0.25rem' }}>
          {DATE_OPTIONS.map(opt => {
            const isLocked = !isPro && (opt.value === '90' || opt.value === 'all');
            
            return (
              <button
                key={opt.value}
                onClick={() => isLocked ? setShowProModal(true) : setDateFilter(opt.value)}
                style={{
                  background: dateFilter === opt.value ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: isLocked ? 'var(--muted)' : (dateFilter === opt.value ? 'var(--text)' : 'var(--muted)'),
                  border: 'none',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: dateFilter === opt.value ? 700 : 400,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  opacity: isLocked ? 0.6 : 1
                }}
              >
                {opt.label}
                {isLocked && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gold)' }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <StatsCarousel dateFilter={dateFilter} />
        </div>
        <div style={{ minWidth: 0 }}>
          <RecentActivity dateFilter={dateFilter} />
        </div>
      </div>

      {showProModal && (
        <BecomeProModal onClose={() => setShowProModal(false)} description={p('statsLimit')} />
      )}
    </div>
  );
}