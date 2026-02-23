import React, { useMemo, lazy, Suspense } from 'react';
import { T, FONT } from '../lib/theme.js';
import { load } from '../lib/store.js';
import { fmt, fK, pct, monthLabel, forecastCA, leadScore, daysSince, MONTHS_FR, curMonth, nextMonth, sameMonthLastYear } from '../lib/utils.js';
import { Card, Section, Badge, Btn, ProgressBar, ScoreRing, Sparkline, KPI, Spinner, HelpTip } from '../components/ui.jsx';
import { INTEGRATIONS, CRM_STATUSES, LEAD_SCORE_LABELS } from '../lib/constants.js';

/* ------------------------------------------------------------------ */
/*  Lazy-loaded Recharts — Revenue Trends                              */
/* ------------------------------------------------------------------ */
const LazyRevenueTrendsChart = lazy(() =>
  import('recharts').then((mod) => ({
    default: function RevenueTrendsChart({ data, avgData, yoyData, forecastData }) {
      const { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ReferenceLine, CartesianGrid, ComposedChart } = mod;
      if (!data || data.length === 0) {
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 11, color: T.textMuted }}>
            Aucune donnee financiere
          </div>
        );
      }
      const merged = [...data, ...forecastData];
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={merged}>
            <defs>
              <linearGradient id="caGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.green} stopOpacity={0.3} />
                <stop offset="100%" stopColor={T.green} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="chargesGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.red} stopOpacity={0.15} />
                <stop offset="100%" stopColor={T.red} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="forecastGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.blue} stopOpacity={0.2} />
                <stop offset="100%" stopColor={T.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} opacity={0.3} />
            <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fK} />
            <Tooltip
              contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, color: T.text }}
              labelStyle={{ color: T.text, fontWeight: 700 }}
              itemStyle={{ color: T.text }}
              cursor={{ fill: 'rgba(255,255,255,.05)' }}
              formatter={(v, name) => {
                const labels = { ca: 'CA', charges: 'Charges', avg3m: 'Moy. 3 mois', forecastCA: 'Prevision', yoy: 'N-1' };
                return [`${fmt(v)} EUR`, labels[name] || name];
              }}
            />
            <Area type="monotone" dataKey="ca" stroke={T.green} strokeWidth={2} fill="url(#caGradAnalytics)" />
            <Area type="monotone" dataKey="charges" stroke={T.red} strokeWidth={1.5} fill="url(#chargesGradAnalytics)" strokeDasharray="4 3" />
            <Line type="monotone" dataKey="avg3m" stroke={T.orange} strokeWidth={2} dot={false} strokeDasharray="6 3" />
            <Area type="monotone" dataKey="forecastCA" stroke={T.blue} strokeWidth={2} fill="url(#forecastGradAnalytics)" strokeDasharray="6 3" />
            {yoyData.length > 0 && (
              <Line type="monotone" dataKey="yoy" stroke={T.purple} strokeWidth={1.5} dot={false} strokeDasharray="3 3" opacity={0.6} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      );
    },
  }))
);

/* ------------------------------------------------------------------ */
/*  Lazy-loaded Recharts — Forecast Chart                              */
/* ------------------------------------------------------------------ */
const LazyForecastChart = lazy(() =>
  import('recharts').then((mod) => ({
    default: function ForecastChart({ actualData, forecastData }) {
      const { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } = mod;
      const combined = [...actualData, ...forecastData];
      if (combined.length === 0) {
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 11, color: T.textMuted }}>
            Donnees insuffisantes pour la prevision
          </div>
        );
      }
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={combined}>
            <defs>
              <linearGradient id="actualGradForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.green} stopOpacity={0.3} />
                <stop offset="100%" stopColor={T.green} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="forecastGradPredict" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.blue} stopOpacity={0.25} />
                <stop offset="100%" stopColor={T.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fK} />
            <Tooltip
              contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, color: T.text }}
              labelStyle={{ color: T.text, fontWeight: 700 }}
              formatter={(v, name) => [`${fmt(v)} EUR`, name === 'actual' ? 'CA Reel' : 'Prevision']}
            />
            <Area type="monotone" dataKey="actual" stroke={T.green} strokeWidth={2} fill="url(#actualGradForecast)" />
            <Area type="monotone" dataKey="forecast" stroke={T.blue} strokeWidth={2} fill="url(#forecastGradPredict)" strokeDasharray="8 4" />
          </AreaChart>
        </ResponsiveContainer>
      );
    },
  }))
);

