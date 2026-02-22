import React, { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { T } from '../lib/theme.js';
import { fK, fmt, ago } from '../lib/utils.js';
import { load, store } from '../lib/store.js';
import { KPI, Card, Badge, ProgressBar, Spinner, Btn, Inp, HelpTip } from '../components/ui.jsx';

const LazyChart = lazy(() =>
  import('recharts').then((mod) => ({
    default: function CAChart() {
      const { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } = mod;
      const history = load('finHistory') || [];
      const caGoal = load('caGoal') || 0;
      const CA_DATA = history.slice(-6).map((r) => {
        const [, m] = (r.key || '').split('-');
        const months = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        return { month: months[parseInt(m)] || r.key, ca: r.ca || 0, charges: r.charges || 0 };
      });
      if (CA_DATA.length === 0) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 11, color: T.textMuted }}>Aucune donnée financière</div>;
      const avgCharges = Math.round(CA_DATA.reduce((s, d) => s + d.charges, 0) / CA_DATA.length);
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={CA_DATA}>
            <defs>
              <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.green} stopOpacity={0.3} />
                <stop offset="100%" stopColor={T.green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fK} />
            <Tooltip
              contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11 }}
              formatter={(v, name) => [`${fmt(v)}€`, name === 'ca' ? 'CA' : 'Charges']}
            />
            <Area type="monotone" dataKey="ca" stroke={T.green} strokeWidth={2} fill="url(#caGrad)" />
            <Area type="monotone" dataKey="charges" stroke={T.red} strokeWidth={1.5} fill="none" strokeDasharray="4 3" />
            {avgCharges > 0 && <ReferenceLine y={avgCharges} stroke={T.red} strokeDasharray="3 3" strokeWidth={1} label={{ value: `Seuil: ${fK(avgCharges)}€`, fill: T.textMuted, fontSize: 8, position: 'left' }} />}
            {caGoal > 0 && <ReferenceLine y={caGoal} stroke={T.orange} strokeDasharray="6 3" strokeWidth={1.5} label={{ value: `Objectif: ${fK(caGoal)}€`, fill: T.orange, fontSize: 9, position: 'right' }} />}
          </AreaChart>
        </ResponsiveContainer>
      );
    },
  }))
);

const HEALTH_ITEMS = [
  { label: 'Stripe API', key: 'Stripe' },
  { label: 'Revolut API', key: 'Revolut' },
  { label: 'Google Calendar', key: 'Google Calendar' },
  { label: 'GoHighLevel', key: 'GoHighLevel' },
  { label: 'Meta Ads', key: 'Meta Ads' },
];

