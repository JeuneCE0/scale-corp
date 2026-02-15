import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import * as U from "../utils/index.jsx";
// Destructure commonly used utilities for readability
const { C, C_DARK, C_LIGHT, getTheme, applyTheme, MN, curM, ml, fmt, fK, pct, clamp, prevM, nextM, pf, gr, FONT, FONT_TITLE, BF, deadline, qOf, qMonths, qLabel, ago, uid, curW, MOODS, sinceLbl, sinceMonths, CSS, DS, DH, DEAL_STAGES, DEMO_JOURNAL, DEMO_ACTIONS, DEMO_PULSES, DEMO_DEALS, DEMO_OKRS, DEMO_SYNERGIES, DEMO_SUBS, DEMO_TEAM, DEMO_CLIENTS, SYN_TYPES, SYN_STATUS, SUB_CATS, SLACK_MODES, EXCLUDED_ACCOUNTS, CURR_SYMBOLS, REV_ENVS, GHL_BASE, STRIPE_PROXY, STORE_URL, ErrorBoundary, mkPrefill, autoGenerateReport, autoCategorize, autoDetectSubscriptions, subMonthly, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, generateInvoices, refreshInvoiceStatuses, ghlCreateInvoice, ghlSendInvoice, mkDemoInvoices, teamMonthly, normalizeStr, fuzzyMatch, matchSubsToRevolut, deduplicatedCharges, mkGHLDemo, ghlUpdateContact, ghlCreateContact, fetchGHL, syncGHLForSoc, slackWebhookSend, slackBotSend, slackSend, slackMention, buildPulseSlackMsg, buildReportSlackMsg, buildReminderSlackMsg, buildValidationSlackMsg, checkAndSendReminders, fetchStripe, syncStripeData, getStripeChargesForClient, getStripeTotal, mkRevolutDemo, fetchRevolut, syncRevolut, mkSocRevDemo, syncSocRevolut, revFinancials, storeCall, sbAuthHeaders, sbUpsert, sbGet, sbList, sGet, sSet, syncFromSupabase, fetchHoldingFromSB, fetchSocietiesFromSB, calcH, simH, healthScore, leadScore, leadScoreColor, leadScoreLabel, qCA, getAlerts, buildFeed, project, runway, calcLeaderboard, buildAIContext, calcMilestoneData, calcMilestones, calcSmartAlerts, genInsights, calcBenchmark, getPlaybooks, calcClientHealthScore, genPorteurNotifications, BILL_TYPES, CLIENT_STATUS, curQ, AUTO_CAT_MAP, DEMO_KB } = U;

