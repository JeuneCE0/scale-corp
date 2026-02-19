// HubScale — Base UI Components
import React from 'react';
import { T, FONT } from '../lib/theme.js';
import { clamp, pct } from '../lib/utils.js';

// --- KPI Card ---
export function KPI({ label, value, sub, accent, icon, delay = 0 }) {
  return (
    <div className={`fade-up d${delay} glass-static`} style={{ padding: '16px 18px', flex: '1 1 140px', minWidth: 120, transition: 'all .2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
        <span style={{ color: T.textSecondary, fontSize: 10, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent || T.text, lineHeight: 1.1 }}>{value}</div>
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

export function Btn({ children, onClick, v = 'primary', small, style: sx, disabled, full }) {
  return (
    <button
      className="pressable"
      disabled={disabled}
      onClick={onClick}
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
  if (!open) return null;
  return (
    <div className="fade-in" onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto', backdropFilter: 'blur(8px)' }}>
      <div className="scale-in" onClick={(e) => e.stopPropagation()}
        style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, width: wide ? 700 : 480, maxWidth: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <Btn v="ghost" small onClick={onClose}>✕</Btn>
        </div>
        {children}
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
    <div onClick={onToggle} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 12px', borderRadius: 8, background: on ? T.accentBg : T.surface2, border: `1px solid ${on ? T.accent + '44' : T.border}`, transition: 'all .15s' }}>
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
    <div style={{ width: size, height: size, border: `2px solid ${T.border}`, borderTopColor: color || T.accent, borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
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
