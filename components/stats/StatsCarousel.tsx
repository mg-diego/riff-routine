"use client";

import React, { useState } from 'react';
import { CategoryDistribution } from './CategoryDistribution';
import { SkillsRadar } from './SkillsRadar';
import { useTranslations } from 'next-intl';
import styles from './StatsCarousel.module.css';

interface Props { dateFilter: string; }

export function StatsCarousel({ dateFilter }: Props) {
  const t = useTranslations('StatsCarousel');
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    { id: 0, component: <CategoryDistribution dateFilter={dateFilter} />, title: t('slides.focus') },
    { id: 1, component: <SkillsRadar dateFilter={dateFilter} />, title: t('slides.radar') },
  ];

  return (
    <div className={styles.block}>
      <div className={styles.row} style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
        {slides.map(slide => (
          <div key={slide.id} className={styles.componentBlock}>
            {slide.component}
          </div>
        ))}
      </div>

      <div className={styles.row2}>
        <button
          onClick={() => setActiveSlide(p => (p - 1 + slides.length) % slides.length)}
          className={`${styles.button} ${styles.buttonHoverable}`}
        >←</button>

        <div className={styles.row3}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => setActiveSlide(i)} className={styles.dot} style={{ background: i === activeSlide ? 'var(--gold)' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>

        <button
          onClick={() => setActiveSlide(p => (p + 1) % slides.length)}
          className={`${styles.button} ${styles.buttonHoverable2}`}
        >→</button>
      </div>
    </div>
  );
}