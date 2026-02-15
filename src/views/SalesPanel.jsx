import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import * as U from "../utils/index.jsx";
// Destructure commonly used utilities for readability
const { C, C_DARK, C_LIGHT, getTheme, applyTheme, MN, curM, ml, fmt, fK, pct, clamp, prevM, nextM, pf, gr, FONT, FONT_TITLE, BF, deadline, qOf, qMonths, qLabel, ago, uid, curW, MOODS, sinceLbl, sinceMonths, CSS, DS, DH, DEAL_STAGES, DEMO_JOURNAL, DEMO_ACTIONS, DEMO_PULSES, DEMO_DEALS, DEMO_OKRS, DEMO_SYNERGIES, DEMO_SUBS, DEMO_TEAM, DEMO_CLIENTS, SYN_TYPES, SYN_STATUS, SUB_CATS, SLACK_MODES, EXCLUDED_ACCOUNTS, CURR_SYMBOLS, REV_ENVS, GHL_BASE, STRIPE_PROXY, STORE_URL, ErrorBoundary, mkPrefill, autoGenerateReport, autoCategorize, autoDetectSubscriptions, subMonthly, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, generateInvoices, refreshInvoiceStatuses, ghlCreateInvoice, ghlSendInvoice, mkDemoInvoices, teamMonthly, normalizeStr, fuzzyMatch, matchSubsToRevolut, deduplicatedCharges, mkGHLDemo, ghlUpdateContact, ghlCreateContact, fetchGHL, syncGHLForSoc, slackWebhookSend, slackBotSend, slackSend, slackMention, buildPulseSlackMsg, buildReportSlackMsg, buildReminderSlackMsg, buildValidationSlackMsg, checkAndSendReminders, fetchStripe, syncStripeData, getStripeChargesForClient, getStripeTotal, mkRevolutDemo, fetchRevolut, syncRevolut, mkSocRevDemo, syncSocRevolut, revFinancials, storeCall, sbAuthHeaders, sbUpsert, sbGet, sbList, sGet, sSet, syncFromSupabase, fetchHoldingFromSB, fetchSocietiesFromSB, calcH, simH, healthScore, leadScore, leadScoreColor, leadScoreLabel, qCA, getAlerts, buildFeed, project, runway, calcLeaderboard, buildAIContext, calcMilestoneData, calcMilestones, calcSmartAlerts, genInsights, calcBenchmark, getPlaybooks, calcClientHealthScore, genPorteurNotifications, BILL_TYPES, CLIENT_STATUS, curQ, AUTO_CAT_MAP, categorizeTransaction, DEMO_KB } = U;

import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";

export function HealthBadge({score}){
 const color=score>70?C.g:score>=40?C.o:C.r;
 const label=score>70?"Sain":score>=40?"À suivre":"Critique";
 return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:12,background:color+"18",border:`1.5px solid ${color}55`,flexShrink:0}}>
  <span style={{width:8,height:8,borderRadius:4,background:color,boxShadow:`0 0 4px ${color}66`}}/>
  <span style={{fontSize:9,fontWeight:800,color}}>{score}</span>
  <span style={{fontSize:7,color,fontWeight:600}}>{label}</span>
 </span>;
}

