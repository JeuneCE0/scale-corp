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
import { GradeBadge, KPI, Btn, Inp, Sel, Sect, Card, Modal, CTip, ActionItem } from "./UI.jsx";

export function ValRow({s,r,reps,save,hs,delay,onAction,hold}){
 const[open,setOpen]=useState(false);const[cmt,setCmt]=useState(r.comment||"");const[actText,setActText]=useState("");
 const ca=pf(r.ca),ch=pf(r.charges),mrr=pf(r.mrr),pipe=pf(r.pipeline),ts=pf(r.tresoSoc),marge=ca-ch,m=curM();
 const doVal=(wc)=>{
  const finalComment=wc?cmt:r.comment;
  save(null,{...reps,[`${s.id}_${m}`]:{...r,ok:true,comment:finalComment}},null);setOpen(false);
  if(hold?.slack?.enabled&&hold.slack.notifyValidation){
   slackSend(hold.slack,buildValidationSlackMsg(s,finalComment,m));
  }
 };
 const prevR=gr(reps,s.id,prevM(m)),prevCa=prevR?pf(prevR.ca):0;const trend=prevCa>0?pct(ca-prevCa,prevCa):null;
 return <div className={`fu d${delay}`}>
  <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:C.card,borderRadius:open?"12px 12px 0 0":12,border:`1px solid ${C.brd}`,borderBottom:open?"none":`1px solid ${C.brd}`,marginBottom:open?0:5,cursor:"pointer"}} onClick={()=>setOpen(!open)}>
   <GradeBadge grade={hs.grade} color={hs.color}/><div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{s.nom} <span style={{color:C.td,fontWeight:400,fontSize:11}}>· {s.porteur}</span></div></div>
   <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>{trend!=null&&<span style={{fontSize:10,fontWeight:600,color:trend>=0?C.g:C.r}}>{trend>=0?"▲":"▼"}{Math.abs(trend)}%</span>}<span style={{fontWeight:800,fontSize:15}}>{fmt(ca)}€</span>
    {r.ok?<span style={{color:C.g,fontSize:13}}>✓</span>:<button className="ba" onClick={e=>{e.stopPropagation();doVal(false);}} style={{background:C.gD,color:C.g,border:`1px solid ${C.g}33`,borderRadius:6,padding:"4px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Valider</button>}<span style={{color:C.td,fontSize:10,transform:open?"rotate(180deg)":"",transition:"transform .2s"}}>▼</span></div>
  </div>
  {open&&<div className="fu" style={{background:C.card,border:`1px solid ${C.brd}`,borderTop:"none",borderRadius:"0 0 12px 12px",padding:"8px 12px 12px",marginBottom:5}}>
   <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8,fontSize:11,color:C.td}}>
    <span>CA: <strong style={{color:C.t}}>{fmt(ca)}€</strong></span><span>Marge: <strong style={{color:marge>=0?C.g:C.r}}>{fmt(marge)}€</strong></span>
    {s.obj>0&&<span>Obj: <strong style={{color:pct(ca,s.obj)>=100?C.g:C.r}}>{pct(ca,s.obj)}%</strong></span>}
    {s.rec&&mrr>0&&<span>MRR: <strong style={{color:C.b}}>{fmt(mrr)}€</strong></span>}{pipe>0&&<span>Pipe: <strong style={{color:C.acc}}>{fmt(pipe)}€</strong></span>}{ts>0&&<span>Tréso: <strong>{fmt(ts)}€</strong></span>}
   </div>
   {r.notes&&<div style={{fontSize:11,color:C.td,fontStyle:"italic",marginBottom:8,padding:"6px 8px",background:C.bg,borderRadius:6}}>"{r.notes}"</div>}
   <div style={{display:"flex",gap:8,alignItems:"flex-end",marginBottom:8}}><div style={{flex:1}}><Inp label="Commentaire" value={cmt} onChange={setCmt} placeholder="Feedback…" small/></div>
    {!r.ok&&<Btn small v="success" onClick={()=>doVal(true)}>✓ Valider</Btn>}
    {cmt!==r.comment&&<Btn small v="secondary" onClick={()=>{save(null,{...reps,[`${s.id}_${m}`]:{...r,comment:cmt}},null);}}>Envoyer</Btn>}
   </div>
   <div style={{display:"flex",gap:6,alignItems:"center",borderTop:`1px solid ${C.brd}`,paddingTop:8}}>
    <input value={actText} onChange={e=>setActText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&actText.trim()){onAction(s.id,actText.trim());setActText("");}}} placeholder="+ Action…" style={{flex:1,background:C.bg,border:`1px solid ${C.brd}`,borderRadius:6,color:C.t,padding:"6px 8px",fontSize:11,fontFamily:FONT,outline:"none"}}/><Btn small v="secondary" onClick={()=>{if(actText.trim()){onAction(s.id,actText.trim());setActText("");}}}>+</Btn>
   </div>
  </div>}
 </div>;
}
/* SIMULATEUR */

