import React, { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { T, FONT } from '../lib/theme.js';
import { fK, fmt, ago, businessHealth, businessWeather, getStreak, forecastCA, daysSince, daysUntil, leadScore } from '../lib/utils.js';
import { load, store } from '../lib/store.js';
import { KPI, Card, Badge, ProgressBar, Spinner, Btn, Inp, HelpTip, ScoreRing, StreakBadge, WeatherWidget, ChecklistItem, AnimatedNumber, Sparkline, PremiumGate, UpgradeBanner, ErrorBoundary } from '../components/ui.jsx';
import { ONBOARDING_CHECKLIST, CRM_STATUSES, NOTIFICATION_TYPES, INTEGRATIONS, EXPENSE_CATEGORIES, INVOICE_STATUSES } from '../lib/constants.js';
import { getIntegrationMeta } from '../lib/integrationData.js';

/* ------------------------------------------------------------------ */
/*  Lazy-loaded Recharts                                               */
/* ------------------------------------------------------------------ */
const LazyChart = lazy(() =>
  import('recharts').then((mod) => ({
    default: function CAChart() {
      const { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } = mod;
      const history = load('finHistory') || [];
      const caGoal = load('caGoal') || 0;
      const forecast = forecastCA(history, 3);
      const CA_DATA = history.slice(-6).map((r) => {
        const [, m] = (r.key || '').split('-');
        const months = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        return { month: months[parseInt(m)] || r.key, ca: r.ca || 0, charges: r.charges || 0, type: 'actual' };
      });
      forecast.forEach((f) => {
        const [, m] = (f.key || '').split('-');
        const months = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        CA_DATA.push({ month: months[parseInt(m)] || f.key, ca: f.ca, charges: 0, forecast: f.ca, type: 'forecast' });
      });
      if (CA_DATA.length === 0) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 11, color: T.textMuted }}>Aucune donnée financière</div>;
      const avgCharges = Math.round(CA_DATA.filter(d => d.charges > 0).reduce((s, d) => s + d.charges, 0) / (CA_DATA.filter(d => d.charges > 0).length || 1));
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={CA_DATA}>
            <defs>
              <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.green} stopOpacity={0.3} />
                <stop offset="100%" stopColor={T.green} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.blue} stopOpacity={0.2} />
                <stop offset="100%" stopColor={T.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fK} />
            <Tooltip
              contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, color: T.text }}
              labelStyle={{ color: T.text, fontWeight: 700 }}
              itemStyle={{ color: T.text }}
              cursor={{ fill: 'rgba(255,255,255,.05)' }}
              formatter={(v, name) => {
                if (name === 'forecast') return [`${fmt(v)} €`, 'Prevision'];
                return [`${fmt(v)} €`, name === 'ca' ? 'CA' : 'Charges'];
              }}
            />
            <Area type="monotone" dataKey="ca" stroke={T.green} strokeWidth={2} fill="url(#caGrad)" />
            <Area type="monotone" dataKey="charges" stroke={T.red} strokeWidth={1.5} fill="none" strokeDasharray="4 3" />
            <Area type="monotone" dataKey="forecast" stroke={T.blue} strokeWidth={2} fill="url(#forecastGrad)" strokeDasharray="6 3" />
            {avgCharges > 0 && <ReferenceLine y={avgCharges} stroke={T.red} strokeDasharray="3 3" strokeWidth={1} label={{ value: `Seuil: ${fmt(avgCharges)} €`, fill: T.textMuted, fontSize: 8, position: 'left' }} />}
            {caGoal > 0 && <ReferenceLine y={caGoal} stroke={T.orange} strokeDasharray="6 3" strokeWidth={1.5} label={{ value: `Objectif: ${fmt(caGoal)} €`, fill: T.orange, fontSize: 9, position: 'right' }} />}
          </AreaChart>
        </ResponsiveContainer>
      );
    },
  }))
);

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
// Key integrations to track in the health panel (top 8 most relevant)
const KEY_INTEGRATIONS = ['Stripe', 'Revolut', 'Google Calendar', 'GoHighLevel', 'HubSpot', 'Meta Ads', 'Slack', 'Notion'];

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

