import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { T } from '../lib/theme.js';
import { fmt, fK, pf, curMonth, monthLabel, prevMonth, sameMonthLastYear, forecastCA, businessHealth } from '../lib/utils.js';
import { storeDebounced, load, store } from '../lib/store.js';
import { broadcast, subscribe } from '../lib/sync.js';
import { KPI, Card, Section, Btn, Inp, TabBar, EmptyState, Pagination, ProgressBar, HelpTip, Spinner, Badge, ScoreRing, PremiumGate } from '../components/ui.jsx';
import { isPaid, canAccessPro } from '../lib/plan.js';
import { EXPENSE_CATEGORIES, INVOICE_STATUSES, TVA_RATES } from '../lib/constants.js';
import { uid, nextInvoiceNumber, computeInvoiceTotals, isInvoiceOverdue, formatDateFR, weeklyRecap } from '../lib/utils.js';

/* ------------------------------------------------------------------ */
/*  Lazy-loaded Enhanced Chart with forecast overlay                   */
/* ------------------------------------------------------------------ */
const LazyFinChart = lazy(() =>
  import('recharts').then((mod) => ({
    default: function FinChart({ forecastData }) {
      const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine } = mod;
      const history = load('finHistory') || [];
      const actual = history.slice(-6).map((r) => ({
        name: monthLabel(r.key),
        CA: r.ca || 0,
        Charges: r.charges || 0,
        type: 'actual',
      }));
      const forecast = (forecastData || []).map((r) => ({
        name: monthLabel(r.key),
        CA: r.ca || 0,
        Charges: 0,
        type: 'forecast',
      }));
      const data = [...actual, ...forecast];
      return (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={fK} tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(v, name, entry) => [
                fmt(v) + '€' + (entry.payload.type === 'forecast' ? ' (prev.)' : ''),
                name,
              ]}
              contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, color: T.text }}
              labelStyle={{ fontWeight: 700, fontSize: 11, color: T.text }}
              itemStyle={{ color: T.text }}
              cursor={{ fill: 'rgba(255,255,255,.05)' }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10 }}
              payload={[
                { value: 'CA (réel)', type: 'square', color: '#16a34a' },
                { value: 'Charges', type: 'square', color: '#dc2626' },
                { value: 'CA (prévision)', type: 'square', color: '#16a34a80' },
              ]}
            />
            {actual.length > 0 && forecast.length > 0 && (
              <ReferenceLine x={actual[actual.length - 1].name} stroke={T.border} strokeDasharray="4 4" />
            )}
            <Bar dataKey="CA" radius={[4, 4, 0, 0]}>
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.type === 'forecast' ? '#16a34a' : '#16a34a'}
                  fillOpacity={entry.type === 'forecast' ? 0.35 : 1}
                  stroke={entry.type === 'forecast' ? '#16a34a' : 'none'}
                  strokeWidth={entry.type === 'forecast' ? 1 : 0}
                  strokeDasharray={entry.type === 'forecast' ? '4 2' : 'none'}
                />
              ))}
            </Bar>
            <Bar dataKey="Charges" radius={[4, 4, 0, 0]}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill="#dc2626" fillOpacity={entry.type === 'forecast' ? 0.2 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    },
  }))
);

/* ------------------------------------------------------------------ */
/*  Lazy-loaded Donut Chart for expense categories                     */
/* ------------------------------------------------------------------ */
const LazyExpenseDonut = lazy(() =>
  import('recharts').then((mod) => ({
    default: function ExpenseDonut({ data }) {
      const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = mod;
      if (!data || data.length === 0) return null;
      return (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              nameKey="label"
            >
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [fmt(v) + ' €', '']}
              contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, color: T.text }}
              labelStyle={{ fontWeight: 700, fontSize: 11, color: T.text }}
              itemStyle={{ color: T.text }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    },
  }))
);

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const SUB_TABS = ['Finances', 'Catalogue', 'Factures', 'P&L', 'Sales', 'Publicité'];
const HIST_PAGE_SIZE = 12;

/* ------------------------------------------------------------------ */
/*  Default history generator                                          */
/* ------------------------------------------------------------------ */
function generateDefaultHistory() {
  const rows = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const ca = 18000 + Math.round(Math.random() * 15000);
    const charges = 10000 + Math.round(Math.random() * 8000);
    const catLoyer = 1500 + Math.round(Math.random() * 300);
    const catSalaires = 3000 + Math.round(Math.random() * 2000);
    const catMarketing = 800 + Math.round(Math.random() * 1200);
    const catOutils = 200 + Math.round(Math.random() * 300);
    const catAutre = Math.max(0, charges - catLoyer - catSalaires - catMarketing - catOutils);
    const categories = { loyer: catLoyer, salaires: catSalaires, marketing: catMarketing, outils: catOutils, autre: catAutre };
    rows.push({ key, ca, charges, result: ca - charges, categories });
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/*  Helper components                                                  */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Threshold Alerts Component                                         */
/* ------------------------------------------------------------------ */
function ThresholdAlerts({ history, histByKey }) {
  const alerts = useMemo(() => {
    if (!history || history.length === 0) return [];
    const last = history[history.length - 1];
    const prevKey = prevMonth(last.key);
    const prev = histByKey[prevKey];
    const list = [];

    // Margin checks
    const margin = last.ca ? Math.round((last.result / last.ca) * 100) : 0;
    if (margin < 10) {
      list.push({
        level: 'red',
        icon: '⚠️',
        message: 'Marge critique',
        detail: `Marge actuelle : ${margin}% (seuil : 10%)`,
        action: 'Réduisez vos charges ou augmentez vos prix',
      });
    } else if (margin < 20) {
      list.push({
        level: 'orange',
        icon: '⚠️',
        message: 'Marge faible',
        detail: `Marge actuelle : ${margin}% (seuil : 20%)`,
        action: 'Surveillez l’évolution de vos charges',
      });
    }

    // CA decrease check
    if (prev && prev.ca > 0) {
      const caDelta = Math.round(((last.ca - prev.ca) / Math.abs(prev.ca)) * 100);
      if (caDelta < -15) {
        list.push({
          level: 'red',
          icon: '📉',
          message: 'CA en baisse',
          detail: `${Math.abs(caDelta)}% de baisse vs mois précédent`,
          action: 'Analysez vos sources de revenus et relancez vos prospects',
        });
      }
    }

    // Charges increase check
    if (prev && prev.charges > 0) {
      const chargesDelta = Math.round(((last.charges - prev.charges) / Math.abs(prev.charges)) * 100);
      if (chargesDelta > 20) {
        list.push({
          level: 'orange',
          icon: '💸',
          message: 'Charges en hausse',
          detail: `+${chargesDelta}% vs mois précédent`,
          action: 'Vérifiez vos postes de dépenses et identifiez les écarts',
        });
      }
    }

    return list;
  }, [history, histByKey]);

  if (alerts.length === 0) return null;

  return (
    <div className="fade-up d2" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
      {alerts.map((a, i) => {
        const bg = a.level === 'red' ? T.redBg : T.orangeBg;
        const color = a.level === 'red' ? T.red : T.orange;
        const borderColor = a.level === 'red' ? T.red + '44' : T.orange + '44';
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
            borderRadius: 10, background: bg, border: `1px solid ${borderColor}`,
          }}>
            <span style={{ fontSize: 16, lineHeight: 1.3, flexShrink: 0 }}>{a.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color }}>{a.message}</div>
              <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 1 }}>{a.detail}</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3, fontStyle: 'italic' }}>
                Conseil : {a.action}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CA Forecast Card                                                   */
