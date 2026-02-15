import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import * as U from "../utils/index.jsx";
// Destructure commonly used utilities for readability
const { C, C_DARK, C_LIGHT, getTheme, applyTheme, MN, curM, ml, fmt, fK, pct, clamp, prevM, nextM, pf, gr, FONT, FONT_TITLE, BF, deadline, qOf, qMonths, qLabel, ago, uid, curW, MOODS, sinceLbl, sinceMonths, CSS, DS, DH, DEAL_STAGES, DEMO_JOURNAL, DEMO_ACTIONS, DEMO_PULSES, DEMO_DEALS, DEMO_OKRS, DEMO_SYNERGIES, DEMO_SUBS, DEMO_TEAM, DEMO_CLIENTS, SYN_TYPES, SYN_STATUS, SUB_CATS, SLACK_MODES, EXCLUDED_ACCOUNTS, CURR_SYMBOLS, REV_ENVS, GHL_BASE, STRIPE_PROXY, STORE_URL, ErrorBoundary, mkPrefill, autoGenerateReport, autoCategorize, autoDetectSubscriptions, subMonthly, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, generateInvoices, refreshInvoiceStatuses, ghlCreateInvoice, ghlSendInvoice, mkDemoInvoices, teamMonthly, normalizeStr, fuzzyMatch, matchSubsToRevolut, deduplicatedCharges, mkGHLDemo, ghlUpdateContact, ghlCreateContact, fetchGHL, syncGHLForSoc, slackWebhookSend, slackBotSend, slackSend, slackMention, buildPulseSlackMsg, buildReportSlackMsg, buildReminderSlackMsg, buildValidationSlackMsg, checkAndSendReminders, fetchStripe, syncStripeData, getStripeChargesForClient, getStripeTotal, mkRevolutDemo, fetchRevolut, syncRevolut, mkSocRevDemo, syncSocRevolut, revFinancials, storeCall, sbAuthHeaders, sbUpsert, sbGet, sbList, sGet, sSet, syncFromSupabase, fetchHoldingFromSB, fetchSocietiesFromSB, calcH, simH, healthScore, leadScore, leadScoreColor, leadScoreLabel, qCA, getAlerts, buildFeed, project, runway, calcLeaderboard, buildAIContext, calcMilestoneData, calcMilestones, calcSmartAlerts, genInsights, calcBenchmark, getPlaybooks, calcClientHealthScore, genPorteurNotifications, BILL_TYPES, CLIENT_STATUS, curQ, AUTO_CAT_MAP, categorizeTransaction, DEMO_KB } = U;

import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";
import { BankingTransactions, SocBankWidget } from "../components/features.jsx";

