import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C, FONT, FONT_TITLE, CSS, getTheme, applyTheme } from "../shared.jsx";
import { POLISH_CSS, AnimatedThemeToggle } from "../ui-polish.jsx";
import { Inp, Btn } from "../components.jsx";
import { LoginFooter, ConsentBanner } from "../rgpd.jsx";

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE — Modern, animated, full-page marketing site
   Sections: Navbar, Hero, Logos, Features, Stats, How-it-works,
             Dashboard Preview, Testimonials, CTA, Footer
   ═══════════════════════════════════════════════════════════════ */

// ─── Intersection Observer Hook ───
function useInView(opts = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold: opts.threshold || 0.15, rootMargin: opts.rootMargin || "0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ─── Animated Counter ───
function Counter({ end, suffix = "", prefix = "", duration = 2000 }) {
  const [val, setVal] = useState(0);
  const [ref, visible] = useInView();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = end / (duration / 16);
    const iv = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(iv); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(iv);
  }, [visible, end, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString("fr-FR")}{suffix}</span>;
}

// ─── Typewriter Effect ───
function Typewriter({ words, speed = 80, pause = 2000 }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[idx];
    const timer = setTimeout(() => {
      if (!deleting) {
        setText(word.slice(0, text.length + 1));
        if (text.length + 1 === word.length) setTimeout(() => setDeleting(true), pause);
      } else {
        setText(word.slice(0, text.length - 1));
        if (text.length === 0) { setDeleting(false); setIdx((idx + 1) % words.length); }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timer);
  }, [text, deleting, idx, words, speed, pause]);
  return <>{text}<span style={{ borderRight: "2px solid #FFAA00", marginLeft: 2, animation: "pulse 1s step-end infinite" }}>&nbsp;</span></>;
}

