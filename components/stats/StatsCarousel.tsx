"use client";

import React, { useState } from 'react';
import { CategoryDistribution } from './CategoryDistribution';
import { SkillsRadar } from './SkillsRadar';

export function StatsCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    { id: 0, component: <CategoryDistribution />, title: 'Foco de Entrenamiento' },
    { id: 1, component: <SkillsRadar />, title: 'Radar de Habilidades' }
  ];

  const nextSlide = () => setActiveSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <div style={{ 
        display: 'flex', 
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)', 
        transform: `translateX(-${activeSlide * 100}%)` 
      }}>
        {slides.map((slide) => (
          <div key={slide.id} style={{ minWidth: '100%', boxSizing: 'border-box' }}>
            {slide.component}
          </div>
        ))}
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '1rem', 
        marginTop: '1.5rem' 
      }}>
        <button 
          onClick={prevSlide}
          style={{
            background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer'
          }}
        >
          ←
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {slides.map((_, i) => (
            <div 
              key={i}
              onClick={() => setActiveSlide(i)}
              style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: i === activeSlide ? 'var(--gold)' : 'rgba(255,255,255,0.2)',
                cursor: 'pointer', transition: '0.3s'
              }}
            />
          ))}
        </div>

        <button 
          onClick={nextSlide}
          style={{
            background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer'
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}