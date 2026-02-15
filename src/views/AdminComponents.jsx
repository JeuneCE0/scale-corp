import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import * as U from "../utils/index.jsx";
// Destructure commonly used utilities for readability
const { C, C_DARK, C_LIGHT, getTheme, applyTheme, MN, curM, ml, fmt, fK, pct, clamp, prevM, nextM, pf, gr, FONT, FONT_TITLE, BF, deadline, qOf, qMonths, qLabel, ago, uid, curW, MOODS, sinceLbl, sinceMonths, CSS, DS, DH, DEAL_STAGES, DEMO_JOURNAL, DEMO_ACTIONS, DEMO_PULSES, DEMO_DEALS, DEMO_OKRS, DEMO_SYNERGIES, DEMO_SUBS, DEMO_TEAM, DEMO_CLIENTS, SYN_TYPES, SYN_STATUS, SUB_CATS, SLACK_MODES, EXCLUDED_ACCOUNTS, CURR_SYMBOLS, REV_ENVS, GHL_BASE, STRIPE_PROXY, STORE_URL, ErrorBoundary, mkPrefill, autoGenerateReport, autoCategorize, autoDetectSubscriptions, subMonthly, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, generateInvoices, refreshInvoiceStatuses, ghlCreateInvoice, ghlSendInvoice, mkDemoInvoices, teamMonthly, normalizeStr, fuzzyMatch, matchSubsToRevolut, deduplicatedCharges, mkGHLDemo, ghlUpdateContact, ghlCreateContact, fetchGHL, syncGHLForSoc, slackWebhookSend, slackBotSend, slackSend, slackMention, buildPulseSlackMsg, buildReportSlackMsg, buildReminderSlackMsg, buildValidationSlackMsg, checkAndSendReminders, fetchStripe, syncStripeData, getStripeChargesForClient, getStripeTotal, mkRevolutDemo, fetchRevolut, syncRevolut, mkSocRevDemo, syncSocRevolut, revFinancials, storeCall, sbAuthHeaders, sbUpsert, sbGet, sbList, sGet, sSet, syncFromSupabase, fetchHoldingFromSB, fetchSocietiesFromSB, calcH, simH, healthScore, leadScore, leadScoreColor, leadScoreLabel, qCA, getAlerts, buildFeed, project, runway, calcLeaderboard, buildAIContext, calcMilestoneData, calcMilestones, calcSmartAlerts, genInsights, calcBenchmark, getPlaybooks, calcClientHealthScore, genPorteurNotifications, BILL_TYPES, CLIENT_STATUS, curQ, AUTO_CAT_MAP, categorizeTransaction, DEMO_KB } = U;

import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";
import { MilestonesWall, MilestonesCompact, MilestoneCount, AICoPilot, PulseForm, PulseOverview, BankingPanel, BankingTransactions, TabCRM, SocBankWidget, SynergiesPanel, KnowledgeBase, RiskMatrix, GamificationPanel, InboxUnifiee, ParcoursClientVisuel, BenchmarkRadar, SmartAlertsPanel, SubsTeamPanel, SubsTeamBadge, ChallengesPanel, AIWeeklyCoach, RapportsPanel, DealFlow, MeetingMode, CohortAnalysis } from "../components/features.jsx";
import { ClientsPanelSafe } from "./Clients.jsx";
import { PorteurDashboard, LeaderboardCard, PulseDashWidget } from "./PorteurDashboard.jsx";
import { SocieteView } from "./SocieteView.jsx";

