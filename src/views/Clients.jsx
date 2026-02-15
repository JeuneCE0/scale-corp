import React, { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, Legend, Line, LineChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import * as U from "../utils/index.jsx";
// Destructure commonly used utilities for readability
const { C, C_DARK, C_LIGHT, getTheme, applyTheme, MN, curM, ml, fmt, fK, pct, clamp, prevM, nextM, pf, gr, FONT, FONT_TITLE, BF, deadline, qOf, qMonths, qLabel, ago, uid, curW, MOODS, sinceLbl, sinceMonths, CSS, DS, DH, DEAL_STAGES, DEMO_JOURNAL, DEMO_ACTIONS, DEMO_PULSES, DEMO_DEALS, DEMO_OKRS, DEMO_SYNERGIES, DEMO_SUBS, DEMO_TEAM, DEMO_CLIENTS, SYN_TYPES, SYN_STATUS, SUB_CATS, SLACK_MODES, EXCLUDED_ACCOUNTS, CURR_SYMBOLS, REV_ENVS, GHL_BASE, STRIPE_PROXY, STORE_URL, ErrorBoundary, mkPrefill, autoGenerateReport, autoCategorize, autoDetectSubscriptions, subMonthly, clientMonthlyRevenue, clientTotalValue, commitmentEnd, commitmentRemaining, generateInvoices, refreshInvoiceStatuses, ghlCreateInvoice, ghlSendInvoice, mkDemoInvoices, teamMonthly, normalizeStr, fuzzyMatch, matchSubsToRevolut, deduplicatedCharges, mkGHLDemo, ghlUpdateContact, ghlCreateContact, fetchGHL, syncGHLForSoc, slackWebhookSend, slackBotSend, slackSend, slackMention, buildPulseSlackMsg, buildReportSlackMsg, buildReminderSlackMsg, buildValidationSlackMsg, checkAndSendReminders, fetchStripe, syncStripeData, getStripeChargesForClient, getStripeTotal, mkRevolutDemo, fetchRevolut, syncRevolut, mkSocRevDemo, syncSocRevolut, revFinancials, storeCall, sbAuthHeaders, sbUpsert, sbGet, sbList, sGet, sSet, syncFromSupabase, fetchHoldingFromSB, fetchSocietiesFromSB, calcH, simH, healthScore, leadScore, leadScoreColor, leadScoreLabel, qCA, getAlerts, buildFeed, project, runway, calcLeaderboard, buildAIContext, calcMilestoneData, calcMilestones, calcSmartAlerts, genInsights, calcBenchmark, getPlaybooks, calcClientHealthScore, genPorteurNotifications, BILL_TYPES, CLIENT_STATUS, curQ, AUTO_CAT_MAP, categorizeTransaction, DEMO_KB } = U;

import { Badge, IncubBadge, GradeBadge, KPI, PBar, Btn, Inp, Sel, Sect, Card, Modal, CTip, Toggle, ActionItem } from "../components/ui.jsx";
import { MilestonesWall, MilestonesCompact, MilestoneCount } from "../components/features.jsx";

export function ClientsPanelSafe(props){return <ErrorBoundary label="Erreur dans la page Clients"><ClientsPanelInner {...props}/></ErrorBoundary>;}
export function ClientsPanelInner({soc,clients,saveClients,ghlData,socBankData,invoices,saveInvoices,stripeData,onSelectClient}){
 const[editCl,setEditCl]=useState(null);const[cl360Tab,setCl360Tab]=useState("infos");const[filter,setFilter]=useState("all");const[stageFilter,setStageFilter]=useState("all");const[invView,setInvView]=useState(null);
 const[sending,setSending]=useState(null);const[search,setSearch]=useState("");const[selPipeline,setSelPipeline]=useState("all");const[sort,setSort]=useState("recent");
 const allPipelines=ghlData?.[soc.id]?.pipelines||[];
 const selPipelineStages=selPipeline==="all"?(allPipelines[0]?.stages||[]):(allPipelines.find(p=>p.id===selPipeline)?.stages||[]);
 const rawGhl=ghlData?.[soc.id]?.ghlClients||[];
 const manualClients=clients.filter(c=>c.socId===soc.id);
 const manualGhlIds=new Set(manualClients.map(c=>c.ghlId).filter(Boolean));
 const ghlClients=rawGhl.filter(gc=>!manualGhlIds.has(gc.ghlId||gc.id)).map(gc=>({...gc,socId:soc.id,_fromGHL:true}));
 const myClients=[...manualClients,...ghlClients];
 const myInvoices=(invoices||[]).filter(inv=>inv.socId===soc.id);
 const active=myClients.filter(c=>c.status==="active");
 const byType=t=>myClients.filter(c=>c.billing?.type===t);
 const mrrFixed=byType("fixed").filter(c=>c.status==="active").reduce((a,c)=>a+Number(c.billing?.amount||0),0);
 const mrrPercent=byType("percent").filter(c=>c.status==="active").reduce((a,c)=>a+clientMonthlyRevenue(c),0);
 const oneoffThisMonth=byType("oneoff").filter(c=>{const d=c.billing?.paidDate;if(!d)return false;return d.startsWith(curM());}).reduce((a,c)=>a+Number(c.billing?.amount||0),0);
 const oneoffTotal=byType("oneoff").reduce((a,c)=>a+Number(c.billing?.amount||0),0);
 const totalMRR=mrrFixed+mrrPercent;
 const totalPortfolio=myClients.reduce((a,c)=>a+clientTotalValue(c),0);
 const avgDealValue=myClients.length?Math.round(totalPortfolio/myClients.length):0;
 const churnCount=myClients.filter(c=>c.status==="churned").length;
 const churnRate=myClients.length>0?Math.round(churnCount/myClients.length*100):0;
 const invDraft=myInvoices.filter(i=>i.status==="draft");
 const invSent=myInvoices.filter(i=>i.status==="sent");
 const invPaid=myInvoices.filter(i=>i.status==="paid");
 const invOverdue=myInvoices.filter(i=>i.status==="overdue");
 const totalFacture=myInvoices.reduce((a,i)=>a+i.amount,0);
 const totalEncaisse=invPaid.reduce((a,i)=>a+i.amount,0);
 const totalAttente=invSent.concat(invDraft).reduce((a,i)=>a+i.amount,0);
 const endingSoon=myClients.filter(c=>{const r=commitmentRemaining(c);return r!==null&&r<=2&&r>0&&c.status==="active";});
 const allOppsAll=Object.values(ghlData||{}).flatMap(d=>(d?.opportunities||[]));
 const allOpps=selPipeline==="all"?allOppsAll:allOppsAll.filter(o=>o.pipelineId===selPipeline);
 const uniqueStages=[...new Set(allOpps.map(o=>o.stage).filter(Boolean))];
 const ghlIdsInStage=stageFilter==="all"?null:new Set(allOpps.filter(o=>o.stage===stageFilter).map(o=>o.id));
 const afterType=filter==="all"?myClients:filter.startsWith("stage_")?myClients.filter(c=>{const st=filter.replace("stage_","");return allOpps.some(o=>o.stage===st&&o.contact?.id===c.ghlId);}):filter==="no_stage"?myClients.filter(c=>!allOpps.some(o=>o.contact?.id===c.ghlId)):filter==="type_fixed"?myClients.filter(c=>c.billing?.type==="fixed"):filter==="type_percent"?myClients.filter(c=>c.billing?.type==="percent"):filter==="type_hybrid"?myClients.filter(c=>c.billing?.type==="hybrid"):filter==="type_oneoff"?myClients.filter(c=>c.billing?.type==="oneoff"):myClients;
 const afterStage=stageFilter==="all"?afterType:afterType.filter(c=>{if(!c.ghlId)return false;const opps2=allOpps.filter(o=>o.stage===stageFilter);return opps2.some(o=>o.name===c.name||o.email===c.email||o.id===c.ghlId);});
 const filteredRaw=search.trim()===""?afterStage:afterStage.filter(c=>{const q=search.toLowerCase();return(c.name||"").toLowerCase().includes(q)||(c.email||"").toLowerCase().includes(q)||(c.phone||"").includes(q)||(c.contact||"").toLowerCase().includes(q)||(c.notes||"").toLowerCase().includes(q);});
 const clientBankTotals=useMemo(()=>{const m={};const txs=socBankData?.transactions||[];filteredRaw.forEach(cl=>{const cn=(cl.name||"").toLowerCase().trim();const tot=txs.filter(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;const desc=(leg.description||tx.reference||"").toLowerCase();if(cn.length>2&&desc.includes(cn))return true;const pts=cn.split(/\s+/).filter(p=>p.length>2);return pts.length>=2&&pts.every(p=>desc.includes(p));}).reduce((a,tx)=>a+(tx.legs?.[0]?.amount||0),0);m[cl.id]=tot;});return m;},[filteredRaw,socBankData?.transactions]);
 const filtered=useMemo(()=>{const arr=[...filteredRaw];if(sort==="alpha")arr.sort((a,b)=>(a.name||"").localeCompare(b.name||"","fr"));else if(sort==="collected")arr.sort((a,b)=>(clientBankTotals[b.id]||0)-(clientBankTotals[a.id]||0));else if(sort==="oldest")arr.sort((a,b)=>new Date(a.at||a.createdAt||0)-new Date(b.at||b.createdAt||0));else arr.sort((a,b)=>new Date(b.at||b.createdAt||0)-new Date(a.at||a.createdAt||0));return arr;},[filteredRaw,sort,clientBankTotals]);
 const exportCSV=()=>{const hdr="Nom,Entreprise,Email,Téléphone,Domaine,Statut,Type facturation,Montant,Date ajout";const rows=filtered.map(c=>{const b=c.billing||{};return[c.name||"",c.company||"",c.email||"",c.phone||"",c.domain||"",c.status||"",b.type||"",b.amount||"",c.at?new Date(c.at).toLocaleDateString("fr-FR"):""].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",");});const csv=hdr+"\n"+rows.join("\n");const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`clients_${soc.nom}_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);};
 const addClient=(type)=>{
  const base={id:uid(),socId:soc.id,name:"",contact:"",email:"",phone:"",status:"active",notes:"",ghlId:"",stripeId:"",at:new Date().toISOString()};
  if(type==="fixed")base.billing={type:"fixed",amount:0,freq:"monthly",commitment:0,startDate:new Date().toISOString().slice(0,10)};
  else if(type==="percent")base.billing={type:"percent",percent:0,basis:"ca",startDate:new Date().toISOString().slice(0,10)};
  else if(type==="hybrid")base.billing={type:"hybrid",amount:0,freq:"monthly",percent:0,basis:"ca",commitment:0,startDate:new Date().toISOString().slice(0,10)};
  else base.billing={type:"oneoff",amount:0,product:"",deliveredDate:"",paidDate:"",installments:1};
  setEditCl(base);
 };
 const saveCl=(cl)=>{
  const isNew=!clients.some(c=>c.id===cl.id);
  const idx=clients.findIndex(x=>x.id===cl.id);
  if(idx>=0){const nc=[...clients];nc[idx]=cl;saveClients(nc);}else saveClients([...clients,cl]);
  // GHL bidirectional sync
  const loc=soc.ghlLocationId;
  if(loc&&cl.ghlId){
   ghlUpdateContact(loc,cl.ghlId,{
    firstName:(cl.name||"").split(" ")[0],
    lastName:(cl.name||"").split(" ").slice(1).join(" "),
    email:cl.email,phone:cl.phone,
    tags:[...(cl.notes?cl.notes.split(",").map(t=>t.trim()):[]),...(cl.domain?[`domaine:${cl.domain}`]:[])].filter(Boolean)
   });
  }else if(loc&&!cl.ghlId&&!cl._fromGHL){
   ghlCreateContact(loc,{
    firstName:(cl.name||"").split(" ")[0],
    lastName:(cl.name||"").split(" ").slice(1).join(" "),
    email:cl.email,phone:cl.phone,name:cl.name
   }).then(res2=>{
    if(res2?.contact?.id){
     const updated=clients.map(c=>c.id===cl.id?{...c,ghlId:res2.contact.id}:c);
     saveClients(updated);
    }
   });
  }
  const b=cl.billing;
  const needsInvoices=(b?.type==="fixed"&&b.commitment>0)||(b?.type==="oneoff"&&b.amount>0);
  if(needsInvoices){
   const existingForClient=(invoices||[]).filter(i=>i.clientId===cl.id);
   if(isNew||existingForClient.length===0){
    const newInvs=generateInvoices(cl,soc.nom);
    const apiKey=soc.ghlKey;
    if(apiKey){
    newInvs.forEach(async(inv)=>{
    const ghlId=await ghlCreateInvoice(apiKey,inv,cl);
    if(ghlId)inv.ghlInvoiceId=ghlId;
    });
    }
    const allInvs=[...(invoices||[]).filter(i=>i.clientId!==cl.id),...newInvs];
    saveInvoices(allInvs);
   }
  }
  setEditCl(null);
 };
 const deleteCl=(id)=>{
  saveClients(clients.filter(c=>c.id!==id));
  saveInvoices((invoices||[]).filter(i=>i.clientId!==id));
  setEditCl(null);
 };
 const regenInvoices=(cl)=>{
  const newInvs=generateInvoices(cl,soc.nom);
  const allInvs=[...(invoices||[]).filter(i=>i.clientId!==cl.id),...newInvs];
  saveInvoices(allInvs);
 };
 const sendInvoice=async(inv)=>{
  setSending(inv.id);
  const apiKey=soc.ghlKey;
  let ghlOk=false;
  if(apiKey&&inv.ghlInvoiceId){ghlOk=await ghlSendInvoice(apiKey,inv.ghlInvoiceId);}
  const updated=(invoices||[]).map(i=>i.id===inv.id?{...i,status:"sent",sentAt:new Date().toISOString()}:i);
  saveInvoices(updated);
  setSending(null);
 };
 const markPaid=(inv)=>{
  const updated=(invoices||[]).map(i=>i.id===inv.id?{...i,status:"paid",paidAt:new Date().toISOString()}:i);
  saveInvoices(updated);
 };
 const cancelInvoice=(inv)=>{
  const updated=(invoices||[]).map(i=>i.id===inv.id?{...i,status:"cancelled"}:i);
  saveInvoices(updated);
 };
 const clientInvoices=(clId)=>(invoices||[]).filter(i=>i.clientId===clId).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
 if(myClients.length===0)return <div style={{textAlign:"center",padding:40}}>
  <div style={{fontSize:40,marginBottom:12}}>👥</div>
  <div style={{fontWeight:700,fontSize:15,marginBottom:6,color:C.t}}>Aucun client</div>
  <div style={{color:C.td,fontSize:12,marginBottom:16}}>Connectez GHL ou ajoutez des clients manuellement</div>
  <div style={{display:"flex",gap:8,justifyContent:"center"}}>
   <Btn small onClick={()=>addClient("fixed")}>+ Forfait</Btn>
   <Btn small v="secondary" onClick={()=>addClient("percent")}>+ %</Btn>
   <Btn small v="secondary" onClick={()=>addClient("hybrid")}>+ Fixe+%</Btn>
   <Btn small v="secondary" onClick={()=>addClient("oneoff")}>+ One-off</Btn>
  </div>
  </div>;
 return <div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:6,marginBottom:12}}>
   <Card accent={C.acc} style={{padding:"10px 12px",textAlign:"center"}} delay={1}>
    <div style={{color:C.td,fontSize:8,fontWeight:700,letterSpacing:.5}}>MRR TOTAL</div>
    <div style={{fontWeight:900,fontSize:20,color:C.acc}}>{fmt(totalMRR)}€</div>
    <div style={{fontSize:8,color:C.td}}>Forfaits: {fmt(mrrFixed)}€ · %: {fmt(mrrPercent)}€</div>
   </Card>
   <Card style={{padding:"10px 12px",textAlign:"center"}} delay={2}>
    <div style={{color:C.td,fontSize:8,fontWeight:700,letterSpacing:.5}}>CLIENTS ACTIFS</div>
    <div style={{fontWeight:900,fontSize:20,color:C.g}}>{active.length}</div>
    <div style={{fontSize:8,color:C.td}}>{myClients.length} total · Churn {churnRate}%</div>
   </Card>
   <Card style={{padding:"10px 12px",textAlign:"center"}} delay={3}>
    <div style={{color:C.td,fontSize:8,fontWeight:700,letterSpacing:.5}}>ONE-OFF CE MOIS</div>
    <div style={{fontWeight:900,fontSize:20,color:C.b}}>{fmt(oneoffThisMonth)}€</div>
    <div style={{fontSize:8,color:C.td}}>Total vendu: {fmt(oneoffTotal)}€</div>
   </Card>
   <Card style={{padding:"10px 12px",textAlign:"center"}} delay={4}>
    <div style={{color:C.td,fontSize:8,fontWeight:700,letterSpacing:.5}}>VALEUR MOY.</div>
    <div style={{fontWeight:900,fontSize:20,color:C.t}}>{fmt(avgDealValue)}€</div>
    <div style={{fontSize:8,color:C.td}}>par client</div>
   </Card>
  </div>
  {totalMRR>0&&<Card style={{padding:14,marginBottom:12}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>RÉPARTITION DES REVENUS</div>
   <div style={{display:"flex",gap:2,height:8,borderRadius:4,overflow:"hidden",marginBottom:8}}>
    {mrrFixed>0&&<div style={{width:`${pct(mrrFixed,totalMRR+oneoffThisMonth)}%`,background:C.acc,borderRadius:3,transition:"width .3s"}}/>}
    {mrrPercent>0&&<div style={{width:`${pct(mrrPercent,totalMRR+oneoffThisMonth)}%`,background:C.v,borderRadius:3,transition:"width .3s"}}/>}
    {oneoffThisMonth>0&&<div style={{width:`${pct(oneoffThisMonth,totalMRR+oneoffThisMonth)}%`,background:C.b,borderRadius:3,transition:"width .3s"}}/>}
   </div>
   <div style={{display:"flex",gap:12}}>
    {[{l:"Forfaits fixes",v:mrrFixed,c:C.acc,n:byType("fixed").filter(c=>c.status==="active").length},
    {l:"% CA/bénéfice",v:mrrPercent,c:C.v,n:byType("percent").filter(c=>c.status==="active").length},
    {l:"One-off (mois)",v:oneoffThisMonth,c:C.b,n:byType("oneoff").filter(c=>{const d=c.billing?.paidDate;return d&&d.startsWith(curM());}).length}
    ].map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{width:8,height:8,borderRadius:2,background:s.c}}/>
    <span style={{fontSize:9,color:C.td}}>{s.l}: <strong style={{color:s.c}}>{fmt(s.v)}€</strong> ({s.n})</span>
    </div>)}
   </div>
  </Card>}
  {(()=>{const domains={};myClients.forEach(c=>{const d=(c.domain||"").trim();if(d)domains[d]=(domains[d]||0)+1;});const sorted=Object.entries(domains).sort((a,b)=>b[1]-a[1]);if(sorted.length===0)return null;const DCOLS=["#60a5fa","#FFAA00","#34d399","#f43f5e","#a78bfa","#fb923c","#14b8a6","#eab308","#ec4899","#6366f1"];return <Card style={{padding:14,marginBottom:12}}>
   <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>🏢 DOMAINES D'ACTIVITÉ</div>
   <div style={{display:"flex",gap:2,height:8,borderRadius:4,overflow:"hidden",marginBottom:8}}>
    {sorted.map(([d,n],i)=><div key={d} style={{width:`${Math.round(n/myClients.length*100)}%`,background:DCOLS[i%DCOLS.length],borderRadius:3,transition:"width .3s"}}/>)}
   </div>
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
    {sorted.map(([d,n],i)=><span key={d} style={{fontSize:9,padding:"2px 8px",borderRadius:6,background:DCOLS[i%DCOLS.length]+"18",color:DCOLS[i%DCOLS.length],fontWeight:600,border:`1px solid ${DCOLS[i%DCOLS.length]}33`}}>{d}: {n}</span>)}
   </div>
  </Card>;})()}
  {endingSoon.length>0&&<Card accent={C.o} style={{padding:12,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:6}}>
    <span style={{fontSize:12}}>⚠️</span>
    <span style={{fontWeight:700,fontSize:11,color:C.o}}>Engagements qui se terminent bientôt</span>
   </div>
   {endingSoon.map(cl=>{const r=commitmentRemaining(cl);const end=commitmentEnd(cl);
    return <div key={cl.id} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",fontSize:10}}>
    <span style={{fontWeight:600,color:C.t}}>{cl.name}</span>
    <span style={{color:C.o,fontWeight:700}}>{r} mois restant{r>1?"s":""}</span>
    <span style={{color:C.td,fontSize:8}}>fin {end?.toLocaleDateString("fr-FR",{month:"short",year:"numeric"})}</span>
    <span style={{color:C.td,fontSize:9,marginLeft:"auto"}}>{fmt(cl.billing?.amount)}€/m</span>
    </div>;
   })}
  </Card>}
  {myInvoices.length>0&&<Card accent={C.b} style={{padding:14,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
    <span style={{fontSize:14}}>🧾</span>
    <span style={{fontWeight:800,fontSize:12}}>Facturation</span>
    {!soc.ghlLocationId&&!soc.ghlKey&&<span style={{fontSize:7,color:C.o,background:C.oD,padding:"1px 5px",borderRadius:4}}>Mode local</span>}
    {(soc.ghlLocationId||soc.ghlKey)&&<span style={{fontSize:7,color:C.g,background:C.gD,padding:"1px 5px",borderRadius:4}}>GHL connecté</span>}
    </div>
    <button onClick={()=>setInvView(invView?"":"all")} style={{background:"none",border:"none",color:C.acc,fontSize:9,cursor:"pointer",fontFamily:FONT,fontWeight:600}}>{invView?"Masquer":"Voir toutes"}</button>
   </div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
    <div style={{textAlign:"center",padding:"6px 4px",background:C.bg,borderRadius:6}}>
    <div style={{fontWeight:900,fontSize:16,color:C.g}}>{fmt(totalEncaisse)}€</div>
    <div style={{fontSize:7,color:C.td,fontWeight:600}}>ENCAISSÉ</div>
    </div>
    <div style={{textAlign:"center",padding:"6px 4px",background:C.bg,borderRadius:6}}>
    <div style={{fontWeight:900,fontSize:16,color:C.b}}>{fmt(totalAttente)}€</div>
    <div style={{fontSize:7,color:C.td,fontWeight:600}}>EN ATTENTE</div>
    </div>
    <div style={{textAlign:"center",padding:"6px 4px",background:C.bg,borderRadius:6}}>
    <div style={{fontWeight:900,fontSize:16,color:C.td}}>{invDraft.length}</div>
    <div style={{fontSize:7,color:C.td,fontWeight:600}}>BROUILLONS</div>
    </div>
    <div style={{textAlign:"center",padding:"6px 4px",background:invOverdue.length>0?C.rD:C.bg,borderRadius:6}}>
    <div style={{fontWeight:900,fontSize:16,color:invOverdue.length>0?C.r:C.td}}>{invOverdue.length}</div>
    <div style={{fontSize:7,color:invOverdue.length>0?C.r:C.td,fontWeight:600}}>EN RETARD</div>
    </div>
   </div>
   {totalFacture>0&&<div style={{display:"flex",gap:1,height:6,borderRadius:3,overflow:"hidden",marginBottom:6}}>
    {invPaid.length>0&&<div style={{width:`${pct(invPaid.reduce((a,i)=>a+i.amount,0),totalFacture)}%`,background:C.g,borderRadius:2,transition:"width .3s"}}/>}
    {invSent.length>0&&<div style={{width:`${pct(invSent.reduce((a,i)=>a+i.amount,0),totalFacture)}%`,background:C.b,borderRadius:2,transition:"width .3s"}}/>}
    {invDraft.length>0&&<div style={{width:`${pct(invDraft.reduce((a,i)=>a+i.amount,0),totalFacture)}%`,background:C.brd,borderRadius:2,transition:"width .3s"}}/>}
    {invOverdue.length>0&&<div style={{width:`${pct(invOverdue.reduce((a,i)=>a+i.amount,0),totalFacture)}%`,background:C.r,borderRadius:2,transition:"width .3s"}}/>}
   </div>}
   {invDraft.length>0&&<div style={{marginTop:6}}>
    <div style={{fontSize:9,color:C.td,fontWeight:700,marginBottom:4}}>📤 Prêtes à envoyer ({invDraft.length})</div>
    {invDraft.slice(0,5).map((inv,i)=>{
    const cl=myClients.find(c=>c.id===inv.clientId);
    return <div key={inv.id} className={`fu d${Math.min(i+1,5)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",background:C.bg,borderRadius:6,marginBottom:2}}>
    <span style={{fontSize:9}}>📝</span>
    <div style={{flex:1,minWidth:0}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontWeight:600,fontSize:10}}>{cl?.name||"Client"}</span>
    <span style={{fontSize:8,color:C.td}}>{inv.description.length>35?inv.description.slice(0,35)+"…":inv.description}</span>
    </div>
    <div style={{fontSize:8,color:C.td}}>Échéance: {new Date(inv.dueDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</div>
    </div>
    <span style={{fontWeight:700,fontSize:11,color:C.t,whiteSpace:"nowrap"}}>{fmt(inv.amount)}€</span>
    <button onClick={(e)=>{e.stopPropagation();sendInvoice(inv);}} disabled={sending===inv.id} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.b}`,background:C.bD,color:C.b,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:FONT,opacity:sending===inv.id?.5:1,transition:"all .15s"}}>
    {sending===inv.id?"Envoi…":"Envoyer"}
    </button>
    </div>;
    })}
    {invDraft.length>5&&<div style={{fontSize:8,color:C.td,textAlign:"center",marginTop:2}}>+ {invDraft.length-5} autres brouillons</div>}
   </div>}
   {invOverdue.length>0&&<div style={{marginTop:6}}>
    <div style={{fontSize:9,color:C.r,fontWeight:700,marginBottom:4}}>⚠️ En retard ({invOverdue.length})</div>
    {invOverdue.map((inv,i)=>{
    const cl=myClients.find(c=>c.id===inv.clientId);
    const days=Math.round((new Date()-new Date(inv.dueDate))/(864e5));
    return <div key={inv.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",background:C.rD,borderRadius:6,marginBottom:2}}>
    <span style={{fontSize:9}}>⚠️</span>
    <div style={{flex:1,minWidth:0}}>
    <span style={{fontWeight:600,fontSize:10,color:C.r}}>{cl?.name||"Client"}</span>
    <span style={{fontSize:8,color:C.r,marginLeft:4}}>{days}j de retard</span>
    </div>
    <span style={{fontWeight:700,fontSize:11,color:C.r}}>{fmt(inv.amount)}€</span>
    <button onClick={()=>markPaid(inv)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.g}`,background:C.gD,color:C.g,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Marquer payée</button>
    </div>;
    })}
   </div>}
  </Card>}
  {invView&&<Card style={{padding:14,marginBottom:12}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
    <span style={{fontWeight:800,fontSize:12}}>🧾 Toutes les factures ({myInvoices.length})</span>
    <div style={{display:"flex",gap:4}}>
    {["all",...myClients.map(c=>c.id)].map(v=>{
    const lbl=v==="all"?"Tous":myClients.find(c=>c.id===v)?.name?.slice(0,12)||"?";
    return <button key={v} onClick={()=>setInvView(v)} style={{padding:"2px 8px",borderRadius:4,fontSize:8,fontWeight:invView===v?700:500,border:`1px solid ${invView===v?C.acc:C.brd}`,background:invView===v?C.accD:"transparent",color:invView===v?C.acc:C.td,cursor:"pointer",fontFamily:FONT}}>{lbl}</button>;
    })}
    </div>
   </div>
   {(invView==="all"?myInvoices:myInvoices.filter(i=>i.clientId===invView)).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).map((inv,i)=>{
    const cl=myClients.find(c=>c.id===inv.clientId);const st=INV_STATUS[inv.status]||INV_STATUS.draft;
    return <div key={inv.id} className={`fu d${Math.min(i+1,10)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:st.bg,borderRadius:6,border:`1px solid ${st.c}15`,marginBottom:2}}>
    <span style={{fontSize:10}}>{st.icon}</span>
    <div style={{width:28,textAlign:"center"}}><span style={{fontSize:7,color:st.c,fontWeight:700,background:st.c+"18",padding:"1px 4px",borderRadius:3}}>{st.l}</span></div>
    <div style={{flex:1,minWidth:0}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontWeight:600,fontSize:10}}>{cl?.name||"?"}</span>
    <span style={{fontSize:7,color:C.td,fontFamily:"monospace"}}>{inv.number}</span>
    {inv.totalInstallments>1&&<span style={{fontSize:7,color:C.b,background:C.bD,padding:"0px 4px",borderRadius:3}}>{inv.installment}/{inv.totalInstallments}</span>}
    </div>
    <div style={{fontSize:8,color:C.td,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inv.description}</div>
    </div>
    <div style={{textAlign:"right",flexShrink:0}}>
    <div style={{fontWeight:700,fontSize:11,color:C.t}}>{fmt(inv.amount)}€</div>
    <div style={{fontSize:7,color:C.td}}>{new Date(inv.dueDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</div>
    </div>
    <div style={{display:"flex",gap:2,flexShrink:0}}>
    {inv.status==="draft"&&<button onClick={()=>sendInvoice(inv)} disabled={sending===inv.id} style={{padding:"2px 6px",borderRadius:4,border:`1px solid ${C.b}`,background:C.bD,color:C.b,fontSize:8,fontWeight:700,cursor:"pointer",fontFamily:FONT,opacity:sending===inv.id?.5:1}}>{sending===inv.id?"…":"📤 Envoyer"}</button>}
    {(inv.status==="sent"||inv.status==="overdue")&&<button onClick={()=>markPaid(inv)} style={{padding:"2px 6px",borderRadius:4,border:`1px solid ${C.g}`,background:C.gD,color:C.g,fontSize:8,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>✅ Payée</button>}
    {inv.status!=="paid"&&inv.status!=="cancelled"&&<button onClick={()=>cancelInvoice(inv)} style={{padding:"2px 6px",borderRadius:4,border:`1px solid ${C.brd}`,background:"transparent",color:C.td,fontSize:8,cursor:"pointer",fontFamily:FONT}}>✗</button>}
    </div>
    </div>;
   })}
  </Card>}
  <div style={{marginBottom:10}}>
   <div style={{position:"relative",marginBottom:8}}>
    <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:C.td}}>🔍</span>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un client ou prospect..." style={{width:"100%",padding:"10px 12px 10px 36px",borderRadius:10,border:`1px solid ${search?C.acc+"66":C.brd}`,background:"rgba(14,14,22,0.4)",color:C.t,fontSize:12,fontFamily:FONT,outline:"none",boxSizing:"border-box",transition:"border-color .2s"}}/>
    {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.td,cursor:"pointer",fontSize:14}}>✕</button>}
   </div>
   <div style={{display:"flex",gap:6,marginBottom:8}}>
    <select value={sort} onChange={e=>setSort(e.target.value)} style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.card,color:C.t,fontSize:11,fontFamily:FONT}}>
     <option value="recent">Récent</option>
     <option value="alpha">Alphabétique</option>
     <option value="collected">💰 Plus collecté</option>
     <option value="oldest">Ancien</option>
    </select>
    <button onClick={exportCSV} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.card,color:C.t,fontSize:11,fontFamily:FONT,cursor:"pointer",fontWeight:600}}>📥 Exporter</button>
   </div>
   {allPipelines.length>1&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
    <span style={{fontSize:9,color:C.td,fontWeight:700}}>PIPELINE :</span>
    {[{id:"all",name:"Toutes"},...allPipelines].map(p=><button key={p.id} onClick={()=>{setSelPipeline(p.id);setFilter("all");}} style={{padding:"4px 12px",borderRadius:6,fontSize:9,fontWeight:selPipeline===p.id?700:500,border:`1px solid ${selPipeline===p.id?C.acc:C.brd}`,background:selPipeline===p.id?C.accD:"transparent",color:selPipeline===p.id?C.acc:C.td,cursor:"pointer",fontFamily:FONT}}>{p.name}</button>)}
   </div>}
   <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
   {[{v:"all",l:`Tous (${myClients.length})`},
    ...(selPipelineStages.map((st,i)=>{const count=myClients.filter(c=>allOpps.some(o=>o.stage===st&&o.contact?.id===c.ghlId));return{v:`stage_${st}`,l:`${st} (${count.length})`,c:GHL_STAGES_COLORS[i%GHL_STAGES_COLORS.length]};})),
    {v:"no_stage",l:`Sans étape (${myClients.filter(c=>!allOpps.some(o=>o.contact?.id===c.ghlId)).length})`},
    {v:"type_fixed",l:`💰 Fixe (${byType("fixed").length})`},{v:"type_percent",l:`📊 % (${byType("percent").length})`},{v:"type_hybrid",l:`💎 Fixe+% (${byType("hybrid").length})`},{v:"type_oneoff",l:`🎯 One-off (${byType("oneoff").length})`}
   ].map(f2=>{const isStage=f2.v.startsWith("stage_");const stColor=isStage?f2.c:null;
    return <button key={f2.v} onClick={()=>setFilter(f2.v)} style={{padding:"4px 10px",borderRadius:6,fontSize:9,fontWeight:filter===f2.v?700:500,border:`1px solid ${filter===f2.v?(stColor||C.acc):C.brd}`,background:filter===f2.v?(stColor||C.acc)+"22":"transparent",color:filter===f2.v?(stColor||C.acc):C.td,cursor:"pointer",fontFamily:FONT}}>{f2.l}</button>;
   })}
   <div style={{marginLeft:"auto",display:"flex",gap:4}}>
    <Btn small onClick={()=>addClient("fixed")}>+ Forfait</Btn>
    <Btn small v="secondary" onClick={()=>addClient("percent")}>+ %</Btn>
    <Btn small v="secondary" onClick={()=>addClient("hybrid")}>+ Fixe+%</Btn>
    <Btn small v="secondary" onClick={()=>addClient("oneoff")}>+ One-off</Btn>
   </div>
  </div>
  </div>
  {filtered.length===0&&<div style={{textAlign:"center",padding:30,color:C.td}}><div style={{fontSize:24,marginBottom:6}}>👥</div>{search?"Aucun résultat pour \""+search+"\"":"Aucun client pour le moment"}</div>}
  {filtered.map((cl,i)=>{
   const b=cl.billing||{};const bt=b.type?BILL_TYPES[b.type]:null;const cs=CLIENT_STATUS[cl.status]||CLIENT_STATUS.active;
   const monthly=clientMonthlyRevenue(cl);const cr=commitmentRemaining(cl);
   const clInvs=clientInvoices(cl.id);const clDraft=clInvs.filter(x=>x.status==="draft").length;const clPaid=clInvs.filter(x=>x.status==="paid").length;const clOverdue=clInvs.filter(x=>x.status==="overdue").length;
   return <Card key={cl.id} accent={bt?.c||C.td} style={{marginBottom:4,padding:"12px 14px",cursor:"pointer"}} delay={Math.min(i+1,8)} onClick={()=>{setEditCl({...cl});if(onSelectClient)onSelectClient(cl);}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
    <div style={{width:36,height:36,borderRadius:9,background:(bt?.c||C.td)+"18",border:`1.5px solid ${(bt?.c||C.td)}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{bt?.icon||"👤"}</div>
    <div style={{flex:1,minWidth:0}}>
    <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
    <span style={{fontWeight:700,fontSize:12}}>{cl.name||"Sans nom"}</span>
    <span title={cl.ghlId?"Synced avec GHL":"Local uniquement"} style={{fontSize:8,cursor:"default"}}>{cl.ghlId?"✅":"⚠️"}</span>
    <HealthBadge score={calcClientHealthScore(cl,socBankData,ghlData,soc)}/>
    {cl.status==="prospect"&&(()=>{const lscore=(()=>{let s=0;if((cl.source||"").toLowerCase().includes("organic"))s+=20;const added=new Date(cl.at||cl.createdAt||0);const days=Math.floor((Date.now()-added.getTime())/864e5);s+=days<7?30:days<30?15:0;const cn5=(cl.name||"").toLowerCase();const calls5=(ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>(e.contactName||e.title||"").toLowerCase().includes(cn5)).length;s+=Math.min(30,calls5*10);if(cl.email)s+=10;if(cl.phone)s+=10;return clamp(s,0,100);})();const lc=lscore>70?"#34d399":lscore>=40?"#FFAA00":"#f87171";const lt=lscore>70?"Chaud":lscore>=40?"Tiède":"Froid";return <span style={{fontSize:7,fontWeight:700,color:lc,background:lc+"18",padding:"1px 5px",borderRadius:8}}>{lscore>70?"🟢":lscore>=40?"🟡":"🔴"} {lt} ({lscore})</span>;})()}
    {(()=>{if(cl.status!=="active")return null;const cn3=(cl.name||"").toLowerCase().trim();const excl4=EXCLUDED_ACCOUNTS[soc.id]||[];const now45c=Date.now()-45*864e5;const now30c=Date.now()-30*864e5;const hasPayment=(socBankData?.transactions||[]).some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;if(excl4.includes(leg.account_id))return false;return new Date(tx.created_at).getTime()>now45c&&(leg.description||tx.reference||"").toLowerCase().includes(cn3);});const calEvts2=(ghlData?.[soc.id]?.calendarEvents||[]);const hasCall=calEvts2.some(e=>new Date(e.startTime||0).getTime()>now30c&&(e.contactName||e.title||"").toLowerCase().includes(cn3));const endDate=commitmentEnd(cl);const endsClose=endDate&&(endDate.getTime()-Date.now())<60*864e5;if((!hasPayment||!hasCall)&&endsClose)return <span style={{fontSize:7,color:C.r,background:C.rD,padding:"1px 5px",borderRadius:8,fontWeight:700}}>⚠️ Risque</span>;return null;})()}
    <span style={{fontSize:7,color:cs.c,background:cs.c+"18",padding:"1px 5px",borderRadius:8,fontWeight:700}}>{cs.icon} {cs.l}</span>
    {bt&&<span style={{fontSize:7,color:bt.c,background:bt.c+"18",padding:"1px 5px",borderRadius:8}}>{bt.l}</span>}
    {cl.domain&&<span style={{fontSize:7,color:"#60a5fa",background:"#60a5fa18",padding:"1px 5px",borderRadius:8,fontWeight:600}}>🏢 {cl.domain}</span>}
    {(()=>{const d=cl.at||cl.createdAt;if(!d)return null;const days=Math.floor((Date.now()-new Date(d).getTime())/(1000*60*60*24));const lbl=days<30?`${days}j`:days<365?`${Math.floor(days/30)}m`:`${Math.floor(days/365)}a${Math.floor((days%365)/30)}m`;const isP=cl.status==="prospect";const isC=cl.status==="churned";const col=isP?"#fb923c":isC?C.r:C.g;const txt=isP?"⏳ Pipeline "+lbl:isC?"❌ Perdu il y a "+lbl:"✅ Client depuis "+lbl;return <span style={{fontSize:7,color:col,background:col+"18",padding:"1px 5px",borderRadius:8,fontWeight:600}}>{txt}</span>;})()}
    {clInvs.length>0&&<span style={{fontSize:7,color:C.td,background:C.card2,padding:"1px 5px",borderRadius:8}}>📄{clInvs.length}</span>}
    {clDraft>0&&<span style={{fontSize:7,color:C.acc,background:C.accD,padding:"1px 4px",borderRadius:4,fontWeight:700}}>{clDraft} à envoyer</span>}
    {clOverdue>0&&<span style={{fontSize:7,color:C.r,background:C.rD,padding:"1px 4px",borderRadius:4,fontWeight:700}}>⚠ {clOverdue} en retard</span>}
    {clInvs.length>0&&<span style={{fontSize:7,color:C.b,background:C.bD,padding:"1px 5px",borderRadius:8}}>🧾 {clPaid}/{clInvs.length}</span>}
    {(()=>{if(cl.status!=="active"||(b.type!=="fixed"&&b.type!=="hybrid"))return null;const cn=(cl.name||"").toLowerCase().trim();const txs=(socBankData?.transactions||[]);const now45=Date.now()-45*864e5;const hasRecent=txs.some(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;const txDate=new Date(tx.created_at||tx.date||0).getTime();if(txDate<now45)return false;const desc=(leg.description||tx.reference||"").toLowerCase();if(cn.length>2&&desc.includes(cn))return true;const pts=cn.split(/\s+/).filter(p=>p.length>2);return pts.length>=2&&pts.every(p=>desc.includes(p));});if(!hasRecent)return <span style={{fontSize:7,color:C.r,background:C.rD,padding:"1px 5px",borderRadius:8,fontWeight:700}}>⚠️ Pas de paiement depuis 45j+</span>;return null;})()}
    {clOverdue>0&&<span style={{fontSize:7,color:C.r,background:C.rD,padding:"1px 5px",borderRadius:8,fontWeight:700}}>⚠ {clOverdue} retard</span>}
    {clDraft>0&&<span style={{fontSize:7,color:C.td,background:C.card2,padding:"1px 5px",borderRadius:8}}>{clDraft} brouillon{clDraft>1?"s":""}</span>}
    </div>
    {(cl.contact||cl.company||cl.email)&&<div style={{color:C.td,fontSize:9,marginTop:1}}>{cl.company&&<span style={{fontWeight:600,color:"#60a5fa"}}>{cl.company}</span>}{cl.company&&(cl.contact||cl.email)?" · ":""}{cl.contact||""}{cl.email?` · ${cl.email}`:""}</div>}
    {(()=>{const cn6=(cl.name||"").toLowerCase().trim();const calEvts6=(ghlData?.[soc.id]?.calendarEvents||[]);const txs6=(socBankData?.transactions||[]);let lastDate=null;calEvts6.forEach(e=>{if((e.contactName||e.title||"").toLowerCase().includes(cn6)){const d=new Date(e.startTime||0);if(!lastDate||d>lastDate)lastDate=d;}});txs6.forEach(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return;const desc=(leg.description||tx.reference||"").toLowerCase();if(cn6.length>2&&desc.includes(cn6)){const d=new Date(tx.created_at);if(!lastDate||d>lastDate)lastDate=d;}});if(!lastDate)return <div style={{fontSize:8,color:C.tm,marginTop:1}}>Aucune interaction</div>;const diffMs=Date.now()-lastDate.getTime();const diffH=Math.floor(diffMs/36e5);const diffD=Math.floor(diffMs/864e5);const txt=diffD===0?`il y a ${diffH}h`:`il y a ${diffD}j`;const col=diffD<14?C.td:diffD<30?C.o:C.r;return <div style={{fontSize:8,color:col,marginTop:1,fontWeight:diffD>=14?600:400}}>Dernier contact : {txt}</div>;})()}
    {cl.notes&&<div style={{color:C.td,fontSize:9,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cl.notes}</div>}
    <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap"}}>
    {b.type==="fixed"&&<>
    <span style={{fontSize:9,color:C.acc,fontWeight:700}}>{fmt(b.amount)}€/{b.freq==="annual"?"an":"mois"}</span>
    {b.commitment>0&&<span style={{fontSize:8,color:C.td}}>Engagement {b.commitment} mois{cr!==null?` · ${cr} restant${cr>1?"s":""}`:""}</span>}
    {!b.commitment&&<span style={{fontSize:8,color:C.o}}>Sans engagement</span>}
    </>}
    {b.type==="percent"&&<>
    {cl.company&&<span style={{fontSize:9,color:"#60a5fa",fontWeight:700}}>{cl.company}</span>}
    {!cl.company&&cl.clientCA>0&&<span style={{fontSize:8,color:C.td}}>CA client: {fmt(cl.clientCA)}€</span>}
    </>}
    {b.type==="hybrid"&&<>
    {cl.company?<span style={{fontSize:9,color:"#60a5fa",fontWeight:700}}>{cl.company}</span>:<span style={{fontSize:9,color:"#ec4899",fontWeight:700}}>{fmt(b.amount)}€/mois + {b.percent}% {b.basis==="benefice"?"bénéf.":"CA"}</span>}
    </>}
    {b.type==="oneoff"&&<>
    <span style={{fontSize:9,color:C.b,fontWeight:700}}>{fmt(b.amount)}€</span>
    {b.product&&<span style={{fontSize:8,color:C.td}}>{b.product}</span>}
    {b.paidDate&&<span style={{fontSize:8,color:C.g}}>Payé le {new Date(b.paidDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>}
    </>}
    </div>
    </div>
    <div style={{textAlign:"right",flexShrink:0}}>
    {b.type&&(b.type==="fixed"||b.type==="hybrid")&&<>
    <div style={{fontWeight:900,fontSize:16,color:bt?.c||C.td}}>{fmt(monthly)}€</div>
    <div style={{fontSize:8,color:C.td}}>/ mois</div>
    </>}
    {b.type&&b.type==="percent"&&<>
    <div style={{fontWeight:900,fontSize:16,color:bt?.c||C.td}}>{b.percent}%</div>
    <div style={{fontSize:8,color:C.td}}>{b.basis==="benefice"?"du bénéfice":"du CA"}</div>
    </>}
    {b.type&&b.type==="oneoff"&&<>
    <div style={{fontWeight:900,fontSize:16,color:bt?.c||C.td}}>{fmt(b.amount)}€</div>
    <div style={{fontSize:8,color:C.td}}>one-off</div>
    </>}
    {(()=>{const cn=(cl.name||"").toLowerCase().trim();const txs=(socBankData?.transactions||[]);const revTot=txs.filter(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;const desc=(leg.description||tx.reference||"").toLowerCase();if(cn.length>2&&desc.includes(cn))return true;const pts=cn.split(/\s+/).filter(p=>p.length>2);return pts.length>=2&&pts.every(p=>desc.includes(p));}).reduce((a,tx)=>a+(tx.legs?.[0]?.amount||0),0);const stripeTot=getStripeTotal(getStripeChargesForClient(stripeData,cl));const tot=revTot+stripeTot;if(tot<=0)return null;return <div style={{marginTop:3,padding:"2px 6px",background:C.gD,borderRadius:4,fontSize:8,fontWeight:700,color:C.g}}>💰 {fmt(tot)}€ collecté{stripeTot>0?" (dont "+fmt(stripeTot)+"€ Stripe)":""}</div>;})()}
    </div>
    </div>
   </Card>;
  })}
  {myInvoices.length>0&&<>
   <div style={{marginTop:16,marginBottom:4,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
    <span style={{fontSize:14}}>📄</span>
    <span style={{fontWeight:800,fontSize:13}}>Facturation</span>
    <span style={{fontSize:9,color:C.td}}>{myInvoices.length} factures</span>
    </div>
    <button onClick={()=>setInvView(invView?"":"all")} style={{background:"none",border:"none",color:C.acc,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:FONT}}>{invView?"Masquer les factures":"Voir toutes les factures"}</button>
   </div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
    <div style={{padding:"8px 10px",background:C.gD,borderRadius:8,textAlign:"center"}}>
    <div style={{fontWeight:900,fontSize:16,color:C.g}}>{fmt(totalEncaisse)}€</div>
    <div style={{fontSize:8,color:C.g,fontWeight:600}}>Encaissé ({invPaid.length})</div>
    </div>
    <div style={{padding:"8px 10px",background:C.oD,borderRadius:8,textAlign:"center"}}>
    <div style={{fontWeight:900,fontSize:16,color:C.o}}>{fmt(invSent.reduce((a,i)=>a+i.amount,0))}€</div>
    <div style={{fontSize:8,color:C.o,fontWeight:600}}>Envoyé ({invSent.length})</div>
    </div>
    <div style={{padding:"8px 10px",background:C.card2,borderRadius:8,textAlign:"center"}}>
    <div style={{fontWeight:900,fontSize:16,color:C.td}}>{fmt(invDraft.reduce((a,i)=>a+i.amount,0))}€</div>
    <div style={{fontSize:8,color:C.td,fontWeight:600}}>Brouillon ({invDraft.length})</div>
    </div>
    {invOverdue.length>0&&<div style={{padding:"8px 10px",background:C.rD,borderRadius:8,textAlign:"center"}}>
    <div style={{fontWeight:900,fontSize:16,color:C.r}}>{fmt(invOverdue.reduce((a,i)=>a+i.amount,0))}€</div>
    <div style={{fontSize:8,color:C.r,fontWeight:600}}>En retard ({invOverdue.length})</div>
    </div>}
    {invOverdue.length===0&&<div style={{padding:"8px 10px",background:C.gD,borderRadius:8,textAlign:"center"}}>
    <div style={{fontWeight:900,fontSize:16,color:C.g}}>{fmt(totalFacture)}€</div>
    <div style={{fontSize:8,color:C.g,fontWeight:600}}>Total facturé</div>
    </div>}
   </div>
   {totalFacture>0&&<div style={{marginBottom:12}}>
    <div style={{display:"flex",gap:2,height:6,borderRadius:3,overflow:"hidden"}}>
    <div style={{width:`${pct(totalEncaisse,totalFacture)}%`,background:C.g,borderRadius:3,transition:"width .3s"}}/>
    <div style={{width:`${pct(invSent.reduce((a,i)=>a+i.amount,0),totalFacture)}%`,background:C.o,borderRadius:3,transition:"width .3s"}}/>
    <div style={{width:`${pct(invDraft.reduce((a,i)=>a+i.amount,0),totalFacture)}%`,background:C.brd,borderRadius:3,transition:"width .3s"}}/>
    </div>
    <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
    <span style={{fontSize:8,color:C.g}}>{pct(totalEncaisse,totalFacture)}% encaissé</span>
    <span style={{fontSize:8,color:C.td}}>{fmt(totalFacture-totalEncaisse)}€ restant</span>
    </div>
   </div>}
   {invView&&<>
    {myClients.map(cl=>{
    const clInvs=clientInvoices(cl.id);
    if(clInvs.length===0)return null;
    const clPaid=clInvs.filter(i=>i.status==="paid").reduce((a,i)=>a+i.amount,0);
    const clTotal=clInvs.reduce((a,i)=>a+i.amount,0);
    return <div key={cl.id} style={{marginBottom:10}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,padding:"4px 0"}}>
    <span style={{fontWeight:700,fontSize:11,color:C.t}}>{cl.name}</span>
    <span style={{fontSize:8,color:C.td}}>—</span>
    <span style={{fontSize:9,color:C.g,fontWeight:600}}>{fmt(clPaid)}€ / {fmt(clTotal)}€</span>
    <div style={{flex:1,height:3,background:C.brd,borderRadius:2,overflow:"hidden",marginLeft:4}}>
    <div style={{height:"100%",width:`${pct(clPaid,clTotal)}%`,background:C.g,borderRadius:2}}/>
    </div>
    </div>
    {clInvs.map((inv,j)=>{
    const ist=INV_STATUS[inv.status]||INV_STATUS.draft;
    const isLate=inv.status==="overdue";
    return <div key={inv.id} className={`fu d${Math.min(j+1,6)}`} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:ist.bg||C.card,borderRadius:8,border:`1px solid ${isLate?C.r+"44":C.brd}`,marginBottom:2}}>
    <span style={{fontSize:10,flexShrink:0}}>{ist.icon}</span>
    <div style={{flex:1,minWidth:0}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontWeight:600,fontSize:10,color:C.t}}>{inv.description}</span>
    {inv.totalInstallments>1&&<span style={{fontSize:7,color:C.b,background:C.bD,padding:"1px 4px",borderRadius:4}}>{inv.installment}/{inv.totalInstallments}</span>}
    </div>
    <div style={{display:"flex",gap:8,marginTop:1}}>
    <span style={{fontSize:8,color:C.td}}>N° {inv.number}</span>
    <span style={{fontSize:8,color:isLate?C.r:C.td}}>Éch. {new Date(inv.dueDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</span>
    {inv.sentAt&&<span style={{fontSize:8,color:C.o}}>Envoyé {new Date(inv.sentAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>}
    {inv.paidAt&&<span style={{fontSize:8,color:C.g}}>Payé {new Date(inv.paidAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>}
    {inv.ghlInvoiceId&&<span style={{fontSize:7,color:C.acc,background:C.accD,padding:"1px 4px",borderRadius:3}}>GHL ✓</span>}
    </div>
    </div>
    <div style={{fontWeight:800,fontSize:13,color:ist.c,whiteSpace:"nowrap"}}>{fmt(inv.amount)}€</div>
    <div style={{display:"flex",gap:2,flexShrink:0}}>
    {inv.status==="draft"&&<button onClick={(e)=>{e.stopPropagation();sendInvoice(inv);}} disabled={sending===inv.id} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.acc}`,background:C.accD,color:C.acc,fontSize:8,fontWeight:700,cursor:"pointer",fontFamily:FONT,opacity:sending===inv.id?.5:1}} title="Envoyer au client">{sending===inv.id?"⏳":"📩 Envoyer"}</button>}
    {inv.status==="sent"&&<button onClick={(e)=>{e.stopPropagation();markPaid(inv);}} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.g}`,background:C.gD,color:C.g,fontSize:8,fontWeight:700,cursor:"pointer",fontFamily:FONT}} title="Marquer comme payé">✅ Payé</button>}
    {inv.status==="overdue"&&<>
    <button onClick={(e)=>{e.stopPropagation();sendInvoice(inv);}} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.o}`,background:C.oD,color:C.o,fontSize:8,fontWeight:700,cursor:"pointer",fontFamily:FONT}} title="Relancer">📩 Relancer</button>
    <button onClick={(e)=>{e.stopPropagation();markPaid(inv);}} style={{padding:"3px 6px",borderRadius:5,border:`1px solid ${C.g}`,background:C.gD,color:C.g,fontSize:8,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>✅</button>
    </>}
    {(inv.status==="draft"||inv.status==="sent")&&<button onClick={(e)=>{e.stopPropagation();cancelInvoice(inv);}} style={{padding:"3px 5px",borderRadius:5,border:`1px solid ${C.brd}`,background:"transparent",color:C.td,fontSize:8,cursor:"pointer",fontFamily:FONT}} title="Annuler">✗</button>}
    </div>
    </div>;
    })}
    </div>;
    })}
    {invDraft.length>0&&<Card accent={C.acc} style={{padding:12,marginTop:8}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div>
    <div style={{fontWeight:700,fontSize:11,color:C.acc}}>{invDraft.length} facture{invDraft.length>1?"s":""} en brouillon</div>
    <div style={{fontSize:9,color:C.td}}>Total : {fmt(invDraft.reduce((a,i)=>a+i.amount,0))}€ — Prêtes à être envoyées</div>
    </div>
    <Btn small onClick={async()=>{for(const inv of invDraft){await sendInvoice(inv);}}}>📩 Tout envoyer</Btn>
    </div>
    </Card>}
   </>}
  </>}
  {myInvoices.length===0&&myClients.length>0&&<Card style={{padding:16,marginTop:12,textAlign:"center"}}>
   <div style={{fontSize:24,marginBottom:4}}>📄</div>
   <div style={{fontWeight:700,fontSize:12,marginBottom:4}}>Aucune facture générée</div>
   <div style={{color:C.td,fontSize:10,marginBottom:10}}>Ajoute un client avec engagement ou paiement en plusieurs fois pour générer automatiquement les factures</div>
  </Card>}
  <Modal open={!!editCl} onClose={()=>{setEditCl(null);setCl360Tab("infos");}} title={editCl?.name?"Modifier client":"Nouveau client"} wide>
   {editCl&&(()=>{
    const b=editCl.billing||{type:"fixed"};const bt=BILL_TYPES[b.type];
    return <>
    {/* Client 360° Tabs */}
    <div style={{display:"flex",gap:0,marginBottom:12,borderBottom:`1px solid ${C.brd}`}}>
    {[{k:"infos",l:"📋 Infos"},{k:"timeline",l:"📅 Timeline"},{k:"paiements",l:"💰 Paiements"}].map(t=><button key={t.k} onClick={()=>setCl360Tab(t.k)} style={{padding:"8px 16px",background:cl360Tab===t.k?C.accD:"transparent",border:"none",borderBottom:cl360Tab===t.k?`2px solid ${C.acc}`:"2px solid transparent",color:cl360Tab===t.k?C.acc:C.td,fontWeight:cl360Tab===t.k?700:500,fontSize:11,cursor:"pointer",fontFamily:FONT,transition:"all .15s"}}>{t.l}</button>)}
    </div>
    {cl360Tab==="timeline"&&(()=>{
     const clName360=(editCl.name||"").toLowerCase().trim();
     const convos360=(ghlData?.[soc.id]?.conversations||[]).filter(cv=>(cv.contactName||cv.contact?.name||"").toLowerCase().includes(clName360));
     const txs360=(socBankData?.transactions||[]).filter(tx=>{const desc=(tx.legs?.[0]?.description||tx.reference||"").toLowerCase();return clName360.length>2&&desc.includes(clName360);});
     const events360=[...convos360.map(cv=>({date:cv.lastMessageDate||cv.dateUpdated||cv.dateAdded||"",icon:"💬",label:cv.contactName||"Conversation",desc:(cv.lastMessageBody||"").slice(0,80),color:C.b})),...txs360.map(tx=>({date:tx.created_at||"",icon:((tx.legs?.[0]?.amount||0)>0?"💰":"💸"),label:`${(tx.legs?.[0]?.amount||0)>0?"+":""}${fmt(tx.legs?.[0]?.amount||0)}€`,desc:tx.legs?.[0]?.description||tx.reference||"Transaction",color:(tx.legs?.[0]?.amount||0)>0?C.g:C.r}))].sort((a,b)=>new Date(b.date)-new Date(a.date));
     return <div style={{maxHeight:400,overflowY:"auto",marginBottom:12}}>
      {events360.length===0&&<div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Aucun événement trouvé</div>}
      {events360.map((ev,i)=><div key={i} style={{display:"flex",gap:8,padding:"8px 0",borderBottom:`1px solid ${C.brd}08`}}>
       <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><span style={{fontSize:14}}>{ev.icon}</span><div style={{width:2,flex:1,background:C.brd}}/></div>
       <div style={{flex:1}}><div style={{fontWeight:700,fontSize:11,color:ev.color}}>{ev.label}</div><div style={{fontSize:10,color:C.td}}>{ev.desc}</div><div style={{fontSize:8,color:C.tm,marginTop:2}}>{ev.date?ago(ev.date):""}</div></div>
      </div>)}
     </div>;
    })()}
    {cl360Tab==="paiements"&&(()=>{
     const clName360p=(editCl.name||"").toLowerCase().trim();const clEmail360p=(editCl.email||"").toLowerCase().trim();
     const matchedTx=(socBankData?.transactions||[]).filter(tx=>{const leg=tx.legs?.[0];if(!leg)return false;const desc=(leg.description||tx.reference||"").toLowerCase();return(clName360p.length>2&&desc.includes(clName360p))||(clEmail360p.length>3&&desc.includes(clEmail360p));});
     const totalIn=matchedTx.filter(tx=>(tx.legs?.[0]?.amount||0)>0).reduce((a,tx)=>a+(tx.legs?.[0]?.amount||0),0);
     const totalOut=Math.abs(matchedTx.filter(tx=>(tx.legs?.[0]?.amount||0)<0).reduce((a,tx)=>a+(tx.legs?.[0]?.amount||0),0));
     return <div style={{marginBottom:12}}>
      <div style={{display:"flex",gap:12,marginBottom:12}}>
       <div style={{flex:1,padding:12,background:C.gD,borderRadius:10,textAlign:"center"}}><div style={{fontSize:8,color:C.g,fontWeight:700}}>REÇU</div><div style={{fontWeight:900,fontSize:18,color:C.g}}>{fmt(totalIn)}€</div></div>
       <div style={{flex:1,padding:12,background:C.rD,borderRadius:10,textAlign:"center"}}><div style={{fontSize:8,color:C.r,fontWeight:700}}>ENVOYÉ</div><div style={{fontWeight:900,fontSize:18,color:C.r}}>{fmt(totalOut)}€</div></div>
      </div>
      <div style={{maxHeight:300,overflowY:"auto"}}>{matchedTx.length===0&&<div style={{textAlign:"center",padding:20,color:C.td,fontSize:11}}>Aucune transaction trouvée</div>}
      {matchedTx.map((tx,i)=>{const leg=tx.legs?.[0]||{};const isIn=(leg.amount||0)>0;return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:isIn?C.gD:C.rD,borderRadius:6,marginBottom:2}}>
       <span style={{fontSize:10}}>{isIn?"💰":"💸"}</span>
       <div style={{flex:1,minWidth:0}}><div style={{fontSize:10,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{leg.description||tx.reference||"—"}</div></div>
       <span style={{fontWeight:800,fontSize:11,color:isIn?C.g:C.r}}>{isIn?"+":""}{fmt(leg.amount||0)}€</span>
       <span style={{fontSize:8,color:C.td}}>{tx.created_at?new Date(tx.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"short"}):"—"}</span>
      </div>;})}
      </div>
     </div>;
    })()}
    {cl360Tab==="infos"&&<>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,padding:"6px 10px",background:editCl.ghlId?C.gD:C.oD,borderRadius:8,border:`1px solid ${editCl.ghlId?C.g+"33":C.o+"33"}`}}>
    <span style={{fontSize:12}}>{editCl.ghlId?"✅":"⚠️"}</span>
    <span style={{fontSize:10,fontWeight:600,color:editCl.ghlId?C.g:C.o}}>{editCl.ghlId?"Synced avec GHL":"Local uniquement"}</span>
    {editCl.ghlId&&<span style={{fontSize:8,color:C.td,marginLeft:"auto",fontFamily:"monospace"}}>{editCl.ghlId.slice(0,12)}…</span>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Nom du contact" value={editCl.name} onChange={v=>setEditCl({...editCl,name:v})} placeholder="Ex: Marion Pothin"/>
    <Inp label="Entreprise" value={editCl.company||""} onChange={v=>setEditCl({...editCl,company:v})} placeholder="Ex: Studio Fitness Paris"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Email" value={editCl.email} onChange={v=>setEditCl({...editCl,email:v})} placeholder="email@client.com"/>
    <Inp label="Téléphone" value={editCl.phone} onChange={v=>setEditCl({...editCl,phone:v})} placeholder="06..."/>
    </div>
    {(()=>{const DOMAINS=["Fitness","Immobilier","E-commerce","Restaurant","Coaching","Beauté / Bien-être","Santé","BTP / Construction","Formation","Marketing / Agence","SaaS / Tech","Juridique","Finance","Transport","Mode","Autre"];const allDomains=[...new Set([...DOMAINS,...myClients.map(c=>(c.domain||"").trim()).filter(Boolean)])].sort();const cur=editCl.domain||"";return <div><label style={{fontSize:9,fontWeight:700,color:C.td,marginBottom:2,display:"block"}}>Domaine d'activité</label><select value={cur} onChange={e=>setEditCl({...editCl,domain:e.target.value})} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${C.brd}`,background:C.card,color:C.t,fontSize:11,fontFamily:FONT,outline:"none"}}><option value="">— Sélectionner —</option>{allDomains.map(d=><option key={d} value={d}>{d}</option>)}</select></div>;})()}
    <div style={{padding:"10px 12px",background:C.card2,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>TYPE DE FACTURATION</div>
    <div style={{display:"flex",gap:4,marginBottom:10}}>
    {Object.entries(BILL_TYPES).map(([k,v])=>
    <button key={k} onClick={()=>setEditCl({...editCl,billing:{...editCl.billing,type:k}})} style={{flex:1,padding:"8px 6px",borderRadius:8,border:`1.5px solid ${b.type===k?v.c:C.brd}`,background:b.type===k?v.c+"15":C.card,color:b.type===k?v.c:C.td,fontWeight:b.type===k?700:500,fontSize:10,cursor:"pointer",fontFamily:FONT,transition:"all .15s",textAlign:"center"}}>
    <div style={{fontSize:14,marginBottom:2}}>{v.icon}</div>{v.l}
    </button>
    )}
    </div>
    {b.type==="fixed"&&<>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Montant" value={b.amount} onChange={v=>setEditCl({...editCl,billing:{...b,amount:pf(v)}})} type="number" suffix="€"/>
    <Sel label="Fréquence" value={b.freq||"monthly"} onChange={v=>setEditCl({...editCl,billing:{...b,freq:v}})} options={[{v:"monthly",l:"Mensuel"},{v:"annual",l:"Annuel"}]}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Engagement (mois)" value={b.commitment||0} onChange={v=>setEditCl({...editCl,billing:{...b,commitment:pf(v)}})} type="number" suffix="mois"/>
    <Inp label="Date de début" value={b.startDate||""} onChange={v=>setEditCl({...editCl,billing:{...b,startDate:v}})} type="date"/>
    </div>
    {b.amount>0&&b.commitment>0&&<div style={{padding:"8px 10px",background:C.accD,borderRadius:6,fontSize:10,color:C.acc,fontWeight:600,marginTop:4}}>
    Valeur contrat : {fmt(b.amount*b.commitment)}€ sur {b.commitment} mois{commitmentRemaining(editCl)!==null?` · ${commitmentRemaining(editCl)} mois restants`:""}
    <div style={{fontSize:8,color:C.td,fontWeight:400,marginTop:2}}>🧾 {b.commitment} factures brouillon seront créées automatiquement, une par mois{soc.ghlKey?" (envoi vers GHL)":""}</div>
    </div>}
    {b.amount>0&&!b.commitment&&<div style={{padding:"6px 8px",background:C.oD,borderRadius:6,fontSize:10,color:C.o,marginTop:4}}>Sans engagement — résiliable à tout moment</div>}
    </>}
    {b.type==="percent"&&<>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Pourcentage" value={b.percent||0} onChange={v=>setEditCl({...editCl,billing:{...b,percent:pf(v)}})} type="number" suffix="%"/>
    <Sel label="Base de calcul" value={b.basis||"ca"} onChange={v=>setEditCl({...editCl,billing:{...b,basis:v}})} options={[{v:"ca",l:"% du CA"},{v:"benefice",l:"% du bénéfice"}]}/>
    </div>
    <Inp label="Date de début" value={b.startDate||""} onChange={v=>setEditCl({...editCl,billing:{...b,startDate:v}})} type="date"/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="CA mensuel du client" value={editCl.clientCA||""} onChange={v=>setEditCl({...editCl,clientCA:pf(v)})} type="number" suffix="€"/>
    {b.basis==="benefice"&&<Inp label="Charges client" value={editCl.clientCharges||""} onChange={v=>setEditCl({...editCl,clientCharges:pf(v)})} type="number" suffix="€"/>}
    </div>
    {(editCl.clientCA||0)>0&&(b.percent||0)>0&&<div style={{padding:"6px 8px",background:C.vD,borderRadius:6,fontSize:10,color:C.v,fontWeight:600,marginTop:4}}>
    Revenu estimé : {fmt(clientMonthlyRevenue(editCl))}€/mois ({b.percent}% de {b.basis==="benefice"?fmt(Math.max(0,(editCl.clientCA||0)-(editCl.clientCharges||0))):fmt(editCl.clientCA)}€)
    </div>}
    </>}
    {b.type==="hybrid"&&<>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Montant fixe" value={b.amount} onChange={v=>setEditCl({...editCl,billing:{...b,amount:pf(v)}})} type="number" suffix="€"/>
    <Sel label="Fréquence" value={b.freq||"monthly"} onChange={v=>setEditCl({...editCl,billing:{...b,freq:v}})} options={[{v:"monthly",l:"Mensuel"},{v:"annual",l:"Annuel"}]}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Pourcentage" value={b.percent||0} onChange={v=>setEditCl({...editCl,billing:{...b,percent:pf(v)}})} type="number" suffix="%"/>
    <Sel label="Base de calcul" value={b.basis||"ca"} onChange={v=>setEditCl({...editCl,billing:{...b,basis:v}})} options={[{v:"ca",l:"% du CA"},{v:"benefice",l:"% du bénéfice"}]}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Engagement (mois)" value={b.commitment||0} onChange={v=>setEditCl({...editCl,billing:{...b,commitment:pf(v)}})} type="number" suffix="mois"/>
    <Inp label="Date de début" value={b.startDate||""} onChange={v=>setEditCl({...editCl,billing:{...b,startDate:v}})} type="date"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="CA mensuel du client" value={editCl.clientCA||""} onChange={v=>setEditCl({...editCl,clientCA:pf(v)})} type="number" suffix="€"/>
    {b.basis==="benefice"&&<Inp label="Charges client" value={editCl.clientCharges||""} onChange={v=>setEditCl({...editCl,clientCharges:pf(v)})} type="number" suffix="€"/>}
    </div>
    {((b.amount||0)>0||(b.percent||0)>0)&&<div style={{padding:"8px 10px",background:"rgba(236,72,153,.1)",borderRadius:6,fontSize:10,color:"#ec4899",fontWeight:600,marginTop:4}}>
    Fixe: {fmt(b.amount)}€/mois + Variable: {b.percent}% = <strong>{fmt(clientMonthlyRevenue(editCl))}€/mois estimé</strong>
    </div>}
    </>}
    {b.type==="oneoff"&&<>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="Montant total" value={b.amount||0} onChange={v=>setEditCl({...editCl,billing:{...b,amount:pf(v)}})} type="number" suffix="€"/>
    <Inp label="Produit / Offre" value={b.product||""} onChange={v=>setEditCl({...editCl,billing:{...b,product:v}})} placeholder="Ex: Accompagnement Pub"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 10px"}}>
    <Inp label="Nb échéances" value={b.installments||1} onChange={v=>setEditCl({...editCl,billing:{...b,installments:Math.max(1,pf(v))}})} type="number" suffix="x"/>
    <Inp label="Date 1er paiement" value={b.paidDate||""} onChange={v=>setEditCl({...editCl,billing:{...b,paidDate:v}})} type="date"/>
    <Inp label="Date de livraison" value={b.deliveredDate||""} onChange={v=>setEditCl({...editCl,billing:{...b,deliveredDate:v}})} type="date"/>
    </div>
    {(b.installments||1)>1&&b.amount>0&&<div style={{padding:"8px 10px",background:C.bD,borderRadius:6,fontSize:10,color:C.b,fontWeight:600,marginTop:4}}>
    {b.installments} échéances de {fmt(Math.round(b.amount/(b.installments||1)))}€ — Total {fmt(b.amount)}€
    <div style={{fontSize:8,color:C.td,fontWeight:400,marginTop:2}}>Les factures seront créées automatiquement en brouillon, 1 par mois à partir de la date du 1er paiement</div>
    </div>}
    </>}
    </div>
    <Sel label="Statut" value={editCl.status} onChange={v=>setEditCl({...editCl,status:v})} options={Object.entries(CLIENT_STATUS).map(([k,v])=>({v:k,l:`${v.icon} ${v.l}`}))}/>
    <Inp label="Notes" value={editCl.notes} onChange={v=>{setEditCl({...editCl,notes:v});sSet(`scClientNotes_${editCl.id}`,v);}} placeholder="Contexte, détails du deal…"/>
    {editCl.ghlId&&<button onClick={()=>{const loc=soc.ghlLocationId;if(loc&&editCl.ghlId)fetchGHL("notes_create",loc,{contactId:editCl.ghlId,body:editCl.notes||""});}} style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${C.acc}`,background:C.accD,color:C.acc,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:FONT,marginBottom:8}}>📤 Sync notes → GHL</button>}
    {/* Payment tracking - auto-matched */}
    {(()=>{
     const clName=(editCl.name||"").toLowerCase().trim();
     const clEmail=(editCl.email||"").toLowerCase().trim();
     const txs=(socBankData?.transactions||[]);
     const matched=txs.filter(tx=>{
      const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;
      const desc=(leg.description||tx.reference||"").toLowerCase();
      if(clName.length>2&&desc.includes(clName))return true;
      if(clEmail.length>3&&desc.includes(clEmail))return true;
      const nameParts=clName.split(/\s+/).filter(p=>p.length>2);
      if(nameParts.length>=2&&nameParts.every(p=>desc.includes(p)))return true;
      return false;
     }).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
     const total=matched.reduce((a,tx)=>a+(tx.legs?.[0]?.amount||0),0);
     if(matched.length===0)return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
      <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:4}}>💳 SUIVI PAIEMENTS</div>
      <div style={{fontSize:10,color:C.td}}>Aucun paiement détecté pour ce contact</div>
     </div>;
     return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
       <span style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>💳 SUIVI PAIEMENTS ({matched.length})</span>
       <span style={{fontWeight:800,fontSize:12,color:C.g}}>{fmt(total)}€ total</span>
      </div>
      <div style={{maxHeight:180,overflowY:"auto"}}>
      {matched.map((tx,i)=>{const leg=tx.legs?.[0];return <div key={tx.id||i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:i<matched.length-1?`1px solid ${C.brd}`:"none"}}>
       <span style={{width:18,height:18,borderRadius:5,background:C.gD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:C.g,flexShrink:0}}>💰</span>
       <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:10,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{leg.description||tx.reference||"—"}</div>
        <div style={{fontSize:8,color:C.td}}>{new Date(tx.created_at).toLocaleDateString("fr-FR")}</div>
       </div>
       <span style={{fontWeight:700,fontSize:11,color:C.g}}>+{fmt(leg.amount)}€</span>
      </div>;})}
      </div>
     </div>;
    })()}
    {/* Activity Timeline */}
    {(()=>{
     const cn=(editCl.name||"").toLowerCase().trim();const ce=(editCl.email||"").toLowerCase().trim();
     const events=[];
     // Bank transactions
     const txs=(socBankData?.transactions||[]);
     txs.forEach(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return;const desc=(leg.description||tx.reference||"").toLowerCase();const pts=cn.split(/\s+/).filter(p=>p.length>2);const match=cn.length>2&&desc.includes(cn)||(pts.length>=2&&pts.every(p=>desc.includes(p)));if(match)events.push({date:tx.created_at,icon:"💰",type:"payment",label:`Paiement reçu: ${fmt(leg.amount)}€`,desc:leg.description||tx.reference||"",color:C.g});});
     // GHL opportunities
     const opps=(ghlData?.[soc.id]?.opportunities||[]).filter(o=>o.contact?.id===editCl.ghlId);
     opps.forEach(o=>{events.push({date:o.createdAt||o.updatedAt,icon:o.status==="won"?"✅":o.status==="lost"?"❌":"🎯",type:"deal",label:o.status==="won"?"Deal gagné"+(o.value?` (${fmt(o.value)}€)`:""):o.status==="lost"?"Deal perdu":`Deal: ${o.stage||"En cours"}`,desc:o.name||"",color:o.status==="won"?C.g:o.status==="lost"?C.r:C.acc});});
     // Calendar events
     const calEvts=(ghlData?.[soc.id]?.calendarEvents||[]).filter(e=>{const n=(e.title||e.contactName||"").toLowerCase();return cn.length>2&&n.includes(cn)||ce.length>3&&(e.email||"").toLowerCase().includes(ce);});
     calEvts.forEach(e=>{events.push({date:e.startTime||e.createdAt,icon:"📞",type:"call",label:e.calendarName||"Appel",desc:e.title||e.contactName||"",color:"#14b8a6"});});
     // Contact created
     if(editCl.at)events.push({date:editCl.at,icon:"👤",type:"created",label:"Contact créé",desc:"Ajouté dans le CRM",color:"#60a5fa"});
     events.sort((a,b)=>new Date(b.date)-new Date(a.date));
     if(events.length===0)return null;
     return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
      <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:8}}>📋 HISTORIQUE D'ACTIVITÉ ({events.length})</div>
      <div style={{maxHeight:200,overflowY:"auto"}}>
      {events.slice(0,20).map((ev,i)=><div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:i<Math.min(events.length,20)-1?`1px solid ${C.brd}`:"none"}}>
       <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flexShrink:0}}>
        <span style={{fontSize:12}}>{ev.icon}</span>
        {i<Math.min(events.length,20)-1&&<div style={{width:1,flex:1,background:C.brd}}/>}
       </div>
       <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:10,fontWeight:600,color:ev.color}}>{ev.label}</div>
        {ev.desc&&<div style={{fontSize:9,color:C.td,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.desc}</div>}
        <div style={{fontSize:8,color:C.td}}>{ev.date?new Date(ev.date).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}):""}</div>
       </div>
      </div>)}
      </div>
     </div>;
    })()}
    {/* Onboarding checklist for recently active clients */}
    {(()=>{
     if(editCl.status!=="active")return null;
     const addedDate=new Date(editCl.at||editCl.createdAt||0);
     const daysSinceAdded=Math.floor((Date.now()-addedDate.getTime())/(864e5));
     if(daysSinceAdded>30)return null;
     const obKey=`scOnboard_${editCl.id}`;
     const stored=JSON.parse(localStorage.getItem(obKey)||"{}");
     const items=[
      {id:"contrat",label:"☐ Contrat signé",icon:"📝"},
      {id:"paiement",label:"☐ Premier paiement reçu",icon:"💰"},
      {id:"integration",label:"☐ Appel d'intégration fait",icon:"📞"},
      {id:"communaute",label:"☐ Accès communauté donné",icon:"🤝"},
     ];
     const done=items.filter(it=>stored[it.id]).length;
     const total=items.length;
     const pctDone=Math.round(done/total*100);
     const toggle=(id)=>{const next={...stored,[id]:!stored[id]};localStorage.setItem(obKey,JSON.stringify(next));sSet(obKey,next);};
     return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.acc}22`,margin:"8px 0"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
       <span style={{color:C.acc,fontSize:9,fontWeight:700,letterSpacing:.8}}>🚀 ONBOARDING — {daysSinceAdded}j</span>
       <span style={{fontSize:10,fontWeight:700,color:pctDone===100?C.g:C.acc}}>{pctDone}%</span>
      </div>
      <div style={{height:5,background:C.brd,borderRadius:3,overflow:"hidden",marginBottom:8}}>
       <div style={{height:"100%",width:`${pctDone}%`,background:pctDone===100?C.g:`linear-gradient(90deg,#FFBF00,#FF9D00)`,borderRadius:3,transition:"width .5s ease"}}/>
      </div>
      {items.map(it=><div key={it.id} onClick={()=>toggle(it.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",cursor:"pointer",borderBottom:`1px solid ${C.brd}08`}}>
       <span style={{width:16,height:16,borderRadius:4,border:`2px solid ${stored[it.id]?C.g:C.brd}`,background:stored[it.id]?C.gD:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.g,flexShrink:0}}>{stored[it.id]?"✓":""}</span>
       <span style={{fontSize:10,fontWeight:stored[it.id]?400:600,color:stored[it.id]?C.td:C.t,textDecoration:stored[it.id]?"line-through":"none"}}>{it.icon} {it.label.replace("☐ ","")}</span>
      </div>)}
     </div>;
    })()}
    {/* Stripe payments */}
    {(()=>{
     const stripeCharges=getStripeChargesForClient(stripeData,editCl);
     const stripeTotal=getStripeTotal(stripeCharges);
     if(stripeCharges.length===0)return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
      <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:4}}>💳 PAIEMENTS STRIPE</div>
      <div style={{fontSize:10,color:C.td}}>Aucun paiement Stripe détecté</div>
     </div>;
     return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
       <span style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8}}>💳 PAIEMENTS STRIPE ({stripeCharges.length})</span>
       <span style={{fontWeight:800,fontSize:12,color:C.v}}>{fmt(stripeTotal)}€ total</span>
      </div>
      <div style={{maxHeight:180,overflowY:"auto"}}>
      {stripeCharges.map((ch,i)=>{const amt=Math.round((ch.amount||0)/100);const d=new Date((ch.created||0)*1000);const ok=ch.status==="succeeded";return <div key={ch.id||i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:i<stripeCharges.length-1?`1px solid ${C.brd}`:"none"}}>
       <span style={{width:18,height:18,borderRadius:5,background:ok?C.vD:C.rD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:ok?C.v:C.r,flexShrink:0}}>💳</span>
       <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:10,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ch.description||ch.billing_details?.email||"Paiement Stripe"}</div>
        <div style={{fontSize:8,color:C.td}}>{d.toLocaleDateString("fr-FR")} · {ch.status}</div>
       </div>
       <span style={{fontWeight:700,fontSize:11,color:ok?C.v:C.r}}>{ok?"+":""}{fmt(amt)}€</span>
      </div>;})}
      </div>
     </div>;
    })()}
    {/* LTV Section */}
    {(()=>{
     const clName7=(editCl.name||"").toLowerCase().trim();
     const txs7=(socBankData?.transactions||[]);
     const collected=txs7.filter(tx=>{const leg=tx.legs?.[0];if(!leg||leg.amount<=0)return false;const desc=(leg.description||tx.reference||"").toLowerCase();if(clName7.length>2&&desc.includes(clName7))return true;const pts=clName7.split(/\s+/).filter(p=>p.length>2);return pts.length>=2&&pts.every(p=>desc.includes(p));}).reduce((a,tx)=>a+(tx.legs?.[0]?.amount||0),0);
     const b7=editCl.billing||{};const monthly7=clientMonthlyRevenue(editCl);
     const ltv=(b7.freq==="monthly"||b7.type==="fixed"||b7.type==="percent"||b7.type==="hybrid")?monthly7*12:collected;
     const ratio=ltv>0?Math.min(100,Math.round(collected/ltv*100)):0;
     return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.acc}22`,margin:"8px 0"}}>
      <div style={{color:C.acc,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:6}}>📊 VALEUR CLIENT (LTV)</div>
      <div style={{fontSize:12,fontWeight:700,color:C.t,marginBottom:6}}>💰 Collecté: {fmt(collected)}€ | LTV estimé: {fmt(ltv)}€</div>
      {ltv>0&&<><div style={{height:6,background:C.brd,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${ratio}%`,background:`linear-gradient(90deg,${C.acc},#FF9D00)`,borderRadius:3,transition:"width .5s ease"}}/></div>
      <div style={{fontSize:8,color:C.td,marginTop:3}}>{ratio}% de la valeur estimée collectée</div></>}
     </div>;
    })()}
    <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
    <div style={{color:C.td,fontSize:9,fontWeight:700,letterSpacing:.8,marginBottom:6}}>CONNEXIONS EXTERNES</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
    <Inp label="ID GoHighLevel" value={editCl.ghlId||""} onChange={v=>setEditCl({...editCl,ghlId:v})} placeholder="Contact/Opportunity ID" small/>
    <Inp label="ID Stripe" value={editCl.stripeId||""} onChange={v=>setEditCl({...editCl,stripeId:v})} placeholder="cus_..." small/>
    </div>
    </div>
    {/* Invoice section for existing clients */}
    {clients.some(c=>c.id===editCl.id)&&(()=>{
    const clInvs=clientInvoices(editCl.id);
    if(clInvs.length===0)return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontSize:10}}>🧾</span>
    <span style={{color:C.td,fontSize:10,fontWeight:600}}>Aucune facture générée</span>
    </div>
    {((b.type==="fixed"&&b.commitment>0)||(b.type==="oneoff"&&b.amount>0))&&<button onClick={()=>regenInvoices(editCl)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C.acc}`,background:C.accD,color:C.acc,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Générer les factures</button>}
    </div>
    </div>;
    const paid=clInvs.filter(x=>x.status==="paid").length;
    const total=clInvs.reduce((a,x)=>a+x.amount,0);
    const paidAmt=clInvs.filter(x=>x.status==="paid").reduce((a,x)=>a+x.amount,0);
    return <div style={{padding:"10px 12px",background:C.bg,borderRadius:10,border:`1px solid ${C.brd}`,margin:"8px 0"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
    <span style={{fontSize:10}}>🧾</span>
    <span style={{fontWeight:700,fontSize:10}}>Factures ({paid}/{clInvs.length})</span>
    <span style={{fontSize:9,color:C.g,fontWeight:600}}>{fmt(paidAmt)}€ / {fmt(total)}€</span>
    </div>
    <button onClick={()=>regenInvoices(editCl)} style={{padding:"2px 6px",borderRadius:4,border:`1px solid ${C.brd}`,background:"transparent",color:C.td,fontSize:8,cursor:"pointer",fontFamily:FONT}} title="Regénérer les factures">🔄</button>
    </div>
    <div style={{display:"flex",gap:1,height:4,borderRadius:2,overflow:"hidden",marginBottom:6}}>
    {clInvs.map(inv=>{const st=INV_STATUS[inv.status]||INV_STATUS.draft;
    return <div key={inv.id} style={{flex:1,background:st.c,borderRadius:1,transition:"background .3s"}} title={`${inv.description} — ${st.l} — ${fmt(inv.amount)}€`}/>;
    })}
    </div>
    <div style={{maxHeight:200,overflowY:"auto"}}>
    {clInvs.map(inv=>{const st=INV_STATUS[inv.status]||INV_STATUS.draft;
    return <div key={inv.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 6px",background:st.bg,borderRadius:4,marginBottom:1,fontSize:9}}>
    <span style={{fontSize:8}}>{st.icon}</span>
    <span style={{fontSize:7,color:st.c,fontWeight:700,minWidth:48}}>{st.l}</span>
    <span style={{flex:1,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:9}}>
    {inv.totalInstallments>1&&<strong style={{color:C.b}}>#{inv.installment} </strong>}
    {inv.description.length>30?inv.description.slice(0,30)+"…":inv.description}
    </span>
    <span style={{fontWeight:700,color:C.t,whiteSpace:"nowrap"}}>{fmt(inv.amount)}€</span>
    <span style={{color:C.td,fontSize:7,whiteSpace:"nowrap"}}>{new Date(inv.dueDate).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>
    {inv.status==="draft"&&<button onClick={(e)=>{e.stopPropagation();sendInvoice(inv);}} disabled={sending===inv.id} style={{padding:"1px 5px",borderRadius:3,border:`1px solid ${C.b}`,background:C.bD,color:C.b,fontSize:7,fontWeight:700,cursor:"pointer",fontFamily:FONT,opacity:sending===inv.id?.5:1}}>{sending===inv.id?"…":"Envoyer"}</button>}
    {(inv.status==="sent"||inv.status==="overdue")&&<button onClick={(e)=>{e.stopPropagation();markPaid(inv);}} style={{padding:"1px 5px",borderRadius:3,border:`1px solid ${C.g}`,background:C.gD,color:C.g,fontSize:7,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Payée</button>}
    </div>;
    })}
    </div>
    </div>;
    })()}
    </>}
    <div style={{display:"flex",gap:8,marginTop:12}}>
    <Btn onClick={()=>saveCl(editCl)}>Sauver</Btn>
    {clients.some(c=>c.id===editCl.id)&&<Btn v="secondary" onClick={()=>deleteCl(editCl.id)}>🗑 Supprimer</Btn>}
    <Btn v="secondary" onClick={()=>setEditCl(null)}>Annuler</Btn>
    </div>
    </>;
   })()}
  </Modal>
 </div>;
}/* PROACTIVE INSIGHTS ENGINE */
