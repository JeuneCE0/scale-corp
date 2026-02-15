import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import {
  BF, BILL_TYPES, C, CLIENT_STATUS, CSS, CURR_SYMBOLS, DEAL_STAGES, EXCLUDED_ACCOUNTS, ErrorBoundary, FONT, FONT_TITLE,
  GHL_STAGES_COLORS, INV_STATUS, KB_CATS, MILESTONE_CATS, MN, MOODS, SLACK_MODES, SUB_CATS, SYN_STATUS, SYN_TYPES, gr,
  TIER_BG, TIER_COLORS, ago, autoDetectSubscriptions, buildAIContext, buildPulseSlackMsg, buildReportSlackMsg, buildValidationSlackMsg,
  calcH, calcMilestones, clamp, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, curM, curW,
  deadline, fK, fetchGHL, fmt, generateInvoices, getAlerts, getStripeChargesForClient, getStripeTotal, getTheme, ghlCreateContact,
  ghlCreateInvoice, ghlSendInvoice, ghlUpdateContact, healthScore, matchSubsToRevolut, ml, nextM, normalizeStr, pct,
  pf, prevM, project, revFinancials, runway, sSet, sbUpsert, simH, sinceLbl, sinceMonths, slackSend, subMonthly, teamMonthly,
  uid, autoCategorize,
} from "../shared.jsx";

import { KPI, PBar, Btn, Sect } from "../components.jsx";