export function AdminClientsTab({clients,socs}){
 const[clSearch,setClSearch]=useState("");const[clSort,setClSort]=useState("ca");
 const allCl=(clients||[]);const activeAll=allCl.filter(c=>c.status==="active");const churnedAll=allCl.filter(c=>c.status==="churned");
 const totalMRR=activeAll.reduce((a,c)=>a+clientMonthlyRevenue(c),0);
 const filtered=allCl.filter(c=>!clSearch||c.name?.toLowerCase().includes(clSearch.toLowerCase())||socs.find(s=>s.id===c.socId)?.nom?.toLowerCase().includes(clSearch.toLowerCase()));
 const sorted=[...filtered].sort((a,b)=>{if(clSort==="ca")return clientMonthlyRevenue(b)-clientMonthlyRevenue(a);if(clSort==="society")return(a.socId||"").localeCompare(b.socId||"");return(a.name||"").localeCompare(b.name||"");});
 return <><div style={{fontWeight:800,fontSize:16,fontFamily:FONT_TITLE,marginBottom:14}}>👥 Clients — Toutes sociétés</div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginBottom:14}}>
   <KPI label="Total clients" value={allCl.length} accent={C.b} icon="👥" delay={1}/>
   <KPI label="Actifs" value={activeAll.length} accent={C.g} icon="✅" delay={2}/>
   <KPI label="Perdus" value={churnedAll.length} accent={C.r} icon="❌" delay={3}/>
   <KPI label="MRR Global" value={`${fmt(totalMRR)}€`} accent={C.acc} icon="💰" delay={4}/>
   <KPI label="LTV Moyen" value={activeAll.length>0?`${fmt(Math.round(totalMRR/activeAll.length*12))}€`:"—"} accent={C.v} icon="📊" delay={5}/>
  </div>
  <div style={{display:"flex",gap:8,marginBottom:12}}>
   <input value={clSearch} onChange={e=>setClSearch(e.target.value)} placeholder="🔍 Rechercher un client..." style={{flex:1,padding:"8px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
   <select value={clSort} onChange={e=>setClSort(e.target.value)} style={{padding:"8px 10px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:10,fontFamily:FONT,outline:"none"}}><option value="ca">Trier par CA</option><option value="society">Par société</option><option value="name">Par nom</option></select>
  </div>
  {sorted.slice(0,30).map((c,i)=>{const s=socs.find(x=>x.id===c.socId);const rev=clientMonthlyRevenue(c);return <div key={c.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:C.card,borderRadius:10,border:`1px solid ${C.brd}`,marginBottom:3}}>
   <span style={{width:6,height:6,borderRadius:3,background:s?.color||C.td,flexShrink:0}}/>
   <div style={{flex:1,minWidth:0}}><span style={{fontWeight:600,fontSize:11}}>{c.name}</span>
    <span style={{fontSize:8,color:s?.color||C.td,background:(s?.color||C.td)+"15",padding:"1px 6px",borderRadius:6,marginLeft:6,fontWeight:600}}>{s?.nom||"?"}</span>
   </div>
   <span style={{fontSize:9,color:C.td}}>{CLIENT_STATUS[c.status]?.l||c.status}</span>
   <span style={{fontWeight:700,fontSize:11,color:C.acc,minWidth:50,textAlign:"right"}}>{fmt(rev)}€</span>
  </div>;})}
  {sorted.length>30&&<div style={{color:C.td,fontSize:10,textAlign:"center",padding:8}}>… et {sorted.length-30} autres clients</div>}
 </>;
}
export function WarRoom({soc,reps,allM,ghlData,clients,socBank,socs,onClose,readOnly}){
 const cm=curM();const r=gr(reps,soc.id,cm);
 const ca=r?pf(r.ca):0;const leads=r?pf(r.leads):0;const deals=r?pf(r.leadsClos):0;const pipeline=r?pf(r.pipeline):0;
 const[sprint,setSprint]=useState(()=>{try{const s=JSON.parse(localStorage.getItem(`warroom_sprint_${soc.id}`));return s||null;}catch{return null;}});
 const[showSetSprint,setShowSetSprint]=useState(false);
 const[spTitle,setSpTitle]=useState("");const[spTarget,setSpTarget]=useState("");const[spCurrent,setSpCurrent]=useState("");const[spDays,setSpDays]=useState("7");
 const[soundOn,setSoundOn]=useState(false);
 const[tick,setTick]=useState(0);
 useEffect(()=>{const iv=setInterval(()=>setTick(t=>t+1),1000);return()=>clearInterval(iv);},[]);
 const saveSprint=(sp)=>{setSprint(sp);try{localStorage.setItem(`warroom_sprint_${soc.id}`,JSON.stringify(sp));sSet(`warroom_sprint_${soc.id}`,sp);}catch{}};
 const createSprint=()=>{const dl=new Date();dl.setDate(dl.getDate()+parseInt(spDays||7));const sp={title:spTitle,target:parseInt(spTarget)||1,current:parseInt(spCurrent)||0,deadline:dl.toISOString(),socId:soc.id,createdAt:new Date().toISOString()};saveSprint(sp);setShowSetSprint(false);};
 const countdown=useMemo(()=>{if(!sprint?.deadline)return null;const diff=new Date(sprint.deadline)-Date.now();if(diff<=0)return{d:0,h:0,m:0,s:0,expired:true};return{d:Math.floor(diff/864e5),h:Math.floor((diff%864e5)/36e5),m:Math.floor((diff%36e5)/6e4),s:Math.floor((diff%6e4)/1e3),expired:false};},[sprint,tick]);
 const spPct=sprint?Math.min(100,Math.round((sprint.current/Math.max(1,sprint.target))*100)):0;
 // Activity stream
 const activities=useMemo(()=>{const acts=[];const gd=ghlData?.[soc.id];
  (gd?.opportunities||[]).slice(-5).forEach(o=>acts.push({icon:o.status==="won"?"🏆":"📌",text:`${o.name} — ${o.status==="won"?"Deal gagné":"En cours"}`,date:o.updatedAt||o.createdAt}));
  (gd?.calendarEvents||[]).slice(-3).forEach(e=>acts.push({icon:"📞",text:`Appel: ${e.title||e.calendarName||"RDV"}`,date:e.startTime}));
  const txns=(socBank?.[soc.id]?.transactions||[]).slice(0,3);
  txns.forEach(t=>{const leg=t.legs?.[0];if(leg&&leg.amount>0)acts.push({icon:"💰",text:`Paiement reçu: ${fmt(leg.amount)}€`,date:t.created_at});});
  return acts.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,8);
 },[ghlData,socBank,soc.id]);
 const shareUrl=`${window.location.origin}${window.location.pathname}#warroom/${soc.id}`;
 const neonGlow="0 0 20px rgba(255,170,0,.3),0 0 60px rgba(255,170,0,.1)";
 const glassPanel={background:"rgba(14,14,22,.7)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,170,0,.15)",borderRadius:16,padding:16,boxShadow:neonGlow};
 return <div style={{position:"fixed",inset:0,zIndex:2000,background:"#06060b",fontFamily:FONT,color:"#e4e4e7",overflow:"auto"}}>
  <style>{`@keyframes neonPulse{0%,100%{text-shadow:0 0 10px rgba(255,170,0,.5)}50%{text-shadow:0 0 20px rgba(255,170,0,.8),0 0 40px rgba(255,170,0,.3)}}
@keyframes ringProgress{from{stroke-dashoffset:283}to{stroke-dashoffset:var(--ring-off,283)}}
@keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.wr-kpi{transition:all .3s;animation:neonPulse 2s ease infinite}`}</style>
  {/* Top bar */}
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"1px solid rgba(255,170,0,.15)"}}>
   <div style={{display:"flex",alignItems:"center",gap:10}}>
    <span style={{fontSize:20}}>🎮</span>
    <span style={{fontWeight:900,fontSize:18,fontFamily:FONT_TITLE,color:"#FFAA00",textShadow:"0 0 20px rgba(255,170,0,.5)"}}>WAR ROOM</span>
    <span style={{fontSize:11,color:"#71717a"}}>· {soc.nom}</span>
   </div>
   <div style={{display:"flex",alignItems:"center",gap:8}}>
    <button onClick={()=>setSoundOn(!soundOn)} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"4px 10px",fontSize:10,color:soundOn?"#FFAA00":"#71717a",cursor:"pointer",fontFamily:FONT}}>{soundOn?"🔊":"🔇"} Son</button>
    {!readOnly&&<button onClick={()=>{navigator.clipboard?.writeText(shareUrl);}} style={{background:"rgba(255,170,0,.1)",border:"1px solid rgba(255,170,0,.2)",borderRadius:8,padding:"4px 10px",fontSize:10,color:"#FFAA00",cursor:"pointer",fontFamily:FONT}}>📤 Partager</button>}
    <button onClick={onClose} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"4px 10px",fontSize:10,color:"#e4e4e7",cursor:"pointer",fontFamily:FONT}}>✕ Fermer</button>
   </div>
  </div>
  {/* KPI Ticker */}
  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,padding:"14px 20px"}}>
   {[{l:"CA",v:`${fmt(ca)}€`,c:"#FFAA00"},{l:"Leads",v:leads,c:"#60a5fa"},{l:"Deals",v:deals,c:"#34d399"},{l:"Pipeline",v:`${fmt(pipeline)}€`,c:"#a78bfa"}].map(k=>
    <div key={k.l} className="wr-kpi" style={{...glassPanel,textAlign:"center",padding:"12px 8px"}}>
     <div style={{fontSize:9,color:"#71717a",fontWeight:700,letterSpacing:1,marginBottom:4}}>{k.l}</div>
     <div style={{fontSize:22,fontWeight:900,color:k.c,textShadow:`0 0 15px ${k.c}66`}}>{k.v}</div>
    </div>)}
  </div>
  {/* Main content */}
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,padding:"0 20px 20px"}}>
   {/* Focus Mode - Sprint Ring */}
   <div style={{...glassPanel,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:260}}>
    <svg width="160" height="160" viewBox="0 0 100 100">
     <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,170,0,.1)" strokeWidth="6"/>
     <circle cx="50" cy="50" r="45" fill="none" stroke="#FFAA00" strokeWidth="6" strokeLinecap="round" strokeDasharray="283" style={{"--ring-off":283-283*spPct/100,strokeDashoffset:283-283*spPct/100,filter:"drop-shadow(0 0 8px rgba(255,170,0,.5))",transition:"stroke-dashoffset 1s ease"}} transform="rotate(-90 50 50)"/>
     <text x="50" y="46" textAnchor="middle" fill="#FFAA00" fontSize="22" fontWeight="900" fontFamily={FONT}>{sprint?sprint.current:0}</text>
     <text x="50" y="60" textAnchor="middle" fill="#71717a" fontSize="8" fontFamily={FONT}>/ {sprint?sprint.target:0}</text>
    </svg>
    {sprint&&<div style={{marginTop:10,textAlign:"center"}}>
     <div style={{fontWeight:700,fontSize:13,color:"#e4e4e7",marginBottom:4}}>{sprint.title}</div>
     {countdown&&!countdown.expired&&<div style={{fontSize:12,color:"#FFAA00",fontWeight:600}}>{countdown.d}j {String(countdown.h).padStart(2,"0")}:{String(countdown.m).padStart(2,"0")}:{String(countdown.s).padStart(2,"0")}</div>}
     {countdown?.expired&&<div style={{fontSize:12,color:"#f87171",fontWeight:700}}>⏰ Temps écoulé !</div>}
     {!readOnly&&<div style={{display:"flex",gap:6,marginTop:8,justifyContent:"center"}}>
      <button onClick={()=>{const ns={...sprint,current:Math.min(sprint.target,sprint.current+1)};saveSprint(ns);}} style={{background:"rgba(52,211,153,.15)",border:"1px solid rgba(52,211,153,.3)",borderRadius:6,padding:"4px 12px",fontSize:10,color:"#34d399",cursor:"pointer",fontFamily:FONT}}>+1</button>
      <button onClick={()=>{const ns={...sprint,current:Math.max(0,sprint.current-1)};saveSprint(ns);}} style={{background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.2)",borderRadius:6,padding:"4px 8px",fontSize:10,color:"#f87171",cursor:"pointer",fontFamily:FONT}}>-1</button>
     </div>}
    </div>}
    {!sprint&&!readOnly&&<button onClick={()=>setShowSetSprint(true)} style={{marginTop:12,background:"rgba(255,170,0,.12)",border:"1px solid rgba(255,170,0,.25)",borderRadius:8,padding:"8px 16px",fontSize:11,color:"#FFAA00",cursor:"pointer",fontFamily:FONT,fontWeight:600}}>🎯 Lancer un Sprint</button>}
    {!sprint&&readOnly&&<div style={{marginTop:12,fontSize:11,color:"#71717a"}}>Aucun sprint actif</div>}
   </div>
   {/* Activity Stream */}
   <div style={{...glassPanel,maxHeight:320,overflow:"auto"}}>
    <div style={{fontSize:9,color:"#71717a",fontWeight:700,letterSpacing:1,marginBottom:10}}>📡 ACTIVITÉ EN DIRECT</div>
    {activities.length===0&&<div style={{color:"#71717a",fontSize:11,textAlign:"center",padding:20}}>Aucune activité récente</div>}
    {activities.map((a,i)=><div key={i} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
     <span style={{fontSize:14}}>{a.icon}</span>
     <span style={{flex:1,fontSize:10,color:"#e4e4e7"}}>{a.text}</span>
     <span style={{fontSize:8,color:"#71717a",whiteSpace:"nowrap"}}>{a.date?ago(a.date):""}</span>
    </div>)}
   </div>
  </div>
  {/* Sprint setup modal */}
  {showSetSprint&&<div className="fi" onClick={()=>setShowSetSprint(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:2100,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}>
   <div className="si" onClick={e=>e.stopPropagation()} style={{...glassPanel,width:380,maxWidth:"90vw"}}>
    <div style={{fontWeight:800,fontSize:14,marginBottom:12,color:"#FFAA00"}}>🎯 Nouveau Sprint Challenge</div>
    <Inp label="Titre" value={spTitle} onChange={setSpTitle} placeholder="Ex: Signe 3 clients en 7 jours"/>
    <Inp label="Objectif (nombre)" value={spTarget} onChange={setSpTarget} type="number" placeholder="3"/>
    <Inp label="Progression actuelle" value={spCurrent} onChange={setSpCurrent} type="number" placeholder="0"/>
    <Inp label="Durée (jours)" value={spDays} onChange={setSpDays} type="number" placeholder="7"/>
    <div style={{display:"flex",gap:8,marginTop:12}}>
     <Btn onClick={createSprint}>🚀 Lancer</Btn>
     <Btn v="secondary" onClick={()=>setShowSetSprint(false)}>Annuler</Btn>
    </div>
   </div>
  </div>}
 </div>;
}

/* 6. AUTO-PILOT MODE */
export function AutoPilotSection({soc,clients,ghlData,socBank,reps}){
 const[settings,setSettings]=useState(()=>{try{return JSON.parse(localStorage.getItem(`autopilot_${soc.id}`))||{};}catch{return{};}});
 const[queue,setQueue]=useState(()=>{try{return JSON.parse(localStorage.getItem(`autopilot_queue_${soc.id}`))||[];}catch{return[];}});
 const saveSettings=(s)=>{setSettings(s);try{localStorage.setItem(`autopilot_${soc.id}`,JSON.stringify(s));sSet(`autopilot_${soc.id}`,s);}catch{}};
 const saveQueue=(q)=>{setQueue(q);try{localStorage.setItem(`autopilot_queue_${soc.id}`,JSON.stringify(q));sSet(`autopilot_queue_${soc.id}`,q);}catch{}};
 const cm=curM();const now=Date.now();
 // Generate follow-ups
 const relances=useMemo(()=>{const msgs=[];
  const myClients=(clients||[]).filter(c=>c.socId===soc.id);
  // Clients impayés >30j
  const overdueClients=myClients.filter(c=>{
   if(c.status!=="active")return false;
   const bd=socBank?.[soc.id];if(!bd?.transactions)return false;
   const cn3=(c.name||"").toLowerCase().trim();
   const recent=bd.transactions.some(t=>{const leg=t.legs?.[0];return leg&&leg.amount>0&&new Date(t.created_at).getTime()>now-30*864e5&&(leg.description||t.reference||"").toLowerCase().includes(cn3);});
   return !recent&&clientMonthlyRevenue(c)>0;
  });
  overdueClients.forEach(c=>{const rev=clientMonthlyRevenue(c);msgs.push({id:`rel_pay_${c.id}`,type:"payment",client:c.name,template:`Bonjour ${c.name}, nous n'avons pas reçu votre paiement de ${fmt(rev)}€ pour ce mois. Pourriez-vous vérifier de votre côté ? Merci !`,icon:"💳",priority:"high"});});
  // Leads non contactés >48h
  const gd=ghlData?.[soc.id];
  (gd?.opportunities||[]).filter(o=>o.status==="open"&&new Date(o.createdAt).getTime()<now-48*36e5).slice(0,5).forEach(o=>{msgs.push({id:`rel_lead_${o.id}`,type:"lead",client:o.name,template:`Bonjour ${o.name}, suite à votre demande, je souhaitais prendre quelques minutes pour échanger sur vos besoins. Êtes-vous disponible cette semaine ?`,icon:"📞",priority:"medium"});});
  return msgs;
 },[clients,soc.id,ghlData,socBank]);
 // Smart scheduling
 const slots=useMemo(()=>{const sugg=[];const days=["Lundi","Mardi","Mercredi","Jeudi","Vendredi"];
  const gd=ghlData?.[soc.id];const events=gd?.calendarEvents||[];
  const pendingLeads=(gd?.opportunities||[]).filter(o=>o.status==="open").slice(0,3);
  pendingLeads.forEach((o,i)=>{const day=days[(new Date().getDay()+i+1)%5];const hour=14+i;sugg.push({id:`slot_${i}`,day,hour:`${hour}h-${hour+1}h`,client:o.name});});
  return sugg;
 },[ghlData,soc.id]);
 const approveMsg=(id)=>{const existing=queue.find(q=>q.id===id);if(existing)return;const rel=relances.find(r=>r.id===id);if(rel)saveQueue([...queue,{...rel,status:"approved",approvedAt:new Date().toISOString()}]);};
 const ignoreMsg=(id)=>{saveQueue(queue.filter(q=>q.id!==id));};
 return <div style={{marginTop:16}}>
  <Sect title="🔄 Auto-Pilot" sub="Relances et suggestions automatiques">
   {/* Relances automatiques */}
   <Card style={{padding:14,marginBottom:10}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>📨 RELANCES SUGGÉRÉES</div>
    {relances.length===0&&<div style={{color:C.td,fontSize:11,textAlign:"center",padding:12}}>✅ Rien à relancer pour le moment</div>}
    {relances.map((r,i)=>{const inQueue=queue.find(q=>q.id===r.id);
     return <div key={r.id} className={`fu d${Math.min(i+1,8)}`} style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${r.priority==="high"?C.r+"33":C.brd}`,marginBottom:6}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
       <span style={{fontSize:14}}>{r.icon}</span>
       <span style={{fontWeight:700,fontSize:11,flex:1}}>{r.client}</span>
       <span style={{fontSize:8,padding:"2px 6px",borderRadius:4,background:r.priority==="high"?C.rD:C.oD,color:r.priority==="high"?C.r:C.o,fontWeight:700}}>{r.priority==="high"?"Urgent":"Normal"}</span>
      </div>
      <div style={{fontSize:10,color:C.td,lineHeight:1.4,padding:"6px 8px",background:C.card,borderRadius:6,marginBottom:6,fontStyle:"italic"}}>"{r.template}"</div>
      {inQueue?<span style={{fontSize:9,color:C.g,fontWeight:600}}>✅ Approuvé</span>:
       <div style={{display:"flex",gap:6}}>
        <button onClick={()=>approveMsg(r.id)} style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${C.g}33`,background:C.gD,color:C.g,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>✅ Approuver</button>
        <button style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${C.brd}`,background:C.card,color:C.td,fontSize:9,cursor:"pointer",fontFamily:FONT}}>✏️ Modifier</button>
        <button onClick={()=>ignoreMsg(r.id)} style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${C.r}22`,background:C.rD,color:C.r,fontSize:9,cursor:"pointer",fontFamily:FONT}}>❌ Ignorer</button>
       </div>}
     </div>;})}
   </Card>
   {/* Smart Scheduling */}
   <Card style={{padding:14,marginBottom:10}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>📅 CRÉNEAUX SUGGÉRÉS</div>
    {slots.length===0&&<div style={{color:C.td,fontSize:11,textAlign:"center",padding:12}}>Pas de suggestions pour le moment</div>}
    {slots.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:C.bg,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:4}}>
     <span style={{fontSize:12}}>📞</span>
     <span style={{flex:1,fontSize:10}}>Créneau libre : <strong>{s.day} {s.hour}</strong> — Suggéré pour relancer <strong style={{color:C.acc}}>{s.client}</strong></span>
     <button style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${C.b}33`,background:C.bD,color:C.b,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>Planifier</button>
    </div>)}
   </Card>
   {/* Weekly Auto-Report */}
   <Card style={{padding:14}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
     <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>📊 RAPPORT HEBDO AUTO</div>
     <button onClick={()=>{const ns={...settings,autoReport:!settings.autoReport};saveSettings(ns);}} style={{padding:"3px 10px",borderRadius:12,border:`1px solid ${settings.autoReport?C.g+"33":C.brd}`,background:settings.autoReport?C.gD:"transparent",color:settings.autoReport?C.g:C.td,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{settings.autoReport?"✅ Activé":"Activer"}</button>
    </div>
    <div style={{padding:"10px 12px",background:C.bg,borderRadius:8,border:`1px solid ${C.brd}`,fontSize:10,color:C.td,lineHeight:1.5}}>
     <div style={{fontWeight:700,color:C.t,marginBottom:4}}>Aperçu du rapport :</div>
     <div>📈 CA ce mois : <strong style={{color:C.acc}}>{fmt(pf(gr(reps,soc.id,cm)?.ca))}€</strong></div>
     <div>👥 Clients actifs : <strong>{(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active").length}</strong></div>
     <div>📞 Leads en cours : <strong>{pf(gr(reps,soc.id,cm)?.leads)}</strong></div>
     <div>✅ Deals conclus : <strong style={{color:C.g}}>{pf(gr(reps,soc.id,cm)?.leadsClos)}</strong></div>
     <div style={{marginTop:4,fontSize:9,color:C.tm}}>Généré automatiquement chaque lundi</div>
    </div>
    {queue.length>0&&<div style={{marginTop:8}}>
     <div style={{color:C.td,fontSize:9,fontWeight:700,marginBottom:4}}>📤 FILE D'ATTENTE ({queue.length})</div>
     {queue.map(q=><div key={q.id} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 6px",fontSize:9,borderBottom:`1px solid ${C.brd}08`}}>
      <span>{q.icon}</span><span style={{flex:1}}>{q.client}</span><span style={{color:C.g,fontWeight:600}}>Prêt à envoyer</span>
     </div>)}
    </div>}
   </Card>
  </Sect>
 </div>;
}

/* 7. SYNERGIES AUTOMATIQUES */
export function SynergiesAutoPanel({socs,reps,clients,ghlData}){
 const cm=curM();
 const[statuses,setStatuses]=useState(()=>{try{return JSON.parse(localStorage.getItem("synergies_auto_status"))||{};}catch{return{};}});
 const saveStatus=(id,st)=>{const ns={...statuses,[id]:st};setStatuses(ns);try{localStorage.setItem("synergies_auto_status",JSON.stringify(ns));sSet("synergies_auto_status",ns);}catch{}};
 const actS=socs.filter(s=>s.stat==="active"&&s.id!=="eco");
 const synergies=useMemo(()=>{const syns=[];
  // 1. Client overlap
  const clientsBySoc={};actS.forEach(s=>{clientsBySoc[s.id]=(clients||[]).filter(c=>c.socId===s.id).map(c=>({...c,socNom:s.nom}));});
  const allCls=Object.values(clientsBySoc).flat();
  const seen={};allCls.forEach(c=>{const key=normalizeStr(c.name||c.email||"");if(!key)return;if(!seen[key])seen[key]=[];seen[key].push(c);});
  Object.entries(seen).filter(([,arr])=>arr.length>1).forEach(([,arr])=>{const names=[...new Set(arr.map(c=>c.socNom))];if(names.length>1)syns.push({id:`overlap_${arr[0].name}`,icon:"🔗",desc:`${arr[0].name} est client chez ${names.join(" ET ")}`,socs:names,value:2000,type:"overlap"});});
  // 2. Domain match
  const domainsBySoc={};actS.forEach(s=>{const cls=(clients||[]).filter(c=>c.socId===s.id);const doms={};cls.forEach(c=>{if(c.domain){doms[c.domain]=(doms[c.domain]||0)+1;}});domainsBySoc[s.id]={nom:s.nom,act:s.act,domains:doms};});
  actS.forEach(s1=>{actS.forEach(s2=>{if(s1.id>=s2.id)return;const d1=domainsBySoc[s1.id];const d2=domainsBySoc[s2.id];
   Object.entries(d1.domains).forEach(([dom,count])=>{if(count>=2&&(d2.act||"").toLowerCase().includes(dom.toLowerCase().slice(0,4))){syns.push({id:`domain_${s1.id}_${s2.id}_${dom}`,icon:"💡",desc:`${s1.nom} a ${count} clients ${dom} — ${s2.nom} pourrait les accompagner en ${s2.act}`,socs:[s1.nom,s2.nom],value:count*1500,type:"domain"});}});
  });});
  // 3. Performance gap
  actS.forEach(s1=>{actS.forEach(s2=>{if(s1.id>=s2.id)return;
   const r1=gr(reps,s1.id,cm);const r2=gr(reps,s2.id,cm);if(!r1||!r2)return;
   const l1=pf(r1.leads);const c1=pf(r1.leadsClos);const l2=pf(r2.leads);const c2=pf(r2.leadsClos);
   const conv1=l1>0?c1/l1:0;const conv2=l2>0?c2/l2:0;
   if(conv1>0&&conv2>0&&conv1/conv2>1.8){syns.push({id:`perf_${s1.id}_${s2.id}`,icon:"⚡",desc:`Le closer de ${s1.nom} convertit ${Math.round(conv1/conv2)}× mieux que ${s2.nom} — organise un partage de process`,socs:[s1.nom,s2.nom],value:3000,type:"performance"});}
   else if(conv2>0&&conv1>0&&conv2/conv1>1.8){syns.push({id:`perf_${s2.id}_${s1.id}`,icon:"⚡",desc:`Le closer de ${s2.nom} convertit ${Math.round(conv2/conv1)}× mieux que ${s1.nom} — organise un partage de process`,socs:[s2.nom,s1.nom],value:3000,type:"performance"});}
  });});
  // 4. Peak correlation
  actS.forEach(s1=>{actS.forEach(s2=>{if(s1.id>=s2.id)return;
   const r1=gr(reps,s1.id,cm);const r2=gr(reps,s2.id,cm);
   if(r1&&r2&&pf(r1.leads)>5&&pf(r2.leads)>5){syns.push({id:`peak_${s1.id}_${s2.id}`,icon:"📊",desc:`${s1.nom} et ${s2.nom} ont des pics simultanés — mutualisez le budget pub`,socs:[s1.nom,s2.nom],value:1500,type:"peak"});}
  });});
  // 5. Revenue opportunity (upsell)
  (clients||[]).filter(c=>c.status==="active"&&clientMonthlyRevenue(c)<800&&clientMonthlyRevenue(c)>0).slice(0,3).forEach(c=>{const s=socs.find(x=>x.id===c.socId);if(s)syns.push({id:`upsell_${c.id}`,icon:"💰",desc:`${c.name} chez ${s.nom} paie ${fmt(clientMonthlyRevenue(c))}€/mois — potentiel upsell`,socs:[s.nom],value:2500,type:"upsell"});});
  return syns.sort((a,b)=>b.value-a.value);
 },[actS,clients,reps,ghlData,cm]);
 const statusOpts=["","vu","en_cours","fait"];const statusLabels={"":"—","vu":"👁 Vu","en_cours":"🔄 En cours","fait":"✅ Fait"};
 const statusColors={"":"transparent","vu":C.bD,"en_cours":C.oD,"fait":C.gD};
 return <Sect title="🤝 SYNERGIES DÉTECTÉES" sub={`${synergies.length} opportunités identifiées`}>
  {synergies.length===0&&<Card><div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Pas encore assez de données pour détecter des synergies</div></Card>}
  {synergies.map((s,i)=>{const st=statuses[s.id]||"";const borderColor=s.value>=2500?"#FFAA00":s.value>=1500?"#60a5fa":"#71717a";
   return <Card key={s.id} style={{padding:14,marginBottom:6,borderLeft:`3px solid ${borderColor}`}}>
    <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
     <span style={{fontSize:18}}>{s.icon}</span>
     <div style={{flex:1}}>
      <div style={{fontSize:11,fontWeight:600,lineHeight:1.4,marginBottom:4}}>{s.desc}</div>
      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
       {s.socs.map(n=><span key={n} style={{fontSize:8,padding:"2px 6px",borderRadius:4,background:C.accD,color:C.acc,fontWeight:600}}>{n}</span>)}
       <span style={{fontSize:9,color:C.g,fontWeight:700}}>~{fmt(s.value)}€</span>
      </div>
     </div>
     <select value={st} onChange={e=>saveStatus(s.id,e.target.value)} style={{fontSize:9,padding:"3px 6px",borderRadius:6,border:`1px solid ${C.brd}`,background:statusColors[st]||C.bg,color:C.t,fontFamily:FONT,cursor:"pointer"}}>
      {statusOpts.map(o=><option key={o} value={o}>{statusLabels[o]}</option>)}
     </select>
    </div>
   </Card>;})}
 </Sect>;
}

/* 8. WIDGET EMBED */
export function WidgetEmbed({soc,clients}){
 const[widgetTheme,setWidgetTheme]=useState("dark");
 const activeClients=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active").length;
 const embedCode=`<iframe src="https://scale-corp.vercel.app/#widget/${soc.id}" width="300" height="200" style="border:none;border-radius:12px;"></iframe>`;
 const[copied,setCopied]=useState(false);
 return <Card style={{padding:16,marginTop:12}}>
  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><span style={{fontSize:16}}>📱</span><span style={{fontWeight:700,fontSize:12}}>Widget Porteur</span></div>
  {/* Preview */}
  <div style={{marginBottom:12}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:6}}>APERÇU</div>
   <WidgetCard soc={soc} clientCount={activeClients} theme={widgetTheme}/>
  </div>
  {/* Theme toggle */}
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
   <span style={{fontSize:10,color:C.td}}>Thème:</span>
   {["dark","light"].map(t=><button key={t} onClick={()=>setWidgetTheme(t)} style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${widgetTheme===t?C.acc+"44":C.brd}`,background:widgetTheme===t?C.accD:"transparent",color:widgetTheme===t?C.acc:C.td,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{t==="dark"?"🌙 Dark":"☀️ Light"}</button>)}
  </div>
  {/* Embed code */}
  <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:4}}>CODE EMBED</div>
  <div style={{position:"relative"}}>
   <pre style={{background:C.bg,border:`1px solid ${C.brd}`,borderRadius:8,padding:"8px 10px",fontSize:9,color:C.t,overflowX:"auto",whiteSpace:"pre-wrap",wordBreak:"break-all"}}>{embedCode}</pre>
   <button onClick={()=>{navigator.clipboard?.writeText(embedCode);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{position:"absolute",top:6,right:6,padding:"3px 8px",borderRadius:4,border:`1px solid ${C.brd}`,background:C.card,color:copied?C.g:C.td,fontSize:9,cursor:"pointer",fontFamily:FONT}}>{copied?"✅ Copié":"📋 Copier"}</button>
  </div>
 </Card>;
}