export function AdminClientsTab({clients,socs}){
 const[clSearch,setClSearch]=useState("");const[clSort,setClSort]=useState("ca");
 const allCl=(clients||[]);const activeAll=allCl.filter(c=>c.status==="active");const churnedAll=allCl.filter(c=>c.status==="churned");
 const totalMRR=activeAll.reduce((a,c)=>a+clientMonthlyRevenue(c),0);
 const filtered=allCl.filter(c=>!clSearch||c.name?.toLowerCase().includes(clSearch.toLowerCase())||socs.find(s=>s.id===c.socId)?.nom?.toLowerCase().includes(clSearch.toLowerCase()));
 const sorted=[...filtered].sort((a,b)=>{if(clSort==="ca")return clientMonthlyRevenue(b)-clientMonthlyRevenue(a);if(clSort==="society")return(a.socId||"").localeCompare(b.socId||"");return(a.name||"").localeCompare(b.name||"");});
 return <><div style={{fontWeight:800,fontSize:16,fontFamily:FONT_TITLE,marginBottom:14}}>👥 Clients — Toutes sociétés</div>
  <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginBottom:14}}>
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
const TX_CATEGORIES=[
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
  <div className="page-wrap" style={{padding:"20px 30px",maxWidth:900,margin:"0 auto"}}>
   {step===0&&<div className="si">
    <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14}}>
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
    <div className="rg-auto" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
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

