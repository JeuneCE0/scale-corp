import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import * as U from "../utils/index.jsx";
// Destructure commonly used utilities for readability
const { C, C_DARK, C_LIGHT, getTheme, applyTheme, MN, curM, ml, fmt, fK, pct, clamp, prevM, nextM, pf, gr, FONT, FONT_TITLE, BF, deadline, qOf, qMonths, qLabel, ago, uid, curW, MOODS, sinceLbl, sinceMonths, CSS, DS, DH, DEAL_STAGES, DEMO_JOURNAL, DEMO_ACTIONS, DEMO_PULSES, DEMO_DEALS, DEMO_OKRS, DEMO_SYNERGIES, DEMO_SUBS, DEMO_TEAM, DEMO_CLIENTS, SYN_TYPES, SYN_STATUS, SUB_CATS, SLACK_MODES, EXCLUDED_ACCOUNTS, CURR_SYMBOLS, REV_ENVS, GHL_BASE, STRIPE_PROXY, STORE_URL, ErrorBoundary, mkPrefill, autoGenerateReport, autoCategorize, autoDetectSubscriptions, subMonthly, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, generateInvoices, refreshInvoiceStatuses, ghlCreateInvoice, ghlSendInvoice, mkDemoInvoices, teamMonthly, normalizeStr, fuzzyMatch, matchSubsToRevolut, deduplicatedCharges, mkGHLDemo, ghlUpdateContact, ghlCreateContact, fetchGHL, syncGHLForSoc, slackWebhookSend, slackBotSend, slackSend, slackMention, buildPulseSlackMsg, buildReportSlackMsg, buildReminderSlackMsg, buildValidationSlackMsg, checkAndSendReminders, fetchStripe, syncStripeData, getStripeChargesForClient, getStripeTotal, mkRevolutDemo, fetchRevolut, syncRevolut, mkSocRevDemo, syncSocRevolut, revFinancials, storeCall, sbAuthHeaders, sbUpsert, sbGet, sbList, sGet, sSet, syncFromSupabase, fetchHoldingFromSB, fetchSocietiesFromSB, calcH, simH, healthScore, leadScore, leadScoreColor, leadScoreLabel, qCA, getAlerts, buildFeed, project, runway, calcLeaderboard, buildAIContext, calcMilestoneData, calcMilestones, calcSmartAlerts, genInsights, calcBenchmark, getPlaybooks, calcClientHealthScore, genPorteurNotifications, BILL_TYPES, CLIENT_STATUS, curQ, AUTO_CAT_MAP, categorizeTransaction, DEMO_KB } = U;

import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";

