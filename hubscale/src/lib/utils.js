// HubScale — Utility functions

/** Format number FR style: 1 234 567 */
export const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

/** Format compact: 1.2K, 34K */
export const fK = (n) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace('.0', '')}K` : String(Math.round(n || 0));

/** Percent */
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

/** Clamp value */
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Parse float safely */
export const pf = (v) => parseFloat(v) || 0;

/** Generate unique ID */
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Month names FR */
export const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

/** Current month as YYYY-MM */
export const curMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Previous month */
export const prevMonth = (m) => {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Next month */
export const nextMonth = (m) => {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Format month label: "Jan 2026" */
export const monthLabel = (k) => {
  if (!k) return '';
  const [y, m] = k.split('-');
  return `${MONTHS_FR[parseInt(m) - 1]} ${y}`;
};

/** Relative time: "il y a 3h" */
export const ago = (d) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1e3);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)}min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)}h`;
  return `il y a ${Math.floor(s / 86400)}j`;
};

/** Deadline label */
export const deadline = (m) => {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo, 5).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
};

/** Current week as YYYY-Wxx */
export const curWeek = () => {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return `${d.getFullYear()}-W${String(Math.ceil(((d - jan1) / 864e5 + jan1.getDay() + 1) / 7)).padStart(2, '0')}`;
};
