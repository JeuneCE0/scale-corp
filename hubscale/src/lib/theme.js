// HubScale Design Tokens — Dark-first design system

export const DARK = {
  bg: '#09090b',
  surface: '#111113',
  surface2: '#18181b',
  border: '#27272a',
  borderLight: '#3f3f46',
  text: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#52525b',
  accent: '#6366f1',    // Indigo
  accentHover: '#818cf8',
  accentBg: 'rgba(99,102,241,.1)',
  green: '#22c55e',
  greenBg: 'rgba(34,197,94,.1)',
  red: '#ef4444',
  redBg: 'rgba(239,68,68,.1)',
  orange: '#f97316',
  orangeBg: 'rgba(249,115,22,.1)',
  blue: '#3b82f6',
  blueBg: 'rgba(59,130,246,.1)',
  purple: '#a855f7',
  purpleBg: 'rgba(168,85,247,.1)',
};

export const LIGHT = {
  bg: '#fafafa',
  surface: '#ffffff',
  surface2: '#f4f4f5',
  border: '#e4e4e7',
  borderLight: '#d4d4d8',
  text: '#09090b',
  textSecondary: '#52525b',
  textMuted: '#a1a1aa',
  accent: '#6366f1',
  accentHover: '#4f46e5',
  accentBg: 'rgba(99,102,241,.08)',
  green: '#16a34a',
  greenBg: '#dcfce7',
  red: '#dc2626',
  redBg: '#fee2e2',
  orange: '#ea580c',
  orangeBg: '#fff7ed',
  blue: '#2563eb',
  blueBg: '#dbeafe',
  purple: '#9333ea',
  purpleBg: '#f3e8ff',
};

// Mutable current theme reference
export let T = DARK;

export function getTheme() {
  try { return localStorage.getItem('hs_theme') || 'dark'; } catch { return 'dark'; }
}

export function applyTheme(mode) {
  try { localStorage.setItem('hs_theme', mode); } catch {}
  T = mode === 'light' ? LIGHT : DARK;
  try {
    document.documentElement.setAttribute('data-theme', mode);
    document.body.style.transition = 'background .3s ease, color .3s ease';
  } catch {}
}

// Init on load
applyTheme(getTheme());

export const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
