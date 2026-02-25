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

/** Same month previous year */
export const sameMonthLastYear = (m) => {
  const [y, mo] = m.split('-');
  return `${parseInt(y) - 1}-${mo}`;
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

/** Days since a given ISO date */
export const daysSince = (isoDate) => {
  if (!isoDate) return 0;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
};

/** Days until a given date string */
export const daysUntil = (dateStr) => {
  if (!dateStr) return Infinity;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
};

/** Format date FR: "23 fév. 2026" */
export const formatDateFR = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Format time: "14:30" */
export const formatTime = (t) => t || '';

/** Validate email address */
export const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** Simple linear forecast for CA based on history trend */
export function forecastCA(history, months = 3) {
  if (!history || history.length < 2) return [];
  const data = history.slice(-6).map((r, i) => ({ x: i, y: r.ca || 0 }));
  const n = data.length;
  const sumX = data.reduce((s, d) => s + d.x, 0);
  const sumY = data.reduce((s, d) => s + d.y, 0);
  const sumXY = data.reduce((s, d) => s + d.x * d.y, 0);
  const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
  const intercept = (sumY - slope * sumX) / n;
  const result = [];
  const lastKey = history[history.length - 1].key;
  let key = lastKey;
  for (let i = 1; i <= months; i++) {
    key = nextMonth(key);
    result.push({ key, ca: Math.max(0, Math.round(slope * (n - 1 + i) + intercept)) });
  }
  return result;
}

/** Lead score (0-100) based on contact data completeness and age */
export function leadScore(contact) {
  let score = 0;
  if (contact.name) score += 10;
  if (contact.email) score += 20;
  if (contact.company) score += 15;
  if (contact.phone) score += 15;
  if (contact.notes) score += 5;
  const comments = (contact.commentaires || []).length;
  score += Math.min(comments * 5, 15);
  // Status bonus
  if (contact.status === 'lead') score += 10;
  if (contact.status === 'client') score += 20;
  if (contact.status === 'partenaire') score += 20;
  // Age penalty for stale contacts
  const days = daysSince(contact.createdAt);
  if (contact.status === 'prospect' && days > 30) score -= 10;
  if (contact.status === 'lead' && days > 45) score -= 10;
  return clamp(score, 0, 100);
}

/** Business health score (0-100) */
export function businessHealth(finHistory, contacts, integrations) {
  let score = 0;
  // Financial health (0-40)
  if (finHistory && finHistory.length > 0) {
    score += 10;
    const last = finHistory[finHistory.length - 1];
    if (last.ca > 0) score += 10;
    if (last.result > 0) score += 10;
    if (last.ca && (last.result / last.ca) > 0.2) score += 10;
  }
  // CRM health (0-30)
  if (contacts && contacts.length > 0) {
    score += 10;
    const clients = contacts.filter(c => c.status === 'client').length;
    if (clients > 0) score += 10;
    if (contacts.length >= 5) score += 10;
  }
  // Integration health (0-30)
  if (integrations) {
    const connected = Object.values(integrations).filter(Boolean).length;
    score += Math.min(connected * 6, 30);
  }
  return clamp(score, 0, 100);
}

/** Get weather emoji based on health score */
export function businessWeather(score) {
  if (score >= 80) return { icon: '☀️', label: 'Excellent', color: '#22c55e' };
  if (score >= 60) return { icon: '🌤️', label: 'Bon', color: '#f59e0b' };
  if (score >= 40) return { icon: '⛅', label: 'Moyen', color: '#f97316' };
  if (score >= 20) return { icon: '🌧️', label: 'Attention', color: '#ef4444' };
  return { icon: '⛈️', label: 'Critique', color: '#dc2626' };
}

/** Check streak: consecutive days with data entry */
export function getStreak(finHistory) {
  if (!finHistory || finHistory.length === 0) return 0;
  // Count consecutive months with data
  let streak = 0;
  const sorted = [...finHistory].sort((a, b) => b.key.localeCompare(a.key));
  let expected = curMonth();
  for (const row of sorted) {
    if (row.key === expected) {
      streak++;
      expected = prevMonth(expected);
    } else {
      break;
    }
  }
  return streak;
}

/** Generate next invoice number: FA-2026-001 */
export function nextInvoiceNumber(invoices) {
  const year = new Date().getFullYear();
  const prefix = `FA-${year}-`;
  const existing = (invoices || [])
    .filter((inv) => inv.number && inv.number.startsWith(prefix))
    .map((inv) => parseInt(inv.number.replace(prefix, ''), 10))
    .filter((n) => !isNaN(n));
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

/** Check if invoice is overdue */
export function isInvoiceOverdue(invoice) {
  if (!invoice || invoice.status === 'paid' || invoice.status === 'draft') return false;
  if (!invoice.dueDate) return false;
  return new Date(invoice.dueDate) < new Date();
}

/** Compute invoice totals */
export function computeInvoiceTotals(items, defaultTva = 20) {
  let totalHT = 0;
  let totalTVA = 0;
  (items || []).forEach((item) => {
    const lineHT = (item.qty || 0) * (item.unitPrice || 0);
    const tvaRate = item.tva != null ? item.tva : defaultTva;
    totalHT += lineHT;
    totalTVA += lineHT * (tvaRate / 100);
  });
  return {
    totalHT: Math.round(totalHT * 100) / 100,
    totalTVA: Math.round(totalTVA * 100) / 100,
    totalTTC: Math.round((totalHT + totalTVA) * 100) / 100,
  };
}

/** Weekly recap: compute stats for the current week */
export function weeklyRecap(finHistory, contacts, events, invoices) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // New contacts this week
  const newContacts = (contacts || []).filter((c) => {
    if (!c.createdAt) return false;
    const d = new Date(c.createdAt);
    return d >= weekStart && d <= now;
  });

  // New clients this week
  const newClients = newContacts.filter((c) => c.status === 'client').length;

  // Events this week
  const weekEvents = (events || []).filter((e) => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d >= weekStart && d <= weekEnd;
  });

  // Invoices this week
  const weekInvoices = (invoices || []).filter((inv) => {
    if (!inv.createdAt) return false;
    const d = new Date(inv.createdAt);
    return d >= weekStart && d <= now;
  });
  const invoicedAmount = weekInvoices.reduce((s, inv) => s + (inv.totalTTC || 0), 0);
  const paidAmount = weekInvoices.filter((inv) => inv.status === 'paid').reduce((s, inv) => s + (inv.totalTTC || 0), 0);

  // Current month financial data
  const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const curMonth = (finHistory || []).find((r) => r.key === curKey);

  return {
    newContacts: newContacts.length,
    newClients,
    weekEvents: weekEvents.length,
    completedEvents: weekEvents.filter((e) => new Date(e.date) < now).length,
    upcomingEvents: weekEvents.filter((e) => new Date(e.date) >= now).length,
    invoicesCreated: weekInvoices.length,
    invoicedAmount,
    paidAmount,
    currentCA: curMonth?.ca || 0,
    currentCharges: curMonth?.charges || 0,
    currentResult: curMonth?.result || 0,
  };
}

