"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import styles from './SpeedPanel.module.css';

const SUBDIVISIONS = [
  { value: 1, labelKey: 'sub.quarter' },     // Negras
  { value: 2, labelKey: 'sub.eighth' },      // Corcheas
  { value: 3, labelKey: 'sub.triplet' },     // Tresillos
  { value: 4, labelKey: 'sub.sixteenth' },   // Semicorcheas
  { value: 5, labelKey: 'sub.quintuplet' },  // Quintillos
  { value: 6, labelKey: 'sub.sextuplet' },   // Seisillos
  { value: 8, labelKey: 'sub.thirtysecond' } // Fusas
];

const LICK_LIBRARY = [
  `e|-----------------------------------------|\nB|-----------------------------------------|\nG|-----------------------------------------|\nD|-----------------------------------------|\nA|-----------------1-2-3-4---------1-2-3-4-|\nE|-1-2-3-4-1-2-3-4---------1-2-3-4---------|`,
  `e|-----------------------------------------|\nB|-----------------------------------------|\nG|-----------------------5-7-5-------------|\nD|-------------5-7-5---5-------7-5---------|\nA|-------5-7-5-------7-------------7-5-----|\nE|-5-8-5-------------------------------8-5-|`,
  `e|-----------------------------------------|\nB|-----------------------------------------|\nG|-----------------------------------------|\nD|-------------------------4-5-7-4-5-7-----|\nA|---------3-5-7-3-5-7-3-5-----------------|\nE|-3-5-7-3---------------------------------|`,
  `e|-----------------------------------------|\nB|-----------------------------------------|\nG|---------------------------------5-6-7-8-|\nD|-------------------------5-6-7-8---------|\nA|-----------------5-6-7-8-----------------|\nE|-5-6-7-8-5-6-7-8-------------------------|`,
  `e|-----------------------------------------|\nB|---5---6---5---8---5---6---5---5---5---5-|\nG|-7---7---7---7---7---7---7---7---5---4---|\nD|-----------------------------------------|\nA|-----------------------------------------|\nE|-----------------------------------------|`
];

export function SpeedPanel() {
  const t = useTranslations('SpeedPanel');
  
  const [baseBpm, setBaseBpm] = useState<number>(120);
  const [baseSub, setBaseSub] = useState<number>(4); // Por defecto semicorcheas
  const [currentTab, setCurrentTab] = useState<string>(LICK_LIBRARY[0]);

  const generateNewLick = () => {
    const currentIndex = LICK_LIBRARY.indexOf(currentTab);
    let nextIndex = Math.floor(Math.random() * LICK_LIBRARY.length);
    while (nextIndex === currentIndex) {
      nextIndex = Math.floor(Math.random() * LICK_LIBRARY.length);
    }
    setCurrentTab(LICK_LIBRARY[nextIndex]);
  };

  // Calcular equivalencias
  const calculateEquivalentBpm = (targetSub: number) => {
    return Math.round((baseBpm * baseSub) / targetSub);
  };

  return (
    <div className={styles.calculatorTitleGrid}>
      

      {/* CALCULADORA DE VELOCIDAD */}
      <div className={styles.calculatorTitleStack}>
        <div className="surface-card">
          <div className={styles.calculatorTitleRow}>
            <h3 className={styles.calculatorTitleSubheading}>{t('calculatorTitle')}</h3>
            <div 
              className={styles.dot} style={{ '--beat-duration': `${60 / baseBpm}s` } as React.CSSProperties} 
              title="Metrónomo Visual"
            />
          </div>

          <div className={styles.baseBpmRow}>
            <div className={styles.baseBpm}>
              <label className={styles.baseBpmFieldLabel}>
                {t('baseBpm')}
              </label>
              <input 
                type="number" 
                value={baseBpm} 
                onChange={(e) => setBaseBpm(Math.max(40, Math.min(300, Number(e.target.value))))}
                className={styles.input}
              />
            </div>
            
            <div className={styles.baseSubdivision}>
              <label className={styles.baseBpmFieldLabel}>
                {t('baseSubdivision')}
              </label>
              <select 
                value={baseSub} 
                onChange={(e) => setBaseSub(Number(e.target.value))}
                className={styles.select}
              >
                {SUBDIVISIONS.map(sub => (
                  <option key={sub.value} value={sub.value}>
                    {t(sub.labelKey)} ({sub.value} notas/pulso)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <table className={styles.targetSubdivisionTable}>
            <thead>
              <tr>
                <th className={styles.targetSubdivisionTh}>{t('targetSubdivision')}</th>
                <th className={styles.equivalentBpmTh}>{t('equivalentBpm')}</th>
              </tr>
            </thead>
            <tbody>
              {SUBDIVISIONS.map(sub => {
                const eqBpm = calculateEquivalentBpm(sub.value);
                const isCurrent = sub.value === baseSub;
                
                return (
                  <tr key={sub.value} className={styles.tr} style={{ background: isCurrent ? 'rgba(220,185,138,0.1)' : 'transparent' }}>
                    <td className={styles.td} style={{ color: isCurrent ? 'var(--gold)' : 'var(--text)', fontWeight: isCurrent ? 'bold' : 'normal' }}>
                      {t(sub.labelKey)}
                    </td>
                    <td className={styles.eqBpmTd} style={{ color: isCurrent ? 'var(--gold)' : 'var(--text)' }}>
                      {eqBpm} <span className={styles.label}>BPM</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GENERADOR DE EJERCICIOS */}
      <div className={styles.generatorTitleStack}>
        <div className={`surface-card ${styles.generatorTitleStack}`}>
          
          <div className={styles.calculatorTitleRow}>
            <h3 className={styles.calculatorTitleSubheading}>{t('generatorTitle')}</h3>
            <button 
              onClick={generateNewLick}
              className={styles.generateBtnButton}
            >
              {t('generateBtn')}
            </button>
          </div>

          <p className={styles.generatorDescText}>
            {t('generatorDesc')}
          </p>

          <div className={styles.box}>
            <pre className={styles.pre}>
              {currentTab}
            </pre>
          </div>
          
        </div>
      </div>

    </div>
  );
}