export function WidgetCard({soc,clientCount,theme}){
 const isDark=theme==="dark";
 const bg=isDark?"rgba(14,14,22,.85)":"rgba(255,255,255,.9)";
 const txt=isDark?"#e4e4e7":"#1a1a1a";const sub=isDark?"#71717a":"#666";const brd=isDark?"rgba(255,255,255,.08)":"rgba(0,0,0,.08)";
 return <div style={{width:280,padding:16,background:bg,backdropFilter:"blur(20px)",border:`1px solid ${brd}`,borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,.2)"}}>
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
   {soc.logoUrl?<img src={soc.logoUrl} alt="" style={{width:32,height:32,borderRadius:8,objectFit:"cover"}}/>:
    <div style={{width:32,height:32,borderRadius:8,background:(soc.brandColor||soc.color)+"22",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:soc.brandColor||soc.color}}>{(soc.nom||"?")[0]}</div>}
   <div><div style={{fontWeight:800,fontSize:13,color:txt,fontFamily:FONT_TITLE}}>{soc.nom}</div><div style={{fontSize:9,color:sub}}>{soc.act}</div></div>
  </div>
  <div style={{fontSize:11,color:txt,marginBottom:6}}>🔥 <strong>{clientCount}</strong> clients accompagnés ce mois</div>
  <div style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:6,background:"rgba(255,170,0,.12)",border:"1px solid rgba(255,170,0,.2)"}}>
   <span style={{fontSize:10}}>⭐</span><span style={{fontSize:9,fontWeight:700,color:"#FFAA00"}}>Score ECS™</span>
  </div>
  <div style={{marginTop:8,borderTop:`1px solid ${brd}`,paddingTop:6,textAlign:"center"}}>
   <span style={{fontSize:8,color:sub}}>Propulsé par </span><span style={{fontSize:8,color:"#FFAA00",fontWeight:700}}>L'Incubateur ECS</span>
  </div>
 </div>;
}

export function WidgetRenderer({socId,socs,clients}){
 const soc=socs.find(s=>s.id===socId);
 if(!soc)return <div style={{padding:20,textAlign:"center",color:"#71717a",fontSize:12}}>Société introuvable</div>;
 const activeClients=(clients||[]).filter(c=>c.socId===socId&&c.status==="active").length;
 return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",fontFamily:FONT}}>
  <WidgetCard soc={soc} clientCount={activeClients} theme="dark"/>
 </div>;
}