export default function Dashboard({ onNavigate }) {
  // --- Real data from localStorage ---
  const contacts = useMemo(() => load('contacts') || [], []);
  const events = useMemo(() => load('events') || [], []);
  const finHistory = useMemo(() => load('finHistory') || [], []);
  const integrations = useMemo(() => load('integrations') || {}, []);
  const caGoal = useMemo(() => load('caGoal') || 0, []);

  // Pipeline from real CRM contacts
  const pipeline = useMemo(() => [
    { stage: 'Prospect', count: contacts.filter((c) => c.status === 'prospect').length, color: T.orange },
    { stage: 'Lead', count: contacts.filter((c) => c.status === 'lead').length, color: T.blue },
    { stage: 'Client', count: contacts.filter((c) => c.status === 'client').length, color: T.green },
    { stage: 'Partenaire', count: contacts.filter((c) => c.status === 'partenaire').length, color: T.purple },
    { stage: 'Perdu', count: contacts.filter((c) => c.status === 'perdu').length, color: T.red },
  ], [contacts]);

  const maxPipeline = useMemo(() => Math.max(...pipeline.map((p) => p.count), 1), [pipeline]);

  // KPIs from real financial data
  const lastRow = useMemo(() => finHistory[finHistory.length - 1] || {}, [finHistory]);
  const prevRow = useMemo(() => finHistory.length >= 2 ? finHistory[finHistory.length - 2] : null, [finHistory]);
  const caEvo = prevRow && prevRow.ca ? Math.round(((lastRow.ca - prevRow.ca) / prevRow.ca) * 100) : null;

  // Sparkline data (last 6 months)
  const sparkCA = useMemo(() => finHistory.slice(-6).map((r) => r.ca || 0), [finHistory]);
  const sparkCharges = useMemo(() => finHistory.slice(-6).map((r) => r.charges || 0), [finHistory]);
  const sparkResult = useMemo(() => finHistory.slice(-6).map((r) => r.result || 0), [finHistory]);

  // Activity feed from real data (most recent contacts + events)
  const activity = useMemo(() => {
    const items = [];
    contacts.filter((c) => c.createdAt).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3)
      .forEach((c) => items.push({ text: `Nouveau contact : ${c.name}${c.company ? ` (${c.company})` : ''}`, time: ago(c.createdAt), icon: '👤', ts: new Date(c.createdAt) }));
    events.sort((a, b) => (b.id || '').localeCompare(a.id || '')).slice(0, 3)
      .forEach((e) => items.push({ text: `Événement : ${e.title}`, time: e.date ? `le ${new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : '', icon: '📅', ts: new Date(e.date || 0) }));
    const lastFin = finHistory[finHistory.length - 1];
    if (lastFin) items.push({ text: `Données financières saisies — ${fmt(lastFin.ca || 0)}€ CA`, time: '', icon: '💰', ts: new Date(0) });
    return items.sort((a, b) => b.ts - a.ts).slice(0, 5);
  }, [contacts, events, finHistory]);

  // Persisted tasks
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

  // Health from real integrations
  const healthItems = useMemo(() =>
    HEALTH_ITEMS.map((h) => ({
      label: h.label,
      status: integrations[h.key] ? 'ok' : 'off',
    })),
    [integrations]
  );
  const connectedCount = healthItems.filter((h) => h.status === 'ok').length;
  const healthPct = Math.round((connectedCount / healthItems.length) * 100);

  // CRM stats from real data
  const crmStats = useMemo(() => [
    { l: 'Prospects', n: contacts.filter((c) => c.status === 'prospect').length, c: T.orange },
    { l: 'Leads', n: contacts.filter((c) => c.status === 'lead').length, c: T.blue },
    { l: 'Clients', n: contacts.filter((c) => c.status === 'client').length, c: T.green },
  ], [contacts]);

  const QUICK_ACTIONS = [
    { label: 'Ajouter un contact', icon: '👤', target: 'crm' },
    { label: 'Saisir des données', icon: '📊', target: 'data' },
    { label: 'Créer un événement', icon: '📅', target: 'agenda' },
    { label: 'Voir paramètres', icon: '⚙️', target: 'settings' },
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="fade-up glass-static" style={{ padding: '20px 24px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: T.text }}>
            Bienvenue sur votre Dashboard
          </h1>
          <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>
            Vue d'ensemble de votre activité et performances
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 48, height: 48 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" aria-label={`Score de santé: ${healthPct}%`}>
              <circle cx="24" cy="24" r="20" fill="none" stroke={T.border} strokeWidth="4" />
              <circle cx="24" cy="24" r="20" fill="none" stroke={healthPct > 50 ? T.green : healthPct > 0 ? T.orange : T.red} strokeWidth="4"
                strokeDasharray={`${(healthPct / 100) * 125.6} ${125.6}`} strokeLinecap="round"
                transform="rotate(-90 24 24)" style={{ transition: 'stroke-dasharray .8s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: healthPct > 50 ? T.green : healthPct > 0 ? T.orange : T.red }}>{healthPct}%</div>
          </div>
          <div className="hide-mobile">
            <div style={{ fontSize: 11, fontWeight: 700, color: healthPct > 50 ? T.green : T.orange }}>Santé globale</div>
            <div style={{ fontSize: 9, color: T.textMuted }}>{connectedCount}/{healthItems.length} APIs connectées</div>
          </div>
        </div>
      </div>

      {/* KPI Cards with sparklines + tooltips */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <KPI label="CA MENSUEL" value={`${fK(lastRow.ca || 0)}€`} sub={caEvo != null ? `${caEvo >= 0 ? '+' : ''}${caEvo}% vs mois dernier` : 'Aucune donnée précédente'} accent={T.green} icon="💰" delay={1} sparkData={sparkCA} helpTip="Chiffre d'affaires du dernier mois saisi" />
        <KPI label="CHARGES" value={`${fK(lastRow.charges || 0)}€`} sub="Fixes + Variables" accent={T.red} icon="📉" delay={2} sparkData={sparkCharges} helpTip="Total des charges fixes et variables" />
        <KPI label="RÉSULTAT NET" value={`${fK(lastRow.result || 0)}€`} sub={lastRow.ca ? `Marge: ${Math.round(((lastRow.result || 0) / lastRow.ca) * 100)}%` : '—'} accent={T.orange} icon="📊" delay={3} sparkData={sparkResult} helpTip="CA moins charges = bénéfice net" />
      </div>

      {/* CA Goal Progress */}
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
                {fK(lastRow.ca || 0)}€ / {fK(caGoal)}€ ({Math.min(Math.round(((lastRow.ca || 0) / caGoal) * 100), 999)}%)
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Actions — connected to navigation */}
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

      {/* Two columns: Chart + Pipeline */}
      <div className="grid-desktop-15-1" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 20 }}>
        <Card delay={3}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5 }}>
              Évolution CA — 6 derniers mois
            </span>
            <HelpTip text="Vert = CA, Rouge pointillé = Charges, Lignes = seuils" />
          </div>
          <div style={{ height: 180 }}>
            <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spinner size={20} /></div>}>
              <LazyChart />
            </Suspense>
          </div>
        </Card>

        <Card delay={4}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
            Pipeline commercial
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pipeline.map((p) => (
              <div key={p.stage} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 80, fontSize: 11, fontWeight: 600, color: T.textSecondary }}>{p.stage}</div>
                <div style={{ flex: 1 }}><ProgressBar value={p.count} max={maxPipeline} color={p.color} h={6} /></div>
                <div style={{ fontSize: 12, fontWeight: 700, color: p.color, width: 24, textAlign: 'right' }}>{p.count}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Three columns */}
      <div className="grid-desktop-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <Card delay={5}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
            Santé système
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {healthItems.map((h) => (
              <div key={h.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: T.text }}>{h.label}</span>
                <Badge
                  label={h.status === 'ok' ? 'Connecté' : 'Non connecté'}
                  color={h.status === 'ok' ? T.green : T.textMuted}
                  bg={h.status === 'ok' ? T.greenBg : T.surface2}
                />
              </div>
            ))}
          </div>
        </Card>

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
            Tâches
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
              <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Nouvelle tâche..."
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                style={{ flex: 1, background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: '5px 8px', fontSize: 10, fontFamily: 'inherit', outline: 'none' }} />
              <Btn v="ghost" small onClick={addTask} disabled={!newTask.trim()}>+</Btn>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom: CRM + Publicité */}
      <div className="grid-desktop-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card delay={6}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
            Contacts CRM
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {crmStats.map((s) => (
              <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: s.c + '15' }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: s.c }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: s.c }}>{s.n}</span>
                <span style={{ fontSize: 10, color: T.textSecondary }}>{s.l}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted }}>{contacts.length} contact{contacts.length !== 1 ? 's' : ''} au total</div>
        </Card>

        <Card delay={6}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
            Publicité
          </div>
          <div className="grid-2-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { l: 'Dépenses', v: '1 240€', c: T.orange },
              { l: 'Impressions', v: '45.2K', c: T.blue },
              { l: 'Clics', v: '1 832', c: T.purple },
              { l: 'CPA', v: '12.40€', c: T.green },
            ].map((m) => (
              <div key={m.l} style={{ padding: 8, borderRadius: 8, background: m.c + '10' }}>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>{m.l}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: m.c, marginTop: 2 }}>{m.v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