export function InboxPanel({soc,ghlData,socBankData,clients}){
 const[filter,setFilter]=useState("all");const[timeF,setTimeF]=useState("today");
 const[readIds,setReadIds]=useState(()=>{try{return JSON.parse(localStorage.getItem(`inbox_read_${soc.id}`)||"[]");}catch{return[];}});
 const markRead=(id)=>{const n=[...readIds,id];setReadIds(n);try{localStorage.setItem(`inbox_read_${soc.id}`,JSON.stringify(n));}catch{}};
 const items=useMemo(()=>{
  const now=new Date();const todayStr=now.toISOString().slice(0,10);
  const weekAgo=new Date(now-7*864e5);const monthAgo=new Date(now-30*864e5);
  const all=[];
  const gd=ghlData?.[soc.id];
  // Leads
  (gd?.ghlClients||[]).forEach(c=>{const d=new Date(c.at||c.dateAdded||0);all.push({id:"lead_"+c.id,type:"lead",icon:"🟢",desc:`Nouveau lead: ${c.name||c.email||"—"}`,date:d,action:"Contacter",actionTab:9});});
  // Payments
  (socBankData?.transactions||[]).filter(t=>(t.legs?.[0]?.amount||0)>0).forEach(t=>{const d=new Date(t.created_at||t.date||0);const amt=Math.abs(t.legs?.[0]?.amount||0);const desc=t.legs?.[0]?.description||t.reference||"Paiement";all.push({id:"pay_"+t.id,type:"payment",icon:"💰",desc:`${desc}: +${fmt(amt)}€`,date:d,action:"Voir"});});
  // Calendar events
  (gd?.calendarEvents||[]).forEach(e=>{const d=new Date(e.startTime||0);all.push({id:"rdv_"+e.id,type:"rdv",icon:"📅",desc:`RDV: ${e.title||e.contactName||"—"}`,date:d,action:"Détails"});});
  // Won/lost deals
  (gd?.opportunities||[]).filter(o=>o.status==="won"||o.status==="lost").forEach(o=>{const d=new Date(o.updatedAt||o.createdAt||0);all.push({id:"deal_"+o.id,type:"deal",icon:o.status==="won"?"🏆":"❌",desc:`Deal ${o.status==="won"?"gagné":"perdu"}: ${o.name||"—"} (${fmt(o.value||0)}€)`,date:d});});
  // Filter by time
  const cutoff=timeF==="today"?new Date(todayStr):timeF==="week"?weekAgo:monthAgo;
  return all.filter(i=>i.date>=cutoff).filter(i=>filter==="all"||i.type===filter).sort((a,b)=>b.date-a.date);
 },[soc.id,ghlData,socBankData,filter,timeF]);
 const filters=[{v:"all",l:"Tout"},{v:"lead",l:"Leads"},{v:"payment",l:"Paiements"},{v:"rdv",l:"RDV"},{v:"deal",l:"Deals"}];
 const timeFilters=[{v:"today",l:"Aujourd'hui"},{v:"week",l:"Cette semaine"},{v:"month",l:"Ce mois"}];
 return <Sect title="📥 Inbox" sub="Feed d'activité">
  <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>{filters.map(f2=><button key={f2.v} onClick={()=>setFilter(f2.v)} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${filter===f2.v?C.acc+"66":C.brd}`,background:filter===f2.v?C.accD:"transparent",color:filter===f2.v?C.acc:C.td,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{f2.l}</button>)}</div>
  <div style={{display:"flex",gap:4,marginBottom:12}}>{timeFilters.map(f2=><button key={f2.v} onClick={()=>setTimeF(f2.v)} style={{padding:"3px 8px",borderRadius:12,border:`1px solid ${timeF===f2.v?C.b+"66":C.brd}`,background:timeF===f2.v?C.bD:"transparent",color:timeF===f2.v?C.b:C.td,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{f2.l}</button>)}</div>
  {items.length===0&&<Card><div style={{textAlign:"center",padding:20,color:C.td,fontSize:12}}>Aucune activité pour cette période</div></Card>}
  {items.map(it=>{const isRead=readIds.includes(it.id);return <div key={it.id} className="fu" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:isRead?"transparent":"rgba(255,170,0,.03)",borderRadius:10,border:`1px solid ${isRead?C.brd:"rgba(255,170,0,.12)"}`,marginBottom:4,transition:"all .2s"}}>
   <span style={{fontSize:16,flexShrink:0}}>{it.icon}</span>
   <div style={{flex:1,minWidth:0}}>
    <div style={{fontSize:12,fontWeight:isRead?500:700,color:isRead?C.td:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.desc}</div>
    <div style={{fontSize:9,color:C.td}}>{ago(it.date)}</div>
   </div>
   {!isRead&&<button onClick={()=>markRead(it.id)} style={{padding:"3px 8px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.card,color:C.td,fontSize:9,cursor:"pointer",fontFamily:FONT}}>✓ Lu</button>}
  </div>;})}
 </Sect>;
}

/* ===== AGENDA PANEL ===== */
export function AgendaPanel({soc,ghlData}){
 const[view,setView]=useState("today");
 const events=useMemo(()=>{
  const gd=ghlData?.[soc.id];const evts=(gd?.calendarEvents||[]).map(e=>({...e,start:new Date(e.startTime||0),end:new Date(e.endTime||e.startTime||0)})).sort((a,b)=>a.start-b.start);
  const now=new Date();const todayStr=now.toISOString().slice(0,10);
  if(view==="today")return evts.filter(e=>e.start.toISOString().slice(0,10)===todayStr);
  const weekEnd=new Date(now.getTime()+7*864e5);return evts.filter(e=>e.start>=now&&e.start<=weekEnd);
 },[ghlData,soc.id,view]);
 const todayEvts=useMemo(()=>{const now=new Date();const ts=now.toISOString().slice(0,10);return(ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>(e.startTime||"").startsWith(ts)).sort((a,b)=>new Date(a.startTime)-new Date(b.startTime));},[ghlData,soc.id]);
 const typeIcon=(title)=>/strat/i.test(title||"")?"📞":/int[eé]g/i.test(title||"")?"🤝":"📅";
 return <Sect title="📅 Agenda" sub="Calendrier & RDV">
  <div style={{display:"flex",gap:4,marginBottom:12}}>{[{v:"today",l:"Aujourd'hui"},{v:"week",l:"Cette semaine"}].map(f2=><button key={f2.v} onClick={()=>setView(f2.v)} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${view===f2.v?C.acc+"66":C.brd}`,background:view===f2.v?C.accD:"transparent",color:view===f2.v?C.acc:C.td,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{f2.l}</button>)}</div>
  {todayEvts.length>0&&<Card style={{marginBottom:12,borderLeft:`3px solid ${C.acc}`}}><div style={{fontSize:10,fontWeight:700,color:C.acc,marginBottom:6}}>📌 AUJOURD'HUI — {todayEvts.length} RDV</div>
   {todayEvts.map((e,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:i<todayEvts.length-1?`1px solid ${C.brd}`:"none"}}>
    <span style={{fontSize:14}}>{typeIcon(e.title)}</span>
    <div style={{flex:1}}><div style={{fontWeight:600,fontSize:11}}>{e.title||e.contactName||"RDV"}</div><div style={{fontSize:9,color:C.td}}>{new Date(e.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}{e.contactName?` · ${e.contactName}`:""}</div></div>
    <span style={{fontSize:8,padding:"2px 6px",borderRadius:8,background:(e.status||"").includes("confirmed")?C.gD:C.oD,color:(e.status||"").includes("confirmed")?C.g:C.o,fontWeight:600}}>{(e.status||"prévu").replace("_"," ")}</span>
   </div>)}
  </Card>}
  {events.length===0&&<Card><div style={{textAlign:"center",padding:20,color:C.td,fontSize:12}}>Aucun RDV {view==="today"?"aujourd'hui":"cette semaine"}</div></Card>}
  {events.map((e,i)=>{const dayStr=e.start.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});return <Card key={e.id||i} style={{marginBottom:4}}>
   <div style={{display:"flex",alignItems:"center",gap:10}}>
    <div style={{width:40,textAlign:"center"}}><div style={{fontSize:18}}>{typeIcon(e.title)}</div><div style={{fontSize:8,color:C.td}}>{dayStr}</div></div>
    <div style={{flex:1}}>
     <div style={{fontWeight:700,fontSize:12}}>{e.title||"RDV"}</div>
     <div style={{fontSize:10,color:C.td}}>{e.start.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})} — {e.end.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</div>
     {e.contactName&&<div style={{fontSize:9,color:C.b,marginTop:2}}>👤 {e.contactName}</div>}
    </div>
    <span style={{fontSize:8,padding:"2px 6px",borderRadius:8,background:(e.status||"").includes("confirmed")?C.gD:(e.status||"").includes("cancel")?C.rD:C.oD,color:(e.status||"").includes("confirmed")?C.g:(e.status||"").includes("cancel")?C.r:C.o,fontWeight:600}}>{(e.status||"prévu").replace("_"," ")}</span>
   </div>
  </Card>;})}
 </Sect>;
}

