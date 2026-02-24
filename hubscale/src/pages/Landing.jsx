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
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const h = () => { setScrolled(window.scrollY > 20); setPastHero(window.scrollY > 600); };
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
  .ld-testi-grid{grid-template-columns:1fr 1fr!important}
  .ld-avant-grid{grid-template-columns:1fr!important}
  .ld-avant-grid>div:nth-child(2){display:none}
}
@media(max-width:480px){
  .ld-hero-h1{font-size:28px!important}
  .ld-stats-grid{grid-template-columns:1fr!important}
  .ld-avant-grid{grid-template-columns:1fr!important}
  .ld-testi-grid{grid-template-columns:1fr!important}
}
.ld-trust-badge{display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;background:${C.surface};border:1px solid ${C.border};transition:all .3s ease}
.ld-trust-badge:hover{border-color:${C.accent}44;transform:translateY(-2px)}
.ld-avant-card{background:${C.surface};border:2px solid ${C.border};border-radius:20px;padding:32px 28px;transition:all .3s ease;position:relative}
.ld-avant-card:hover{transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,.3)}
.ld-avatar-stack{display:flex}
.ld-avatar-stack>div{margin-left:-8px;border:2px solid ${C.bg}}
.ld-avatar-stack>div:first-child{margin-left:0}
@keyframes ldCountUp{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
.ld-metric-highlight{animation:ldCountUp .5s ease forwards}
@keyframes ldPulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.3)}50%{box-shadow:0 0 0 8px rgba(34,197,94,0)}}
.ld-live-dot{animation:ldPulse 2s ease-in-out infinite}
.ld-strike{text-decoration:line-through;opacity:.5}
@media(max-width:768px){
  .ld-avant-grid{grid-template-columns:1fr!important}
  .ld-testi-grid{grid-template-columns:1fr!important}
  .ld-trust-row{flex-wrap:wrap!important}
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
            {[['Fonctionnalités', 'features'], ['Tarifs', 'pricing'], ['Témoignages', 'testimonials'], ['FAQ', 'faq']].map(([label, id]) => (
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
            {[['Fonctionnalités', 'features'], ['Tarifs', 'pricing'], ['Témoignages', 'testimonials'], ['FAQ', 'faq']].map(([label, id]) => (
              <button key={id} className="ld-nav-link" onClick={() => scrollTo(id)}
                style={{ textAlign: 'left', padding: '8px 0', fontSize: 15 }}>{label}</button>
            ))}
          </div>
        )}
      </nav>

      {/* ══════════════ STICKY CTA BAR ══════════════ */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99,
        padding: '10px 24px',
        background: 'rgba(9,9,11,.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderTop: `1px solid ${C.border}`,
        transform: pastHero ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform .35s ease',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#fff' }}>H</div>
            <span style={{ fontSize: 13, color: C.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: C.green, fontWeight: 700 }}>{'\u2713'}</span> 14 jours gratuits
              <span style={{ color: C.textMuted }}>&middot;</span> Sans carte bancaire
            </span>
          </div>
          <button className="ld-btn ld-btn-primary" onClick={() => onSignup()}
            style={{ padding: '8px 24px', fontSize: 13 }}>
            Essai gratuit
            <span style={{ fontSize: 14 }}>{'\u2192'}</span>
          </button>
        </div>
      </div>


      {/* ══════════════ HERO ══════════════ */}
      <section className="ld-hero-bg" style={{ position: 'relative', paddingTop: 120, paddingBottom: 40, textAlign: 'center' }}>
        {/* Orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,.08), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', right: '10%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,.08), transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          {/* Social proof badge with avatar stack */}
          <RevealDiv>
            <div className="ld-shine" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '6px 16px 6px 8px', borderRadius: 40, background: C.surface,
              border: `1px solid ${C.border}`, marginBottom: 24,
            }}>
              <div className="ld-avatar-stack" style={{ display: 'flex' }}>
                {['#f97316', '#6366f1', '#22c55e', '#a855f7', '#3b82f6'].map((bg, i) => (
                  <div key={i} style={{
                    width: 24, height: 24, borderRadius: 12, background: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#fff',
                    marginLeft: i === 0 ? 0 : -8, border: `2px solid ${C.bg}`,
                    position: 'relative', zIndex: 5 - i,
                  }}>
                    {['M', 'T', 'S', 'A', 'L'][i]}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="ld-live-dot" style={{
                  width: 6, height: 6, borderRadius: 3, background: C.green,
                  boxShadow: `0 0 8px ${C.green}`,
                }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>
                  <strong style={{ color: C.text }}>847 dirigeants</strong> voient leurs vrais chiffres en temps réel
                </span>
              </div>
            </div>
          </RevealDiv>

          {/* Headline */}
          <RevealDiv delay={0.1}>
            <h1 className="ld-hero-h1" style={{
              fontSize: 56, fontWeight: 900, lineHeight: 1.1,
              letterSpacing: -1.5, margin: '0 0 20px',
            }}>
              Vous ne connaissez pas<br />
              <span className="ld-grad-text">vos vrais chiffres.</span>
            </h1>
          </RevealDiv>

          <RevealDiv delay={0.2}>
            <p className="ld-hero-sub" style={{
              fontSize: 18, color: C.textSec, lineHeight: 1.7,
              maxWidth: 560, margin: '0 auto 36px',
            }}>
              CA, trésorerie, pipeline, agenda — éparpillés dans 5 outils. Vous décidez à l'aveugle.
              <br /><strong style={{ color: C.text }}>HubScale centralise tout : vos chiffres réels, d'un coup d'oeil.</strong>
            </p>
          </RevealDiv>

          {/* CTAs */}
          <RevealDiv delay={0.3}>
            <div className="ld-hero-btns" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="ld-btn ld-btn-primary" onClick={() => onSignup()}
                style={{ padding: '14px 32px', fontSize: 15 }}>
                Voir mes vrais chiffres
                <span style={{ fontSize: 18 }}>{'\u2192'}</span>
              </button>
              <button className="ld-btn ld-btn-secondary" onClick={() => scrollTo('demo')}
                style={{ padding: '14px 28px', fontSize: 15 }}>
                Voir la démo
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
              {[
                { icon: '\u2713', text: 'Sans carte bancaire' },
                { icon: '\u2713', text: 'Setup en 2 min' },
                { icon: '\u2713', text: 'Annulez en 1 clic' },
              ].map((item) => (
                <span key={item.text} style={{ fontSize: 12, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: C.green, fontWeight: 700 }}>{item.icon}</span> {item.text}
                </span>
              ))}
            </div>
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
      <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '28px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>Ils en parlent</span>
            {[
              { name: 'BPI France', icon: '\uD83C\uDDEB\uD83C\uDDF7' },
              { name: 'Station F', icon: '\uD83D\uDE80' },
              { name: 'Maddyness', icon: '\uD83D\uDCF0' },
              { name: 'FrenchWeb', icon: '\uD83C\uDF10' },
              { name: 'Journal du Net', icon: '\uD83D\uDCBB' },
              { name: 'Les Echos Start', icon: '\uD83D\uDCC8' },
            ].map((pub) => (
              <div key={pub.name} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8,
                background: C.surface, border: `1px solid ${C.border}`,
              }}>
                <span style={{ fontSize: 14 }}>{pub.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.textMuted }}>{pub.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════ TRUST BADGES ══════════════ */}
      <section style={{ padding: '32px 24px', background: C.bg }}>
        <div className="ld-trust-row" style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {[
            { icon: '\uD83C\uDDEA\uD83C\uDDFA', label: 'Hébergé en Europe', sub: 'AWS eu-west', color: C.blue },
            { icon: '\uD83D\uDD12', label: 'Chiffrement AES-256', sub: 'repos + transit', color: C.green },
            { icon: '\uD83D\uDEE1\uFE0F', label: 'Conforme RGPD', sub: 'DPA inclus', color: C.purple },
            { icon: '\u2705', label: 'SOC 2 Type II', sub: 'audit certifié', color: C.orange },
            { icon: '\u23F0', label: 'SLA 99.9%', sub: 'uptime garanti', color: C.accent },
          ].map((badge) => (
            <div key={badge.label} className="ld-trust-badge">
              <span style={{ fontSize: 18 }}>{badge.icon}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: badge.color }}>{badge.label}</div>
                <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: .3 }}>{badge.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ══════════════ STATS ══════════════ */}
      <Sect>
        <div className="ld-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
          {[
            { value: 850, suffix: '+', label: 'Dirigeants qui voient enfin leurs vrais chiffres', color: C.orange },
            { value: 1, prefix: '', suffix: ' écran', label: 'Pour toutes vos données essentielles', color: C.green },
            { value: 99, suffix: '.9%', label: 'Uptime — vos chiffres, toujours à jour', color: C.blue },
            { value: 4, suffix: '.8/5', label: 'Note moyenne — "enfin de la clarté"', color: C.purple },
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


      {/* ══════════════ AVANT / APRES ══════════════ */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <Sect>
          <RevealDiv>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Avant / Apres
              </p>
              <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -.5 }}>
                Vos chiffres sont éparpillés.<br /><span className="ld-grad-text">Vous décidez à l'aveugle.</span>
              </h2>
            </div>
          </RevealDiv>

          <div className="ld-avant-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'stretch', maxWidth: 900, margin: '0 auto' }}>
            {/* SANS HUBSCALE */}
            <RevealDiv>
              <div className="ld-avant-card" style={{ borderColor: `${C.red}44`, height: '100%' }}>
                <div style={{
                  display: 'inline-flex', padding: '4px 12px', borderRadius: 8,
                  background: `${C.red}15`, color: C.red, fontSize: 10, fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: .5, marginBottom: 20,
                }}>Sans HubScale</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { icon: '\uD83D\uDCC9', text: 'CA dans Stripe, charges dans votre banque', issue: 'Pas de vision globale' },
                    { icon: '\uD83D\uDC65', text: 'Contacts dans votre CRM, deals dans un tableur', issue: 'Pipeline flou' },
                    { icon: '\uD83D\uDCC5', text: 'RDV dans Google Cal, relances dans votre tête', issue: 'Oublis garantis' },
                    { icon: '\uD83D\uDCCA', text: 'Reporting à la main, chiffres jamais à jour', issue: 'Décisions a l\'aveugle' },
                    { icon: '\u23F3', text: 'Des heures à jongler entre onglets et exports', issue: 'Temps perdu' },
                  ].map((item) => (
                    <div key={item.text} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 12px', borderRadius: 10, background: `${C.red}08`,
                      border: `1px solid ${C.red}15`,
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.4 }}>{item.text}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.red, marginTop: 2 }}>{item.issue}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 16, padding: '10px 14px', borderRadius: 10,
                  background: `${C.red}10`, border: `1px solid ${C.red}20`,
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.red }}>
                    5+ outils. 0 vision d'ensemble.
                  </span>
                </div>
              </div>
            </RevealDiv>

            {/* ARROW */}
            <RevealDiv delay={0.2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 28, background: GRAD,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, color: '#fff', boxShadow: '0 8px 32px rgba(249,115,22,.3)',
                flexShrink: 0,
              }}>{'\u2192'}</div>
            </RevealDiv>

            {/* AVEC HUBSCALE */}
            <RevealDiv delay={0.15}>
              <div className="ld-avant-card" style={{ borderColor: `${C.green}44`, height: '100%' }}>
                <div style={{
                  display: 'inline-flex', padding: '4px 12px', borderRadius: 8,
                  background: `${C.green}15`, color: C.green, fontSize: 10, fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: .5, marginBottom: 20,
                }}>Avec HubScale</div>
                <div style={{ padding: '8px 0' }}>
                  {/* Hub visual */}
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 16, background: GRAD,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: 22, color: '#fff', margin: '0 auto 10px',
                      boxShadow: '0 8px 32px rgba(249,115,22,.25)',
                    }}>H</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: .5 }}>
                      Toutes vos sources connectées
                    </div>
                  </div>
                  {/* Connected sources */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 18 }}>
                    {['Stripe', 'Revolut', 'HubSpot', 'Google Cal', 'Qonto', 'Meta Ads'].map((src) => (
                      <span key={src} style={{
                        fontSize: 10, fontWeight: 600, color: C.text,
                        padding: '4px 10px', borderRadius: 8,
                        background: C.surface2, border: `1px solid ${C.border}`,
                      }}>{src}</span>
                    ))}
                  </div>
                  {/* Results */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { icon: '\u2705', text: 'CA, charges, marges — toujours à jour', detail: 'Temps réel' },
                      { icon: '\u2705', text: 'Pipeline CRM complet avec lead scoring', detail: 'Vision 360' },
                      { icon: '\u2705', text: 'Agenda unifié, relances automatiques', detail: 'Zéro oubli' },
                      { icon: '\u2705', text: 'Un seul écran pour toutes vos décisions', detail: 'Clarté totale' },
                    ].map((r) => (
                      <div key={r.text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>{r.icon}</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 12, color: C.textSec }}>{r.text}</span>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, color: C.green, background: `${C.green}15`, padding: '2px 6px', borderRadius: 4 }}>{r.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{
                  marginTop: 16, padding: '10px 14px', borderRadius: 10,
                  background: `${C.green}12`, border: `1px solid ${C.green}25`,
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>
                    Gardez vos outils. Voyez enfin tout au même endroit.
                  </span>
                </div>
              </div>
            </RevealDiv>
          </div>
        </Sect>
      </section>


      {/* ══════════════ FEATURES ══════════════ */}
      <Sect id="features" style={{ paddingTop: 40 }}>
        <RevealDiv>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Fonctionnalités
            </p>
            <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: -.5, lineHeight: 1.15, margin: '0 0 14px' }}>
              Toutes vos datas essentielles.<br />
              <span style={{ color: C.textSec }}>Un seul écran, des décisions claires.</span>
            </h2>
          </div>
        </RevealDiv>

        <div className="ld-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {[
            { icon: '\uD83D\uDCCA', title: 'Dashboard temps réel', desc: 'CA, MRR, trésorerie, pipeline — vos KPIs essentiels sur un seul écran. Vous ouvrez HubScale et vous savez exactement où vous en êtes.', color: C.orange },
            { icon: '\uD83D\uDC65', title: 'CRM Pipeline', desc: 'Visualisez chaque deal en cours, son montant, son avancement. Lead scoring automatique et relances programmées. Vous savez qui relancer et quand.', color: C.blue },
            { icon: '\uD83D\uDCB0', title: 'Data Financière', desc: 'Revenus, charges, marges — mois par mois, en temps réel. Plus besoin d\'attendre votre comptable pour savoir si le mois est bon.', color: C.green },
            { icon: '\uD83D\uDCC5', title: 'Agenda Intelligent', desc: 'RDV clients, deadlines, appels — tout au même endroit. Synchro Google Cal, rappels auto. Vous ne ratez plus rien.', color: C.purple },
            { icon: '\uD83D\uDD17', title: 'Intégrations API', desc: 'Stripe, Revolut, Qonto, HubSpot, Pipedrive — vos données remontent automatiquement. Zéro ressaisie, zéro copier-coller.', color: C.accent },
            { icon: '\uD83D\uDD12', title: 'Sécurité & RGPD', desc: 'Vos données business méritent mieux qu\'un Google Sheet. Hébergement EU, chiffrement AES-256, conformité RGPD native.', color: C.red },
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


      {/* ══════════════ POUR QUI ? ══════════════ */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <Sect>
          <RevealDiv>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.purple, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Pour qui ?
              </p>
              <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -.5 }}>
                Vous vous reconnaissez ?<br /><span className="ld-grad-text">HubScale est fait pour vous.</span>
              </h2>
            </div>
          </RevealDiv>

          <div className="ld-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18, maxWidth: 900, margin: '0 auto' }}>
            {[
              {
                icon: '\uD83D\uDE80', title: 'Freelances & Solopreneurs',
                pain: 'Vous jonglez entre Stripe, votre banque, un CRM et 3 tableurs. Vous ne savez jamais exactement combien vous gagnez ce mois-ci.',
                solve: 'Un seul écran avec votre CA, vos factures, votre pipeline et votre trésorerie. En temps réel.',
                color: C.orange,
              },
              {
                icon: '\uD83C\uDFE2', title: 'Dirigeants de PME',
                pain: 'Vos données sont dans 5 outils différents. Vous demandez à 3 personnes pour avoir un chiffre fiable. Les décisions prennent trop de temps.',
                solve: 'Toute la data de votre entreprise centralisée. Vous ouvrez HubScale et vous savez où vous en êtes.',
                color: C.blue,
              },
              {
                icon: '\uD83D\uDCBC', title: 'Agences & ESN',
                pain: 'Chaque client est un projet, chaque projet a son budget. Impossible de voir la rentabilité globale sans un marathon Excel.',
                solve: 'Pipeline pondéré, P&L par mois, catalogue de services et facturation intégrée. La rentabilité en un coup d\'oeil.',
                color: C.green,
              },
              {
                icon: '\uD83D\uDED2', title: 'E-commerçants',
                pain: 'Shopify, Meta Ads, Stripe, votre comptable... vos données sont partout sauf au même endroit. Vous ne savez pas quel canal est rentable.',
                solve: 'Revenus, dépenses pub, marges par canal — tout centralisé. Vous voyez ce qui rapporte et ce qui coûte.',
                color: C.purple,
              },
            ].map((p, i) => (
              <RevealDiv key={p.title} delay={i * 0.1}>
                <div className="ld-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: `${p.color}15`, border: `1px solid ${p.color}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                    }}>{p.icon}</div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: p.color }}>{p.title}</h3>
                  </div>
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, marginBottom: 12,
                    background: `${C.red}06`, border: `1px solid ${C.red}12`,
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>La douleur</div>
                    <p style={{ fontSize: 12, color: C.textSec, lineHeight: 1.55, margin: 0 }}>{p.pain}</p>
                  </div>
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, flex: 1,
                    background: `${C.green}06`, border: `1px solid ${C.green}12`,
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Avec HubScale</div>
                    <p style={{ fontSize: 12, color: C.textSec, lineHeight: 1.55, margin: 0 }}>{p.solve}</p>
                  </div>
                </div>
              </RevealDiv>
            ))}
          </div>
        </Sect>
      </section>


      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <Sect>
        <RevealDiv>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Comment ça marche
            </p>
            <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -.5 }}>
              2 minutes. <span className="ld-grad-text">C'est tout.</span>
            </h2>
            <p style={{ fontSize: 14, color: C.textSec, marginTop: 10, maxWidth: 480, margin: '10px auto 0' }}>
              En 2 minutes, vous passez du flou total à une vision claire de votre activité.
            </p>
          </div>
        </RevealDiv>

        <div className="ld-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { step: '01', title: 'Créez votre espace', desc: 'Email, mot de passe, c\'est parti. 30 secondes. Pas un formulaire de 15 champs.', icon: '\u26A1' },
            { step: '02', title: 'Connectez vos sources', desc: 'Stripe, Revolut, Google Cal, CRM — un clic par outil. Vos données remontent automatiquement.', icon: '\uD83D\uDD17' },
            { step: '03', title: 'Décidez avec clarté', desc: 'Vos chiffres réels apparaissent sur un seul écran. Vous voyez ce qui marche, ce qui coince, et vous décidez en connaissance de cause.', icon: '\uD83C\uDFAF' },
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
                Écosystème
              </p>
              <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -.5 }}>
                Vos données remontent<br /><span className="ld-grad-text">automatiquement.</span>
              </h2>
              <p style={{ fontSize: 14, color: C.textSec, marginTop: 10 }}>
                Connectez vos outils en un clic. Plus d'export CSV, plus de Zapier, plus de saisie manuelle.
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
            { label: 'Banque & Comptabilité', items: [
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
            { label: 'Publicité', items: [
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
              Un prix clair.<br /><span className="ld-grad-text">Toutes vos datas dedans.</span>
            </h2>
            <p style={{ fontSize: 14, color: C.textSec }}>
              Pas de supplément par module. CRM, finances, agenda, intégrations — tout est inclus.
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
                      <span style={{ fontSize: 14, color: C.textMuted, fontWeight: 500 }}>€/mois</span>
                    </div>
                    {annual && (
                      <div style={{ fontSize: 12, color: C.green, fontWeight: 600, marginTop: 2 }}>
                        {plan.monthly * 12}€ {'→'} {price * 12}€/an
                      </div>
                    )}
                  </div>

                  <button className={`ld-btn ${pop ? 'ld-btn-primary' : 'ld-btn-secondary'}`}
                    onClick={() => onSignup(plan.id)}
                    style={{ width: '100%', padding: '12px 0', fontSize: 14, marginBottom: 24 }}>
                    {pop ? 'Démarrer maintenant' : 'Choisir ce plan'}
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

      {/* ══════════════ COMPARATIF PLANS ══════════════ */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <Sect style={{ paddingTop: 40, paddingBottom: 40 }}>
          <RevealDiv>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.3, margin: '0 0 8px' }}>
                Comparez en un coup d'oeil
              </h3>
              <p style={{ fontSize: 13, color: C.textSec }}>Chaque plan inclut toutes les fonctionnalités de base.</p>
            </div>
          </RevealDiv>
          <RevealDiv delay={0.1}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', maxWidth: 800, margin: '0 auto', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 14px', color: C.textMuted, fontWeight: 600, borderBottom: `1px solid ${C.border}` }}></th>
                    {PLANS.map((plan) => (
                      <th key={plan.id} style={{
                        padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: plan.recommended ? C.orange : C.text,
                        borderBottom: `1px solid ${C.border}`,
                      }}>{plan.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feat: 'Dashboard & KPIs', vals: [true, true, true] },
                    { feat: 'CRM & Pipeline', vals: ['50 contacts', 'Illimité', 'Illimité'] },
                    { feat: 'Données financières', vals: [true, true, true] },
                    { feat: 'Agenda & Rappels', vals: [true, true, true] },
                    { feat: 'Intégrations', vals: ['3', '20', 'Illimité'] },
                    { feat: 'Facturation', vals: [false, true, true] },
                    { feat: 'P&L & Catalogue', vals: [false, true, true] },
                    { feat: 'Automatisations', vals: [false, '5 règles', 'Illimité'] },
                    { feat: 'Support', vals: ['Email', 'Prioritaire 4h', 'Dédié 1h'] },
                    { feat: 'Export & API', vals: [false, 'CSV', 'CSV + API'] },
                  ].map((row, ri) => (
                    <tr key={row.feat} style={{ background: ri % 2 === 0 ? 'transparent' : `${C.surface2}50` }}>
                      <td style={{ padding: '10px 14px', color: C.textSec, fontWeight: 500, borderBottom: `1px solid ${C.border}22` }}>{row.feat}</td>
                      {row.vals.map((v, vi) => (
                        <td key={vi} style={{ padding: '10px 14px', textAlign: 'center', borderBottom: `1px solid ${C.border}22`, color: v === false ? C.textMuted : v === true ? C.green : C.text, fontWeight: v === true || v === false ? 700 : 500 }}>
                          {v === true ? '\u2713' : v === false ? '\u2014' : v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </RevealDiv>
        </Sect>
      </section>


      {/* ══════════════ CENTRALISATION EN ACTION ══════════════ */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <Sect>
          <RevealDiv>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Centralisation
              </p>
              <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -.5 }}>
                Vos outils restent. <span className="ld-grad-text">La visibilité arrive.</span>
              </h2>
              <p style={{ fontSize: 14, color: C.textSec, marginTop: 10, maxWidth: 520, margin: '10px auto 0' }}>
                HubScale ne remplace rien. Il se connecte à vos outils existants et centralise toute la data sur un seul écran.
              </p>
            </div>
          </RevealDiv>

          <RevealDiv delay={0.1}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              {/* Flow visualization: Sources → HubScale → Results */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'center' }}>
                {/* Sources column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { cat: 'Paiements', tools: ['Stripe', 'PayPal', 'Shopify'], icon: '\uD83D\uDCB3', color: C.purple },
                    { cat: 'Banque', tools: ['Revolut', 'Qonto', 'N26'], icon: '\uD83C\uDFE6', color: C.blue },
                    { cat: 'CRM', tools: ['HubSpot', 'Pipedrive', 'Salesforce'], icon: '\uD83D\uDC65', color: C.orange },
                    { cat: 'Marketing', tools: ['Meta Ads', 'Google Ads', 'Mailchimp'], icon: '\uD83D\uDCE3', color: C.green },
                    { cat: 'Agenda', tools: ['Google Cal', 'Calendly'], icon: '\uD83D\uDCC5', color: C.accent },
                  ].map((src, i) => (
                    <RevealDiv key={src.cat} delay={0.1 + i * 0.06}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', borderRadius: 12,
                        background: C.surface2, border: `1px solid ${C.border}`,
                      }}>
                        <span style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: `${src.color}15`, border: `1px solid ${src.color}22`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                        }}>{src.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: src.color, textTransform: 'uppercase', letterSpacing: .3 }}>{src.cat}</div>
                          <div style={{ fontSize: 10, color: C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {src.tools.join(' · ')}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, color: C.textMuted }}>{'\u2192'}</span>
                      </div>
                    </RevealDiv>
                  ))}
                </div>

                {/* Central Hub */}
                <RevealDiv delay={0.4}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    {/* Converging lines visual */}
                    <div style={{
                      width: 80, height: 80, borderRadius: 22, background: GRAD,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: 32, color: '#fff',
                      boxShadow: '0 16px 48px rgba(249,115,22,.3), 0 0 0 4px rgba(249,115,22,.08)',
                      position: 'relative',
                    }}>
                      H
                      {/* Pulse ring */}
                      <div style={{
                        position: 'absolute', inset: -8, borderRadius: 26,
                        border: `2px solid ${C.orange}30`,
                        animation: 'ldPulseRing 3s ease-in-out infinite',
                      }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>HubScale</div>
                      <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: .5 }}>Centralise tout</div>
                    </div>
                  </div>
                </RevealDiv>

                {/* Results column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Dashboard unifié', desc: 'Tous vos KPIs sur 1 écran', icon: '\uD83D\uDCCA', color: C.orange },
                    { label: 'Vision financière', desc: 'CA, charges, marges temps réel', icon: '\uD83D\uDCB0', color: C.green },
                    { label: 'Pipeline clair', desc: 'Deals, scoring, prévisions', icon: '\uD83C\uDFAF', color: C.blue },
                    { label: 'Alertes intelligentes', desc: 'Relances, dépassements, objectifs', icon: '\uD83D\uDD14', color: C.purple },
                    { label: 'Décisions éclairées', desc: 'Fini le pilotage à l\'aveugle', icon: '\u2705', color: C.accent },
                  ].map((res, i) => (
                    <RevealDiv key={res.label} delay={0.5 + i * 0.06}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', borderRadius: 12,
                        background: `${res.color}08`, border: `1px solid ${res.color}18`,
                      }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{res.icon}</span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: res.color }}>{res.label}</div>
                          <div style={{ fontSize: 10, color: C.textMuted }}>{res.desc}</div>
                        </div>
                      </div>
                    </RevealDiv>
                  ))}
                </div>
              </div>

              {/* Bottom CTA */}
              <div style={{ textAlign: 'center', marginTop: 40 }}>
                <button className="ld-btn ld-btn-primary" onClick={() => onSignup()}
                  style={{ padding: '12px 28px', fontSize: 14 }}>
                  Centraliser mes données
                  <span style={{ fontSize: 16 }}>{'\u2192'}</span>
                </button>
                <p style={{ fontSize: 11, color: C.textMuted, marginTop: 10 }}>
                  60+ intégrations disponibles — connectez vos outils en 1 clic
                </p>
              </div>
            </div>
          </RevealDiv>
        </Sect>
      </section>


      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section id="testimonials" style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <Sect>
          <RevealDiv>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.purple, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Témoignages
              </p>
              <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -.5 }}>
                Ils pilotaient à l'aveugle.<br /><span className="ld-grad-text">Maintenant, ils voient clair.</span>
              </h2>
            </div>
          </RevealDiv>

          <div className="ld-testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              {
                quote: 'Avant, je demandais à 3 personnes différentes pour connaître mon CA réel. Maintenant j\'ouvre HubScale et j\'ai la réponse en 2 secondes.',
                metric: '1 écran', metricSub: 'pour toutes les datas',
                name: 'Marie Laurent', role: 'CEO @ TechVision', size: '25 employés', tag: 'Clarté', color: C.orange,
              },
              {
                quote: 'Je découvrais les trous de trésorerie 2 semaines trop tard. Maintenant, je vois le problème venir et je peux agir avant qu\'il soit trop tard.',
                metric: '-2 semaines', metricSub: 'de délai sur les alertes',
                name: 'Thomas Dubois', role: 'CFO @ DataFlow SAS', size: '80 employés', tag: 'Décision', color: C.green,
              },
              {
                quote: 'On avait nos chiffres dans 5 outils différents. Personne n\'avait la même version de la vérité. HubScale a mis tout le monde sur la même page.',
                metric: '1 source', metricSub: 'de vérité pour toute l\'équipe',
                name: 'Sophie Martin', role: 'COO @ CloudNine', size: '12 employés', tag: 'Centralisation', color: C.purple,
              },
              {
                quote: 'Le setup a pris 10 min. On a connecté Stripe et Revolut, et on a vu nos vrais chiffres pour la première fois. Un moment "wahou".',
                metric: '10 min', metricSub: 'pour voir ses vrais chiffres',
                name: 'Julien Moreau', role: 'Fondateur @ FinServ Pro', size: '8 employés', tag: 'Setup', color: C.blue,
              },
              {
                quote: 'Mon équipe commerciale n\'avait aucune visibilité sur le pipeline réel. En 1 semaine, on a identifié 15 leads oubliés et converti 4.',
                metric: '4 deals récupérés', metricSub: 'grâce à la visibilité',
                name: 'Amélie Renard', role: 'VP Sales @ AlphaDigital', size: '45 employés', tag: 'Visibilité', color: C.accent,
              },
              {
                quote: 'En comité de direction, je peux enfin présenter des chiffres fiables en temps réel. Plus de tableaux Excel douteux préparés à la dernière minute.',
                metric: '0 erreur', metricSub: 'de reporting depuis 6 mois',
                name: 'Pierre Lefèvre', role: 'DAF @ GreenTech', size: '110 employés', tag: 'Reporting', color: C.red,
              },
            ].map((t, i) => (
              <RevealDiv key={t.name} delay={i * 0.08}>
                <div className="ld-testi" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Tag + Stars */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, color: t.color, textTransform: 'uppercase',
                      letterSpacing: .5, padding: '3px 8px', borderRadius: 6,
                      background: `${t.color}15`, border: `1px solid ${t.color}22`,
                    }}>{t.tag}</span>
                    <div>
                      {[...Array(5)].map((_, j) => (
                        <span key={j} style={{ fontSize: 12, color: '#f59e0b' }}>{'\u2605'}</span>
                      ))}
                    </div>
                  </div>
                  {/* Metric highlight */}
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, marginBottom: 14,
                    background: `${t.color}08`, border: `1px solid ${t.color}18`,
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: t.color }}>{t.metric}</span>
                    <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 6 }}>{t.metricSub}</span>
                  </div>
                  <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7, margin: '0 0 16px', flex: 1, fontStyle: 'italic' }}>
                    "{t.quote}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 18, flexShrink: 0,
                      background: `${t.color}20`, border: `1px solid ${t.color}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 13, color: t.color,
                    }}>{t.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>{t.role} &middot; {t.size}</div>
                    </div>
                  </div>
                </div>
              </RevealDiv>
            ))}
          </div>
        </Sect>
      </section>


      {/* ══════════════ CAS D'ÉTUDE ══════════════ */}
      <Sect>
        <RevealDiv>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Résultats concrets
            </p>
            <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -.5 }}>
              Ce qu'ils ont gagné <span className="ld-grad-text">en centralisant.</span>
            </h2>
          </div>
        </RevealDiv>

        <div className="ld-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {[
            {
              company: 'DataFlow SAS', size: '80 employés', sector: 'SaaS B2B',
              before: '5 outils, 8h/sem de reporting manuel',
              after: '1 dashboard, reporting automatique',
              metrics: [
                { label: 'Temps gagné', value: '-8h', sub: '/semaine', color: C.green },
                { label: 'Visibilité', value: '100%', sub: 'temps réel', color: C.blue },
              ],
              quote: 'On a récupéré une journée entière par semaine.',
              author: 'Thomas D., CFO',
              color: C.green,
            },
            {
              company: 'AlphaDigital', size: '45 employés', sector: 'Agence marketing',
              before: 'Pipeline dans Pipedrive, CA dans Stripe, marges dans Excel',
              after: 'Tout centralisé, pipeline pondéré',
              metrics: [
                { label: 'Deals récupérés', value: '+15', sub: 'en 30 jours', color: C.orange },
                { label: 'CA additionnel', value: '+47k€', sub: 'en 3 mois', color: C.green },
              ],
              quote: 'On a identifié des leads oubliés dès la première semaine.',
              author: 'Amélie R., VP Sales',
              color: C.orange,
            },
            {
              company: 'FinServ Pro', size: '8 employés', sector: 'Conseil financier',
              before: 'Aucune visibilité trésorerie, découverte des trous à J+15',
              after: 'Alertes automatiques, prévisions cash',
              metrics: [
                { label: 'Délai alerte', value: '-15j', sub: 'de réaction', color: C.blue },
                { label: 'Setup', value: '10min', sub: 'connecté', color: C.purple },
              ],
              quote: 'On voit les problèmes venir 2 semaines avant.',
              author: 'Julien M., Fondateur',
              color: C.blue,
            },
          ].map((cs, i) => (
            <RevealDiv key={cs.company} delay={i * 0.12}>
              <div className="ld-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 2px' }}>{cs.company}</h4>
                    <span style={{ fontSize: 10, color: C.textMuted }}>{cs.size} &middot; {cs.sector}</span>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 800, color: cs.color, textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 6, background: `${cs.color}15`, border: `1px solid ${cs.color}22`,
                  }}>Cas réel</span>
                </div>

                {/* Before/After */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ color: C.red, fontWeight: 700, flexShrink: 0 }}>{'\u2717'}</span>
                    <span>{cs.before}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.textSec, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ color: C.green, fontWeight: 700, flexShrink: 0 }}>{'\u2713'}</span>
                    <span>{cs.after}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {cs.metrics.map((m) => (
                    <div key={m.label} style={{
                      padding: '10px 8px', borderRadius: 10, textAlign: 'center',
                      background: `${m.color}08`, border: `1px solid ${m.color}18`,
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</div>
                      <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>{m.label}</div>
                      <div style={{ fontSize: 8, color: C.textMuted }}>{m.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Quote */}
                <p style={{ fontSize: 12, color: C.textSec, fontStyle: 'italic', lineHeight: 1.5, margin: '0 0 8px', flex: 1 }}>
                  "{cs.quote}"
                </p>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted }}>{cs.author}</span>
              </div>
            </RevealDiv>
          ))}
        </div>
      </Sect>


      {/* ══════════════ GARANTIE ══════════════ */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <Sect style={{ paddingTop: 56, paddingBottom: 56 }}>
          <RevealDiv>
            <div style={{
              maxWidth: 700, margin: '0 auto', textAlign: 'center',
              padding: '40px 32px', borderRadius: 20,
              background: `linear-gradient(135deg, ${C.green}08, ${C.blue}08)`,
              border: `2px solid ${C.green}20`,
              position: 'relative',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, margin: '0 auto 20px',
                background: `${C.green}15`, border: `2px solid ${C.green}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
              }}>{'\uD83D\uDEE1\uFE0F'}</div>
              <h3 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 12px', color: C.text }}>
                Garantie <span style={{ color: C.green }}>Zéro Risque</span>
              </h3>
              <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.7, margin: '0 0 24px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
                14 jours d'essai gratuit, sans carte bancaire. Si ça ne vous convient pas, vous ne payez rien. Sur les plans annuels, remboursement au prorata à tout moment. Zéro engagement, zéro piège.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                {[
                  { icon: '\u2705', text: '14 jours gratuits' },
                  { icon: '\uD83D\uDCB3', text: 'Sans carte bancaire' },
                  { icon: '\u21A9\uFE0F', text: 'Remboursement prorata' },
                  { icon: '\uD83D\uDD13', text: 'Annulation en 1 clic' },
                ].map((g) => (
                  <div key={g.text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{g.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{g.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </RevealDiv>
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
              Vous hésitez encore ?
            </h2>
          </div>
        </RevealDiv>

        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { q: 'Je ne veux pas payer avant d\'avoir testé — c\'est possible ?', a: 'Bien sûr. 14 jours d\'essai gratuit. Une CB est requise pour activer l\'essai, mais aucun débit avant la fin de la période. Annulez en 1 clic.' },
            { q: 'Mes données sensibles sont vraiment en sécurité ?', a: 'Hébergement 100% européen (AWS eu-west), chiffrement AES-256 au repos et en transit, conformité RGPD et SOC 2 Type II. Plus sécurisé que votre Google Sheet partagé.' },
            { q: 'J\'ai pas le temps de migrer — ça prend combien de temps ?', a: '2 minutes pour créer votre espace. Les intégrations se connectent en un clic. Import CSV pour vos contacts existants en moins de 5 minutes. Pas de consultant, pas de formation.' },
            { q: 'J\'utilise déjà Pipedrive / Pennylane / Stripe — HubScale va les remplacer ?', a: 'Non, et c\'est le principe ! HubScale se connecte à vos outils existants et centralise leurs données sur un seul écran. Vous gardez Pipedrive pour votre CRM, Stripe pour les paiements, Pennylane pour la compta — HubScale vous donne la vision d\'ensemble que ces outils ne peuvent pas offrir seuls.' },
            { q: 'Et si ça me plaît pas ? Je suis bloqué ?', a: 'Zéro engagement. Mensuel ou annuel, vous annulez quand vous voulez depuis votre espace. Les plans annuels sont remboursés au prorata. Pas de piège.' },
            { q: 'J\'ai un problème à 23h — qui me répond ?', a: 'Starter : email sous 24h. Professional : support prioritaire sous 4h + chat live. Enterprise : account manager dédié + SLA garanti sous 1h, 7j/7.' },
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
            maxWidth: 720, margin: '0 auto', textAlign: 'center',
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24,
            padding: '56px 40px', position: 'relative',
            boxShadow: '0 32px 80px rgba(0,0,0,.3)',
          }}>
            {/* Glow */}
            <div style={{
              position: 'absolute', inset: -1, borderRadius: 25, zIndex: -1,
              background: 'conic-gradient(from 0deg at 50% 50%, #f97316 0deg, #6366f1 180deg, #f97316 360deg)',
              opacity: .1, filter: 'blur(30px)',
            }} />

            <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -.5, margin: '0 0 14px', lineHeight: 1.2 }}>
              Vos vrais chiffres.<br />
              <span className="ld-grad-text">D'un coup d'oeil. En temps réel.</span>
            </h2>
            <p style={{ fontSize: 15, color: C.textSec, lineHeight: 1.7, margin: '0 0 24px' }}>
              847 dirigeants ont arrêté de piloter à l'aveugle. Centralisez vos datas et prenez des décisions claires.
            </p>

            {/* Guarantee badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
              {[
                { icon: '\uD83D\uDD12', text: 'Sans carte bancaire' },
                { icon: '\u2B50', text: '14 jours gratuits' },
                { icon: '\uD83D\uDCB8', text: 'Satisfait ou remboursé' },
              ].map((g) => (
                <div key={g.text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{g.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>{g.text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="ld-btn ld-btn-primary" onClick={() => onSignup()}
                style={{ padding: '16px 40px', fontSize: 16 }}>
                Voir mes vrais chiffres
                <span style={{ fontSize: 18 }}>{'\u2192'}</span>
              </button>
            </div>
            <p style={{ fontSize: 11, color: C.textMuted, marginTop: 14 }}>
              Pas d'engagement &middot; Migration gratuite &middot; Support prioritaire dès le 1er jour
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
                Toutes les datas essentielles de votre activité, centralisées sur un seul écran. Pour voir clair et décider vite.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>Produit</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Dashboard', 'CRM', 'Data', 'Agenda', 'Intégrations'].map((l) => (
                  <span key={l} style={{ fontSize: 13, color: C.textSec, cursor: 'pointer' }}>{l}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>Société</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['À propos', 'Blog', 'Carrière', 'Contact', 'Partenaires'].map((l) => (
                  <span key={l} style={{ fontSize: 13, color: C.textSec, cursor: 'pointer' }}>{l}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>Legal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['CGV', 'Confidentialité', 'RGPD', 'Mentions légales', 'Cookies'].map((l) => (
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
              © {new Date().getFullYear()} HubScale. Tous droits réservés. Fait avec {'\u2764'} en France.
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
