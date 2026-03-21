import React, { useState, useMemo } from 'react';
import { T } from '../../lib/theme.js';
import { fmt, fK, pf } from '../../lib/utils.js';
import { load, store } from '../../lib/store.js';
import { Card, Section, Btn, Inp, Badge, PremiumGate } from '../../components/ui.jsx';

export default function PubliciteTab() {
  const integrations = useMemo(() => load('integrations') || {}, []);
  const metaConnected = !!integrations.meta;
  const [simMode, setSimMode] = useState(false);
  const [adSpend, setAdSpend] = useState('');
  const [cpc, setCpc] = useState('');
  const [convRate, setConvRate] = useState('');

  const simResults = useMemo(() => {
    const spend = pf(adSpend);
    const costPerClick = pf(cpc);
    const cr = pf(convRate);
    if (!spend || !costPerClick) return null;
    const clicks = Math.round(spend / costPerClick);
    const impressions = Math.round(clicks / 0.035); // assume 3.5% CTR
    const ctr = clicks > 0 && impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
    const conversions = cr > 0 ? Math.round(clicks * (cr / 100)) : 0;
    const cpa = conversions > 0 ? (spend / conversions).toFixed(2) : '—';
    return { clicks, impressions, ctr, conversions, cpa };
  }, [adSpend, cpc, convRate]);

  const demoStats = [
    { l: 'Budget dépensé', v: '3 240€', c: T.orange, icon: '💸' },
    { l: 'Impressions', v: '125.4K', c: T.blue, icon: '👁️' },
    { l: 'Clics', v: '4 832', c: T.purple, icon: '👆' },
    { l: 'CTR', v: '3.85%', c: T.green, icon: '📈' },
    { l: 'CPC moyen', v: '0.67€', c: T.accent, icon: '🎯' },
    { l: 'Conversions', v: '142', c: T.green, icon: '✅' },
  ];

  return (
    <>
      {!metaConnected && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{'📢'}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 4 }}>
              Connectez Meta Ads
            </div>
            <div style={{ color: T.textSecondary, fontSize: 12, marginBottom: 16 }}>
              Connecter Meta Ads pour voir vos stats publicitaires en temps réel
            </div>
            <Btn v="primary" onClick={() => {
              const current = load('integrations') || {};
              store('integrations', { ...current, meta: true });
              window.location.reload();
            }}>
              Connecter Meta Ads
            </Btn>
          </div>
        </Card>
      )}

      {metaConnected && (
        <Card style={{ marginBottom: 16 }}>
          <Section title="META ADS" sub="Performance des campagnes publicitaires">
            <Badge label="Données de démonstration" color={T.orange} bg={T.orangeBg} />
            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 12 }}>
              {demoStats.map((m) => (
                <div key={m.l} className="glass-static" style={{ padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: m.c }}>{m.v}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, marginTop: 2 }}>{m.l}</div>
                </div>
              ))}
            </div>
          </Section>
        </Card>
      )}

      {/* Simulation mode */}
      <Section title="SIMULATEUR PUBLICITAIRE" sub="Estimez vos performances en fonction de votre budget">
        <PremiumGate label="Simulateur publicitaire" blur>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13 }}>{'🧪'}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5 }}>
                  Mode simulation
                </span>
              </div>
              <Btn v={simMode ? 'primary' : 'ghost'} small onClick={() => setSimMode(!simMode)}>
                {simMode ? 'Masquer' : 'Simuler'}
              </Btn>
            </div>

            {simMode && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
                  <Inp label="Budget publicitaire (€)" value={adSpend} onChange={setAdSpend} type="number" placeholder="1000" suffix="€" />
                  <Inp label="CPC moyen (€)" value={cpc} onChange={setCpc} type="number" placeholder="0.50" suffix="€" />
                  <Inp label="Taux de conversion (%)" value={convRate} onChange={setConvRate} type="number" placeholder="3" suffix="%" />
                </div>

                {simResults && (
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: 10, padding: 14, borderRadius: 10,
                    background: T.accent + '08', border: `1px solid ${T.accent}22`,
                  }}>
                    {[
                      { l: 'Impressions est.', v: fK(simResults.impressions), c: T.blue },
                      { l: 'Clics est.', v: fmt(simResults.clicks), c: T.purple },
                      { l: 'CTR est.', v: simResults.ctr + '%', c: T.green },
                      { l: 'Conversions est.', v: String(simResults.conversions), c: T.green },
                      { l: 'CPA est.', v: simResults.cpa === '—' ? '—' : simResults.cpa + '€', c: T.orange },
                    ].map((r) => (
                      <div key={r.l} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: r.c }}>{r.v}</div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, marginTop: 2 }}>{r.l}</div>
                      </div>
                    ))}
                  </div>
                )}

                {!simResults && (
                  <div style={{ textAlign: 'center', padding: 16, color: T.textMuted, fontSize: 11 }}>
                    Renseignez au minimum le budget et le CPC pour voir les projections
                  </div>
                )}
              </>
            )}

            {!simMode && (
              <div style={{ textAlign: 'center', padding: '12px 0', color: T.textMuted, fontSize: 11 }}>
                Cliquez sur "Simuler" pour estimer vos performances publicitaires
              </div>
            )}
          </Card>
        </PremiumGate>
      </Section>
    </>
  );
}
