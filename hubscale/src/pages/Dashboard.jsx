import React, { useState } from 'react';
import { T } from '../lib/theme.js';
import { fmt, fK, MONTHS_FR } from '../lib/utils.js';
import { KPI, Card, Section, Btn, Badge, ProgressBar, EmptyState } from '../components/ui.jsx';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CA_DATA = [
  { month: 'Sep', ca: 18500 }, { month: 'Oct', ca: 22000 }, { month: 'Nov', ca: 19800 },
  { month: 'Déc', ca: 27500 }, { month: 'Jan', ca: 24000 }, { month: 'Fév', ca: 31200 },
];

const PIPELINE = [
  { stage: 'Prospect', count: 12, color: T.orange },
  { stage: 'Lead', count: 8, color: T.blue },
  { stage: 'Négociation', count: 5, color: T.purple },
  { stage: 'Gagné', count: 15, color: T.green },
  { stage: 'Perdu', count: 3, color: T.red },
];

const ACTIVITY = [
  { text: 'Nouveau contact ajouté : Dupont SARL', time: 'il y a 2h', icon: '👤' },
  { text: 'Facture #1042 payée — 2 400€', time: 'il y a 5h', icon: '💰' },
  { text: 'Pipeline mis à jour : Lead → Négociation', time: 'il y a 1j', icon: '📈' },
  { text: 'Backup automatique effectué', time: 'il y a 1j', icon: '💾' },
];

const TASKS = [
  { text: 'Relancer prospect TechVision', due: 'Aujourd\'hui', done: false },
  { text: 'Vérifier intégration Stripe', due: 'Demain', done: false },
  { text: 'Envoyer devis client Nexus', due: '22 Fév', done: true },
];

const HEALTH_ITEMS = [
  { label: 'Stripe API', status: 'ok' },
  { label: 'Revolut API', status: 'ok' },
  { label: 'GoHighLevel', status: 'warning' },
  { label: 'Meta Ads', status: 'error' },
];

const QUICK_ACTIONS = [
  { label: 'Ajouter un contact', icon: '👤', color: T.blue },
  { label: 'Saisir des données', icon: '📊', color: T.green },
  { label: 'Créer un événement', icon: '📅', color: T.purple },
  { label: 'Voir paramètres', icon: '⚙️', color: T.orange },
];

export default function Dashboard() {
  const [tasksDone, setTasksDone] = useState(TASKS.map((t) => t.done));

  const toggleTask = (i) => setTasksDone((prev) => prev.map((v, j) => j === i ? !v : v));

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
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke={T.border} strokeWidth="4" />
              <circle cx="24" cy="24" r="20" fill="none" stroke={T.green} strokeWidth="4"
                strokeDasharray={`${0.75 * 125.6} ${125.6}`} strokeLinecap="round"
                transform="rotate(-90 24 24)" style={{ transition: 'stroke-dasharray .8s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: T.green }}>75%</div>
          </div>
          <div className="hide-mobile">
            <div style={{ fontSize: 11, fontWeight: 700, color: T.green }}>Santé globale</div>
            <div style={{ fontSize: 9, color: T.textMuted }}>3/4 APIs connectées</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <KPI label="CA MENSUEL" value={`${fK(31200)}€`} sub="+12.4% vs mois dernier" accent={T.green} icon="💰" delay={1} />
        <KPI label="CHARGES" value={`${fK(18600)}€`} sub="Fixes + Variables" accent={T.red} icon="📉" delay={2} />
        <KPI label="RÉSULTAT NET" value={`${fK(12600)}€`} sub="Marge: 40.4%" accent={T.orange} icon="📊" delay={3} />
      </div>

      {/* Quick Actions */}
      <div className="fade-up d2 kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
        {QUICK_ACTIONS.map((a, i) => (
          <button key={i} className="glass hoverable pressable" style={{
            padding: '12px 14px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(17,17,19,.6)',
          }}>
            <span style={{ fontSize: 16 }}>{a.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Two columns: Chart + Pipeline — stack on mobile */}
      <div className="grid-desktop-15-1" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 20 }}>
        <Card delay={3}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
            Évolution CA — 6 derniers mois
          </div>
          <div style={{ height: 180 }}>
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
                  formatter={(v) => [`${fmt(v)}€`, 'CA']}
                />
                <Area type="monotone" dataKey="ca" stroke={T.green} strokeWidth={2} fill="url(#caGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card delay={4}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
            Pipeline commercial
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PIPELINE.map((p) => (
              <div key={p.stage} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 80, fontSize: 11, fontWeight: 600, color: T.textSecondary }}>{p.stage}</div>
                <div style={{ flex: 1 }}><ProgressBar value={p.count} max={20} color={p.color} h={6} /></div>
                <div style={{ fontSize: 12, fontWeight: 700, color: p.color, width: 24, textAlign: 'right' }}>{p.count}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Three columns — stack on mobile */}
      <div className="grid-desktop-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <Card delay={5}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
            Santé système
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {HEALTH_ITEMS.map((h) => (
              <div key={h.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: T.text }}>{h.label}</span>
                <Badge
                  label={h.status === 'ok' ? 'Connecté' : h.status === 'warning' ? 'Attention' : 'Erreur'}
                  color={h.status === 'ok' ? T.green : h.status === 'warning' ? T.orange : T.red}
                  bg={h.status === 'ok' ? T.greenBg : h.status === 'warning' ? T.orangeBg : T.redBg}
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
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: T.text, lineHeight: 1.4 }}>{a.text}</div>
                  <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>{a.time}</div>
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
            {TASKS.map((t, i) => (
              <div key={i} onClick={() => toggleTask(i)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${tasksDone[i] ? T.green : T.border}`,
                  background: tasksDone[i] ? T.greenBg : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: T.green, transition: 'all .15s',
                }}>{tasksDone[i] ? '✓' : ''}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: tasksDone[i] ? T.textMuted : T.text, textDecoration: tasksDone[i] ? 'line-through' : 'none', transition: 'all .15s' }}>{t.text}</div>
                </div>
                <span style={{ fontSize: 9, color: T.textMuted }}>{t.due}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom: Contacts CRM + Publicité — stack on mobile */}
      <div className="grid-desktop-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card delay={6}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
            Contacts CRM
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {[{ l: 'Prospects', n: 12, c: T.orange }, { l: 'Leads', n: 8, c: T.blue }, { l: 'Clients', n: 15, c: T.green }].map((s) => (
              <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: s.c + '15' }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: s.c }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: s.c }}>{s.n}</span>
                <span style={{ fontSize: 10, color: T.textSecondary }}>{s.l}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted }}>35 contacts au total — Dernière synchro il y a 2h</div>
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