/* ===== CONVERSATIONS PANEL ===== */
export function ConversationsPanel({soc}){
 const socKey=soc.ghlLocationId||soc.id;
 const[convos,setConvos]=useState([]);const[selConvo,setSelConvo]=useState(null);const[msgs,setMsgs]=useState([]);const[msgInput,setMsgInput]=useState("");const[loading,setLoading]=useState(false);
 useEffect(()=>{let cancel=false;setLoading(true);
  fetch(`/api/ghl?action=conversations_list&loc=${socKey}`).then(r=>r.json()).then(d=>{if(!cancel)setConvos(d.conversations||d||[]);}).catch(()=>{}).finally(()=>{if(!cancel)setLoading(false);});
  return()=>{cancel=true;};
 },[socKey]);
 const loadMsgs=(c)=>{setSelConvo(c);setMsgs([]);
  fetch(`/api/ghl?action=conversations_messages&loc=${socKey}&conversationId=${c.id}`).then(r=>r.json()).then(d=>setMsgs(d.messages||d||[])).catch(()=>{});
 };
 const sendMsg=()=>{if(!msgInput.trim()||!selConvo)return;
  fetch(`/api/ghl?action=conversation_send&loc=${socKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"Email",contactId:selConvo.contactId||selConvo.id,message:msgInput})}).then(()=>{setMsgs(p=>[...p,{body:msgInput,direction:"outbound",dateAdded:new Date().toISOString()}]);setMsgInput("");}).catch(()=>{});
 };
 return <Sect title="💬 Conversations" sub="Messages GHL">
  <div style={{display:"flex",gap:8,height:480}}>
   <div className="glass-card-static" style={{width:240,overflow:"auto",padding:0}}>
    {loading&&<div style={{padding:20,textAlign:"center",color:C.td,fontSize:11}}>Chargement...</div>}
    {!loading&&convos.length===0&&<div style={{padding:20,textAlign:"center",color:C.td,fontSize:11}}>Aucune conversation</div>}
    {convos.map((c,i)=><div key={c.id||i} onClick={()=>loadMsgs(c)} style={{padding:"10px 12px",borderBottom:`1px solid ${C.brd}`,cursor:"pointer",background:selConvo?.id===c.id?"rgba(255,170,0,.08)":"transparent",transition:"background .15s"}} onMouseEnter={e=>{if(selConvo?.id!==c.id)e.currentTarget.style.background=C.card2;}} onMouseLeave={e=>{if(selConvo?.id!==c.id)e.currentTarget.style.background="transparent";}}>
     <div style={{fontWeight:600,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.contactName||c.fullName||c.email||"Contact"}</div>
     <div style={{fontSize:9,color:C.td,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.lastMessageBody||c.snippet||"—"}</div>
     <div style={{fontSize:8,color:C.tm}}>{c.dateUpdated?ago(c.dateUpdated):""}</div>
    </div>)}
   </div>
   <div className="glass-card-static" style={{flex:1,display:"flex",flexDirection:"column",padding:0}}>
    {!selConvo&&<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.td,fontSize:12}}>Sélectionnez une conversation</div>}
    {selConvo&&<>
     <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.brd}`,fontWeight:700,fontSize:12}}>{selConvo.contactName||selConvo.fullName||"Contact"}</div>
     <div style={{flex:1,overflow:"auto",padding:10}}>
      {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.direction==="outbound"?"flex-end":"flex-start",marginBottom:6}}>
       <div style={{maxWidth:"70%",padding:"8px 12px",borderRadius:12,background:m.direction==="outbound"?"linear-gradient(135deg,#FFBF00,#FF9D00)":"rgba(255,255,255,.06)",color:m.direction==="outbound"?"#0a0a0f":C.t,fontSize:11}}>
        <div>{m.body||m.text||"—"}</div>
        <div style={{fontSize:8,color:m.direction==="outbound"?"rgba(0,0,0,.5)":C.tm,marginTop:2}}>{m.dateAdded?ago(m.dateAdded):""}</div>
       </div>
      </div>)}
     </div>
     <div style={{padding:8,borderTop:`1px solid ${C.brd}`,display:"flex",gap:6}}>
      <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendMsg();}} placeholder="Écrire un message..." style={{flex:1,padding:"8px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
      <Btn small onClick={sendMsg}>Envoyer</Btn>
     </div>
    </>}
   </div>
  </div>
 </Sect>;
}

