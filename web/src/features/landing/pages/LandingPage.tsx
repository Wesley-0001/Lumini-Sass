import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '@/legacy/landing.scoped.css'

const stampBase = (cls: string, src: string, style: React.CSSProperties) => (
  <div className={`hero-stamp ${cls}`} style={style} aria-hidden>
    <img src={src} alt="" decoding="async" loading="lazy" />
  </div>
)

function useLandingEffects() {
  const heroRef = useRef<HTMLElement | null>(null)
  const [introReady, setIntroReady] = useState(false)

  useEffect(() => {
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduce) {
      setIntroReady(true)
    } else {
      const onLoad = () => setIntroReady(true)
      if (document.readyState === 'complete') setIntroReady(true)
      else window.addEventListener('load', onLoad)
      return () => window.removeEventListener('load', onLoad)
    }
  }, [])

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf: number | null = null
    let targetX = 0
    let targetY = 0
    let curX = 0
    let curY = 0

    const tick = () => {
      raf = null
      curX += (targetX - curX) * 0.09
      curY += (targetY - curY) * 0.09
      hero.style.setProperty('--parallax-x', curX.toFixed(5))
      hero.style.setProperty('--parallax-y', curY.toFixed(5))
      if (Math.abs(targetX - curX) > 0.002 || Math.abs(targetY - curY) > 0.002) {
        raf = requestAnimationFrame(tick)
      }
    }

    const queueTick = () => {
      if (raf == null) raf = requestAnimationFrame(tick)
    }

    const onMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width - 0.5
      const ny = (e.clientY - rect.top) / rect.height - 0.5
      targetX = Math.max(-1, Math.min(1, nx * 2))
      targetY = Math.max(-1, Math.min(1, ny * 2))
      queueTick()
    }

    const onLeave = () => {
      targetX = 0
      targetY = 0
      queueTick()
    }

    hero.addEventListener('mousemove', onMove, { passive: true })
    hero.addEventListener('mouseleave', onLeave)
    return () => {
      if (raf != null) cancelAnimationFrame(raf)
      hero.removeEventListener('mousemove', onMove)
      hero.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal, [data-reveal]').forEach((el) => {
        el.classList.add('is-visible')
      })
      return
    }
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal, [data-reveal]').forEach((el) => {
        el.classList.add('is-visible')
      })
      return
    }
    const nodes = document.querySelectorAll<HTMLElement>('.reveal, [data-reveal]')
    if (!nodes.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    )
    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [])

  return { heroRef, introReady }
}

