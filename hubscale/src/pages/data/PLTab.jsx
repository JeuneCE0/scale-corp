import React, { useMemo } from 'react';
import { T } from '../../lib/theme.js';
import { fmt, fK, monthLabel } from '../../lib/utils.js';
import { load } from '../../lib/store.js';
import { Card, Section, HelpTip } from '../../components/ui.jsx';
import { EXPENSE_CATEGORIES } from '../../lib/constants.js';

export default function PLTab() {
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
