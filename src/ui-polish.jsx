import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { C, FONT, FONT_TITLE, getTheme } from "./shared.jsx";

/* ============================================================
   UI POLISH MODULE — 10 chantiers
   1. Page transitions
   2. Toast notifications
   3. Hover states (CSS)
   4. Custom scrollbars (CSS)
   5. Empty states
   6. Pull-to-refresh
   7. Breadcrumbs
   8. Dark mode toggle animé
   9. Micro-interactions (confetti, counting, pulse, shake)
   10. Onboarding tour
   ============================================================ */

// ─── CSS for all polish features ───
export const POLISH_CSS = `
/* 1. PAGE TRANSITIONS */
.page-transition-enter{opacity:0}
.page-transition-active{opacity:1;transition:opacity .25s ease}
.page-transition-exit{opacity:0;transition:opacity .15s ease}

/* 2. TOAST NOTIFICATIONS */
.toast-container{position:fixed;top:16px;right:16px;z-index:11000;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.toast-item{pointer-events:auto;display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:12px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.1);box-shadow:0 8px 32px rgba(0,0,0,.4);font-family:${FONT};font-size:12px;font-weight:600;min-width:280px;max-width:400px;animation:toastIn .3s cubic-bezier(.16,1,.3,1) both}
.toast-item.toast-out{animation:toastOut .25s ease both}
.toast-success{background:rgba(52,211,153,.15);color:#34d399;border-color:rgba(52,211,153,.25)}
.toast-error{background:rgba(248,113,113,.15);color:#f87171;border-color:rgba(248,113,113,.25)}
.toast-info{background:rgba(96,165,250,.15);color:#60a5fa;border-color:rgba(96,165,250,.25)}
.toast-close{background:none;border:none;color:inherit;opacity:.6;cursor:pointer;font-size:14px;padding:2px 4px;margin-left:auto;flex-shrink:0}
.toast-close:hover{opacity:1}

/* 3. HOVER STATES */
.glass-card,.glass-card-static{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
.glass-card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.35);border-color:rgba(255,255,255,.12)}
button{transition:transform .15s ease,opacity .15s ease,box-shadow .15s ease}

/* 4. CUSTOM SCROLLBARS */
*{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.08) transparent}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.18)}
[data-theme="light"] *{scrollbar-color:rgba(0,0,0,.12) transparent}
[data-theme="light"] ::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12)}
[data-theme="light"] ::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.2)}

/* 6. PULL TO REFRESH */
.ptr-indicator{display:flex;align-items:center;justify-content:center;height:0;overflow:hidden;transition:height .2s ease;color:rgba(255,255,255,.5);font-size:20px}
.ptr-indicator.ptr-pulling{height:50px}
.ptr-indicator.ptr-refreshing{height:50px}
.ptr-spinner{width:20px;height:20px;border:2px solid rgba(255,255,255,.1);border-top-color:rgba(255,170,0,.8);border-radius:50%;animation:sp .8s linear infinite}

/* 8. DARK MODE TOGGLE */
.theme-toggle-btn{position:relative;width:48px;height:26px;border-radius:13px;border:1.5px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);cursor:pointer;padding:0;transition:background .3s ease,border-color .3s ease}
.theme-toggle-btn.light{background:rgba(255,200,0,.15);border-color:rgba(255,200,0,.3)}
.theme-toggle-knob{position:absolute;top:2px;width:20px;height:20px;border-radius:50%;transition:left .3s cubic-bezier(.68,-.55,.27,1.55);display:flex;align-items:center;justify-content:center;font-size:12px}
.theme-toggle-btn .theme-toggle-knob{left:2px}
.theme-toggle-btn.light .theme-toggle-knob{left:24px}

/* 9. MICRO-INTERACTIONS */
@keyframes confettiFall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
@keyframes kpiCount{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,.3)}50%{box-shadow:0 0 12px 4px rgba(52,211,153,.2)}}
@keyframes shakeError{0%,100%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}
.kpi-counting{animation:kpiCount .4s ease both}
.pulse-glow{animation:pulseGlow 2s ease infinite}
.shake-error{animation:shakeError .4s ease}

/* 10. ONBOARDING TOUR */
.tour-overlay{position:fixed;inset:0;z-index:12000;pointer-events:none}
.tour-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);pointer-events:auto}
.tour-tooltip{position:absolute;z-index:12001;background:rgba(14,14,22,.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,170,0,.25);border-radius:14px;padding:16px 20px;max-width:320px;pointer-events:auto;box-shadow:0 12px 40px rgba(0,0,0,.5);animation:mi .3s cubic-bezier(.16,1,.3,1) both}
.tour-tooltip-arrow{position:absolute;width:10px;height:10px;background:rgba(14,14,22,.95);border:1px solid rgba(255,170,0,.25);transform:rotate(45deg)}
.tour-progress{display:flex;gap:4px;margin-top:12px}
.tour-dot{width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,.15);transition:all .2s}
.tour-dot.active{background:#FFAA00;width:16px}

/* 7. BREADCRUMBS */
.breadcrumbs{display:flex;align-items:center;gap:6px;padding:6px 12px;margin-bottom:10px;font-size:11px;color:rgba(255,255,255,.4);font-family:${FONT}}
.breadcrumbs span{cursor:default}
.breadcrumbs .bc-sep{font-size:9px;opacity:.4}
.breadcrumbs .bc-current{color:#FFAA00;font-weight:700}
.breadcrumbs .bc-link{cursor:pointer;transition:color .15s}
.breadcrumbs .bc-link:hover{color:rgba(255,255,255,.7)}

/* Page body transition */
body{transition:background-color .3s ease,color .3s ease}

/* Light mode overrides */
[data-theme="light"] .tour-tooltip{background:rgba(255,255,255,.95);border-color:rgba(255,170,0,.3);box-shadow:0 12px 40px rgba(0,0,0,.15)}
[data-theme="light"] .tour-tooltip-arrow{background:rgba(255,255,255,.95);border-color:rgba(255,170,0,.3)}
[data-theme="light"] .tour-dot{background:rgba(0,0,0,.15)}
[data-theme="light"] .breadcrumbs{color:rgba(0,0,0,.4)}
[data-theme="light"] .breadcrumbs .bc-link:hover{color:rgba(0,0,0,.7)}
[data-theme="light"] .ptr-indicator{color:rgba(0,0,0,.5)}
[data-theme="light"] .ptr-spinner{border-color:rgba(0,0,0,.1);border-top-color:rgba(255,170,0,.8)}
`;