// ─── Floating Particles Background ───
function Particles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    let w = cvs.width = window.innerWidth;
    let h = cvs.height = window.innerHeight;
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.5, o: Math.random() * 0.3 + 0.05
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,170,0,${p.o})`;
        ctx.fill();
      });
      // draw lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,170,0,${0.06 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { w = cvs.width = window.innerWidth; h = cvs.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

// ─── LANDING CSS ───
const LANDING_CSS = `
@keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
@keyframes floatSlow{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-12px) rotate(2deg)}}
@keyframes slideInLeft{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideInRight{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes morphBlob{0%,100%{border-radius:60% 40% 30% 70% / 60% 30% 70% 40%}50%{border-radius:30% 60% 70% 40% / 50% 60% 30% 60%}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(255,170,0,.15),0 0 60px rgba(255,170,0,.05)}50%{box-shadow:0 0 40px rgba(255,170,0,.3),0 0 80px rgba(255,170,0,.1)}}
@keyframes revealUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
@keyframes dashDraw{to{stroke-dashoffset:0}}
@keyframes heroGlow{0%,100%{opacity:.4}50%{opacity:.7}}
.landing-reveal{opacity:0;transform:translateY(40px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1);}
.landing-reveal.visible{opacity:1;transform:translateY(0)}
.landing-reveal.d1{transition-delay:.1s}.landing-reveal.d2{transition-delay:.2s}.landing-reveal.d3{transition-delay:.3s}.landing-reveal.d4{transition-delay:.4s}.landing-reveal.d5{transition-delay:.5s}
.gradient-text{background:linear-gradient(135deg,#FFAA00,#FF6B00,#FFAA00,#FFD700);background-size:300% 300%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradientShift 4s ease infinite}
.nav-link{color:rgba(255,255,255,.6);text-decoration:none;font-size:13px;font-weight:600;padding:8px 16px;border-radius:8px;transition:all .2s ease;cursor:pointer}
.nav-link:hover{color:#fff;background:rgba(255,255,255,.06)}
[data-theme="light"] .nav-link{color:rgba(0,0,0,.5)}
[data-theme="light"] .nav-link:hover{color:#000;background:rgba(0,0,0,.04)}
.feature-card{position:relative;overflow:hidden;transition:all .4s cubic-bezier(.16,1,.3,1)}
.feature-card:hover{transform:translateY(-8px) scale(1.02)}
.feature-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#FFAA00,transparent);opacity:0;transition:opacity .3s}
.feature-card:hover::before{opacity:1}
.feature-card::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,170,0,.06) 0%,transparent 60%);opacity:0;transition:opacity .3s}
.feature-card:hover::after{opacity:1}
.testimonial-track{display:flex;transition:transform .6s cubic-bezier(.16,1,.3,1)}
.step-line{position:absolute;top:28px;left:56px;right:0;height:2px;background:linear-gradient(90deg,#FFAA00,rgba(255,170,0,.1))}
.cta-glow{position:relative;overflow:hidden}
.cta-glow::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:conic-gradient(from 0deg,transparent,rgba(255,170,0,.1),transparent 30%);animation:sp 4s linear infinite}
.login-modal-overlay{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;animation:fi .3s ease}
.login-modal-box{animation:mi .4s cubic-bezier(.16,1,.3,1)}
.scroll-indicator{animation:float 2s ease-in-out infinite}
@media(max-width:768px){.hero-grid{flex-direction:column !important;text-align:center !important}.hero-text{align-items:center !important}.hero-mockup{max-width:100% !important;margin-top:32px !important}.features-grid{grid-template-columns:1fr !important}.stats-grid{grid-template-columns:1fr 1fr !important}.steps-grid{grid-template-columns:1fr !important}.step-line{display:none !important}.nav-links{display:none !important}.testimonial-card{min-width:280px !important}.footer-grid{grid-template-columns:1fr !important;text-align:center !important}}
@media(max-width:480px){.stats-grid{grid-template-columns:1fr !important}.hero-title{font-size:32px !important}.hero-subtitle{font-size:15px !important}}
`;

// ─── ScrollReveal wrapper ───
function Reveal({ children, className = "", delay = 0, style = {} }) {
  const [ref, visible] = useInView({ threshold: 0.1 });
  return (
    <div
      ref={ref}
      className={`landing-reveal ${visible ? "visible" : ""} ${delay ? `d${delay}` : ""} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

// ─── FEATURES DATA ───
const FEATURES = [
  { icon: "📊", title: "Dashboard Temps Réel", desc: "Vue consolidée de toutes vos sociétés. KPIs, trésorerie, CA, charges — tout en un coup d'œil avec des graphiques interactifs." },
  { icon: "🤖", title: "IA Copilot Intégrée", desc: "Un assistant IA qui analyse vos données, détecte les anomalies et vous propose des actions concrètes pour optimiser vos résultats." },
  { icon: "💳", title: "Banking & Trésorerie", desc: "Synchronisation Revolut & Stripe en temps réel. Catégorisation automatique, prévision de runway et alertes de trésorerie." },
  { icon: "📈", title: "CRM & Deal Flow", desc: "Pipeline commercial intégré avec GoHighLevel. Suivi des leads, scoring automatique et conversion tracking." },
  { icon: "🏆", title: "Milestones & Gamification", desc: "Système de trophées et badges pour motiver vos porteurs de projet. Leaderboard et objectifs dynamiques." },
  { icon: "📋", title: "Reporting Automatisé", desc: "Rapports mensuels générés automatiquement. Export PDF, envoi Slack et suivi des deadlines de reporting." },
];

const STATS = [
  { value: 50, suffix: "+", label: "Projets accompagnés" },
  { value: 2, suffix: "M€", label: "CA généré" },
  { value: 98, suffix: "%", label: "Taux de satisfaction" },
  { value: 15, suffix: "min", label: "Gain de temps / jour" },
];

const STEPS = [
  { num: "01", title: "Connectez vos outils", desc: "Reliez Revolut, Stripe, GoHighLevel en quelques clics. Vos données se synchronisent automatiquement." },
  { num: "02", title: "Pilotez en temps réel", desc: "Dashboard unifié avec KPIs, alertes et recommandations IA. Prenez les bonnes décisions au bon moment." },
  { num: "03", title: "Scalez votre incubateur", desc: "Automatisez le reporting, motivez vos porteurs et identifiez les opportunités de croissance." },
];

const TESTIMONIALS = [
  { name: "Dayyaan K.", role: "Porteur — LEADX", text: "La plateforme a transformé notre façon de piloter. On voit tout en temps réel, c'est un game changer.", avatar: "D" },
  { name: "Sol M.", role: "Porteur — Copywriting", text: "Le dashboard IA me fait gagner un temps fou. Les recommandations sont pertinentes et actionnables.", avatar: "S" },
  { name: "Siméon R.", role: "Porteur — BourbonBonsPlans", text: "La gamification avec les milestones, ça motive vraiment l'équipe. On se challenge au quotidien.", avatar: "S" },
  { name: "Pablo L.", role: "Porteur — Studio Branding", text: "L'intégration banking est top. Plus besoin de jongler entre 10 outils, tout est centralisé.", avatar: "P" },
  { name: "Louis D.", role: "Porteur — Padel Académie", text: "Même en phase de lancement, la plateforme nous guide avec des objectifs clairs et mesurables.", avatar: "L" },
];

// ─── MAIN LANDING PAGE COMPONENT ───
export function LandingPage({ hold, onLogin, loginEmail, setLoginEmail, loginPass, setLoginPass, loginEmail2, lErr, setLErr, shake, authLoading, toggleTheme }) {
  const [showLogin, setShowLogin] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [navSolid, setNavSolid] = useState(false);

  // Parallax scroll
  useEffect(() => {
    const h = () => {
      setScrollY(window.scrollY);
      setNavSolid(window.scrollY > 60);
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const iv = setInterval(() => setActiveTestimonial(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(iv);
  }, []);

  // Smooth scroll to section
  const scrollTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Mouse tracking for feature cards
  const handleFeatureMouseMove = useCallback((e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    card.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }, []);

  const brandName = hold?.brand?.name || "L'INCUBATEUR ECS";
  const brandSub = hold?.brand?.sub || "Plateforme de pilotage";
  const accentColor = hold?.brand?.accentColor || "#FFAA00";

  return (
    <div style={{ minHeight: "100vh", fontFamily: FONT, color: C.t, overflow: "hidden", position: "relative" }}>
      <style>{CSS}{POLISH_CSS}{LANDING_CSS}</style>
      <Particles />

      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        padding: "12px 32px",
        background: navSolid ? "rgba(6,6,11,.85)" : "transparent",
        backdropFilter: navSolid ? "blur(20px)" : "none",
        WebkitBackdropFilter: navSolid ? "blur(20px)" : "none",
        borderBottom: navSolid ? "1px solid rgba(255,255,255,.06)" : "1px solid transparent",
        transition: "all .4s ease",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${accentColor}, #FF9D00)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 14, color: "#0a0a0f", overflow: "hidden"
          }}>
            {hold?.brand?.logoUrl
              ? <img src={hold.brand.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              : (hold?.brand?.logoLetter || "E")}
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, fontFamily: FONT_TITLE, letterSpacing: 0.5 }}>{brandName}</span>
        </div>
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span className="nav-link" onClick={() => scrollTo("features")}>Fonctionnalités</span>
          <span className="nav-link" onClick={() => scrollTo("stats")}>Chiffres</span>
          <span className="nav-link" onClick={() => scrollTo("how")}>Comment ça marche</span>
          <span className="nav-link" onClick={() => scrollTo("testimonials")}>Témoignages</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <AnimatedThemeToggle onToggle={toggleTheme} />
          <button
            onClick={() => setShowLogin(true)}
            style={{
              padding: "9px 22px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${accentColor}, #FF9D00)`,
              color: "#0a0a0f", fontWeight: 700, fontSize: 13, cursor: "pointer",
              fontFamily: FONT, transition: "all .2s",
              boxShadow: `0 4px 20px rgba(255,170,0,.25)`,
            }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 30px rgba(255,170,0,.35)"; }}
            onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 4px 20px rgba(255,170,0,.25)"; }}
          >
            Se connecter
          </button>
        </div>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "120px 32px 80px", position: "relative", zIndex: 1,
      }}>
        {/* Gradient orbs */}
        <div style={{
          position: "absolute", top: "10%", left: "10%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,170,0,.08) 0%, transparent 70%)",
          filter: "blur(80px)", animation: "heroGlow 6s ease-in-out infinite",
          transform: `translateY(${scrollY * -0.15}px)`,
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "5%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(96,165,250,.06) 0%, transparent 70%)",
          filter: "blur(60px)", animation: "heroGlow 8s ease-in-out infinite 2s",
          transform: `translateY(${scrollY * -0.1}px)`,
        }} />

        <div className="hero-grid" style={{ maxWidth: 1200, width: "100%", display: "flex", alignItems: "center", gap: 60 }}>
          {/* Left: Text */}
          <div className="hero-text" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 24 }}>
            <Reveal>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 14px", borderRadius: 20,
                background: "rgba(255,170,0,.08)", border: "1px solid rgba(255,170,0,.15)",
                fontSize: 12, fontWeight: 600, color: accentColor,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor, animation: "pulse 2s infinite" }} />
                Plateforme tout-en-un pour incubateurs
              </div>
            </Reveal>

            <Reveal delay={1}>
              <h1 className="hero-title" style={{
                fontSize: 52, fontWeight: 900, lineHeight: 1.1,
                fontFamily: FONT_TITLE, margin: 0, letterSpacing: -0.5,
              }}>
                Pilotez vos startups<br />
                <span className="gradient-text" style={{ fontSize: "inherit", fontWeight: "inherit" }}>
                  <Typewriter words={["en temps réel", "avec intelligence", "sans friction", "à grande échelle"]} />
                </span>
              </h1>
            </Reveal>

            <Reveal delay={2}>
              <p className="hero-subtitle" style={{
                fontSize: 17, lineHeight: 1.6, color: C.td, maxWidth: 480, margin: 0
              }}>
                Dashboard unifié, IA intégrée, banking automatisé et CRM connecté.
                Tout ce dont votre incubateur a besoin pour scaler, dans une seule plateforme.
              </p>
            </Reveal>

            <Reveal delay={3}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => setShowLogin(true)}
                  style={{
                    padding: "14px 32px", borderRadius: 12, border: "none",
                    background: `linear-gradient(135deg, ${accentColor}, #FF9D00)`,
                    color: "#0a0a0f", fontWeight: 800, fontSize: 15, cursor: "pointer",
                    fontFamily: FONT, boxShadow: "0 8px 32px rgba(255,170,0,.3)",
                    transition: "all .3s cubic-bezier(.16,1,.3,1)",
                  }}
                  onMouseEnter={e => { e.target.style.transform = "translateY(-3px) scale(1.02)"; e.target.style.boxShadow = "0 12px 40px rgba(255,170,0,.4)"; }}
                  onMouseLeave={e => { e.target.style.transform = "translateY(0) scale(1)"; e.target.style.boxShadow = "0 8px 32px rgba(255,170,0,.3)"; }}
                >
                  Accéder à la plateforme →
                </button>
                <button
                  onClick={() => scrollTo("features")}
                  style={{
                    padding: "14px 28px", borderRadius: 12,
                    border: "1px solid rgba(255,255,255,.1)",
                    background: "rgba(255,255,255,.04)", color: C.t,
                    fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: FONT,
                    backdropFilter: "blur(10px)", transition: "all .3s",
                  }}
                  onMouseEnter={e => { e.target.style.borderColor = "rgba(255,170,0,.3)"; e.target.style.background = "rgba(255,170,0,.06)"; }}
                  onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,.1)"; e.target.style.background = "rgba(255,255,255,.04)"; }}
                >
                  Découvrir
                </button>
              </div>
            </Reveal>

            <Reveal delay={4}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
                <div style={{ display: "flex" }}>
                  {["D", "S", "P", "L"].map((l, i) => (
                    <div key={i} style={{
                      width: 32, height: 32, borderRadius: "50%", border: "2px solid #06060b",
                      background: `linear-gradient(135deg, ${["#FFAA00", "#60a5fa", "#34d399", "#fb923c"][i]}, ${["#FF9D00", "#3b82f6", "#22c55e", "#f97316"][i]})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800, color: "#fff",
                      marginLeft: i > 0 ? -8 : 0,
                    }}>{l}</div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: C.td }}>
                  <strong style={{ color: C.t }}>+50 porteurs</strong> font déjà confiance
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right: Dashboard Mockup */}
          <Reveal delay={2} style={{ flex: 1 }}>
            <div className="hero-mockup" style={{
              position: "relative",
              animation: "floatSlow 6s ease-in-out infinite",
            }}>
              {/* Glow behind */}
              <div style={{
                position: "absolute", inset: -20,
                background: `radial-gradient(circle, rgba(255,170,0,.12) 0%, transparent 70%)`,
                borderRadius: 24, filter: "blur(40px)",
                animation: "glowPulse 4s ease infinite",
              }} />
              {/* Mock dashboard card */}
              <div style={{
                position: "relative",
                background: "rgba(14,14,22,.7)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,.08)", borderRadius: 20,
                padding: 20, boxShadow: "0 24px 80px rgba(0,0,0,.5)",
              }}>
                {/* Top bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f87171" }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fb923c" }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#34d399" }} />
                  <div style={{ flex: 1, height: 24, borderRadius: 6, background: "rgba(255,255,255,.04)", marginLeft: 8 }} />
                </div>
                {/* KPI row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "CA Total", val: "247K€", color: "#FFAA00", delta: "+12%" },
                    { label: "Trésorerie", val: "89K€", color: "#34d399", delta: "+5.3%" },
                    { label: "Projets", val: "12", color: "#60a5fa", delta: "actifs" },
                  ].map((k, i) => (
                    <div key={i} style={{
                      padding: "12px 14px", borderRadius: 12,
                      background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)",
                    }}>
                      <div style={{ fontSize: 10, color: C.td, marginBottom: 4 }}>{k.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: k.color, fontFamily: FONT_TITLE }}>{k.val}</div>
                      <div style={{ fontSize: 10, color: "#34d399", marginTop: 2 }}>{k.delta}</div>
                    </div>
                  ))}
                </div>
                {/* Fake chart */}
                <div style={{
                  height: 120, borderRadius: 12, overflow: "hidden",
                  background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)",
                  position: "relative", padding: "12px 16px",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.td, marginBottom: 8 }}>Évolution CA mensuel</div>
                  <svg width="100%" height="70" viewBox="0 0 300 70" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFAA00" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#FFAA00" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,60 Q30,55 60,45 T120,35 T180,20 T240,25 T300,10" fill="none" stroke="#FFAA00" strokeWidth="2" />
                    <path d="M0,60 Q30,55 60,45 T120,35 T180,20 T240,25 T300,10 L300,70 L0,70 Z" fill="url(#chartGrad)" />
                  </svg>
                </div>
                {/* Bottom list */}
                <div style={{ marginTop: 12 }}>
                  {["LEADX — +12% ce mois", "Copywriting — Pipeline: 45K€", "Studio — 3 deals en cours"].map((t, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 10px", borderRadius: 8,
                      background: i === 0 ? "rgba(255,170,0,.06)" : "transparent",
                      marginBottom: 2,
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: ["#FFAA00", "#60a5fa", "#fb923c"][i],
                      }} />
                      <span style={{ fontSize: 11, color: C.td }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator" style={{
          position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        }}>
          <div style={{ fontSize: 10, color: C.td, letterSpacing: 2, textTransform: "uppercase" }}>Scroll</div>
          <div style={{
            width: 20, height: 32, borderRadius: 10, border: `1.5px solid rgba(255,255,255,.15)`,
            display: "flex", justifyContent: "center", paddingTop: 6,
          }}>
            <div style={{
              width: 3, height: 8, borderRadius: 2, background: accentColor,
              animation: "float 2s ease-in-out infinite",
            }} />
          </div>
        </div>
      </section>

      {/* ═══ LOGO TICKER ═══ */}
      <section style={{
        padding: "32px 0", borderTop: "1px solid rgba(255,255,255,.04)",
        borderBottom: "1px solid rgba(255,255,255,.04)",
        overflow: "hidden", position: "relative", zIndex: 1,
      }}>
        <div style={{ textAlign: "center", fontSize: 11, color: C.td, marginBottom: 20, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
          Outils intégrés
        </div>
        <div style={{ display: "flex", overflow: "hidden", maskImage: "linear-gradient(90deg, transparent, black 15%, black 85%, transparent)" }}>
          <div style={{ display: "flex", gap: 48, animation: "ticker 20s linear infinite", whiteSpace: "nowrap" }}>
            {[...Array(2)].flatMap(() => ["Revolut", "Stripe", "GoHighLevel", "Slack", "Supabase", "Vite", "React"]).map((name, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.2)",
                fontFamily: FONT_TITLE, letterSpacing: 1,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(255,170,0,.2)" }} />
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" style={{ padding: "100px 32px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: accentColor, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                Fonctionnalités
              </div>
              <h2 style={{ fontSize: 38, fontWeight: 900, fontFamily: FONT_TITLE, margin: 0, lineHeight: 1.2 }}>
                Tout pour piloter,<br /><span className="gradient-text">rien que l'essentiel</span>
              </h2>
              <p style={{ color: C.td, fontSize: 15, marginTop: 16, maxWidth: 500, marginInline: "auto" }}>
                Chaque fonctionnalité a été pensée pour vous faire gagner du temps et prendre de meilleures décisions.
              </p>
            </div>
          </Reveal>

          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={Math.min(i + 1, 5)}>
                <div
                  className="feature-card"
                  onMouseMove={handleFeatureMouseMove}
                  style={{
                    padding: 28, borderRadius: 18,
                    background: "rgba(14,14,22,.5)", border: "1px solid rgba(255,255,255,.06)",
                    backdropFilter: "blur(10px)", cursor: "default", height: "100%",
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `linear-gradient(135deg, rgba(255,170,0,.12), rgba(255,170,0,.04))`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, marginBottom: 18,
                  }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 10px", fontFamily: FONT_TITLE }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: C.td, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section id="stats" style={{
        padding: "80px 32px", position: "relative", zIndex: 1,
        background: "rgba(255,170,0,.02)",
        borderTop: "1px solid rgba(255,255,255,.04)", borderBottom: "1px solid rgba(255,255,255,.04)",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Reveal>
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 32, textAlign: "center" }}>
              {STATS.map((s, i) => (
                <div key={i}>
                  <div style={{
                    fontSize: 48, fontWeight: 900, fontFamily: FONT_TITLE,
                    background: `linear-gradient(135deg, ${accentColor}, #FFD700)`,
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    backgroundClip: "text", lineHeight: 1,
                  }}>
                    <Counter end={s.value} suffix={s.suffix} />
                  </div>
                  <div style={{ fontSize: 13, color: C.td, marginTop: 8, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" style={{ padding: "100px 32px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: accentColor, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                Comment ça marche
              </div>
              <h2 style={{ fontSize: 38, fontWeight: 900, fontFamily: FONT_TITLE, margin: 0 }}>
                <span className="gradient-text">3 étapes</span> pour transformer votre pilotage
              </h2>
            </div>
          </Reveal>

          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i + 1}>
                <div style={{ position: "relative", textAlign: "center" }}>
                  {i < 2 && <div className="step-line" />}
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%", margin: "0 auto 20px",
                    background: `linear-gradient(135deg, ${accentColor}, #FF9D00)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 900, color: "#0a0a0f",
                    boxShadow: "0 8px 32px rgba(255,170,0,.25)",
                    position: "relative", zIndex: 2,
                  }}>
                    {s.num}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px", fontFamily: FONT_TITLE }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: C.td, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" style={{
        padding: "100px 32px", position: "relative", zIndex: 1,
        background: "rgba(255,170,0,.02)",
        borderTop: "1px solid rgba(255,255,255,.04)", borderBottom: "1px solid rgba(255,255,255,.04)",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: accentColor, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                Témoignages
              </div>
              <h2 style={{ fontSize: 38, fontWeight: 900, fontFamily: FONT_TITLE, margin: 0 }}>
                Ils nous font <span className="gradient-text">confiance</span>
              </h2>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <div style={{ overflow: "hidden", borderRadius: 20 }}>
              <div className="testimonial-track" style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}>
                {TESTIMONIALS.map((t, i) => (
                  <div key={i} className="testimonial-card" style={{
                    minWidth: "100%", padding: "40px 48px",
                    background: "rgba(14,14,22,.5)", border: "1px solid rgba(255,255,255,.06)",
                    borderRadius: 20, backdropFilter: "blur(10px)",
                  }}>
                    <div style={{ fontSize: 32, color: "rgba(255,170,0,.2)", marginBottom: 16, fontFamily: "serif" }}>"</div>
                    <p style={{ fontSize: 17, lineHeight: 1.7, color: C.t, margin: "0 0 24px", fontStyle: "italic" }}>{t.text}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: `linear-gradient(135deg, ${accentColor}, #FF9D00)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: 16, color: "#0a0a0f",
                      }}>
                        {t.avatar}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: C.td }}>{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setActiveTestimonial(i)} style={{
                  width: activeTestimonial === i ? 24 : 8, height: 8,
                  borderRadius: 4, border: "none", cursor: "pointer",
                  background: activeTestimonial === i ? accentColor : "rgba(255,255,255,.15)",
                  transition: "all .3s cubic-bezier(.16,1,.3,1)",
                }} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ CTA SECTION ═══ */}
      <section style={{ padding: "100px 32px", position: "relative", zIndex: 1 }}>
        <Reveal>
          <div className="cta-glow" style={{
            maxWidth: 800, margin: "0 auto", textAlign: "center",
            padding: "64px 48px", borderRadius: 24,
            background: "rgba(14,14,22,.6)", border: "1px solid rgba(255,170,0,.15)",
            backdropFilter: "blur(20px)",
          }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, fontFamily: FONT_TITLE, margin: "0 0 16px" }}>
              Prêt à <span className="gradient-text">scaler</span> votre incubateur ?
            </h2>
            <p style={{ fontSize: 15, color: C.td, marginBottom: 32, maxWidth: 500, marginInline: "auto" }}>
              Rejoignez les incubateurs qui ont déjà transformé leur pilotage avec notre plateforme.
            </p>
            <button
              onClick={() => setShowLogin(true)}
              style={{
                padding: "16px 40px", borderRadius: 14, border: "none",
                background: `linear-gradient(135deg, ${accentColor}, #FF9D00)`,
                color: "#0a0a0f", fontWeight: 800, fontSize: 16, cursor: "pointer",
                fontFamily: FONT, boxShadow: "0 8px 40px rgba(255,170,0,.3)",
                transition: "all .3s cubic-bezier(.16,1,.3,1)",
              }}
              onMouseEnter={e => { e.target.style.transform = "translateY(-3px) scale(1.03)"; e.target.style.boxShadow = "0 16px 50px rgba(255,170,0,.4)"; }}
              onMouseLeave={e => { e.target.style.transform = "translateY(0) scale(1)"; e.target.style.boxShadow = "0 8px 40px rgba(255,170,0,.3)"; }}
            >
              Commencer maintenant →
            </button>
          </div>
        </Reveal>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        padding: "48px 32px 32px", position: "relative", zIndex: 1,
        borderTop: "1px solid rgba(255,255,255,.06)",
      }}>
        <div className="footer-grid" style={{
          maxWidth: 1100, margin: "0 auto",
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `linear-gradient(135deg, ${accentColor}, #FF9D00)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: 12, color: "#0a0a0f", overflow: "hidden",
              }}>
                {hold?.brand?.logoUrl
                  ? <img src={hold.brand.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  : (hold?.brand?.logoLetter || "E")}
              </div>
              <span style={{ fontWeight: 800, fontSize: 13, fontFamily: FONT_TITLE }}>{brandName}</span>
            </div>
            <p style={{ fontSize: 12, color: C.td, lineHeight: 1.7, maxWidth: 280 }}>
              La plateforme de pilotage nouvelle génération pour incubateurs et accélérateurs de startups.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 16, color: C.t }}>Plateforme</div>
            {["Fonctionnalités", "Tarifs", "Sécurité", "API"].map(l => (
              <div key={l} style={{ fontSize: 12, color: C.td, marginBottom: 10, cursor: "pointer", transition: "color .2s" }}
                onMouseEnter={e => e.target.style.color = C.t} onMouseLeave={e => e.target.style.color = C.td}>
                {l}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 16, color: C.t }}>Ressources</div>
            {["Documentation", "Blog", "Changelog", "Support"].map(l => (
              <div key={l} style={{ fontSize: 12, color: C.td, marginBottom: 10, cursor: "pointer", transition: "color .2s" }}
                onMouseEnter={e => e.target.style.color = C.t} onMouseLeave={e => e.target.style.color = C.td}>
                {l}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 16, color: C.t }}>Légal</div>
            <a href="#privacy" style={{ display: "block", fontSize: 12, color: C.td, marginBottom: 10, textDecoration: "none", transition: "color .2s" }}
              onMouseEnter={e => e.target.style.color = C.t} onMouseLeave={e => e.target.style.color = C.td}>
              Confidentialité
            </a>
            <a href="#mentions" style={{ display: "block", fontSize: 12, color: C.td, marginBottom: 10, textDecoration: "none", transition: "color .2s" }}
              onMouseEnter={e => e.target.style.color = C.t} onMouseLeave={e => e.target.style.color = C.td}>
              Mentions légales
            </a>
            <a href="#rgpd" style={{ display: "block", fontSize: 12, color: C.td, marginBottom: 10, textDecoration: "none", transition: "color .2s" }}
              onMouseEnter={e => e.target.style.color = C.t} onMouseLeave={e => e.target.style.color = C.td}>
              RGPD
            </a>
          </div>
        </div>
        <div style={{
          maxWidth: 1100, margin: "32px auto 0",
          paddingTop: 24, borderTop: "1px solid rgba(255,255,255,.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 11, color: C.td,
        }}>
          <span>© {new Date().getFullYear()} {brandName}. Tous droits réservés.</span>
          <span>Fait avec passion à La Réunion</span>
        </div>
      </footer>

      {/* ═══ LOGIN MODAL ═══ */}
      {showLogin && (
        <div className="login-modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="login-modal-box" onClick={e => e.stopPropagation()}>
            <div className="glass-modal" style={{ borderRadius: 20, padding: 28, width: 360, maxWidth: "95vw", position: "relative" }}>
              <button onClick={() => setShowLogin(false)} style={{
                position: "absolute", top: 12, right: 14,
                background: "none", border: "none", color: C.td,
                fontSize: 18, cursor: "pointer", padding: 4,
                transition: "color .2s",
              }}
                onMouseEnter={e => e.target.style.color = C.t}
                onMouseLeave={e => e.target.style.color = C.td}
              >
                ×
              </button>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 12,
                  background: "transparent", display: "inline-flex",
                  alignItems: "center", justifyContent: "center",
                  fontWeight: 900, fontSize: 18, color: "#0a0a0f",
                  marginBottom: 10, overflow: "hidden",
                }} className="fl glow-accent-strong">
                  {hold?.brand?.logoUrl
                    ? <img loading="lazy" src={hold.brand.logoUrl} alt={hold?.brand?.name || "Logo"} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    : (hold?.brand?.logoLetter || "E")}
                </div>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: .5, fontFamily: FONT_TITLE, color: "#fff" }}>
                  {brandName}
                </h1>
                <p style={{ color: C.td, fontSize: 11, margin: "4px 0 0" }}>{brandSub}</p>
              </div>
              <div style={{ animation: shake ? "sh .4s ease" : "none" }}>
                <Inp label="Email" value={loginEmail} onChange={v => { setLoginEmail(v); setLErr(""); }} type="email" placeholder="votre@email.com" required onKeyDown={e => { if (e.key === "Enter" && loginEmail && loginPass) loginEmail2(); }} />
                <Inp label="Mot de passe" value={loginPass} onChange={v => { setLoginPass(v); setLErr(""); }} type="password" placeholder="••••••••" required onKeyDown={e => { if (e.key === "Enter") loginEmail2(); }} />
              </div>
              {lErr && <div style={{ color: C.r, fontSize: 11, marginBottom: 8, textAlign: "center" }}>⚠ {lErr}</div>}
              <Btn onClick={loginEmail2} full disabled={authLoading}>{authLoading ? "Connexion..." : "Connexion"}</Btn>
              <LoginFooter />
            </div>
          </div>
        </div>
      )}

      <ConsentBanner />
    </div>
  );
}