/* ═══════════════════════════ PULSE — Live Monitoring Dashboard ═══════════════════════════ */
export function PulseScreen({socs,reps,allM,ghlData,socBank,hold,clients,onClose}){
 const[now,setNow]=useState(new Date());
 const[refreshing,setRefreshing]=useState(false);
 const[toasts,setToasts]=useState([]);
 const[view,setView]=useState("global");
 const[socFilter,setSocFilter]=useState("all");
 const[timeFilter,setTimeFilter]=useState("30j");
 const[statusFilter,setStatusFilter]=useState("active");
 const[soundOn,setSoundOn]=useState(false);
 const[plusOnes,setPlusOnes]=useState([]);
 const[feedTypeFilter,setFeedTypeFilter]=useState("all");
 const[compareA,setCompareA]=useState(null);
 const[compareB,setCompareB]=useState(null);
 const[meteorActive,setMeteorActive]=useState(false);
 const[pulseRing,setPulseRing]=useState(false);
 const[animatedVals,setAnimatedVals]=useState({ca:0,pipeline:0,mrr:0});
 const prevDataRef=useRef(null);
 const prevProspRef=useRef({});
 const feedRef=useRef(null);
 const audioCtxRef=useRef(null);
 const prevFeedLen=useRef(0);

 useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t);},[]);

 // Keyboard shortcuts
 useEffect(()=>{const h=e=>{
  if(e.key==="Escape")onClose();
  if(e.key==="f"||e.key==="F"){try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();}catch{}}
  if(e.key==="m"||e.key==="M")setSoundOn(p=>!p);
  if(e.key==="r"||e.key==="R"){setRefreshing(true);setTimeout(()=>setRefreshing(false),1000);}
  const viewKeys={"1":"global","2":"detail","3":"finance","4":"pipeline","5":"activity","6":"heatmap","7":"compare","8":"timeline"};
  if(viewKeys[e.key])setView(viewKeys[e.key]);
 };window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[onClose]);

 const getAudioCtx=useCallback(()=>{if(!audioCtxRef.current)audioCtxRef.current=new(window.AudioContext||window.webkitAudioContext)();return audioCtxRef.current;},[]);
 const playDing=useCallback(()=>{if(!soundOn)return;try{const ctx=getAudioCtx();const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=1200;g.gain.value=0.15;o.start();g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.08);o.stop(ctx.currentTime+0.08);}catch{}},[soundOn,getAudioCtx]);
 const playCash=useCallback(()=>{if(!soundOn)return;try{const ctx=getAudioCtx();[880,1100].forEach(f=>{const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=f;g.gain.value=0.12;o.start();g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.1);o.stop(ctx.currentTime+0.1);});}catch{}},[soundOn,getAudioCtx]);

 const addToast=useCallback((msg,color)=>{const id=Date.now()+Math.random();setToasts(p=>[{id,msg,color},...p].slice(0,3));setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),8000);},[]);
 const triggerMeteor=useCallback(()=>{setMeteorActive(true);setTimeout(()=>setMeteorActive(false),1500);},[]);
 const triggerPulseRing=useCallback(()=>{setPulseRing(true);setTimeout(()=>setPulseRing(false),1200);},[]);

 const sb=socBank||{};const gd=ghlData||{};
 const actS=useMemo(()=>{let s=(socs||[]).filter(s=>s.status!=="archived");if(statusFilter==="active")s=s.filter(x=>x.status==="active");else if(statusFilter==="lancement")s=s.filter(x=>x.status==="lancement");if(socFilter!=="all")s=s.filter(x=>x.id===socFilter);return s;},[socs,statusFilter,socFilter]);
 const allActS=(socs||[]).filter(s=>s.status!=="archived");

 const cM=curM();
 const prevMVal=useMemo(()=>{const d=new Date();d.setMonth(d.getMonth()-1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;},[]);

 const getProspects=(sid)=>{const g=gd[sid];if(!g)return[];return(g.opportunities||g.ghlClients||[]).filter(o=>o?.status==="open"||!o?.status);};
 const totalProspects=useMemo(()=>allActS.reduce((a,s)=>a+getProspects(s.id).length,0),[allActS,gd]);
 const todayStr=now.toISOString().slice(0,10);
 const yesterdayStr=useMemo(()=>{const d=new Date(now);d.setDate(d.getDate()-1);return d.toISOString().slice(0,10);},[now]);
 const prospectsToday=useMemo(()=>allActS.reduce((a,s)=>a+getProspects(s.id).filter(p=>(p.dateAdded||p.createdAt||"").slice(0,10)===todayStr).length,0),[allActS,gd,todayStr]);
 const prospectsYesterday=useMemo(()=>allActS.reduce((a,s)=>a+getProspects(s.id).filter(p=>(p.dateAdded||p.createdAt||"").slice(0,10)===yesterdayStr).length,0),[allActS,gd,yesterdayStr]);
 const deltaProspects=prospectsToday-prospectsYesterday;

 const totalCA=useMemo(()=>allActS.reduce((a,s)=>{const r=gr(reps,s.id,cM);return a+pf(r?.ca);},0),[allActS,reps,cM]);
 const prevCA=useMemo(()=>allActS.reduce((a,s)=>{const r=gr(reps,s.id,prevMVal);return a+pf(r?.ca);},0),[allActS,reps,prevMVal]);
 const totalPipeline=useMemo(()=>allActS.reduce((a,s)=>a+pf(gd[s.id]?.stats?.pipelineValue),0),[allActS,gd]);
 const totalMRR=useMemo(()=>allActS.reduce((a,s)=>{const r=gr(reps,s.id,cM);return a+pf(r?.mrr);},0),[allActS,reps,cM]);

 const totalWon=useMemo(()=>allActS.reduce((a,s)=>a+(gd[s.id]?.opportunities||[]).filter(o=>o?.status==="won").length,0),[allActS,gd]);
 const totalOpps=useMemo(()=>allActS.reduce((a,s)=>a+(gd[s.id]?.opportunities||[]).length,0),[allActS,gd]);
 const convRate=totalOpps>0?((totalWon/totalOpps)*100).toFixed(1):0;
 const avgDeal=totalWon>0?allActS.reduce((a,s)=>a+(gd[s.id]?.opportunities||[]).filter(o=>o?.status==="won").reduce((x,o)=>x+pf(o?.value),0),0)/totalWon:0;

 // Animated counters
 useEffect(()=>{const targets={ca:totalCA,pipeline:totalPipeline,mrr:totalMRR};const start=Date.now();const dur=1200;const anim=()=>{const t=Math.min((Date.now()-start)/dur,1);const ease=1-Math.pow(1-t,3);setAnimatedVals({ca:Math.round(targets.ca*ease),pipeline:Math.round(targets.pipeline*ease),mrr:Math.round(targets.mrr*ease)});if(t<1)requestAnimationFrame(anim);};requestAnimationFrame(anim);},[totalCA,totalPipeline,totalMRR]);

 // Today's payments
 const todayPayments=useMemo(()=>allActS.reduce((a,s)=>{return a+(sb[s.id]?.transactions||[]).filter(tx=>{const leg=tx.legs?.[0];return leg&&pf(leg.amount)>0&&(tx.created_at||tx.createdAt||"").slice(0,10)===todayStr;}).reduce((x,tx)=>x+pf(tx.legs?.[0]?.amount),0);},0),[allActS,sb,todayStr]);

 // Revenue vs expenses ratio
 const totalRevenues=useMemo(()=>allActS.reduce((a,s)=>{const r=gr(reps,s.id,cM);return a+pf(r?.ca);},0),[allActS,reps,cM]);
 const totalExpenses=useMemo(()=>allActS.reduce((a,s)=>{const r=gr(reps,s.id,cM);return a+pf(r?.charges);},0),[allActS,reps,cM]);

 // Business weather
 const bizWeather=useMemo(()=>{const score=totalCA>0&&prevCA>0?(totalCA/prevCA)*100:50;if(score>=120)return{emoji:"☀️",label:"Excellent",color:"#34d399"};if(score>=100)return{emoji:"🌤️",label:"Bien",color:"#60a5fa"};if(score>=80)return{emoji:"⛅",label:"Correct",color:"#FFAA00"};if(score>=60)return{emoji:"🌧️",label:"Attention",color:"#f87171"};return{emoji:"⛈️",label:"Critique",color:"#f87171"};},[totalCA,prevCA]);

 // Detect new prospects → +1 animation + sound
 useEffect(()=>{const cur={};allActS.forEach(s=>{cur[s.id]=getProspects(s.id).length;});const prev=prevProspRef.current;if(Object.keys(prev).length>0){allActS.forEach(s=>{const diff=(cur[s.id]||0)-(prev[s.id]||0);if(diff>0){playDing();triggerPulseRing();for(let i=0;i<diff;i++){const pid=Date.now()+Math.random();setPlusOnes(p=>[...p,{id:pid,socId:s.id}]);setTimeout(()=>setPlusOnes(p=>p.filter(x=>x.id!==pid)),1200);}addToast(`👤 +${diff} prospect(s) — ${s?.name||""}`,`#60a5fa`);}});}prevProspRef.current=cur;},[gd]);

 // Detect new payments
 useEffect(()=>{const snap=JSON.stringify(Object.keys(sb).map(k=>(sb[k]?.transactions||[]).length));if(prevDataRef.current&&prevDataRef.current!==snap){playCash();triggerPulseRing();addToast("💰 Nouveau mouvement bancaire","#34d399");}prevDataRef.current=snap;},[sb]);

 // Detect won deals → meteor
 useEffect(()=>{const wonCount=allActS.reduce((a,s)=>a+(gd[s.id]?.opportunities||[]).filter(o=>o?.status==="won").length,0);if(prevDataRef.current&&wonCount>0)triggerMeteor();},[gd]);

 const socCards=useMemo(()=>actS.map(s=>{const r=gr(reps,s.id,cM);const rp=gr(reps,s.id,prevMVal);const ca=pf(r?.ca);const caP=pf(rp?.ca);const prosp=getProspects(s.id).length;const st=s.status==="active"?"🟢":s.status==="lancement"?"🟡":"🔴";const pipVal=pf(gd[s.id]?.stats?.pipelineValue);const lastAct=(sb[s.id]?.transactions||[])[0]?.createdAt||(gd[s.id]?.ghlClients||[])[0]?.dateAdded||"";const hs=healthScore(s,reps);return{id:s.id,name:s?.nom||s?.name||"",porteur:s?.porteur||"",status:st,statusRaw:s.status,ca,caP,prosp,trend:ca>caP?"↑":ca<caP?"↓":"→",bal:pf(sb[s.id]?.balance),pipVal,lastAct,logoUrl:s?.logoUrl||"",brandColor:s?.brandColor||"",color:s?.color||"#FFAA00",grade:hs.grade,gradeColor:hs.color,mrr:pf(r?.mrr)};}).sort((a,b)=>b.ca-a.ca),[actS,reps,cM,prevMVal,gd,sb]);

 const bestId=socCards[0]?.id;

 // Donut data
 const donutData=useMemo(()=>{const total=socCards.reduce((a,c)=>a+c.ca,0)||1;let cumPct=0;return socCards.filter(s=>s.ca>0).map(s=>{const pct=(s.ca/total)*100;const start=cumPct;cumPct+=pct;return{name:s.name,pct,start,color:s.brandColor||s.color||"#FFAA00"};});},[socCards]);
 const donutGradient=useMemo(()=>{if(donutData.length===0)return"conic-gradient(rgba(255,255,255,.1) 0% 100%)";return"conic-gradient("+donutData.map(d=>`${d.color} ${d.start}% ${d.start+d.pct}%`).join(",")+")";} ,[donutData]);

 const feed=useMemo(()=>{const items=[];allActS.forEach(s=>{const sn=s?.name||"Société";(sb[s.id]?.transactions||[]).slice(0,10).forEach(tx=>{const leg=tx.legs?.[0];const desc=leg?.description||tx?.reference||"Transaction";const amt=pf(leg?.amount||tx?.amount);items.push({ts:tx.created_at||tx.createdAt||"",icon:amt>0?"💰":"📤",desc:`${sn} : ${desc}`,amt,color:amt>0?"#34d399":"#f87171",socId:s.id,type:amt>0?"payment":"expense"});});(gd[s.id]?.opportunities||gd[s.id]?.ghlClients||[]).slice(0,5).forEach(c=>{const name=c?.contactName||c?.contact?.name||c?.name||c?.email||"Contact";const isWon=c?.status==="won";const isLost=c?.status==="lost";const icon=isWon?"✅":isLost?"❌":"👤";const label=isWon?"Deal gagné":isLost?"Deal perdu":"Nouveau prospect";items.push({ts:c.dateAdded||c.createdAt||c.updatedAt||"",icon,desc:`${sn} : ${label} - ${name}`,amt:isWon?pf(c?.value):0,color:isWon?"#34d399":isLost?"#f87171":"#60a5fa",socId:s.id,type:isWon?"won":isLost?"lost":"lead"});});(gd[s.id]?.calendarEvents||[]).slice(0,3).forEach(e=>{items.push({ts:e?.startTime||"",icon:"📞",desc:`${sn} : Appel planifié - ${e?.title||e?.contactName||"RDV"}`,amt:0,color:"#a78bfa",socId:s.id,type:"call"});});});items.sort((a,b)=>new Date(b.ts)-new Date(a.ts));return items.slice(0,50);},[allActS,sb,gd]);

 // Auto-scroll feed on new items
 useEffect(()=>{if(feed.length>prevFeedLen.current&&feedRef.current){feedRef.current.scrollTop=0;}prevFeedLen.current=feed.length;},[feed.length]);

 const filteredFeed=useMemo(()=>feedTypeFilter==="all"?feed:feed.filter(f=>f.type===feedTypeFilter),[feed,feedTypeFilter]);

 const ticker=useMemo(()=>feed.slice(0,20).map(f=>`${f.icon} [${(allActS.find(s=>s.id===f.socId)?.name||"").split(" ")[0]}] ${f.desc?.split(": ")[1]||""}${f.amt?` ${fmt(f.amt)}€`:""}`).join("   •   ")||"⚡ PULSE — En attente de données...",[feed,allActS]);

 const clock=(tz)=>{try{return now.toLocaleTimeString("fr-FR",{timeZone:tz,hour:"2-digit",minute:"2-digit",second:"2-digit"});}catch{return"--:--:--";}};
 const sparkline=(vals)=>{if(!vals||vals.length<2)return null;const mx=Math.max(...vals,1);const pts=vals.map((v,i)=>`${i*(60/(vals.length-1))},${28-v/mx*24}`).join(" ");return <svg width="60" height="28" style={{display:"block"}}><polyline points={pts} fill="none" stroke="#FFAA00" strokeWidth="1.5" opacity=".7"/></svg>;};
 const caHist=useMemo(()=>(allM||[]).slice(-7).map(m=>allActS.reduce((a,s)=>a+pf(gr(reps,s.id,m)?.ca),0)),[allM,allActS,reps]);
 const mrrHist=useMemo(()=>(allM||[]).slice(-7).map(m=>allActS.reduce((a,s)=>a+pf(gr(reps,s.id,m)?.mrr),0)),[allM,allActS,reps]);

 // Heatmap data: société × last 7 days
 const heatmapData=useMemo(()=>{const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(d.toISOString().slice(0,10));}return{days,rows:allActS.map(s=>{const sn=s?.nom||s?.name||"";const cells=days.map(day=>{const txs=(sb[s.id]?.transactions||[]).filter(tx=>(tx.created_at||tx.createdAt||"").slice(0,10)===day);const amt=txs.reduce((a,tx)=>a+pf(tx.legs?.[0]?.amount),0);const leads=(gd[s.id]?.ghlClients||[]).filter(c=>(c.dateAdded||c.createdAt||"").slice(0,10)===day).length;const activity=amt/100+leads;return{day,amt,leads,activity};});return{id:s.id,name:sn,color:s?.color||"#FFAA00",cells};})  };},[allActS,sb,gd]);

 // Timeline data
 const timelineEvents=useMemo(()=>{const evts=[];allActS.forEach(s=>{const sn=s?.nom||s?.name||"";const col=s?.color||"#FFAA00";(gd[s.id]?.opportunities||[]).filter(o=>o?.status==="won").forEach(o=>{evts.push({ts:o.updatedAt||o.createdAt,type:"won",label:`Deal gagné — ${o.name||o.contact?.name||""}`,soc:sn,color:"#34d399",dotColor:col,amt:pf(o?.value)});});(gd[s.id]?.opportunities||[]).filter(o=>o?.status==="lost").forEach(o=>{evts.push({ts:o.updatedAt||o.createdAt,type:"lost",label:`Deal perdu — ${o.name||""}`,soc:sn,color:"#f87171",dotColor:col});});(sb[s.id]?.transactions||[]).slice(0,5).forEach(tx=>{const leg=tx.legs?.[0];if(leg&&pf(leg.amount)>0)evts.push({ts:tx.created_at||tx.createdAt,type:"payment",label:`Paiement — ${leg.description||tx.reference||""}`,soc:sn,color:"#34d399",dotColor:col,amt:pf(leg.amount)});});(gd[s.id]?.calendarEvents||[]).slice(0,3).forEach(e=>{evts.push({ts:e?.startTime,type:"call",label:`Appel — ${e?.title||"RDV"}`,soc:sn,color:"#a78bfa",dotColor:col});});});return evts.filter(e=>e.ts).sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,30);},[allActS,gd,sb]);

 const views=[{k:"global",l:"🌍 Global"},{k:"detail",l:"🔍 Détail"},{k:"finance",l:"💰 Finance"},{k:"pipeline",l:"📊 Pipeline"},{k:"activity",l:"📡 Activité"},{k:"heatmap",l:"🗺️ Heatmap"},{k:"compare",l:"⚖️ Comparer"},{k:"timeline",l:"📅 Timeline"}];
 const timeFilters=[{k:"1j",l:"Aujourd'hui"},{k:"7j",l:"7j"},{k:"30j",l:"30j"},{k:"mois",l:"Ce mois"}];
 const statusFilters=[{k:"active",l:"Actives"},{k:"lancement",l:"Lancement"},{k:"all",l:"Toutes"}];

 const pill=(active,onClick,label)=><button key={label} onClick={onClick} style={{padding:"5px 14px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",border:active?"1px solid #FFAA00":"1px solid rgba(255,255,255,.1)",background:active?"rgba(255,170,0,.15)":"rgba(255,255,255,.04)",color:active?"#FFAA00":"#71717a",transition:"all .2s"}}>{label}</button>;

 const GC={background:"rgba(255,255,255,.04)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:20};
 const GCglow={...GC,animation:"card-glow 3s ease infinite"};
 const GChover={...GC,transition:"all .25s ease",cursor:"pointer"};

 const PULSE_CSS=`
  @keyframes pulse-glow{0%,100%{text-shadow:0 0 8px #FFAA00;}50%{text-shadow:0 0 24px #FFAA00,0 0 48px #FFAA0066;}}
  @keyframes slide-in{from{transform:translateX(120%);opacity:0;}to{transform:translateX(0);opacity:1;}}
  @keyframes ticker-scroll{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
  @keyframes count-up{from{opacity:.3;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  @keyframes card-glow{0%,100%{box-shadow:0 0 12px #FFAA0022;}50%{box-shadow:0 0 28px #FFAA0044,0 0 56px #FFAA0011;}}
  @keyframes globeRotate{0%{transform:translate(-50%,-50%) rotate(0deg)}100%{transform:translate(-50%,-50%) rotate(360deg)}}
  @keyframes plusOne{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-60px) scale(1.5)}}
  @keyframes activity-glow{0%,100%{border-color:rgba(255,170,0,.08)}50%{border-color:rgba(255,170,0,.3)}}
  @keyframes particle-float{0%{transform:translateY(100vh) translateX(0) scale(0);opacity:0}10%{opacity:1}90%{opacity:.6}100%{transform:translateY(-10vh) translateX(var(--px-drift)) scale(1);opacity:0}}
  @keyframes pulse-ring-anim{0%{transform:translate(-50%,-50%) scale(.8);opacity:.8;border-width:3px}100%{transform:translate(-50%,-50%) scale(1.5);opacity:0;border-width:1px}}
  @keyframes meteor-streak{0%{transform:translate(-100%,-100%) rotate(-35deg);opacity:1}100%{transform:translate(200vw,200vh) rotate(-35deg);opacity:0}}
  @keyframes breathing{0%,100%{opacity:.015}50%{opacity:.04}}
  @keyframes status-pulse{0%,100%{box-shadow:0 0 0 0 currentColor}50%{box-shadow:0 0 0 6px transparent}}
  @keyframes feed-flash{0%{background:rgba(255,170,0,.15)}100%{background:transparent}}
  @keyframes weather-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes donut-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes heatcell-pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
  .pulse-toast{animation:slide-in .4s ease;}
  .pulse-feed-item{animation:slide-in .3s ease;}
  .pulse-feed-new{animation:feed-flash .8s ease;}
  .pulse-plus1{animation:plusOne 1.2s ease forwards;position:absolute;top:-10px;right:10px;color:#60a5fa;font-weight:900;font-size:18px;pointer-events:none;z-index:10;}
  .pulse-card:hover{transform:translateY(-3px);box-shadow:0 8px 32px rgba(255,170,0,.12)!important;border-color:rgba(255,170,0,.2)!important;}
  .pulse-particle{position:fixed;width:3px;height:3px;background:#FFAA00;border-radius:50%;pointer-events:none;z-index:0;animation:particle-float var(--px-dur) linear infinite;opacity:0;left:var(--px-left);animation-delay:var(--px-delay);}
 `;

 // Particles data (stable)
 const particles=useMemo(()=>Array.from({length:18},(_,i)=>({id:i,left:`${Math.random()*100}%`,dur:`${12+Math.random()*20}s`,delay:`${Math.random()*15}s`,drift:`${(Math.random()-0.5)*200}px`})),[]);

 const renderKPIs=()=><div style={{display:"flex",flexDirection:"column",gap:12,overflow:"auto"}}>
  <div style={GC}>
   <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>CA Total</div>
   <div style={{fontSize:32,fontWeight:900,color:"#FFAA00",fontFamily:FONT_TITLE}}>{fmt(animatedVals.ca)}€</div>
   <div style={{fontSize:10,color:totalCA>=prevCA?"#34d399":"#f87171",marginTop:4}}>{totalCA>=prevCA?"↑":"↓"} vs M-1 ({fmt(prevCA)}€)</div>
   {sparkline(caHist)}
  </div>
  <div style={GC}>
   <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Prospects</div>
   <div style={{fontSize:28,fontWeight:900,color:"#60a5fa",fontFamily:FONT_TITLE}}>{totalProspects}</div>
   <div style={{fontSize:10,color:deltaProspects>=0?"#34d399":"#f87171",marginTop:4}}>{deltaProspects>=0?"↑":"↓"} {deltaProspects>=0?"+":""}{deltaProspects} aujourd'hui (hier: {prospectsYesterday})</div>
  </div>
  <div style={GC}>
   <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Pipeline</div>
   <div style={{fontSize:24,fontWeight:900,color:"#a78bfa",fontFamily:FONT_TITLE}}>{fmt(animatedVals.pipeline)}€</div>
  </div>
  <div style={GC}>
   <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Conversion</div>
   <div style={{fontSize:22,fontWeight:900,color:"#34d399",fontFamily:FONT_TITLE}}>{convRate}%</div>
   <div style={{fontSize:10,color:"#71717a",marginTop:4}}>Deal moy: {fmt(avgDeal)}€</div>
  </div>
  <div style={GC}>
   <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>MRR</div>
   <div style={{fontSize:22,fontWeight:900,color:"#34d399",fontFamily:FONT_TITLE}}>{fmt(animatedVals.mrr)}€</div>
   {sparkline(mrrHist)}
  </div>
  <div style={GC}>
   <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Sociétés</div>
   <div style={{fontSize:22,fontWeight:900,color:"#e4e4e7",fontFamily:FONT_TITLE}}>{allActS.length}</div>
  </div>
  {/* Revenue vs Expenses bar */}
  <div style={GC}>
   <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Revenus / Dépenses</div>
   <div style={{height:12,borderRadius:6,overflow:"hidden",background:"rgba(255,255,255,.06)",display:"flex"}}>
    <div style={{width:`${totalRevenues+totalExpenses>0?(totalRevenues/(totalRevenues+totalExpenses))*100:50}%`,background:"#34d399",transition:"width .5s"}}/>
    <div style={{flex:1,background:"#f87171"}}/>
   </div>
   <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:9,color:"#71717a"}}><span style={{color:"#34d399"}}>{fK(totalRevenues)}€</span><span style={{color:"#f87171"}}>{fK(totalExpenses)}€</span></div>
  </div>
 </div>;

 const renderSocCards=()=><div style={{overflow:"auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:12,alignContent:"start"}}>
  {/* Donut chart */}
  {view==="global"&&socCards.length>1&&<div style={{...GC,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gridColumn:"span 1"}}>
   <div style={{width:120,height:120,borderRadius:"50%",background:donutGradient,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{width:80,height:80,borderRadius:"50%",background:"#030308",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
     <div style={{fontSize:14,fontWeight:900,color:"#FFAA00",fontFamily:FONT_TITLE}}>{fmt(totalCA)}€</div>
     <div style={{fontSize:8,color:"#71717a"}}>CA Total</div>
    </div>
   </div>
   <div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>{donutData.map(d=><span key={d.name} style={{fontSize:8,color:d.color}}>● {d.name}</span>)}</div>
  </div>}
  {socCards.map(s=><div key={s.id} className="pulse-card" onClick={()=>{setSocFilter(s.id);setView("detail");}} style={{...(s.id===bestId?GCglow:GChover),position:"relative"}}>
   {plusOnes.filter(p=>p.socId===s.id).map(p=><span key={p.id} className="pulse-plus1">+1</span>)}
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
     {/* Status pulsing dot */}
     <div style={{width:8,height:8,borderRadius:"50%",background:s.statusRaw==="active"?"#34d399":s.statusRaw==="lancement"?"#FFAA00":"#f87171",animation:"status-pulse 2s ease infinite",color:s.statusRaw==="active"?"#34d39944":s.statusRaw==="lancement"?"#FFAA0044":"#f8717144",flexShrink:0}}/>
     {s.logoUrl?<img src={s.logoUrl} alt="" style={{width:24,height:24,borderRadius:8,objectFit:"contain"}}/>:<div style={{width:24,height:24,borderRadius:8,background:(s.brandColor||s.color||"#FFAA00")+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:s.brandColor||s.color||"#FFAA00"}}>{(s.name||"?")[0]}</div>}
     <div style={{fontWeight:800,fontSize:13,fontFamily:FONT_TITLE,color:"#e4e4e7"}}>{s.name}</div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
     {/* Health score badge */}
     <span style={{fontSize:10,fontWeight:800,padding:"2px 6px",borderRadius:6,background:(s.gradeColor||"#71717a")+"22",color:s.gradeColor||"#71717a",fontFamily:FONT_TITLE}}>{s.grade}</span>
     <span style={{fontSize:16,color:s.trend==="↑"?"#34d399":s.trend==="↓"?"#f87171":"#71717a"}}>{s.trend}</span>
    </div>
   </div>
   {s.porteur&&<div style={{fontSize:10,color:"#71717a",marginBottom:6}}>👤 {s.porteur}</div>}
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
    <div><div style={{fontSize:9,color:"#71717a",textTransform:"uppercase"}}>CA</div><div style={{fontSize:15,fontWeight:700,color:"#FFAA00"}}>{fK(s.ca)}€</div></div>
    <div><div style={{fontSize:9,color:"#71717a",textTransform:"uppercase"}}>Prospects</div><div style={{fontSize:15,fontWeight:700,color:"#60a5fa"}}>{s.prosp}</div></div>
    <div><div style={{fontSize:9,color:"#71717a",textTransform:"uppercase"}}>Pipeline</div><div style={{fontSize:13,fontWeight:600,color:"#a78bfa"}}>{fK(s.pipVal)}€</div></div>
    <div><div style={{fontSize:9,color:"#71717a",textTransform:"uppercase"}}>Solde</div><div style={{fontSize:13,fontWeight:600,color:"#34d399"}}>{fK(s.bal)}€</div></div>
   </div>
   {s.lastAct&&<div style={{fontSize:9,color:"#71717a",marginTop:6}}>⏱ {ago(s.lastAct)}</div>}
   {sparkline(caHist)}
  </div>)}
 </div>;

 const feedTypeButtons=[{k:"all",l:"Tout",icon:"📡"},{k:"payment",l:"Paiements",icon:"💰"},{k:"lead",l:"Prospects",icon:"👤"},{k:"call",l:"Appels",icon:"📞"},{k:"won",l:"Gagnés",icon:"✅"},{k:"lost",l:"Perdus",icon:"❌"}];

 const renderFeed=(full)=><div style={{...GC,overflow:"hidden",display:"flex",flexDirection:"column",padding:0,...(full?{flex:1}:{})}}>
  <div style={{padding:"14px 16px 8px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
   <span style={{fontSize:11,fontWeight:700,color:"#FFAA00",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE}}>📡 Live Activity</span>
   <div style={{display:"flex",gap:4}}>{feedTypeButtons.map(b=><button key={b.k} onClick={()=>setFeedTypeFilter(b.k)} style={{padding:"2px 8px",borderRadius:10,fontSize:10,border:feedTypeFilter===b.k?"1px solid #FFAA00":"1px solid rgba(255,255,255,.06)",background:feedTypeFilter===b.k?"rgba(255,170,0,.12)":"transparent",color:feedTypeFilter===b.k?"#FFAA00":"#71717a",cursor:"pointer"}}>{b.icon}</button>)}</div>
  </div>
  <div ref={feedRef} style={{flex:1,overflow:"auto",padding:"8px 12px"}}>
   {filteredFeed.length===0&&<div style={{color:"#71717a",fontSize:11,textAlign:"center",padding:20}}>Aucune activité récente</div>}
   {filteredFeed.map((f,i)=><div key={i} className={`pulse-feed-item${i===0?" pulse-feed-new":""}`} style={{padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.03)",display:"flex",gap:8,alignItems:"flex-start",fontSize:11}}>
    {(()=>{const fs=allActS.find(x=>x.id===f.socId);return fs?.logoUrl?<img src={fs.logoUrl} alt="" style={{width:16,height:16,borderRadius:5,objectFit:"contain",flexShrink:0,marginTop:1}}/>:<div style={{width:16,height:16,borderRadius:5,background:(fs?.brandColor||fs?.color||f.color)+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:900,color:fs?.brandColor||fs?.color||f.color,flexShrink:0,marginTop:1}}>{(fs?.nom||"?")[0]}</div>;})()}
    <span>{f.icon}</span>
    <div style={{flex:1}}>
     <div style={{color:"#e4e4e7",lineHeight:1.3}}>{f.desc}</div>
     <div style={{color:"#71717a",fontSize:9,marginTop:2}}>{f.ts?ago(f.ts):""}</div>
    </div>
    {f.amt?<span style={{color:f.color,fontWeight:700,whiteSpace:"nowrap"}}>{f.amt>0?"+":""}{fmt(f.amt)}€</span>:null}
   </div>)}
  </div>
 </div>;

 // Heatmap view
 const renderHeatmap=()=><div style={{flex:1,padding:16,overflow:"auto"}}>
  <div style={{...GC,overflowX:"auto"}}>
   <div style={{fontSize:12,fontWeight:800,color:"#FFAA00",fontFamily:FONT_TITLE,marginBottom:16}}>🗺️ HEATMAP ACTIVITÉ — 7 DERNIERS JOURS</div>
   <div style={{display:"grid",gridTemplateColumns:`120px repeat(${heatmapData.days.length},1fr)`,gap:4,alignItems:"center"}}>
    <div/>
    {heatmapData.days.map(d=><div key={d} style={{fontSize:9,color:"#71717a",textAlign:"center",fontFamily:"monospace"}}>{d.slice(5)}</div>)}
    {heatmapData.rows.map((row,ri)=><React.Fragment key={row.id}>
     <div style={{fontSize:11,color:"#e4e4e7",fontWeight:600,fontFamily:FONT_TITLE,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.name}</div>
     {row.cells.map((c,ci)=>{const maxAct=Math.max(...heatmapData.rows.flatMap(r=>r.cells.map(x=>x.activity)),1);const intensity=c.activity/maxAct;const bg=intensity>0.6?"#34d399":intensity>0.3?"#FFAA00":intensity>0?"#f8717188":"rgba(255,255,255,.04)";return <div key={ci} style={{width:"100%",aspectRatio:"1",borderRadius:4,background:bg,opacity:Math.max(0.2,intensity),animation:`heatcell-pop .3s ease ${(ri*7+ci)*0.03}s both`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:600}}>{c.amt>0?fK(c.amt):c.leads>0?c.leads:""}</div>;})}
    </React.Fragment>)}
   </div>
  </div>
 </div>;

 // Compare view
 const renderCompare=()=>{
  const opts=allActS.map(s=>({id:s.id,name:s?.nom||s?.name||""}));
  const a=socCards.find(s=>s.id===compareA)||socCards[0];
  const b=socCards.find(s=>s.id===compareB)||socCards[1];
  const metrics=[{k:"ca",l:"CA",color:"#FFAA00"},{k:"prosp",l:"Prospects",color:"#60a5fa"},{k:"pipVal",l:"Pipeline",color:"#a78bfa"},{k:"bal",l:"Solde",color:"#34d399"},{k:"mrr",l:"MRR",color:"#34d399"}];
  return <div style={{flex:1,padding:16,overflow:"auto"}}>
   <div style={{...GC}}>
    <div style={{fontSize:12,fontWeight:800,color:"#FFAA00",fontFamily:FONT_TITLE,marginBottom:16}}>⚖️ COMPARAISON</div>
    <div style={{display:"flex",gap:12,marginBottom:20}}>
     <select value={compareA||opts[0]?.id||""} onChange={e=>setCompareA(e.target.value)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"#e4e4e7",padding:"6px 12px",fontSize:11,fontFamily:FONT}}>
      {opts.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
     </select>
     <span style={{color:"#FFAA00",fontWeight:900,alignSelf:"center"}}>VS</span>
     <select value={compareB||opts[1]?.id||""} onChange={e=>setCompareB(e.target.value)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"#e4e4e7",padding:"6px 12px",fontSize:11,fontFamily:FONT}}>
      {opts.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
     </select>
    </div>
    {a&&b&&metrics.map(m=>{const va=a[m.k]||0;const vb=b[m.k]||0;const mx=Math.max(va,vb,1);return <div key={m.k} style={{marginBottom:14}}>
     <div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:6}}>{m.l}</div>
     <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:11,color:"#e4e4e7",fontWeight:700,width:60,textAlign:"right"}}>{fK(va)}</span>
      <div style={{flex:1,height:16,borderRadius:8,background:"rgba(255,255,255,.04)",overflow:"hidden",display:"flex"}}>
       <div style={{width:`${(va/mx)*50}%`,background:m.color,borderRadius:"8px 0 0 8px",transition:"width .5s"}}/>
       <div style={{width:2,background:"#030308"}}/>
       <div style={{width:`${(vb/mx)*50}%`,background:m.color+"88",borderRadius:"0 8px 8px 0",transition:"width .5s",marginLeft:"auto"}}/>
      </div>
      <span style={{fontSize:11,color:"#e4e4e7",fontWeight:700,width:60}}>{fK(vb)}</span>
     </div>
     <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#71717a",marginTop:2}}><span>{a.name}</span><span>{b.name}</span></div>
    </div>;})}
   </div>
  </div>;
 };

 // Timeline view
 const renderTimeline=()=><div style={{flex:1,padding:16,overflow:"auto"}}>
  <div style={{...GC}}>
   <div style={{fontSize:12,fontWeight:800,color:"#FFAA00",fontFamily:FONT_TITLE,marginBottom:16}}>📅 TIMELINE</div>
   <div style={{position:"relative",paddingLeft:24}}>
    <div style={{position:"absolute",left:8,top:0,bottom:0,width:2,background:"rgba(255,170,0,.15)"}}/>
    {timelineEvents.map((ev,i)=><div key={i} style={{position:"relative",marginBottom:16,paddingLeft:20,animation:`slide-in .3s ease ${i*0.05}s both`}}>
     <div style={{position:"absolute",left:-4,top:4,width:12,height:12,borderRadius:"50%",background:ev.dotColor,border:"2px solid #030308",zIndex:1}}/>
     <div style={{fontSize:9,color:"#71717a",fontFamily:"monospace",marginBottom:2}}>{ev.ts?new Date(ev.ts).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):""}</div>
     <div style={{fontSize:12,color:"#e4e4e7",fontWeight:600}}>{ev.label}</div>
     <div style={{display:"flex",gap:8,marginTop:2}}>
      <span style={{fontSize:9,fontWeight:700,color:ev.color,background:ev.color+"18",padding:"1px 6px",borderRadius:4}}>{ev.soc}</span>
      {ev.amt?<span style={{fontSize:9,fontWeight:700,color:"#34d399"}}>+{fmt(ev.amt)}€</span>:null}
     </div>
    </div>)}
    {timelineEvents.length===0&&<div style={{color:"#71717a",fontSize:11,padding:20,textAlign:"center"}}>Aucun événement</div>}
   </div>
  </div>
 </div>;

 const renderMainContent=()=>{
  if(view==="activity")return <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr",gap:16,padding:16,overflow:"hidden",minHeight:0}}>{renderFeed(true)}</div>;
  if(view==="heatmap")return renderHeatmap();
  if(view==="compare")return renderCompare();
  if(view==="timeline")return renderTimeline();
  if(view==="finance")return <div className="admin-grid" style={{flex:1,display:"grid",gridTemplateColumns:"300px 1fr",gap:16,padding:16,overflow:"hidden",minHeight:0}}>
   <div style={{display:"flex",flexDirection:"column",gap:12,overflow:"auto"}}>
    <div style={GC}><div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>CA Total</div><div style={{fontSize:32,fontWeight:900,color:"#FFAA00",fontFamily:FONT_TITLE}}>{fmt(animatedVals.ca)}€</div>{sparkline(caHist)}</div>
    <div style={GC}><div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>MRR</div><div style={{fontSize:26,fontWeight:900,color:"#34d399",fontFamily:FONT_TITLE}}>{fmt(animatedVals.mrr)}€</div>{sparkline(mrrHist)}</div>
    <div style={GC}><div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Trésorerie</div><div style={{fontSize:26,fontWeight:900,color:"#60a5fa",fontFamily:FONT_TITLE}}>{fmt(allActS.reduce((a,s)=>a+pf(sb[s.id]?.balance),0))}€</div></div>
   </div>
   <div style={{overflow:"auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12,alignContent:"start"}}>
    {socCards.map(s=><div key={s.id} className="pulse-card" style={GChover}>
     <div style={{fontWeight:800,fontSize:13,fontFamily:FONT_TITLE,color:"#e4e4e7",marginBottom:8}}>{s.status} {s.name} <span style={{fontSize:10,color:s.gradeColor,fontWeight:800}}>{s.grade}</span></div>
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      <div><div style={{fontSize:9,color:"#71717a",textTransform:"uppercase"}}>CA</div><div style={{fontSize:15,fontWeight:700,color:"#FFAA00"}}>{fK(s.ca)}€</div></div>
      <div><div style={{fontSize:9,color:"#71717a",textTransform:"uppercase"}}>Solde</div><div style={{fontSize:15,fontWeight:700,color:"#34d399"}}>{fK(s.bal)}€</div></div>
      <div><div style={{fontSize:9,color:"#71717a",textTransform:"uppercase"}}>CA M-1</div><div style={{fontSize:13,fontWeight:600,color:"#71717a"}}>{fK(s.caP)}€</div></div>
      <div><div style={{fontSize:9,color:"#71717a",textTransform:"uppercase"}}>Pipeline</div><div style={{fontSize:13,fontWeight:600,color:"#a78bfa"}}>{fK(s.pipVal)}€</div></div>
     </div>
    </div>)}
   </div>
  </div>;
  if(view==="pipeline")return <div style={{flex:1,display:"grid",gridTemplateColumns:"280px 1fr",gap:16,padding:16,overflow:"hidden",minHeight:0}}>
   <div style={{display:"flex",flexDirection:"column",gap:12,overflow:"auto"}}>
    <div style={GC}><div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Total Prospects</div><div style={{fontSize:32,fontWeight:900,color:"#60a5fa",fontFamily:FONT_TITLE}}>{totalProspects}</div><div style={{fontSize:10,color:deltaProspects>=0?"#34d399":"#f87171",marginTop:4}}>{deltaProspects>=0?"+":""}{deltaProspects} aujourd'hui</div></div>
    <div style={GC}><div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Pipeline</div><div style={{fontSize:26,fontWeight:900,color:"#a78bfa",fontFamily:FONT_TITLE}}>{fmt(animatedVals.pipeline)}€</div></div>
    <div style={GC}><div style={{fontSize:10,color:"#71717a",textTransform:"uppercase",letterSpacing:1,fontFamily:FONT_TITLE,marginBottom:8}}>Conversion</div><div style={{fontSize:26,fontWeight:900,color:"#34d399",fontFamily:FONT_TITLE}}>{convRate}%</div><div style={{fontSize:10,color:"#71717a",marginTop:4}}>{totalWon} gagnés / {totalOpps} total • Moy: {fmt(avgDeal)}€</div></div>
   </div>
   {renderSocCards()}
  </div>;
  if(view==="detail"&&socFilter!=="all"){const s=socCards[0];if(!s)return <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"#71717a"}}>Sélectionnez une société</div>;
   return <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,padding:16,overflow:"auto"}}>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
     <div style={{...GC,textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,fontFamily:FONT_TITLE,color:"#FFAA00",marginBottom:8}}>{s.status} {s.name} <span style={{fontSize:14,color:s.gradeColor}}>{s.grade}</span></div>{s.porteur&&<div style={{fontSize:12,color:"#71717a"}}>👤 {s.porteur}</div>}</div>
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <div style={GC}><div style={{fontSize:9,color:"#71717a",textTransform:"uppercase"}}>CA</div><div style={{fontSize:24,fontWeight:900,color:"#FFAA00"}}>{fmt(s.ca)}€</div></div>
      <div style={GC}><div style={{fontSize:9,color:"#71717a",textTransform:"uppercase"}}>Prospects</div><div style={{fontSize:24,fontWeight:900,color:"#60a5fa"}}>{s.prosp}</div></div>
      <div style={GC}><div style={{fontSize:9,color:"#71717a",textTransform:"uppercase"}}>Pipeline</div><div style={{fontSize:24,fontWeight:900,color:"#a78bfa"}}>{fmt(s.pipVal)}€</div></div>
      <div style={GC}><div style={{fontSize:9,color:"#71717a",textTransform:"uppercase"}}>Solde</div><div style={{fontSize:24,fontWeight:900,color:"#34d399"}}>{fmt(s.bal)}€</div></div>
     </div>
    </div>
    {renderFeed(true)}
   </div>;
  }
  // default: global
  return <div className="pulse-grid" style={{flex:1,display:"grid",gridTemplateColumns:"280px 1fr 300px",gap:16,padding:16,overflow:"hidden",minHeight:0}}>
   <div className="pulse-left">{renderKPIs()}</div>
   <div className="pulse-center">{renderSocCards()}</div>
   <div className="pulse-right">{renderFeed(false)}</div>
  </div>;
 };

 return <div style={{position:"fixed",inset:0,zIndex:9999,background:"#030308",fontFamily:FONT,color:"#e4e4e7",overflow:"hidden",display:"flex",flexDirection:"column"}}>
  <style>{PULSE_CSS}</style>
  {/* BREATHING GLOW */}
  <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% 50%, rgba(255,170,0,.03), transparent 70%)",animation:"breathing 8s ease infinite",zIndex:0,pointerEvents:"none"}}/>
  {/* PARTICLES */}
  {particles.map(p=><div key={p.id} className="pulse-particle" style={{"--px-left":p.left,"--px-dur":p.dur,"--px-delay":p.delay,"--px-drift":p.drift}}/>)}
  {/* GLOBE */}
  <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle at 30% 30%, rgba(255,170,0,.08), transparent 60%)",border:"1px solid rgba(255,170,0,.05)",animation:"globeRotate 30s linear infinite",zIndex:0,opacity:.4}}/>
  <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:600,height:600,borderRadius:"50%",border:"1px solid rgba(255,170,0,.03)",animation:"globeRotate 45s linear infinite reverse",zIndex:0}}/>
  <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:500,height:500,borderRadius:"50%",border:"1px solid rgba(255,170,0,.04)",animation:"globeRotate 25s linear infinite",zIndex:0,clipPath:"ellipse(50% 20% at 50% 50%)"}}/>
  <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:500,height:500,borderRadius:"50%",border:"1px solid rgba(255,170,0,.04)",animation:"globeRotate 35s linear infinite reverse",zIndex:0,clipPath:"ellipse(20% 50% at 50% 50%)"}}/>
  <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:460,height:460,borderRadius:"50%",border:"1px solid rgba(255,170,0,.03)",animation:"globeRotate 20s linear infinite",zIndex:0,clipPath:"ellipse(50% 35% at 50% 50%)"}}/>
  {/* PULSE RING */}
  {pulseRing&&<div style={{position:"fixed",top:"50%",left:"50%",width:520,height:520,borderRadius:"50%",border:"2px solid #FFAA00",animation:"pulse-ring-anim 1.2s ease forwards",zIndex:0,pointerEvents:"none"}}/>}
  {/* METEOR */}
  {meteorActive&&<div style={{position:"fixed",top:0,left:0,width:200,height:2,background:"linear-gradient(90deg,transparent,#FFAA00,#fff,transparent)",animation:"meteor-streak 1.5s ease forwards",zIndex:10000,pointerEvents:"none",filter:"blur(1px)"}}/>}
  {/* TOASTS */}
  <div style={{position:"fixed",top:16,right:16,zIndex:10001,display:"flex",flexDirection:"column",gap:8}}>
   {toasts.map(t=><div key={t.id} className="pulse-toast" style={{padding:"10px 18px",borderRadius:10,background:t.color+"22",border:`1px solid ${t.color}44`,color:t.color,fontSize:12,fontWeight:600,backdropFilter:"blur(12px)"}}>{t.msg}</div>)}
  </div>
  {/* TOP BAR */}
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 24px",borderBottom:"1px solid rgba(255,255,255,.06)",flexShrink:0,zIndex:1,position:"relative"}}>
   <div style={{display:"flex",alignItems:"center",gap:10}}>
    <span style={{fontSize:22,animation:refreshing?"pulse-glow 1.5s ease infinite":"none",fontFamily:FONT_TITLE,fontWeight:900,color:"#FFAA00",letterSpacing:2}}>⚡ PULSE</span>
    {/* Business weather widget */}
    <span style={{fontSize:28,animation:"weather-bounce 3s ease infinite",display:"inline-block"}}>{bizWeather.emoji}</span>
    <span style={{fontSize:10,color:bizWeather.color,fontWeight:700}}>{bizWeather.label}</span>
    {/* Today's payments badge */}
    {todayPayments>0&&<span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:10,background:"#34d39922",border:"1px solid #34d39944",color:"#34d399"}}>💰 +{fmt(todayPayments)}€ aujourd'hui</span>}
   </div>
   <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
    {views.map((v,i)=>pill(view===v.k,()=>setView(v.k),v.l))}
   </div>
   <div style={{display:"flex",alignItems:"center",gap:16}}>
    <button onClick={()=>setSoundOn(p=>!p)} style={{background:"none",border:"none",fontSize:16,cursor:"pointer",color:soundOn?"#FFAA00":"#71717a"}}>{soundOn?"🔊":"🔇"}</button>
    <div style={{display:"flex",gap:12,fontSize:11,fontFamily:"monospace",color:"#71717a"}}>
     <span>🇦🇪 {clock("Asia/Dubai")}</span><span>🇫🇷 {clock("Europe/Paris")}</span><span>🇹🇭 {clock("Asia/Bangkok")}</span>
    </div>
    <button onClick={onClose} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"#71717a",fontSize:16,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
   </div>
  </div>
  {/* FILTER BAR */}
  <div style={{display:"flex",gap:8,padding:"8px 24px",borderBottom:"1px solid rgba(255,255,255,.04)",flexShrink:0,zIndex:1,position:"relative",alignItems:"center",flexWrap:"wrap"}}>
   <span style={{fontSize:10,color:"#71717a",marginRight:4}}>Société:</span>
   {pill(socFilter==="all",()=>setSocFilter("all"),"Toutes")}
   {allActS.slice(0,8).map(s=>pill(socFilter===s.id,()=>setSocFilter(s.id),s?.name||s.id))}
   <span style={{fontSize:10,color:"#71717a",marginLeft:12,marginRight:4}}>Période:</span>
   {timeFilters.map(t=>pill(timeFilter===t.k,()=>setTimeFilter(t.k),t.l))}
   <span style={{fontSize:10,color:"#71717a",marginLeft:12,marginRight:4}}>Statut:</span>
   {statusFilters.map(s=>pill(statusFilter===s.k,()=>setStatusFilter(s.k),s.l))}
   <span style={{fontSize:9,color:"#71717a44",marginLeft:"auto"}}>1-8:vues M:son R:refresh F:fullscreen</span>
  </div>
  {/* MAIN CONTENT */}
  {renderMainContent()}
  {/* BOTTOM TICKER */}
  <div style={{borderTop:"1px solid rgba(255,255,255,.06)",padding:"8px 0",overflow:"hidden",flexShrink:0,background:"rgba(255,170,0,.03)",zIndex:1,position:"relative"}}>
   <div style={{display:"flex",animation:"ticker-scroll 40s linear infinite",whiteSpace:"nowrap"}}>
    <span style={{fontSize:11,color:"#FFAA00",paddingRight:60}}>{ticker}</span>
    <span style={{fontSize:11,color:"#FFAA00",paddingRight:60}}>{ticker}</span>
   </div>
  </div>
 </div>;
}