// ─── 2. TOAST SYSTEM ───
const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 3500) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  }, []);

  const toast = useCallback({
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  }, [addToast]);
  // Fix: can't use useCallback on an object
  const toastApi = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
    add: addToast,
  };

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast-item toast-${t.type}${t.exiting ? " toast-out" : ""}`}>
            <span>{t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button className="toast-close" onClick={() => removeToast(t.id)}>✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Global toast function (works without context, for use in non-component code)
let _globalToast = null;
export function setGlobalToast(api) { _globalToast = api; }
export function showToast(msg, type = "info") {
  if (_globalToast) _globalToast.add(msg, type);
  else console.log(`[toast:${type}] ${msg}`);
}

// ─── 1. PAGE TRANSITION WRAPPER ───
export function PageTransition({ children, tabKey }) {
  const [visible, setVisible] = useState(false);
  const [currentKey, setCurrentKey] = useState(tabKey);
  const [content, setContent] = useState(children);

  useEffect(() => {
    if (tabKey !== currentKey) {
      setVisible(false);
      const t = setTimeout(() => {
        setCurrentKey(tabKey);
        setContent(children);
        setVisible(true);
      }, 150);
      return () => clearTimeout(t);
    } else {
      setContent(children);
      setVisible(true);
    }
  }, [tabKey, children]);

  return (
    <div className={visible ? "page-transition-active" : "page-transition-enter"}>
      {content}
    </div>
  );
}

// ─── 5. EMPTY STATES ───
export function EmptyState({ icon, title, description, action, onAction }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "40px 20px", textAlign: "center", minHeight: 200,
    }}>
      <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.7 }}>{icon || "📭"}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.t, marginBottom: 6, fontFamily: FONT_TITLE }}>
        {title || "Rien ici pour le moment"}
      </div>
      <div style={{ fontSize: 12, color: C.td, maxWidth: 300, lineHeight: 1.5, marginBottom: action ? 16 : 0 }}>
        {description || "Les données apparaîtront ici dès qu'elles seront disponibles."}
      </div>
      {action && (
        <button onClick={onAction} style={{
          padding: "8px 20px", borderRadius: 10, border: `1px solid ${C.acc}44`,
          background: C.accD, color: C.acc, fontSize: 12, fontWeight: 700,
          cursor: "pointer", fontFamily: FONT, transition: "all .2s ease",
        }}>
          {action}
        </button>
      )}
    </div>
  );
}

// Specific empty states
export function EmptyPipeline() {
  return <EmptyState icon="🎯" title="Pipeline vide" description="Aucun deal en cours. Ajoutez votre premier deal pour commencer à suivre votre pipeline." action="+ Nouveau deal" />;
}
export function EmptyClients() {
  return <EmptyState icon="👥" title="Pas encore de clients" description="Vos clients apparaîtront ici une fois synchronisés depuis le CRM ou ajoutés manuellement." />;
}
export function EmptyTransactions() {
  return <EmptyState icon="🏦" title="Pas de transactions" description="Les transactions bancaires s'afficheront ici après la synchronisation Revolut." />;
}
export function EmptyConversations() {
  return <EmptyState icon="💬" title="Aucune conversation" description="Les conversations GHL apparaîtront ici automatiquement." />;
}

// ─── 6. PULL TO REFRESH ───
export function PullToRefresh({ onRefresh, children }) {
  const containerRef = useRef(null);
  const [state, setState] = useState("idle"); // idle, pulling, refreshing
  const startY = useRef(0);
  const [pullDist, setPullDist] = useState(0);

  const isMobile = typeof window !== "undefined" && "ontouchstart" in window;
  if (!isMobile) return <>{children}</>;

  const handleTouchStart = (e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (state === "refreshing") return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      setPullDist(Math.min(diff * 0.4, 80));
      setState("pulling");
    }
  };

  const handleTouchEnd = async () => {
    if (pullDist > 50 && state === "pulling") {
      setState("refreshing");
      try { await onRefresh?.(); } catch {}
      setTimeout(() => { setState("idle"); setPullDist(0); }, 500);
    } else {
      setState("idle");
      setPullDist(0);
    }
  };

  return (
    <div ref={containerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ position: "relative" }}>
      <div className={`ptr-indicator ${state === "pulling" ? "ptr-pulling" : ""} ${state === "refreshing" ? "ptr-refreshing" : ""}`}
        style={{ height: state !== "idle" ? Math.max(pullDist, state === "refreshing" ? 50 : 0) : 0 }}>
        {state === "refreshing" ? <div className="ptr-spinner" /> : pullDist > 50 ? "↓ Relâcher" : "↑ Tirer pour rafraîchir"}
      </div>
      {children}
    </div>
  );
}

// ─── 7. BREADCRUMBS ───
const TAB_NAMES_ADMIN = {
  0: "Dashboard", 1: "Sociétés", 2: "Rapports", 3: "Clients", 4: "Facturation",
  5: "AI Copilot", 6: "Deal Flow", 7: "CRM", 8: "Banking", 10: "Synergies",
  11: "Knowledge Base", 13: "Abonnements", 14: "Accès", 15: "Holding", 16: "Marque",
  17: "Intégrations", 18: "Publicité",
};

const TAB_NAMES_PORTEUR = {
  0: "Dashboard", 1: "Analytique", 2: "Rapports", 3: "Clients", 4: "Conversations",
  5: "Facturation", 6: "AI Coach", 7: "Abonnements", 8: "Banking", 9: "Knowledge Base",
};

export function Breadcrumbs({ tab, isAdmin, socName, onNavigate }) {
  const names = isAdmin ? TAB_NAMES_ADMIN : TAB_NAMES_PORTEUR;
  const currentName = names[tab] || "Page";

  return (
    <div className="breadcrumbs">
      <span className="bc-link" onClick={() => onNavigate?.(0)}>🏠</span>
      <span className="bc-sep">›</span>
      {!isAdmin && socName && <>
        <span style={{ color: C.td }}>{socName}</span>
        <span className="bc-sep">›</span>
      </>}
      <span className="bc-current">{currentName}</span>
    </div>
  );
}

// ─── 8. ANIMATED DARK MODE TOGGLE ───
export function AnimatedThemeToggle({ onToggle }) {
  const isDark = getTheme() === "dark";
  return (
    <button className={`theme-toggle-btn${isDark ? "" : " light"}`} onClick={onToggle} title={isDark ? "Mode clair" : "Mode sombre"}>
      <div className="theme-toggle-knob">{isDark ? "🌙" : "☀️"}</div>
    </button>
  );
}

// ─── 9. MICRO-INTERACTIONS ───

// Confetti burst
export function ConfettiBurst({ active, onDone }) {
  if (!active) return null;
  const colors = ["#FFAA00", "#34d399", "#60a5fa", "#f87171", "#a78bfa", "#fb923c"];
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i, color: colors[i % colors.length],
    left: Math.random() * 100, delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1.5, rotation: Math.random() * 360,
    size: 4 + Math.random() * 6,
  }));

  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 11500, pointerEvents: "none" }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: "absolute", top: -10, left: `${p.left}%`,
          width: p.size, height: p.size, borderRadius: p.size > 7 ? "50%" : "1px",
          background: p.color, opacity: 0.9,
          animation: `confettiFall ${p.duration}s ease-in ${p.delay}s both`,
        }} />
      ))}
    </div>
  );
}

// Counting number animation
export function CountingNumber({ value, duration = 800, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const numVal = typeof value === "string" ? parseFloat(value.replace(/[^\d.-]/g, "")) || 0 : (value || 0);

  useEffect(() => {
    let start = 0;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(numVal * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [numVal, duration]);

  return <span className="kpi-counting">{prefix}{new Intl.NumberFormat("fr-FR").format(display)}{suffix}</span>;
}

// ─── 10. ONBOARDING TOUR ───
const PORTEUR_TOUR_STEPS = [
  { target: '[data-tour="porteur-tab-0"]', title: "📊 Dashboard", desc: "Vue d'ensemble de votre société — KPIs, graphiques et alertes en un coup d'œil.", position: "bottom" },
  { target: '[data-tour="porteur-tab-3"]', title: "👥 Clients", desc: "Gérez vos clients, suivez les factures et visualisez le parcours client.", position: "bottom" },
  { target: '[data-tour="porteur-tab-8"]', title: "🏦 Banking", desc: "Suivi de vos transactions bancaires et trésorerie en temps réel.", position: "bottom" },
  { target: '[data-tour="porteur-tab-4"]', title: "💬 Conversations", desc: "Vos conversations CRM centralisées, avec historique et suivi.", position: "bottom" },
  { target: '[data-tour="porteur-tab-6"]', title: "🤖 AI Coach", desc: "Votre copilote IA : insights, recommandations et analyses automatiques.", position: "bottom" },
];

export function OnboardingTour({ onFinish, isAdmin }) {
  const [step, setStep] = useState(0);
  const [pos, setPos] = useState(null);
  const steps = isAdmin ? [] : PORTEUR_TOUR_STEPS;

  // Check localStorage
  const storageKey = isAdmin ? "sc_tour_admin_done" : "sc_tour_porteur_done";
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(storageKey) === "1"; } catch { return false; }
  });

  useEffect(() => {
    if (dismissed || steps.length === 0) { onFinish?.(); return; }
    const el = document.querySelector(steps[step]?.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setPos({
        top: rect.bottom + 12, left: Math.max(12, Math.min(rect.left, window.innerWidth - 340)),
      });
      el.style.position = "relative";
      el.style.zIndex = "12002";
      el.style.boxShadow = "0 0 0 4px rgba(255,170,0,.4)";
      el.style.borderRadius = "8px";
      return () => {
        el.style.zIndex = "";
        el.style.boxShadow = "";
      };
    }
  }, [step, dismissed]);

  if (dismissed || steps.length === 0) return null;

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  const handleDismiss = () => {
    try { localStorage.setItem(storageKey, "1"); } catch {}
    setDismissed(true);
    onFinish?.();
  };

  return (
    <div className="tour-overlay">
      <div className="tour-backdrop" onClick={handleDismiss} />
      {pos && (
        <div className="tour-tooltip" style={{ top: pos.top, left: pos.left }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#FFAA00", marginBottom: 6, fontFamily: FONT_TITLE }}>
            {currentStep.title}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", lineHeight: 1.5 }}>
            {currentStep.desc}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
            <div className="tour-progress">
              {steps.map((_, i) => <div key={i} className={`tour-dot${i === step ? " active" : ""}`} />)}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={handleDismiss} style={{
                padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,.1)",
                background: "transparent", color: "rgba(255,255,255,.5)", fontSize: 10,
                cursor: "pointer", fontFamily: FONT,
              }}>
                Ne plus afficher
              </button>
              <button onClick={() => isLast ? handleDismiss() : setStep(s => s + 1)} style={{
                padding: "5px 14px", borderRadius: 6, border: "none",
                background: "linear-gradient(135deg,#FFAA00,#FF9D00)", color: "#0a0a0f",
                fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
              }}>
                {isLast ? "Terminé ✨" : "Suivant →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