/* ------------------------------------------------------------------ */
function ForecastCard({ forecastData, history }) {
  if (!forecastData || forecastData.length === 0) return null;

  const lastCA = history.length > 0 ? history[history.length - 1].ca : 0;
  const avgGrowth = useMemo(() => {
    if (forecastData.length < 2) return 0;
    const first = forecastData[0].ca;
    const last = forecastData[forecastData.length - 1].ca;
    if (first === 0) return 0;
    const monthlyGrowth = ((last - first) / first / (forecastData.length - 1)) * 100;
    return Math.round(monthlyGrowth);
  }, [forecastData]);

  // Compute overall trend from last actual to last forecast
  const trend = useMemo(() => {
    if (!lastCA || lastCA === 0 || forecastData.length === 0) return 0;
    const totalChange = ((forecastData[forecastData.length - 1].ca - lastCA) / lastCA) * 100;
    return Math.round(totalChange / forecastData.length);
  }, [lastCA, forecastData]);

  const isGrowth = trend >= 0;

  return (
    <div className="fade-up d3" style={{ marginBottom: 16 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>{isGrowth ? '📈' : '📉'}</span>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5 }}>
            Prévision CA sur 3 mois
            <HelpTip text="Projection linéaire basée sur les 6 derniers mois" />
          </div>
          <div style={{
            marginLeft: 'auto', fontSize: 11, fontWeight: 700,
            color: isGrowth ? T.green : T.red,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 18, height: 18, borderRadius: 9,
              background: isGrowth ? T.green + '20' : T.red + '20',
              fontSize: 10,
            }}>
              {isGrowth ? '↑' : '↓'}
            </span>
            Tendance : {isGrowth ? '+' : ''}{trend}%/mois
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          {forecastData.map((f, idx) => {
            const prevVal = idx === 0 ? lastCA : forecastData[idx - 1].ca;
            const diff = prevVal > 0 ? Math.round(((f.ca - prevVal) / prevVal) * 100) : 0;
            return (
              <div key={f.key} style={{
                padding: '10px 12px', borderRadius: 8,
                background: isGrowth ? T.green + '08' : T.red + '08',
                border: `1px solid ${isGrowth ? T.green + '22' : T.red + '22'}`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>
                  {monthLabel(f.key)}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: isGrowth ? T.green : T.red }}>
                  {fK(f.ca)}€
                </div>
                {diff !== 0 && (
                  <div style={{ fontSize: 9, fontWeight: 600, color: diff > 0 ? T.green : T.red, marginTop: 2 }}>
                    {diff > 0 ? '+' : ''}{diff}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Budget vs Actual Component                                         */
/* ------------------------------------------------------------------ */
function BudgetVsActual({ lastRow }) {
  const [budgetCA, setBudgetCA] = useState(() => load('budgetCA') || 0);
  const [budgetCharges, setBudgetCharges] = useState(() => load('budgetCharges') || 0);
  const [inputCA, setInputCA] = useState('');
  const [inputCharges, setInputCharges] = useState('');
  const [editing, setEditing] = useState(false);

  const saveBudgetCA = useCallback(() => {
    const val = Math.round(pf(inputCA));
    if (!val) return;
    setBudgetCA(val);
    store('budgetCA', val);
    setInputCA('');
  }, [inputCA]);

  const saveBudgetCharges = useCallback(() => {
    const val = Math.round(pf(inputCharges));
    if (!val) return;
    setBudgetCharges(val);
    store('budgetCharges', val);
    setInputCharges('');
  }, [inputCharges]);

  const clearBudgets = useCallback(() => {
    setBudgetCA(0);
    setBudgetCharges(0);
    store('budgetCA', 0);
    store('budgetCharges', 0);
    setEditing(false);
  }, []);

  if (!budgetCA && !budgetCharges && !editing) {
    return (
      <div className="fade-up d2" style={{ marginBottom: 16 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5 }}>
              Budget mensuel
              <HelpTip text="Définissez un budget pour comparer avec vos résultats réels" />
            </div>
            <Btn v="ghost" small onClick={() => setEditing(true)}>+ Définir un budget</Btn>
          </div>
          {editing && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <Inp label="Budget CA" value={inputCA} onChange={setInputCA} type="number" placeholder="0" suffix="€" small />
              <Btn v="ghost" small onClick={saveBudgetCA} disabled={!inputCA}>OK</Btn>
              <Inp label="Budget Charges" value={inputCharges} onChange={setInputCharges} type="number" placeholder="0" suffix="€" small />
              <Btn v="ghost" small onClick={saveBudgetCharges} disabled={!inputCharges}>OK</Btn>
            </div>
          )}
        </Card>
      </div>
    );
  }

  const actualCA = lastRow.ca || 0;
  const actualCharges = lastRow.charges || 0;
  const caProgress = budgetCA > 0 ? Math.min(Math.round((actualCA / budgetCA) * 100), 999) : 0;
  const chargesProgress = budgetCharges > 0 ? Math.min(Math.round((actualCharges / budgetCharges) * 100), 999) : 0;
  const caColor = caProgress >= 100 ? T.green : caProgress >= 75 ? T.orange : T.red;
  const chargesColor = chargesProgress > 100 ? T.red : chargesProgress > 80 ? T.orange : T.green;

  return (
    <div className="fade-up d2" style={{ marginBottom: 16 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>{'🎯'}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5 }}>
              Budget vs Réel
              <HelpTip text="Comparaison de vos objectifs budgétaires avec les résultats réels" />
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <Btn v="ghost" small onClick={() => setEditing(!editing)}>Modifier</Btn>
            <Btn v="ghost" small onClick={clearBudgets}>{'✕'}</Btn>
          </div>
        </div>

        {editing && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <Inp label="Budget CA" value={inputCA} onChange={setInputCA} type="number" placeholder={String(budgetCA || '')} suffix="€" small />
            <Btn v="ghost" small onClick={saveBudgetCA} disabled={!inputCA}>OK</Btn>
            <Inp label="Budget Charges" value={inputCharges} onChange={setInputCharges} type="number" placeholder={String(budgetCharges || '')} suffix="€" small />
            <Btn v="ghost" small onClick={saveBudgetCharges} disabled={!inputCharges}>OK</Btn>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {budgetCA > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase' }}>CA</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: caColor }}>
                  Budget : {fK(budgetCA)}€ / Réel : {fK(actualCA)}€
                </span>
              </div>
              <ProgressBar value={actualCA} max={budgetCA} color={caColor} h={8} />
              <div style={{ fontSize: 10, fontWeight: 600, color: caColor, marginTop: 4, textAlign: 'right' }}>{caProgress}%</div>
            </div>
          )}
          {budgetCharges > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase' }}>Charges</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: chargesColor }}>
                  Budget : {fK(budgetCharges)}€ / Réel : {fK(actualCharges)}€
                </span>
              </div>
              <ProgressBar value={actualCharges} max={budgetCharges} color={chargesColor} h={8} />
              <div style={{ fontSize: 10, fontWeight: 600, color: chargesColor, marginTop: 4, textAlign: 'right' }}>{chargesProgress}%</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Catalogue Produits / Services                                      */
/* ------------------------------------------------------------------ */
function CatalogTab() {
  const [catalog, setCatalog] = useState(() => load('catalog') || []);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', tva: 20, unit: 'unité', type: 'service' });

  useEffect(() => { storeDebounced('catalog', catalog); broadcast('catalog', catalog); }, [catalog]);
  useEffect(() => subscribe('catalog', (data) => setCatalog(data)), []);

  const save = useCallback(() => {
    if (!form.name.trim() || !pf(form.price)) return;
    const item = { ...form, price: Math.round(pf(form.price) * 100) / 100, tva: pf(form.tva) };
    if (editId) {
      setCatalog((prev) => prev.map((c) => c.id === editId ? { ...c, ...item } : c));
    } else {
      setCatalog((prev) => [...prev, { ...item, id: uid(), createdAt: new Date().toISOString() }]);
    }
    setForm({ name: '', description: '', price: '', tva: 20, unit: 'unité', type: 'service' });
    setEditId(null);
    setShowForm(false);
  }, [form, editId]);

  const edit = useCallback((item) => {
    setForm({ name: item.name, description: item.description || '', price: String(item.price), tva: item.tva, unit: item.unit || 'unité', type: item.type || 'service' });
    setEditId(item.id);
    setShowForm(true);
  }, []);

  const remove = useCallback((id) => setCatalog((prev) => prev.filter((c) => c.id !== id)), []);

  // Stats
  const stats = useMemo(() => {
    const services = catalog.filter((c) => c.type === 'service');
    const products = catalog.filter((c) => c.type === 'product');
    const avgPrice = catalog.length > 0 ? Math.round(catalog.reduce((s, c) => s + c.price, 0) / catalog.length) : 0;
    return { total: catalog.length, services: services.length, products: products.length, avgPrice };
  }, [catalog]);

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Total', v: stats.total, c: T.accent, icon: '📦' },
          { l: 'Services', v: stats.services, c: T.blue, icon: '💼' },
          { l: 'Produits', v: stats.products, c: T.green, icon: '📦' },
          { l: 'Prix moyen', v: `${fK(stats.avgPrice)}€`, c: T.orange, icon: '💰' },
        ].map((s) => (
          <div key={s.l} style={{ textAlign: 'center', padding: 14, borderRadius: 10, background: s.c + '10', border: `1px solid ${s.c}22` }}>
            <div style={{ fontSize: 14, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: s.c, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Btn onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', description: '', price: '', tva: 20, unit: 'unité', type: 'service' }); }}
          style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
          {showForm ? 'Annuler' : '+ Ajouter'}
        </Btn>
      </div>

      {/* Form */}
      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Inp label="Nom *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nom du produit/service" />
            <Inp label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Description courte" />
            <Inp label="Prix HT (€)" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" placeholder="0" suffix="€" />
            <div>
              <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>TVA</label>
              <select value={form.tva} onChange={(e) => setForm({ ...form, tva: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: T.surface2, border: `1px solid ${T.border}`, color: T.text, fontSize: 12, fontFamily: 'inherit' }}>
                {TVA_RATES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <Inp label="Unité" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} placeholder="unité, heure, jour..." />
            <div>
              <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: T.surface2, border: `1px solid ${T.border}`, color: T.text, fontSize: 12, fontFamily: 'inherit' }}>
                <option value="service">Service</option>
                <option value="product">Produit</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={save} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>{editId ? 'Modifier' : 'Ajouter'}</Btn>
          </div>
        </Card>
      )}

      {/* Catalog list */}
      {catalog.length === 0 ? (
        <Card><EmptyState icon="📦" title="Aucun produit/service" sub="Ajoutez votre premier produit ou service pour faciliter la facturation" /></Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Type', 'Nom', 'Description', 'Prix HT', 'TVA', 'Prix TTC', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: T.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: .5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {catalog.map((item) => {
                const ttc = Math.round(item.price * (1 + (item.tva || 0) / 100) * 100) / 100;
                return (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${T.border}22`, cursor: 'pointer' }} onClick={() => edit(item)}>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge label={item.type === 'service' ? 'Service' : 'Produit'} color={item.type === 'service' ? T.blue : T.green} bg={item.type === 'service' ? T.blueBg : T.greenBg} />
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>{item.name}</td>
                    <td style={{ padding: '10px 14px', color: T.textSecondary, fontSize: 11 }}>{item.description || '—'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>{fmt(item.price)} €</td>
                    <td style={{ padding: '10px 14px', color: T.textMuted }}>{item.tva}%</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.green }}>{fmt(ttc)} €</td>
                    <td style={{ padding: '10px 14px' }}>
                      <Btn v="danger" small onClick={(e) => { e.stopPropagation(); remove(item.id); }}>{'✕'}</Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Factures (Invoicing System)                                        */
/* ------------------------------------------------------------------ */
function InvoicesTab() {
  const [invoices, setInvoices] = useState(() => load('invoices') || []);
  const [catalog] = useState(() => load('catalog') || []);
  const [contacts] = useState(() => load('contacts') || []);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({ contactId: '', dueDate: '', notes: '', items: [{ description: '', qty: 1, unitPrice: 0, tva: 20 }] });

  useEffect(() => { storeDebounced('invoices', invoices); broadcast('invoices', invoices); }, [invoices]);
  useEffect(() => subscribe('invoices', (data) => setInvoices(data)), []);

  // Auto-mark overdue invoices
  useEffect(() => {
    const updated = invoices.map((inv) => {
      if (inv.status === 'sent' && isInvoiceOverdue(inv)) return { ...inv, status: 'overdue' };
      return inv;
    });
    if (JSON.stringify(updated) !== JSON.stringify(invoices)) setInvoices(updated);
  }, [invoices]);

  const addItem = useCallback(() => {
    setForm((prev) => ({ ...prev, items: [...prev.items, { description: '', qty: 1, unitPrice: 0, tva: 20 }] }));
  }, []);

  const removeItem = useCallback((idx) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  }, []);

  const updateItem = useCallback((idx, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => i === idx ? { ...item, [field]: field === 'description' ? value : pf(value) } : item),
    }));
  }, []);

  const addFromCatalog = useCallback((catItem) => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { description: catItem.name, qty: 1, unitPrice: catItem.price, tva: catItem.tva || 20, catalogId: catItem.id }],
    }));
  }, []);

  const totals = useMemo(() => computeInvoiceTotals(form.items), [form.items]);

  const save = useCallback(() => {
    if (!form.contactId || form.items.length === 0) return;
    const contact = contacts.find((c) => c.id === form.contactId);
    const { totalHT, totalTVA, totalTTC } = computeInvoiceTotals(form.items);
    if (editId) {
      setInvoices((prev) => prev.map((inv) => inv.id === editId ? {
        ...inv, contactId: form.contactId, contactName: contact?.name || '', dueDate: form.dueDate,
        notes: form.notes, items: form.items, totalHT, totalTVA, totalTTC,
      } : inv));
    } else {
      const number = nextInvoiceNumber(invoices);
      setInvoices((prev) => [...prev, {
        id: uid(), number, contactId: form.contactId, contactName: contact?.name || '',
        createdAt: new Date().toISOString(), dueDate: form.dueDate, notes: form.notes,
        items: form.items, status: 'draft', totalHT, totalTVA, totalTTC,
      }]);
    }
    setForm({ contactId: '', dueDate: '', notes: '', items: [{ description: '', qty: 1, unitPrice: 0, tva: 20 }] });
    setEditId(null);
    setShowForm(false);
  }, [form, editId, invoices, contacts]);

  const changeStatus = useCallback((id, status) => {
    setInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, status, ...(status === 'paid' ? { paidAt: new Date().toISOString() } : {}) } : inv));
  }, []);

  const deleteInvoice = useCallback((id) => setInvoices((prev) => prev.filter((inv) => inv.id !== id)), []);

  const editInvoice = useCallback((inv) => {
    setForm({ contactId: inv.contactId, dueDate: inv.dueDate || '', notes: inv.notes || '', items: inv.items || [] });
    setEditId(inv.id);
    setShowForm(true);
  }, []);

  // Stats
  const stats = useMemo(() => {
    const totalTTC = invoices.reduce((s, inv) => s + (inv.totalTTC || 0), 0);
    const paid = invoices.filter((inv) => inv.status === 'paid');
    const paidAmount = paid.reduce((s, inv) => s + (inv.totalTTC || 0), 0);
    const pending = invoices.filter((inv) => inv.status === 'sent' || inv.status === 'overdue');
    const pendingAmount = pending.reduce((s, inv) => s + (inv.totalTTC || 0), 0);
    const overdue = invoices.filter((inv) => inv.status === 'overdue');
    const overdueAmount = overdue.reduce((s, inv) => s + (inv.totalTTC || 0), 0);
    return { total: invoices.length, totalTTC, paidAmount, pendingAmount, overdueAmount, overdueCount: overdue.length };
  }, [invoices]);

  const filtered = useMemo(() => {
    if (filterStatus === 'all') return invoices;
    return invoices.filter((inv) => inv.status === filterStatus);
  }, [invoices, filterStatus]);

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Total facturé', v: `${fK(stats.totalTTC)}€`, c: T.accent, icon: '📋' },
          { l: 'Encaissé', v: `${fK(stats.paidAmount)}€`, c: T.green, icon: '✅' },
          { l: 'En attente', v: `${fK(stats.pendingAmount)}€`, c: T.orange, icon: '⏳' },
          { l: 'En retard', v: `${fK(stats.overdueAmount)}€`, c: T.red, icon: '⚠️', sub: stats.overdueCount > 0 ? `${stats.overdueCount} facture(s)` : '' },
        ].map((s) => (
          <div key={s.l} style={{ textAlign: 'center', padding: 14, borderRadius: 10, background: s.c + '10', border: `1px solid ${s.c}22` }}>
            <div style={{ fontSize: 14, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: s.c, marginTop: 2 }}>{s.l}</div>
            {s.sub && <div style={{ fontSize: 9, color: T.red, marginTop: 2 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'draft', 'sent', 'paid', 'overdue'].map((s) => {
            const label = s === 'all' ? 'Toutes' : INVOICE_STATUSES.find((st) => st.id === s)?.label || s;
            const count = s === 'all' ? invoices.length : invoices.filter((inv) => inv.status === s).length;
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{
                  background: filterStatus === s ? T.accent + '20' : 'transparent', border: `1px solid ${filterStatus === s ? T.accent : T.border}`,
                  borderRadius: 20, padding: '4px 10px', cursor: 'pointer', fontSize: 10, fontWeight: 600,
                  color: filterStatus === s ? T.accent : T.textMuted, fontFamily: 'inherit',
                }}>
                {label} ({count})
              </button>
            );
          })}
        </div>
        <Btn onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ contactId: '', dueDate: '', notes: '', items: [{ description: '', qty: 1, unitPrice: 0, tva: 20 }] }); }}
          style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
          {showForm ? 'Annuler' : '+ Nouvelle facture'}
        </Btn>
      </div>

      {/* Invoice Form */}
      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Client *</label>
              <select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: T.surface2, border: `1px solid ${T.border}`, color: T.text, fontSize: 12, fontFamily: 'inherit' }}>
                <option value="">Sélectionner un contact...</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </div>
            <Inp label="Date d'échéance" type="date" value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} />
            <Inp label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Conditions, mentions..." />
          </div>

          {/* Catalog quick-add */}
          {catalog.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Ajouter depuis le catalogue</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {catalog.map((item) => (
                  <button key={item.id} onClick={() => addFromCatalog(item)}
                    style={{
                      background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 10px',
                      cursor: 'pointer', fontSize: 10, fontWeight: 600, color: T.text, fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                    + {item.name} ({fmt(item.price)}€)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Line items */}
          <label style={{ display: 'block', color: T.textSecondary, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Lignes de facturation</label>
          {form.items.map((item, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 60px 100px 60px 32px', gap: 8, marginBottom: 6, alignItems: 'end' }}>
              <Inp label={idx === 0 ? 'Description' : ''} value={item.description} onChange={(v) => updateItem(idx, 'description', v)} placeholder="Description" small />
              <Inp label={idx === 0 ? 'Qté' : ''} value={String(item.qty)} onChange={(v) => updateItem(idx, 'qty', v)} type="number" small />
              <Inp label={idx === 0 ? 'Prix HT' : ''} value={String(item.unitPrice)} onChange={(v) => updateItem(idx, 'unitPrice', v)} type="number" suffix="€" small />
              <Inp label={idx === 0 ? 'TVA%' : ''} value={String(item.tva)} onChange={(v) => updateItem(idx, 'tva', v)} type="number" small />
              {form.items.length > 1 && <Btn v="danger" small onClick={() => removeItem(idx)}>{'✕'}</Btn>}
            </div>
          ))}
          <Btn v="ghost" small onClick={addItem} style={{ marginBottom: 12 }}>+ Ligne</Btn>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <div style={{ minWidth: 200, textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSecondary, marginBottom: 4 }}>
                <span>Sous-total HT</span><span style={{ fontWeight: 700 }}>{fmt(totals.totalHT)} €</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSecondary, marginBottom: 4 }}>
                <span>TVA</span><span style={{ fontWeight: 700 }}>{fmt(totals.totalTVA)} €</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, color: T.green, borderTop: `2px solid ${T.border}`, paddingTop: 6 }}>
                <span>Total TTC</span><span>{fmt(totals.totalTTC)} €</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={save} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>{editId ? 'Modifier' : 'Créer la facture'}</Btn>
          </div>
        </Card>
      )}

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <Card><EmptyState icon="📋" title="Aucune facture" sub="Créez votre première facture pour commencer le suivi" /></Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['N°', 'Client', 'Date', 'Échéance', 'Total TTC', 'Statut', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: T.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: .5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...filtered].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map((inv) => {
                const st = INVOICE_STATUSES.find((s) => s.id === inv.status);
                return (
                  <tr key={inv.id} style={{ borderBottom: `1px solid ${T.border}22` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.accent, fontFamily: 'monospace', fontSize: 11 }}>{inv.number}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>{inv.contactName || '—'}</td>
                    <td style={{ padding: '10px 14px', color: T.textSecondary, fontSize: 11 }}>{formatDateFR(inv.createdAt)}</td>
                    <td style={{ padding: '10px 14px', color: inv.status === 'overdue' ? T.red : T.textSecondary, fontWeight: inv.status === 'overdue' ? 700 : 400, fontSize: 11 }}>
                      {inv.dueDate ? formatDateFR(inv.dueDate) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.text }}>{fmt(inv.totalTTC)} €</td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge label={st?.label} color={st?.color} bg={st?.bg} />
                    </td>
                    <td style={{ padding: '10px 14px', display: 'flex', gap: 4 }}>
                      {inv.status === 'draft' && <Btn v="ghost" small onClick={() => changeStatus(inv.id, 'sent')}>Envoyer</Btn>}
                      {(inv.status === 'sent' || inv.status === 'overdue') && <Btn v="success" small onClick={() => changeStatus(inv.id, 'paid')}>Encaisser</Btn>}
                      <Btn v="ghost" small onClick={() => editInvoice(inv)}>Modifier</Btn>
                      <Btn v="danger" small onClick={() => deleteInvoice(inv.id)}>{'✕'}</Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  P&L Simplifié (Profit & Loss Statement)                           */
/* ------------------------------------------------------------------ */
function PLTab() {
  const history = useMemo(() => load('finHistory') || [], []);
  const invoices = useMemo(() => load('invoices') || [], []);
  const year = new Date().getFullYear();

  const monthlyData = useMemo(() => {
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`;
      const row = history.find((r) => r.key === key);
      const monthInvoices = invoices.filter((inv) => inv.status === 'paid' && inv.createdAt && inv.createdAt.startsWith(key));
      const invoicedRevenue = monthInvoices.reduce((s, inv) => s + (inv.totalHT || 0), 0);
      months.push({
        key,
        label: monthLabel(key),
        ca: row?.ca || 0,
        charges: row?.charges || 0,
        result: row?.result || 0,
        categories: row?.categories || {},
        invoicedRevenue,
        margin: row?.ca ? Math.round((row.result / row.ca) * 100) : 0,
        hasData: !!row,
      });
    }
    return months;
  }, [history, invoices, year]);

  const ytd = useMemo(() => {
    const filled = monthlyData.filter((m) => m.hasData);
    return {
      ca: filled.reduce((s, m) => s + m.ca, 0),
      charges: filled.reduce((s, m) => s + m.charges, 0),
      result: filled.reduce((s, m) => s + m.result, 0),
      invoicedRevenue: filled.reduce((s, m) => s + m.invoicedRevenue, 0),
      months: filled.length,
    };
  }, [monthlyData]);

  // Aggregate categories for the year
  const yearCategories = useMemo(() => {
    const totals = {};
    monthlyData.forEach((m) => {
      if (m.categories) {
        Object.entries(m.categories).forEach(([cat, val]) => {
          totals[cat] = (totals[cat] || 0) + val;
        });
      }
    });
    const catMap = {};
    EXPENSE_CATEGORIES.forEach((c) => { catMap[c.id] = c; });
    return Object.entries(totals)
      .map(([id, value]) => ({ id, label: catMap[id]?.label || id, icon: catMap[id]?.icon || '📋', color: catMap[id]?.color || '#71717a', value }))
      .sort((a, b) => b.value - a.value);
  }, [monthlyData]);

  const marginColor = (m) => m > 30 ? T.green : m > 10 ? T.orange : T.red;

  // Key ratios
  const ratios = useMemo(() => {
    const avgMonthlyCA = ytd.months > 0 ? Math.round(ytd.ca / ytd.months) : 0;
    const avgMonthlyCharges = ytd.months > 0 ? Math.round(ytd.charges / ytd.months) : 0;
    const breakeven = avgMonthlyCharges; // Point mort mensuel
    const marginPct = ytd.ca ? Math.round((ytd.result / ytd.ca) * 100) : 0;
    const chargesRatio = ytd.ca ? Math.round((ytd.charges / ytd.ca) * 100) : 0;
    const annualProjection = ytd.months > 0 ? Math.round((ytd.ca / ytd.months) * 12) : 0;
    return { avgMonthlyCA, avgMonthlyCharges, breakeven, marginPct, chargesRatio, annualProjection };
  }, [ytd]);

  return (
    <>
      {/* Header KPIs */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { l: `CA YTD ${year}`, v: `${fK(ytd.ca)}€`, c: T.green, icon: '💰' },
          { l: 'Charges YTD', v: `${fK(ytd.charges)}€`, c: T.red, icon: '📉' },
          { l: 'Résultat net', v: `${fK(ytd.result)}€`, c: ytd.result >= 0 ? T.orange : T.red, icon: '📊' },
          { l: 'Marge nette', v: `${ratios.marginPct}%`, c: marginColor(ratios.marginPct), icon: '📈' },
          { l: 'Projection annuelle', v: `${fK(ratios.annualProjection)}€`, c: T.blue, icon: '🔮' },
        ].map((s) => (
          <div key={s.l} style={{ textAlign: 'center', padding: 14, borderRadius: 10, background: s.c + '10', border: `1px solid ${s.c}22` }}>
            <div style={{ fontSize: 14, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: s.c, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Key ratios card */}
      <Section title="RATIOS CLÉS" sub="Indicateurs de performance financière">
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {[
              { label: 'CA moyen / mois', value: `${fmt(ratios.avgMonthlyCA)} €`, color: T.green, tip: 'Chiffre d\'affaires moyen mensuel' },
              { label: 'Charges moyennes / mois', value: `${fmt(ratios.avgMonthlyCharges)} €`, color: T.red, tip: 'Charges moyennes mensuelles' },
              { label: 'Point mort mensuel', value: `${fmt(ratios.breakeven)} €`, color: T.orange, tip: 'CA minimum pour couvrir les charges' },
              { label: 'Ratio charges/CA', value: `${ratios.chargesRatio}%`, color: ratios.chargesRatio > 80 ? T.red : ratios.chargesRatio > 60 ? T.orange : T.green, tip: 'Part des charges dans le CA' },
            ].map((r) => (
              <div key={r.label} style={{ padding: '12px 16px', borderRadius: 10, background: r.color + '08', border: `1px solid ${r.color}22` }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>
                  {r.label} <HelpTip text={r.tip} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: r.color }}>{r.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* Monthly P&L Table */}
      <Section title={`COMPTE DE RÉSULTAT ${year}`} sub="Détail mensuel">
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Mois', 'CA', 'Charges', 'Résultat', 'Marge'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Mois' ? 'left' : 'right', fontWeight: 600, color: T.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: .5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((m) => (
                  <tr key={m.key} style={{ borderBottom: `1px solid ${T.border}22`, opacity: m.hasData ? 1 : 0.3 }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>{m.label}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: T.green, fontWeight: 600 }}>{m.hasData ? `${fmt(m.ca)} €` : '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: T.red, fontWeight: 600 }}>{m.hasData ? `${fmt(m.charges)} €` : '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: m.result >= 0 ? T.orange : T.red, fontWeight: 700 }}>{m.hasData ? `${fmt(m.result)} €` : '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: marginColor(m.margin) }}>{m.hasData ? `${m.margin}%` : '—'}</td>
                  </tr>
                ))}
                {/* YTD Total Row */}
                <tr style={{ borderTop: `2px solid ${T.border}`, background: T.surface2 }}>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: T.text }}>TOTAL {year}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: T.green, fontWeight: 800 }}>{fmt(ytd.ca)} €</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: T.red, fontWeight: 800 }}>{fmt(ytd.charges)} €</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: ytd.result >= 0 ? T.orange : T.red, fontWeight: 800 }}>{fmt(ytd.result)} €</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: marginColor(ytd.ca ? Math.round((ytd.result / ytd.ca) * 100) : 0) }}>
                    {ytd.ca ? Math.round((ytd.result / ytd.ca) * 100) : 0}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* Charges breakdown by category for the year */}
      {yearCategories.length > 0 && (
        <Section title="DÉTAIL DES CHARGES" sub={`Ventilation annuelle ${year}`}>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {yearCategories.map((cat) => {
                const total = yearCategories.reduce((s, c) => s + c.value, 0);
                const pctVal = total > 0 ? Math.round((cat.value / total) * 100) : 0;
                return (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{cat.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.text, minWidth: 120 }}>{cat.label}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.border, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pctVal}%`, background: cat.color, borderRadius: 3, transition: 'width .5s ease' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, minWidth: 70, textAlign: 'right' }}>{fmt(cat.value)} €</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, minWidth: 30 }}>{pctVal}%</span>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${T.border}`, paddingTop: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: T.text }}>Total charges {year}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: T.red }}>{fmt(yearCategories.reduce((s, c) => s + c.value, 0))} €</span>
              </div>
            </div>
          </Card>
        </Section>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Functional Sales Tab                                               */
/* ------------------------------------------------------------------ */
function SalesTab() {
  const contacts = useMemo(() => load('contacts') || [], []);

  const stats = useMemo(() => {
    const total = contacts.length;
    const prospects = contacts.filter((c) => c.status === 'prospect').length;
    const leads = contacts.filter((c) => c.status === 'lead').length;
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
    const pipelineValue = leads * avgCAPerClient;

    return { total, prospects, leads, clients, partenaires, lost, conversionRate, pipelineValue, avgCAPerClient };
  }, [contacts]);

  // Funnel stages
  const funnel = useMemo(() => {
    const steps = [
      { label: 'Prospects', count: stats.prospects, color: T.orange },
      { label: 'Leads', count: stats.leads, color: T.blue },
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
          { l: 'Leads', v: stats.leads, c: T.blue, icon: '📧' },
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
              {stats.leads} leads x {fK(stats.avgCAPerClient)}€ moy.
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

/* ------------------------------------------------------------------ */
/*  Enhanced Publicite Tab                                             */
/* ------------------------------------------------------------------ */
function PubliciteTab() {
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

/* ------------------------------------------------------------------ */
/*  Main Data Component                                                */
/* ------------------------------------------------------------------ */
export default function Data() {
  const [subTab, setSubTab] = useState('Finances');
  const [history, setHistory] = useState(() => load('finHistory') || generateDefaultHistory());
  const [formMonth, setFormMonth] = useState(curMonth());
  const [formCA, setFormCA] = useState('');
  const [formFixed, setFormFixed] = useState('');
  const [formVar, setFormVar] = useState('');
  const [formTreso, setFormTreso] = useState('');
  const [formCategories, setFormCategories] = useState({});
  const [showCategories, setShowCategories] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sortCol, setSortCol] = useState('key');
  const [sortDir, setSortDir] = useState('asc');
  const [histPage, setHistPage] = useState(1);

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

  // Forecast data (3-month projection)
  const forecast = useMemo(() => forecastCA(history, 3), [history]);

  // Expense category breakdown (aggregate last 3 months or all available)
  const expenseBreakdown = useMemo(() => {
    const recent = history.slice(-3);
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
        value: Math.round(value / Math.min(recent.length, 3)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [history]);

  const saveEntry = useCallback(() => {
    const ca = Math.round(pf(formCA) * 100) / 100;
    const fixed = Math.round(pf(formFixed) * 100) / 100;
    const variable = Math.round(pf(formVar) * 100) / 100;
    if (!ca && !fixed && !variable) return;
    const existing = history.findIndex((r) => r.key === formMonth);
    const charges = Math.round((fixed + variable) * 100) / 100;
    const result = Math.round((ca - fixed - variable) * 100) / 100;
    // Build categories object (only store non-zero values)
    const cats = {};
    Object.entries(formCategories).forEach(([k, v]) => {
      const val = Math.round(pf(v) * 100) / 100;
      if (val > 0) cats[k] = val;
    });
    const row = { key: formMonth, ca, charges, result, treso: Math.round(pf(formTreso) * 100) / 100 };
    if (Object.keys(cats).length > 0) row.categories = cats;
    if (existing >= 0) {
      const updated = [...history]; updated[existing] = row; setHistory(updated);
    } else {
      setHistory([...history, row].sort((a, b) => a.key.localeCompare(b.key)).slice(-12));
    }
    setFormCA(''); setFormFixed(''); setFormVar(''); setFormTreso(''); setFormCategories({}); setShowCategories(false);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }, [formCA, formFixed, formVar, formTreso, formMonth, history, formCategories]);

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
      .forecast-row{font-style:italic;color:#888}
      .footer{margin-top:32px;font-size:10px;color:#aaa;text-align:center}
      @media print{body{padding:20px}}
    </style></head><body>
    <h1>Rapport Financier</h1>
    <div class="sub">Généré le ${new Date().toLocaleDateString('fr-FR')} — HubScale</div>
    <div class="kpis">
      <div class="kpi"><div class="kpi-label">CA Dernier mois</div><div class="kpi-value g">${fmt(lastRow.ca || 0)}€</div></div>
      <div class="kpi"><div class="kpi-label">Charges</div><div class="kpi-value r">${fmt(lastRow.charges || 0)}€</div></div>
      <div class="kpi"><div class="kpi-label">Résultat</div><div class="kpi-value o">${fmt(lastRow.result || 0)}€</div></div>
      ${caGoal > 0 ? `<div class="kpi"><div class="kpi-label">Objectif CA</div><div class="kpi-value">${fmt(caGoal)}€</div></div>` : ''}
    </div>
    <h2>Historique</h2>
    <table>
      <thead><tr><th>Mois</th><th>CA</th><th>Charges</th><th>Marge</th><th>Résultat</th></tr></thead>
      <tbody>
        ${rows.map(r => {
          const margin = r.ca ? Math.round((r.result / r.ca) * 100) : 0;
          return `<tr><td>${monthLabel(r.key)}</td><td class="g">${fmt(r.ca)}€</td><td class="r">${fmt(r.charges)}€</td><td>${margin}%</td><td class="${r.result >= 0 ? 'o' : 'r'}">${fmt(r.result)}€</td></tr>`;
        }).join('')}
        <tr class="ytd-row"><td>TOTAL YTD ${new Date().getFullYear()}</td><td class="g">${fmt(ytd.ca)}€</td><td class="r">${fmt(ytd.charges)}€</td><td>${ytd.ca ? Math.round((ytd.result / ytd.ca) * 100) : 0}%</td><td class="${ytd.result >= 0 ? 'o' : 'r'}">${fmt(ytd.result)}€</td></tr>
        ${forecast.length > 0 ? forecast.map(f => `<tr class="forecast-row"><td>${monthLabel(f.key)} (prev.)</td><td>${fmt(f.ca)}€</td><td>—</td><td>—</td><td>—</td></tr>`).join('') : ''}
      </tbody>
    </table>
    <div class="footer">Rapport confidentiel — HubScale ${new Date().getFullYear()}</div>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  }, [history, lastRow, ytd, caGoal, forecast]);

  // FEC Export (Fichier des Ecritures Comptables)
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
            <Btn v="secondary" small onClick={isPaid() ? exportPDF : undefined} disabled={!isPaid()} aria-label="Exporter en PDF">{isPaid() ? 'Export PDF' : '🔒 Export PDF'}</Btn>
            <Btn v="secondary" small onClick={isPaid() ? exportFEC : undefined} disabled={!isPaid()} aria-label="Exporter FEC">{isPaid() ? 'Export FEC' : '🔒 Export FEC'}</Btn>
          </div>
        )}
      </div>

      <div className="fade-up d1" style={{ marginBottom: 20, width: 'fit-content' }}>
        <TabBar items={SUB_TABS} active={subTab} onChange={setSubTab} />
      </div>

      {/* ===================== FINANCES TAB ===================== */}
      {subTab === 'Finances' && (
        <>
          {/* KPIs */}
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            <KPI label="CA MENSUEL" value={`${fK(lastRow.ca || 0)}€`} sub="Ce mois-ci" accent={T.green} icon={'💰'} delay={1} sparkData={sparkCA} helpTip="Chiffre d'affaires total du mois" />
            <KPI label="CHARGES" value={`${fK(lastRow.charges || 0)}€`} sub="Fixes + Variables" accent={T.red} icon={'📉'} delay={2} sparkData={sparkCharges} helpTip="Total charges fixes + variables" />
            <KPI label="RÉSULTAT" value={`${fK(lastRow.result || 0)}€`} sub={lastRow.ca ? `Marge: ${Math.round(((lastRow.result || 0) / lastRow.ca) * 100)}%` : '—'} accent={T.orange} icon={'📊'} delay={3} sparkData={sparkResult} helpTip="CA moins charges = résultat net" />
            <KPI label="TRÉSORERIE" value={`${fK(lastRow.treso || pf(formTreso) || 0)}€`} sub="Solde disponible" accent={T.blue} icon={'🏦'} delay={4} helpTip="Solde bancaire disponible" />
          </div>

          {/* Threshold Alerts */}
          <ThresholdAlerts history={history} histByKey={histByKey} />

          {/* CA Goal */}
          {caGoal > 0 && (
            <div className="fade-up d2" style={{ marginBottom: 16 }}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5, whiteSpace: 'nowrap' }}>
                    Objectif CA
                    <HelpTip text="Progression vers votre objectif mensuel" />
                  </div>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <ProgressBar value={lastRow.ca || 0} max={caGoal} color={(lastRow.ca || 0) >= caGoal ? T.green : T.orange} h={8} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: (lastRow.ca || 0) >= caGoal ? T.green : T.orange, whiteSpace: 'nowrap' }}>
                    {fK(lastRow.ca || 0)}€ / {fK(caGoal)}€ ({Math.min(Math.round(((lastRow.ca || 0) / caGoal) * 100), 999)}%)
                  </div>
                  <Btn v="ghost" small onClick={() => { setCaGoal(0); store('caGoal', 0); }}>{'✕'}</Btn>
                </div>
              </Card>
            </div>
          )}

          {/* Budget vs Actual */}
          <BudgetVsActual lastRow={lastRow} />

          {/* Chart with forecast */}
          <div className="fade-up d3" style={{ marginBottom: 16 }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5 }}>
                  ÉVOLUTION CA / CHARGES
                </div>
                {forecast.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 9, color: T.textMuted }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: '#16a34a', display: 'inline-block' }} />
                      Réel
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: '#16a34a', opacity: 0.35, display: 'inline-block', border: '1px dashed #16a34a' }} />
                      Prévision
                    </span>
                  </div>
                )}
              </div>
              <div style={{ height: 220 }}>
                <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spinner size={20} /></div>}>
                  <LazyFinChart forecastData={forecast} />
                </Suspense>
              </div>
            </Card>
          </div>

          {/* CA Forecast Card */}
          <ForecastCard forecastData={forecast} history={history} />

          {/* Data Entry Form */}
          <Section title="SAISIE" sub="Renseignez vos données du mois">
            <Card>
              <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <Inp label="Mois" type="month" value={formMonth} onChange={setFormMonth} />
                <Inp label="Chiffre d'affaires (€)" value={formCA} onChange={setFormCA} type="number" placeholder="0" suffix="€" />
                <Inp label="Charges fixes (€)" value={formFixed} onChange={setFormFixed} type="number" placeholder="0" suffix="€" />
                <Inp label="Charges variables (€)" value={formVar} onChange={setFormVar} type="number" placeholder="0" suffix="€" />
                <Inp label="Trésorerie (€)" value={formTreso} onChange={setFormTreso} type="number" placeholder="0" suffix="€" />
              </div>

              {/* Category breakdown toggle */}
              <div style={{ marginTop: 14, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showCategories ? 12 : 0 }}>
                  <Btn v="ghost" small onClick={() => setShowCategories(!showCategories)}>
                    {showCategories ? '▾' : '▸'} Détailler les charges par catégorie
                  </Btn>
                  {showCategories && Object.values(formCategories).some((v) => pf(v) > 0) && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted }}>
                      Total catégories : {fmt(Object.values(formCategories).reduce((s, v) => s + pf(v), 0))} €
                    </span>
                  )}
                </div>
                {showCategories && (
                  <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{cat.icon}</span>
                        <Inp
                          label={cat.label}
                          value={formCategories[cat.id] || ''}
                          onChange={(v) => setFormCategories((prev) => ({ ...prev, [cat.id]: v }))}
                          type="number"
                          placeholder="0"
                          suffix="€"
                          small
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                {!caGoal && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Inp label="" value={goalInput} onChange={setGoalInput} type="number" placeholder="Objectif CA mensuel" small suffix="€" />
                    <Btn v="ghost" small onClick={saveCaGoal} disabled={!goalInput}>Définir</Btn>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                  {saved && <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>{'✓'} Enregistré</span>}
                  <Btn onClick={saveEntry} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>Enregistrer</Btn>
                </div>
              </div>
            </Card>
          </Section>

          {/* Expense Breakdown */}
          {expenseBreakdown.length > 0 && (
            <Section title="RÉPARTITION DES CHARGES" sub="Moyenne mensuelle par catégorie (3 derniers mois)">
              <Card>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, alignItems: 'center' }}>
                  <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}><Spinner size={20} /></div>}>
                    <LazyExpenseDonut data={expenseBreakdown} />
                  </Suspense>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {expenseBreakdown.map((cat) => {
                      const total = expenseBreakdown.reduce((s, c) => s + c.value, 0);
                      const pctVal = total > 0 ? Math.round((cat.value / total) * 100) : 0;
                      return (
                        <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{cat.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{cat.label}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: cat.color }}>{fmt(cat.value)} €</span>
                            </div>
                            <div style={{ height: 4, borderRadius: 2, background: T.border, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pctVal}%`, background: cat.color, borderRadius: 2, transition: 'width .5s ease' }} />
                            </div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, minWidth: 30, textAlign: 'right' }}>{pctVal}%</span>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${T.border}`, paddingTop: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: T.text }}>Total</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: T.red }}>
                        {fmt(expenseBreakdown.reduce((s, c) => s + c.value, 0))} € /mois
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Section>
          )}

          {/* History Table */}
          <Section title="HISTORIQUE" sub={`${history.length} derniers mois`}>
            {history.length === 0 ? (
              <Card>
                <EmptyState icon={'📊'} title="Aucun historique" sub="Saisissez vos premières données ci-dessus" />
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
                              {n1 != null ? <EvoBadge value={n1} invert={false} /> : <span style={{ fontSize: 10, color: T.textMuted }}>{'—'}</span>}
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
                        <td style={{ ...tdStyle, fontSize: 10, color: T.textMuted }}>{'—'}</td>
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

      {/* ===================== SALES TAB ===================== */}
      {subTab === 'Sales' && <SalesTab />}

      {/* ===================== CATALOGUE TAB ===================== */}
      {subTab === 'Catalogue' && <CatalogTab />}

      {/* ===================== FACTURES TAB ===================== */}
      {subTab === 'Factures' && <InvoicesTab />}

      {/* ===================== P&L TAB ===================== */}
      {subTab === 'P&L' && <PLTab />}

      {/* ===================== PUBLICITE TAB ===================== */}
      {subTab === 'Publicité' && <PubliciteTab />}
    </div>
  );
}
