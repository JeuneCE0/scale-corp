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
import { Btn, Card } from "./UI.jsx";

export function AICoPilot({socs,reps,hold,actions,pulses,allM,revData,socBank,okrs,synergies,clients}){
 const[msgs,setMsgs]=useState([{role:"assistant",content:"Salut ! Je suis ton co-pilote IA. Je connais toutes les données de ton portfolio. Pose-moi n'importe quelle question — analyse, recommandation, récap pour une réunion, comparaison entre sociétés…"}]);
 const[input,setInput]=useState("");const[loading,setLoading]=useState(false);const ref=useRef(null);
 const PRESETS=["Quelle société prioriser ce mois ?","Génère un récap pour la réunion","Quels sont les risques actuels ?","Compare LEADX et Copywriting","Propose un plan d'action pour ce trimestre"];
 const send=async(text)=>{
  if(!text.trim()||loading)return;const q=text.trim();setInput("");
  setMsgs(prev=>[...prev,{role:"user",content:q}]);setLoading(true);
  try{
   const ctx=buildAIContext(socs,reps,hold,actions,pulses,allM,revData,socBank,okrs,synergies,clients);
   const resp=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:ctx,messages:[...msgs.filter(m=>m.role!=="system"),{role:"user",content:q}]})
   });
   const data=await resp.json();const reply=data.content?.map(b=>b.text||"").join("\n")||"Désolé, je n'ai pas pu répondre.";
   setMsgs(prev=>[...prev,{role:"assistant",content:reply}]);
  }catch(e){setMsgs(prev=>[...prev,{role:"assistant",content:"❌ Erreur de connexion. Réessaie."}]);}
  setLoading(false);
 };
 useEffect(()=>{ref.current?.scrollTo({top:ref.current.scrollHeight,behavior:"smooth"});},[msgs]);
 return <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 120px)"}}>
  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>{PRESETS.map((p,i)=><button key={i} onClick={()=>send(p)} style={{padding:"5px 10px",borderRadius:20,fontSize:10,fontWeight:600,border:`1px solid ${C.brd}`,background:C.card,color:C.td,cursor:"pointer",fontFamily:FONT,transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor=C.acc;e.target.style.color=C.acc;}} onMouseLeave={e=>{e.target.style.borderColor=C.brd;e.target.style.color=C.td;}}>{p}</button>)}</div>
  <div ref={ref} style={{flex:1,overflowY:"auto",padding:"4px 0"}}>
   {msgs.map((m,i)=><div key={i} className="fu" style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:8}}>
    <div style={{maxWidth:"85%",padding:"10px 14px",borderRadius:12,background:m.role==="user"?C.acc+"22":C.card,border:`1px solid ${m.role==="user"?C.acc+"44":C.brd}`,fontSize:12,lineHeight:1.7,color:C.t,whiteSpace:"pre-wrap"}}>
    {m.role==="assistant"&&<div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}><span style={{fontSize:14}}>🤖</span><span style={{fontWeight:700,fontSize:10,color:C.v}}>CO-PILOTE</span></div>}
    {m.content}
    </div>
   </div>)}
   {loading&&<div className="fu" style={{padding:"10px 14px",background:C.card,borderRadius:12,border:`1px solid ${C.brd}`,display:"inline-block"}}><span className="dots" style={{fontSize:18}}><span>·</span><span>·</span><span>·</span></span></div>}
  </div>
  <div style={{display:"flex",gap:8,padding:"10px 0 0",borderTop:`1px solid ${C.brd}`}}>
   <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send(input);}} placeholder="Demande à ton co-pilote…" style={{flex:1,background:C.bg,border:`1px solid ${C.brd}`,borderRadius:10,color:C.t,padding:"10px 14px",fontSize:13,fontFamily:FONT,outline:"none"}}/>
   <Btn v="ai" onClick={()=>send(input)} disabled={!input.trim()||loading}>✦ Envoyer</Btn>
  </div>
 </div>;
}
/* PULSE SYSTEM */