/** Generate demo contacts for onboarding */
export function generateDemoContacts() {
  const now = new Date();
  return [
    { id: uid(), name: 'Marie Dupont', email: 'marie@techsolutions.fr', company: 'TechSolutions', phone: '+33 6 12 34 56 78', status: 'client', notes: 'Cliente depuis 2 ans', commentaires: [{ text: 'Renouvellement contrat en cours', date: new Date(now - 2 * 86400000).toISOString() }], createdAt: new Date(now - 90 * 86400000).toISOString() },
    { id: uid(), name: 'Pierre Martin', email: 'p.martin@webagency.fr', company: 'WebAgency', phone: '+33 6 98 76 54 32', status: 'lead', notes: 'Intéressé par offre Pro', commentaires: [{ text: 'Demo planifiée semaine prochaine', date: new Date(now - 1 * 86400000).toISOString() }], createdAt: new Date(now - 15 * 86400000).toISOString() },
    { id: uid(), name: 'Sophie Bernard', email: 'sophie@ecom-plus.com', company: 'E-Com Plus', phone: '+33 7 11 22 33 44', status: 'prospect', notes: '', commentaires: [], createdAt: new Date(now - 5 * 86400000).toISOString() },
    { id: uid(), name: 'Lucas Moreau', email: 'lucas@startuplab.io', company: 'StartupLab', phone: '+33 6 55 66 77 88', status: 'prospect', notes: 'Rencontré au salon Tech', commentaires: [], createdAt: new Date(now - 3 * 86400000).toISOString() },
    { id: uid(), name: 'Camille Leroy', email: 'c.leroy@designco.fr', company: 'DesignCo', phone: '+33 7 99 88 77 66', status: 'client', notes: 'Client premium', commentaires: [{ text: 'Facture envoyée', date: new Date(now - 7 * 86400000).toISOString() }, { text: 'Paiement reçu', date: new Date(now - 3 * 86400000).toISOString() }], createdAt: new Date(now - 120 * 86400000).toISOString() },
    { id: uid(), name: 'Antoine Petit', email: 'antoine@consulting-360.fr', company: 'Consulting 360', phone: '', status: 'partenaire', notes: 'Partenariat référencement', commentaires: [], createdAt: new Date(now - 200 * 86400000).toISOString() },
    { id: uid(), name: 'Julien Faure', email: 'j.faure@dataflow.io', company: 'DataFlow', phone: '+33 6 44 33 22 11', status: 'perdu', notes: 'Budget insuffisant', commentaires: [{ text: 'A relancer en Q3', date: new Date(now - 30 * 86400000).toISOString() }], createdAt: new Date(now - 60 * 86400000).toISOString() },
  ];
}