/* ===== TODO PANEL ===== */
export function TodoPanel({soc,ghlData,socBankData,clients}){
 const[manualTasks,setManualTasks]=useState(()=>{try{return JSON.parse(localStorage.getItem(`todo_${soc.id}`)||"[]");}catch{return[];}});
 const[doneIds,setDoneIds]=useState(()=>{try{return JSON.parse(localStorage.getItem(`todo_done_${soc.id}`)||"[]");}catch{return[];}});
 const[newTask,setNewTask]=useState("");
 const saveDone=(ids)=>{setDoneIds(ids);try{localStorage.setItem(`todo_done_${soc.id}`,JSON.stringify(ids));}catch{}};
 const saveManual=(tasks)=>{setManualTasks(tasks);try{localStorage.setItem(`todo_${soc.id}`,JSON.stringify(tasks));}catch{}};
 const toggleDone=(id)=>{const n=doneIds.includes(id)?doneIds.filter(x=>x!==id):[...doneIds,id];saveDone(n);};
 const addTask=()=>{if(!newTask.trim())return;saveManual([...manualTasks,{id:uid(),text:newTask.trim(),priority:"normal",at:new Date().toISOString()}]);setNewTask("");};
 const autoTasks=useMemo(()=>{
  const tasks=[];const now=new Date();const todayStr=now.toISOString().slice(0,10);
  // Today's calendar events
  (ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>(e.startTime||"").startsWith(todayStr)).forEach(e=>{const t=new Date(e.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});tasks.push({id:"cal_"+e.id,text:`Appel avec ${e.contactName||e.title||"client"} à ${t}`,priority:"urgent",auto:true});});
  // Unpaid clients (>45 days)
  const myCl=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active");
  const txs=socBankData?.transactions||[];const now45=Date.now()-45*864e5;
  myCl.forEach(cl=>{if(!cl.billing||cl.billing.type==="oneoff")return;const cn=(cl.name||"").toLowerCase().trim();const hasRecent=txs.some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;const txDate=new Date(tx.created_at||tx.date||0).getTime();if(txDate<now45)return false;const desc=(leg.description||tx.reference||"").toLowerCase();return cn.length>2&&desc.includes(cn);});if(!hasRecent)tasks.push({id:"unpaid_"+cl.id,text:`Relancer ${cl.name} — facture impayée`,priority:"urgent",auto:true});});
  // Recent leads (<48h)
  const h48=Date.now()-48*36e5;
  (ghlData?.[soc.id]?.ghlClients||[]).filter(c=>{const d=new Date(c.at||c.dateAdded||0).getTime();return d>h48;}).forEach(c=>{tasks.push({id:"newlead_"+c.id,text:`Nouveau lead: ${c.name||c.email||"—"} — à contacter`,priority:"important",auto:true});});
  // Expiring contracts
  myCl.forEach(cl=>{const end=commitmentEnd(cl);if(end){const days=Math.round((end-now)/(864e5));if(days>0&&days<=30)tasks.push({id:"expiry_"+cl.id,text:`Contrat ${cl.name} expire dans ${days} jours`,priority:days<=7?"urgent":"important",auto:true});}});
  return tasks;
 },[soc.id,ghlData,socBankData,clients]);
 const allTasks=[...autoTasks,...manualTasks.map(t=>({...t,auto:false}))];
 const priorityIcon={urgent:"🔴",important:"🟡",normal:"🟢"};
 const priorityOrder={urgent:0,important:1,normal:2};
 const sorted=[...allTasks].sort((a,b)=>(priorityOrder[a.priority]||2)-(priorityOrder[b.priority]||2));
 return <Sect title="✅ Actions du jour" sub="Tâches automatiques & manuelles">
  <div style={{display:"flex",gap:6,marginBottom:12}}>
   <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTask();}} placeholder="Ajouter une tâche..." style={{flex:1,padding:"8px 12px",borderRadius:10,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
   <Btn small onClick={addTask}>+ Ajouter</Btn>
  </div>
  {sorted.length===0&&<Card><div style={{textAlign:"center",padding:20,color:C.td,fontSize:12}}>Aucune tâche</div></Card>}
  {sorted.map(t=>{const done=doneIds.includes(t.id);return <div key={t.id} className="fu" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:done?C.card:"rgba(14,14,22,.6)",borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3}}>
   <div onClick={()=>toggleDone(t.id)} style={{width:18,height:18,borderRadius:5,border:`2px solid ${done?C.g:C.brd}`,background:done?C.gD:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{done&&<span style={{color:C.g,fontSize:11}}>✓</span>}</div>
   <span style={{fontSize:12,flexShrink:0}}>{priorityIcon[t.priority]||"🟢"}</span>
   <div style={{flex:1,fontSize:12,fontWeight:done?400:600,color:done?C.td:C.t,textDecoration:done?"line-through":"none"}}>{t.text}</div>
   {t.auto&&<span style={{fontSize:8,color:C.td,background:C.card2,padding:"1px 5px",borderRadius:6}}>auto</span>}
   {!t.auto&&<button onClick={()=>saveManual(manualTasks.filter(m=>m.id!==t.id))} style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:10,padding:"2px 4px"}}>✕</button>}
  </div>;})}
 </Sect>;
}