export function calcSmartAlerts(socs,reps,actions,pulses,allM,socBank,ghlData){
 const cM2=curM();const pm=prevM(cM2);const alerts=[];
 socs.filter(s=>s.stat==="active"&&s.id!=="eco").forEach(s=>{
  const r=gr(reps,s.id,cM2),rp=gr(reps,s.id,pm),rpp=gr(reps,s.id,prevM(pm));
  const ca=pf(r?.ca),caPrev=pf(rp?.ca),caPP=pf(rpp?.ca);
  const ch=pf(r?.charges);const rw=runway(reps,s.id,allM);
  if(caPrev>0&&ca>0&&(ca-caPrev)/caPrev<-.3)alerts.push({soc:s,type:"danger",icon:"📉",title:`${s.nom}: CA en chute`,desc:`${fmt(ca)}€ vs ${fmt(caPrev)}€ (-${Math.abs(Math.round((ca-caPrev)/caPrev*100))}%)`,priority:1});
  if(caPrev>0&&caPP>0&&ca<caPrev&&caPrev<caPP)alerts.push({soc:s,type:"warning",icon:"⚠️",title:`${s.nom}: tendance baissière`,desc:"2 mois consécutifs de baisse du CA",priority:2});
  if(rw&&rw.months<3&&rw.months>0)alerts.push({soc:s,type:"danger",icon:"🔥",title:`${s.nom}: runway critique`,desc:`${rw.months} mois restants (${fmt(rw.treso)}€)`,priority:1});
  if(ca>0&&ch>ca)alerts.push({soc:s,type:"danger",icon:"💸",title:`${s.nom}: marge négative`,desc:`Charges (${fmt(ch)}€) > CA (${fmt(ca)}€)`,priority:1});
  if(!r)alerts.push({soc:s,type:"warning",icon:"📋",title:`${s.nom}: rapport manquant`,desc:`Aucun rapport soumis pour ${ml(cM2)}`,priority:3});
  if(ca>0&&s.obj>0&&ca>=s.obj*1.2)alerts.push({soc:s,type:"success",icon:"🎯",title:`${s.nom}: objectif écrasé !`,desc:`${fmt(ca)}€ vs obj ${fmt(s.obj)}€ (+${Math.round((ca/s.obj-1)*100)}%)`,priority:4});
  if(caPrev>0&&ca>=caPrev*2)alerts.push({soc:s,type:"success",icon:"🚀",title:`${s.nom}: CA doublé !`,desc:`${fmt(ca)}€ vs ${fmt(caPrev)}€ le mois dernier`,priority:4});
  const lastPulse=Object.entries(pulses).filter(([k])=>k.startsWith(s.id+"_")).pop();
  if(!lastPulse||!lastPulse[1]?.at||(Date.now()-new Date(lastPulse[1].at).getTime())>14*864e5)alerts.push({soc:s,type:"info",icon:"📡",title:`${s.nom}: silence radio`,desc:"Pas de pulse depuis 2+ semaines",priority:3});
  const sb=socBank?.[s.id];
  if(sb&&sb.balance<1000)alerts.push({soc:s,type:"danger",icon:"🏦",title:`${s.nom}: solde bancaire bas`,desc:`Seulement ${fmt(sb.balance)}€ en banque`,priority:1});
  // payment_received
  if(sb?.transactions){const recent=sb.transactions.filter(tx=>{const leg=tx.legs?.[0];return leg&&leg.amount>500&&(Date.now()-new Date(tx.created_at).getTime())<48*36e5;});recent.slice(0,1).forEach(tx=>{alerts.push({soc:s,type:"success",icon:"💵",title:`${s.nom}: paiement reçu`,desc:`+${fmt(tx.legs[0].amount)}€ — ${tx.legs[0].description||tx.reference||""}`,priority:4,alertType:"payment_received"});});}
  // lead_hot
  const gd=ghlData||{};const opps2=(gd[s.id]?.opportunities||[]).filter(o=>o.status==="open"&&o.value>=1000);
  if(opps2.length>0)alerts.push({soc:s,type:"info",icon:"🔥",title:`${s.nom}: ${opps2.length} lead${opps2.length>1?"s":""} chaud${opps2.length>1?"s":""}`,desc:`Valeur pipeline: ${fmt(opps2.reduce((a2,o)=>a2+o.value,0))}€`,priority:2,alertType:"lead_hot"});
  // client_silent
  const cls4=(gd[s.id]?.ghlClients||[]);const convos4=(gd[s.id]?.conversations||[]);
  const silentDays=14;cls4.filter(c2=>{const lastConvo=convos4.find(cv=>(cv.contactId||cv.contact?.id)===c2.ghlId);return lastConvo&&(Date.now()-new Date(lastConvo.lastMessageDate||0).getTime())>silentDays*864e5;}).slice(0,1).forEach(c2=>{alerts.push({soc:s,type:"warning",icon:"🤫",title:`${s.nom}: client silencieux`,desc:`${c2.name||"Contact"} sans échange depuis ${silentDays}j+`,priority:3,alertType:"client_silent"});});
  // goal_reached
  if(ca>0&&s.obj>0&&ca>=s.obj)alerts.push({soc:s,type:"success",icon:"🎯",title:`${s.nom}: objectif atteint !`,desc:`${fmt(ca)}€ / ${fmt(s.obj)}€ objectif`,priority:4,alertType:"goal_reached"});
 });
 return alerts.sort((a,b)=>a.priority-b.priority);
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
   <div className="rg2k" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:10}}>
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
