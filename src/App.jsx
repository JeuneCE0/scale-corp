import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment, Suspense, lazy } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import * as U from "./utils/index.jsx";
const { C, C_DARK, C_LIGHT, getTheme, applyTheme, MN, curM, ml, fmt, fK, pct, clamp, prevM, nextM, pf, gr, FONT, FONT_TITLE, BF, deadline, qOf, qMonths, qLabel, ago, uid, curW, MOODS, sinceLbl, sinceMonths, CSS, DS, DH, DEAL_STAGES, DEMO_JOURNAL, DEMO_ACTIONS, DEMO_PULSES, DEMO_DEALS, DEMO_OKRS, DEMO_SYNERGIES, DEMO_SUBS, DEMO_TEAM, DEMO_CLIENTS, SYN_TYPES, SYN_STATUS, SUB_CATS, SLACK_MODES, EXCLUDED_ACCOUNTS, CURR_SYMBOLS, REV_ENVS, GHL_BASE, STRIPE_PROXY, STORE_URL, ErrorBoundary, mkPrefill, autoGenerateReport, autoCategorize, autoDetectSubscriptions, subMonthly, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, generateInvoices, refreshInvoiceStatuses, ghlCreateInvoice, ghlSendInvoice, mkDemoInvoices, teamMonthly, normalizeStr, fuzzyMatch, matchSubsToRevolut, deduplicatedCharges, mkGHLDemo, ghlUpdateContact, ghlCreateContact, fetchGHL, syncGHLForSoc, slackWebhookSend, slackBotSend, slackSend, slackMention, buildPulseSlackMsg, buildReportSlackMsg, buildReminderSlackMsg, buildValidationSlackMsg, checkAndSendReminders, fetchStripe, syncStripeData, getStripeChargesForClient, getStripeTotal, mkRevolutDemo, fetchRevolut, syncRevolut, mkSocRevDemo, syncSocRevolut, revFinancials, storeCall, sbAuthHeaders, sbUpsert, sbGet, sbList, sGet, sSet, syncFromSupabase, fetchHoldingFromSB, fetchSocietiesFromSB, calcH, simH, healthScore, leadScore, leadScoreColor, leadScoreLabel, qCA, getAlerts, buildFeed, project, runway, calcLeaderboard, buildAIContext, calcMilestoneData, calcMilestones, calcSmartAlerts, genInsights, calcBenchmark, getPlaybooks, calcClientHealthScore, genPorteurNotifications, BILL_TYPES, CLIENT_STATUS, curQ, AUTO_CAT_MAP, categorizeTransaction, DEMO_KB, cachedSyncGHLForSoc, cachedSyncRevolut, cachedSyncSocRevolut, cachedSyncStripeData, cacheInvalidate } = U;
import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "./components/ui.jsx";
import { MilestonesWall, MilestonesCompact, MilestoneCount, AICoPilot, PulseForm, PulseOverview, BankingPanel, BankingTransactions, TabCRM, SocBankWidget, SynergiesPanel, KnowledgeBase, RiskMatrix, GamificationPanel, InboxUnifiee, ParcoursClientVisuel, BenchmarkRadar, SmartAlertsPanel, SubsTeamPanel, SubsTeamBadge, ChallengesPanel, AIWeeklyCoach, RapportsPanel, DealFlow, MeetingMode, CohortAnalysis, CHALLENGE_TEMPLATES } from "./components/features.jsx";
import { Sidebar, OnboardingWizard, TutorialOverlay, ObInp, ObTextArea, ObSelect, ObCheck, ObTag } from "./components/navigation.jsx";
import { SocieteView, ValRow, TabSimulateur } from "./views/SocieteView.jsx";
// AdminComponents is lazy-loaded for code splitting
const LazyAdminClientsTab = lazy(() => import("./views/AdminComponents.jsx").then(m => ({ default: m.AdminClientsTab })));
const LazyWidgetEmbed = lazy(() => import("./views/AdminComponents.jsx").then(m => ({ default: m.WidgetEmbed })));
const LazyWidgetCard = lazy(() => import("./views/AdminComponents.jsx").then(m => ({ default: m.WidgetCard })));
import { LeaderboardCard, PulseDashWidget } from "./views/PorteurDashboard.jsx";
import { UserAccessPanel, AnalytiqueTab } from "./views/UserAccess.jsx";
import { useToast } from "./components/Toast.jsx";
import PorteurOnboarding from "./components/PorteurOnboarding.jsx";

// Lazy-loaded heavy views
const LazyPulseScreen = lazy(() => import("./views/AdminComponents.jsx").then(m => ({ default: m.PulseScreen })));
const LazyWidgetRenderer = lazy(() => import("./views/AdminComponents.jsx").then(m => ({ default: m.WidgetRenderer })));
const LazyWarRoomReadOnly = lazy(() => import("./views/AdminComponents.jsx").then(m => ({ default: m.WarRoomReadOnly })));
const LazyClientPortal = lazy(() => import("./views/AdminComponents.jsx").then(m => ({ default: m.ClientPortal })));
const LazyInvestorBoard = lazy(() => import("./views/AdminComponents.jsx").then(m => ({ default: m.InvestorBoard })));
const LazyWarRoom = lazy(() => import("./views/AdminComponents.jsx").then(m => ({ default: m.WarRoom })));
const LazySynergiesAutoPanel = lazy(() => import("./views/AdminComponents.jsx").then(m => ({ default: m.SynergiesAutoPanel })));
const LazyAutoPilotSection = lazy(() => import("./views/AdminComponents.jsx").then(m => ({ default: m.AutoPilotSection })));
const LazyLiveFeed = lazy(() => import("./views/AdminComponents.jsx").then(m => ({ default: m.LiveFeed })));
const LazyReplayMensuel = lazy(() => import("./views/AdminComponents.jsx").then(m => ({ default: m.ReplayMensuel })));
const LazyPredictionsCard = lazy(() => import("./views/AdminComponents.jsx").then(m => ({ default: m.PredictionsCard })));

// Loading spinner for lazy-loaded views
function GlassSpinner() {
  return <div className="glass-bg" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
    <div style={{textAlign:"center"}}>
      <div style={{width:40,height:40,border:"3px solid rgba(255,255,255,.06)",borderTopColor:C.acc,borderRadius:"50%",animation:"sp 1s linear infinite",boxShadow:"0 0 20px rgba(255,170,0,.15)",margin:"0 auto 12px"}}/>
      <div style={{color:C.td,fontSize:11,letterSpacing:.5}}>Chargement...</div>
    </div>
  </div>;
}

const SB_ADMIN=[
 {id:"dash",icon:"◉",label:"Dashboard",tab:0,accent:C.acc},
 {id:"societes",icon:"🏢",label:"Sociétés",tab:1,accent:C.b},
 {id:"finances",icon:"💰",label:"Finances",tab:2,accent:C.g},
 {id:"clients",icon:"👥",label:"Clients",tab:3,accent:C.o},
 {id:"sales",icon:"📞",label:"Sales",tab:15,accent:"#34d399"},
 {id:"pub",icon:"📣",label:"Publicité",tab:16,accent:"#f472b6"},
 {id:"rapports",icon:"📋",label:"Rapports",tab:17,accent:C.v},
 {id:"access",icon:"🔐",label:"Accès",tab:14,accent:"#f59e0b"},
 {id:"params",icon:"⚙️",label:"Paramètres",tab:18,accent:C.td},
 {id:"pulse",icon:"⚡",label:"PULSE",tab:99,accent:"#FFAA00"},
];

const SB_PORTEUR=[
 {id:"dashboard",icon:"📊",label:"Dashboard",tab:0,accent:C.acc},
 {id:"activite",icon:"⚡",label:"Activité",tab:1,accent:C.b},
 {id:"sales",icon:"📞",label:"Sales",tab:2,accent:"#34d399"},
 {id:"publicite",icon:"📣",label:"Publicité",tab:3,accent:"#f472b6"},
 {id:"clients",icon:"👥",label:"Clients",tab:9,accent:C.o},
 {id:"bank",icon:"🏦",label:"Banque",tab:5,accent:C.g},
 {id:"rapports",icon:"📋",label:"Rapports",tab:13,accent:C.v},
 {id:"settings",icon:"⚙️",label:"Paramètres",tab:12,accent:C.td},
];


const TOUR_ADMIN=[
 {target:"admin-nav",tab:0,title:"Navigation",icon:"🧭",desc:"La sidebar à gauche organise la plateforme en 6 sections clés : Dashboard, Portfolio, Finance, Commercial, AI Copilot et Ressources. Cliquez sur une section pour déplier ses sous-modules. Tout est accessible en un clic.",pos:"right",highlight:C.acc},
 {target:"admin-kpis",tab:0,title:"KPIs en temps réel",icon:"💰",desc:"Vue instantanée de la santé financière du groupe. CA total, marge nette, rémunération des fondateurs, disponible et trésorerie. Ces chiffres se recalculent automatiquement à chaque rapport soumis par une société.",pos:"bottom",highlight:C.acc},
 {target:"admin-alerts",tab:0,title:"Alertes intelligentes",icon:"🔔",desc:"Le système détecte automatiquement les risques : rapports en retard, trésorerie basse, chute de CA, actions non terminées. Chaque alerte est priorisée par criticité (danger, warning, info).",pos:"bottom",highlight:C.o},
 {target:"admin-feed",tab:0,title:"Fil d'activité",icon:"⚡",desc:"Chronologie des dernières actions du portfolio : rapports soumis, pulse check-ins, milestones débloqués. Gardez un œil sur l'activité sans vérifier chaque société.",pos:"right",highlight:C.b},
 {target:"admin-leaderboard",tab:0,title:"Classement & grades",icon:"🏆",desc:"Les sociétés sont classées par score composite (CA, croissance, rentabilité, engagement). Le grade A à F donne un aperçu instantané. Cliquez pour accéder au détail.",pos:"left",highlight:C.acc},
 {target:"admin-okr-actions",tab:0,title:"OKRs & Actions",icon:"🎯",desc:"À gauche : progression des objectifs trimestriels (OKR) avec barres d'avancement auto-synchro. À droite : actions prioritaires ouvertes avec détection des retards.",pos:"top",highlight:C.g},
 {target:"admin-portfolio",tab:0,title:"Cartes Portfolio",icon:"📋",desc:"Chaque carte = une société active. CA, trésorerie, grade santé, milestones débloqués, runway estimé. Les données viennent des rapports mensuels et des connexions bancaires.",pos:"top",highlight:C.v},
 {target:"admin-milestones",tab:0,title:"Milestones",icon:"🏅",desc:"Progression de chaque société vers ses trophées : clubs CA (1K, 5K, 10K…), streaks de croissance, ancienneté, rentabilité. Le système débloque automatiquement les achievements.",pos:"top",highlight:C.acc},
 {target:"admin-tab-1",tab:1,title:"Sociétés",icon:"📋",desc:"Dans la section Portfolio : ajoutez, modifiez et suivez chaque société incubée. PIN d'accès, couleur, porteur, objectifs, intégrations API. C'est le cœur de configuration de l'incubateur.",pos:"right",highlight:C.b},
 {target:"admin-tab-2",tab:2,title:"Analytique",icon:"📊",desc:"Section Portfolio > Analytique : comparez les performances entre sociétés avec des graphiques interactifs. Répartition du CA, évolution mensuelle, matrice de risque.",pos:"right",highlight:C.v},
 {target:"admin-tab-5",tab:5,title:"AI Copilot",icon:"🤖",desc:"Votre assistant IA dédié. Posez n'importe quelle question sur votre portfolio : analyses, comparaisons, recommandations. Il a accès à toutes vos données en temps réel.",pos:"right",highlight:"#a78bfa"},
 {target:"admin-tab-6",tab:6,title:"Pipeline",icon:"◎",desc:"Section Commercial > Pipeline : gérez les nouveaux projets de l'idée à la signature. 4 étapes : Idée, Évaluation, Due Diligence, Signé.",pos:"right",highlight:C.b},
 {target:"admin-tab-10",tab:10,title:"Synergies",icon:"🤝",desc:"Section Commercial > Synergies : cartographiez les referrals et collaborations entre sociétés. Suivez le CA généré par les synergies internes.",pos:"right",highlight:C.v},
 {target:"admin-tab-13",tab:13,title:"Charges & Équipe",icon:"🔄",desc:"Section Finance > Charges : centralisez abonnements et membres d'équipe de chaque société. Coût mensuel total, répartition par catégorie.",pos:"right",highlight:C.r},
];

const TOUR_PORTEUR=[
 {target:"porteur-nav",tab:10,title:"Votre espace",icon:"🧭",desc:"La sidebar organise vos modules : Accueil (vue d'ensemble), Rapport, Performance, Suivi, Banque, Clients et Ressources.",pos:"right",highlight:C.acc},
 {target:"porteur-tab-10",tab:10,title:"Accueil",icon:"◉",desc:"Votre tableau de bord personnel : nudges d'actions à faire, KPIs du mois, évolution du CA, trophées et activité récente. Tout en un coup d'œil.",pos:"right",highlight:C.acc},
 {target:"porteur-tab-0",tab:0,title:"Rapport mensuel",icon:"📊",desc:"Renseignez CA, charges, clients et trésorerie chaque mois. Les champs avancés (détail charges, funnel, pub) sont dans des sections dépliables.",pos:"right",highlight:C.o},
 {target:"porteur-tab-1",tab:1,title:"Statistiques",icon:"📈",desc:"Performance > Stats : KPIs, score de santé A-F, graphes CA/marge. Les détails (finances, prévisions, funnel) se déplient à la demande.",pos:"right",highlight:C.g},
 {target:"porteur-tab-2",tab:2,title:"Activité",icon:"✅",desc:"Suivi > Activité : vos actions à faire, journal stratégique et historique fusionnés en un seul fil chronologique.",pos:"right",highlight:C.b},
 {target:"porteur-tab-4",tab:4,title:"Pulse hebdomadaire",icon:"💓",desc:"Suivi > Pulse : mood, victoire, blocage et confiance chaque semaine. Signal rapide pour Scale Corp.",pos:"right",highlight:C.o},
 {target:"porteur-tab-6",tab:6,title:"Milestones",icon:"🏆",desc:"Performance > Milestones : achievements automatiques, 5 tiers de Bronze à Diamant.",pos:"right",highlight:C.acc},
 {target:"porteur-tab-9",tab:9,title:"Gestion Clients",icon:"👥",desc:"Portefeuille clients : statuts, historique, facturation. Gérez le cycle de vie client.",pos:"right",highlight:C.o},
];


