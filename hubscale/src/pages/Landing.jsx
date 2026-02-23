import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PLANS, INTEGRATIONS } from '../lib/constants.js';

// ─── Design tokens (landing-specific, always dark) ─────────────────────────
const C = {
  bg: '#09090b', surface: '#111113', surface2: '#18181b',
  border: '#27272a', text: '#fafafa', textSec: '#a1a1aa', textMuted: '#52525b',
  accent: '#6366f1', green: '#22c55e', orange: '#f97316', blue: '#3b82f6',
  purple: '#a855f7', red: '#ef4444',
};
const F = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const GRAD = 'linear-gradient(135deg,#f97316,#f59e0b)';
const GRAD2 = 'linear-gradient(135deg,#6366f1,#818cf8)';

// ─── Scroll-reveal hook ────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ─── Animated counter ──────────────────────────────────────────────────────
function Counter({ end, suffix = '', prefix = '', duration = 2000 }) {
  const [ref, visible] = useReveal(0.3);
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = end / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= end) { setValue(end); clearInterval(id); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [visible, end, duration]);
  return <span ref={ref}>{prefix}{visible ? value.toLocaleString('fr-FR') : '0'}{suffix}</span>;
}

// ─── FAQ Accordion item ────────────────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen((o) => !o)}
      style={{
        background: C.surface, border: `1px solid ${open ? C.accent + '44' : C.border}`,
        borderRadius: 14, padding: '18px 22px', cursor: 'pointer',
        transition: 'all .25s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.5 }}>{q}</span>
        <span style={{
          fontSize: 18, color: C.textMuted, transition: 'transform .25s ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0)', flexShrink: 0,
        }}>+</span>
      </div>
      <div style={{
        maxHeight: open ? 200 : 0, overflow: 'hidden', transition: 'max-height .35s ease, opacity .25s ease',
        opacity: open ? 1 : 0,
      }}>
        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7, marginTop: 10, paddingRight: 24 }}>{a}</p>
      </div>
    </div>
  );
}

