import React, { useState, useMemo, lazy, Suspense } from 'react';
import { T } from '../lib/theme.js';
import { fmt, fK, pct, curMonth, prevMonth, monthLabel, MONTHS_FR, daysSince, leadScore, businessHealth, forecastCA } from '../lib/utils.js';
import { load } from '../lib/store.js';
import { Card, Btn, Sel, KPI, Badge, Spinner, Section, ProgressBar } from '../components/ui.jsx';
import { CRM_STATUSES, EXPENSE_CATEGORIES, PIPELINE_STAGES } from '../lib/constants.js';

// ---------------------------------------------------------------------------
// Lazy chart
// ---------------------------------------------------------------------------
const LazyReportChart = lazy(() =>
  import('recharts').then((mod) => ({
    default: function ReportChart({ data, type }) {
      const { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } = mod;
      const COLORS = [T.accent, T.green, T.orange, T.blue, T.red, T.purple, '#eab308', '#06b6d4'];

      if (type === 'pie') {
        return (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, color: T.text }}
                itemStyle={{ color: T.text }} />
            </PieChart>
          </ResponsiveContainer>
        );
      }

      if (type === 'line') {
        return (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textMuted }} />
              <YAxis tickFormatter={fK} tick={{ fontSize: 10, fill: T.textMuted }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, color: T.text }}
                labelStyle={{ fontWeight: 700, color: T.text }} itemStyle={{ color: T.text }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {Object.keys(data[0] || {}).filter(k => k !== 'name').map((key, i) => (
                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      }

      // Default: bar chart
      return (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textMuted }} />
            <YAxis tickFormatter={fK} tick={{ fontSize: 10, fill: T.textMuted }} />
            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, color: T.text }}
              formatter={(v) => [fmt(v) + '€']} labelStyle={{ fontWeight: 700, color: T.text }} itemStyle={{ color: T.text }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {Object.keys(data[0] || {}).filter(k => k !== 'name').map((key, i) => (
              <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    },
  }))
);

// ---------------------------------------------------------------------------
// Report periods
// ---------------------------------------------------------------------------
const PERIODS = [
  { value: '3', label: '3 derniers mois' },
  { value: '6', label: '6 derniers mois' },
  { value: '12', label: '12 derniers mois' },
  { value: 'ytd', label: 'Année en cours' },
];

const REPORT_TYPES = [
  { id: 'financial', label: 'Rapport financier', icon: '💰' },
  { id: 'crm', label: 'Rapport CRM', icon: '👥' },
  { id: 'performance', label: 'Performance globale', icon: '📊' },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Reports() {
  const [reportType, setReportType] = useState('financial');
  const [period, setPeriod] = useState('6');

  // Load data
  const finHistory = load('finHistory') || [];
  const contacts = load('contacts') || [];
  const tasks = load('tasks') || [];
  const documents = load('documents') || [];

  // Period filter
  const monthsToShow = period === 'ytd' ? new Date().getMonth() + 1 : parseInt(period);
  const filteredHistory = finHistory.slice(-monthsToShow);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <Card>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {REPORT_TYPES.map(rt => (
              <Btn key={rt.id} small v={reportType === rt.id ? 'primary' : 'ghost'} onClick={() => setReportType(rt.id)}>
                {rt.icon} {rt.label}
              </Btn>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <Sel small value={period} onChange={setPeriod} options={PERIODS} />
          <Btn small v="secondary" onClick={() => exportReport(reportType, period, finHistory, contacts, tasks, documents)}>
            📥 Exporter PDF
          </Btn>
        </div>
      </Card>

      {reportType === 'financial' && <FinancialReport data={filteredHistory} allData={finHistory} contacts={contacts} documents={documents} />}
      {reportType === 'crm' && <CRMReport contacts={contacts} tasks={tasks} period={monthsToShow} />}
      {reportType === 'performance' && <PerformanceReport data={filteredHistory} contacts={contacts} tasks={tasks} documents={documents} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Financial Report
// ---------------------------------------------------------------------------

function FinancialReport({ data, allData, contacts, documents }) {
  const stats = useMemo(() => {
    const totalCA = data.reduce((s, r) => s + (r.ca || 0), 0);
    const totalCharges = data.reduce((s, r) => s + (r.charges || 0), 0);
    const margin = totalCA > 0 ? ((totalCA - totalCharges) / totalCA * 100).toFixed(1) : 0;
    const avgCA = data.length > 0 ? totalCA / data.length : 0;
    const bestMonth = data.reduce((best, r) => (r.ca || 0) > (best?.ca || 0) ? r : best, data[0]);
    const worstMonth = data.reduce((worst, r) => (r.ca || 0) < (worst?.ca || Infinity) ? r : worst, data[0]);
    const growth = data.length >= 2 ? (((data[data.length - 1]?.ca || 0) - (data[0]?.ca || 0)) / (data[0]?.ca || 1) * 100).toFixed(1) : 0;
    const paidInvoices = documents.filter(d => d.status === 'paid').length;
    const pendingInvoices = documents.filter(d => d.status === 'sent').length;
    const forecast = forecastCA(allData);
    return { totalCA, totalCharges, margin, avgCA, bestMonth, worstMonth, growth, paidInvoices, pendingInvoices, forecast };
  }, [data, allData, documents]);

  const chartData = useMemo(() =>
    data.map(r => ({ name: monthLabel(r.key), CA: r.ca || 0, Charges: r.charges || 0, Marge: (r.ca || 0) - (r.charges || 0) })),
    [data]
  );

  const expenseBreakdown = useMemo(() => {
    const totals = {};
    data.forEach(r => {
      (r.expenses || []).forEach(e => {
        totals[e.category] = (totals[e.category] || 0) + (e.amount || 0);
      });
    });
    return EXPENSE_CATEGORIES.filter(c => totals[c.id]).map(c => ({ name: c.label, value: totals[c.id] || 0 }));
  }, [data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KPI label="CA total" value={fmt(stats.totalCA) + '€'} icon="💰" accent={T.green} />
        <KPI label="Charges totales" value={fmt(stats.totalCharges) + '€'} icon="📉" accent={T.red} />
        <KPI label="Marge nette" value={stats.margin + '%'} icon="📊" accent={parseFloat(stats.margin) >= 20 ? T.green : T.orange} />
        <KPI label="CA moyen/mois" value={fmt(stats.avgCA) + '€'} icon="📈" accent={T.blue} />
        <KPI label="Croissance" value={(stats.growth >= 0 ? '+' : '') + stats.growth + '%'} icon={stats.growth >= 0 ? '📈' : '📉'} accent={stats.growth >= 0 ? T.green : T.red} />
      </div>

      {/* Revenue Chart */}
      <Card>
        <Section title="Évolution CA / Charges / Marge" icon="📊">
          <Suspense fallback={<Spinner />}>
            <LazyReportChart data={chartData} type="bar" />
          </Suspense>
        </Section>
      </Card>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {/* Best/Worst months */}
        <Card style={{ flex: '1 1 300px' }}>
          <Section title="Points clés" icon="🎯">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.textSecondary }}>Meilleur mois</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.green }}>
                  {stats.bestMonth ? `${monthLabel(stats.bestMonth.key)} — ${fmt(stats.bestMonth.ca)}€` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.textSecondary }}>Mois le plus faible</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.red }}>
                  {stats.worstMonth ? `${monthLabel(stats.worstMonth.key)} — ${fmt(stats.worstMonth.ca)}€` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.textSecondary }}>Factures payées</span>
                <Badge label={String(stats.paidInvoices)} color={T.green} bg={T.greenBg} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.textSecondary }}>Factures en attente</span>
                <Badge label={String(stats.pendingInvoices)} color={T.orange} bg={T.orangeBg} />
              </div>
              {stats.forecast.length > 0 && (
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: .5 }}>Prévisions</span>
                  {stats.forecast.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: 12, color: T.textMuted }}>{monthLabel(f.key)}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.accent }}>{fmt(f.ca)}€</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        </Card>

        {/* Expense breakdown */}
        {expenseBreakdown.length > 0 && (
          <Card style={{ flex: '1 1 300px' }}>
            <Section title="Répartition des charges" icon="🥧">
              <Suspense fallback={<Spinner />}>
                <LazyReportChart data={expenseBreakdown} type="pie" />
              </Suspense>
            </Section>
          </Card>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CRM Report
// ---------------------------------------------------------------------------

function CRMReport({ contacts, tasks, period }) {
  const stats = useMemo(() => {
    const total = contacts.length;
    const byStatus = {};
    CRM_STATUSES.forEach(s => { byStatus[s.id] = contacts.filter(c => c.status === s.id).length; });

    const recentContacts = contacts.filter(c => c.createdAt && daysSince(c.createdAt) <= period * 30);
    const conversionRate = total > 0 ? ((byStatus.client || 0) / total * 100).toFixed(1) : 0;
    const avgScore = contacts.length > 0 ? Math.round(contacts.reduce((s, c) => s + leadScore(c), 0) / contacts.length) : 0;

    const pipelineValue = contacts.reduce((s, c) => {
      const stage = PIPELINE_STAGES.find(p => p.id === c.status);
      return s + (parseFloat(c.dealValue || 0) * (stage?.proba || 0) / 100);
    }, 0);

    const topContacts = [...contacts]
      .filter(c => c.status !== 'perdu')
      .sort((a, b) => leadScore(b) - leadScore(a))
      .slice(0, 5);

    return { total, byStatus, recentContacts: recentContacts.length, conversionRate, avgScore, pipelineValue, topContacts };
  }, [contacts, period]);

  const pipelineData = useMemo(() =>
    CRM_STATUSES.map(s => ({ name: s.label, value: stats.byStatus[s.id] || 0 })),
    [stats]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KPI label="Contacts" value={stats.total} icon="👥" accent={T.accent} />
        <KPI label="Nouveaux" value={stats.recentContacts} icon="✨" accent={T.green} sub={`Sur ${period} mois`} />
        <KPI label="Taux conversion" value={stats.conversionRate + '%'} icon="🎯" accent={T.green} />
        <KPI label="Score moyen" value={stats.avgScore + '/100'} icon="⭐" accent={T.orange} />
        <KPI label="Pipeline pondéré" value={fmt(stats.pipelineValue) + '€'} icon="💎" accent={T.purple} />
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {/* Pipeline distribution */}
        <Card style={{ flex: '1 1 350px' }}>
          <Section title="Répartition du pipeline" icon="📊">
            <Suspense fallback={<Spinner />}>
              <LazyReportChart data={pipelineData} type="pie" />
            </Suspense>
          </Section>
        </Card>

        {/* Top contacts */}
        <Card style={{ flex: '1 1 350px' }}>
          <Section title="Top 5 contacts (score)" icon="🏆">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.topContacts.map((c, i) => {
                const score = leadScore(c);
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: i < 3 ? T.accent : T.textMuted, width: 20 }}>#{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.name || 'Sans nom'}</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>{c.company || c.email || '—'}</div>
                    </div>
                    <Badge label={CRM_STATUSES.find(s => s.id === c.status)?.label || c.status} color={CRM_STATUSES.find(s => s.id === c.status)?.color || T.textMuted} bg={CRM_STATUSES.find(s => s.id === c.status)?.bg || T.surface2} />
                    <div style={{ fontSize: 14, fontWeight: 800, color: score >= 60 ? T.green : score >= 40 ? T.orange : T.textMuted }}>
                      {score}
                    </div>
                  </div>
                );
              })}
              {stats.topContacts.length === 0 && (
                <div style={{ fontSize: 12, color: T.textMuted, textAlign: 'center', padding: 20 }}>Aucun contact</div>
              )}
            </div>
          </Section>
        </Card>
      </div>

      {/* Pipeline funnel */}
      <Card>
        <Section title="Funnel de conversion" icon="🔻">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PIPELINE_STAGES.filter(s => s.id !== 'perdu').map(stage => {
              const count = stats.byStatus[stage.id] || 0;
              const maxCount = Math.max(...Object.values(stats.byStatus), 1);
              return (
                <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 100, fontSize: 11, fontWeight: 600, color: T.textSecondary }}>{stage.label}</div>
                  <div style={{ flex: 1, height: 24, borderRadius: 6, background: T.surface2, overflow: 'hidden' }}>
                    <div style={{ width: `${(count / maxCount) * 100}%`, height: '100%', background: stage.color, borderRadius: 6, transition: 'width .5s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, minWidth: count > 0 ? 30 : 0 }}>
                      {count > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{count}</span>}
                    </div>
                  </div>
                  <div style={{ width: 40, fontSize: 12, fontWeight: 700, color: stage.color, textAlign: 'right' }}>{stage.proba}%</div>
                </div>
              );
            })}
          </div>
        </Section>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Performance Report