/* GHL CRM TAB */
export function TabCRM({socs,ghlData,onSync}){
 const[selSoc,setSelSoc]=useState("all");
 const actS=socs.filter(s=>s.stat==="active"&&s.id!=="eco");
 const hasData=Object.keys(ghlData).length>0;
 const aggStats=useMemo(()=>{
  const ids=selSoc==="all"?actS.map(s=>s.id):[selSoc];
  let tLeads=0,tOpen=0,tWon=0,tLost=0,pVal=0,wVal=0;
  ids.forEach(id=>{const d=ghlData[id];if(!d)return;const st=d.stats;tLeads+=st.totalLeads;tOpen+=st.openDeals;tWon+=st.wonDeals;tLost+=st.lostDeals;pVal+=st.pipelineValue;wVal+=st.wonValue;});
  return{tLeads,tOpen,tWon,tLost,pVal,wVal,conv:tLeads>0?Math.round(tWon/tLeads*100):0};
 },[ghlData,selSoc,actS]);
 const opps=useMemo(()=>{
  const ids=selSoc==="all"?actS.map(s=>s.id):[selSoc];
  const all=[];ids.forEach(id=>{const d=ghlData[id];if(!d)return;((d.opportunities||[])).forEach(o=>{all.push({...o,socId:id});});});
  return all.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
 },[ghlData,selSoc,actS]);
 const stages=useMemo(()=>{
  const ids=selSoc==="all"?actS.map(s=>s.id):[selSoc];
  const counts={};ids.forEach(id=>{const d=ghlData[id];if(!d)return;((d.opportunities||[])).forEach(o=>{counts[o.stage]=(counts[o.stage]||0)+1;});});
  // Sort by count desc, show top 6 + group the rest into "Autres"
  const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  if(sorted.length<=7)return sorted.map(s=>s[0]);
  const top=sorted.slice(0,6).map(s=>s[0]);
  top.push("Autres");
  return top;
 },[ghlData,selSoc,actS]);
 const otherStages=useMemo(()=>{
  const ids=selSoc==="all"?actS.map(s=>s.id):[selSoc];
  const counts={};ids.forEach(id=>{const d=ghlData[id];if(!d)return;((d.opportunities||[])).forEach(o=>{counts[o.stage]=(counts[o.stage]||0)+1;});});
  const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  if(sorted.length<=7)return new Set();
  return new Set(sorted.slice(6).map(s=>s[0]));
 },[ghlData,selSoc,actS]);
 const sources=useMemo(()=>{
  const ids=selSoc==="all"?actS.map(s=>s.id):[selSoc];
  const m={};ids.forEach(id=>{const d=ghlData[id];if(!d)return;((d.opportunities||[])).forEach(o=>{m[o.source]=(m[o.source]||0)+1;});});
  return Object.entries(m).map(([s,c])=>({source:s,count:c})).sort((a,b)=>b.count-a.count);
 },[ghlData,selSoc,actS]);
 const isDemo=Object.values(ghlData).some(d=>d.isDemo);
 if(!hasData)return <div className="fu" style={{textAlign:"center",padding:50}}>
  <div style={{fontSize:40,marginBottom:10}}>📡</div>
  <div style={{fontWeight:700,fontSize:16,marginBottom:6}}>Connecte tes comptes GHL</div>
  <div style={{color:C.td,fontSize:12,marginBottom:16,maxWidth:350,margin:"0 auto 16px"}}>Ajoute ta clé API GoHighLevel dans les paramètres de chaque société (onglet Sociétés → modifier)</div>
  <Btn onClick={onSync}>Charger les données demo</Btn>
 </div>;
 return <>
  {isDemo&&<div className="fu" style={{background:C.oD,border:`1px solid ${C.o}22`,borderRadius:10,padding:"8px 14px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{color:C.o,fontSize:11,fontWeight:600}}>⚠ Données demo — Ajoute tes clés API GHL pour les vraies données</span><Btn small v="secondary" onClick={onSync}>↻ Sync</Btn></div>}
  <div style={{display:"flex",gap:6,alignItems:"center",marginTop:6,marginBottom:14,flexWrap:"wrap"}}>
   <select value={selSoc} onChange={e=>setSelSoc(e.target.value)} style={{background:C.bg,border:`1px solid ${C.brd}`,borderRadius:8,color:C.t,padding:"8px 12px",fontSize:12,fontFamily:FONT,outline:"none"}}><option value="all">Toutes les sociétés</option>{actS.map(s=><option key={s.id} value={s.id}>{s.nom}</option>)}</select>
   {!isDemo&&<Btn small v="secondary" onClick={onSync}>↻ Sync GHL</Btn>}
   {ghlData[actS[0]?.id]&&<span style={{color:C.tm,fontSize:10}}>Dernière sync: {ago(ghlData[actS[0].id].lastSync)}</span>}
  </div>
  <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
   <KPI label="Leads total" value={String(aggStats.tLeads)} accent={C.b} delay={1}/><KPI label="Pipeline ouvert" value={`${fmt(aggStats.pVal)}€`} accent={C.acc} delay={2}/><KPI label="Deals gagnés" value={`${fmt(aggStats.wVal)}€`} accent={C.g} delay={3}/><KPI label="Conversion" value={`${aggStats.conv}%`} accent={aggStats.conv>=30?C.g:aggStats.conv>=15?C.o:C.r} delay={4}/>
  </div>
  <Sect title="Funnel" sub="Répartition par étape">
   {stages.map((st,i)=>{const stOpps=st==="Autres"?opps.filter(o=>otherStages.has(o.stage)):opps.filter(o=>o.stage===st);const val=stOpps.reduce((a,o)=>a+o.value,0);const w=aggStats.tLeads>0?Math.round(stOpps.length/aggStats.tLeads*100):0;
    return <div key={st} className={`fu d${Math.min(i+1,8)}`} style={{marginBottom:4}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
    <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:8,height:8,borderRadius:2,background:GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]}}/><span style={{fontWeight:600,fontSize:12}}>{st}</span></div>
    <div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{color:C.td,fontSize:11}}>{stOpps.length} deals</span><span style={{fontWeight:700,fontSize:12,color:C.acc}}>{fmt(val)}€</span></div>
    </div>
    <PBar value={w} max={100} color={GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]} h={5}/>
    </div>;
   })}
  </Sect>
  {selSoc==="all"&&<Sect title="Pipeline par société">
   {actS.map((s,i)=>{const d=ghlData[s.id];if(!d)return null;return <div key={s.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3}}>
    <span style={{width:6,height:6,borderRadius:3,background:s.color}}/><span style={{flex:1,fontWeight:700,fontSize:12}}>{s.nom}</span>
    <span style={{fontSize:10,color:C.td}}>{d.stats.totalLeads} leads</span>
    <span style={{fontSize:10,color:C.b}}>{d.stats.openDeals} ouverts</span>
    <span style={{fontSize:10,color:C.g}}>{d.stats.wonDeals} gagnés</span>
    <span style={{fontWeight:700,fontSize:12,color:C.acc}}>{fmt(d.stats.pipelineValue)}€</span>
   </div>;})}
  </Sect>}
  {sources.length>0&&<Sect title="Sources de leads">
   <div className="fu d1" style={{height:160,background:C.card,borderRadius:12,border:`1px solid ${C.brd}`,padding:"14px 6px 6px 0"}}><ResponsiveContainer><BarChart data={sources} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={C.brd}/><XAxis type="number" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="source" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} width={90}/><Tooltip contentStyle={{background:C.card2,border:`1px solid ${C.brd}`,borderRadius:10,fontSize:11}}/><Bar dataKey="count" fill={C.b} radius={[0,3,3,0]} name="Leads"/></BarChart></ResponsiveContainer></div>
  </Sect>}
  <Sect title="Opportunités récentes" sub={`${opps.length} au total`}>
   {opps.slice(0,12).map((o,i)=>{const s=socs.find(x=>x.id===o.socId);
    return <div key={o.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3}}>
    {s&&<span style={{width:5,height:5,borderRadius:3,background:s.color,flexShrink:0}}/>}
    <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name}</div><div style={{fontSize:10,color:C.td}}>{o.stage} · {o.source}</div></div>
    <span style={{fontWeight:700,fontSize:12,color:o.status==="won"?C.g:C.acc}}>{fmt(o.value)}€</span>
    <span style={{fontSize:9,padding:"2px 6px",borderRadius:10,background:o.status==="won"?C.gD:o.status==="lost"?C.rD:C.bD,color:o.status==="won"?C.g:o.status==="lost"?C.r:C.b,fontWeight:600}}>{o.status==="won"?"Gagné":o.status==="lost"?"Perdu":"Ouvert"}</span>
    </div>;
   })}
  </Sect>
 </>;
}
/* PORTEUR VIEW (Rapport/Stats/Actions/Journal/Pulse) */
/* MILESTONES UI */