// ─── Dashboard mockup (CSS only) ──────────────────────────────────────────
function DashboardMockup() {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
      overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.03)',
      width: '100%', maxWidth: 900,
    }}>
      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
        borderBottom: `1px solid ${C.border}`, background: C.surface2,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: '#ef4444' }} />
        <div style={{ width: 10, height: 10, borderRadius: 5, background: '#f59e0b' }} />
        <div style={{ width: 10, height: 10, borderRadius: 5, background: '#22c55e' }} />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 10, color: C.textMuted, fontWeight: 600 }}>
          HubScale — Dashboard
        </div>
      </div>

      {/* Nav mock */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 20px', borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6, background: GRAD,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 11, color: '#fff',
          }}>H</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>Client Portal</span>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {['Overview', 'CRM', 'Data', 'Agenda'].map((t, i) => (
            <span key={t} style={{
              fontSize: 9, fontWeight: i === 0 ? 700 : 500,
              color: i === 0 ? C.text : C.textMuted,
              borderBottom: i === 0 ? '2px solid #f97316' : '2px solid transparent',
              paddingBottom: 4,
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Dashboard content */}
      <div style={{ padding: 20 }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'CA Mensuel', val: '28 450 \u20ac', change: '+12%', color: C.green },
            { label: 'Clients actifs', val: '142', change: '+8', color: C.blue },
            { label: 'Pipeline', val: '87 200 \u20ac', change: '+23%', color: C.purple },
            { label: 'MRR', val: '18 900 \u20ac', change: '+5%', color: C.orange },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              background: C.surface2, borderRadius: 10, padding: '12px 14px',
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 8, color: C.textMuted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{kpi.val}</div>
              <div style={{ fontSize: 9, color: kpi.color, fontWeight: 700, marginTop: 3 }}>{kpi.change}</div>
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          {/* Fake chart */}
          <div style={{
            background: C.surface2, borderRadius: 10, padding: 14,
            border: `1px solid ${C.border}`, height: 140,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.textSec, marginBottom: 10, textTransform: 'uppercase', letterSpacing: .5 }}>Revenue vs Charges</div>
            <svg viewBox="0 0 300 80" style={{ width: '100%', height: 80 }}>
              {/* Grid */}
              {[0, 20, 40, 60].map((y) => (
                <line key={y} x1="0" y1={y} x2="300" y2={y} stroke={C.border} strokeWidth=".5" />
              ))}
              {/* Revenue */}
              <polyline fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points="0,60 30,55 60,50 90,42 120,48 150,35 180,30 210,25 240,20 270,15 300,10" />
              <polyline fill="url(#gOrange)" stroke="none"
                points="0,60 30,55 60,50 90,42 120,48 150,35 180,30 210,25 240,20 270,15 300,10 300,80 0,80" />
              {/* Charges */}
              <polyline fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points="0,65 30,62 60,60 90,58 120,56 150,54 180,55 210,52 240,50 270,48 300,45" />
              <defs>
                <linearGradient id="gOrange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity=".2" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Fake pipeline */}
          <div style={{
            background: C.surface2, borderRadius: 10, padding: 14,
            border: `1px solid ${C.border}`, height: 140,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.textSec, marginBottom: 10, textTransform: 'uppercase', letterSpacing: .5 }}>Pipeline CRM</div>
            {[
              { label: 'Prospect', w: '85%', color: C.orange },
              { label: 'Lead', w: '60%', color: C.blue },
              { label: 'Client', w: '40%', color: C.green },
              { label: 'Partenaire', w: '20%', color: C.purple },
            ].map((bar) => (
              <div key={bar.label} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 8, color: C.textMuted }}>{bar.label}</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: C.border }}>
                  <div style={{ height: '100%', width: bar.w, borderRadius: 3, background: bar.color, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────
function Sect({ children, id, style }) {
  return (
    <section id={id} style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto', ...style }}>
      {children}
    </section>
  );
}

function RevealDiv({ children, style, delay = 0 }) {
  const [ref, vis] = useReveal(0.12);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(30px)',
      transition: `opacity .7s ease ${delay}s, transform .7s ease ${delay}s`,
      ...style,
    }}>{children}</div>
  );
}

// ─── Main Landing Component ────────────────────────────────────────────────
export default function Landing({ onLogin, onSignup }) {
  const [annual, setAnnual] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const scrollTo = useCallback((id) => {
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ─── LANDING CSS (injected once) ──────────────────────────────────────
  useEffect(() => {
    if (document.getElementById('landing-css')) return;
    const style = document.createElement('style');
    style.id = 'landing-css';
    style.textContent = `
@keyframes ldFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes ldGlow{0%,100%{opacity:.5}50%{opacity:1}}
@keyframes ldGradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes ldPulseRing{0%{transform:scale(.9);opacity:.8}50%{transform:scale(1.05);opacity:.4}100%{transform:scale(.9);opacity:.8}}
@keyframes ldShine{0%{left:-100%}100%{left:200%}}
@keyframes ldOrbit{0%{transform:rotate(0deg) translateX(140px) rotate(0deg)}100%{transform:rotate(360deg) translateX(140px) rotate(-360deg)}}
@keyframes ldTickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes ldHeroGrad{0%{background-position:0% 50%}25%{background-position:50% 0%}50%{background-position:100% 50%}75%{background-position:50% 100%}100%{background-position:0% 50%}}
.ld-float{animation:ldFloat 4s ease-in-out infinite}
.ld-float-d1{animation:ldFloat 4s ease-in-out .5s infinite}
.ld-float-d2{animation:ldFloat 4s ease-in-out 1s infinite}
.ld-glow{animation:ldGlow 3s ease-in-out infinite}
.ld-grad-text{background:linear-gradient(135deg,#f97316,#f59e0b,#f97316);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:ldGradient 4s ease infinite}
.ld-hero-bg{background:radial-gradient(ellipse at 30% 0%,rgba(249,115,22,.12) 0%,transparent 50%),radial-gradient(ellipse at 70% 20%,rgba(99,102,241,.1) 0%,transparent 50%),radial-gradient(ellipse at 50% 80%,rgba(168,85,247,.06) 0%,transparent 40%);animation:ldHeroGrad 12s ease infinite;background-size:200% 200%}
.ld-shine{position:relative;overflow:hidden}
.ld-shine::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);animation:ldShine 3s ease infinite}
.ld-nav-link{color:#a1a1aa;font-size:13px;font-weight:500;text-decoration:none;transition:color .2s;cursor:pointer;background:none;border:none;font-family:${F};padding:0}
.ld-nav-link:hover{color:#fafafa}
.ld-card{background:#111113;border:1px solid #27272a;border-radius:16px;padding:28px 24px;transition:all .3s ease}
.ld-card:hover{border-color:rgba(99,102,241,.25);transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,.3)}
.ld-pricing-card{background:#111113;border:2px solid #27272a;border-radius:20px;padding:32px 28px;transition:all .3s ease;position:relative}
.ld-pricing-card:hover{border-color:#6366f144;transform:translateY(-6px);box-shadow:0 24px 64px rgba(0,0,0,.35)}
.ld-pricing-pop{border-color:#f97316;box-shadow:0 0 40px rgba(249,115,22,.12)}
.ld-pricing-pop:hover{border-color:#f97316;box-shadow:0 24px 64px rgba(249,115,22,.15)}
.ld-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 28px;border-radius:10px;font-family:${F};font-weight:700;font-size:14px;cursor:pointer;transition:all .2s ease;border:none;text-decoration:none}
.ld-btn:hover{transform:translateY(-1px)}
.ld-btn:active{transform:scale(.98)}
.ld-btn-primary{background:${GRAD};color:#fff;box-shadow:0 4px 20px rgba(249,115,22,.3)}
.ld-btn-primary:hover{box-shadow:0 8px 30px rgba(249,115,22,.4)}
.ld-btn-secondary{background:transparent;color:#fafafa;border:1px solid #27272a}
.ld-btn-secondary:hover{border-color:#52525b;background:#18181b}
.ld-btn-white{background:#fafafa;color:#09090b;box-shadow:0 4px 20px rgba(0,0,0,.2)}
.ld-btn-white:hover{background:#e4e4e7}
.ld-testi{background:#111113;border:1px solid #27272a;border-radius:16px;padding:24px;transition:all .3s ease}
.ld-testi:hover{border-color:#6366f133}
@media(max-width:768px){
  .ld-hero-h1{font-size:36px!important}
  .ld-hero-sub{font-size:16px!important}
  .ld-grid-3{grid-template-columns:1fr!important}
  .ld-grid-2{grid-template-columns:1fr!important}
  .ld-pricing-grid{grid-template-columns:1fr!important}
  .ld-nav-links{display:none!important}
  .ld-mobile-toggle{display:flex!important}
  .ld-hero-btns{flex-direction:column;width:100%}
  .ld-hero-btns .ld-btn{width:100%}
  .ld-mockup-wrap{transform:scale(.85);transform-origin:top center}
  .ld-stats-grid{grid-template-columns:1fr 1fr!important}
  .ld-footer-grid{grid-template-columns:1fr 1fr!important}
}
@media(max-width:480px){
  .ld-hero-h1{font-size:28px!important}
  .ld-stats-grid{grid-template-columns:1fr!important}
}
`;
    document.head.appendChild(style);
  }, []);

  return (
    <div style={{ background: C.bg, fontFamily: F, color: C.text, overflowX: 'hidden' }}>

      {/* ══════════════ NAVBAR ══════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px', transition: 'all .3s ease',
        background: scrolled ? 'rgba(9,9,11,.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', height: 64,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: GRAD,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 16, color: '#fff',
            }}>H</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: -.5 }}>HubScale</span>
          </div>

          <div className="ld-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {[['Fonctionnalites', 'features'], ['Tarifs', 'pricing'], ['Temoignages', 'testimonials'], ['FAQ', 'faq']].map(([label, id]) => (
              <button key={id} className="ld-nav-link" onClick={() => scrollTo(id)}>{label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="ld-btn ld-btn-secondary" onClick={onLogin}
              style={{ padding: '8px 18px', fontSize: 13 }}>Connexion</button>
            <button className="ld-btn ld-btn-primary" onClick={() => onSignup()}
              style={{ padding: '8px 20px', fontSize: 13 }}>Essai gratuit</button>
            {/* Mobile hamburger */}
            <button className="ld-mobile-toggle" onClick={() => setMobileMenu((o) => !o)}
              style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', color: C.text, fontSize: 18 }}>
              {mobileMenu ? '\u2715' : '\u2630'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div style={{
            padding: '16px 0 20px', borderTop: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {[['Fonctionnalites', 'features'], ['Tarifs', 'pricing'], ['Temoignages', 'testimonials'], ['FAQ', 'faq']].map(([label, id]) => (
              <button key={id} className="ld-nav-link" onClick={() => scrollTo(id)}
                style={{ textAlign: 'left', padding: '8px 0', fontSize: 15 }}>{label}</button>
            ))}
          </div>
        )}
      </nav>


      {/* ══════════════ HERO ══════════════ */}
      <section className="ld-hero-bg" style={{ position: 'relative', paddingTop: 120, paddingBottom: 40, textAlign: 'center' }}>
        {/* Orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,.08), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', right: '10%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,.08), transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          {/* Badge */}
          <RevealDiv>
            <div className="ld-shine" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 40, background: C.surface,
              border: `1px solid ${C.border}`, marginBottom: 24,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: 3, background: C.green,
                boxShadow: `0 0 8px ${C.green}`,
              }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>
                +850 entreprises ont deja remplace leurs 5 outils par HubScale
              </span>
            </div>
          </RevealDiv>

          {/* Headline */}
          <RevealDiv delay={0.1}>
            <h1 className="ld-hero-h1" style={{
              fontSize: 56, fontWeight: 900, lineHeight: 1.1,
              letterSpacing: -1.5, margin: '0 0 20px',
            }}>
              Vous perdez 10h/semaine<br />
              <span className="ld-grad-text">a jongler entre vos outils</span>
            </h1>
          </RevealDiv>

          <RevealDiv delay={0.2}>
            <p className="ld-hero-sub" style={{
              fontSize: 18, color: C.textSec, lineHeight: 1.7,
              maxWidth: 580, margin: '0 auto 36px',
            }}>
              CRM sur un onglet, finances sur un autre, agenda ailleurs. Vous n'avez aucune vision d'ensemble.
              HubScale reunit tout dans un seul dashboard — et vos decisions deviennent evidentes.
            </p>
          </RevealDiv>

          {/* CTAs */}
          <RevealDiv delay={0.3}>
            <div className="ld-hero-btns" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="ld-btn ld-btn-primary" onClick={() => onSignup()}
                style={{ padding: '14px 32px', fontSize: 15 }}>
                Reprendre le controle
                <span style={{ fontSize: 18 }}>{'\u2192'}</span>
              </button>
              <button className="ld-btn ld-btn-secondary" onClick={() => scrollTo('demo')}
                style={{ padding: '14px 28px', fontSize: 15 }}>
                Voir le dashboard
              </button>
            </div>
            <p style={{ fontSize: 12, color: C.textMuted, marginTop: 14 }}>
              Essai 14 jours &middot; Setup en 2 min &middot; Annulez en 1 clic
            </p>
          </RevealDiv>
        </div>

        {/* Mockup */}
        <div id="demo" style={{ maxWidth: 1000, margin: '50px auto 0', padding: '0 24px', position: 'relative' }}>
          <RevealDiv delay={0.15}>
            <div className="ld-mockup-wrap" style={{ position: 'relative' }}>
              <DashboardMockup />
              {/* Glow behind */}
              <div style={{
                position: 'absolute', inset: -2, borderRadius: 18, zIndex: -1,
                background: 'conic-gradient(from 180deg at 50% 50%, #f97316 0deg, #6366f1 120deg, #a855f7 240deg, #f97316 360deg)',
                opacity: .15, filter: 'blur(40px)',
              }} />
            </div>
          </RevealDiv>

          {/* Floating badges around mockup */}
          <div className="ld-float" style={{
            position: 'absolute', top: 30, right: -10, background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '10px 16px', boxShadow: '0 8px 30px rgba(0,0,0,.3)', zIndex: 2,
          }}>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: .5 }}>MRR</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.green }}>+23%</div>
          </div>

          <div className="ld-float-d1" style={{
            position: 'absolute', bottom: 60, left: -10, background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '10px 16px', boxShadow: '0 8px 30px rgba(0,0,0,.3)', zIndex: 2,
          }}>
            <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: .5 }}>Nouveaux clients</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.orange }}>+42</div>
          </div>
        </div>
      </section>


      {/* ══════════════ LOGOS / TRUST ══════════════ */}
      <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '32px 24px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
            Ils ont arrete de perdre du temps. Vous aussi ?
          </p>
          <div style={{ display: 'flex', overflow: 'hidden', maskImage: 'linear-gradient(90deg,transparent,black 15%,black 85%,transparent)' }}>
            <div style={{ display: 'flex', gap: 60, animation: 'ldTickerScroll 30s linear infinite', whiteSpace: 'nowrap' }}>
              {[...Array(2)].flatMap((_, i) =>
                ['TechVision', 'DataFlow SAS', 'CloudNine', 'FinServ Pro', 'GreenTech', 'AlphaDigital', 'NovaStar', 'MediaPulse'].map((name, j) => (
                  <span key={`${i}-${j}`} style={{ fontSize: 16, fontWeight: 800, color: C.textMuted, opacity: .4, letterSpacing: -.3 }}>
                    {name}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════ STATS ══════════════ */}
      <Sect>
        <div className="ld-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
          {[
            { value: 850, suffix: '+', label: 'Entreprises qui ont dit stop au chaos', color: C.orange },
            { value: 10, prefix: '', suffix: 'h', label: 'Gagnees par equipe chaque semaine', color: C.green },
            { value: 99, suffix: '.9%', label: 'Uptime — vos donnees, toujours la', color: C.blue },
            { value: 4, suffix: '.8/5', label: 'Note moyenne sur 850+ avis', color: C.purple },
          ].map((s, i) => (
            <RevealDiv key={s.label} delay={i * 0.1}>
              <div>
                <div style={{ fontSize: 42, fontWeight: 900, color: s.color, lineHeight: 1.1 }}>
                  <Counter end={s.value} suffix={s.suffix} prefix={s.prefix} />
                </div>
                <div style={{ fontSize: 13, color: C.textSec, marginTop: 6, fontWeight: 500 }}>{s.label}</div>
              </div>
            </RevealDiv>
          ))}
        </div>
      </Sect>


      {/* ══════════════ FEATURES ══════════════ */}
      <Sect id="features" style={{ paddingTop: 40 }}>
        <RevealDiv>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Fonctionnalites
            </p>
            <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: -.5, lineHeight: 1.15, margin: '0 0 14px' }}>
              5 outils en 1.<br />
              <span style={{ color: C.textSec }}>Finis les onglets, les exports manuels et les copier-coller.</span>
            </h2>
          </div>
        </RevealDiv>

        <div className="ld-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {[
            { icon: '\uD83D\uDCCA', title: 'Dashboard temps reel', desc: 'Vous consultez 3 tableaux Excel pour connaitre votre CA ? Ici, un seul ecran. KPIs, MRR, tresorerie — tout est la, en temps reel.', color: C.orange },
            { icon: '\uD83D\uDC65', title: 'CRM Pipeline', desc: 'Vos leads tombent entre les mailles ? Pipeline visuel, lead scoring automatique, relances programmees. Plus aucun prospect ne passe a la trappe.', color: C.blue },
            { icon: '\uD83D\uDCB0', title: 'Data Financiere', desc: 'Marre de decouvrir un trou de tresorerie trop tard ? Suivi mois par mois, previsions IA et alertes avant que ca brule.', color: C.green },
            { icon: '\uD83D\uDCC5', title: 'Agenda Intelligent', desc: 'RDV oublies, double-bookings, rappels rates ? Agenda synchronise avec Google Cal, rappels auto et vue equipe integree.', color: C.purple },
            { icon: '\uD83D\uDD17', title: 'Integrations API', desc: 'Vous ressaisissez les memes donnees dans 5 outils differents ? Stripe, PayPal, Qonto, HubSpot, Pipedrive, Notion — un clic, tout se synchronise.', color: C.accent },
            { icon: '\uD83D\uDD12', title: 'Securite & RGPD', desc: 'Vos donnees clients dans un Google Sheet partage ? Non. Hebergement EU, chiffrement AES-256, conformite RGPD native.', color: C.red },
          ].map((feat, i) => (
            <RevealDiv key={feat.title} delay={i * 0.08}>
              <div className="ld-card" style={{ height: '100%' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                  background: `${feat.color}15`, border: `1px solid ${feat.color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  {feat.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: C.text }}>{feat.title}</h3>
                <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.65, margin: 0 }}>{feat.desc}</p>
              </div>
            </RevealDiv>
          ))}
        </div>
      </Sect>


      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <Sect>
        <RevealDiv>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Comment ca marche
            </p>
            <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -.5 }}>
              2 minutes. <span className="ld-grad-text">C'est tout.</span>
            </h2>
            <p style={{ fontSize: 14, color: C.textSec, marginTop: 10, maxWidth: 480, margin: '10px auto 0' }}>
              Pas de formation, pas de consultant, pas de migration de 3 mois. Vous commencez maintenant.
            </p>
          </div>
        </RevealDiv>

        <div className="ld-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { step: '01', title: 'Creez votre compte', desc: 'Entrez votre email, choisissez un forfait. 30 secondes, pas un formulaire de 15 champs.', icon: '\u26A1' },
            { step: '02', title: 'Branchez vos outils', desc: 'Stripe, Revolut, Google Cal, GHL — un clic par outil. Vos donnees remontent en temps reel, sans ressaisie.', icon: '\uD83D\uDD17' },
            { step: '03', title: 'Arretez de subir, pilotez', desc: 'Vision 360° instantanee. Vous voyez ce qui fonctionne, ce qui coince, et vous agissez. Enfin.', icon: '\uD83D\uDE80' },
          ].map((s, i) => (
            <RevealDiv key={s.step} delay={i * 0.15}>
              <div style={{ textAlign: 'center', padding: '0 12px' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 20, margin: '0 auto 20px',
                  background: C.surface, border: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, position: 'relative',
                }}>
                  {s.icon}
                  <div style={{
                    position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 7,
                    background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: '#fff',
                  }}>{s.step}</div>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            </RevealDiv>
          ))}
        </div>
      </Sect>


      {/* ══════════════ INTEGRATIONS ══════════════ */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <Sect>
          <RevealDiv>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Ecosysteme
              </p>
              <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -.5 }}>
                Arretez de copier-coller<br /><span className="ld-grad-text">entre vos outils</span>
              </h2>
              <p style={{ fontSize: 14, color: C.textSec, marginTop: 10 }}>
                Un clic = vos donnees remontent. Pas d'export CSV, pas de Zapier, pas de bricolage.
              </p>
            </div>
          </RevealDiv>

          {/* Integration categories */}
          {[
            { label: 'Paiements & E-commerce', items: [
              { name: 'Stripe', icon: '\uD83D\uDCB3', color: '#635bff' },
              { name: 'PayPal', icon: '\uD83C\uDD7F\uFE0F', color: '#003087' },
              { name: 'Shopify', icon: '\uD83D\uDECD\uFE0F', color: '#96bf48' },
              { name: 'WooCommerce', icon: '\uD83D\uDED2', color: '#7f54b3' },
            ]},
            { label: 'Banque & Comptabilite', items: [
              { name: 'Revolut', icon: '\uD83C\uDFE6', color: '#0075eb' },
              { name: 'Qonto', icon: '\uD83C\uDFDB\uFE0F', color: '#5C2D91' },
              { name: 'Shine', icon: '\u2728', color: '#FF6B00' },
              { name: 'Bunq', icon: '\uD83D\uDC30', color: '#3ab553' },
              { name: 'N26', icon: '\uD83D\uDD22', color: '#36a18b' },
              { name: 'QuickBooks', icon: '\uD83D\uDCD7', color: '#2ca01c' },
              { name: 'Xero', icon: '\uD83D\uDCD8', color: '#13b5ea' },
            ]},
            { label: 'CRM', items: [
              { name: 'GoHighLevel', icon: '\uD83D\uDCC8', color: '#f97316' },
              { name: 'HubSpot', icon: '\uD83D\uDFE0', color: '#ff7a59' },
              { name: 'Salesforce', icon: '\u2601\uFE0F', color: '#00a1e0' },
              { name: 'Pipedrive', icon: '\uD83D\uDFE2', color: '#25292c' },
              { name: 'Zoho', icon: '\uD83D\uDD34', color: '#e42527' },
              { name: 'Brevo', icon: '\uD83D\uDC8C', color: '#0b996e' },
              { name: 'Axonaut', icon: '\uD83D\uDD27', color: '#2563eb' },
            ]},
            { label: 'Marketing & Automation', items: [
              { name: 'ActiveCampaign', icon: '\u26A1', color: '#356ae6' },
              { name: 'Mailchimp', icon: '\uD83D\uDC35', color: '#ffe01b' },
              { name: 'Klaviyo', icon: '\uD83D\uDCE7', color: '#1a1a2e' },
              { name: 'Sendinblue', icon: '\uD83D\uDC99', color: '#0092ff' },
              { name: 'Lemlist', icon: '\uD83C\uDF4B', color: '#6c5ce7' },
              { name: 'SystemeIO', icon: '\uD83D\uDE80', color: '#3b82f6' },
              { name: 'ClickFunnels', icon: '\uD83D\uDD3B', color: '#e44d26' },
            ]},
            { label: 'Projet & Communication', items: [
              { name: 'Monday', icon: '\uD83D\uDCCB', color: '#6161ff' },
              { name: 'Asana', icon: '\uD83C\uDFAF', color: '#f06a6a' },
              { name: 'Notion', icon: '\uD83D\uDCDD', color: '#999' },
              { name: 'Trello', icon: '\uD83D\uDCCC', color: '#0079bf' },
              { name: 'Jira', icon: '\uD83D\uDD37', color: '#0052cc' },
              { name: 'Slack', icon: '\uD83D\uDCAC', color: '#4a154b' },
            ]},
            { label: 'Publicite', items: [
              { name: 'Meta Ads', icon: '\uD83D\uDCE3', color: '#0668e1' },
              { name: 'Google Ads', icon: '\uD83D\uDD0D', color: '#4285f4' },
              { name: 'TikTok Ads', icon: '\uD83C\uDFB5', color: '#010101' },
              { name: 'LinkedIn Ads', icon: '\uD83D\uDCBC', color: '#0077b5' },
            ]},
            { label: 'Support Client', items: [
              { name: 'Zendesk', icon: '\uD83C\uDFA7', color: '#03363d' },
              { name: 'Freshdesk', icon: '\uD83D\uDFE9', color: '#2ca04e' },
              { name: 'Intercom', icon: '\uD83D\uDCAC', color: '#286efa' },
            ]},
          ].map((cat, ci) => (
            <RevealDiv key={cat.label} delay={ci * 0.1}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, textAlign: 'center' }}>
                  {cat.label}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {cat.items.map((ig) => (
                    <div key={ig.name} style={{
                      background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12,
                      padding: '12px 16px', textAlign: 'center', minWidth: 90,
                      transition: 'all .3s ease', cursor: 'default',
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, margin: '0 auto 8px',
                        background: `${ig.color}18`, border: `1px solid ${ig.color}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                      }}>{ig.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{ig.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </RevealDiv>
          ))}

          <RevealDiv delay={0.5}>
            <p style={{ textAlign: 'center', fontSize: 12, color: C.textMuted, marginTop: 12 }}>
              + Webhooks &amp; API REST — pour ceux qui veulent aller encore plus loin
            </p>
          </RevealDiv>
        </Sect>
      </section>


      {/* ══════════════ PRICING ══════════════ */}
      <Sect id="pricing">
        <RevealDiv>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Tarifs
            </p>
            <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: -.5, margin: '0 0 10px' }}>
              Moins cher que votre stack actuelle.<br /><span className="ld-grad-text">Plus puissant aussi.</span>
            </h2>
            <p style={{ fontSize: 14, color: C.textSec }}>
              Vous payez deja pour 5 outils separes. HubScale les remplace tous — pour une fraction du prix.
            </p>
          </div>
        </RevealDiv>

        {/* Toggle */}
        <RevealDiv delay={0.1}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '24px 0 40px' }}>
            <span style={{ fontSize: 13, fontWeight: annual ? 500 : 700, color: annual ? C.textMuted : C.text }}>Mensuel</span>
            <div onClick={() => setAnnual((a) => !a)} style={{
              width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative',
              background: annual ? GRAD : C.surface2, border: `1px solid ${annual ? 'transparent' : C.border}`,
              transition: 'all .2s ease',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 9, background: '#fff',
                position: 'absolute', top: 2, left: annual ? 22 : 3,
                transition: 'left .2s ease', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
              }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: annual ? 700 : 500, color: annual ? C.text : C.textMuted }}>
              Annuel
            </span>
            <span style={{
              fontSize: 10, fontWeight: 800, color: C.green,
              background: `${C.green}18`, padding: '3px 8px', borderRadius: 6,
            }}>-20%</span>
          </div>
        </RevealDiv>

        {/* Plans */}
        <div className="ld-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'start' }}>
          {PLANS.map((plan, i) => {
            const price = annual ? Math.round(plan.monthly * 0.8) : plan.monthly;
            const pop = plan.recommended;
            return (
              <RevealDiv key={plan.id} delay={i * 0.1}>
                <div className={`ld-pricing-card ${pop ? 'ld-pricing-pop' : ''}`}>
                  {pop && (
                    <div style={{
                      position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                      background: GRAD, color: '#fff', padding: '4px 16px', borderRadius: 20,
                      fontSize: 10, fontWeight: 800, letterSpacing: .5, whiteSpace: 'nowrap',
                    }}>LE PLUS POPULAIRE</div>
                  )}
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{plan.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 46, fontWeight: 900, color: C.text }}>{price}</span>
                      <span style={{ fontSize: 14, color: C.textMuted, fontWeight: 500 }}>\u20ac/mois</span>
                    </div>
                    {annual && (
                      <div style={{ fontSize: 12, color: C.green, fontWeight: 600, marginTop: 2 }}>
                        {plan.monthly * 12}\u20ac \u2192 {price * 12}\u20ac/an
                      </div>
                    )}
                  </div>

                  <button className={`ld-btn ${pop ? 'ld-btn-primary' : 'ld-btn-secondary'}`}
                    onClick={() => onSignup(plan.id)}
                    style={{ width: '100%', padding: '12px 0', fontSize: 14, marginBottom: 24 }}>
                    {pop ? 'Demarrer maintenant' : 'Choisir ce plan'}
                  </button>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.features.map((f) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ color: C.green, fontSize: 13, flexShrink: 0, marginTop: 1 }}>{'\u2713'}</span>
                        <span style={{ fontSize: 13, color: C.textSec, lineHeight: 1.4 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </RevealDiv>
            );
          })}
        </div>
      </Sect>


      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section id="testimonials" style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <Sect>
          <RevealDiv>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.purple, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Temoignages
              </p>
              <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -.5 }}>
                Ils galéraient comme vous.<br /><span className="ld-grad-text">Ils ont change.</span>
              </h2>
            </div>
          </RevealDiv>

          <div className="ld-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              {
                quote: 'On perdait des leads parce qu\'on oubliait de les relancer. Depuis HubScale, le pipeline est visible, les rappels sont auto. On a signe 30% de plus en 3 mois.',
                name: 'Marie Laurent', role: 'CEO @ TechVision', color: C.orange,
              },
              {
                quote: 'Je decouvrais les problemes de tresorerie avec 2 semaines de retard. Maintenant, j\'ai une alerte avant que ca devienne critique. Le ROI est immediat.',
                name: 'Thomas Dubois', role: 'CFO @ DataFlow SAS', color: C.green,
              },
              {
                quote: 'On payait 450\u20ac/mois pour Pipedrive + Pennylane + Calendly + Zapier. HubScale fait tout ca pour 249\u20ac. Et ca marche mieux.',
                name: 'Sophie Martin', role: 'COO @ CloudNine', color: C.purple,
              },
            ].map((t, i) => (
              <RevealDiv key={t.name} delay={i * 0.1}>
                <div className="ld-testi" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Stars */}
                  <div style={{ marginBottom: 14 }}>
                    {[...Array(5)].map((_, j) => (
                      <span key={j} style={{ fontSize: 14, color: '#f59e0b' }}>{'\u2605'}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.7, margin: '0 0 20px', flex: 1, fontStyle: 'italic' }}>
                    "{t.quote}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 20, flexShrink: 0,
                      background: `${t.color}20`, border: `1px solid ${t.color}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14, color: t.color,
                    }}>{t.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </RevealDiv>
            ))}
          </div>
        </Sect>
      </section>


      {/* ══════════════ FAQ ══════════════ */}
      <Sect id="faq">
        <RevealDiv>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              FAQ
            </p>
            <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -.5 }}>
              Vous hesitez encore ?
            </h2>
          </div>
        </RevealDiv>

        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { q: 'Je ne veux pas payer avant d\'avoir teste — c\'est possible ?', a: 'Bien sur. 14 jours d\'essai gratuit. Une CB est requise pour activer l\'essai, mais aucun debit avant la fin de la periode. Annulez en 1 clic.' },
            { q: 'Mes donnees sensibles sont vraiment en securite ?', a: 'Hebergement 100% europeen (AWS eu-west), chiffrement AES-256 au repos et en transit, conformite RGPD et SOC 2 Type II. Plus secure que votre Google Sheet partage.' },
            { q: 'J\'ai pas le temps de migrer — ca prend combien de temps ?', a: '2 minutes pour creer votre espace. Les integrations se connectent en un clic. Import CSV pour vos contacts existants en moins de 5 minutes. Pas de consultant, pas de formation.' },
            { q: 'J\'utilise deja Pipedrive / Pennylane / autre — je peux migrer ?', a: 'Oui. Import CSV/Excel pour les contacts, et notre equipe vous accompagne gratuitement dans la migration sur les plans Professional et Enterprise.' },
            { q: 'Et si ca me plait pas ? Je suis bloque ?', a: 'Zero engagement. Mensuel ou annuel, vous annulez quand vous voulez depuis votre espace. Les plans annuels sont rembourses au prorata. Pas de piege.' },
            { q: 'J\'ai un probleme a 23h — qui me repond ?', a: 'Starter : email sous 24h. Professional : support prioritaire sous 4h + chat live. Enterprise : account manager dedie + SLA garanti sous 1h, 7j/7.' },
          ].map((faq, i) => (
            <RevealDiv key={i} delay={i * 0.05}>
              <FaqItem q={faq.q} a={faq.a} />
            </RevealDiv>
          ))}
        </div>
      </Sect>


      {/* ══════════════ FINAL CTA ══════════════ */}
      <section style={{ padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* BG gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(249,115,22,.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        <RevealDiv>
          <div style={{
            maxWidth: 680, margin: '0 auto', textAlign: 'center',
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24,
            padding: '52px 40px', position: 'relative',
            boxShadow: '0 32px 80px rgba(0,0,0,.3)',
          }}>
            {/* Glow */}
            <div style={{
              position: 'absolute', inset: -1, borderRadius: 25, zIndex: -1,
              background: 'conic-gradient(from 0deg at 50% 50%, #f97316 0deg, #6366f1 180deg, #f97316 360deg)',
              opacity: .08, filter: 'blur(30px)',
            }} />

            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -.5, margin: '0 0 12px', lineHeight: 1.2 }}>
              Chaque jour sans HubScale,<br />
              <span className="ld-grad-text">c'est du temps et de l'argent perdus.</span>
            </h2>
            <p style={{ fontSize: 15, color: C.textSec, lineHeight: 1.7, margin: '0 0 28px' }}>
              850+ entreprises ont deja repris le controle. Dans 2 minutes, vous pouvez etre la prochaine.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="ld-btn ld-btn-primary" onClick={() => onSignup()}
                style={{ padding: '14px 36px', fontSize: 15 }}>
                Reprendre le controle
                <span style={{ fontSize: 18 }}>{'\u2192'}</span>
              </button>
              <button className="ld-btn ld-btn-secondary" onClick={onLogin}
                style={{ padding: '14px 28px', fontSize: 15 }}>
                Se connecter
              </button>
            </div>
            <p style={{ fontSize: 12, color: C.textMuted, marginTop: 16 }}>
              14 jours gratuits &middot; Setup en 2 min &middot; Annulez en 1 clic
            </p>
          </div>
        </RevealDiv>
      </section>


      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '48px 24px 32px', background: C.surface }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="ld-footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, background: GRAD,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 14, color: '#fff',
                }}>H</div>
                <span style={{ fontWeight: 800, fontSize: 16, color: C.text }}>HubScale</span>
              </div>
              <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7, maxWidth: 260 }}>
                Le dashboard B2B qui remplace votre chaos d'outils. CRM, finances, agenda et integrations — en un seul endroit.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>Produit</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Dashboard', 'CRM', 'Data', 'Agenda', 'Integrations'].map((l) => (
                  <span key={l} style={{ fontSize: 13, color: C.textSec, cursor: 'pointer' }}>{l}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>Societe</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['A propos', 'Blog', 'Carriere', 'Contact', 'Partenaires'].map((l) => (
                  <span key={l} style={{ fontSize: 13, color: C.textSec, cursor: 'pointer' }}>{l}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>Legal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['CGV', 'Confidentialite', 'RGPD', 'Mentions legales', 'Cookies'].map((l) => (
                  <span key={l} style={{ fontSize: 13, color: C.textSec, cursor: 'pointer' }}>{l}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: `1px solid ${C.border}`, paddingTop: 24, flexWrap: 'wrap', gap: 12,
          }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>
              \u00a9 {new Date().getFullYear()} HubScale. Tous droits reserves. Fait avec {'\u2764'} en France.
            </span>
            <div style={{ display: 'flex', gap: 16 }}>
              {['Twitter', 'LinkedIn', 'GitHub'].map((s) => (
                <span key={s} style={{ fontSize: 12, color: C.textMuted, cursor: 'pointer' }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