/* ===== SALES PANEL ===== */
export function SalesPanel({soc,ghlData,socBankData,clients,reps,setPTab}){
 const cm=curM();const pm2=prevM(cm);
 const gd=ghlData?.[soc.id];const calEvts=gd?.calendarEvents||[];const opps=gd?.opportunities||[];const ghlCl=gd?.ghlClients||[];
 const bankData=socBankData;const myClients=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active");
 const excluded=EXCLUDED_ACCOUNTS[soc.id]||[];
 // Generate 12 months of data
 const now12=new Date();const months12=[];for(let i=11;i>=0;i--){const d=new Date(now12.getFullYear(),now12.getMonth()-i,1);months12.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}
 const getSalesMonth=(mo)=>{
  let metaD=null;try{metaD=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${mo}`));}catch{}
  const spend=metaD?.spend||0;const leads=metaD?.leads||0;
  const moEvts=calEvts.filter(e=>(e.startTime||"").startsWith(mo));
  const stratCalls=moEvts.filter(e=>!/int[eé]g/i.test(e.title||"")&&!/int[eé]g/i.test(e.calendarName||"")).length;
  const integCalls=moEvts.filter(e=>/int[eé]g/i.test(e.title||"")||/int[eé]g/i.test(e.calendarName||"")).length;
  const noShowManual=parseInt(localStorage.getItem(`salesNoShow_${soc.id}_${mo}`)||"0");
  const noShowCal=moEvts.filter(e=>{const st=(e.status||"").toLowerCase();return st.includes("no_show")||st.includes("no-show")||st.includes("cancelled");}).length;
  const noShow=noShowManual||noShowCal;
  const wonMonth=opps.filter(o=>o.status==="won"&&(o.updatedAt||o.createdAt||"").startsWith(mo));
  const wonCount=wonMonth.length;const wonVal=wonMonth.reduce((a,o)=>a+(o.value||0),0);
  const totalCalls=stratCalls+integCalls;
  return{mo,spend,leads,totalCalls,stratCalls,integCalls,noShow,wonCount,wonVal,cpl:leads>0?spend/leads:0,cpa:totalCalls>0?spend/totalCalls:0,cpv:wonCount>0?spend/wonCount:0};
 };
 const salesData=months12.map(getSalesMonth);const last6=salesData.slice(-6);
 const cur=salesData[salesData.length-1];
 // Totals
 const totalLeads=ghlCl.length;const totalCallsAll=calEvts.length;
 const stratCallsAll=calEvts.filter(e=>!/int[eé]g/i.test(e.title||"")&&!/int[eé]g/i.test(e.calendarName||"")).length;
 const confirmedCalls=calEvts.filter(e=>(e.status||"").toLowerCase().includes("confirmed")||(e.status||"").toLowerCase().includes("completed")).length;
 const noShowAll=calEvts.filter(e=>{const st=(e.status||"").toLowerCase();return st.includes("no_show")||st.includes("no-show");}).length;
 const wonAll=opps.filter(o=>o.status==="won");const wonValAll=wonAll.reduce((a,o)=>a+(o.value||0),0);
 const activeBillingTotal=myClients.reduce((a,c)=>a+clientMonthlyRevenue(c),0);
 const caContracte=wonValAll+activeBillingTotal;
 const closingRate=stratCallsAll>0?((wonAll.length/stratCallsAll)*100):0;
 const noShowRate=totalCallsAll>0?((noShowAll/totalCallsAll)*100):0;
 const panierMoyen=wonAll.length>0?caContracte/wonAll.length:0;
 // Avg cycle
 const cycleDays=(()=>{let total=0,cnt=0;wonAll.forEach(o=>{const cid=o.contact?.id;const cl=ghlCl.find(c=>c.ghlId===cid);const created=cl?.at||o.createdAt;const won2=o.updatedAt||o.createdAt;if(created&&won2){total+=Math.max(0,Math.round((new Date(won2)-new Date(created))/(864e5)));cnt++;}});return cnt>0?Math.round(total/cnt):0;})();
 // Meta ads spend for cross-ref
 const totalAdSpend=months12.reduce((a,mo)=>{try{const d=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${mo}`));return a+(d?.spend||0);}catch{return a;}},0);
 // Pipeline stages
 const pipelines=gd?.pipelines||[];const stages=pipelines[0]?.stages||[];
 const openOpps=opps.filter(o=>o.status==="open");
 // Charts
 const chartEvol=last6.map(d=>({month:ml(d.mo).split(" ")[0],leads:d.leads,appels:d.totalCalls,ventes:d.wonVal}));
 const chartAcq=last6.map(d=>({month:ml(d.mo).split(" ")[0],cpl:Math.round(d.cpl*100)/100,cpa:Math.round(d.cpa*100)/100,cpv:Math.round(d.cpv*100)/100}));
 const chartCalls=last6.map(d=>({month:ml(d.mo).split(" ")[0],appels:d.totalCalls,noshow:d.noShow}));
 // Pie
 const pieWon=opps.filter(o=>o.status==="won").length;const pieLost=opps.filter(o=>o.status==="lost").length;const pieOpen=opps.filter(o=>o.status==="open").length;
 const pieNoShow=noShowAll;const pieCancelled=calEvts.filter(e=>(e.status||"").toLowerCase()==="cancelled").length;
 const pieData=[{name:"Deal",value:pieWon,color:"#34d399"},{name:"No-show",value:pieNoShow,color:"#f472b6"},{name:"Follow-up",value:pieOpen,color:"#60a5fa"},{name:"Perdu",value:pieLost,color:"#fb923c"},{name:"Annulé",value:pieCancelled,color:"#6b7280"}].filter(d=>d.value>0);
 const pieTotal=pieData.reduce((a,d)=>a+d.value,0);
 // Sources
 const srcMap={};ghlCl.forEach(c=>{const src=c.source||"Inconnu";srcMap[src.trim()||"Inconnu"]=(srcMap[src.trim()||"Inconnu"]||0)+1;});
 const sources=Object.entries(srcMap).sort((a,b)=>b[1]-a[1]);
 const srcColors=["#60a5fa","#FFAA00","#34d399","#fb923c","#a78bfa","#f43f5e","#14b8a6","#ec4899"];
 // Funnel conversion rates by stage
 const funnelStages=stages.length>0?stages:["Lead","Qualifié","Appel","Négociation","Gagné"];
 const funnelCounts=funnelStages.map(st=>{if(st.toLowerCase().includes("gagn")||st.toLowerCase().includes("won"))return wonAll.length;return opps.filter(o=>o.stage===st&&o.status==="open").length+wonAll.filter(o=>o.stage===st).length;});
 // Closer performance
 const closerMap={};calEvts.forEach(e=>{const assignee=e.assignedTo||e.calendarName||"Closer";closerMap[assignee]=(closerMap[assignee]||0)+1;});
 const closers=Object.entries(closerMap).map(([name,calls])=>{const deals=wonAll.filter(o=>{const evts=calEvts.filter(e=>(e.assignedTo||e.calendarName||"")==name&&o.contact&&(e.contactName||"").toLowerCase().includes((o.contact.name||"").toLowerCase().slice(0,5)));return evts.length>0;}).length;const rev=wonAll.filter(o=>{const evts=calEvts.filter(e=>(e.assignedTo||e.calendarName||"")==name&&o.contact&&(e.contactName||"").toLowerCase().includes((o.contact.name||"").toLowerCase().slice(0,5)));return evts.length>0;}).reduce((a,o)=>a+(o.value||0),0);return{name:name.replace(/ - .*$/,"").trim(),calls,deals,convRate:calls>0?Math.round(deals/calls*100):0,revenue:rev};}).sort((a,b)=>b.revenue-a.revenue);
 // Recent activities
 const activities=useMemo(()=>{
  const all=[];
  wonAll.forEach(o=>all.push({icon:"🤝",text:`Deal conclu: ${o.name||o.contact?.name||"—"} — ${fmt(o.value||0)}€`,date:o.updatedAt||o.createdAt}));
  calEvts.slice(-30).forEach(e=>all.push({icon:"📞",text:`Appel: ${e.contactName||e.title||"—"}`,date:e.startTime}));
  ghlCl.filter(c=>new Date(c.at||0).getTime()>Date.now()-30*864e5).forEach(c=>all.push({icon:"👤",text:`Nouveau lead: ${c.name||c.email||"—"}`,date:c.at}));
  return all.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,20);
 },[wonAll,calEvts,ghlCl]);
 // Table averages
 const avgCpl=salesData.filter(d=>d.cpl>0).reduce((a,d)=>a+d.cpl,0)/(salesData.filter(d=>d.cpl>0).length||1);
 const avgCpa=salesData.filter(d=>d.cpa>0).reduce((a,d)=>a+d.cpa,0)/(salesData.filter(d=>d.cpa>0).length||1);
 const avgCpv=salesData.filter(d=>d.cpv>0).reduce((a,d)=>a+d.cpv,0)/(salesData.filter(d=>d.cpv>0).length||1);
 const costCellColor=(val,avg)=>!val||!avg?C.td:val<=avg*0.85?C.g:val>=avg*1.15?C.r:C.t;
 const kpis=[
  {label:"Total Leads",value:String(totalLeads),icon:"🎯",color:"#60a5fa"},
  {label:"Appels réservés",value:String(totalCallsAll),icon:"📅",color:"#818cf8"},
  {label:"Appels effectués",value:String(confirmedCalls||totalCallsAll),icon:"📞",color:C.b},
  {label:"No-show",value:String(noShowAll),icon:"🚫",color:C.r},
  {label:"Deals conclus",value:String(wonAll.length),icon:"🏆",color:C.g},
  {label:"CA Contracté",value:`${fmt(caContracte)}€`,icon:"💎",color:C.acc},
  {label:"Taux closing",value:`${closingRate.toFixed(1)}%`,icon:"📊",color:closingRate>30?C.g:closingRate>15?C.o:C.r},
  {label:"Taux no-show",value:`${noShowRate.toFixed(1)}%`,icon:"📉",color:noShowRate<15?C.g:noShowRate<30?C.o:C.r},
  {label:"Panier moyen",value:`${fmt(panierMoyen)}€`,icon:"🛒",color:C.v},
  {label:"Cycle moyen",value:cycleDays>0?`${cycleDays}j`:"—",icon:"⏱️",color:C.o},
 ];
 return <div className="fu">
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
   <div><div style={{fontSize:9,fontWeight:700,color:C.acc,letterSpacing:1.5,fontFamily:FONT_TITLE}}>📞 SALES — {soc.nom}</div><div style={{fontSize:11,color:C.td,marginTop:2}}>Données GHL × Meta × Revolut</div></div>
  </div>
  {/* KPIs */}
  <div className="kpi-grid-responsive" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
   {kpis.map((k,i)=><div key={i} className="fade-up glass-card-static kpi-shimmer" style={{padding:16,textAlign:"center",animationDelay:`${i*0.05}s`,position:"relative",overflow:"hidden"}}>
    <div style={{fontSize:18,marginBottom:4}}>{k.icon}</div>
    <div style={{fontWeight:900,fontSize:20,color:k.color,lineHeight:1}}>{k.value}</div>
    <div style={{fontSize:8,fontWeight:700,color:C.td,marginTop:6,letterSpacing:.5,fontFamily:FONT_TITLE}}>{k.label}</div>
   </div>)}
  </div>
  {/* Pipeline Kanban */}
  {stages.length>0&&<div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.2s",overflow:"auto"}}>
   <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>📊 PIPELINE KANBAN</div>
   <div style={{display:"flex",gap:10,minWidth:stages.length*180}}>
    {stages.map((stage,si)=>{const stageOpps=openOpps.filter(o=>o.stage===stage);const stageVal=stageOpps.reduce((a,o)=>a+(o.value||0),0);
     return <div key={si} style={{flex:1,minWidth:160}}>
      <div style={{padding:"8px 10px",borderRadius:"10px 10px 0 0",background:GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]+"22",borderBottom:`2px solid ${GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]}`}}>
       <div style={{fontWeight:800,fontSize:11,color:GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]}}>{stage}</div>
       <div style={{fontSize:9,color:C.td}}>{stageOpps.length} deals · {fmt(stageVal)}€</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:4,padding:"6px 0",maxHeight:300,overflowY:"auto"}}>
       {stageOpps.slice(0,8).map(o=><div key={o.id} style={{padding:"8px 10px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`}}>
        <div style={{fontWeight:600,fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name||o.contact?.name||"—"}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:3}}>
         <span style={{fontSize:9,color:C.td}}>{o.createdAt?new Date(o.createdAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short"}):""}</span>
         <span style={{fontWeight:800,fontSize:10,color:C.acc}}>{o.value>0?`${fmt(o.value)}€`:""}</span>
        </div>
       </div>)}
       {stageOpps.length>8&&<div style={{textAlign:"center",fontSize:9,color:C.td,padding:4}}>+{stageOpps.length-8} autres</div>}
      </div>
     </div>;
    })}
   </div>
  </div>}
  {/* Charts 2-col */}
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
   {/* Evolution leads/appels/ventes */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.25s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📈 LEADS / APPELS / VENTES — 6 MOIS</div>
    <div style={{height:220}}><ResponsiveContainer><ComposedChart data={chartEvol} margin={{top:5,right:10,left:0,bottom:5}}>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis dataKey="month" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis yAxisId="left" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis yAxisId="right" orientation="right" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/>
     <Tooltip content={<CTip/>}/>
     <Bar yAxisId="left" dataKey="leads" fill="#60a5fa" name="Leads" radius={[4,4,0,0]} barSize={14}/>
     <Bar yAxisId="left" dataKey="appels" fill="#818cf8" name="Appels" radius={[4,4,0,0]} barSize={14}/>
     <Line yAxisId="right" type="monotone" dataKey="ventes" stroke={C.g} strokeWidth={2.5} dot={{r:3}} name="CA Ventes (€)"/>
     <Legend wrapperStyle={{fontSize:9}}/>
    </ComposedChart></ResponsiveContainer></div>
   </div>
   {/* Coûts d'acquisition */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.3s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📉 COÛTS D'ACQUISITION</div>
    <div style={{height:220}}><ResponsiveContainer><LineChart data={chartAcq} margin={{top:5,right:10,left:0,bottom:5}}>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis dataKey="month" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}€`}/>
     <Tooltip content={<CTip/>}/>
     <Line type="monotone" dataKey="cpl" stroke="#60a5fa" strokeWidth={2.5} dot={{r:4}} name="CPL"/>
     <Line type="monotone" dataKey="cpa" stroke="#22d3ee" strokeWidth={2.5} dot={{r:4}} name="Coût/appel"/>
     <Line type="monotone" dataKey="cpv" stroke="#eab308" strokeWidth={2.5} dot={{r:4}} name="Coût/closing"/>
     <Legend wrapperStyle={{fontSize:9}}/>
    </LineChart></ResponsiveContainer></div>
   </div>
   {/* Appels vs No-show */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.35s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📊 APPELS VS NO-SHOW</div>
    <div style={{height:220}}><ResponsiveContainer><BarChart data={chartCalls} margin={{top:5,right:10,left:0,bottom:5}}>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis dataKey="month" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} allowDecimals={false}/>
     <Tooltip content={<CTip/>}/>
     <Bar dataKey="appels" fill="#60a5fa" name="Appels" radius={[4,4,0,0]} barSize={20}/>
     <Bar dataKey="noshow" fill="#f472b6" name="No-show" radius={[4,4,0,0]} barSize={20}/>
     <Legend wrapperStyle={{fontSize:9}}/>
    </BarChart></ResponsiveContainer></div>
   </div>
   {/* Résultats appels Pie */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.4s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>🍩 RÉSULTATS DES APPELS</div>
    {pieData.length>0?<div style={{display:"flex",alignItems:"center",height:220}}>
     <div style={{width:"55%",height:200}}><ResponsiveContainer><PieChart><Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} strokeWidth={0} animationDuration={1000}>{pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>
     <div style={{flex:1,paddingLeft:8}}>{pieData.map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}><span style={{width:8,height:8,borderRadius:2,background:d.color,flexShrink:0}}/><span style={{fontSize:10,color:C.td}}>{d.name}</span><span style={{fontWeight:700,fontSize:10,color:C.t,marginLeft:"auto"}}>{d.value} ({pieTotal>0?Math.round(d.value/pieTotal*100):0}%)</span></div>)}</div>
    </div>:<div style={{textAlign:"center",padding:40,color:C.td,fontSize:11}}>Pas de données</div>}
   </div>
   {/* Sources des leads */}
   {sources.length>0&&<div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.45s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📊 SOURCES DES LEADS</div>
    <div style={{height:220}}><ResponsiveContainer><BarChart data={sources.slice(0,8).map(([s,c])=>({source:s,count:c}))} layout="vertical" margin={{top:5,right:10,left:60,bottom:5}}>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis type="number" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} allowDecimals={false}/>
     <YAxis type="category" dataKey="source" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} width={55}/>
     <Tooltip content={<CTip/>}/>
     <Bar dataKey="count" name="Leads" radius={[0,4,4,0]} barSize={16}>{sources.slice(0,8).map((_,i)=><Cell key={i} fill={srcColors[i%srcColors.length]}/>)}</Bar>
    </BarChart></ResponsiveContainer></div>
   </div>}
   {/* Funnel conversion par étape */}
   {funnelStages.length>0&&<div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.5s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📈 CONVERSION PAR ÉTAPE</div>
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
     {funnelStages.map((st,i)=>{const count=i<funnelCounts.length?funnelCounts[i]:0;const maxC=Math.max(1,...funnelCounts);const w=Math.max(20,Math.round(count/maxC*100));const conv=i>0&&funnelCounts[i-1]>0?Math.round(count/funnelCounts[i-1]*100):null;
      return <Fragment key={i}>
       {i>0&&conv!==null&&<div style={{fontSize:9,color:C.td,fontWeight:700,textAlign:"center",padding:"2px 0"}}>↓ <span style={{color:conv>=50?C.g:conv>=25?C.o:C.r,fontWeight:800}}>{conv}%</span></div>}
       <div style={{width:`${w}%`,margin:"0 auto",background:`linear-gradient(135deg,${GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]}18,${GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]}30)`,border:`1px solid ${GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]}55`,borderRadius:8,padding:"8px 12px",textAlign:"center"}}>
        <span style={{fontWeight:900,fontSize:16,color:GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]}}>{count}</span>
        <span style={{fontSize:10,color:C.td,fontWeight:600,marginLeft:6}}>{st}</span>
       </div>
      </Fragment>;
     })}
    </div>
   </div>}
  </div>
  {/* Performance Closer */}
  {closers.length>0&&<div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.55s"}}>
   <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>🏅 PERFORMANCE CLOSER{closers.length>1?"S":""}</div>
   {closers.length>1?<table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
    <thead><tr style={{borderBottom:`2px solid ${C.brd}`}}>
     {["Closer","Appels","Deals","Taux conv.","CA généré"].map((h,i)=><th key={i} style={{padding:"6px",textAlign:i===0?"left":"right",color:C.td,fontWeight:700,fontSize:8,fontFamily:FONT_TITLE}}>{h}</th>)}
    </tr></thead>
    <tbody>{closers.map((cl2,i)=><tr key={i} style={{borderBottom:`1px solid ${C.brd}`}}>
     <td style={{padding:"6px",fontWeight:700,color:i===0?C.acc:C.t}}>{i===0?"🥇 ":i===1?"🥈 ":i===2?"🥉 ":""}{cl2.name}</td>
     <td style={{padding:"6px",textAlign:"right"}}>{cl2.calls}</td>
     <td style={{padding:"6px",textAlign:"right",color:C.g,fontWeight:700}}>{cl2.deals}</td>
     <td style={{padding:"6px",textAlign:"right",color:cl2.convRate>30?C.g:cl2.convRate>15?C.o:C.r,fontWeight:700}}>{cl2.convRate}%</td>
     <td style={{padding:"6px",textAlign:"right",fontWeight:800,color:C.acc}}>{fmt(cl2.revenue)}€</td>
    </tr>)}</tbody>
   </table>:<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
    {[{l:"Appels ce mois",v:String(cur.totalCalls),c:C.b},{l:"Deals conclus",v:String(cur.wonCount),c:C.g},{l:"Taux conversion",v:`${cur.stratCalls>0?Math.round(cur.wonCount/cur.stratCalls*100):0}%`,c:C.v},{l:"CA généré",v:`${fmt(cur.wonVal)}€`,c:C.acc}].map((s,i)=>
     <div key={i} style={{textAlign:"center",padding:12,background:s.c+"10",borderRadius:10,border:`1px solid ${s.c}22`}}>
      <div style={{fontWeight:900,fontSize:20,color:s.c}}>{s.v}</div>
      <div style={{fontSize:8,color:C.td,fontWeight:700,marginTop:4,fontFamily:FONT_TITLE}}>{s.l}</div>
     </div>
    )}
   </div>}
  </div>}
  {/* Dernières activités */}
  <div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.6s"}}>
   <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📜 DERNIÈRES ACTIVITÉS SALES</div>
   {activities.length===0?<div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Aucune activité récente</div>:
    activities.map((a,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<activities.length-1?`1px solid ${C.brd}`:"none"}}>
     <span style={{fontSize:14}}>{a.icon}</span>
     <div style={{flex:1,fontSize:11,fontWeight:600,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.text}</div>
     <span style={{fontSize:9,color:C.td,flexShrink:0}}>{a.date?ago(a.date):""}</span>
    </div>)
   }
  </div>
  {/* Cross-referencing */}
  {totalAdSpend>0&&<div className="fade-up glass-card-static" style={{padding:16,marginBottom:20,animationDelay:"0.65s",borderLeft:`3px solid ${C.v}`}}>
   <div style={{fontSize:9,fontWeight:700,color:C.v,letterSpacing:1,marginBottom:6,fontFamily:FONT_TITLE}}>🔗 CROISEMENT DONNÉES</div>
   <div style={{fontSize:11,color:C.t,fontWeight:600}}>Budget pub: {fmt(totalAdSpend)}€ → {totalLeads} leads → {totalCallsAll} appels → {wonAll.length} clients = CPL {totalLeads>0?(totalAdSpend/totalLeads).toFixed(2):"-"}€, CPA {wonAll.length>0?(totalAdSpend/wonAll.length).toFixed(2):"-"}€</div>
  </div>}
  {/* Data Table */}
  <div className="fade-up glass-card-static" style={{padding:18,overflow:"auto",animationDelay:"0.7s"}}>
   <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📋 TABLEAU RÉCAPITULATIF — 12 MOIS</div>
   <table style={{width:"100%",borderCollapse:"collapse",fontSize:10,minWidth:900}}>
    <thead><tr style={{borderBottom:`2px solid ${C.brd}`}}>
     {["Mois","Leads","Appels","No-show","Tx NS","Deals","CA","Panier moy","CPL","Coût/appel","Coût/closing","Tx closing"].map((h,i)=>
      <th key={i} style={{padding:"8px 4px",textAlign:i===0?"left":"right",color:C.td,fontWeight:700,fontSize:7,letterSpacing:.5,fontFamily:FONT_TITLE}}>{h}</th>
     )}
    </tr></thead>
    <tbody>
     {salesData.map((d,i)=>{const nsRate=d.totalCalls>0?Math.round(d.noShow/d.totalCalls*100):0;const clRate=d.stratCalls>0?Math.round(d.wonCount/d.stratCalls*100):0;const pm2=d.wonCount>0?Math.round(d.wonVal/d.wonCount):0;
      return <tr key={d.mo} style={{borderBottom:`1px solid ${C.brd}`,background:i%2===0?"transparent":"rgba(255,255,255,.015)"}}>
       <td style={{padding:"6px 4px",fontWeight:700,color:C.t,fontSize:10}}>{ml(d.mo)}</td>
       <td style={{padding:"6px 4px",textAlign:"right",fontWeight:600}}>{d.leads||"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",fontWeight:600}}>{d.totalCalls||"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",color:d.noShow>0?C.r:C.td,fontWeight:600}}>{d.noShow||"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",color:nsRate>20?C.r:nsRate>10?C.o:C.g,fontWeight:600}}>{nsRate>0?`${nsRate}%`:"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",color:C.g,fontWeight:700}}>{d.wonCount||"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",color:C.g,fontWeight:700}}>{d.wonVal>0?`${fmt(d.wonVal)}€`:"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",fontWeight:600}}>{pm2>0?`${fmt(pm2)}€`:"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",color:costCellColor(d.cpl,avgCpl),fontWeight:600}}>{d.cpl>0?`${d.cpl.toFixed(0)}€`:"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",color:costCellColor(d.cpa,avgCpa),fontWeight:600}}>{d.cpa>0?`${d.cpa.toFixed(0)}€`:"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",color:costCellColor(d.cpv,avgCpv),fontWeight:600}}>{d.cpv>0?`${d.cpv.toFixed(0)}€`:"—"}</td>
       <td style={{padding:"6px 4px",textAlign:"right",color:clRate>30?C.g:clRate>15?C.o:C.r,fontWeight:700}}>{clRate>0?`${clRate}%`:"—"}</td>
      </tr>;
     })}
     <tr style={{borderTop:`2px solid ${C.acc}`,fontWeight:800}}>
      <td style={{padding:"8px 4px",color:C.acc}}>TOTAL</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{salesData.reduce((a,d)=>a+d.leads,0)}</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{salesData.reduce((a,d)=>a+d.totalCalls,0)}</td>
      <td style={{padding:"8px 4px",textAlign:"right",color:C.r}}>{salesData.reduce((a,d)=>a+d.noShow,0)}</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>—</td>
      <td style={{padding:"8px 4px",textAlign:"right",color:C.g}}>{salesData.reduce((a,d)=>a+d.wonCount,0)}</td>
      <td style={{padding:"8px 4px",textAlign:"right",color:C.g}}>{fmt(salesData.reduce((a,d)=>a+d.wonVal,0))}€</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{fmt(panierMoyen)}€</td>
      <td colSpan={4} style={{padding:"8px 4px",textAlign:"center",color:C.td,fontSize:9}}>Moyennes</td>
     </tr>
    </tbody>
   </table>
  </div>
 </div>;
}

/* ===== PUBLICITE PANEL ===== */
export function PublicitePanel({soc,ghlData,socBankData,clients,reps,setPTab}){
 const cm=curM();
 const gd=ghlData?.[soc.id];const opps=gd?.opportunities||[];const calEvts=gd?.calendarEvents||[];const ghlCl=gd?.ghlClients||[];
 const myClients=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active");
 const wonAll=opps.filter(o=>o.status==="won");
 // 12 months of meta ads data
 const now12=new Date();const months12=[];for(let i=11;i>=0;i--){const d=new Date(now12.getFullYear(),now12.getMonth()-i,1);months12.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}
 const getMetaMonth=(mo)=>{
  let raw=null;try{raw=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${mo}`));}catch{}
  const spend=raw?.spend||0,imp=raw?.impressions||0,clk=raw?.clicks||0,lds=raw?.leads||0,rev=raw?.revenue||0;
  const moWon=opps.filter(o=>o.status==="won"&&(o.updatedAt||o.createdAt||"").startsWith(mo));
  const wonVal=moWon.reduce((a,o)=>a+(o.value||0),0);const wonCount=moWon.length;
  return{mo,spend,impressions:imp,clicks:clk,leads:lds,revenue:rev||wonVal,
   cpl:lds>0?spend/lds:0,cpc:clk>0?spend/clk:0,cpm:imp>0?(spend/imp)*1000:0,
   ctr:imp>0?(clk/imp)*100:0,roas:spend>0?(rev||wonVal)/spend:0,
   cpa:wonCount>0?spend/wonCount:0,wonCount,wonVal};
 };
 const metaData=months12.map(getMetaMonth);const last6=metaData.slice(-6);
 // Totals
 const totSpend=metaData.reduce((a,d)=>a+d.spend,0);const totImp=metaData.reduce((a,d)=>a+d.impressions,0);
 const totClk=metaData.reduce((a,d)=>a+d.clicks,0);const totLeads=metaData.reduce((a,d)=>a+d.leads,0);
 const totRev=metaData.reduce((a,d)=>a+d.revenue,0);
 const totCtr=totImp>0?(totClk/totImp)*100:0;const totCpm=totImp>0?(totSpend/totImp)*1000:0;
 const totCpc=totClk>0?totSpend/totClk:0;const totCpl=totLeads>0?totSpend/totLeads:0;
 const totRoas=totSpend>0?totRev/totSpend:0;
 const totWon=metaData.reduce((a,d)=>a+d.wonCount,0);const totCpa=totWon>0?totSpend/totWon:0;
 const hasData=metaData.some(d=>d.spend>0);
 // Benchmarks
 const[benchmarks]=useState(()=>{try{return JSON.parse(localStorage.getItem(`benchmarks_${soc.id}`)||'{"cpl":20,"cpc":1.5,"ctr":1.5}');}catch{return{cpl:20,cpc:1.5,ctr:1.5};}});
 // Funnel
 const stratCallsAll=calEvts.filter(e=>!/int[eé]g/i.test(e.title||"")&&!/int[eé]g/i.test(e.calendarName||"")).length;
 let landingVisitors=totClk;try{months12.forEach(mo=>{const lv=localStorage.getItem(`metaLanding_${soc.id}_${mo}`);if(lv)landingVisitors+=parseInt(lv)||0;});}catch{}
 const funnelSteps=[
  {label:"Impressions",count:totImp,color:"#60a5fa"},
  {label:"Clics",count:totClk,color:"#818cf8"},
  {label:"Landing page",count:landingVisitors||totClk,color:"#a78bfa"},
  {label:"Leads",count:totLeads,color:"#FFAA00"},
  {label:"MQL / Appels",count:stratCallsAll,color:"#fb923c"},
  {label:"Clients",count:wonAll.length,color:"#34d399"},
 ];
 const kpis=[
  {label:"Budget dépensé",value:`${fmt(totSpend)}€`,icon:"💰",color:"#f472b6"},
  {label:"Impressions",value:fK(totImp),icon:"👁️",color:"#60a5fa"},
  {label:"Clics",value:fK(totClk),icon:"👆",color:"#818cf8"},
  {label:"CTR",value:`${totCtr.toFixed(2)}%`,icon:"📊",color:totCtr>1.5?C.g:totCtr>0.8?C.o:C.r},
  {label:"CPM",value:`${totCpm.toFixed(2)}€`,icon:"📡",color:C.o},
  {label:"CPC",value:`${totCpc.toFixed(2)}€`,icon:"🖱️",color:totCpc<benchmarks.cpc?C.g:C.r},
  {label:"Leads",value:String(totLeads),icon:"🎯",color:"#fb923c"},
  {label:"CPL",value:`${totCpl.toFixed(2)}€`,icon:"💎",color:totCpl<benchmarks.cpl?C.g:C.r},
  {label:"ROAS",value:`${totRoas.toFixed(2)}x`,icon:"📈",color:totRoas>=2?C.g:totRoas>=1?C.o:C.r},
  {label:"CPA",value:totCpa>0?`${totCpa.toFixed(2)}€`:"—",icon:"🏆",color:C.v},
 ];
 // Charts
 const chartBudget=last6.map(d=>({month:ml(d.mo).split(" ")[0],budget:d.spend,leads:d.leads,revenue:d.revenue}));
 const chartCosts=last6.map(d=>({month:ml(d.mo).split(" ")[0],cpl:Math.round(d.cpl*100)/100,cpc:Math.round(d.cpc*100)/100,cpm:Math.round(d.cpm*100)/100}));
 const chartArea=last6.map(d=>({month:ml(d.mo).split(" ")[0],impressions:d.impressions,clics:d.clicks,leads:d.leads}));
 const chartRoas=last6.map(d=>({month:ml(d.mo).split(" ")[0],roas:Math.round(d.roas*100)/100,seuil:1}));
 const chartCtr=last6.map(d=>({month:ml(d.mo).split(" ")[0],ctr:Math.round(d.ctr*100)/100}));
 // Pie budget by month
 const pieMonths=last6.filter(d=>d.spend>0).map(d=>({name:ml(d.mo),value:Math.round(d.spend)}));
 const PIE_COLORS=["#f472b6","#60a5fa","#FFAA00","#34d399","#a78bfa","#fb923c"];
 // ROI calculator
 const roasDisplay=totRoas;
 const avgLeadsPerMonth=totLeads/(metaData.filter(d=>d.spend>0).length||1);
 const avgClientsPerMonth=totWon/(metaData.filter(d=>d.spend>0).length||1);
 const panierMoyenPub2=totWon>0?totRev/totWon:0;
 const breakEvenLeads=totCpl>0&&avgClientsPerMonth>0&&panierMoyenPub2>0?Math.ceil(totSpend/(panierMoyenPub2*avgClientsPerMonth/avgLeadsPerMonth)):0;
 if(!hasData)return <div className="fu" style={{padding:"40px 0",textAlign:"center"}}>
  <div style={{fontSize:48,marginBottom:12}}>📣</div>
  <div style={{fontWeight:800,fontSize:16,color:C.t,marginBottom:4}}>Publicité Meta</div>
  <div style={{fontSize:12,color:C.td,marginBottom:16}}>Aucune donnée publicitaire — Renseignez vos données Meta Ads dans les Paramètres</div>
  <button onClick={()=>setPTab(12)} style={{padding:"8px 20px",borderRadius:10,border:`1px solid ${C.acc}44`,background:C.accD,color:C.acc,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>⚙️ Aller aux Paramètres</button>
 </div>;
 return <div className="fu">
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
   <div><div style={{fontSize:9,fontWeight:700,color:C.acc,letterSpacing:1.5,fontFamily:FONT_TITLE}}>📣 PUBLICITÉ — {soc.nom}</div><div style={{fontSize:11,color:C.td,marginTop:2}}>Données Meta Ads × GHL</div></div>
   <button onClick={()=>setPTab(12)} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${C.acc}44`,background:C.accD,color:C.acc,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>✏️ Modifier les données</button>
  </div>
  {/* KPIs */}
  <div className="kpi-grid-responsive" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
   {kpis.map((k,i)=><div key={i} className="fade-up glass-card-static kpi-shimmer" style={{padding:16,textAlign:"center",animationDelay:`${i*0.05}s`,position:"relative",overflow:"hidden"}}>
    <div style={{fontSize:18,marginBottom:4}}>{k.icon}</div>
    <div style={{fontWeight:900,fontSize:18,color:k.color,lineHeight:1}}>{k.value}</div>
    <div style={{fontSize:8,fontWeight:700,color:C.td,marginTop:6,letterSpacing:.5,fontFamily:FONT_TITLE}}>{k.label}</div>
   </div>)}
  </div>
  {/* Charts 2-col */}
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
   {/* Budget vs Leads vs Revenue */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.2s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📈 BUDGET VS LEADS VS REVENUE</div>
    <div style={{height:220}}><ResponsiveContainer><ComposedChart data={chartBudget} margin={{top:5,right:10,left:0,bottom:5}}>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis dataKey="month" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis yAxisId="left" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/>
     <YAxis yAxisId="right" orientation="right" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <Tooltip content={<CTip/>}/>
     <Bar yAxisId="left" dataKey="budget" fill="#f472b6" name="Budget (€)" radius={[4,4,0,0]} barSize={16}/>
     <Bar yAxisId="right" dataKey="leads" fill="#fb923c" name="Leads" radius={[4,4,0,0]} barSize={16}/>
     <Line yAxisId="left" type="monotone" dataKey="revenue" stroke={C.g} strokeWidth={2.5} dot={{r:3}} name="Revenue (€)"/>
     <Legend wrapperStyle={{fontSize:9}}/>
    </ComposedChart></ResponsiveContainer></div>
   </div>
   {/* Evolution CPL/CPC/CPM */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.25s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📉 ÉVOLUTION CPL / CPC / CPM</div>
    <div style={{height:220}}><ResponsiveContainer><LineChart data={chartCosts} margin={{top:5,right:10,left:0,bottom:5}}>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis dataKey="month" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}€`}/>
     <Tooltip content={<CTip/>}/>
     <Line type="monotone" dataKey="cpl" stroke="#60a5fa" strokeWidth={2.5} dot={{r:4}} name="CPL"/>
     <Line type="monotone" dataKey="cpc" stroke="#22d3ee" strokeWidth={2.5} dot={{r:4}} name="CPC"/>
     <Line type="monotone" dataKey="cpm" stroke="#eab308" strokeWidth={2.5} dot={{r:4}} name="CPM"/>
     <Legend wrapperStyle={{fontSize:9}}/>
    </LineChart></ResponsiveContainer></div>
   </div>
   {/* Impressions vs Clics vs Leads (Area) */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.3s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📊 IMPRESSIONS / CLICS / LEADS</div>
    <div style={{height:220}}><ResponsiveContainer><AreaChart data={chartArea} margin={{top:5,right:10,left:0,bottom:5}}>
     <defs>
      <linearGradient id="gImp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3}/><stop offset="100%" stopColor="#60a5fa" stopOpacity={0.02}/></linearGradient>
      <linearGradient id="gClk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity={0.3}/><stop offset="100%" stopColor="#818cf8" stopOpacity={0.02}/></linearGradient>
     </defs>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis dataKey="month" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>fK(v)}/>
     <Tooltip content={<CTip/>}/>
     <Area type="monotone" dataKey="impressions" stroke="#60a5fa" fill="url(#gImp)" name="Impressions" stackId="1"/>
     <Area type="monotone" dataKey="clics" stroke="#818cf8" fill="url(#gClk)" name="Clics" stackId="2"/>
     <Area type="monotone" dataKey="leads" stroke="#FFAA00" fill="rgba(255,170,0,.1)" name="Leads" stackId="3"/>
     <Legend wrapperStyle={{fontSize:9}}/>
    </AreaChart></ResponsiveContainer></div>
   </div>
   {/* Budget répartition Pie */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.35s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>🍩 RÉPARTITION BUDGET PAR MOIS</div>
    {pieMonths.length>0?<div style={{display:"flex",alignItems:"center",height:220}}>
     <div style={{width:"55%",height:200}}><ResponsiveContainer><PieChart><Pie data={pieMonths} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} strokeWidth={0} animationDuration={1000}>{pieMonths.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>
     <div style={{flex:1,paddingLeft:8}}>{pieMonths.map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}><span style={{width:8,height:8,borderRadius:2,background:PIE_COLORS[i%PIE_COLORS.length],flexShrink:0}}/><span style={{flex:1,fontSize:9,color:C.td}}>{d.name}</span><span style={{fontWeight:700,fontSize:9,color:C.t}}>{fmt(d.value)}€</span></div>)}</div>
    </div>:<div style={{textAlign:"center",padding:40,color:C.td,fontSize:11}}>Pas de données</div>}
   </div>
   {/* ROAS evolution */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.4s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📈 ÉVOLUTION ROAS</div>
    <div style={{height:220}}><ResponsiveContainer><LineChart data={chartRoas} margin={{top:5,right:10,left:0,bottom:5}}>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis dataKey="month" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}x`}/>
     <Tooltip content={<CTip/>}/>
     <Line type="monotone" dataKey="seuil" stroke={C.r} strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Seuil (1x)"/>
     <Line type="monotone" dataKey="roas" stroke={C.g} strokeWidth={2.5} dot={{r:4}} name="ROAS"/>
     <Legend wrapperStyle={{fontSize:9}}/>
    </LineChart></ResponsiveContainer></div>
   </div>
   {/* CTR evolution */}
   <div className="fade-up glass-card-static" style={{padding:18,animationDelay:"0.45s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📊 ÉVOLUTION CTR</div>
    <div style={{height:220}}><ResponsiveContainer><BarChart data={chartCtr} margin={{top:5,right:10,left:0,bottom:5}}>
     <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
     <XAxis dataKey="month" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
     <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
     <Tooltip content={<CTip/>}/>
     <Bar dataKey="ctr" fill="#818cf8" name="CTR (%)" radius={[4,4,0,0]} barSize={24}/>
     <Legend wrapperStyle={{fontSize:9}}/>
    </BarChart></ResponsiveContainer></div>
   </div>
  </div>
  {/* Funnel publicitaire */}
  <div className="fade-up glass-card-static" style={{padding:22,marginBottom:20,animationDelay:"0.5s"}}>
   <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>🔄 FUNNEL PUBLICITAIRE</div>
   <div style={{display:"flex",flexDirection:"column",gap:0}}>
    {funnelSteps.map((f,i)=>{const maxCount=Math.max(1,...funnelSteps.map(s=>s.count));const w=Math.max(15,Math.round(f.count/maxCount*100));const conv=i>0&&funnelSteps[i-1].count>0?((f.count/funnelSteps[i-1].count)*100).toFixed(1):null;const costPer=totSpend>0&&f.count>0?(totSpend/f.count).toFixed(2):null;
     return <Fragment key={i}>
      {i>0&&conv&&<div style={{fontSize:9,color:C.td,fontWeight:700,textAlign:"center",padding:"3px 0"}}>↓ {conv}%{costPer&&<span style={{marginLeft:6,color:C.acc,fontSize:8}}>({costPer}€/unité)</span>}</div>}
      <div style={{width:`${w}%`,margin:"0 auto",background:`linear-gradient(135deg,${f.color}22,${f.color}11)`,border:`1px solid ${f.color}44`,borderRadius:10,padding:"12px 14px",textAlign:"center"}}>
       <span style={{fontWeight:900,fontSize:20,color:f.color}}>{f.count>1000?fK(f.count):f.count}</span>
       <span style={{fontSize:10,color:C.td,fontWeight:600,marginLeft:8}}>{f.label}</span>
      </div>
     </Fragment>;
    })}
   </div>
  </div>
  {/* ROI Calculator + Benchmarks */}
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
   <div className="fade-up glass-card-static" style={{padding:22,animationDelay:"0.55s",borderLeft:`3px solid ${totRoas>=1?C.g:C.r}`}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>💰 ROI CALCULATOR</div>
    <div style={{textAlign:"center",marginBottom:12}}>
     <div style={{fontSize:12,color:C.td,marginBottom:4}}>Pour 1€ dépensé →</div>
     <div style={{fontWeight:900,fontSize:40,color:totRoas>=2?C.g:totRoas>=1?C.o:C.r,lineHeight:1}}>{roasDisplay.toFixed(2)}€</div>
     <div style={{fontSize:10,color:totRoas>=1?C.g:C.r,fontWeight:600,marginTop:4}}>{totRoas>=1?"✅ Rentable":"⚠️ Non rentable"}</div>
    </div>
    {avgLeadsPerMonth>0&&<div style={{fontSize:10,color:C.td,borderTop:`1px solid ${C.brd}`,paddingTop:8}}>
     <div>📊 ~{Math.round(avgLeadsPerMonth)} leads/mois en moyenne</div>
     <div>👥 ~{avgClientsPerMonth.toFixed(1)} clients/mois</div>
     {panierMoyenPub2>0&&<div>🛒 Panier moyen: {fmt(panierMoyenPub2)}€</div>}
     {totSpend>0&&<div style={{marginTop:6,fontWeight:600,color:C.acc}}>💡 Si budget ×2 → ~{Math.round(avgLeadsPerMonth*2)} leads, ~{Math.round(avgClientsPerMonth*2)} clients</div>}
    </div>}
   </div>
   <div className="fade-up glass-card-static" style={{padding:22,animationDelay:"0.6s"}}>
    <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📊 BENCHMARKS SECTEUR</div>
    {[{l:"CPL moyen",v:`${benchmarks.cpl}€`,yours:`${totCpl.toFixed(2)}€`,ok:totCpl<=benchmarks.cpl},{l:"CPC moyen",v:`${benchmarks.cpc}€`,yours:`${totCpc.toFixed(2)}€`,ok:totCpc<=benchmarks.cpc},{l:"CTR moyen",v:`${benchmarks.ctr}%`,yours:`${totCtr.toFixed(2)}%`,ok:totCtr>=benchmarks.ctr}].map((b,i)=>
     <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:i<2?`1px solid ${C.brd}`:"none"}}>
      <span style={{fontSize:11,color:C.td}}>{b.l}: <strong style={{color:C.t}}>{b.v}</strong></span>
      <span style={{fontSize:11,fontWeight:700,color:b.ok?C.g:C.r}}>Vous: {b.yours} {b.ok?"✅":"⚠️"}</span>
     </div>
    )}
    <div style={{fontSize:9,color:C.td,marginTop:8}}>Modifiable dans ⚙️ Paramètres</div>
   </div>
  </div>
  {/* Cross-referencing */}
  <div className="fade-up glass-card-static" style={{padding:16,marginBottom:20,animationDelay:"0.65s",borderLeft:`3px solid ${C.v}`}}>
   <div style={{fontSize:9,fontWeight:700,color:C.v,letterSpacing:1,marginBottom:6,fontFamily:FONT_TITLE}}>🔗 CROISEMENT DONNÉES</div>
   <div style={{fontSize:11,color:C.t,fontWeight:600}}>{totLeads} leads générés → {stratCallsAll} appels bookés → {wonAll.length} deals → {fmt(totRev)}€ CA = ROAS {totRoas.toFixed(2)}x</div>
  </div>
  {/* Data Table */}
  <div className="fade-up glass-card-static" style={{padding:18,overflow:"auto",animationDelay:"0.7s"}}>
   <div style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📋 TABLEAU RÉCAPITULATIF — 12 MOIS</div>
   <table style={{width:"100%",borderCollapse:"collapse",fontSize:10,minWidth:900}}>
    <thead><tr style={{borderBottom:`2px solid ${C.brd}`}}>
     {["Mois","Budget","Impressions","Clics","CTR","CPM","CPC","Leads","CPL","Revenue","ROAS","CPA"].map((h,i)=>
      <th key={i} style={{padding:"8px 4px",textAlign:i===0?"left":"right",color:C.td,fontWeight:700,fontSize:7,letterSpacing:.5,fontFamily:FONT_TITLE}}>{h}</th>
     )}
    </tr></thead>
    <tbody>
     {metaData.map((d,i)=><tr key={d.mo} style={{borderBottom:`1px solid ${C.brd}`,background:i%2===0?"transparent":"rgba(255,255,255,.015)"}}>
      <td style={{padding:"6px 4px",fontWeight:700,color:C.t,fontSize:10}}>{ml(d.mo)}</td>
      <td style={{padding:"6px 4px",textAlign:"right",color:"#f472b6",fontWeight:600}}>{d.spend>0?`${fmt(d.spend)}€`:"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right"}}>{d.impressions>0?fK(d.impressions):"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right"}}>{d.clicks>0?String(d.clicks):"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right",color:d.ctr>benchmarks.ctr?C.g:d.ctr>0?C.r:C.td,fontWeight:600}}>{d.ctr>0?`${d.ctr.toFixed(1)}%`:"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right"}}>{d.cpm>0?`${d.cpm.toFixed(0)}€`:"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right",color:d.cpc>0&&d.cpc<=benchmarks.cpc?C.g:d.cpc>0?C.r:C.td,fontWeight:600}}>{d.cpc>0?`${d.cpc.toFixed(2)}€`:"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right",fontWeight:600}}>{d.leads>0?String(d.leads):"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right",color:d.cpl>0&&d.cpl<=benchmarks.cpl?C.g:d.cpl>0?C.r:C.td,fontWeight:600}}>{d.cpl>0?`${d.cpl.toFixed(0)}€`:"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right",color:C.g,fontWeight:700}}>{d.revenue>0?`${fmt(d.revenue)}€`:"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right",color:d.roas>=2?C.g:d.roas>=1?C.o:d.roas>0?C.r:C.td,fontWeight:700}}>{d.roas>0?`${d.roas.toFixed(2)}x`:"—"}</td>
      <td style={{padding:"6px 4px",textAlign:"right"}}>{d.cpa>0?`${d.cpa.toFixed(0)}€`:"—"}</td>
     </tr>)}
     <tr style={{borderTop:`2px solid ${C.acc}`,fontWeight:800}}>
      <td style={{padding:"8px 4px",color:C.acc}}>TOTAL</td>
      <td style={{padding:"8px 4px",textAlign:"right",color:"#f472b6"}}>{fmt(totSpend)}€</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{fK(totImp)}</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{fK(totClk)}</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{totCtr.toFixed(1)}%</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{totCpm.toFixed(0)}€</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{totCpc.toFixed(2)}€</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{totLeads}</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{totCpl.toFixed(0)}€</td>
      <td style={{padding:"8px 4px",textAlign:"right",color:C.g}}>{fmt(totRev)}€</td>
      <td style={{padding:"8px 4px",textAlign:"right",color:totRoas>=1?C.g:C.r}}>{totRoas.toFixed(2)}x</td>
      <td style={{padding:"8px 4px",textAlign:"right"}}>{totCpa>0?`${totCpa.toFixed(0)}€`:"—"}</td>
     </tr>
    </tbody>
   </table>
  </div>
 </div>;
}