/** Generate demo events for onboarding */
export function generateDemoEvents() {
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
  const in3Days = new Date(today); in3Days.setDate(in3Days.getDate() + 3);
  const fmt = (d) => d.toISOString().split('T')[0];
  return [
    { id: uid(), title: 'Call découverte — StartupLab', date: fmt(tomorrow), time: '10:00', type: 'call', description: 'Premier appel avec Lucas Moreau', recurrence: 'none', meetingLink: '' },
    { id: uid(), title: 'Point hebdo équipe', date: fmt(in3Days), time: '14:00', type: 'reunion', description: 'Review KPIs + pipeline', recurrence: 'weekly', meetingLink: 'https://meet.google.com/abc-defg-hij' },
    { id: uid(), title: 'Deadline proposal WebAgency', date: fmt(nextWeek), time: '', type: 'deadline', description: 'Envoyer la proposition commerciale', recurrence: 'none', meetingLink: '' },
  ];
}

/** Generate demo financial history */
export function generateDemoFinHistory() {
  const rows = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const base = 22000 + Math.round(Math.random() * 8000);
    const growth = (5 - i) * 800;
    const ca = base + growth;
    const fixed = 8000 + Math.round(Math.random() * 2000);
    const variable = 2000 + Math.round(Math.random() * 3000);
    const charges = fixed + variable;
    const catLoyer = 1500 + Math.round(Math.random() * 300);
    const catSalaires = 3000 + Math.round(Math.random() * 2000);
    const catMarketing = 800 + Math.round(Math.random() * 1200);
    const catOutils = 200 + Math.round(Math.random() * 300);
    const catAutre = Math.max(0, charges - catLoyer - catSalaires - catMarketing - catOutils);
    const categories = { loyer: catLoyer, salaires: catSalaires, marketing: catMarketing, outils: catOutils, autre: catAutre };
    rows.push({ key, ca, charges, result: ca - charges, treso: 15000 + Math.round(Math.random() * 10000), categories });
  }
  return rows;
}
