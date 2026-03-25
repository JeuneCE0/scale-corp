import React, { useState } from 'react';
import { T } from '../lib/theme.js';
import { fmt, fK, MONTHS_FR } from '../lib/utils.js';
import { KPI, Card, Section, Btn, Badge, ProgressBar, EmptyState } from '../components/ui.jsx';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CA_DATA = [];

const PIPELINE = [
  { stage: 'Prospect', count: 0, color: T.orange },
  { stage: 'Lead', count: 0, color: T.blue },
  { stage: 'Négociation', count: 0, color: T.purple },
  { stage: 'Gagné', count: 0, color: T.green },
  { stage: 'Perdu', count: 0, color: T.red },
];

const ACTIVITY = [];

const TASKS = [];

const HEALTH_ITEMS = [
  { label: 'Stripe API', status: 'pending' },
  { label: 'Revolut API', status: 'pending' },
  { label: 'GoHighLevel', status: 'pending' },
  { label: 'Meta Ads', status: 'pending' },
];

const QUICK_ACTIONS = [
  { label: 'Ajouter un contact', icon: '👤', color: T.blue },
  { label: 'Saisir des données', icon: '📊', color: T.green },
  { label: 'Créer un événement', icon: '📅', color: T.purple },
  { label: 'Lancer les tests', icon: '🔬', color: T.orange },
];

export default function Dashboard() {
  return (
    <div>
      {/* Welcome Banner */}
      <div className="fade-up glass-static" style={{ padding: '20px 24px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: T.text }}>
            Bienvenue sur votre Dashboard 👋
          </h1>
          <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>
            Vue d'ensemble de votre activité et performances
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Health Score Ring */}
          <div style={{ position: 'relative', width: 48, height: 48 }}>
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke={T.border} strokeWidth="4" />
              <circle cx="24" cy="24" r="20" fill="none" stroke={T.textMuted} strokeWidth="4"
                strokeDasharray={`${0 * 125.6} ${125.6}`} strokeLinecap="round"
                transform="rotate(-90 24 24)" style={{ transition: 'stroke-dasharray .8s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: T.textMuted }}>0%</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>Santé globale</div>
            <div style={{ fontSize: 9, color: T.textMuted }}>0/4 APIs connectées</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <KPI label="CA MENSUEL" value={`${fK(0)}€`} sub="Aucune donnée" accent={T.textMuted} icon="💰" delay={1} />
        <KPI label="CHARGES" value={`${fK(0)}€`} sub="Aucune donnée" accent={T.textMuted} icon="📉" delay={2} />
        <KPI label="RÉSULTAT NET" value={`${fK(0)}€`} sub="Aucune donnée" accent={T.textMuted} icon="📊" delay={3} />
      </div>

      {/* Quick Actions */}
      <div className="fade-up d2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
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

      {/* Two columns: Chart + Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 20 }}>
        {/* CA Evolution Chart */}
        <Card delay={3}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
            📈 Évolution CA — 6 derniers mois
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

        {/* Pipeline */}
        <Card delay={4}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
            🔄 Pipeline commercial
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PIPELINE.map((p) => (
              <div key={p.stage} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 80, fontSize: 11, fontWeight: 600, color: T.textSecondary }}>{p.stage}</div>
                <div style={{ flex: 1 }}>
                  <ProgressBar value={p.count} max={20} color={p.color} h={6} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: p.color, width: 24, textAlign: 'right' }}>{p.count}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Three columns: Santé système + Activité + Tâches */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14, marginBottom: 20 }}>
        {/* Santé Système */}
        <Card delay={5}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
            🏥 Santé système
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {HEALTH_ITEMS.map((h) => (
              <div key={h.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: T.text }}>{h.label}</span>
                <Badge
                  label={h.status === 'ok' ? 'Connecté' : h.status === 'warning' ? 'Attention' : h.status === 'pending' ? 'Non connecté' : 'Erreur'}
                  color={h.status === 'ok' ? T.green : h.status === 'warning' ? T.orange : h.status === 'pending' ? T.textMuted : T.red}
                  bg={h.status === 'ok' ? T.greenBg : h.status === 'warning' ? T.orangeBg : h.status === 'pending' ? T.surface2 : T.redBg}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Activité récente */}
        <Card delay={5}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
            ⚡ Activité récente
          </div>
          {ACTIVITY.length === 0 ? (
            <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', padding: 16 }}>Aucune activité pour le moment</div>
          ) : (
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
          )}
        </Card>

        {/* Tâches */}
        <Card delay={6}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
            ✅ Tâches
          </div>
          {TASKS.length === 0 ? (
            <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', padding: 16 }}>Aucune tâche pour le moment</div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TASKS.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${t.done ? T.green : T.border}`,
                  background: t.done ? T.greenBg : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: T.green,
                }}>{t.done ? '✓' : ''}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: t.done ? T.textMuted : T.text, textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</div>
                </div>
                <span style={{ fontSize: 9, color: T.textMuted }}>{t.due}</span>
              </div>
            ))}
          </div>
          )}
        </Card>
      </div>

      {/* Bottom: Contacts CRM + Publicité */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card delay={6}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
            👥 Contacts CRM
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {[{ l: 'Prospects', n: 0, c: T.orange }, { l: 'Leads', n: 0, c: T.blue }, { l: 'Clients', n: 0, c: T.green }].map((s) => (
              <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: s.c + '15' }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: s.c }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: s.c }}>{s.n}</span>
                <span style={{ fontSize: 10, color: T.textSecondary }}>{s.l}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted }}>Connectez votre CRM pour voir vos contacts</div>
        </Card>

        <Card delay={6}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
            📣 Publicité
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { l: 'Dépenses', v: '0€', c: T.textMuted },
              { l: 'Impressions', v: '0', c: T.textMuted },
              { l: 'Clics', v: '0', c: T.textMuted },
              { l: 'CPA', v: '—', c: T.textMuted },
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