export function AIWeeklyCoach({soc,reps,allM,actions,pulses,milestones}){
 const cM2=curM();const pm=prevM(cM2);
 const r=gr(reps,soc.id,cM2),rp=gr(reps,soc.id,pm);
 const ca=pf(r?.ca),caPrev=pf(rp?.ca),ch=pf(r?.charges);
 const hs=healthScore(soc,reps);
 const nextMs=milestones.filter(m=>!m.unlocked).sort((a,b)=>a.tier-b.tier)[0];
 const openActs=actions.filter(a=>a.socId===soc.id&&!a.done);
 const insights=useMemo(()=>{
  const ins=[];
  if(ca>0&&caPrev>0){
   const growth=Math.round((ca-caPrev)/caPrev*100);
   if(growth>20)ins.push({type:"success",icon:"📈",text:`CA en hausse de ${growth}% — excellent momentum ! Continue de pousser.`});
   else if(growth<-10)ins.push({type:"danger",icon:"📉",text:`CA en baisse de ${Math.abs(growth)}%. Identifie les 2 causes principales et agis cette semaine.`});
   else ins.push({type:"info",icon:"📊",text:`CA stable (${growth>0?"+":""}${growth}%). Cherche un levier de croissance à activer.`});
  }
  if(ca>0){const mPct=Math.round((ca-ch)/ca*100);
   if(mPct<20)ins.push({type:"warning",icon:"💸",text:`Marge à ${mPct}% — trop basse. Objectif : passer à 40%+ en optimisant les charges.`});
   else if(mPct>60)ins.push({type:"success",icon:"💎",text:`Marge excellente à ${mPct}%. Réinvestis dans l'acquisition.`});
  }
  if(openActs.length>3)ins.push({type:"warning",icon:"📋",text:`${openActs.length} actions ouvertes. Ferme-en 2 cette semaine avant d'en créer de nouvelles.`});
  if(nextMs)ins.push({type:"info",icon:"🏆",text:`Prochain milestone : "${nextMs.label}" — ${nextMs.desc}. Tu y es presque !`});
  if(hs.grade==="D"||hs.grade==="F")ins.push({type:"danger",icon:"⚠️",text:`Grade ${hs.grade} — focus sur ${hs.obj<hs.growth?"les objectifs":"la croissance"} en priorité.`});
  if(ins.filter(i=>i.type==="success").length>=2)ins.push({type:"success",icon:"🔥",text:"Tu es en feu ! Garde ce rythme et documente ce qui marche dans la Knowledge Base."});
  return ins;
 },[ca,caPrev,ch,openActs,nextMs,hs]);
 const typeStyles={danger:{bg:C.rD,color:C.r},warning:{bg:C.oD,color:C.o},success:{bg:C.gD,color:C.g},info:{bg:C.bD,color:C.b}};
 return <Card accent={C.v} style={{padding:14,marginTop:8}}>
  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
   <span style={{fontSize:16}}>🧠</span>
   <div><div style={{fontWeight:800,fontSize:12,color:C.v}}>Coach IA</div><div style={{fontSize:8,color:C.td}}>Brief hebdomadaire personnalisé</div></div>
  </div>
  {insights.length===0&&<div style={{color:C.td,fontSize:11,textAlign:"center",padding:10}}>Soumets un rapport pour activer le coaching</div>}
  {insights.map((ins,i)=>{const st=typeStyles[ins.type]||typeStyles.info;
   return <div key={i} className={`fu d${Math.min(i+1,6)}`} style={{display:"flex",alignItems:"flex-start",gap:6,padding:"6px 8px",background:st.bg,borderRadius:6,marginBottom:4}}>
    <span style={{fontSize:12,flexShrink:0,marginTop:1}}>{ins.icon}</span>
    <div style={{fontSize:10,color:C.t,lineHeight:1.4}}>{ins.text}</div>
   </div>;
  })}
 </Card>;
}
/* CLIENTS PANEL (per-société CRM) */
