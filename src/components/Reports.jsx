import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import {
  BF, BILL_TYPES, C, CLIENT_STATUS, CSS, CURR_SYMBOLS, DEAL_STAGES, EXCLUDED_ACCOUNTS, ErrorBoundary, FONT, FONT_TITLE, isExcludedTx,
  GHL_STAGES_COLORS, INV_STATUS, KB_CATS, MILESTONE_CATS, MN, MOODS, SLACK_MODES, SUB_CATS, SYN_STATUS, SYN_TYPES, gr,
  TIER_BG, TIER_COLORS, ago, autoDetectSubscriptions, buildAIContext, buildPulseSlackMsg, buildReportSlackMsg, buildValidationSlackMsg,
  calcH, calcMilestones, clamp, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, curM, curW,
  deadline, fK, fetchGHL, fmt, generateInvoices, getAlerts, getStripeChargesForClient, getStripeTotal, getTheme, ghlCreateContact,
  ghlCreateInvoice, ghlSendInvoice, ghlUpdateContact, healthScore, matchSubsToRevolut, ml, nextM, normalizeStr, pct,
  pf, prevM, project, revFinancials, runway, sSet, sbUpsert, simH, sinceLbl, sinceMonths, slackSend, subMonthly, teamMonthly,
  uid, autoCategorize,
} from "../shared.jsx";
import { categorizeTransaction } from "./BankingPanel.jsx";
import { TX_CATEGORIES } from "../components.jsx";


/* ============ HELPER: compute all report data for a given month ============ */
function computeReportData(soc, month, socBankData, ghlData, clients, reps) {
  const excl = EXCLUDED_ACCOUNTS[soc?.id] || [];
  const allTxs = (socBankData?.transactions || []);
  const txs = allTxs.filter(t => (t.created_at || "").startsWith(month));
  const filtered = txs.filter(t => !isExcludedTx(t, excl));

  // txCatOverrides from localStorage
  let txCatOverrides = {};
  try { txCatOverrides = JSON.parse(localStorage.getItem(`scTxCat_${soc?.id}`)) || {}; } catch {}
  const getCat = (tx) => {
    if (txCatOverrides[tx.id]) {
      const found = TX_CATEGORIES.find(c => c.id === txCatOverrides[tx.id]);
      if (found) return found;
    }
    return categorizeTransaction(tx);
  };

  // FINANCES
  const inTxs = filtered.filter(t => (t.legs?.[0]?.amount || 0) > 0);
  const outTxs = filtered.filter(t => (t.legs?.[0]?.amount || 0) < 0);
  const ca = inTxs.reduce((a, t) => a + (t.legs?.[0]?.amount || 0), 0);
  const charges = Math.abs(outTxs.reduce((a, t) => a + (t.legs?.[0]?.amount || 0), 0));
  const marge = ca - charges;
  const margePct = ca > 0 ? Math.round(marge / ca * 100) : 0;
  const treso = socBankData?.balance || 0;

  // Rémunération Dayyaan & Dividendes Scale Corp (from excluded transactions)
  const excludedTxs = txs.filter(t => isExcludedTx(t, excl) && (t.legs?.[0]?.amount || 0) < 0);
  const remunDayyaan = Math.round(Math.abs(excludedTxs.filter(t => {
    const desc = ((t.legs?.[0]?.description || "") + " " + (t.reference || "")).toLowerCase();
    return /dayyaan|mohammad/i.test(desc);
  }).reduce((a, t) => a + Math.abs(t.legs?.[0]?.amount || 0), 0)));
  // Only count transfers FROM Principal TO SCALE CORP INC pocket (not pocket → external bank)
  const dividendesScaleCorp = Math.round(Math.abs(excludedTxs.filter(t => {
    const desc = ((t.legs?.[0]?.description || "") + " " + (t.reference || "")).toLowerCase();
    const isFromPrincipal = !excl.includes(t.legs?.[0]?.account_id);
    return isFromPrincipal && /dividend|scale\s*corp|anthony|rudy/i.test(desc) && !/dayyaan|mohammad/i.test(desc);
  }).reduce((a, t) => a + Math.abs(t.legs?.[0]?.amount || 0), 0)));
  const margeNette = marge - remunDayyaan - dividendesScaleCorp;
  const margeNettePct = ca > 0 ? Math.round(margeNette / ca * 100) : 0;

  // Category breakdown for expenses
  const catBreakdown = {};
  outTxs.forEach(t => {
    const cat = getCat(t);
    const label = cat?.label || "📦 Autres dépenses";
    catBreakdown[label] = (catBreakdown[label] || 0) + Math.abs(t.legs?.[0]?.amount || 0);
  });
  const catData = Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]);

  // Top encaissements
  const inGrouped = {};
  inTxs.forEach(t => {
    const desc = (t.legs?.[0]?.description || t.reference || "").trim() || "Inconnu";
    inGrouped[desc] = (inGrouped[desc] || 0) + (t.legs?.[0]?.amount || 0);
  });
  const topEncaissements = Object.entries(inGrouped).sort((a, b) => b[1] - a[1]).slice(0, 7);

  // Top dépenses
  const outGrouped = {};
  outTxs.forEach(t => {
    const desc = (t.legs?.[0]?.description || t.reference || "").trim() || "Inconnu";
    outGrouped[desc] = (outGrouped[desc] || 0) + Math.abs(t.legs?.[0]?.amount || 0);
  });
  const topDepenses = Object.entries(outGrouped).sort((a, b) => b[1] - a[1]).slice(0, 7);

  // SALES
  const gd = ghlData?.[soc?.id] || {};
  const opps = gd.opportunities || [];
  const calEvents = gd.calendarEvents || [];
  const ghlCl = gd.ghlClients || [];

  const prospectsMonth = ghlCl.filter(c => (c.dateAdded || c.createdAt || "").startsWith(month)).length;
  const myCl = (clients || []).filter(c => c.socId === soc?.id);
  const activeCl = myCl.filter(c => c.status === "active");
  const churnedCl = myCl.filter(c => c.status === "churned" || c.status === "lost");

  const callsMonth = calEvents.filter(e => (e.startTime || "").startsWith(month)).length;
  const wonDeals = opps.filter(o => o.status === "won" && (o.updatedAt || o.createdAt || "").startsWith(month));
  const closings = wonDeals.length;
  const lostDeals = opps.filter(o => o.status === "lost" && (o.updatedAt || o.createdAt || "").startsWith(month)).length;

  const conversionRate = prospectsMonth > 0 ? Math.round(closings / prospectsMonth * 100) : 0;
  const avgClientValue = activeCl.length > 0 ? Math.round(activeCl.reduce((a, c) => a + clientMonthlyRevenue(c), 0) / activeCl.length) : 0;

  // No-show
  const noShowVal = parseInt(localStorage.getItem(`salesNoShow_${soc?.id}_${month}`) || "0");
  const noShowPct = callsMonth > 0 ? Math.round(noShowVal / callsMonth * 100) : 0;

  // Pipeline valorisation
  const openOpps = opps.filter(o => o.status === "open");
  const pipelineTotal = openOpps.reduce((a, o) => a + (o.monetaryValue || o.value || 0), 0);

  // Funnel stages (try to match common stage names)
  const pipelines = gd.pipelines || [];
  const stages = pipelines.flatMap(p => p.stages || []);
  const stageMap = {};
  stages.forEach(st => { stageMap[st.id] = st.name; });
  const funnelLabels = ["Prospect", "Appel Découverte", "Appel Intégration", "Client"];
  const funnel = {};
  openOpps.forEach(o => {
    const sName = (stageMap[o.pipelineStageId] || o.stageName || "").toLowerCase();
    if (sName.includes("prospect") || sName.includes("lead") || sName.includes("nouveau")) funnel["Prospect"] = (funnel["Prospect"] || 0) + 1;
    else if (sName.includes("découverte") || sName.includes("discovery") || sName.includes("appel 1") || sName.includes("qualifying")) funnel["Appel Découverte"] = (funnel["Appel Découverte"] || 0) + 1;
    else if (sName.includes("intégration") || sName.includes("closing") || sName.includes("appel 2") || sName.includes("négociation")) funnel["Appel Intégration"] = (funnel["Appel Intégration"] || 0) + 1;
    else if (sName.includes("client") || sName.includes("won") || sName.includes("gagné")) funnel["Client"] = (funnel["Client"] || 0) + 1;
    else funnel["Prospect"] = (funnel["Prospect"] || 0) + 1;
  });
  // Add won deals to Client count
  funnel["Client"] = (funnel["Client"] || 0) + closings;

  // Top 5 clients (by bank collected)
  const top5Clients = activeCl.map(cl => {
    const cn = (cl.name || "").toLowerCase().trim();
    const matchedTxs = allTxs.filter(tx => {
      const leg = tx.legs?.[0];
      if (!leg || leg.amount <= 0) return false;
      const desc = (leg.description || tx.reference || "").toLowerCase();
      if (cn.length > 2 && desc.includes(cn)) return true;
      const pts = cn.split(/\s+/).filter(p => p.length > 2);
      return pts.length >= 2 && pts.every(p => desc.includes(p));
    });
    const cumule = matchedTxs.reduce((a, tx) => a + (tx.legs?.[0]?.amount || 0), 0);
    const firstTx = matchedTxs.length > 0 ? matchedTxs.reduce((a, tx) => {
      const d = new Date(tx.created_at || 0).getTime();
      return d < a ? d : a;
    }, Infinity) : Date.now();
    const months2 = Math.max(1, Math.ceil((Date.now() - firstTx) / (30.44 * 864e5)));
    const avgMois = months2 > 0 ? Math.round(cumule / months2) : 0;
    return { name: cl.name, cumule, duree: months2, avgMois, monthly: clientMonthlyRevenue(cl) };
  }).sort((a, b) => b.cumule - a.cumule).slice(0, 5);

  // PUBLICITÉ
  let metaAds = null;
  try { metaAds = JSON.parse(localStorage.getItem(`metaAds_${soc?.id}_${month}`)); } catch {}
  const adSpend = metaAds?.spend || 0;
  const adImpressions = metaAds?.impressions || 0;
  const adClicks = metaAds?.clicks || 0;
  const adLeads = metaAds?.leads || 0;
  const adRevenue = metaAds?.revenue || 0;
  const cpl = adLeads > 0 ? adSpend / adLeads : 0;
  const cpc = adClicks > 0 ? adSpend / adClicks : 0;
  const cpm = adImpressions > 0 ? (adSpend / adImpressions) * 1000 : 0;
  // Appels bookés Ads: estimate from calendar events that match ad-sourced leads (approximate: use adLeads as proxy for booked calls from ads if no better data)
  const adsCallsBooked = metaAds?.callsBooked || Math.min(adLeads, callsMonth);
  const costPerCall = adsCallsBooked > 0 ? adSpend / adsCallsBooked : 0;
  const roas = adSpend > 0 ? adRevenue / adSpend : 0;

  return {
    // Finances
    ca, charges, marge, margePct, treso, catData, topEncaissements, topDepenses, txCount: filtered.length,
    remunDayyaan, dividendesScaleCorp, margeNette, margeNettePct,
    // Sales
    prospectsMonth, activeCl: activeCl.length, churnedCl: churnedCl.length,
    callsMonth, closings, lostDeals, conversionRate, avgClientValue,
    noShowVal, noShowPct, pipelineTotal, funnel, funnelLabels, top5Clients,
    // Pub
    hasAds: !!metaAds && adSpend > 0, adSpend, adImpressions, adClicks, adLeads, adRevenue,
    cpl, cpc, cpm, adsCallsBooked, costPerCall, roas,
    // Meta
    wonDeals: closings, lostMonth: lostDeals,
  };
}

