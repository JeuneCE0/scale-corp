import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { T } from '../lib/theme.js';
import { fmt, fK, pf, curMonth, monthLabel, prevMonth, sameMonthLastYear } from '../lib/utils.js';
import { storeDebounced, load, store } from '../lib/store.js';
import { broadcast, subscribe } from '../lib/sync.js';
import { KPI, Card, Section, Btn, Inp, TabBar, EmptyState, Pagination, ProgressBar, HelpTip, Spinner } from '../components/ui.jsx';

const LazyFinChart = lazy(() =>
  import('recharts').then((mod) => ({
    default: function FinChart() {
      const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } = mod;
      const history = load('finHistory') || [];
      const data = history.slice(-6).map((r) => ({
        name: monthLabel(r.key),
        CA: r.ca || 0,
        Charges: r.charges || 0,
      }));
      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={fK} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => fmt(v) + '€'} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="CA" fill="#16a34a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Charges" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    },
  }))
);

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

function EvoBadge({ value, invert }) {
  const isPositive = invert ? value < 0 : value > 0;
  const color = isPositive ? T.green : T.red;
  const arrow = value > 0 ? '↑' : '↓';
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, color, marginLeft: 6,
      padding: '1px 5px', borderRadius: 4, background: color + '15',
      whiteSpace: 'nowrap',
    }}>{arrow}{Math.abs(value)}%</span>
  );
}

