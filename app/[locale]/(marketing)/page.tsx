"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import styles from './page.module.css';
import { cx } from '@/lib/cx';

export default function LandingPage() {
  const t = useTranslations('LandingPage');

  useEffect(() => {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    function animCursor() {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      if (dot) { dot.style.left = mx + 'px'; dot.style.top = my + 'px'; }
      if (ring) { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; }
      requestAnimationFrame(animCursor);
    }
    animCursor();

    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
      nav?.classList.toggle(styles.scrolled, window.scrollY > 60);
    });

    const reveals = document.querySelectorAll(`.${styles.reveal}`);
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add(styles.visible); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach((el: Element) => io.observe(el));

    function animCounter(el: HTMLElement) {
      const target = parseInt(el.dataset.target || '0');
      const duration = 1800;
      const start = performance.now();
      function update(now: number) {
        const pct = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - pct, 3);
        el.textContent = Math.round(eased * target).toLocaleString('es-ES');
        if (pct < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    }
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { animCounter(e.target as HTMLElement); counterObs.unobserve(e.target); } });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-target]').forEach(el => counterObs.observe(el));

    const hm = document.getElementById('heatmapMock');
    if (hm) {
      for (let i = 0; i < 84; i++) {
        const cell = document.createElement('div');
        const rand = Math.random();
        const opacity = rand < 0.35 ? 0.04 : rand < 0.6 ? 0.2 : rand < 0.8 ? 0.5 : rand < 0.93 ? 0.8 : 1;
        cell.style.cssText = `height:10px;border-radius:2px;background:rgba(220,185,138,${opacity});`;
        hm.appendChild(cell);
      }
    }
  }, []);

  return (
    <>
      <div className={styles.page}>
        <div className={styles.cursor} id="cursor">
          <div className={styles['cursor-ring']} id="cursorRing"></div>
          <div className={styles['cursor-dot']} id="cursorDot"></div>
        </div>

        <nav id="nav">
          <Link href="/" className={cx(styles.logo, styles.row)}>
            <img src="/favicon.ico" alt="RiffRoutine" className={styles.image} />
            Riff<span>Routine</span>
          </Link>
          <ul>
            <li><a href="#features">{t('nav.features')}</a></li>
            <li><a href="#how">{t('nav.how')}</a></li>
            <li><a href="#testimonios">{t('nav.community')}</a></li>
            <li><Link href="/login">{t('nav.login')}</Link></li>
            <li><Link href="/login" className={styles['nav-cta']}>{t('nav.startFree')}</Link></li>
            <li><LanguageSwitcher /></li>
          </ul>
        </nav>

        <section className={styles.hero}>
          <div className={styles['hero-bg-lines']}></div>
          <p className={styles['hero-eyebrow']}>{t('hero.eyebrow')}</p>
          <h1>{t('hero.title1')}<br /><em>{t('hero.title_em')}</em><br />{t('hero.title2')}</h1>
          <p className={styles['hero-sub']}>{t('hero.sub')}</p>
          <div className={styles['hero-actions']}>
            <Link href="/login" className={styles['btn-primary']}>{t('hero.startBtn')}</Link>
            <a href="#features" className={styles['btn-ghost']}>{t('hero.howBtn')}</a>
          </div>
          <div className={styles['hero-scroll-hint']}>
            <div className={styles['scroll-line']}></div>
            <span>{t('hero.scroll')}</span>
          </div>
        </section>

        <div className={styles['ticker-wrap']}>
          <div className={styles.ticker}>
            <span className={styles['ticker-item']}>{t('ticker.tabPlayer')}<span className={styles['ticker-dot']}></span></span>
            <span className={styles['ticker-item']}>{t('ticker.bpmControl')}<span className={styles['ticker-dot']}></span></span>
            <span className={styles['ticker-item']}>{t('ticker.routines')}<span className={styles['ticker-dot']}></span></span>
            <span className={styles['ticker-item']}>{t('ticker.stats')}<span className={styles['ticker-dot']}></span></span>
            <span className={styles['ticker-item']}>{t('ticker.streak')}<span className={styles['ticker-dot']}></span></span>
            <span className={styles['ticker-item']}>{t('ticker.heatmap')}<span className={styles['ticker-dot']}></span></span>
            <span className={styles['ticker-item']}>{t('ticker.metronome')}<span className={styles['ticker-dot']}></span></span>
            <span className={styles['ticker-item']}>{t('ticker.loop')}<span className={styles['ticker-dot']}></span></span>
            
            <span className={styles['ticker-item']}>{t('ticker.tabPlayer')}<span className={styles['ticker-dot']}></span></span>
            <span className={styles['ticker-item']}>{t('ticker.bpmControl')}<span className={styles['ticker-dot']}></span></span>
            <span className={styles['ticker-item']}>{t('ticker.routines')}<span className={styles['ticker-dot']}></span></span>
            <span className={styles['ticker-item']}>{t('ticker.stats')}<span className={styles['ticker-dot']}></span></span>
            <span className={styles['ticker-item']}>{t('ticker.streak')}<span className={styles['ticker-dot']}></span></span>
            <span className={styles['ticker-item']}>{t('ticker.heatmap')}<span className={styles['ticker-dot']}></span></span>
            <span className={styles['ticker-item']}>{t('ticker.metronome')}<span className={styles['ticker-dot']}></span></span>
            <span className={styles['ticker-item']}>{t('ticker.loop')}<span className={styles['ticker-dot']}></span></span>
          </div>
        </div>

        {/*
        <div className="stats-bar reveal">
          <div className="stat-item">
            <div className="stat-value" data-target="12400">0</div>
            <div className="stat-label">{t('stats.sessions')}</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" data-target="8300">0</div>
            <div className="stat-label">{t('stats.hours')}</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" data-target="94">0</div>
            <div className="stat-label">{t('stats.improve')}</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" data-target="3100">0</div>
            <div className="stat-label">{t('stats.active')}</div>
          </div>
        </div>
        */}

        <section className={styles.features} id="features">
          <div className={`${styles['features-header']} ${styles.reveal}`}>
            <span className={styles['section-label']}>{t('features.label')}</span>
            <h2 className={styles['section-title']}>{t('features.title1')}<br />{t('features.title2')} <em>{t('features.title_em')}</em></h2>
          </div>

          <div className={styles['features-grid']}>
            <div className={`${styles['feature-card']} ${styles.large} ${styles.reveal}`}>
              <div>
                <div className={cx(styles['feature-icon'], styles.box)}>🎸</div>
                <h3>{t('features.card1.title')}</h3>
                <p>{t('features.card1.desc')}</p>
                <div className={styles.tag1Row}>
                  <span className={styles['mock-tag']}>{t('features.card1.tag1')}</span>
                  <span className={styles['mock-tag']}>{t('features.card1.tag2')}</span>
                  <span className={cx(styles['mock-tag'], styles.label)}>× 0.75</span>
                  <span className={cx(styles['mock-tag'], styles.tag3Label)}>{t('features.card1.tag3')}</span>
                </div>
              </div>
              <div className={styles['mock-player']}>
                <div className={styles.mockModeRow}>
                  <span className={styles.mockModeLabel}>{t('features.card1.mockMode')}</span>
                  <span className={styles.mockLiveLabel}>{t('features.card1.mockLive')}</span>
                </div>
                <div className={styles.block}>Eruption — Van Halen</div>
                <div className={styles['mock-bar']}><div className={styles['mock-bar-fill']}></div></div>
                <div className={styles.mockBpmCurrentRow}>
                  <div>
                    <div className={styles.mockBpmCurrent}>{t('features.card1.mockBpmCurrent')}</div>
                    <div className={styles['mock-bpm']}>132</div>
                  </div>
                  <div className={styles.mockTarget}>
                    <div className={styles.mockBpmCurrent}>{t('features.card1.mockTarget')}</div>
                    <div className={styles.mockTargetBlock}>160</div>
                  </div>
                  <div className={styles.mockPlayRow}>
                    <div className={styles.mockPlayBox}>{t('features.card1.mockPlay')}</div>
                    <div className={styles.mockPlayRowBox}>⏹</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${styles['feature-card']} ${styles.reveal}`}>
              <div className={cx(styles['feature-icon'], styles.revealBox)}>📋</div>
              <h3>{t('features.card2.title')}</h3>
              <p>{t('features.card2.desc')}</p>
              <div className={styles['mock-routine']}>
                <div className={styles['mock-routine-item']}>
                  <div className={cx(styles['mock-dot'], styles.box4)}></div>
                  {t('features.card2.mockEx1')}
                  <span>{t('features.card2.mockEx1Time')}</span>
                </div>
                <div className={cx(styles['mock-routine-item'], styles.mockEx2Box)}>
                  <div className={cx(styles['mock-dot'], styles.mockEx2BoxInner)}></div>
                  {t('features.card2.mockEx2')}
                  <span className={styles.mockEx2StatusLabel}>{t('features.card2.mockEx2Status')}</span>
                </div>
                <div className={styles['mock-routine-item']}>
                  <div className={cx(styles['mock-dot'], styles.box6)}></div>
                  {t('features.card2.mockEx3')}
                  <span>{t('features.card2.mockEx3Time')}</span>
                </div>
              </div>
            </div>

            <div className={`${styles['feature-card']} ${styles.reveal}`}>
              <div className={cx(styles['feature-icon'], styles.box7)}>📈</div>
              <h3>{t('features.card3.title')}</h3>
              <p>{t('features.card3.desc')}</p>
              <div className={styles['mock-chart']} id="mockChart">
                <div className={cx(styles['mock-bar-chart'], styles.revealBlock)}></div>
                <div className={cx(styles['mock-bar-chart'], styles.block4)}></div>
                <div className={cx(styles['mock-bar-chart'], styles.block5)}></div>
                <div className={cx(styles['mock-bar-chart'], styles.block6)}></div>
                <div className={cx(styles['mock-bar-chart'], styles.block7)}></div>
                <div className={cx(`${styles['mock-bar-chart']} ${styles.hi}`, styles.block8)}></div>
                <div className={cx(`${styles['mock-bar-chart']} ${styles.hi}`, styles.block9)}></div>
                <div className={cx(`${styles['mock-bar-chart']} ${styles.hi}`, styles.block10)}></div>
              </div>
              <div className={styles.mockSession1SessionRow}>
                <div>
                  <div className={styles.mockSession1Session}>{t('features.card3.mockSession1')}</div>
                  <div className={styles.mockSession1RowBlock}>84 BPM</div>
                </div>
                <div className={styles.mockTarget}>
                  <div className={styles.mockSession1Session}>{t('features.card3.mockToday')}</div>
                  <div className={styles.block12}>138 BPM</div>
                </div>
              </div>
            </div>

            <div className={cx(`${styles['feature-card']} ${styles.reveal}`, styles.title)}>
              <div className={styles.titleGrid}>
                <div>
                  <div className={cx(styles['feature-icon'], styles.titleGridBox)}>🔥</div>
                  <h3>{t('features.card4.title')}</h3>
                  <p>{t('features.card4.desc')}</p>
                </div>
                <div>
                  <div className={styles.grid} id="heatmapMock"></div>
                  <div className={styles.mockStreakRow}>
                    <div className={styles.mockStreakBox}>
                      <div className={styles.mockStreak}>{t('features.card4.mockStreak')}</div>
                      <div className={styles.mockStreakVal}>{t('features.card4.mockStreakVal')}</div>
                    </div>
                    <div className={styles.mockWeekBox}>
                      <div className={styles.mockWeek}>{t('features.card4.mockWeek')}</div>
                      <div className={styles.mockWeekVal}>{t('features.card4.mockWeekVal')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.how} id="how">
          <div className={styles['how-inner']}>
            <div className={`${styles['how-header']} ${styles.reveal}`}>
              <span className={styles['section-label']}>{t('how.label')}</span>
              <h2 className={styles['section-title']}>{t('how.title1')}<br /><em>{t('how.title_em')}</em></h2>
            </div>
            <div className={styles.steps}>
              <div className={`${styles.step} ${styles.reveal}`}>
                <div className={styles['step-num']}>01</div>
                <h4>{t('how.step1Title')}</h4>
                <p>{t('how.step1Desc')}</p>
              </div>
              <div className={cx(`${styles.step} ${styles.reveal}`, styles.step2Title)}>
                <div className={styles['step-num']}>02</div>
                <h4>{t('how.step2Title')}</h4>
                <p>{t('how.step2Desc')}</p>
              </div>
              <div className={cx(`${styles.step} ${styles.reveal}`, styles.step3Title)}>
                <div className={styles['step-num']}>03</div>
                <h4>{t('how.step3Title')}</h4>
                <p>{t('how.step3Desc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/*
        <section className="proof" id="testimonios">
          <div className="proof-header reveal">
            <span className="section-label">{t('testimonials.label')}</span>
            <h2 className="section-title">{t('testimonials.title1')}<br /><em>{t('testimonials.title_em')}</em></h2>
          </div>
          <div className="testimonials">
            <div className="testimonial reveal">
              <div className="stars">★★★★★</div>
              <p className="testimonial-text">{t('testimonials.t1Text')}</p>
              <div className="testimonial-author">
                <div className="author-avatar">JM</div>
                <div>
                  <div className="author-name">{t('testimonials.t1Author')}</div>
                  <div className="author-role">{t('testimonials.t1Role')}</div>
                </div>
              </div>
            </div>
            <div className="testimonial reveal" style={{ transitionDelay: "0.1s" }}>
              <div className="stars">★★★★★</div>
              <p className="testimonial-text">{t('testimonials.t2Text')}</p>
              <div className="testimonial-author">
                <div className="author-avatar">SL</div>
                <div>
                  <div className="author-name">{t('testimonials.t2Author')}</div>
                  <div className="author-role">{t('testimonials.t2Role')}</div>
                </div>
              </div>
            </div>
            <div className="testimonial reveal" style={{ transitionDelay: "0.2s" }}>
              <div className="stars">★★★★★</div>
              <p className="testimonial-text">{t('testimonials.t3Text')}</p>
              <div className="testimonial-author">
                <div className="author-avatar">AK</div>
                <div>
                  <div className="author-name">{t('testimonials.t3Author')}</div>
                  <div className="author-role">{t('testimonials.t3Role')}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        */}

        <section
          className={cx(styles['cta-section'], styles.labelSection)}
        >
          <div className={styles.labelStack}>
            <span className={cx(styles['section-label'], styles.labelLabel)}>
              {t('cta.label')}
            </span>

            <h2 className={cx(`${styles['section-title']} ${styles.reveal}`, styles.title1Heading)}>
              {t('cta.title1')}<br />
              {t('cta.title2')}<br />
              <em>{t('cta.title_em')}</em>
            </h2>

            <p className={cx(styles.reveal, styles.descText)}>
              {t('cta.desc')}
            </p>
          </div>

          <div className={cx(styles.reveal, styles.labelStack)}>
            <Link
              href="/login"
              className={cx(styles['btn-primary'], styles.btnLink)}
            >
              {t('cta.btn')}
            </Link>
            <p className={cx(styles['cta-note'], styles.noteText)}>
              {t('cta.note')}
            </p>
          </div>
        </section>

        <footer>
          <Link href="#" className={cx(styles.logo, styles.pageRow)}>
            <img src="/favicon.ico" alt="RiffRoutine" className={styles.image} />
            Riff<span>Routine</span>
          </Link>
          <div className={styles['footer-links']}>
            <Link href="/privacy">{t('footer.privacy')}</Link>
            <Link href="/terms">{t('footer.terms')}</Link>
            <Link href="/contact">{t('footer.contact')}</Link>
          </div>
          <p>{t('footer.copyright')}</p>
        </footer>
      </div>
    </>
  );
}