export default function App(){
 const toast=useToast();
 const[loaded,setLoaded]=useState(false);const[role,setRole]=useState(null);const[theme,setThemeState]=useState(getTheme);
 const toggleTheme=useCallback(()=>{const t=getTheme()==="dark"?"light":"dark";applyTheme(t);setThemeState(t);},[]);
 
 const[socs,setSocs]=useState([]);const[reps,setReps]=useState({});const[hold,setHold]=useState(DH);
 const[actions,setActions]=useState([]);const[journal,setJournal]=useState({});
 const[pulses,setPulses]=useState({});const[deals,setDeals]=useState([]);const[ghlData,setGhlData]=useState({});const[revData,setRevData]=useState(null);const[socBank,setSocBank]=useState({});const[stripeData,setStripeData]=useState(null);
 const[okrs,setOkrs]=useState([]);const[synergies,setSynergies]=useState([]);const[kb,setKb]=useState([]);const[challenges,setChallenges]=useState([]);
 const[subs,setSubs]=useState([]);const[team,setTeam]=useState([]);const[clients,setClients]=useState([]);const[invoices,setInvoices]=useState([]);
 const[pin,setPin]=useState("");const[lErr,setLErr]=useState("");const[shake,setShake]=useState(false);
 const[loginMode,setLoginMode]=useState("email");const[loginEmail,setLoginEmail]=useState("");const[loginPass,setLoginPass]=useState("");const[authUser,setAuthUser]=useState(null);const[authLoading,setAuthLoading]=useState(false);
 const[tab,setTab]=useState(0);const[eSoc,setESoc]=useState(null);const[eHold,setEHold]=useState(false);
 const[deferredPrompt,setDeferredPrompt]=useState(null);
 useEffect(()=>{const h=e=>{e.preventDefault();setDeferredPrompt(e);window.__pwaPrompt=e;};window.addEventListener("beforeinstallprompt",h);return()=>window.removeEventListener("beforeinstallprompt",h);},[]);
 const[saving,setSaving]=useState(false);const[meeting,setMeeting]=useState(false);const[adminSocView,setAdminSocView]=useState(null);
 const[newActSoc,setNewActSoc]=useState("");const[newActText,setNewActText]=useState("");const[showPulse,setShowPulse]=useState(false);
 useEffect(()=>{if(tab===99){setShowPulse(true);setTab(0);}},[tab]);
 // Admin keyboard shortcuts
 useEffect(()=>{const h=e=>{if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"||e.target.tagName==="SELECT"||e.target.isContentEditable)return;const tabMap={"1":0,"2":1,"3":2,"4":3,"5":15,"6":16,"7":17,"8":14};if(tabMap[e.key]!==undefined)setTab(tabMap[e.key]);if(e.key==="p"||e.key==="P")setShowPulse(true);};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[]);
 const[onboarded,setOnboarded]=useState(true);const[showTour,setShowTour]=useState(false);const[obData,setObData]=useState(null);const[showOnboarding,setShowOnboarding]=useState(false);
 const[porteurOnboarded,setPorteurOnboarded]=useState(()=>{try{if(!role||role==="admin")return true;return!!JSON.parse(localStorage.getItem(`scPorteurOnboarded_${role}`));}catch{return false;}});
 useEffect(()=>{(async()=>{try{const[s,r,h,a,j,p,d,g,rv,sb,ok,sy,kk,ch,su,tm,cl,iv]=await Promise.all([sGet("scAs"),sGet("scAr"),sGet("scAh"),sGet("scAa"),sGet("scAj"),sGet("scAp"),sGet("scAd"),sGet("scAg"),sGet("scAv"),sGet("scAb"),sGet("scAo"),sGet("scAy"),sGet("scAk"),sGet("scAc"),sGet("scAu"),sGet("scAt"),sGet("scAcl"),sGet("scAiv")]);
   // Try Supabase for holding & societies (override localStorage if available)
   let finalSocs=s||DS,finalHold=h||DH;
   try{const[sbHold,sbSocs]=await Promise.all([fetchHoldingFromSB(),fetchSocietiesFromSB()]);
   if(sbHold){finalHold=sbHold;localStorage.setItem("scAh",JSON.stringify(sbHold));}
   if(sbSocs&&sbSocs.length>0){const sbMap=Object.fromEntries(sbSocs.map(x=>[x.id,x]));finalSocs=(s||DS).map(sc=>sbMap[sc.id]?{...sc,...sbMap[sc.id]}:sc);const newIds=sbSocs.filter(x=>!(s||DS).find(d=>d.id===x.id));if(newIds.length)finalSocs=[...finalSocs,...newIds];localStorage.setItem("scAs",JSON.stringify(finalSocs));}}catch{}
   setSocs(finalSocs);setReps(r||mkPrefill());setHold(finalHold);setActions(a||DEMO_ACTIONS);setJournal(j||DEMO_JOURNAL);setPulses(p||DEMO_PULSES);setDeals(d||DEMO_DEALS);setGhlData(g||{});setRevData(rv||null);setSocBank(sb||{});setOkrs(ok||DEMO_OKRS);setSynergies(sy||DEMO_SYNERGIES);setKb(kk||DEMO_KB);setChallenges(ch||[]);setSubs(su||DEMO_SUBS);setTeam(tm||DEMO_TEAM);setClients(cl||DEMO_CLIENTS);setInvoices(iv||mkDemoInvoices(cl||DEMO_CLIENTS,finalSocs));}catch{setSocs(DS);setReps(mkPrefill());setHold(DH);setActions(DEMO_ACTIONS);setJournal(DEMO_JOURNAL);setPulses(DEMO_PULSES);setDeals(DEMO_DEALS);setOkrs(DEMO_OKRS);setSynergies(DEMO_SYNERGIES);setKb(DEMO_KB);setSubs(DEMO_SUBS);setTeam(DEMO_TEAM);setClients(DEMO_CLIENTS);setInvoices(mkDemoInvoices(DEMO_CLIENTS,DS));}
   try{const obStatus=await sGet("scOnboarded");const obD=await sGet("scObData");setOnboarded(!!obStatus);setObData(obD||null);
   // Check porteur-specific onboarding for all societies
   const allSocs=(s||DS);for(const sc of allSocs){const pOb=await sGet(`scPorteurOnboarded_${sc.id}`);if(!pOb){/* will be checked per-society at render */}}
   }catch{setOnboarded(false);}
   setLoaded(true);
   // Session persistence: check stored auth token
   try{const tk=localStorage.getItem("sc_auth_token");if(tk){fetch("/api/auth?action=me",{headers:{Authorization:"Bearer "+tk}}).then(r2=>r2.ok?r2.json():null).then(u=>{if(u&&u.id){setAuthUser(u);const meta=u.user_metadata||{};if(meta.role==="admin"){setRole("admin");_storeToken="auth";_currentSocId="admin";syncFromSupabase("admin").catch(()=>{});}else if(meta.society_id){setRole(meta.society_id);_storeToken="auth";_currentSocId=meta.society_id;syncFromSupabase(meta.society_id).catch(()=>{});}}}).catch(()=>{});}}catch{}
   })();},[]);
 const save=useCallback(async(ns,nr,nh)=>{setSaving(true);try{if(ns!=null){setSocs(ns);await sSet("scAs",ns);(ns||[]).forEach(s=>sbUpsert('societies',{id:s.id,...s}));}if(nr!=null){setReps(nr);await sSet("scAr",nr);}if(nh!=null){setHold(nh);await sSet("scAh",nh);sbUpsert('holding',{id:'main',config:nh});}}catch{}setSaving(false);},[]);
 const saveAJ=useCallback(async(na,nj)=>{try{if(na!=null){setActions(na);await sSet("scAa",na);}if(nj!=null){setJournal(nj);await sSet("scAj",nj);}}catch{}},[]);
 const savePulse=useCallback(async(k,v)=>{const np={...pulses,[k]:v};setPulses(np);await sSet("scAp",np);},[pulses]);
 const saveDeals=useCallback(async(nd)=>{setDeals(nd);await sSet("scAd",nd);},[]);
 const saveOkrs=useCallback(async(no)=>{setOkrs(no);await sSet("scAo",no);},[]);
 const saveSynergies=useCallback(async(ns)=>{setSynergies(ns);await sSet("scAy",ns);},[]);
 const saveKb=useCallback(async(nk)=>{setKb(nk);await sSet("scAk",nk);},[]);
 const saveChallenges=useCallback(async(nc)=>{setChallenges(nc);await sSet("scAc",nc);},[]);
 const saveSubs=useCallback(async(ns)=>{setSubs(ns);await sSet("scAu",ns);},[]);
 const saveTeam=useCallback(async(nt)=>{setTeam(nt);await sSet("scAt",nt);},[]);
 const saveClients=useCallback(async(nc)=>{setClients(nc);await sSet("scAcl",nc);},[]);
 const saveInvoices=useCallback(async(ni)=>{setInvoices(ni);await sSet("scAiv",ni);},[]);
 const syncGHL=useCallback(async()=>{
  const hasKeys=socs.some(s=>s.ghlLocationId||s.ghlKey);
  let newData={};
  if(hasKeys){
   for(const s of socs.filter(x=>x.ghlLocationId||x.ghlKey)){
    const d=await cachedSyncGHLForSoc(s);
    if(d)newData[s.id]=d;
   }
  }
  const demo=mkGHLDemo(socs);
  socs.filter(s=>s.stat==="active"&&s.id!=="eco").forEach(s=>{
   if(!newData[s.id])newData[s.id]=demo[s.id];
  });
  setGhlData(newData);await sSet("scAg",newData);
  // Merge GHL contacts into clients state
  const ghlSocIds=Object.keys(newData).filter(sid=>newData[sid].ghlClients?.length>0);
  if(ghlSocIds.length>0){
   setClients(prev=>{
    // Remove old ghl_ clients for these socs, keep manual ones
    const kept=prev.filter(c=>!(ghlSocIds.includes(c.socId)&&c.id.startsWith("ghl_")));
    const newCl=ghlSocIds.flatMap(sid=>newData[sid].ghlClients);
    const merged=[...kept,...newCl];
    sSet("scAcl",merged);return merged;
   });
  }
 },[socs]);
 // Auto-sync GHL every 30s + on mount
 useEffect(()=>{
  if(!loaded)return;
  const doSync=()=>{syncGHL().catch(e=>{console.warn("Auto-sync GHL failed:",e);toast?.warning("Sync GHL échouée. Les données affichées peuvent être obsolètes.");});};
  doSync();
  const id=setInterval(doSync,30000);
  return()=>clearInterval(id);
 },[loaded,syncGHL]);
 const syncRev=useCallback(async()=>{
  let data=null;
  data=await cachedSyncRevolut("eco");
  if(!data)data=mkRevolutDemo();
  setRevData(data);await sSet("scAv",data);
 },[]);
 const syncSocBank=useCallback(async(socId)=>{
  const s=socs.find(x=>x.id===socId);if(!s)return;
  let data=null;
  if(s.revolutCompany){data=await cachedSyncSocRevolut(s);}
  if(!data)data=mkSocRevDemo(s);
  const nb={...socBank,[socId]:data};setSocBank(nb);await sSet("scAb",nb);
 },[socs,socBank]);
 const syncAllSocBanks=useCallback(async()=>{
  const nb={};
  for(const s of socs.filter(x=>["active","lancement"].includes(x.stat)&&x.id!=="eco")){
   let data=null;
   if(s.revolutCompany){data=await cachedSyncSocRevolut(s);}
   if(!data)data=mkSocRevDemo(s);
   nb[s.id]=data;
  }
  setSocBank(nb);await sSet("scAb",nb);
 },[socs]);
 useEffect(()=>{
  if(!loaded)return;
  const doSync=async()=>{try{await syncRev();await syncAllSocBanks();const sd=await cachedSyncStripeData();if(sd)setStripeData(sd);}catch(e){console.warn("Auto-sync failed:",e);toast?.warning("Sync bancaire/Stripe échouée. Données potentiellement obsolètes.");}};
  doSync();
  const id=setInterval(doSync,60000);
  return()=>clearInterval(id);
 },[loaded,syncRev,syncAllSocBanks]);
 // Auto-generate reports for current month when socBank/ghlData change
 useEffect(()=>{
  if(!loaded||!socs.length)return;
  const cM=curM();
  let updated=false;const nr={...reps};
  socs.filter(s=>["active","lancement"].includes(s.stat)&&s.id!=="eco"&&(s.ghlLocationId||s.revolutCompany)).forEach(s=>{
   const key=`${s.id}_${cM}`;const existing=nr[key];
   if(existing?.ok===true)return;// never overwrite validated
   const hasBankData=socBank?.[s.id]?.monthly?.[cM];
   const hasGhlData=ghlData?.[s.id];
   if(!hasBankData&&!hasGhlData)return;
   const auto=autoGenerateReport(s.id,cM,socBank,ghlData,subs);
   if(existing){// preserve manual edits on non-empty fields, but update auto fields
    nr[key]={...auto,...Object.fromEntries(Object.entries(existing).filter(([k,v])=>v!==""&&v!==0&&v!=="0"&&k!=="notes"&&k!=="_auto"&&k!=="at")),_auto:true,at:new Date().toISOString()};
   }else{nr[key]=auto;}
   updated=true;
  });
  if(updated){setReps(nr);sSet("scAr",nr);}
 },[loaded,socs,socBank,ghlData,subs]);
 const allM=useMemo(()=>{const ks=[...new Set(Object.keys(reps).map(k=>k.split("_").slice(1).join("_")))].sort();const c=curM();if(!ks.includes(c))ks.push(c);return ks.slice(-12);},[reps]);
 const alerts=useMemo(()=>socs.length?getAlerts(socs,reps,hold):[]  ,[socs,reps,hold]);
 const feed=useMemo(()=>buildFeed(socs,reps,actions,pulses),[socs,reps,actions,pulses]);
 const leaderboard=useMemo(()=>calcLeaderboard(socs,reps,actions,pulses,allM),[socs,reps,actions,pulses,allM]);
 const cM2=curM(),actS=socs.filter(s=>s.stat==="active");
 const smartAlerts=useMemo(()=>calcSmartAlerts(socs,reps,actions,pulses,allM,socBank,ghlData),[socs,reps,actions,pulses,allM,socBank,ghlData]);
 // Dynamic favicon title
 useEffect(()=>{document.title=smartAlerts.length>0?`(${smartAlerts.length}) L'Incubateur ECS`:"L'Incubateur ECS";},[smartAlerts.length]);
 // "What you missed" recap on login
 const[missedRecap,setMissedRecap]=useState(null);
 useEffect(()=>{if(!role)return;const key="sc_last_login_"+role;const lastTs=localStorage.getItem(key);const now=Date.now();localStorage.setItem(key,String(now));if(!lastTs)return;const since=parseInt(lastTs);const elapsed=now-since;if(elapsed<60000)return;// Skip if <1min
  const events=[];const sinceDate=new Date(since);
  // Bank events
  (socs||[]).forEach(s=>{const txs=(socBank?.[s.id]?.transactions||[]).filter(tx=>{const d=new Date(tx.created_at||tx.createdAt||0);return d>sinceDate;});txs.forEach(tx=>{const leg=tx.legs?.[0];const amt=pf(leg?.amount||tx?.amount);const desc=leg?.description||tx?.reference||"Transaction";events.push({type:amt>0?"💰":"📤",text:`${s.nom||s.name||"?"} : ${desc}`,value:amt?`${amt>0?"+":""}${fmt(amt)}€`:"",ts:tx.created_at||tx.createdAt,color:amt>0?"#34d399":"#f87171"});});});
  // GHL events
  (socs||[]).forEach(s=>{const g=ghlData?.[s.id];(g?.opportunities||[]).forEach(o=>{const d=new Date(o.updatedAt||o.createdAt||0);if(d<=sinceDate)return;if(o.status==="won")events.push({type:"✅",text:`${s.nom||s.name} : Deal gagné - ${o.contact?.name||o.name||""}`,value:o.value?`${fmt(pf(o.value))}€`:"",ts:o.updatedAt||o.createdAt,color:"#34d399"});else if(o.status==="lost")events.push({type:"❌",text:`${s.nom||s.name} : Deal perdu - ${o.contact?.name||o.name||""}`,ts:o.updatedAt||o.createdAt,color:"#f87171"});else events.push({type:"👤",text:`${s.nom||s.name} : Nouveau prospect - ${o.contact?.name||o.name||""}`,ts:o.dateAdded||o.createdAt,color:"#60a5fa"});});(g?.calendarEvents||[]).filter(e=>new Date(e.startTime||0)>sinceDate).forEach(e=>{events.push({type:"📞",text:`${s.nom||s.name} : ${e.title||e.contactName||"Appel"}`,ts:e.startTime,color:"#a78bfa"});});});
  events.sort((a,b)=>new Date(b.ts||0)-new Date(a.ts||0));
  const hrs=Math.round(elapsed/3600000);const mins=Math.round(elapsed/60000);
  const absentLabel=hrs>=24?`${Math.round(hrs/24)}j`:hrs>=1?`${hrs}h`:`${mins}min`;
  if(events.length>0)setMissedRecap({events:events.slice(0,20),total:events.length,absent:absentLabel});
 },[role]);
 const loginEmail2=useCallback(async()=>{if(!loginEmail.trim()||!loginPass.trim()){setLErr("Email et mot de passe requis");return;}setAuthLoading(true);setLErr("");try{const r=await fetch("/api/auth?action=login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:loginEmail.trim(),password:loginPass})});const d=await r.json();if(!r.ok){setLErr(d.error_description||d.msg||d.error||"Identifiants incorrects");setShake(true);setTimeout(()=>setShake(false),500);return;}localStorage.setItem("sc_auth_token",d.access_token);if(d.refresh_token)localStorage.setItem("sc_auth_refresh",d.refresh_token);setAuthUser(d.user);const meta=d.user?.user_metadata||{};const rid=meta.role==="admin"?"admin":(meta.society_id||"admin");setRole(rid);setLErr("");_storeToken="auth";_currentSocId=rid;localStorage.setItem("sc_store_token","auth");if(!onboarded)setShowTour(true);if(rid!=="admin"){try{setPorteurOnboarded(!!JSON.parse(localStorage.getItem(`scPorteurOnboarded_${rid}`)));}catch{setPorteurOnboarded(false);}}syncFromSupabase(rid).then(()=>{}).catch(()=>{});}catch(e){setLErr("Erreur de connexion");setShake(true);setTimeout(()=>setShake(false),500);}finally{setAuthLoading(false);}},[loginEmail,loginPass,onboarded]);
 const login=useCallback(async()=>{async function hashPin(p){const e=new TextEncoder().encode(p);const h=await crypto.subtle.digest('SHA-256',e);return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('');}
const doLogin=(rid)=>{setRole(rid);setLErr("");_storeToken=pin;_currentSocId=rid;localStorage.setItem("sc_store_token",pin);if(!onboarded)setShowTour(true);if(rid!=="admin"){try{setPorteurOnboarded(!!JSON.parse(localStorage.getItem(`scPorteurOnboarded_${rid}`)));}catch{setPorteurOnboarded(false);}}syncFromSupabase(rid).then(()=>{}).catch(()=>{});};
// Admin check
if(pin==="0000"||pin==="admin"){const hk="sc_pin_hash_admin";const stored=localStorage.getItem(hk);if(!stored){localStorage.setItem(hk,await hashPin(pin));}doLogin("admin");return;}
// Check stored hashes first
const inputHash=await hashPin(pin);for(const s of socs){const hk=`sc_pin_hash_${s.id}`;const stored=localStorage.getItem(hk);if(stored&&stored===inputHash){doLogin(s.id);return;}}
// Backward compat: raw PIN match, then store hash
const s=socs.find(x=>x.pin===pin);if(s){localStorage.setItem(`sc_pin_hash_${s.id}`,await hashPin(pin));doLogin(s.id);return;}
setLErr("Code incorrect");setShake(true);setTimeout(()=>setShake(false),500);},[pin,socs,onboarded]);
 const addAction=(socId,text,dl)=>{saveAJ([...actions,{id:uid(),socId,text,deadline:dl||nextM(cM2),done:false,by:"admin",at:new Date().toISOString()}],null);};
 const toggleAction=(id)=>{saveAJ(actions.map(a=>a.id===id?{...a,done:!a.done}:a),null);};
 const deleteAction=(id)=>{saveAJ(actions.filter(a=>a.id!==id),null);};
 if(!loaded)return <div className="glass-bg" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}><style>{CSS}</style><div style={{width:40,height:40,border:"3px solid rgba(255,255,255,.06)",borderTopColor:C.acc,borderRadius:"50%",animation:"sp 1s linear infinite",boxShadow:"0 0 20px rgba(255,170,0,.15)"}}/></div>;
 /* HASH-BASED ROUTES: War Room & Widget (public, no login) */
 const hash=window.location.hash;
 if(hash.startsWith("#widget/")){const wSocId=hash.replace("#widget/","");return <><style>{CSS}</style><Suspense fallback={<GlassSpinner/>}><LazyWidgetRenderer socId={wSocId} socs={socs} clients={clients}/></Suspense></>;}
 if(hash.startsWith("#warroom/")){const wrSocId=hash.replace("#warroom/","");return <><style>{CSS}</style><Suspense fallback={<GlassSpinner/>}><LazyWarRoomReadOnly socId={wrSocId} socs={socs} reps={reps} allM={allM} ghlData={ghlData} clients={clients} socBank={socBank}/></Suspense></>;}
 if(hash==="#pulse")return <><style>{CSS}</style><Suspense fallback={<GlassSpinner/>}><LazyPulseScreen socs={socs} reps={reps} allM={allM} ghlData={ghlData} socBank={socBank} hold={hold} clients={clients} onClose={()=>{window.location.hash="";window.location.reload();}}/></Suspense></>;
 if(hash.startsWith("#portal/")){const parts=hash.replace("#portal/","").split("/");return <><style>{CSS}</style><Suspense fallback={<GlassSpinner/>}><LazyClientPortal socId={parts[0]} clientId={parts[1]} socs={socs} clients={clients} ghlData={ghlData}/></Suspense></>;}
 if(hash.startsWith("#board/")){const bPin=hash.replace("#board/","");return <><style>{CSS}</style><Suspense fallback={<GlassSpinner/>}><LazyInvestorBoard socs={socs} reps={reps} allM={allM} hold={hold} pin={bPin}/></Suspense></>;}

 /* ONBOARDING (optional, non-blocking) */
 if(showOnboarding)return <OnboardingWizard hold={hold} onSkip={()=>setShowOnboarding(false)} onComplete={async(formData)=>{try{await sSet("scOnboarded",true);await sSet("scObData",formData);}catch{}setObData(formData);setOnboarded(true);setShowOnboarding(false);setShowTour(true);}}/>;
 if(!role)return <div className="glass-bg" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,padding:16}}>
  <style>{CSS}</style>
  {/* TUTORIAL OVERLAY ON LOGIN */}
  {false&&<div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,.6)",backdropFilter:"blur(3px)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
   <div className="si glass-modal" style={{borderRadius:20,padding:0,width:500,maxWidth:"92vw",overflow:"hidden"}}>
    <div style={{padding:"24px 28px",background:`linear-gradient(135deg,${C.accD},transparent)`,borderBottom:`1px solid ${C.brd}`,textAlign:"center"}}>
     <div style={{width:64,height:64,borderRadius:16,background:`linear-gradient(135deg,${C.acc},#FF9D00)`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:30,marginBottom:12,boxShadow:`0 8px 32px ${C.accD}`}}>🎓</div>
     <h2 style={{margin:0,fontSize:22,fontWeight:800,color:C.t,fontFamily:FONT_TITLE}}>Bienvenue {obData?.founderName||""} !</h2>
     <p style={{color:C.td,fontSize:13,margin:"8px 0 0",lineHeight:1.5}}>Votre espace est configuré. Connectez-vous puis découvrez la plateforme avec un tutoriel guidé de chaque onglet.</p>
    </div>
    <div style={{padding:"20px 28px"}}>
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[{icon:"📊",label:"Dashboard",desc:"Pilotage global"},{icon:"🏆",label:"Milestones",desc:"Trophées & progrès"},{icon:"🤖",label:"AI Copilot",desc:"Insights IA"},{icon:"📈",label:"Analytique",desc:"Tendances & comparaisons"}].map(it=>
      <div key={it.label} style={{padding:"12px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.brd}`,display:"flex",alignItems:"center",gap:8}}>
       <span style={{fontSize:18}}>{it.icon}</span><div><div style={{fontWeight:700,fontSize:11,color:C.t}}>{it.label}</div><div style={{fontSize:10,color:C.td}}>{it.desc}</div></div></div>)}</div>
    </div>
    <div style={{padding:"14px 28px",borderTop:`1px solid ${C.brd}`,textAlign:"center"}}>
     <button onClick={()=>setShowTour(false)} style={{padding:"10px 28px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${C.acc},#FF9D00)`,color:"#0a0a0f",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FONT,boxShadow:`0 4px 16px ${C.accD}`}}>Se connecter →</button>
    </div>
   </div>
  </div>}
  <button onClick={toggleTheme} style={{position:"fixed",top:16,right:16,width:36,height:36,borderRadius:18,border:`1px solid ${C.brd}`,background:C.card,color:C.td,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>{getTheme()==="light"?"🌙":"☀️"}</button>
  <div className="si glass-modal" style={{borderRadius:20,padding:28,width:340,maxWidth:"100%"}}>
   <div style={{textAlign:"center",marginBottom:24}}>
    <div className="fl glow-accent-strong" style={{width:64,height:64,background:"transparent",borderRadius:12,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:18,color:"#0a0a0f",marginBottom:10,overflow:"hidden"}}>{hold.brand?.logoUrl?<img src={hold.brand.logoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:(hold.brand?.logoLetter||"E")}</div>
    <h1 style={{margin:0,fontSize:18,fontWeight:900,letterSpacing:.5,fontFamily:FONT_TITLE,color:"#fff"}}>{hold.brand?.name||"L'INCUBATEUR ECS"}</h1>
    <p style={{color:C.td,fontSize:11,margin:"4px 0 0"}}>{hold.brand?.sub||"Plateforme de pilotage"}</p>
   </div>
   <div style={{animation:shake?"sh .4s ease":"none"}}>
    <Inp label="Email" value={loginEmail} onChange={v=>{setLoginEmail(v);setLErr("");}} type="email" placeholder="votre@email.com" onKeyDown={e=>{if(e.key==="Enter"&&loginEmail&&loginPass)loginEmail2();}}/>
    <Inp label="Mot de passe" value={loginPass} onChange={v=>{setLoginPass(v);setLErr("");}} type="password" placeholder="••••••••" onKeyDown={e=>{if(e.key==="Enter")loginEmail2();}}/>
   </div>
   {lErr&&<div style={{color:C.r,fontSize:11,marginBottom:8,textAlign:"center"}}>⚠ {lErr}</div>}
   <Btn onClick={loginEmail2} full disabled={authLoading}>{authLoading?"Connexion...":"Connexion"}</Btn>

   
   {obData&&<div style={{marginTop:10,padding:"8px 12px",background:C.gD,borderRadius:8,border:`1px solid ${C.g}33`,fontSize:10,color:C.g,textAlign:"center"}}>✅ Onboarding complété{obData.companyName?` — ${obData.companyName}`:""}</div>}


  </div>
 </div>;
 if(role!=="admin"){const soc=socs.find(s=>s.id===role);if(!soc)return null;
  // Check porteur onboarding
  if(!porteurOnboarded)return <PorteurOnboarding soc={soc} onComplete={()=>setPorteurOnboarded(true)}/>;
  const porteurSetTab=(t)=>{const btn=document.querySelector(`[data-tour="porteur-tab-${t}"]`);if(btn)btn.click();};
  return <ErrorBoundary label="Vue Porteur"><>{missedRecap&&<div className="fi" style={{position:"fixed",inset:0,zIndex:10000,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}} onClick={()=>setMissedRecap(null)}>
   <div onClick={e=>e.stopPropagation()} style={{width:420,maxHeight:"80vh",background:C.card,border:`1px solid ${C.brd}`,borderRadius:20,overflow:"hidden",backdropFilter:"blur(20px)"}}>
    <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.brd}`,background:`linear-gradient(135deg,${C.acc}11,transparent)`}}>
     <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div><div style={{fontSize:18,fontWeight:900,fontFamily:FONT_TITLE,color:C.acc}}>👋 Bon retour !</div>
       <div style={{fontSize:11,color:C.td,marginTop:2}}>Absent {missedRecap.absent} • {missedRecap.total} événement{missedRecap.total>1?"s":""}</div></div>
      <button onClick={()=>setMissedRecap(null)} style={{background:"none",border:"none",fontSize:18,color:C.td,cursor:"pointer"}}>✕</button>
     </div>
    </div>
    <div style={{padding:"12px 20px",maxHeight:"60vh",overflowY:"auto"}}>
     {missedRecap.events.map((e,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.brd}08`}}>
      <span style={{fontSize:16,flexShrink:0}}>{e.type}</span>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,color:C.t,lineHeight:1.4}}>{e.text}</div>
       {e.ts&&<div style={{fontSize:9,color:C.td,marginTop:2}}>{new Date(e.ts).toLocaleString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div>}</div>
      {e.value&&<span style={{fontSize:13,fontWeight:800,color:e.color,whiteSpace:"nowrap"}}>{e.value}</span>}
     </div>)}
    </div>
    <div style={{padding:"12px 20px",borderTop:`1px solid ${C.brd}`,textAlign:"center"}}>
     <button onClick={()=>setMissedRecap(null)} style={{padding:"8px 24px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.acc},#FF9D00)`,color:"#000",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT}}>C'est noté 👊</button>
    </div>
   </div>
  </div>}<SocieteView key={soc.id} soc={soc} reps={reps} allM={allM} save={save} onLogout={()=>{setRole(null);setShowTour(false);setAuthUser(null);localStorage.removeItem("sc_auth_token");localStorage.removeItem("sc_auth_refresh");try{fetch("/api/auth?action=logout",{method:"POST",headers:{Authorization:"Bearer "+(localStorage.getItem("sc_auth_token")||"")}});}catch{}}} onTour={()=>setShowTour(true)} actions={actions} journal={journal} pulses={pulses} saveAJ={saveAJ} savePulse={savePulse} socBankData={socBank[soc.id]||null} syncSocBank={syncSocBank} okrs={okrs} saveOkrs={saveOkrs} kb={kb} saveKb={saveKb} socs={socs} subs={subs} saveSubs={saveSubs} team={team} saveTeam={saveTeam} clients={clients} saveClients={saveClients} ghlData={ghlData} invoices={invoices} saveInvoices={saveInvoices} hold={hold} onThemeToggle={toggleTheme} stripeData={stripeData}/></></ErrorBoundary>;}
 if(showPulse)return <><style>{CSS}</style><Suspense fallback={<GlassSpinner/>}><LazyPulseScreen socs={socs} reps={reps} allM={allM} ghlData={ghlData} socBank={socBank} hold={hold} clients={clients} onClose={()=>setShowPulse(false)}/></Suspense></>;
 if(meeting)return <MeetingMode socs={socs} reps={reps} hold={hold} actions={actions} pulses={pulses} allM={allM} onExit={()=>setMeeting(false)}/>;
 /* ADMIN → Porteur View Override */
 if(adminSocView){const asoc=socs.find(s=>s.id===adminSocView);if(asoc)return <SocieteView key={asoc.id} soc={asoc} reps={reps} allM={allM} save={save} onLogout={()=>setAdminSocView(null)} onTour={()=>{}} actions={actions} journal={journal} pulses={pulses} saveAJ={saveAJ} savePulse={savePulse} socBankData={socBank[asoc.id]||null} syncSocBank={syncSocBank} okrs={okrs} saveOkrs={saveOkrs} kb={kb} saveKb={saveKb} socs={socs} subs={subs} saveSubs={saveSubs} team={team} saveTeam={saveTeam} clients={clients} saveClients={saveClients} ghlData={ghlData} invoices={invoices} saveInvoices={saveInvoices} hold={hold} onThemeToggle={toggleTheme} stripeData={stripeData} adminBack={()=>setAdminSocView(null)}/>;}
 let hc;try{hc=calcH(socs,reps,hold,cM2);}catch(e){hc={tIn:0,dispo:0,pf:0};console.error("calcH error:",e);}const pending=socs.filter(s=>{const r=gr(reps,s.id,cM2);return r&&!r.ok;});
 const missing=actS.filter(s=>!gr(reps,s.id,cM2));const lateActions=actions.filter(a=>!a.done&&a.deadline<cM2);
 const[adminMobileMenu,setAdminMobileMenu]=useState(false);
 return <div className="glass-bg" style={{display:"flex",minHeight:"100vh",fontFamily:FONT,color:C.t}}>
  <style>{CSS}</style>
  {missedRecap&&<div className="fi" style={{position:"fixed",inset:0,zIndex:10000,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}} onClick={()=>setMissedRecap(null)}>
   <div onClick={e=>e.stopPropagation()} style={{width:460,maxHeight:"80vh",background:C.card,border:`1px solid ${C.brd}`,borderRadius:20,overflow:"hidden",backdropFilter:"blur(20px)"}}>
    <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.brd}`,background:`linear-gradient(135deg,${C.acc}11,transparent)`}}>
     <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div><div style={{fontSize:18,fontWeight:900,fontFamily:FONT_TITLE,color:C.acc}}>👋 Bon retour !</div>
       <div style={{fontSize:11,color:C.td,marginTop:2}}>Absent {missedRecap.absent} • {missedRecap.total} événement{missedRecap.total>1?"s":""}</div></div>
      <button onClick={()=>setMissedRecap(null)} style={{background:"none",border:"none",fontSize:18,color:C.td,cursor:"pointer"}}>✕</button>
     </div>
    </div>
    <div style={{padding:"12px 20px",maxHeight:"60vh",overflowY:"auto"}}>
     {missedRecap.events.map((e,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.brd}08`}}>
      <span style={{fontSize:16,flexShrink:0}}>{e.type}</span>
      <div style={{flex:1,minWidth:0}}>
       <div style={{fontSize:12,color:C.t,lineHeight:1.4}}>{e.text}</div>
       {e.ts&&<div style={{fontSize:9,color:C.td,marginTop:2}}>{new Date(e.ts).toLocaleString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div>}
      </div>
      {e.value&&<span style={{fontSize:13,fontWeight:800,color:e.color,whiteSpace:"nowrap"}}>{e.value}</span>}
     </div>)}
     {missedRecap.total>20&&<div style={{textAlign:"center",color:C.td,fontSize:10,padding:8}}>+ {missedRecap.total-20} autres événements</div>}
    </div>
    <div style={{padding:"12px 20px",borderTop:`1px solid ${C.brd}`,textAlign:"center"}}>
     <button onClick={()=>setMissedRecap(null)} style={{padding:"8px 24px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.acc},#FF9D00)`,color:"#000",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:FONT}}>C'est noté 👊</button>
    </div>
   </div>
  </div>}
  {false&&role==="admin"&&<TutorialOverlay steps={TOUR_ADMIN} onFinish={()=>setShowTour(false)} onSkip={()=>setShowTour(false)} setActiveTab={setTab}/>}
  <div className="mobile-header" style={{display:"none",position:"fixed",top:0,left:0,right:0,zIndex:100,background:"rgba(14,14,22,.8)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,.06)",padding:"10px 16px",alignItems:"center",gap:10}}>
   <button onClick={()=>setAdminMobileMenu(!adminMobileMenu)} style={{background:"none",border:"none",fontSize:20,color:C.t,cursor:"pointer",padding:4}}>☰</button>
   <span style={{flex:1,fontWeight:800,fontSize:14,fontFamily:FONT_TITLE,color:C.acc}}>⚡ {hold.brand?.name||"L'INCUBATEUR ECS"}</span>
   <button onClick={toggleTheme} style={{background:"none",border:"none",fontSize:16,cursor:"pointer",padding:4,color:C.td}}>{getTheme()==="light"?"🌙":"☀️"}</button>
  </div>
  {adminMobileMenu&&<div className="fi" onClick={()=>setAdminMobileMenu(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:150}}><div onClick={e=>e.stopPropagation()} style={{width:240,height:"100vh",background:C.card,borderRight:`1px solid ${C.brd}`,overflowY:"auto"}}>
   <Sidebar items={SB_ADMIN} activeTab={tab} setTab={t=>{setTab(t);setAdminMobileMenu(false);}} brandTitle={hold.brand?.name||"L'INCUBATEUR ECS"} brandSub={`${actS.length} sociétés · Admin`} onLogout={()=>{setRole(null);setAuthUser(null);localStorage.removeItem("sc_auth_token");localStorage.removeItem("sc_auth_refresh");}} onTour={()=>setShowTour(true)} onThemeToggle={toggleTheme} dataTourPrefix="admin" brand={hold.brand}/>
  </div></div>}
  <div className="sidebar-desktop"><Sidebar items={SB_ADMIN} activeTab={tab} setTab={setTab} brandTitle={hold.brand?.name||"L'INCUBATEUR ECS"} brandSub={`${actS.length} sociétés · Admin`} onLogout={()=>{setRole(null);setAuthUser(null);localStorage.removeItem("sc_auth_token");localStorage.removeItem("sc_auth_refresh");}} onTour={()=>setShowTour(true)} onThemeToggle={toggleTheme} dataTourPrefix="admin" brand={hold.brand} extra={<div style={{display:"flex",flexDirection:"column",gap:2}}>
   {hold.slack?.enabled&&<div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 4px"}}><span style={{width:5,height:5,borderRadius:3,background:C.g}}/>
    <span style={{fontSize:8,color:C.td}}>{SLACK_MODES[hold.slack?.mode]?.icon} Slack connecté</span>
    {missing.length>0&&<button onClick={async()=>{const results=[];for(const s of missing){const r=await slackSend(hold.slack,buildReminderSlackMsg(s,"report",deadline(cM2)));results.push({nom:s.nom,ok:r.ok});}const ok=results.filter(r=>r.ok).length;alert(`📤 ${ok}/${results.length} rappels envoyés`);}} style={{marginLeft:"auto",fontSize:8,color:C.o,background:C.oD,border:"none",borderRadius:4,padding:"2px 5px",cursor:"pointer",fontFamily:FONT,fontWeight:600}}>🔔 {missing.length}</button>}
   </div>}
   <button onClick={()=>setMeeting(true)} style={{width:"100%",display:"flex",alignItems:"center",gap:6,padding:"6px 8px",borderRadius:6,border:`1px solid ${"#a78bfa"}22`,background:"#a78bfa"+"0a",color:"#a78bfa",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT,textAlign:"left"}}>
    <span>📋</span><span>Mode Réunion</span>
   </button>
  </div>}/></div>
  <div className="main-content" style={{flex:1,minWidth:0,height:"100vh",overflow:"auto"}}>
  {saving&&<div style={{position:"fixed",top:12,right:12,zIndex:100,width:14,height:14,border:`2px solid ${C.brd}`,borderTopColor:C.acc,borderRadius:"50%",animation:"sp .8s linear infinite"}}/>}
  <div className="admin-soc-selector" style={{position:"fixed",top:12,left:220,zIndex:90,display:"flex",alignItems:"center",gap:8}}>
   <select value="" onChange={e=>{if(e.target.value)setAdminSocView(e.target.value);}} style={{padding:"6px 28px 6px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.card,color:C.t,fontSize:11,fontWeight:600,fontFamily:FONT,cursor:"pointer",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2371717a'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center"}}>
    <option value="">👁 Vue société...</option>
    {socs.filter(s=>s.stat==="active"||s.stat==="lancement").map(s=><option key={s.id} value={s.id}>{s.nom} — {s.porteur}</option>)}
   </select>
  </div>
  <div style={{padding:"16px 22px 50px",maxWidth:1000,margin:"0 auto"}}>
  {tab===0&&<>
   {smartAlerts.length>0&&<div data-tour="admin-alerts" style={{marginBottom:12}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
    <span style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>🔔 ALERTES INTELLIGENTES</span>
    <span style={{fontSize:8,color:smartAlerts.filter(a=>a.type==="danger").length>0?C.r:C.o}}>{smartAlerts.length} alerte{smartAlerts.length>1?"s":""}</span>
    </div>
    <SmartAlertsPanel alerts={smartAlerts.slice(0,5)}/>
   </div>}
   <div data-tour="admin-kpis" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8}}>
    <KPI label="CA Groupe" value={`${fmt(actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.ca),0))}€`} accent={C.acc} icon="💰" delay={1}/>
    <KPI label="Marge nette" value={`${fmt(actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.ca)-pf(gr(reps,s.id,cM2)?.charges),0))}€`} accent={C.g} icon="📊" delay={2}/>
    <KPI label="On se verse" value={`${fmt(hold.remun)}€`} accent={C.o} icon="👤" delay={3} sub={`${fmt(hold.remun/2)}€ chacun`}/>
    <KPI label="Reste dispo" value={`${fmt(hc.dispo)}€`} accent={hc.dispo>0?C.g:C.r} icon="✨" delay={4}/>
    <KPI label="Trésorerie" value={`${fmt(hold.treso)}€`} accent={(hold.treso||0)<5e3?C.r:C.g} icon="🏦" delay={5}/>
    <KPI label="ROI Incubation" value={`${(()=>{const first=(allM||[])[0];const last=cM2;if(!first)return"—";const caFirst=actS.reduce((a,s)=>a+pf(gr(reps,s.id,first)?.ca),0);const caLast=actS.reduce((a,s)=>a+pf(gr(reps,s.id,last)?.ca),0);if(caFirst<=0)return caLast>0?"+∞":"0%";return`${caLast>=caFirst?"+":""}${Math.round((caLast-caFirst)/caFirst*100)}%`;})()}`} accent="#a78bfa" icon="🚀" delay={6} sub="vs 1er mois"/>
   </div>
   <div className="admin-responsive-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:14}}>
    <div>
    {feed.length>0&&<div data-tour="admin-feed"><Card style={{padding:12,marginBottom:10}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:6}}>ACTIVITÉ RÉCENTE</div>
    {feed.slice(0,5).map((f2,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4,fontSize:10}}>
    <span style={{width:4,height:4,borderRadius:2,background:f2.color,flexShrink:0}}/>
    <span style={{color:C.t,flex:1,lineHeight:1.3}}>{f2.m}</span>
    <span style={{color:C.tm,fontSize:8,whiteSpace:"nowrap"}}>{ago(f2.date)}</span>
    </div>)}
    </Card></div>}
    <Sect title="⚡ Pulse" sub={curW()}><PulseOverview socs={socs} pulses={pulses}/></Sect>
    </div>
    <div data-tour="admin-leaderboard">
    <BankingPanel revData={revData} onSync={syncRev} compact clients={clients}/>
    <Card style={{padding:12,marginTop:10}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:6}}>🏆 CLASSEMENT</div>
    {leaderboard.slice(0,5).map((lb,i)=>{const ms=calcMilestones(lb.soc,reps,actions,pulses,allM);const msN=ms.filter(m=>m.unlocked).length;return <div key={lb.soc.id} className={`fu d${Math.min(i+1,5)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:i<Math.min(leaderboard.length,5)-1?`1px solid ${C.brd}08`:"none"}}>
    <span style={{fontWeight:800,fontSize:12,color:i===0?C.acc:i===1?"#C0C0C0":i===2?"#CD7F32":C.td,width:16}}>{i+1}</span>
    <span style={{width:4,height:4,borderRadius:2,background:lb.soc.color}}/>
    <span style={{flex:1,fontWeight:600,fontSize:11}}>{lb.soc.nom}</span>
    {msN>0&&<span style={{fontSize:7,color:C.acc,background:C.accD,padding:"1px 4px",borderRadius:6,fontWeight:700}}>🏆{msN}</span>}
    <GradeBadge grade={lb.hs.grade} color={lb.hs.color}/>
    <span style={{fontWeight:800,fontSize:12,color:C.acc,minWidth:28,textAlign:"right"}}>{lb.score}</span>
    </div>;})}
    </Card>
    </div>
   </div>
   <div data-tour="admin-okr-actions" style={{display:"grid",gridTemplateColumns:"1fr",gap:12,marginTop:14}}>
    <Card style={{padding:12}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>⚡ ACTIONS PRIORITAIRES</div>
    <span style={{fontSize:9,color:C.td}}>{actions.filter(a=>!a.done).length} ouvertes</span>
    </div>
    {(()=>{
    const open=actions.filter(a=>!a.done).sort((a,b)=>a.deadline>b.deadline?1:-1);
    if(open.length===0)return <div style={{color:C.td,fontSize:11,padding:10,textAlign:"center"}}>Tout est fait 🎉</div>;
    return open.slice(0,5).map((a,i)=>{
    const s=socs.find(x=>x.id===a.socId);const isLate=a.deadline<cM2;
    return <div key={a.id} className={`fu d${Math.min(i+1,5)}`} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 0",borderBottom:i<Math.min(open.length,5)-1?`1px solid ${C.brd}08`:"none"}}>
    <span style={{width:4,height:4,borderRadius:2,background:s?.color||C.td,flexShrink:0}}/>
    <span style={{flex:1,fontSize:10,lineHeight:1.3,color:isLate?C.r:C.t}}>{a.text}</span>
    {isLate&&<span style={{fontSize:7,color:C.r,background:C.rD,padding:"1px 4px",borderRadius:4,fontWeight:700}}>RETARD</span>}
    <span style={{fontSize:8,color:C.td,whiteSpace:"nowrap"}}>{ml(a.deadline)}</span>
    </div>;
    });
    })()}
    </Card>
   </div>
   <SynergiesAutoPanel socs={socs} reps={reps} clients={clients} ghlData={ghlData}/>
   {/* Benchmark Inter-Sociétés Radar */}
   <BenchmarkRadar socs={actS.filter(s=>s.id!=="eco")} reps={reps} ghlData={ghlData} allM={allM} cM={cM2} clients={clients}/>
   {/* Inbox Unifiée */}
   <InboxUnifiee socs={actS} ghlData={ghlData}/>
   <div style={{marginTop:14}}><LeaderboardCard socs={socs} reps={reps} allM={allM} actions={actions} pulses={pulses} socBank={socBank}/></div>
   <Sect title="Portfolio" sub={`${actS.filter(s=>s.id!=="eco").length} sociétés actives`}>
    <div data-tour="admin-portfolio" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
    {actS.filter(s=>s.id!=="eco").map((s,i)=>{
    const r=gr(reps,s.id,cM2);const hs2=healthScore(s,reps);const rw2=runway(reps,s.id,allM);const sb=socBank[s.id];
    const ca2=r?pf(r.ca):0;const ms=calcMilestones(s,reps,actions,pulses,allM);const msUnlocked=ms.filter(m=>m.unlocked);
    return <Card key={s.id} accent={s.color} style={{padding:12}} delay={Math.min(i+1,8)}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
    <div style={{width:24,height:24,borderRadius:6,background:s.color+"22",border:`1.5px solid ${s.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:10,color:s.color}}>{s.nom[0]}</div>
    <div style={{flex:1,minWidth:0}}>
    <div style={{fontWeight:700,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.nom}</div>
    <div style={{color:C.td,fontSize:9}}>{s.porteur}</div>
    </div>
    <GradeBadge grade={hs2.grade} color={hs2.color}/>
    {(s.obj||0)>0&&(()=>{const pctO=Math.min(100,Math.round(ca2/(s.obj)*100));const r2=16;const circ=2*Math.PI*r2;const off=circ-(pctO/100)*circ;return <svg width="38" height="38" style={{flexShrink:0}}><circle cx="19" cy="19" r={r2} fill="none" stroke={C.brd} strokeWidth="3"/><circle cx="19" cy="19" r={r2} fill="none" stroke={pctO>=100?C.g:C.acc} strokeWidth="3" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 19 19)"/><text x="19" y="21" textAnchor="middle" fontSize="9" fontWeight="800" fill={pctO>=100?C.g:C.acc}>{pctO}%</text></svg>;})()}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:6}}>
    <div style={{background:C.bg,borderRadius:6,padding:"5px 7px"}}><div style={{color:C.td,fontSize:8,fontWeight:600}}>CA</div><div style={{fontWeight:800,fontSize:12,color:C.t}}>{ca2>0?`${fmt(ca2)}€`:"—"}</div></div>
    <div style={{background:C.bg,borderRadius:6,padding:"5px 7px"}}><div style={{color:C.td,fontSize:8,fontWeight:600}}>{sb?"SOLDE":"TRÉSO"}</div><div style={{fontWeight:800,fontSize:12,color:C.g}}>{sb?`${fmt(sb.balance)}€`:r?`${fmt(pf(r.tresoSoc))}€`:"—"}</div></div>
    </div>
    {msUnlocked.length>0&&<div style={{display:"flex",alignItems:"center",gap:4,marginBottom:5,padding:"3px 6px",background:C.accD,borderRadius:6}}>
    <MilestonesCompact milestones={ms} max={4}/>
    <span style={{fontSize:7,color:C.acc,fontWeight:700,marginLeft:"auto"}}>{msUnlocked.length}/{ms.length}</span>
    </div>}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:4}}>
    <div style={{display:"flex",gap:3}}>
    {s.incub&&<span style={{fontSize:8,color:C.v,background:C.vD,padding:"1px 6px",borderRadius:8,fontWeight:600}}>📅 {sinceLbl(s.incub)}</span>}
    <SubsTeamBadge subs={subs} team={team} socId={s.id} reps={reps}/>
    </div>
    <div style={{display:"flex",gap:3}}>
    {rw2&&<span style={{fontSize:8,fontWeight:700,color:rw2.months<3?C.r:rw2.months<6?C.o:C.g,background:rw2.months<3?C.rD:rw2.months<6?C.oD:C.gD,padding:"1px 5px",borderRadius:8}}>{rw2.months===99?"∞":rw2.months+"m"}</span>}
    <Badge s={s.stat}/>
    </div>
    </div>
    </Card>;
    })}
    </div>
   </Sect>
   <div data-tour="admin-milestones"><Sect title="🏆 Milestones" sub="Progression de chaque société">
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:6}}>
    {actS.filter(s=>s.id!=="eco").map((s,i)=>{
    const ms=calcMilestones(s,reps,actions,pulses,allM);const un=ms.filter(m=>m.unlocked);const pctMs=Math.round(un.length/ms.length*100);
    const topTier=un.sort((a2,b2)=>b2.tier-a2.tier).slice(0,5);
    const next=ms.filter(m=>!m.unlocked).sort((a2,b2)=>a2.tier-b2.tier)[0];
    return <div key={s.id} className={`fu d${Math.min(i+1,8)}`} style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:10,padding:"10px 12px"}}>
    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
    <span style={{width:4,height:4,borderRadius:2,background:s.color,flexShrink:0}}/>
    <span style={{flex:1,fontWeight:700,fontSize:11}}>{s.nom}</span>
    <span style={{fontWeight:800,fontSize:12,color:C.acc}}>{un.length}<span style={{color:C.td,fontWeight:400,fontSize:9}}>/{ms.length}</span></span>
    </div>
    <PBar value={un.length} max={ms.length} color={pctMs>=70?C.g:pctMs>=40?C.acc:C.b} h={3}/>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:5}}>
    <div style={{display:"flex",gap:2}}>
    {topTier.map(m=><span key={m.id} title={m.label} style={{fontSize:10}}>{m.icon}</span>)}
    </div>
    {next&&<span style={{fontSize:7,color:C.td}} title={next.desc}>🔜 {next.label}</span>}
    </div>
    </div>;
    })}
    </div>
   </Sect></div>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}>
    <Card style={{padding:12,cursor:"pointer"}} onClick={()=>setTab(10)}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
    <span style={{fontSize:11,fontWeight:700}}>🤝 Synergies</span>
    <span style={{fontSize:8,color:C.acc}}>Voir →</span>
    </div>
    <div style={{display:"flex",gap:10,alignItems:"baseline"}}>
    <div><div style={{fontWeight:800,fontSize:18,color:C.g}}>{fmt(synergies.filter(s=>s.status==="won").reduce((a,s)=>a+pf(s.value),0))}€</div><div style={{fontSize:8,color:C.td}}>générés</div></div>
    <div><div style={{fontWeight:800,fontSize:14,color:C.b}}>{synergies.filter(s=>s.status==="active").length}</div><div style={{fontSize:8,color:C.td}}>en cours</div></div>
    <div><div style={{fontWeight:800,fontSize:14,color:C.td}}>{synergies.length}</div><div style={{fontSize:8,color:C.td}}>total</div></div>
    </div>
    </Card>
   </div>
   {pending.length>0&&<Sect title={`Rapports — ${ml(cM2)}`} sub={`${pending.length} en attente`}>{socs.map((s,i)=>{const r=gr(reps,s.id,cM2);if(!r)return null;return <ValRow key={s.id} s={s} r={r} reps={reps} save={save} hs={healthScore(s,reps)} delay={Math.min(i+1,8)} onAction={(sid,txt)=>addAction(sid,txt)} hold={hold}/>;})}</Sect>}
   {lateActions.length>0&&<Sect title={`⚠ Actions en retard (${lateActions.length})`}>{lateActions.map(a=><ActionItem key={a.id} a={a} socs={socs} onToggle={toggleAction} onDelete={deleteAction}/>)}</Sect>}
   <Sect title="Trésorerie & Runway" right={<Btn small v="secondary" onClick={syncAllSocBanks}>↻ Sync</Btn>}>{actS.filter(s=>s.id!=="eco").map((s,i)=>{const rw=runway(reps,s.id,allM);const sb=socBank[s.id];const bf=revFinancials(sb,cM2);
    return <div key={s.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:2}}>
    <span style={{width:4,height:4,borderRadius:2,background:s.color}}/><span style={{flex:1,fontSize:11,fontWeight:600}}>{s.nom}</span>
    {sb&&<><span style={{fontSize:9,color:C.g,fontWeight:700}}>🏦 {fmt(sb.balance)}€</span>{bf&&<span style={{fontSize:8,color:C.td}}>↓{fmt(bf.ca)}€ ↑{fmt(bf.charges)}€</span>}</>}
    {!sb&&rw&&<span style={{fontSize:10,color:C.td}}>Tréso: {fmt(rw.treso)}€</span>}
    {rw&&<span style={{fontWeight:700,fontSize:9,color:rw.months<3?C.r:rw.months<6?C.o:C.g,padding:"1px 6px",background:rw.months<3?C.rD:rw.months<6?C.oD:C.gD,borderRadius:8}}>{rw.months===99?"∞":rw.months+"m"}</span>}
    </div>;})}
   </Sect>
   <Sect title="Projection T+3">{actS.map((s,i)=>{const proj=project(reps,s.id,allM);if(!proj)return null;const n=[nextM(cM2),nextM(nextM(cM2)),nextM(nextM(nextM(cM2)))];return <div key={s.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:2}}><span style={{width:4,height:4,borderRadius:2,background:s.color}}/><span style={{flex:1,fontSize:11,fontWeight:600}}>{s.nom}</span>{proj.map((v,j)=><span key={j} style={{fontSize:9,color:C.td}}>{ml(n[j]).split(" ")[0]}: <strong style={{color:C.t}}>{fmt(v)}€</strong></span>)}</div>;})}
   </Sect>
   <RiskMatrix socs={socs} reps={reps} allM={allM}/>
   {(challenges||[]).filter(c=>c.month===cM2).length>0&&<Card style={{padding:12,marginTop:12,cursor:"pointer"}} onClick={()=>setTab(12)}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
    <span style={{fontSize:11,fontWeight:700}}>⚡ Challenges ce mois</span>
    <span style={{fontSize:8,color:C.acc}}>Voir →</span>
    </div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
    {(challenges||[]).filter(c=>c.month===cM2).map(ch=>{const tmpl=CHALLENGE_TEMPLATES.find(t=>t.id===ch.templateId);return tmpl?<span key={ch.id} style={{padding:"3px 8px",background:C.accD,borderRadius:6,fontSize:10,fontWeight:600}}>{tmpl.icon} {tmpl.title.replace(/^. /,"")}</span>:null;})}
    </div>
   </Card>}
  </>}
  {tab===1&&<>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6,marginBottom:14}}>
    <div><span style={{fontWeight:800,fontSize:16,fontFamily:FONT_TITLE}}>🏢 Sociétés</span><span style={{color:C.td,fontSize:11,marginLeft:8}}>{socs.length} sociétés</span></div>
    <div style={{display:"flex",gap:6}}>
     <select value="" onChange={e=>{}} style={{background:C.bg,border:`1px solid ${C.brd}`,borderRadius:8,color:C.td,padding:"6px 10px",fontSize:10,fontFamily:FONT,outline:"none"}}><option value="">Toutes</option><option value="active">Actives</option>{[...new Set(socs.map(s=>s.porteur))].map(p=><option key={p} value={p}>{p}</option>)}</select>
     <Btn small onClick={()=>setESoc({id:`s${Date.now()}`,nom:"",porteur:"",act:"",pT:"benefices",pP:20,stat:"lancement",color:"#22d3ee",pin:String(2000+socs.length),rec:false,obj:0,objQ:0,ghlKey:"",revToken:"",revEnv:"sandbox",incub:new Date().toISOString().slice(0,10),slackId:""})}>+ Ajouter une société</Btn>
    </div>
   </div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
   {socs.map((s,i)=>{const hs2=healthScore(s,reps);const r=gr(reps,s.id,cM2);const ca2=pf(r?.ca);const rp2=gr(reps,s.id,prevM(cM2));const prevCa2=pf(rp2?.ca);const trend2=prevCa2>0?Math.round((ca2-prevCa2)/prevCa2*100):0;const sb=socBank[s.id];const myCl2=(clients||[]).filter(c=>c.socId===s.id&&c.status==="active");
   return <div key={s.id} className={`glass-card fu d${Math.min(i+1,8)}`} style={{padding:16,cursor:"pointer"}} onClick={()=>setESoc({...s})}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
     <div style={{width:36,height:36,borderRadius:10,background:s.color+"22",border:`2px solid ${s.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,color:s.color}}>{s.nom[0]}</div>
     <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.nom}</div><div style={{color:C.td,fontSize:10}}>{s.porteur}</div></div>
     <span style={{fontSize:16}}>{hs2.grade==="A"||hs2.grade==="B"?"🟢":hs2.grade==="C"?"🟡":"🔴"}</span>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
     <div style={{background:C.bg,borderRadius:8,padding:"6px 8px"}}><div style={{color:C.td,fontSize:8,fontWeight:600}}>CA</div><div style={{fontWeight:800,fontSize:14,color:C.acc}}>{ca2>0?`${fmt(ca2)}€`:"—"}</div></div>
     <div style={{background:C.bg,borderRadius:8,padding:"6px 8px"}}><div style={{color:C.td,fontSize:8,fontWeight:600}}>CLIENTS</div><div style={{fontWeight:800,fontSize:14,color:C.b}}>{myCl2.length}</div></div>
    </div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
     {trend2!==0&&<span style={{fontSize:10,fontWeight:700,color:trend2>0?C.g:C.r}}>{trend2>0?"↑":"↓"}{Math.abs(trend2)}%</span>}
     <Badge s={s.stat}/>
    </div>
   </div>;})}
   </div>
   <Sect title="Journal">{Object.entries(journal).filter(([,v])=>v.length>0).map(([sid,entries])=>{const s=socs.find(x=>x.id===sid);if(!s)return null;return <div key={sid} style={{marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}><span style={{width:5,height:5,borderRadius:3,background:s.color}}/><span style={{fontWeight:700,fontSize:12}}>{s.nom}</span></div>{entries.sort((a2,b2)=>new Date(b2.date)-new Date(a2.date)).map(j=><div key={j.id} style={{padding:"4px 0 4px 14px",borderLeft:`2px solid ${s.color}33`,marginBottom:2}}><div style={{fontSize:11,color:C.t}}>{j.text}</div><div style={{fontSize:9,color:C.td}}>{new Date(j.date).toLocaleDateString("fr-FR")}</div></div>)}</div>;})}</Sect>
   <Modal open={!!eSoc} onClose={()=>setESoc(null)} title={eSoc?.nom||"Nouvelle société"} wide>{eSoc&&<>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Nom" value={eSoc.nom} onChange={v=>setESoc({...eSoc,nom:v})}/>
    <Inp label="Porteur" value={eSoc.porteur} onChange={v=>setESoc({...eSoc,porteur:v})}/>
    <Inp label="Activité" value={eSoc.act} onChange={v=>setESoc({...eSoc,act:v})}/>
    <Inp label="Date d'incubation" type="date" value={eSoc.incub||""} onChange={v=>setESoc({...eSoc,incub:v})} note={eSoc.incub?`→ ${sinceLbl(eSoc.incub)} d'association`:""}/>
    <Inp label="PIN" value={eSoc.pin} onChange={v=>setESoc({...eSoc,pin:v})}/>
    <Inp label="Couleur" type="color" value={eSoc.color} onChange={v=>setESoc({...eSoc,color:v})}/>
    <Sel label="Part sur" value={eSoc.pT} onChange={v=>setESoc({...eSoc,pT:v})} options={[{v:"benefices",l:"% CA hors presta"},{v:"ca",l:"% CA brut"}]}/>
    <Inp label="%" value={eSoc.pP} onChange={v=>setESoc({...eSoc,pP:pf(v)})} type="number" suffix="%"/>
    <Sel label="Statut" value={eSoc.stat} onChange={v=>setESoc({...eSoc,stat:v})} options={[{v:"active",l:"Active"},{v:"lancement",l:"Lancement"},{v:"signature",l:"Signature"},{v:"inactive",l:"Inactive"}]}/>
    <Sel label="Récurrent" value={eSoc.rec?"1":"0"} onChange={v=>setESoc({...eSoc,rec:v==="1"})} options={[{v:"0",l:"Non"},{v:"1",l:"Oui"}]}/>
    <Inp label="Obj. mensuel" value={eSoc.obj} onChange={v=>setESoc({...eSoc,obj:pf(v)})} type="number" suffix="€"/>
    <Inp label="Obj. trim." value={eSoc.objQ} onChange={v=>setESoc({...eSoc,objQ:pf(v)})} type="number" suffix="€"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
    <div style={{padding:"10px 12px",background:C.bg,borderRadius:8,border:`1px solid ${C.brd}`}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}><span style={{fontSize:12}}>📡</span><span style={{fontWeight:700,fontSize:10,color:C.td}}>GHL</span></div><Inp label="Clé API" value={eSoc.ghlKey||""} onChange={v=>setESoc({...eSoc,ghlKey:v})} placeholder="eyJhbGciOi..." small/></div>
    <div style={{padding:"10px 12px",background:C.bg,borderRadius:8,border:`1px solid ${C.brd}`}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}><span style={{fontSize:12}}>🏦</span><span style={{fontWeight:700,fontSize:10,color:C.td}}>REVOLUT</span></div><Inp label="Token" value={eSoc.revToken||""} onChange={v=>setESoc({...eSoc,revToken:v})} placeholder="oa_sand_..." small/><Sel label="Env." value={eSoc.revEnv||"sandbox"} onChange={v=>setESoc({...eSoc,revEnv:v})} options={[{v:"sandbox",l:"Sandbox"},{v:"production",l:"Production"}]}/></div>
    </div>
    <div style={{padding:"10px 12px",background:C.bg,borderRadius:8,border:`1px solid ${C.brd}`,marginTop:8}}>
    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}><span style={{fontSize:12}}>💬</span><span style={{fontWeight:700,fontSize:10,color:C.td}}>SLACK</span></div>
    <Inp label="Slack User ID du porteur" value={eSoc.slackId||""} onChange={v=>setESoc({...eSoc,slackId:v})} placeholder="U06ABC123" note="Profil Slack du porteur → ⋮ → Copier l'ID membre" small/>
    {eSoc.slackId&&<div style={{fontSize:8,color:C.g,marginTop:2}}>✓ Le porteur sera tagué dans les notifications Slack</div>}
    </div>
    <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={()=>{const idx=socs.findIndex(x=>x.id===eSoc.id);save(idx>=0?socs.map(x=>x.id===eSoc.id?eSoc:x):[...socs,eSoc]);setESoc(null);}}>Sauver</Btn><Btn v="secondary" onClick={()=>setESoc(null)}>Annuler</Btn>{socs.find(x=>x.id===eSoc.id)&&<Btn v="danger" onClick={()=>{save(socs.filter(x=>x.id!==eSoc.id));setESoc(null);}} style={{marginLeft:"auto"}}>Supprimer</Btn>}</div>
   </>}</Modal>
  </>}
  {tab===2&&<>
   {/* FINANCES — Consolidated */}
   <div style={{fontWeight:800,fontSize:16,fontFamily:FONT_TITLE,marginBottom:14}}>💰 Finances Consolidées</div>
   {(()=>{
    const totalCA=actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.ca),0);
    const totalCh=actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.charges),0);
    const totalMarge=totalCA-totalCh;const margePctG=totalCA>0?Math.round(totalMarge/totalCA*100):0;
    const totalTreso=actS.reduce((a,s)=>a+(socBank[s.id]?.balance||pf(gr(reps,s.id,cM2)?.tresoSoc)),0);
    return <><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:14}}>
     <KPI label="CA Total" value={`${fmt(totalCA)}€`} accent={C.acc} icon="💰" delay={1}/>
     <KPI label="Charges Totales" value={`${fmt(totalCh)}€`} accent={C.r} icon="📤" delay={2}/>
     <KPI label="Marge Nette" value={`${fmt(totalMarge)}€ (${margePctG}%)`} accent={totalMarge>0?C.g:C.r} icon="📊" delay={3}/>
     <KPI label="Trésorerie" value={`${fmt(totalTreso)}€`} accent={totalTreso>5000?C.g:C.r} icon="🏦" delay={4}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
     <Card style={{padding:14}}><div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>📊 CA PAR SOCIÉTÉ (6 MOIS)</div>
      <div style={{height:220}}><ResponsiveContainer><AreaChart data={allM.slice(-6).map(m=>{const row={mois:ml(m)};actS.filter(s=>s.id!=="eco").forEach(s=>{row[s.nom]=pf(gr(reps,s.id,m)?.ca);});return row;})}><CartesianGrid strokeDasharray="3 3" stroke={C.brd}/><XAxis dataKey="mois" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/><Tooltip content={<CTip/>}/><Legend wrapperStyle={{fontSize:9}}/>{actS.filter(s=>s.id!=="eco").map(s=><Area key={s.id} type="monotone" dataKey={s.nom} stackId="1" stroke={s.color} fill={s.color+"44"} strokeWidth={1.5}/>)}</AreaChart></ResponsiveContainer></div>
     </Card>
     <Card style={{padding:14}}><div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>🥧 RÉPARTITION CA</div>
      <div style={{height:220}}><ResponsiveContainer><PieChart><Pie data={actS.filter(s=>pf(gr(reps,s.id,cM2)?.ca)>0).map(s=>({name:s.nom,value:pf(gr(reps,s.id,cM2).ca),color:s.color}))} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} strokeWidth={0}>{actS.filter(s=>pf(gr(reps,s.id,cM2)?.ca)>0).map((s,i)=><Cell key={i} fill={s.color}/>)}</Pie><Tooltip content={<CTip/>}/></PieChart></ResponsiveContainer></div>
     </Card>
    </div>
    <Card style={{padding:14}}><div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>📋 P&L PAR SOCIÉTÉ</div>
     <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
      <thead><tr style={{borderBottom:`1px solid ${C.brd}`}}>{["Société","CA","Charges","Marge","%","Remontée due","Versé","Reste"].map(h=><th key={h} style={{padding:"6px 8px",textAlign:"left",color:C.td,fontWeight:600,fontSize:9}}>{h}</th>)}</tr></thead>
      <tbody>{actS.filter(s=>s.id!=="eco").map(s=>{const r=gr(reps,s.id,cM2);const ca2=pf(r?.ca);const ch2=pf(r?.charges);const m2=ca2-ch2;const mp=ca2>0?Math.round(m2/ca2*100):0;const presta=pf(r?.prestataireAmount||0);const base=s.pT==="ca"?ca2:Math.max(0,ca2-presta);const rem=base*s.pP/100;const div=pf(r?.dividendesHolding);const rest=rem-div;
       return <tr key={s.id} style={{borderBottom:`1px solid ${C.brd}08`}}>
        <td style={{padding:"6px 8px",fontWeight:600}}><span style={{width:6,height:6,borderRadius:3,background:s.color,display:"inline-block",marginRight:6}}/>{s.nom}</td>
        <td style={{padding:"6px 8px",fontWeight:700}}>{fmt(ca2)}€</td>
        <td style={{padding:"6px 8px",color:C.r}}>{fmt(ch2)}€</td>
        <td style={{padding:"6px 8px",color:m2>=0?C.g:C.r,fontWeight:700}}>{fmt(m2)}€</td>
        <td style={{padding:"6px 8px",color:C.td}}>{mp}%</td>
        <td style={{padding:"6px 8px",color:C.acc,fontWeight:700}}>{fmt(rem)}€</td>
        <td style={{padding:"6px 8px",color:C.g}}>{fmt(div)}€</td>
        <td style={{padding:"6px 8px",color:rest>0?C.o:C.g,fontWeight:700}}>{rest>0?fmt(rest)+"€":"✅"}</td>
       </tr>;})}
      </tbody>
     </table></div>
    </Card>
    <div style={{marginTop:14}}><Card style={{padding:14}}><div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>💰 TRÉSORERIE — ÉVOLUTION</div>
     <div style={{height:200}}><ResponsiveContainer><LineChart data={allM.slice(-6).map(m=>{const tot=actS.reduce((a,s)=>a+(pf(gr(reps,s.id,m)?.tresoSoc)),0);return{mois:ml(m),treso:tot};})}><CartesianGrid strokeDasharray="3 3" stroke={C.brd}/><XAxis dataKey="mois" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/><Tooltip content={<CTip/>}/><Line type="monotone" dataKey="treso" stroke={C.g} strokeWidth={2} dot={{fill:C.g,r:3}} name="Trésorerie"/></LineChart></ResponsiveContainer></div>
    </Card></div>
    </>;
   })()}
  </>}
  {tab===3&&<Suspense fallback={<div/>}><LazyAdminClientsTab clients={clients} socs={socs}/></Suspense>}
  {tab===4&&(()=>{
   const holdSubs=subs.filter(s=>s.socId==="holding");const holdTeam=team.filter(t=>t.socId==="holding");
   const holdSubsM=holdSubs.reduce((a,s)=>a+subMonthly(s),0);
   const holdTeamM=holdTeam.reduce((a,t)=>a+teamMonthly(t,0),0);
   const allSubsM=subs.reduce((a,s)=>a+subMonthly(s),0);
   const allTeamM=team.reduce((a,t)=>{const ca=t.socId!=="holding"?pf(gr(reps,t.socId,cM2)?.ca):0;return a+teamMonthly(t,ca);},0);
   return <>
   <div style={{display:"flex",justifyContent:"flex-end",marginTop:6,gap:6}}><Btn small v="secondary" onClick={()=>setTab(13)}>🔄 Gérer charges</Btn><Btn small onClick={()=>setEHold(true)}>⚙ Paramètres</Btn></div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8,marginTop:8}}>
    <KPI label="Flux entrant" value={`${fmt(hc.tIn)}€`} accent={C.g} icon="💰" delay={1} sub={`Remontées: ${fmt(hc.rem)}€`}/>
    <KPI label="On se verse" value={`${fmt(hold.remun)}€`} accent={C.acc} icon="👤" delay={2} sub={`${fmt(hold.remun/2)}€ chacun`}/>
    <KPI label="Charges holding" value={`${fmt(hc.tCh)}€`} accent={C.r} icon="📤" delay={3}/>
    <KPI label="Abos + Équipe" value={`${fmt(holdSubsM+holdTeamM)}€`} accent={C.o} icon="🔄" delay={4} sub={`${holdSubs.length} abos · ${holdTeam.length} membres`}/>
    <KPI label="Reste dispo" value={`${fmt(hc.dispo)}€`} accent={hc.dispo>0?C.g:C.r} icon="✨" delay={5}/>
   </div>
   <Sect title="Cascade des flux">
    <Card style={{padding:14}}>
    {(()=>{
    const steps=[
    {l:"Remontées sociétés",v:hc.rem,c:C.g,icon:"🏢"},
    {l:"CRM / société",v:hc.crm,c:C.g,icon:"📋"},
    {l:"CA Écosystème (net)",v:Math.max(0,hc.eNet),c:C.g,icon:"🌐"},
    {l:"= Flux entrant",v:hc.tIn,c:C.acc,icon:"💰",total:true},
    {l:"− Charges holding",v:-hc.tCh,c:C.r,icon:"📤"},
    {l:"− Rémunération",v:-hold.remun,c:C.r,icon:"👤"},
    ...(holdSubsM>0?[{l:`− Abonnements holding (${holdSubs.length})`,v:-holdSubsM,c:C.b,icon:"💻"}]:[]),
    ...(holdTeamM>0?[{l:`− Équipe holding (${holdTeam.length})`,v:-holdTeamM,c:C.o,icon:"👥"}]:[]),
    {l:"− Réserve",v:-hc.res,c:C.b,icon:"🛡️"},
    {l:"= Disponible",v:hc.dispo,c:hc.dispo>0?C.g:C.r,icon:"✨",total:true},
    ];
    const maxV=Math.max(...steps.map(s=>Math.abs(s.v)),1);
    return steps.map((s,i)=><div key={i} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:s.total?`1px solid ${C.brd}`:"none",marginTop:s.total?4:0,paddingTop:s.total?4:5}}>
    <span style={{fontSize:12,width:16,textAlign:"center"}}>{s.icon}</span>
    <span style={{flex:1,fontSize:s.total?11:10,fontWeight:s.total?700:500,color:s.total?C.t:C.td}}>{s.l}</span>
    <div style={{width:120,display:"flex",alignItems:"center",gap:4}}>
    <div style={{flex:1,height:6,background:C.bg,borderRadius:3,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${Math.abs(s.v)/maxV*100}%`,background:s.c,borderRadius:3,transition:"width .4s"}}/>
    </div>
    <span style={{fontWeight:700,fontSize:11,color:s.c,minWidth:55,textAlign:"right"}}>{s.v>=0?"+":""}{fmt(s.v)}€</span>
    </div>
    </div>);
    })()}
    </Card>
   </Sect>
   <Sect title="Ce que chaque société rapporte" sub="Remontées au holding ce mois">
    {socs.filter(s=>s.id!=="eco").map((s,i)=>{
    const r=gr(reps,s.id,cM2);const ca2=r?pf(r.ca):0,ch2=r?pf(r.charges):0;
    const presta2=r?pf(r.prestataireAmount||0):0;
    const base=s.pT==="ca"?ca2:Math.max(0,ca2-presta2);const remontee=base*s.pP/100;
    const margeNet=ca2-ch2;const margePct2=ca2>0?Math.round(margeNet/ca2*100):0;
    const salaire=r?pf(r.salaire):0;
    const divHold=r?pf(r.dividendesHolding):0;const resteVerser=remontee-divHold;
    return <Card key={s.id} accent={s.color} style={{marginBottom:4,padding:"10px 14px"}} delay={Math.min(i+1,8)}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
    <div style={{width:28,height:28,borderRadius:7,background:s.color+"22",border:`1.5px solid ${s.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,color:s.color}}>{s.nom[0]}</div>
    <div style={{flex:1}}>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
    <span style={{fontWeight:700,fontSize:12}}>{s.nom}</span>
    <span style={{fontSize:9,color:C.td}}>({s.pP}% {s.pT==="ca"?"du CA":"CA hors presta"})</span>
    </div>
    <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap"}}>
    <span style={{fontSize:9,color:C.td}}>CA: <strong style={{color:C.t}}>{fmt(ca2)}€</strong></span>
    {presta2>0&&<span style={{fontSize:9,color:C.td}}>Presta: <strong style={{color:C.o}}>{fmt(presta2)}€</strong></span>}
    <span style={{fontSize:9,color:C.td}}>Marge: <strong style={{color:margeNet>=0?C.g:C.r}}>{fmt(margeNet)}€ ({margePct2}%)</strong></span>
    {salaire>0&&<span style={{fontSize:9,color:C.td}}>Rém fondateur: <strong style={{color:C.o}}>{fmt(salaire)}€</strong></span>}
    {divHold>0&&<span style={{fontSize:9,color:"#7c3aed"}}>🏛️ Viré: <strong>{fmt(divHold)}€</strong></span>}
    </div>
    </div>
    <div style={{textAlign:"right"}}>
    <div style={{fontWeight:900,fontSize:16,color:C.acc}}>{fmt(remontee)}€</div>
    <div style={{fontSize:8,color:C.td}}>théorique</div>
    {divHold>0&&<div style={{fontSize:9,fontWeight:700,color:resteVerser>0?C.o:C.g,marginTop:2}}>{resteVerser>0?`⚠ Reste ${fmt(resteVerser)}€`:`✅ +${fmt(Math.abs(resteVerser))}€`}</div>}
    </div>
    </div>
    </Card>;
    })}
    <Card style={{marginTop:6,padding:"10px 14px",background:C.accD,border:`1px solid ${C.acc}22`}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <span style={{fontWeight:700,fontSize:12,color:C.acc}}>Total remontées</span>
    <span style={{fontWeight:900,fontSize:16,color:C.acc}}>{fmt(hc.rem)}€</span>
    </div>
    </Card>
   </Sect>
   <Sect title="Évolution des revenus"><div className="fu d4" style={{height:200,background:C.card,borderRadius:12,border:`1px solid ${C.brd}`,padding:"14px 6px 6px 0"}}><ResponsiveContainer><BarChart data={allM.map(m=>{const h2=calcH(socs,reps,hold,m);return{mois:ml(m),Entrant:h2.tIn,Rémunération:hold.remun,Dispo:h2.dispo};}).filter(d=>d.Entrant>0)}><CartesianGrid strokeDasharray="3 3" stroke={C.brd}/><XAxis dataKey="mois" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/><Tooltip content={<CTip/>}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="Entrant" fill={C.g} radius={[3,3,0,0]}/><Bar dataKey="Rémunération" fill={C.acc} radius={[3,3,0,0]}/><Bar dataKey="Dispo" fill={C.b} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div></Sect>
   <Modal open={eHold} onClose={()=>setEHold(false)} title="Paramètres holding" wide><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}><Inp label="Logiciels" type="number" value={hold.logiciels} onChange={v=>setHold({...hold,logiciels:pf(v)})} suffix="€"/><Inp label="Équipe" type="number" value={hold.equipe} onChange={v=>setHold({...hold,equipe:pf(v)})} suffix="€"/><Inp label="Service" type="number" value={hold.service} onChange={v=>setHold({...hold,service:pf(v)})} suffix="€"/><Inp label="Cabinet" type="number" value={hold.cabinet} onChange={v=>setHold({...hold,cabinet:pf(v)})} suffix="€"/><Inp label="Rémunération" type="number" value={hold.remun} onChange={v=>setHold({...hold,remun:pf(v)})} suffix="€"/><Inp label="Réserve" type="number" value={hold.reservePct} onChange={v=>setHold({...hold,reservePct:pf(v)})} suffix="%"/><Inp label="CRM/soc" type="number" value={hold.crm} onChange={v=>setHold({...hold,crm:pf(v)})} suffix="€"/><Inp label="Trésorerie" type="number" value={hold.treso} onChange={v=>setHold({...hold,treso:pf(v)})} suffix="€"/></div><div style={{marginTop:12,padding:"12px 14px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><span style={{fontSize:16}}>🏦</span><span style={{fontWeight:700,fontSize:12,color:C.td}}>REVOLUT BUSINESS</span></div><Inp label="API Token" value={hold.revolutToken||""} onChange={v=>setHold({...hold,revolutToken:v})} placeholder="oa_sand_..." note="Settings → API → Generate token (avec les scopes accounts:read + transactions:read)"/><Sel label="Environnement" value={hold.revolutEnv||"sandbox"} onChange={v=>setHold({...hold,revolutEnv:v})} options={[{v:"sandbox",l:"Sandbox (test)"},{v:"production",l:"Production (live)"}]}/></div>
   <div style={{marginTop:12,padding:"12px 14px",background:C.bg,borderRadius:10,border:`1px solid ${hold.slack?.enabled?C.g+"44":C.brd}`}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
    <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16}}>💬</span><span style={{fontWeight:700,fontSize:12,color:C.td}}>SLACK</span></div>
    <Toggle on={hold.slack?.enabled||false} onToggle={()=>setHold({...hold,slack:{...(hold.slack||DH.slack),enabled:!(hold.slack?.enabled)}})} label=""/>
    </div>
    {hold.slack?.enabled&&<>
    <div style={{display:"flex",gap:4,marginBottom:10}}>
    {Object.entries(SLACK_MODES).map(([k,v])=>{const active2=hold.slack?.mode===k;return <button key={k} onClick={()=>setHold({...hold,slack:{...hold.slack,mode:k}})} style={{flex:1,padding:"8px 6px",borderRadius:8,border:`1.5px solid ${active2?C.acc:C.brd}`,background:active2?C.accD:C.card,color:active2?C.acc:C.td,fontWeight:active2?700:500,fontSize:10,cursor:"pointer",fontFamily:FONT,transition:"all .15s",textAlign:"center"}}><div style={{fontSize:14,marginBottom:2}}>{v.icon}</div>{v.l}<div style={{fontSize:7,color:C.td,marginTop:2}}>{v.desc.slice(0,30)}</div></button>;})}
    </div>
    {hold.slack?.mode==="webhook"&&<Inp label="Webhook URL" value={hold.slack?.webhookUrl||""} onChange={v=>setHold({...hold,slack:{...hold.slack,webhookUrl:v}})} placeholder="https://hooks.slack.com/services/..." small/>}
    {hold.slack?.mode==="bot"&&<><Inp label="Bot OAuth Token" value={hold.slack?.botToken||""} onChange={v=>setHold({...hold,slack:{...hold.slack,botToken:v}})} placeholder="xoxb-..." note="Slack → Apps → Your App → OAuth → Bot User OAuth Token"/><Inp label="Channel ID" value={hold.slack?.channel||""} onChange={v=>setHold({...hold,slack:{...hold.slack,channel:v}})} placeholder="C06..." note="Clic droit sur le channel → Copier l'ID du channel"/></>}
    {hold.slack?.mode==="bob"&&<Inp label="Bob Webhook URL" value={hold.slack?.bobWebhook||""} onChange={v=>setHold({...hold,slack:{...hold.slack,bobWebhook:v}})} placeholder="https://your-bob-webhook.com/..." small/>}
    <div style={{padding:"8px 10px",background:C.card2,borderRadius:8,marginTop:8}}>
    <div style={{fontSize:9,color:C.td,fontWeight:700,marginBottom:6}}>NOTIFICATIONS</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
    <Toggle on={hold.slack?.notifyReport!==false} onToggle={()=>setHold({...hold,slack:{...hold.slack,notifyReport:!hold.slack?.notifyReport}})} label="📊 Rapports soumis"/>
    <Toggle on={hold.slack?.notifyPulse!==false} onToggle={()=>setHold({...hold,slack:{...hold.slack,notifyPulse:!hold.slack?.notifyPulse}})} label="⚡ Pulses envoyés"/>
    <Toggle on={hold.slack?.notifyValidation!==false} onToggle={()=>setHold({...hold,slack:{...hold.slack,notifyValidation:!hold.slack?.notifyValidation}})} label="✅ Rapports validés"/>
    <Toggle on={hold.slack?.notifyReminders!==false} onToggle={()=>setHold({...hold,slack:{...hold.slack,notifyReminders:!hold.slack?.notifyReminders}})} label="🔔 Rappels auto"/>
    </div>
    </div>
    <div style={{marginTop:8}}><Btn small v="secondary" onClick={async()=>{const r=await slackSend(hold.slack,{text:`🧪 Test ${hold.brand?.name||"Scale Corp"} — Slack est bien connecté ! 🎉`,blocks:[{type:"section",text:{type:"mrkdwn",text:`🧪 *Test ${hold.brand?.name||"Scale Corp"}*\n\nSlack est bien connecté ! Les notifications de rapports et pulses arriveront ici.\n\n_Mode: ${SLACK_MODES[hold.slack?.mode]?.l}_`}}]});alert(r.ok?"✅ Message envoyé avec succès !":"❌ Erreur: "+(r.error||"échec"));}}>🧪 Envoyer un test</Btn></div>
    </>}
   </div>
   <div style={{marginTop:12,padding:"12px 14px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><span style={{fontSize:16}}>🎨</span><span style={{fontWeight:700,fontSize:12,color:C.td}}>BRANDING</span></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
    <Inp label="Nom de la plateforme" value={hold.brand?.name||"L'INCUBATEUR ECS"} onChange={v=>setHold({...hold,brand:{...(hold.brand||DH.brand),name:v}})}/>
    <Inp label="Sous-titre" value={hold.brand?.sub||"Plateforme de pilotage"} onChange={v=>setHold({...hold,brand:{...(hold.brand||DH.brand),sub:v}})}/>
    <Inp label="Logo URL (optionnel)" value={hold.brand?.logoUrl||""} onChange={v=>setHold({...hold,brand:{...(hold.brand||DH.brand),logoUrl:v}})} placeholder="https://..."/>
    <Inp label="Lettre logo (fallback)" value={hold.brand?.logoLetter||"S"} onChange={v=>setHold({...hold,brand:{...(hold.brand||DH.brand),logoLetter:v.slice(0,2)}})}/>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginTop:4}}>
     <label style={{fontSize:10,color:C.td,fontWeight:600}}>Couleur accent</label>
     <input type="color" value={hold.brand?.accentColor||"#FFAA00"} onChange={e=>setHold({...hold,brand:{...(hold.brand||DH.brand),accentColor:e.target.value}})} style={{width:32,height:24,border:`1px solid ${C.brd}`,borderRadius:6,background:C.bg,cursor:"pointer"}}/>
     <span style={{fontSize:10,color:C.td}}>{hold.brand?.accentColor||"#FFAA00"}</span>
    </div>
    {hold.brand?.logoUrl&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:9,color:C.td}}>Aperçu:</span><div style={{width:36,height:36,borderRadius:8,overflow:"hidden",border:`1px solid ${C.brd}`}}><img src={hold.brand.logoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div></div>}
   </div>
   <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={()=>{save(null,null,hold);setEHold(false);}}>Sauver</Btn><Btn v="secondary" onClick={()=>setEHold(false)}>Annuler</Btn></div></Modal>
   <Sect title="🔄 Charges récurrentes holding" right={<Btn small v="ghost" onClick={()=>setTab(13)}>Tout gérer →</Btn>}>
    {holdSubs.length>0&&<div style={{marginBottom:8}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:4}}>ABONNEMENTS · {fmt(holdSubsM)}€/m</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
    {holdSubs.map(s=><span key={s.id} style={{fontSize:9,background:C.card,border:`1px solid ${C.brd}`,padding:"3px 8px",borderRadius:6}}>{s.name} <strong style={{color:C.b}}>{fmt(subMonthly(s))}€</strong><span style={{color:C.td}}>/{s.freq==="annual"?"an":"m"}</span></span>)}
    </div>
    </div>}
    {holdTeam.length>0&&<div>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:4}}>ÉQUIPE · {fmt(holdTeamM)}€/m</div>
    {holdTeam.map(t=><div key={t.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",background:C.card,borderRadius:6,border:`1px solid ${C.brd}`,marginBottom:2}}>
    <span style={{width:20,height:20,borderRadius:5,background:C.oD,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:9,color:C.o}}>{t.name[0]}</span>
    <span style={{flex:1,fontSize:10,fontWeight:600}}>{t.name}</span>
    <span style={{fontSize:9,color:C.td}}>{t.role}</span>
    <span style={{fontWeight:700,fontSize:10,color:t.payType==="fixed"?C.b:C.o}}>{t.payType==="fixed"?`${fmt(t.amount)}€/m`:`${t.amount}%`}</span>
    </div>)}
    </div>}
    {holdSubs.length===0&&holdTeam.length===0&&<div style={{color:C.td,fontSize:11,padding:8,textAlign:"center"}}>Aucune charge récurrente</div>}
    {allSubsM+allTeamM>holdSubsM+holdTeamM&&<div style={{marginTop:10,padding:"8px 10px",background:C.rD,borderRadius:8,border:`1px solid ${C.r}15`}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,marginBottom:4}}>TOUTES SOCIÉTÉS CONFONDUES</div>
    <div style={{display:"flex",gap:12}}>
    <span style={{fontSize:10,color:C.r}}>Abos: <strong>{fmt(allSubsM)}€/m</strong></span>
    <span style={{fontSize:10,color:C.o}}>Équipe: <strong>{fmt(allTeamM)}€/m</strong></span>
    <span style={{fontSize:10,color:C.r,fontWeight:700}}>Total: {fmt(allSubsM+allTeamM)}€/m</span>
    </div>
    </div>}
   </Sect>
  </>;})()}
  {tab===5&&<AICoPilot socs={socs} reps={reps} hold={hold} actions={actions} pulses={pulses} allM={allM} revData={revData} socBank={socBank} okrs={okrs} synergies={synergies} clients={clients}/>}
  {tab===6&&<DealFlow deals={deals} saveDeals={saveDeals}/>}
  {tab===7&&<TabCRM socs={socs} ghlData={ghlData} onSync={syncGHL}/>}
  {tab===8&&<BankingPanel revData={revData} onSync={syncRev} clients={clients}/>}
  {tab===10&&<SynergiesPanel socs={socs} synergies={synergies} saveSynergies={saveSynergies}/>}
  {tab===11&&<KnowledgeBase socs={socs} kb={kb} saveKb={saveKb}/>}
  {tab===12&&<ChallengesPanel socs={socs} reps={reps} allM={allM} pulses={pulses} challenges={challenges} saveChallenges={saveChallenges}/>}
  {tab===13&&<SubsTeamPanel socs={socs} subs={subs} saveSubs={saveSubs} team={team} saveTeam={saveTeam} socId="all" reps={reps} revData={revData}/>}
  {tab===14&&<UserAccessPanel socs={socs}/>}
  {tab===15&&<>
   {/* SALES GLOBAL */}
   <div style={{fontWeight:800,fontSize:16,fontFamily:FONT_TITLE,marginBottom:14}}>📞 Sales — Vue consolidée</div>
   {(()=>{
    const totalLeads=actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.leads),0);
    const totalClos=actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.leadsClos),0);
    const totalPipeline=actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.pipeline),0);
    const convRate=totalLeads>0?Math.round(totalClos/totalLeads*100):0;
    return <><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginBottom:14}}>
     <KPI label="Leads Total" value={totalLeads} accent={C.b} icon="📞" delay={1}/>
     <KPI label="Deals Clos" value={totalClos} accent={C.g} icon="✅" delay={2}/>
     <KPI label="Pipeline" value={`${fmt(totalPipeline)}€`} accent={C.acc} icon="🔄" delay={3}/>
     <KPI label="Conversion" value={`${convRate}%`} accent={convRate>20?C.g:C.o} icon="📈" delay={4}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
     <Card style={{padding:14}}><div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>📊 LEADS PAR SOCIÉTÉ</div>
      <div style={{height:220}}><ResponsiveContainer><BarChart data={actS.filter(s=>s.id!=="eco").map(s=>({nom:s.nom,leads:pf(gr(reps,s.id,cM2)?.leads),clos:pf(gr(reps,s.id,cM2)?.leadsClos),color:s.color}))}><CartesianGrid strokeDasharray="3 3" stroke={C.brd}/><XAxis dataKey="nom" tick={{fill:C.td,fontSize:8}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/><Tooltip content={<CTip/>}/><Legend wrapperStyle={{fontSize:9}}/><Bar dataKey="leads" fill={C.b} radius={[3,3,0,0]} name="Leads"/><Bar dataKey="clos" fill={C.g} radius={[3,3,0,0]} name="Clos"/></BarChart></ResponsiveContainer></div>
     </Card>
     <Card style={{padding:14}}><div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>📈 CONVERSION PAR SOCIÉTÉ</div>
      {actS.filter(s=>s.id!=="eco").map((s,i)=>{const l=pf(gr(reps,s.id,cM2)?.leads);const c=pf(gr(reps,s.id,cM2)?.leadsClos);const rt=l>0?Math.round(c/l*100):0;
       return <div key={s.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.brd}08`}}>
        <span style={{width:5,height:5,borderRadius:3,background:s.color}}/><span style={{flex:1,fontSize:10,fontWeight:600}}>{s.nom}</span>
        <div style={{width:80,height:5,background:C.brd,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${rt}%`,background:rt>30?C.g:rt>15?C.o:C.r,borderRadius:3}}/></div>
        <span style={{fontWeight:700,fontSize:10,color:rt>30?C.g:rt>15?C.o:C.r,minWidth:30,textAlign:"right"}}>{rt}%</span>
       </div>;})}
     </Card>
    </div></>;
   })()}
  </>}
  {tab===16&&<>
   {/* PUBLICITÉ GLOBAL */}
   <div style={{fontWeight:800,fontSize:16,fontFamily:FONT_TITLE,marginBottom:14}}>📣 Publicité — Vue consolidée</div>
   {(()=>{
    const totalPub=actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.pub),0);
    const totalCA=actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.ca),0);
    const totalLeads2=actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.leads),0);
    const cplG=totalLeads2>0?Math.round(totalPub/totalLeads2):0;
    const roasG=totalPub>0?Math.round(totalCA/totalPub*100)/100:0;
    return <><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginBottom:14}}>
     <KPI label="Dépenses Pub" value={`${fmt(totalPub)}€`} accent={C.r} icon="📣" delay={1}/>
     <KPI label="CA Généré" value={`${fmt(totalCA)}€`} accent={C.g} icon="💰" delay={2}/>
     <KPI label="CPL Moyen" value={cplG>0?`${fmt(cplG)}€`:"—"} accent={C.o} icon="📞" delay={3}/>
     <KPI label="ROAS Global" value={roasG>0?`${roasG}x`:"—"} accent={roasG>3?C.g:roasG>1?C.o:C.r} icon="📈" delay={4}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
     <Card style={{padding:14}}><div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>💸 PUB vs CA PAR SOCIÉTÉ</div>
      <div style={{height:220}}><ResponsiveContainer><BarChart data={actS.filter(s=>s.id!=="eco"&&pf(gr(reps,s.id,cM2)?.pub)>0).map(s=>({nom:s.nom,pub:pf(gr(reps,s.id,cM2)?.pub),ca:pf(gr(reps,s.id,cM2)?.ca)}))}><CartesianGrid strokeDasharray="3 3" stroke={C.brd}/><XAxis dataKey="nom" tick={{fill:C.td,fontSize:8}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/><Tooltip content={<CTip/>}/><Legend wrapperStyle={{fontSize:9}}/><Bar dataKey="pub" fill={C.r} radius={[3,3,0,0]} name="Pub"/><Bar dataKey="ca" fill={C.g} radius={[3,3,0,0]} name="CA"/></BarChart></ResponsiveContainer></div>
     </Card>
     <Card style={{padding:14}}><div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>📊 CPL / ROAS PAR SOCIÉTÉ</div>
      {actS.filter(s=>s.id!=="eco").map((s,i)=>{const pub2=pf(gr(reps,s.id,cM2)?.pub);const ca2=pf(gr(reps,s.id,cM2)?.ca);const l2=pf(gr(reps,s.id,cM2)?.leads);const cpl2=l2>0?Math.round(pub2/l2):0;const roas2=pub2>0?Math.round(ca2/pub2*100)/100:0;
       return <div key={s.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.brd}08`}}>
        <span style={{width:5,height:5,borderRadius:3,background:s.color}}/><span style={{flex:1,fontSize:10,fontWeight:600}}>{s.nom}</span>
        <span style={{fontSize:9,color:C.td}}>CPL: <strong style={{color:cpl2>50?C.r:C.g}}>{cpl2>0?fmt(cpl2)+"€":"—"}</strong></span>
        <span style={{fontSize:9,color:C.td}}>ROAS: <strong style={{color:roas2>3?C.g:roas2>1?C.o:C.r}}>{roas2>0?roas2+"x":"—"}</strong></span>
       </div>;})}
     </Card>
    </div></>;
   })()}
  </>}
  {tab===17&&<>
   {/* RAPPORTS */}
   <div style={{fontWeight:800,fontSize:16,fontFamily:FONT_TITLE,marginBottom:14}}>📋 Rapports Holding</div>
   <Card style={{padding:14,marginBottom:12}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>📊 RAPPORT MENSUEL — {ml(cM2)}</div>
    <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
     <thead><tr style={{borderBottom:`2px solid ${C.brd}`}}>{["Société","CA","Charges","Marge","%","Leads","Clos","Conv.","Pub","ROAS"].map(h=><th key={h} style={{padding:"6px 8px",textAlign:"left",color:C.td,fontWeight:600,fontSize:9}}>{h}</th>)}</tr></thead>
     <tbody>{actS.filter(s=>s.id!=="eco").map(s=>{const r=gr(reps,s.id,cM2);const ca2=pf(r?.ca);const ch2=pf(r?.charges);const m2=ca2-ch2;const mp=ca2>0?Math.round(m2/ca2*100):0;const l=pf(r?.leads);const c=pf(r?.leadsClos);const cv=l>0?Math.round(c/l*100):0;const pb=pf(r?.pub);const rs2=pb>0?Math.round(ca2/pb*100)/100:0;
      return <tr key={s.id} style={{borderBottom:`1px solid ${C.brd}08`}}>
       <td style={{padding:"6px 8px",fontWeight:600}}><span style={{width:6,height:6,borderRadius:3,background:s.color,display:"inline-block",marginRight:6}}/>{s.nom}</td>
       <td style={{padding:"6px 8px",fontWeight:700,color:C.acc}}>{fmt(ca2)}€</td>
       <td style={{padding:"6px 8px",color:C.r}}>{fmt(ch2)}€</td>
       <td style={{padding:"6px 8px",color:m2>=0?C.g:C.r,fontWeight:700}}>{fmt(m2)}€</td>
       <td style={{padding:"6px 8px",color:C.td}}>{mp}%</td>
       <td style={{padding:"6px 8px"}}>{l||"—"}</td>
       <td style={{padding:"6px 8px",color:C.g}}>{c||"—"}</td>
       <td style={{padding:"6px 8px",color:cv>20?C.g:C.o}}>{cv>0?cv+"%":"—"}</td>
       <td style={{padding:"6px 8px",color:C.r}}>{pb>0?fmt(pb)+"€":"—"}</td>
       <td style={{padding:"6px 8px",color:rs2>3?C.g:rs2>1?C.o:C.r,fontWeight:700}}>{rs2>0?rs2+"x":"—"}</td>
      </tr>;})}
     <tr style={{borderTop:`2px solid ${C.acc}33`,background:C.accD}}>
      <td style={{padding:"6px 8px",fontWeight:800,color:C.acc}}>TOTAL</td>
      <td style={{padding:"6px 8px",fontWeight:800,color:C.acc}}>{fmt(actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.ca),0))}€</td>
      <td style={{padding:"6px 8px",fontWeight:700,color:C.r}}>{fmt(actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.charges),0))}€</td>
      <td style={{padding:"6px 8px",fontWeight:700,color:C.g}}>{fmt(actS.reduce((a,s)=>{const r=gr(reps,s.id,cM2);return a+pf(r?.ca)-pf(r?.charges);},0))}€</td>
      <td colSpan={6}/>
     </tr>
     </tbody>
    </table></div>
   </Card>
   <Card style={{padding:14}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>📅 STATUT DES RAPPORTS — {ml(cM2)}</div>
    {socs.map((s,i)=>{const r=gr(reps,s.id,cM2);return <div key={s.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderBottom:`1px solid ${C.brd}08`}}>
     <span style={{width:5,height:5,borderRadius:3,background:s.color}}/><span style={{flex:1,fontSize:11,fontWeight:600}}>{s.nom}</span>
     {r?.ok&&<span style={{fontSize:9,color:C.g,background:C.gD,padding:"2px 8px",borderRadius:6,fontWeight:600}}>✅ Validé</span>}
     {r&&!r.ok&&<span style={{fontSize:9,color:C.o,background:C.oD,padding:"2px 8px",borderRadius:6,fontWeight:600}}>⏳ En attente</span>}
     {!r&&<span style={{fontSize:9,color:C.r,background:C.rD,padding:"2px 8px",borderRadius:6,fontWeight:600}}>❌ Manquant</span>}
    </div>;})}
   </Card>
  </>}
  {tab===18&&<>
   {/* PARAMÈTRES */}
   <div style={{fontWeight:800,fontSize:16,fontFamily:FONT_TITLE,marginBottom:14}}>⚙️ Paramètres Holding</div>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
    <Card style={{padding:16}}>
     <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><span style={{fontSize:16}}>🎨</span><span style={{fontWeight:700,fontSize:12}}>Branding</span></div>
     <Inp label="Nom plateforme" value={hold.brand?.name||"L'INCUBATEUR ECS"} onChange={v=>setHold({...hold,brand:{...(hold.brand||DH.brand),name:v}})}/>
     <Inp label="Sous-titre" value={hold.brand?.sub||""} onChange={v=>setHold({...hold,brand:{...(hold.brand||DH.brand),sub:v}})}/>
     <Inp label="Logo URL" value={hold.brand?.logoUrl||""} onChange={v=>setHold({...hold,brand:{...(hold.brand||DH.brand),logoUrl:v}})} placeholder="https://..."/>
     <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
      <label style={{fontSize:10,color:C.td,fontWeight:600}}>Couleur accent</label>
      <input type="color" value={hold.brand?.accentColor||"#FFAA00"} onChange={e=>setHold({...hold,brand:{...(hold.brand||DH.brand),accentColor:e.target.value}})} style={{width:28,height:22,border:`1px solid ${C.brd}`,borderRadius:6,cursor:"pointer"}}/>
     </div>
    </Card>
    <Card style={{padding:16}}>
     <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><span style={{fontSize:16}}>💰</span><span style={{fontWeight:700,fontSize:12}}>Finance Holding</span></div>
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 8px"}}>
      <Inp label="Réserve" type="number" value={hold.reservePct} onChange={v=>setHold({...hold,reservePct:pf(v)})} suffix="%"/>
      <Inp label="Rémunération" type="number" value={hold.remun} onChange={v=>setHold({...hold,remun:pf(v)})} suffix="€"/>
      <Inp label="Logiciels" type="number" value={hold.logiciels} onChange={v=>setHold({...hold,logiciels:pf(v)})} suffix="€"/>
      <Inp label="Cabinet" type="number" value={hold.cabinet} onChange={v=>setHold({...hold,cabinet:pf(v)})} suffix="€"/>
     </div>
    </Card>
    <Card style={{padding:16}}>
     <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><span style={{fontSize:16}}>🏢</span><span style={{fontWeight:700,fontSize:12}}>Sociétés ({socs.length})</span></div>
     {socs.slice(0,8).map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:`1px solid ${C.brd}08`}}>
      <span style={{width:5,height:5,borderRadius:3,background:s.color}}/><span style={{flex:1,fontSize:10,fontWeight:600}}>{s.nom}</span>
      <Badge s={s.stat}/>
      <button onClick={()=>setESoc({...s})} style={{fontSize:8,color:C.td,background:"none",border:`1px solid ${C.brd}`,borderRadius:4,padding:"2px 6px",cursor:"pointer",fontFamily:FONT}}>✏️</button>
     </div>)}
     <Btn small style={{marginTop:8}} onClick={()=>setTab(1)}>Gérer toutes →</Btn>
    </Card>
    <Card style={{padding:16}}>
     <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><span style={{fontSize:16}}>🔌</span><span style={{fontWeight:700,fontSize:12}}>Connexions API</span></div>
     {[{name:"GoHighLevel",status:socs.some(s=>s.ghlKey),icon:"📡"},{name:"Revolut",status:!!hold.revolutToken||socs.some(s=>s.revToken),icon:"🏦"},{name:"Stripe",status:false,icon:"💳"},{name:"Slack",status:hold.slack?.enabled,icon:"💬"},{name:"Meta Ads",status:false,icon:"📱"}].map(api=><div key={api.name} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:`1px solid ${C.brd}08`}}>
      <span style={{fontSize:12}}>{api.icon}</span>
      <span style={{flex:1,fontSize:11,fontWeight:600}}>{api.name}</span>
      <span style={{fontSize:10,fontWeight:600,color:api.status?C.g:C.td}}>{api.status?"✅ Connecté":"⏳ Non connecté"}</span>
     </div>)}
    </Card>
   </div>
   <Sect title="📱 Widgets Porteur" sub="Embed pour chaque société">
    {actS.filter(s=>s.id!=="eco").map(s=><Suspense fallback={<div/>}><LazyWidgetEmbed key={s.id} soc={s} clients={clients}/></Suspense>)}
   </Sect>
   <div style={{marginTop:12}}><Btn onClick={()=>{save(null,null,hold);}}>💾 Sauvegarder les paramètres</Btn></div>
  </>}
  </div>
  </div>
 </div>;
}