function MarginBar({ ratio }) {
  const color = ratio > 30 ? T.green : ratio > 10 ? T.orange : T.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 70 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: T.border, overflow: 'hidden', minWidth: 28 }}>
        <div style={{ height: '100%', width: `${Math.min(Math.max(ratio, 0), 100)}%`, background: color, borderRadius: 2, transition: 'width .5s ease' }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, whiteSpace: 'nowrap' }}>{ratio}%</span>
    </div>
  );
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
  const [sortCol, setSortCol] = useState('key');
  const [sortDir, setSortDir] = useState('asc');
  const [histPage, setHistPage] = useState(1);
  const HIST_PAGE_SIZE = 12;

  // CA Goal (persisted)
  const [caGoal, setCaGoal] = useState(() => load('caGoal') || 0);
  const [goalInput, setGoalInput] = useState('');
  const saveCaGoal = useCallback(() => {
    const val = Math.round(pf(goalInput));
    if (!val) return;
    setCaGoal(val);
    store('caGoal', val);
    setGoalInput('');
  }, [goalInput]);

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const va = a[sortCol] ?? 0;
      const vb = b[sortCol] ?? 0;
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [history, sortCol, sortDir]);

  const histByKey = useMemo(() => {
    const map = {};
    history.forEach((r) => { map[r.key] = r; });
    return map;
  }, [history]);

  // YTD totals for current year
  const ytd = useMemo(() => {
    const year = new Date().getFullYear().toString();
    const yearRows = history.filter((r) => r.key.startsWith(year));
    return {
      ca: yearRows.reduce((s, r) => s + (r.ca || 0), 0),
      charges: yearRows.reduce((s, r) => s + (r.charges || 0), 0),
      result: yearRows.reduce((s, r) => s + (r.result || 0), 0),
      count: yearRows.length,
    };
  }, [history]);

  const evo = useCallback((current, field) => {
    const prev = histByKey[prevMonth(current.key)];
    if (!prev || !prev[field]) return null;
    const pctChange = Math.round(((current[field] - prev[field]) / Math.abs(prev[field])) * 100);
    if (pctChange === 0) return null;
    return pctChange;
  }, [histByKey]);

  // N-1 comparison: same month last year
  const evoN1 = useCallback((current) => {
    const lastYearRow = histByKey[sameMonthLastYear(current.key)];
    if (!lastYearRow || !lastYearRow.ca) return null;
    return Math.round(((current.ca - lastYearRow.ca) / Math.abs(lastYearRow.ca)) * 100);
  }, [histByKey]);

  const toggleSort = useCallback((col) => {
    setSortCol((prev) => { if (prev === col) { setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); } else { setSortDir('asc'); } return col; });
  }, []);

  useEffect(() => {
    storeDebounced('finHistory', history);
    broadcast('finHistory', history);
  }, [history]);

  useEffect(() => subscribe('finHistory', (data) => setHistory(data)), []);

  const lastRow = useMemo(() => history[history.length - 1] || {}, [history]);

  // Sparkline data for KPIs
  const sparkCA = useMemo(() => history.slice(-6).map((r) => r.ca || 0), [history]);
  const sparkCharges = useMemo(() => history.slice(-6).map((r) => r.charges || 0), [history]);
  const sparkResult = useMemo(() => history.slice(-6).map((r) => r.result || 0), [history]);

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

  // PDF Export
  const exportPDF = useCallback(() => {
    const w = window.open('', '_blank');
    if (!w) return;
    const rows = [...history].sort((a, b) => a.key.localeCompare(b.key));
    w.document.write(`<!DOCTYPE html><html><head><title>Rapport HubScale</title>
    <style>
      body{font-family:'Inter',-apple-system,sans-serif;padding:40px;color:#111;max-width:800px;margin:0 auto}
      h1{font-size:22px;margin:0 0 4px}h2{font-size:14px;margin:24px 0 4px}
      .sub{color:#666;font-size:12px;margin-bottom:24px}
      .kpis{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}
      .kpi{flex:1;min-width:140px;padding:16px;border-radius:12px;border:1px solid #e4e4e7}
      .kpi-label{font-size:10px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.5px}
      .kpi-value{font-size:24px;font-weight:800;margin-top:4px}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
      th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #e4e4e7}
      th{font-size:10px;text-transform:uppercase;color:#888;font-weight:600}
      .g{color:#16a34a}.r{color:#dc2626}.o{color:#ea580c}
      .ytd-row{font-weight:800;border-top:2px solid #333}
      .footer{margin-top:32px;font-size:10px;color:#aaa;text-align:center}
      @media print{body{padding:20px}}
    </style></head><body>
    <h1>Rapport Financier</h1>
    <div class="sub">Généré le ${new Date().toLocaleDateString('fr-FR')} — HubScale</div>
    <div class="kpis">
      <div class="kpi"><div class="kpi-label">CA Dernier mois</div><div class="kpi-value g">${fmt(lastRow.ca || 0)}\u20AC</div></div>
      <div class="kpi"><div class="kpi-label">Charges</div><div class="kpi-value r">${fmt(lastRow.charges || 0)}\u20AC</div></div>
      <div class="kpi"><div class="kpi-label">Résultat</div><div class="kpi-value o">${fmt(lastRow.result || 0)}\u20AC</div></div>
      ${caGoal > 0 ? `<div class="kpi"><div class="kpi-label">Objectif CA</div><div class="kpi-value">${fmt(caGoal)}\u20AC</div></div>` : ''}
    </div>
    <h2>Historique</h2>
    <table>
      <thead><tr><th>Mois</th><th>CA</th><th>Charges</th><th>Marge</th><th>Résultat</th></tr></thead>
      <tbody>
        ${rows.map(r => {
          const margin = r.ca ? Math.round((r.result / r.ca) * 100) : 0;
          return `<tr><td>${monthLabel(r.key)}</td><td class="g">${fmt(r.ca)}\u20AC</td><td class="r">${fmt(r.charges)}\u20AC</td><td>${margin}%</td><td class="${r.result >= 0 ? 'o' : 'r'}">${fmt(r.result)}\u20AC</td></tr>`;
        }).join('')}
        <tr class="ytd-row"><td>TOTAL YTD ${new Date().getFullYear()}</td><td class="g">${fmt(ytd.ca)}\u20AC</td><td class="r">${fmt(ytd.charges)}\u20AC</td><td>${ytd.ca ? Math.round((ytd.result / ytd.ca) * 100) : 0}%</td><td class="${ytd.result >= 0 ? 'o' : 'r'}">${fmt(ytd.result)}\u20AC</td></tr>
      </tbody>
    </table>
    <div class="footer">Rapport confidentiel — HubScale ${new Date().getFullYear()}</div>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  }, [history, lastRow, ytd, caGoal]);

  // FEC Export (Fichier des Écritures Comptables)
  const exportFEC = useCallback(() => {
    const header = 'JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcrtureLet|DateLet|ValidDate|Montantdevise|Idevise';
    const rows = [...history].sort((a, b) => a.key.localeCompare(b.key));
    const lines = [header];
    rows.forEach((r, idx) => {
      const [y, m] = r.key.split('-');
      const dateStr = `${y}${m}01`;
      const num = String(idx + 1).padStart(4, '0');
      const ca = (r.ca || 0).toFixed(2);
      const charges = (r.charges || 0).toFixed(2);
      const result = (r.result || 0).toFixed(2);
      // Line 1: CA entry (credit)
      lines.push(`VE|Journal des Ventes|${num}|${dateStr}|701000|Ventes|||FA${num}|${dateStr}|CA ${monthLabel(r.key)}|0.00|${ca}||||${ca}|EUR`);
      // Line 2: Charges entry (debit)
      lines.push(`AC|Journal des Achats|${num}|${dateStr}|601000|Charges|||AC${num}|${dateStr}|Charges ${monthLabel(r.key)}|${charges}|0.00||||${charges}|EUR`);
      // Line 3: Result / Bank entry
      const debit = parseFloat(result) >= 0 ? result : '0.00';
      const credit = parseFloat(result) < 0 ? Math.abs(parseFloat(result)).toFixed(2) : '0.00';
      lines.push(`BQ|Journal de Banque|${num}|${dateStr}|512000|Banque|||BQ${num}|${dateStr}|Solde ${monthLabel(r.key)}|${debit}|${credit}||||${Math.abs(parseFloat(result)).toFixed(2)}|EUR`);
    });
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FEC_HubScale_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [history]);

  const thStyle = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: T.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: .5, cursor: 'pointer', userSelect: 'none' };
  const tdStyle = { padding: '10px 14px' };

  return (
    <div>
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Data</h1>
          <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>Vos données financières, commerciales et publicitaires</p>
        </div>
        {subTab === 'Finances' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn v="secondary" small onClick={exportPDF} aria-label="Exporter en PDF">📄 Export PDF</Btn>
            <Btn v="secondary" small onClick={exportFEC} aria-label="Exporter FEC">📋 Export FEC</Btn>
          </div>
        )}
      </div>

      <div className="fade-up d1" style={{ marginBottom: 20, width: 'fit-content' }}>
        <TabBar items={SUB_TABS} active={subTab} onChange={setSubTab} />
      </div>

      {subTab === 'Finances' && (
        <>
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            <KPI label="CA MENSUEL" value={`${fK(lastRow.ca || 0)}€`} sub="Ce mois-ci" accent={T.green} icon="💰" delay={1} sparkData={sparkCA} helpTip="Chiffre d'affaires total du mois" />
            <KPI label="CHARGES" value={`${fK(lastRow.charges || 0)}€`} sub="Fixes + Variables" accent={T.red} icon="📉" delay={2} sparkData={sparkCharges} helpTip="Total charges fixes + variables" />
            <KPI label="RÉSULTAT" value={`${fK(lastRow.result || 0)}€`} sub={lastRow.ca ? `Marge: ${Math.round(((lastRow.result || 0) / lastRow.ca) * 100)}%` : '—'} accent={T.orange} icon="📊" delay={3} sparkData={sparkResult} helpTip="CA moins charges = résultat net" />
            <KPI label="TRÉSORERIE" value={`${fK(lastRow.treso || pf(formTreso) || 0)}€`} sub="Solde disponible" accent={T.blue} icon="🏦" delay={4} helpTip="Solde bancaire disponible" />
          </div>

          {/* CA Goal */}
          {caGoal > 0 && (
            <div className="fade-up d2" style={{ marginBottom: 16 }}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, whiteSpace: 'nowrap' }}>
                    🎯 Objectif CA
                    <HelpTip text="Progression vers votre objectif mensuel" />
                  </div>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <ProgressBar value={lastRow.ca || 0} max={caGoal} color={(lastRow.ca || 0) >= caGoal ? T.green : T.orange} h={8} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: (lastRow.ca || 0) >= caGoal ? T.green : T.orange, whiteSpace: 'nowrap' }}>
                    {fK(lastRow.ca || 0)}€ / {fK(caGoal)}€ ({Math.min(Math.round(((lastRow.ca || 0) / caGoal) * 100), 999)}%)
                  </div>
                  <Btn v="ghost" small onClick={() => { setCaGoal(0); store('caGoal', 0); }}>✕</Btn>
                </div>
              </Card>
            </div>
          )}

          <div className="fade-up d3" style={{ marginBottom: 16 }}>
            <Card>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
                ÉVOLUTION CA / CHARGES
              </div>
              <div style={{ height: 200 }}>
                <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spinner size={20} /></div>}>
                  <LazyFinChart />
                </Suspense>
              </div>
            </Card>
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
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                {!caGoal && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Inp label="" value={goalInput} onChange={setGoalInput} type="number" placeholder="Objectif CA mensuel" small suffix="€" />
                    <Btn v="ghost" small onClick={saveCaGoal} disabled={!goalInput}>🎯 Définir</Btn>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                  {saved && <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>✓ Enregistré</span>}
                  <Btn onClick={saveEntry} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>Enregistrer</Btn>
                </div>
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
                        {[
                          { label: 'Mois', key: 'key' },
                          { label: 'CA', key: 'ca' },
                          { label: 'Charges', key: 'charges' },
                          { label: 'Marge', key: null, tip: 'Ratio résultat / CA' },
                          { label: 'Résultat', key: 'result' },
                          { label: 'N-1', key: null, tip: 'Comparaison avec le même mois l\'année précédente' },
                        ].map((h) => (
                          <th key={h.label} scope="col" onClick={h.key ? () => toggleSort(h.key) : undefined}
                            style={{ ...thStyle, cursor: h.key ? 'pointer' : 'default' }}>
                            {h.label}
                            {h.tip && <HelpTip text={h.tip} />}
                            {h.key && sortCol === h.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedHistory.slice((histPage - 1) * HIST_PAGE_SIZE, histPage * HIST_PAGE_SIZE).map((r) => {
                        const evoCa = evo(r, 'ca');
                        const evoCharges = evo(r, 'charges');
                        const evoResult = evo(r, 'result');
                        const margin = r.ca ? Math.round((r.result / r.ca) * 100) : 0;
                        const n1 = evoN1(r);
                        return (
                          <tr key={r.key} style={{ borderBottom: `1px solid ${T.border}22` }}>
                            <td style={{ ...tdStyle, fontWeight: 600, color: T.text }}>{monthLabel(r.key)}</td>
                            <td style={{ ...tdStyle, color: T.green, fontWeight: 600 }}>
                              <span className="full-num">{fmt(r.ca)}€</span>
                              <span className="compact-num">{fK(r.ca)}€</span>
                              {evoCa != null && <EvoBadge value={evoCa} invert={false} />}
                            </td>
                            <td style={{ ...tdStyle, color: T.red, fontWeight: 600 }}>
                              <span className="full-num">{fmt(r.charges)}€</span>
                              <span className="compact-num">{fK(r.charges)}€</span>
                              {evoCharges != null && <EvoBadge value={evoCharges} invert />}
                            </td>
                            <td style={tdStyle}>
                              <MarginBar ratio={margin} />
                            </td>
                            <td style={{ ...tdStyle, color: r.result >= 0 ? T.orange : T.red, fontWeight: 700 }}>
                              <span className="full-num">{fmt(r.result)}€</span>
                              <span className="compact-num">{fK(r.result)}€</span>
                              {evoResult != null && <EvoBadge value={evoResult} invert={false} />}
                            </td>
                            <td style={tdStyle}>
                              {n1 != null ? <EvoBadge value={n1} invert={false} /> : <span style={{ fontSize: 10, color: T.textMuted }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                      {/* YTD Summary Row */}
                      <tr style={{ borderTop: `2px solid ${T.border}`, background: T.surface2 }}>
                        <td style={{ ...tdStyle, fontWeight: 800, color: T.text, fontSize: 11 }}>YTD {new Date().getFullYear()}</td>
                        <td style={{ ...tdStyle, color: T.green, fontWeight: 800, fontSize: 11 }}>
                          <span className="full-num">{fmt(ytd.ca)}€</span>
                          <span className="compact-num">{fK(ytd.ca)}€</span>
                        </td>
                        <td style={{ ...tdStyle, color: T.red, fontWeight: 800, fontSize: 11 }}>
                          <span className="full-num">{fmt(ytd.charges)}€</span>
                          <span className="compact-num">{fK(ytd.charges)}€</span>
                        </td>
                        <td style={tdStyle}>
                          <MarginBar ratio={ytd.ca ? Math.round((ytd.result / ytd.ca) * 100) : 0} />
                        </td>
                        <td style={{ ...tdStyle, color: ytd.result >= 0 ? T.orange : T.red, fontWeight: 800, fontSize: 11 }}>
                          <span className="full-num">{fmt(ytd.result)}€</span>
                          <span className="compact-num">{fK(ytd.result)}€</span>
                        </td>
                        <td style={{ ...tdStyle, fontSize: 10, color: T.textMuted }}>—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <Pagination page={histPage} totalPages={Math.ceil(sortedHistory.length / HIST_PAGE_SIZE)} onChange={setHistPage} />
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