// ---------------------------------------------------------------------------

function PerformanceReport({ data, contacts, tasks, documents }) {
  const health = useMemo(() => businessHealth(data), [data]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const overdue = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()).length;
    return { total, done, overdue, completion: total > 0 ? Math.round(done / total * 100) : 0 };
  }, [tasks]);

  const docStats = useMemo(() => {
    const total = documents.length;
    const paid = documents.filter(d => d.status === 'paid').length;
    const overdue = documents.filter(d => d.status === 'sent' && d.dueDate && new Date(d.dueDate) < new Date()).length;
    return { total, paid, overdue };
  }, [documents]);

  const trendData = useMemo(() =>
    data.map(r => ({ name: monthLabel(r.key), CA: r.ca || 0, Marge: ((r.ca || 0) - (r.charges || 0)) })),
    [data]
  );

  const healthLabel = health >= 80 ? 'Excellent' : health >= 60 ? 'Bon' : health >= 40 ? 'Moyen' : 'À surveiller';
  const healthColor = health >= 80 ? T.green : health >= 60 ? T.blue : health >= 40 ? T.orange : T.red;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Health Score */}
      <div className="glass-static" style={{ padding: '24px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: healthColor }}>{health}/100</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: healthColor, marginBottom: 4 }}>{healthLabel}</div>
        <div style={{ fontSize: 12, color: T.textSecondary }}>Score de santé global de l'entreprise</div>
      </div>

      {/* Overview KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KPI label="Contacts actifs" value={contacts.filter(c => c.status !== 'perdu').length} icon="👥" accent={T.blue} />
        <KPI label="Tâches terminées" value={`${taskStats.done}/${taskStats.total}`} icon="✅" accent={T.green} sub={`${taskStats.completion}%`} />
        <KPI label="Documents" value={docStats.total} icon="📄" accent={T.accent} />
        <KPI label="Factures payées" value={docStats.paid} icon="💰" accent={T.green} />
        <KPI label="Tâches en retard" value={taskStats.overdue} icon="⚠️" accent={taskStats.overdue > 0 ? T.red : T.green} />
      </div>

      {/* Trend */}
      <Card>
        <Section title="Tendance CA & Marge" icon="📈">
          <Suspense fallback={<Spinner />}>
            <LazyReportChart data={trendData} type="line" />
          </Suspense>
        </Section>
      </Card>

      {/* Scorecard */}
      <Card>
        <Section title="Tableau de bord" icon="📋">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { label: 'CA moyen mensuel', value: data.length > 0 ? fmt(data.reduce((s, r) => s + (r.ca || 0), 0) / data.length) + '€' : '—', icon: '💰' },
              { label: 'Taux de conversion', value: contacts.length > 0 ? (contacts.filter(c => c.status === 'client').length / contacts.length * 100).toFixed(1) + '%' : '—', icon: '🎯' },
              { label: 'Complétion tâches', value: taskStats.completion + '%', icon: '☑️' },
              { label: 'Factures en retard', value: String(docStats.overdue), icon: '⚠️' },
              { label: 'Pipeline pondéré', value: fmt(contacts.reduce((s, c) => s + parseFloat(c.dealValue || 0) * (PIPELINE_STAGES.find(p => p.id === c.status)?.proba || 0) / 100, 0)) + '€', icon: '💎' },
              { label: 'Score lead moyen', value: contacts.length > 0 ? Math.round(contacts.reduce((s, c) => s + leadScore(c), 0) / contacts.length) + '/100' : '—', icon: '⭐' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '14px 16px', background: T.surface2, borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>
                  {item.icon} {item.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Section>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export helper
// ---------------------------------------------------------------------------

function exportReport(type, period, finHistory, contacts, tasks, documents) {
  const monthsToShow = period === 'ytd' ? new Date().getMonth() + 1 : parseInt(period);
  const data = finHistory.slice(-monthsToShow);
  const totalCA = data.reduce((s, r) => s + (r.ca || 0), 0);
  const totalCharges = data.reduce((s, r) => s + (r.charges || 0), 0);
  const margin = totalCA > 0 ? ((totalCA - totalCharges) / totalCA * 100).toFixed(1) : 0;
  const org = load('organization') || {};
  const reportTitle = REPORT_TYPES.find(r => r.id === type)?.label || 'Rapport';

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${reportTitle} — ${org.name || 'HubScale'}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;color:#1a1a2e;padding:40px;max-width:900px;margin:0 auto}
.header{display:flex;justify-content:space-between;border-bottom:3px solid #6366f1;padding-bottom:16px;margin-bottom:30px}
.brand{font-size:24px;font-weight:800;color:#6366f1}h2{font-size:18px;color:#6366f1;margin-bottom:12px;margin-top:24px}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
.kpi{background:#f8f9fa;border-radius:10px;padding:16px;text-align:center}
.kpi-label{font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
.kpi-value{font-size:22px;font-weight:800;color:#1a1a2e}
table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#1a1a2e;color:#fff;padding:8px 12px;font-size:11px;text-align:left}
td{padding:8px 12px;border-bottom:1px solid #eee;font-size:12px}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;text-align:center;font-size:10px;color:#999}
.no-print{text-align:center;margin-bottom:20px}
@media print{.no-print{display:none}}
</style></head><body>
<div class="no-print"><button onclick="window.print()" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">Imprimer / PDF</button></div>
<div class="header"><div><div class="brand">${org.name || 'HubScale'}</div><div style="font-size:11px;color:#666;margin-top:4px">${reportTitle}</div></div>
<div style="text-align:right;font-size:12px;color:#666">Généré le ${new Date().toLocaleDateString('fr-FR')}<br>Période : ${monthsToShow} mois</div></div>
<div class="kpis">
<div class="kpi"><div class="kpi-label">CA Total</div><div class="kpi-value">${new Intl.NumberFormat('fr-FR').format(Math.round(totalCA))}€</div></div>
<div class="kpi"><div class="kpi-label">Charges</div><div class="kpi-value">${new Intl.NumberFormat('fr-FR').format(Math.round(totalCharges))}€</div></div>
<div class="kpi"><div class="kpi-label">Marge nette</div><div class="kpi-value">${margin}%</div></div>
</div>
${type !== 'crm' ? `<h2>Données mensuelles</h2>
<table><thead><tr><th>Mois</th><th>CA</th><th>Charges</th><th>Marge</th></tr></thead><tbody>
${data.map(r => `<tr><td>${monthLabel(r.key)}</td><td>${new Intl.NumberFormat('fr-FR').format(Math.round(r.ca || 0))}€</td><td>${new Intl.NumberFormat('fr-FR').format(Math.round(r.charges || 0))}€</td><td>${r.ca ? (((r.ca - (r.charges || 0)) / r.ca) * 100).toFixed(1) : 0}%</td></tr>`).join('')}
</tbody></table>` : ''}
${type === 'crm' || type === 'performance' ? `<h2>Contacts (${contacts.length})</h2>
<div class="kpis">
<div class="kpi"><div class="kpi-label">Prospects</div><div class="kpi-value">${contacts.filter(c => c.status === 'prospect').length}</div></div>
<div class="kpi"><div class="kpi-label">Leads</div><div class="kpi-value">${contacts.filter(c => c.status === 'lead').length}</div></div>
<div class="kpi"><div class="kpi-label">Clients</div><div class="kpi-value">${contacts.filter(c => c.status === 'client').length}</div></div>
</div>` : ''}
<div class="footer">Rapport généré par <strong>${org.name || 'HubScale'}</strong> — ${new Date().toLocaleDateString('fr-FR')}</div>
</body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}