/* ===== PIPELINE KANBAN PANEL ===== */
export function PipelineKanbanPanel({soc,ghlData}){
 const gd=ghlData?.[soc.id];const opps=gd?.opportunities||[];const stages=gd?.pipelines?.[0]?.stages||[];
 const[dragId,setDragId]=useState(null);
 const stageNames=stages.length>0?stages.map(s=>s.name||s):["Nouveau","Contacté","Qualifié","Proposition","Gagné"];
 const byStage=useMemo(()=>{const m={};stageNames.forEach(s=>{m[s]=opps.filter(o=>o.stage===s);});const unmatched=opps.filter(o=>!stageNames.includes(o.stage));if(unmatched.length>0)m["Autre"]=unmatched;return m;},[opps,stageNames]);
 const moveOpp=(oppId,newStage)=>{
  const socKey=soc.ghlLocationId||soc.id;
  fetch(`/api/ghl?action=opportunity_update&loc=${socKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:oppId,stageId:newStage})}).catch(()=>{});
 };
 return <Sect title="🔄 Pipeline Kanban" sub="Opportunités par étape">
  <div style={{display:"flex",gap:8,overflow:"auto",paddingBottom:8}}>
   {Object.entries(byStage).map(([stage,cards],si)=><div key={stage} style={{minWidth:180,flex:"1 0 180px"}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(dragId){moveOpp(dragId,stage);setDragId(null);}}}>
    <div style={{padding:"8px 10px",borderRadius:"10px 10px 0 0",background:GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]+"22",borderBottom:`2px solid ${GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]}`,marginBottom:4}}>
     <div style={{fontWeight:700,fontSize:11,color:GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]}}>{stage}</div>
     <div style={{fontSize:9,color:C.td}}>{cards.length} deal{cards.length>1?"s":""}</div>
    </div>
    {cards.map(o=><div key={o.id} draggable onDragStart={()=>setDragId(o.id)} className="glass-card-static" style={{padding:10,marginBottom:4,cursor:"grab",borderLeft:`3px solid ${GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]}`}}>
     <div style={{fontWeight:600,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name||o.contact?.name||"—"}</div>
     <div style={{fontSize:10,fontWeight:800,color:C.acc,marginTop:2}}>{fmt(o.value||0)}€</div>
     <div style={{fontSize:8,color:C.td,marginTop:2}}>{o.createdAt?ago(o.createdAt):""}</div>
    </div>)}
    {cards.length===0&&<div style={{padding:16,textAlign:"center",color:C.tm,fontSize:10,border:`1px dashed ${C.brd}`,borderRadius:8}}>Vide</div>}
   </div>)}
  </div>
 </Sect>;
}

/* ===== RESSOURCES PANEL ===== */
export function RessourcesPanel({soc,clients}){
 const[resources,setResources]=useState(()=>{try{return JSON.parse(localStorage.getItem(`resources_${soc.id}`)||"[]");}catch{return[];}});
 const[newR,setNewR]=useState({title:"",url:"",clientId:"",type:"video"});
 const saveRes=(r)=>{setResources(r);try{localStorage.setItem(`resources_${soc.id}`,JSON.stringify(r));}catch{}};
 const addRes=()=>{if(!newR.title||!newR.url)return;saveRes([...resources,{...newR,id:uid(),at:new Date().toISOString()}]);setNewR({title:"",url:"",clientId:"",type:"video"});};
 const delRes=(id)=>saveRes(resources.filter(r=>r.id!==id));
 const myCl=(clients||[]).filter(c=>c.socId===soc.id);
 const byClient=useMemo(()=>{const m={};resources.forEach(r=>{const k=r.clientId||"general";if(!m[k])m[k]=[];m[k].push(r);});return m;},[resources]);
 const typeIcons={video:"🎬",loom:"📹",tella:"📹",skool:"🎓",notion:"📝",link:"🔗"};
 return <Sect title="📹 Ressources" sub="Vidéos, liens & documents">
  <Card style={{marginBottom:12}}>
   <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
    <input value={newR.title} onChange={e=>setNewR({...newR,title:e.target.value})} placeholder="Titre" style={{flex:"1 1 120px",padding:"6px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
    <input value={newR.url} onChange={e=>setNewR({...newR,url:e.target.value})} placeholder="URL" style={{flex:"2 1 200px",padding:"6px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
    <select value={newR.type} onChange={e=>setNewR({...newR,type:e.target.value})} style={{padding:"6px 8px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:10,fontFamily:FONT}}>
     <option value="video">🎬 Vidéo</option><option value="loom">📹 Loom</option><option value="tella">📹 Tella</option><option value="skool">🎓 Skool</option><option value="notion">📝 Notion</option><option value="link">🔗 Lien</option>
    </select>
    <select value={newR.clientId} onChange={e=>setNewR({...newR,clientId:e.target.value})} style={{padding:"6px 8px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:10,fontFamily:FONT}}>
     <option value="">Général</option>{myCl.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
    <Btn small onClick={addRes}>+ Ajouter</Btn>
   </div>
  </Card>
  {Object.entries(byClient).map(([clientId,items])=>{const cl=myCl.find(c=>c.id===clientId);return <div key={clientId} style={{marginBottom:12}}>
   <div style={{fontSize:11,fontWeight:700,color:C.t,marginBottom:4}}>{cl?`👤 ${cl.name}`:"📁 Général"}</div>
   {items.map(r=><div key={r.id} className="fu" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"rgba(14,14,22,.6)",borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3}}>
    <span style={{fontSize:14}}>{typeIcons[r.type]||"🔗"}</span>
    <div style={{flex:1,minWidth:0}}>
     <a href={r.url} target="_blank" rel="noopener noreferrer" style={{fontWeight:600,fontSize:11,color:C.b,textDecoration:"none"}}>{r.title}</a>
     <div style={{fontSize:8,color:C.td}}>{r.type} · {r.at?ago(r.at):""}</div>
    </div>
    <button onClick={()=>delRes(r.id)} style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:10}}>✕</button>
   </div>)}
  </div>;})}
  {resources.length===0&&<Card><div style={{textAlign:"center",padding:20,color:C.td,fontSize:12}}>Aucune ressource ajoutée</div></Card>}
 </Sect>;
}

/* ===== ACTIVITE PANEL (merged Inbox + Todo) ===== */
export function ActivitePanel({soc,ghlData,socBankData,clients}){
 const[manualTasks,setManualTasks]=useState(()=>{try{return JSON.parse(localStorage.getItem(`todo_${soc.id}`)||"[]");}catch{return[];}});
 const[doneIds,setDoneIds]=useState(()=>{try{return JSON.parse(localStorage.getItem(`todo_done_${soc.id}`)||"[]");}catch{return[];}});
 const[newTask,setNewTask]=useState("");
 const[readIds,setReadIds]=useState(()=>{try{return JSON.parse(localStorage.getItem(`inbox_read_${soc.id}`)||"[]");}catch{return[];}});
 const saveDone=(ids)=>{setDoneIds(ids);try{localStorage.setItem(`todo_done_${soc.id}`,JSON.stringify(ids));}catch{}};
 const saveManual=(tasks)=>{setManualTasks(tasks);try{localStorage.setItem(`todo_${soc.id}`,JSON.stringify(tasks));}catch{}};
 const toggleDone=(id)=>{const n=doneIds.includes(id)?doneIds.filter(x=>x!==id):[...doneIds,id];saveDone(n);};
 const addTask=()=>{if(!newTask.trim())return;saveManual([...manualTasks,{id:uid(),text:newTask.trim(),priority:"normal",at:new Date().toISOString()}]);setNewTask("");};
 const markRead=(id)=>{const n=[...readIds,id];setReadIds(n);try{localStorage.setItem(`inbox_read_${soc.id}`,JSON.stringify(n));}catch{}};
 // Auto tasks
 const autoTasks=useMemo(()=>{
  const tasks=[];const now=new Date();const todayStr=now.toISOString().slice(0,10);
  (ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>(e.startTime||"").startsWith(todayStr)).forEach(e=>{const t=new Date(e.startTime).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});tasks.push({id:"cal_"+e.id,text:`📞 Appel avec ${e.contactName||e.title||"client"} à ${t}`,priority:"urgent",auto:true});});
  const myCl=(clients||[]).filter(c=>c.socId===soc.id&&c.status==="active");
  const txs=socBankData?.transactions||[];const now45=Date.now()-45*864e5;
  myCl.forEach(cl=>{if(!cl.billing||cl.billing.type==="oneoff")return;const cn=(cl.name||"").toLowerCase().trim();const hasRecent=txs.some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;return new Date(tx.created_at||tx.date||0).getTime()>now45&&(leg.description||tx.reference||"").toLowerCase().includes(cn);});if(!hasRecent)tasks.push({id:"unpaid_"+cl.id,text:`💸 Relancer ${cl.name} — facture impayée`,priority:"urgent",auto:true});});
  const h48=Date.now()-48*36e5;
  (ghlData?.[soc.id]?.ghlClients||[]).filter(c=>new Date(c.at||c.dateAdded||0).getTime()>h48).forEach(c=>{tasks.push({id:"newlead_"+c.id,text:`🟢 Nouveau lead: ${c.name||c.email||"—"} — à contacter`,priority:"important",auto:true});});
  myCl.forEach(cl=>{const end=commitmentEnd(cl);if(end){const days=Math.round((end-now)/(864e5));if(days>0&&days<=30)tasks.push({id:"expiry_"+cl.id,text:`📋 Contrat ${cl.name} expire dans ${days} jours`,priority:days<=7?"urgent":"important",auto:true});}});
  return tasks;
 },[soc.id,ghlData,socBankData,clients]);
 const allTasks=[...autoTasks,...manualTasks.map(t=>({...t,auto:false}))];
 const priorityIcon={urgent:"🔴",important:"🟡",normal:"🟢"};
 const priorityOrder={urgent:0,important:1,normal:2};
 const sorted=[...allTasks].sort((a,b)=>(priorityOrder[a.priority]||2)-(priorityOrder[b.priority]||2));
 // Activity feed
 const feedItems=useMemo(()=>{
  const all=[];const gd=ghlData?.[soc.id];
  (gd?.ghlClients||[]).forEach(c=>{const d=new Date(c.at||c.dateAdded||0);all.push({id:"lead_"+c.id,type:"lead",icon:"🟢",desc:`Nouveau lead: ${c.name||c.email||"—"}`,date:d});});
  (socBankData?.transactions||[]).filter(t=>(t.legs?.[0]?.amount||0)>0).forEach(t=>{const d=new Date(t.created_at||t.date||0);const amt=Math.abs(t.legs?.[0]?.amount||0);all.push({id:"pay_"+t.id,type:"payment",icon:"💰",desc:`${t.legs?.[0]?.description||t.reference||"Paiement"}: +${fmt(amt)}€`,date:d});});
  (gd?.calendarEvents||[]).forEach(e=>{const d=new Date(e.startTime||0);all.push({id:"rdv_"+e.id,type:"rdv",icon:"📅",desc:`RDV: ${e.title||e.contactName||"—"}`,date:d});});
  (gd?.opportunities||[]).filter(o=>o.status==="won"||o.status==="lost").forEach(o=>{const d=new Date(o.updatedAt||o.createdAt||0);all.push({id:"deal_"+o.id,type:"deal",icon:o.status==="won"?"🏆":"❌",desc:`Deal ${o.status==="won"?"gagné":"perdu"}: ${o.name||"—"} (${fmt(o.value||0)}€)`,date:d});});
  return all.sort((a,b)=>b.date-a.date).slice(0,30);
 },[soc.id,ghlData,socBankData]);
 // Productivité semaine
 const weekKey=`prod_${soc.id}_${curW()}`;
 const[weekDone,setWeekDone]=useState(()=>{try{return parseInt(localStorage.getItem(weekKey)||"0");}catch{return 0;}});
 useEffect(()=>{const cnt=sorted.filter(t=>doneIds.includes(t.id)).length;setWeekDone(cnt);try{localStorage.setItem(weekKey,String(cnt));}catch{}},[doneIds,sorted]);
 const weekTotal=sorted.length;const weekPct=weekTotal>0?Math.round(weekDone/weekTotal*100):0;
 return <Sect title="⚡ Activité" sub="Tâches & feed d'activité">
  {/* Productivité semaine */}
  <div className="glass-card-static" style={{padding:14,marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
   <span style={{fontSize:20}}>📊</span>
   <div style={{flex:1}}>
    <div style={{fontSize:11,fontWeight:700,color:C.t}}>Cette semaine: {weekDone} tâches complétées / {weekTotal} total ({weekPct}%)</div>
    <div style={{height:5,background:C.brd,borderRadius:3,overflow:"hidden",marginTop:4}}><div style={{height:"100%",width:`${weekPct}%`,background:weekPct>=80?C.g:weekPct>=50?C.acc:C.o,borderRadius:3,transition:"width .5s ease"}}/></div>
   </div>
  </div>
  {/* Tasks section */}
  <div className="glass-card-static" style={{padding:16,marginBottom:16}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
    <span style={{fontSize:11,fontWeight:800,color:C.acc,fontFamily:FONT_TITLE}}>📋 TÂCHES DU JOUR</span>
    <span style={{fontSize:9,color:C.td}}>{sorted.filter(t=>!doneIds.includes(t.id)).length} restantes</span>
   </div>
   <div style={{display:"flex",gap:6,marginBottom:10}}>
    <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTask();}} placeholder="Ajouter une tâche..." style={{flex:1,padding:"7px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}/>
    <Btn small onClick={addTask}>+</Btn>
   </div>
   {sorted.map(t=>{const done=doneIds.includes(t.id);return <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:done?"transparent":"rgba(14,14,22,.6)",borderRadius:8,border:`1px solid ${C.brd}`,marginBottom:3,opacity:done?.5:1}}>
    <div onClick={()=>toggleDone(t.id)} style={{width:16,height:16,borderRadius:4,border:`2px solid ${done?C.g:C.brd}`,background:done?C.gD:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{done&&<span style={{color:C.g,fontSize:9}}>✓</span>}</div>
    <span style={{fontSize:11,flexShrink:0}}>{priorityIcon[t.priority]||"🟢"}</span>
    <div style={{flex:1,fontSize:11,fontWeight:done?400:600,color:done?C.td:C.t,textDecoration:done?"line-through":"none"}}>{t.text}</div>
    {t.auto&&<span style={{fontSize:8,color:C.td,background:C.card2,padding:"1px 5px",borderRadius:6}}>auto</span>}
    {/* Actions 1-clic */}
    {t.auto&&t.id.startsWith("cal_")&&<button onClick={(e)=>{e.stopPropagation();const cName=t.text.replace(/^📞 Appel avec /,"").replace(/ à .*$/,"");const cl2=(clients||[]).find(c=>c.socId===soc.id&&(c.name||"").toLowerCase().includes(cName.toLowerCase()));if(cl2?.phone)window.open(`tel:${cl2.phone}`);else if(soc.ghlLocationId)window.open(`https://app.gohighlevel.com/v2/location/${soc.ghlLocationId}/calendar`);}} style={{padding:"2px 6px",borderRadius:5,border:`1px solid ${C.b}`,background:C.bD,color:C.b,fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>📞</button>}
    {t.auto&&(t.id.startsWith("unpaid_")||t.id.startsWith("newlead_"))&&<button onClick={(e)=>{e.stopPropagation();const clId=t.id.split("_").slice(1).join("_");const cl2=(clients||[]).find(c=>c.id===clId)||(ghlData?.[soc.id]?.ghlClients||[]).find(c=>(c.id||c.ghlId)===clId);if(cl2)alert(`💬 Contact: ${cl2.name||"—"}\n📧 ${cl2.email||"—"}\n📱 ${cl2.phone||"—"}`);}} style={{padding:"2px 6px",borderRadius:5,border:`1px solid ${C.o}`,background:C.oD,color:C.o,fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>💬</button>}
    {!t.auto&&<button onClick={()=>saveManual(manualTasks.filter(m=>m.id!==t.id))} style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:10}}>✕</button>}
   </div>;})}
   {sorted.length===0&&<div style={{textAlign:"center",padding:12,color:C.td,fontSize:11}}>✅ Aucune tâche</div>}
  </div>
  {/* Activity feed */}
  <div className="glass-card-static" style={{padding:16}}>
   <div style={{fontSize:11,fontWeight:800,color:C.b,fontFamily:FONT_TITLE,marginBottom:10}}>📥 ACTIVITÉ RÉCENTE</div>
   <div style={{maxHeight:400,overflowY:"auto"}}>
    {feedItems.map(it=>{const isRead=readIds.includes(it.id);return <div key={it.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:isRead?"transparent":"rgba(255,170,0,.03)",borderRadius:8,border:`1px solid ${isRead?C.brd:"rgba(255,170,0,.12)"}`,marginBottom:3}}>
     <span style={{fontSize:14,flexShrink:0}}>{it.icon}</span>
     <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:11,fontWeight:isRead?400:600,color:isRead?C.td:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.desc}</div>
      <div style={{fontSize:9,color:C.td}}>{ago(it.date)}</div>
     </div>
     {!isRead&&<button onClick={()=>markRead(it.id)} style={{padding:"2px 6px",borderRadius:6,border:`1px solid ${C.brd}`,background:C.card,color:C.td,fontSize:8,cursor:"pointer",fontFamily:FONT}}>✓</button>}
    </div>;})}
    {feedItems.length===0&&<div style={{textAlign:"center",padding:16,color:C.td,fontSize:11}}>Aucune activité récente</div>}
   </div>
  </div>
 </Sect>;
}