/* ================================================================== */
/*  DASHBOARD COMPONENT                                                */
/* ================================================================== */
export default function Dashboard({ onNavigate }) {
  /* ---------------------------------------------------------------- */
  /*  Data from localStorage                                           */
  /* ---------------------------------------------------------------- */
  const contacts = useMemo(() => load('contacts') || [], []);
  const events = useMemo(() => load('events') || [], []);
  const finHistory = useMemo(() => load('finHistory') || [], []);
  const integrations = useMemo(() => load('integrations') || {}, []);
  const caGoal = useMemo(() => load('caGoal') || 0, []);
  const companyInfo = useMemo(() => load('companyInfo') || {}, []);

  /* ---------------------------------------------------------------- */
  /*  Business Health & Weather                                        */
  /* ---------------------------------------------------------------- */
  const healthScore = useMemo(() => businessHealth(finHistory, contacts, integrations), [finHistory, contacts, integrations]);
  const weather = useMemo(() => businessWeather(healthScore), [healthScore]);
  const streak = useMemo(() => getStreak(finHistory), [finHistory]);

  /* ---------------------------------------------------------------- */
  /*  CA Forecast                                                      */
  /* ---------------------------------------------------------------- */
  const forecast = useMemo(() => forecastCA(finHistory, 3), [finHistory]);
  const forecastLabel = useMemo(() => {
    if (!forecast.length || !finHistory.length) return null;
    const lastCA = finHistory[finHistory.length - 1]?.ca || 0;
    const forecastEnd = forecast[forecast.length - 1]?.ca || 0;
    if (!lastCA) return null;
    const pctChange = Math.round(((forecastEnd - lastCA) / lastCA) * 100);
    return { pct: pctChange, value: forecastEnd };
  }, [forecast, finHistory]);

  /* ---------------------------------------------------------------- */
  /*  Pipeline from CRM contacts                                       */
  /* ---------------------------------------------------------------- */
  const pipeline = useMemo(() => {
    const clientCount = contacts.filter((c) => c.status === 'client').length;
    const avgCAPerClient = clientCount > 0 && finHistory.length > 0
      ? Math.round((finHistory[finHistory.length - 1]?.ca || 0) / clientCount)
      : 0;
    return [
      { stage: 'Prospect', count: contacts.filter((c) => c.status === 'prospect').length, color: T.orange, status: 'prospect' },
      { stage: 'Lead', count: contacts.filter((c) => c.status === 'lead').length, color: T.blue, status: 'lead' },
      { stage: 'Client', count: contacts.filter((c) => c.status === 'client').length, color: T.green, status: 'client' },
      { stage: 'Partenaire', count: contacts.filter((c) => c.status === 'partenaire').length, color: T.purple, status: 'partenaire' },
      { stage: 'Perdu', count: contacts.filter((c) => c.status === 'perdu').length, color: T.red, status: 'perdu' },
    ].map((p) => ({
      ...p,
      value: p.count * avgCAPerClient,
    }));
  }, [contacts, finHistory]);

  const maxPipeline = useMemo(() => Math.max(...pipeline.map((p) => p.count), 1), [pipeline]);

  /* ---------------------------------------------------------------- */
  /*  KPI data                                                         */
  /* ---------------------------------------------------------------- */
  const lastRow = useMemo(() => finHistory[finHistory.length - 1] || {}, [finHistory]);
  const prevRow = useMemo(() => finHistory.length >= 2 ? finHistory[finHistory.length - 2] : null, [finHistory]);
  const caEvo = prevRow && prevRow.ca ? Math.round(((lastRow.ca - prevRow.ca) / prevRow.ca) * 100) : null;
  const sparkCA = useMemo(() => finHistory.slice(-6).map((r) => r.ca || 0), [finHistory]);
  const sparkCharges = useMemo(() => finHistory.slice(-6).map((r) => r.charges || 0), [finHistory]);
  const sparkResult = useMemo(() => finHistory.slice(-6).map((r) => r.result || 0), [finHistory]);

  /* ---------------------------------------------------------------- */
  /*  Daily Actions ("Actions du jour")                                */
  /* ---------------------------------------------------------------- */
  const dailyActions = useMemo(() => {
    const actions = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Contacts to follow up: prospects > 14 days, leads > 21 days
    const staleProspects = contacts.filter((c) => c.status === 'prospect' && daysSince(c.createdAt) > 14);
    const staleLeads = contacts.filter((c) => c.status === 'lead' && daysSince(c.createdAt) > 21);
    const followUpCount = staleProspects.length + staleLeads.length;
    if (followUpCount > 0) {
      actions.push({
        id: 'followup',
        icon: NOTIFICATION_TYPES.relance.icon,
        color: NOTIFICATION_TYPES.relance.color,
        bg: NOTIFICATION_TYPES.relance.bg,
        text: `${followUpCount} contact${followUpCount > 1 ? 's' : ''} a relancer`,
        detail: staleProspects.length > 0 ? `${staleProspects.length} prospect${staleProspects.length > 1 ? 's' : ''} > 14j` : '' +
          (staleLeads.length > 0 ? `${staleProspects.length > 0 ? ', ' : ''}${staleLeads.length} lead${staleLeads.length > 1 ? 's' : ''} > 21j` : ''),
        tab: 'crm',
        priority: 1,
      });
    }

    // 2. Today's events
    const todayEvents = events.filter((e) => e.date === todayStr);
    if (todayEvents.length > 0) {
      actions.push({
        id: 'events',
        icon: NOTIFICATION_TYPES.event.icon,
        color: NOTIFICATION_TYPES.event.color,
        bg: NOTIFICATION_TYPES.event.bg,
        text: `${todayEvents.length} événement${todayEvents.length > 1 ? 's' : ''} aujourd'hui`,
        detail: todayEvents.map((e) => `${e.time || ''} ${e.title}`).join(', '),
        tab: 'agenda',
        priority: 2,
      });
    }

    // 3. Upcoming events (next 3 days)
    const upcomingEvents = events.filter((e) => {
      const d = daysUntil(e.date);
      return d > 0 && d <= 3;
    });
    if (upcomingEvents.length > 0 && todayEvents.length === 0) {
      actions.push({
        id: 'upcoming',
        icon: '📋',
        color: T.blue,
        bg: T.blueBg,
        text: `${upcomingEvents.length} événement${upcomingEvents.length > 1 ? 's' : ''} dans les 3 prochains jours`,
        detail: upcomingEvents.map((e) => e.title).join(', '),
        tab: 'agenda',
        priority: 3,
      });
    }

    // 4. Missing financial data for current month
    const curMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const hasCurrentMonthData = finHistory.some((r) => r.key === curMonthKey);
    if (!hasCurrentMonthData) {
      actions.push({
        id: 'finance',
        icon: NOTIFICATION_TYPES.finance.icon,
        color: NOTIFICATION_TYPES.finance.color,
        bg: NOTIFICATION_TYPES.finance.bg,
        text: 'Données financières manquantes ce mois',
        detail: `Aucune saisie pour ${curMonthKey}`,
        tab: 'data',
        priority: 2,
      });
    }

    // 5. Incomplete checklist items
    const checklistState = getChecklistState();
    const incomplete = ONBOARDING_CHECKLIST.filter((item) => !checklistState[item.id]);
    if (incomplete.length > 0 && incomplete.length < ONBOARDING_CHECKLIST.length) {
      actions.push({
        id: 'checklist',
        icon: NOTIFICATION_TYPES.tip.icon,
        color: NOTIFICATION_TYPES.tip.color,
        bg: NOTIFICATION_TYPES.tip.bg,
        text: `${incomplete.length} etape${incomplete.length > 1 ? 's' : ''} de configuration restante${incomplete.length > 1 ? 's' : ''}`,
        detail: incomplete.map((i) => i.label).slice(0, 2).join(', '),
        tab: incomplete[0].tab,
        priority: 4,
      });
    }

    return actions.sort((a, b) => a.priority - b.priority);
  }, [contacts, events, finHistory]);

  /* ---------------------------------------------------------------- */
  /*  Onboarding Checklist                                             */
  /* ---------------------------------------------------------------- */
  function getChecklistState() {
    const hasContacts = contacts.length > 0;
    const hasFinance = finHistory.length > 0;
    const hasEvents = events.length > 0;
    const hasIntegrations = Object.values(integrations).some(Boolean);
    const hasCompany = !!(companyInfo.name || companyInfo.siret);
    return {
      company: hasCompany,
      contact: hasContacts,
      finance: hasFinance,
      event: hasEvents,
      integration: hasIntegrations,
    };
  }

  const checklistState = useMemo(() => getChecklistState(), [contacts, finHistory, events, integrations, companyInfo]);
  const checklistCompleted = useMemo(() => Object.values(checklistState).filter(Boolean).length, [checklistState]);
  const checklistTotal = ONBOARDING_CHECKLIST.length;
  const allChecklistDone = checklistCompleted === checklistTotal;
  const [checklistDismissed, setChecklistDismissed] = useState(() => {
    try { return localStorage.getItem('hs_checklist_dismissed') === '1'; } catch { return false; }
  });
  const dismissChecklist = useCallback(() => {
    setChecklistDismissed(true);
    try { localStorage.setItem('hs_checklist_dismissed', '1'); } catch {}
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Weekly/Monthly Objective                                         */
  /* ---------------------------------------------------------------- */
  const [objective, setObjective] = useState(() => load('dashboard_objective') || { text: '', target: 0, current: 0, type: 'monthly' });
  const [editingObjective, setEditingObjective] = useState(false);
  const [objDraft, setObjDraft] = useState({ text: '', target: '', current: '' });
  const objectiveReached = objective.target > 0 && objective.current >= objective.target;
  const [showCelebration, setShowCelebration] = useState(false);

  const startEditObjective = useCallback(() => {
    setObjDraft({ text: objective.text, target: String(objective.target || ''), current: String(objective.current || '') });
    setEditingObjective(true);
  }, [objective]);

  const saveObjective = useCallback(() => {
    const next = {
      text: objDraft.text.trim(),
      target: parseInt(objDraft.target) || 0,
      current: parseInt(objDraft.current) || 0,
      type: objective.type || 'monthly',
    };
    setObjective(next);
    store('dashboard_objective', next);
    setEditingObjective(false);
    if (next.target > 0 && next.current >= next.target) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [objDraft, objective.type]);

  const incrementObjective = useCallback(() => {
    setObjective((prev) => {
      const next = { ...prev, current: prev.current + 1 };
      store('dashboard_objective', next);
      if (next.target > 0 && next.current >= next.target && prev.current < prev.target) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
      return next;
    });
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Activity feed                                                    */
  /* ---------------------------------------------------------------- */
  const activity = useMemo(() => {
    const items = [];
    contacts.filter((c) => c.createdAt).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3)
      .forEach((c) => items.push({ text: `Nouveau contact : ${c.name}${c.company ? ` (${c.company})` : ''}`, time: ago(c.createdAt), icon: '👤', ts: new Date(c.createdAt) }));
    events.sort((a, b) => (b.id || '').localeCompare(a.id || '')).slice(0, 3)
      .forEach((e) => items.push({ text: `Événement : ${e.title}`, time: e.date ? `le ${new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : '', icon: '📅', ts: new Date(e.date || 0) }));
    const lastFin = finHistory[finHistory.length - 1];
    if (lastFin) items.push({ text: `Données financières saisies - ${fmt(lastFin.ca || 0)} € CA`, time: '', icon: '💰', ts: new Date(0) });
    return items.sort((a, b) => b.ts - a.ts).slice(0, 5);
  }, [contacts, events, finHistory]);

  /* ---------------------------------------------------------------- */
  /*  Tasks                                                            */
  /* ---------------------------------------------------------------- */
  const [tasks, setTasks] = useState(() => load('dashboard_tasks') || [
    { text: 'Relancer les prospects', done: false },
    { text: 'Vérifier les intégrations', done: false },
    { text: 'Saisir les données du mois', done: false },
  ]);
  const [newTask, setNewTask] = useState('');

  const toggleTask = useCallback((i) => {
    setTasks((prev) => {
      const updated = prev.map((t, j) => j === i ? { ...t, done: !t.done } : t);
      store('dashboard_tasks', updated);
      return updated;
    });
  }, []);

  const addTask = useCallback(() => {
    if (!newTask.trim()) return;
    setTasks((prev) => {
      const updated = [...prev, { text: newTask.trim(), done: false }];
      store('dashboard_tasks', updated);
      return updated;
    });
    setNewTask('');
  }, [newTask]);

  const removeTask = useCallback((i) => {
    setTasks((prev) => {
      const updated = prev.filter((_, j) => j !== i);
      store('dashboard_tasks', updated);
      return updated;
    });
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Draggable widget order                                           */
  /* ---------------------------------------------------------------- */
  const [widgetOrder, setWidgetOrder] = useState(() => {
    const saved = load('dashWidgetOrder');
    if (saved && saved.includes('weekly-recap')) return saved;
    return ['weekly-recap', 'chart-pipeline', 'integration-kpis', 'expense-breakdown', 'cashflow-projection', 'cross-insights', 'crm-banner', 'pub-banner', 'integrations-hub', 'activity-tasks'];
  });
  const [dragWidget, setDragWidget] = useState(null);
  const handleWidgetDragStart = useCallback((e, id) => { setDragWidget(id); e.dataTransfer.effectAllowed = 'move'; }, []);
  const handleWidgetDrop = useCallback((e, targetId) => {
    e.preventDefault();
    if (!dragWidget || dragWidget === targetId) return;
    setWidgetOrder((prev) => {
      const from = prev.indexOf(dragWidget);
      const to = prev.indexOf(targetId);
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, dragWidget);
      store('dashWidgetOrder', next);
      return next;
    });
    setDragWidget(null);
  }, [dragWidget]);
  const handleWidgetDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);

  /* ---------------------------------------------------------------- */
  /*  Health from integrations (dynamic)                               */
  /* ---------------------------------------------------------------- */
  const connectedIntegrations = useMemo(() =>
    INTEGRATIONS.filter((ig) => integrations[ig.name]),
    [integrations]
  );
  const totalConnected = connectedIntegrations.length;

  const healthItems = useMemo(() =>
    KEY_INTEGRATIONS.map((key) => ({
      label: key,
      status: integrations[key] ? 'ok' : 'off',
    })),
    [integrations]
  );
  const connectedCount = healthItems.filter((h) => h.status === 'ok').length;
  const healthPct = totalConnected > 0
    ? Math.min(Math.round((totalConnected / INTEGRATIONS.length) * 100 * 4), 100)
    : 0;

  // Integration summary by category
  const integrationSummary = useMemo(() => {
    const cats = {};
    INTEGRATIONS.forEach((ig) => {
      if (!cats[ig.category]) cats[ig.category] = { total: 0, connected: 0 };
      cats[ig.category].total++;
      if (integrations[ig.name]) cats[ig.category].connected++;
    });
    return cats;
  }, [integrations]);

  /* ---------------------------------------------------------------- */
  /*  Integration KPIs (live data from connected tools)                 */
  /* ---------------------------------------------------------------- */
  const integrationKPIs = useMemo(() => {
    const kpis = [];

    // Stripe/PayPal: MRR & revenue trend
    if (integrations['Stripe'] || integrations['PayPal']) {
      const last3 = finHistory.slice(-3);
      const avgCA = last3.length > 0 ? Math.round(last3.reduce((s, r) => s + (r.ca || 0), 0) / last3.length) : 0;
      const prevCA = finHistory.length >= 4 ? finHistory[finHistory.length - 4]?.ca || 0 : 0;
      const trend = prevCA > 0 ? Math.round(((avgCA - prevCA) / prevCA) * 100) : 0;
      kpis.push({ icon: '💳', label: 'MRR moyen', value: `${fmt(avgCA)} €`, trend, color: T.green, source: integrations['Stripe'] ? 'Stripe' : 'PayPal' });
    }

    // Email marketing: subscribers
    const emailTools = ['Mailchimp', 'ActiveCampaign', 'Klaviyo', 'Sendinblue', 'Lemlist', 'Brevo'];
    for (const tool of emailTools) {
      if (integrations[tool]) {
        const meta = getIntegrationMeta(tool);
        if (meta?.subscribers) {
          kpis.push({ icon: '📧', label: 'Abonnés email', value: fmt(meta.subscribers), trend: null, color: T.blue, source: tool });
        }
        break;
      }
    }

    // Support: open tickets
    const supportTools = ['Zendesk', 'Freshdesk', 'Intercom'];
    for (const tool of supportTools) {
      if (integrations[tool]) {
        const meta = getIntegrationMeta(tool);
        if (meta?.openTickets != null) {
          kpis.push({ icon: '🎧', label: 'Tickets ouverts', value: String(meta.openTickets), trend: null, color: meta.openTickets > 20 ? T.red : meta.openTickets > 10 ? T.orange : T.green, source: tool });
        }
        break;
      }
    }

    // CRM: synced contacts
    const crmTools = ['GoHighLevel', 'HubSpot', 'Salesforce', 'Zoho', 'Pipedrive'];
    for (const tool of crmTools) {
      if (integrations[tool]) {
        const meta = getIntegrationMeta(tool);
        if (meta?.syncedContacts) {
          kpis.push({ icon: '👥', label: 'Contacts CRM', value: fmt(contacts.length), trend: null, color: T.purple, source: tool });
        }
        break;
      }
    }

    // E-commerce: orders
    const ecomTools = ['Shopify', 'WooCommerce'];
    for (const tool of ecomTools) {
      if (integrations[tool]) {
        const meta = getIntegrationMeta(tool);
        if (meta?.ordersImported) {
          kpis.push({ icon: '🛍️', label: 'Commandes', value: fmt(meta.ordersImported), trend: null, color: T.orange, source: tool });
        }
        break;
      }
    }

    // Bank: last treasury
    const bankTools = ['Revolut', 'Qonto', 'Shine', 'Bunq', 'N26'];
    for (const tool of bankTools) {
      if (integrations[tool]) {
        const lastTreso = finHistory.length > 0 ? finHistory[finHistory.length - 1]?.treso || 0 : 0;
        if (lastTreso > 0) {
          kpis.push({ icon: '🏦', label: 'Trésorerie', value: `${fmt(lastTreso)} €`, trend: null, color: T.blue, source: tool });
        }
        break;
      }
    }

    return kpis;
  }, [integrations, finHistory, contacts]);

  /* ---------------------------------------------------------------- */
  /*  Cash Flow Projection                                             */
  /* ---------------------------------------------------------------- */
  const cashFlowData = useMemo(() => {
    if (finHistory.length < 2) return null;

    const lastTreso = finHistory[finHistory.length - 1]?.treso || 0;
    const last3 = finHistory.slice(-3);
    const avgResult = Math.round(last3.reduce((s, r) => s + (r.result || 0), 0) / last3.length);
    const avgCharges = Math.round(last3.reduce((s, r) => s + (r.charges || 0), 0) / last3.length);
    const fcst = forecastCA(finHistory, 3);

    const months = [];
    let runningTreso = lastTreso;
    for (let i = 0; i < 3; i++) {
      const projectedCA = fcst[i]?.ca || (finHistory[finHistory.length - 1]?.ca || 0);
      const projectedCharges = avgCharges;
      const netFlow = projectedCA - projectedCharges;
      runningTreso += netFlow;
      months.push({
        key: fcst[i]?.key || `M+${i + 1}`,
        ca: projectedCA,
        charges: projectedCharges,
        net: netFlow,
        treso: Math.max(0, runningTreso),
      });
    }

    const runwayMonths = avgCharges > 0 ? Math.round(lastTreso / avgCharges * 10) / 10 : Infinity;

    return {
      currentTreso: lastTreso,
      avgResult,
      avgCharges,
      months,
      runwayMonths,
      trend: avgResult >= 0 ? 'positive' : 'negative',
    };
  }, [finHistory]);

  /* ---------------------------------------------------------------- */
  /*  Ad Platforms (must be before crossInsights which depends on it)   */
  /* ---------------------------------------------------------------- */
  const adPlatforms = useMemo(() =>
    ['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads'].filter((n) => integrations[n]),
    [integrations]
  );

  /* ---------------------------------------------------------------- */
  /*  Cross-Data Insights                                              */
  /* ---------------------------------------------------------------- */
  const crossInsights = useMemo(() => {
    const insights = [];

    // 1. Real cost per client
    const clientCount = contacts.filter((c) => c.status === 'client').length;
    if (clientCount > 0 && finHistory.length > 0) {
      const totalCharges = finHistory.slice(-3).reduce((s, r) => s + (r.charges || 0), 0);
      const avgMonthlyCharges = Math.round(totalCharges / Math.min(finHistory.length, 3));
      const costPerClient = Math.round(avgMonthlyCharges / clientCount);
      insights.push({
        icon: '💸',
        label: 'Coût moyen / client',
        value: `${fmt(costPerClient)} € /mois`,
        detail: `${fmt(avgMonthlyCharges)} € de charges / ${clientCount} clients`,
        color: T.orange,
      });
    }

    // 2. Revenue per client
    if (clientCount > 0 && finHistory.length > 0) {
      const lastCA = finHistory[finHistory.length - 1]?.ca || 0;
      const revenuePerClient = Math.round(lastCA / clientCount);
      insights.push({
        icon: '💰',
        label: 'CA moyen / client',
        value: `${fmt(revenuePerClient)} € /mois`,
        detail: `${fmt(lastCA)} € CA / ${clientCount} clients`,
        color: T.green,
      });
    }

    // 3. Best performing acquisition channel
    if (contacts.length >= 3) {
      const sources = {};
      contacts.forEach((c) => {
        const src = c.source || 'manual';
        if (!sources[src]) sources[src] = { total: 0, clients: 0, totalCA: 0 };
        sources[src].total++;
        if (c.status === 'client') {
          sources[src].clients++;
          sources[src].totalCA += (c.ca || 0);
        }
      });
      const ranked = Object.entries(sources)
        .filter(([, v]) => v.total >= 2)
        .map(([src, v]) => ({ src, ...v, convRate: v.total > 0 ? Math.round((v.clients / v.total) * 100) : 0 }))
        .sort((a, b) => b.convRate - a.convRate);
      if (ranked.length > 0) {
        const best = ranked[0];
        const srcLabels = { manual: 'Saisie manuelle', csv_import: 'Import CSV', gohighlevel: 'GoHighLevel', hubspot: 'HubSpot', salesforce: 'Salesforce', zoho: 'Zoho', pipedrive: 'Pipedrive', brevo: 'Brevo', axonaut: 'Axonaut' };
        insights.push({
          icon: '🏆',
          label: 'Meilleur canal',
          value: srcLabels[best.src] || best.src,
          detail: `${best.convRate}% conversion (${best.clients}/${best.total} contacts)`,
          color: T.accent,
        });
      }
    }

    // 4. Ad spend efficiency (if ads connected)
    const metaAds = load('metaAds') || {};
    if (adPlatforms.length > 0 && metaAds.spend && clientCount > 0) {
      const adCostPerClient = Math.round(metaAds.spend / (metaAds.conversions || 1));
      const lastCA = finHistory.length > 0 ? (finHistory[finHistory.length - 1]?.ca || 0) : 0;
      const ltv = clientCount > 0 ? Math.round(lastCA / clientCount * 6) : 0;
      insights.push({
        icon: '📢',
        label: 'CPA vs LTV',
        value: `${fmt(adCostPerClient)} € → ${fmt(ltv)} €`,
        detail: `Coût acquisition ${fmt(adCostPerClient)} € | Valeur client 6 mois ~${fmt(ltv)} €`,
        color: ltv > adCostPerClient * 3 ? T.green : ltv > adCostPerClient ? T.orange : T.red,
      });
    }

    // 5. Monthly burn rate insight
    if (finHistory.length >= 2) {
      const last3 = finHistory.slice(-3);
      const avgCharges = Math.round(last3.reduce((s, r) => s + (r.charges || 0), 0) / last3.length);
      const avgCA = Math.round(last3.reduce((s, r) => s + (r.ca || 0), 0) / last3.length);
      const profitMargin = avgCA > 0 ? Math.round(((avgCA - avgCharges) / avgCA) * 100) : 0;
      insights.push({
        icon: profitMargin >= 30 ? '🟢' : profitMargin >= 15 ? '🟡' : '🔴',
        label: 'Marge nette moyenne',
        value: `${profitMargin}%`,
        detail: `CA moyen ${fmt(avgCA)} € — Charges moyennes ${fmt(avgCharges)} €`,
        color: profitMargin >= 30 ? T.green : profitMargin >= 15 ? T.orange : T.red,
      });
    }

    return insights;
  }, [contacts, finHistory, adPlatforms]);

  /* ---------------------------------------------------------------- */
  /*  Expense Category Breakdown                                        */
  /* ---------------------------------------------------------------- */
  const expenseBreakdown = useMemo(() => {
    const recent = finHistory.slice(-3);
    const totals = {};
    let hasAny = false;
    recent.forEach((r) => {
      if (r.categories) {
        hasAny = true;
        Object.entries(r.categories).forEach(([cat, val]) => {
          totals[cat] = (totals[cat] || 0) + val;
        });
      }
    });
    if (!hasAny) return [];
    const catMap = {};
    EXPENSE_CATEGORIES.forEach((c) => { catMap[c.id] = c; });
    return Object.entries(totals)
      .map(([id, value]) => ({
        id,
        label: catMap[id]?.label || id,
        icon: catMap[id]?.icon || '📋',
        color: catMap[id]?.color || '#71717a',
        value: Math.round(value / (Math.min(recent.length, 3) || 1)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [finHistory]);

  /* ---------------------------------------------------------------- */
  /*  Weekly Recap                                                      */
  /* ---------------------------------------------------------------- */
  const recap = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    const invoices = load('invoices') || [];
    const events = load('events') || [];

    const newContacts = contacts.filter((c) => c.createdAt && new Date(c.createdAt) >= weekStart);
    const newClients = newContacts.filter((c) => c.status === 'client').length;
    const weekEvents = events.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
      return d >= weekStart && d <= weekEnd;
    });
    const weekInvoices = invoices.filter((inv) => inv.createdAt && new Date(inv.createdAt) >= weekStart);
    const invoicedTTC = weekInvoices.reduce((s, inv) => s + (inv.totalTTC || 0), 0);
    const paidTTC = weekInvoices.filter((inv) => inv.status === 'paid').reduce((s, inv) => s + (inv.totalTTC || 0), 0);
    const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue');
    const overdueAmount = overdueInvoices.reduce((s, inv) => s + (inv.totalTTC || 0), 0);

    // Current month CA vs goal
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const curMonth = finHistory.find((r) => r.key === curKey);
    const caGoal = load('caGoal') || 0;

    return {
      newContacts: newContacts.length, newClients,
      weekEvents: weekEvents.length, upcomingEvents: weekEvents.filter((e) => new Date(e.date) >= now).length,
      invoicesCreated: weekInvoices.length, invoicedTTC, paidTTC,
      overdueCount: overdueInvoices.length, overdueAmount,
      currentCA: curMonth?.ca || 0, caGoal,
      caProgress: caGoal > 0 && curMonth ? Math.min(100, Math.round((curMonth.ca / caGoal) * 100)) : 0,
    };
  }, [contacts, finHistory]);

  /* ---------------------------------------------------------------- */
  /*  CRM stats                                                        */
  /* ---------------------------------------------------------------- */
  const crmStats = useMemo(() => [
    { l: 'Prospects', n: contacts.filter((c) => c.status === 'prospect').length, c: T.orange },
    { l: 'Leads', n: contacts.filter((c) => c.status === 'lead').length, c: T.blue },
    { l: 'Clients', n: contacts.filter((c) => c.status === 'client').length, c: T.green },
    { l: 'Perdus', n: contacts.filter((c) => c.status === 'perdu').length, c: T.red },
  ], [contacts]);

  const crmConversion = useMemo(() => {
    const clients = contacts.filter((c) => c.status === 'client').length;
    const lost = contacts.filter((c) => c.status === 'perdu').length;
    const denom = clients + lost;
    return denom > 0 ? Math.round((clients / denom) * 100) : 0;
  }, [contacts]);

  const pubStats = useMemo(() => {
    const meta = load('metaAds') || {};
    const hasAnyAd = adPlatforms.length > 0;
    if (!hasAnyAd) return null;
    return {
      spend: meta.spend || 3240,
      impressions: meta.impressions || 125400,
      clicks: meta.clicks || 4832,
      conversions: meta.conversions || 142,
      ctr: meta.ctr || 3.85,
      cpc: meta.cpc || 0.67,
      cpa: meta.cpa || 22.82,
      roas: meta.roas || 4.2,
      platforms: adPlatforms,
    };
  }, [integrations, adPlatforms]);

  /* ---------------------------------------------------------------- */
  /*  Quick Actions                                                    */
  /* ---------------------------------------------------------------- */
  const QUICK_ACTIONS = [
    { label: 'Ajouter un contact', icon: '👤', target: 'crm' },
    { label: 'Saisir des données', icon: '📊', target: 'data' },
    { label: 'Créer un événement', icon: '📅', target: 'agenda' },
    { label: 'Voir paramètres', icon: '⚙️', target: 'settings' },
  ];

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div>
      <UpgradeBanner />

      {/* ============================================================ */}
      {/*  WELCOME BANNER with Weather + Streak + Health ring           */}
      {/* ============================================================ */}
      <div className="fade-up glass-static" style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: '1 1 auto' }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: T.text }}>
              {GREETING()}{companyInfo.name ? `, ${companyInfo.name}` : ''} !
            </h1>
            <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>
              Vue d'ensemble de votre activité et performances
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Weather Widget */}
            <WeatherWidget weather={weather} score={healthScore} />

            {/* Streak Badge */}
            <StreakBadge count={streak} />

            {/* Health Ring */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ScoreRing score={healthPct} size={48} strokeWidth={4}>
                <span style={{ fontSize: 11, fontWeight: 800, color: healthPct > 50 ? T.green : healthPct > 0 ? T.orange : T.red }}>{healthPct}%</span>
              </ScoreRing>
              <div className="hide-mobile">
                <div style={{ fontSize: 11, fontWeight: 700, color: healthPct > 50 ? T.green : T.orange }}>Santé globale</div>
                <div style={{ fontSize: 9, color: T.textMuted }}>{totalConnected}/{INTEGRATIONS.length} APIs connectées</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  DAILY ACTIONS ("Actions du jour")                            */}
      {/* ============================================================ */}
      {dailyActions.length > 0 && (
        <div className="fade-up d1" style={{ marginBottom: 20 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Actions du jour</span>
              <HelpTip text="Actions recommandées basées sur vos données en temps réel" />
              <Badge label={`${dailyActions.length}`} color={T.orange} bg={T.orangeBg} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              {dailyActions.map((action) => (
                <div
                  key={action.id}
                  className="hoverable pressable"
                  onClick={() => onNavigate?.(action.tab)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    background: action.bg, border: `1px solid ${action.color}22`,
                    transition: 'all .2s',
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{action.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: action.color, lineHeight: 1.3 }}>{action.text}</div>
                    {action.detail && (
                      <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.detail}</div>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0, marginTop: 2 }}>→</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/*  ONBOARDING CHECKLIST                                         */}
      {/* ============================================================ */}
      {!allChecklistDone && !checklistDismissed && (
        <div className="fade-up d1" style={{ marginBottom: 20 }}>
          <Card accent={T.accent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>🚀</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Configuration de votre espace</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 120, maxWidth: 200 }}>
                    <ProgressBar value={checklistCompleted} max={checklistTotal} color={T.accent} h={6} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.accent }}>{checklistCompleted}/{checklistTotal} complétées</span>
                </div>
              </div>
              <span
                onClick={dismissChecklist}
                style={{ fontSize: 10, color: T.textMuted, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: T.surface2 }}
              >Masquer</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              {ONBOARDING_CHECKLIST.map((item) => (
                <ChecklistItem
                  key={item.id}
                  done={checklistState[item.id]}
                  label={item.label}
                  icon={item.icon}
                  onClick={() => !checklistState[item.id] && onNavigate?.(item.tab)}
                />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/*  KPI Cards with sparklines                                    */}
      {/* ============================================================ */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <KPI label="CA MENSUEL" value={`${fmt(lastRow.ca || 0)} €`} sub={caEvo != null ? `${caEvo >= 0 ? '+' : ''}${caEvo}% vs mois dernier` : 'Aucune donnée précédente'} accent={T.green} icon="💰" delay={1} sparkData={sparkCA} helpTip="Chiffre d'affaires du dernier mois saisi" />
        <KPI label="CHARGES" value={`${fmt(lastRow.charges || 0)} €`} sub="Fixes + Variables" accent={T.red} icon="📉" delay={2} sparkData={sparkCharges} helpTip="Total des charges fixes et variables" />
        <KPI label="RÉSULTAT NET" value={`${fmt(lastRow.result || 0)} €`} sub={lastRow.ca ? `Marge: ${Math.round(((lastRow.result || 0) / lastRow.ca) * 100)}%` : '---'} accent={T.orange} icon="📊" delay={3} sparkData={sparkResult} helpTip="CA moins charges = bénéfice net" />
        {forecastLabel && (
          <PremiumGate label="Prévisions IA" blur>
            <KPI
              label="PRÉVISION 3 MOIS"
              value={`${forecastLabel.pct >= 0 ? '+' : ''}${forecastLabel.pct}%`}
              sub={`Projection: ${fmt(forecastLabel.value)} €`}
              accent={forecastLabel.pct >= 0 ? T.blue : T.red}
              icon="📈"
              delay={3}
              sparkData={forecast.map((f) => f.ca)}
              helpTip="Prévision linéaire sur 3 mois basée sur la tendance récente"
            />
          </PremiumGate>
        )}
      </div>

      {/* ============================================================ */}
      {/*  CA Goal Progress                                             */}
      {/* ============================================================ */}
      {caGoal > 0 && (
        <div className="fade-up d2" style={{ marginBottom: 16 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, whiteSpace: 'nowrap' }}>
                🎯 Objectif CA
                <HelpTip text="Progression vers votre objectif mensuel de CA" />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <ProgressBar value={lastRow.ca || 0} max={caGoal} color={(lastRow.ca || 0) >= caGoal ? T.green : T.orange} h={8} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: (lastRow.ca || 0) >= caGoal ? T.green : T.orange, whiteSpace: 'nowrap' }}>
                {fmt(lastRow.ca || 0)} € / {fmt(caGoal)} € ({Math.min(Math.round(((lastRow.ca || 0) / caGoal) * 100), 999)}%)
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/*  Weekly/Monthly Objective                                     */}
      {/* ============================================================ */}
      <div className="fade-up d2" style={{ marginBottom: 16 }}>
        <Card>
          {editingObjective ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 12 }}>
                🎯 Definir un objectif
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                <Inp label="Description" value={objDraft.text} onChange={(v) => setObjDraft((d) => ({ ...d, text: v }))} placeholder="Ex: Signer 5 nouveaux clients" small />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Inp label="Objectif (nombre)" value={objDraft.target} onChange={(v) => setObjDraft((d) => ({ ...d, target: v }))} type="number" placeholder="5" small />
                  <Inp label="Progression actuelle" value={objDraft.current} onChange={(v) => setObjDraft((d) => ({ ...d, current: v }))} type="number" placeholder="0" small />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <Btn v="primary" small onClick={saveObjective}>Enregistrer</Btn>
                <Btn v="ghost" small onClick={() => setEditingObjective(false)}>Annuler</Btn>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{objectiveReached ? '🏆' : '🎯'}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5 }}>
                      Mon objectif
                      <HelpTip text="Definissez un objectif hebdomadaire ou mensuel pour suivre votre progression" />
                    </div>
                    {objective.text ? (
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 2 }}>{objective.text}</div>
                    ) : (
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Aucun objectif defini</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {objective.target > 0 && (
                    <>
                      <Btn v="ghost" small onClick={incrementObjective} aria-label="Incrementer">+1</Btn>
                      <AnimatedNumber value={objective.current} suffix={`/${objective.target}`} size={18} color={objectiveReached ? T.green : T.accent} />
                    </>
                  )}
                  <Btn v="ghost" small onClick={startEditObjective}>
                    {objective.text ? 'Modifier' : 'Definir'}
                  </Btn>
                </div>
              </div>
              {objective.target > 0 && (
                <div style={{ marginTop: 10 }}>
                  <ProgressBar value={objective.current} max={objective.target} color={objectiveReached ? T.green : T.accent} h={6} />
                  {objectiveReached && showCelebration && (
                    <div className="bounce-in" style={{ marginTop: 8, textAlign: 'center', fontSize: 12, fontWeight: 700, color: T.green }}>
                      🎉 Objectif atteint ! Felicitations !
                    </div>
                  )}
                  {objectiveReached && !showCelebration && (
                    <div style={{ marginTop: 6, textAlign: 'center', fontSize: 10, fontWeight: 600, color: T.green }}>
                      ✓ Objectif atteint
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* ============================================================ */}
      {/*  Quick Actions                                                */}
      {/* ============================================================ */}
      <div className="fade-up d2 kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            className="glass hoverable pressable"
            aria-label={a.label}
            onClick={() => onNavigate?.(a.target)}
            style={{
              padding: '12px 14px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(17,17,19,.6)',
            }}
          >
            <span style={{ fontSize: 16 }}>{a.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  Draggable widget sections                                    */}
      {/* ============================================================ */}
      {widgetOrder.map((id) => { try {
        const WIDGETS = {
          /* ------ Weekly Recap ------ */
          'weekly-recap': (
            <Card delay={2} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{'📋'}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Récap de la semaine</span>
                </div>
                <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 600 }}>
                  {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                {[
                  { icon: '👤', label: 'Nouveaux contacts', value: recap.newContacts, color: T.blue },
                  { icon: '🤝', label: 'Nouveaux clients', value: recap.newClients, color: T.green },
                  { icon: '📅', label: 'Événements', value: recap.weekEvents, color: T.orange, sub: recap.upcomingEvents > 0 ? `${recap.upcomingEvents} à venir` : '' },
                  { icon: '📋', label: 'Factures créées', value: recap.invoicesCreated, color: T.accent, sub: recap.invoicedTTC > 0 ? `${fK(recap.invoicedTTC)}€` : '' },
                  { icon: '✅', label: 'Encaissé', value: `${fK(recap.paidTTC)}€`, color: T.green },
                  ...(recap.overdueCount > 0 ? [{ icon: '⚠️', label: 'Impayées', value: recap.overdueCount, color: T.red, sub: `${fK(recap.overdueAmount)}€ en retard` }] : []),
                ].map((item) => (
                  <div key={item.label} style={{ padding: '10px 12px', borderRadius: 8, background: item.color + '08', border: `1px solid ${item.color}15` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 12 }}>{item.icon}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: T.textMuted }}>{item.label}</span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: item.color, lineHeight: 1.2 }}>{item.value}</div>
                    {item.sub && <div style={{ fontSize: 9, color: item.color, fontWeight: 600, marginTop: 2 }}>{item.sub}</div>}
                  </div>
                ))}
              </div>
              {/* CA Goal Progress */}
              {recap.caGoal > 0 && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: T.surface2, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted }}>Objectif CA du mois</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: recap.caProgress >= 100 ? T.green : T.accent }}>
                      {fmt(recap.currentCA)} / {fmt(recap.caGoal)} € ({recap.caProgress}%)
                    </span>
                  </div>
                  <ProgressBar value={recap.caProgress} max={100} color={recap.caProgress >= 100 ? T.green : T.accent} h={6} />
                </div>
              )}
            </Card>
          ),

          /* ------ Chart + Pipeline ------ */
          'chart-pipeline': (
            <div className="grid-desktop-15-1" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 20 }}>
              <Card delay={3}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5 }}>
                      Evolution CA — 6 derniers mois
                    </span>
                    <HelpTip text="Vert = CA, Rouge pointillé = Charges, Bleu = Prévision, Lignes = seuils" />
                  </div>
                  {forecastLabel && (
                    <Badge
                      label={`Prévision: ${forecastLabel.pct >= 0 ? '+' : ''}${forecastLabel.pct}% sur 3 mois`}
                      color={forecastLabel.pct >= 0 ? T.blue : T.red}
                      bg={forecastLabel.pct >= 0 ? T.blueBg : T.redBg}
                    />
                  )}
                </div>
                <div style={{ height: 200 }}>
                  <ErrorBoundary fallbackTitle="Erreur du graphique">
                    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spinner size={20} /></div>}>
                      <LazyChart />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              </Card>

              <Card delay={4}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5 }}>
                    Pipeline commercial
                  </span>
                  <HelpTip text="Nombre de contacts par étape et valeur estimée du pipeline" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pipeline.map((p) => (
                    <div key={p.stage}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 80, fontSize: 11, fontWeight: 600, color: T.textSecondary }}>{p.stage}</div>
                        <div style={{ flex: 1 }}><ProgressBar value={p.count} max={maxPipeline} color={p.color} h={6} /></div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: p.color, width: 24, textAlign: 'right' }}>{p.count}</div>
                      </div>
                      {p.value > 0 && (
                        <div style={{ marginLeft: 90, fontSize: 9, color: T.textMuted, marginTop: 1 }}>
                          ~{fmt(p.value)} €
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {pipeline.some((p) => p.value > 0) && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase' }}>Valeur totale pipeline</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: T.accent }}>{fmt(pipeline.reduce((s, p) => s + p.value, 0))} €</span>
                  </div>
                )}
              </Card>
            </div>
          ),

          /* ------ Integration KPIs ------ */
          'integration-kpis': integrationKPIs.length > 0 ? (
            <Card delay={4} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📡</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>KPIs Intégrations</span>
                  <HelpTip text="Données en temps réel de vos outils connectés" />
                </div>
                <Btn v="ghost" small onClick={() => onNavigate?.('settings')}>Gérer →</Btn>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                {integrationKPIs.map((kpi) => (
                  <div key={kpi.label} style={{
                    padding: '14px 16px', borderRadius: 12,
                    background: kpi.color + '10', border: `1px solid ${kpi.color}22`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>{kpi.icon}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, background: T.surface2, padding: '2px 6px', borderRadius: 4 }}>{kpi.source}</span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color, lineHeight: 1.2 }}>{kpi.value}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, marginTop: 4 }}>{kpi.label}</div>
                    {kpi.trend != null && kpi.trend !== 0 && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: kpi.trend >= 0 ? T.green : T.red, marginTop: 4 }}>
                        {kpi.trend >= 0 ? '↑' : '↓'} {Math.abs(kpi.trend)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ) : null,

          /* ------ Expense Breakdown ------ */
          'expense-breakdown': expenseBreakdown.length > 0 ? (
            <Card delay={4} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{'📊'}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Répartition des charges</span>
                  <HelpTip text="Moyenne mensuelle par catégorie sur les 3 derniers mois" />
                </div>
                <Btn v="ghost" small onClick={() => onNavigate?.('data')}>Détails {'→'}</Btn>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {expenseBreakdown.slice(0, 5).map((cat) => {
                  const total = expenseBreakdown.reduce((s, c) => s + c.value, 0);
                  const pctVal = total > 0 ? Math.round((cat.value / total) * 100) : 0;
                  return (
                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, width: 18 }}>{cat.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: T.textSecondary, minWidth: 80 }}>{cat.label}</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.border, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pctVal}%`, background: cat.color, borderRadius: 3, transition: 'width .5s ease' }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: cat.color, minWidth: 60, textAlign: 'right' }}>{fmt(cat.value)} {'€'}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, minWidth: 28 }}>{pctVal}%</span>
                    </div>
                  );
                })}
                {expenseBreakdown.length > 5 && (
                  <div style={{ fontSize: 10, color: T.textMuted, textAlign: 'center', marginTop: 4 }}>
                    + {expenseBreakdown.length - 5} autres catégories
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${T.border}`, paddingTop: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: T.text }}>Total charges</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: T.red }}>
                    {fmt(expenseBreakdown.reduce((s, c) => s + c.value, 0))} {'€'} /mois
                  </span>
                </div>
              </div>
            </Card>
          ) : null,

          /* ------ Cash Flow Projection ------ */
          'cashflow-projection': cashFlowData ? (
            <PremiumGate label="Projection trésorerie" blur>
              <Card delay={5} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>🏦</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Projection Trésorerie</span>
                    <HelpTip text="Estimation sur 3 mois basée sur vos tendances de CA et charges" />
                  </div>
                  <Badge
                    label={`Runway: ${cashFlowData.runwayMonths === Infinity ? '∞' : cashFlowData.runwayMonths + ' mois'}`}
                    color={cashFlowData.runwayMonths >= 6 ? T.green : cashFlowData.runwayMonths >= 3 ? T.orange : T.red}
                    bg={cashFlowData.runwayMonths >= 6 ? T.greenBg : cashFlowData.runwayMonths >= 3 ? T.orangeBg : T.redBg}
                  />
                </div>

                {/* Current treasury bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: T.surface2, border: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginBottom: 2 }}>Trésorerie actuelle</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: cashFlowData.currentTreso > cashFlowData.avgCharges * 2 ? T.green : T.orange }}>{fmt(cashFlowData.currentTreso)} €</div>
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginBottom: 2 }}>Résultat moyen /mois</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: cashFlowData.avgResult >= 0 ? T.green : T.red }}>
                      {cashFlowData.avgResult >= 0 ? '+' : ''}{fmt(cashFlowData.avgResult)} €
                    </div>
                  </div>
                </div>

                {/* 3-month projection */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {cashFlowData.months.map((m, i) => {
                    const MONTH_NAMES = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
                    const [, mo] = (m.key || '').split('-');
                    const monthLabel = mo ? MONTH_NAMES[parseInt(mo)] : `M+${i + 1}`;
                    const tresoColor = m.treso > cashFlowData.avgCharges * 2 ? T.green : m.treso > cashFlowData.avgCharges ? T.orange : T.red;
                    return (
                      <div key={m.key} style={{
                        padding: '12px 14px', borderRadius: 10, textAlign: 'center',
                        background: tresoColor + '08', border: `1px solid ${tresoColor}22`,
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>{monthLabel}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: tresoColor }}>{fmt(m.treso)} €</div>
                        <div style={{ fontSize: 9, color: T.textMuted, marginTop: 4 }}>
                          CA: {fmt(m.ca)} € | Ch: {fmt(m.charges)} €
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: m.net >= 0 ? T.green : T.red, marginTop: 4 }}>
                          {m.net >= 0 ? '+' : ''}{fmt(m.net)} € net
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </PremiumGate>
          ) : null,

          /* ------ Cross-Data Insights ------ */
          'cross-insights': crossInsights.length > 0 ? (
            <PremiumGate label="Insights croisés" blur>
              <Card delay={5} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 16 }}>🔬</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Insights Business</span>
                  <HelpTip text="Analyses croisées de vos données CRM, financières et marketing" />
                  <Badge label="Auto" color={T.accent} bg={T.accentBg} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                  {crossInsights.map((insight) => (
                    <div key={insight.label} style={{
                      padding: '14px 16px', borderRadius: 12,
                      background: insight.color + '08', border: `1px solid ${insight.color}22`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>{insight.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary }}>{insight.label}</span>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: insight.color, lineHeight: 1.3, marginBottom: 6 }}>{insight.value}</div>
                      <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.4 }}>{insight.detail}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </PremiumGate>
          ) : null,

          /* ------ Activity + Tasks ------ */
          'activity-tasks': (
            <div className="grid-desktop-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
              <Card delay={5}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
                  Activité récente
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activity.length === 0 ? (
                    <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', padding: 12 }}>Aucune activité récente</div>
                  ) : activity.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{a.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: T.text, lineHeight: 1.4 }}>{a.text}</div>
                        {a.time && <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>{a.time}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card delay={6}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
                  Taches
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tasks.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div onClick={() => toggleTask(i)} role="checkbox" aria-checked={t.done} tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTask(i); } }}
                        style={{
                          width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                          border: `2px solid ${t.done ? T.green : T.border}`,
                          background: t.done ? T.greenBg : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, color: T.green, transition: 'all .15s',
                        }}>{t.done ? '✓' : ''}</div>
                      <div style={{ flex: 1, fontSize: 11, color: t.done ? T.textMuted : T.text, textDecoration: t.done ? 'line-through' : 'none', transition: 'all .15s' }}>{t.text}</div>
                      <span onClick={() => removeTask(i)} style={{ fontSize: 10, color: T.textMuted, cursor: 'pointer', padding: '0 4px' }} aria-label="Supprimer">✕</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Nouvelle tache..."
                      onKeyDown={(e) => e.key === 'Enter' && addTask()}
                      style={{ flex: 1, background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: '5px 8px', fontSize: 10, fontFamily: 'inherit', outline: 'none' }} />
                    <Btn v="ghost" small onClick={addTask} disabled={!newTask.trim()}>+</Btn>
                  </div>
                </div>
              </Card>
            </div>
          ),

          /* ------ CRM Banner ------ */
          'crm-banner': (
            <Card delay={6} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>👥</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>CRM</span>
                  <Badge label={`${contacts.length} contacts`} color={T.accent} bg={T.accent + '18'} />
                </div>
                <Btn v="ghost" small onClick={() => onNavigate?.('crm')}>Voir tout →</Btn>
              </div>

              {/* Distribution bar */}
              {contacts.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
                    {crmStats.filter((s) => s.n > 0).map((s) => (
                      <div key={s.l} style={{ flex: s.n, background: s.c, borderRadius: 4, transition: 'flex .5s ease' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                    {crmStats.filter((s) => s.n > 0).map((s) => (
                      <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 4, background: s.c }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: s.c }}>{s.n}</span>
                        <span style={{ fontSize: 10, color: T.textMuted }}>{s.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: T.green + '10', border: `1px solid ${T.green}22`, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>Conversion</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: crmConversion >= 50 ? T.green : crmConversion >= 25 ? T.orange : T.red }}>
                    {crmConversion}%
                  </div>
                  <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>Clients / Clos</div>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: T.blue + '10', border: `1px solid ${T.blue}22`, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>Pipeline</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: T.blue }}>
                    {fK(pipeline.reduce((s, p) => s + p.value, 0))}€
                  </div>
                  <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>Valeur estimée</div>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: T.orange + '10', border: `1px solid ${T.orange}22`, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>A relancer</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: T.orange }}>
                    {contacts.filter((c) => (c.status === 'prospect' && daysSince(c.createdAt) > 14) || (c.status === 'lead' && daysSince(c.createdAt) > 21)).length}
                  </div>
                  <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>Contacts inactifs</div>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: T.purple + '10', border: `1px solid ${T.purple}22`, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>Entonnoir</div>
                  <svg viewBox="0 0 80 40" style={{ width: 80, height: 40, margin: '0 auto', display: 'block' }}>
                    {(() => {
                      const total = contacts.length || 1;
                      const prosp = contacts.filter((c) => c.status === 'prospect').length;
                      const lead = contacts.filter((c) => c.status === 'lead').length;
                      const client = contacts.filter((c) => c.status === 'client').length;
                      const w1 = Math.max((prosp / total) * 80, 10);
                      const w2 = Math.max((lead / total) * 80, 8);
                      const w3 = Math.max((client / total) * 80, 6);
                      return (
                        <>
                          <rect x={(80 - w1) / 2} y="2" width={w1} height="10" rx="2" fill={T.orange} opacity=".8" />
                          <rect x={(80 - w2) / 2} y="15" width={w2} height="10" rx="2" fill={T.blue} opacity=".8" />
                          <rect x={(80 - w3) / 2} y="28" width={w3} height="10" rx="2" fill={T.green} opacity=".8" />
                        </>
                      );
                    })()}
                  </svg>
                  <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>Prospect → Client</div>
                </div>
              </div>

              {contacts.length === 0 && (
                <div style={{ textAlign: 'center', padding: 16, color: T.textMuted, fontSize: 11 }}>
                  Ajoutez des contacts dans le CRM pour voir vos statistiques
                </div>
              )}
            </Card>
          ),

          /* ------ Pub Banner ------ */
          'pub-banner': pubStats ? (
            <Card delay={7} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📢</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Publicité</span>
                  {pubStats.platforms.map((p) => (
                    <Badge key={p} label={p} color={T.green} bg={T.greenBg} />
                  ))}
                </div>
                <Btn v="ghost" small onClick={() => onNavigate?.('data')}>Voir détails →</Btn>
              </div>

              {/* Funnel visuel: Budget → Impressions → Clicks → Conversions */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {[
                    { label: 'Budget', value: `${fK(pubStats.spend)}€`, pct: 100, color: T.orange },
                    { label: 'Impressions', value: fK(pubStats.impressions), pct: 80, color: T.blue },
                    { label: 'Clics', value: fmt(pubStats.clicks), pct: pubStats.impressions > 0 ? Math.round((pubStats.clicks / pubStats.impressions) * 100 * 10) : 0, color: T.purple },
                    { label: 'Conversions', value: String(pubStats.conversions), pct: pubStats.clicks > 0 ? Math.round((pubStats.conversions / pubStats.clicks) * 100 * 5) : 0, color: T.green },
                  ].map((step, i) => (
                    <React.Fragment key={step.label}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>{step.label}</div>
                        <div style={{ height: 6, borderRadius: 3, background: step.color + '22', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(step.pct, 100)}%`, background: step.color, borderRadius: 3, transition: 'width .6s ease' }} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: step.color, marginTop: 4 }}>{step.value}</div>
                      </div>
                      {i < 3 && <span style={{ fontSize: 10, color: T.textMuted, flexShrink: 0 }}>→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Performance KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
                {[
                  { l: 'CTR', v: `${pubStats.ctr}%`, c: T.green, icon: '📈' },
                  { l: 'CPC', v: `${pubStats.cpc}€`, c: T.blue, icon: '👆' },
                  { l: 'CPA', v: `${pubStats.cpa}€`, c: T.orange, icon: '🎯' },
                  { l: 'ROAS', v: `${pubStats.roas}x`, c: pubStats.roas >= 3 ? T.green : pubStats.roas >= 1 ? T.orange : T.red, icon: '💎' },
                ].map((m) => (
                  <div key={m.l} style={{ padding: '10px 12px', borderRadius: 10, background: m.c + '10', border: `1px solid ${m.c}22`, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, marginBottom: 2 }}>{m.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: m.c }}>{m.v}</div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginTop: 2 }}>{m.l}</div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card delay={7} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>📢</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Publicité</span>
              </div>
              <div style={{ textAlign: 'center', padding: '16px 0', color: T.textMuted, fontSize: 11 }}>
                Connectez une plateforme publicitaire dans les paramètres pour voir vos stats
              </div>
              <div style={{ textAlign: 'center' }}>
                <Btn v="ghost" small onClick={() => onNavigate?.('settings')}>Connecter une plateforme</Btn>
              </div>
            </Card>
          ),

          /* ------ Integrations Hub ------ */
          'integrations-hub': totalConnected > 0 ? (
            <Card delay={8} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🔗</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Integrations</span>
                  <Badge label={`${totalConnected} actives`} color={T.accent} bg={T.accent + '18'} />
                </div>
                <Btn v="ghost" small onClick={() => onNavigate?.('settings')}>Gerer →</Btn>
              </div>

              {/* Category breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, marginBottom: 14 }}>
                {Object.entries(integrationSummary)
                  .filter(([, v]) => v.connected > 0)
                  .map(([cat, v]) => {
                    const catLabels = { paiements: 'Paiements', banque: 'Banque', agenda: 'Agenda', crm: 'CRM', marketing: 'Marketing', projet: 'Projet', publicite: 'Pub', support: 'Support' };
                    const catColors = { paiements: T.orange, banque: T.blue, agenda: T.green, crm: T.purple, marketing: T.accent, projet: T.blue, publicite: T.red, support: T.green };
                    const color = catColors[cat] || T.accent;
                    return (
                      <div key={cat} style={{
                        padding: '10px 8px', borderRadius: 10, textAlign: 'center',
                        background: color + '10', border: `1px solid ${color}22`,
                      }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color }}>{v.connected}</div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginTop: 2 }}>
                          {catLabels[cat] || cat}
                        </div>
                        <div style={{ marginTop: 4, height: 3, borderRadius: 2, background: color + '22', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(v.connected / v.total) * 100}%`, background: color, borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Connected integrations icons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {connectedIntegrations.slice(0, 16).map((ig) => (
                  <div key={ig.name} title={ig.name} style={{
                    width: 34, height: 34, borderRadius: 8, fontSize: 16,
                    background: T.greenBg, border: `1px solid ${T.green}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'default',
                  }}>{ig.icon}</div>
                ))}
                {connectedIntegrations.length > 16 && (
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, fontSize: 10, fontWeight: 700,
                    background: T.surface2, color: T.textMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>+{connectedIntegrations.length - 16}</div>
                )}
              </div>
            </Card>
          ) : null,
        };

        const content = WIDGETS[id];
        if (!content) return null;
        return (
          <div key={id} draggable onDragStart={(e) => handleWidgetDragStart(e, id)}
            onDragOver={handleWidgetDragOver} onDrop={(e) => handleWidgetDrop(e, id)}
            style={{ opacity: dragWidget === id ? 0.5 : 1, transition: 'opacity .2s' }}>
            <div className="drag-handle" style={{ fontSize: 14, marginBottom: 4, textAlign: 'center', cursor: 'grab', color: T.textMuted }}>⠿</div>
            {content}
          </div>
        );
      } catch (e) { console.error(`Widget ${id} error:`, e); return null; }
      })}
    </div>
  );
}