import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "./ui.jsx";

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
export function PulseForm({soc,pulses,savePulse,hold}){
 const w=curW();const existing=pulses[`${soc.id}_${w}`];
 const[mood,setMood]=useState(existing?.mood??-1);const[win,setWin]=useState(existing?.win||"");
 const[blocker,setBlocker]=useState(existing?.blocker||"");const[conf,setConf]=useState(existing?.conf??3);const[sent,setSent]=useState(!!existing);const[slackSent,setSlackSent]=useState(false);
 const submit=()=>{
  const pulse={mood,win,blocker,conf,at:new Date().toISOString()};
  savePulse(`${soc.id}_${w}`,pulse);setSent(true);setTimeout(()=>setSent(false),2e3);
  if(hold?.slack?.enabled&&hold.slack.notifyPulse){
   slackSend(hold.slack,buildPulseSlackMsg(soc,pulse)).then(r=>{if(r.ok)setSlackSent(true);});
  }
 };
 return <Card style={{padding:14}} accent={soc.color}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
   <span style={{fontWeight:700,fontSize:13}}>⚡ Pulse hebdo {existing&&<span style={{color:C.g,fontSize:10,fontWeight:600}}>✓ Déjà envoyé</span>}</span>
   {hold?.slack?.enabled&&<span style={{fontSize:7,color:C.g,background:C.gD,padding:"1px 5px",borderRadius:4}}>{SLACK_MODES[hold.slack.mode]?.icon||"💬"} Slack</span>}
  </div>
  <div style={{marginBottom:10}}><div style={{color:C.td,fontSize:11,fontWeight:600,marginBottom:4}}>Comment tu te sens ?</div><div style={{display:"flex",gap:6}}>{MOODS.map((e,i)=><button key={i} onClick={()=>setMood(i)} style={{fontSize:22,padding:"4px 8px",borderRadius:8,border:`2px solid ${mood===i?C.acc:C.brd}`,background:mood===i?C.accD:"transparent",cursor:"pointer",transition:"all .15s"}}>{e}</button>)}</div></div>
  <Inp label="🏆 Ta victoire de la semaine" value={win} onChange={setWin} placeholder="Ex: 2 nouveaux clients signés" small/>
  <Inp label="🚧 Un blocage ?" value={blocker} onChange={setBlocker} placeholder="Ex: attente réponse fournisseur (optionnel)" small/>
  <div style={{marginBottom:10}}><div style={{color:C.td,fontSize:11,fontWeight:600,marginBottom:4}}>Confiance pour la suite (1-5)</div><div style={{display:"flex",alignItems:"center",gap:8}}><input type="range" min={1} max={5} value={conf} onChange={e=>setConf(parseInt(e.target.value))} style={{flex:1}}/><span style={{fontWeight:800,fontSize:16,color:[C.r,C.o,C.td,C.b,C.g][conf-1]}}>{conf}/5</span></div></div>
  <Btn onClick={submit} full v={sent?"success":"primary"} disabled={mood<0||!win.trim()}>{sent?"✓ Envoyé !":"Envoyer le pulse"}</Btn>
  {slackSent&&<div style={{textAlign:"center",fontSize:9,color:C.g,marginTop:4}}>💬 Notification Slack envoyée</div>}
 </Card>;
}
export function PulseOverview({socs,pulses}){
 const w=curW();const actS=socs.filter(s=>s.stat==="active"&&s.id!=="eco");
 return <>{actS.map(s=>{const p=pulses[`${s.id}_${w}`];
  return <div key={s.id} className="fu" style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3}}>
   <span style={{width:5,height:5,borderRadius:3,background:s.color}}/><span style={{flex:1,fontSize:12,fontWeight:600}}>{s.porteur}</span>
   {p?<><span style={{fontSize:16}}>{MOODS[p.mood]}</span><span style={{fontSize:10,color:C.td,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.win}</span>{p.blocker&&<span style={{fontSize:9,color:C.r,background:C.rD,padding:"2px 6px",borderRadius:10}}>blocage</span>}<span style={{fontWeight:700,fontSize:11,color:[C.r,C.o,C.td,C.b,C.g][p.conf-1]}}>{p.conf}/5</span></>
    :<span style={{fontSize:10,color:C.tm}}>— pas encore envoyé</span>}
  </div>;})}</>;
}
/* MEETING MODE */
export function MeetingMode({socs,reps,hold,actions,pulses,allM,onExit}){
 const cM2=curM();const actS=socs.filter(s=>s.stat==="active");const hc=calcH(socs,reps,hold,cM2);
 const[step,setStep]=useState(0);const[timer,setTimer]=useState(0);const[running,setRunning]=useState(false);const[notes,setNotes]=useState("");
 const steps=[{title:"Vue d'ensemble",icon:"📊"},{title:"Alertes & Actions",icon:"⚠"},...actS.map(s=>({title:s.nom,icon:"🏢",soc:s})),{title:"Décisions & Prochaines étapes",icon:"✅"}];
 useEffect(()=>{let id;if(running)id=setInterval(()=>setTimer(t=>t+1),1e3);return()=>clearInterval(id);},[running]);
 const fmtT=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
 return <div className="glass-bg" style={{minHeight:"100vh",fontFamily:FONT,color:C.t}}>
  <style>{CSS}</style>
  <div style={{background:"rgba(14,14,22,.7)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,.06)",padding:"14px 20px"}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div><div style={{color:C.acc,fontSize:10,fontWeight:700,letterSpacing:2}}>MODE RÉUNION</div><h1 style={{margin:0,fontSize:18,fontWeight:900}}>{hold?.brand?.name||"Scale Corp"} — {ml(cM2)}</h1></div>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
    <div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:900,fontVariantNumeric:"tabular-nums",color:running?C.g:C.t}}>{fmtT(timer)}</div><div style={{display:"flex",gap:4,marginTop:4}}><Btn small v={running?"danger":"success"} onClick={()=>setRunning(!running)}>{running?"⏸":"▶"}</Btn><Btn small v="ghost" onClick={()=>setTimer(0)}>↻</Btn></div></div>
    <Btn v="ghost" onClick={onExit}>✕ Quitter</Btn>
    </div>
   </div>
   <div style={{display:"flex",gap:2,marginTop:12,overflowX:"auto"}}>{steps.map((s,i)=><button key={i} onClick={()=>setStep(i)} style={{padding:"8px 14px",borderRadius:8,fontSize:11,fontWeight:step===i?700:500,border:"none",background:step===i?C.acc+"22":"transparent",color:step===i?C.acc:C.td,cursor:"pointer",fontFamily:FONT,whiteSpace:"nowrap"}}>{s.icon} {s.title}</button>)}</div>
  </div>
  <div style={{padding:"20px 30px",maxWidth:900,margin:"0 auto"}}>
   {step===0&&<div className="si">
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14}}>
    <KPI label="CA Groupe" value={`${fmt(actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.ca),0))}€`} accent={C.acc}/><KPI label="Marge" value={`${fmt(actS.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.ca)-pf(gr(reps,s.id,cM2)?.charges),0))}€`} accent={C.g}/><KPI label="/ Fondateur" value={`${fmt(hc.pf)}€`} accent={C.o}/><KPI label="Pipeline" value={`${fmt(socs.reduce((a,s)=>a+pf(gr(reps,s.id,cM2)?.pipeline),0))}€`} accent={C.b}/>
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:16}}>{actS.map(s=>{const hs=healthScore(s,reps);const r=gr(reps,s.id,cM2);
     const myCl=(clients||[]).filter(c=>c.socId===s.id&&c.status==="active");const chCl=(clients||[]).filter(c=>c.socId===s.id&&c.status==="churned").length;const totCl=myCl.length+chCl;
     const ecsQuick=(()=>{let sc=0;sc+=100;const g2=prevCa>0?(pf(r?.ca)-prevCa)/prevCa*100:0;sc+=g2>10?200:g2>5?150:g2>=0?100:50;sc+=Math.round((1-(totCl>0?chCl/totCl:0))*200);sc+=myCl.length>10?100:myCl.length>=5?70:40;return clamp(sc,0,1000);})();
     const ecsC=ecsQuick>800?"#34d399":ecsQuick>600?"#eab308":ecsQuick>400?"#fb923c":"#f87171";
     const ecsB=ecsQuick>800?"🏆":ecsQuick>600?"⭐":ecsQuick>400?"📈":"⚠️";
     return <Card key={s.id} accent={s.color} style={{flex:"1 1 200px",padding:14}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><GradeBadge grade={hs.grade} color={hs.color}/><span style={{fontWeight:700,fontSize:14}}>{s.nom}</span><span style={{marginLeft:"auto",fontSize:9,fontWeight:800,color:ecsC,background:ecsC+"18",padding:"2px 6px",borderRadius:8}}>{ecsB} {ecsQuick}</span></div><div style={{fontSize:22,fontWeight:900}}>{r?`${fmt(r.ca)}€`:"—"}</div><div style={{color:C.td,fontSize:11,marginTop:2}}>{s.porteur}</div></Card>;})}</div>
   </div>}
   {step===1&&<div className="si">
    <Sect title="Alertes">{getAlerts(socs,reps,hold).map((a,i)=><div key={i} style={{padding:"6px 10px",background:{danger:C.rD,warn:C.oD,info:C.bD}[a.t],borderRadius:8,marginBottom:3,color:{danger:C.r,warn:C.o,info:C.b}[a.t],fontSize:12,fontWeight:600}}>⚠ {a.m}</div>)}</Sect>
    <Sect title="Actions en retard">{actions.filter(a=>!a.done&&a.deadline<cM2).map(a=><ActionItem key={a.id} a={a} socs={socs} onToggle={()=>{}} onDelete={()=>{}}/>)}</Sect>
    <Sect title="Actions en cours">{actions.filter(a=>!a.done&&a.deadline>=cM2).slice(0,8).map(a=><ActionItem key={a.id} a={a} socs={socs} onToggle={()=>{}} onDelete={()=>{}}/>)}</Sect>
   </div>}
   {step>=2&&step<steps.length-1&&steps[step].soc&&(()=>{
    const s=steps[step].soc,r=gr(reps,s.id,cM2),rp=gr(reps,s.id,prevM(cM2));const hs=healthScore(s,reps);const rw=runway(reps,s.id,allM);const proj=project(reps,s.id,allM);
    const pw=Object.entries(pulses).filter(([k])=>k.startsWith(s.id+"_")).pop();
    const sActs=actions.filter(a=>a.socId===s.id&&!a.done);
    return <div className="si">
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
    <div style={{width:40,height:40,borderRadius:10,background:`${s.color}22`,border:`2px solid ${s.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:18,color:s.color}}>{s.nom[0]}</div>
    <div style={{flex:1}}><div style={{fontWeight:900,fontSize:18}}>{s.nom}</div><div style={{color:C.td,fontSize:11,display:"flex",gap:6,alignItems:"center"}}><span>{s.porteur} — {s.act}</span>{s.incub&&<span style={{color:C.v,fontSize:9,background:C.vD,padding:"1px 6px",borderRadius:8}}>📅 {sinceLbl(s.incub)}</span>}</div></div>
    <GradeBadge grade={hs.grade} color={hs.color} size="lg"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
    <KPI label="CA" value={r?`${fmt(r.ca)}€`:"—"} accent={C.acc} small/><KPI label="Marge" value={r?`${fmt(pf(r.ca)-pf(r.charges))}€`:"—"} accent={C.g} small/>
    {s.rec&&<KPI label="MRR" value={r?`${fmt(r.mrr)}€`:"—"} accent={C.b} small/>}
    <KPI label="Pipeline" value={r?`${fmt(r.pipeline)}€`:"—"} accent={C.acc} small/>
    {rw&&<KPI label="Runway" value={`${rw.months} mois`} accent={rw.months<3?C.r:rw.months<6?C.o:C.g} small/>}
    </div>
    {pw&&<Card style={{marginTop:12,padding:12}} accent={s.color}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:22}}>{MOODS[pw[1].mood]}</span><div><div style={{fontSize:12,fontWeight:600}}>Pulse: {pw[1].win}</div>{pw[1].blocker&&<div style={{fontSize:11,color:C.r}}>Blocage: {pw[1].blocker}</div>}</div></div></Card>}
    {/* Milestones disabled */}
    {proj&&<Card style={{marginTop:10,padding:12}}><div style={{color:C.td,fontSize:10,fontWeight:700,marginBottom:4}}>PROJECTION T+3</div><div style={{display:"flex",gap:12}}>{proj.map((v,i)=><span key={i} style={{fontSize:12}}>{ml(nextM(i===0?cM2:nextM(i===1?cM2:nextM(cM2))))}: <strong style={{color:C.acc}}>{fmt(v)}€</strong></span>)}</div></Card>}
    {sActs.length>0&&<Sect title="Actions ouvertes">{sActs.map(a=><ActionItem key={a.id} a={a} socs={socs} onToggle={()=>{}} onDelete={()=>{}}/>)}</Sect>}
    </div>;
   })()}
   {step===steps.length-1&&<div className="si"><Sect title="Notes de réunion"><Inp value={notes} onChange={setNotes} textarea placeholder="Décisions prises, prochaines étapes…"/></Sect></div>}
   <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
    <Btn v="secondary" onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0}>← Précédent</Btn>
    <span style={{color:C.td,fontSize:11}}>{step+1}/{steps.length}</span>
    <Btn onClick={()=>setStep(Math.min(steps.length-1,step+1))} disabled={step===steps.length-1}>Suivant →</Btn>
   </div>
  </div>
 </div>;
}
/* DEAL FLOW */
export function DealFlow({deals,saveDeals}){
 const[edit,setEdit]=useState(null);
 const move=(id,dir)=>{saveDeals(deals.map(d=>d.id===id?{...d,stage:clamp(d.stage+dir,0,DEAL_STAGES.length-1)}:d));};
 const del=(id)=>{saveDeals(deals.filter(d=>d.id!==id));};
 const saveDeal=()=>{if(!edit)return;const idx=deals.findIndex(d=>d.id===edit.id);saveDeals(idx>=0?deals.map(d=>d.id===edit.id?edit:d):[...deals,edit]);setEdit(null);};
 return <>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,marginTop:6}}><span style={{color:C.td,fontSize:12}}>{deals.length} opportunités</span><Btn small onClick={()=>setEdit({id:uid(),nom:"",contact:"",stage:0,value:0,notes:"",at:new Date().toISOString()})}>+ Deal</Btn></div>
  <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:10}}>{DEAL_STAGES.map((stage,si)=><div key={si} style={{minWidth:170,flex:"1 1 170px"}}>
   <div style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:6,textAlign:"center"}}>{stage}</div>
   {deals.filter(d=>d.stage===si).map(d=><Card key={d.id} style={{marginBottom:5,padding:"10px 12px",cursor:"pointer"}} onClick={()=>setEdit({...d})}>
    <div style={{fontWeight:700,fontSize:12,marginBottom:2}}>{d.nom}</div>
    <div style={{fontSize:10,color:C.td}}>{d.contact}</div>
    {d.value>0&&<div style={{fontSize:11,fontWeight:700,color:C.acc,marginTop:2}}>{fmt(d.value)}€/mois</div>}
    <div style={{display:"flex",gap:3,marginTop:6}}>{si>0&&<Btn v="ghost" small onClick={e=>{e.stopPropagation();move(d.id,-1);}}>←</Btn>}{si<DEAL_STAGES.length-1&&<Btn v="ghost" small onClick={e=>{e.stopPropagation();move(d.id,1);}}>→</Btn>}</div>
   </Card>)}
  </div>)}</div>
  <Modal open={!!edit} onClose={()=>setEdit(null)} title={edit?.nom||"Nouveau deal"}>
   {edit&&<><Inp label="Nom société" value={edit.nom} onChange={v=>setEdit({...edit,nom:v})}/><Inp label="Contact" value={edit.contact} onChange={v=>setEdit({...edit,contact:v})}/><Inp label="Valeur estimée" value={edit.value} onChange={v=>setEdit({...edit,value:pf(v)})} type="number" suffix="€/mois"/><Sel label="Étape" value={edit.stage} onChange={v=>setEdit({...edit,stage:parseInt(v)})} options={DEAL_STAGES.map((s,i)=>({v:i,l:s}))}/><Inp label="Notes" value={edit.notes} onChange={v=>setEdit({...edit,notes:v})} textarea/>
   <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={saveDeal}>Sauver</Btn><Btn v="secondary" onClick={()=>setEdit(null)}>Annuler</Btn>{deals.find(d=>d.id===edit.id)&&<Btn v="danger" onClick={()=>{del(edit.id);setEdit(null);}} style={{marginLeft:"auto"}}>Supprimer</Btn>}</div></>}
  </Modal>
 </>;
}
/* BANKING - REVOLUT */
export const TX_CATEGORIES=[
 {id:"all",label:"Toutes",icon:""},
 {id:"revenus",label:"💰 Revenus",icon:"💰"},
 {id:"loyer",label:"🏠 Loyer",icon:"🏠"},
 {id:"pub",label:"📢 Publicité",icon:"📢"},
 {id:"abonnements",label:"💻 Abonnements",icon:"💻"},
 {id:"equipe",label:"👥 Équipe",icon:"👥"},
 {id:"transfert",label:"🏦 Transfert interne",icon:"🏦"},
 {id:"autres",label:"📦 Autres dépenses",icon:"📦"},
 {id:"dividendes",label:"🏛️ Dividendes Holding",icon:"🏛️"},
];
export function categorizeTransaction(tx){
 const leg=tx.legs?.[0];if(!leg)return{id:"autres",label:"📦 Autres dépenses",icon:"📦"};
 const amt=leg.amount;const ref=((leg.description||"")+" "+(tx.reference||"")).toLowerCase();
 const legDesc=((tx.legs?.[0]?.description||"")+"").toLowerCase();
 const hasCounterparty=!!tx.legs?.[0]?.counterparty;const isSingleLeg=(tx.legs||[]).length===1;
 const isRealDividend=(/dividend/i.test(tx.reference||"")&&hasCounterparty&&isSingleLeg)||(/scale\s*corp/i.test(legDesc)&&hasCounterparty&&isSingleLeg);
 if(isRealDividend)return TX_CATEGORIES[8];
 if(amt>0)return TX_CATEGORIES[1];
 if(/loyer|rent/.test(ref))return TX_CATEGORIES[2];
 if(/facebook|google ads|meta ads|meta|tiktok|pub/.test(ref))return TX_CATEGORIES[3];
 if(/lecosysteme|l.{0,2}ecosyst[eè]me/i.test(ref))return TX_CATEGORIES[4];
 if(/stripe|notion|slack|ghl|zapier|skool|adobe|figma|revolut|gohighlevel|highlevel|canva|chatgpt|openai|anthropic|vercel|github|zoom|brevo|make\.com|clickup|airtable/.test(ref))return TX_CATEGORIES[4];
 if(/lucien|salaire|salary|freelance|prestataire|prestation/.test(ref))return TX_CATEGORIES[5];
 if(tx.type==="transfer")return TX_CATEGORIES[6];
 return TX_CATEGORIES[7];
}
export function BankingPanel({revData,onSync,compact,clients:allClients2=[]}){
 if(!revData||!revData.accounts){
  return <Card style={{textAlign:"center",padding:compact?16:30}}>
   <div style={{fontSize:compact?24:36,marginBottom:6}}>🏦</div>
   <div style={{fontWeight:700,fontSize:compact?12:14,marginBottom:4}}>Revolut Business</div>
   <div style={{color:C.td,fontSize:11,marginBottom:10}}>Connecte ton compte dans Paramètres Holding</div>
   <Btn small onClick={onSync}>Charger données demo</Btn>
  </Card>;
 }
 const{accounts,transactions,totalEUR,lastSync,isDemo}=revData;
 const inflow=transactions.filter(t=>t.legs?.[0]?.amount>0).reduce((s,t)=>s+t.legs?.[0]?.amount||0,0);
 const outflow=Math.abs(transactions.filter(t=>t.legs?.[0]?.amount<0).reduce((s,t)=>s+t.legs?.[0]?.amount||0,0));
 const cs=v=>CURR_SYMBOLS[v]||v;
 if(compact)return <Card style={{padding:12}} accent={C.g}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
   <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:14}}>🏦</span><span style={{fontWeight:700,fontSize:11,color:C.td}}>REVOLUT</span>{isDemo&&<span style={{fontSize:8,color:C.o,background:C.oD,padding:"1px 5px",borderRadius:6}}>DEMO</span>}</div>
   <span style={{fontSize:9,color:C.tm}}>{ago(lastSync)}</span>
  </div>
  <div style={{fontWeight:900,fontSize:20,color:C.g}}>{fmt(totalEUR)}€</div>
  <div style={{display:"flex",gap:8,marginTop:6}}>{accounts.slice(0,3).map(a=><div key={a.id} style={{fontSize:10,color:C.td}}>{a.name}: <strong style={{color:C.t}}>{fmt(a.balance)}{cs(a.currency)}</strong></div>)}</div>
 </Card>;
 return <>
  {isDemo&&<div className="fu" style={{background:C.oD,border:`1px solid ${C.o}22`,borderRadius:10,padding:"8px 14px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{color:C.o,fontSize:11,fontWeight:600}}>⚠ Données demo — Ajoute ton token Revolut dans Paramètres Holding</span><Btn small v="secondary" onClick={onSync}>↻ Sync</Btn></div>}
  <div className="fu" style={{background:`linear-gradient(135deg,${C.card},${C.card2})`,border:`1px solid ${C.brd}`,borderRadius:14,padding:20,marginBottom:14,textAlign:"center"}}>
   <div style={{color:C.td,fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:4}}>SOLDE TOTAL</div>
   <div style={{fontWeight:900,fontSize:34,color:C.g,lineHeight:1}}>{fmt(totalEUR)}€</div>
   <div style={{color:C.td,fontSize:11,marginTop:4}}>Dernière sync: {ago(lastSync)}</div>
   {!isDemo&&<Btn small v="secondary" onClick={onSync} style={{marginTop:8}}>↻ Actualiser</Btn>}
  </div>
  <Sect title="Comptes" sub={`${accounts.length} comptes`}>
   {accounts.map((a,i)=><div key={a.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:C.card,borderRadius:10,border:`1px solid ${C.brd}`,marginBottom:4}}>
    <div style={{width:36,height:36,borderRadius:9,background:a.state==="active"?C.gD:C.rD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏦</div>
    <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{a.name}</div><div style={{color:C.td,fontSize:10}}>{a.currency} · {a.state==="active"?"Actif":"Inactif"}</div></div>
    <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:18,color:a.balance>=0?C.g:C.r}}>{fmt(a.balance)} {cs(a.currency)}</div></div>
   </div>)}
  </Sect>
  <div style={{display:"flex",gap:10,marginTop:4}}>
   <KPI label="Entrées (30j)" value={`+${fmt(inflow)}€`} accent={C.g} delay={1}/>
   <KPI label="Sorties (30j)" value={`-${fmt(outflow)}€`} accent={C.r} delay={2}/>
   <KPI label="Net" value={`${fmt(inflow-outflow)}€`} accent={inflow-outflow>=0?C.g:C.r} delay={3}/>
  </div>
  <BankingTransactions transactions={transactions} cs={cs} allClients2={allClients2}/>
 </>;
}
export function BankingTransactions({transactions,cs,allClients2=[]}){
 const[catFilter,setCatFilter]=useState("all");
 const[typeFilter,setTypeFilter]=useState("all");
 const[periodFilter,setPeriodFilter]=useState("all");
 const[sortBy,setSortBy]=useState("recent");
 const[search,setSearch]=useState("");
 const filtered=useMemo(()=>{
  const now=new Date();let txs=[...transactions];
  // period
  if(periodFilter==="month"){const s=new Date(now.getFullYear(),now.getMonth(),1);txs=txs.filter(t=>new Date(t.created_at)>=s);}
  else if(periodFilter==="lastmonth"){const s=new Date(now.getFullYear(),now.getMonth()-1,1);const e=new Date(now.getFullYear(),now.getMonth(),1);txs=txs.filter(t=>{const d=new Date(t.created_at);return d>=s&&d<e;});}
  else if(periodFilter==="3months"){const s=new Date(now.getFullYear(),now.getMonth()-2,1);txs=txs.filter(t=>new Date(t.created_at)>=s);}
  // type
  if(typeFilter==="in")txs=txs.filter(t=>t.legs?.[0]?.amount>0);
  else if(typeFilter==="out")txs=txs.filter(t=>t.legs?.[0]?.amount<0);
  // category
  if(catFilter!=="all")txs=txs.filter(t=>categorizeTransaction(t).id===catFilter);
  // search
  if(search.trim()){const q=search.toLowerCase();txs=txs.filter(t=>{const ref=((t.legs?.[0]?.description||"")+" "+(t.reference||"")+" "+(t.merchant?.name||"")).toLowerCase();return ref.includes(q);});}
  // sort
  if(sortBy==="oldest")txs.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  else if(sortBy==="recent")txs.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  else if(sortBy==="amountUp")txs.sort((a,b)=>(a.legs?.[0]?.amount||0)-(b.legs?.[0]?.amount||0));
  else if(sortBy==="amountDown")txs.sort((a,b)=>(b.legs?.[0]?.amount||0)-(a.legs?.[0]?.amount||0));
  return txs;
 },[transactions,catFilter,typeFilter,periodFilter,sortBy,search]);
 const totals=useMemo(()=>{
  let inp=0,out=0,div=0;filtered.forEach(t=>{const a=t.legs?.[0]?.amount||0;if(a>0)inp+=a;else{out+=Math.abs(a);if(categorizeTransaction(t).id==="dividendes")div+=Math.abs(a);}});
  return{inp:Math.round(inp),out:Math.round(out),net:Math.round(inp-out),count:filtered.length,div:Math.round(div)};
 },[filtered]);
 const selS={background:C.bg,border:`1px solid ${C.brd}`,borderRadius:6,color:C.t,padding:"4px 6px",fontSize:10,fontFamily:FONT,outline:"none"};
 return <>
  <div style={{display:"flex",flexWrap:"wrap",gap:4,alignItems:"center",marginTop:10,marginBottom:6}}>
   <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={selS}>{TX_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select>
   <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={selS}><option value="all">Toutes</option><option value="in">Entrées</option><option value="out">Sorties</option></select>
   <select value={periodFilter} onChange={e=>setPeriodFilter(e.target.value)} style={selS}><option value="all">Tout</option><option value="month">Ce mois</option><option value="lastmonth">Mois dernier</option><option value="3months">3 derniers mois</option></select>
   <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selS}><option value="recent">Plus récent</option><option value="oldest">Plus ancien</option><option value="amountDown">Montant ↓</option><option value="amountUp">Montant ↑</option></select>
   <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher…" style={{...selS,flex:"1 1 100px",minWidth:80}}/>
  </div>
  <div style={{display:"flex",gap:6,marginBottom:8}}>
   <div style={{flex:1,background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,padding:"6px 8px"}}><div style={{fontSize:8,color:C.td,fontWeight:700}}>ENTRÉES</div><div style={{fontWeight:800,fontSize:12,color:C.g}}>+{fmt(totals.inp)}€</div></div>
   <div style={{flex:1,background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,padding:"6px 8px"}}><div style={{fontSize:8,color:C.td,fontWeight:700}}>SORTIES</div><div style={{fontWeight:800,fontSize:12,color:C.r}}>-{fmt(totals.out)}€</div></div>
   <div style={{flex:1,background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,padding:"6px 8px"}}><div style={{fontSize:8,color:C.td,fontWeight:700}}>NET</div><div style={{fontWeight:800,fontSize:12,color:totals.net>=0?C.g:C.r}}>{fmt(totals.net)}€</div></div>
   <div style={{flex:1,background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,padding:"6px 8px"}}><div style={{fontSize:8,color:C.td,fontWeight:700}}>TX</div><div style={{fontWeight:800,fontSize:12,color:C.t}}>{totals.count}</div></div>
  </div>
  {totals.div>0&&<div style={{background:"#7c3aed11",border:"1px solid #7c3aed33",borderRadius:8,padding:"6px 10px",marginBottom:8,display:"flex",alignItems:"center",gap:6,fontSize:11}}><span style={{fontSize:13}}>🏛️</span><span style={{color:"#7c3aed",fontWeight:700}}>Total dividendes holding : {fmt(totals.div)}€</span><span style={{color:C.td,fontSize:10}}>(non comptés dans les charges opérationnelles)</span></div>}
  <Sect title="Transactions" sub={`${totals.count} résultats`}>
   {filtered.map((tx,i)=>{
    const leg=tx.legs?.[0];if(!leg)return null;
    const isIn=leg.amount>0;const desc=leg.description||tx.reference||tx.merchant?.name||"Transaction";
    const cat=categorizeTransaction(tx);const isDiv=cat.id==="dividendes";
    const catColors={"revenus":C.g,"loyer":"#f59e0b","pub":"#ec4899","abonnements":C.b,"equipe":C.o,"transfert":"#6366f1","dividendes":"#7c3aed","autres":C.td};
    return <div key={tx.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:isDiv?"#7c3aed11":C.card,borderRadius:8,border:`1px solid ${isDiv?"#7c3aed33":C.brd}`,marginBottom:2}}>
    <div style={{width:26,height:26,borderRadius:7,background:isIn?C.gD:isDiv?"#7c3aed22":C.rD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:isIn?C.g:isDiv?"#7c3aed":C.r,flexShrink:0}}>{cat.icon||"↑"}</div>
    <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{desc}</span><span style={{fontSize:9,padding:"1px 6px",borderRadius:8,background:(catColors[cat.id]||C.td)+"22",color:catColors[cat.id]||C.td,fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>{cat.label}</span></div><div style={{fontSize:10,color:C.td}}>{new Date(tx.created_at).toLocaleDateString("fr-FR")} · {tx.type==="card_payment"?"Carte":"Virement"}</div></div>
    <span style={{fontWeight:800,fontSize:13,color:isIn?C.g:isDiv?"#7c3aed":C.r,whiteSpace:"nowrap"}}>{isIn?"+":""}{fmt(leg.amount)} {cs(leg.currency)}</span>
    {(()=>{const d2=(desc||"").toLowerCase();const match=allClients2.find(c=>{const n=(c.name||"").toLowerCase().trim();if(n.length<3)return false;if(d2.includes(n))return true;const pts=n.split(/\s+/).filter(p=>p.length>2);return pts.length>=2&&pts.every(p=>d2.includes(p));});return match?<span style={{fontSize:7,padding:"1px 5px",borderRadius:6,background:"#60a5fa22",color:"#60a5fa",fontWeight:700,marginLeft:4,flexShrink:0,whiteSpace:"nowrap"}}>👤 {match.name}</span>:null;})()}
    </div>;
   })}
   {filtered.length===0&&<div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Aucune transaction trouvée</div>}
  </Sect>
 </>;
}
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
  const st=new Set();ids.forEach(id=>{const d=ghlData[id];if(!d)return;((d.opportunities||[])).forEach(o=>st.add(o.stage));});
  return[...st];
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
   {stages.map((st,i)=>{const stOpps=opps.filter(o=>o.stage===st);const val=stOpps.reduce((a,o)=>a+o.value,0);const w=aggStats.tLeads>0?Math.round(stOpps.length/aggStats.tLeads*100):0;
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
export function MilestonesWall({milestones,soc}){
 const[showAll,setShowAll]=useState(false);
 const unlocked=milestones.filter(m=>m.unlocked);
 const locked=milestones.filter(m=>!m.unlocked);
 const nextUp=locked.sort((a,b)=>a.tier-b.tier).slice(0,3);
 const cats=[...new Set(milestones.map(m=>m.cat))];
 const progress=Math.round(unlocked.length/milestones.length*100);
 return <>
  <Card accent={C.acc} style={{padding:16,marginTop:6,marginBottom:14}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
    <div>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>MILESTONES DÉBLOQUÉS</div>
    <div style={{display:"flex",alignItems:"baseline",gap:6,marginTop:2}}>
    <span style={{fontWeight:900,fontSize:28,color:C.acc,lineHeight:1}}>{unlocked.length}</span>
    <span style={{color:C.td,fontSize:12}}>/ {milestones.length}</span>
    </div>
    </div>
    <div style={{width:56,height:56,borderRadius:28,background:C.bg,border:`3px solid ${C.acc}44`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
    <span style={{fontWeight:900,fontSize:16,color:C.acc}}>{progress}%</span>
    <svg style={{position:"absolute",inset:-3}} width={62} height={62}><circle cx={31} cy={31} r={27} fill="none" stroke={C.brd} strokeWidth={3}/><circle cx={31} cy={31} r={27} fill="none" stroke={C.acc} strokeWidth={3} strokeDasharray={`${progress*1.7} 170`} strokeLinecap="round" transform="rotate(-90 31 31)" style={{transition:"stroke-dasharray .6s ease"}}/></svg>
    </div>
   </div>
   <PBar value={unlocked.length} max={milestones.length} color={C.acc} h={4}/>
  </Card>
  {unlocked.length>0&&<Sect title="Trophées" sub={`${unlocked.length} débloqués`}>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:6}}>
    {unlocked.sort((a,b)=>b.tier-a.tier).slice(0,showAll?999:12).map((m,i)=>
    <div key={m.id} className={`fu d${Math.min(i+1,8)}`} style={{background:TIER_BG[m.tier],border:`1px solid ${TIER_COLORS[m.tier]}22`,borderRadius:10,padding:"10px 8px",textAlign:"center",position:"relative",overflow:"hidden"}}>
    {m.tier>=4&&<div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 50% 0%,${TIER_COLORS[m.tier]}08,transparent 70%)`,pointerEvents:"none"}}/>}
    <div style={{fontSize:20,marginBottom:3,filter:m.tier>=5?"drop-shadow(0 0 4px rgba(251,191,36,.4))":"none"}}>{m.icon}</div>
    <div style={{fontWeight:700,fontSize:9,color:TIER_COLORS[m.tier],lineHeight:1.2}}>{m.label}</div>
    <div style={{fontSize:7,color:C.td,marginTop:2,lineHeight:1.2}}>{m.desc}</div>
    </div>
    )}
   </div>
   {unlocked.length>12&&!showAll&&<div style={{textAlign:"center",marginTop:8}}><Btn small v="ghost" onClick={()=>setShowAll(true)}>Voir tout ({unlocked.length})</Btn></div>}
  </Sect>}
  {nextUp.length>0&&<Sect title="Prochains paliers">
   {nextUp.map((m,i)=>
    <div key={m.id} className={`fu d${Math.min(i+1,4)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.card,borderRadius:8,border:`1px dashed ${C.brd}`,marginBottom:3,opacity:.7}}>
    <span style={{fontSize:16,filter:"grayscale(1) opacity(.5)"}}>{m.icon}</span>
    <div style={{flex:1}}>
    <div style={{fontWeight:600,fontSize:11,color:C.td}}>{m.label}</div>
    <div style={{fontSize:9,color:C.tm}}>{m.desc}</div>
    </div>
    <span style={{fontSize:8,color:C.td,background:C.card2,padding:"2px 6px",borderRadius:8}}>🔒</span>
    </div>
   )}
  </Sect>}
  <Sect title="Par catégorie">
   {cats.map(cat=>{
    const catMs=milestones.filter(m=>m.cat===cat);
    const catUnlocked=catMs.filter(m=>m.unlocked).length;
    return <div key={cat} className="fu" style={{marginBottom:8}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
    <span style={{fontSize:11,fontWeight:700}}>{MILESTONE_CATS[cat]||cat}</span>
    <span style={{fontSize:9,color:C.td}}>{catUnlocked}/{catMs.length}</span>
    </div>
    <div style={{display:"flex",gap:3}}>
    {catMs.sort((a,b)=>a.tier-b.tier).map(m=><div key={m.id} style={{flex:1,height:4,borderRadius:2,background:m.unlocked?TIER_COLORS[m.tier]:C.brd,transition:"background .3s"}} title={`${m.label}: ${m.desc}${m.unlocked?" ✓":" 🔒"}`}/>)}
    </div>
    </div>;
   })}
  </Sect>
 </>;
}
export function MilestonesCompact({milestones,max=5}){
 const unlocked=milestones.filter(m=>m.unlocked);
 if(unlocked.length===0)return null;
 const top=unlocked.sort((a,b)=>b.tier-a.tier).slice(0,max);
 return <div style={{display:"flex",gap:2,alignItems:"center"}}>
  {top.map(m=><span key={m.id} title={m.label} style={{fontSize:10,filter:m.tier>=4?"none":"opacity(.7)"}}>{m.icon}</span>)}
  {unlocked.length>max&&<span style={{fontSize:8,color:C.td}}>+{unlocked.length-max}</span>}
 </div>;
}
export function MilestoneCount({milestones}){
 const n=milestones.filter(m=>m.unlocked).length;
 if(n===0)return null;
 return <span style={{fontSize:8,color:C.acc,background:C.accD,padding:"1px 5px",borderRadius:8,fontWeight:700}}>🏆 {n}</span>;
}
/* PER-SOCIÉTÉ BANKING WIDGET — REDESIGNED */
export function SocBankWidget({bankData,onSync,soc}){
 const[txFilter,setTxFilter]=useState("all");
 const[searchTx,setSearchTx]=useState("");
 const[advancedMode,setAdvancedMode]=useState(false);
 const[txCatOverrides,setTxCatOverrides]=useState(()=>{try{return JSON.parse(localStorage.getItem(`scTxCat_${soc?.id}`)||"{}");}catch{return{};}});
 const[catDropdown,setCatDropdown]=useState(null);
 const[catDropPos,setCatDropPos]=useState(null);
 const[selectedTx,setSelectedTx]=useState(new Set());
 const saveCatOverride=(txId,catId)=>{const next={...txCatOverrides,[txId]:catId};setTxCatOverrides(next);try{localStorage.setItem(`scTxCat_${soc?.id}`,JSON.stringify(next));}catch{}setCatDropdown(null);};
 const getCat=(tx)=>txCatOverrides[tx.id]?TX_CATEGORIES.find(c=>c.id===txCatOverrides[tx.id])||categorizeTransaction(tx):categorizeTransaction(tx);
 if(!bankData)return <Card style={{textAlign:"center",padding:20}}>
  <div style={{fontSize:28,marginBottom:6}}>🏦</div>
  <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>Revolut Business</div>
  <div style={{color:C.td,fontSize:11,marginBottom:10}}>Connecte ton compte Revolut</div>
  <Btn small onClick={onSync}>Charger données demo</Btn>
 </Card>;
 const{accounts:allAccounts,transactions:allTransactions,balance,monthly,lastSync,isDemo}=bankData;
 const excl=EXCLUDED_ACCOUNTS[soc?.id]||[];
 const transactions=allTransactions.filter(t=>{const leg=t.legs?.[0];return!leg||!excl.includes(leg.account_id);});
 const cm=curM(),pm2=prevM(cm);
 const cmData=monthly?.[cm],pmData=monthly?.[pm2];
 const now2=new Date();const mStart=new Date(now2.getFullYear(),now2.getMonth(),1);
 const monthTx=transactions.filter(tx=>{const leg=tx.legs?.[0];if(!leg)return false;if(excl.includes(leg.account_id))return false;return new Date(tx.created_at)>=mStart;});
 const entriesMois=cmData?.income||0;
 const sortiesMois=cmData?.expense||0;
 // Filter logic
 let filteredTx=txFilter==="in"?monthTx.filter(tx=>(tx.legs?.[0]?.amount||0)>0):txFilter==="out"?monthTx.filter(tx=>(tx.legs?.[0]?.amount||0)<0):monthTx;
 if(searchTx.trim()){const q=searchTx.toLowerCase();filteredTx=filteredTx.filter(tx=>{const leg=tx.legs?.[0];const desc=(leg?.description||tx.reference||"").toLowerCase();return desc.includes(q);});}
 if(advancedMode&&txFilter!=="all"&&txFilter!=="in"&&txFilter!=="out"){filteredTx=filteredTx.filter(tx=>getCat(tx).id===txFilter);}
 const catColors={"revenus":C.g,"loyer":"#f59e0b","pub":"#ec4899","abonnements":C.b,"equipe":C.o,"transfert":"#6366f1","dividendes":"#7c3aed","autres":C.td};
 const catIconMap={"revenus":"💰","loyer":"🏠","pub":"📢","abonnements":"💻","equipe":"👤","transfert":"📤","dividendes":"🏛️","autres":"📦"};
 return <>
  {isDemo&&<div className="fu" style={{background:C.oD,border:`1px solid ${C.o}22`,borderRadius:10,padding:"6px 12px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{color:C.o,fontSize:10,fontWeight:600}}>⚠ Demo — Ajoute le token Revolut via l'admin</span><Btn small v="ghost" onClick={onSync} style={{fontSize:9}}>↻</Btn></div>}
  {/* 3 KPI cards */}
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
   <div className="glass-card-static" style={{padding:20,textAlign:"center"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:6,fontFamily:FONT_TITLE}}>SOLDE ACTUEL</div>
    <div style={{fontWeight:900,fontSize:26,color:C.g,lineHeight:1}}>{fmt(balance)}€</div>
    <div style={{color:C.tm,fontSize:9,marginTop:4}}>Sync {ago(lastSync)}</div>
   </div>
   <div className="glass-card-static" style={{padding:20,textAlign:"center"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:6,fontFamily:FONT_TITLE}}>ENTRÉES CE MOIS</div>
    <div style={{fontWeight:900,fontSize:26,color:C.g,lineHeight:1}}>+{fmt(entriesMois)}€</div>
    {pmData&&<div style={{fontSize:9,fontWeight:600,marginTop:4,color:entriesMois>=pmData.income?C.g:C.r}}>{entriesMois>=pmData.income?"↑":"↓"} {fmt(Math.abs(entriesMois-pmData.income))}€ vs N-1</div>}
   </div>
   <div className="glass-card-static" style={{padding:20,textAlign:"center"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:6,fontFamily:FONT_TITLE}}>SORTIES CE MOIS</div>
    <div style={{fontWeight:900,fontSize:26,color:C.r,lineHeight:1}}>-{fmt(sortiesMois)}€</div>
    {pmData&&<div style={{fontSize:9,fontWeight:600,marginTop:4,color:sortiesMois<=pmData.expense?C.g:C.r}}>{sortiesMois<=pmData.expense?"↓":"↑"} {fmt(Math.abs(sortiesMois-pmData.expense))}€ vs N-1</div>}
   </div>
  </div>
  {/* Filter tabs + search + advanced toggle */}
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
   <div style={{display:"flex",gap:4}}>
    {[{id:"all",l:"Tout"},{id:"in",l:"Entrées ↑"},{id:"out",l:"Sorties ↓"}].map(f=><button key={f.id} onClick={()=>setTxFilter(f.id)} style={{padding:"6px 14px",borderRadius:8,fontSize:10,fontWeight:txFilter===f.id?700:500,border:`1px solid ${txFilter===f.id?C.acc:C.brd}`,background:txFilter===f.id?C.accD:"transparent",color:txFilter===f.id?C.acc:C.td,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}}>{f.l}</button>)}
   </div>
   <div style={{flex:1,minWidth:120,position:"relative"}}>
    <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:12,color:C.td}}>🔍</span>
    <input value={searchTx} onChange={e=>setSearchTx(e.target.value)} placeholder="Rechercher..." style={{width:"100%",padding:"7px 10px 7px 30px",borderRadius:8,border:`1px solid ${C.brd}`,background:"rgba(6,6,11,0.6)",color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
   </div>
   <button onClick={()=>setAdvancedMode(!advancedMode)} style={{padding:"6px 12px",borderRadius:8,fontSize:9,fontWeight:600,border:`1px solid ${advancedMode?C.acc:C.brd}`,background:advancedMode?C.accD:"transparent",color:advancedMode?C.acc:C.td,cursor:"pointer",fontFamily:FONT}}>⚙ Mode avancé</button>
  </div>
  {/* Advanced: category pills + select all */}
  {advancedMode&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
   {TX_CATEGORIES.filter(c=>c.id!=="all").map(c=><span key={c.id} onClick={()=>setTxFilter(txFilter===c.id?"all":c.id)} style={{padding:"3px 10px",borderRadius:12,fontSize:9,fontWeight:600,cursor:"pointer",background:txFilter===c.id?(catColors[c.id]||C.acc)+"22":"transparent",color:txFilter===c.id?(catColors[c.id]||C.acc):C.td,border:`1px solid ${txFilter===c.id?(catColors[c.id]||C.acc):C.brd}`,transition:"all .15s"}}>{c.label}</span>)}
   <span onClick={()=>{if(selectedTx.size===filteredTx.length)setSelectedTx(new Set());else setSelectedTx(new Set(filteredTx.map(t=>t.id)));}} style={{padding:"3px 10px",borderRadius:12,fontSize:9,fontWeight:600,cursor:"pointer",color:C.acc,border:`1px solid ${C.acc}`,background:selectedTx.size>0?C.acc+"22":"transparent",marginLeft:"auto"}}>{selectedTx.size>0?"☐ Désélect.":"☑ Tout"}</span>
  </div>}
  {/* Transaction list */}
  <div style={{marginBottom:8}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:8,fontFamily:FONT_TITLE}}>{filteredTx.length} TRANSACTIONS</div>
   {filteredTx.length===0?<div style={{color:C.td,fontSize:11,padding:20,textAlign:"center"}}>Aucune transaction</div>:filteredTx.map((tx,i)=>{const leg=tx.legs?.[0];if(!leg)return null;const isIn=leg.amount>0;const cat=getCat(tx);const isDiv=cat.id==="dividendes";
    return <div key={tx.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:selectedTx.has(tx.id)?C.acc+"08":"transparent",borderRadius:8,borderBottom:`1px solid ${C.brd}08`,marginBottom:1,transition:"background .15s"}}>
    {advancedMode&&<input type="checkbox" checked={selectedTx.has(tx.id)} onChange={()=>setSelectedTx(prev=>{const n=new Set(prev);n.has(tx.id)?n.delete(tx.id):n.add(tx.id);return n;})} style={{width:14,height:14,accentColor:C.acc,cursor:"pointer",flexShrink:0}} />}
    <span style={{width:28,height:28,borderRadius:8,background:isIn?C.gD:isDiv?"#7c3aed15":C.rD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{catIconMap[cat.id]||(isIn?"↑":"↓")}</span>
    <div style={{flex:1,minWidth:0}}>
     <div style={{fontWeight:600,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.t}}>{leg.description||tx.reference||"—"}</div>
     <div style={{fontSize:9,color:C.td}}>{new Date(tx.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</div>
    </div>
    <span style={{fontWeight:700,fontSize:12,color:isIn?C.g:C.r,whiteSpace:"nowrap"}}>{isIn?"+":""}{fmt(leg.amount)}€</span>
    </div>;})}
  </div>
  {/* Bulk categorization bar */}
  {advancedMode&&selectedTx.size>0&&<div style={{position:"sticky",bottom:0,background:"rgba(14,14,22,.9)",backdropFilter:"blur(20px)",borderTop:`1px solid ${C.brd}`,padding:"8px 12px",display:"flex",alignItems:"center",gap:8,borderRadius:"0 0 10px 10px"}}>
    <span style={{fontSize:11,fontWeight:600}}>{selectedTx.size} sélectionnée{selectedTx.size>1?"s":""}</span>
    {TX_CATEGORIES.filter(c=>c.id!=="all").map(c=><button key={c.id} onClick={()=>{selectedTx.forEach(id=>saveCatOverride(id,c.id));setSelectedTx(new Set());}} style={{fontSize:9,padding:"4px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",gap:3}}><span>{c.icon}</span><span>{c.label.replace(/^[^\s]+\s/,"")}</span></button>)}
    <button onClick={()=>setSelectedTx(new Set())} style={{marginLeft:"auto",fontSize:9,color:C.td,background:"none",border:"none",cursor:"pointer",fontFamily:FONT}}>Désélectionner</button>
  </div>}
 </>;
}
/* RAPPORTS PANEL */
export function RapportsPanel({soc,socBankData,ghlData,clients,reps,allM}){
 const[expandedMonth,setExpandedMonth]=useState(null);
 const[notesMap,setNotesMap]=useState(()=>{try{return JSON.parse(localStorage.getItem(`scRapportNotes_${soc?.id}`)||"{}");}catch{return{};}});
 const saveNote=(month,text)=>{const next={...notesMap,[month]:text};setNotesMap(next);try{localStorage.setItem(`scRapportNotes_${soc?.id}`,JSON.stringify(next));}catch{}};
 const cm=curM();
 const months=useMemo(()=>{const ms=[];let m=cm;for(let i=0;i<12;i++){ms.push(m);m=prevM(m);}return ms;},[cm]);
 const getMonthData=(month)=>{
  const txs=(socBankData?.transactions||[]).filter(t=>(t.created_at||"").startsWith(month));
  const excl=EXCLUDED_ACCOUNTS[soc?.id]||[];
  const filtered=txs.filter(t=>{const leg=t.legs?.[0];return leg&&!excl.includes(leg.account_id);});
  const ca=filtered.filter(t=>(t.legs?.[0]?.amount||0)>0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0);
  const charges=Math.abs(filtered.filter(t=>(t.legs?.[0]?.amount||0)<0).reduce((a,t)=>a+(t.legs?.[0]?.amount||0),0));
  const marge=ca-charges;
  // Top 5 clients by collected
  const clientTotals={};filtered.filter(t=>(t.legs?.[0]?.amount||0)>0).forEach(t=>{const desc=(t.legs?.[0]?.description||t.reference||"").trim();clientTotals[desc]=(clientTotals[desc]||0)+(t.legs?.[0]?.amount||0);});
  const topClients=Object.entries(clientTotals).sort((a,b)=>b[1]-a[1]).slice(0,5);
  // Top 5 expenses
  const expTotals={};filtered.filter(t=>(t.legs?.[0]?.amount||0)<0).forEach(t=>{const desc=(t.legs?.[0]?.description||t.reference||"").trim();expTotals[desc]=(expTotals[desc]||0)+Math.abs(t.legs?.[0]?.amount||0);});
  const topExpenses=Object.entries(expTotals).sort((a,b)=>b[1]-a[1]).slice(0,5);
  // Clients won/lost
  const gd=ghlData?.[soc.id];
  const wonThisMonth=(gd?.opportunities||[]).filter(o=>o.status==="won"&&(o.updatedAt||o.createdAt||"").startsWith(month)).length;
  const lostThisMonth=(gd?.opportunities||[]).filter(o=>o.status==="lost"&&(o.updatedAt||o.createdAt||"").startsWith(month)).length;
  return{ca,charges,marge,topClients,topExpenses,wonThisMonth,lostThisMonth,treso:socBankData?.balance||0,txCount:filtered.length};
 };
 // MRR tracking
 const activeClients=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active"&&c.billing);
 const mrrMonths=months.slice(0,6).reverse();
 const mrrData=useMemo(()=>{
  return activeClients.map(cl=>{
   const cn=(cl.name||"").toLowerCase().trim();
   const monthPayments={};
   mrrMonths.forEach(mo=>{
    const txs=(socBankData?.transactions||[]).filter(t=>(t.created_at||"").startsWith(mo));
    const found=txs.some(t=>{const leg=t.legs?.[0];if(!leg||leg.amount<=0)return false;const desc=(leg.description||t.reference||"").toLowerCase();return cn.length>2&&desc.includes(cn);});
    monthPayments[mo]=found;
   });
   return{client:cl,payments:monthPayments,billing:clientMonthlyRevenue(cl)};
  });
 },[activeClients,socBankData,mrrMonths]);
 const mrrTheorique=activeClients.reduce((a,c)=>a+clientMonthlyRevenue(c),0);
 return <div className="fu">
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
   <div><h2 style={{color:C.t,fontSize:13,fontWeight:800,margin:0,fontFamily:FONT_TITLE}}>📋 RAPPORTS MENSUELS</h2><p style={{color:C.td,fontSize:10,margin:"2px 0 0"}}>Bilans financiers auto-générés</p></div>
   <ReplayMensuel soc={soc} reps={reps} allM={allM} socBank={socBankData?{[soc.id]:socBankData}:{}} clients={clients} ghlData={ghlData}/>
  </div>
  {months.map((month,mi)=>{
   const d=getMonthData(month);const isExpanded=expandedMonth===month||mi===0;const isCurrent=mi===0;
   return <div key={month} className={`glass-card-static fu d${Math.min(mi+1,6)}`} style={{padding:isCurrent?20:14,marginBottom:10,cursor:isCurrent?undefined:"pointer"}} onClick={!isCurrent?()=>setExpandedMonth(expandedMonth===month?null:month):undefined}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:isExpanded?12:0}}>
     <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:isCurrent?16:12}}>{isCurrent?"📊":"📄"}</span>
      <div>
       <div style={{fontWeight:800,fontSize:isCurrent?14:12,color:C.t}}>{ml(month)}{isCurrent?" (en cours)":""}</div>
       {!isExpanded&&<div style={{fontSize:9,color:C.td}}>CA {fmt(d.ca)}€ · Charges {fmt(d.charges)}€ · Marge {fmt(d.marge)}€</div>}
      </div>
     </div>
     {!isCurrent&&<span style={{fontSize:11,color:C.td}}>{isExpanded?"▲":"▼"}</span>}
    </div>
    {isExpanded&&<>
     {/* KPIs */}
     <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
      <div style={{padding:10,background:C.gD,borderRadius:8,textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:C.g}}>{fmt(d.ca)}€</div><div style={{fontSize:8,color:C.g,fontWeight:600}}>CA</div></div>
      <div style={{padding:10,background:C.rD,borderRadius:8,textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:C.r}}>{fmt(d.charges)}€</div><div style={{fontSize:8,color:C.r,fontWeight:600}}>Charges</div></div>
      <div style={{padding:10,background:d.marge>=0?C.gD:C.rD,borderRadius:8,textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:d.marge>=0?C.g:C.r}}>{fmt(d.marge)}€</div><div style={{fontSize:8,color:C.td,fontWeight:600}}>Marge</div></div>
      <div style={{padding:10,background:C.bD,borderRadius:8,textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:C.b}}>{d.txCount}</div><div style={{fontSize:8,color:C.td,fontWeight:600}}>Transactions</div></div>
     </div>
     {/* Top clients + expenses side by side */}
     <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
      <div>
       <div style={{fontSize:9,fontWeight:700,color:C.g,marginBottom:6}}>TOP CLIENTS</div>
       {d.topClients.length===0?<div style={{fontSize:10,color:C.td}}>—</div>:d.topClients.map(([n,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${C.brd}08`}}><span style={{fontSize:10,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%"}}>{n}</span><span style={{fontSize:10,fontWeight:700,color:C.g}}>{fmt(v)}€</span></div>)}
      </div>
      <div>
       <div style={{fontSize:9,fontWeight:700,color:C.r,marginBottom:6}}>TOP DÉPENSES</div>
       {d.topExpenses.length===0?<div style={{fontSize:10,color:C.td}}>—</div>:d.topExpenses.map(([n,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${C.brd}08`}}><span style={{fontSize:10,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%"}}>{n}</span><span style={{fontSize:10,fontWeight:700,color:C.r}}>{fmt(v)}€</span></div>)}
      </div>
     </div>
     {/* Won/lost */}
     <div style={{display:"flex",gap:12,marginBottom:12}}>
      <span style={{fontSize:10,color:C.g,fontWeight:600}}>✅ {d.wonThisMonth} client{d.wonThisMonth>1?"s":""} gagné{d.wonThisMonth>1?"s":""}</span>
      <span style={{fontSize:10,color:C.r,fontWeight:600}}>❌ {d.lostThisMonth} perdu{d.lostThisMonth>1?"s":""}</span>
     </div>
     {/* Objectifs vs Réalité */}
     {(soc.obj||soc.monthlyGoal)>0&&(()=>{const obj=soc.obj||soc.monthlyGoal||0;const atteint=d.ca>=obj;return <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:atteint?C.gD:C.rD,borderRadius:8,marginBottom:12}}>
      <span style={{fontSize:14}}>{atteint?"✅":"❌"}</span>
      <div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:atteint?C.g:C.r}}>{atteint?"Objectif atteint":"Non atteint"}</div><div style={{fontSize:9,color:C.td}}>Objectif: {fmt(obj)}€ · Réalisé: {fmt(d.ca)}€ ({obj>0?Math.round(d.ca/obj*100):0}%)</div></div>
     </div>;})()}
     {/* Publicité Meta */}
     {(()=>{let metaD=null;try{metaD=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${month}`));}catch{}
      if(!metaD||!metaD.spend)return null;
      const sp3=metaD.spend||0,lds3=metaD.leads||0,rev3=metaD.revenue||0;
      const cpl3=lds3>0?sp3/lds3:0,roas3=sp3>0?rev3/sp3:0;
      let metaPD=null;try{metaPD=JSON.parse(localStorage.getItem(`metaAds_${soc.id}_${prevM(month)}`));}catch{}
      const pCpl3=metaPD&&metaPD.leads>0?metaPD.spend/metaPD.leads:0;
      const pRoas3=metaPD&&metaPD.spend>0?metaPD.revenue/metaPD.spend:0;
      return <div style={{padding:10,background:C.accD,borderRadius:8,marginBottom:12,border:`1px solid ${C.acc}22`}}>
       <div style={{fontSize:9,fontWeight:700,color:C.acc,marginBottom:6}}>📣 PUBLICITÉ META</div>
       <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:600}}>Budget: {fmt(sp3)}€</span>
        <span style={{fontSize:10,fontWeight:600}}>Leads: {lds3}</span>
        <span style={{fontSize:10,fontWeight:600,color:cpl3>0&&pCpl3>0?(cpl3<=pCpl3?C.g:C.r):C.t}}>CPL: {cpl3.toFixed(2)}€{pCpl3>0?` (${cpl3<=pCpl3?"↓":"↑"})`:""}</span>
        <span style={{fontSize:10,fontWeight:600,color:roas3>=2?C.g:roas3>=1?C.o:C.r}}>ROAS: {roas3.toFixed(2)}x{pRoas3>0?` (${roas3>=pRoas3?"↑":"↓"})`:""}</span>
       </div>
      </div>;
     })()}
     {/* Export PDF */}
     <button onClick={(e)=>{e.stopPropagation();const logo=hold?.brand?.logoUrl||"";const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Rapport ${ml(month)} — ${soc.nom}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a}h1{color:#FFAA00;font-size:24px}h2{color:#333;font-size:16px;margin-top:20px}.kpi{display:inline-block;padding:12px 20px;margin:6px;background:#f5f5f5;border-radius:8px;text-align:center}.kpi .val{font-size:22px;font-weight:900}.kpi .lbl{font-size:11px;color:#666}table{width:100%;border-collapse:collapse;margin-top:10px}td,th{padding:6px 10px;border-bottom:1px solid #eee;text-align:left;font-size:12px}@media print{body{padding:20px}}</style></head><body>${logo?`<img src="${logo}" style="height:40px;margin-bottom:12px"/>`:""}
<h1>Rapport ${ml(month)}</h1><p>${soc.nom} — ${soc.porteur}</p>
<div><div class="kpi"><div class="val" style="color:#22c55e">${fmt(d.ca)}€</div><div class="lbl">CA</div></div><div class="kpi"><div class="val" style="color:#ef4444">${fmt(d.charges)}€</div><div class="lbl">Charges</div></div><div class="kpi"><div class="val" style="color:${d.marge>=0?"#22c55e":"#ef4444"}">${fmt(d.marge)}€</div><div class="lbl">Marge</div></div></div>
<h2>Top Clients</h2><table>${d.topClients.map(([n,v])=>`<tr><td>${n}</td><td style="font-weight:700;color:#22c55e">${fmt(v)}€</td></tr>`).join("")}</table>
<h2>Top Dépenses</h2><table>${d.topExpenses.map(([n,v])=>`<tr><td>${n}</td><td style="font-weight:700;color:#ef4444">${fmt(v)}€</td></tr>`).join("")}</table>
${(soc.obj||0)>0?`<h2>Objectif</h2><p>${d.ca>=(soc.obj||0)?"✅ Atteint":"❌ Non atteint"} — ${fmt(d.ca)}€ / ${fmt(soc.obj)}€</p>`:""}
<p style="margin-top:30px;color:#999;font-size:10px">MRR théorique: ${fmt(mrrTheorique)}€ · Généré le ${new Date().toLocaleDateString("fr-FR")}</p></body></html>`;const w=window.open("","_blank");w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),500);}} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${C.acc}`,background:C.accD,color:C.acc,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:FONT,marginBottom:12}}>📥 Exporter PDF</button>
     {/* Notes per month */}
     <div style={{marginTop:8}}>
      <label style={{fontSize:9,fontWeight:700,color:C.td,letterSpacing:.5,display:"block",marginBottom:4}}>📝 NOTES DU MOIS</label>
      <textarea value={notesMap[month]||""} onChange={e=>saveNote(month,e.target.value)} placeholder="Ajouter vos observations, commentaires..." style={{width:"100%",minHeight:isCurrent?80:50,padding:10,borderRadius:8,border:`1px solid ${C.brd}`,background:"rgba(6,6,11,0.6)",color:C.t,fontSize:11,fontFamily:FONT,outline:"none",resize:"vertical"}}/>
     </div>
    </>}
   </div>;
  })}
  {/* Objectifs summary */}
  {(soc.obj||soc.monthlyGoal)>0&&(()=>{const obj=soc.obj||soc.monthlyGoal||0;const results=months.map(mo=>getMonthData(mo)).filter(d=>d.txCount>0);const atteints=results.filter(d=>d.ca>=obj).length;const total=results.length;const pctObj=total>0?Math.round(atteints/total*100):0;return <div className="glass-card-static" style={{padding:16,marginTop:12,marginBottom:4,display:"flex",alignItems:"center",gap:12}}>
   <span style={{fontSize:24}}>{pctObj>=70?"🏆":pctObj>=40?"📊":"📉"}</span>
   <div><div style={{fontWeight:800,fontSize:12,color:pctObj>=70?C.g:pctObj>=40?C.o:C.r}}>Objectifs atteints: {atteints}/{total} mois ({pctObj}%)</div><div style={{fontSize:9,color:C.td}}>Objectif mensuel: {fmt(obj)}€</div></div>
  </div>;})()}
  {/* MRR TRACKING */}
  {activeClients.length>0&&<div className="glass-card-static" style={{padding:20,marginTop:16}}>
   <div style={{fontSize:9,fontWeight:700,color:C.v,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>📊 SUIVI MRR — RÉCURRENCE CLIENTS</div>
   <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
     <thead><tr>
      <th style={{textAlign:"left",padding:"6px 8px",borderBottom:`1px solid ${C.brd}`,color:C.td,fontWeight:700,fontSize:9}}>Client</th>
      <th style={{textAlign:"right",padding:"6px 4px",borderBottom:`1px solid ${C.brd}`,color:C.td,fontWeight:700,fontSize:8}}>€/m</th>
      {mrrMonths.map(mo=><th key={mo} style={{textAlign:"center",padding:"6px 4px",borderBottom:`1px solid ${C.brd}`,color:C.td,fontWeight:700,fontSize:8,minWidth:50}}>{ml(mo).split(" ")[0]}</th>)}
     </tr></thead>
     <tbody>
      {mrrData.map(({client:cl,payments,billing})=><tr key={cl.id}>
       <td style={{padding:"5px 8px",borderBottom:`1px solid ${C.brd}08`,fontWeight:600,color:C.t,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cl.name}</td>
       <td style={{padding:"5px 4px",borderBottom:`1px solid ${C.brd}08`,textAlign:"right",fontWeight:700,color:C.acc}}>{fmt(billing)}€</td>
       {mrrMonths.map(mo=><td key={mo} style={{padding:"5px 4px",borderBottom:`1px solid ${C.brd}08`,textAlign:"center"}}>{payments[mo]?<span style={{color:C.g}}>✅</span>:<span style={{color:C.r,background:C.rD,padding:"1px 4px",borderRadius:4}}>❌</span>}</td>)}
      </tr>)}
      <tr style={{fontWeight:800}}>
       <td style={{padding:"8px 8px",color:C.t}}>MRR Théorique</td>
       <td style={{padding:"8px 4px",textAlign:"right",color:C.acc}}>{fmt(mrrTheorique)}€</td>
       {mrrMonths.map(mo=>{const real=mrrData.filter(d=>d.payments[mo]).reduce((a,d)=>a+d.billing,0);return <td key={mo} style={{padding:"8px 4px",textAlign:"center",color:real>=mrrTheorique?C.g:C.r,fontSize:10}}>{fmt(real)}€</td>;})}
      </tr>
     </tbody>
    </table>
   </div>
  </div>}
 </div>;
}
/* SYNERGIES MAP */
export function SynergiesPanel({socs,synergies,saveSynergies}){
 const[editing,setEditing]=useState(null);
 const actS=socs.filter(s=>s.stat==="active"&&s.id!=="eco");
 const totalValue=synergies.filter(s=>s.status==="won").reduce((a,s)=>a+pf(s.value),0);
 const activeCount=synergies.filter(s=>s.status==="active").length;
 const matrix=useMemo(()=>{
  const m={};actS.forEach(s=>{m[s.id]={out:{},in:{}};});
  synergies.forEach(sy=>{
   if(m[sy.from])m[sy.from].out[sy.to]=(m[sy.from].out[sy.to]||0)+1;
   if(m[sy.to])m[sy.to].in[sy.from]=(m[sy.to].in[sy.from]||0)+1;
  });return m;
 },[actS,synergies]);
 const addSyn=()=>setEditing({id:uid(),from:actS[0]?.id||"",to:actS[1]?.id||"",type:"referral",desc:"",value:0,date:new Date().toISOString().slice(0,10),status:"active"});
 const saveSyn=()=>{if(!editing)return;const idx=synergies.findIndex(s=>s.id===editing.id);saveSynergies(idx>=0?synergies.map(s=>s.id===editing.id?editing:s):[...synergies,editing]);setEditing(null);};
 return <>
  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6,marginBottom:12,flexWrap:"wrap"}}>
   <KPI label="Valeur totale" value={`${fmt(totalValue)}€`} accent={C.g} small delay={1}/>
   <KPI label="En cours" value={activeCount} accent={C.b} small delay={2}/>
   <KPI label="Total" value={synergies.length} accent={C.acc} small delay={3}/>
   <Btn small onClick={addSyn}>+ Synergie</Btn>
  </div>
  <Card style={{padding:14,marginBottom:12}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>CARTE DES SYNERGIES</div>
   <div style={{display:"grid",gridTemplateColumns:`40px repeat(${actS.length},1fr)`,gap:1,fontSize:8}}>
    <div/>
    {actS.map(s=><div key={s.id} style={{textAlign:"center",fontWeight:700,color:s.color,padding:3,overflow:"hidden",textOverflow:"ellipsis"}}>{s.nom.slice(0,6)}</div>)}
    {actS.map(row=><Fragment key={row.id}>
    <div style={{fontWeight:700,color:row.color,padding:3,display:"flex",alignItems:"center"}}>{row.nom.slice(0,5)}</div>
    {actS.map(col=>{
    const count=(matrix[row.id]?.out[col.id]||0);
    const isself=row.id===col.id;
    return <div key={col.id} style={{textAlign:"center",padding:4,background:isself?C.tm:count>0?`${C.acc}${Math.min(99,count*25).toString(16).padStart(2,"0")}`:C.bg,borderRadius:3,color:count>0?C.acc:C.tm,fontWeight:count>0?700:400,cursor:count>0?"pointer":"default",border:`1px solid ${C.brd}`}} title={!isself?`${row.nom} → ${col.nom}: ${count} synergies`:""}>{isself?"·":count||""}</div>;
    })}
    </Fragment>)}
   </div>
  </Card>
  <Sect title="Historique">
   {synergies.sort((a,b)=>new Date(b.date)-new Date(a.date)).map((sy,i)=>{
    const sf=socs.find(s=>s.id===sy.from);const st=socs.find(s=>s.id===sy.to);const tp=SYN_TYPES[sy.type]||SYN_TYPES.referral;const ss=SYN_STATUS[sy.status]||SYN_STATUS.active;
    return <div key={sy.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3,cursor:"pointer"}} onClick={()=>setEditing({...sy})}>
    <span style={{fontSize:12}}>{tp.icon}</span>
    <div style={{flex:1,minWidth:0}}>
    <div style={{fontSize:11,fontWeight:600}}><span style={{color:sf?.color}}>{sf?.nom}</span> → <span style={{color:st?.color}}>{st?.nom}</span></div>
    <div style={{fontSize:9,color:C.td,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sy.desc}</div>
    </div>
    {pf(sy.value)>0&&<span style={{fontSize:10,fontWeight:700,color:C.g}}>{fmt(sy.value)}€</span>}
    <span style={{fontSize:8,color:ss.color,background:ss.color+"18",padding:"1px 5px",borderRadius:6,fontWeight:600}}>{ss.label}</span>
    </div>;
   })}
  </Sect>
  <Modal open={!!editing} onClose={()=>setEditing(null)} title="Synergie">{editing&&<>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Sel label="De" value={editing.from} onChange={v=>setEditing({...editing,from:v})} options={actS.map(s=>({v:s.id,l:s.nom}))}/>
    <Sel label="Vers" value={editing.to} onChange={v=>setEditing({...editing,to:v})} options={actS.map(s=>({v:s.id,l:s.nom}))}/>
    <Sel label="Type" value={editing.type} onChange={v=>setEditing({...editing,type:v})} options={Object.entries(SYN_TYPES).map(([k,v])=>({v:k,l:`${v.icon} ${v.label}`}))}/>
    <Sel label="Statut" value={editing.status} onChange={v=>setEditing({...editing,status:v})} options={Object.entries(SYN_STATUS).map(([k,v])=>({v:k,l:v.label}))}/>
    <Inp label="Valeur" type="number" value={editing.value} onChange={v=>setEditing({...editing,value:pf(v)})} suffix="€"/>
    <Inp label="Date" type="date" value={editing.date} onChange={v=>setEditing({...editing,date:v})}/>
   </div>
   <Inp label="Description" value={editing.desc} onChange={v=>setEditing({...editing,desc:v})} textarea placeholder="Détails de la synergie…"/>
   <div style={{display:"flex",gap:8,marginTop:12}}>
    <Btn onClick={saveSyn}>Sauver</Btn><Btn v="secondary" onClick={()=>setEditing(null)}>Annuler</Btn>
    {synergies.find(s=>s.id===editing.id)&&<Btn v="danger" onClick={()=>{saveSynergies(synergies.filter(s=>s.id!==editing.id));setEditing(null);}} style={{marginLeft:"auto"}}>Supprimer</Btn>}
   </div>
  </>}</Modal>
 </>;
}
/* KNOWLEDGE BASE */
export function KnowledgeBase({socs,kb,saveKb,isPorteur,socId}){
 const[cat,setCat]=useState("all");const[search,setSearch]=useState("");const[editing,setEditing]=useState(null);const[expanded,setExpanded]=useState(null);
 const filtered=kb.filter(k=>(cat==="all"||k.cat===cat)&&(search===""||k.title.toLowerCase().includes(search.toLowerCase())||k.tags?.some(t=>t.includes(search.toLowerCase()))||k.content.toLowerCase().includes(search.toLowerCase())));
 const addEntry=()=>setEditing({id:uid(),title:"",cat:"tip",author:socId||"eco",content:"",tags:[],date:new Date().toISOString().slice(0,10),likes:0});
 const saveEntry=()=>{if(!editing||!editing.title.trim())return;const idx=kb.findIndex(k=>k.id===editing.id);saveKb(idx>=0?kb.map(k=>k.id===editing.id?editing:k):[...kb,editing]);setEditing(null);};
 const likeEntry=(id)=>saveKb(kb.map(k=>k.id===id?{...k,likes:(k.likes||0)+1}:k));
 return <>
  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,marginBottom:12,flexWrap:"wrap"}}>
   <div style={{flex:"1 1 140px",position:"relative"}}>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" style={{width:"100%",background:C.bg,border:`1px solid ${C.brd}`,borderRadius:8,color:C.t,padding:"7px 10px 7px 28px",fontSize:11,fontFamily:FONT,outline:"none"}}/>
    <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.td}}>🔍</span>
   </div>
   <select value={cat} onChange={e=>setCat(e.target.value)} style={{background:C.bg,border:`1px solid ${C.brd}`,borderRadius:8,color:C.t,padding:"6px 10px",fontSize:11,fontFamily:FONT,outline:"none"}}><option value="all">Toutes catégories</option>{Object.entries(KB_CATS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select>
   <Btn small onClick={addEntry}>+ Contribution</Btn>
  </div>
  <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>
   {Object.entries(KB_CATS).map(([k,v])=>{const cnt=kb.filter(e=>e.cat===k).length;
    return <div key={k} onClick={()=>setCat(cat===k?"all":k)} style={{padding:"4px 10px",background:cat===k?v.color+"18":C.card2,border:`1px solid ${cat===k?v.color+"44":C.brd}`,borderRadius:8,fontSize:10,fontWeight:600,color:cat===k?v.color:C.td,cursor:"pointer",transition:"all .15s"}}>
    {v.label} <span style={{fontWeight:800}}>{cnt}</span>
    </div>;
   })}
  </div>
  {filtered.length===0&&<div className="fu" style={{textAlign:"center",padding:40,color:C.td}}>Aucun résultat</div>}
  {filtered.sort((a,b)=>(b.likes||0)-(a.likes||0)).map((entry,i)=>{
   const s=socs.find(x=>x.id===entry.author);const catInfo=KB_CATS[entry.cat]||KB_CATS.tip;const isOpen=expanded===entry.id;
   return <Card key={entry.id} accent={catInfo.color} style={{marginBottom:6,padding:12,cursor:"pointer"}} delay={Math.min(i+1,8)} onClick={()=>setExpanded(isOpen?null:entry.id)}>
    <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
    <span style={{fontSize:16,marginTop:2}}>{catInfo.label.split(" ")[0]}</span>
    <div style={{flex:1,minWidth:0}}>
    <div style={{fontWeight:700,fontSize:12,color:C.t,marginBottom:2}}>{entry.title}</div>
    <div style={{display:"flex",gap:6,alignItems:"center",fontSize:9,color:C.td}}>
    {s&&<span style={{color:s.color,fontWeight:600}}>{s.nom}</span>}
    <span>{new Date(entry.date).toLocaleDateString("fr-FR")}</span>
    {entry.tags?.map(t=><span key={t} style={{background:C.card2,padding:"0 4px",borderRadius:3}}>#{t}</span>)}
    </div>
    {isOpen&&<div style={{marginTop:8,padding:"10px 12px",background:C.bg,borderRadius:8,fontSize:11,color:C.t,lineHeight:1.6,whiteSpace:"pre-wrap",border:`1px solid ${C.brd}`}}>{entry.content}</div>}
    </div>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
    <button onClick={e=>{e.stopPropagation();likeEntry(entry.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,padding:2}}>👍</button>
    <span style={{fontSize:10,fontWeight:700,color:C.acc}}>{entry.likes||0}</span>
    </div>
    </div>
    {isOpen&&<div style={{display:"flex",gap:4,marginTop:8}}>
    <Btn small v="ghost" onClick={e=>{e.stopPropagation();setEditing({...entry});}}>✏️ Modifier</Btn>
    <Btn small v="ghost" onClick={e=>{e.stopPropagation();saveKb(kb.filter(k=>k.id!==entry.id));}}>🗑</Btn>
    </div>}
   </Card>;
  })}
  <Modal open={!!editing} onClose={()=>setEditing(null)} title="Knowledge Base">{editing&&<>
   <Inp label="Titre" value={editing.title} onChange={v=>setEditing({...editing,title:v})} placeholder="Ex: Playbook Cold Outreach"/>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Sel label="Catégorie" value={editing.cat} onChange={v=>setEditing({...editing,cat:v})} options={Object.entries(KB_CATS).map(([k,v])=>({v:k,l:v.label}))}/>
    <Sel label="Auteur" value={editing.author} onChange={v=>setEditing({...editing,author:v})} options={socs.map(s=>({v:s.id,l:s.nom}))}/>
   </div>
   <Inp label="Contenu" value={editing.content} onChange={v=>setEditing({...editing,content:v})} textarea placeholder="Le contenu partagé…"/>
   <Inp label="Tags (séparés par virgule)" value={(editing.tags||[]).join(", ")} onChange={v=>setEditing({...editing,tags:v.split(",").map(t=>t.trim().toLowerCase()).filter(Boolean)})} placeholder="vente, prospection, template"/>
   <div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={saveEntry}>Publier</Btn><Btn v="secondary" onClick={()=>setEditing(null)}>Annuler</Btn></div>
  </>}</Modal>
 </>;
}
/* 1. MATRICE DE RISQUE PORTFOLIO */
export function RiskMatrix({socs,reps,allM}){
 const cM2=curM();const pm=prevM(cM2);const[hover,setHover]=useState(null);
 const data=socs.filter(s=>s.stat==="active"&&s.id!=="eco").map(s=>{
  const r=gr(reps,s.id,cM2),rp=gr(reps,s.id,pm);
  const ca=pf(r?.ca),caPrev=pf(rp?.ca),ch=pf(r?.charges);
  const growth=caPrev>0?Math.round((ca-caPrev)/caPrev*100):-100;
  const margin=ca>0?Math.round((ca-ch)/ca*100):0;
  return{nom:s.nom,color:s.color,growth:clamp(growth,-50,150),margin:clamp(margin,-30,80),ca:Math.max(ca,500),porteur:s.porteur,id:s.id};
 }).filter(d=>d.ca>0);
 const W=320,H=240,P={t:20,r:20,b:30,l:40};
 const xMin=-50,xMax=150,yMin=-30,yMax=80;
 const sx=v=>P.l+(v-xMin)/(xMax-xMin)*(W-P.l-P.r);
 const sy=v=>H-P.b-(v-yMin)/(yMax-yMin)*(H-P.t-P.b);
 return <Sect title="Matrice de risque" sub="Croissance × Rentabilité — taille = CA">
  <Card style={{padding:14}}>
   <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",maxHeight:280}}>
    <line x1={P.l} y1={P.t} x2={P.l} y2={H-P.b} stroke={C.brd} strokeWidth={1}/>
    <line x1={P.l} y1={H-P.b} x2={W-P.r} y2={H-P.b} stroke={C.brd} strokeWidth={1}/>
    <line x1={sx(0)} y1={P.t} x2={sx(0)} y2={H-P.b} stroke={C.brd} strokeDasharray="3 3" strokeWidth={.5}/>
    <line x1={P.l} y1={sy(0)} x2={W-P.r} y2={sy(0)} stroke={C.brd} strokeDasharray="3 3" strokeWidth={.5}/>
    {[-50,0,50,100,150].map(v=><text key={"x"+v} x={sx(v)} y={H-P.b+12} textAnchor="middle" fill={C.td} fontSize={7}>{v}%</text>)}
    {[-30,0,30,60].map(v=><text key={"y"+v} x={P.l-4} y={sy(v)+3} textAnchor="end" fill={C.td} fontSize={7}>{v}%</text>)}
    <text x={W/2} y={H-2} textAnchor="middle" fill={C.td} fontSize={8}>Croissance %</text>
    <text x={8} y={H/2} textAnchor="middle" fill={C.td} fontSize={8} transform={`rotate(-90,8,${H/2})`}>Marge %</text>
    <rect x={sx(0)} y={P.t} width={W-P.r-sx(0)} height={sy(0)-P.t} fill={C.g} opacity={.03}/>
    <rect x={P.l} y={P.t} width={sx(0)-P.l} height={sy(0)-P.t} fill={C.acc} opacity={.03}/>
    <rect x={sx(0)} y={sy(0)} width={W-P.r-sx(0)} height={H-P.b-sy(0)} fill={C.o} opacity={.03}/>
    <rect x={P.l} y={sy(0)} width={sx(0)-P.l} height={H-P.b-sy(0)} fill={C.r} opacity={.03}/>
    {data.map(d=>{const r2=clamp(d.ca/600,6,20);return <g key={d.id} onMouseEnter={()=>setHover(d)} onMouseLeave={()=>setHover(null)} style={{cursor:"pointer"}}>
    <circle cx={sx(d.growth)} cy={sy(d.margin)} r={r2} fill={d.color+"66"} stroke={d.color} strokeWidth={1.5}/>
    <text x={sx(d.growth)} y={sy(d.margin)-r2-3} textAnchor="middle" fill={C.t} fontSize={7} fontWeight={700}>{d.nom}</text>
    </g>;})}
   </svg>
   {hover&&<div style={{background:C.card2,border:`1px solid ${C.brd}`,borderRadius:8,padding:"6px 10px",marginTop:6}}>
    <span style={{fontWeight:700,fontSize:11,color:hover.color}}>{hover.nom}</span> <span style={{fontSize:9,color:C.td}}>({hover.porteur})</span>
    <div style={{display:"flex",gap:12,marginTop:3,fontSize:10}}>
    <span>CA: <strong>{fmt(hover.ca)}€</strong></span>
    <span>Croissance: <strong style={{color:hover.growth>=0?C.g:C.r}}>{hover.growth>0?"+":""}{hover.growth}%</strong></span>
    <span>Marge: <strong style={{color:hover.margin>=0?C.g:C.r}}>{hover.margin}%</strong></span>
    </div>
   </div>}
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:10}}>
    {[["⭐ Stars","Croissance+ & Marge+",C.g],["💰 Cash cows","Marge+ mais stagne",C.acc],["🚀 À surveiller","Croît mais pas rentable",C.o],["⚠ Critique","Déclin & pertes",C.r]].map(([l,d,c],i)=>
    <div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 8px",background:c+"08",borderRadius:6,border:`1px solid ${c}18`}}>
    <span style={{fontSize:10}}>{l.split(" ")[0]}</span>
    <div><div style={{fontSize:9,fontWeight:600,color:c}}>{l.split(" ").slice(1).join(" ")}</div><div style={{fontSize:7,color:C.td}}>{d}</div></div>
    </div>
    )}
   </div>
  </Card>
 </Sect>;
}
/* 2. ALERTES INTELLIGENTES */
/* ===== GAMIFICATION XP & BADGES ===== */
export function GamificationPanel({soc,ca,myClients,streak,reps,allM,ghlData}){
 const BADGES=[
  {id:"first_client",label:"Premier Client 🎉",desc:"Signe ton premier client",check:(ctx)=>ctx.activeClients>=1},
  {id:"10k_club",label:"10K€ Club 💰",desc:"Atteins 10 000€ de CA mensuel",check:(ctx)=>ctx.ca>=10000},
  {id:"streak_7",label:"Streak 7j 🔥",desc:"7 jours de connexion consécutifs",check:(ctx)=>ctx.streakCount>=7},
  {id:"retention_100",label:"100% Rétention 🏆",desc:"Zéro churn ce mois",check:(ctx)=>ctx.activeClients>0&&ctx.churnedClients===0},
  {id:"pipeline_king",label:"Pipeline King 👑",desc:"5+ opportunités ouvertes",check:(ctx)=>ctx.openOpps>=5},
  {id:"zero_churn",label:"Zero Churn 🛡️",desc:"Aucun client perdu en 3 mois",check:(ctx)=>ctx.churn3m===0&&ctx.activeClients>0},
  {id:"early_bird",label:"Early Bird ☀️",desc:"Connecté avant 8h",check:(ctx)=>ctx.earlyLogin},
 ];
 const ctx=useMemo(()=>{
  const activeClients=(myClients||[]).filter(c=>c.status==="active").length;
  const churnedClients=(myClients||[]).filter(c=>c.status==="churned").length;
  const gd=ghlData?.[soc.id]||{};
  const openOpps=(gd.opportunities||[]).filter(o=>o.status==="open").length;
  const churn3m=0; // simplified
  const earlyLogin=new Date().getHours()<8;
  const streakCount=streak?.count||0;
  return{ca:ca||0,activeClients,churnedClients,openOpps,churn3m,earlyLogin,streakCount};
 },[ca,myClients,ghlData,soc.id,streak]);

 const[unlockedBadges,setUnlockedBadges]=useState(()=>{try{return JSON.parse(localStorage.getItem(`scBadges_${soc.id}`)||"[]");}catch{return[];}});
 const[celebBadge,setCelebBadge]=useState(null);

 useEffect(()=>{
  const newUnlocked=[...unlockedBadges];let changed=false;
  BADGES.forEach(b=>{if(!newUnlocked.includes(b.id)&&b.check(ctx)){newUnlocked.push(b.id);changed=true;setCelebBadge(b);}});
  if(changed){setUnlockedBadges(newUnlocked);try{localStorage.setItem(`scBadges_${soc.id}`,JSON.stringify(newUnlocked));sSet(`scBadges_${soc.id}`,JSON.stringify(newUnlocked));}catch{}}
 },[ctx]);

 useEffect(()=>{if(celebBadge){const t=setTimeout(()=>setCelebBadge(null),3000);return()=>clearTimeout(t);}},[celebBadge]);

 // XP calculation
 const xp=useMemo(()=>{
  let pts=0;pts+=Math.min(400,Math.round((ctx.ca||0)/25));pts+=ctx.activeClients*50;pts+=(ctx.streakCount||0)*10;pts+=unlockedBadges.length*100;
  const level=Math.floor(pts/500)+1;const xpInLevel=pts%500;
  return{pts,level,xpInLevel,nextLevel:500};
 },[ctx,unlockedBadges]);

 return <div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.33s"}}>
  <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:12,fontFamily:FONT_TITLE}}>🎮 GAMIFICATION — NIVEAU {xp.level}</div>
  {/* XP Bar */}
  <div style={{marginBottom:14}}>
   <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
    <span style={{fontSize:10,fontWeight:700,color:C.acc}}>⭐ {xp.pts} XP</span>
    <span style={{fontSize:9,color:C.td}}>Niveau {xp.level} → {xp.level+1}</span>
   </div>
   <div style={{height:8,background:C.brd,borderRadius:4,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${Math.round(xp.xpInLevel/xp.nextLevel*100)}%`,background:`linear-gradient(90deg,${C.acc},#FF9D00)`,borderRadius:4,transition:"width .5s ease"}}/>
   </div>
  </div>
  {/* Badge Grid */}
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:6}}>
   {BADGES.map(b=>{const unlocked=unlockedBadges.includes(b.id);return <div key={b.id} style={{padding:"10px 6px",borderRadius:10,border:`1px solid ${unlocked?C.acc+"44":C.brd}`,background:unlocked?C.accD:"transparent",textAlign:"center",opacity:unlocked?1:0.4,transition:"all .3s"}}>
    <div style={{fontSize:20,marginBottom:2,filter:unlocked?"none":"grayscale(1)"}}>{b.label.split(" ").pop()}</div>
    <div style={{fontSize:8,fontWeight:700,color:unlocked?C.acc:C.td}}>{b.label.replace(/\s*[^\w\s]+$/,"").trim()}</div>
    {!unlocked&&<div style={{fontSize:7,color:C.tm,marginTop:2}}>🔒</div>}
   </div>;})}
  </div>
  {/* Celebration overlay */}
  {celebBadge&&<div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.6)",animation:"fi .3s ease"}}>
   <div style={{textAlign:"center",animation:"celebIn .5s cubic-bezier(.16,1,.3,1)",padding:40}}>
    <div style={{fontSize:64,marginBottom:8}}>{celebBadge.label.split(" ").pop()}</div>
    <div style={{fontWeight:900,fontSize:18,color:C.acc,marginBottom:4}}>Badge Débloqué !</div>
    <div style={{fontSize:14,color:C.t,fontWeight:600}}>{celebBadge.label}</div>
    <div style={{fontSize:11,color:C.td,marginTop:4}}>{celebBadge.desc}</div>
   </div>
  </div>}
 </div>;
}
/* ===== INBOX UNIFIÉE ===== */
export function InboxUnifiee({socs,ghlData}){
 const items=useMemo(()=>{
  const all=[];
  (socs||[]).forEach(s=>{
   const gd=ghlData?.[s.id]||{};
   (gd.conversations||[]).slice(0,10).forEach(cv=>{
    all.push({socId:s.id,socNom:s.nom,socColor:s.color,contactName:cv.contactName||cv.contact?.name||"Inconnu",lastMsg:(cv.lastMessageBody||"").slice(0,80),date:cv.lastMessageDate||cv.dateUpdated||"",locationId:gd.locationId||s.ghlLocationId||""});
   });
  });
  return all.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,15);
 },[socs,ghlData]);
 if(items.length===0)return null;
 return <Card style={{padding:14,marginTop:14}}>
  <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>📨 INBOX UNIFIÉE</div>
  <div style={{maxHeight:300,overflowY:"auto"}}>
  {items.map((it,i)=><div key={i} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderBottom:`1px solid ${C.brd}08`,cursor:"pointer"}} onClick={()=>{if(it.locationId)window.open(`https://app.gohighlevel.com/v2/location/${it.locationId}/conversations`,"_blank");}}>
   <span style={{padding:"2px 6px",borderRadius:6,fontSize:8,fontWeight:700,background:it.socColor+"18",color:it.socColor,border:`1px solid ${it.socColor}33`,whiteSpace:"nowrap"}}>{it.socNom}</span>
   <div style={{flex:1,minWidth:0}}>
    <div style={{fontWeight:600,fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.contactName}</div>
    <div style={{fontSize:9,color:C.td,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.lastMsg||"—"}</div>
   </div>
   <span style={{fontSize:8,color:C.tm,whiteSpace:"nowrap"}}>{it.date?ago(it.date):""}</span>
  </div>)}
  </div>
 </Card>;
}
/* ===== PARCOURS CLIENT VISUEL ===== */
export function ParcoursClientVisuel({ghlData,socId,myClients}){
 const stages=useMemo(()=>{
  const gd=ghlData?.[socId]||{};const totalLeads=gd.ghlClients?.length||0;
  const cbt=gd.stats?.callsByType||{};
  const strat=Object.entries(cbt).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
  const integ=Object.entries(cbt).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
  const actifs=(myClients||[]).filter(c=>c.status==="active").length;
  const renew=(myClients||[]).filter(c=>{const end=c.billing?.startDate?new Date(c.billing.startDate):null;return end&&(Date.now()-end.getTime())>90*864e5&&c.status==="active";}).length;
  const raw=[{label:"Lead",icon:"🎯",count:totalLeads},{label:"Appel Stratégique",icon:"📞",count:strat},{label:"Intégration",icon:"🤝",count:integ},{label:"Client Actif",icon:"✅",count:actifs},{label:"Renouvellement",icon:"🔄",count:renew}];
  return raw.map((s,i)=>({...s,conv:i>0&&raw[i-1].count>0?Math.round(s.count/raw[i-1].count*100):null,avgDays:i===0?null:Math.round(7+i*5)}));
 },[ghlData,socId,myClients]);
 if(stages[0].count===0)return null;
 return <div className="fade-up glass-card-static" style={{padding:18,marginBottom:20,animationDelay:"0.35s"}}>
  <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:14,fontFamily:FONT_TITLE}}>🛤️ PARCOURS CLIENT</div>
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0}}>
   {stages.map((s,i)=>{const w=Math.max(30,100-i*15);return <Fragment key={i}>
    {i>0&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"4px 0"}}>
     <div style={{fontSize:18,color:C.acc,animation:"fl 2s ease-in-out infinite",animationDelay:`${i*0.3}s`}}>↓</div>
     {s.conv!==null&&<span style={{fontSize:9,fontWeight:800,color:s.conv>=50?C.g:s.conv>=25?C.o:C.r,background:s.conv>=50?C.gD:s.conv>=25?C.oD:C.rD,padding:"1px 8px",borderRadius:10}}>{s.conv}%</span>}
     {s.avgDays&&<span style={{fontSize:7,color:C.tm}}>~{s.avgDays}j moy.</span>}
    </div>}
    <div style={{width:`${w}%`,padding:"12px 16px",background:`linear-gradient(135deg,${C.acc}10,${C.acc}05)`,border:`1px solid ${C.acc}22`,borderRadius:12,textAlign:"center",animation:`barExpand .5s ease ${i*0.1}s both`,["--target-w"]:`${w}%`}}>
     <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
      <span style={{fontSize:18}}>{s.icon}</span>
      <span style={{fontWeight:900,fontSize:20,color:C.acc}}>{s.count}</span>
      <span style={{fontSize:11,color:C.td,fontWeight:600}}>{s.label}</span>
     </div>
    </div>
   </Fragment>;})}
  </div>
 </div>;
}
/* ===== BENCHMARK RADAR ===== */
export function BenchmarkRadar({socs,reps,ghlData,allM,cM,clients}){
 const data=useMemo(()=>{
  if(!socs||socs.length===0)return[];
  const metrics=socs.map(s=>{
   const r=gr(reps,s.id,cM);const ca=pf(r?.ca);const pipeline=pf(r?.pipeline);const mrr=pf(r?.mrr)||ca;
   const gd=ghlData?.[s.id]||{};const cbt=gd.stats?.callsByType||{};
   const strat=Object.entries(cbt).filter(([n])=>!/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
   const integ=Object.entries(cbt).filter(([n])=>/int[eé]g/i.test(n)).reduce((a,[,v])=>a+v,0);
   const conv=strat>0?Math.round(integ/strat*100):0;
   const myCl=(clients||[]).filter(c=>c.socId===s.id);const active=myCl.filter(c=>c.status==="active").length;const churned=myCl.filter(c=>c.status==="churned").length;
   const ret=active+churned>0?Math.round(active/(active+churned)*100):100;
   return{nom:s.nom,color:s.color,ca,conv,ret,pipeline,mrr};
  });
  const maxCA=Math.max(1,...metrics.map(m=>m.ca));const maxPipe=Math.max(1,...metrics.map(m=>m.pipeline));const maxMRR=Math.max(1,...metrics.map(m=>m.mrr));
  const dims=["CA","Conversion%","Rétention%","Pipeline","MRR"];
  return dims.map(dim=>{ const row={metric:dim}; metrics.forEach(m=>{
   if(dim==="CA")row[m.nom]=Math.round(m.ca/maxCA*100);
   else if(dim==="Conversion%")row[m.nom]=m.conv;
   else if(dim==="Rétention%")row[m.nom]=m.ret;
   else if(dim==="Pipeline")row[m.nom]=Math.round(m.pipeline/maxPipe*100);
   else row[m.nom]=Math.round(m.mrr/maxMRR*100);
  }); return row; });
 },[socs,reps,ghlData,cM,clients]);
 if(data.length===0||socs.length===0)return null;
 return <Card style={{padding:16,marginTop:14}}>
  <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:10}}>📡 BENCHMARK INTER-SOCIÉTÉS</div>
  <div style={{height:300}}>
   <ResponsiveContainer>
    <RadarChart data={data} margin={{top:20,right:30,bottom:20,left:30}}>
     <PolarGrid stroke={C.brd}/>
     <PolarAngleAxis dataKey="metric" tick={{fill:C.td,fontSize:9}}/>
     <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fill:C.tm,fontSize:8}} axisLine={false}/>
     {socs.map(s=><Radar key={s.id} name={s.nom} dataKey={s.nom} stroke={s.color} fill={s.color} fillOpacity={0.15} strokeWidth={2}/>)}
     <Legend wrapperStyle={{fontSize:10}}/>
     <Tooltip/>
    </RadarChart>
   </ResponsiveContainer>
  </div>
 </Card>;
}
export function SmartAlertsPanel({alerts}){
 const[soundOn,setSoundOn]=useState(()=>{try{return localStorage.getItem("scAlertSound")!=="off";}catch{return true;}});
 const prevCount=useRef(alerts.length);
 useEffect(()=>{if(soundOn&&alerts.length>prevCount.current){try{const ctx=new(window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator();const gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);osc.frequency.value=880;gain.gain.value=0.08;osc.start();osc.stop(ctx.currentTime+0.12);}catch{}}prevCount.current=alerts.length;},[alerts.length,soundOn]);
 if(alerts.length===0)return <Card style={{padding:20,textAlign:"center"}}><span style={{fontSize:28}}>✅</span><div style={{color:C.g,fontWeight:700,fontSize:13,marginTop:6}}>Tout va bien</div><div style={{color:C.td,fontSize:10}}>Aucune alerte détectée</div></Card>;
 const typeStyles={danger:{bg:C.rD,brd:C.r},warning:{bg:C.oD,brd:C.o},success:{bg:C.gD,brd:C.g},info:{bg:C.bD,brd:C.b}};
 const alertBorder=(a)=>{if(a.alertType==="payment_received"||a.type==="success")return C.g;if(a.type==="danger")return C.r;if(a.type==="info")return C.b;if(a.type==="warning")return C.o;return C.b;};
 return <div>
  <div style={{display:"flex",justifyContent:"flex-end",marginBottom:4}}>
   <button onClick={()=>{const next=!soundOn;setSoundOn(next);try{localStorage.setItem("scAlertSound",next?"on":"off");}catch{}}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:C.td}}>{soundOn?"🔔":"🔇"}</button>
  </div>
  {alerts.map((a,i)=>{const st=typeStyles[a.type]||typeStyles.info;const bc=alertBorder(a);
  return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:st.bg,borderLeft:`3px solid ${bc}`,border:`1px solid ${st.brd}18`,borderRadius:8,marginBottom:4,animation:`slideInRight .3s ease ${i*0.05}s both`}}>
   <span style={{fontSize:16}}>{a.icon}</span>
   <div style={{flex:1}}>
    <div style={{fontWeight:700,fontSize:11,color:st.brd}}>{a.title}</div>
    <div style={{fontSize:9,color:C.td}}>{a.desc}</div>
   </div>
   <span style={{width:6,height:6,borderRadius:3,background:a.soc?.color||C.td,flexShrink:0}}/>
  </div>;
 })}</div>;
}
/* 3. COHORT ANALYSIS */
export function CohortAnalysis({socs,reps,allM}){
 const cohorts=useMemo(()=>{
  const groups={};
  socs.filter(s=>s.incub&&s.stat!=="signature").forEach(s=>{
   const d=new Date(s.incub);const q=`${d.getFullYear()}-Q${Math.ceil((d.getMonth()+1)/3)}`;
   if(!groups[q])groups[q]={label:q,socs:[]};
   groups[q].socs.push(s);
  });
  return Object.values(groups).sort((a,b)=>a.label.localeCompare(b.label));
 },[socs]);
 const cohortData=useMemo(()=>{
  return cohorts.map(c=>{
   const metrics=c.socs.map(s=>{
    const reports=allM.map(m=>{const r=gr(reps,s.id,m);return r?{m,ca:pf(r.ca),ch:pf(r.charges)}:null;}).filter(Boolean);
    const totalCA=reports.reduce((a,r2)=>a+r2.ca,0);
    const avgCA=reports.length>0?Math.round(totalCA/reports.length):0;
    const months=sinceMonths(s.incub);
    const lastCA=reports.length>0?reports[reports.length-1].ca:0;
    return{nom:s.nom,color:s.color,totalCA,avgCA,months,lastCA,reportsCount:reports.length};
   });
   const avgTotalCA=metrics.length?Math.round(metrics.reduce((a,m)=>a+m.totalCA,0)/metrics.length):0;
   const avgMonthlyCA=metrics.length?Math.round(metrics.reduce((a,m)=>a+m.avgCA,0)/metrics.length):0;
   const avgReports=metrics.length?Math.round(metrics.reduce((a,m)=>a+m.reportsCount,0)/metrics.length):0;
   return{...c,metrics,avgTotalCA,avgMonthlyCA,avgReports};
  });
 },[cohorts,reps,allM]);
 return <Sect title="Analyse par cohorte" sub="Performance par promotion d'incubation">
  {cohortData.length===0&&<div className="fu" style={{textAlign:"center",padding:40,color:C.td}}>Ajoutez des dates d'incubation pour voir les cohortes</div>}
  {cohortData.length>0&&<Card style={{padding:14,marginBottom:12}}>
   <div style={{height:200}}><ResponsiveContainer><BarChart data={cohortData.map(c=>({name:c.label,CA_moy:c.avgMonthlyCA,Sociétés:c.socs.length}))}>
    <CartesianGrid strokeDasharray="3 3" stroke={C.brd}/>
    <XAxis dataKey="name" tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false}/>
    <YAxis tick={{fill:C.td,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>`${fK(v)}€`}/>
    <Tooltip content={<CTip/>}/>
    <Bar dataKey="CA_moy" fill={C.acc} radius={[4,4,0,0]} name="CA moyen/mois"/>
   </BarChart></ResponsiveContainer></div>
  </Card>}
  {cohortData.map((c,ci)=>
   <Card key={c.label} accent={C.v} style={{marginBottom:8,padding:14}} delay={Math.min(ci+1,6)}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
    <div><span style={{fontWeight:800,fontSize:14,color:C.v}}>{c.label}</span><span style={{color:C.td,fontSize:10,marginLeft:6}}>{c.socs.length} société{c.socs.length>1?"s":""}</span></div>
    <div style={{display:"flex",gap:8}}>
    <div style={{textAlign:"center"}}><div style={{fontSize:8,color:C.td}}>CA moy</div><div style={{fontWeight:800,fontSize:12,color:C.acc}}>{fmt(c.avgMonthlyCA)}€</div></div>
    <div style={{textAlign:"center"}}><div style={{fontSize:8,color:C.td}}>Rapports</div><div style={{fontWeight:800,fontSize:12,color:C.b}}>{c.avgReports}</div></div>
    </div>
    </div>
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
    {c.metrics.map(m=>
    <div key={m.nom} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",background:C.bg,borderRadius:6,border:`1px solid ${m.color}22`}}>
    <span style={{width:4,height:4,borderRadius:2,background:m.color}}/>
    <span style={{fontSize:9,fontWeight:600}}>{m.nom}</span>
    <span style={{fontSize:8,color:C.td}}>CA:{fmt(m.avgCA)}€</span>
    <span style={{fontSize:7,color:C.td}}>{m.months}m</span>
    </div>
    )}
    </div>
   </Card>
  )}
 </Sect>;
}
/* 4. CHALLENGES INTER-SOCIÉTÉS */
export const CHALLENGE_TEMPLATES=[
 {id:"c_double",title:"🔥 Doublé",desc:"Doubler son CA vs mois dernier",metric:"ca_growth",target:100,unit:"%",icon:"🔥"},
 {id:"c_margin",title:"💎 Marge d'or",desc:"Atteindre 60%+ de marge",metric:"margin",target:60,unit:"%",icon:"💎"},
 {id:"c_pipeline",title:"🎯 Pipeline monstre",desc:"Pipeline > 2× CA",metric:"pipeline_ratio",target:200,unit:"%",icon:"🎯"},
 {id:"c_streak",title:"📈 Série verte",desc:"3 mois consécutifs de hausse",metric:"growth_streak",target:3,unit:"mois",icon:"📈"},
 {id:"c_reports",title:"📊 Exemplaire",desc:"Rapport soumis avant le 5 du mois",metric:"early_report",target:1,unit:"",icon:"📊"},
 {id:"c_pulse",title:"⚡ Ultra-connecté",desc:"Pulse envoyé chaque semaine ce mois",metric:"pulse_count",target:4,unit:"",icon:"⚡"},
];
/* ABONNEMENTS & ÉQUIPE PANEL */
export function SubsTeamPanel({socs,subs,saveSubs,team,saveTeam,socId,reps,isCompact,socBankData,revData}){
 const[editSub,setEditSub]=useState(null);const[editTm,setEditTm]=useState(null);const[showRecon,setShowRecon]=useState(false);
 const[catFilter,setCatFilter]=useState("all");const[autoSubs,setAutoSubs]=useState([]);
 const cM2=curM();
 const bankData0=socId==="all"?null:(socId==="holding"?revData:socBankData);
 const detectSubs=useCallback(()=>{const detected=autoDetectSubscriptions(bankData0,socId);setAutoSubs(detected);},[bankData0,socId]);
 useEffect(()=>{detectSubs();},[detectSubs]);
 const manualSubs=socId==="all"?subs:subs.filter(s=>s.socId===socId);
 const manualNames=new Set(manualSubs.map(s=>s.name.toLowerCase().replace(/[^a-z0-9]/g,"")));
 const mergedAutoSubs=autoSubs.filter(a=>!manualNames.has(a.name.toLowerCase().replace(/[^a-z0-9]/g,"")));
 const mySubs=catFilter==="all"?[...manualSubs,...mergedAutoSubs]:[...manualSubs,...mergedAutoSubs].filter(s=>s.cat===catFilter);
 const myTeam=socId==="all"?team:team.filter(t=>t.socId===socId);
 const bankData=bankData0;
 const matchedSubs=useMemo(()=>matchSubsToRevolut(mySubs,bankData,socId),[mySubs,bankData,socId]);
 const matchedCount=matchedSubs.filter(s=>s.revMatch).length;
 const unmatchedCount=matchedSubs.filter(s=>!s.revMatch).length;
 const totalSubsMonthly=mySubs.reduce((a,s)=>a+subMonthly(s),0);
 const totalTeamMonthly=myTeam.reduce((a,t)=>{
  const ca=t.socId!=="holding"?pf(gr(reps,t.socId,cM2)?.ca):0;
  return a+teamMonthly(t,ca);
 },0);
 const totalChargesRecurrentes=totalSubsMonthly+totalTeamMonthly;
 const matchedSubsMonthly=matchedSubs.filter(s=>s.revMatch).reduce((a,s)=>a+subMonthly(s),0);
 const addSub=()=>{const ns={id:uid(),socId:socId==="all"?"holding":socId,name:"",amount:0,freq:"monthly",cat:"logiciel",start:new Date().toISOString().slice(0,10),notes:""};setEditSub(ns);};
 const addTm=()=>{const nt={id:uid(),socId:socId==="all"?"holding":socId,name:"",role:"",payType:"fixed",amount:0,notes:""};setEditTm(nt);};
 const saveSub=(s)=>{const idx=subs.findIndex(x=>x.id===s.id);if(idx>=0){const ns=[...subs];ns[idx]=s;saveSubs(ns);}else saveSubs([...subs,s]);setEditSub(null);};
 const deleteSub=(id)=>saveSubs(subs.filter(s=>s.id!==id));
 const saveTm2=(t)=>{const idx=team.findIndex(x=>x.id===t.id);if(idx>=0){const nt=[...team];nt[idx]=t;saveTeam(nt);}else saveTeam([...team,t]);setEditTm(null);};
 const deleteTm=(id)=>saveTeam(team.filter(t=>t.id!==id));
 return <div>
  {!isCompact&&<Card accent={C.r} style={{padding:14,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>CHARGES RÉCURRENTES / MOIS</div>
    <div style={{fontWeight:900,fontSize:24,color:C.r,marginTop:2}}>{fmt(totalChargesRecurrentes)}€</div>
    </div>
    <div style={{display:"flex",gap:10}}>
    <div style={{textAlign:"center"}}><div style={{fontWeight:700,fontSize:14,color:C.b}}>{fmt(totalSubsMonthly)}€</div><div style={{fontSize:8,color:C.td}}>Abonnements</div></div>
    <div style={{textAlign:"center"}}><div style={{fontWeight:700,fontSize:14,color:C.o}}>{fmt(totalTeamMonthly)}€</div><div style={{fontSize:8,color:C.td}}>Équipe</div></div>
    </div>
   </div>
   {totalChargesRecurrentes>0&&<div style={{display:"flex",gap:2,marginTop:8,height:6,borderRadius:3,overflow:"hidden"}}>
    <div style={{width:`${pct(totalSubsMonthly,totalChargesRecurrentes)}%`,background:C.b,borderRadius:3,transition:"width .3s"}}/>
    <div style={{width:`${pct(totalTeamMonthly,totalChargesRecurrentes)}%`,background:C.o,borderRadius:3,transition:"width .3s"}}/>
   </div>}
   {bankData&&mySubs.length>0&&<div style={{marginTop:8,padding:"6px 8px",background:C.bg,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
    <span style={{fontSize:10}}>🏦</span>
    <span style={{fontSize:9,color:C.td}}>Rapprochement Revolut :</span>
    <span style={{fontSize:9,fontWeight:700,color:C.g}}>{matchedCount} matchés</span>
    {unmatchedCount>0&&<span style={{fontSize:9,fontWeight:700,color:C.o}}>{unmatchedCount} non trouvés</span>}
    </div>
    <button onClick={()=>setShowRecon(!showRecon)} style={{background:"none",border:"none",color:C.acc,fontSize:9,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>{showRecon?"Masquer":"Voir détail"}</button>
   </div>}
   {matchedSubsMonthly>0&&<div style={{marginTop:4,padding:"4px 8px",background:C.gD,borderRadius:6,display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontSize:10}}>✅</span>
    <span style={{fontSize:9,color:C.g,fontWeight:600}}>{fmt(matchedSubsMonthly)}€/mois déjà dans Revolut — pas de doublon dans l'analyse</span>
   </div>}
  </Card>}
  {showRecon&&bankData&&<Card accent={C.b} style={{padding:14,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
    <span style={{fontSize:14}}>🔍</span>
    <div style={{fontWeight:800,fontSize:12,color:C.b}}>Rapprochement bancaire</div>
   </div>
   {matchedSubs.map((s,i)=><div key={s.id} className={`fu d${Math.min(i+1,8)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",background:C.bg,borderRadius:6,marginBottom:2}}>
    <span style={{fontSize:10}}>{s.revMatch?"✅":"❌"}</span>
    <span style={{flex:1,fontSize:10,fontWeight:600}}>{s.name}</span>
    <span style={{fontSize:9,color:C.td}}>{fmt(s.amount)}€/{s.freq==="annual"?"an":"m"}</span>
    {s.revMatch&&<>
    <span style={{fontSize:8,color:C.g,background:C.gD,padding:"1px 5px",borderRadius:4}}>= {fmt(s.revMatch.txAmount)}€ Revolut</span>
    <span style={{fontSize:8,color:C.td}}>Dernier: {new Date(s.revMatch.lastPayment).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>
    <span style={{fontSize:8,color:C.b,fontWeight:600}}>Prochain: {new Date(s.revMatch.nextPayment).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>
    </>}
    {!s.revMatch&&<span style={{fontSize:8,color:C.o,background:C.oD,padding:"1px 5px",borderRadius:4}}>Aucune transaction trouvée</span>}
   </div>)}
   <div style={{marginTop:6,fontSize:9,color:C.td,lineHeight:1.4}}>Le matching compare le nom de l'abonnement avec les transactions Revolut (similarité ≥50%, montant ±30%). Les abos matchés ne sont pas comptés en double dans l'analyse des charges.</div>
  </Card>}
  <Sect title="💻 Abonnements" right={<div style={{display:"flex",gap:4,alignItems:"center"}}><Btn small onClick={detectSubs}>🔄 Détecter</Btn><Btn small onClick={addSub}>+ Abo</Btn></div>} sub={`${mySubs.length} · ${fmt(totalSubsMonthly)}€/mois · ${fmt(totalSubsMonthly*12)}€/an`}>
   <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:8}}>
    <button onClick={()=>setCatFilter("all")} style={{background:catFilter==="all"?C.acc+"22":"transparent",border:`1px solid ${catFilter==="all"?C.acc:C.brd}`,borderRadius:6,padding:"2px 8px",fontSize:9,color:catFilter==="all"?C.acc:C.td,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>Tous</button>
    {Object.entries(SUB_CATS).map(([k,v])=><button key={k} onClick={()=>setCatFilter(k)} style={{background:catFilter===k?v.c+"22":"transparent",border:`1px solid ${catFilter===k?v.c:C.brd}`,borderRadius:6,padding:"2px 8px",fontSize:9,color:catFilter===k?v.c:C.td,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>{v.icon} {v.l}</button>)}
   </div>
   {mergedAutoSubs.length>0&&<div style={{padding:"6px 8px",background:C.bD,borderRadius:6,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
    <span style={{fontSize:10}}>🤖</span><span style={{fontSize:9,color:C.b,fontWeight:600}}>{mergedAutoSubs.length} abonnement{mergedAutoSubs.length>1?"s":""} auto-détecté{mergedAutoSubs.length>1?"s":""} depuis Revolut</span>
   </div>}
   {mySubs.length===0&&<div style={{color:C.td,fontSize:11,padding:12,textAlign:"center"}}>Aucun abonnement</div>}
   {Object.entries(SUB_CATS).map(([cat,info])=>{
    const catSubs=mySubs.filter(s=>s.cat===cat);
    if(catSubs.length===0)return null;
    const catTotal=catSubs.reduce((a,s)=>a+subMonthly(s),0);
    return <div key={cat} style={{marginBottom:8}}>
    <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}>
    <span style={{fontSize:10}}>{info.icon}</span>
    <span style={{fontSize:10,fontWeight:700,color:C.td}}>{info.l}</span>
    <span style={{fontSize:9,color:info.c,fontWeight:700,marginLeft:"auto"}}>{fmt(catTotal)}€/m</span>
    </div>
    {catSubs.map((s,i)=>{
    const soc=socs.find(x=>x.id===s.socId);
    const ms=matchedSubs.find(m=>m.id===s.id);
    const rm=ms?.revMatch;
    return <div key={s.id} className={`fu d${Math.min(i+1,5)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:C.card,borderRadius:8,border:`1px solid ${rm?C.g+"33":C.brd}`,marginBottom:2,cursor:"pointer"}} onClick={()=>setEditSub({...s})}>
    <div style={{flex:1,minWidth:0}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontWeight:600,fontSize:11}}>{s.name}</span>
    {socId==="all"&&soc&&<span style={{fontSize:8,color:soc.color,background:soc.color+"18",padding:"1px 5px",borderRadius:8}}>{soc.nom}</span>}
    {socId==="all"&&s.socId==="holding"&&<span style={{fontSize:8,color:C.v,background:C.vD,padding:"1px 5px",borderRadius:8}}>Holding</span>}
    {rm&&<span style={{fontSize:7,color:C.g,background:C.gD,padding:"1px 4px",borderRadius:4,fontWeight:700}} title={`Matché avec "${rm.txDesc}" sur Revolut`}>🏦 ✓</span>}
    {s.auto&&<span style={{fontSize:7,color:C.b,background:C.bD,padding:"1px 4px",borderRadius:4,fontWeight:700}}>🤖 auto</span>}
    </div>
    {s.notes&&<div style={{color:C.td,fontSize:9,marginTop:1}}>{s.notes}</div>}
    {rm&&<div style={{display:"flex",gap:8,marginTop:2}}>
    <span style={{fontSize:8,color:C.td}}>Dernier paiement : <strong style={{color:C.t}}>{new Date(rm.lastPayment).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</strong></span>
    <span style={{fontSize:8,color:C.b,fontWeight:600}}>Prochain : {new Date(rm.nextPayment).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>
    </div>}
    </div>
    <div style={{textAlign:"right"}}>
    <div style={{fontWeight:700,fontSize:12,color:C.t}}>{fmt(s.amount)}€<span style={{fontSize:8,color:C.td,fontWeight:400}}>/{s.freq==="annual"?"an":"m"}</span></div>
    <div style={{fontSize:8,color:C.td}}>{s.freq==="annual"?`${fmt(Math.round(s.amount/12))}€/m`:`${fmt(s.amount*12)}€/an`}</div>
    {rm&&rm.txAmount!==s.amount&&<div style={{fontSize:7,color:C.o}}>Revolut: {fmt(rm.txAmount)}€</div>}
    </div>
    </div>;
    })}
    </div>;
   })}
  </Sect>
  <Sect title="👥 Équipe & Prestataires" right={<Btn small onClick={addTm}>+ Membre</Btn>} sub={`${myTeam.length} · ${fmt(totalTeamMonthly)}€/mois`}>
   {myTeam.length===0&&<div style={{color:C.td,fontSize:11,padding:12,textAlign:"center"}}>Aucun membre</div>}
   {myTeam.map((t,i)=>{
    const soc=socs.find(x=>x.id===t.socId);
    const ca=t.socId!=="holding"?pf(gr(reps,t.socId,cM2)?.ca):0;
    const cost=teamMonthly(t,ca);
    return <Card key={t.id} style={{marginBottom:3,padding:"10px 12px",cursor:"pointer"}} delay={Math.min(i+1,6)} onClick={()=>setEditTm({...t})}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
    <div style={{width:32,height:32,borderRadius:8,background:t.payType==="fixed"?C.bD:C.oD,border:`1.5px solid ${t.payType==="fixed"?C.b:C.o}33`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:t.payType==="fixed"?C.b:C.o}}>{t.name?t.name[0]:"?"}</div>
    <div style={{flex:1,minWidth:0}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontWeight:700,fontSize:12}}>{t.name||"Sans nom"}</span>
    <span style={{fontSize:9,color:C.td,background:C.card2,padding:"1px 5px",borderRadius:8}}>{t.role}</span>
    </div>
    <div style={{display:"flex",gap:6,marginTop:2}}>
    {socId==="all"&&soc&&<span style={{fontSize:8,color:soc.color}}>📍 {soc.nom}</span>}
    {socId==="all"&&t.socId==="holding"&&<span style={{fontSize:8,color:C.v}}>📍 Holding</span>}
    {t.notes&&<span style={{fontSize:8,color:C.td}}>{t.notes}</span>}
    </div>
    </div>
    <div style={{textAlign:"right"}}>
    <div style={{fontWeight:800,fontSize:14,color:t.payType==="fixed"?C.b:C.o}}>{t.payType==="fixed"?`${fmt(t.amount)}€`:`${t.amount}%`}</div>
    <div style={{fontSize:8,color:C.td}}>{t.payType==="fixed"?"fixe / mois":"du contrat"}</div>
    {t.payType==="percent"&&ca>0&&<div style={{fontSize:8,color:C.o,fontWeight:600}}>≈ {fmt(cost)}€</div>}
    </div>
    </div>
    </Card>;
   })}
  </Sect>
  <Modal open={!!editSub} onClose={()=>setEditSub(null)} title={editSub?.name?"Modifier abonnement":"Nouvel abonnement"}>
   {editSub&&<>
    <Inp label="Nom" value={editSub.name} onChange={v=>setEditSub({...editSub,name:v})} placeholder="Ex: Notion, Adobe, GoHighLevel…"/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Montant" value={editSub.amount} onChange={v=>setEditSub({...editSub,amount:pf(v)})} type="number" suffix="€"/>
    <Sel label="Fréquence" value={editSub.freq} onChange={v=>setEditSub({...editSub,freq:v})} options={[{v:"monthly",l:"Mensuel"},{v:"annual",l:"Annuel"}]}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Sel label="Catégorie" value={editSub.cat} onChange={v=>setEditSub({...editSub,cat:v})} options={Object.entries(SUB_CATS).map(([k,v2])=>({v:k,l:`${v2.icon} ${v2.l}`}))}/>
    {socId==="all"&&<Sel label="Affectation" value={editSub.socId} onChange={v=>setEditSub({...editSub,socId:v})} options={[{v:"holding",l:"🏢 Holding"},...socs.filter(s=>s.stat==="active"||s.stat==="lancement").map(s=>({v:s.id,l:s.nom}))]}/>}
    </div>
    <Inp label="Date de début" value={editSub.start} onChange={v=>setEditSub({...editSub,start:v})} type="date"/>
    <Inp label="Notes" value={editSub.notes} onChange={v=>setEditSub({...editSub,notes:v})} placeholder="Détails…"/>
    {editSub.freq==="annual"&&editSub.amount>0&&<div style={{padding:"6px 8px",background:C.bD,borderRadius:6,fontSize:10,color:C.b,fontWeight:600}}>= {fmt(Math.round(editSub.amount/12))}€/mois</div>}
    {(()=>{
    if(!bankData||!editSub.name||!editSub.amount)return null;
    const preview=matchSubsToRevolut([editSub],bankData,socId);
    const rm=preview[0]?.revMatch;
    if(!rm)return <div style={{padding:"8px 10px",background:C.oD,borderRadius:8,marginTop:6}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontSize:10}}>🔍</span>
    <span style={{fontSize:10,color:C.o,fontWeight:600}}>Aucune transaction Revolut correspondante trouvée</span>
    </div>
    <div style={{fontSize:8,color:C.td,marginTop:2}}>Le système recherche les transactions avec un nom similaire et un montant proche (±30%)</div>
    </div>;
    return <div style={{padding:"10px 12px",background:C.gD,borderRadius:8,marginTop:6}}>
    <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:6}}>
    <span style={{fontSize:10}}>🏦</span>
    <span style={{fontSize:10,color:C.g,fontWeight:700}}>Transaction Revolut trouvée !</span>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <span style={{fontSize:10,color:C.t}}>"{rm.txDesc}"</span>
    <span style={{fontSize:10,fontWeight:700,color:C.g}}>{fmt(rm.txAmount)}€</span>
    </div>
    <div style={{display:"flex",gap:12}}>
    <span style={{fontSize:9,color:C.td}}>Dernier paiement : <strong style={{color:C.t}}>{new Date(rm.lastPayment).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</strong></span>
    <span style={{fontSize:9,color:C.b,fontWeight:600}}>Prochain : {new Date(rm.nextPayment).toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}</span>
    </div>
    <div style={{fontSize:8,color:C.td}}>{rm.matchCount} paiement{rm.matchCount>1?"s":""} trouvé{rm.matchCount>1?"s":""} sur Revolut</div>
    {rm.txAmount!==editSub.amount&&<div style={{fontSize:9,color:C.o,fontWeight:600,marginTop:2}}>⚠ Le montant Revolut ({fmt(rm.txAmount)}€) diffère du montant déclaré ({fmt(editSub.amount)}€) — <button style={{background:"none",border:"none",color:C.acc,fontSize:9,cursor:"pointer",fontFamily:FONT,fontWeight:700,textDecoration:"underline"}} onClick={()=>setEditSub({...editSub,amount:Math.round(rm.txAmount)})}>Utiliser le montant Revolut</button></div>}
    </div>
    </div>;
    })()}
    <div style={{display:"flex",gap:8,marginTop:12}}>
    <Btn onClick={()=>saveSub(editSub)}>Sauver</Btn>
    {subs.some(s=>s.id===editSub.id)&&<Btn v="secondary" onClick={()=>{deleteSub(editSub.id);setEditSub(null);}}>🗑 Supprimer</Btn>}
    <Btn v="secondary" onClick={()=>setEditSub(null)}>Annuler</Btn>
    </div>
   </>}
  </Modal>
  <Modal open={!!editTm} onClose={()=>setEditTm(null)} title={editTm?.name?"Modifier membre":"Nouveau membre"}>
   {editTm&&<>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Nom" value={editTm.name} onChange={v=>setEditTm({...editTm,name:v})} placeholder="Ex: Arnaud, Sarah…"/>
    <Inp label="Rôle" value={editTm.role} onChange={v=>setEditTm({...editTm,role:v})} placeholder="Ex: CSM, Closer, Monteur…"/>
    </div>
    <div style={{padding:"10px 12px",background:C.card2,borderRadius:10,border:`1px solid ${C.brd}`,marginBottom:8}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>TYPE DE RÉMUNÉRATION</div>
    <div style={{display:"flex",gap:6,marginBottom:8}}>
    {[{v:"fixed",l:"💰 Fixe / mois",c:C.b},{v:"percent",l:"📊 % du contrat",c:C.o}].map(opt=>
    <button key={opt.v} onClick={()=>setEditTm({...editTm,payType:opt.v})} style={{flex:1,padding:"8px 10px",borderRadius:8,border:`1.5px solid ${editTm.payType===opt.v?opt.c:C.brd}`,background:editTm.payType===opt.v?opt.c+"15":C.card,color:editTm.payType===opt.v?opt.c:C.td,fontWeight:editTm.payType===opt.v?700:500,fontSize:11,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}}>{opt.l}</button>
    )}
    </div>
    <Inp label={editTm.payType==="fixed"?"Montant fixe":"Pourcentage"} value={editTm.amount} onChange={v=>setEditTm({...editTm,amount:pf(v)})} type="number" suffix={editTm.payType==="fixed"?"€/mois":"%"}/>
    {editTm.payType==="percent"&&<div style={{padding:"6px 8px",background:C.oD,borderRadius:6,fontSize:10,color:C.o,marginTop:4}}>Ce membre touche {editTm.amount}% du CA des contrats qu'il gère</div>}
    </div>
    {socId==="all"&&<Sel label="Affectation" value={editTm.socId} onChange={v=>setEditTm({...editTm,socId:v})} options={[{v:"holding",l:"🏢 Holding"},...socs.filter(s=>s.stat==="active"||s.stat==="lancement").map(s=>({v:s.id,l:s.nom}))]}/>}
    <Inp label="Notes" value={editTm.notes} onChange={v=>setEditTm({...editTm,notes:v})} placeholder="Détails, scope, horaires…"/>
    <div style={{display:"flex",gap:8,marginTop:12}}>
    <Btn onClick={()=>saveTm2(editTm)}>Sauver</Btn>
    {team.some(t=>t.id===editTm.id)&&<Btn v="secondary" onClick={()=>{deleteTm(editTm.id);setEditTm(null);}}>🗑 Supprimer</Btn>}
    <Btn v="secondary" onClick={()=>setEditTm(null)}>Annuler</Btn>
    </div>
   </>}
  </Modal>
 </div>;
}
export function SubsTeamBadge({subs,team,socId,reps}){
 const cM2=curM();
 const mySubs=socId?subs.filter(s=>s.socId===socId):subs;
 const myTeam=socId?team.filter(t=>t.socId===socId):team;
 const totalS=mySubs.reduce((a,s)=>a+subMonthly(s),0);
 const totalT=myTeam.reduce((a,t)=>{const ca=t.socId!=="holding"?pf(gr(reps,t.socId,cM2)?.ca):0;return a+teamMonthly(t,ca);},0);
 const total=totalS+totalT;
 if(total===0)return null;
 return <span style={{fontSize:8,color:C.r,background:C.rD,padding:"1px 5px",borderRadius:8,fontWeight:600}}>🔄 {fmt(total)}€/m</span>;
}
export function ChallengesPanel({socs,reps,allM,pulses,challenges,saveChallenges}){
 const cM2=curM();const pm=prevM(cM2);const actS=socs.filter(s=>s.stat==="active"&&s.id!=="eco");
 const[editing,setEditing]=useState(false);
 const scored=useMemo(()=>{
  return(challenges||[]).filter(c=>c.month===cM2||c.month===pm).map(ch=>{
   const tmpl=CHALLENGE_TEMPLATES.find(t=>t.id===ch.templateId)||{};
   const scores=actS.map(s=>{
    const r=gr(reps,s.id,ch.month),rp=gr(reps,s.id,prevM(ch.month));
    const ca=pf(r?.ca),caPrev=pf(rp?.ca),ch2=pf(r?.charges);
    let val=0;
    if(tmpl.metric==="ca_growth")val=caPrev>0?Math.round((ca-caPrev)/caPrev*100):0;
    else if(tmpl.metric==="margin")val=ca>0?Math.round((ca-ch2)/ca*100):0;
    else if(tmpl.metric==="pipeline_ratio")val=ca>0?Math.round(pf(r?.pipeline)/ca*100):0;
    else if(tmpl.metric==="pulse_count")val=Object.keys(pulses).filter(k=>k.startsWith(s.id+"_")&&k.includes(ch.month.replace("-",""))).length;
    else if(tmpl.metric==="growth_streak"){let str=0;const mi=allM.indexOf(ch.month);if(mi>0)for(let i=mi;i>0;i--){const rc=pf(gr(reps,s.id,allM[i])?.ca),rcc=pf(gr(reps,s.id,allM[i-1])?.ca);if(rc>rcc)str++;else break;}val=str;}
    return{soc:s,value:val,achieved:val>=(tmpl.target||0)};
   }).sort((a,b)=>b.value-a.value);
   return{...ch,...tmpl,scores,winner:scores[0]};
  });
 },[challenges,reps,pulses,actS,allM,cM2,pm]);
 const launchChallenge=(tmplId)=>{
  const nc={id:uid(),templateId:tmplId,month:cM2,createdAt:new Date().toISOString()};
  saveChallenges([...(challenges||[]),nc]);
 };
 return <>
  {scored.filter(c=>c.month===cM2).length>0&&<Sect title={`Challenges — ${ml(cM2)}`}>
   {scored.filter(c=>c.month===cM2).map((ch,i)=>
    <Card key={ch.id} accent={C.acc} style={{marginBottom:8,padding:14}} delay={Math.min(i+1,6)}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
    <span style={{fontSize:24}}>{ch.icon}</span>
    <div style={{flex:1}}>
    <div style={{fontWeight:800,fontSize:14}}>{ch.title}</div>
    <div style={{color:C.td,fontSize:10}}>{ch.desc} — cible: {ch.target}{ch.unit}</div>
    </div>
    </div>
    {ch.scores.map((sc,si)=>
    <div key={sc.soc.id} className={`fu d${Math.min(si+1,8)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",background:si===0?C.accD:C.card,borderRadius:6,border:`1px solid ${si===0?C.acc+"44":C.brd}`,marginBottom:2}}>
    <span style={{fontWeight:800,fontSize:12,color:si===0?C.acc:si===1?"#C0C0C0":si===2?"#CD7F32":C.td,width:16}}>{si+1}</span>
    <span style={{width:5,height:5,borderRadius:3,background:sc.soc.color}}/>
    <span style={{flex:1,fontWeight:600,fontSize:11}}>{sc.soc.nom}</span>
    <span style={{fontWeight:800,fontSize:12,color:sc.achieved?C.g:C.td}}>{sc.value}{ch.unit}</span>
    {sc.achieved&&<span style={{fontSize:8,color:C.g,background:C.gD,padding:"1px 5px",borderRadius:6,fontWeight:600}}>✓</span>}
    </div>
    )}
    </Card>
   )}
  </Sect>}
  {scored.filter(c=>c.month!==cM2).length>0&&<Sect title="Historique">
   {scored.filter(c=>c.month!==cM2).map((ch,i)=>
    <div key={ch.id} className={`fu d${Math.min(i+1,6)}`} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.card,borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3}}>
    <span style={{fontSize:14}}>{ch.icon}</span>
    <div style={{flex:1}}><span style={{fontWeight:600,fontSize:11}}>{ch.title}</span><span style={{color:C.td,fontSize:9,marginLeft:6}}>{ml(ch.month)}</span></div>
    {ch.winner&&<><span style={{width:4,height:4,borderRadius:2,background:ch.winner.soc.color}}/><span style={{fontWeight:700,fontSize:10,color:C.acc}}>🏆 {ch.winner.soc.nom}</span></>}
    </div>
   )}
  </Sect>}
  <Sect title="Lancer un challenge" sub="Choisir un défi pour ce mois">
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:6}}>
    {CHALLENGE_TEMPLATES.map(tmpl=>{
    const active=(challenges||[]).some(c=>c.templateId===tmpl.id&&c.month===cM2);
    return <div key={tmpl.id} className="fu ba" onClick={active?undefined:()=>launchChallenge(tmpl.id)} style={{padding:12,background:active?C.gD:C.card,border:`1px solid ${active?C.g+"44":C.brd}`,borderRadius:10,cursor:active?"default":"pointer",textAlign:"center",opacity:active?0.6:1}}>
    <div style={{fontSize:20,marginBottom:4}}>{tmpl.icon}</div>
    <div style={{fontWeight:700,fontSize:10,color:active?C.g:C.t}}>{tmpl.title.replace(/^. /,"")}</div>
    <div style={{fontSize:8,color:C.td,marginTop:2}}>{tmpl.desc}</div>
    {active&&<div style={{fontSize:7,color:C.g,marginTop:3,fontWeight:700}}>ACTIF</div>}
    </div>;
    })}
   </div>
  </Sect>
 </>;
}
/* 5. AI WEEKLY COACH */
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
