import React, { useState } from 'react';
import { T } from '../lib/theme.js';
import { fmt, fK, pf, curMonth, monthLabel, MONTHS_FR } from '../lib/utils.js';
import { KPI, Card, Section, Btn, Inp } from '../components/ui.jsx';

const SUB_TABS = ['Finances', 'Sales', 'Publicité'];

// Demo financial history
function generateHistory() {
  const rows = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const ca = 18000 + Math.round(Math.random() * 15000);
    const charges = 10000 + Math.round(Math.random() * 8000);
    rows.push({ key, ca, charges, result: ca - charges });
  }
  return rows;
}

export default function Data() {
  const [subTab, setSubTab] = useState('Finances');
  const [history] = useState(generateHistory);
  const [formMonth, setFormMonth] = useState(curMonth());
  const [formCA, setFormCA] = useState('');
  const [formFixed, setFormFixed] = useState('');
  const [formVar, setFormVar] = useState('');
  const [formTreso, setFormTreso] = useState('');

  const lastRow = history[history.length - 1] || {};
  const totalCA = history.reduce((s, r) => s + r.ca, 0);
  const totalCharges = history.reduce((s, r) => s + r.charges, 0);

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Data</h1>
        <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>Vos données financières, commerciales et publicitaires</p>
      </div>

      {/* Sub-tabs */}
      <div className="fade-up d1" style={{ display: 'flex', gap: 0, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden', marginBottom: 20, width: 'fit-content' }}>
        {SUB_TABS.map((t) => {
          const active = subTab === t;
          return (
            <button key={t} onClick={() => setSubTab(t)} style={{
              background: active ? T.accentBg : 'transparent', border: 'none', cursor: 'pointer',
              padding: '8px 18px', fontSize: 12, fontWeight: active ? 700 : 500, fontFamily: 'inherit',
              color: active ? T.accent : T.textMuted, transition: 'all .15s',
            }}>{t}</button>
          );
        })}
      </div>

      {subTab === 'Finances' && (
        <>
          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
            <KPI label="CA MENSUEL" value={`${fK(lastRow.ca || 0)}€`} sub="Ce mois-ci" accent={T.green} icon="💰" delay={1} />
            <KPI label="CHARGES FIXES" value={`${fK(pf(formFixed) || 8500)}€`} sub="Loyer, salaires, abonnements" accent={T.red} icon="🏢" delay={2} />
            <KPI label="CHARGES VARIABLES" value={`${fK(pf(formVar) || 4200)}€`} sub="Pub, freelances, outils" accent={T.orange} icon="📊" delay={3} />
            <KPI label="TRÉSORERIE" value={`${fK(pf(formTreso) || 42000)}€`} sub="Solde disponible" accent={T.blue} icon="🏦" delay={4} />
          </div>

          {/* Saisie */}
          <Section title="SAISIE" sub="Renseignez vos données du mois">
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <Inp label="Mois" type="month" value={formMonth} onChange={setFormMonth} />
                <Inp label="Chiffre d'affaires (€)" value={formCA} onChange={setFormCA} type="number" placeholder="0" suffix="€" />
                <Inp label="Charges fixes (€)" value={formFixed} onChange={setFormFixed} type="number" placeholder="0" suffix="€" />
                <Inp label="Charges variables (€)" value={formVar} onChange={setFormVar} type="number" placeholder="0" suffix="€" />
                <Inp label="Trésorerie (€)" value={formTreso} onChange={setFormTreso} type="number" placeholder="0" suffix="€" />
              </div>
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                <Btn style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>Enregistrer</Btn>
              </div>
            </Card>
          </Section>

          {/* Historique */}
          <Section title="HISTORIQUE" sub="6 derniers mois">
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Mois', 'CA', 'Charges', 'Résultat'].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: T.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: .5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((r) => (
                    <tr key={r.key} style={{ borderBottom: `1px solid ${T.border}22` }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>{monthLabel(r.key)}</td>
                      <td style={{ padding: '10px 14px', color: T.green, fontWeight: 600 }}>{fmt(r.ca)}€</td>
                      <td style={{ padding: '10px 14px', color: T.red, fontWeight: 600 }}>{fmt(r.charges)}€</td>
                      <td style={{ padding: '10px 14px', color: r.result >= 0 ? T.orange : T.red, fontWeight: 700 }}>{fmt(r.result)}€</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Section>
        </>
      )}

      {subTab === 'Sales' && (
        <Card>
          <Section title="PIPELINE SALES" sub="Suivi des ventes et conversions">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 12 }}>
              {[
                { l: 'Prospects', v: 24, c: T.orange },
                { l: 'En cours', v: 12, c: T.blue },
                { l: 'Propositions', v: 8, c: T.purple },
                { l: 'Gagnés', v: 18, c: T.green },
                { l: 'Perdus', v: 5, c: T.red },
              ].map((s) => (
                <div key={s.l} style={{ textAlign: 'center', padding: 12, borderRadius: 10, background: s.c + '10', border: `1px solid ${s.c}22` }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: s.c, marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </Section>
        </Card>
      )}

      {subTab === 'Publicité' && (
        <Card>
          <Section title="META ADS" sub="Performance des campagnes publicitaires">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 12 }}>
              {[
                { l: 'Budget dépensé', v: '3 240€', c: T.orange, icon: '💸' },
                { l: 'Impressions', v: '125.4K', c: T.blue, icon: '👁️' },
                { l: 'Clics', v: '4 832', c: T.purple, icon: '👆' },
                { l: 'CTR', v: '3.85%', c: T.green, icon: '📈' },
                { l: 'CPC moyen', v: '0.67€', c: T.accent, icon: '🎯' },
                { l: 'Conversions', v: '142', c: T.green, icon: '✅' },
              ].map((m) => (
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
    </div>
  );
}
