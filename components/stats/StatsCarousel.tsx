"use client";

import React, { useState } from 'react';
import { CategoryDistribution } from './CategoryDistribution';
import { SkillsRadar } from './SkillsRadar';
import { useTranslations } from 'next-intl';

interface Props { dateFilter: string; }

export function StatsCarousel({ dateFilter }: Props) {
  const t = useTranslations('StatsCarousel');
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    { id: 0, component: <CategoryDistribution dateFilter={dateFilter} />, title: t('slides.focus') },
    { id: 1, component: <SkillsRadar dateFilter={dateFilter} />, title: t('slides.radar') },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)', transform: `translateX(-${activeSlide * 100}%)` }}>
        {slides.map(slide => (
          <div key={slide.id} style={{ minWidth: '100%', boxSizing: 'border-box' }}>
            {slide.component}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
        <button
          onClick={() => setActiveSlide(p => (p - 1 + slides.length) % slides.length)}
          style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', transition: 'border-color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        >←</button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => setActiveSlide(i)} style={{ width: 8, height: 8, borderRadius: '50%', background: i === activeSlide ? 'var(--gold)' : 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'background 0.3s' }} />
          ))}
        </div>

        <button
          onClick={() => setActiveSlide(p => (p + 1) % slides.length)}
          style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', transition: 'border-color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        >→</button>
      </div>
    </div>
  );
}