/* ===== CLIENTS UNIFIED PANEL (Clients + Conversations + Pipeline toggle) ===== */
export function ClientsUnifiedPanel({soc,clients,saveClients,ghlData,socBankData,invoices,saveInvoices,stripeData}){
 const[viewMode,setViewMode]=useState("list");
 const[selClient,setSelClient]=useState(null);
 const[convos,setConvos]=useState([]);const[convoMsgs,setConvoMsgs]=useState([]);const[convoLoading,setConvoLoading]=useState(false);const[msgInput,setMsgInput]=useState("");
 const socKey=soc.ghlLocationId||soc.id;
 // Load conversations for selected client
 useEffect(()=>{
  if(!selClient)return;setConvoLoading(true);setConvos([]);setConvoMsgs([]);
  const contactId=selClient.ghlId||selClient.id;
  fetch(`/api/ghl?action=conversations_list&loc=${socKey}&contactId=${contactId}`).then(r=>r.json()).then(d=>{setConvos(d.conversations||d||[]);
   if((d.conversations||d||[]).length>0){const c=(d.conversations||d)[0];
    fetch(`/api/ghl?action=conversations_messages&loc=${socKey}&conversationId=${c.id}`).then(r2=>r2.json()).then(d2=>setConvoMsgs(d2.messages||d2||[])).catch(()=>{});}
  }).catch(()=>{}).finally(()=>setConvoLoading(false));
 },[selClient,socKey]);
 const sendMsg=()=>{if(!msgInput.trim()||!selClient||convos.length===0)return;
  fetch(`/api/ghl?action=conversation_send&loc=${socKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"Email",contactId:selClient.ghlId||selClient.id,message:msgInput})}).then(()=>{setConvoMsgs(p=>[...p,{body:msgInput,direction:"outbound",dateAdded:new Date().toISOString()}]);setMsgInput("");}).catch(()=>{});
 };
 // Pipeline data
 const gd=ghlData?.[soc.id];const opps=gd?.opportunities||[];const stages=gd?.pipelines?.[0]?.stages||[];
 const stageNames=stages.length>0?stages.map(s=>s.name||s):["Nouveau","Contacté","Qualifié","Proposition","Gagné"];
 const byStage=useMemo(()=>{const m={};stageNames.forEach(s=>{m[s]=opps.filter(o=>o.stage===s);});return m;},[opps,stageNames]);
 // Find pipeline stage for a client
 const clientStage=(cl)=>{const opp=opps.find(o=>(o.contact?.name||"").toLowerCase()===(cl.name||"").toLowerCase()||o.contact?.email===cl.email);return opp?{stage:opp.stage,value:opp.value,status:opp.status}:null;};
 if(viewMode==="kanban"){
  return <Sect title="👥 Clients" sub="Vue Pipeline Kanban" right={<div style={{display:"flex",gap:4}}><Btn small v={viewMode==="list"?"primary":"ghost"} onClick={()=>setViewMode("list")}>📋 Liste</Btn><Btn small v={viewMode==="kanban"?"primary":"ghost"} onClick={()=>setViewMode("kanban")}>🔄 Kanban</Btn></div>}>
   <div style={{display:"flex",gap:8,overflow:"auto",paddingBottom:8}}>
    {Object.entries(byStage).map(([stage,cards],si)=><div key={stage} style={{minWidth:180,flex:"1 0 180px"}}>
     <div style={{padding:"8px 10px",borderRadius:"10px 10px 0 0",background:GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]+"22",borderBottom:`2px solid ${GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]}`,marginBottom:4}}>
      <div style={{fontWeight:700,fontSize:11,color:GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]}}>{stage}</div>
      <div style={{fontSize:9,color:C.td}}>{cards.length} deal{cards.length>1?"s":""} · {fmt(cards.reduce((a,o)=>a+(o.value||0),0))}€</div>
     </div>
     {cards.map(o=><div key={o.id} className="glass-card-static" style={{padding:10,marginBottom:4,cursor:"pointer",borderLeft:`3px solid ${GHL_STAGES_COLORS[si%GHL_STAGES_COLORS.length]}`}} onClick={()=>{const cl=(clients||[]).find(c=>(c.name||"").toLowerCase()===(o.name||o.contact?.name||"").toLowerCase());if(cl)setSelClient(cl);}}>
      <div style={{fontWeight:600,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name||o.contact?.name||"—"}</div>
      <div style={{fontSize:10,fontWeight:800,color:C.acc,marginTop:2}}>{fmt(o.value||0)}€</div>
      <div style={{fontSize:8,color:C.td,marginTop:2}}>{o.createdAt?ago(o.createdAt):""}</div>
     </div>)}
     {cards.length===0&&<div style={{padding:16,textAlign:"center",color:C.tm,fontSize:10,border:`1px dashed ${C.brd}`,borderRadius:8}}>Vide</div>}
    </div>)}
   </div>
  </Sect>;
 }
 return <div>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
   <div><h2 style={{color:C.t,fontSize:13,fontWeight:800,margin:0,fontFamily:FONT_TITLE}}>👥 CLIENTS</h2><p style={{color:C.td,fontSize:10,margin:"1px 0 0"}}>Portefeuille & conversations</p></div>
   <div style={{display:"flex",gap:4}}><Btn small v={viewMode==="list"?"primary":"ghost"} onClick={()=>setViewMode("list")}>📋 Liste</Btn><Btn small v={viewMode==="kanban"?"primary":"ghost"} onClick={()=>setViewMode("kanban")}>🔄 Kanban</Btn></div>
  </div>
  <div style={{display:"flex",gap:12}}>
   <div style={{flex:1,minWidth:0}}>
    <ClientsPanelSafe soc={soc} clients={clients} saveClients={saveClients} ghlData={ghlData} socBankData={socBankData} invoices={invoices} saveInvoices={saveInvoices} stripeData={stripeData} onSelectClient={setSelClient}/>
   </div>
   {selClient&&<div className="si" style={{width:340,flexShrink:0,background:"rgba(14,14,22,.6)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:16,maxHeight:"80vh",overflowY:"auto",position:"sticky",top:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
     <div style={{fontWeight:800,fontSize:14,color:C.t}}>{selClient.name||"Client"}</div>
     <button onClick={()=>setSelClient(null)} style={{background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:14}}>✕</button>
    </div>
    {(()=>{const ps=clientStage(selClient);return ps?<div style={{padding:"6px 10px",borderRadius:8,background:C.accD,border:`1px solid ${C.acc}33`,marginBottom:10}}>
     <div style={{fontSize:9,color:C.td,fontWeight:600}}>Pipeline</div>
     <div style={{fontWeight:700,fontSize:12,color:C.acc}}>{ps.stage} {ps.status==="won"?"✅":ps.status==="lost"?"❌":""}</div>
     {ps.value>0&&<div style={{fontSize:10,color:C.t}}>{fmt(ps.value)}€</div>}
    </div>:null;})()}
    <div style={{padding:"6px 10px",borderRadius:8,background:C.card2,marginBottom:10}}>
     <div style={{fontSize:9,color:C.td,fontWeight:600}}>Status</div>
     <div style={{fontWeight:600,fontSize:11,color:(CLIENT_STATUS[selClient.status]||{}).c||C.td}}>{(CLIENT_STATUS[selClient.status]||{}).l||selClient.status}</div>
     {selClient.billing&&<div style={{fontSize:10,color:C.t,marginTop:2}}>{fmt(clientMonthlyRevenue(selClient))}€/mois</div>}
    </div>
    <div style={{fontSize:10,fontWeight:800,color:C.v,marginBottom:6,fontFamily:FONT_TITLE}}>💬 CONVERSATIONS</div>
    {convoLoading&&<div style={{color:C.td,fontSize:10,padding:8}}>Chargement...</div>}
    {!convoLoading&&convoMsgs.length===0&&<div style={{color:C.td,fontSize:10,padding:8}}>Aucune conversation</div>}
    <div style={{maxHeight:250,overflowY:"auto",marginBottom:8}}>
     {convoMsgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.direction==="outbound"?"flex-end":"flex-start",marginBottom:4}}>
      <div style={{maxWidth:"85%",padding:"6px 10px",borderRadius:10,background:m.direction==="outbound"?"linear-gradient(135deg,#FFBF00,#FF9D00)":"rgba(255,255,255,.06)",color:m.direction==="outbound"?"#0a0a0f":C.t,fontSize:10}}>
       <div>{m.body||m.text||"—"}</div>
       <div style={{fontSize:7,color:m.direction==="outbound"?"rgba(0,0,0,.5)":C.tm,marginTop:1}}>{m.dateAdded?ago(m.dateAdded):""}</div>
      </div>
     </div>)}
    </div>
    <div style={{display:"flex",gap:4}}>
     <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendMsg();}} placeholder="Message..." style={{flex:1,padding:"6px 8px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,color:C.t,fontSize:10,fontFamily:FONT,outline:"none"}}/>
     <Btn small onClick={sendMsg}>→</Btn>
    </div>
   </div>}
  </div>
 </div>;
}

/* ===== CLIENT HEALTH SCORE ===== */