export function LandingPage() {
  const { heroRef, introReady } = useLandingEffects()
  const year = new Date().getFullYear()

  const scrollToAbout = () => {
    const el = document.getElementById('sobre')
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.scrollIntoView()
      return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="lumini-landing">
      <main className="landing-main">
        <section ref={heroRef} className="hero" aria-labelledby="hero-title">
          <div className="hero__bg" aria-hidden="true" />
          <div className="hero__stamps" aria-hidden="true">
            {stampBase(
              'hero-stamp--tl',
              '/images/stamp-1.jpg',
              {
                ['--stamp-rot' as string]: '-11deg',
                ['--stamp-dur' as string]: '7.8s',
                ['--stamp-delay' as string]: '-0.4s',
                ['--stamp-float' as string]: '-14px',
                ['--stamp-ease' as string]: 'cubic-bezier(0.45,0,0.55,1)',
              } as React.CSSProperties
            )}
            {stampBase(
              'hero-stamp--tr',
              '/images/stamp-2.jpg',
              {
                ['--stamp-rot' as string]: '10deg',
                ['--stamp-dur' as string]: '10.4s',
                ['--stamp-delay' as string]: '-4.2s',
                ['--stamp-float' as string]: '-17px',
                ['--stamp-ease' as string]: 'cubic-bezier(0.4,0,0.2,1)',
              } as React.CSSProperties
            )}
            {stampBase(
              'hero-stamp--bl',
              '/images/stamp-3.jpg',
              {
                ['--stamp-rot' as string]: '-9deg',
                ['--stamp-dur' as string]: '9.1s',
                ['--stamp-delay' as string]: '-1.1s',
                ['--stamp-float' as string]: '-15px',
                ['--stamp-ease' as string]: 'cubic-bezier(0.33,0,0.67,1)',
              } as React.CSSProperties
            )}
            {stampBase(
              'hero-stamp--br',
              '/images/stamp-4.jpg',
              {
                ['--stamp-rot' as string]: '8deg',
                ['--stamp-dur' as string]: '11.6s',
                ['--stamp-delay' as string]: '-6.8s',
                ['--stamp-float' as string]: '-16px',
                ['--stamp-ease' as string]: 'cubic-bezier(0.37,0,0.63,1)',
              } as React.CSSProperties
            )}
          </div>
          <div
            className={[
              'hero__content',
              'landing-hero-intro',
              introReady ? 'landing-hero-intro--ready' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="hero__intro-stack">
              <div className="hero__brand reveal is-visible">
                <img
                  className="hero__logo"
                  src="/images/logo-branco1.png"
                  alt="Lumini"
                  width={228}
                  decoding="async"
                  fetchPriority="high"
                />
              </div>
              <h1
                id="hero-title"
                className="hero__head hero__headline reveal is-visible"
              >
                Controle a produção. Desenvolva pessoas. Eleve a operação.
              </h1>
              <p className="hero__subtitle reveal is-visible">Gestão inteligente de pessoas e produção</p>
            </div>

            <div className="decision">
              <h2 className="decision__heading hero-title reveal is-visible">Para onde vamos?</h2>
              <div className="decision__grid">
                <article className="choice-card" data-reveal>
                  <div className="choice-card__icon" aria-hidden="true">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h3 className="choice-card__title">Portal do Colaborador</h3>
                  <p className="choice-card__desc">Acompanhe sua evolução, frequência e documentos</p>
                  <Link to="/portal/login" className="btn btn--primary">
                    Acessar Portal
                  </Link>
                </article>

                <article className="choice-card" data-reveal>
                  <div className="choice-card__icon" aria-hidden="true">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M4 6h16M4 12h10M4 18h16"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h3 className="choice-card__title">Sistema de Gestão</h3>
                  <p className="choice-card__desc">Gerencie equipe, promoções e operações</p>
                  <Link to="/app/login" className="btn btn--primary">
                    Acessar Sistema
                  </Link>
                </article>

                <article className="choice-card" data-reveal>
                  <div className="choice-card__icon" aria-hidden="true">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 3L4 9v12h16V9l-8-6z"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className="choice-card__title">Conhecer a Lumini</h3>
                  <p className="choice-card__desc">Conheça nossa história, valores e estrutura</p>
                  <button type="button" className="btn btn--ghost" onClick={scrollToAbout}>
                    Conhecer
                  </button>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section id="sobre" className="section section--about" aria-labelledby="about-title">
          <div className="section__inner">
            <div className="about-block reveal" data-reveal>
              <div className="about-block__accent" aria-hidden="true" />
              <h2 id="about-title" className="section__title">
                Sobre a Lumini
              </h2>
              <p className="about-block__text">
                Somos uma empresa de <strong>estamparia digital</strong> que une <strong>tecnologia</strong>,{' '}
                <strong>qualidade</strong> e <strong>crescimento</strong>. Investimos em processos modernos e em
                pessoas para entregar resultados consistentes, com agilidade e excelência em cada etapa da
                produção.
              </p>
            </div>
          </div>
        </section>

        <section className="section section--mvp" aria-labelledby="mvp-title">
          <div className="section__inner">
            <h2 id="mvp-title" className="section__title section__title--center reveal" data-reveal>
              Missão, visão e valores
            </h2>
            <div className="mvp-grid">
              <article className="mvp-card reveal" data-reveal>
                <span className="mvp-card__label">Missão</span>
                <p className="mvp-card__text">Garantir eficiência e qualidade na gestão de pessoas e processos.</p>
              </article>
              <article className="mvp-card reveal" data-reveal>
                <span className="mvp-card__label">Visão</span>
                <p className="mvp-card__text">
                  Ser referência em organização, tecnologia e crescimento sustentável.
                </p>
              </article>
              <article className="mvp-card reveal" data-reveal>
                <span className="mvp-card__label">Valores</span>
                <p className="mvp-card__text">Compromisso, responsabilidade, evolução contínua e respeito.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section section--features" aria-labelledby="features-title">
          <div className="section__inner">
            <h2 id="features-title" className="section__title section__title--center reveal" data-reveal>
              Funcionalidades do sistema
            </h2>
            <div className="features-grid">
              <article className="feature-item reveal" data-reveal>
                <h3 className="feature-item__title">Gestão de equipe</h3>
                <p className="feature-item__desc">
                  Organize perfis, cargos e informações em um só lugar, com clareza para líderes e
                  colaboradores.
                </p>
              </article>
              <article className="feature-item reveal" data-reveal>
                <h3 className="feature-item__title">Avaliações e promoções</h3>
                <p className="feature-item__desc">
                  Acompanhe desempenho e evolução de carreira com processos estruturados e transparentes.
                </p>
              </article>
              <article className="feature-item reveal" data-reveal>
                <h3 className="feature-item__title">Holerites digitais</h3>
                <p className="feature-item__desc">Acesso seguro a documentos e holerites, reduzindo papel e retrabalho.</p>
              </article>
              <article className="feature-item reveal" data-reveal>
                <h3 className="feature-item__title">Controle de frequência</h3>
                <p className="feature-item__desc">
                  Registre e visualize presença e padrões para apoiar decisões com dados.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <p className="landing-footer__brand">© {year} Lumini. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