export function GoalEditor({goals,setGoals,evo}){
 const last=evo.length>0?evo[evo.length-1]:null;
 return <div style={{marginBottom:14}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>🎯 MES OBJECTIFS DU MOIS</div>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
  {DEFAULT_GOALS.map(g=>{
   const goal=goals[g.id]||0;const current=g.id==="marge"?(last?last.margePct:0):g.field&&last?last[g.field]||0:0;
   const progress=goal>0?Math.min(100,Math.round(current/goal*100)):0;
   const hit=goal>0&&current>=goal;
   return <div key={g.id} className="fu" style={{background:C.card,border:`1px solid ${hit?C.g:C.brd}`,borderRadius:10,padding:"10px 12px",transition:"all .2s"}}>
    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
     <span style={{fontSize:12}}>{g.icon}</span>
     <span style={{fontSize:9,color:C.td,fontWeight:600,flex:1}}>{g.label}</span>
     {hit&&<span style={{fontSize:10,color:C.g}}>✓</span>}
    </div>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
     <input value={goal||""} onChange={e=>{const v=parseInt(e.target.value)||0;setGoals(p=>({...p,[g.id]:v}));}} placeholder="Objectif" type="number" style={{width:60,background:C.card2,border:`1px solid ${C.brd}`,borderRadius:5,color:C.t,fontSize:11,padding:"3px 6px",fontFamily:FONT,outline:"none"}}/>
     <span style={{fontSize:8,color:C.td}}>{g.unit}</span>
     <div style={{flex:1,textAlign:"right"}}>
      <span style={{fontSize:12,fontWeight:800,color:hit?C.g:goal>0?C.t:C.td}}>{g.id==="marge"?current+"%":fmt(current)}{g.id!=="marge"&&g.unit?g.unit:""}</span>
     </div>
    </div>
    {goal>0&&<div style={{marginTop:6}}>
     <div style={{height:3,background:C.brd,borderRadius:2,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${progress}%`,background:hit?C.g:progress>60?C.acc:C.o,borderRadius:2,transition:"width .4s"}}/>
     </div>
     <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}><span style={{fontSize:7,color:C.td}}>{progress}%</span></div>
    </div>}
   </div>;
  })}
  </div>
 </div>;
}

/* CELEBRATION OVERLAY */
export function CelebrationOverlay({milestone,onClose}){
 const[show,setShow]=useState(true);
 useEffect(()=>{const t=setTimeout(()=>{setShow(false);setTimeout(onClose,400);},5000);return()=>clearTimeout(t);},[]);
 const colors=["#FFAA00","#34d399","#60a5fa","#a78bfa","#fb923c","#f87171"];
 return <div style={{position:"fixed",inset:0,zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.7)",opacity:show?1:0,transition:"opacity .4s",pointerEvents:"auto"}} onClick={()=>{setShow(false);setTimeout(onClose,400);}}>
  {/* Confetti */}
  {Array.from({length:30}).map((_,i)=><div key={i} style={{position:"fixed",left:`${Math.random()*100}%`,top:-20,width:8+Math.random()*8,height:8+Math.random()*8,background:colors[i%colors.length],borderRadius:Math.random()>.5?"50%":"2px",animation:`confetti ${2+Math.random()*2}s ease-in ${Math.random()*.8}s both`,transform:`rotate(${Math.random()*360}deg)`}}/>)}
  {/* Card */}
  <div onClick={e=>e.stopPropagation()} style={{background:`linear-gradient(135deg,${C.card} 0%,#1a1a2c 100%)`,border:`2px solid ${C.acc}44`,borderRadius:20,padding:"32px 28px",maxWidth:340,textAlign:"center",animation:"celebIn .5s cubic-bezier(.16,1,.3,1) both",boxShadow:`0 0 60px rgba(255,170,0,.15)`}}>
   <div style={{fontSize:48,marginBottom:12,animation:"celebGlow 2s ease infinite"}}>{milestone.icon}</div>
   <div style={{color:C.acc,fontSize:10,fontWeight:700,letterSpacing:1.5,marginBottom:4}}>FÉLICITATIONS ! 🎉</div>
   <div style={{fontWeight:900,fontSize:20,color:C.t,marginBottom:6,fontFamily:FONT}}>{milestone.label}</div>
   <div style={{fontSize:12,color:C.td,lineHeight:1.5,marginBottom:16}}>Nouveau trophée débloqué par <strong style={{color:C.acc}}>Scale Corp</strong> — votre progression est remarquable !</div>
   <div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:16}}>
    {["🥉","🥈","🥇","💎","👑"].map((t,i)=><span key={i} style={{fontSize:i<=(milestone.tier||0)?20:14,opacity:i<=(milestone.tier||0)?1:.2,transition:"all .3s",transitionDelay:`${i*.1}s`}}>{t}</span>)}
   </div>
   <button onClick={()=>{setShow(false);setTimeout(onClose,400);}} style={{background:`linear-gradient(135deg,${C.acc},#FF9D00)`,color:"#0a0a0f",border:"none",borderRadius:10,padding:"10px 24px",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:FONT}}>Continuer →</button>
  </div>
 </div>;
}

/* MEETING PREP */
export function MeetingPrepView({soc,evo,myActions,myJournal,pulses,hs,rw,milestones,cM2,insights}){
 const last=evo.length>0?evo[evo.length-1]:null;const prev=evo.length>1?evo[evo.length-2]:null;
 const actionsDone=myActions.filter(a=>a.done);const actionsOpen=myActions.filter(a=>!a.done);
 const recentPulses=Object.entries(pulses).filter(([k])=>k.startsWith(soc.id+"_")).map(([k,v])=>({week:k.replace(soc.id+"_",""),...v})).sort((a,b)=>b.week.localeCompare(a.week)).slice(0,4);
 const newMilestones=milestones.filter(m=>m.unlocked).slice(-3);
 return <div>
  <div className="fu" style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"14px 16px",background:`linear-gradient(135deg,${C.card} 0%,#1a1a2c 100%)`,borderRadius:14,border:`1px solid ${C.acc}22`}}>
   <span style={{fontSize:24}}>📋</span>
   <div><div style={{fontWeight:800,fontSize:14,color:C.t}}>Prépa point mensuel</div><div style={{fontSize:10,color:C.td}}>Résumé auto-généré pour votre RDV avec Scale Corp</div></div>
  </div>
  {/* Situation */}
  <Sect title="Situation actuelle">
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:6,marginBottom:10}}>
    <KPI label="CA" value={last?`${fmt(last.ca)}€`:"—"} accent={C.acc} icon="💰" small/>
    <KPI label="Marge" value={last?`${last.margePct}%`:"—"} accent={last&&last.marge>=0?C.g:C.r} icon="📊" small/>
    <KPI label="Score" value={`${hs.grade} (${hs.score})`} accent={hs.color} icon="❤" small/>
    {rw&&<KPI label="Runway" value={`${rw.months}m`} accent={rw.months<3?C.r:rw.months<6?C.o:C.g} icon="⏳" small/>}
   </div>
   {prev&&<div style={{padding:"8px 10px",background:C.card2,borderRadius:8,fontSize:10,color:C.td,lineHeight:1.5}}>
    Variation CA : <strong style={{color:last.ca>=prev.ca?C.g:C.r}}>{last.ca>=prev.ca?"+":"−"}{prev.ca>0?pct(Math.abs(last.ca-prev.ca),prev.ca):0}%</strong> · Marge : <strong style={{color:last.margePct>=prev.margePct?C.g:C.r}}>{last.margePct>=prev.margePct?"+":"−"}{Math.abs(last.margePct-prev.margePct)} pts</strong>
   </div>}
  </Sect>
  {/* Insights / alertes */}
  {insights.length>0&&<Sect title="Points d'attention">
   {insights.map((ins,i)=><div key={i} style={{display:"flex",gap:8,padding:"8px 0",borderBottom:i<insights.length-1?`1px solid ${C.brd}08`:"none"}}>
    <span style={{fontSize:14}}>{ins.icon}</span>
    <div><div style={{fontWeight:600,fontSize:11,color:ins.type==="danger"?C.r:ins.type==="warning"?C.o:C.g}}>{ins.title}</div><div style={{fontSize:9,color:C.td,marginTop:1}}>{ins.tip}</div></div>
   </div>)}
  </Sect>}
  {/* Actions */}
  <Sect title={`Actions (${actionsDone.length} faites / ${actionsOpen.length} en cours)`}>
   {actionsOpen.length>0&&<div style={{marginBottom:8}}>{actionsOpen.slice(0,5).map(a=><div key={a.id} style={{fontSize:10,color:C.t,padding:"3px 0",display:"flex",gap:5}}>
    <span style={{color:a.deadline<cM2?C.r:C.o}}>○</span><span>{a.text}</span>{a.deadline<cM2&&<span style={{fontSize:8,color:C.r,fontWeight:600}}>retard</span>}
   </div>)}</div>}
   {actionsDone.length>0&&<div style={{borderTop:`1px solid ${C.brd}`,paddingTop:6}}>{actionsDone.slice(-3).map(a=><div key={a.id} style={{fontSize:10,color:C.td,padding:"2px 0"}}><span style={{color:C.g}}>✓</span> {a.text}</div>)}</div>}
   {actionsOpen.length===0&&actionsDone.length===0&&<div style={{fontSize:10,color:C.td}}>Aucune action en cours</div>}
  </Sect>
  {/* Pulses */}
  {recentPulses.length>0&&<Sect title="Mood récent">
   <div style={{display:"flex",gap:6}}>
   {recentPulses.map((p,i)=><div key={i} style={{flex:1,textAlign:"center",padding:"6px 4px",background:C.card2,borderRadius:8}}>
    <div style={{fontSize:16}}>{"😫😕😐🙂😄"[clamp(p.mood-1,0,4)]}</div>
    <div style={{fontSize:8,color:C.td,marginTop:2}}>{p.mood}/5</div>
    {p.win&&<div style={{fontSize:7,color:C.g,marginTop:2,lineHeight:1.2}}>{p.win.slice(0,30)}</div>}
   </div>)}
   </div>
  </Sect>}
  {/* Milestones disabled */}
  {/* Questions à préparer */}
  <Sect title="Questions à poser">
   <div style={{padding:"10px 12px",background:C.card2,borderRadius:8,color:C.td,fontSize:10,lineHeight:1.7}}>
    <div>• Quels sont mes 3 leviers prioritaires pour le prochain mois ?</div>
    <div>• Y a-t-il des synergies avec d'autres sociétés du portfolio ?</div>
    {rw&&rw.months<6&&<div>• Stratégie pour renforcer ma trésorerie ?</div>}
    {actionsOpen.length>3&&<div>• Peut-on reprioriser mes actions (j'en ai {actionsOpen.length} en parallèle) ?</div>}
    <div>• Quelles ressources Scale Corp sont sous-exploitées ?</div>
   </div>
  </Sect>
 </div>;
}