/* ============ LIVE ACTIVITY FEED ============ */
export function LiveFeed({socs,reps,allM,ghlData,socBank,clients,maxEvents=50}){
 const events=useMemo(()=>{
  const evts=[];const now=Date.now();
  (socs||[]).forEach(s=>{
   const gd=ghlData?.[s.id];
   (gd?.opportunities||[]).forEach(o=>{
    if(o.status==="won")evts.push({ts:o.updatedAt||o.createdAt,icon:"✅",desc:`Deal gagné: ${o.name||o.contact?.name||"—"}`,amt:o.value||0,soc:s,type:"won"});
    if(o.status==="lost")evts.push({ts:o.updatedAt||o.createdAt,icon:"❌",desc:`Deal perdu: ${o.name||o.contact?.name||"—"}`,soc:s,type:"lost"});
   });
   (gd?.calendarEvents||[]).filter(e=>e.startTime).forEach(e=>{
    evts.push({ts:e.startTime,icon:"📞",desc:`RDV: ${e.title||e.contactName||"Appel"}`,soc:s,type:"call"});
   });
   (gd?.ghlClients||[]).slice(0,5).forEach(c=>{
    evts.push({ts:c.dateAdded||c.createdAt,icon:"👤",desc:`Nouveau lead: ${c.name||c.email||"Contact"}`,soc:s,type:"lead"});
   });
   const bk=socBank?.[s.id];
   (bk?.transactions||[]).slice(0,10).forEach(tx=>{
    const leg=tx.legs?.[0];if(!leg)return;
    if(leg.amount>0)evts.push({ts:tx.created_at,icon:"💰",desc:`Paiement reçu: ${tx.reference||leg.description||"—"}`,amt:leg.amount,soc:s,type:"payment"});
   });
  });
  return evts.filter(e=>e.ts).sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,maxEvents);
 },[socs,ghlData,socBank]);
 if(events.length===0)return <div style={{color:C.td,fontSize:11,textAlign:"center",padding:20}}>Aucune activité récente</div>;
 return <div style={{maxHeight:400,overflowY:"auto"}}>{events.map((e,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderBottom:`1px solid ${C.brd}08`,animation:`slideInRight .3s ease ${i*0.03}s both`}}>
  <span style={{fontSize:16,flexShrink:0}}>{e.icon}</span>
  <div style={{flex:1,minWidth:0}}>
   <div style={{fontSize:11,color:C.t,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.desc}</div>
   <div style={{display:"flex",gap:6,alignItems:"center",marginTop:2}}>
    <span style={{fontSize:9,color:C.td}}>{e.ts?ago(e.ts):""}</span>
    <span style={{fontSize:8,fontWeight:700,color:e.soc?.color||C.acc,background:(e.soc?.color||C.acc)+"18",padding:"1px 5px",borderRadius:4}}>{e.soc?.nom||""}</span>
   </div>
  </div>
  {e.amt?<span style={{fontWeight:700,fontSize:11,color:C.g,whiteSpace:"nowrap"}}>+{fmt(e.amt)}€</span>:null}
 </div>)}</div>;
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
 // Score calculation
 const goalPct=soc?.obj?Math.min(100,Math.round(ca/soc.obj*100)):50;
 const margePct=ca>0?Math.round(marge/ca*100):0;
 const score=Math.min(100,Math.round(goalPct*0.4+Math.min(100,margePct*2)*0.3+(growth>0?Math.min(100,growth*2):0)*0.3));
 // Records
 const records=useMemo(()=>{
  const recs=[];const allCas=allM.slice(0,-1).map(m=>pf(gr(reps,soc?.id,m)?.ca));const maxPrev=Math.max(0,...allCas);
  if(ca>maxPrev&&maxPrev>0)recs.push(`🏆 Record CA: ${fmt(ca)}€ (ancien: ${fmt(maxPrev)}€)`);
  if(activeCl.length>0){const prevClCounts=allM.slice(0,-1).map(m=>(clients||[]).filter(c=>c.socId===soc?.id&&c.status==="active").length);const maxCl=Math.max(0,...prevClCounts);if(activeCl.length>maxCl&&maxCl>0)recs.push(`👥 Record clients: ${activeCl.length}`);}
  if(mrr>0)recs.push(`💰 MRR record: ${fmt(mrr)}€/mois`);
  return recs;
 },[ca,activeCl,mrr,allM,reps,soc,clients]);
 const proj=project(reps,soc?.id,allM);
 const slides=[
  {title:"📊 Ton mois en chiffres",bg:"linear-gradient(135deg,#1a1a4e,#0a0a2e)",render:()=><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginTop:20}}>{[{l:"CA",v:fmt(ca)+"€",c:C.g},{l:"Charges",v:fmt(ch)+"€",c:C.r},{l:"Leads",v:String(leads),c:C.b},{l:"Clients",v:String(activeCl.length),c:C.acc}].map((k,i)=><div key={i} style={{textAlign:"center",animation:`celebIn .5s ease ${i*0.1}s both`}}><div style={{fontSize:36,fontWeight:900,color:k.c,fontFamily:FONT_TITLE}}>{k.v}</div><div style={{fontSize:12,color:C.td,marginTop:4}}>{k.l}</div></div>)}</div>},
  {title:"🏆 Ton meilleur client",bg:"linear-gradient(135deg,#2d1a00,#1a0a00)",render:()=><div style={{textAlign:"center",marginTop:30}}>{topClient?<><div style={{fontSize:48,marginBottom:10,animation:"celebIn .5s ease both"}}>🏆</div><div style={{fontSize:24,fontWeight:900,color:C.acc}}>{topClient.name}</div><div style={{fontSize:18,color:C.g,fontWeight:700,marginTop:8}}>{fmt(topClient.rev)}€/mois</div><div style={{marginTop:12,display:"inline-block",padding:"4px 14px",borderRadius:20,background:C.accD,color:C.acc,fontSize:11,fontWeight:700}}>⭐ MVP du mois</div></>:<div style={{color:C.td,fontSize:14}}>Pas encore de client ce mois</div>}</div>},
  {title:"📈 Ta croissance",bg:"linear-gradient(135deg,#001a2d,#000a1a)",render:()=><div style={{textAlign:"center",marginTop:30}}><div style={{fontSize:56,fontWeight:900,color:growth>=0?C.g:C.r,animation:"celebIn .5s ease both"}}>{growth>=0?"+":""}{growth}%</div><div style={{fontSize:13,color:C.td,marginTop:8}}>vs {ml(pm)}</div><div style={{marginTop:16,display:"flex",justifyContent:"center",gap:20}}><div><div style={{fontSize:14,fontWeight:700,color:C.td}}>Avant</div><div style={{fontSize:20,fontWeight:800,color:C.t}}>{fmt(prevCa)}€</div></div><div style={{fontSize:24,color:C.td}}>→</div><div><div style={{fontSize:14,fontWeight:700,color:C.td}}>Maintenant</div><div style={{fontSize:20,fontWeight:800,color:C.g}}>{fmt(ca)}€</div></div></div></div>},
  {title:"🔥 Tes records battus",bg:"linear-gradient(135deg,#2d0a00,#1a0500)",render:()=><div style={{marginTop:20}}>{records.length>0?records.map((r2,i)=><div key={i} style={{padding:"14px 18px",background:"rgba(255,255,255,.05)",borderRadius:12,marginBottom:10,fontSize:14,color:C.t,animation:`slideInRight .3s ease ${i*0.1}s both`}}>{r2}</div>):<div style={{textAlign:"center",color:C.td,fontSize:14,marginTop:30}}>Continue comme ça, les records arrivent ! 💪</div>}</div>},
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
   <div key={slide} style={{width:"100%",maxWidth:500,padding:40,borderRadius:24,background:slides[slide].bg,border:"1px solid rgba(255,255,255,.08)",backdropFilter:"blur(20px)",animation:"celebIn .4s ease both"}}>
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
export function PredictionsCard({soc,reps,allM,clients,ghlData,socBank}){
 const[expanded,setExpanded]=useState(false);
 const cm=curM();
 const proj=project(reps,soc?.id,allM);
 const myCl=(clients||[]).filter(c=>c.socId===soc?.id);
 const activeCl=myCl.filter(c=>c.status==="active");
 const gd=ghlData?.[soc?.id];
 const opps=gd?.opportunities||[];
 const openOpps=opps.filter(o=>o.status==="open");
 const wonOpps=opps.filter(o=>o.status==="won");
 const convRate=opps.length>0?wonOpps.length/opps.length:0;
 const expectedNew=Math.round(openOpps.length*convRate);
 // Churn risk per client
 const churnRisks=useMemo(()=>{
  const bk=socBank?.[soc?.id];
  return activeCl.map(c=>{
   let risk=0;const cn=(c.name||"").toLowerCase().trim();
   // Days since last interaction
   const calEvts=gd?.calendarEvents||[];const lastCall=calEvts.filter(e=>(e.title||e.contactName||"").toLowerCase().includes(cn)).sort((a,b)=>new Date(b.startTime||0)-new Date(a.startTime||0))[0];
   const daysSinceInteraction=lastCall?Math.floor((Date.now()-new Date(lastCall.startTime).getTime())/864e5):30;
   if(daysSinceInteraction>30)risk+=40;else if(daysSinceInteraction>14)risk+=20;
   // Payment regularity
   const txs=(bk?.transactions||[]).filter(t=>{const leg=t.legs?.[0];return leg&&leg.amount>0&&(leg.description||t.reference||"").toLowerCase().includes(cn);});
   if(txs.length===0)risk+=30;else if(txs.length<3)risk+=10;
   // Engagement from commitment
   const rem=commitmentRemaining(c);if(rem!==null&&rem<=1)risk+=20;else if(rem!==null&&rem<=3)risk+=10;
   return{name:c.name,risk:Math.min(100,risk),confidence:risk>50?"🔴":risk>25?"🟡":"🟢"};
  }).sort((a,b)=>b.risk-a.risk);
 },[activeCl,gd,socBank,soc]);
 const forecastConf=proj?"🟢":"🔴";
 const newClConf=opps.length>5?"🟢":opps.length>0?"🟡":"🔴";
 return <div className="glass-card-static fu d5" style={{padding:14,marginBottom:10,cursor:"pointer"}} onClick={()=>setExpanded(!expanded)}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
   <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>🔮</span><div><div style={{fontWeight:800,fontSize:13,color:C.t}}>Prédictions</div><div style={{fontSize:9,color:C.td}}>Forecast, churn, croissance</div></div></div>
   <span style={{fontSize:10,color:C.td}}>{expanded?"▲":"▼"}</span>
  </div>
  {expanded&&<div style={{marginTop:14,animation:"slideDown .3s ease both"}}>
   <div style={{padding:10,background:C.bg,borderRadius:10,marginBottom:8,border:`1px solid ${C.brd}`}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span>{forecastConf}</span><span style={{fontWeight:700,fontSize:11,color:C.t}}>CA prochain mois</span></div>
    <div style={{fontSize:20,fontWeight:900,color:C.acc}}>{proj?fmt(proj[0])+"€":"— données insuffisantes"}</div>
    {proj&&<div style={{fontSize:9,color:C.td,marginTop:2}}>T+2: {fmt(proj[1])}€ · T+3: {fmt(proj[2])}€</div>}
   </div>
   <div style={{padding:10,background:C.bg,borderRadius:10,marginBottom:8,border:`1px solid ${C.brd}`}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><span>{newClConf}</span><span style={{fontWeight:700,fontSize:11,color:C.t}}>Nouveaux clients attendus</span></div>
    <div style={{fontSize:20,fontWeight:900,color:C.b}}>{expectedNew}</div>
    <div style={{fontSize:9,color:C.td}}>Basé sur {openOpps.length} prospects × {Math.round(convRate*100)}% taux conversion</div>
   </div>
   {churnRisks.length>0&&<div style={{padding:10,background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`}}>
    <div style={{fontWeight:700,fontSize:11,color:C.t,marginBottom:6}}>Risque churn</div>
    {churnRisks.slice(0,5).map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",borderBottom:`1px solid ${C.brd}08`}}>
     <span>{c.confidence}</span>
     <span style={{flex:1,fontSize:10,color:C.t}}>{c.name}</span>
     <span style={{fontSize:10,fontWeight:700,color:c.risk>50?C.r:c.risk>25?C.o:C.g}}>{c.risk}%</span>
    </div>)}
   </div>}
  </div>}
 </div>;
}

/* ============ CLIENT PORTAL ============ */
export function ClientPortal({socId,clientId,socs,clients,ghlData}){
 const soc=socs.find(s=>s.id===socId);
 const client=(clients||[]).find(c=>c.id===clientId&&c.socId===socId);
 if(!soc||!client)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#06060b",fontFamily:FONT,color:"#71717a"}}>Portail introuvable</div>;
 const gd=ghlData?.[socId];
 const calEvts=(gd?.calendarEvents||[]).filter(e=>new Date(e.startTime||0)>new Date()).sort((a,b)=>new Date(a.startTime)-new Date(b.startTime));
 const nextCall=calEvts[0];
 const statusInfo=CLIENT_STATUS[client.status]||{l:client.status,c:C.td,icon:"?"};
 const monthsSince=sinceMonths(client.startDate);
 const totalMonths=client.billing?.commitment||12;
 const progress=Math.min(100,Math.round(monthsSince/totalMonths*100));
 const accent=soc.brandColor||soc.color||C.acc;
 return <div className="glass-bg" style={{minHeight:"100vh",fontFamily:FONT,padding:"40px 16px",display:"flex",justifyContent:"center"}}>
  <style>{CSS}</style>
  <div style={{width:"100%",maxWidth:500}}>
   <div className="glass-card-static" style={{padding:28,textAlign:"center",marginBottom:16}}>
    <div style={{width:64,height:64,borderRadius:32,background:accent+"22",border:`2px solid ${accent}44`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:accent,marginBottom:12}}>{(soc.nom||"?")[0]}</div>
    <div style={{fontSize:20,fontWeight:900,color:C.t}}>{client.name}</div>
    <div style={{fontSize:12,color:C.td,marginTop:4}}>{soc.nom} · {soc.act}</div>
    <div style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:8,padding:"4px 12px",borderRadius:20,background:statusInfo.c+"18",color:statusInfo.c,fontSize:11,fontWeight:700}}>{statusInfo.icon} {statusInfo.l}</div>
   </div>
   {nextCall&&<div className="glass-card-static" style={{padding:18,marginBottom:16}}>
    <div style={{fontWeight:700,fontSize:12,color:C.t,marginBottom:8}}>📅 Prochain rendez-vous</div>
    <div style={{fontSize:14,fontWeight:800,color:C.acc}}>{new Date(nextCall.startTime).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</div>
    <div style={{fontSize:12,color:C.td,marginTop:2}}>{new Date(nextCall.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})} — {nextCall.title||"RDV"}</div>
   </div>}
   <div className="glass-card-static" style={{padding:18,marginBottom:16}}>
    <div style={{fontWeight:700,fontSize:12,color:C.t,marginBottom:8}}>📊 Progression</div>
    <div style={{background:C.brd,borderRadius:6,height:10,overflow:"hidden",marginBottom:6}}><div style={{height:"100%",borderRadius:6,background:`linear-gradient(90deg,${accent},${accent}cc)`,width:`${progress}%`,transition:"width 1s ease"}}/></div>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.td}}><span>{monthsSince} mois</span><span>{progress}%</span><span>{totalMonths} mois</span></div>
   </div>
   {client.billing&&<div className="glass-card-static" style={{padding:18,marginBottom:16}}>
    <div style={{fontWeight:700,fontSize:12,color:C.t,marginBottom:8}}>💳 Facturation</div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
     <span style={{fontSize:13,color:C.t}}>{fmt(clientMonthlyRevenue(client))}€/{client.billing?.freq==="yearly"?"an":"mois"}</span>
     <span style={{padding:"3px 10px",borderRadius:12,background:C.gD,color:C.g,fontSize:10,fontWeight:700}}>✅ Actif</span>
    </div>
   </div>}
   <div style={{textAlign:"center",marginTop:20}}>
    <a href={`mailto:${soc.email||""}`} style={{display:"inline-block",padding:"12px 28px",borderRadius:12,background:`linear-gradient(135deg,${accent},${accent}cc)`,color:"#0a0a0f",fontSize:13,fontWeight:800,textDecoration:"none",fontFamily:FONT}}>📧 Contacter {soc.nom}</a>
   </div>
   <div style={{textAlign:"center",marginTop:24,fontSize:10,color:C.tm}}>Propulsé par L'Incubateur ECS</div>
  </div>
 </div>;
}

/* ============ INVESTOR BOARD ============ */
export function InvestorBoard({socs,reps,allM,hold,pin:inputPin}){
 const[authed,setAuthed]=useState(false);
 const[pinInput,setPinInput]=useState("");
 const boardPin=hold?.boardPin||"investor";
 const cm=curM();const pm=prevM(cm);
 useEffect(()=>{if(inputPin===boardPin)setAuthed(true);},[inputPin,boardPin]);
 if(!authed)return <div className="glass-bg" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>
  <style>{CSS}</style>
  <div className="glass-card-static" style={{padding:32,textAlign:"center",width:340}}>
   <div style={{fontSize:40,marginBottom:12}}>🔒</div>
   <div style={{fontWeight:800,fontSize:16,color:C.t,marginBottom:4}}>Investor Board</div>
   <div style={{fontSize:11,color:C.td,marginBottom:16}}>Entrez le code d'accès</div>
   <input value={pinInput} onChange={e=>setPinInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&pinInput===boardPin)setAuthed(true);}} placeholder="Code PIN" type="password" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:14,fontFamily:FONT,textAlign:"center",outline:"none",marginBottom:12}}/>
   <button onClick={()=>{if(pinInput===boardPin)setAuthed(true);}} style={{width:"100%",padding:"10px 0",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.acc},#FF9D00)`,color:"#0a0a0f",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:FONT}}>Accéder</button>
  </div>
 </div>;
 const actS=socs.filter(s=>s.stat==="active"&&s.id!=="eco");
 const totalCA=actS.reduce((a,s)=>a+pf(gr(reps,s.id,cm)?.ca),0);
 const prevTotalCA=actS.reduce((a,s)=>a+pf(gr(reps,s.id,pm)?.ca),0);
 const growthPct=prevTotalCA>0?Math.round((totalCA-prevTotalCA)/prevTotalCA*100):0;
 return <div className="glass-bg" style={{minHeight:"100vh",fontFamily:FONT,padding:"32px 24px"}}>
  <style>{CSS}</style>
  <div style={{maxWidth:900,margin:"0 auto"}}>
   <div style={{textAlign:"center",marginBottom:32}}>
    <div style={{fontSize:14,fontWeight:700,color:C.acc,letterSpacing:2,marginBottom:4}}>INVESTOR BOARD</div>
    <div style={{fontSize:28,fontWeight:900,color:C.t,fontFamily:FONT_TITLE}}>{hold?.name||"L'Incubateur ECS"}</div>
    <div style={{fontSize:12,color:C.td,marginTop:4}}>{ml(cm)}</div>
   </div>
   <div className="admin-stats-row" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:32}}>
    {[{l:"Sociétés",v:actS.length,c:C.b},{l:"CA Total",v:fmt(totalCA)+"€",c:C.g},{l:"Croissance",v:`${growthPct>=0?"+":""}${growthPct}%`,c:growthPct>=0?C.g:C.r}].map((k,i)=><div key={i} className="glass-card-static admin-card" style={{padding:24,textAlign:"center"}}><div style={{fontSize:32,fontWeight:900,color:k.c,fontFamily:FONT_TITLE}}>{k.v}</div><div style={{fontSize:11,color:C.td,marginTop:6}}>{k.l}</div></div>)}
   </div>
   <div className="admin-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:16}}>
    {actS.map(s=>{const sCa=pf(gr(reps,s.id,cm)?.ca);const sPrev=pf(gr(reps,s.id,pm)?.ca);const sTrend=sPrev>0?Math.round((sCa-sPrev)/sPrev*100):0;const hs=healthScore(s,reps);
     return <div key={s.id} className="glass-card" style={{padding:20}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
       <div style={{width:36,height:36,borderRadius:18,background:s.color+"22",border:`1.5px solid ${s.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:s.color}}>{(s.nom||"?")[0]}</div>
       <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14,color:C.t}}>{s.nom}</div><div style={{fontSize:10,color:C.td}}>{s.act}</div></div>
       <GradeBadge grade={hs.grade} color={hs.color}/>
      </div>
      <div style={{fontSize:22,fontWeight:900,color:C.t}}>{fmt(sCa)}€</div>
      <div style={{fontSize:11,color:sTrend>=0?C.g:C.r,fontWeight:700,marginTop:2}}>{sTrend>=0?"📈 +":"📉 "}{sTrend}%</div>
     </div>;
    })}
   </div>
   <div style={{textAlign:"center",marginTop:40,fontSize:11,color:C.tm}}>Propulsé par L'Incubateur ECS</div>
  </div>
 </div>;
}

export function WarRoomReadOnly({socId,socs,reps,allM,ghlData,clients,socBank}){
 const soc=socs.find(s=>s.id===socId);
 if(!soc)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#06060b",fontFamily:FONT,color:"#71717a"}}>Société introuvable</div>;
 return <WarRoom soc={soc} reps={reps} allM={allM} ghlData={ghlData} clients={clients} socBank={socBank} socs={socs} onClose={()=>{window.location.hash="";window.location.reload();}} readOnly/>;
}

/* MAIN APP */
