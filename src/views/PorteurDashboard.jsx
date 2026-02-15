import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import * as U from "../utils/index.jsx";
// Destructure commonly used utilities for readability
const { C, C_DARK, C_LIGHT, getTheme, applyTheme, MN, curM, ml, fmt, fK, pct, clamp, prevM, nextM, pf, gr, FONT, FONT_TITLE, BF, deadline, qOf, qMonths, qLabel, ago, uid, curW, MOODS, sinceLbl, sinceMonths, CSS, DS, DH, DEAL_STAGES, DEMO_JOURNAL, DEMO_ACTIONS, DEMO_PULSES, DEMO_DEALS, DEMO_OKRS, DEMO_SYNERGIES, DEMO_SUBS, DEMO_TEAM, DEMO_CLIENTS, SYN_TYPES, SYN_STATUS, SUB_CATS, SLACK_MODES, EXCLUDED_ACCOUNTS, CURR_SYMBOLS, REV_ENVS, GHL_BASE, STRIPE_PROXY, STORE_URL, ErrorBoundary, mkPrefill, autoGenerateReport, autoCategorize, autoDetectSubscriptions, subMonthly, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, generateInvoices, refreshInvoiceStatuses, ghlCreateInvoice, ghlSendInvoice, mkDemoInvoices, teamMonthly, normalizeStr, fuzzyMatch, matchSubsToRevolut, deduplicatedCharges, mkGHLDemo, ghlUpdateContact, ghlCreateContact, fetchGHL, syncGHLForSoc, slackWebhookSend, slackBotSend, slackSend, slackMention, buildPulseSlackMsg, buildReportSlackMsg, buildReminderSlackMsg, buildValidationSlackMsg, checkAndSendReminders, fetchStripe, syncStripeData, getStripeChargesForClient, getStripeTotal, mkRevolutDemo, fetchRevolut, syncRevolut, mkSocRevDemo, syncSocRevolut, revFinancials, storeCall, sbAuthHeaders, sbUpsert, sbGet, sbList, sGet, sSet, syncFromSupabase, fetchHoldingFromSB, fetchSocietiesFromSB, calcH, simH, healthScore, leadScore, leadScoreColor, leadScoreLabel, qCA, getAlerts, buildFeed, project, runway, calcLeaderboard, buildAIContext, calcMilestoneData, calcMilestones, calcSmartAlerts, genInsights, calcBenchmark, getPlaybooks, calcClientHealthScore, genPorteurNotifications, BILL_TYPES, CLIENT_STATUS, curQ, AUTO_CAT_MAP, categorizeTransaction, DEMO_KB } = U;

import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";
import { MilestonesWall, MilestonesCompact, MilestoneCount, AICoPilot, PulseForm, BankingPanel, BankingTransactions, SocBankWidget, GamificationPanel, ParcoursClientVisuel, SubsTeamPanel, SubsTeamBadge, AIWeeklyCoach, RapportsPanel } from "../components/features.jsx";
import { ClientsPanelSafe } from "./Clients.jsx";
import { GoalEditor, CelebrationOverlay, MeetingPrepView } from "./PorteurHelpers.jsx";
import { CollapsibleSection } from "./PorteurSettings.jsx";
import { PorteurAIChat } from "./PorteurAIChat.jsx";