/* ================================================================== */
/*  ANALYTICS PAGE COMPONENT                                           */
/* ================================================================== */
export default function Analytics({ onNavigate }) {
  /* ---------------------------------------------------------------- */
  /*  Data from localStorage                                           */
  /* ---------------------------------------------------------------- */
  const finHistory = useMemo(() => load('finHistory') || [], []);
  const contacts = useMemo(() => load('contacts') || [], []);
  const integrations = useMemo(() => load('integrations') || {}, []);
  const syncHistory = useMemo(() => load('syncHistory') || [], []);

  /* ---------------------------------------------------------------- */
  /*  Date range label                                                 */
  /* ---------------------------------------------------------------- */
  const now = new Date();
  const dateRangeLabel = useMemo(() => {
    const monthNames = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  /* ================================================================ */
  /*  SECTION 5: Performance KPIs                                      */
  /* ================================================================ */
  const totalCA = useMemo(() => finHistory.reduce((s, r) => s + (r.ca || 0), 0), [finHistory]);
  const avgMonthlyCA = useMemo(() => finHistory.length > 0 ? Math.round(totalCA / finHistory.length) : 0, [finHistory, totalCA]);
  const totalResult = useMemo(() => finHistory.reduce((s, r) => s + (r.result || 0), 0), [finHistory]);
  const margeNette = useMemo(() => totalCA > 0 ? Math.round((totalResult / totalCA) * 100) : 0, [totalCA, totalResult]);
  const activeClients = useMemo(() => contacts.filter((c) => c.status === 'client').length, [contacts]);

  const crmConversion = useMemo(() => {
    const clients = contacts.filter((c) => c.status === 'client').length;
    const lost = contacts.filter((c) => c.status === 'perdu').length;
    const denom = clients + lost;
    return denom > 0 ? Math.round((clients / denom) * 100) : 0;
  }, [contacts]);

  const adPlatforms = useMemo(() =>
    ['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads'].filter((n) => integrations[n]),
    [integrations]
  );

  const avgROAS = useMemo(() => {
    if (adPlatforms.length === 0) return null;
    const meta = load('metaAds') || {};
    return meta.roas || null;
  }, [adPlatforms]);

  const sparkCA = useMemo(() => finHistory.slice(-6).map((r) => r.ca || 0), [finHistory]);

  /* ================================================================ */
  /*  SECTION 2: Revenue Trends                                        */
  /* ================================================================ */
  const revenueTrendsData = useMemo(() => {
    const last12 = finHistory.slice(-12);
    return last12.map((r, i) => {
      // 3-month moving average
      let avg3m = null;
      if (i >= 2) {
        const slice = last12.slice(i - 2, i + 1);
        avg3m = Math.round(slice.reduce((s, d) => s + (d.ca || 0), 0) / slice.length);
      }
      // Monthly growth rate
      const prevCA = i > 0 ? last12[i - 1].ca || 0 : null;
      const growth = prevCA && prevCA > 0 ? Math.round(((r.ca - prevCA) / prevCA) * 100) : null;
      // Year-over-year
      const yoyKey = sameMonthLastYear(r.key);
      const yoyRow = finHistory.find((f) => f.key === yoyKey);
      const yoy = yoyRow ? yoyRow.ca || 0 : null;

      return {
        month: monthLabel(r.key),
        ca: r.ca || 0,
        charges: r.charges || 0,
        avg3m,
        growth,
        yoy,
      };
    });
  }, [finHistory]);

  const yoyDataExists = useMemo(() => revenueTrendsData.some((d) => d.yoy !== null), [revenueTrendsData]);

  const forecastDataForChart = useMemo(() => {
    const forecast = forecastCA(finHistory, 3);
    return forecast.map((f) => ({
      month: monthLabel(f.key),
      forecastCA: f.ca,
    }));
  }, [finHistory]);

  // Monthly growth rates for display
  const monthlyGrowthRates = useMemo(() => {
    return revenueTrendsData.filter((d) => d.growth !== null).slice(-6);
  }, [revenueTrendsData]);

  /* ================================================================ */
  /*  SECTION 3: CRM Funnel Analysis                                   */
  /* ================================================================ */
  const funnelStages = useMemo(() => {
    const prospects = contacts.filter((c) => c.status === 'prospect');
    const leads = contacts.filter((c) => c.status === 'lead');
    const clients = contacts.filter((c) => c.status === 'client');
    const perdus = contacts.filter((c) => c.status === 'perdu');

    const calcAvgDays = (arr) => {
      if (arr.length === 0) return 0;
      return Math.round(arr.reduce((s, c) => s + daysSince(c.createdAt || new Date().toISOString()), 0) / arr.length);
    };

    const stages = [
      { id: 'prospect', label: 'Prospect', count: prospects.length, color: T.orange, avgDays: calcAvgDays(prospects) },
      { id: 'lead', label: 'Lead', count: leads.length, color: T.blue, avgDays: calcAvgDays(leads) },
      { id: 'client', label: 'Client', count: clients.length, color: T.green, avgDays: calcAvgDays(clients) },
      { id: 'perdu', label: 'Perdu', count: perdus.length, color: T.red, avgDays: calcAvgDays(perdus) },
    ];

    // Conversion rates between stages
    const total = contacts.length || 1;
    const prospectToLead = prospects.length + leads.length + clients.length > 0
      ? Math.round(((leads.length + clients.length) / (prospects.length + leads.length + clients.length)) * 100)
      : 0;
    const leadToClient = leads.length + clients.length > 0
      ? Math.round((clients.length / (leads.length + clients.length)) * 100)
      : 0;
    const clientToPerdu = clients.length + perdus.length > 0
      ? Math.round((perdus.length / (clients.length + perdus.length)) * 100)
      : 0;

    return { stages, conversions: { prospectToLead, leadToClient, clientToPerdu }, total };
  }, [contacts]);

  const maxFunnelCount = useMemo(() => Math.max(...funnelStages.stages.map((s) => s.count), 1), [funnelStages]);

  // Lead scoring distribution
  const leadScoreDistribution = useMemo(() => {
    const groups = { hot: [], warm: [], tiede: [], froid: [] };
    contacts.forEach((c) => {
      const score = leadScore(c);
      if (score >= 80) groups.hot.push(c);
      else if (score >= 60) groups.warm.push(c);
      else if (score >= 40) groups.tiede.push(c);
      else groups.froid.push(c);
    });
    return [
      { label: 'Hot', icon: '🔥', count: groups.hot.length, color: T.red, bg: T.redBg },
      { label: 'Warm', icon: '🌡️', count: groups.warm.length, color: T.orange, bg: T.orangeBg },
      { label: 'Tiede', icon: '💧', count: groups.tiede.length, color: T.blue, bg: T.blueBg },
      { label: 'Froid', icon: '❄️', count: groups.froid.length, color: T.textMuted, bg: T.surface2 },
    ];
  }, [contacts]);

  /* ================================================================ */
  /*  SECTION 4: Integration Coverage                                  */
  /* ================================================================ */
  const integrationCategories = useMemo(() => {
    const cats = {};
    const catLabels = { paiements: 'Paiements', banque: 'Banque', agenda: 'Agenda', crm: 'CRM', marketing: 'Marketing', projet: 'Projet', publicite: 'Publicite', support: 'Support' };
    const catColors = { paiements: T.orange, banque: T.blue, agenda: T.green, crm: T.purple, marketing: T.accent, projet: T.blue, publicite: T.red, support: T.green };

    INTEGRATIONS.forEach((ig) => {
      if (!cats[ig.category]) {
        cats[ig.category] = {
          label: catLabels[ig.category] || ig.category,
          color: catColors[ig.category] || T.accent,
          total: 0,
          connected: 0,
        };
      }
      cats[ig.category].total++;
      if (integrations[ig.name]) cats[ig.category].connected++;
    });

    return Object.entries(cats).map(([id, data]) => ({
      id,
      ...data,
      healthScore: data.total > 0 ? Math.round((data.connected / data.total) * 100) : 0,
    }));
  }, [integrations]);

  const recentSyncEvents = useMemo(() => {
    return [...syncHistory]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 8);
  }, [syncHistory]);

  /* ================================================================ */
  /*  SECTION 6: Channel ROI                                           */
  /* ================================================================ */
  const channelROI = useMemo(() => {
    if (adPlatforms.length === 0) return null;
    const meta = load('metaAds') || {};
    // Generate per-platform mock data based on connected platforms
    return adPlatforms.map((platform) => {
      const baseData = {
        'Meta Ads': { spend: meta.spend || 3240, cpa: meta.cpa || 22.82, ctr: meta.ctr || 3.85, roas: meta.roas || 4.2, icon: '📣' },
        'Google Ads': { spend: Math.round((meta.spend || 3240) * 0.85), cpa: Math.round((meta.cpa || 22.82) * 1.1 * 100) / 100, ctr: Math.round((meta.ctr || 3.85) * 0.9 * 100) / 100, roas: Math.round((meta.roas || 4.2) * 1.15 * 100) / 100, icon: '🔍' },
        'TikTok Ads': { spend: Math.round((meta.spend || 3240) * 0.6), cpa: Math.round((meta.cpa || 22.82) * 0.8 * 100) / 100, ctr: Math.round((meta.ctr || 3.85) * 1.2 * 100) / 100, roas: Math.round((meta.roas || 4.2) * 0.95 * 100) / 100, icon: '🎵' },
        'LinkedIn Ads': { spend: Math.round((meta.spend || 3240) * 1.3), cpa: Math.round((meta.cpa || 22.82) * 1.6 * 100) / 100, ctr: Math.round((meta.ctr || 3.85) * 0.6 * 100) / 100, roas: Math.round((meta.roas || 4.2) * 0.7 * 100) / 100, icon: '💼' },
      };
      return { name: platform, ...(baseData[platform] || baseData['Meta Ads']) };
    });
  }, [adPlatforms]);

  /* ================================================================ */
  /*  SECTION 7: Predictions                                           */
  /* ================================================================ */
  const forecast = useMemo(() => forecastCA(finHistory, 3), [finHistory]);

  const forecastChartActualData = useMemo(() => {
    return finHistory.slice(-6).map((r) => ({
      month: monthLabel(r.key),
      actual: r.ca || 0,
    }));
  }, [finHistory]);

  const forecastChartPredictData = useMemo(() => {
    if (forecastChartActualData.length === 0) return [];
    // Bridge: last actual point also appears in forecast data
    const bridge = forecastChartActualData.length > 0
      ? [{ month: forecastChartActualData[forecastChartActualData.length - 1].month, forecast: forecastChartActualData[forecastChartActualData.length - 1].actual }]
      : [];
    const fData = forecast.map((f) => ({
      month: monthLabel(f.key),
      forecast: f.ca,
    }));
    return [...bridge, ...fData];
  }, [forecast, forecastChartActualData]);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div>
      {/* ============================================================ */}
      {/*  HEADER                                                       */}
      {/* ============================================================ */}
      <div className="fade-up glass-static" style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: T.text }}>
              Rapports & Analytics
            </h1>
            <p style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>
              Analyse detaillee de votre activite -- {dateRangeLabel}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge label={`${finHistory.length} mois de donnees`} color={T.accent} bg={T.accentBg} />
            <Badge label={`${contacts.length} contacts`} color={T.green} bg={T.greenBg} />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  SECTION 5: Performance KPIs (top of page)                    */}
      {/* ============================================================ */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <KPI
          label="CA TOTAL"
          value={`${fK(totalCA)} EUR`}
          sub={`Sur ${finHistory.length} mois`}
          accent={T.green}
          icon="💰"
          delay={1}
          sparkData={sparkCA}
          helpTip="Somme de tous les CA enregistres"
        />
        <KPI
          label="CA MOYEN MENSUEL"
          value={`${fK(avgMonthlyCA)} EUR`}
          sub="Moyenne sur la periode"
          accent={T.blue}
          icon="📊"
          delay={2}
          helpTip="CA total divise par le nombre de mois"
        />
        <KPI
          label="MARGE NETTE"
          value={`${margeNette}%`}
          sub={`Resultat: ${fK(totalResult)} EUR`}
          accent={margeNette >= 20 ? T.green : margeNette >= 10 ? T.orange : T.red}
          icon="📈"
          delay={3}
          helpTip="Resultat net / CA total x 100"
        />
        <KPI
          label="CLIENTS ACTIFS"
          value={String(activeClients)}
          sub={`Sur ${contacts.length} contacts`}
          accent={T.purple}
          icon="👥"
          delay={4}
          helpTip="Contacts avec le statut Client"
        />
        <KPI
          label="TAUX DE CONVERSION"
          value={`${crmConversion}%`}
          sub="Clients / (Clients + Perdus)"
          accent={crmConversion >= 50 ? T.green : crmConversion >= 25 ? T.orange : T.red}
          icon="🎯"
          delay={5}
          helpTip="Ratio de clients gagnes vs total clos"
        />
        {avgROAS !== null && (
          <KPI
            label="ROAS MOYEN"
            value={`${avgROAS}x`}
            sub={`${adPlatforms.length} plateforme${adPlatforms.length > 1 ? 's' : ''} connectee${adPlatforms.length > 1 ? 's' : ''}`}
            accent={avgROAS >= 3 ? T.green : avgROAS >= 1 ? T.orange : T.red}
            icon="💎"
            delay={6}
            helpTip="Return On Ad Spend moyen"
          />
        )}
      </div>

      {/* ============================================================ */}
      {/*  SECTION 2: Revenue Trends                                    */}
      {/* ============================================================ */}
      <Section title="Tendances de revenus" sub="CA vs Charges sur les 12 derniers mois avec moyenne mobile et previsions">
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 3, background: T.green, borderRadius: 2 }} />
                <span style={{ fontSize: 10, color: T.textMuted }}>CA</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 3, background: T.red, borderRadius: 2, borderTop: '1px dashed ' + T.red }} />
                <span style={{ fontSize: 10, color: T.textMuted }}>Charges</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 3, background: T.orange, borderRadius: 2 }} />
                <span style={{ fontSize: 10, color: T.textMuted }}>Moy. 3 mois</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 3, background: T.blue, borderRadius: 2 }} />
                <span style={{ fontSize: 10, color: T.textMuted }}>Prevision</span>
              </div>
              {yoyDataExists && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 3, background: T.purple, borderRadius: 2 }} />
                  <span style={{ fontSize: 10, color: T.textMuted }}>N-1</span>
                </div>
              )}
            </div>
            <HelpTip text="Graphique combinant CA, charges, moyenne mobile 3 mois, prevision lineaire et comparaison annee precedente" />
          </div>
          <div style={{ height: 280 }}>
            <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spinner size={20} /></div>}>
              <LazyRevenueTrendsChart
                data={revenueTrendsData}
                avgData={revenueTrendsData.filter((d) => d.avg3m !== null)}
                yoyData={revenueTrendsData.filter((d) => d.yoy !== null)}
                forecastData={forecastDataForChart}
              />
            </Suspense>
          </div>

          {/* Monthly growth rates */}
          {monthlyGrowthRates.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Croissance mensuelle
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {monthlyGrowthRates.map((d, i) => (
                  <div key={i} style={{
                    padding: '6px 10px', borderRadius: 8,
                    background: d.growth >= 0 ? T.greenBg : T.redBg,
                    border: `1px solid ${d.growth >= 0 ? T.green : T.red}22`,
                  }}>
                    <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 2 }}>{d.month}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: d.growth >= 0 ? T.green : T.red }}>
                      {d.growth >= 0 ? '+' : ''}{d.growth}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </Section>

      {/* ============================================================ */}
      {/*  SECTION 3: CRM Funnel Analysis                               */}
      {/* ============================================================ */}
      <Section title="Analyse de l'entonnoir CRM" sub="Repartition, taux de conversion et scoring des contacts">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="grid-desktop-2">
          {/* Funnel visual */}
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
              Entonnoir de conversion
            </div>
            {contacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: T.textMuted, fontSize: 11 }}>
                Aucun contact dans le CRM
              </div>
            ) : (
              <div>
                {/* Visual funnel bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  {funnelStages.stages.map((stage, i) => {
                    const widthPct = maxFunnelCount > 0 ? Math.max((stage.count / maxFunnelCount) * 100, 8) : 8;
                    return (
                      <div key={stage.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 70, fontSize: 11, fontWeight: 600, color: stage.color }}>{stage.label}</div>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <div style={{
                              height: 28 - (i * 2), borderRadius: 6,
                              background: stage.color + '22', overflow: 'hidden',
                              display: 'flex', alignItems: 'center',
                            }}>
                              <div style={{
                                height: '100%', width: `${widthPct}%`,
                                background: `linear-gradient(90deg, ${stage.color}44, ${stage.color}88)`,
                                borderRadius: 6, transition: 'width .6s ease',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>
                                  {stage.count}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div style={{ marginLeft: 80, fontSize: 9, color: T.textMuted, marginTop: 2 }}>
                          Moy. {stage.avgDays}j dans cette etape
                        </div>
                        {/* Conversion arrow between stages */}
                        {i < funnelStages.stages.length - 1 && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
                            <span style={{ fontSize: 10, color: T.textMuted }}>↓</span>
                            <Badge
                              label={`${i === 0 ? funnelStages.conversions.prospectToLead : i === 1 ? funnelStages.conversions.leadToClient : funnelStages.conversions.clientToPerdu}%`}
                              color={T.accent}
                              bg={T.accentBg}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Lead scoring distribution */}
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
              Distribution Lead Scoring
              <HelpTip text="Repartition des contacts par score: Hot (80+), Warm (60+), Tiede (40+), Froid (<40)" />
            </div>
            {contacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: T.textMuted, fontSize: 11 }}>
                Aucun contact a scorer
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
                  {leadScoreDistribution.map((group) => (
                    <div key={group.label} style={{
                      padding: '14px 12px', borderRadius: 10, textAlign: 'center',
                      background: group.bg, border: `1px solid ${group.color}22`,
                    }}>
                      <span style={{ fontSize: 20 }}>{group.icon}</span>
                      <div style={{ fontSize: 22, fontWeight: 800, color: group.color, marginTop: 4 }}>{group.count}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', marginTop: 2 }}>{group.label}</div>
                      <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>
                        {contacts.length > 0 ? pct(group.count, contacts.length) : 0}% du total
                      </div>
                    </div>
                  ))}
                </div>

                {/* Score distribution bar */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
                    {leadScoreDistribution.filter((g) => g.count > 0).map((g) => (
                      <div key={g.label} style={{ flex: g.count, background: g.color, borderRadius: 4, transition: 'flex .5s ease' }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  SECTION 4: Integration Coverage                              */}
      {/* ============================================================ */}
      <Section title="Couverture des integrations" sub="Etat de connexion par categorie et historique de synchronisation">
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }} className="grid-desktop-15-1">
          {/* Integration categories grid */}
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
              Couverture par categorie
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
              {integrationCategories.map((cat) => (
                <div key={cat.id} style={{
                  padding: '12px 10px', borderRadius: 10, textAlign: 'center',
                  background: cat.color + '08', border: `1px solid ${cat.color}22`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 6 }}>
                    <ScoreRing score={cat.healthScore} size={32} strokeWidth={3} color={cat.color}>
                      <span style={{ fontSize: 8, fontWeight: 800, color: cat.color }}>{cat.healthScore}</span>
                    </ScoreRing>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: cat.color }}>{cat.label}</div>
                  <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>
                    {cat.connected}/{cat.total} connectees
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <ProgressBar value={cat.connected} max={cat.total} color={cat.color} h={4} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent sync events */}
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
              Historique de synchronisation
            </div>
            {recentSyncEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: T.textMuted, fontSize: 11 }}>
                Aucun evenement de synchronisation
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentSyncEvents.map((ev, i) => {
                  const actionLabels = { connect: 'Connecte', disconnect: 'Deconnecte', resync: 'Resynchronise' };
                  const actionColors = { connect: T.green, disconnect: T.red, resync: T.blue };
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < recentSyncEvents.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: 3, flexShrink: 0,
                        background: actionColors[ev.action] || T.accent,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.name}
                        </div>
                        <div style={{ fontSize: 9, color: T.textMuted }}>
                          {actionLabels[ev.action] || ev.action}
                        </div>
                      </div>
                      <div style={{ fontSize: 9, color: T.textMuted, flexShrink: 0 }}>
                        {ev.date ? new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <Btn v="ghost" small onClick={() => onNavigate?.('settings')}>Gerer les integrations</Btn>
            </div>
          </Card>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  SECTION 6: Channel ROI (if ad platforms connected)           */}
      {/* ============================================================ */}
      {channelROI && (
        <Section title="ROI par canal publicitaire" sub="Performance detaillee par plateforme connectee">
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(channelROI.length, 4)}, 1fr)`, gap: 14 }}>
            {channelROI.map((platform) => (
              <Card key={platform.name}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>{platform.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{platform.name}</div>
                    <div style={{ fontSize: 9, color: T.textMuted }}>Budget: {fK(platform.spend)} EUR</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: T.textMuted }}>CPA</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.orange }}>{platform.cpa} EUR</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: T.textMuted }}>CTR</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.blue }}>{platform.ctr}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: T.textMuted }}>ROAS</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: platform.roas >= 3 ? T.green : platform.roas >= 1 ? T.orange : T.red }}>
                      {platform.roas}x
                    </span>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 9, color: T.textMuted, marginBottom: 2 }}>Performance ROAS</div>
                    <ProgressBar value={Math.min(platform.roas, 5)} max={5} color={platform.roas >= 3 ? T.green : platform.roas >= 1 ? T.orange : T.red} h={5} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* ============================================================ */}
      {/*  SECTION 7: Predictions                                       */}
      {/* ============================================================ */}
      <Section title="Previsions" sub="Projection du CA sur les 3 prochains mois basee sur la tendance recente">
        <Card>
          {finHistory.length < 2 ? (
            <div style={{ textAlign: 'center', padding: 24, color: T.textMuted, fontSize: 11 }}>
              Ajoutez au moins 2 mois de donnees financieres pour generer des previsions
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 3, background: T.green, borderRadius: 2 }} />
                  <span style={{ fontSize: 10, color: T.textMuted }}>CA Reel</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 3, background: T.blue, borderRadius: 2, borderTop: '2px dashed ' + T.blue }} />
                  <span style={{ fontSize: 10, color: T.textMuted }}>Prevision (pointille)</span>
                </div>
              </div>
              <div style={{ height: 220 }}>
                <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spinner size={20} /></div>}>
                  <LazyForecastChart
                    actualData={forecastChartActualData}
                    forecastData={forecastChartPredictData}
                  />
                </Suspense>
              </div>

              {/* Forecast details */}
              {forecast.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                    Previsions detaillees
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${forecast.length}, 1fr)`, gap: 10 }}>
                    {forecast.map((f, i) => {
                      const lastCA = finHistory[finHistory.length - 1]?.ca || 0;
                      const diff = lastCA > 0 ? Math.round(((f.ca - lastCA) / lastCA) * 100) : 0;
                      return (
                        <div key={f.key} style={{
                          padding: '12px', borderRadius: 10, textAlign: 'center',
                          background: T.blueBg, border: `1px solid ${T.blue}22`,
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>{monthLabel(f.key)}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: T.blue }}>{fK(f.ca)} EUR</div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: diff >= 0 ? T.green : T.red, marginTop: 2 }}>
                            {diff >= 0 ? '+' : ''}{diff}% vs dernier mois
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </Section>
    </div>
  );
}
