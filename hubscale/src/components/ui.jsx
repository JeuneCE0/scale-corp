// HubScale — Base UI Components
import React, { useState, useEffect, useRef, useCallback, Component } from 'react';
import { T, FONT } from '../lib/theme.js';
import { clamp, pct } from '../lib/utils.js';
import { isPaid, canAccessPro, getTrialInfo } from '../lib/plan.js';

// --- Error Boundary ---
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 4 }}>
            {this.props.fallbackTitle || 'Erreur de chargement'}
          </div>
          <div style={{ color: T.textSecondary, fontSize: 12, marginBottom: 16 }}>
            Une erreur est survenue. Rechargez la page ou réessayez.
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: 'linear-gradient(135deg, #f97316, #f59e0b)', color: '#fff',
              border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13,
              fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
            }}
          >Réessayer</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- KPI Card ---
export function KPI({ label, value, sub, accent, icon, delay = 0, sparkData, helpTip }) {
  return (
    <div className={`fade-up d${delay} glass-static`} style={{ padding: '16px 18px', flex: '1 1 140px', minWidth: 120, transition: 'all .2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
        <span style={{ color: T.textSecondary, fontSize: 10, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>{label}</span>
        {helpTip && <HelpTip text={helpTip} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: accent || T.text, lineHeight: 1.1 }}>{value}</div>
        {sparkData && sparkData.length > 1 && <Sparkline data={sparkData} color={accent || T.accent} />}
      </div>
      {sub && <div style={{ color: T.textSecondary, fontSize: 10, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// --- Button ---
const BTN_VARIANTS = {
  primary: { background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', boxShadow: '0 2px 12px rgba(99,102,241,.3)' },
  secondary: { background: 'rgba(255,255,255,.04)', color: T.text, border: '1px solid rgba(255,255,255,.08)' },
  ghost: { background: 'transparent', color: T.textSecondary, border: '1px solid rgba(255,255,255,.04)' },
  danger: { background: 'rgba(239,68,68,.1)', color: T.red, border: '1px solid rgba(239,68,68,.15)' },
  success: { background: 'rgba(34,197,94,.1)', color: T.green, border: '1px solid rgba(34,197,94,.15)' },
};

export function Btn({ children, onClick, v = 'primary', small, style: sx, disabled, full, 'aria-label': ariaLabel }) {
  return (
    <button
      className="pressable"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        border: 'none', borderRadius: 10, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: FONT, opacity: disabled ? .4 : 1,
        padding: small ? '5px 10px' : '9px 18px', fontSize: small ? 11 : 13,
        width: full ? '100%' : 'auto', letterSpacing: .2,
        ...BTN_VARIANTS[v], ...sx,
      }}
    >{children}</button>
  );
}

// --- Input ---
export function Inp({ label, value, onChange, type = 'text', placeholder, suffix, textarea, small, note, onKeyDown }) {
  return (
    <div style={{ marginBottom: small ? 6 : 12 }}>
      {label && <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 4, letterSpacing: .3 }}>{label}</label>}
      <div className="glass-input" style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {textarea ? (
          <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
            style={{ flex: 1, background: 'transparent', border: 'none', color: T.text, padding: '8px 12px', fontSize: 13, fontFamily: FONT, outline: 'none', resize: 'vertical' }} />
        ) : (
          <input type={type} value={value == null ? '' : value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder}
            style={{ flex: 1, background: 'transparent', border: 'none', color: T.text, padding: small ? '7px 12px' : '10px 12px', fontSize: 13, fontFamily: FONT, outline: 'none', width: '100%' }} />
        )}
        {suffix && <span style={{ padding: '0 10px 0 2px', color: T.textMuted, fontSize: 12, flexShrink: 0 }}>{suffix}</span>}
      </div>
      {note && <div style={{ color: T.textMuted, fontSize: 10, marginTop: 2 }}>{note}</div>}
    </div>
  );
}

// --- Select ---
export function Sel({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{label}</label>}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, padding: '10px 12px', fontSize: 13, fontFamily: FONT, outline: 'none' }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// --- Card ---
export function Card({ children, style: sx, onClick, accent, delay = 0 }) {
  return (
    <div className={`fade-up d${Math.min(delay, 6)} ${onClick ? 'glass hoverable' : 'glass-static'}`}
      onClick={onClick}
      style={{ padding: 16, cursor: onClick ? 'pointer' : 'default', ...(accent ? { borderLeft: `3px solid ${accent}` } : {}), ...sx }}>
      {children}
    </div>
  );
}

// --- Modal ---
export function Modal({ open, onClose, title, children, wide }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', backdropFilter: 'blur(8px)' }}>
      <div ref={modalRef} className="scale-in modal-inner" onClick={(e) => e.stopPropagation()}
        style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, width: wide ? 700 : 480, maxWidth: '100%', maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0 24px', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <Btn v="ghost" small onClick={onClose} aria-label="Fermer">✕</Btn>
        </div>
        <div style={{ padding: '16px 24px 24px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Section ---
export function Section({ children, title, sub, right }) {
  return (
    <div className="fade-up" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
        <div>
          {title && <h2 style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: .5 }}>{title}</h2>}
          {sub && <p style={{ color: T.textSecondary, fontSize: 11, margin: '2px 0 0' }}>{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

// --- Progress Bar ---
export function ProgressBar({ value, max, color, h = 5 }) {
  const w = clamp(pct(value, max), 0, 100);
  return (
    <div style={{ background: T.border, borderRadius: h, height: h, overflow: 'hidden' }}>
      <div style={{ background: color || T.accent, height: '100%', width: `${w}%`, borderRadius: h, transition: 'width .5s ease', transformOrigin: 'left' }} />
    </div>
  );
}

// --- Sparkline (mini inline chart) ---
export function Sparkline({ data = [], color = T.accent, width = 56, height = 20 }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - 2 - ((v - min) / range) * (height - 4)}`).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block', flexShrink: 0 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".7" />
    </svg>
  );
}

// --- Help Tooltip ---
export function HelpTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', marginLeft: 3, verticalAlign: 'middle' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onClick={() => setShow(!show)}>
      <span style={{ width: 13, height: 13, borderRadius: 7, background: T.border, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: T.textMuted, cursor: 'help' }} aria-label={text}>?</span>
      {show && (
        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 10, color: T.textSecondary, whiteSpace: 'nowrap', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,.3)', pointerEvents: 'none' }}>
          {text}
        </div>
      )}
    </span>
  );
}

// --- Badge ---
export function Badge({ label, color, bg }) {
  return (
    <span style={{ background: bg || T.accentBg, color: color || T.accent, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>
      {label}
    </span>
  );
}

// --- Toggle ---
export function Toggle({ on, onToggle, label }) {
  return (
    <div onClick={onToggle} role="switch" aria-checked={on} aria-label={label} tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 12px', borderRadius: 8, background: on ? T.accentBg : T.surface2, border: `1px solid ${on ? T.accent + '44' : T.border}`, transition: 'all .15s' }}>
      <div style={{ width: 28, height: 14, borderRadius: 7, background: on ? T.accent : T.border, position: 'relative', transition: 'background .2s' }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: on ? '#fff' : T.textMuted, position: 'absolute', top: 2, left: on ? 16 : 2, transition: 'left .2s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: on ? T.accent : T.textSecondary }}>{label}</span>
    </div>
  );
}

// --- Spinner ---
export function Spinner({ size = 20, color }) {
  return (
    <div role="status" aria-label="Chargement" style={{ width: size, height: size, border: `2px solid ${T.border}`, borderTopColor: color || T.accent, borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
  );
}

// --- Empty State ---
export function EmptyState({ icon, title, sub, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      {icon && <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>}
      <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ color: T.textSecondary, fontSize: 12, marginBottom: 16 }}>{sub}</div>}
      {action}
    </div>
  );
}

// --- TabBar (reusable sub-tabs) ---
export function TabBar({ items, active, onChange, counts, compact, style: sx }) {
  return (
    <div className="subtabs" role="tablist" style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, ...sx }}>
      {items.map((item) => {
        const isActive = active === item;
        const count = counts?.[item];
        return (
          <button key={item} role="tab" aria-selected={isActive} onClick={() => onChange(item)} style={{
            background: isActive ? T.accentBg : 'transparent', border: 'none', cursor: 'pointer',
            padding: compact ? '7px 10px' : '8px 14px', fontSize: compact ? 10 : 11,
            fontWeight: isActive ? 700 : 500, fontFamily: FONT,
            color: isActive ? T.accent : T.textMuted, transition: 'all .15s', whiteSpace: 'nowrap', flexShrink: 0,
          }}>{count != null ? `${item} (${count})` : item}</button>
        );
      })}
    </div>
  );
}

// --- Toast ---
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);
  return { toasts, add };
}

const TOAST_COLORS = { success: T.green, error: T.red, info: T.blue, warning: T.orange };
export function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map((t) => (
        <div key={t.id} className="slide-down" style={{
          background: T.surface, border: `1px solid ${TOAST_COLORS[t.type] || T.border}44`,
          borderLeft: `3px solid ${TOAST_COLORS[t.type] || T.accent}`,
          borderRadius: 10, padding: '10px 16px', fontSize: 12, fontWeight: 600, color: T.text,
          boxShadow: '0 8px 24px rgba(0,0,0,.3)', animation: 'slideDown .25s ease', maxWidth: 320,
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

// --- Pagination ---
export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
      <Btn v="ghost" small disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Page précédente">← Préc</Btn>
      <span style={{ fontSize: 11, color: T.textSecondary, fontWeight: 600 }}>{page} / {totalPages}</span>
      <Btn v="ghost" small disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Page suivante">Suiv →</Btn>
    </div>
  );
}

// --- ConfirmDialog ---
export function ConfirmDialog({ open, onConfirm, onCancel, title, message }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fade-in" onClick={onCancel} role="alertdialog" aria-modal="true" aria-label={title || 'Confirmation'}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(8px)' }}>
      <div className="scale-in" onClick={(e) => e.stopPropagation()}
        style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, width: 360, maxWidth: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.4)', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: T.text }}>{title || 'Confirmer la suppression'}</h3>
        <p style={{ color: T.textSecondary, fontSize: 12, marginBottom: 20 }}>{message || 'Cette action est irréversible.'}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Btn v="ghost" onClick={onCancel}>Annuler</Btn>
          <Btn v="danger" onClick={onConfirm}>Supprimer</Btn>
        </div>
      </div>
    </div>
  );
}

// --- Skeleton ---
export function Skeleton({ w, h = 12, r = 4, circle, style: sx }) {
  return <div className="skeleton" style={{ width: circle ? h : (w || '100%'), height: h, borderRadius: circle ? '50%' : r, ...sx }} />;
}

// --- Confetti ---
export function triggerConfetti() {
  const colors = ['#f97316', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ef4444'];
  for (let i = 0; i < 30; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    el.style.width = (Math.random() * 8 + 4) + 'px';
    el.style.height = (Math.random() * 8 + 4) + 'px';
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.animationDelay = (Math.random() * 0.5) + 's';
    el.style.animationDuration = (1.5 + Math.random()) + 's';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

// --- ScoreRing ---
export function ScoreRing({ score, size = 48, strokeWidth = 4, color, children }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const c = color || (score >= 70 ? T.green : score >= 40 ? T.orange : T.red);
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke-dashoffset .8s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children || <span style={{ fontSize: size * 0.22, fontWeight: 800, color: c }}>{score}</span>}
      </div>
    </div>
  );
}

// --- StreakBadge ---
export function StreakBadge({ count }) {
  if (!count) return null;
  return (
    <div className="streak-badge" style={{ background: T.orangeBg, color: T.orange, border: `1px solid ${T.orange}33` }}>
      <span style={{ fontSize: 13 }}>🔥</span>
      <span>{count} mois</span>
    </div>
  );
}

// --- WeatherWidget ---
export function WeatherWidget({ weather, score }) {
  if (!weather) return null;
  return (
    <div className="bounce-in" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 12, background: weather.color + '15', border: `1px solid ${weather.color}33` }}>
      <span style={{ fontSize: 24 }}>{weather.icon}</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: weather.color }}>{weather.label}</div>
        <div style={{ fontSize: 9, color: T.textMuted }}>Score santé: {score}/100</div>
      </div>
    </div>
  );
}

// --- ChecklistItem ---
export function ChecklistItem({ done, label, icon, onClick }) {
  return (
    <div onClick={onClick} className="hoverable" style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10,
      background: done ? T.greenBg : T.surface2, border: `1px solid ${done ? T.green + '33' : T.border}`,
      cursor: onClick ? 'pointer' : 'default', transition: 'all .2s',
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 10, flexShrink: 0,
        border: `2px solid ${done ? T.green : T.border}`,
        background: done ? T.green : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .2s',
      }}>
        {done && <span className="check-bounce" style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
      </div>
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      <span style={{ fontSize: 12, fontWeight: 600, color: done ? T.green : T.text, textDecoration: done ? 'line-through' : 'none', transition: 'all .2s' }}>{label}</span>
    </div>
  );
}

// --- AnimatedNumber ---
export function AnimatedNumber({ value, prefix = '', suffix = '', color, size = 26 }) {
  const [display, setDisplay] = React.useState(value);
  const [animating, setAnimating] = React.useState(false);
  React.useEffect(() => {
    if (display !== value) {
      setAnimating(true);
      const timer = setTimeout(() => { setDisplay(value); setAnimating(false); }, 300);
      return () => clearTimeout(timer);
    }
  }, [value, display]);
  return (
    <span className={animating ? 'number-tick' : ''} style={{ fontSize: size, fontWeight: 800, color: color || T.text, lineHeight: 1.1, display: 'inline-block' }}>
      {prefix}{display}{suffix}
    </span>
  );
}

// --- NotificationDot ---
export function NotificationDot({ count }) {
  if (!count) return null;
  return (
    <span style={{
      position: 'absolute', top: -2, right: -2,
      minWidth: 14, height: 14, borderRadius: 7,
      background: T.red, color: '#fff',
      fontSize: 8, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 3px', lineHeight: 1,
    }}>{count > 9 ? '9+' : count}</span>
  );
}

// --- Premium Gate (blur overlay with upgrade CTA) ---
export function PremiumGate({ children, requiredPlan = 'professional', label, blur = true }) {
  const paid = isPaid();
  const unlocked = requiredPlan === 'starter' ? paid : canAccessPro();
  if (unlocked) return children;

  const trial = getTrialInfo();
  const daysLeft = trial ? trial.daysLeft : null;

  const goSettings = () => {
    const el = document.querySelector('[data-tab="settings"]') || document.querySelector('[aria-label="Paramètres"]');
    if (el) el.click();
    else window.dispatchEvent(new CustomEvent('hs:navigate', { detail: 'settings' }));
  };

  return (
    <div
      onClick={blur ? goSettings : undefined}
      style={{
        position: 'relative', borderRadius: 18, cursor: blur ? 'pointer' : 'default',
        padding: 2, /* space for the animated border */
        background: 'transparent', overflow: 'hidden',
      }}
    >
      {/* ── Animated spinning conic border (the "flame" ring) ── */}
      <div style={{
        position: 'absolute', inset: -40,
        background: 'conic-gradient(from 0deg, #f97316, #f59e0b, #ef4444, #f97316, transparent 40%, transparent 60%, #f97316, #ef4444, #f59e0b, #f97316)',
        animation: 'premiumSpin 3s linear infinite',
        zIndex: 0, borderRadius: 18,
      }} />
      {/* ── Glow pulse behind the border ── */}
      <div style={{
        position: 'absolute', inset: -8,
        background: 'conic-gradient(from 0deg, rgba(249,115,22,.4), rgba(245,158,11,.3), rgba(239,68,68,.3), rgba(249,115,22,.4), transparent 40%, transparent 60%, rgba(249,115,22,.4))',
        animation: 'premiumSpin 3s linear infinite, premiumGlow 2s ease-in-out infinite',
        zIndex: 0, borderRadius: 22,
      }} />

      {/* ── Inner content container ── */}
      <div style={{
        position: 'relative', zIndex: 1, borderRadius: 16,
        background: T.bg, overflow: 'hidden',
      }}>
        {blur && (
          <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.65 }}>
            {children}
          </div>
        )}
        <div style={{
          position: blur ? 'absolute' : 'relative', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 10, padding: 28, textAlign: 'center',
          background: blur ? 'rgba(9,9,11,.5)' : 'transparent',
          borderRadius: 16,
        }}>
          {/* ── Lock icon with pulse ── */}
          <div style={{
            width: 52, height: 52, borderRadius: 16, position: 'relative',
            background: 'linear-gradient(135deg, #f97316, #ef4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, boxShadow: '0 6px 28px rgba(249,115,22,.4)',
            animation: 'premiumBounce 2s ease-in-out infinite',
          }}>
            <span style={{ fontSize: 24 }}>{'🔒'}</span>
            {/* Shine sweep */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 16, overflow: 'hidden',
              pointerEvents: 'none',
            }}>
              <div style={{
                position: 'absolute', top: 0, width: '40%', height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.3), transparent)',
                animation: 'premiumShine 2.5s ease-in-out infinite',
              }} />
            </div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 4 }}>
            {label || 'Fonctionnalité Premium'}
          </div>
          <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 18, maxWidth: 300, lineHeight: 1.5 }}>
            {daysLeft != null
              ? `Débloquez cette fonctionnalité maintenant — il vous reste ${daysLeft}j d'essai gratuit !`
              : 'Débloquez cette fonctionnalité et passez au niveau supérieur.'}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); goSettings(); }}
            style={{
              background: 'linear-gradient(135deg, #f97316, #ef4444)',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '12px 28px', fontSize: 14, fontWeight: 800,
              cursor: 'pointer', fontFamily: FONT, letterSpacing: 0.3,
              boxShadow: '0 6px 24px rgba(249,115,22,.4), inset 0 1px 0 rgba(255,255,255,.15)',
              transition: 'transform .15s ease, box-shadow .15s ease',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px) scale(1.03)'; e.target.style.boxShadow = '0 8px 32px rgba(249,115,22,.5), inset 0 1px 0 rgba(255,255,255,.15)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'translateY(0) scale(1)'; e.target.style.boxShadow = '0 6px 24px rgba(249,115,22,.4), inset 0 1px 0 rgba(255,255,255,.15)'; }}
          >
            {'🔓'} Débloquer maintenant
          </button>
          {requiredPlan === 'professional' && (
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 10 }}>
              Forfait Professional et supérieur
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Upgrade Banner (subtle inline CTA for trial users) ---
export function UpgradeBanner() {
  const paid = isPaid();
  if (paid) return null;

  const trial = getTrialInfo();
  const daysLeft = trial ? trial.daysLeft : null;

  return (
    <div className="fade-up" style={{
      background: 'linear-gradient(135deg, rgba(249,115,22,.1), rgba(245,158,11,.1))',
      border: '1px solid rgba(249,115,22,.2)',
      borderRadius: 12, padding: '12px 18px', marginBottom: 16,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{'⚡'}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.orange }}>
            {daysLeft != null ? `Plus que ${daysLeft} jours d'essai gratuit` : 'Essai gratuit'}
          </div>
          <div style={{ fontSize: 10, color: T.textSecondary }}>
            Souscrivez maintenant pour débloquer toutes les fonctionnalités
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          const el = document.querySelector('[aria-label="Paramètres"]');
          if (el) el.click();
          else window.dispatchEvent(new CustomEvent('hs:navigate', { detail: 'settings' }));
        }}
        style={{
          background: 'linear-gradient(135deg, #f97316, #f59e0b)',
          color: '#fff', border: 'none', borderRadius: 8,
          padding: '7px 16px', fontSize: 11, fontWeight: 700,
          cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap',
        }}
      >
        Souscrire
      </button>
    </div>
  );
}
