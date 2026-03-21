import React, { useMemo } from 'react';
import { T } from '../../lib/theme.js';
import { fmt, fK } from '../../lib/utils.js';
import { load } from '../../lib/store.js';
import { Card, Section, EmptyState, HelpTip, ScoreRing } from '../../components/ui.jsx';

export default function SalesTab() {
  const contacts = useMemo(() => load('contacts') || [], []);

  const stats = useMemo(() => {
    const total = contacts.length;
    const prospects = contacts.filter((c) => c.status === 'prospect' || c.status === 'lead').length;
    const clients = contacts.filter((c) => c.status === 'client').length;
    const partenaires = contacts.filter((c) => c.status === 'partenaire').length;
    const lost = contacts.filter((c) => c.status === 'perdu').length;

    // Conversion rate: clients / (clients + lost)
    const conversionDenom = clients + lost;
    const conversionRate = conversionDenom > 0 ? Math.round((clients / conversionDenom) * 100) : 0;

    // Pipeline value: leads * average CA per client (or 5000 default)
    const finHistory = load('finHistory') || [];
    const totalCA = finHistory.reduce((s, r) => s + (r.ca || 0), 0);
    const avgCAPerClient = clients > 0 && totalCA > 0 ? Math.round(totalCA / clients) : 5000;
    const pipelineValue = prospects * avgCAPerClient;

    return { total, prospects, clients, partenaires, lost, conversionRate, pipelineValue, avgCAPerClient };
  }, [contacts]);

  // Funnel stages
  const funnel = useMemo(() => {
    const steps = [
      { label: 'Prospects', count: stats.prospects, color: T.orange },
      { label: 'Clients', count: stats.clients, color: T.green },
    ];
    const maxCount = Math.max(...steps.map((s) => s.count), 1);
    return steps.map((s) => ({ ...s, pct: Math.round((s.count / maxCount) * 100) }));
  }, [stats]);

  if (contacts.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="💼"
          title="Aucun contact dans le CRM"
          sub="Ajoutez des contacts dans l'onglet CRM pour voir vos statistiques de vente"
        />
      </Card>
    );
  }

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Total contacts', v: stats.total, c: T.accent, icon: '📋' },
          { l: 'Prospects', v: stats.prospects, c: T.orange, icon: '🔍' },
          { l: 'Clients', v: stats.clients, c: T.green, icon: '✅' },
          { l: 'Perdus', v: stats.lost, c: T.red, icon: '❌' },
        ].map((s) => (
          <div key={s.l} style={{ textAlign: 'center', padding: 14, borderRadius: 10, background: s.c + '10', border: `1px solid ${s.c}22` }}>
            <div style={{ fontSize: 14, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: s.c, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Conversion & Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>
              Taux de conversion
              <HelpTip text="Clients / (Clients + Perdus) x 100" />
            </div>
            <ScoreRing score={stats.conversionRate} size={80} strokeWidth={6} color={stats.conversionRate >= 50 ? T.green : stats.conversionRate >= 25 ? T.orange : T.red}>
              <span style={{ fontSize: 18, fontWeight: 800, color: stats.conversionRate >= 50 ? T.green : stats.conversionRate >= 25 ? T.orange : T.red }}>
                {stats.conversionRate}%
              </span>
            </ScoreRing>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>
              {stats.clients} gagnés / {stats.clients + stats.lost} clos
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>
              Valeur pipeline
              <HelpTip text={`Leads x CA moyen par client (${fmt(stats.avgCAPerClient)}€)`} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.blue }}>{fK(stats.pipelineValue)}€</div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>
              {stats.prospects} prospects x {fK(stats.avgCAPerClient)}€ moy.
            </div>
          </div>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Section title="ENTONNOIR DE CONVERSION" sub="Progression des contacts dans le pipeline">
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {funnel.map((step, idx) => (
              <div key={step.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: step.color }}>{step.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{step.count}</span>
                </div>
                <div style={{ height: 24, background: T.border + '44', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    height: '100%', width: `${step.pct}%`, background: step.color,
                    borderRadius: 6, transition: 'width .6s ease', opacity: 0.8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: step.count > 0 ? 32 : 0,
                  }}>
                    {step.count > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{step.pct}%</span>
                    )}
                  </div>
                </div>
                {idx < funnel.length - 1 && (
                  <div style={{ textAlign: 'center', fontSize: 12, color: T.textMuted, margin: '2px 0' }}>{'↓'}</div>
                )}
              </div>
            ))}
          </div>
          {stats.partenaires > 0 && (
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: T.purple + '10', border: `1px solid ${T.purple}22` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.purple }}>
                + {stats.partenaires} partenaire{stats.partenaires > 1 ? 's' : ''} actif{stats.partenaires > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </Card>
      </Section>
    </>
  );
}