export function LeaderboardCard({socs,reps,allM,actions,pulses,socBank}){
 const cm=curM();const pm=prevM(cm);
 const ranked=socs.filter(s=>s.stat==="active"&&s.id!=="eco").map(s=>{
  const r=gr(reps,s.id,cm);const rp=gr(reps,s.id,pm);
  const ca=pf(r?.ca);const prevCa=pf(rp?.ca);
  const trend=prevCa>0?Math.round((ca-prevCa)/prevCa*100):0;
  return{soc:s,ca,trend,porteur:s.porteur};
 }).sort((a,b)=>b.ca-a.ca);
 const maxCA=ranked.length>0?ranked[0].ca:1;
 const medals=["🥇","🥈","🥉"];
 return <Card style={{padding:16}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>🏆</span><span style={{fontWeight:800,fontSize:14,fontFamily:FONT_TITLE}}>Classement CA — {ml(cm)}</span></div>
  </div>
  {ranked.map((r,i)=>{
   const w=maxCA>0?Math.max(5,Math.round(r.ca/maxCA*100)):0;
   const isTop3=i<3;
   return <div key={r.soc.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:4,background:isTop3?C.accD:C.card2,border:`1px solid ${isTop3?C.acc+"33":C.brd}`,borderRadius:10}}>
    <span style={{fontWeight:900,fontSize:isTop3?18:14,width:28,textAlign:"center"}}>{isTop3?medals[i]:i+1}</span>
    <span style={{width:6,height:6,borderRadius:3,background:r.soc.color,flexShrink:0}}/>
    <div style={{flex:1,minWidth:0}}>
     <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
      <span style={{fontWeight:700,fontSize:12}}>{r.soc.nom}</span>
      <span style={{fontSize:9,color:C.td}}>{r.porteur}</span>
      {r.trend!==0&&<span style={{fontSize:9,fontWeight:700,color:r.trend>0?C.g:C.r}}>{r.trend>0?"↑":"↓"}{Math.abs(r.trend)}%</span>}
     </div>
     <div style={{height:6,background:C.brd,borderRadius:3,overflow:"hidden"}}>
      <div className="pg" style={{height:"100%",width:`${w}%`,background:isTop3?`linear-gradient(90deg,${C.acc},#FF9D00)`:r.soc.color,borderRadius:3,"--w":`${w}%`}}/>
     </div>
    </div>
    <span style={{fontWeight:900,fontSize:14,color:isTop3?C.acc:C.t,minWidth:60,textAlign:"right"}}>{fmt(r.ca)}€</span>
   </div>;
  })}
  {ranked.length===0&&<div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Aucune donnée ce mois</div>}
 </Card>;
}
/* PORTEUR DASHBOARD */
export function PulseDashWidget({soc,existing,savePulse,hold}){
 const w=curW();
 const[mood,setMood]=useState(existing?.mood??-1);
 const[win,setWin]=useState(existing?.win||"");
 const[blocker,setBlocker]=useState(existing?.blocker||"");
 const[conf,setConf]=useState(existing?.conf??3);
 const[sent,setSent]=useState(false);
 const submit=()=>{
  const pulse={mood,win,blocker,conf,at:new Date().toISOString()};
  savePulse(`${soc.id}_${w}`,pulse);setSent(true);
  if(hold?.slack?.enabled&&hold.slack.notifyPulse){slackSend(hold.slack,buildPulseSlackMsg(soc,pulse));}
 };
 if(existing&&!sent)return <div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.35s"}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
   <span style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:.8,fontFamily:FONT_TITLE}}>⚡ PULSE DE LA SEMAINE</span>
   <span style={{fontSize:9,color:C.g,fontWeight:600}}>✓ Envoyé</span>
  </div>
  <div style={{display:"flex",alignItems:"center",gap:14}}>
   <span style={{fontSize:32}}>{MOODS[existing.mood]}</span>
   <div style={{flex:1}}>
    <div style={{fontWeight:700,fontSize:12,marginBottom:2}}>🏆 {existing.win}</div>
    {existing.blocker&&<div style={{fontSize:11,color:C.r}}>🚧 {existing.blocker}</div>}
   </div>
   <div style={{textAlign:"center"}}><div style={{fontWeight:800,fontSize:18,color:[C.r,C.o,C.td,C.b,C.g][existing.conf-1]}}>{existing.conf}/5</div><div style={{fontSize:8,color:C.td}}>Confiance</div></div>
  </div>
 </div>;
 if(sent)return <div className="fade-up" style={{background:"rgba(52,211,153,.08)",backdropFilter:"blur(20px)",border:"1px solid rgba(52,211,153,.15)",borderRadius:16,padding:16,marginBottom:20,textAlign:"center"}}>
  <span style={{fontSize:28}}>✅</span><div style={{fontWeight:700,fontSize:13,color:C.g,marginTop:4}}>Pulse envoyé !</div>
 </div>;
 return <div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.35s"}}>
  <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:10,fontFamily:FONT_TITLE}}>⚡ COMMENT ÇA VA CETTE SEMAINE ?</div>
  <div style={{display:"flex",gap:6,marginBottom:10}}>{MOODS.map((e,i)=><button key={i} onClick={()=>setMood(i)} style={{fontSize:20,padding:"4px 7px",borderRadius:8,border:`2px solid ${mood===i?C.acc:C.brd}`,background:mood===i?C.accD:"transparent",cursor:"pointer",transition:"all .15s"}}>{e}</button>)}</div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
   <div><label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3}}>🏆 Victoire</label><input value={win} onChange={e=>setWin(e.target.value)} placeholder="Ta win de la semaine" style={{width:"100%",padding:"7px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none",boxSizing:"border-box"}}/></div>
   <div><label style={{display:"block",color:C.td,fontSize:10,fontWeight:600,marginBottom:3}}>🚧 Blocage <span style={{fontWeight:400,color:C.tm}}>(optionnel)</span></label><input value={blocker} onChange={e=>setBlocker(e.target.value)} placeholder="Un frein ?" style={{width:"100%",padding:"7px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none",boxSizing:"border-box"}}/></div>
  </div>
  <div style={{display:"flex",alignItems:"center",gap:10}}>
   <span style={{fontSize:10,color:C.td,fontWeight:600}}>Confiance</span>
   <input type="range" min={1} max={5} value={conf} onChange={e=>setConf(parseInt(e.target.value))} style={{flex:1}}/>
   <span style={{fontWeight:800,fontSize:13,color:[C.r,C.o,C.td,C.b,C.g][conf-1],minWidth:24}}>{conf}/5</span>
   <button onClick={submit} disabled={mood<0||!win.trim()} style={{padding:"7px 16px",borderRadius:8,border:"none",background:mood>=0&&win.trim()?C.acc:C.brd,color:mood>=0&&win.trim()?"#000":C.td,fontWeight:700,fontSize:11,cursor:mood>=0&&win.trim()?"pointer":"default",fontFamily:FONT,transition:"all .15s"}}>Envoyer ⚡</button>
  </div>
 </div>;
}
export function PorteurDashboard({soc,reps,allM,socBank,ghlData,setPTab,pulses,savePulse,hold,clients,stripeData}){
 const cm=curM();const report=gr(reps,soc.id,cm);
 const bankData=socBank?.[soc.id];const acc2=soc.brandColor||soc.color||C.acc;
 const ca=report?pf(report.ca):0;const charges=report?pf(report.charges):0;
 const marge=ca-charges;const margePct=ca>0?Math.round(marge/ca*100):0;
 const treso=bankData?.balance||0;
 const pm=prevM(cm);const prevReport=gr(reps,soc.id,pm);
 const prevCa=prevReport?pf(prevReport.ca):0;
 const caTrend=prevCa>0?Math.round((ca-prevCa)/prevCa*100):0;
 // Last 6 months chart data
 const chartData=useMemo(()=>{
  const months=[];let m=cm;for(let i=0;i<6;i++){months.unshift(m);m=prevM(m);}
  return months.map(mo=>{const r=gr(reps,soc.id,mo);return{month:ml(mo).split(" ")[0],ca:r?pf(r.ca):0,charges:r?pf(r.charges):0};});
 },[reps,soc.id,cm]);
 const maxVal=Math.max(1,...chartData.map(d=>Math.max(d.ca,d.charges)));
 // Recent transactions
 const excluded=EXCLUDED_ACCOUNTS[soc.id]||[];
 const recentTx=useMemo(()=>{
  if(!bankData?.transactions)return[];
  return bankData.transactions.filter(t=>{const leg=t.legs?.[0];if(!leg)return false;if(excluded.includes(leg.account_id))return false;return true;}).slice(0,5);
 },[bankData,excluded]);
 // GHL stats
 const ghlStats=ghlData?.[soc.id]?.stats;
 const ghlStages=ghlData?.[soc.id]?.pipelines?.[0]?.stages||[];
 const ghlOpps=ghlData?.[soc.id]?.opportunities||[];
 // N vs N-1 comparisons
 const prevCharges=prevReport?pf(prevReport.charges):0;
 const chargesTrend=prevCharges>0?Math.round((charges-prevCharges)/prevCharges*100):0;
 const prevMarge=prevCa-prevCharges;
 const margeTrend=prevMarge>0?Math.round((marge-prevMarge)/Math.abs(prevMarge)*100):0;
 const prevTreso=prevReport?pf(prevReport.tresoSoc):0;
 const tresoTrend=prevTreso>0?Math.round((treso-prevTreso)/prevTreso*100):0;
 // Prévisionnel
 const myClients=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active");
 const prevu=myClients.reduce((a,c)=>a+clientMonthlyRevenue(c),0);
 const realise=ca;
 const prevuPct=prevu>0?Math.round(realise/prevu*100):0;
 const prevuColor=prevuPct>=100?C.g:prevuPct>=80?C.o:C.r;
 // Performance score
 const perfScore=useMemo(()=>{
  let s=0;
  // CA vs objectif (40pts)
  if(soc.obj>0)s+=Math.min(40,Math.round(ca/soc.obj*40));
  else if(ca>0)s+=20;
  // Conversion rate (20pts)
  const gd=ghlData?.[soc.id];const stratCalls=Object.entries(gd?.stats?.callsByType||{}).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
  const integCalls=Object.entries(gd?.stats?.callsByType||{}).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
  const convRate=stratCalls>0?integCalls/stratCalls:0;
  s+=Math.min(20,Math.round(convRate*20));
  // Active clients ratio (20pts)
  const totalContacts=gd?.ghlClients?.length||1;
  s+=Math.min(20,Math.round(myClients.length/totalContacts*20));
  // Payment on time ratio (20pts)
  const excl2=EXCLUDED_ACCOUNTS[soc.id]||[];
  const now45=Date.now()-45*864e5;
  const onTime=myClients.filter(c=>{const cn=(c.name||"").toLowerCase().trim();return(bankData?.transactions||[]).some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;if(excl2.includes(leg.account_id))return false;return new Date(tx.created_at).getTime()>now45&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});}).length;
  s+=myClients.length>0?Math.round(onTime/myClients.length*20):0;
  return clamp(s,0,100);
 },[ca,soc,ghlData,myClients,bankData]);
 const perfColor=perfScore>70?C.g:perfScore>=40?C.o:C.r;
 // Smart alerts
 const[dismissedAlerts,setDismissedAlerts]=useState(()=>{try{return JSON.parse(localStorage.getItem(`scAlertsDismiss_${soc.id}`)||"[]");}catch{return[];}});
 const smartAlerts=useMemo(()=>{
  const alerts=[];const gd2=ghlData?.[soc.id];const now3=Date.now();const excl3=EXCLUDED_ACCOUNTS[soc.id]||[];
  // Impayés >45j
  myClients.forEach(c=>{const cn=(c.name||"").toLowerCase().trim();const now45b=now3-45*864e5;
   const hasRecent=(bankData?.transactions||[]).some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;if(excl3.includes(leg.account_id))return false;return new Date(tx.created_at).getTime()>now45b&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});
   if(!hasRecent&&c.billing){const days=Math.round((now3-now45b)/864e5);alerts.push({id:`unpaid_${c.id}`,icon:"🔴",text:`${c.name} impayé depuis 45j+`,priority:1});}
  });
  // Contrats expirant <30j
  myClients.forEach(c=>{const end=commitmentEnd(c);if(end){const dLeft=Math.round((end.getTime()-now3)/864e5);if(dLeft>0&&dLeft<30)alerts.push({id:`expiry_${c.id}`,icon:"🟡",text:`${c.name} expire dans ${dLeft}j`,priority:2});}});
  // Nouveaux leads <48h
  const h48=now3-48*36e5;
  (gd2?.ghlClients||[]).filter(c2=>new Date(c2.at||c2.dateAdded||0).getTime()>h48).slice(0,3).forEach(c2=>{alerts.push({id:`lead_${c2.ghlId||c2.id}`,icon:"🔵",text:`Nouveau lead: ${c2.name||c2.email||"—"}`,priority:3});});
  // Deals gagnés <7j
  const d7=now3-7*864e5;
  (gd2?.opportunities||[]).filter(o=>o.status==="won"&&new Date(o.updatedAt||o.createdAt||0).getTime()>d7).slice(0,2).forEach(o=>{alerts.push({id:`won_${o.id}`,icon:"🟢",text:`Deal gagné: ${o.name||o.contact?.name||"—"}`,priority:4});});
  return alerts.filter(a=>!dismissedAlerts.includes(a.id)).sort((a,b)=>a.priority-b.priority);
 },[ghlData,myClients,bankData,dismissedAlerts]);
 const dismissAlert=(id)=>{const next=[...dismissedAlerts,id];setDismissedAlerts(next);try{localStorage.setItem(`scAlertsDismiss_${soc.id}`,JSON.stringify(next));}catch{}};
 // Trésorerie chart data (6 months from bank)
 const tresoChartData=useMemo(()=>{
  const months2=[];let m2=cm;for(let i=0;i<6;i++){months2.unshift(m2);m2=prevM(m2);}
  const exclB=EXCLUDED_ACCOUNTS[soc.id]||[];
  return months2.map(mo=>{
   const txs=(bankData?.transactions||[]).filter(t=>{const leg=t.legs?.[0];return leg&&!exclB.includes(leg.account_id)&&(t.created_at||"").startsWith(mo);});
   const entrees=txs.filter(t=>(t.legs?.[0]?.amount||0)>0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0);
   const sorties=Math.abs(txs.filter(t=>(t.legs?.[0]?.amount||0)<0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0));
   return{month:ml(mo).split(" ")[0],entrees:Math.round(entrees),sorties:Math.round(sorties),marge:Math.round(entrees-sorties)};
  });
 },[bankData,cm,soc.id]);
 // Funnel data
 const funnelData=useMemo(()=>{
  const gd3=ghlData?.[soc.id];if(!gd3)return[];
  const totalLeads=gd3.ghlClients?.length||0;
  const cbt=gd3.stats?.callsByType||{};
  const stratCalls2=Object.entries(cbt).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
  const integCalls2=Object.entries(cbt).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
  const clientsActifs=myClients.length;
  return[{stage:"Leads",count:totalLeads,color:"#60a5fa"},{stage:"Appel strat.",count:stratCalls2,color:C.acc},{stage:"Intégration",count:integCalls2,color:C.v},{stage:"Client actif",count:clientsActifs,color:C.g}];
 },[ghlData,myClients]);
 // Mobile detection
 const[isMobile,setIsMobile]=useState(typeof window!=="undefined"&&window.innerWidth<600);
 useEffect(()=>{const h=()=>setIsMobile(window.innerWidth<600);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
 const kpis=[
  {label:"CA du mois",value:`${fmt(ca)}€`,trend:caTrend,accent:acc2},
  {label:"Charges",value:`${fmt(charges)}€`,trend2:chargesTrend,accent:C.r},
  {label:"Marge",value:`${fmt(marge)}€`,sub:`${margePct}%`,trend2:margeTrend,accent:marge>=0?C.g:C.r},
  {label:"Trésorerie",value:`${fmt(treso)}€`,trend2:tresoTrend,accent:soc.brandColorSecondary||C.b},
  ...(()=>{const now=new Date();const mKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;const monthCharges=(stripeData?.charges||[]).filter(ch=>{if(ch.status!=="succeeded")return false;const d=new Date((ch.created||0)*1000);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`===mKey;});const tot=monthCharges.reduce((a,c)=>a+Math.round((c.amount||0)/100),0);return tot>0?[{label:"💳 Revenus Stripe",value:`${fmt(tot)}€`,accent:C.v}]:[];})(),
 ];
 // Mobile quick check mode
 if(isMobile){
  const mobileKpis=[
   {label:"CA mois",value:`${fmt(ca)}€`,accent:acc2},
   {label:"Trésorerie",value:`${fmt(treso)}€`,accent:C.b},
   {label:"Leads semaine",value:String((ghlData?.[soc.id]?.ghlClients||[]).filter(c=>{const d=new Date(c.at||c.dateAdded||0);return Date.now()-d.getTime()<7*864e5;}).length),accent:C.v},
   {label:"RDV aujourd'hui",value:String((ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>(e.startTime||"").startsWith(new Date().toISOString().slice(0,10))).length),accent:C.o},
  ];
  return <div className="fu" style={{padding:"8px 0"}}>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
    {mobileKpis.map((k,i)=><div key={i} className="glass-card-static" style={{padding:20,textAlign:"center"}}>
     <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:6,fontFamily:FONT_TITLE}}>{k.label}</div>
     <div style={{fontSize:28,fontWeight:900,color:k.accent,lineHeight:1}}>{k.value}</div>
    </div>)}
   </div>
   {smartAlerts.slice(0,2).map((a,i)=><div key={a.id} className="glass-card-static" style={{padding:12,marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
    <span style={{fontSize:14}}>{a.icon}</span>
    <span style={{flex:1,fontSize:11,fontWeight:600,color:C.t}}>{a.text}</span>
    <button onClick={()=>dismissAlert(a.id)} style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:12}}>✕</button>
   </div>)}
  </div>;
 }
 // Streak tracking
 const streak=useMemo(()=>{
  const key=`streak_${soc.id}`;
  try{
   const raw=JSON.parse(localStorage.getItem(key)||"null");
   const today=new Date().toISOString().slice(0,10);
   const yesterday=new Date(Date.now()-864e5).toISOString().slice(0,10);
   if(!raw){const v={lastLogin:today,count:1};localStorage.setItem(key,JSON.stringify(v));return v;}
   if(raw.lastLogin===today)return raw;
   if(raw.lastLogin===yesterday){const v={lastLogin:today,count:raw.count+1};localStorage.setItem(key,JSON.stringify(v));return v;}
   const v={lastLogin:today,count:1};localStorage.setItem(key,JSON.stringify(v));return v;
  }catch{return{lastLogin:"",count:1};}
 },[soc.id]);
 // Météo Business
 const meteo=useMemo(()=>{
  const critAlerts=smartAlerts.filter(a=>a.priority===1).length;
  const allAlertCount=smartAlerts.length;
  const unpaidCount=myClients.filter(c=>{const cn=(c.name||"").toLowerCase().trim();const now45x=Date.now()-45*864e5;return c.billing&&!(bankData?.transactions||[]).some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;return new Date(tx.created_at).getTime()>now45x&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});}).length;
  const convRateM=(()=>{const gd=ghlData?.[soc.id];const cbt=gd?.stats?.callsByType||{};const s2=Object.entries(cbt).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);const i2=Object.entries(cbt).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);return s2>0?Math.round(i2/s2*100):0;})();
  const caTrendM=prevCa>0?Math.round((ca-prevCa)/prevCa*100):0;
  if(perfScore>75&&critAlerts===0)return{emoji:"☀️",text:"Tout roule !",sub:`CA ${caTrendM>=0?"+":""}${caTrendM}%, ${unpaidCount} impayé${unpaidCount>1?"s":""}`,glow:"rgba(52,211,153,.15)",color:C.g,border:"linear-gradient(135deg,#34d399,#22c55e)"};
  if((perfScore>=50&&perfScore<=75)||allAlertCount<=2)return{emoji:"⛅",text:"Quelques points d'attention",sub:`${unpaidCount>0?unpaidCount+" impayé"+(unpaidCount>1?"s":""):"Conversion "+convRateM+"%"}`,glow:"rgba(251,146,60,.15)",color:C.o,border:"linear-gradient(135deg,#FFAA00,#fb923c)"};
  if((perfScore>=30&&perfScore<50)||allAlertCount>=3)return{emoji:"🌧️",text:"Vigilance requise",sub:`${unpaidCount} impayé${unpaidCount>1?"s":""}, conversion ${convRateM>0?convRateM+"%":"en baisse"}`,glow:"rgba(248,113,113,.15)",color:C.r,border:"linear-gradient(135deg,#fb923c,#f87171)"};
  return{emoji:"⛈️",text:"Actions urgentes nécessaires",sub:`${critAlerts} alerte${critAlerts>1?"s":""} critique${critAlerts>1?"s":""}`,glow:"rgba(248,113,113,.25)",color:C.r,border:"linear-gradient(135deg,#f87171,#dc2626)"};
 },[perfScore,smartAlerts]);
 // Conseil du jour IA
 const conseilDuJour=useMemo(()=>{
  const dayOfMonth=new Date().getDate();const tips=[];
  // Clients sans appels >20j
  const calEvts=ghlData?.[soc.id]?.calendarEvents||[];
  const now20=Date.now()-20*864e5;
  const noCallClients=myClients.filter(cl=>{const cn=(cl.name||"").toLowerCase();return !calEvts.some(e=>new Date(e.startTime||0).getTime()>now20&&(e.contactName||e.title||"").toLowerCase().includes(cn));});
  if(noCallClients.length>0){const top3=noCallClients.slice(0,3);top3.forEach(cl=>{const days=Math.round((Date.now()-now20)/864e5);tips.push({text:`💡 Appelle ${cl.name||"ce client"} — pas de contact depuis ${days}j`,action:"clients"});});}
  // Conversion rate
  const gd=ghlData?.[soc.id];const cbt=gd?.stats?.callsByType||{};
  const stratC=Object.entries(cbt).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
  const integC=Object.entries(cbt).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
  const convR=stratC>0?Math.round(integC/stratC*100):0;
  if(convR>0)tips.push({text:`💡 Ton taux de conversion est à ${convR}% — ${convR>30?"continue comme ça !":"essaie d'améliorer ton pitch"}`,action:null});
  // New untouched leads
  const h48=Date.now()-48*36e5;
  const newLeads=(gd?.ghlClients||[]).filter(c2=>new Date(c2.at||c2.dateAdded||0).getTime()>h48).length;
  if(newLeads>0)tips.push({text:`💡 ${newLeads} lead${newLeads>1?"s":""} ${newLeads>1?"attendent":"attend"} une réponse depuis 48h`,action:"clients"});
  // Payment gaps
  const excl5=EXCLUDED_ACCOUNTS[soc.id]||[];const now45b=Date.now()-45*864e5;
  const unpaid=myClients.filter(cl=>{const cn=(cl.name||"").toLowerCase().trim();return !(bankData?.transactions||[]).some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;if(excl5.includes(leg.account_id))return false;return new Date(tx.created_at).getTime()>now45b&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});}).length;
  const unpaidClients2=myClients.filter(cl=>{const cn=(cl.name||"").toLowerCase().trim();return !(bankData?.transactions||[]).some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;if(excl5.includes(leg.account_id))return false;return new Date(tx.created_at).getTime()>now45b&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});});
  if(unpaid>0){unpaidClients2.slice(0,2).forEach(cl=>{tips.push({text:`💡 Relance ${cl.name||"client"} — aucun paiement détecté depuis 45j+`,action:"clients"});});}
  // Contract expirations
  const expiring=myClients.filter(cl=>{const end=commitmentEnd(cl);return end&&(end.getTime()-Date.now())<30*864e5&&(end.getTime()-Date.now())>0;}).length;
  const expiringClients=myClients.filter(cl=>{const end=commitmentEnd(cl);return end&&(end.getTime()-Date.now())<30*864e5&&(end.getTime()-Date.now())>0;});
  if(expiring>0){expiringClients.slice(0,2).forEach(cl=>{tips.push({text:`💡 Contrat ${cl.name||"client"} expire dans ${commitmentRemaining(cl)}j — renouvellement ?`,action:"clients"});});}
  if(tips.length===0)tips.push({text:"💡 Tout semble en ordre — continue sur ta lancée !",action:null});
  return tips;
 },[soc.id,ghlData,myClients,bankData]);
 return <div className="fu">
  {/* Météo Business + Streak */}
  <div style={{display:"flex",gap:12,marginBottom:16,alignItems:"stretch"}}>
   <div style={{flex:1,padding:3,borderRadius:18,background:meteo.border||"linear-gradient(135deg,#34d399,#22c55e)"}}>
    <div className="glass-card-static" style={{padding:"20px 24px",display:"flex",alignItems:"center",gap:16,borderRadius:15,boxShadow:`0 0 30px ${meteo.glow}`}}>
     <span style={{fontSize:64,lineHeight:1,animation:"weatherPulse 3s ease-in-out infinite",display:"inline-block"}}>{meteo.emoji}</span>
     <div>
      <div style={{fontWeight:900,fontSize:16,color:meteo.color,marginBottom:2}}>{meteo.text}</div>
      <div style={{fontSize:11,color:C.t,fontWeight:500,opacity:.8}}>{meteo.sub}</div>
      <div style={{fontSize:9,color:C.td,marginTop:4}}>Score: {perfScore}/100 · {smartAlerts.length} alerte{smartAlerts.length>1?"s":""}</div>
     </div>
    </div>
   </div>
   <div className="glass-card-static" style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:8,minWidth:80}}>
    <span style={{fontSize:28}}>🔥</span>
    <div><div style={{fontWeight:900,fontSize:20,color:C.acc}}>{streak.count}j</div>{streak.count>=7&&<div style={{fontSize:9,color:C.acc,fontWeight:600}}>semaine !</div>}</div>
   </div>
  </div>
  {/* Conseil du jour IA */}
  {(()=>{
   const[tipIdx,setTipIdx]=useState(0);
   const tips=conseilDuJour;const tip=tips[tipIdx%tips.length]||{text:"",action:null};
   return <div className="glass-card-static" style={{padding:"14px 18px",marginBottom:16,borderLeft:`3px solid ${C.acc}`,background:"rgba(255,170,0,.04)"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
     <div style={{flex:1,fontSize:12,fontWeight:600,color:C.t}}>{tip.text}</div>
     <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
      {tips.length>1&&<>
       <button onClick={()=>setTipIdx(Math.max(0,tipIdx-1))} style={{background:"none",border:"none",color:tipIdx>0?C.acc:C.tm,cursor:tipIdx>0?"pointer":"default",fontSize:14,padding:2}}>‹</button>
       <span style={{fontSize:9,color:C.td,fontWeight:600,minWidth:28,textAlign:"center"}}>{tipIdx%tips.length+1}/{tips.length}</span>
       <button onClick={()=>setTipIdx(Math.min(tips.length-1,tipIdx+1))} style={{background:"none",border:"none",color:tipIdx<tips.length-1?C.acc:C.tm,cursor:tipIdx<tips.length-1?"pointer":"default",fontSize:14,padding:2}}>›</button>
      </>}
      {tip.action&&<button onClick={()=>setPTab(tip.action==="clients"?3:0)} style={{background:C.accD,border:`1px solid ${C.acc}44`,borderRadius:6,color:C.acc,fontSize:9,fontWeight:700,padding:"3px 8px",cursor:"pointer",fontFamily:FONT}}>→</button>}
     </div>
    </div>
   </div>;
  })()}
  {/* Smart Alerts */}
  {smartAlerts.length>0&&<div style={{marginBottom:16}}>
   {smartAlerts.slice(0,3).map((a,i)=>{const borderColor=a.priority===1?C.r:a.priority===2?C.o:a.priority===3?C.b:C.g;const actionTab=a.text.includes("impayé")||a.text.includes("expire")||a.text.includes("lead")?3:1;
    return <div key={a.id} className={`glass-card-static slide-down`} style={{padding:"10px 14px",marginBottom:4,display:"flex",alignItems:"center",gap:8,borderLeft:`3px solid ${borderColor}`,animationDelay:`${i*0.08}s`}}>
     <span style={{fontSize:14}}>{a.icon}</span>
     <span style={{flex:1,fontSize:11,fontWeight:600,color:C.t}}>{a.text}</span>
     <button onClick={()=>setPTab(actionTab)} style={{background:borderColor+"18",border:`1px solid ${borderColor}33`,borderRadius:6,color:borderColor,fontSize:9,fontWeight:700,padding:"3px 8px",cursor:"pointer",fontFamily:FONT}}>Voir</button>
     <button onClick={()=>dismissAlert(a.id)} style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:12,padding:2}}>✕</button>
    </div>;
   })}
   {smartAlerts.length>3&&<button onClick={()=>setPTab(1)} style={{background:"none",border:"none",color:C.acc,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT,marginTop:4}}>Voir tout ({smartAlerts.length}) →</button>}
  </div>}
  {/* Performance Score + Prévisionnel row */}
  <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:12,marginBottom:16}}>
   {(()=>{
    const[displayScore,setDisplayScore]=useState(0);
    const[showBreakdown,setShowBreakdown]=useState(false);
    useEffect(()=>{let frame=0;const target=perfScore;const duration=40;const step=()=>{frame++;const progress=Math.min(frame/duration,1);const eased=1-Math.pow(1-progress,3);setDisplayScore(Math.round(eased*target));if(frame<duration)requestAnimationFrame(step);};requestAnimationFrame(step);},[perfScore]);
    const caScore=soc.obj>0?Math.min(40,Math.round(ca/soc.obj*40)):ca>0?20:0;
    const gd9=ghlData?.[soc.id];const s2=Object.entries(gd9?.stats?.callsByType||{}).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);const i2=Object.entries(gd9?.stats?.callsByType||{}).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);const convScore=Math.min(20,s2>0?Math.round(i2/s2*20):0);
    const clientScore=Math.min(20,Math.round(myClients.length/Math.max(1,gd9?.ghlClients?.length||1)*20));
    const payScore=perfScore-caScore-convScore-clientScore;
    const gradientColor=perfScore>70?"#34d399":perfScore>=40?"#FFAA00":"#f87171";
    return <div className="glass-card-static" style={{padding:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minWidth:110,position:"relative",cursor:"pointer"}} onMouseEnter={()=>setShowBreakdown(true)} onMouseLeave={()=>setShowBreakdown(false)}>
     <div style={{position:"relative",width:80,height:80,marginBottom:6}}>
      <svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="33" fill="none" stroke={C.brd} strokeWidth="6"/><circle cx="40" cy="40" r="33" fill="none" stroke={gradientColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${displayScore*2.073} 207.3`} transform="rotate(-90 40 40)" style={{transition:"stroke-dasharray .6s ease, stroke .4s ease"}}/></svg>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:22,color:gradientColor}}>{displayScore}</div>
     </div>
     <div style={{fontSize:8,fontWeight:700,color:C.td,letterSpacing:.5,textAlign:"center",fontFamily:FONT_TITLE}}>SCORE PERFORMANCE</div>
     {showBreakdown&&<div style={{position:"absolute",bottom:-60,left:"50%",transform:"translateX(-50%)",background:"rgba(14,14,22,.95)",border:`1px solid ${C.brd}`,borderRadius:10,padding:"8px 12px",zIndex:10,whiteSpace:"nowrap",boxShadow:"0 8px 32px rgba(0,0,0,.6)",fontSize:9,color:C.td}}>
      <div>CA: <strong style={{color:C.acc}}>{caScore}/40</strong> | Conv: <strong style={{color:C.v}}>{convScore}/20</strong></div>
      <div>Clients: <strong style={{color:C.b}}>{clientScore}/20</strong> | Paiements: <strong style={{color:C.g}}>{Math.max(0,payScore)}/20</strong></div>
     </div>}
    </div>;
   })()}
   {prevu>0&&<div className="glass-card-static" style={{padding:20}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:8,fontFamily:FONT_TITLE}}>📊 PRÉVISIONNEL</div>
    <div style={{display:"flex",gap:16,marginBottom:8}}>
     <div><div style={{fontSize:8,color:C.td}}>Prévu</div><div style={{fontWeight:900,fontSize:18,color:C.acc}}>{fmt(prevu)}€</div></div>
     <div><div style={{fontSize:8,color:C.td}}>Réalisé</div><div style={{fontWeight:900,fontSize:18,color:prevuColor}}>{fmt(realise)}€</div></div>
     <div><div style={{fontSize:8,color:C.td}}>%</div><div style={{fontWeight:900,fontSize:18,color:prevuColor}}>{prevuPct}%</div></div>
    </div>
    <div style={{height:6,background:C.brd,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(prevuPct,100)}%`,background:prevuColor,borderRadius:3,transition:"width .5s ease"}}/></div>
   </div>}
  </div>
  {/* Hero KPIs */}
  {(()=>{
   const sparkData=useMemo(()=>{
    const months=[];let m=cm;for(let i=0;i<6;i++){months.unshift(m);m=prevM(m);}
    return{
     ca:months.map(mo=>pf(gr(reps,soc.id,mo)?.ca)),
     charges:months.map(mo=>pf(gr(reps,soc.id,mo)?.charges)),
     marge:months.map(mo=>pf(gr(reps,soc.id,mo)?.ca)-pf(gr(reps,soc.id,mo)?.charges)),
     treso:months.map(mo=>{const bd=socBank?.[soc.id];return bd?.monthly?.[mo]?bd.monthly[mo].income-bd.monthly[mo].expense:0;}),
    };
   },[reps,soc.id,cm,socBank]);
   const Sparkline=({data,color})=>{if(!data||data.every(v=>v===0))return null;const max=Math.max(...data,1);const min=Math.min(...data,0);const range=max-min||1;const w=48,h=18;const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*h}`).join(" ");return <svg width={w} height={h} style={{marginLeft:6,flexShrink:0}}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".6"/></svg>;};
   const sparkKeys=["ca","charges","marge","treso"];
   return <div className="kpi-grid-responsive" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
    {kpis.map((k,i)=><div key={i} className="fade-up glass-card-static kpi-shimmer" style={{padding:22,animationDelay:`${i*0.1}s`,position:"relative",overflow:"hidden",transition:"all .3s cubic-bezier(.4,0,.2,1)"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=`${k.accent||C.acc}33`;e.currentTarget.style.boxShadow=`0 0 28px ${(k.accent||C.acc)}18`;e.currentTarget.style.transform="translateY(-3px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.06)";e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,.3)";e.currentTarget.style.transform="translateY(0)";}}>
     <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8,fontFamily:FONT_TITLE}}>{k.label}</div>
      {i<4&&<Sparkline data={sparkData[sparkKeys[i]]} color={k.accent||C.acc}/>}
     </div>
     <div style={{fontSize:30,fontWeight:900,color:k.accent||C.t,lineHeight:1}}>{k.value}</div>
     {k.trend!==undefined&&k.trend!==0&&<div style={{marginTop:6,fontSize:11,fontWeight:700,color:k.trend>0?C.g:C.r}}>{k.trend>0?"▲":"▼"} {Math.abs(k.trend)}% vs N-1</div>}
     {k.trend2!==undefined&&k.trend2!==0&&<div style={{marginTop:4,fontSize:11,fontWeight:700,color:k.trend2>0?(k.label==="Charges"?C.r:C.g):(k.label==="Charges"?C.g:C.r)}}>{k.trend2>0?"▲":"▼"} {Math.abs(k.trend2)}% vs N-1</div>}
     {k.sub&&!k.trend&&!k.trend2&&<div style={{marginTop:6,fontSize:11,fontWeight:700,color:k.accent}}>{k.sub}</div>}
     {k.sub&&(k.trend||k.trend2)&&<div style={{marginTop:2,fontSize:10,fontWeight:600,color:k.accent,opacity:.7}}>{k.sub}</div>}
    </div>)}
   </div>;
  })()}
  {/* Trésorerie évolutive chart */}
  {tresoChartData.some(d=>d.entrees>0||d.sorties>0)&&<div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.25s"}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📈 TRÉSORERIE ÉVOLUTIVE — 6 MOIS</div>
   <div style={{height:220}}>
    <ResponsiveContainer>
     <AreaChart data={tresoChartData} margin={{top:5,right:10,left:0,bottom:5}}>
      <defs>
       <linearGradient id={`gradEnt_${soc.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.g} stopOpacity={0.3}/><stop offset="100%" stopColor={C.g} stopOpacity={0.02}/></linearGradient>
       <linearGradient id={`gradSort_${soc.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.r} stopOpacity={0.3}/><stop offset="100%" stopColor={C.r} stopOpacity={0.02}/></linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
      <XAxis dataKey="month" tick={{fill:C.td,fontSize:10}} axisLine={false} tickLine={false}/>
      <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/>
      <Tooltip content={<CTip/>}/>
      <Area type="monotone" dataKey="entrees" stroke={C.g} strokeWidth={2} fill={`url(#gradEnt_${soc.id})`} name="Entrées" animationDuration={1000}/>
      <Area type="monotone" dataKey="sorties" stroke={C.r} strokeWidth={2} fill={`url(#gradSort_${soc.id})`} name="Sorties" animationDuration={1000}/>
      <Line type="monotone" dataKey="marge" stroke={C.acc} strokeWidth={2.5} dot={false} name="Marge" animationDuration={1000}/>
      <Legend wrapperStyle={{fontSize:10}}/>
     </AreaChart>
    </ResponsiveContainer>
   </div>
  </div>}
  {/* Mini Funnel */}
  {funnelData.length>0&&funnelData[0].count>0&&<div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.3s"}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:10,fontFamily:FONT_TITLE}}>🔄 FUNNEL DE CONVERSION</div>
   <div style={{display:"flex",flexDirection:"column",gap:0}}>
    {funnelData.map((f,i)=>{const maxW=funnelData[0].count||1;const w=Math.max(25,Math.round(f.count/maxW*100));const conv=i>0&&funnelData[i-1].count>0?Math.round(f.count/funnelData[i-1].count*100):null;
     const val=(ghlData?.[soc.id]?.opportunities||[]).filter(o=>o.status==="open").reduce((a,o)=>a+o.value,0);
     return <Fragment key={i}>
      {i>0&&<div style={{fontSize:9,color:C.td,fontWeight:700,textAlign:"center",padding:"3px 0"}}>↓ <span style={{color:conv>=50?C.g:conv>=25?C.o:C.r,fontWeight:800}}>{conv}%</span></div>}
      <div style={{width:`${w}%`,margin:"0 auto",background:`linear-gradient(135deg,${f.color}18,${f.color}30)`,border:`1px solid ${f.color}55`,borderRadius:10,padding:"12px 14px",textAlign:"center",animation:`barExpand .6s ease ${i*0.12}s both`,["--target-w"]:`${w}%`}}>
       <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <span style={{fontWeight:900,fontSize:20,color:f.color}}>{f.count}</span>
        <span style={{fontSize:11,color:C.td,fontWeight:600}}>{f.stage}</span>
        {i===1&&val>0&&<span style={{fontSize:9,color:C.acc,fontWeight:700,background:C.accD,padding:"2px 6px",borderRadius:6}}>{fmt(val)}€</span>}
       </div>
      </div>
     </Fragment>;
    })}
   </div>
  </div>}
  {/* Parcours Client Visuel */}
  <ParcoursClientVisuel ghlData={ghlData} socId={soc.id} myClients={myClients}/>
  {/* Gamification XP & Badges */}
  <GamificationPanel soc={soc} ca={ca} myClients={myClients} streak={streak} reps={reps} allM={allM} ghlData={ghlData}/>
  {/* Quick nav to Sales & Pub tabs */}
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
   <div className="fade-up glass-card" onClick={()=>setPTab(2)} style={{padding:18,cursor:"pointer",textAlign:"center",animationDelay:"0.32s",borderTop:`2px solid #34d399`}}>
    <div style={{fontSize:24,marginBottom:6}}>📞</div>
    <div style={{fontWeight:700,fontSize:12,color:C.t}}>Sales</div>
    <div style={{fontSize:10,color:C.td,marginTop:2}}>Pipeline, KPIs, analytics</div>
    {(()=>{const gd2=ghlData?.[soc.id];const won2=(gd2?.opportunities||[]).filter(o=>o.status==="won");return won2.length>0?<div style={{marginTop:6,fontWeight:800,fontSize:14,color:C.g}}>{won2.length} deals · {fmt(won2.reduce((a,o)=>a+(o.value||0),0))}€</div>:null;})()}
   </div>
   <div className="fade-up glass-card" onClick={()=>setPTab(3)} style={{padding:18,cursor:"pointer",textAlign:"center",animationDelay:"0.35s",borderTop:`2px solid #f472b6`}}>
    <div style={{fontSize:24,marginBottom:6}}>📣</div>
    <div style={{fontWeight:700,fontSize:12,color:C.t}}>Publicité</div>
    <div style={{fontSize:10,color:C.td,marginTop:2}}>Meta Ads, ROAS, CPL</div>
    {(()=>{let metaRaw3=null;try{metaRaw3=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${cm}`));}catch{}return metaRaw3?.spend?<div style={{marginTop:6,fontWeight:800,fontSize:14,color:"#f472b6"}}>{fmt(metaRaw3.spend)}€ · ROAS {metaRaw3.revenue&&metaRaw3.spend?(metaRaw3.revenue/metaRaw3.spend).toFixed(1)+"x":"—"}</div>:null;})()}
   </div>
  </div>
  {/* Pulse widget */}
  {(()=>{const w=curW();const existing=pulses?.[`${soc.id}_${w}`];return <PulseDashWidget soc={soc} existing={existing} savePulse={savePulse} hold={hold}/>;})()}
  {/* Today's Agenda Summary + Alerts */}
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
   <div className="fade-up glass-card-static" style={{padding:16,animationDelay:"0.3s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.v,letterSpacing:1,marginBottom:8,fontFamily:FONT_TITLE}}>📅 AGENDA DU JOUR</div>
    {(()=>{const now2=new Date();const ts2=now2.toISOString().slice(0,10);const evts2=(ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>(e.startTime||"").startsWith(ts2)).sort((a,b)=>new Date(a.startTime)-new Date(b.startTime)).slice(0,3);
     if(evts2.length===0)return <div style={{color:C.td,fontSize:11}}>Aucun RDV aujourd'hui</div>;
     return evts2.map((e,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:i<evts2.length-1?`1px solid ${C.brd}`:"none"}}>
      <span style={{fontSize:12}}>{/strat/i.test(e.title||"")?"📞":/int[eé]g/i.test(e.title||"")?"🤝":"📅"}</span>
      <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.contactName||e.title||"RDV"}</div><div style={{fontSize:8,color:C.td}}>{new Date(e.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</div></div>
     </div>);
    })()}
   </div>
   <div className="fade-up glass-card-static" style={{padding:16,animationDelay:"0.35s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.o,letterSpacing:1,marginBottom:8,fontFamily:FONT_TITLE}}>🔔 ALERTES</div>
    {(()=>{const alerts=[];const gd2=ghlData?.[soc.id];const h48=Date.now()-48*36e5;
     (gd2?.ghlClients||[]).filter(c2=>new Date(c2.at||c2.dateAdded||0).getTime()>h48).slice(0,2).forEach(c2=>{alerts.push({icon:"🟢",text:`Lead: ${c2.name||c2.email||"—"}`});});
     (socBank?.[soc.id]?.transactions||[]).filter(t=>(t.legs?.[0]?.amount||0)>0).slice(0,1).forEach(t=>{alerts.push({icon:"💰",text:`+${fmt(t.legs?.[0]?.amount||0)}€ reçu`});});
     if(alerts.length===0)return <div style={{color:C.td,fontSize:11}}>Rien de nouveau</div>;
     return alerts.map((a,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0"}}><span style={{fontSize:11}}>{a.icon}</span><span style={{fontSize:10,fontWeight:600}}>{a.text}</span></div>);
    })()}
   </div>
  </div>
  {/* Revenue AreaChart (Recharts) */}
  <div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.4s"}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📈 ÉVOLUTION CA VS CHARGES — 6 MOIS</div>
   <div style={{height:220}}>
    <ResponsiveContainer>
     <AreaChart data={chartData} margin={{top:5,right:10,left:0,bottom:5}}>
      <defs>
       <linearGradient id={`gradCA_${soc.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={acc2} stopOpacity={0.4}/><stop offset="100%" stopColor={acc2} stopOpacity={0.02}/></linearGradient>
       <linearGradient id={`gradCh_${soc.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.r} stopOpacity={0.3}/><stop offset="100%" stopColor={C.r} stopOpacity={0.02}/></linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
      <XAxis dataKey="month" tick={{fill:C.td,fontSize:10}} axisLine={false} tickLine={false}/>
      <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/>
      <Tooltip content={<CTip/>}/>
      <Area type="monotone" dataKey="ca" stroke={acc2} strokeWidth={2.5} fill={`url(#gradCA_${soc.id})`} name="CA" animationDuration={1200}/>
      <Area type="monotone" dataKey="charges" stroke={C.r} strokeWidth={2} fill={`url(#gradCh_${soc.id})`} name="Charges" animationDuration={1200} animationBegin={300}/>
      <Legend wrapperStyle={{fontSize:10}}/>
     </AreaChart>
    </ResponsiveContainer>
   </div>
  </div>
  {/* Expense Breakdown PieChart */}
  {(()=>{
   const excluded2=EXCLUDED_ACCOUNTS[soc.id]||[];
   const catTotals={};
   if(bankData?.transactions){
    const now2=new Date();const mStart2=new Date(now2.getFullYear(),now2.getMonth(),1);
    bankData.transactions.filter(t=>{const leg=t.legs?.[0];if(!leg)return false;if(excluded2.includes(leg.account_id))return false;return new Date(t.created_at)>=mStart2&&leg.amount<0;}).forEach(t=>{
     const cat=categorizeTransaction(t);const amt=Math.abs(t.legs?.[0]?.amount||0);
     if(cat.id!=="revenus"&&cat.id!=="transfert")catTotals[cat.label]=(catTotals[cat.label]||0)+amt;
    });
   }
   const pieData=Object.entries(catTotals).map(([name,value])=>({name,value:Math.round(value)})).sort((a,b)=>b.value-a.value);
   const PIE_COLORS=[C.r,C.o,C.b,C.v,"#ec4899","#14b8a6",C.acc,"#8b5cf6"];
   if(pieData.length===0)return <div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.5s"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📊 RÉPARTITION DES DÉPENSES — {ml(cm)}</div>
    <div style={{textAlign:"center",padding:20,color:C.td,fontSize:12}}>Aucune donnée de dépenses</div>
   </div>;
   return <div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.5s"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📊 RÉPARTITION DES DÉPENSES — {ml(cm)}</div>
    <div style={{display:"flex",alignItems:"center",height:200}}>
     <div style={{width:"50%",height:200}}><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} strokeWidth={0} animationDuration={1000}>{pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Pie><Tooltip content={<CTip/>}/></PieChart></ResponsiveContainer></div>
     <div style={{flex:1,paddingLeft:8}}>{pieData.slice(0,6).map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}><span style={{width:8,height:8,borderRadius:2,background:PIE_COLORS[i%PIE_COLORS.length],flexShrink:0}}/><span style={{flex:1,fontSize:10,color:C.td,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</span><span style={{fontWeight:700,fontSize:10,color:C.t}}>{fmt(d.value)}€</span></div>)}</div>
    </div>
   </div>;
  })()}
  {/* Pipeline Funnel */}
  {ghlStats&&<div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.6s"}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📊 CHIFFRES CLÉS</div>
   {(()=>{
    const totalContacts=ghlData?.[soc.id]?.ghlClients?.length||0;
    const inPipeline=ghlOpps.filter(o=>o.status==="open").length;
    const wonAll=ghlOpps.filter(o=>o.status==="won");
    const lostAll=ghlOpps.filter(o=>o.status==="lost");
    const wonVal=wonAll.reduce((a,o)=>a+o.value,0);
    const pipeVal=ghlOpps.filter(o=>o.status==="open").reduce((a,o)=>a+o.value,0);
    const cbt=ghlStats.callsByType||{};const stratCalls=Object.entries(cbt).filter(([n])=>!n.toLowerCase().includes("intégration")&&!n.toLowerCase().includes("integration")).reduce((a,[,v])=>a+v,0);
    const integCalls=Object.entries(cbt).filter(([n])=>n.toLowerCase().includes("intégration")||n.toLowerCase().includes("integration")).reduce((a,[,v])=>a+v,0);
    const convRate=stratCalls>0?Math.round(integCalls/stratCalls*100):0;
    const kpis=[
     {icon:"👥",label:"Contacts total",value:totalContacts,color:"#60a5fa"},
     {icon:"🎯",label:"Dans la pipeline",value:inPipeline,sub:fmt(pipeVal)+"€",color:C.acc},
     {icon:"✅",label:"Clients gagnés",value:wonAll.length,sub:fmt(wonVal)+"€",color:C.g},
     {icon:"❌",label:"Clients perdus",value:lostAll.length,color:C.r},
     {icon:"📈",label:"Taux de conversion",value:convRate+"%",sub:stratCalls>0?`${integCalls}/${stratCalls} appels`:null,color:"#a78bfa"},
     ...Object.entries(ghlStats.callsByType||{}).map(([name,count])=>{const isInteg=name.toLowerCase().includes("intégration")||name.toLowerCase().includes("integration");return{icon:isInteg?"🤝":"📞",label:name.replace(/ - LEADX| - .*$/gi,"").trim(),value:count,color:isInteg?"#a78bfa":"#14b8a6"};}),
     {icon:"💰",label:"Valeur moyenne",value:fmt(ghlStats.avgDealSize)+"€",color:C.acc},
     (()=>{const evts=ghlData?.[soc.id]?.calendarEvents||[];const total=evts.length;const noShow=evts.filter(e=>(e.status||"").toLowerCase().includes("cancelled")||(e.status||"").toLowerCase().includes("no_show")||(e.status||"").toLowerCase().includes("no-show")).length;const rate=total>0?Math.round(noShow/total*100):0;return{icon:"🚫",label:"No-show",value:rate+"%",sub:total>0?`${noShow}/${total} RDV`:null,color:C.r};})(),
     (()=>{const wonOpps2=(ghlData?.[soc.id]?.opportunities||[]).filter(o=>o.status==="won");const cls2=ghlData?.[soc.id]?.ghlClients||[];if(wonOpps2.length===0)return{icon:"⏱️",label:"Conversion moy.",value:"—",color:C.o};let totalDays=0,count2=0;wonOpps2.forEach(o=>{const cid=o.contact?.id;const cl=cls2.find(c=>c.ghlId===cid);const created=cl?.at||o.createdAt;const won2=o.updatedAt||o.createdAt;if(created&&won2){const diff=Math.max(0,Math.round((new Date(won2)-new Date(created))/(864e5)));totalDays+=diff;count2++;}});const avg2=count2>0?Math.round(totalDays/count2):0;return{icon:"⏱️",label:"Conversion moy.",value:count2>0?`${avg2}j`:"—",sub:count2>0?`sur ${count2} deals`:null,color:C.o};})(),
    ];
    return <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
     {kpis.map((k,i)=><div key={i} style={{padding:"12px 10px",background:k.color+"10",borderRadius:10,border:`1px solid ${k.color}22`,textAlign:"center"}}>
      <div style={{fontSize:18,marginBottom:4}}>{k.icon}</div>
      <div style={{fontWeight:900,fontSize:20,color:k.color}}>{k.value}</div>
      {k.sub&&<div style={{fontSize:9,color:k.color,fontWeight:600,opacity:.8}}>{k.sub}</div>}
      <div style={{fontSize:8,color:C.td,marginTop:2,fontWeight:600}}>{k.label}</div>
     </div>)}
    </div>;
   })()}
  </div>}
  {/* Prospect/Client Evolution Chart */}
  {ghlStats&&(()=>{
   const cls3=ghlData?.[soc.id]?.ghlClients||[];const wonOpps3=(ghlData?.[soc.id]?.opportunities||[]).filter(o=>o.status==="won");
   const now3=new Date();const months3=[];for(let i=5;i>=0;i--){const d=new Date(now3.getFullYear(),now3.getMonth()-i,1);months3.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:MN[d.getMonth()]});}
   const evoData=months3.map(mo=>{const prospects=cls3.filter(c=>{const dt=(c.at||c.createdAt||"").slice(0,7);return dt===mo.key;}).length;const clients3=wonOpps3.filter(o=>{const dt=(o.updatedAt||o.createdAt||"").slice(0,7);return dt===mo.key;}).length;return{month:mo.label,prospects,clients:clients3};});
   return <div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.65s"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📈 NOUVEAUX PROSPECTS & CLIENTS — 6 MOIS</div>
    <div style={{height:200}}>
     <ResponsiveContainer>
      <AreaChart data={evoData} margin={{top:5,right:10,left:0,bottom:5}}>
       <defs>
        <linearGradient id={`gradP_${soc.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.o} stopOpacity={0.4}/><stop offset="100%" stopColor={C.o} stopOpacity={0.02}/></linearGradient>
        <linearGradient id={`gradCl_${soc.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.g} stopOpacity={0.4}/><stop offset="100%" stopColor={C.g} stopOpacity={0.02}/></linearGradient>
       </defs>
       <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
       <XAxis dataKey="month" tick={{fill:C.td,fontSize:10}} axisLine={false} tickLine={false}/>
       <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} allowDecimals={false}/>
       <Tooltip content={<CTip/>}/>
       <Area type="monotone" dataKey="prospects" stroke={C.o} strokeWidth={2.5} fill={`url(#gradP_${soc.id})`} name="Prospects" animationDuration={1200}/>
       <Area type="monotone" dataKey="clients" stroke={C.g} strokeWidth={2.5} fill={`url(#gradCl_${soc.id})`} name="Clients gagnés" animationDuration={1200} animationBegin={300}/>
       <Legend wrapperStyle={{fontSize:10}}/>
      </AreaChart>
     </ResponsiveContainer>
    </div>
   </div>;
  })()}
  {/* Lead Sources */}
  {ghlStats&&(()=>{
   const cls4=ghlData?.[soc.id]?.ghlClients||[];
   const srcMap={};cls4.forEach(c=>{const src=c.source||c.notes?.split(",").find(t=>t.trim())||"Inconnu";const key=src.trim()||"Inconnu";srcMap[key]=(srcMap[key]||0)+1;});
   const sources=Object.entries(srcMap).sort((a,b)=>b[1]-a[1]);
   const srcColors=["#60a5fa","#FFAA00","#34d399","#fb923c","#a78bfa","#f43f5e","#14b8a6","#ec4899","#eab308","#8b5cf6"];
   if(sources.length===0)return null;
   return <div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.7s"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📣 SOURCES DES LEADS</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
     {sources.map(([src,count],i)=><span key={src} style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:700,background:srcColors[i%srcColors.length]+"18",color:srcColors[i%srcColors.length],border:`1px solid ${srcColors[i%srcColors.length]}33`}}>{src} <span style={{fontWeight:900}}>{count}</span></span>)}
    </div>
   </div>;
  })()}
  {/* OKR / Objectifs */}
  {(()=>{
   const okrKey=`okr_${soc.id}`;const stored=JSON.parse(localStorage.getItem(okrKey)||"[]");
   const defaults=[
    {id:"ca",label:"Objectif CA mensuel",target:soc.obj||5000,current:ca,unit:"€",icon:"💰"},
    {id:"clients",label:"Nouveaux clients ce mois",target:5,current:(ghlData?.[soc.id]?.opportunities||[]).filter(o=>o.status==="won"&&o.updatedAt&&new Date(o.updatedAt).toISOString().startsWith(curM())).length,unit:"",icon:"🤝"},
    {id:"calls",label:"Appels réalisés ce mois",target:30,current:(ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>e.startTime&&new Date(e.startTime).toISOString().startsWith(curM())).length,unit:"",icon:"📞"},
   ];
   const okrs=defaults.map(d=>{const s=stored.find(x=>x.id===d.id);return{...d,target:s?.target||d.target};});
   return <div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.55s"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>🎯 OBJECTIFS DU MOIS</div>
    {okrs.map((o,i)=>{const pctV=o.target>0?Math.min(100,Math.round(o.current/o.target*100)):0;const done=pctV>=100;
     return <div key={o.id} style={{marginBottom:i<okrs.length-1?10:0}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
       <span style={{fontSize:10,fontWeight:600}}>{o.icon} {o.label}</span>
       <span style={{fontSize:10,fontWeight:800,color:done?C.g:pctV>60?C.acc:C.td}}>{o.current}{o.unit} / {o.target}{o.unit} ({pctV}%)</span>
      </div>
      <div style={{height:6,background:C.brd,borderRadius:3,overflow:"hidden"}}>
       <div style={{height:"100%",width:`${pctV}%`,background:done?`linear-gradient(90deg,${C.g},#34d399)`:`linear-gradient(90deg,${acc2},#FF9D00)`,borderRadius:3,transition:"width .5s"}}/>
      </div>
     </div>;
    })}
   </div>;
  })()}
  {/* 🎯 Objectifs CA mensuel */}
  {(()=>{const goal=soc.obj||0;if(!goal)return null;const pctG=ca>0?Math.round(ca/goal*100):0;const prevGoalPct=prevCa>0&&goal?Math.round(prevCa/goal*100):0;const diff=pctG-prevGoalPct;return <div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.45s"}}>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
    <span style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:.8}}>🎯 OBJECTIF MENSUEL</span>
    {diff!==0&&<span style={{fontSize:10,fontWeight:700,color:diff>0?C.g:C.r}}>{diff>0?"+":""}{diff}% vs mois dernier</span>}
   </div>
   <div style={{display:"flex",alignItems:"center",gap:14}}>
    <div style={{position:"relative",width:72,height:72,flexShrink:0}}>
     <svg width="72" height="72" viewBox="0 0 72 72"><circle cx="36" cy="36" r="30" fill="none" stroke={C.brd} strokeWidth="6"/><circle cx="36" cy="36" r="30" fill="none" stroke="url(#objGrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${Math.min(pctG,100)*1.884} 188.4`} transform="rotate(-90 36 36)" style={{transition:"stroke-dasharray .8s ease"}}/><defs><linearGradient id="objGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFBF00"/><stop offset="100%" stopColor="#FF9D00"/></linearGradient></defs></svg>
     <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:pctG>=100?C.g:C.acc}}>{pctG}%</div>
    </div>
    <div>
     <div style={{fontWeight:900,fontSize:22,color:C.t}}>{fmt(ca)}€ <span style={{fontSize:13,color:C.td,fontWeight:500}}>/ {fmt(goal)}€</span></div>
     <div style={{fontSize:10,color:pctG>=100?C.g:pctG>=60?C.acc:C.td,fontWeight:600,marginTop:2}}>{pctG>=100?"🎉 Objectif atteint !":pctG>=75?"Presque ! Continue comme ça":"En progression..."}</div>
    </div>
   </div>
   <div style={{marginTop:10,height:8,background:C.brd,borderRadius:4,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${Math.min(pctG,100)}%`,background:"linear-gradient(90deg,#FFBF00,#FF9D00)",borderRadius:4,transition:"width .8s ease"}}/>
   </div>
  </div>;})()}
  {/* Quick Actions */}
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:12,marginBottom:20}}>
   {[{icon:"👥",title:"Clients",sub:"Portefeuille",tab:9},{icon:"🏦",title:"Banque",sub:"Transactions",tab:5},{icon:"⚙️",title:"Paramètres",sub:"Configurer",tab:12}].map((a,i)=>
    <div key={i} className="fade-up glass-card" onClick={()=>setPTab(a.tab)} style={{padding:18,cursor:"pointer",textAlign:"center",animationDelay:`${0.5+i*0.1}s`}}>
     <div style={{fontSize:24,marginBottom:6}}>{a.icon}</div>
     <div style={{fontWeight:700,fontSize:12,color:C.t}}>{a.title}</div>
     <div style={{fontSize:10,color:C.td,marginTop:2}}>{a.sub}</div>
    </div>
   )}
  </div>
  {/* Recent transactions */}
  {recentTx.length>0&&<div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.8s"}}>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
    <span style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:.8}}>DERNIÈRES TRANSACTIONS</span>
    <span onClick={()=>setPTab(5)} style={{color:acc2,fontSize:10,fontWeight:600,cursor:"pointer"}}>Voir tout →</span>
   </div>
   {recentTx.map((tx,i)=>{const leg=tx.legs?.[0];if(!leg)return null;const isIn=leg.amount>0;const cat=categorizeTransaction(tx);
    const catColors={"revenus":C.g,"loyer":"#f59e0b","pub":"#ec4899","abonnements":C.b,"equipe":C.o,"transfert":"#6366f1","dividendes":"#7c3aed","autres":C.td};
    return <div key={tx.id||i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<recentTx.length-1?`1px solid ${C.brd}`:"none"}}>
     <span style={{width:22,height:22,borderRadius:6,background:isIn?C.gD:C.rD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:isIn?C.g:C.r,flexShrink:0}}>{cat.icon||"↑"}</span>
     <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontWeight:600,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{leg.description||tx.reference||"—"}</span><span style={{fontSize:8,padding:"1px 5px",borderRadius:8,background:(catColors[cat.id]||C.td)+"22",color:catColors[cat.id]||C.td,fontWeight:600,flexShrink:0}}>{cat.label}</span></div>
      <div style={{fontSize:9,color:C.td}}>{new Date(tx.created_at).toLocaleDateString("fr-FR")}</div>
     </div>
     <span style={{fontWeight:700,fontSize:11,color:isIn?C.g:C.r}}>{isIn?"+":""}{fmt(leg.amount)}€</span>
    </div>;
   })}
  </div>}
  {/* Pipeline snapshot */}
  {ghlStats&&<div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.9s"}}>
   <div style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:.8,marginBottom:10}}>PIPELINE</div>
   <div style={{display:"flex",gap:12,marginBottom:12}}>
    <div><div style={{fontSize:20,fontWeight:900,color:acc2}}>{fmt(ghlStats.pipelineValue)}€</div><div style={{fontSize:9,color:C.td}}>Valeur pipeline</div></div>
    <div><div style={{fontSize:20,fontWeight:900,color:C.b}}>{ghlStats.openDeals}</div><div style={{fontSize:9,color:C.td}}>Deals actifs</div></div>
    <div><div style={{fontSize:20,fontWeight:900,color:C.g}}>{ghlStats.wonDeals}</div><div style={{fontSize:9,color:C.td}}>Gagnés</div></div>
   </div>
   {ghlStages.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
    {ghlStages.map((stage,i)=>{const count=ghlOpps.filter(o=>o.stage===stage).length;
     return <span key={i} style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:600,background:GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]+"22",color:GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length],border:`1px solid ${GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]}33`}}>{stage}: {count}</span>;
    })}
   </div>}
  </div>}
  {/* Top Clients */}
  {(()=>{
   const ghlCl=ghlData?.[soc.id]?.ghlClients||[];
   const allCl=[...(clients||[]).filter(c=>c.socId===soc.id),...ghlCl.filter(gc=>!(clients||[]).some(c=>c.ghlId===(gc.ghlId||gc.id)))];
   const withRevenue=allCl.map(c=>({...c,revenue:clientMonthlyRevenue(c)})).filter(c=>c.revenue>0).sort((a,b)=>b.revenue-a.revenue).slice(0,5);
   const wonOpps=(ghlData?.[soc.id]?.opportunities||[]).filter(o=>o.status==="won").sort((a,b)=>(b.value||0)-(a.value||0)).slice(0,5);
   const topList=withRevenue.length>0?withRevenue:wonOpps.map(o=>({name:o.name||o.contact?.name||"—",revenue:o.value||0,status:"active"}));
   if(topList.length===0)return null;
   return <div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"1s"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
     <span style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:.8}}>🏅 TOP CLIENTS</span>
     <span onClick={()=>setPTab(9)} style={{color:acc2,fontSize:10,fontWeight:600,cursor:"pointer"}}>Voir tous →</span>
    </div>
    {topList.map((c,i)=><div key={c.id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<topList.length-1?`1px solid ${C.brd}`:"none"}}>
     <span style={{width:24,height:24,borderRadius:8,background:i===0?"linear-gradient(135deg,#FFBF00,#FF9D00)":i===1?"linear-gradient(135deg,#c0c0c0,#a0a0a0)":i===2?"linear-gradient(135deg,#cd7f32,#a0622e)":C.card2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:i<3?"#0a0a0f":C.td,flexShrink:0}}>{i+1}</span>
     <div style={{flex:1,minWidth:0}}>
      <div style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name||"—"}</div>
      <div style={{fontSize:9,color:C.td}}>{c.status==="active"?"Client actif":"Prospect"}</div>
     </div>
     <div style={{textAlign:"right"}}>
      <div style={{fontWeight:800,fontSize:13,color:acc2}}>{fmt(c.revenue)}€</div>
      <div style={{fontSize:8,color:C.td}}>/mois</div>
     </div>
    </div>)}
   </div>;
  })()}

  {/* ===== 🧠 ORACLE — Prédictions IA ===== */}
  {(()=>{
   const oraclePredictions=useMemo(()=>{
    const preds=[];const gd=ghlData?.[soc.id];const excl=EXCLUDED_ACCOUNTS[soc.id]||[];const now=Date.now();
    // 1. Churn prediction per active client
    myClients.forEach(cl=>{
     let risk=0;
     const cn=(cl.name||"").toLowerCase().trim();
     // Days since last payment
     const lastPay=(bankData?.transactions||[]).filter(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;if(excl.includes(leg.account_id))return false;return(leg.description||tx.reference||"").toLowerCase().includes(cn);}).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
     const daysSincePay=lastPay?Math.round((now-new Date(lastPay.created_at).getTime())/864e5):999;
     if(daysSincePay>45)risk+=40;
     // Days since last call
     const calEvts=gd?.calendarEvents||[];
     const lastCall=calEvts.filter(e=>(e.contactName||e.title||"").toLowerCase().includes(cn)).sort((a,b)=>new Date(b.startTime)-new Date(a.startTime))[0];
     const daysSinceCall=lastCall?Math.round((now-new Date(lastCall.startTime).getTime())/864e5):999;
     if(daysSinceCall>30)risk+=30;
     // Contract ending <60d
     const end=commitmentEnd(cl);if(end&&(end.getTime()-now)<60*864e5&&(end.getTime()-now)>0)risk+=30;
     if(risk>60)preds.push({type:"churn",icon:"⚠️",text:`${cl.name||"Client"} risque de partir — Confiance: ${Math.min(risk,100)}%`,confidence:Math.min(risk,100),action:"Planifier un appel",actionTab:9,priority:risk});
    });
    // 2. CA prediction (last 3 months trend)
    const months3=[];let m3=cm;for(let i=0;i<3;i++){months3.unshift(m3);m3=prevM(m3);}
    const cas3=months3.map(mo=>pf(gr(reps,soc.id,mo)?.ca));
    if(cas3.filter(v=>v>0).length>=2){
     const avg3=cas3.reduce((a,v)=>a+v,0)/cas3.length;
     const trend3=cas3.length>=2&&cas3[0]>0?(cas3[cas3.length-1]-cas3[0])/cas3[0]:0;
     const predicted=Math.round(cas3[cas3.length-1]*(1+trend3/2));
     const margin3=Math.round(Math.abs(trend3)*50+10);
     preds.push({type:"ca",icon:"📈",text:`CA prévu le mois prochain: ${fmt(predicted)}€ (±${margin3}%)`,confidence:Math.max(30,Math.min(85,70-Math.abs(margin3))),action:"Voir les détails",actionTab:0,priority:80});
    }
    // 3. Pipeline prediction
    const pipeVal=(gd?.opportunities||[]).filter(o=>o.status==="open").reduce((a,o)=>a+(o.value||0),0);
    const totalOpps=(gd?.opportunities||[]).length;const wonOpps2=(gd?.opportunities||[]).filter(o=>o.status==="won").length;
    const convR2=totalOpps>0?wonOpps2/totalOpps:0.2;
    if(pipeVal>0){
     const expected=Math.round(pipeVal*convR2);
     preds.push({type:"pipeline",icon:"🎯",text:`${fmt(pipeVal)}€ de deals en cours → ~${fmt(expected)}€ de CA attendu`,confidence:Math.round(convR2*100),action:"Voir pipeline",actionTab:2,priority:70});
    }
    // 4. CPL trend
    const cplMonths=[];let cm2=cm;for(let i=0;i<3;i++){cplMonths.unshift(cm2);cm2=prevM(cm2);}
    const cpls=cplMonths.map(mo=>{try{const raw=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${mo}`));return raw?.cpl||0;}catch{return 0;}});
    if(cpls.filter(v=>v>0).length>=2&&cpls[cpls.length-1]>cpls[0]&&cpls[0]>0){
     preds.push({type:"cpl",icon:"📣",text:`Ton CPL augmente — passe de ${fmt(cpls[0])}€ à ${fmt(cpls[cpls.length-1])}€. Optimise tes audiences`,confidence:75,action:"Voir Pub",actionTab:3,priority:65});
    }
    return preds.sort((a,b)=>b.priority-a.priority).slice(0,4);
   },[myClients,bankData,ghlData,soc.id,reps,cm]);
   if(oraclePredictions.length===0)return null;
   return <div className="fade-up" style={{marginBottom:20,animationDelay:"1.05s"}}>
    <div style={{padding:3,borderRadius:18,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)"}}>
     <div className="glass-card-static" style={{padding:20,borderRadius:15}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
       <span style={{fontSize:10,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",color:"#fff",padding:"2px 8px",borderRadius:10,fontWeight:800}}>🧠</span>
       <span style={{fontSize:11,fontWeight:800,letterSpacing:1,color:C.t,fontFamily:FONT_TITLE}}>ORACLE — PRÉDICTIONS IA</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
       {oraclePredictions.map((p,i)=><div key={i} className="fu" style={{padding:14,background:"rgba(99,102,241,.06)",border:"1px solid rgba(99,102,241,.15)",borderRadius:12,animationDelay:`${1.1+i*0.08}s`}}>
        <div style={{fontSize:20,marginBottom:6}}>{p.icon}</div>
        <div style={{fontSize:11,fontWeight:600,color:C.t,marginBottom:8,lineHeight:1.4}}>{p.text}</div>
        <div style={{marginBottom:8}}>
         <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:8,color:C.td}}>Confiance</span><span style={{fontSize:8,fontWeight:700,color:p.confidence>70?C.g:p.confidence>40?C.o:C.r}}>{p.confidence}%</span></div>
         <div style={{height:4,background:C.brd,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${p.confidence}%`,background:p.confidence>70?C.g:p.confidence>40?C.o:C.r,borderRadius:2,transition:"width .5s"}}/></div>
        </div>
        <button onClick={()=>setPTab(p.actionTab||0)} style={{width:"100%",padding:"5px 0",borderRadius:8,border:`1px solid rgba(99,102,241,.25)`,background:"rgba(99,102,241,.08)",color:"#818cf8",fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>{p.action}</button>
       </div>)}
      </div>
     </div>
    </div>
   </div>;
  })()}

  {/* ===== 📊 SCORE ECS™ (0-1000) ===== */}
  {(()=>{
   const ecsScore=useMemo(()=>{
    const gd=ghlData?.[soc.id];const excl=EXCLUDED_ACCOUNTS[soc.id]||[];const now=Date.now();
    // Payment regularity (0-200)
    const months6=[];let m6=cm;for(let i=0;i<6;i++){months6.unshift(m6);m6=prevM(m6);}
    let paidMonths=0;
    months6.forEach(mo=>{
     const hasPay=(bankData?.transactions||[]).some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;if(excl.includes(leg.account_id))return false;return(tx.created_at||"").startsWith(mo);});
     if(hasPay)paidMonths++;
    });
    const paymentScore=Math.round(paidMonths/Math.max(months6.length,1)*200);
    // CA growth (0-200)
    const pm2=prevM(cm);const prevCa2=pf(gr(reps,soc.id,pm2)?.ca);
    const growthRate=prevCa2>0?(ca-prevCa2)/prevCa2*100:0;
    const caGrowthScore=growthRate>10?200:growthRate>5?150:growthRate>=0?100:50;
    // Client retention (0-200)
    const churnedCl=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="churned").length;
    const totalCl=myClients.length+churnedCl;
    const churnRate=totalCl>0?churnedCl/totalCl:0;
    const retentionScore=Math.round((1-churnRate)*200);
    // Pipeline health (0-150)
    const pipeVal2=(gd?.opportunities||[]).filter(o=>o.status==="open").reduce((a,o)=>a+(o.value||0),0);
    const ratio=ca>0?pipeVal2/ca:0;
    const pipeScore=ratio>=2&&ratio<=4?150:ratio>4?120:ratio>=1?100:50;
    // Lead responsiveness (0-150)
    const calEvts=gd?.calendarEvents||[];const ghlCl2=gd?.ghlClients||[];
    let totalResp=0,countResp=0;
    ghlCl2.slice(0,20).forEach(lead=>{
     const leadDate=new Date(lead.at||lead.dateAdded||0).getTime();if(!leadDate)return;
     const cn2=(lead.name||"").toLowerCase();
     const firstCall=calEvts.filter(e=>(e.contactName||e.title||"").toLowerCase().includes(cn2)&&new Date(e.startTime).getTime()>leadDate).sort((a,b)=>new Date(a.startTime)-new Date(b.startTime))[0];
     if(firstCall){totalResp+=Math.round((new Date(firstCall.startTime).getTime()-leadDate)/36e5);countResp++;}
    });
    const avgResp=countResp>0?totalResp/countResp:72;
    const respScore=avgResp<24?150:avgResp<48?100:50;
    // Diversification (0-100)
    const uniqueClients=myClients.length;
    const divScore=uniqueClients>10?100:uniqueClients>=5?70:40;
    const total=paymentScore+caGrowthScore+retentionScore+pipeScore+respScore+divScore;
    return{total:clamp(total,0,1000),payment:paymentScore,caGrowth:caGrowthScore,retention:retentionScore,pipeline:pipeScore,responsiveness:respScore,diversification:divScore};
   },[bankData,reps,soc.id,ca,cm,ghlData,myClients,clients]);
   const[displayEcs,setDisplayEcs]=useState(0);
   const[showEcsBreak,setShowEcsBreak]=useState(false);
   useEffect(()=>{let f=0;const t=ecsScore.total;const dur=60;const step=()=>{f++;const p=Math.min(f/dur,1);const e2=1-Math.pow(1-p,3);setDisplayEcs(Math.round(e2*t));if(f<dur)requestAnimationFrame(step);};requestAnimationFrame(step);},[ecsScore.total]);
   // Store in Supabase
   useEffect(()=>{sSet(`ecs_score_${soc.id}_${cm}`,{score:ecsScore.total,breakdown:ecsScore,date:new Date().toISOString()}).catch(()=>{});},[ecsScore,soc.id,cm]);
   const ecsColor=ecsScore.total>800?"#34d399":ecsScore.total>600?"#eab308":ecsScore.total>400?"#fb923c":"#f87171";
   const ecsBadge=ecsScore.total>800?"🏆 Elite":ecsScore.total>600?"⭐ Premium":ecsScore.total>400?"📈 Growth":"⚠️ À risque";
   const arcLen=displayEcs/1000*207.3;
   return <div className="fade-up" style={{marginBottom:20,animationDelay:"1.1s"}}>
    <div className="glass-card-static" style={{padding:24,display:"flex",alignItems:"center",gap:24}}>
     <div style={{position:"relative",width:120,height:120,flexShrink:0,cursor:"pointer"}} onClick={()=>setShowEcsBreak(!showEcsBreak)}>
      <svg width="120" height="120" viewBox="0 0 80 80">
       <defs><linearGradient id="ecsGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={ecsColor}/><stop offset="100%" stopColor={ecsScore.total>600?"#FFAA00":ecsColor}/></linearGradient></defs>
       <circle cx="40" cy="40" r="33" fill="none" stroke={C.brd} strokeWidth="5"/>
       <circle cx="40" cy="40" r="33" fill="none" stroke="url(#ecsGrad)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${arcLen} 207.3`} transform="rotate(-90 40 40)" style={{transition:"stroke-dasharray .8s ease"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
       <div style={{fontWeight:900,fontSize:28,color:ecsColor,lineHeight:1}}>{displayEcs}</div>
       <div style={{fontSize:7,fontWeight:700,color:C.td,letterSpacing:.5,marginTop:2}}>Score ECS™</div>
      </div>
     </div>
     <div style={{flex:1}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
       <span style={{fontSize:14}}>{ecsBadge.split(" ")[0]}</span>
       <span style={{fontWeight:900,fontSize:16,color:ecsColor}}>{ecsBadge.split(" ").slice(1).join(" ")}</span>
      </div>
      <div style={{fontSize:10,color:C.td,marginBottom:8}}>Score propriétaire basé sur 6 critères de performance</div>
      {showEcsBreak&&<div className="slide-down" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
       {[{l:"Paiements",v:ecsScore.payment,m:200},{l:"Croissance CA",v:ecsScore.caGrowth,m:200},{l:"Rétention",v:ecsScore.retention,m:200},{l:"Pipeline",v:ecsScore.pipeline,m:150},{l:"Réactivité",v:ecsScore.responsiveness,m:150},{l:"Diversification",v:ecsScore.diversification,m:100}].map((b,i)=><div key={i} style={{fontSize:9,color:C.td}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span>{b.l}</span><span style={{fontWeight:700,color:b.v/b.m>.7?C.g:b.v/b.m>.4?C.o:C.r}}>{b.v}/{b.m}</span></div>
        <div style={{height:3,background:C.brd,borderRadius:2,marginTop:1}}><div style={{height:"100%",width:`${b.v/b.m*100}%`,background:b.v/b.m>.7?C.g:b.v/b.m>.4?C.o:C.r,borderRadius:2}}/></div>
       </div>)}
      </div>}
     </div>
    </div>
   </div>;
  })()}

  {/* ===== 🏆 QUÊTES & MILESTONES ===== */}
  {(()=>{
   const monthlyCA=ca;const activeClients=myClients.length;
   const churnedCl2=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="churned");
   const lastChurnDate=churnedCl2.length>0?Math.max(...churnedCl2.map(c=>new Date(c.churnDate||c.updatedAt||0).getTime())):0;
   const daysSinceLastChurn=lastChurnDate>0?Math.round((Date.now()-lastChurnDate)/864e5):999;
   const gd4=ghlData?.[soc.id];const cbt4=gd4?.stats?.callsByType||{};
   const strat4=Object.entries(cbt4).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
   const integ4=Object.entries(cbt4).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
   const conversionRate=strat4>0?Math.round(integ4/strat4*100):0;
   // Avg response time
   const calEvts4=gd4?.calendarEvents||[];const ghlCl4=gd4?.ghlClients||[];
   let totResp4=0,cntResp4=0;
   ghlCl4.slice(0,20).forEach(lead=>{const ld=new Date(lead.at||lead.dateAdded||0).getTime();if(!ld)return;const cn4=(lead.name||"").toLowerCase();const fc=calEvts4.filter(e=>(e.contactName||e.title||"").toLowerCase().includes(cn4)&&new Date(e.startTime).getTime()>ld).sort((a,b)=>new Date(a.startTime)-new Date(b.startTime))[0];if(fc){totResp4+=Math.round((new Date(fc.startTime).getTime()-ld)/36e5);cntResp4++;}});
   const avgResponseTime=cntResp4>0?totResp4/cntResp4:72;
   const QUESTS=[
    {id:"first_client",title:"Premier Client",desc:"Signe ton premier client",icon:"🎯",done:activeClients>=1},
    {id:"ca_5k",title:"Cap des 5K€",desc:"Atteins 5,000€ de CA mensuel",icon:"💰",done:monthlyCA>=5000},
    {id:"ca_10k",title:"Cap des 10K€",desc:"Atteins 10,000€ de CA mensuel",icon:"🔥",done:monthlyCA>=10000},
    {id:"no_churn_30",title:"Zéro Churn",desc:"30 jours sans perdre de client",icon:"🛡️",done:daysSinceLastChurn>=30},
    {id:"conversion_15",title:"Machine à Closer",desc:"Taux de conversion >15%",icon:"⚡",done:conversionRate>15},
    {id:"response_fast",title:"Speed Demon",desc:"Réponds aux leads en <24h",icon:"🚀",done:avgResponseTime<24},
    {id:"clients_10",title:"Double Digits",desc:"10 clients actifs",icon:"👥",done:activeClients>=10},
    {id:"ca_50k",title:"Légende",desc:"50,000€ de CA mensuel",icon:"🏆",done:monthlyCA>=50000},
   ];
   // Load/save completed quests
   const[completedQuests,setCompletedQuests]=useState(()=>{try{return JSON.parse(localStorage.getItem(`quests_${soc.id}`)||"{}") }catch{return{};}});
   const[celebrating,setCelebrating]=useState(null);
   useEffect(()=>{
    let changed=false;const nq={...completedQuests};
    QUESTS.forEach(q=>{if(q.done&&!nq[q.id]){nq[q.id]=new Date().toISOString();changed=true;setCelebrating(q.id);}});
    if(changed){setCompletedQuests(nq);try{localStorage.setItem(`quests_${soc.id}`,JSON.stringify(nq));}catch{}sSet(`quests_${soc.id}`,nq).catch(()=>{});}
   },[]);
   useEffect(()=>{if(celebrating){const t=setTimeout(()=>setCelebrating(null),3000);return()=>clearTimeout(t);}},[celebrating]);
   const completed=QUESTS.filter(q=>q.done||completedQuests[q.id]).length;
   const tier=completed>=7?"Légende":completed>=5?"Expert":completed>=3?"Confirmé":"Débutant";
   const tierIcon=completed>=7?"🏆":completed>=5?"⚡":completed>=3?"⭐":"🌱";
   return <div className="fade-up" style={{marginBottom:20,animationDelay:"1.15s"}}>
    <div className="glass-card-static" style={{padding:20}}>
     <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
       <span style={{fontSize:18}}>{tierIcon}</span>
       <div>
        <span style={{fontSize:11,fontWeight:800,letterSpacing:1,color:C.t,fontFamily:FONT_TITLE}}>PROGRESSION</span>
        <div style={{fontSize:9,color:C.acc,fontWeight:700}}>{tier} · {completed}/{QUESTS.length} quêtes</div>
       </div>
      </div>
      <div style={{width:80,height:6,background:C.brd,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${completed/QUESTS.length*100}%`,background:"linear-gradient(90deg,#FFBF00,#FF9D00)",borderRadius:3,transition:"width .5s"}}/></div>
     </div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
      {QUESTS.map((q,i)=>{const isDone=q.done||!!completedQuests[q.id];const isCeleb=celebrating===q.id;
       return <div key={q.id} style={{padding:12,borderRadius:12,background:isDone?"rgba(255,170,0,.08)":"rgba(255,255,255,.02)",border:`1px solid ${isDone?"rgba(255,170,0,.3)":"rgba(255,255,255,.04)"}`,textAlign:"center",opacity:isDone?1:.45,transition:"all .3s",position:"relative",overflow:"hidden",...(isCeleb?{animation:"celebGlow 1s ease infinite",boxShadow:"0 0 30px rgba(255,170,0,.3)"}:{})}}>
        {isCeleb&&<div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>{["🎉","⭐","✨","🔥","💫"].map((e,j)=><span key={j} style={{position:"absolute",fontSize:14,left:`${20+j*15}%`,top:-10,animation:`confetti 2s ease ${j*0.2}s forwards`}}>{e}</span>)}</div>}
        <div style={{fontSize:22,marginBottom:4}}>{q.icon}</div>
        <div style={{fontSize:9,fontWeight:700,color:isDone?C.acc:C.td}}>{q.title}</div>
        <div style={{fontSize:7,color:C.td,marginTop:2}}>{q.desc}</div>
        {isDone&&completedQuests[q.id]&&<div style={{fontSize:7,color:C.g,marginTop:3}}>✓ {new Date(completedQuests[q.id]).toLocaleDateString("fr-FR")}</div>}
       </div>;
      })}
     </div>
    </div>
   </div>;
  })()}

  {/* ===== 🔮 SIMULATEUR DE CROISSANCE ===== */}
  {(()=>{
   const[showSim,setShowSim]=useState(false);
   const[simObj,setSimObj]=useState(50000);
   const[simConv,setSimConv]=useState(null);
   const[simBudget,setSimBudget]=useState(null);
   const[simScenario,setSimScenario]=useState("realiste");
   const gd5=ghlData?.[soc.id];
   const avgBilling=myClients.length>0?myClients.reduce((a,c)=>a+clientMonthlyRevenue(c),0)/myClients.length:2000;
   const cbt5=gd5?.stats?.callsByType||{};
   const strat5=Object.entries(cbt5).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
   const integ5=Object.entries(cbt5).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
   const baseConv=strat5>0?Math.round(integ5/strat5*100):15;
   const actualConv=simConv!==null?simConv:baseConv;
   let cplRaw=0;try{const raw=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${cm}`));cplRaw=raw?.cpl||25;}catch{cplRaw=25;}
   const currentBudget=(()=>{try{const raw=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${cm}`));return raw?.spend||0;}catch{return 0;}})();
   const currentLeadsPerMonth=(gd5?.ghlClients||[]).filter(c=>{const d=new Date(c.at||c.dateAdded||0);return(Date.now()-d.getTime())<30*864e5;}).length||1;
   const scenarioMult=simScenario==="optimiste"?1.2:simScenario==="pessimiste"?0.8:1;
   const clientsNeeded=Math.ceil(simObj/(avgBilling||1));
   const leadsNeeded=actualConv>0?Math.ceil(clientsNeeded/(actualConv/100)*scenarioMult):clientsNeeded*10;
   const budgetNeeded=simBudget!==null?simBudget:Math.round(leadsNeeded*cplRaw);
   const growthRate=prevCa>0?(ca-prevCa)/prevCa:0.1;
   const timeline=growthRate>0?Math.round((simObj-ca)/(ca*growthRate)*10)/10:0;
   const funnel=[
    {icon:"🎯",label:"Objectif",value:`${fmt(simObj)}€/mois`,sub:null,color:C.acc},
    {icon:"👥",label:"Clients nécessaires",value:String(clientsNeeded),sub:`tu en as ${myClients.length}`,color:C.b},
    {icon:"📞",label:"Leads nécessaires",value:`${fmt(leadsNeeded)}/mois`,sub:`tu en reçois ${currentLeadsPerMonth}/mois`,color:C.v},
    {icon:"📣",label:"Budget pub",value:`${fmt(budgetNeeded)}€/mois`,sub:currentBudget>0?`tu dépenses ${fmt(currentBudget)}€`:null,color:"#ec4899"},
    {icon:"⏱️",label:"Timeline estimée",value:timeline>0?`${timeline} mois`:"—",sub:null,color:C.g},
   ];
   return <>
    <button onClick={()=>setShowSim(true)} className="fade-up glass-card" style={{width:"100%",padding:16,marginBottom:20,cursor:"pointer",textAlign:"center",animationDelay:"1.2s",border:`1px solid rgba(139,92,246,.2)`,background:"rgba(139,92,246,.05)"}}>
     <span style={{fontSize:20}}>🔮</span>
     <div style={{fontWeight:800,fontSize:12,color:"#a78bfa",marginTop:4}}>Simuler ma croissance</div>
     <div style={{fontSize:9,color:C.td}}>Calcule tes objectifs et le plan pour y arriver</div>
    </button>
    {showSim&&<div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.7)",backdropFilter:"blur(8px)"}} onClick={e=>{if(e.target===e.currentTarget)setShowSim(false);}}>
     <div className="glass-modal si" style={{width:520,maxHeight:"85vh",overflow:"auto",borderRadius:20,padding:28}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
       <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:24}}>🔮</span><span style={{fontWeight:900,fontSize:16,color:C.t}}>Simulateur de Croissance</span></div>
       <button onClick={()=>setShowSim(false)} style={{background:"none",border:"none",color:C.td,fontSize:18,cursor:"pointer"}}>✕</button>
      </div>
      {/* Objectif slider */}
      <div style={{marginBottom:20}}>
       <label style={{fontSize:10,fontWeight:700,color:C.td,letterSpacing:.5}}>🎯 OBJECTIF CA MENSUEL</label>
       <div style={{display:"flex",alignItems:"center",gap:12,marginTop:6}}>
        <input type="range" min={5000} max={200000} step={1000} value={simObj} onChange={e=>setSimObj(Number(e.target.value))} style={{flex:1}}/>
        <span style={{fontWeight:900,fontSize:18,color:C.acc,minWidth:80,textAlign:"right"}}>{fmt(simObj)}€</span>
       </div>
      </div>
      {/* Conversion rate slider */}
      <div style={{marginBottom:20}}>
       <label style={{fontSize:10,fontWeight:700,color:C.td,letterSpacing:.5}}>📈 TAUX DE CONVERSION (%)</label>
       <div style={{display:"flex",alignItems:"center",gap:12,marginTop:6}}>
        <input type="range" min={1} max={50} step={1} value={actualConv} onChange={e=>setSimConv(Number(e.target.value))} style={{flex:1}}/>
        <span style={{fontWeight:900,fontSize:18,color:C.v,minWidth:40,textAlign:"right"}}>{actualConv}%</span>
       </div>
      </div>
      {/* Scenario selector */}
      <div style={{display:"flex",gap:6,marginBottom:20}}>
       {[{v:"pessimiste",l:"Pessimiste 📉"},{v:"realiste",l:"Réaliste 📊"},{v:"optimiste",l:"Optimiste 🚀"}].map(s=><button key={s.v} onClick={()=>setSimScenario(s.v)} style={{flex:1,padding:"6px 0",borderRadius:10,border:`1px solid ${simScenario===s.v?C.acc+"66":C.brd}`,background:simScenario===s.v?C.accD:"transparent",color:simScenario===s.v?C.acc:C.td,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>{s.l}</button>)}
      </div>
      {/* Funnel */}
      <div style={{display:"flex",flexDirection:"column",gap:0}}>
       {funnel.map((f,i)=>{const w=Math.max(40,100-i*15);
        return <Fragment key={i}>
         {i>0&&<div style={{textAlign:"center",padding:"4px 0",fontSize:12,color:C.td}}>↓</div>}
         <div style={{width:`${w}%`,margin:"0 auto",padding:"14px 16px",background:`${f.color}12`,border:`1px solid ${f.color}33`,borderRadius:12,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>{f.icon}</span>
          <div style={{flex:1}}>
           <div style={{fontSize:9,color:C.td,fontWeight:600}}>{f.label}</div>
           <div style={{fontWeight:900,fontSize:16,color:f.color}}>{f.value}</div>
           {f.sub&&<div style={{fontSize:8,color:C.td}}>({f.sub})</div>}
          </div>
         </div>
        </Fragment>;
       })}
      </div>
     </div>
    </div>}
   </>;
  })()}
 </div>;
}
/* ===== INBOX PANEL ===== */
