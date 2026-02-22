import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { T } from '../lib/theme.js';
import { fmt, fK, pf, curMonth, monthLabel } from '../lib/utils.js';
import { storeDebounced, load } from '../lib/store.js';
import { KPI, Card, Section, Btn, Inp, TabBar, EmptyState } from '../components/ui.jsx';

const SUB_TABS = ['Finances', 'Sales', 'Publicité'];

function generateDefaultHistory() {
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
  const [history, setHistory] = useState(() => load('finHistory') || generateDefaultHistory());
  const [formMonth, setFormMonth] = useState(curMonth());
  const [formCA, setFormCA] = useState('');
  const [formFixed, setFormFixed] = useState('');
  const [formVar, setFormVar] = useState('');
  const [formTreso, setFormTreso] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { storeDebounced('finHistory', history); }, [history]);

  const lastRow = useMemo(() => history[history.length - 1] || {}, [history]);

  const saveEntry = useCallback(() => {
    const ca = Math.round(pf(formCA) * 100) / 100;
    const fixed = Math.round(pf(formFixed) * 100) / 100;
    const variable = Math.round(pf(formVar) * 100) / 100;
    if (!ca && !fixed && !variable) return;
    const existing = history.findIndex((r) => r.key === formMonth);
    const charges = Math.round((fixed + variable) * 100) / 100;
    const result = Math.round((ca - fixed - variable) * 100) / 100;
    const row = { key: formMonth, ca, charges, result, treso: Math.round(pf(formTreso) * 100) / 100 };
    if (existing >= 0) {
      const updated = [...history]; updated[existing] = row; setHistory(updated);
    } else {
      setHistory([...history, row].sort((a, b) => a.key.localeCompare(b.key)).slice(-12));
    }
    setFormCA(''); setFormFixed(''); setFormVar(''); setFormTreso('');
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }, [formCA, formFixed, formVar, formTreso, formMonth, history]);

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Data</h1>
        <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>Vos données financières, commerciales et publicitaires</p>
      </div>

      <div className="fade-up d1" style={{ marginBottom: 20, width: 'fit-content' }}>
        <TabBar items={SUB_TABS} active={subTab} onChange={setSubTab} />
      </div>

      {subTab === 'Finances' && (
        <>
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            <KPI label="CA MENSUEL" value={`${fK(lastRow.ca || 0)}€`} sub="Ce mois-ci" accent={T.green} icon="💰" delay={1} />
            <KPI label="CHARGES FIXES" value={`${fK(pf(formFixed) || 8500)}€`} sub="Loyer, salaires" accent={T.red} icon="🏢" delay={2} />
            <KPI label="CHARGES VAR." value={`${fK(pf(formVar) || 4200)}€`} sub="Pub, freelances" accent={T.orange} icon="📊" delay={3} />
            <KPI label="TRÉSORERIE" value={`${fK(pf(formTreso) || 42000)}€`} sub="Solde disponible" accent={T.blue} icon="🏦" delay={4} />
          </div>

          <Section title="SAISIE" sub="Renseignez vos données du mois">
            <Card>
              <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <Inp label="Mois" type="month" value={formMonth} onChange={setFormMonth} />
                <Inp label="Chiffre d'affaires (€)" value={formCA} onChange={setFormCA} type="number" placeholder="0" suffix="€" />
                <Inp label="Charges fixes (€)" value={formFixed} onChange={setFormFixed} type="number" placeholder="0" suffix="€" />
                <Inp label="Charges variables (€)" value={formVar} onChange={setFormVar} type="number" placeholder="0" suffix="€" />
                <Inp label="Trésorerie (€)" value={formTreso} onChange={setFormTreso} type="number" placeholder="0" suffix="€" />
              </div>
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                {saved && <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>✓ Enregistré</span>}
                <Btn onClick={saveEntry} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>Enregistrer</Btn>
              </div>
            </Card>
          </Section>

          <Section title="HISTORIQUE" sub={`${history.length} derniers mois`}>
            {history.length === 0 ? (
              <Card>
                <EmptyState icon="📊" title="Aucun historique" sub="Saisissez vos premières données ci-dessus" />
              </Card>
            ) : (
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-wrap">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        {['Mois', 'CA', 'Charges', 'Résultat'].map((h) => (
                          <th key={h} scope="col" style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: T.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: .5 }}>{h}</th>
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
                </div>
              </Card>
            )}
          </Section>
        </>
      )}

      {subTab === 'Sales' && (
        <Card>
          <Section title="PIPELINE SALES" sub="Suivi des ventes et conversions">
            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginTop: 12 }}>
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
            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 12 }}>
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