/* ============ SECTION RENDERER (screen) ============ */
const SectionTitle = ({ icon, title }) => (
  <div style={{ fontSize: 11, fontWeight: 800, color: C.acc, letterSpacing: 1, marginBottom: 10, marginTop: 16, fontFamily: FONT_TITLE, textTransform: "uppercase" }}>
    {icon} {title}
  </div>
);

const KpiBox = ({ value, label, color, sub }) => (
  <div style={{ padding: 10, background: color + "14", borderRadius: 8, textAlign: "center", minWidth: 0 }}>
    <div style={{ fontWeight: 900, fontSize: 16, color }}>{value}</div>
    {sub && <div style={{ fontSize: 9, fontWeight: 700, color, marginTop: 1 }}>{sub}</div>}
    <div style={{ fontSize: 8, color: C.td, fontWeight: 600, marginTop: 2 }}>{label}</div>
  </div>
);

const PIE_COLORS = ["#FFAA00", "#34d399", "#f87171", "#60a5fa", "#a78bfa", "#fb923c", "#ec4899", "#14b8a6"];

/* ============ RAPPORTS PANEL ============ */
export function RapportsPanel({ soc, socBankData, ghlData, clients, reps, allM, hold }) {
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [notesMap, setNotesMap] = useState(() => { try { return JSON.parse(localStorage.getItem(`scRapportNotes_${soc?.id}`) || "{}"); } catch { return {}; } });
  const saveNote = (month, text) => { const next = { ...notesMap, [month]: text }; setNotesMap(next); try { localStorage.setItem(`scRapportNotes_${soc?.id}`, JSON.stringify(next)); sSet(`scRapportNotes_${soc?.id}`, next); } catch {} };
  const [lockedMonths, setLockedMonths] = useState(() => { try { return JSON.parse(localStorage.getItem(`scRapportLocked_${soc?.id}`) || "[]"); } catch { return []; } });
  const toggleLock = (month) => { const next = lockedMonths.includes(month) ? lockedMonths.filter(m => m !== month) : [...lockedMonths, month]; setLockedMonths(next); try { localStorage.setItem(`scRapportLocked_${soc?.id}`, JSON.stringify(next)); sSet(`scRapportLocked_${soc?.id}`, next); } catch {} };
  // Auto-insights generator
  const genInsights = (d, month) => {
    const insights = [];
    if (d.margePct > 50) insights.push({ icon: "🟢", text: `Excellente marge de ${d.margePct}% — continuez ainsi !`, type: "success" });
    else if (d.margePct < 20 && d.ca > 0) insights.push({ icon: "🔴", text: `Marge faible (${d.margePct}%) — surveillez vos charges`, type: "warning" });
    if (d.noShowPct > 25) insights.push({ icon: "⚠️", text: `Taux de no-show élevé (${d.noShowPct}%) — considérez des rappels automatiques`, type: "warning" });
    if (d.closings > 0 && d.conversionRate > 30) insights.push({ icon: "🎯", text: `Taux de conversion excellent (${d.conversionRate}%) — votre processus de vente est efficace`, type: "success" });
    if (d.closings === 0 && d.callsMonth > 3) insights.push({ icon: "📉", text: `0 closing malgré ${d.callsMonth} appels — revoyez votre script/offre`, type: "warning" });
    if (d.churnedCl > 0) insights.push({ icon: "❌", text: `${d.churnedCl} client${d.churnedCl > 1 ? 's' : ''} perdu${d.churnedCl > 1 ? 's' : ''} — analysez les raisons du churn`, type: "warning" });
    if (d.hasAds && d.roas < 1) insights.push({ icon: "💸", text: `ROAS négatif (${d.roas.toFixed(2)}x) — vos pubs ne sont pas rentables`, type: "warning" });
    if (d.hasAds && d.roas >= 2) insights.push({ icon: "🚀", text: `ROAS de ${d.roas.toFixed(2)}x — envisagez d'augmenter le budget pub`, type: "success" });
    if (d.treso > 0 && d.charges > 0) { const runway = Math.floor(d.treso / d.charges); if (runway <= 3) insights.push({ icon: "🚨", text: `Seulement ${runway} mois de runway — anticipez`, type: "warning" }); }
    return insights;
  };
  const cm = curM();
  const months = useMemo(() => { const ms = []; let m = cm; for (let i = 0; i < 12; i++) { ms.push(m); m = prevM(m); } return ms; }, [cm]);

  // MRR tracking
  const activeClients = (clients || []).filter(c => c.socId === soc?.id && c.status === "active" && c.billing);
  const mrrMonths = months.slice(0, 6).reverse();
  const mrrData = useMemo(() => {
    return activeClients.map(cl => {
      const cn = (cl.name || "").toLowerCase().trim();
      const monthPayments = {};
      mrrMonths.forEach(mo => {
        const txs = (socBankData?.transactions || []).filter(t => (t.created_at || "").startsWith(mo));
        const found = txs.some(t => { const leg = t.legs?.[0]; if (!leg || leg.amount <= 0) return false; const desc = (leg.description || t.reference || "").toLowerCase(); return cn.length > 2 && desc.includes(cn); });
        monthPayments[mo] = found;
      });
      return { client: cl, payments: monthPayments, billing: clientMonthlyRevenue(cl) };
    });
  }, [activeClients, socBankData, mrrMonths]);
  const mrrTheorique = activeClients.reduce((a, c) => a + clientMonthlyRevenue(c), 0);

  const renderMonthReport = (month, d, isCurrent) => {
    return <>
      {/* ═══ 1. FINANCES ═══ */}
      <SectionTitle icon="💰" title="Finances" />
      <div className="rg4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
        <KpiBox value={`${fmt(d.ca)}€`} label="CA du mois" color={C.g} />
        <KpiBox value={`${fmt(d.charges)}€`} label="Charges" color={C.r} />
        <KpiBox value={`${fmt(d.marge)}€`} label="Marge brute" color={d.marge >= 0 ? C.g : C.r} sub={`${d.margePct}%`} />
        <KpiBox value={`${fmt(d.treso)}€`} label="Trésorerie" color={C.b} />
      </div>

      {/* Marge Nette card */}
      {(d.remunDayyaan > 0 || d.dividendesScaleCorp > 0) && <div style={{ padding: 14, background: C.card2, borderRadius: 10, border: `1px solid ${C.brd}`, marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.td, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Marge nette (après déductions)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.t }}>Marge brute</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: d.marge >= 0 ? C.g : C.r }}>{fmt(d.marge)}€</span>
          </div>
          {d.remunDayyaan > 0 && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.td }}>− Rémunération Dayyaan</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.r }}>-{fmt(d.remunDayyaan)}€</span>
          </div>}
          {d.dividendesScaleCorp > 0 && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.td }}>− Dividendes Scale Corp Inc</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.r }}>-{fmt(d.dividendesScaleCorp)}€</span>
          </div>}
          <div style={{ borderTop: `1px solid ${C.brd}`, paddingTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: C.t }}>Marge nette</span>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: d.margeNette >= 0 ? C.g : C.r }}>{fmt(d.margeNette)}€</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: d.margeNettePct >= 0 ? C.g : C.r, marginLeft: 6 }}>{d.margeNettePct}%</span>
            </div>
          </div>
        </div>
      </div>}

      {/* Category breakdown */}
      {d.catData.length > 0 && <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.td, marginBottom: 6 }}>RÉPARTITION DES DÉPENSES</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: 140, height: 140, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={d.catData.map(([n, v]) => ({ name: n, value: v }))} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={28} strokeWidth={0}>
                {d.catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie></PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {d.catData.map(([n, v], i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0", fontSize: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
              <span style={{ color: C.t, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n}</span>
              <span style={{ fontWeight: 700, color: C.td }}>{fmt(v)}€</span>
            </div>)}
          </div>
        </div>
      </div>}

      {/* Top encaissements & dépenses */}
      <div className="rg2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.g, marginBottom: 6 }}>TOP ENCAISSEMENTS</div>
          {d.topEncaissements.length === 0 ? <div style={{ fontSize: 10, color: C.td }}>—</div> : d.topEncaissements.map(([n, v], i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: `1px solid ${C.brd}08` }}><span style={{ fontSize: 10, color: C.t, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{n}</span><span style={{ fontSize: 10, fontWeight: 700, color: C.g }}>{fmt(v)}€</span></div>)}
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.r, marginBottom: 6 }}>TOP DÉPENSES</div>
          {d.topDepenses.length === 0 ? <div style={{ fontSize: 10, color: C.td }}>—</div> : d.topDepenses.map(([n, v], i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: `1px solid ${C.brd}08` }}><span style={{ fontSize: 10, color: C.t, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{n}</span><span style={{ fontSize: 10, fontWeight: 700, color: C.r }}>{fmt(v)}€</span></div>)}
        </div>
      </div>

      {/* ═══ 2. SALES ═══ */}
      <SectionTitle icon="📈" title="Sales" />
      <div className="rg4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 8 }}>
        <KpiBox value={d.prospectsMonth} label="Prospects" color={C.b} />
        <KpiBox value={d.activeCl} label="Clients actifs" color={C.g} />
        <KpiBox value={d.churnedCl} label="Churned" color={C.r} />
        <KpiBox value={d.callsMonth} label="Appels" color={C.acc} />
      </div>
      <div className="rg4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
        <KpiBox value={d.closings} label="Closings" color={C.g} />
        <KpiBox value={`${d.conversionRate}%`} label="Conversion" color={d.conversionRate >= 20 ? C.g : C.o} />
        <KpiBox value={`${fmt(d.avgClientValue)}€`} label="Avg client" color={C.acc} />
        <KpiBox value={`${d.noShowPct}%`} label="No-show" color={d.noShowPct > 20 ? C.r : C.g} sub={`${d.noShowVal} no-shows`} />
      </div>

      {/* Pipeline */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ padding: "8px 14px", background: C.accD, borderRadius: 8, border: `1px solid ${C.acc}22` }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: C.acc }}>PIPELINE</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.acc }}>{fmt(d.pipelineTotal)}€</div>
        </div>
      </div>

      {/* Funnel */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.td, marginBottom: 6 }}>FUNNEL</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {d.funnelLabels.map((label, i) => {
            const count = d.funnel[label] || 0;
            const maxCount = Math.max(1, ...d.funnelLabels.map(l => d.funnel[l] || 0));
            const width = Math.max(40, (count / maxCount) * 100);
            return <Fragment key={label}>
              {i > 0 && <span style={{ color: C.td, fontSize: 10 }}>→</span>}
              <div style={{ padding: "6px 10px", background: `${[C.b, C.acc, C.o, C.g][i]}18`, borderRadius: 6, textAlign: "center", minWidth: width, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: [C.b, C.acc, C.o, C.g][i] }}>{count}</div>
                <div style={{ fontSize: 7, color: C.td, fontWeight: 600 }}>{label}</div>
              </div>
            </Fragment>;
          })}
        </div>
      </div>

      {/* Top 5 clients */}
      {d.top5Clients.length > 0 && <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.g, marginBottom: 6 }}>TOP 5 CLIENTS</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
          <thead><tr>
            <th style={{ textAlign: "left", padding: "4px 6px", borderBottom: `1px solid ${C.brd}`, color: C.td, fontSize: 8 }}>Client</th>
            <th style={{ textAlign: "right", padding: "4px 6px", borderBottom: `1px solid ${C.brd}`, color: C.td, fontSize: 8 }}>Cumulé</th>
            <th style={{ textAlign: "right", padding: "4px 6px", borderBottom: `1px solid ${C.brd}`, color: C.td, fontSize: 8 }}>Durée</th>
            <th style={{ textAlign: "right", padding: "4px 6px", borderBottom: `1px solid ${C.brd}`, color: C.td, fontSize: 8 }}>Avg/mois</th>
          </tr></thead>
          <tbody>{d.top5Clients.map((cl, i) => <tr key={i}>
            <td style={{ padding: "4px 6px", borderBottom: `1px solid ${C.brd}08`, color: C.t, fontWeight: 600 }}>{cl.name}</td>
            <td style={{ padding: "4px 6px", borderBottom: `1px solid ${C.brd}08`, textAlign: "right", color: C.g, fontWeight: 700 }}>{fmt(cl.cumule)}€</td>
            <td style={{ padding: "4px 6px", borderBottom: `1px solid ${C.brd}08`, textAlign: "right", color: C.td }}>{cl.duree} mois</td>
            <td style={{ padding: "4px 6px", borderBottom: `1px solid ${C.brd}08`, textAlign: "right", color: C.acc, fontWeight: 600 }}>{fmt(cl.avgMois)}€</td>
          </tr>)}</tbody>
        </table>
      </div>}

      {/* ═══ 3. PUBLICITÉ ═══ */}
      {d.hasAds && <>
        <SectionTitle icon="📣" title="Publicité" />
        <div className="rg4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 8 }}>
          <KpiBox value={d.adLeads} label="Prospects Ads" color={C.b} />
          <KpiBox value={d.adsCallsBooked} label="Appels bookés" color={C.acc} />
          <KpiBox value={`${d.cpl.toFixed(2)}€`} label="CPL" color={C.acc} />
          <KpiBox value={`${d.cpc.toFixed(2)}€`} label="CPC" color={C.td} />
        </div>
        <div className="rg4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
          <KpiBox value={`${d.cpm.toFixed(2)}€`} label="CPM" color={C.td} />
          <KpiBox value={`${d.costPerCall.toFixed(2)}€`} label="Coût/appel" color={d.costPerCall > 50 ? C.r : C.g} />
          <KpiBox value={`${d.roas.toFixed(2)}x`} label="ROAS" color={d.roas >= 2 ? C.g : d.roas >= 1 ? C.o : C.r} />
          <KpiBox value={`${fmt(d.adSpend)}€`} label="Budget total" color={C.r} />
        </div>
      </>}

      {/* Objectif */}
      {(soc.obj || soc.monthlyGoal) > 0 && (() => { const obj = soc.obj || soc.monthlyGoal || 0; const atteint = d.ca >= obj; return <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: atteint ? C.gD : C.rD, borderRadius: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14 }}>{atteint ? "✅" : "❌"}</span>
        <div style={{ flex: 1 }}><div style={{ fontSize: 10, fontWeight: 700, color: atteint ? C.g : C.r }}>{atteint ? "Objectif atteint" : "Non atteint"}</div><div style={{ fontSize: 9, color: C.td }}>Objectif: {fmt(obj)}€ · Réalisé: {fmt(d.ca)}€ ({obj > 0 ? Math.round(d.ca / obj * 100) : 0}%)</div></div>
      </div>; })()}
    </>;
  };

  /* ═══ PDF EXPORT ═══ */
  const exportPDF = (month) => {
    const d = computeReportData(soc, month, socBankData, ghlData, clients, reps);
    const logo = hold?.brand?.logoUrl || "";
    const socName = soc?.nom || "Société";
    const monthLabel = ml(month);

    const catRows = d.catData.map(([n, v]) => `<tr><td>${n}</td><td style="text-align:right;font-weight:700">${fmt(v)}€</td></tr>`).join("");
    const topInRows = d.topEncaissements.map(([n, v]) => `<tr><td>${n}</td><td style="text-align:right;font-weight:700;color:#22c55e">${fmt(v)}€</td></tr>`).join("") || "<tr><td colspan='2' style='color:#999'>—</td></tr>";
    const topOutRows = d.topDepenses.map(([n, v]) => `<tr><td>${n}</td><td style="text-align:right;font-weight:700;color:#ef4444">${fmt(v)}€</td></tr>`).join("") || "<tr><td colspan='2' style='color:#999'>—</td></tr>";
    const top5Rows = d.top5Clients.map(cl => `<tr><td>${cl.name}</td><td style="text-align:right">${fmt(cl.cumule)}€</td><td style="text-align:right">${cl.duree} mois</td><td style="text-align:right">${fmt(cl.avgMois)}€</td></tr>`).join("");
    const funnelHTML = d.funnelLabels.map((l, i) => `<span style="display:inline-block;padding:6px 14px;background:${["#3b82f620", "#FFAA0020", "#f9731620", "#22c55e20"][i]};border-radius:6px;margin-right:4px;text-align:center"><strong style="font-size:18px;color:${["#3b82f6", "#FFAA00", "#f97316", "#22c55e"][i]}">${d.funnel[l] || 0}</strong><br><span style="font-size:9px;color:#666">${l}</span></span>${i < 3 ? '<span style="color:#999;margin:0 4px">→</span>' : ''}`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Rapport ${monthLabel} — ${socName}</title>
<style>
*{box-sizing:border-box}
body{font-family:'Helvetica Neue',Arial,sans-serif;padding:40px 50px;color:#1a1a1a;max-width:850px;margin:0 auto;line-height:1.5;background:#fff}
h1{color:#FFAA00;font-size:24px;margin-bottom:2px;border-bottom:3px solid #FFAA00;padding-bottom:8px}
h2{color:#333;font-size:14px;margin-top:28px;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;border-left:4px solid #FFAA00;padding-left:10px}
.sub{color:#666;font-size:12px;margin-bottom:20px}
.kpis{display:flex;gap:10px;margin:14px 0;flex-wrap:wrap}
.kpi{flex:1;min-width:100px;padding:14px;background:#f8f9fa;border-radius:10px;text-align:center;border:1px solid #eee}
.kpi .val{font-size:22px;font-weight:900}
.kpi .lbl{font-size:10px;color:#666;margin-top:2px}
.kpi .sub2{font-size:9px;color:#888;margin-top:1px}
table{width:100%;border-collapse:collapse;margin:8px 0}
td,th{padding:7px 10px;border-bottom:1px solid #eee;text-align:left;font-size:11px}
th{background:#f8f9fa;font-weight:700;color:#333;font-size:10px;text-transform:uppercase;letter-spacing:.5px}
.cols2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.footer{margin-top:40px;padding-top:14px;border-top:1px solid #ddd;color:#999;font-size:9px;text-align:center}
@media print{body{padding:15px 20px;font-size:10px}@page{margin:12mm}.kpi .val{font-size:18px}h1{font-size:20px}h2{font-size:12px}}
</style></head><body>
${logo ? `<img src="${logo}" style="height:44px;margin-bottom:12px"/>` : ""}
<h1>Rapport Mensuel — ${monthLabel}</h1>
<p class="sub">${socName}${soc?.porteur ? " — " + soc.porteur : ""}${soc?.act ? " · " + soc.act : ""}</p>

<h2>💰 Finances</h2>
<div class="kpis">
<div class="kpi"><div class="val" style="color:#22c55e">${fmt(d.ca)}€</div><div class="lbl">CA du mois</div></div>
<div class="kpi"><div class="val" style="color:#ef4444">${fmt(d.charges)}€</div><div class="lbl">Charges</div></div>
<div class="kpi"><div class="val" style="color:${d.marge >= 0 ? "#22c55e" : "#ef4444"}">${fmt(d.marge)}€</div><div class="sub2">${d.margePct}%</div><div class="lbl">Marge</div></div>
<div class="kpi"><div class="val" style="color:#3b82f6">${fmt(d.treso)}€</div><div class="lbl">Trésorerie</div></div>
</div>

${d.catData.length > 0 ? `<h3 style="font-size:11px;color:#666;margin:16px 0 6px">Répartition des dépenses</h3><table><tr><th>Catégorie</th><th style="text-align:right">Montant</th></tr>${catRows}</table>` : ""}

<div class="cols2">
<div><h3 style="font-size:11px;color:#22c55e;margin:10px 0 4px">Top Encaissements</h3><table>${topInRows}</table></div>
<div><h3 style="font-size:11px;color:#ef4444;margin:10px 0 4px">Top Dépenses</h3><table>${topOutRows}</table></div>
</div>

<h2>📈 Sales</h2>
<div class="kpis">
<div class="kpi"><div class="val" style="color:#3b82f6">${d.prospectsMonth}</div><div class="lbl">Prospects</div></div>
<div class="kpi"><div class="val" style="color:#22c55e">${d.activeCl}</div><div class="lbl">Clients actifs</div></div>
<div class="kpi"><div class="val" style="color:#ef4444">${d.churnedCl}</div><div class="lbl">Churned</div></div>
<div class="kpi"><div class="val" style="color:#FFAA00">${d.callsMonth}</div><div class="lbl">Appels</div></div>
</div>
<div class="kpis">
<div class="kpi"><div class="val" style="color:#22c55e">${d.closings}</div><div class="lbl">Closings</div></div>
<div class="kpi"><div class="val">${d.conversionRate}%</div><div class="lbl">Conversion</div></div>
<div class="kpi"><div class="val">${fmt(d.avgClientValue)}€</div><div class="lbl">Avg client</div></div>
<div class="kpi"><div class="val" style="color:${d.noShowPct > 20 ? "#ef4444" : "#22c55e"}">${d.noShowPct}%</div><div class="sub2">${d.noShowVal} no-shows</div><div class="lbl">No-show</div></div>
</div>

<div style="margin:14px 0"><strong style="color:#FFAA00">Pipeline : </strong><span style="font-size:18px;font-weight:900;color:#FFAA00">${fmt(d.pipelineTotal)}€</span></div>

<div style="margin:14px 0">${funnelHTML}</div>

${d.top5Clients.length > 0 ? `<h3 style="font-size:11px;color:#333;margin:16px 0 6px">Top 5 Clients</h3><table><tr><th>Client</th><th style="text-align:right">Cumulé</th><th style="text-align:right">Durée</th><th style="text-align:right">Avg/mois</th></tr>${top5Rows}</table>` : ""}

${d.hasAds ? `<h2>📣 Publicité</h2>
<div class="kpis">
<div class="kpi"><div class="val" style="color:#3b82f6">${d.adLeads}</div><div class="lbl">Prospects Ads</div></div>
<div class="kpi"><div class="val">${d.adsCallsBooked}</div><div class="lbl">Appels bookés</div></div>
<div class="kpi"><div class="val">${d.cpl.toFixed(2)}€</div><div class="lbl">CPL</div></div>
<div class="kpi"><div class="val">${d.cpc.toFixed(2)}€</div><div class="lbl">CPC</div></div>
</div>
<div class="kpis">
<div class="kpi"><div class="val">${d.cpm.toFixed(2)}€</div><div class="lbl">CPM</div></div>
<div class="kpi"><div class="val">${d.costPerCall.toFixed(2)}€</div><div class="lbl">Coût/appel</div></div>
<div class="kpi"><div class="val" style="color:${d.roas >= 2 ? "#22c55e" : d.roas >= 1 ? "#f97316" : "#ef4444"}">${d.roas.toFixed(2)}x</div><div class="lbl">ROAS</div></div>
<div class="kpi"><div class="val" style="color:#ef4444">${fmt(d.adSpend)}€</div><div class="lbl">Budget total</div></div>
</div>` : ""}

<div class="footer">Généré le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · ${d.txCount} transactions · MRR: ${fmt(mrrTheorique)}€/mois</div>
</body></html>`;

    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  return <div className="fu">
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div><h2 style={{ color: C.t, fontSize: 13, fontWeight: 800, margin: 0, fontFamily: FONT_TITLE }}>📋 RAPPORTS MENSUELS</h2><p style={{ color: C.td, fontSize: 10, margin: "2px 0 0" }}>Bilans complets auto-générés — Finances · Sales · Publicité</p></div>
      <ReplayMensuel soc={soc} reps={reps} allM={allM} socBank={socBankData ? { [soc.id]: socBankData } : {}} clients={clients} ghlData={ghlData} />
    </div>
    {months.map((month, mi) => {
      const d = computeReportData(soc, month, socBankData, ghlData, clients, reps);
      const isExpanded = expandedMonth === month || mi === 0;
      const isCurrent = mi === 0;
      return <div key={month} className={`glass-card-static fu d${Math.min(mi + 1, 6)}`} style={{ padding: isCurrent ? 20 : 14, marginBottom: 10, cursor: isCurrent ? undefined : "pointer" }} onClick={!isCurrent ? () => setExpandedMonth(expandedMonth === month ? null : month) : undefined}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isExpanded ? 12 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: isCurrent ? 16 : 12 }}>{isCurrent ? "📊" : "📄"}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: isCurrent ? 14 : 12, color: C.t }}>{ml(month)}{isCurrent ? " (en cours)" : ""}</div>
              {!isExpanded && <div style={{ fontSize: 9, color: C.td }}>CA {fmt(d.ca)}€ · Charges {fmt(d.charges)}€ · Marge {fmt(d.marge)}€ ({d.margePct}%) · {d.closings} closings · Pipeline {fmt(d.pipelineTotal)}€</div>}
            </div>
          </div>
          {!isCurrent && <span style={{ fontSize: 11, color: C.td }}>{isExpanded ? "▲" : "▼"}</span>}
        </div>
        {isExpanded && <>
          {renderMonthReport(month, d, isCurrent)}

          {/* Auto-insights */}
          {(()=>{ const insights = genInsights(d, month); return insights.length > 0 ? <div style={{ marginTop: 12, padding: 12, background: "rgba(167,139,250,.05)", border: `1px solid rgba(167,139,250,.15)`, borderRadius: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.v, letterSpacing: 1, marginBottom: 8, fontFamily: FONT_TITLE }}>💡 AUTO-INSIGHTS</div>
            {insights.map((ins, i) => <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "4px 0", fontSize: 11, color: ins.type === "warning" ? C.o : C.g }}>
              <span>{ins.icon}</span><span style={{ color: C.t }}>{ins.text}</span>
            </div>)}
          </div> : null; })()}

          {/* Export PDF + Won/lost summary + Lock */}
          <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={(e) => { e.stopPropagation(); exportPDF(month); }} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.acc}`, background: C.accD, color: C.acc, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 4 }}>📄 Exporter PDF</button>
            <button onClick={(e) => { e.stopPropagation(); toggleLock(month); }} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${lockedMonths.includes(month) ? C.g + "44" : C.brd}`, background: lockedMonths.includes(month) ? C.gD : "transparent", color: lockedMonths.includes(month) ? C.g : C.td, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 4 }}>{lockedMonths.includes(month) ? "🔒 Archivé" : "📂 Archiver"}</button>
            <span style={{ fontSize: 10, color: C.g, fontWeight: 600 }}>✅ {d.closings} closing{d.closings > 1 ? "s" : ""}</span>
            <span style={{ fontSize: 10, color: C.r, fontWeight: 600 }}>❌ {d.lostMonth} perdu{d.lostMonth > 1 ? "s" : ""}</span>
          </div>

          {/* Notes per month */}
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 9, fontWeight: 700, color: C.td, letterSpacing: .5, display: "block", marginBottom: 4 }}>📝 NOTES DU MOIS</label>
            <textarea value={notesMap[month] || ""} onChange={e => saveNote(month, e.target.value)} placeholder="Ajouter vos observations, commentaires..." style={{ width: "100%", minHeight: isCurrent ? 80 : 50, padding: 10, borderRadius: 8, border: `1px solid ${C.brd}`, background: "rgba(6,6,11,0.6)", color: C.t, fontSize: 11, fontFamily: FONT, outline: "none", resize: "vertical" }} />
          </div>
        </>}
      </div>;
    })}
    {/* Objectifs summary */}
    {(soc.obj || soc.monthlyGoal) > 0 && (() => { const obj = soc.obj || soc.monthlyGoal || 0; const results = months.map(mo => computeReportData(soc, mo, socBankData, ghlData, clients, reps)).filter(d => d.txCount > 0); const atteints = results.filter(d => d.ca >= obj).length; const total = results.length; const pctObj = total > 0 ? Math.round(atteints / total * 100) : 0; return <div className="glass-card-static" style={{ padding: 16, marginTop: 12, marginBottom: 4, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 24 }}>{pctObj >= 70 ? "🏆" : pctObj >= 40 ? "📊" : "📉"}</span>
      <div><div style={{ fontWeight: 800, fontSize: 12, color: pctObj >= 70 ? C.g : pctObj >= 40 ? C.o : C.r }}>Objectifs atteints: {atteints}/{total} mois ({pctObj}%)</div><div style={{ fontSize: 9, color: C.td }}>Objectif mensuel: {fmt(obj)}€</div></div>
    </div>; })()}
    {/* MRR TRACKING */}
    {activeClients.length > 0 && <div className="glass-card-static" style={{ padding: 20, marginTop: 16 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.v, letterSpacing: 1, marginBottom: 12, fontFamily: FONT_TITLE }}>📊 SUIVI MRR — RÉCURRENCE CLIENTS</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
          <thead><tr>
            <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: `1px solid ${C.brd}`, color: C.td, fontWeight: 700, fontSize: 9 }}>Client</th>
            <th style={{ textAlign: "right", padding: "6px 4px", borderBottom: `1px solid ${C.brd}`, color: C.td, fontWeight: 700, fontSize: 8 }}>€/m</th>
            {mrrMonths.map(mo => <th key={mo} style={{ textAlign: "center", padding: "6px 4px", borderBottom: `1px solid ${C.brd}`, color: C.td, fontWeight: 700, fontSize: 8, minWidth: 50 }}>{ml(mo).split(" ")[0]}</th>)}
          </tr></thead>
          <tbody>
            {mrrData.map(({ client: cl, payments, billing }) => <tr key={cl.id}>
              <td style={{ padding: "5px 8px", borderBottom: `1px solid ${C.brd}08`, fontWeight: 600, color: C.t, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cl.name}</td>
              <td style={{ padding: "5px 4px", borderBottom: `1px solid ${C.brd}08`, textAlign: "right", fontWeight: 700, color: C.acc }}>{fmt(billing)}€</td>
              {mrrMonths.map(mo => <td key={mo} style={{ padding: "5px 4px", borderBottom: `1px solid ${C.brd}08`, textAlign: "center" }}>{payments[mo] ? <span style={{ color: C.g }}>✅</span> : <span style={{ color: C.r, background: C.rD, padding: "1px 4px", borderRadius: 4 }}>❌</span>}</td>)}
            </tr>)}
            <tr style={{ fontWeight: 800 }}>
              <td style={{ padding: "8px 8px", color: C.t }}>MRR Théorique</td>
              <td style={{ padding: "8px 4px", textAlign: "right", color: C.acc }}>{fmt(mrrTheorique)}€</td>
              {mrrMonths.map(mo => { const real = mrrData.filter(d => d.payments[mo]).reduce((a, d) => a + d.billing, 0); return <td key={mo} style={{ padding: "8px 4px", textAlign: "center", color: real >= mrrTheorique ? C.g : C.r, fontSize: 10 }}>{fmt(real)}€</td>; })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>}
  </div>;
}

/* ============ REPLAY MENSUEL ============ */
export function ReplayMensuel({soc,reps,allM,socBank,clients,ghlData}){
 const[open,setOpen]=useState(false);
 const[slide,setSlide]=useState(0);
 const[confetti,setConfetti]=useState(false);
 const timerRef=useRef(null);
 const cm=curM();const pm=prevM(cm);
 const r=gr(reps,soc?.id,cm);const rp=gr(reps,soc?.id,pm);
 const ca=pf(r?.ca);const prevCa=pf(rp?.ca);const ch=pf(r?.charges);const marge=ca-ch;
 const myCl=(clients||[]).filter(c=>c.socId===soc?.id);
 const activeCl=myCl.filter(c=>c.status==="active");
 const mrr=activeCl.reduce((a,c)=>a+clientMonthlyRevenue(c),0);
 const growth=prevCa>0?Math.round((ca-prevCa)/prevCa*100):0;
 const topClient=activeCl.map(c=>({name:c.name,rev:clientMonthlyRevenue(c)})).sort((a,b)=>b.rev-a.rev)[0];
 const gd=ghlData?.[soc?.id];const leads=pf(r?.leads)||(gd?.ghlClients||[]).length;
 const goalPct=soc?.obj?Math.min(100,Math.round(ca/soc.obj*100)):50;
 const margePct=ca>0?Math.round(marge/ca*100):0;
 const score=Math.min(100,Math.round(goalPct*0.4+Math.min(100,margePct*2)*0.3+(growth>0?Math.min(100,growth*2):0)*0.3));
 const records=useMemo(()=>{
  const recs=[];const allCas=allM.slice(0,-1).map(m=>pf(gr(reps,soc?.id,m)?.ca));const maxPrev=Math.max(0,...allCas);
  if(ca>maxPrev&&maxPrev>0)recs.push(`🏆 Record CA: ${fmt(ca)}€ (ancien: ${fmt(maxPrev)}€)`);
  if(activeCl.length>0){const prevClCounts=allM.slice(0,-1).map(m=>(clients||[]).filter(c=>c.socId===soc?.id&&c.status==="active").length);const maxCl=Math.max(0,...prevClCounts);if(activeCl.length>maxCl&&maxCl>0)recs.push(`👥 Record clients: ${activeCl.length}`);}
  if(mrr>0)recs.push(`💰 MRR record: ${fmt(mrr)}€/mois`);
  return recs;
 },[ca,activeCl,mrr,allM,reps,soc,clients]);
 const proj=project(reps,soc?.id,allM);
 const slides=[
  {title:"📊 Ton mois en chiffres",bg:"linear-gradient(135deg,#1a1a4e,#0a0a2e)",render:()=><div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginTop:20}}>{[{l:"CA",v:fmt(ca)+"€",c:C.g},{l:"Charges",v:fmt(ch)+"€",c:C.r},{l:"Leads",v:String(leads),c:C.b},{l:"Clients",v:String(activeCl.length),c:C.acc}].map((k,i)=><div key={i} style={{textAlign:"center",animation:`celebIn .5s ease ${i*0.1}s both`}}><div style={{fontSize:36,fontWeight:900,color:k.c,fontFamily:FONT_TITLE}}>{k.v}</div><div style={{fontSize:12,color:C.td,marginTop:4}}>{k.l}</div></div>)}</div>},
  {title:"🏆 Ton meilleur client",bg:"linear-gradient(135deg,#2d1a00,#1a0a00)",render:()=><div style={{textAlign:"center",marginTop:30}}>{topClient?<><div style={{fontSize:48,marginBottom:10,animation:"celebIn .5s ease both"}}>🏆</div><div style={{fontSize:24,fontWeight:900,color:C.acc}}>{topClient.name}</div><div style={{fontSize:18,color:C.g,fontWeight:700,marginTop:8}}>{fmt(topClient.rev)}€/mois</div><div style={{marginTop:12,display:"inline-block",padding:"4px 14px",borderRadius:20,background:C.accD,color:C.acc,fontSize:11,fontWeight:700}}>⭐ MVP du mois</div></>:<div style={{color:C.td,fontSize:14}}>Pas encore de client ce mois</div>}</div>},
  {title:"📈 Ta croissance",bg:"linear-gradient(135deg,#001a2d,#000a1a)",render:()=><div style={{textAlign:"center",marginTop:30}}><div style={{fontSize:56,fontWeight:900,color:growth>=0?C.g:C.r,animation:"celebIn .5s ease both"}}>{growth>=0?"+":""}{growth}%</div><div style={{fontSize:13,color:C.td,marginTop:8}}>vs {ml(pm)}</div><div style={{marginTop:16,display:"flex",justifyContent:"center",gap:20}}><div><div style={{fontSize:14,fontWeight:700,color:C.td}}>Avant</div><div style={{fontSize:20,fontWeight:800,color:C.t}}>{fmt(prevCa)}€</div></div><div style={{fontSize:24,color:C.td}}>→</div><div><div style={{fontSize:14,fontWeight:700,color:C.td}}>Maintenant</div><div style={{fontSize:20,fontWeight:800,color:C.g}}>{fmt(ca)}€</div></div></div></div>},
  {title:"🔥 Tes records battus",bg:"linear-gradient(135deg,#2d0a00,#1a0500)",render:()=><div style={{marginTop:20}}>{records.length>0?records.map((r2,i)=><div key={i} style={{padding:"14px 18px",background:"var(--sc-w05)",borderRadius:12,marginBottom:10,fontSize:14,color:C.t,animation:`slideInRight .3s ease ${i*0.1}s both`}}>{r2}</div>):<div style={{textAlign:"center",color:C.td,fontSize:14,marginTop:30}}>Continue comme ça, les records arrivent ! 💪</div>}</div>},
  {title:"⭐ Score du mois",bg:"linear-gradient(135deg,#1a0a2d,#0a051a)",render:()=>{
   if(score>80&&!confetti)setConfetti(true);
   return <div style={{textAlign:"center",marginTop:20}}><svg width="160" height="160" viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" fill="none" stroke={C.brd} strokeWidth="8"/><circle cx="80" cy="80" r="70" fill="none" stroke={score>=80?C.g:score>=50?C.acc:C.r} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${score/100*440} 440`} transform="rotate(-90 80 80)" style={{transition:"stroke-dasharray 1.5s ease"}}/><text x="80" y="75" textAnchor="middle" fill={C.t} fontSize="36" fontWeight="900" fontFamily={FONT_TITLE}>{score}</text><text x="80" y="95" textAnchor="middle" fill={C.td} fontSize="11">/100</text></svg><div style={{marginTop:12,fontSize:14,color:score>=80?C.g:score>=50?C.acc:C.r,fontWeight:700}}>{score>=80?"🔥 Exceptionnel !":score>=60?"👍 Bon mois !":score>=40?"📊 Peut mieux faire":"⚠️ Mois difficile"}</div></div>;
  }},
  {title:"🚀 Objectif prochain mois",bg:"linear-gradient(135deg,#0a1a0a,#051a05)",render:()=><div style={{textAlign:"center",marginTop:30}}>{proj?<><div style={{fontSize:32,fontWeight:900,color:C.acc,animation:"celebIn .5s ease both"}}>{fmt(proj[0])}€</div><div style={{fontSize:12,color:C.td,marginTop:6}}>Projection {ml(nextM(cm))}</div><div style={{marginTop:20,padding:"12px 20px",background:"rgba(255,170,0,.08)",borderRadius:12,display:"inline-block"}}><div style={{fontSize:11,color:C.acc,fontWeight:700}}>🎯 Si tu maintiens le rythme :</div><div style={{fontSize:11,color:C.td,marginTop:4}}>T+2: {fmt(proj[1])}€ · T+3: {fmt(proj[2])}€</div></div></>:<div style={{color:C.td}}>Pas assez de données pour projeter</div>}</div>}
 ];
 const TOTAL=slides.length;
 useEffect(()=>{if(!open)return;timerRef.current=setInterval(()=>setSlide(p=>(p+1)%TOTAL),3000);return()=>clearInterval(timerRef.current);},[open]);
 const copyShare=()=>{const txt=`📊 Replay ${soc?.nom} — ${ml(cm)}\nCA: ${fmt(ca)}€ | Marge: ${fmt(marge)}€ (${margePct}%)\nClients: ${activeCl.length} | MRR: ${fmt(mrr)}€\nCroissance: ${growth>=0?"+":""}${growth}%\nScore: ${score}/100`;navigator.clipboard?.writeText(txt);};
 if(!open)return <button onClick={()=>{setOpen(true);setSlide(0);setConfetti(false);}} style={{padding:"8px 16px",borderRadius:10,border:`1px solid ${C.acc}44`,background:C.accD,color:C.acc,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:6}}>🎬 Replay du mois</button>;
 return <div style={{position:"fixed",inset:0,zIndex:9999,background:"#06060b",fontFamily:FONT,display:"flex",flexDirection:"column",animation:"fi .3s ease"}}>
  {confetti&&<div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:10}}>{Array.from({length:40}).map((_,i)=><div key={i} style={{position:"absolute",left:`${Math.random()*100}%`,top:-20,width:8,height:8,borderRadius:i%2?4:0,background:["#FFAA00","#34d399","#f87171","#60a5fa","#a78bfa","#fb923c"][i%6],animation:`confetti ${2+Math.random()*2}s ease ${Math.random()}s both`}}/>)}</div>}
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 24px"}}>
   <div style={{display:"flex",gap:6}}>{slides.map((_,i)=><div key={i} onClick={()=>{clearInterval(timerRef.current);setSlide(i);}} style={{width:i===slide?24:8,height:8,borderRadius:4,background:i===slide?C.acc:C.brd,cursor:"pointer",transition:"all .3s"}}/>)}</div>
   <div style={{display:"flex",gap:8}}>
    <button onClick={copyShare} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${C.brd}`,background:"transparent",color:C.t,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>📋 Partager</button>
    <button onClick={()=>setOpen(false)} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${C.brd}`,background:"transparent",color:C.t,fontSize:11,cursor:"pointer",fontFamily:FONT}}>✕ Fermer</button>
   </div>
  </div>
  <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
   <div key={slide} style={{width:"100%",maxWidth:500,padding:40,borderRadius:24,background:slides[slide].bg,border:"1px solid var(--sc-w08)",backdropFilter:"blur(20px)",animation:"celebIn .4s ease both"}}>
    <div style={{textAlign:"center",fontSize:22,fontWeight:800,color:C.t,marginBottom:8,fontFamily:FONT_TITLE}}>{slides[slide].title}</div>
    {slides[slide].render()}
   </div>
  </div>
  <div style={{display:"flex",justifyContent:"center",gap:12,padding:"16px 24px"}}>
   <button onClick={()=>{clearInterval(timerRef.current);setSlide(p=>Math.max(0,p-1));}} disabled={slide===0} style={{padding:"8px 20px",borderRadius:10,border:`1px solid ${C.brd}`,background:"transparent",color:slide===0?C.tm:C.t,fontSize:12,cursor:slide===0?"default":"pointer",fontFamily:FONT}}>← Précédent</button>
   <button onClick={()=>{clearInterval(timerRef.current);setSlide(p=>Math.min(TOTAL-1,p+1));}} disabled={slide===TOTAL-1} style={{padding:"8px 20px",borderRadius:10,border:`1px solid ${C.acc}44`,background:C.accD,color:C.acc,fontSize:12,cursor:slide===TOTAL-1?"default":"pointer",fontFamily:FONT}}>Suivant →</button>
  </div>
 </div>;
}

/* ============ PREDICTIONS & SCORING ============ */
